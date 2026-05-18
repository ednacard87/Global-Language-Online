'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BrainCircuit, RefreshCw, Flame, Trophy, ArrowRight } from 'lucide-react';

interface AdjectivePair {
    spanish: string;
    english: string[];
}

interface AdjectivesMemoryGameProps {
    data: AdjectivePair[];
    onComplete: () => void;
}

export const AdjectivesMemoryGame = ({ data, onComplete }: AdjectivesMemoryGameProps) => {
    const [cards, setCards] = useState<any[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [matchedPairIds, setMatchedPairIds] = useState<number[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const [streak, setStreak] = useState(0);
    const [isClient, setIsClient] = useState(false);
    const [gameComplete, setGameComplete] = useState(false);

    const PAIRS_TO_SHOW = 12;

    useEffect(() => {
        setIsClient(true);
    }, []);

    const initializeGame = useCallback(() => {
        // Pick random subset of pairs from the provided data
        const shuffledData = [...data].sort(() => Math.random() - 0.5);
        const selectedPairs = shuffledData.slice(0, PAIRS_TO_SHOW);

        const gameCards = selectedPairs.flatMap((pair, index) => [
            { id: index * 2, pairId: index, text: pair.spanish, type: 'es' },
            { id: index * 2 + 1, pairId: index, text: pair.english[0], type: 'en' },
        ]).sort(() => Math.random() - 0.5);
        
        setCards(gameCards);
        setFlippedIndices([]);
        setMatchedPairIds([]);
        setIsChecking(false);
        setStreak(0);
        setGameComplete(false);
    }, [data]);

    useEffect(() => {
        if (isClient) {
            initializeGame();
        }
    }, [isClient, initializeGame]);
    
    useEffect(() => {
        if (flippedIndices.length === 2) {
            setIsChecking(true);
            const [firstIndex, secondIndex] = flippedIndices;
            const firstCard = cards[firstIndex];
            const secondCard = cards[secondIndex];

            if (firstCard.pairId === secondCard.pairId) {
                setMatchedPairIds(prev => [...prev, firstCard.pairId]);
                setStreak(prev => prev + 1);
                setFlippedIndices([]);
                setIsChecking(false);
            } else {
                setStreak(0);
                setTimeout(() => {
                    setFlippedIndices([]);
                    setIsChecking(false);
                }, 800);
            }
        }
    }, [flippedIndices, cards]);

    useEffect(() => {
        if (matchedPairIds.length === PAIRS_TO_SHOW && PAIRS_TO_SHOW > 0 && !gameComplete) {
            setGameComplete(true);
            // We removed the immediate onComplete() call to allow showing the "Congratulations" screen first
        }
    }, [matchedPairIds.length, gameComplete]);

    const handleCardClick = (index: number) => {
        if (isChecking || flippedIndices.length >= 2 || flippedIndices.includes(index) || matchedPairIds.includes(cards[index].pairId)) {
            return;
        }
        setFlippedIndices(prev => [...prev, index]);
    };

    if (!isClient) return null;

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Memory Game (Adjectives)</CardTitle>
                    <CardDescription>Empareja el adjetivo en español con su traducción.</CardDescription>
                </div>
                {!gameComplete && (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-orange-500 font-bold bg-orange-500/10 px-3 py-1 rounded-full">
                            <Flame className="h-5 w-5" />
                            <span>{streak}</span>
                        </div>
                        <Button size="icon" variant="outline" onClick={initializeGame}><RefreshCw className="h-5 w-5" /></Button>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                {gameComplete ? (
                     <div className="text-center p-12 flex flex-col items-center animate-in fade-in zoom-in duration-500">
                        <Trophy className="h-20 w-20 text-yellow-400 mb-6 animate-bounce" />
                        <h2 className="text-4xl font-black bg-gradient-to-r from-brand-purple to-brand-teal text-transparent bg-clip-text uppercase tracking-tighter">Congratulations!</h2>
                        <p className="text-muted-foreground mt-2 mb-8 font-medium text-lg">Has logrado emparejar todos los términos correctamente. ¡Misión cumplida!</p>
                        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                            <Button variant="outline" size="lg" onClick={initializeGame} className="font-bold min-w-[150px]">Jugar de nuevo</Button>
                            <Button size="lg" onClick={onComplete} className="font-bold px-12 bg-green-600 hover:bg-green-700 min-w-[150px] shadow-lg shadow-green-500/20">
                                Avanzar <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </div>
                     </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {cards.map((card, index) => {
                            const isFlipped = flippedIndices.includes(index);
                            const isMatched = matchedPairIds.includes(card.pairId);
                            return (
                                <div 
                                    key={card.id}
                                    onClick={() => handleCardClick(index)}
                                    className={cn(
                                        "flex items-center justify-center aspect-square cursor-pointer transition-all duration-300 rounded-xl border-2 text-center p-2 select-none",
                                        isFlipped || isMatched 
                                            ? "bg-primary/20 border-primary shadow-inner" 
                                            : "bg-secondary border-border hover:border-primary/50 hover:bg-secondary/80",
                                        isMatched && "bg-green-500/10 border-green-500 opacity-60"
                                    )}
                                >
                                    {isFlipped || isMatched ? (
                                        <span className={cn(
                                            "text-[10px] sm:text-xs font-black uppercase tracking-tight leading-tight",
                                            isMatched ? "text-green-700" : "text-primary"
                                        )}>
                                            {card.text}
                                        </span>
                                    ) : (
                                        <BrainCircuit className="h-6 w-6 text-primary/30" />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
            {!gameComplete && (
                <CardFooter className="justify-center border-t py-4 text-xs text-muted-foreground">
                    Misión: Encuentra las {PAIRS_TO_SHOW} parejas para avanzar.
                </CardFooter>
            )}
        </Card>
    );
};
