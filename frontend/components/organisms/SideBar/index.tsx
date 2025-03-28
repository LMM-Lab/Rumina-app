"use client";
import styled from "styled-components";
import Box from "@components/styles/Box";
import Button from "@components/atoms/Button";
import SidebarTool from "@components/molecules/SidebarTool";
import SidebarContent from "@components/molecules/SidebarContent";
import Flex from "@components/styles/Flex";
import Tooltip from "@components/atoms/Tooltip";

const SidebarContainer = styled(Box) <{ $isCollapsed: boolean }>`
    display: flex;
    flex-direction: column;
    left: 0;
    top: 0;
    height: 100vh;
    padding: 10px;
    background-color: ${({ theme }) => theme.colors.sideBar};
    transition: width 0.3s ease-in-out;
    width: ${({ $isCollapsed }) => ($isCollapsed ? "72px" : "320px")};

    @media (max-width: 950px) {
        display: ${({ $isCollapsed }) => ($isCollapsed ? "none" : "block")};
        width: 320px;
    }

    @media (max-width: 600px) {
        display: none;
    }
`;


interface SideBarProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
    variant?: "default" | "chat";
}

const SideBar = ({ isCollapsed, setIsCollapsed, variant = "default" }: SideBarProps) => {
    return (
        <SidebarContainer $isCollapsed={isCollapsed}>
            <Flex
                $width="52px"
                $align_content="center"
                $justify_content="center"
                $marginTop="20px"
            >
                <Button onClick={() => setIsCollapsed(!isCollapsed)}
                    $variants="Icon"
                    $borderRadius="50%"
                    $width="40px"
                    $height="40px"
                    $backColor="transparent"
                >
                    <Tooltip text={isCollapsed ? "メニューを開く" : "メニューを閉じる"} position="bottom-right">
                        <img src="/icons/Hamburger_icon.svg" alt="Menu" width="18" height="18" />
                    </Tooltip>
                </Button>
            </Flex>

            {/* variant に応じて表示内容を切り替える */}
            {variant === "default" && <SidebarContent isCollapsed={isCollapsed} />}
            {variant === "chat" && <Box $width="100%" $height="71%" />}

            <SidebarTool isCollapsed={isCollapsed} />
        </SidebarContainer>
    );
};

export default SideBar;
