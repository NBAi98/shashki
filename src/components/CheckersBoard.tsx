/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RefreshCcw, User, UserX, Cpu } from 'lucide-react';
import { Player, Position, Piece, Move, GameState } from '../types';
import { 
  BOARD_SIZE, 
  createInitialBoard, 
  getAllPossibleMoves, 
  findJumpsForPiece,
  isValidPos
} from '../logic/checkersLogic';
import { getBestMove } from '../logic/aiLogic';

export const CheckersGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    board: createInitialBoard(),
    currentPlayer: 'white',
    selectedPiece: null,
    validMoves: [],
    winner: null,
    history: []
  });

  const [isBotThinking, setIsBotThinking] = useState(false);
  const [lastMove, setLastMove] = useState<Move | null>(null);

  // AI Turn Effect
  useEffect(() => {
    if (gameState.currentPlayer === 'black' && !gameState.winner) {
      setIsBotThinking(true);
      const timer = setTimeout(() => {
        const move = getBestMove(gameState.board);
        if (move) {
          // Find the piece on the board to "select" it for applyMove logic context if needed
          // though applyMove uses selectedPiece from state.
          // Let's refactor applyMove slightly to accept a piece or use the piece from the move.
          applyBotMove(move);
        }
        setIsBotThinking(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentPlayer, gameState.winner, gameState.board]);

  const resetGame = () => {
    setGameState({
      board: createInitialBoard(),
      currentPlayer: 'white',
      selectedPiece: null,
      validMoves: [],
      winner: null,
      history: []
    });
    setLastMove(null);
  };

  const handleSquareClick = (row: number, col: number) => {
    if (gameState.winner || isBotThinking) return;

    const piece = gameState.board[row][col];
    const { selectedPiece, validMoves, currentPlayer, board } = gameState;

    // Selecting a piece
    if (piece && piece.player === currentPlayer) {
      const allPossible = getAllPossibleMoves(board, currentPlayer);
      const pieceMoves = allPossible.filter(m => m.from.row === row && m.from.col === col);
      
      setGameState(prev => ({
        ...prev,
        selectedPiece: piece,
        validMoves: pieceMoves
      }));
      return;
    }

    // Moving a piece
    const move = validMoves.find(m => m.to.row === row && m.to.col === col);
    if (selectedPiece && move) {
      applyMove(move);
    } else {
      setGameState(prev => ({ ...prev, selectedPiece: null, validMoves: [] }));
    }
  };

  const applyBotMove = (move: Move) => {
    const piece = gameState.board[move.from.row][move.from.col];
    if (piece) {
      executeMove(move, piece);
    }
  };

  const applyMove = (move: Move) => {
    const { selectedPiece } = gameState;
    if (selectedPiece) {
      executeMove(move, selectedPiece);
    }
  };

  const executeMove = (move: Move, pieceToMove: Piece) => {
    const { board, currentPlayer } = gameState;
    const newBoard = board.map(row => [...row]);
    const { from, to, captured } = move;

    // Movement
    const piece = { ...pieceToMove, position: to };
    
    // Kinging
    let isNowKing = piece.isKing;
    if (!isNowKing) {
      if ((currentPlayer === 'white' && to.row === 0) || (currentPlayer === 'black' && to.row === BOARD_SIZE - 1)) {
        isNowKing = true;
        piece.isKing = true;
      }
    }

    newBoard[from.row][from.col] = null;
    newBoard[to.row][to.col] = piece;

    // Capture
    if (captured) {
      newBoard[captured.row][captured.col] = null;
      setLastMove(move);

      // Check for further jumps (multi-jump)
      const furtherJumps = findJumpsForPiece(newBoard, piece);
      if (furtherJumps.length > 0) {
        setGameState(prev => ({
          ...prev,
          board: newBoard,
          selectedPiece: piece,
          validMoves: furtherJumps
        }));
        return;
      }
    }

    // Switch turn
    const nextPlayer = currentPlayer === 'white' ? 'black' : 'white';
    const nextMoves = getAllPossibleMoves(newBoard, nextPlayer);

    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer: nextPlayer,
      selectedPiece: null,
      validMoves: [],
      winner: nextMoves.length === 0 ? currentPlayer : null
    }));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFCF8] text-[#1A1A1A] font-sans p-4 md:p-8">
      {/* Header */}
      <div className="w-full max-w-2xl flex justify-between items-end mb-8 border-b border-[#1A1A1A]/10 pb-4">
        <div>
          <h1 className="text-4xl md:text-6xl font-serif font-extralight tracking-tight">ШАШКИ</h1>
          <p className="text-xs uppercase tracking-widest opacity-50 mt-2 font-mono">Russian Checkers</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={resetGame}
            className="group flex items-center justify-center w-12 h-12 rounded-full border border-[#1A1A1A]/20 hover:bg-[#1A1A1A] hover:text-[#FDFCF8] transition-all duration-300"
          >
            <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>
      </div>

      {/* Game Info */}
      <div className="w-full max-w-2xl grid grid-cols-2 gap-4 mb-8">
        <div className={`
          p-4 rounded-2xl border transition-all duration-500 flex items-center gap-4
          ${gameState.currentPlayer === 'white' && !gameState.winner ? 'bg-[#1A1A1A] text-[#FDFCF8] scale-105 shadow-xl' : 'bg-white border-[#1A1A1A]/10 scale-95 opacity-80'}
        `}>
          <div className="w-10 h-10 rounded-full bg-[#E5E5E5] border border-[#1A1A1A]/10 shadow-inner flex items-center justify-center">
            <User className="w-5 h-5 text-[#1A1A1A]" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider opacity-60">Player 1</p>
            <p className="font-medium text-lg">Белые</p>
          </div>
        </div>
        <div className={`
          p-4 rounded-2xl border transition-all duration-500 flex items-center gap-4
          ${gameState.currentPlayer === 'black' && !gameState.winner ? 'bg-[#1A1A1A] text-[#FDFCF8] scale-105 shadow-xl' : 'bg-white border-[#1A1A1A]/10 scale-95 opacity-80'}
        `}>
          <div className={`w-10 h-10 rounded-full bg-[#333] border border-[#FDFCF8]/10 shadow-2xl flex items-center justify-center ${isBotThinking ? 'animate-pulse' : ''}`}>
            <Cpu className="w-5 h-5 text-[#FDFCF8]" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider opacity-60">Player 2 (AI)</p>
            <p className="font-medium text-lg">{isBotThinking ? 'Думает...' : 'Черные'}</p>
          </div>
        </div>
      </div>

      {/* Board Container */}
      <div className="relative group">
        <div className="bg-[#1A1A1A] p-2 md:p-4 rounded-xl shadow-2xl overflow-hidden border-8 border-[#1A1A1A]">
          <div className="grid grid-cols-8 gap-0 border border-[#FDFCF8]/10 rounded-sm">
            {gameState.board.map((rowArr, rowIndex) => 
              rowArr.map((piece, colIndex) => {
                const isDark = (rowIndex + colIndex) % 2 !== 0;
                const isValidMove = gameState.validMoves.some(m => m.to.row === rowIndex && m.to.col === colIndex);
                const isSelected = gameState.selectedPiece?.position.row === rowIndex && gameState.selectedPiece?.position.col === colIndex;

                return (
                  <div 
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleSquareClick(rowIndex, colIndex)}
                    className={`
                      relative w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center cursor-pointer
                      transition-colors duration-300
                      ${isDark ? 'bg-[#2A2A2A]' : 'bg-[#EFEFEF]'}
                    `}
                  >
                    {/* Move Indicator */}
                    {isValidMove && (
                      <div className="absolute w-4 h-4 rounded-full bg-[#FF6321]/40 border border-[#FF6321] z-10 animate-pulse" />
                    )}

                    {/* Piece */}
                    <AnimatePresence mode="popLayout" initial={false}>
                      {piece && (
                        <motion.div
                          layoutId={piece.id}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                          className={`
                            relative w-4/5 h-4/5 rounded-full z-20 flex items-center justify-center
                            shadow-xl
                            ${piece.player === 'white' 
                              ? 'bg-[#FDFCF8] text-[#1A1A1A]' 
                              : 'bg-[#1A1A1A] text-[#FDFCF8] border border-[#FDFCF8]/20'}
                            ${isSelected ? 'ring-4 ring-[#FF6321] scale-110 shadow-[0_0_20px_rgba(255,99,33,0.5)]' : ''}
                          `}
                        >
                          {/* Inner piece circles for texture */}
                          <div className={`w-3/4 h-3/4 rounded-full border-2 ${piece.player === 'white' ? 'border-[#1A1A1A]/10' : 'border-[#FDFCF8]/10'} flex items-center justify-center`}>
                             <div className={`w-1/2 h-1/2 rounded-full border ${piece.player === 'white' ? 'border-[#1A1A1A]/5' : 'border-[#FDFCF8]/5'}`} />
                          </div>
                          
                          {/* King crown icon */}
                          {piece.isKing && (
                            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                              <div className="relative text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 select-none">
                                KING
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Win Overlay */}
        <AnimatePresence>
          {gameState.winner && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 bg-[#FDFCF8]/80 backdrop-blur-md rounded-xl" />
              <div className="relative flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-[#1A1A1A] text-[#FDFCF8] flex items-center justify-center mb-6 shadow-2xl">
                  <Trophy className="w-12 h-12" />
                </div>
                <h2 className="text-5xl font-serif mb-2 tracking-tight">Победа!</h2>
                <p className="text-xl opacity-60 uppercase tracking-widest mb-8">
                  {gameState.winner === 'white' ? 'Белые' : 'Черные'} выиграли
                </p>
                <button 
                  onClick={resetGame}
                  className="px-12 py-4 bg-[#1A1A1A] text-[#FDFCF8] rounded-full hover:bg-[#FF6321] transition-all duration-300 font-medium tracking-wide shadow-xl active:scale-95"
                >
                  Играть снова
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Instructions */}
      <div className="w-full max-w-2xl mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-[11px] uppercase tracking-widest opacity-40 font-medium">
        <div className="flex flex-col gap-2">
          <p className="text-[#1A1A1A]/60">Rule 01</p>
          <p>Взятие обязательно (Jumping is mandatory)</p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-[#1A1A1A]/60">Rule 02</p>
          <p>Дамка ходит на любое расстояние по диагонали</p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-[#1A1A1A]/60">Rule 03</p>
          <p>Простая шашка бьет назад</p>
        </div>
      </div>
    </div>
  );
};
