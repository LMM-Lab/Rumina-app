export type ModelBadge = "beta" | "new" | "deprecated" | "preview";

export type ModelOption = {
    key: string;
    label: string;
    description: string;
    badge?: ModelBadge;      // ← 追加
};
