import { useState, useRef, useEffect } from "react";
import ModelSelectorButton from "@components/molecules/ModelSelectorButton";
import ModelSelectorPanel from "@components/molecules/ModelSelectorPanel";

type ModelSelectorProps = {
    selectedModel: string;
    onSelectModel: (model: string) => void;
};

const models = [
    { key: "rumina-m1", label: "M1", description: "視覚入力も対応した標準モデル" },
    { key: "rumina-m2", label: "M2", description: "翻訳精度が高くなったモデル" },
    { key: "rumina-m1-pro", label: "M1-Pro", description: "より精度の高いモデル" },
];

export const ModelSelector = ({ selectedModel, onSelectModel }: ModelSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggleDropdown = () => {
        setIsOpen((prev) => !prev);
    };

    const handleSelect = (modelKey: string) => {
        onSelectModel(modelKey);
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
