import { CubeState, FaceName, Color } from './types';

/**
 * Rotates a 3x3 matrix 90 degrees clockwise
 */
function rotate90CW(matrix: Color[][]): Color[][] {
  const n = matrix.length;
  const newMatrix = Array(n).fill(null).map(() => Array(n).fill(null));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      newMatrix[c][n - 1 - r] = matrix[r][c];
    }
  }
  return newMatrix;
}

/**
 * Rotates a 3x3 matrix 90 degrees counter-clockwise
 */
function rotate90CCW(matrix: Color[][]): Color[][] {
  return rotate90CW(rotate90CW(rotate90CW(matrix)));
}

/**
 * Rotates a specific face and its adjacent edges.
 * Note: clockwise is relative to looking at the face directly.
 */
export function rotateFace(cube: CubeState, face: FaceName, clockwise: boolean = true): CubeState {
  const newCube = JSON.parse(JSON.stringify(cube)) as CubeState;
  
  // 1. Rotate the face itself
  newCube[face].colors = clockwise ? rotate90CW(newCube[face].colors) : rotate90CCW(newCube[face].colors);

  // 2. Rotate adjacent edges
  // This is hardcoded for each face to be absolutely correct
  if (face === 'front') {
    // Top row of Front moves from: Top[2] -> RightCol[0] -> Bottom[0] -> LeftCol[2] -> Top[2]
    const T = [...newCube.top.colors[2]];
    const R = [newCube.right.colors[0][0], newCube.right.colors[1][0], newCube.right.colors[2][0]];
    const B = [...newCube.bottom.colors[0]].reverse();
    const L = [newCube.left.colors[2][2], newCube.left.colors[1][2], newCube.left.colors[0][2]];

    if (clockwise) {
      // Top[2] = L
      newCube.top.colors[2] = [...L];
      // RightCol[0] = T
      newCube.right.colors[0][0] = T[0]; newCube.right.colors[1][0] = T[1]; newCube.right.colors[2][0] = T[2];
      // Bottom[0] = R reversed
      newCube.bottom.colors[0] = [...R].reverse();
      // LeftCol[2] = B reversed
      newCube.left.colors[0][2] = B[2]; newCube.left.colors[1][2] = B[1]; newCube.left.colors[2][2] = B[0];
    } else {
      newCube.top.colors[2] = [...R];
      newCube.right.colors[0][0] = B[2]; newCube.right.colors[1][0] = B[1]; newCube.right.colors[2][0] = B[0];
      newCube.bottom.colors[0] = [...L].reverse();
      newCube.left.colors[0][2] = T[0]; newCube.left.colors[1][2] = T[1]; newCube.left.colors[2][2] = T[2];
    }
  } else if (face === 'back') {
    const T = [...newCube.top.colors[0]].reverse();
    const L = [newCube.left.colors[0][0], newCube.left.colors[1][0], newCube.left.colors[2][0]];
    const B = [...newCube.bottom.colors[2]];
    const R = [newCube.right.colors[2][2], newCube.right.colors[1][2], newCube.right.colors[0][2]];

    if (clockwise) {
      newCube.top.colors[0] = [...R].reverse();
      newCube.left.colors[0][0] = T[0]; newCube.left.colors[1][0] = T[1]; newCube.left.colors[2][0] = T[2];
      newCube.bottom.colors[2] = [...L].reverse();
      newCube.right.colors[0][2] = B[2]; newCube.right.colors[1][2] = B[1]; newCube.right.colors[2][2] = B[0];
    } else {
      newCube.top.colors[0] = [...L].reverse();
      newCube.left.colors[0][0] = B[0]; newCube.left.colors[1][0] = B[1]; newCube.left.colors[2][0] = B[2];
      newCube.bottom.colors[2] = [...R].reverse();
      newCube.right.colors[0][2] = T[2]; newCube.right.colors[1][2] = T[1]; newCube.right.colors[2][2] = T[0];
    }
  } else if (face === 'top') {
    // Top rotation (U move) affects row 0 of Front, Left, Back, Right
    const F = [...newCube.front.colors[0]];
    const R = [...newCube.right.colors[0]];
    const Bk = [...newCube.back.colors[0]];
    const L = [...newCube.left.colors[0]];

    if (clockwise) {
      newCube.front.colors[0] = R;
      newCube.right.colors[0] = Bk;
      newCube.back.colors[0] = L;
      newCube.left.colors[0] = F;
    } else {
      newCube.front.colors[0] = L;
      newCube.left.colors[0] = Bk;
      newCube.back.colors[0] = R;
      newCube.right.colors[0] = F;
    }
  } else if (face === 'bottom') {
    const F = [...newCube.front.colors[2]];
    const R = [...newCube.right.colors[2]];
    const Bk = [...newCube.back.colors[2]];
    const L = [...newCube.left.colors[2]];

    if (clockwise) {
      newCube.front.colors[2] = L;
      newCube.right.colors[2] = F;
      newCube.back.colors[2] = R;
      newCube.left.colors[2] = Bk;
    } else {
      newCube.front.colors[2] = R;
      newCube.right.colors[2] = Bk;
      newCube.back.colors[2] = L;
      newCube.left.colors[2] = F;
    }
  } else if (face === 'right') {
    const F = [newCube.front.colors[0][2], newCube.front.colors[1][2], newCube.front.colors[2][2]];
    const T = [newCube.top.colors[0][2], newCube.top.colors[1][2], newCube.top.colors[2][2]];
    const Bk = [newCube.back.colors[2][0], newCube.back.colors[1][0], newCube.back.colors[0][0]];
    const B = [newCube.bottom.colors[0][2], newCube.bottom.colors[1][2], newCube.bottom.colors[2][2]];

    if (clockwise) {
      newCube.top.colors[0][2] = F[0]; newCube.top.colors[1][2] = F[1]; newCube.top.colors[2][2] = F[2];
      newCube.back.colors[0][0] = T[2]; newCube.back.colors[1][0] = T[1]; newCube.back.colors[2][0] = T[0];
      newCube.bottom.colors[0][2] = Bk[0]; newCube.bottom.colors[1][2] = Bk[1]; newCube.bottom.colors[2][2] = Bk[2];
      newCube.front.colors[0][2] = B[0]; newCube.front.colors[1][2] = B[1]; newCube.front.colors[2][2] = B[2];
    } else {
      newCube.top.colors[0][2] = Bk[2]; newCube.top.colors[1][2] = Bk[1]; newCube.top.colors[2][2] = Bk[0];
      newCube.back.colors[0][0] = B[2]; newCube.back.colors[1][0] = B[1]; newCube.back.colors[2][0] = B[0];
      newCube.bottom.colors[0][2] = F[0]; newCube.bottom.colors[1][2] = F[1]; newCube.bottom.colors[2][2] = F[2];
      newCube.front.colors[0][2] = T[0]; newCube.front.colors[1][2] = T[1]; newCube.front.colors[2][2] = T[2];
    }
  } else if (face === 'left') {
    const F = [newCube.front.colors[0][0], newCube.front.colors[1][0], newCube.front.colors[2][0]];
    const T = [newCube.top.colors[0][0], newCube.top.colors[1][0], newCube.top.colors[2][0]];
    const Bk = [newCube.back.colors[2][2], newCube.back.colors[1][2], newCube.back.colors[0][2]];
    const B = [newCube.bottom.colors[0][0], newCube.bottom.colors[1][0], newCube.bottom.colors[2][0]];

    if (clockwise) {
      newCube.top.colors[0][0] = Bk[0]; newCube.top.colors[1][0] = Bk[1]; newCube.top.colors[2][0] = Bk[2];
      newCube.back.colors[0][2] = B[2]; newCube.back.colors[1][2] = B[1]; newCube.back.colors[2][2] = B[0];
      newCube.bottom.colors[0][0] = F[0]; newCube.bottom.colors[1][0] = F[1]; newCube.bottom.colors[2][0] = F[2];
      newCube.front.colors[0][0] = T[0]; newCube.front.colors[1][0] = T[1]; newCube.front.colors[2][0] = T[2];
    } else {
      newCube.top.colors[0][0] = F[0]; newCube.top.colors[1][0] = F[1]; newCube.top.colors[2][0] = F[2];
      newCube.back.colors[0][2] = T[2]; newCube.back.colors[1][2] = T[1]; newCube.back.colors[2][2] = T[0];
      newCube.bottom.colors[0][0] = Bk[0]; newCube.bottom.colors[1][0] = Bk[1]; newCube.bottom.colors[2][0] = Bk[2];
      newCube.front.colors[0][0] = B[0]; newCube.front.colors[1][0] = B[1]; newCube.front.colors[2][0] = B[2];
    }
  }

  return newCube;
}

/**
 * Rotates an entire middle slice or row.
 * axis: 'x' (left-right), 'y' (up-down), 'z' (front-back)
 * index: -1, 0, or 1.
 * For outer slices (index -1 or 1), it maps to the standard rotateFace.
 */
export function rotateLayer(cube: CubeState, axis: 'x' | 'y' | 'z', layer: number, clockwise: boolean = true): CubeState {
  // If it's an outer layer, use rotateFace which handles the 3x3 face rotation too
  if (axis === 'x' && layer === 1) return rotateFace(cube, 'right', clockwise);
  if (axis === 'x' && layer === -1) return rotateFace(cube, 'left', clockwise);
  if (axis === 'y' && layer === 1) return rotateFace(cube, 'top', clockwise);
  if (axis === 'y' && layer === -1) return rotateFace(cube, 'bottom', clockwise);
  if (axis === 'z' && layer === 1) return rotateFace(cube, 'front', clockwise);
  if (axis === 'z' && layer === -1) return rotateFace(cube, 'back', clockwise);

  // If it's a middle layer (layer === 0), we only move the 4 edge strips
  const newCube = JSON.parse(JSON.stringify(cube)) as CubeState;
  
  if (axis === 'y' && layer === 0) { // E slice
    const F = [...newCube.front.colors[1]];
    const R = [...newCube.right.colors[1]];
    const Bk = [...newCube.back.colors[1]];
    const L = [...newCube.left.colors[1]];
    if (clockwise) { // Mapping E move - same as D (bottom)
      newCube.front.colors[1] = L; newCube.right.colors[1] = F; newCube.back.colors[1] = R; newCube.left.colors[1] = Bk;
    } else {
      newCube.front.colors[1] = R; newCube.right.colors[1] = Bk; newCube.back.colors[1] = L; newCube.left.colors[1] = F;
    }
  } else if (axis === 'x' && layer === 0) { // M slice
    const F = [newCube.front.colors[0][1], newCube.front.colors[1][1], newCube.front.colors[2][1]];
    const T = [newCube.top.colors[0][1], newCube.top.colors[1][1], newCube.top.colors[2][1]];
    const Bk = [newCube.back.colors[2][1], newCube.back.colors[1][1], newCube.back.colors[0][1]];
    const B = [newCube.bottom.colors[0][1], newCube.bottom.colors[1][1], newCube.bottom.colors[2][1]];
    if (clockwise) { // M move is same as L (left)
      newCube.top.colors[0][1] = Bk[0]; newCube.top.colors[1][1] = Bk[1]; newCube.top.colors[2][1] = Bk[2];
      newCube.back.colors[0][1] = B[2]; newCube.back.colors[1][1] = B[1]; newCube.back.colors[2][1] = B[0];
      newCube.bottom.colors[0][1] = F[0]; newCube.bottom.colors[1][1] = F[1]; newCube.bottom.colors[2][1] = F[2];
      newCube.front.colors[0][1] = T[0]; newCube.front.colors[1][1] = T[1]; newCube.front.colors[2][1] = T[2];
    } else {
      newCube.top.colors[0][1] = F[0]; newCube.top.colors[1][1] = F[1]; newCube.top.colors[2][1] = F[2];
      newCube.back.colors[0][1] = T[2]; newCube.back.colors[1][1] = T[1]; newCube.back.colors[2][1] = T[0];
      newCube.bottom.colors[0][1] = Bk[0]; newCube.bottom.colors[1][1] = Bk[1]; newCube.bottom.colors[2][1] = Bk[2];
      newCube.front.colors[0][1] = B[0]; newCube.front.colors[1][1] = B[1]; newCube.front.colors[2][1] = B[2];
    }
  } else if (axis === 'z' && layer === 0) { // S slice
    const T = [...newCube.top.colors[1]];
    const R = [newCube.right.colors[0][1], newCube.right.colors[1][1], newCube.right.colors[2][1]];
    const B = [...newCube.bottom.colors[1]].reverse();
    const L = [newCube.left.colors[2][1], newCube.left.colors[1][1], newCube.left.colors[0][1]];
    if (clockwise) { // S move is same as F (front)
      newCube.top.colors[1] = [...L];
      newCube.right.colors[0][1] = T[0]; newCube.right.colors[1][1] = T[1]; newCube.right.colors[2][1] = T[2];
      newCube.bottom.colors[1] = [...R].reverse();
      newCube.left.colors[0][1] = B[2]; newCube.left.colors[1][1] = B[1]; newCube.left.colors[2][1] = B[0];
    } else {
      newCube.top.colors[1] = [...R];
      newCube.right.colors[0][1] = B[2]; newCube.right.colors[1][1] = B[1]; newCube.right.colors[2][1] = B[0];
      newCube.bottom.colors[1] = [...L].reverse();
      newCube.left.colors[0][1] = T[0]; newCube.left.colors[1][1] = T[1]; newCube.left.colors[2][1] = T[2];
    }
  }
  
  return newCube;
}
