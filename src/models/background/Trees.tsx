import { useMemo } from "react";
import { RigidBody } from "@react-three/rapier";

// Procedurally generated trees with physics
const ProceduralTrees = ({ count = 50 }) => {
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
          -2,
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
          scale: 0.8 + Math.random() * 0.4,
          rotation: Math.random() * Math.PI * 2,
          type: Math.random() > 0.3 ? 'pine' : 'round' // Two tree types
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
            {/* Trunk */}
            <mesh position={[0, 0.5, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.3, 2]} />
              <meshStandardMaterial color="#654321" roughness={0.8} />
            </mesh>
            
            {tree.type === 'pine' ? (
              <>
                {/* Pine tree foliage */}
                <mesh position={[0, 2, 0]} castShadow>
                  <coneGeometry args={[1.5, 2, 6]} />
                  <meshStandardMaterial color="#2d5a2d" roughness={0.7} />
                </mesh>
                <mesh position={[0, 3, 0]} castShadow>
                  <coneGeometry args={[1.2, 1.5, 6]} />
                  <meshStandardMaterial color="#2d5a2d" roughness={0.7} />
                </mesh>
              </>
            ) : (
              <>
                {/* Round tree foliage */}
                <mesh position={[0, 2.2, 0]} castShadow>
                  <sphereGeometry args={[1.8, 8, 6]} />
                  <meshStandardMaterial color="#3a6b3a" roughness={0.8} />
                </mesh>
              </>
            )}
          </group>
        </RigidBody>
      ))}
    </>
  );
};

export default ProceduralTrees;
