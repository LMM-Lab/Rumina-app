'use client'
import styled from "styled-components";
import { useState } from "react";

type IconToggleProps = {
    onIcon: string;  // オンのときのアイコン
    offIcon: string; // オフのときのアイコン
    backgroundColor?: string;
    initialState?: boolean;
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

const IconToggle = ({ onIcon, offIcon, backgroundColor, initialState = false, onToggle }: IconToggleProps) => {
    const [isOn, setIsOn] = useState(initialState);

    const handleClick = () => {
        const newState = !isOn;
        setIsOn(newState);
        if (onToggle) {
            onToggle(newState);
        }
    };

    return (
        <ToggleWrapper onClick={handleClick} $backgroundColor={backgroundColor}>
            <img src={isOn ? onIcon : offIcon} alt="toggle icon" />
        </ToggleWrapper>
    );
};

export default IconToggle;
