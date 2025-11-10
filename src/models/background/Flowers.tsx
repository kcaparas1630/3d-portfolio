import { useMemo } from "react";

// Flowers for color variation
const Flowers = ({ count = 40 }) => {
  const instances = useMemo(() => {
    const temp = [];
    const colors = ["#ff69b4", "#ffd700", "#ff6347", "#da70d6"];
    const worldSize = 40;
    
    for (let i = 0; i < count; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * worldSize * 2,
          -1.8,
          (Math.random() - 0.5) * worldSize * 2
        ] as [number, number, number],
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    return temp;
  }, [count]);
  
  return (
    <>
      {instances.map((instance, i) => (
        <group key={i} position={instance.position}>
          <mesh>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color={instance.color} emissive={instance.color} emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[0, -0.15, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.3]} />
            <meshStandardMaterial color="#2d5a2d" />
          </mesh>
        </group>
      ))}
    </>
  );
};

export default Flowers;
