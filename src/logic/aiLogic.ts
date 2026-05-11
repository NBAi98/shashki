/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Player, Piece, Move, Difficulty } from '../types';
import { getAllPossibleMoves, BOARD_SIZE } from './checkersLogic';

// Оценка позиции на доске
export const evaluateBoard = (board: (Piece | null)[][]): number => {
  let score = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (piece) {
        let value = 10; // Базовая ценность шашки
        if (piece.isKing) value = 30; // Дамка ценится выше

        // Бонус за позицию (центр лучше)
        const distFromCenter = Math.abs(r - 3.5) + Math.abs(c - 3.5);
        value += (4 - distFromCenter);

        if (piece.player === 'black') {
          score += value;
        } else {
          score -= value;
        }
      }
    }
  }
  return score;
};

// Функция для симуляции хода на копии доски
const simulateMove = (board: (Piece | null)[][], move: Move): (Piece | null)[][] => {
  const newBoard = board.map(row => [...row]);
  const { from, to, captured } = move;
  
  const piece = { ...newBoard[from.row][from.col]! };
  piece.position = to;

  // Дамка
  if (!piece.isKing) {
    if ((piece.player === 'white' && to.row === 0) || (piece.player === 'black' && to.row === BOARD_SIZE - 1)) {
      piece.isKing = true;
    }
  }

  newBoard[from.row][from.col] = null;
  newBoard[to.row][to.col] = piece;

  if (captured) {
    newBoard[captured.row][captured.col] = null;
  }

  return newBoard;
};

// Алгоритм МиниМакс
export const minimax = (
  board: (Piece | null)[][],
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number
): { score: number; move: Move | null } => {
  const player: Player = isMaximizing ? 'black' : 'white';
  const moves = getAllPossibleMoves(board, player);

  if (depth === 0 || moves.length === 0) {
    return { score: evaluateBoard(board), move: null };
  }

  let bestMove: Move | null = null;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const nextBoard = simulateMove(board, move);
      const evalResult = minimax(nextBoard, depth - 1, false, alpha, beta).score;
      if (evalResult > maxEval) {
        maxEval = evalResult;
        bestMove = move;
      }
      alpha = Math.max(alpha, evalResult);
      if (beta <= alpha) break;
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const nextBoard = simulateMove(board, move);
      const evalResult = minimax(nextBoard, depth - 1, true, alpha, beta).score;
      if (evalResult < minEval) {
        minEval = evalResult;
        bestMove = move;
      }
      beta = Math.min(beta, evalResult);
      if (beta <= alpha) break;
    }
    return { score: minEval, move: bestMove };
  }
};

export const getBestMove = (board: (Piece | null)[][], difficulty: Difficulty = 'intermediate'): Move | null => {
  let depth = 3;
  if (difficulty === 'beginner') depth = 1;
  if (difficulty === 'intermediate') depth = 3;
  if (difficulty === 'professional') depth = 5;

  const result = minimax(board, depth, true, -Infinity, Infinity);
  return result.move;
};
