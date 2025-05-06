"use client";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import MediaControl from "@components/molecules/MediaControl";

const VideoContainer = styled.div`
    width: 100%;
    height: 48%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #ddd;
`;

const StyledVideo = styled.video`
    width: 80%;
    height: 80%;
    background-color: black;
    margin-top: 10px;
    margin-bottom: 10px;
`;


const UserVideo = () => {
    const [isCameraOn, setIsCameraOn] = useState(false);
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
            <StyledVideo ref={videoRef} autoPlay muted playsInline />
            <MediaControl onCameraToggle={setIsCameraOn} />
        </VideoContainer>
    );
};

export default UserVideo;
