import { createFileRoute } from '@tanstack/react-router'
import App from '../App'
import LoadingScreen from '../Common/View/LoadingScreen'
import { useGLTF } from '@react-three/drei'

const MIN_LOADING_TIME = 10000; // 10 seconds

export const Route = createFileRoute('/app')({
  component: App,
  pendingComponent: LoadingScreen,
  loader: async () => {
    const startTime = Date.now();

    // Preload all character models
    await Promise.all([
      useGLTF.preload('/Character/Animations/Animation_Walking_withSkin_draco.glb'),
      useGLTF.preload('/Character/Animations/Animation_Idle_02_withSkin_draco.glb'),
      useGLTF.preload('/Character/Animations/Animation_Idle_03_withSkin_draco.glb'),
    ]);

    // Ensure minimum loading time
    const elapsed = Date.now() - startTime;
    if (elapsed < MIN_LOADING_TIME) {
      await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME - elapsed));
    }

    return null;
  },
})
