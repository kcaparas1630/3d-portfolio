import { createFileRoute } from '@tanstack/react-router'
import Introduction from '../component/Intro'
import { useGLTF } from '@react-three/drei'

export const Route = createFileRoute('/')({
  component: Introduction,
  loader: async () => {
    // Preload all models in the background while user reads intro
    await Promise.all([
      useGLTF.preload('/Background/Miniature-Globe_draco.glb'),
      useGLTF.preload('/Character/Animations/Animation_Walking_withSkin_draco.glb'),
      useGLTF.preload('/Character/Animations/Animation_Idle_02_withSkin_draco.glb'),
      useGLTF.preload('/Character/Animations/Animation_Idle_03_withSkin_draco.glb'),
    ]);
    return null;
  },
})
