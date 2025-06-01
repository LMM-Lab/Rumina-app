'use client'
import { useState } from "react";
import Button from "@components/atoms/Button";
import { FiChevronDown } from "react-icons/fi";

type ModelSelectorButtonProps = {
    selectedModelLabel: string;
    onClick: () => void;
    isOpen: boolean;
};

export const ModelSelectorButton = ({ selectedModelLabel, onClick, isOpen }: ModelSelectorButtonProps) => {
    return (
        <Button
            $variants="Primary"
            $width="auto"
            $height="40px"
            $borderRadius="5px"
            $backColor="#fff"
            $color="#000"
            $hover_color="#F9F9F9"
            $padding="10px 20px"
            $fontSize="20px"
            $margin="0 0 10px 0"
            $display="block"
            $isactive={isOpen}
            type="button"
            onClick={onClick}
        >
            <span style={{ marginRight: "8px" }}>
                Rumina {selectedModelLabel}
            </span>
            <FiChevronDown size={18} />
        </Button>
    );
};

export default ModelSelectorButton
