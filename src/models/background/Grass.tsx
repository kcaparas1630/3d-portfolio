import { useRef, useMemo } from "react";
import { InstancedMesh, Object3D } from "three";
import { useFrame } from "@react-three/fiber";

// Grass component with instanced rendering
const Grass = ({ count = 800 }) => {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  
  const instances = useMemo(() => {
    const temp = [];
    const worldSize = 40; // Match world boundaries
    for (let i = 0; i < count; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * worldSize * 2,
          -2,
          (Math.random() - 0.5) * worldSize * 2
        ],
        scale: 0.5 + Math.random() * 0.5,
        rotation: Math.random() * Math.PI * 2
      });
    }
    return temp;
  }, [count]);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    
    instances.forEach((instance, i) => {
      dummy.position.set(...instance.position as [number, number, number]);
      dummy.scale.setScalar(instance.scale);
      // Add wind effect
      dummy.rotation.z = Math.sin(time * 2 + i) * 0.1;
      dummy.rotation.y = instance.rotation;
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
      <coneGeometry args={[0.05, 0.3, 3]} />
      <meshStandardMaterial color="#3d8b3d" />
    </instancedMesh>
  );
};

export default Grass;
