import { useEffect, useRef, useState, useCallback } from "react";

export const useAudio = () => {
    const instanceId = useRef(Math.random());
    console.log("useAudio instance ID:", instanceId.current);
    const [isRecording, setIsRecording] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const [transcriptions, setTranscriptions] = useState<string[]>([]);
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
            console.log("🧹 AudioProviderがアンマウントされたので録音停止");
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
                const transcription = event.data;
                console.log("受信した文字起こし結果:", transcription);
                // アップデーター関数内で更新前後の配列をログ出力する
                setTranscriptions((prev) => {
                    console.log("更新前の transcriptions:", prev);
                    const newTranscriptions = [...prev, transcription];
                    console.log("更新後の transcriptions:", newTranscriptions);
                    return newTranscriptions;
                });
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
