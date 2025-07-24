import { useAudioOnly } from "./useAudioOnly";
import { useImageClientVad } from "./useImageClientVad";
import { useImageServerVad } from "./useImageServerVad";
import { useImageClientVadStream } from "./useImageClientVadStream";

export type ChatMessage = {
    id: number;
    text: string;
    isUser: boolean;
    silent?: boolean;
    prompt?: string;
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
    vadMode: vadMode = "client-vad",
    modelKey: string = "rumina-m1"
): UseModelHook => {
    console.debug("[useModel] modelKey =", modelKey,
        "| mode =", modelMode, "| vad =", vadMode);
    if (modelMode === "image") {
        if (vadMode === "server-vad") {
            return useImageServerVad();
        } else {
            if (modelKey.includes("rumina-m2")) {
                return useImageClientVadStream(modelKey);
            } else {
                return useImageClientVad(modelKey);
            }
        }
    } else {
        return useAudioOnly();
    }
};
