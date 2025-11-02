import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Text } from "@react-three/drei";
import { useRef, useEffect, useState, Suspense } from "react";
import { Group, AnimationMixer, Mesh, MeshStandardMaterial } from "three";

const RotatingGlobe = () => {
  const globeGltf = useGLTF(
    "/Background/Miniature_World_Globe_1101040838_texture_draco.glb"
  );
  const characterGltf = useGLTF(
    "/Character/Animations/Animation_Casual_Walk_withSkin_draco.glb"
  );
  const groupRef = useRef<Group>(null);
  const mixer = useRef<AnimationMixer | null>(null);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const loadStart = performance.now();

    if (characterGltf.animations && characterGltf.animations.length > 0) {
      mixer.current = new AnimationMixer(characterGltf.scene);
      const action = mixer.current.clipAction(characterGltf.animations[0]);
      action.play();
    }

    // Fix material properties for all models
    const fixMaterials = (model: Group) => {
      model.traverse((child) => {
        if ((child as Mesh).isMesh) {
          const mesh = child as Mesh;
          if (mesh.material) {
            const material = mesh.material as MeshStandardMaterial;
            if (material.emissive) {
              material.emissive.setHex(0x000000);
            }
            material.emissiveIntensity = 0;
            material.metalness = 0;
            material.roughness = 1;
            material.needsUpdate = true;
          }
        }
      });
    };
    fixMaterials(characterGltf.scene);

    const loadEnd = performance.now();
    console.log(`3D Models loaded in ${(loadEnd - loadStart).toFixed(2)}ms`);
  }, [characterGltf, globeGltf]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5; // Clockwise rotation on z-axis
    }
    mixer.current?.update(delta);
  });

  return (
    <group>
      <group ref={groupRef}>
        <primitive object={globeGltf.scene} scale={1} position={[0, 0, 0]} />
      </group>
      <primitive
        object={characterGltf.scene}
        scale={0.5}
        position={[0, 0.85, 0]}
        rotation={[0, -Math.PI / 5, 0]}
      />
      <Text
        position={[0, -1.5, 0]}
        fontSize={0.2}
        color="#353839"
        anchorX="center"
        anchorY="middle"
        font="/fonts/wheaton capitals.otf"
      >
        Entering World{dots}
      </Text>
    </group>
  );
};

const SimpleFallback = () => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        textAlign: "center",
        fontFamily: "'Wheaton Capitals', sans-serif",
        fontSize: "2rem",
        color: "#353839",
      }}
    >
      ENTERING WORLD{dots}
    </div>
  );
};

const LoadingScreen = () => {
  return (
    <div
      style={{
        backgroundColor: "#ADD1F5",
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[0, 5, 5]} intensity={1} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Suspense fallback={null}>
          <RotatingGlobe />
        </Suspense>
      </Canvas>
      <Suspense fallback={<SimpleFallback />}>
        {null}
      </Suspense>
    </div>
  );
};

export default LoadingScreen;
