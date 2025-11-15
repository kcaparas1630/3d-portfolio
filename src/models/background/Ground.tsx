import { RigidBody } from "@react-three/rapier";

// Enhanced ground with texture variation
const StylizedGround = () => {
  return (
    <>
      {/* Main ground plane with physics */}
      <RigidBody type="fixed">
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
          <planeGeometry args={[100, 100, 32, 32]} />
          <shaderMaterial
            vertexShader={`
              varying vec2 vUv;
              varying vec3 vPosition;
              void main() {
                vUv = uv;
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `}
            fragmentShader={`
              varying vec2 vUv;
              varying vec3 vPosition;
              
              // Simple noise function
              float noise(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
              }
              
              void main() {
                // Base grass colors
                vec3 grassColor1 = vec3(0.565, 0.698, 0.337);
                vec3 grassColor2 = vec3(0.565, 0.698, 0.337);
                vec3 dirtColor = vec3(0.4, 0.35, 0.25);
                
                // Create variation using noise
                float noiseValue = noise(vUv * 10.0);
                float largeNoise = noise(vUv * 3.0);
                
                // Mix grass colors
                vec3 grassMix = mix(grassColor1, grassColor2, noiseValue);
                
                // Add occasional dirt patches
                vec3 finalColor = mix(grassMix, dirtColor, smoothstep(0.7, 0.8, largeNoise) * 0.3);
                
                // Add subtle gradient from center
                float distFromCenter = length(vPosition.xy) / 50.0;
                finalColor *= 1.0 - distFromCenter * 0.2;
                
                gl_FragColor = vec4(finalColor, 1.0);
              }
            `}
          />
        </mesh>
      </RigidBody>
      
      {/* Shadow-receiving plane (invisible, just for shadows) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.98, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <shadowMaterial opacity={0.5} />
      </mesh>

      {/* Worn path area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.99, 0]} receiveShadow>
        <ringGeometry args={[0, 3, 32]} />
        <meshStandardMaterial color="#594d3d" opacity={0.3} transparent />
      </mesh>
    </>
  );
};

export default StylizedGround;
