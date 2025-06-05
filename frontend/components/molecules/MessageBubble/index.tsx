'use client'
import styled, { keyframes } from "styled-components";
import Text from "@components/atoms/Text"
import Box from "@components/styles/Box"

type MessageBubbleProps = {
    $isUser?: boolean;
    $isTyping?: boolean;
    children: React.ReactNode;
}

const BubbleWrapper = styled(Box) <MessageBubbleProps>`
    background-color: ${({ $isUser, theme }) => $isUser ? theme.colors.chat_area.User : theme.colors.chat_area.Agent};
    color: ${({ $isUser, theme }) => $isUser ? theme.colors.normal_text : theme.colors.normal_text};
    border-radius: 20px;
    padding: 10px 15px;
    max-width: 70%;
    min-width: 20%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    word-wrap: break-word;
    margin-bottom: 1rem;
    align-self: ${({ $isUser }) => $isUser ? "flex-end" : "flex-start"};¥
`;

const bounce = keyframes`
    100%,80%, 0%, { transform: scale(0); }
    40%           { transform: scale(1); }
`;

const Dot = styled.span`
    width: 9px; height: 9px;
    margin: 3px 6px;
    background: currentColor; border-radius: 50%;
    display: inline-block; animation: ${bounce} 1.4s infinite ease-in-out;
    &:nth-child(2){ animation-delay:-0.32s; }
    &:nth-child(3){ animation-delay:-0.16s; }
`;

const MessageBubble = ({ $isUser, $isTyping, children }: MessageBubbleProps) => (
    <BubbleWrapper $isUser={$isUser}>
        {$isTyping ? (<><Dot /><Dot /><Dot /></>) :
            <Text $variants="body" $fontSize="18px">{children}</Text>}
    </BubbleWrapper>
);

export default MessageBubble
