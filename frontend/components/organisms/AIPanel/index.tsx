"use client";
import UserVideo from "@components/organisms/UserVideo";
import ChatBox from "@components/organisms/ChatBox";
import Box from "@components/styles/Box";
import styled, { useTheme } from "styled-components";
import CharacterPanel from "@components/organisms/CharacterPanel";
import ModelSelector from "@components/molecules/ModelSelector";
import { useState } from "react"; // ← 追加
import { useAudioChat } from "@features/chat/context/AudioChatContext";

const AIPanel = () => {
    const theme = useTheme();
    const { selectedModel, setSelectedModel } = useAudioChat(); // ← state 定義

    return (
        <Box $width="50%" $height="100%">
            <Box $width="100%" $height="50px" $marginLeft="10px" $marginTop="10px">
                <ModelSelector
                    selectedModel={selectedModel}
                    onSelectModel={setSelectedModel}
                />
            </Box>
            <Box $width="100%" $height="calc(100% - 60px)">
                {/* ★ 必須 props を渡す！ */}
                <CharacterPanel />
            </Box>
        </Box>
    );
};

export default AIPanel;
