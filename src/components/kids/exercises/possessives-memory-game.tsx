'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BrainCircuit, RefreshCw, Flame, Trophy } from 'lucide-react';

export const PossessivesMemoryGame = ({ onGameComplete }: { onGameComplete: () => void }) => {
    const [cards, setCards] = useState<any[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [matchedPairIds, setMatchedPairIds] = useState<number[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const [streak, setStreak] = useState(0);
    const [completionFired, setCompletionFired] = useState(false);

    const possessivesPairs = useMemo(() => [
        { english: 'my', spanish: 'mi-mis' },
        { english: 'your', spanish: 'tu-tus' },
        { english: 'his', spanish: 'su-sus (de él)' },
        { english: 'her', spanish: 'su-sus (de ella)' },
        { english: 'its', spanish: 'su-sus (del animal)' },
        { english: 'our', spanish: 'nuestro(a-os-as)' },
        { english: 'their', spanish: 'su-sus (de ellos)' },
    ], []);

    const initializeGame = () => {
        const gameCards = possessivesPairs.flatMap((pair, index) => [
            { id: index * 2, pairId: index, text: pair.english },
            { id: index * 2 + 1, pairId: index, text: pair.spanish },
        ]);

        for (let i = gameCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [gameCards[i], gameCards[j]] = [gameCards[j], gameCards[i]];
        }
        
        setCards(gameCards);
        setFlippedIndices([]);
        setMatchedPairIds([]);
        setIsChecking(false);
        setStreak(0);
        setCompletionFired(false);
    };

    useEffect(() => {
        initializeGame();
    }, [possessivesPairs]);

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
                setStreak(0);
                setTimeout(() => {
                    setFlippedIndices([]);
                    setIsChecking(false);
                }, 800);
            }
        }
    }, [flippedIndices, cards]);

    const isLevelComplete = matchedPairIds.length > 0 && matchedPairIds.length === possessivesPairs.length;

    useEffect(() => {
        if (isLevelComplete && !completionFired) {
            onGameComplete();
            setCompletionFired(true);
        }
    }, [isLevelComplete, onGameComplete, completionFired]);

    const handleCardClick = (index: number) => {
        if (isChecking || flippedIndices.length >= 2 || flippedIndices.includes(index) || matchedPairIds.includes(cards[index].pairId)) {
            return;
        }
        setFlippedIndices(prev => [...prev, index]);
    };
    
    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>Memory (Posesivos)</CardTitle>
                <div className="flex justify-between items-center pt-2">
                    <Button size="icon" variant="ghost" onClick={initializeGame} className="ml-2">
                        <RefreshCw className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2 text-orange-500 font-bold">
                        <Flame className="h-5 w-5" />
                        <span>{streak}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLevelComplete ? (
                    <div className="text-center p-8 flex flex-col items-center">
                         <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
                         <h2 className="text-2xl font-bold">¡Juego Completado!</h2>
                         <p className="text-muted-foreground mt-2">¡Has completado el juego de memoria!</p>
                    </div>
                ) : (
                    <div className={cn("grid grid-cols-4 gap-1 md:gap-2")}>
                        {cards.map((card, index) => {
                            const isFlipped = flippedIndices.includes(index);
                            const isMatched = matchedPairIds.includes(card.pairId);
                            return (
                                <Card 
                                    key={card.id}
                                    onClick={() => handleCardClick(index)}
                                    className={cn(
                                        "flex items-center justify-center aspect-square cursor-pointer transition-all",
                                        isFlipped || isMatched ? "bg-card border-primary" : "bg-secondary hover:bg-secondary/80",
                                        isMatched && "border-green-500 border-2",
                                        !isFlipped && !isMatched && "hover:scale-105"
                                    )}
                                >
                                    <CardContent className="p-1 flex items-center justify-center">
                                        {isFlipped || isMatched ? (
                                            <span className="text-xs md:text-sm font-bold text-center">{card.text}</span>
                                        ) : (
                                            <BrainCircuit className="h-4 w-4 md:h-5 w-5 text-primary/50" />
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
