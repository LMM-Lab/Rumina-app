'use client'
import styled, { css } from "styled-components"

type ButtonProps = {
    onClick?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    // サイズ・レイアウト関連
    $width?: string;
    $height?: string;
    $borderRadius?: string;
    $display?: string
    // ボタンのスタイルバリエーション
    $variants?: 'Icon' | 'Toggle' | "nav" | "Primary";
    // 色関連
    $backColor?: string;
    $color?: string;
    $hover_color?: string;
    // パディング関連
    $padding?: string;
    $paddingTop?: string;
    $paddingRight?: string;
    $paddingLeft?: string;
    $paddingBottom?: string;
    // マージン関連
    $margin?: string;
    $marginTop?: string;
    $marginRight?: string;
    $marginLeft?: string;
    $marginBottom?: string;
    // フォント関連
    $fontSize?: string;
    // ボタンのアクティブ状態
    $isactive?: boolean;
    // 枠線・ボーダー関連
    $border?: string;
    // その他
    type?: string;  // ボタンの type 属性 (submit, reset, button)
    children?: string;
}

const Button = styled.button<ButtonProps>`
    background-color:${({ $backColor, theme }) => $backColor || theme.colors.Button};
    ${({ $variants, theme, $hover_color, $isactive = false }) => {
        switch ($variants) {
            case 'Primary':
                return css`
                    font-size:${theme.fontSize.Small};
                    color: #000000;
                    width: 105px;
                    height:40px;
                    border-radius: 50px;
                    padding:10px 10px;
                    display: block;
                    background-color: ${theme.colors.Button};
                    &:hover{
                        background-color:${theme.colors.isHover};
                    }
                `
            case 'Toggle':
                return css`
                    height:54px;
                    width:54px;
                    padding:0 10px;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    border: 2px solid ${$isactive ? theme.colors.side_bar.active_text : "none"};
                    background-color: ${$isactive ? theme.colors.isActive : theme.colors.Button};
                    transition: all 0.3s ease-in-out;
                    &:hover {
                        background-color: ${$isactive ? $hover_color : theme.colors.isHover};
                    }
                `
            case 'Icon':
                return css`
                    height: 70px;
                    width: 70px;
                    padding: 0 10px;
                    &:hover {
                        background-color:${theme.colors.isHover};
                    }
                `
            case 'nav':
                return css`
                    font - size:${theme.fontSize.Small};
                    border - radius: 0!important;
                    width: 100 %;
                    height: 38px;
                    background-color:${$isactive ? theme.colors.side_bar.isActive : theme.colors.sideBar};
                    color:${$isactive ? theme.colors.side_bar.active_text : theme.colors.side_bar.text};
                    &:hover{
                        background-color:${$isactive ? theme.colors.side_bar.isActive : theme.colors.side_bar.isHover} !important;
                    }
                `
        }
    }};
    padding:${({ $padding }) => $padding};
    padding-top:${({ $paddingTop }) => $paddingTop};
    padding-left:${({ $paddingLeft }) => $paddingLeft};
    padding-right:${({ $paddingRight }) => $paddingRight};
    padding-bottom:${({ $paddingBottom }) => $paddingBottom};
    margin:${({ $margin }) => $margin};
    margin-top:${({ $marginTop }) => $marginTop};
    margin-right:${({ $marginRight }) => $marginRight};
    margin-left:${({ $marginLeft }) => $marginLeft};
    margin-bottom:${({ $marginBottom }) => $marginBottom};
    font-size:${({ $fontSize }) => $fontSize};
    border-radius:${({ $borderRadius }) => $borderRadius};
    width:${({ $width }) => $width};
    height:${({ $height }) => $height};
    color:${({ $color }) => $color};
    border:${({ $border }) => $border};
    display:${({ $display }) => $display};
    cursor: pointer;
`

export default Button
