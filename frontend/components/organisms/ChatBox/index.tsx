"use client";
import { useEffect, useRef } from "react";
import styled from "styled-components";
import MessageBubble from "@components/molecules/MessageBubble";
import ChatInput from "@components/molecules/ChatInput";
import Flex from "@components/styles/Flex";
import { useAudioChat } from "@features/chat/context/AudioChatContext";

const ChatContainer = styled.div`
    width: 100%;
    height: 50%;
    flex-direction: column;
    padding: 10px;
    background-color: #F0F4F8;
`;

const Messages = styled.div`
    flex: 1;
    width: 100%;
    height: 88%;
    padding: 20px;
    flex-direction: column;
    display: flex;
    background-color: #F0F4F8;
    overflow-y: auto;
`;

const ChatBox = () => {
    const { isRecording, isSpeaking, isThinking, toggleRecording, transcriptions } = useAudioChat();
    console.log("isThinking:", isThinking);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [transcriptions]);
    useEffect(() => {
        console.log("更新された transcriptions:", transcriptions);
    }, [transcriptions]);
    return (
        <ChatContainer>
            <Messages>
                {transcriptions.map((msg, index) => (
                    <MessageBubble key={index} $isUser={msg.isUser}>
                        {msg.text}
                    </MessageBubble>
                ))}
                {isThinking && (
                    <MessageBubble $isUser={false} $isTyping />
                )}
                <div ref={bottomRef} />
            </Messages>
            <Flex $justify_content="center" $margin="3px">
                <ChatInput />
            </Flex>
        </ChatContainer>
    );
};

export default ChatBox;
