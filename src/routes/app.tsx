import { createFileRoute } from '@tanstack/react-router'
import { useGLTF } from '@react-three/drei'
import { ANIMATION_MAP } from '../constants/animations';
import SceneManager from '../component/canvas/SceneManager';

const MIN_LOADING_TIME = 5000; // 5 seconds

interface LoaderData {
  preloaded: boolean;
}

export const Route = createFileRoute('/app')({
  component: SceneManager,
  loader: async (): Promise<LoaderData> => {
    const startTime = Date.now();

    // Preload all models using animation map
    await Promise.all([
      ...Object.values(ANIMATION_MAP).map(path => useGLTF.preload(path)),
      useGLTF.preload('/Background/brick_road_1115015040_texture_draco.glb'),
      useGLTF.preload('/Background/cartoon_tree_1111232532_texture_draco.glb'),
    ]);

    // Ensure minimum loading time
    const elapsed = Date.now() - startTime;
    if (elapsed < MIN_LOADING_TIME) {
      await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME - elapsed));
    }
    // Small additional delay for screen's context is fully released.
    await new Promise(resolve => setTimeout(resolve, 150));


    return { preloaded: true};
  },
})
