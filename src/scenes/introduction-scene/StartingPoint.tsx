import { Suspense, useRef, useState, useCallback } from "react";
import { Physics } from "@react-three/rapier";
import { Sky } from "@react-three/drei";
import { Group } from "three";
import Model from "../../models/character/Model";
import CameraController from "../../utils/CameraController";
import ProceduralTrees from "../../models/background/Trees";
import Grass from "../../models/background/Grass";
import Rocks from "../../models/background/Rocks";
import StylizedGround from "../../models/background/Ground";
import WorldBoundaries from "../../models/background/WorldBoundaries";
import Flowers from "../../models/background/Flowers";
import MobileJoystick from "../../component/controls/MobileJoystick";
import MobileJumpButton from "../../component/controls/MobileJumpButton";

const StartingPointScene = () => {
  const modelRef = useRef<Group>(null);

  const [joystickInput, setJoystickInput] = useState({ x: 0, y: 0 });
  const [jumpTrigger, setJumpTrigger] = useState(0);

  const handleJoystickMove = useCallback((x: number, y: number) => {
    setJoystickInput({ x, y });
  }, []);

  const handleJump = useCallback(() => {
    setJumpTrigger((prev) => prev + 1);
  }, []);

  return (
    <>
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

      <Physics gravity={[0, -9.81, 0]} colliders="hull" timeStep="vary">
        <Suspense fallback={null}>
          <Model
            ref={modelRef}
            joystickInput={joystickInput}
            jumpTrigger={jumpTrigger}
          />

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

      {/* Mobile controls overlay */}
      <MobileJoystick onJoystickMove={handleJoystickMove} />
      <MobileJumpButton onJump={handleJump} />
    </>
  );
};

export default StartingPointScene;
