'use client'

import Box from "@components/styles/Box";
import { FaCheck } from "react-icons/fa";
import type { IconType } from "react-icons";
import Button from "@components/atoms/Button";
import Tooltip from "@components/atoms/Tooltip";

const FaCheckIcon: IconType = FaCheck;

export type ModelBadge = "beta" | "new" | "deprecated" | "preview";

type ModelSelectorPanelProps = {
    models: { key: string; label: string; description: string; badge?: ModelBadge; }[];
    selectedModel: string;
    onSelect: (modelKey: string) => void;
};

const badgeStyle: Record<ModelBadge, { bg: string; text: string }> = {
    beta: { bg: "#D3E3FD", text: "#4285F4" }, // 青 + 白文字
    new: { bg: "#16A34A", text: "#FFFFFF" }, // 緑 + 白文字
    deprecated: { bg: "#9CA3AF", text: "#FFFFFF" }, // グレー + 白文字
    preview: { bg: "#FFE8C4", text: "#B7701D" }, // 薄オレンジ + ダーク文字
    // ↑ 適当に付けた色なのでこの数値を好きに変えて OK
};

export const ModelBadge = ({ type }: { type: ModelBadge }) => {
    const { bg, text } = badgeStyle[type];

    return (
        <span
            style={{
                display: "inline-block",
                padding: "2px 8px",
                fontSize: "13px",
                fontWeight: 600,
                lineHeight: 1,
                color: text,
                backgroundColor: bg,
                borderRadius: 9999,
            }}
        >
            {type.charAt(0).toUpperCase() + type.slice(1)}
        </span>
    );
};

export const ModelSelectorPanel = ({ models, selectedModel, onSelect }: ModelSelectorPanelProps) => {
    return (
        <Box
            $position="absolute"
            $marginTop="8px"
            $width="260px"
            $backgroundColor="#fff"
            $border="1px solid #ddd"
            $borderRadius="10px"
            $boxShadow="0 4px 8px rgba(0, 0, 0, 0.1)"
            $zIndex="999"
            $padding="8px 0"
        >
            <div style={{
                display: "flex",
                alignItems: "center",
                fontSize: "13px",
                color: "#888",
                marginTop: "4px",
                marginLeft: "12px",
                marginBottom: "8px",
            }}>
                <span style={{ marginRight: "8px", color: "#888" }}>モデル</span>
                <Tooltip text="モデルの詳細ページに移動します" position="right">
                    <a
                        href="/model-info"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            border: "1px solid #888",
                            fontSize: "11px",
                            color: "#888",
                            textDecoration: "none",
                            marginBottom: "2px",
                            cursor: "pointer", // ← 追加するとより自然
                        }}
                    >
                        i
                    </a>
                </Tooltip>
            </div>
            {
                models.map((model) => (

                    <Box
                        key={model.key}
                        as="button"
                        onClick={() => onSelect(model.key)}
                        $width="100%"
                        $textAlign="left"
                        $display="flex"
                        $justifyContent="space-between"
                        $alignItems="center"
                        $padding="10px 16px"
                        $backgroundColor="transparent"
                        $hover_backgroundColor="#f5f5f5"
                        style={{
                            cursor: "pointer",
                            border: "none",
                            outline: "none",
                            fontSize: "16px",
                        }}
                    >
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            {/* タイトル行（M2 と Beta を横並び） */}
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "16px" }}>{model.label}</span>
                                {model.badge && <ModelBadge type={model.badge} />}
                            </div>

                            {/* 説明文 */}
                            <span style={{ fontSize: "13px", color: "#888", marginTop: "2px" }}>
                                {model.description}
                            </span>
                        </div>

                        {/* デバッグ表示
                    <div style={{ color: "red", fontSize: "14px" }}>
                        DEBUG: {selectedModel} === {model.key} → {selectedModel === model.key ? "YES" : "NO"}
                    </div> */}

                        {selectedModel === model.key && (
                            // ここはまずテスト的に "✔︎" にして確認
                            <span style={{ color: "#333", fontSize: "14px" }}>◉</span>
                        )}


                    </Box>
                ))
            }
        </Box >
    );
};

export default ModelSelectorPanel;
