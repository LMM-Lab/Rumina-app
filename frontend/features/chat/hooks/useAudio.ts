import { useAudioOnly } from "./useAudioOnly";
import { useImage } from "./useImage";
// import { useImageChat } from "./useImageChat"; // 後ほど作成

export type ChatMessage = {
    text: string;
    isUser: boolean;
};

export type UseAudioMode = "audio" | "image";
export type UseAudioHook = {
    instanceId: number;
    isRecording: boolean;
    toggleRecording: () => void;
    transcriptions: ChatMessage[];
};


// 音声のみのモードとマルチモーダルモードを現状は手動で切り替え
export const useAudio = (mode: UseAudioMode = "image"): UseAudioHook => {
    if (mode === "image") {
        return useImage();
    }
    return useAudioOnly();
};
