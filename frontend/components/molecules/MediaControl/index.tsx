import IconToggle from "@components/atoms/IconToggle";
import Button from "@components/atoms/Button";
import Flex from "@components/styles/Flex";
import Tooltip from "@components/atoms/Tooltip";

const MediaControl: React.FC = () => {
    return (
        <Flex $gap="1.5rem" $align_items="center" $margin="5px">
            {/* ビデオのオン/オフ */}
            <IconToggle
                onIcon="/icons/video_on.png"
                offIcon="/icons/video_off.png"
                onToggle={(state) => console.log("Video:", state)}
            />

            {/* マイクのオン/オフ */}
            <IconToggle
                onIcon="/icons/mic_on.png"
                offIcon="/icons/mic_off.png"
                backgroundColor="#EEEEEE"
                onToggle={(state) => console.log("Mic:", state)}
            />

            {/* 設定ボタン（トグルなし） */}
            <Tooltip text="ツールを表示する" position="top">
                <Button $variants="Icon" $borderRadius='50%' $backColor='#EEEEEE'><img src="/icons/more_icon.png" alt="Settings" width="50" height="50" /></Button>
            </Tooltip>
        </Flex>
    );
};

export default MediaControl;
