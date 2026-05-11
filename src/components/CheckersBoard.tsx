/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RefreshCcw, User, UserX, Cpu } from 'lucide-react';
import { Player, Position, Piece, Move, GameState, Difficulty } from '../types';
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

  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [lastMove, setLastMove] = useState<Move | null>(null);

  // AI Turn Effect
  useEffect(() => {
    if (gameState.currentPlayer === 'black' && !gameState.winner) {
      setIsBotThinking(true);
      const timer = setTimeout(() => {
        const move = getBestMove(gameState.board, difficulty);
        if (move) {
          applyBotMove(move);
        }
        setIsBotThinking(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentPlayer, gameState.winner, gameState.board, difficulty]);

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-600 text-white font-sans p-4 md:p-8">
      {/* Header */}
      <div className="w-full max-w-2xl flex justify-between items-end mb-8 border-b border-white/20 pb-4">
        <div>
          <h1 className="text-4xl md:text-6xl font-serif font-medium tracking-tight">ШАШКИ</h1>
          <p className="text-xs uppercase tracking-widest opacity-70 mt-2 font-mono">Russian Checkers AI</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={resetGame}
            className="group flex items-center justify-center w-12 h-12 rounded-full border border-white/40 hover:bg-white hover:text-indigo-600 transition-all duration-300"
          >
            <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>
      </div>

      {/* Game Info */}
      <div className="w-full max-w-2xl flex flex-col gap-6 mb-8">
        {/* Difficulty Selection */}
        <div className="flex justify-center items-center gap-2 p-1 bg-white/10 rounded-2xl border border-white/20">
          {[
            { id: 'beginner', label: 'Новичок' },
            { id: 'intermediate', label: 'Средний' },
            { id: 'professional', label: 'Профи' }
          ].map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => setDifficulty(lvl.id as Difficulty)}
              className={`
                flex-1 px-4 py-2 rounded-xl text-xs uppercase tracking-widest font-bold transition-all duration-300
                ${difficulty === lvl.id 
                  ? 'bg-orange-500 text-white shadow-lg' 
                  : 'hover:bg-white/10 opacity-60 text-white'}
              `}
            >
              {lvl.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className={`
            p-4 rounded-2xl border transition-all duration-500 flex items-center gap-4
            ${gameState.currentPlayer === 'white' && !gameState.winner ? 'bg-white text-indigo-900 scale-105 shadow-2xl border-transparent' : 'bg-white/10 border-white/20 scale-95 opacity-80'}
          `}>
            <div className="w-10 h-10 rounded-full bg-[#E5E5E5] border border-black/10 shadow-inner flex items-center justify-center">
              <User className="w-5 h-5 text-indigo-900" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider opacity-60">Player 1</p>
              <p className="font-semibold text-lg">Белые</p>
            </div>
          </div>
          <div className={`
            p-4 rounded-2xl border transition-all duration-500 flex items-center gap-4
            ${gameState.currentPlayer === 'black' && !gameState.winner ? 'bg-white text-indigo-900 scale-105 shadow-2xl border-transparent' : 'bg-white/10 border-white/20 scale-95 opacity-80'}
          `}>
            <div className={`w-10 h-10 rounded-full bg-[#333] border border-white/10 shadow-2xl flex items-center justify-center ${isBotThinking ? 'animate-pulse' : ''}`}>
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider opacity-60">Player 2 (AI)</p>
              <p className="font-semibold text-lg">{isBotThinking ? 'Думает...' : 'Черные'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Board Container */}
      <div className="relative group">
        <div className="bg-indigo-950 p-2 md:p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border-8 border-indigo-950">
          <div className="grid grid-cols-8 gap-0 border border-white/5 rounded-sm">
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
                      ${isDark ? 'bg-indigo-800' : 'bg-indigo-100'}
                    `}
                  >
                    {/* Move Indicator */}
                    {isValidMove && (
                      <div className="absolute w-5 h-5 rounded-full bg-orange-500/60 border-2 border-orange-400 z-10 animate-pulse" />
                    )}

                    {/* Piece */}
                    <AnimatePresence mode="popLayout" initial={false}>
                      {piece && (
                        <motion.div
                          layoutId={piece.id}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                          className={`
                            relative w-[85%] h-[85%] rounded-full z-20 flex items-center justify-center
                            shadow-[0_8px_16px_rgba(0,0,0,0.4)]
                            ${piece.player === 'white' 
                              ? 'bg-zinc-50 text-indigo-900 border-b-4 border-zinc-300' 
                              : 'bg-zinc-900 text-white border-b-4 border-black border-t border-white/10'}
                            ${isSelected ? 'ring-4 ring-orange-400 scale-110 shadow-[0_0_30px_rgba(251,146,60,0.6)]' : ''}
                          `}
                        >
                          {/* Inner piece circles for texture */}
                          <div className={`w-[70%] h-[70%] rounded-full border-2 ${piece.player === 'white' ? 'border-zinc-200' : 'border-zinc-800'} flex items-center justify-center`}>
                             <div className={`w-1/2 h-1/2 rounded-full border ${piece.player === 'white' ? 'border-zinc-100' : 'border-zinc-700'}`} />
                          </div>
                          
                          {/* King crown icon */}
                          {piece.isKing && (
                            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                              <div className="relative text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 select-none drop-shadow-sm">
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
              <div className="absolute inset-0 bg-indigo-900/90 backdrop-blur-md rounded-xl" />
              <div className="relative flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-orange-500 text-white flex items-center justify-center mb-6 shadow-2xl">
                  <Trophy className="w-12 h-12" />
                </div>
                <h2 className="text-5xl font-serif mb-2 tracking-tight text-white">Победа!</h2>
                <p className="text-xl opacity-80 uppercase tracking-widest mb-8 text-white">
                  {gameState.winner === 'white' ? 'Белые' : 'Черные'} выиграли
                </p>
                <button 
                  onClick={resetGame}
                  className="px-12 py-4 bg-white text-indigo-900 rounded-full hover:bg-orange-400 hover:text-white transition-all duration-300 font-bold tracking-wide shadow-xl active:scale-95"
                >
                  Играть снова
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Instructions */}
      <div className="w-full max-w-2xl mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-[11px] uppercase tracking-widest font-semibold">
        <div className="flex flex-col gap-2 p-4 bg-white/5 rounded-xl">
          <p className="text-orange-400">Rule 01</p>
          <p className="opacity-70">Взятие обязательно (Jumping is mandatory)</p>
        </div>
        <div className="flex flex-col gap-2 p-4 bg-white/5 rounded-xl">
          <p className="text-orange-400">Rule 02</p>
          <p className="opacity-70">Дамка ходит на любое расстояние по диагонали</p>
        </div>
        <div className="flex flex-col gap-2 p-4 bg-white/5 rounded-xl">
          <p className="text-orange-400">Rule 03</p>
          <p className="opacity-70">Простая шашка бьет назад</p>
        </div>
      </div>
    </div>
  );
};
