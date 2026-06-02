import { useFrame } from '@react-three/fiber';
import { useRef, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { FaceName, CubeState, Color } from '../types';

interface RubiksCubeProps {
  cubeState: CubeState;
  onRotationEnd?: (newState: CubeState) => void;
  trickActive: boolean;
  onFaceHidden?: (faceName: string) => void;
}

const SIZE = 1.0;
const GAP = 0.05;

const colorMap: Record<Color, string> = {
  white: '#ffffff',
  yellow: '#ffff00',
  red: '#ff0000',
  orange: '#ffa500',
  blue: '#0000ff',
  green: '#00ff00',
};

// Simplified piece representation
export function Piece({ position, colors, onRotate }: { 
  position: [number, number, number], 
  colors: Record<string, Color | null>, 
  onRotate?: (face: string) => void 
}) {
  const meshRef = useRef<THREE.Group>(null);
  const pointerDownRef = useRef<{ x: number, y: number, face: string } | null>(null);

  const materials = useMemo(() => {
    // 0: right, 1: left, 2: top, 3: bottom, 4: front, 5: back
    const order: string[] = ['right', 'left', 'top', 'bottom', 'front', 'back'];
    return order.map(side => (
      <meshStandardMaterial 
        key={side} 
        attach={`material-${order.indexOf(side)}`} 
        color={colors[side] ? colorMap[colors[side] as Color] : '#111111'} 
        roughness={0.1}
        metalness={0.1}
      />
    ));
  }, [colors]);

  return (
    <group 
      position={position} 
      ref={meshRef}
      onPointerDown={(e) => {
        e.stopPropagation();
        if (e.face) {
          const normal = e.face.normal;
          let face = '';
          if (normal.z > 0.5) face = 'front';
          else if (normal.z < -0.5) face = 'back';
          else if (normal.y > 0.5) face = 'top';
          else if (normal.y < -0.5) face = 'bottom';
          else if (normal.x > 0.5) face = 'right';
          else if (normal.x < -0.5) face = 'left';
          pointerDownRef.current = { x: e.clientX, y: e.clientY, face };
        }
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        if (!pointerDownRef.current) return;

        const dx = e.clientX - pointerDownRef.current.x;
        const dy = e.clientY - pointerDownRef.current.y;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 10) {
          // It's a tap - just rotate the face clicked
          const face = pointerDownRef.current.face;
          if (face) onRotate?.(face);
        } else if (distance > 30) {
          // It's a swipe/flick - rotate the layer
          const startFace = pointerDownRef.current.face;
          const [px, py, pz] = [Math.round(position[0]/(SIZE+GAP)), Math.round(position[1]/(SIZE+GAP)), Math.round(position[2]/(SIZE+GAP))];
          
          if (startFace === 'front') {
            if (absX > absY) { // Horizontal
              if (py === 1) onRotate?.('top');
              else if (py === -1) onRotate?.('bottom');
              else onRotate?.('front');
            } else { // Vertical
              if (px === -1) onRotate?.('left');
              else if (px === 1) onRotate?.('right');
              else onRotate?.('front');
            }
          } else if (startFace === 'back') {
            if (absX > absY) {
              if (py === 1) onRotate?.('top');
              else if (py === -1) onRotate?.('bottom');
              else onRotate?.('back');
            } else {
              if (px === -1) onRotate?.('right'); // flipped for back
              else if (px === 1) onRotate?.('left');
              else onRotate?.('back');
            }
          } else if (startFace === 'top') {
            if (absX > absY) {
              if (pz === -1) onRotate?.('back');
              else if (pz === 1) onRotate?.('front');
              else onRotate?.('top');
            } else {
              if (px === -1) onRotate?.('left');
              else if (px === 1) onRotate?.('right');
              else onRotate?.('top');
            }
          } else if (startFace === 'bottom') {
            if (absX > absY) {
              if (pz === -1) onRotate?.('back');
              else if (pz === 1) onRotate?.('front');
              else onRotate?.('bottom');
            } else {
              if (px === -1) onRotate?.('left');
              else if (px === 1) onRotate?.('right');
              else onRotate?.('bottom');
            }
          } else if (startFace === 'left') {
            if (absX > absY) {
              if (pz === -1) onRotate?.('back');
              else if (pz === 1) onRotate?.('front');
              else onRotate?.('left');
            } else {
              if (py === 1) onRotate?.('top');
              else if (py === -1) onRotate?.('bottom');
              else onRotate?.('left');
            }
          } else if (startFace === 'right') {
            if (absX > absY) {
              if (pz === -1) onRotate?.('back');
              else if (pz === 1) onRotate?.('front');
              else onRotate?.('right');
            } else {
              if (py === 1) onRotate?.('top');
              else if (py === -1) onRotate?.('bottom');
              else onRotate?.('right');
            }
          }
        }
        pointerDownRef.current = null;
      }}
    >
      <mesh>
        <boxGeometry args={[SIZE, SIZE, SIZE]} />
        {materials}
      </mesh>
      {/* Black borders for individual cublets */}
      <mesh>
        <boxGeometry args={[SIZE + 0.01, SIZE + 0.01, SIZE + 0.01]} />
        <meshBasicMaterial color="#000000" wireframe />
      </mesh>
    </group>
  );
}

export function RubiksCube({ cubeState, trickActive, onFaceHidden, onRotate }: RubiksCubeProps & { onRotate?: (face: FaceName) => void }) {
  const groupRef = useRef<THREE.Group>(null);

  // Generate pieces based on cubeState
  const pieces = useMemo(() => {
    const result = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue;

          // Mapping logic for standard Rubik's cube grid
          const colors: Record<string, Color | null> = {
            front: z === 1 ? cubeState.front.colors[1 - y][x + 1] : null,
            back: z === -1 ? cubeState.back.colors[1 - y][1 - x] : null,
            top: y === 1 ? cubeState.top.colors[z + 1][x + 1] : null,
            bottom: y === -1 ? cubeState.bottom.colors[1 - z][x + 1] : null,
            right: x === 1 ? cubeState.right.colors[1 - y][1 - z] : null,
            left: x === -1 ? cubeState.left.colors[1 - y][z + 1] : null,
          };

          result.push({
            id: `${x}${y}${z}`,
            pos: [x * (SIZE + GAP), y * (SIZE + GAP), z * (SIZE + GAP)] as [number, number, number],
            colors
          });
        }
      }
    }
    return result;
  }, [cubeState]);

  // Check visibility for the "Trick"
  useFrame((state) => {
    if (!trickActive || !groupRef.current) return;

    const cameraDirection = new THREE.Vector3();
    state.camera.getWorldDirection(cameraDirection);

    // Faces normals in local space
    const faceNormals: Record<FaceName, THREE.Vector3> = {
      front: new THREE.Vector3(0, 0, 1),
      back: new THREE.Vector3(0, 0, -1),
      top: new THREE.Vector3(0, 1, 0),
      bottom: new THREE.Vector3(0, -1, 0),
      left: new THREE.Vector3(-1, 0, 0),
      right: new THREE.Vector3(1, 0, 0),
    };

    // Transform local normals to world normals
    Object.entries(faceNormals).forEach(([name, localNormal]) => {
      const worldNormal = localNormal.clone().applyQuaternion(groupRef.current!.quaternion);
      const dot = worldNormal.dot(cameraDirection.negate()); // Vector towards camera
      
      // If the face is facing away from camera (dot < 0), trigger hidden update
      if (dot < -0.1) {
        onFaceHidden?.(name);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {pieces.map(p => (
        <Piece 
          key={p.id} 
          position={p.pos} 
          colors={p.colors} 
          onRotate={(face) => onRotate?.(face as FaceName)} 
        />
      ))}
    </group>
  );
}
