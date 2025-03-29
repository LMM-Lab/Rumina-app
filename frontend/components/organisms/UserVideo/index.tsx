"use client";
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
    return (
        <VideoContainer>
            <StyledVideo />
            <MediaControl />
        </VideoContainer>
    );
};

export default UserVideo;
