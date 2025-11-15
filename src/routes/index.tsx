import { createFileRoute } from '@tanstack/react-router'
import Introduction from '../component/menu/Intro'
import { useGLTF } from '@react-three/drei'

export const Route = createFileRoute('/')({
  component: Introduction,
  loader: async () => {
    // Preload all models in the background while user reads intro
    await Promise.all([
      useGLTF.preload('/Background/Miniature-Globe_draco.glb'),
    ]);
    return null;
  },
})
