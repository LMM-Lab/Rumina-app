'use client';

import { useGLTF, useAnimations } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';

export default function AnimatedCharacter() {
    const group = useRef();
    const { scene, animations } = useGLTF('/models/test7.glb');
    const { actions } = useAnimations(animations, group);

    const [animationNames, setAnimationNames] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(0);

    useEffect(() => {
        if (actions) {
            const names = Object.keys(actions);
            setAnimationNames(names);
            setCurrentIndex(0);
        }
    }, [actions]);

    useEffect(() => {
        if (!actions || animationNames.length === 0) return;

        const current = animationNames[currentIndex];
        const currentAction = actions[current];
        if (!currentAction) return;

        // ❌ 他を停止
        Object.entries(actions).forEach(([name, action]) => {
            if (name !== current) {
                action.stop();               // 完全に停止
                action.reset();
                action.enabled = false;     // ブレンド解除
            }
        });

        // ✅ 現在のアニメーションを再生
        currentAction.reset();
        currentAction.enabled = true;
        currentAction.fadeIn(0); // 補間なしに確実に切り替える
        currentAction.play();

    }, [currentIndex, animationNames, actions]);

    useEffect(() => {
        if (animationNames.length === 0) return;

        const timer = setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % animationNames.length);
        }, 8000);

        return () => clearTimeout(timer);
    }, [currentIndex, animationNames]);

    return <primitive
        ref={group}
        object={scene}
        position={[0, -0.7, 0]} // 下にずらす
        scale={[0.9, 0.9, 0.9]}     // 拡大
    />;
}
