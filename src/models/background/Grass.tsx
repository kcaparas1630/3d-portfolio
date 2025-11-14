import { useRef, useMemo } from "react";
import { InstancedMesh, Object3D } from "three";
import { useFrame } from "@react-three/fiber";

// Grass component with instanced rendering
const Grass = ({ count = 800, worldSize = 40 }) => {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  
  const instances = useMemo(() => {
    const temp = [];
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
  }, [count, worldSize]);
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Update every 3rd frame (~20fps for wind animation)
    if (state.clock.elapsedTime % (1/20) > delta) return;

    const time = state.clock.elapsedTime;

    for (let i = 0; i < instances.length; i++) {
      const instance = instances[i];
      dummy.position.set(instance.position[0], instance.position[1], instance.position[2]);
      dummy.scale.setScalar(instance.scale);
      // Add wind effect
      dummy.rotation.z = Math.sin(time * 2 + i) * 0.1;
      dummy.rotation.y = instance.rotation;
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow frustumCulled={false}>
      <coneGeometry args={[0.05, 0.3, 3]} />
      <meshStandardMaterial color="#3d8b3d" />
    </instancedMesh>
  );
};

export default Grass;
