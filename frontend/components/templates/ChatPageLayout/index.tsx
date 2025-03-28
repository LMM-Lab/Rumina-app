"use client";
import { useState, useEffect } from "react";
import styled from "styled-components";
import MainChatLayout from "@components/organisms/MainChatLayout";
import Button from "@components/atoms/Button";
import Tooltip from "@components/atoms/Tooltip";

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: calc(100vw - 320px);
    margin-left: 320px;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.4);
    z-index: 50;
    display: none;

    @media (max-width: 1200px) {
        display: block;
    }
`;

const GlobalHamburger = styled(Button).attrs({ $variants: "Icon", $borderRadius: "50%" })`
    position: fixed;

    top: 32px;
    left: 16px;
    z-index: 100;
    width: 40px;
    height: 40px;
    background-color: transparent;

    @media (min-width: 960px) {
        display: none;
    }
`;

const ChatPageLayout = () => {
    const [isCollapsed, setIsCollapsed] = useState(true); // サイドバーの開閉状態を管理
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    return (
        <>
            {hasMounted && !isCollapsed && window.innerWidth < 1150 && (
                <Overlay onClick={() => setIsCollapsed(true)} />
            )}
            {hasMounted && isCollapsed && window.innerWidth < 960 && (
                <GlobalHamburger onClick={() => setIsCollapsed(false)}>
                    <Tooltip text="メニューを開く" position="bottom-right">
                        <img src="/icons/Hamburger_icon.svg" alt="Menu" width="18" height="18" />
                    </Tooltip>
                </GlobalHamburger>
            )}
            <MainChatLayout />
        </>
    );
};

export default ChatPageLayout;
