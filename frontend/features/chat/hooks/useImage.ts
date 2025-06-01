import { useImageServerVad } from "./useImageServerVad";
import { useImageClientVad } from "./useImageClientVad";


export type ChatMessage = {
    text: string;
    isUser: boolean;
};

export type UseImageMode = "client-vad" | "server-vad";
export type UseImageHook = {
    instanceId: number;
    isRecording: boolean;
    toggleRecording: () => void;
    transcriptions: ChatMessage[];
};

export const useImage = (mode: UseImageMode = "client-vad"): UseImageHook => {
    if (mode === "server-vad") {
        return useImageServerVad();
    }
    return useImageClientVad();
};
