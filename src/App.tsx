import React, { useState, useCallback, useRef, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Center, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Settings, Wand2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RubiksCube } from './components/RubiksCube';
import { SettingsModal } from './components/SettingsModal';
import { createSolvedCube, CubeState, FaceName } from './types';
import { rotateFace, rotateLayer } from './utils';

function TrickDetector({ onFrontDetected }: { onFrontDetected: (face: FaceName) => void }) {
  const { camera } = useThree();
  
  React.useEffect(() => {
    // This is exposed globally so the trigger can call it
    (window as any).getVisibleFaces = () => {
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      dir.negate(); // Dir towards camera from center

      const cubeGroup = camera.parent?.getObjectByName('rubiks-cube-group');
      const quat = cubeGroup ? cubeGroup.quaternion : new THREE.Quaternion();

      const faces: Record<FaceName, THREE.Vector3> = {
        front: new THREE.Vector3(0, 0, 1),
        back: new THREE.Vector3(0, 0, -1),
        top: new THREE.Vector3(0, 1, 0),
        bottom: new THREE.Vector3(0, -1, 0),
        left: new THREE.Vector3(-1, 0, 0),
        right: new THREE.Vector3(1, 0, 0),
      };

      const visible: FaceName[] = [];
      Object.entries(faces).forEach(([name, localVec]) => {
        const worldVec = localVec.clone().applyQuaternion(quat);
        const dot = worldVec.dot(dir);
        if (dot > -0.2) { // Extremely generous threshold: if it's even slightly facing the camera, don't swap it
          visible.push(name as FaceName);
        }
      });

      return visible;
    };
  }, [camera]);

  return null;
}

export default function App() {
  const [cubeState, setCubeState] = useState<CubeState>(createSolvedCube());
  const [presetState, setPresetState] = useState<CubeState>(createSolvedCube());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTrickActive, setIsTrickActive] = useState(false);
  const [frozenFaces, setFrozenFaces] = useState<FaceName[]>([]);
  const [showHint, setShowHint] = useState(true);

  const [isInteracting, setIsInteracting] = useState(false);
  const orbitalControlsRef = useRef<any>(null);

  const handleLayerRotate = (axis: 'x' | 'y' | 'z', layer: number, clockwise: boolean = true) => {
    setCubeState(prev => rotateLayer(prev, axis, layer, clockwise));
  };

  const triggerTrick = useCallback(() => {
    if (isTrickActive) return;

    const visibleFaces = (window as any).getVisibleFaces?.() as FaceName[];
    if (!visibleFaces || visibleFaces.length === 0) return;

    setFrozenFaces(visibleFaces);
    setIsTrickActive(true);
    
    // Swap all faces EXCEPT the visible ones to the preset state
    setCubeState(prev => {
      const next = { ...prev };
      (Object.keys(presetState) as FaceName[]).forEach(face => {
        if (!visibleFaces.includes(face)) {
          next[face] = presetState[face];
        }
      });
      return next;
    });
  }, [isTrickActive, presetState]);

  const handleFaceHidden = useCallback((faceName: string) => {
    if (isTrickActive) {
      setFrozenFaces(prev => {
        if (!prev.includes(faceName as FaceName)) return prev;

        // Face was visible, now it's hidden - update its state to solved
        setCubeState(curr => ({
          ...curr,
          [faceName]: presetState[faceName as FaceName]
        }));

        const next = prev.filter(f => f !== faceName);
        if (next.length === 0) {
          setIsTrickActive(false);
        }
        return next;
      });
    }
  }, [isTrickActive, presetState]);

  return (
    <div className="relative w-full h-screen bg-[#0d0d0d] text-slate-200 font-sans flex flex-col overflow-hidden select-none">
      {/* Invisible Trigger Area (Top Left) - Large hit area */}
      <div 
        className="absolute top-0 left-0 w-32 h-32 z-50 cursor-default pointer-events-auto"
        onClick={triggerTrick}
      />

      {/* Stealth Indicator Dot (Only shown when trick is active/primed) */}
      {isTrickActive && (
        <div className="absolute top-8 left-8 w-1 h-1 z-40 rounded-full bg-zinc-800/80 pointer-events-none" />
      )}

      {/* Main 3D Canvas - Full Screen Absolute */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows gl={{ antialias: true, alpha: true }} touch-action="none">
          <PerspectiveCamera makeDefault position={[0, 0, 18]} fov={30} />
          <OrbitControls 
            ref={orbitalControlsRef}
            enabled={!isInteracting}
            enablePan={false} 
            minDistance={10} 
            maxDistance={25}
            autoRotate={false}
            autoRotateSpeed={0.4}
            target={[0, 0, 0]}
            makeDefault
          />
          <ambientLight intensity={1.5} />
          <pointLight position={[10, 10, 10]} intensity={2} />
          <pointLight position={[-10, -10, -10]} intensity={1} color="#444" />
          <Suspense fallback={null}>
            <Center>
              <RubiksCube 
                cubeState={cubeState} 
                trickActive={isTrickActive}
                onFaceHidden={handleFaceHidden}
                onLayerRotate={handleLayerRotate}
                onInteractionStatusChange={setIsInteracting}
              />
            </Center>
            <ContactShadows opacity={0.3} scale={10} blur={4} far={10} verticalOffset={-1.5} />
            <TrickDetector onFrontDetected={() => {}} />
          </Suspense>
          {/* Environment loaded separately to avoid blocking the main view if it's slow */}
          <Suspense fallback={null}>
            <Environment preset="city" />
          </Suspense>
        </Canvas>
      </div>

      {/* Main Layout Overlay */}
      <div className="relative flex-1 flex flex-col z-10 pointer-events-none">
        
        {/* Settings area - visually hidden but functional */}
        <div className="absolute top-0 right-0 w-32 h-32 pointer-events-auto">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-full h-full opacity-0 cursor-default"
            aria-label="Settings"
          >
            <Settings size={1} />
          </button>
        </div>

        {/* Status Indicators */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-10 opacity-10">
          {(['front', 'top', 'bottom', 'left', 'right', 'back'] as FaceName[]).map(face => (
            <div key={face} className="w-2 h-2 rounded-full border border-white/10"
              style={{ backgroundColor: presetState[face].colors[1][1] === 'white' ? '#fff' : 
                          presetState[face].colors[1][1] === 'orange' ? '#f97316' :
                          presetState[face].colors[1][1] === 'blue' ? '#2563eb' :
                          presetState[face].colors[1][1] === 'green' ? '#22c55e' :
                          presetState[face].colors[1][1] === 'red' ? '#ef4444' : '#eab308' }}
            />
          ))}
        </div>

        <main className="flex-1" />

        {/* Footer Area */}
        <footer className="px-6 py-12 flex flex-col gap-6 shrink-0 bg-gradient-to-t from-black/40 to-transparent">
          {/* Action Buttons row */}
          <div className="flex items-center justify-center gap-4 max-w-sm mx-auto w-full pointer-events-auto">
            <button 
              onClick={() => setCubeState(createSolvedCube())}
              className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white font-bold text-[13px] rounded-2xl transition-all active:scale-95 border border-white/5 backdrop-blur-md shadow-2xl"
            >
              还原
            </button>
            
            <button 
              onClick={() => {
                setCubeState(createSolvedCube());
                setIsTrickActive(false);
                setFrozenFaces([]);
              }}
              className="px-10 py-4 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white font-bold text-[13px] rounded-2xl transition-all active:scale-95 border border-white/5 backdrop-blur-md shadow-2xl"
            >
              重置
            </button>
          </div>

          <p className="text-[9px] text-zinc-600 uppercase tracking-[0.2em] font-medium text-center opacity-60">
            物理感应：滑动魔方模块进行扭转
          </p>
        </footer>
      </div>


      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        presetState={presetState}
        onUpdatePreset={setPresetState}
      />
    </div>
  );
}
