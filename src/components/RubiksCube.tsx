import { useFrame } from '@react-three/fiber';
import { useRef, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { FaceName, CubeState, Color } from '../types';

interface RubiksCubeProps {
  cubeState: CubeState;
  onRotationEnd?: (newState: CubeState) => void;
  trickActive: boolean;
  onFaceHidden?: (faceName: string) => void;
  onLayerRotate?: (axis: 'x' | 'y' | 'z', layer: number, clockwise: boolean) => void;
  onInteractionStatusChange?: (isInteracting: boolean) => void;
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

export function RubiksCube({ 
  cubeState, 
  trickActive, 
  onFaceHidden, 
  onLayerRotate,
  onInteractionStatusChange 
}: RubiksCubeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [rotationGroup, setRotationGroup] = useState<{
    pieces: string[];
    axis: THREE.Vector3;
    angle: number;
    axisLabel: 'x' | 'y' | 'z';
    layer: number;
  } | null>(null);

  const interactionRef = useRef({
    isDragging: false,
    startPos: { x: 0, y: 0 },
    currentPieceId: null as string | null,
    startFace: null as string | null,
    hasDeterminedAxis: false,
  });

  // Generate pieces data
  const piecesData = useMemo(() => {
    const result = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue;

          const colors: Record<string, Color | null> = {
            front: z === 1 ? cubeState.front.colors[1 - y][x + 1] : null,
            back: z === -1 ? cubeState.back.colors[1 - y][1 - x] : null,
            top: y === 1 ? cubeState.top.colors[z + 1][x + 1] : null,
            bottom: y === -1 ? cubeState.bottom.colors[1 - z][x + 1] : null,
            right: x === 1 ? cubeState.right.colors[1 - y][1 - z] : null,
            left: x === -1 ? cubeState.left.colors[1 - y][z + 1] : null,
          };

          result.push({
            id: `${x},${y},${z}`,
            gridPos: [x, y, z] as [number, number, number],
            pos: [x * (SIZE + GAP), y * (SIZE + GAP), z * (SIZE + GAP)] as [number, number, number],
            colors
          });
        }
      }
    }
    return result;
  }, [cubeState]);

  const materials = useMemo(() => {
    const order: string[] = ['right', 'left', 'top', 'bottom', 'front', 'back'];
    return (colors: Record<string, Color | null>) => {
      return order.map(side => (
        <meshStandardMaterial 
          key={side} 
          attach={`material-${order.indexOf(side)}`} 
          color={colors[side] ? colorMap[colors[side] as Color] : '#111111'} 
          roughness={0.1}
          metalness={0.1}
        />
      ));
    };
  }, []);

  const handlePointerDown = (e: any, pieceId: string, face: string) => {
    e.stopPropagation();
    interactionRef.current = {
      isDragging: true,
      startPos: { x: e.clientX, y: e.clientY },
      currentPieceId: pieceId,
      startFace: face,
      hasDeterminedAxis: false,
    };
    onInteractionStatusChange?.(true);
  };

  const handlePointerMove = (e: any) => {
    if (!interactionRef.current.isDragging) return;
    const { startPos, currentPieceId, startFace, hasDeterminedAxis } = interactionRef.current;
    
    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (!hasDeterminedAxis && dist > 15) {
      const coord = currentPieceId!.split(',').map(Number);
      const px = coord[0], py = coord[1], pz = coord[2];
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      
      let axisLabel: 'x' | 'y' | 'z' | null = null;
      let layer = 0;
      let rotationAxis = new THREE.Vector3();

      if (startFace === 'front' || startFace === 'back') {
        if (absX > absY) {
          axisLabel = 'y'; layer = py; rotationAxis.set(0, 1, 0);
        } else {
          axisLabel = 'x'; layer = px; rotationAxis.set(1, 0, 0);
        }
      } else if (startFace === 'top' || startFace === 'bottom') {
        if (absX > absY) {
          axisLabel = 'z'; layer = pz; rotationAxis.set(0, 0, 1);
        } else {
          axisLabel = 'x'; layer = px; rotationAxis.set(1, 0, 0);
        }
      } else if (startFace === 'left' || startFace === 'right') {
        if (absX > absY) {
          axisLabel = 'z'; layer = pz; rotationAxis.set(0, 0, 1);
        } else {
          axisLabel = 'y'; layer = py; rotationAxis.set(0, 1, 0);
        }
      }

      if (axisLabel !== null) {
        interactionRef.current.hasDeterminedAxis = true;
        const layerPieces: string[] = piecesData
          .filter(p => {
            if (axisLabel === 'x') return p.gridPos[0] === layer;
            if (axisLabel === 'y') return p.gridPos[1] === layer;
            if (axisLabel === 'z') return p.gridPos[2] === layer;
            return false;
          })
          .map(p => p.id);

        setRotationGroup({
          pieces: layerPieces,
          axis: rotationAxis,
          angle: 0,
          axisLabel,
          layer
        });
      }
    }

    if (interactionRef.current.hasDeterminedAxis && rotationGroup) {
      const dragFactor = 0.015;
      let angleDelta = (Math.abs(dx) > Math.abs(dy) ? dx : -dy) * dragFactor;
      
      // Fine-tune directions based on face
      if (rotationGroup.axisLabel === 'y' && startFace === 'back') angleDelta *= -1;
      if (rotationGroup.axisLabel === 'z' && startFace === 'top') angleDelta *= -1;
      if (rotationGroup.axisLabel === 'x' && startFace === 'top') angleDelta *= -1;
      if (rotationGroup.axisLabel === 'z' && startFace === 'left') angleDelta *= -1;

      setRotationGroup(prev => prev ? { ...prev, angle: angleDelta } : null);
    }
  };

  const handlePointerUp = () => {
    if (interactionRef.current.isDragging) {
      if (rotationGroup && Math.abs(rotationGroup.angle) > 0.4) {
        let clockwise = rotationGroup.angle < 0;
        
        // Final normalization to match target clockwise behavior in utils.ts
        if (rotationGroup.axisLabel === 'x') {
           if (interactionRef.current.startFace === 'top') clockwise = rotationGroup.angle > 0;
           if (interactionRef.current.startFace === 'front') clockwise = rotationGroup.angle > 0;
        }
        if (rotationGroup.axisLabel === 'z') {
           if (interactionRef.current.startFace === 'top') clockwise = rotationGroup.angle > 0;
           if (interactionRef.current.startFace === 'left') clockwise = rotationGroup.angle > 0;
        }
        if (rotationGroup.axisLabel === 'y') {
           clockwise = rotationGroup.angle > 0;
        }

        onLayerRotate?.(rotationGroup.axisLabel, rotationGroup.layer, clockwise);
      }
      interactionRef.current.isDragging = false;
      setRotationGroup(null);
      onInteractionStatusChange?.(false);
    }
  };

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [rotationGroup, piecesData]);

  useFrame((state) => {
    if (!trickActive || !groupRef.current) return;
    const cameraDirection = new THREE.Vector3();
    state.camera.getWorldDirection(cameraDirection);
    const faceNormals: Record<FaceName, THREE.Vector3> = {
      front: new THREE.Vector3(0, 0, 1),
      back: new THREE.Vector3(0, 0, -1),
      top: new THREE.Vector3(0, 1, 0),
      bottom: new THREE.Vector3(0, -1, 0),
      left: new THREE.Vector3(-1, 0, 0),
      right: new THREE.Vector3(1, 0, 0),
    };
    Object.entries(faceNormals).forEach(([name, localNormal]) => {
      const worldNormal = localNormal.clone().applyQuaternion(groupRef.current!.quaternion);
      const dot = worldNormal.dot(cameraDirection.negate());
      if (dot < -0.4) onFaceHidden?.(name);
    });
  });

  return (
    <group ref={groupRef} name="rubiks-cube-group">
      {piecesData.map(p => {
        const isRotating = rotationGroup?.pieces.includes(p.id);
        
        let dynamicPos = p.pos;
        let dynamicQuat = new THREE.Quaternion();
        
        if (isRotating && rotationGroup) {
          dynamicQuat.setFromAxisAngle(rotationGroup.axis, rotationGroup.angle);
          const vPos = new THREE.Vector3(...p.pos);
          vPos.applyQuaternion(dynamicQuat);
          dynamicPos = [vPos.x, vPos.y, vPos.z];
        }

        return (
          <group 
            key={p.id} 
            position={dynamicPos} 
            quaternion={dynamicQuat}
            onPointerDown={(e) => {
              const normal = e.face?.normal;
              if (normal) {
                let face = '';
                if (normal.z > 0.5) face = 'front';
                else if (normal.z < -0.5) face = 'back';
                else if (normal.y > 0.5) face = 'top';
                else if (normal.y < -0.5) face = 'bottom';
                else if (normal.x > 0.5) face = 'right';
                else if (normal.x < -0.5) face = 'left';
                handlePointerDown(e, p.id, face);
              }
            }}
          >
            <mesh>
              <boxGeometry args={[SIZE, SIZE, SIZE]} />
              {materials(p.colors)}
            </mesh>
            <mesh>
              <boxGeometry args={[SIZE + 0.01, SIZE + 0.01, SIZE + 0.01]} />
              <meshBasicMaterial color="#000000" wireframe />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
