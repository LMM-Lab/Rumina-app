import { useImageServerVad } from "./useImageServerVad";


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

export const useImage = (mode: UseImageMode = "server-vad"): UseImageHook => {
    if (mode === "server-vad") {
        return useImageServerVad();
    }
    return useImageServerVad(); //TODO:後で処理を変える
};
