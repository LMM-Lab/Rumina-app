"use client";
import styled from "styled-components";
import AIPanel from "@components/organisms/AIPanel";
import UserPanel from "@components/organisms/UserPanel";
import Flex from "@components/styles/Flex";
import { AudioChatProvider } from "@features/chat/context/AudioChatContext";

const MainChatLayout = () => {
    return (
        <Flex $width="100%" $height="100vh">
            <AudioChatProvider>
                <AIPanel />
                <UserPanel />
            </AudioChatProvider>
        </Flex>
    );
};

export default MainChatLayout;
