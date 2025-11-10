import { Canvas } from "@react-three/fiber";
import { Suspense, useRef, useState, useCallback } from "react";
import { Physics } from "@react-three/rapier";
import { Sky } from "@react-three/drei";
import { Group } from "three";
import Model from "../../models/character/Model";
import styles from "./styles/StartingPoint.module.css";
import CameraController from "../../utils/CameraController";
import ProceduralTrees from "../../models/background/Trees";
import Grass from "../../models/background/Grass";
import Rocks from "../../models/background/Rocks";
import StylizedGround from "../../models/background/Ground";
import WorldBoundaries from "../../models/background/WorldBoundaries";
import Flowers from "../../models/background/Flowers";
import { useMusicPlayer } from "../../hooks/useMusicPlayer";
import { Volume2, VolumeX } from "lucide-react";
import MobileJoystick from "../controls/MobileJoystick";

const StartingPointCanvas = () => {
  const modelRef = useRef<Group>(null);
  const { isMusicPlaying, toggleMusic } = useMusicPlayer(
    "/music/little-slimex27s-adventure-151007.mp3"
  );
  const [joystickInput, setJoystickInput] = useState({ x: 0, y: 0 });

  const handleJoystickMove = useCallback((x: number, y: number) => {
    setJoystickInput({ x, y });
  }, []);

  return (
    <div className={styles["styled-view"]}>
      {/* Sound toggle button - fixed in top right */}
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
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} shadows>
        {/* Sky and atmosphere */}
        <Sky
          distance={450000}
          sunPosition={[5, 1, 8]}
          inclination={0}
          azimuth={0.25}
        />

        {/* Fog for depth */}
        <fog attach="fog" args={["#e0f4ff", 20, 45]} />

        {/* Enhanced lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />

        <Physics gravity={[0, -9.81, 0]}>
          <Suspense fallback={null}>
            <Model ref={modelRef} joystickInput={joystickInput} />

            {/* Enhanced ground with shader */}
            <StylizedGround />
          </Suspense>

          {/* World boundaries - invisible walls */}
          <WorldBoundaries size={40} />

          {/* Procedurally generated trees */}
          <ProceduralTrees count={50} />

          {/* Rocks with physics */}
          <Rocks count={25} />
        </Physics>

        {/* Non-physics decorative elements */}
        <Grass count={600} worldSize={40} />
        <Flowers count={35} />

        <CameraController targetRef={modelRef} />
      </Canvas>

      {/* Mobile joystick overlay */}
      <MobileJoystick onJoystickMove={handleJoystickMove} />
    </div>
  );
};

export default StartingPointCanvas;
