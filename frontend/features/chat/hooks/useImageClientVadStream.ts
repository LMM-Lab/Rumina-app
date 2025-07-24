import { useEffect, useRef, useState } from "react";

/* --------------------------------------------------------------------------
   型定義
---------------------------------------------------------------------------*/
export type ChatMessage = {
    id: number;
    text: string;
    isUser: boolean;
    /** 音声なしでサイレント表示したい場合 */
    silent?: boolean;
    /** prompt テキスト（assistant_final 用） */
    prompt?: string;
};

/* --------------------------------------------------------------------------
   ストリーム用フック
   - backend: /ws/m/image-stream (assistant_chunk / assistant_audio_chunk)
   - 再生: Web Audio API FIFO
---------------------------------------------------------------------------*/
export const useImageClientVadStream = (
    modelKey: string = "rumina-m2",
    onStartSpeaking?: () => void,
    onStopSpeaking?: () => void,
) => {
    /* ------------------------------ UI States ------------------------------ */
    const instanceId = useRef(Math.random());
    const [isRecording, setIsRecording] = useState(false);
    const [transcriptions, setTranscriptions] = useState<ChatMessage[]>([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [isVoiceActive, setIsVoiceActive] = useState(false);

    /* ------------------------------ Refs ------------------------------ */
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const vadIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);

    /** ストリーム音声再生用 */
    const playerCtxRef = useRef<AudioContext | null>(null);
    const playingRef = useRef(false);
    const audioQueueRef = useRef<{ seq: number; data: ArrayBuffer }[]>([]);
    const lastPlayedSeqRef = useRef(-1);

    const speakingStartTimeRef = useRef<number | null>(null);
    const silenceStartTimeRef = useRef<number | null>(null);
    const isSpeakingInternal = useRef(false);
    const speechFrameCountRef = useRef(0);

    /* ------------------------------ VADプリロール ------------------------------ */
    type TimestampedFrame = { frame: Float32Array; timestamp: number };
    const preRollBufferRef = useRef<TimestampedFrame[]>([]);
    const frameDurationMs = 32;
    const desiredPreRollMs = 3000;
    const maxPreRollFrames = Math.ceil(desiredPreRollMs / frameDurationMs);

    /* ------------------------------ WS ------------------------------ */
    const socketRef = useRef<WebSocket | null>(null);

    /* ------------------------------ Helpers ------------------------------ */
    const setSpeakingState = (val: boolean) => {
        isSpeakingInternal.current = val;
        setIsSpeaking(val);
        setIsVoiceActive(val);
    };

    const sendAudioFrameToServer = (
        pcmFrame: Float32Array,
        type: string = "active_audio_chunk",
    ) => {
        const ws = socketRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;

        ws.send(JSON.stringify({ type }));

        const int16Frame = new Int16Array(pcmFrame.length);
        for (let i = 0; i < pcmFrame.length; i++) {
            int16Frame[i] = Math.max(-32768, Math.min(32767, pcmFrame[i] * 32767));
        }
        ws.send(int16Frame.buffer);
    };

    /* ------------------------------ Audio FIFO 再生 ------------------------------ */
    const ensurePlayerContext = () => {
        if (!playerCtxRef.current) playerCtxRef.current = new AudioContext();
        return playerCtxRef.current;
    };

    const playNext = async () => {
        if (playingRef.current) return;
        const ctx = ensurePlayerContext();
        const next = audioQueueRef.current[0];
        if (!next) return;

        playingRef.current = true;
        const { seq, data } = next;

        try {
            const buf = await ctx.decodeAudioData(data.slice(0));
            const src = ctx.createBufferSource();
            src.buffer = buf;
            src.connect(ctx.destination);
            src.onended = () => {
                audioQueueRef.current.shift();
                lastPlayedSeqRef.current = seq;
                playingRef.current = false;
                playNext();
            };
            src.start();
        } catch (e) {
            console.error("Audio decode/play error", e);
            audioQueueRef.current.shift();
            playingRef.current = false;
            playNext();
        }
    };

    /* ------------------------------ Capture current video frame ------------------------------ */
    const captureCurrentFrame = async (): Promise<string> => {
        const video = document.querySelector("video") as HTMLVideoElement;
        if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
            throw new Error("カメラ映像が使用できません");
        }
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas init failed");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/png");
    };

    /* ------------------------------ stopRecording ------------------------------ */
    const stopRecording = () => {
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((t) => t.stop());
            mediaStreamRef.current = null;
        }
        if (vadIntervalRef.current) clearInterval(vadIntervalRef.current);
        if (workletNodeRef.current) workletNodeRef.current.disconnect();
        if (socketRef.current) socketRef.current.close();

        audioQueueRef.current = [];
        playingRef.current = false;
        if (playerCtxRef.current) {
            playerCtxRef.current.close();
            playerCtxRef.current = null;
        }

        preRollBufferRef.current = [];
        setIsRecording(false);
        setIsVoiceActive(false);
        setIsSpeaking(false);
    };

    /* ------------------------------ startRecording ------------------------------ */
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const audioContext = new AudioContext({ sampleRate: 16000 });
            audioContextRef.current = audioContext;
            const source = audioContext.createMediaStreamSource(stream);

            /* Analyser for RMS */
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
            analyserRef.current = analyser;
            const dataArray = new Uint8Array(analyser.fftSize);
            dataArrayRef.current = dataArray;
            source.connect(analyser);

            /* WebSocket (stream endpoint) */
            const ws = new WebSocket("ws://localhost:8000/ws/m/image-stream");
            ws.binaryType = "arraybuffer";
            socketRef.current = ws;

            ws.onopen = () => {
                ws.send(
                    JSON.stringify({ type: "init", model: modelKey, vad_silence_threshold: 1000 }),
                );
                console.log("WS opened (stream)");
            };

            ws.onmessage = async (ev) => {
                try {
                    if (typeof ev.data === "string") {
                        const msg = JSON.parse(ev.data);
                        console.log("[WS]", msg);
                        const { type, message, seq, audio_base64, prompt, id: _id } = msg;
                        const id = _id ?? Date.now();

                        switch (type) {
                            case "transcription": {
                                console.log("[USER]", message);
                                setTranscriptions((p) => [...p, { id, text: message, isUser: true }]);
                                setIsThinking(true);
                                break;
                            }
                            case "assistant_chunk": {
                                console.log("[USER]", message);
                                setTranscriptions((p) => [...p, { id: seq, text: message, isUser: false }]);
                                break;
                            }
                            case "assistant_audio_chunk": {
                                if (audio_base64) {
                                    console.log("[USER]", message);
                                    const binary = Uint8Array.from(atob(audio_base64), (c) => c.charCodeAt(0));
                                    audioQueueRef.current.push({ seq, data: binary.buffer });
                                    // sort by seq to avoid out-of-order race
                                    audioQueueRef.current.sort((a, b) => a.seq - b.seq);
                                    playNext();
                                }
                                break;
                            }
                            case "assistant_done": {
                                setIsThinking(false);
                                break;
                            }
                            case "assistant_final": {
                                // fallback: final text without audio
                                setTranscriptions((p) => [...p, { id, text: message, isUser: false, silent: true, prompt }]);
                                setIsThinking(false);
                                break;
                            }
                        }
                    }
                } catch (e) {
                    console.error("onmessage parse error", e);
                }
            };

            /* Worklet for raw PCM */
            await audioContext.audioWorklet.addModule("/worklet/pcm-processor.js");
            const worklet = new AudioWorkletNode(audioContext, "pcm-processor");
            workletNodeRef.current = worklet;
            worklet.port.onmessage = (e) => {
                if (e.data?.type === "audio") {
                    const pcm = e.data.pcm as Float32Array;
                    const now = Date.now();
                    preRollBufferRef.current.push({ frame: pcm, timestamp: now });
                    while (preRollBufferRef.current.length > maxPreRollFrames) preRollBufferRef.current.shift();
                    if (isSpeakingInternal.current) sendAudioFrameToServer(pcm);
                }
            };
            source.connect(worklet);

            /* VAD loop */
            vadIntervalRef.current = setInterval(() => {
                if (!analyserRef.current || !dataArrayRef.current) return;
                analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
                const rms = Math.sqrt(
                    dataArrayRef.current.reduce((s, v) => s + (v - 128) ** 2, 0) / dataArrayRef.current.length,
                );
                const threshold = 6;
                const now = Date.now();
                const speechFrameThreshold = 3;

                if (rms > threshold) {
                    speechFrameCountRef.current++;
                    if (!isSpeakingInternal.current && speechFrameCountRef.current >= speechFrameThreshold) {
                        /* speech start */
                        setSpeakingState(true);
                        onStartSpeaking?.();
                        silenceStartTimeRef.current = null;

                        (async () => {
                            if (ws.readyState === WebSocket.OPEN) {
                                try {
                                    const imgB64 = await captureCurrentFrame();
                                    ws.send(JSON.stringify({ type: "active_audio_start", image_base64: imgB64 }));
                                    /* send pre-roll */
                                    const cutoff = Date.now() - desiredPreRollMs;
                                    const frames = preRollBufferRef.current.filter((f) => f.timestamp >= cutoff);
                                    for (const f of frames) sendAudioFrameToServer(f.frame);
                                } catch (e) {
                                    console.error("capture fail", e);
                                }
                            }
                        })();
                    }
                    if (isSpeakingInternal.current) silenceStartTimeRef.current = null;
                } else {
                    if (!isSpeakingInternal.current) speechFrameCountRef.current = 0;
                    else {
                        if (!silenceStartTimeRef.current) silenceStartTimeRef.current = now;
                        if (now - (silenceStartTimeRef.current ?? 0) > 1000) {
                            /* speech end */
                            setSpeakingState(false);
                            onStopSpeaking?.();
                            ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ type: "active_audio_end" }));
                            silenceStartTimeRef.current = null;
                        }
                    }
                }
            }, 100);

            setIsRecording(true);
        } catch (e) {
            console.error("startRecording error", e);
        }
    };

    /* ------------------------------ lifecycle ------------------------------ */
    useEffect(() => () => stopRecording(), []);

    const toggleRecording = () => (isRecording ? stopRecording() : startRecording());

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
