import IconToggle from "@components/atoms/IconToggle";
import Button from "@components/atoms/Button";
import Flex from "@components/styles/Flex";
import Tooltip from "@components/atoms/Tooltip";
import { useAudioChat } from "@features/chat/context/AudioChatContext"

type MediaControlProps = {
    onCameraToggle?: (state: boolean) => void;
};


const MediaControl: React.FC<MediaControlProps> = ({ onCameraToggle }) => {
    const { isRecording, toggleRecording } = useAudioChat();
    return (
        <Flex $gap="1.5rem" $align_items="center" $margin="5px" $marginTop="3%">
            {/* ビデオのオン/オフ */}
            <IconToggle
                onIcon="/icons/video_on.png"
                offIcon="/icons/video_off.png"
                onToggle={(state) => {
                    console.log("Video:", state);
                    onCameraToggle?.(state);
                }}
            />

            {/* マイクのオン/オフ */}
            <IconToggle
                onIcon="/icons/mic_on.png"
                offIcon="/icons/mic_off.png"
                backgroundColor="#EEEEEE"
                isOn={isRecording}  // 状態反映（オプション）
                onToggle={() => toggleRecording()} // 録音トグル
            />

            {/* 設定ボタン（トグルなし） */}
            <Tooltip text="ツールを表示する" position="top">
                <Button $variants="Icon" $borderRadius='50%' $backColor='#EEEEEE'><img src="/icons/more_icon.png" alt="Settings" width="50" height="50" /></Button>
            </Tooltip>
        </Flex>
    );
};

export default MediaControl;
