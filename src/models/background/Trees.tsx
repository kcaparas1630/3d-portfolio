import { useMemo } from "react";
import { RigidBody } from "@react-three/rapier";
import { useGLTF } from "@react-three/drei";

// Trees using GLTF model with random positioning
const ProceduralTrees = ({ count = 50 }) => {
  const { scene } = useGLTF("/Background/cartoon_tree_1111232532_texture_draco.glb");

  const trees = useMemo(() => {
    const temp = [];
    const worldSize = 40;
    const minDistance = 4; // Minimum distance between trees

    // Generate tree positions with spacing
    for (let i = 0; i < count; i++) {
      let position: [number, number, number] | undefined;
      let valid = false;
      let attempts = 0;

      while (!valid && attempts < 50) {
        position = [
          (Math.random() - 0.5) * worldSize * 2,
          -0.1,
          (Math.random() - 0.5) * worldSize * 2
        ];

        // Check distance from center (keep spawn area clear)
        const distFromCenter = Math.sqrt(position[0] ** 2 + position[2] ** 2);
        if (distFromCenter < 8) {
          attempts++;
          continue;
        }

        // Check distance from other trees
        valid = true;
        for (const tree of temp) {
          const dist = Math.sqrt(
            (position[0] - tree.position[0]) ** 2 +
            (position[2] - tree.position[2]) ** 2
          );
          if (dist < minDistance) {
            valid = false;
            break;
          }
        }
        attempts++;
      }

      if (valid && position) {
        temp.push({
          position,
          scale: 2,
          rotation: Math.random() * Math.PI * 2
        });
      }
    }

    return temp;
  }, [count]);

  return (
    <>
      {trees.map((tree, i) => (
        <RigidBody key={i} type="fixed" position={tree.position}>
          <group scale={tree.scale} rotation={[0, tree.rotation, 0]}>
            <primitive object={scene.clone()} castShadow />
          </group>
        </RigidBody>
      ))}
    </>
  );
};

export default ProceduralTrees;
