import { useEffect, useRef, useState, useCallback } from "react";

export type ChatMessage = {
    id: number;
    text: string;
    isUser: boolean;
    silent?: boolean;
    prompt?: string;
};

export const useAudioOnly = () => {
    const instanceId = useRef(Math.random());
    const [isRecording, setIsRecording] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const [transcriptions, setTranscriptions] = useState<ChatMessage[]>([]);
    const socketRef = useRef<WebSocket | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);

    useEffect(() => {
        if (!navigator.mediaDevices?.getUserMedia) {
            alert("このブラウザはマイク録音をサポートしていません。");
        }
    }, []);

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
        setIsRecording(false);
    }, []);

    useEffect(() => {
        return () => {
            console.log("🧹 AudioOnlyがアンマウントされたので録音停止");
            stopRecording();
        };
    }, [stopRecording]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const audioContext = new AudioContext({ sampleRate: 16000 });
            audioContextRef.current = audioContext;

            const socket = new WebSocket("ws://localhost:8000/ws/audio");
            socket.binaryType = "arraybuffer";
            socketRef.current = socket;

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const { type, message, audio_base64 } = data;

                    console.log(`[受信] type: ${type}, message: ${message}`);

                    setTranscriptions((prev) => {
                        const newMessage: ChatMessage = {
                            text: message,
                            isUser: type === "transcription",
                        };
                        return [...prev, newMessage];
                    });

                    if (audio_base64) {
                        const audioBlob = new Blob(
                            [Uint8Array.from(atob(audio_base64), (c) => c.charCodeAt(0))],
                            { type: "audio/wav" }
                        );
                        const audioUrl = URL.createObjectURL(audioBlob);
                        const audio = new Audio(audioUrl);
                        audio.play().catch((err) => {
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
                        socket.send(event.data.buffer);
                    }
                }
            };

            socket.onopen = () => {
                setIsRecording(true);
            };

            socket.onerror = (e) => {
                console.error("WebSocket error:", e);
            };
        } catch (error) {
            console.error("録音の開始に失敗しました:", error);
        }
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
