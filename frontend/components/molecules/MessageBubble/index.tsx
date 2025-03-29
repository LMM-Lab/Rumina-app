'use client'
import styled from "styled-components"
import Text from "@components/atoms/Text"
import Box from "@components/styles/Box"

type MessageBubbleProps = {
    $isUser?: boolean;
    children: React.ReactNode;
}

const BubbleWrapper = styled(Box) <MessageBubbleProps>`
    background-color: ${({ $isUser, theme }) => $isUser ? theme.colors.chat_area.User : theme.colors.chat_area.Agent};
    color: ${({ $isUser, theme }) => $isUser ? theme.colors.normal_text : theme.colors.normal_text};
    border-radius: 20px;
    padding: 10px 15px;
    max-width: 70%;
    word-wrap: break-word;
    margin-bottom: 1rem;
    align-self: ${({ $isUser }) => $isUser ? "flex-end" : "flex-start"};
`;

const MessageBubble = ({ $isUser, children }: MessageBubbleProps) => {
    return (
        <BubbleWrapper $isUser={$isUser}>
            <Text $variants="body" $fontSize="18px">{children}</Text>
        </BubbleWrapper>
    );
}

export default MessageBubble
