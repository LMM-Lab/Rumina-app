"use client";
import UserVideo from "@components/organisms/UserVideo";
import ChatBox from "@components/organisms/ChatBox";
import Box from "@components/styles/Box";
import styled, { useTheme } from "styled-components";
import CharacterPanel from "@components/organisms/CharacterPanel"


const AIPanel = () => {
    const theme = useTheme();
    return (
        <Box $width="50%" $height="100%" $paddingTop="100px">
            <Box $width="100%" $height="100%">
                <CharacterPanel></CharacterPanel>
            </Box>
        </Box>
    );
};

export default AIPanel;
