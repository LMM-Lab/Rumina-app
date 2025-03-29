
'use client'
import styled, { keyframes, css } from "styled-components";

type SpeakingEffectProps = {
    $isSpeaking: boolean;
    $effectcolor: string;
    $borderRadius: string;
    $min_shadow: string;
    $high_shadow: string;
}

const glow = (
    effectcolor: string,
    min_shadow: string,
    high_shadow: string
) => keyframes`
    0% { box-shadow: ${min_shadow} ${effectcolor}50; } /* 透明度80% */
    50% { box-shadow: ${high_shadow} ${effectcolor}; }
    100% { box-shadow: ${min_shadow} ${effectcolor}50; }
`;

const SpeakingWrapper = styled.div<SpeakingEffectProps>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: ${({ $borderRadius }) => $borderRadius};

    ${({ $isSpeaking, $effectcolor, $min_shadow, $high_shadow }) =>
        $isSpeaking &&
        css`
            animation: ${glow($effectcolor, $min_shadow, $high_shadow)} 1.5s infinite alternate;
        `
    }
`

type Props = {
    isSpeaking: boolean;
    effectcolor?: string;
    borderRadius?: string;
    min_shadow?: string;
    high_shadow?: string;
    children: React.ReactNode;
}

const SpeakingEffect = ({
    isSpeaking,
    effectcolor = "rgba(0, 255, 0, 1)",
    borderRadius = "50%",
    min_shadow = "0 0 5px",
    high_shadow = "0 0 20px",
    children
}: Props) => {
    return (
        <SpeakingWrapper
            $isSpeaking={isSpeaking}
            $effectcolor={effectcolor}
            $borderRadius={borderRadius}
            $min_shadow={min_shadow}
            $high_shadow={high_shadow}
        >
            {children}
        </SpeakingWrapper>
    );
};

export default SpeakingEffect;
