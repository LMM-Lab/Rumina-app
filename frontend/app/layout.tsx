"use client";

import { ReactNode, useEffect, useState } from "react";
import { ThemeProvider } from "styled-components";
import GlobalStyles from "../styles/GlobalStyles";
import theme from "../styles/theme";
import SideBar from "@components/organisms/SideBar";
import styled from "styled-components";


const LayoutContainer = styled.div`
  display: flex;
  width: 100vw;
  height: 100vh;
`;

// コンテンツ領域（サイドバーに応じて可変）
const MainContent = styled.div<{ $isCollapsed: boolean }>`
    display: flex;
    flex-direction: column;
    transition: width 0.3s ease-in-out;

    /* サイドバーが開閉した時の幅調整 */
    width: ${({ $isCollapsed }) => ($isCollapsed ? "calc(100vw - 72px)" : "calc(100vw - 320px)")};

    @media (max-width: 950px) {
        width: ${({ $isCollapsed }) => ($isCollapsed ? "100vw" : "calc(100vw - 320px)")};
    }

    @media (max-width: 600px) {
        width: 100vw; /* モバイル時はサイドバーを非表示 */
    }
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored !== null) {
      setIsCollapsed(stored === "true");
    }
  }, []);

  const handleToggle = (value: boolean) => {
    setIsCollapsed(value);
    localStorage.setItem("sidebar-collapsed", String(value));
  };

  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={theme}>
          <GlobalStyles />
          <LayoutContainer>
            <SideBar
              isCollapsed={isCollapsed}
              setIsCollapsed={handleToggle}
              variant="default"
            />
            <MainContent $isCollapsed={isCollapsed}>{children}</MainContent>
          </LayoutContainer>
        </ThemeProvider>
      </body>
    </html>
  );
}
