import React from 'react';
import { CubeState, Color, FaceName } from '../types';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  presetState: CubeState;
  onUpdatePreset: (newState: CubeState) => void;
}

const COLORS: Color[] = ['white', 'yellow', 'red', 'orange', 'blue', 'green'];
const colorMap: Record<Color, string> = {
  white: '#ffffff',
  yellow: '#ffff00',
  red: '#ff0000',
  orange: '#ffa500',
  blue: '#3366ff',
  green: '#22cc44',
};

export function SettingsModal({ isOpen, onClose, presetState, onUpdatePreset }: SettingsModalProps) {
  const [activeFace, setActiveFace] = React.useState<FaceName>('front');

  const updateColor = (face: FaceName, row: number, col: number, color: Color) => {
    const newState = { ...presetState };
    const newFaceColors = [...newState[face].colors];
    newFaceColors[row] = [...newFaceColors[row]];
    newFaceColors[row][col] = color;
    newState[face] = { colors: newFaceColors };
    onUpdatePreset(newState);
  };

  const setSolidColor = (face: FaceName, color: Color) => {
    const newState = { ...presetState };
    newState[face] = {
      colors: Array(3).fill(null).map(() => Array(3).fill(color))
    };
    onUpdatePreset(newState);
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4 backdrop-blur-md"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
        >
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-white tracking-widest uppercase">预设状态配置</h2>
              <span className="text-[10px] text-slate-500 font-mono tracking-tighter">矩阵核心控制系统</span>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 space-y-8">
            {/* Face Selector */}
            <div className="grid grid-cols-3 gap-2">
              {(['front', 'back', 'top', 'bottom', 'left', 'right'] as FaceName[]).map(face => (
                <button
                  key={face}
                  onClick={() => setActiveFace(face)}
                  className={`py-2 px-3 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase ${
                    activeFace === face 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {face === 'front' ? '前面' : 
                   face === 'back' ? '后面' : 
                   face === 'top' ? '上面' : 
                   face === 'bottom' ? '下面' : 
                   face === 'left' ? '左面' : '右面'}
                </button>
              ))}
            </div>

            {/* Face Editor */}
            <div className="flex flex-col items-center gap-6">
              <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-2 rounded-2xl border border-slate-800/50 shadow-inner">
                {presetState[activeFace].colors.map((row, r) => (
                  row.map((color, c) => (
                    <button
                      key={`${r}-${c}`}
                      className="w-14 h-14 rounded-lg transition-all active:scale-90 hover:scale-105 shadow-sm"
                      style={{ backgroundColor: colorMap[color] }}
                      onClick={() => {
                        const nextColor = COLORS[(COLORS.indexOf(color) + 1) % COLORS.length];
                        updateColor(activeFace, r, c, nextColor);
                      }}
                    />
                  ))
                ))}
              </div>

              {/* Color Palette Quick Set */}
              <div className="flex flex-wrap justify-center gap-3">
                {COLORS.map(color => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded-full border-2 border-slate-800/50 hover:scale-125 hover:border-white/20 transition-all shadow-md"
                    style={{ backgroundColor: colorMap[color] }}
                    onClick={() => setSolidColor(activeFace, color)}
                  />
                ))}
              </div>
            </div>
            
            <p className="text-slate-500 text-[10px] uppercase font-bold text-center tracking-widest px-4 opacity-40">
              请点击方块修改颜色，该状态将作为魔术触发后的结果
            </p>
          </div>

          <div className="p-6 bg-slate-950/50 border-t border-slate-800">
            <button 
              onClick={onClose}
              className="w-full py-4 bg-blue-600 text-white text-xs font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-blue-500 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              <Check size={18} /> 保存矩阵
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
