export type UseMode = "audio" | "image";
export type vadMode = "client-vad" | "server-vad";

export const getModeFromModel = (modelKey: string): {
    Mode: UseMode;
    vadMode?: vadMode;
} => {
    switch (modelKey) {
        case "rumina-m1":
            return { Mode: "image", vadMode: "client-vad" };
        case "rumina-m1-server":
            return { Mode: "image", vadMode: "server-vad" };
        case "rumina-c1-server":
            return { Mode: "audio" };
        default:
            console.warn(`Unknown modelKey: ${modelKey}, fallback to image/client-vad`);
            return { Mode: "image", vadMode: "client-vad" };
    }
};
