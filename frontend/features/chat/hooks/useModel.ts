import { useAudioOnly } from "./useAudioOnly";
import { useImageClientVad } from "./useImageClientVad";
import { useImageServerVad } from "./useImageServerVad";

export type ChatMessage = {
    text: string;
    isUser: boolean;
};

export type UseModelMode = "audio" | "image";
export type vadMode = "client-vad" | "server-vad";

export type UseModelHook = {
    instanceId: number;
    isRecording: boolean;
    toggleRecording: () => void;
    transcriptions: ChatMessage[];
};

export const useModel = (
    modelMode: UseModelMode = "image",
    vadMode: vadMode = "client-vad"
): UseModelHook => {
    if (modelMode === "image") {
        if (vadMode === "server-vad") {
            return useImageServerVad();
        } else {
            return useImageClientVad();
        }
    } else {
        return useAudioOnly();
    }
};
