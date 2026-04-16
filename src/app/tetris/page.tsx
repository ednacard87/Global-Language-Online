'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { RefreshCw, Trophy } from 'lucide-react';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 12;

const TETROMINOES: { [key: string]: { shape: number[][]; color: string } } = {
  'I_v': { shape: [[1], [1], [1], [1]], color: 'cyan' },
  'I_h': { shape: [[1, 1, 1, 1]], color: 'cyan' },
  'O': { shape: [[1, 1], [1, 1]], color: 'yellow' },
  'T_0': { shape: [[0, 1, 0], [1, 1, 1]], color: 'purple' },
  'T_90': { shape: [[1, 0], [1, 1], [1, 0]], color: 'purple' },
  'T_180': { shape: [[1, 1, 1], [0, 1, 0]], color: 'purple' },
  'T_270': { shape: [[0, 1], [1, 1], [0, 1]], color: 'purple' },
  'J_0': { shape: [[1, 0, 0], [1, 1, 1]], color: 'blue' },
  'J_90': { shape: [[1, 1], [1, 0], [1, 0]], color: 'blue' },
  'J_180': { shape: [[1, 1, 1], [0, 0, 1]], color: 'blue' },
  'J_270': { shape: [[0, 1], [0, 1], [1, 1]], color: 'blue' },
  'L_0': { shape: [[0, 0, 1], [1, 1, 1]], color: 'orange' },
  'L_90': { shape: [[1, 0], [1, 0], [1, 1]], color: 'orange' },
  'L_180': { shape: [[1, 1, 1], [1, 0, 0]], color: 'orange' },
  'L_270': { shape: [[1, 1], [0, 1], [0, 1]], color: 'orange' },
  'S_h': { shape: [[0, 1, 1], [1, 1, 0]], color: 'green' },
  'S_v': { shape: [[1, 0], [1, 1], [0, 1]], color: 'green' },
  'Z_h': { shape: [[1, 1, 0], [0, 1, 1]], color: 'red' },
  'Z_v': { shape: [[0, 1], [1, 1], [1, 0]], color: 'red' },
};

const TETROMINO_KEYS = Object.keys(TETROMINOES);

const SHAPE_COLORS: { [key: string]: string } = {
  cyan: 'bg-cyan-400',
  yellow: 'bg-yellow-400',
  purple: 'bg-purple-500',
  blue: 'bg-blue-500',
  orange: 'bg-orange-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
};

const wordPairs = [
  // Días de la semana
  { spanish: 'lunes', english: 'monday' },
  { spanish: 'martes', english: 'tuesday' },
  { spanish: 'miércoles', english: 'wednesday' },
  { spanish: 'jueves', english: 'thursday' },
  { spanish: 'viernes', english: 'friday' },
  { spanish: 'sábado', english: 'saturday' },
  { spanish: 'domingo', english: 'sunday' },
  // Meses del año
  { spanish: 'enero', english: 'january' },
  { spanish: 'febrero', english: 'february' },
  { spanish: 'marzo', english: 'march' },
  { spanish: 'abril', english: 'april' },
  { spanish: 'mayo', english: 'may' },
  { spanish: 'junio', english: 'june' },
  { spanish: 'julio', english: 'july' },
  { spanish: 'agosto', english: 'august' },
  { spanish: 'septiembre', english: 'september' },
  { spanish: 'octubre', english: 'october' },
  { spanish: 'noviembre', english: 'november' },
  { spanish: 'diciembre', english: 'december' },
  // Estaciones
  { spanish: 'verano', english: 'summer' },
  { spanish: 'otoño', english: 'autumn' },
  { spanish: 'invierno', english: 'winter' },
  { spanish: 'primavera', english: 'spring' },
  // Colores
  { spanish: 'rojo', english: 'red' },
  { spanish: 'azul', english: 'blue' },
  { spanish: 'verde', english: 'green' },
  { spanish: 'amarillo', english: 'yellow' },
  { spanish: 'negro', english: 'black' },
  { spanish: 'blanco', english: 'white' },
  { spanish: 'naranja', english: 'orange' },
  { spanish: 'morado', english: 'purple' },
  { spanish: 'gris', english: 'gray' },
  { spanish: 'marrón', english: 'brown' },
  // Verbos básicos
  { spanish: 'comer', english: 'eat' },
  { spanish: 'hablar', english: 'speak' },
  { spanish: 'leer', english: 'read' },
  { spanish: 'escribir', english: 'write' },
  { spanish: 'escuchar', english: 'listen' },
  { spanish: 'jugar', english: 'play' },
  { spanish: 'trabajar', english: 'work' },
  { spanish: 'estudiar', english: 'study' },
  { spanish: 'vivir', english: 'live' },
  { spanish: 'nadar', english: 'swim' },
  // Adjetivos comunes
  { spanish: 'caliente', english: 'hot' },
  { spanish: 'frío', english: 'cold' },
  { spanish: 'rápido', english: 'fast' },
  { spanish: 'lento', english: 'slow' },
  { spanish: 'grande', english: 'big' },
  { spanish: 'pequeño', english: 'small' },
  { spanish: 'fácil', english: 'easy' },
  { spanish: 'difícil', english: 'difficult' },
  { spanish: 'nuevo', english: 'new' },
  { spanish: 'viejo', english: 'old' },
  { spanish: 'bueno', english: 'good' },
  { spanish: 'malo', english: 'bad' },
  { spanish: 'feliz', english: 'happy' },
  { spanish: 'triste', english: 'sad' },
];


export default function TetrisPage() {
  const { toast } = useToast();
  const [board, setBoard] = useState<(string | null)[][]>(
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null))
  );
  
  const [shuffledWords, setShuffledWords] = useState(wordPairs);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  
  const [availableShapes, setAvailableShapes] = useState<{type: string, color: string, shape: number[][]}[]>([]);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setShuffledWords(currentWords => [...currentWords].sort(() => Math.random() - 0.5));
    const storedHighScore = parseInt(localStorage.getItem('tetrisHighScore') || '0', 10);
    setHighScore(storedHighScore);
  }, []);

  const currentWord = shuffledWords[currentWordIndex];

  const handleRestart = () => {
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null)));
    setShuffledWords([...wordPairs].sort(() => Math.random() - 0.5));
    setCurrentWordIndex(0);
    setUserAnswer('');
    setAvailableShapes([]);
    setScore(0);
  };
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData("shapeIndex", index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, rowIndex: number, colIndex: number) => {
    e.preventDefault();
    const shapeIndexStr = e.dataTransfer.getData("shapeIndex");
    if (shapeIndexStr === null) return;
    
    const shapeIndex = parseInt(shapeIndexStr, 10);
    const shapeData = availableShapes[shapeIndex];
    if (!shapeData) return;

    const { shape, color } = shapeData;
    const shapeHeight = shape.length;
    const shapeWidth = shape[0].length;
    let boardAfterPlacement = board.map(row => [...row]);
    let canPlace = true;

    for (let r = 0; r < shapeHeight; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const boardRow = rowIndex - (shapeHeight - 1) + r;
          const boardCol = colIndex + c;

          if (
            boardRow < 0 ||
            boardRow >= BOARD_HEIGHT ||
            boardCol < 0 ||
            boardCol >= BOARD_WIDTH ||
            (board[boardRow] && board[boardRow][boardCol])
          ) {
            canPlace = false;
            break;
          }
        }
      }
      if (!canPlace) break;
    }

    if (canPlace) {
      for (let r = 0; r < shapeHeight; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            const boardRow = rowIndex - (shapeHeight - 1) + r;
            const boardCol = colIndex + c;
            boardAfterPlacement[boardRow][boardCol] = color;
          }
        }
      }

      // --- Line clearing logic ---
      let nonFullRows = boardAfterPlacement.filter(row => !row.every(cell => cell !== null));
      const clearedRowCount = boardAfterPlacement.length - nonFullRows.length;
      if (clearedRowCount > 0) {
          const newEmptyRows = Array(clearedRowCount).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
          boardAfterPlacement = [...newEmptyRows, ...nonFullRows];
      }

      const fullColIndices: number[] = [];
      for (let c = 0; c < BOARD_WIDTH; c++) {
          let isColFull = true;
          for (let r = 0; r < BOARD_HEIGHT; r++) {
              if (boardAfterPlacement[r][c] === null) {
                  isColFull = false;
                  break;
              }
          }
          if (isColFull) {
              fullColIndices.push(c);
          }
      }

      let finalBoard = boardAfterPlacement;
      const clearedColCount = fullColIndices.length;
      if (clearedColCount > 0) {
          finalBoard = boardAfterPlacement.map(row => {
              const newRow = row.filter((_, index) => !fullColIndices.includes(index));
              const emptyCells = Array(clearedColCount).fill(null);
              return [...emptyCells, ...newRow];
          });
      }
      
      if (clearedRowCount > 0 || clearedColCount > 0) {
          const points = (clearedRowCount * 100) + (clearedColCount * 100);
          const newScore = score + points;
          setScore(newScore);
          if (newScore > highScore) {
              setHighScore(newScore);
              localStorage.setItem('tetrisHighScore', String(newScore));
          }

          const messages = [];
          if (clearedRowCount > 0) messages.push(`${clearedRowCount} fila(s)`);
          if (clearedColCount > 0) messages.push(`${clearedColCount} columna(s)`);
          toast({
              title: '¡Línea completada!',
              description: `Has limpiado ${messages.join(' y ')}. ¡+${points} puntos!`,
          });
      }
    
      setBoard(finalBoard);
      setAvailableShapes(prev => prev.filter((_, index) => index !== shapeIndex));

    } else {
      toast({ variant: 'destructive', title: '¡Colisión!', description: 'No puedes colocar la ficha aquí.' });
    }
  };


  const handleCheckAnswer = () => {
    if (userAnswer.trim().toLowerCase() === currentWord.english.toLowerCase()) {
      toast({ title: '¡Correcto!', description: 'Has ganado 1 ficha de Tetris.' });
      
      const randomShapeKey = TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
      const newShape = { type: randomShapeKey, ...TETROMINOES[randomShapeKey] };

      setAvailableShapes(prev => [...prev, newShape]);

      setCurrentWordIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex >= shuffledWords.length) {
            setShuffledWords([...wordPairs].sort(() => Math.random() - 0.5));
            return 0;
        }
        return nextIndex;
      });
      setUserAnswer('');
    } else {
      toast({ variant: 'destructive', title: 'Incorrecto', description: 'Inténtalo de nuevo.' });
    }
  };

  return (
    <div className="flex w-full flex-col min-h-screen">
      <DashboardHeader />
      <main className="flex-1 p-4 md:p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold dark:text-primary">Tetris de Vocabulario</h1>
          <p className="text-muted-foreground mt-2">Construye con tu conocimiento.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <div className="lg:col-span-2">
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Tablero de Tetris</CardTitle>
                  <CardDescription>
                    Completa filas o columnas para ganar puntos.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Button onClick={handleRestart} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reiniciar
                  </Button>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Puntuación:</span>
                      <span className="font-bold text-lg">{score}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span className="text-xs text-muted-foreground">Más alta: {highScore}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex justify-center p-2">
                <div className="grid gap-1 max-w-md w-full" style={{ gridTemplateColumns: `repeat(${BOARD_WIDTH}, minmax(0, 1fr))` }}>
                  {board.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
                        className={cn(
                          'w-full aspect-square border cursor-pointer transition-colors',
                          cell ? `${SHAPE_COLORS[cell]} border-slate-600` : 'bg-muted/50 border-border hover:bg-muted'
                        )}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple sticky top-24">
              <CardHeader>
                <CardTitle>Desafío de Traducción</CardTitle>
                <CardDescription>Traduce la palabra para ganar fichas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Traduce la palabra:</p>
                  <p className="text-2xl font-bold">{isClient ? currentWord.spanish : "..."}</p>
                </div>
                <Input
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheckAnswer()}
                />
                <Button onClick={handleCheckAnswer} className="w-full">
                  Verificar
                </Button>
                <div className="text-center pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Fichas disponibles</p>
                    {availableShapes.length === 0 ? (
                    <p className="text-muted-foreground mt-2">Traduce para ganar fichas.</p>
                    ) : (
                    <>
                      <div className="flex flex-wrap gap-4 mt-2 justify-center">
                          {availableShapes.map((shape, index) => (
                          <div 
                              key={index} 
                              draggable="true"
                              onDragStart={(e) => handleDragStart(e, index)}
                              className='cursor-grab p-1 border-2 border-transparent rounded-md'
                          >
                              <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${shape.shape[0].length}, 1rem)` }}>
                              {shape.shape.flat().map((cell, i) => (
                                  <div key={i} className={cn(
                                  'h-4 w-4',
                                  cell ? SHAPE_COLORS[shape.color] : 'bg-transparent'
                                  )}/>
                              ))}
                              </div>
                          </div>
                          ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-4 bg-muted p-2 rounded-md border">
                        Arrastra una ficha desde la sección 'Fichas disponibles'. La celda donde la sueltes en el tablero será la esquina inferior izquierda de la pieza.
                      </p>
                    </>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
