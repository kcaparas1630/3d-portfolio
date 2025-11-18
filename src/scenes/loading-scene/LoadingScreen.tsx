import { useFrame } from "@react-three/fiber";
import { useGLTF, Text } from "@react-three/drei";
import { useRef, useEffect, useState } from "react";
import { Group, Mesh, MeshStandardMaterial } from "three";

interface SceneProps {
  onSceneChange: (newScene: "loading" | "starting-point") => Promise<void>;
  isTransitioning: boolean;
}

const RotatingGlobe = () => {
  const globeGltf = useGLTF("/Background/Miniature-Globe_draco.glb");
  const groupRef = useRef<Group>(null);
  const [dots, setDots] = useState("");

  useEffect(() => {
    // Fix material properties for globe
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
    fixMaterials(globeGltf.scene);
  }, [globeGltf]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group>
      <group ref={groupRef}>
        <primitive object={globeGltf.scene} scale={1} position={[0, 0, 0]} />
      </group>
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

const LoadingScene: React.FC<SceneProps> = ({ onSceneChange }) => {
  // Auto-transition to starting point after loading
  useEffect(() => {
    const timer = setTimeout(() => {
      onSceneChange("starting-point");
    }, 5000); // 5 second loading time
    return () => clearTimeout(timer);
  }, [onSceneChange]);

  return (
    <>
      {/* Set background color */}
      <color attach="background" args={['#ADD1F5']} />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[0, 5, 5]} intensity={1} />
      
      {/* The rotating globe */}
      <RotatingGlobe />
    </>
  );
};

export default LoadingScene;
