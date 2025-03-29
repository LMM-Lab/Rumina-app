`use client`
import styled from "styled-components";

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.4);
    z-index: 50;
    display: none;

    @media (max-width: 1200px) {
        display: block;
    }
`;

export default Overlay
