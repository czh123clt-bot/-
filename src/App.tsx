import React, { useState, useCallback, useRef, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Center, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Settings, Wand2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RubiksCube } from './components/RubiksCube';
import { SettingsModal } from './components/SettingsModal';
import { createSolvedCube, CubeState, FaceName } from './types';
import { rotateFace } from './utils';

function TrickDetector({ onFrontDetected }: { onFrontDetected: (face: FaceName) => void }) {
  const { camera } = useThree();
  
  React.useEffect(() => {
    // This is exposed globally so the trigger can call it
    (window as any).getFrontFace = () => {
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      dir.negate(); // Dir towards camera from center

      const faces: Record<FaceName, THREE.Vector3> = {
        front: new THREE.Vector3(0, 0, 1),
        back: new THREE.Vector3(0, 0, -1),
        top: new THREE.Vector3(0, 1, 0),
        bottom: new THREE.Vector3(0, -1, 0),
        left: new THREE.Vector3(-1, 0, 0),
        right: new THREE.Vector3(1, 0, 0),
      };

      let maxDot = -Infinity;
      let frontFace: FaceName = 'front';

      Object.entries(faces).forEach(([name, vec]) => {
        const dot = vec.dot(dir);
        if (dot > maxDot) {
          maxDot = dot;
          frontFace = name as FaceName;
        }
      });

      return frontFace;
    };
  }, [camera]);

  return null;
}

export default function App() {
  const [cubeState, setCubeState] = useState<CubeState>(createSolvedCube());
  const [presetState, setPresetState] = useState<CubeState>(createSolvedCube());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTrickActive, setIsTrickActive] = useState(false);
  const [frozenFace, setFrozenFace] = useState<FaceName | null>(null);
  const [showHint, setShowHint] = useState(true);

  const handleRotate = (face: FaceName) => {
    setCubeState(prev => rotateFace(prev, face));
  };

  const triggerTrick = useCallback(() => {
    if (isTrickActive) return;

    const currentFront = (window as any).getFrontFace?.() as FaceName;
    if (!currentFront) return;

    setFrozenFace(currentFront);
    setIsTrickActive(true);
    
    const nextState = { ...presetState };
    nextState[currentFront] = cubeState[currentFront];
    setCubeState(nextState);
  }, [isTrickActive, cubeState, presetState]);

  const handleFaceHidden = useCallback((faceName: string) => {
    if (isTrickActive && faceName === frozenFace) {
      setCubeState(prev => ({
        ...prev,
        [faceName]: presetState[faceName as FaceName]
      }));
      setIsTrickActive(false);
      setFrozenFace(null);
    }
  }, [isTrickActive, frozenFace, presetState]);

  return (
    <div className="relative w-full h-full bg-slate-950 text-slate-200 font-sans flex flex-col overflow-hidden select-none">
      {/* 3D Scene Container */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows gl={{ antialias: true }}>
          <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={45} />
          <OrbitControls 
            enablePan={false} 
            minDistance={4} 
            maxDistance={10}
            autoRotate={!isTrickActive && !isSettingsOpen}
            autoRotateSpeed={0.5}
            makeDefault
          />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} castShadow />
          <Suspense fallback={null}>
            <Center>
              <RubiksCube 
                cubeState={cubeState} 
                trickActive={isTrickActive}
                onFaceHidden={handleFaceHidden}
                onRotate={handleRotate}
              />
            </Center>
            <ContactShadows opacity={0.4} scale={10} blur={2} far={10} />
            <Environment preset="city" />
            <TrickDetector onFrontDetected={() => {}} />
          </Suspense>
        </Canvas>
      </div>

      {/* Header Navigation */}
      <header className="flex justify-between items-center px-4 md:px-10 py-4 md:py-8 z-20 pointer-events-none sticky top-0">
        <div className="flex items-center gap-2 md:gap-4 pointer-events-auto">
          {isTrickActive ? (
            <button className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/40 rounded-xl text-red-400 font-bold whitespace-nowrap">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
              <span className="uppercase tracking-widest text-[9px] md:text-xs">锁定中</span>
            </button>
          ) : (
            <button 
              onClick={triggerTrick}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/20 border border-white/10 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all active:scale-95"
            >
              <Wand2 size={14} />
              <span className="uppercase tracking-widest text-[9px] md:text-xs font-bold">启动魔法</span>
            </button>
          )}
        </div>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-sm md:text-xl font-bold tracking-[0.2em] md:tracking-[0.4em] uppercase text-white pointer-events-none whitespace-nowrap">
          魔方<span className="text-blue-500 font-light">实验室</span>
        </h1>

        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 md:px-6 md:py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-100 font-medium hover:bg-slate-700 transition-all pointer-events-auto active:scale-95"
        >
          <Settings size={18} className="opacity-70" />
          <span className="hidden md:inline ml-2 uppercase tracking-widest text-xs font-bold">预设配置</span>
        </button>
      </header>

      {/* Side Preset Panel - Minimized on mobile */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10 pointer-events-none opacity-60 md:opacity-100">
        <div className="hidden md:block text-[9px] uppercase tracking-[0.3em] font-black text-slate-500 mb-1 px-1">当前预设</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 p-1 bg-slate-900/30 rounded-xl border border-slate-800/50 backdrop-blur-sm">
          {(['front', 'top', 'bottom', 'left', 'right', 'back'] as FaceName[]).map(face => (
            <div key={face} className="w-4 h-4 md:w-6 md:h-6 rounded-md border border-slate-700/30"
              style={{ backgroundColor: presetState[face].colors[1][1] === 'white' ? '#fff' : 
                          presetState[face].colors[1][1] === 'orange' ? '#f97316' :
                          presetState[face].colors[1][1] === 'blue' ? '#2563eb' :
                          presetState[face].colors[1][1] === 'green' ? '#22c55e' :
                          presetState[face].colors[1][1] === 'red' ? '#ef4444' : '#eab308' }}
            >
            </div>
          ))}
        </div>
      </div>

      {/* Main Viewport Content Placeholder - Just ensures touch events are handled */}
      <main className="flex-1" />

      {/* Footer Controls - Compact for Mobile */}
      <footer className="px-6 py-6 md:py-10 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent z-20 pointer-events-none">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center md:items-end md:justify-between gap-4">
          <div className="hidden md:flex gap-6 pointer-events-auto">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">交互灵敏度</span>
              <div className="w-40 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-blue-500"></div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Minimal Rotate Hint for Desktop */}
            <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] uppercase font-bold tracking-widest text-slate-500">
              滑动魔方表面即可扭转相应层
            </div>

            <button 
              onClick={() => setCubeState(createSolvedCube())}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] text-[10px] md:text-xs rounded-xl shadow-xl active:scale-95 transition-all"
            >
              重置系统
            </button>
            {isTrickActive && (
              <button 
                onClick={() => setIsTrickActive(false)}
                className="p-3 bg-red-600 text-white border border-white/5 rounded-xl transition-all active:scale-95"
                title="取消魔法"
              >
                <Wand2 size={16} />
              </button>
            )}
          </div>
        </div>
      </footer>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        presetState={presetState}
        onUpdatePreset={setPresetState}
      />
    </div>
  );
}
