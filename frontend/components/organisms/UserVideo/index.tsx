"use client";
import { useEffect, useRef, useState } from "react";
import styled, { keyframes, css } from "styled-components";
import MediaControl from "@components/molecules/MediaControl";
import { useAudioChat } from "@features/chat/context/AudioChatContext";

const VideoContainer = styled.div`
    width: 100%;
    height: 48%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #ddd;
`;

const VideoWrapper = styled.div`
    position: relative;
    width: 80%;
    height: 80%;
    border-radius:8px;
`;

const StyledVideo = styled.video`
    width: 100%;
    height: 100%;
    background-color: black;
    border-radius:8px;
`;

const neonPulse = keyframes`
    0%,100% { box-shadow: 0 0 4px 2px rgba(0,220,130,0.3); }
    50%     { box-shadow: 0 0 8px 4px rgba(0,220,130,0.9); }
`;

const CornerGlow = styled.div<{ $active: boolean }>`
    position:absolute;
    inset:0;
    pointer-events:none;
    border-radius:4px;

    ${({ $active }) => $active
        ? css`
        border:1px solid rgba(0,220,130,0.8);
        animation:${neonPulse} 1.5s ease-in-out infinite;
      `
        : css`
        border:1px solid transparent;
        box-shadow:none;
      `}
`;

const eqAnim = keyframes`
    0%,100%{transform:scaleY(.3)} 50%{transform:scaleY(1)}
`;

const Equalizer = styled.div<{ $active: boolean }>`
    position:absolute;
    right:10px;
    bottom:10px;
    width:42px;
    height:26px;
    display:flex;
    gap:4px;
    opacity:${({ $active }) => $active ? 1 : 0};
    transition:opacity .3s;
`;
const Bar = styled.span`
    flex:1; background:#fff; border-radius:2px;
    animation:${eqAnim} 1s infinite ease-in-out;
    &:nth-child(2){animation-delay:-.2s}
    &:nth-child(3){animation-delay:-.4s}
    &:nth-child(4){animation-delay:-.6s}
    &:nth-child(5){animation-delay:-.8s}
`;


const UserVideo = () => {
    const [isCameraOn, setIsCameraOn] = useState(false);
    const { isVoiceActive } = useAudioChat();
    console.log("UserVideo isVoiceActive:", isVoiceActive);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error("カメラの起動に失敗:", error);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    // トグル切り替え時
    useEffect(() => {
        if (isCameraOn) {
            startCamera();
        } else {
            stopCamera();
        }
    }, [isCameraOn]);

    return (
        <VideoContainer>
            <VideoWrapper>
                <StyledVideo ref={videoRef} autoPlay muted playsInline />
                <CornerGlow $active={!!isVoiceActive} />
                <Equalizer $active={!!isVoiceActive}>
                    {[...Array(5)].map((_, i) => (<Bar key={i} />))}
                </Equalizer>
            </VideoWrapper>
            <MediaControl onCameraToggle={setIsCameraOn} />
        </VideoContainer>
    );
};

export default UserVideo;
