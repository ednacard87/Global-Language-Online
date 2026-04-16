'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BrainCircuit, RefreshCw, Flame, Trophy } from 'lucide-react';

export const ToBeMemoryGame = ({ onGameComplete }: { onGameComplete: () => void }) => {
    const [level, setLevel] = useState(1);
    const [cards, setCards] = useState<any[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [matchedPairIds, setMatchedPairIds] = useState<number[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const [streak, setStreak] = useState(0);
    const [completionFired, setCompletionFired] = useState(false);

    const levelConfig = useMemo(() => ({
        1: { 
            name: 'Nivel 1 (Ser)',
            grid: 'grid-cols-4',
            pairs: [
                { english: 'i am', spanish: 'yo soy' },
                { english: 'you are', spanish: 'tú eres' },
                { english: 'he is', spanish: 'él es' },
                { english: 'she is', spanish: 'ella es' },
                { english: 'it is', spanish: 'esto es' },
                { english: 'we are', spanish: 'nosotros somos' },
                { english: 'they are', spanish: 'ellos son' },
            ]
        },
        2: { 
            name: 'Nivel 2 (Estar)',
            grid: 'grid-cols-4',
            pairs: [
                { english: 'i am', spanish: 'yo estoy' },
                { english: 'you are', spanish: 'tú estás' },
                { english: 'you are', spanish: 'usted está' },
                { english: 'he is', spanish: 'él está' },
                { english: 'she is', spanish: 'ella está' },
                { english: 'we are', spanish: 'nosotros estamos' },
                { english: 'they are', spanish: 'ellos están' },
            ]
        },
    }), []);

    const currentLevelConfig = levelConfig[level as keyof typeof levelConfig];

    const initializeGame = (lvl: number) => {
        const { pairs } = levelConfig[lvl as keyof typeof levelConfig];
        
        const gameCards = pairs.flatMap((pair, index) => [
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
        initializeGame(level);
    }, [level]);

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

    const isLevelComplete = matchedPairIds.length > 0 && matchedPairIds.length === currentLevelConfig.pairs.length;

    useEffect(() => {
        if (isLevelComplete && !completionFired) {
            if (level === Object.keys(levelConfig).length) {
                onGameComplete();
                setCompletionFired(true);
            }
        }
    }, [isLevelComplete, level, onGameComplete, levelConfig, completionFired]);

    const handleCardClick = (index: number) => {
        if (isChecking || flippedIndices.length >= 2 || flippedIndices.includes(index) || matchedPairIds.includes(cards[index].pairId)) {
            return;
        }
        setFlippedIndices(prev => [...prev, index]);
    };
    
    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>Memory (To be)</CardTitle>
                <div className="flex justify-between items-center pt-2">
                     <div className="flex gap-2 items-center">
                        {Object.keys(levelConfig).map(lvlStr => {
                            const lvl = parseInt(lvlStr);
                            return (
                                <Button key={lvl} variant={level === lvl ? 'default' : 'outline'} onClick={() => setLevel(lvl)}>
                                    {levelConfig[lvl as keyof typeof levelConfig].name}
                                </Button>
                            )
                        })}
                        <Button size="icon" variant="ghost" onClick={() => initializeGame(level)} className="ml-2">
                            <RefreshCw className="h-5 w-5" />
                        </Button>
                    </div>
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
                         <h2 className="text-2xl font-bold">¡Nivel {level} Completado!</h2>
                         {level < Object.keys(levelConfig).length ? (
                             <Button className="mt-4" onClick={() => setLevel(l => l + 1)}>Siguiente Nivel</Button>
                         ) : (
                             <p className="text-muted-foreground mt-2">¡Has completado todos los niveles!</p>
                         )}
                    </div>
                ) : (
                    <div className={cn("grid gap-1 md:gap-2", currentLevelConfig.grid)}>
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
