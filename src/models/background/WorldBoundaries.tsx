import { RigidBody } from "@react-three/rapier";

// Transparent boundary walls
const WorldBoundaries = ({ size = 40 }) => {
  return (
    <>
      {/* North wall */}
      <RigidBody type="fixed" position={[0, 0, -size]}>
        <mesh>
          <boxGeometry args={[size * 2, 4, 1]} />
          <meshStandardMaterial color="#8B7355" transparent opacity={0.1} roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* South wall */}
      <RigidBody type="fixed" position={[0, 0, size]}>
        <mesh>
          <boxGeometry args={[size * 2, 4, 1]} />
          <meshStandardMaterial color="#8B7355" transparent opacity={0.1} roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* East wall */}
      <RigidBody type="fixed" position={[size, 0, 0]}>
        <mesh>
          <boxGeometry args={[1, 4, size * 2]} />
          <meshStandardMaterial color="#8B7355" transparent opacity={0.1} roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* West wall */}
      <RigidBody type="fixed" position={[-size, 0, 0]}>
        <mesh>
          <boxGeometry args={[1, 4, size * 2]} />
          <meshStandardMaterial color="#8B7355" transparent opacity={0.1} roughness={0.9} />
        </mesh>
      </RigidBody>
    </>
  );
};

export default WorldBoundaries;
