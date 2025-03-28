"use client";
import styled from "styled-components";
import Tooltip from "@components/atoms/Tooltip";
import Button from "@components/atoms/Button";
import { useState, useEffect } from "react";


const MainContent = styled.main`
    flex: 1;
    padding: 40px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
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

interface Props {
    children: React.ReactNode;
}

const HomePageLayout = ({ children }: Props) => {
    const [isCollapsed, setIsCollapsed] = useState(true); // サイドバーの開閉状態を管理
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    return (
        <>
            {hasMounted && isCollapsed && window.innerWidth < 960 && (
                <GlobalHamburger onClick={() => setIsCollapsed(false)}>
                    <Tooltip text="メニューを開く" position="bottom-right">
                        <img src="/icons/Hamburger_icon.svg" alt="Menu" width="18" height="18" />
                    </Tooltip>
                </GlobalHamburger>
            )}
            <MainContent>{children}</MainContent>
        </>
    );
};

export default HomePageLayout;
