"use client";
import styled from "styled-components";

type TooltipProps = {
    text: string;
    position?: "top" | "bottom" | "left" | "right" | "bottom-right";
    children: React.ReactNode;
};

const TooltipContainer = styled.div`
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
`;

const TooltipText = styled.span<{ $position: string }>`
    position: absolute;
    white-space: nowrap;
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 12px;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease-in-out, visibility 0.2s ease-in-out;

    ${({ $position }) => {
        switch ($position) {
            case "top":
                return "bottom: 120%; left: 50%; transform: translateX(-50%);";
            case "bottom":
                return "top: 120%; left: 50%; transform: translateX(-50%);";
            case "bottom-right":
                return "top: 200%; left: 60%; transform: translateX(-20%) translateY(-3%);";
            case "left":
                return "right: 120%; top: 50%; transform: translateY(-50%);";
            case "right":
                return "left: 120%; top: 50%; transform: translateY(-50%);";
            default:
                return "bottom: 120%; left: 50%; transform: translateX(-50%);";
        }
    }}

    ${TooltipContainer}:hover & {
        opacity: 1;
        visibility: visible;
    }
`;

const Tooltip = ({ text, position = "top", children }: TooltipProps) => {
    return (
        <TooltipContainer>
            {children}
            <TooltipText $position={position}>{text}</TooltipText>
        </TooltipContainer>
    );
};

export default Tooltip;
