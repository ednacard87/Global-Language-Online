'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RefreshCw, Trophy, CheckCircle2 } from 'lucide-react';

interface WordPair {
    spanish: string;
    english: string[];
}

interface VocabularyMatchingGameProps {
    data: WordPair[];
    onComplete: () => void;
    title?: string;
}

export function VocabularyMatchingGame({ data, onComplete, title }: VocabularyMatchingGameProps) {
    const [cards, setCards] = useState<{ id: string; text: string; pairId: number; type: 'es' | 'en' }[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [matchedPairIds, setMatchedPairIds] = useState<Set<number>>(new Set());
    const [isClient, setIsClient] = useState(false);
    const [gameComplete, setGameComplete] = useState(false);

    const PAIRS_TO_SHOW = Math.min(data.length, 12);

    const initializeGame = useCallback(() => {
        const shuffledData = [...data].sort(() => Math.random() - 0.5);
        const selectedPairs = shuffledData.slice(0, PAIRS_TO_SHOW);

        const gameCards = selectedPairs.flatMap((pair, index) => [
            { id: `es-${index}`, pairId: index, text: pair.spanish, type: 'es' as const },
            { id: `en-${index}`, pairId: index, text: pair.english[0], type: 'en' as const },
        ]).sort(() => Math.random() - 0.5);
        
        setCards(gameCards);
        setSelectedId(null);
        setMatchedPairIds(new Set());
        setGameComplete(false);
    }, [data, PAIRS_TO_SHOW]);

    useEffect(() => {
        setIsClient(true);
        initializeGame();
    }, [initializeGame]);

    const handleCardClick = (cardId: string, pairId: number) => {
        if (matchedPairIds.has(pairId)) return;

        if (selectedId === null) {
            setSelectedId(cardId);
            return;
        }

        if (selectedId === cardId) {
            setSelectedId(null);
            return;
        }

        const firstCard = cards.find(c => c.id === selectedId);
        const secondCard = cards.find(c => c.id === cardId);

        if (firstCard && secondCard && firstCard.pairId === secondCard.pairId && firstCard.type !== secondCard.type) {
            const newMatched = new Set(matchedPairIds);
            newMatched.add(pairId);
            setMatchedPairIds(newMatched);
            setSelectedId(null);

            if (newMatched.size === PAIRS_TO_SHOW) {
                setGameComplete(true);
                onComplete();
            }
        } else {
            setSelectedId(cardId);
        }
    };

    if (!isClient) return null;

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                    <CardTitle className="text-2xl">{title || 'Vocabulary Matching'}</CardTitle>
                    <CardDescription>Haz clic en una palabra y luego en su traducción correcta.</CardDescription>
                </div>
                <Button size="icon" variant="outline" onClick={initializeGame} className="shrink-0">
                    <RefreshCw className="h-5 w-5" />
                </Button>
            </CardHeader>
            <CardContent>
                {gameComplete ? (
                     <div className="text-center p-12 flex flex-col items-center animate-in fade-in zoom-in duration-500">
                        <Trophy className="h-20 w-20 text-yellow-400 mb-6 animate-bounce" />
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-brand-purple to-brand-teal text-transparent bg-clip-text">¡Excelente Asociación!</h2>
                        <p className="text-muted-foreground mt-2 mb-8">Has logrado emparejar todos los términos correctamente.</p>
                        <Button size="lg" onClick={initializeGame} className="font-bold">Jugar de nuevo</Button>
                     </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {cards.map((card) => {
                            const isSelected = selectedId === card.id;
                            const isMatched = matchedPairIds.has(card.pairId);
                            return (
                                <div 
                                    key={card.id}
                                    onClick={() => handleCardClick(card.id, card.pairId)}
                                    className={cn(
                                        "flex items-center justify-center min-h-[60px] p-3 cursor-pointer transition-all duration-200 rounded-xl border-2 text-center select-none shadow-sm",
                                        isMatched 
                                            ? "bg-green-500/10 border-green-500 text-green-700 opacity-60 pointer-events-none" 
                                            : isSelected
                                                ? "bg-primary/20 border-primary text-primary scale-105 shadow-md"
                                                : "bg-secondary border-border hover:border-primary/40 hover:bg-secondary/80",
                                    )}
                                >
                                    {isMatched && <CheckCircle2 className="absolute -top-2 -right-2 h-5 w-5 text-green-500 bg-background rounded-full" />}
                                    <span className={cn(
                                        "text-xs sm:text-sm font-bold uppercase tracking-tight leading-tight",
                                        isMatched ? "text-green-700" : (isSelected ? "text-primary" : "text-foreground")
                                    )}>
                                        {card.text}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
            {!gameComplete && (
                <CardFooter className="justify-center border-t py-4">
                    <p className="text-sm font-medium text-muted-foreground">
                        Progreso: <span className="text-primary">{matchedPairIds.size}</span> / {PAIRS_TO_SHOW} parejas
                    </p>
                </CardFooter>
            )}
        </Card>
    );
}
