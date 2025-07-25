"use client";
import React, { createContext, useContext, ReactNode, useState, useMemo, useEffect } from "react";

import { getModeFromModel } from "../utils/getModeFromModel";
import { useAudioOnly } from "../hooks/useAudioOnly";
import { useImageClientVad } from "../hooks/useImageClientVad";
import { useImageServerVad } from "../hooks/useImageServerVad";
import { useImageClientVadStream } from "../hooks/useImageClientVadStream";
import { ChatMessage } from "../hooks/useModel";
import { useRef } from "react";

interface AudioChatContextProps {
    selectedModel: string;
    setSelectedModel: (model: string) => void;
    isRecording: boolean;
    isThinking: boolean;
    isSpeaking: boolean;
    isVoiceActive: boolean;
    toggleRecording: () => void;
    transcriptions: ChatMessage[];
}

const AudioChatContext = createContext<AudioChatContextProps | undefined>(undefined);

export const AudioChatProvider = ({ children }: { children: ReactNode }) => {
    const [selectedModel, setSelectedModel] = useState<string>("rumina-m1");

    const { Mode, vadMode, modelKey } = useMemo(() => getModeFromModel(selectedModel), [selectedModel]);

    const audioHook = useAudioOnly();
    const imageClientSyncHook = useImageClientVad(modelKey);
    const imageClientStreamHook = useImageClientVadStream(modelKey);
    const imageServerHook = useImageServerVad();

    // 🔥 ① 前回の hookToUse を useRef に保持する
    const previousHookRef = useRef<{
        isRecording: boolean;
        toggleRecording: () => void;
    } | null>(null);

    // 🔥 ② 今回の hook を決定
    let hookToUse;
    if (Mode === "audio") {
        hookToUse = audioHook;
    } else {
        hookToUse = modelKey.includes("rumina-m2") ? imageClientStreamHook : imageClientSyncHook;
    }

    const { isRecording, toggleRecording, transcriptions, isThinking, isVoiceActive } = hookToUse;

    const modeKey = `${Mode}-${vadMode}`;

    console.debug("[AudioChatProvider] selectedModel =", selectedModel,
        "| Mode =", Mode, "| vadMode =", vadMode,
        "| modelKey =", modelKey);

    // 🔥 ③ モードが変わったときに「前回 hook を停止」する useEffect
    useEffect(() => {
        if (previousHookRef.current?.isRecording) {
            console.log("🛑 モデル切替 → 前の hook 停止します");
            previousHookRef.current.toggleRecording();
        }
        previousHookRef.current = hookToUse;
    }, [modeKey]);

    return (
        <AudioChatContext.Provider
            value={{
                selectedModel,
                setSelectedModel,
                isRecording,
                isThinking,
                isVoiceActive,
                toggleRecording,
                transcriptions,
            }}
        >
            {children}
        </AudioChatContext.Provider>
    );
};

export const useAudioChat = () => {
    const context = useContext(AudioChatContext);
    if (!context) {
        throw new Error("useAudioChat must be used within an AudioChatProvider");
    }
    return context;
};
