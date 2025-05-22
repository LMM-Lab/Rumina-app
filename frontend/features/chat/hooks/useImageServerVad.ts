import { useEffect, useRef, useState, useCallback } from "react";

export type ChatMessage = {
    text: string;
    isUser: boolean;
};

export const useImageServerVad = () => {
    const instanceId = useRef(Math.random());
    const [isRecording, setIsRecording] = useState(false);
    const [transcriptions, setTranscriptions] = useState<ChatMessage[]>([]);

    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const imageCaptureIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const socketRef = useRef<WebSocket | null>(null);

    const stopRecording = useCallback(() => {
        if (workletNodeRef.current) {
            workletNodeRef.current.port.postMessage({ type: "stop" });
            workletNodeRef.current.disconnect();
        }
        if (audioContextRef.current) audioContextRef.current.close();
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        if (socketRef.current) socketRef.current.close();
        stopImageStreaming();
        setIsRecording(false);
    }, []);

    const stopImageStreaming = () => {
        if (imageCaptureIntervalRef.current) {
            clearInterval(imageCaptureIntervalRef.current);
            imageCaptureIntervalRef.current = null;
        }
    };

    useEffect(() => {
        return () => {
            stopRecording();
        };
    }, [stopRecording]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            mediaStreamRef.current = stream;

            const audioContext = new AudioContext({ sampleRate: 16000 });
            audioContextRef.current = audioContext;

            const socket = new WebSocket("ws://192.168.29.19:8000/ws/image");
            socket.binaryType = "arraybuffer";
            socketRef.current = socket;

            socket.onmessage = async (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const { type, message, audio_base64 } = data;

                    console.log(`[受信] type: ${type}, message: ${message}`);

                    if (message) {
                        setTranscriptions((prev) => {
                            const newMessage: ChatMessage = {
                                text: message,
                                isUser: type === "transcription",
                            };
                            return [...prev, newMessage];
                        });
                    }

                    if (audio_base64) {
                        const audioBlob = new Blob(
                            [Uint8Array.from(atob(audio_base64), (c) => c.charCodeAt(0))],
                            { type: "audio/wav" }
                        );
                        const audioUrl = URL.createObjectURL(audioBlob);
                        const audio = new Audio(audioUrl);
                        await audio.play().catch((err) => {
                            console.error("音声の再生に失敗しました:", err);
                        });
                    }
                } catch (e) {
                    console.error("WebSocketメッセージの解析に失敗:", e);
                }
            };

            await audioContext.audioWorklet.addModule("/worklet/processor.js");
            const workletNode = new AudioWorkletNode(audioContext, "audio-processor");
            workletNodeRef.current = workletNode;

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(workletNode);
            workletNode.connect(audioContext.destination);

            workletNode.port.onmessage = (event) => {
                if (event.data?.type === "audio") {
                    if (socket.readyState === WebSocket.OPEN) {
                        const hex = Array.from(new Uint8Array(event.data.buffer))
                            .map((b) => b.toString(16).padStart(2, "0"))
                            .join("");
                        socket.send(JSON.stringify({
                            type: "audio_chunk",
                            audio_hex: hex,
                        }));
                    }
                }
            };

            socket.onopen = () => {
                setIsRecording(true);
                startImageStreaming();
            };

            socket.onerror = (e) => {
                console.error("WebSocket error:", e);
            };
        } catch (error) {
            console.error("録音の開始に失敗しました:", error);
        }
    };

    const startImageStreaming = () => {
        imageCaptureIntervalRef.current = setInterval(async () => {
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                try {
                    const imageBase64 = await captureCurrentFrame();
                    socketRef.current.send(JSON.stringify({
                        type: "image",
                        image_base64: imageBase64,
                    }));
                } catch (err) {
                    console.error("画像のキャプチャと送信に失敗しました:", err);
                }
            }
        }, 1000); //33FPS
    };

    const captureCurrentFrame = async (): Promise<string> => {
        const video = document.querySelector("video") as HTMLVideoElement;
        if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
            throw new Error("カメラ映像が使用できません");
        }
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvasが初期化できませんでした");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/png");
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return {
        instanceId: instanceId.current,
        isRecording,
        toggleRecording,
        transcriptions,
    };
};
