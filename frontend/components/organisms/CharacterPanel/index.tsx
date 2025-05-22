'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import AnimatedCharacter from '@components/organisms/CharacterPanel/AnimatedCharacter';

export default function CharacterPanel() {
    return (
        <div style={{ width: '100%', height: '100%' }}>
            <Canvas camera={{ position: [0, 1.5, 0], fov: 50 }}>
                <ambientLight />
                <pointLight position={[100, 100, 100]} />
                <AnimatedCharacter />
                <OrbitControls enableZoom={false} />
            </Canvas>
        </div>
    );
}
