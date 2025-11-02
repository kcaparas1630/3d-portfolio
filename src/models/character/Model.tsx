import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { AnimationMixer, AnimationAction, Group, Mesh, MeshStandardMaterial } from "three";

const Model = () => {
  const walkingGltf = useGLTF("/Character/Animations/Animation_Walking_withSkin_draco.glb");
  const idleGltf = useGLTF("/Character/Animations/Animation_Idle_02_withSkin_draco.glb");
  const secondIdleGltf = useGLTF("/Character/Animations/Animation_Idle_03_withSkin_draco.glb");

  const mixersRef = useRef<{
    idle1: AnimationMixer | null;
    idle2: AnimationMixer | null;
    walking: AnimationMixer | null;
  }>({
    idle1: null,
    idle2: null,
    walking: null,
  });

  const groupRef = useRef<Group>(null);
  const idle1Ref = useRef<Group>(null);
  const idle2Ref = useRef<Group>(null);
  const walkingRef = useRef<Group>(null);

  const [keys, setKeys] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });
  const actionsRef = useRef<{
    idle1: AnimationAction | null;
    idle2: AnimationAction | null;
    walking: AnimationAction | null;
  }>({
    idle1: null,
    idle2: null,
    walking: null,
  });
  const currentActionRef = useRef<"idle1" | "idle2" | "walking">("idle1");
  const idleTimerRef = useRef<number>(0);
  const currentIdleRef = useRef<"idle1" | "idle2">("idle1");

  useEffect(() => {
    // Setup mixers and actions for all animations
    mixersRef.current.idle1 = new AnimationMixer(idleGltf.scene);
    mixersRef.current.idle2 = new AnimationMixer(secondIdleGltf.scene);
    mixersRef.current.walking = new AnimationMixer(walkingGltf.scene);

    if (idleGltf.animations && idleGltf.animations.length > 0) {
      actionsRef.current.idle1 = mixersRef.current.idle1.clipAction(
        idleGltf.animations[0]
      );
      actionsRef.current.idle1.play();
    }

    if (secondIdleGltf.animations && secondIdleGltf.animations.length > 0) {
      actionsRef.current.idle2 = mixersRef.current.idle2.clipAction(
        secondIdleGltf.animations[0]
      );
    }

    if (walkingGltf.animations && walkingGltf.animations.length > 0) {
      actionsRef.current.walking = mixersRef.current.walking.clipAction(
        walkingGltf.animations[0]
      );
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

    fixMaterials(idleGltf.scene);
    fixMaterials(secondIdleGltf.scene);
    fixMaterials(walkingGltf.scene);

    // Set initial visibility
    if (idle1Ref.current) idle1Ref.current.visible = true;
    if (idle2Ref.current) idle2Ref.current.visible = false;
    if (walkingRef.current) walkingRef.current.visible = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") setKeys((k) => ({ ...k, forward: true }));
      if (e.key === "ArrowDown") setKeys((k) => ({ ...k, backward: true }));
      if (e.key === "ArrowLeft") setKeys((k) => ({ ...k, left: true }));
      if (e.key === "ArrowRight") setKeys((k) => ({ ...k, right: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") setKeys((k) => ({ ...k, forward: false }));
      if (e.key === "ArrowDown") setKeys((k) => ({ ...k, backward: false }));
      if (e.key === "ArrowLeft") setKeys((k) => ({ ...k, left: false }));
      if (e.key === "ArrowRight") setKeys((k) => ({ ...k, right: false }));
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [walkingGltf, idleGltf, secondIdleGltf]);

  useFrame((_state, delta) => {
    // Update all mixers
    mixersRef.current.idle1?.update(delta);
    mixersRef.current.idle2?.update(delta);
    mixersRef.current.walking?.update(delta);

    if (groupRef.current) {
      const moveSpeed = 2 * delta;
      const rotateSpeed = 3 * delta;
      const isMoving = keys.forward || keys.backward;

      // Handle idle animation cycling every 5 seconds
      if (!isMoving) {
        idleTimerRef.current += delta;

        if (idleTimerRef.current >= 5) {
          idleTimerRef.current = 0;

          // Switch to the other idle animation
          if (currentIdleRef.current === "idle1") {
            // Switch to idle2
            if (idle1Ref.current) idle1Ref.current.visible = false;
            if (idle2Ref.current) idle2Ref.current.visible = true;
            actionsRef.current.idle2?.reset().play();
            currentIdleRef.current = "idle2";
            currentActionRef.current = "idle2";
          } else {
            // Switch back to idle1
            if (idle2Ref.current) idle2Ref.current.visible = false;
            if (idle1Ref.current) idle1Ref.current.visible = true;
            actionsRef.current.idle1?.reset().play();
            currentIdleRef.current = "idle1";
            currentActionRef.current = "idle1";
          }
        }
      }

      // Switch between idle and walking animations
      if (isMoving && currentActionRef.current !== "walking") {
        // Switch to walking
        if (idle1Ref.current) idle1Ref.current.visible = false;
        if (idle2Ref.current) idle2Ref.current.visible = false;
        if (walkingRef.current) walkingRef.current.visible = true;
        actionsRef.current.walking?.reset().play();
        currentActionRef.current = "walking";
        idleTimerRef.current = 0; // Reset timer
      } else if (!isMoving && currentActionRef.current === "walking") {
        // Always return to idle1 after walking
        if (walkingRef.current) walkingRef.current.visible = false;
        if (idle1Ref.current) idle1Ref.current.visible = true;
        actionsRef.current.idle1?.reset().play();
        currentActionRef.current = "idle1";
        currentIdleRef.current = "idle1";
        idleTimerRef.current = 0; // Reset timer to start fresh
      }

      // Rotation
      if (keys.left) groupRef.current.rotation.y -= rotateSpeed;
      if (keys.right) groupRef.current.rotation.y += rotateSpeed;

      // Movement in the direction the character is facing
      if (keys.forward) {
        groupRef.current.position.x +=
          Math.sin(groupRef.current.rotation.y) * moveSpeed;
        groupRef.current.position.z +=
          Math.cos(groupRef.current.rotation.y) * moveSpeed;
      }
      if (keys.backward) {
        groupRef.current.position.x -=
          Math.sin(groupRef.current.rotation.y) * moveSpeed;
        groupRef.current.position.z -=
          Math.cos(groupRef.current.rotation.y) * moveSpeed;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={idle1Ref}>
        <primitive object={idleGltf.scene} scale={1} />
      </group>
      <group ref={idle2Ref}>
        <primitive object={secondIdleGltf.scene} scale={1} />
      </group>
      <group ref={walkingRef}>
        <primitive object={walkingGltf.scene} scale={1} />
      </group>
    </group>
  );
};

export default Model;
