/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Player, Position, Piece, Move } from '../types';

export const BOARD_SIZE = 8;

export const createInitialBoard = (): (Piece | null)[][] => {
  const board: (Piece | null)[][] = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if ((row + col) % 2 !== 0) {
        if (row < 3) {
          board[row][col] = {
            id: `black-${row}-${col}`,
            player: 'black',
            isKing: false,
            position: { row, col }
          };
        } else if (row > 4) {
          board[row][col] = {
            id: `white-${row}-${col}`,
            player: 'white',
            isKing: false,
            position: { row, col }
          };
        }
      }
    }
  }

  return board;
};

export const getValidMoves = (board: (Piece | null)[][], piece: Piece): Move[] => {
  const moves: Move[] = [];
  const { row, col } = piece.position;
  const directions = piece.isKing 
    ? [[1, 1], [1, -1], [-1, 1], [-1, -1]]
    : piece.player === 'white' ? [[-1, 1], [-1, -1]] : [[1, 1], [1, -1]];

  // Standard moves (only if no jumps exist globally for the player)
  // Jumps are mandatory in Russian checkers
  
  // Actually, we need to check if ANY piece has a jump move.
  // If so, only jump moves are valid.
  
  return moves;
};

export const isValidPos = (row: number, col: number) => 
  row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;

export const findJumpsForPiece = (board: (Piece | null)[][], piece: Piece): Move[] => {
  const jumps: Move[] = [];
  const { row, col } = piece.position;
  
  const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

  if (piece.isKing) {
    // King jumps in Russian checkers: can slide any distance, jump over one enemy, land on any empty cell after
    for (const [dr, dc] of directions) {
      let r = row + dr;
      let c = col + dc;
      let pieceToCapture: Piece | null = null;
      
      while (isValidPos(r, c)) {
        const target = board[r][c];
        if (target) {
          if (target.player === piece.player) break; // Own piece
          if (pieceToCapture) break; // Already jumped over a piece in this line
          pieceToCapture = target;
        } else {
          if (pieceToCapture) {
            jumps.push({
              from: { row, col },
              to: { row: r, col: c },
              captured: pieceToCapture.position,
              isJump: true
            });
          }
        }
        r += dr;
        c += dc;
      }
    }
  } else {
    // Regular piece jumps: 2 steps over enemy
    for (const [dr, dc] of directions) {
      const midR = row + dr;
      const midC = col + dc;
      const endR = row + 2 * dr;
      const endC = col + 2 * dc;

      if (isValidPos(endR, endC)) {
        const midPiece = board[midR][midC];
        const endPiece = board[endR][endC];
        if (midPiece && midPiece.player !== piece.player && !endPiece) {
          jumps.push({
            from: { row, col },
            to: { row: endR, col: endC },
            captured: { row: midR, col: midC },
            isJump: true
          });
        }
      }
    }
  }

  return jumps;
};

export const findSimpleMovesForPiece = (board: (Piece | null)[][], piece: Piece): Move[] => {
  const moves: Move[] = [];
  const { row, col } = piece.position;
  
  if (piece.isKing) {
    const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    for (const [dr, dc] of directions) {
      let r = row + dr;
      let c = col + dc;
      while (isValidPos(r, c) && !board[r][c]) {
        moves.push({
          from: { row, col },
          to: { row: r, col: c },
          isJump: false
        });
        r += dr;
        c += dc;
      }
    }
  } else {
    const directions = piece.player === 'white' ? [[-1, 1], [-1, -1]] : [[1, 1], [1, -1]];
    for (const [dr, dc] of directions) {
      const r = row + dr;
      const c = col + dc;
      if (isValidPos(r, c) && !board[r][c]) {
        moves.push({
          from: { row, col },
          to: { row: r, col: c },
          isJump: false
        });
      }
    }
  }
  
  return moves;
};

export const getAllPossibleMoves = (board: (Piece | null)[][], player: Player): Move[] => {
  const allJumps: Move[] = [];
  const allSimple: Move[] = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (piece && piece.player === player) {
        allJumps.push(...findJumpsForPiece(board, piece));
        allSimple.push(...findSimpleMovesForPiece(board, piece));
      }
    }
  }

  // Jumps are mandatory
  return allJumps.length > 0 ? allJumps : allSimple;
};
