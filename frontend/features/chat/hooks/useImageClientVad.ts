import { useEffect, useRef, useState } from "react";

export type ChatMessage = {
    text: string;
    isUser: boolean;
};

export const useImageClientVad = (
    modelKey: string = "rumina-m1",
    onStartSpeaking?: () => void,
    onStopSpeaking?: () => void
) => {
    const instanceId = useRef(Math.random());
    const [isRecording, setIsRecording] = useState(false);
    const [transcriptions, setTranscriptions] = useState<ChatMessage[]>([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [isVoiceActive, setIsVoiceActive] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const vadIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const speakingStartTimeRef = useRef<number | null>(null);
    const silenceStartTimeRef = useRef<number | null>(null);
    const isSpeakingRef = useRef(false);
    const speechFrameCountRef = useRef(0);

    // 🎁 改善版プリロール
    type TimestampedFrame = {
        frame: Float32Array;
        timestamp: number;
    };
    const preRollBufferRef = useRef<TimestampedFrame[]>([]);

    const frameDurationMs = 32;
    const desiredPreRollMs = 3000;
    const maxPreRollFrames = Math.ceil(desiredPreRollMs / frameDurationMs);

    const socketRef = useRef<WebSocket | null>(null);

    const setSpeakingState = (val: boolean) => {
        isSpeakingRef.current = val;
        setIsSpeaking(val);
        setIsVoiceActive(val);

        if (val && audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
    };

    const sendAudioFrameToServer = (pcmFrame: Float32Array, type: string = "active_audio_chunk") => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

        socketRef.current.send(JSON.stringify({ type }));

        const int16Frame = new Int16Array(pcmFrame.length);
        for (let i = 0; i < pcmFrame.length; i++) {
            int16Frame[i] = Math.max(-32768, Math.min(32767, pcmFrame[i] * 32767));
        }

        socketRef.current.send(int16Frame.buffer);
    };

    const stopRecording = () => {
        console.log("🎙️ stopRecording 開始 (ClientVAD)");

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
            mediaStreamRef.current = null;
        }

        if (vadIntervalRef.current) {
            clearInterval(vadIntervalRef.current);
            vadIntervalRef.current = null;
        }

        if (workletNodeRef.current) {
            workletNodeRef.current.disconnect();
            workletNodeRef.current = null;
        }

        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
            audioRef.current = null;
        }

        // ✅ preRollBufferRef は clientVAD の場合は必要！
        preRollBufferRef.current = [];

        setIsRecording(false);
        setIsSpeaking(false);
        setIsVoiceActive(false);

        console.log("🎙️ stopRecording 完了 (ClientVAD)");
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

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const audioContext = new AudioContext({ sampleRate: 16000 });
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
            analyserRef.current = analyser;
            const dataArray = new Uint8Array(analyser.fftSize);
            dataArrayRef.current = dataArray;

            source.connect(analyser);

            const socket = new WebSocket("ws://localhost:8000/ws/m/image");
            socket.binaryType = "arraybuffer";
            socketRef.current = socket;

            socket.onopen = () => {
                socket.send(JSON.stringify({
                    type: "init",
                    model: modelKey,
                    vad_silence_threshold: 1000,
                }));
                console.log("✅ WebSocket 接続 & init メッセージ送信");
            };

            socket.onmessage = async (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const { type, message, audio_base64 } = data;

                    console.log(`[受信] type: ${type}, message: ${message}`);

                    // === タイピング状態ハンドリング ===
                    if (type === "transcription") setIsThinking(true);
                    if (type === "ai_response") setIsThinking(false);

                    if (message) {
                        setTranscriptions((prev) => {
                            const newMessage: ChatMessage = {
                                text: (type === "assistant_final" ? "🔇 " : "") + message,
                                isUser: type === "transcription"
                            }
                            return [...prev, newMessage];
                        });
                    }

                    if (audio_base64) {
                        // ★ 先に鳴っている音声を停止
                        if (audioRef.current) {
                            audioRef.current.pause();
                            audioRef.current.src = "";
                        }
                        const blob = new Blob(
                            [Uint8Array.from(atob(audio_base64), c => c.charCodeAt(0))],
                            { type: "audio/wav" }
                        );
                        const url = URL.createObjectURL(blob);
                        const audio = new Audio(url);
                        audioRef.current = audio;          // ← 保持
                        await audio.play().catch(err => console.error("音声再生失敗:", err));
                    }
                } catch (e) {
                    console.error("WebSocketメッセージの解析に失敗:", e);
                }
            };

            await audioContext.audioWorklet.addModule('/worklet/pcm-processor.js');

            const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor');
            workletNodeRef.current = workletNode;

            workletNode.port.onmessage = (event) => {
                if (event.data?.type === 'audio') {
                    const pcmFrame = event.data.pcm as Float32Array;
                    const now = Date.now();

                    // 🎁 timestamp付きで保存
                    preRollBufferRef.current.push({ frame: pcmFrame, timestamp: now });
                    while (preRollBufferRef.current.length > maxPreRollFrames) {
                        preRollBufferRef.current.shift();
                    }

                    if (isSpeakingRef.current) {
                        sendAudioFrameToServer(pcmFrame, "active_audio_chunk");
                    }
                }
            };

            source.connect(workletNode);
            workletNode.connect(audioContext.destination);

            vadIntervalRef.current = setInterval(() => {
                if (!analyserRef.current || !dataArrayRef.current) return;
                analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
                const rms = Math.sqrt(
                    dataArrayRef.current.reduce((sum, val) => sum + (val - 128) ** 2, 0) / dataArrayRef.current.length
                );
                const threshold = 6;
                const now = Date.now();

                const speechFrameThreshold = 3;

                if (rms > threshold) {
                    speechFrameCountRef.current++;
                    if (!isSpeakingRef.current && speechFrameCountRef.current >= speechFrameThreshold) {
                        console.log("[VAD] 話し始めを確定");
                        setSpeakingState(true);
                        onStartSpeaking?.();
                        silenceStartTimeRef.current = null;

                        (async () => {
                            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                                try {
                                    const imageBase64 = await captureCurrentFrame();
                                    socketRef.current.send(JSON.stringify({
                                        type: "active_audio_start",
                                        image_base64: imageBase64,
                                    }));
                                    console.log("📷 初回フレーム送信完了");

                                    // 🎁 プリロール送信
                                    const cutoffTime = Date.now() - desiredPreRollMs;
                                    const framesToSend = preRollBufferRef.current.filter(f => f.timestamp >= cutoffTime);
                                    console.log(`📤 プリロール送信: ${framesToSend.length} frames`);

                                    for (const f of framesToSend) {
                                        sendAudioFrameToServer(f.frame, "active_audio_chunk");
                                    }
                                } catch (err) {
                                    console.error("初回フレームのキャプチャ送信失敗:", err);
                                }
                            }
                        })();
                    }
                    if (isSpeakingRef.current) silenceStartTimeRef.current = null;
                } else {
                    if (!isSpeakingRef.current) {
                        speechFrameCountRef.current = 0;
                    } else {
                        if (!silenceStartTimeRef.current) silenceStartTimeRef.current = now;
                        if (now - silenceStartTimeRef.current > 1000) {
                            console.log("[VAD] 話し終わりを確定");
                            setSpeakingState(false);
                            onStopSpeaking?.();


                            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                                socketRef.current.send(JSON.stringify({ type: "active_audio_end" }));
                            }

                            silenceStartTimeRef.current = null;
                        }
                    }
                }

            }, 100);

            setIsRecording(true);
        } catch (error) {
            console.error("録音の開始に失敗しました:", error);
        }
    };

    useEffect(() => {
        return () => {
            stopRecording();
        };
    }, []);

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
        isSpeaking,
        isThinking,
        isVoiceActive,
        toggleRecording,
        transcriptions,
    };
};
