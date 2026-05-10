/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Player = 'white' | 'black';

export interface Position {
  row: number;
  col: number;
}

export interface Piece {
  id: string;
  player: Player;
  isKing: boolean;
  position: Position;
}

export interface GameState {
  board: (Piece | null)[][];
  currentPlayer: Player;
  selectedPiece: Piece | null;
  validMoves: Move[];
  winner: Player | null;
  history: string[];
}

export interface Move {
  from: Position;
  to: Position;
  captured?: Position;
  isJump: boolean;
}
