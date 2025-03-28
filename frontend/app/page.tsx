"use client";
import HomePageLayout from "@components/templates/HomePageLayout";
import Text from "@components/atoms/Text";
import Box from "@components/styles/Box";
import Flex from "@components/styles/Flex";
import Button from "@components/atoms/Button";
import HoverCard from "@components/atoms/HoverCard";
import { useRouter } from "next/navigation";

const AboutPage = () => {
    const router = useRouter();
    return (
        <HomePageLayout>
            <Flex $marginLeft="auto" $marginRight="5%">
                <Button $variants="Primary" onClick={() => router.push("/chat")}>
                    Log in
                </Button>
            </Flex>
            <Text>Rumina</Text>
            <Text as="h1" $variants="title">Experience the next generation of AI
                conversation applications</Text>
            <Box $maxWidth="50%" $marginTop="20px"><Text $variants='caption' $fontSize="18px" >Just talk to Rumina, which is free and easy to use, and you'll feel like you're talking to a friend.</Text></Box>
            <Button $variants="Primary" $marginTop="20px" onClick={() => router.push("/chat")}>
                Start now
            </Button>
            <Flex>
                <HoverCard src="/media/ScaNN_tom_export.gif" overlayText="アーキテクチャ">
                </HoverCard>
                <HoverCard src="/media/robo.gif" overlayText="アーキテクチャ">
                </HoverCard>
            </Flex>
            <Box $marginLeft="5%" $marginRight="auto" $marginTop="25px">
                <Text $variants="subtitle">Conversation using visual information</Text>
                <div></div>
                <Text $variants="caption" $align="left" $marginTop="30px" $width="50%" $Lineheight="1.7rem" $letterSpacing="-.03em">Our way of communication is influenced not only by words, but also by what we see. With Rumina, AI can understand visual information obtained through cameras or screen sharing, enabling more natural and context-aware interactions.<br />

                    For example, the AI can ask questions about objects shown in the camera, or adjust its tone and responses based on the user's facial expressions or movements. This allows for responses that capture nuance and presence—something that traditional text-based chat often struggles to achieve. <br />

                    In the future of communication, "showing" will be just as important as "speaking." <br />

                </Text>
            </Box>
        </HomePageLayout >
    );
};

export default AboutPage;
