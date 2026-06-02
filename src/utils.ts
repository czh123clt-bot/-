import { CubeState, FaceName, Color } from './types';

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

export function rotateFace(cube: CubeState, face: FaceName): CubeState {
  const newCube = JSON.parse(JSON.stringify(cube)) as CubeState;
  
  // Rotate the target face itself 90 degrees CW
  newCube[face].colors = rotate90CW(newCube[face].colors);

  // Rotate the edges
  if (face === 'front') {
    const topEdge = [newCube.top.colors[2][0], newCube.top.colors[2][1], newCube.top.colors[2][2]];
    const rightEdge = [newCube.right.colors[0][0], newCube.right.colors[1][0], newCube.right.colors[2][0]];
    const bottomEdge = [newCube.bottom.colors[0][2], newCube.bottom.colors[0][1], newCube.bottom.colors[0][0]];
    const leftEdge = [newCube.left.colors[2][2], newCube.left.colors[1][2], newCube.left.colors[0][2]];

    newCube.top.colors[2][0] = leftEdge[0];
    newCube.top.colors[2][1] = leftEdge[1];
    newCube.top.colors[2][2] = leftEdge[2];

    newCube.right.colors[0][0] = topEdge[0];
    newCube.right.colors[1][0] = topEdge[1];
    newCube.right.colors[2][0] = topEdge[2];

    newCube.bottom.colors[0][2] = rightEdge[0];
    newCube.bottom.colors[0][1] = rightEdge[1];
    newCube.bottom.colors[0][0] = rightEdge[2];

    newCube.left.colors[2][2] = bottomEdge[0];
    newCube.left.colors[1][2] = bottomEdge[1];
    newCube.left.colors[0][2] = bottomEdge[2];
  } else if (face === 'back') {
    const topEdge = [newCube.top.colors[0][2], newCube.top.colors[0][1], newCube.top.colors[0][0]];
    const leftEdge = [newCube.left.colors[0][0], newCube.left.colors[1][0], newCube.left.colors[2][0]];
    const bottomEdge = [newCube.bottom.colors[2][2], newCube.bottom.colors[2][1], newCube.bottom.colors[2][0]];
    const rightEdge = [newCube.right.colors[2][2], newCube.right.colors[1][2], newCube.right.colors[0][2]];

    newCube.top.colors[0][0] = rightEdge[0];
    newCube.top.colors[0][1] = rightEdge[1];
    newCube.top.colors[0][2] = rightEdge[2];

    newCube.left.colors[0][0] = topEdge[0];
    newCube.left.colors[1][0] = topEdge[1];
    newCube.left.colors[2][0] = topEdge[2];

    newCube.bottom.colors[2][0] = leftEdge[0];
    newCube.bottom.colors[2][1] = leftEdge[1];
    newCube.bottom.colors[2][2] = leftEdge[2];

    newCube.right.colors[2][2] = bottomEdge[0];
    newCube.right.colors[1][2] = bottomEdge[1];
    newCube.right.colors[0][2] = bottomEdge[2];
  } else if (face === 'top') {
    const frontEdge = [newCube.front.colors[0][0], newCube.front.colors[0][1], newCube.front.colors[0][2]];
    const leftEdge = [newCube.left.colors[0][0], newCube.left.colors[0][1], newCube.left.colors[0][2]];
    const backEdge = [newCube.back.colors[0][0], newCube.back.colors[0][1], newCube.back.colors[0][2]];
    const rightEdge = [newCube.right.colors[0][0], newCube.right.colors[0][1], newCube.right.colors[0][2]];

    newCube.front.colors[0][0] = rightEdge[0];
    newCube.front.colors[0][1] = rightEdge[1];
    newCube.front.colors[0][2] = rightEdge[2];

    newCube.left.colors[0][0] = frontEdge[0];
    newCube.left.colors[0][1] = frontEdge[1];
    newCube.left.colors[0][2] = frontEdge[2];

    newCube.back.colors[0][0] = leftEdge[0];
    newCube.back.colors[0][1] = leftEdge[1];
    newCube.back.colors[0][2] = leftEdge[2];

    newCube.right.colors[0][0] = backEdge[0];
    newCube.right.colors[0][1] = backEdge[1];
    newCube.right.colors[0][2] = backEdge[2];
  } else if (face === 'bottom') {
    const frontEdge = [newCube.front.colors[2][0], newCube.front.colors[2][1], newCube.front.colors[2][2]];
    const rightEdge = [newCube.right.colors[2][0], newCube.right.colors[2][1], newCube.right.colors[2][2]];
    const backEdge = [newCube.back.colors[2][0], newCube.back.colors[2][1], newCube.back.colors[2][2]];
    const leftEdge = [newCube.left.colors[2][0], newCube.left.colors[2][1], newCube.left.colors[2][2]];

    newCube.front.colors[2][0] = leftEdge[0];
    newCube.front.colors[2][1] = leftEdge[1];
    newCube.front.colors[2][2] = leftEdge[2];

    newCube.right.colors[2][0] = frontEdge[0];
    newCube.right.colors[2][1] = frontEdge[1];
    newCube.right.colors[2][2] = frontEdge[2];

    newCube.back.colors[2][0] = rightEdge[0];
    newCube.back.colors[2][1] = rightEdge[1];
    newCube.back.colors[2][2] = rightEdge[2];

    newCube.left.colors[2][0] = backEdge[0];
    newCube.left.colors[2][1] = backEdge[1];
    newCube.left.colors[2][2] = backEdge[2];
  } else if (face === 'right') {
    const topEdge = [newCube.top.colors[0][2], newCube.top.colors[1][2], newCube.top.colors[2][2]];
    const backEdge = [newCube.back.colors[2][0], newCube.back.colors[1][0], newCube.back.colors[0][0]];
    const bottomEdge = [newCube.bottom.colors[0][2], newCube.bottom.colors[1][2], newCube.bottom.colors[2][2]];
    const frontEdge = [newCube.front.colors[0][2], newCube.front.colors[1][2], newCube.front.colors[2][2]];

    newCube.top.colors[0][2] = frontEdge[0];
    newCube.top.colors[1][2] = frontEdge[1];
    newCube.top.colors[2][2] = frontEdge[2];

    newCube.back.colors[2][0] = topEdge[2];
    newCube.back.colors[1][0] = topEdge[1];
    newCube.back.colors[0][0] = topEdge[0];

    newCube.bottom.colors[0][2] = backEdge[0];
    newCube.bottom.colors[1][2] = backEdge[1];
    newCube.bottom.colors[2][2] = backEdge[2];

    newCube.front.colors[0][2] = bottomEdge[0];
    newCube.front.colors[1][2] = bottomEdge[1];
    newCube.front.colors[2][2] = bottomEdge[2];
  } else if (face === 'left') {
    const topEdge = [newCube.top.colors[0][0], newCube.top.colors[1][0], newCube.top.colors[2][0]];
    const frontEdge = [newCube.front.colors[0][0], newCube.front.colors[1][0], newCube.front.colors[2][0]];
    const bottomEdge = [newCube.bottom.colors[0][0], newCube.bottom.colors[1][0], newCube.bottom.colors[2][0]];
    const backEdge = [newCube.back.colors[2][2], newCube.back.colors[1][2], newCube.back.colors[0][2]];

    newCube.top.colors[0][0] = backEdge[0];
    newCube.top.colors[1][0] = backEdge[1];
    newCube.top.colors[2][0] = backEdge[2];

    newCube.front.colors[0][0] = topEdge[0];
    newCube.front.colors[1][0] = topEdge[1];
    newCube.front.colors[2][0] = topEdge[2];

    newCube.bottom.colors[0][0] = frontEdge[0];
    newCube.bottom.colors[1][0] = frontEdge[1];
    newCube.bottom.colors[2][0] = frontEdge[2];

    newCube.back.colors[2][2] = bottomEdge[2];
    newCube.back.colors[1][2] = bottomEdge[1];
    newCube.back.colors[0][2] = bottomEdge[0];
  }
  
  return newCube;
}
