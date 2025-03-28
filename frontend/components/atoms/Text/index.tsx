'use client'
import styled, { css } from "styled-components"

type TextProps = {
    $variants?: "title" | "subtitle" | "body" | "caption";
    $color?: string;
    $align?: "left" | "center" | "right";
    $weight?: "normal" | "bold";
    $fontSize?: string;
    $width?: string
    $height?: string
    $padding?: string
    $paddingTop?: string
    $paddingRight?: string
    $paddingLeft?: string
    $paddingBottom?: string
    $margin?: string
    $marginTop?: string
    $marginRight?: string
    $marginLeft?: string
    $marginBottom?: string
    $fontFamily?: string
    $fontWeight?: string
    $letterSpacing?: string
    $Lineheight?: string
}

const Text = styled.p<TextProps>`
    ${({ $variants, theme }) => {
        switch ($variants) {
            case 'title':
                return css`
                    font-size: ${theme.fontSize.flexible.ExtraLarge};
                    line-height: clamp(2.28rem, calc(2.28rem + 1.72*((100vw - 23.4375rem) / 66.5625)), 4rem);
                    width: 70%;
                    letter-spacing: -.03em;
                    font-weight:460;
                    text-align: center;
                `
            case 'subtitle':
                return css`
                    font-size: ${theme.fontSize.Large};
                    letter-spacing: -.03em;
                `
            case 'body':
                return css`
                    font-size: ${theme.fontSize.Medium};
                `
            case 'caption':
                return css`
                    font-size: ${theme.fontSize.Small};
                    line-height: 1.2499375rem;
                `
        }
    }};
    color: ${({ $color }) => $color};
    font-size: ${({ $fontSize }) => $fontSize};
    font-weight: ${({ $fontWeight }) => $fontWeight};
    letter-spacing: ${({ $letterSpacing }) => $letterSpacing};
    font-family: ${({ $fontFamily }) => $fontFamily};
    width: ${({ $width }) => $width};
    height: ${({ $height }) => $height};
    padding: ${({ $padding }) => $padding};
    padding-top: ${({ $paddingTop }) => $paddingTop};
    padding-right: ${({ $paddingRight }) => $paddingRight};
    padding-left: ${({ $paddingLeft }) => $paddingLeft};
    padding-bottom: ${({ $paddingBottom }) => $paddingBottom};
    margin: ${({ $margin }) => $margin};
    margin-top: ${({ $marginTop }) => $marginTop};
    margin-right: ${({ $marginRight }) => $marginRight};
    margin-left: ${({ $marginLeft }) => $marginLeft};
    margin-bottom: ${({ $marginBottom }) => $marginBottom};
    text-aligin: ${({ $align }) => $align || "center"};
    display:inline-block;
    line-height: ${({ $Lineheight }) => $Lineheight};
`

export default Text
