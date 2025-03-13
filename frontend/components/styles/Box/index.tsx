import styled from "styled-components"

export type BoxProps = {
    $color?: string
    $backgroundColor?: string
    $width?: string
    $height?: string
    $maxWidth?: string
    $maxHeight?: string
    $minWidth?: string
    $minHeight?: string
    $display?: string
    $border?: string
    $overflow?: string
    $margin?: string
    $marginTop?: string
    $marginRight?: string
    $marginBottom?: string
    $marginLeft?: string
    $padding?: string
    $paddingTop?: string
    $paddingRight?: string
    $paddingBottom?: string
    $paddingLeft?: string
    $borderButton?: string
    $borderRadius?: string
}

const Box = styled.div<BoxProps>`
    color:${({ color }) => color};
    background-color:${({ $backgroundColor }) => $backgroundColor};
    width:${({ $width }) => $width};
    height:${({ $height }) => $height};
    max-width:${({ $maxWidth }) => $maxWidth};
    max-height:${({ $maxHeight }) => $maxHeight};
    min-width:${({ $minWidth }) => $minWidth};
    min-height:${({ $minHeight }) => $minHeight};
    display:${({ $display }) => $display};
    border:${({ $border }) => $border};
    border-radius:${({ $borderRadius }) => $borderRadius};
    overflow:${({ $overflow }) => $overflow};
    margin:${({ $margin }) => $margin};
    margin-top:${({ $marginTop }) => $marginTop};
    margin-right:${({ $marginRight }) => $marginRight};
    margin-bottom:${({ $marginBottom }) => $marginBottom};
    margin-left:${({ $marginLeft }) => $marginLeft};
    padding:${({ $padding }) => $padding};
    padding-top:${({ $paddingTop }) => $paddingTop};
    padding-right:${({ $paddingRight }) => $paddingRight};
    padding-bottom:${({ $paddingBottom }) => $paddingBottom};
    padding-left:${({ $paddingLeft }) => $paddingLeft};
    border-bottom:${({ $borderButton }) => $borderButton};
`

export default Box
