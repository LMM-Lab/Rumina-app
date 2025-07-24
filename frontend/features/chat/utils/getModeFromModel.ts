export type UseMode = "audio" | "image";
export type vadMode = "client-vad" | "server-vad";

export const getModeFromModel = (modelKey: string): {
    Mode: UseMode;
    vadMode?: vadMode;
    modelKey: string;
} => {
    switch (modelKey) {
        case "rumina-m1":
            return { Mode: "image", vadMode: "client-vad", modelKey };
        case "rumina-m1-pro":
            return { Mode: "image", vadMode: "client-vad", modelKey };
        case "rumina-m1-promax":
            return { Mode: "image", vadMode: "client-vad", modelKey };
        case "rumina-m2":
            return { Mode: "image", vadMode: "client-vad", modelKey };
        case "rumina-m1-server":
            return { Mode: "image", vadMode: "server-vad", modelKey };
        case "rumina-c1-server":
            return { Mode: "audio", modelKey };
        default:
            console.warn(`Unknown modelKey: ${modelKey}, fallback to image/client-vad`);
            return { Mode: "image", vadMode: "client-vad", modelKey };
    }
};
