export type Color = 'white' | 'yellow' | 'red' | 'orange' | 'blue' | 'green';

export interface FaceState {
  colors: Color[][]; // 3x3 grid
}

export interface CubeState {
  front: FaceState;
  back: FaceState;
  top: FaceState;
  bottom: FaceState;
  left: FaceState;
  right: FaceState;
}

export type FaceName = 'front' | 'back' | 'top' | 'bottom' | 'left' | 'right';

export const INITIAL_COLORS: Record<FaceName, Color> = {
  front: 'white',
  back: 'yellow',
  top: 'blue',
  bottom: 'green',
  left: 'orange',
  right: 'red',
};

export const createSolvedFace = (color: Color): FaceState => ({
  colors: Array(3).fill(null).map(() => Array(3).fill(color)),
});

export const createSolvedCube = (): CubeState => ({
  front: createSolvedFace(INITIAL_COLORS.front),
  back: createSolvedFace(INITIAL_COLORS.back),
  top: createSolvedFace(INITIAL_COLORS.top),
  bottom: createSolvedFace(INITIAL_COLORS.bottom),
  left: createSolvedFace(INITIAL_COLORS.left),
  right: createSolvedFace(INITIAL_COLORS.right),
});
