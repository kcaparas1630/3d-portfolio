import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useEffect } from "react";
import { useRouteContext } from "@tanstack/react-router";
import LoadingScene from "../../scenes/loading-scene/LoadingScreen";
import StartingPointScene from "../../scenes/introduction-scene/StartingPoint";
import styles from "./styles/CanvasStyles.module.css";
import { useMusicPlayer } from "../../hooks/useMusicPlayer";
import { Volume2, VolumeX } from "lucide-react";

type SceneName = "loading" | "starting-point";

interface SceneProps {
  onSceneChange: (newScene: SceneName) => Promise<void>;
  isTransitioning: boolean;
}

interface RouteContext {
  preloaded: boolean;
}

const SCENE_COMPONENTS: Record<SceneName, React.FC<SceneProps>> = {
  loading: LoadingScene,
  "starting-point": StartingPointScene,
};

// SceneManager.tsx
const SceneManager: React.FC = () => {
  const routeContext = useRouteContext({ from: '/app' }) as RouteContext;
  
  // Initialize with "loading" if not preloaded yet
  const [currentScene, setCurrentScene] = useState<SceneName>(
    routeContext?.preloaded ? "starting-point" : "loading"
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const { isMusicPlaying, toggleMusic } = useMusicPlayer(
    "/music/little-slimex27s-adventure-151007.mp3"
  );
  
  useEffect(() => {
    // When preloading completes, transition to starting-point
    if (routeContext?.preloaded && currentScene === "loading") {
      transitionToScene("starting-point");
    }
  }, [routeContext?.preloaded, currentScene]);
  
  // Handle Scene Transition
  const transitionToScene = async (newScene: SceneName) => {
    setIsTransitioning(true);
    
    // Simulate transition delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    setCurrentScene(newScene);
    setIsTransitioning(false);
  };
  
  const CurrentSceneComponent = SCENE_COMPONENTS[currentScene];
  
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      {/* Orientation warning for mobile portrait mode */}
      <div className={styles["orientation-warning"]}>
        <h2>Please Rotate Your Device</h2>
        <p>This website is best viewed in landscape orientation.</p>
      </div>
      
      <div className={styles["styled-view"]}>
        {/* Only show music button after loading */}
        {currentScene !== "loading" && (
          <button
            onClick={toggleMusic}
            className={styles["sound-toggle"]}
            title={isMusicPlaying ? "Pause music" : "Play music"}
          >
            {isMusicPlaying ? (
              <Volume2 size={28} color="white" strokeWidth={2.5} />
            ) : (
              <VolumeX size={28} color="white" strokeWidth={2.5} />
            )}
          </button>
        )}
        
        <Canvas
          camera={{ position: [0, 1, 5], fov: 50, near: 0.1, far: 1000 }}
          shadows
          gl={{
            antialias: true,
            powerPreference: "high-performance",
          }}
        >
          <Suspense fallback={null}>
            <CurrentSceneComponent
              onSceneChange={transitionToScene}
              isTransitioning={isTransitioning}
            />
          </Suspense>
        </Canvas>
        
        {isTransitioning && (
          <div className={styles["scene-transition-overlay"]} />
        )}
      </div>
    </div>
  );
};

export default SceneManager;
