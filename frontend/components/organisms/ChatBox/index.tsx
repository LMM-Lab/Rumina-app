"use client";
import styled from "styled-components";
import MessageBubble from "@components/molecules/MessageBubble";
import ChatInput from "@components/molecules/ChatInput";
import Flex from "@components/styles/Flex";

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
    return (
        <ChatContainer>
            <Messages>
                <MessageBubble $isUser={true}>こんにちは！</MessageBubble>
                <MessageBubble $isUser={false}>こんにちは！どのようにお手伝いできますか？今回は何について議論しましょう？</MessageBubble>
                <MessageBubble $isUser={true}>こんにちは！</MessageBubble>
                <MessageBubble $isUser={false}>こんにちは！どのようにお手伝いできますか？</MessageBubble>
                <MessageBubble $isUser={true}>こんにちは！</MessageBubble>
                <MessageBubble $isUser={false}>こんにちは！どのようにお手伝いできますか？</MessageBubble>
                <MessageBubble $isUser={true}>こんにちは！</MessageBubble>
                <MessageBubble $isUser={false}>こんにちは！どのようにお手伝いできますか？</MessageBubble>
                <MessageBubble $isUser={true}>こんにちは！</MessageBubble>
                <MessageBubble $isUser={false}>こんにちは！どのようにお手伝いできますか？</MessageBubble>
                <MessageBubble $isUser={true}>こんにちは！</MessageBubble>
                <MessageBubble $isUser={false}>こんにちは！どのようにお手伝いできますか？</MessageBubble>
                <MessageBubble $isUser={true}>こんにちは！</MessageBubble>
                <MessageBubble $isUser={false}>こんにちは！どのようにお手伝いできますか？</MessageBubble>
                <MessageBubble $isUser={true}>こんにちは！</MessageBubble>
                <MessageBubble $isUser={false}>こんにちは！どのようにお手伝いできますか？</MessageBubble>
            </Messages>
            <Flex $justify_content="center" $margin="3px">
                <ChatInput />
            </Flex>
        </ChatContainer >
    );
};

export default ChatBox;
