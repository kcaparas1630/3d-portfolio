import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Text } from "@react-three/drei";
import { useRef, useEffect, useState, Suspense } from "react";
import { Group, Mesh, MeshStandardMaterial } from "three";

const RotatingGlobe = () => {
  const globeGltf = useGLTF(
    "/Background/Miniature-Globe_draco.glb"
  );
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
      groupRef.current.rotation.y += delta * 0.5; // Clockwise rotation
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
