'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/language-context';
import { cn } from '@/lib/utils';
import { BrainCircuit, CheckCircle, Timer, Trophy, RefreshCw, Flame } from 'lucide-react';

const level1WordPairs = [
    { spanish: 'rojo', english: 'red' },
    { spanish: 'azul', english: 'blue' },
    { spanish: 'verde', english: 'green' },
    { spanish: 'amarillo', english: 'yellow' },
    { spanish: 'negro', english: 'black' },
    { spanish: 'blanco', english: 'white' },
];

const level2WordPairs = [
    { spanish: 'lunes', english: 'monday' },
    { spanish: 'martes', english: 'tuesday' },
    { spanish: 'miércoles', english: 'wednesday' },
    { spanish: 'jueves', english: 'thursday' },
    { spanish: 'viernes', english: 'friday' },
    { spanish: 'sábado', english: 'saturday' },
    { spanish: 'domingo', english: 'sunday' },
    { spanish: 'comer', english: 'eat' },
    { spanish: 'hablar', english: 'speak' },
];

const level3WordPairs = [
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
    { spanish: 'verano', english: 'summer' },
    { spanish: 'invierno', english: 'winter' },
    { spanish: 'leer', english: 'read' },
    { spanish: 'escribir', english: 'write' },
];

const level4WordPairs = [
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
    { spanish: 'primavera', english: 'spring' },
    { spanish: 'otoño', english: 'autumn' },
    { spanish: 'mañana', english: 'morning' },
    { spanish: 'tarde', english: 'afternoon' },
];

const level5WordPairs = [
    { spanish: 'noviembre', english: 'november' },
    { spanish: 'diciembre', english: 'december' },
    { spanish: 'escuchar', english: 'listen' },
    { spanish: 'noche', english: 'night' },
    { spanish: 'siempre', english: 'always' },
];


type CardData = {
    id: number;
    pairId: number;
    text: string;
    language: 'spanish' | 'english';
};

const gridColsByLevel: { [key: number]: string } = {
    1: 'grid-cols-4',
    2: 'grid-cols-6',
    3: 'grid-cols-5',
    4: 'grid-cols-6',
    5: 'grid-cols-6',
};


export default function MemoryGamePage() {
    const { t } = useTranslation();
    const [gameLevel, setGameLevel] = useState(1);
    const [cards, setCards] = useState<CardData[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [matchedPairIds, setMatchedPairIds] = useState<number[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const [shakeError, setShakeError] = useState(false);
    const [streak, setStreak] = useState(0);
    
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);
    const [bestTime, setBestTime] = useState(Infinity);
    
    const wordPairsByLevel: { [key: number]: { spanish: string, english: string }[] } = {
        1: level1WordPairs, // 6 pairs -> 4x3
        2: level2WordPairs, // 9 pairs -> 6x3
        3: level3WordPairs.slice(0, 10), // 10 pairs -> 5x4
        4: level4WordPairs.slice(0, 12), // 12 pairs -> 6x4
        5: [...level3WordPairs.slice(10), ...level4WordPairs.slice(12), ...level5WordPairs], // 4 + 6 + 5 = 15 pairs -> 6x5
    };

    const currentWordPairs = useMemo(() => {
        return wordPairsByLevel[gameLevel];
    }, [gameLevel]);

    const isLevelComplete = useMemo(() => matchedPairIds.length === currentWordPairs.length && currentWordPairs.length > 0, [matchedPairIds, currentWordPairs.length]);

    const initializeGame = (level: number) => {
        const wordPairsForLevel = wordPairsByLevel[level];

        const gameCards = wordPairsForLevel.flatMap((pair, index) => [
            { id: index * 2, pairId: index, text: pair.spanish, language: 'spanish' as const },
            { id: index * 2 + 1, pairId: index, text: pair.english, language: 'english' as const },
        ]);

        for (let i = gameCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [gameCards[i], gameCards[j]] = [gameCards[j], gameCards[i]];
        }
        
        setCards(gameCards);
        setTimeElapsed(0);
        setGameStarted(false);
        setFlippedIndices([]);
        setMatchedPairIds([]);
        setIsChecking(false);
        setShakeError(false);
        setStreak(0);
        
        const storedBestTime = parseInt(localStorage.getItem(`memoryGame_bestTime_L${level}`) || '0', 10) || Infinity;
        setBestTime(storedBestTime);
    };

    useEffect(() => {
        initializeGame(gameLevel);
    }, [gameLevel]);

    useEffect(() => {
        if (!gameStarted || isLevelComplete) {
            return;
        }
        const timer = setInterval(() => {
            setTimeElapsed(prevTime => prevTime + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [gameStarted, isLevelComplete]);

    useEffect(() => {
        if (flippedIndices.length === 2) {
            setIsChecking(true);
            const [firstIndex, secondIndex] = flippedIndices;
            const firstCard = cards[firstIndex];
            const secondCard = cards[secondIndex];

            if (firstCard.pairId === secondCard.pairId) {
                setMatchedPairIds(prev => [...prev, firstCard.pairId]);
                setStreak(prev => prev + 1);
                setTimeout(() => {
                    setFlippedIndices([]);
                    setIsChecking(false);
                }, 500);
            } else {
                setShakeError(true);
                setStreak(0);
                setTimeout(() => {
                    setFlippedIndices([]);
                    setIsChecking(false);
                    setShakeError(false);
                }, 800);
            }
        }
    }, [flippedIndices, cards]);
    
    useEffect(() => {
        if (isLevelComplete) {
            setGameStarted(false); // Stop the timer
            
            const newBestTime = Math.min(bestTime, timeElapsed);

            if (newBestTime < bestTime) {
                localStorage.setItem(`memoryGame_bestTime_L${gameLevel}`, String(newBestTime));
                setBestTime(newBestTime);
            }
        }
    }, [isLevelComplete, timeElapsed, bestTime, gameLevel]);


    const handleCardClick = (index: number) => {
        if (!gameStarted) {
            setGameStarted(true);
        }
        if (isChecking || flippedIndices.length >= 2 || flippedIndices.includes(index) || matchedPairIds.includes(cards[index].pairId)) {
            return;
        }
        setFlippedIndices(prev => [...prev, index]);
    };

    const handleNextLevel = () => {
        if (gameLevel < 5) {
            setGameLevel(prev => prev + 1);
        }
    };

    const handlePlayAgain = () => {
        if(gameLevel === 1) {
            initializeGame(1);
        } else {
            setGameLevel(1);
        }
    };

    const handleRestart = () => {
        initializeGame(gameLevel);
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    const GameCard = ({ card, index }: { card: CardData, index: number }) => {
        const isFlipped = flippedIndices.includes(index);
        const isMatched = matchedPairIds.includes(card.pairId);

        return (
            <Card 
                onClick={() => handleCardClick(index)}
                className={cn(
                    "flex items-center justify-center aspect-[3/4] cursor-pointer",
                    isFlipped || isMatched ? "bg-card border-primary" : "bg-secondary hover:bg-secondary/80",
                    isMatched && "border-green-500 border-2 shadow-lg shadow-green-500/50"
                )}
            >
                <CardContent className="p-1 flex items-center justify-center">
                    {isFlipped || isMatched ? (
                        <span className="text-xs md:text-sm font-semibold text-center">{card.text}</span>
                    ) : (
                        <BrainCircuit className="h-5 w-5 md:h-6 w-6 text-primary/50" />
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="flex w-full flex-col min-h-screen">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold dark:text-primary">{t('memoryGame.title')} - {t('memoryGame.level')} {gameLevel}</h1>
                    <p className="text-muted-foreground mt-2">{t('memoryGame.description')}</p>
                </div>
                
                <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-4">
                     <div className="w-full flex justify-between items-center h-10 px-2">
                        <Button onClick={handleRestart} variant="outline">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reiniciar
                        </Button>
                        
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-orange-500 font-bold p-2 rounded-lg bg-card border-2 border-orange-400/50 shadow-soft">
                                <Flame className="h-5 w-5" />
                                <span>{streak}</span>
                            </div>
                            <div className="flex items-center gap-2 font-medium p-2 rounded-lg bg-card border-2 border-brand-purple shadow-soft">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-xs text-muted-foreground">Mejor:</span>
                                    <span className="text-base font-bold">{bestTime === Infinity ? 'N/A' : formatTime(bestTime)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xl sm:text-2xl font-mono font-semibold">
                                <Timer className="h-6 w-6 sm:h-7 w-7" />
                                <span>{formatTime(timeElapsed)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full">
                        {isLevelComplete ? (
                            <div className="text-center p-8 bg-card rounded-lg shadow-lg border-2 border-green-500 w-full aspect-video flex flex-col justify-center">
                                <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
                                <h2 className="text-3xl font-bold mt-4 text-primary">{t('memoryGame.congratulations')}</h2>
                                <p className="text-muted-foreground mt-2">
                                    {gameLevel < 5 ? t('memoryGame.levelComplete', { level: gameLevel }) : t('memoryGame.allLevelsComplete')}
                                </p>
                                <div className="mt-4 text-xl font-mono">
                                    Tiempo: {formatTime(timeElapsed)}
                                </div>
                                <div className="flex justify-center gap-4 mt-6">
                                    {gameLevel < 5 ? (
                                        <Button onClick={handleNextLevel}>
                                            {t('memoryGame.nextLevel')}
                                        </Button>
                                    ) : (
                                        <Button onClick={handlePlayAgain}>
                                            {t('memoryGame.playAgain')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                             <div className={cn("grid gap-2 md:gap-3 w-full", gridColsByLevel[gameLevel], shakeError && "animate-shake")}>
                                {cards.map((card, index) => (
                                <GameCard key={card.id} card={card} index={index} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
