"use client";
import styled from "styled-components";
import Box from "@components/styles/Box";
import Button from "@components/atoms/Button";
import { usePathname, useRouter } from "next/navigation";

const SidebarItem = styled(Button) <{ $isCollapsed: boolean }>`
    padding-left: 30px;
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

const navItems = [
    { label: "About Rumina", path: "/" },
    { label: "Performance", path: "/performance" },
    { label: "Pricing", path: "/pricing" },
];

const SidebarContent = ({ isCollapsed }: SidebarToolProps) => {
    const pathname = usePathname();
    const router = useRouter();
    return (
        <Box $width="100%" $height="300px" $marginTop="100px" $marginBottom="100px">
            {navItems.map((item) => (
                <SidebarItem
                    key={item.path}
                    $isCollapsed={isCollapsed}
                    $variants="nav"
                    $isactive={pathname === item.path}
                    onClick={() => router.push(item.path)}
                >
                    <span className="text">{item.label}</span>
                </SidebarItem>
            ))}
        </Box>
    );
};

export default SidebarContent;
