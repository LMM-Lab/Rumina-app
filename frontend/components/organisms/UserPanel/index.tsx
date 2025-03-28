"use client";
import UserVideo from "@components/organisms/UserVideo";
import ChatBox from "@components/organisms/ChatBox";
import Box from "@components/styles/Box";
import styled, { useTheme } from "styled-components";



const UserPanel = () => {
    const theme = useTheme();
    return (
        <Box $width="50%" $height="100vh" $backgroundColor={theme.colors.sideBar}>
            <UserVideo />
            <ChatBox />
        </Box>
    );
};

export default UserPanel;
