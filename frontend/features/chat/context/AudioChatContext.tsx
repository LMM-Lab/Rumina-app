"use client";

import React, {
    createContext,
    useContext,
    ReactNode,
    useEffect,
} from "react";
import { useAudio } from "../hooks/useAudio";

interface AudioChatContextProps {
    isRecording: boolean;
    toggleRecording: () => void;
    transcriptions: string[];
}

const AudioChatContext = createContext<AudioChatContextProps | undefined>(
    undefined
);

export const AudioChatProvider = ({ children }: { children: ReactNode }) => {
    const { isRecording, toggleRecording, transcriptions } = useAudio();

    return (
        <AudioChatContext.Provider
            value={{ isRecording, toggleRecording, transcriptions }}
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
