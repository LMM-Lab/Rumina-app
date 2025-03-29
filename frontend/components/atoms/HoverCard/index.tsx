"use client";
import React from "react";
import styled from "styled-components";

interface HoverCardProps {
    src: string;
    alt?: string;
    overlayText: string;
    width?: string;
    height?: string;
}

const ImageWrapper = styled.div`
  position: relative;
  width: 50%;
  display: inline-block;
  border: 2px solid #ccc;
  border-radius: 20px;
  overflow: hidden;
  margin: 10px
`;

const StyledImage = styled.img<{ width?: string; height?: string }>`
  display: block;
  width: ${({ width }) => width || "100%"};
  height: ${({ height }) => height || "auto"};
  border-radius: 12px;
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  padding: 20px;
  text-align: center;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
`;

const HoverContainer = styled(ImageWrapper)`
  &:hover ${Overlay} {
    opacity: 1;
  }
`;

const HoverCard: React.FC<HoverCardProps> = ({
    src,
    alt = "",
    overlayText,
    width,
    height,
}) => {
    return (
        <HoverContainer>
            <StyledImage src={src} alt={alt} width={width} height={height} />
            <Overlay>{overlayText}</Overlay>
        </HoverContainer>
    );
};

export default HoverCard;
