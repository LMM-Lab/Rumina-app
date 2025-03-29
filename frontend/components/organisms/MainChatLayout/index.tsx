"use client";
import styled from "styled-components";
import AIPanel from "@components/organisms/AIPanel";
import UserPanel from "@components/organisms/UserPanel";
import Flex from "@components/styles/Flex";

const MainChatLayout = () => {
    return (
        <Flex $width="100%" $height="100vh">
            <AIPanel />
            <UserPanel />
        </Flex>
    );
};

export default MainChatLayout;
