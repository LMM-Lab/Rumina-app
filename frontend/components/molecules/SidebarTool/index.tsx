"use client";
import styled from "styled-components";
import Box from "@components/styles/Box";
import Button from "@components/atoms/Button";
import Tooltip from "@components/atoms/Tooltip";

const SidebarItem = styled(Button) <{ $isCollapsed: boolean }>`
    width: ${({ $isCollapsed }) => ($isCollapsed ? "39.9px" : "96%")};
    background-color:${({ $isCollapsed }) => ($isCollapsed ? "inherit" : "none")};
    .text {
        display: ${({ $isCollapsed }) => ($isCollapsed ? "none" : "inline-block")};
        white-space: nowrap;
        color: inherit !important;
    }
`;

interface SidebarToolProps {
    isCollapsed: boolean;
}

const SidebarTool = ({ isCollapsed }: SidebarToolProps) => {
    return (
        <Box $width="100%" $marginTop="auto" $marginBottom="40px">
            <SidebarItem $isCollapsed={isCollapsed} $variants="nav" $isactive={false}>
                {/* isCollapsed が true のときのみ Tooltip を表示 */}
                {isCollapsed && (
                    <Tooltip text="ヘルプ" position="right">
                        <span className="icon-wrapper">
                            <img
                                src={false ? "/icons/help_icon_on.png" : "/icons/help_icon.png"}
                                alt="Help Icon"
                            />
                        </span>
                    </Tooltip>
                )}
                {!isCollapsed && (
                    <>
                        <span className="icon-wrapper">
                            <img
                                src={false ? "/icons/help_icon_on.png" : "/icons/help_icon.png"}
                                alt="Help Icon"
                            />
                        </span>
                        <span className="text">ヘルプ</span>
                    </>
                )}
            </SidebarItem>

            <SidebarItem $isCollapsed={isCollapsed} $variants="nav" $isactive={false}>
                {isCollapsed && (
                    <Tooltip text="アクティビティ" position="right">
                        <span className="icon-wrapper">
                            <img src="/icons/activity_icon.png" alt="Help Icon" />
                        </span>
                    </Tooltip>
                )}
                {!isCollapsed && (
                    <>
                        <span className="icon-wrapper">
                            <img src="/icons/activity_icon.png" alt="Help Icon" />
                        </span>
                        <span className="text">アクティビティ</span>
                    </>
                )}
            </SidebarItem>

            <SidebarItem $isCollapsed={isCollapsed} $variants="nav" $isactive={false}>
                {isCollapsed && (
                    <Tooltip text="設定" position="right">
                        <span className="icon-wrapper">
                            <img
                                src={false ? "/icons/setting_icon_on.png" : "/icons/setting_icon.png"}
                                alt="Help Icon"
                            />
                        </span>
                    </Tooltip>
                )}
                {!isCollapsed && (
                    <>
                        <span className="icon-wrapper">
                            <img
                                src={false ? "/icons/setting_icon_on.png" : "/icons/setting_icon.png"}
                                alt="Help Icon"
                            />
                        </span>
                        <span className="text">設定</span>
                    </>
                )}
            </SidebarItem>
        </Box >
    );
};

export default SidebarTool;
