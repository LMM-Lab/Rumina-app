"use client"
import styled from "styled-components";
import { useState } from "react";
import Input from "components/atoms/Input";
import Button from "components/atoms/Button";
import Tooltip from "@components/atoms/Tooltip";

const ChatInputContainer = styled.div`
    display: flex;
    align-items: center;
    background-color: #FCFFF7;
    border-radius: 30px;
    padding: 0.2rem;
    border: 1px solid #ddd;
    width: min(30.375rem, 95%);
`;

const ToolButton = styled(Button) <{ $backgroundColor?: string }>`
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    margin-left: auto;
    background-color: ${({ $backgroundColor }) => $backgroundColor || "transparent"};
    transition: background-color 0.3s ease-in-out;
`;

const ChatInput = ({ onSendMessage }: { onSendMessage: (text: string) => void }) => {
    const [message, setMessage] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value);
    };

    const handleSend = () => {
        if (message.trim()) {
            onSendMessage(message);
            setMessage(""); // 送信後に入力欄をクリア
        }
    };

    return (
        <ChatInputContainer>
            {/* 左側のボタン (追加アイコン) */}
            <Tooltip text="ファイルを追加" position="top">
                <ToolButton $variants="Icon">
                    <img src="/icons/add_icon.png" alt="Add" width="40" height="40" />
                </ToolButton>
            </Tooltip>

            {/* テキスト入力欄 */}
            <Input
                type="text"
                placeholder="ここに入力..."
                $variants="chat"
                $background="transparent"
                $width="400px"
                value={message}
                onChange={handleChange}
            />

            {/* 右側のボタン (マイク or 送信) */}
            <Tooltip text={message.trim() ? "送信" : "マイクを使用"} position="top">
                <ToolButton
                    $variants="Icon"
                    onClick={message.trim() ? handleSend : undefined}
                    $backgroundColor={message.trim() ? "#F0F4F8" : "transparent"} // 背景色の変更
                >
                    <img
                        src={message.trim() ? "/icons/send_icon.png" : "/icons/mic_on.png"}
                        alt="Action"
                        width="40"
                        height={message.trim() ? 40 : 50}
                    />
                </ToolButton>
            </Tooltip>
        </ChatInputContainer>
    );
};

export default ChatInput;
