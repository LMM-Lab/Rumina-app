'use client'
import styled from "styled-components";
import { useState, useEffect } from "react";

type IconToggleProps = {
    onIcon: string;  // オンのときのアイコン
    offIcon: string; // オフのときのアイコン
    backgroundColor?: string;
    initialState?: boolean;
    isOn?: boolean;  // ★ 外部からの状態（追加！）
    onToggle?: (state: boolean) => void; // 状態変化のイベント
};

const ToggleWrapper = styled.button<{ $backgroundColor?: string }>`
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    overflow: hidden;
    background-color: ${({ $backgroundColor }) => $backgroundColor || "#FFFFFF"};

    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
`;

const IconToggle = ({ onIcon, offIcon, backgroundColor, initialState = false, isOn, onToggle }: IconToggleProps) => {
    const [internalState, setInternalState] = useState(initialState);

    // ★ 外部 isOn が変わったら同期する
    useEffect(() => {
        if (typeof isOn === "boolean") {
            setInternalState(isOn);
        }
    }, [isOn]);

    const handleClick = () => {
        const newState = !internalState;
        setInternalState(newState);
        if (onToggle) {
            onToggle(newState);
        }
    };

    return (
        <ToggleWrapper onClick={handleClick} $backgroundColor={backgroundColor}>
            <img src={internalState ? onIcon : offIcon} alt="toggle icon" />
        </ToggleWrapper>
    );
};

export default IconToggle;
