'use client';

import { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { VolumeX, ChevronDown, ChevronUp } from 'lucide-react';
import Text from '@components/atoms/Text';
import Box from '@components/styles/Box';

/* ---------- props ---------- */
export type MessageBubbleProps = {
    children: React.ReactNode;
    $isUser?: boolean;
    $isTyping?: boolean;
    $silent?: boolean;
    $prompt?: string;
};

/* ---------- animation ---------- */
const bounce = keyframes`
  0%, 80%, 100% { transform: scale(0); }
  40%           { transform: scale(1); }
`;

/* ---------- styled ---------- */
const Wrapper = styled(Box) <{ $isUser?: boolean; $silent?: boolean }>`
    background-color: ${({ theme, $isUser, $silent }) =>
        $isUser
            ? theme.colors.chat_area.User
            : $silent
                ? theme.colors.chat_area.AgentSilent
                : theme.colors.chat_area.Agent};

    color: ${({ theme }) => theme.colors.normal_text};
    border-radius: 20px;
    padding: 10px 15px;
    max-width: 70%;
    min-width: 20%;
    display: inline-flex;
    word-break: break-word;
    margin-bottom: 1rem;
    align-self: ${({ $isUser }) => ($isUser ? 'flex-end' : 'flex-start')};
    cursor: ${({ $silent }) => ($silent ? 'pointer' : 'default')};
`;

const QuoteRow = styled.div`
    font-size: 13px;
    color: ${({ theme }) => theme.colors.sub_text};
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 0 0 4px 2px;
`;

const Dot = styled.span`
  width: 9px;
  height: 9px;
  margin: 3px 6px;
  background: currentColor;
  border-radius: 50%;
  display: inline-block;
  animation: ${bounce} 1.4s infinite ease-in-out;
  &:nth-child(2) { animation-delay: -0.32s; }
  &:nth-child(3) { animation-delay: -0.16s; }
`;

/* ---------- component ---------- */
const MessageBubble: React.FC<MessageBubbleProps> = ({
    children,
    $isUser = false,
    $isTyping = false,
    $silent = false,
    $prompt,
}) => {
    /** silent バブルだけ click で展開 / 折りたたみ */
    const [expanded, setExpanded] = useState(!$silent); // ← silent なら初期 false

    const handleToggle = () => {
        if ($silent) setExpanded((prev) => !prev);
    };

    /** 折りたたみ時は 1 行だけ表示（… 付き） */
    const renderContent = () => {
        if ($isTyping)
            return (
                <>
                    <Dot />
                    <Dot />
                    <Dot />
                </>
            );

        if ($silent && !expanded) {
            // children は ReactNode; 文字列化して先頭 30 文字 + …
            const raw = typeof children === 'string' ? children : '';
            return (
                <Text $variants="body" $fontSize="15px">
                    {raw.slice(0, 30)}
                    {raw.length > 30 && ' …'}
                </Text>
            );
        }

        return (
            <Text $variants="body" $fontSize="18px" style={{ whiteSpace: 'pre-wrap' }}>
                {children}
            </Text>
        );
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: $isUser ? 'flex-end' : 'flex-start',
            }}
        >
            {/* ── 引用バー（silent&prompt のときだけ） ─────────── */}
            {$silent && $prompt && (
                <QuoteRow>
                    <VolumeX size={14} /> {/** mute アイコン */}
                    <span>{$prompt}</span>
                </QuoteRow>
            )}

            {/* ── 本体バブル ──────────────────────────── */}
            <Wrapper
                $isUser={$isUser}
                $silent={$silent}
                onClick={handleToggle}
                title={$silent ? 'クリックで開閉' : undefined}
            >
                {renderContent()}

                {/* silent のみ右端にトグルアイコン */}
                {$silent && (
                    <span style={{ marginLeft: 6, display: 'flex' }}>
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                )}
            </Wrapper>
        </div>
    );
};

export default MessageBubble;
