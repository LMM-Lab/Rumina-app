import { useState, useRef, useEffect } from "react";
import ModelSelectorButton from "@components/molecules/ModelSelectorButton";
import ModelSelectorPanel from "@components/molecules/ModelSelectorPanel";
import { useAudioChat } from "@features/chat/context/AudioChatContext";

type ModelSelectorProps = {
    selectedModel: string;
    onSelectModel: (model: string) => void;
};

const models = [
    { key: "rumina-m1", label: "M1", description: "視覚入力も対応した標準モデル" },
    { key: "rumina-m1-pro", label: "M1-Pro", description: "音声認識が高精度かつ高速" },
    { key: "rumina-m1-promax", label: "M1-ProMax", description: "品質が高い応答性能を持つモデル", badge: "preview" },
    { key: "rumina-m2", label: "M2", description: "最新の高精度モデル", badge: "beta" },
    { key: "rumina-m1-server", label: "m1-server", description: "視覚入力も対応した初期モデル" },
    { key: "rumina-c1-server", label: "c1-server", description: "軽量かつ高速な言語入力のみモデル" },
];

export const ModelSelector = ({ selectedModel, onSelectModel }: ModelSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { isRecording, toggleRecording, setSelectedModel } = useAudioChat();

    const toggleDropdown = () => {
        setIsOpen((prev) => !prev);
    };

    const handleModelChange = (newModel: string) => {
        if (isRecording) toggleRecording();      // 必ず現行フックを停止
        setSelectedModel(newModel);              // ← Context の setter を直に呼ぶ
    };

    const handleSelect = (modelKey: string) => {
        handleModelChange(modelKey);
        setIsOpen(false);
    };

    const selectedLabel = models.find((m) => m.key === selectedModel)?.label || selectedModel;

    // ★ 外クリック検出
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        // クリーンアップ
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <ModelSelectorButton
                selectedModelLabel={selectedLabel}
                onClick={toggleDropdown}
                isOpen={isOpen}
            />

            {isOpen && (
                <ModelSelectorPanel
                    models={models}
                    selectedModel={selectedModel}
                    onSelect={handleSelect}
                />
            )}
        </div>
    );
};

export default ModelSelector;
