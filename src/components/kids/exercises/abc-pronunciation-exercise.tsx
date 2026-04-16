'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';

export const AbcPronunciationExercise = ({ onGameComplete }: { onGameComplete: () => void }) => {
    const { t } = useTranslation();
    const abcExercises = [
        { pronunciation: '(em) (ou) (ti) (eich) (i) (ar)', answer: 'mother' },
        { pronunciation: '(ef) (ei) (ti) (eich) (i) (ar)', answer: 'father' },
        { pronunciation: '(es) (ai) (es) (ti) (i) (ar)', answer: 'sister' },
        { pronunciation: '(bi) (ar) (ou) (ti) (eich) (i) (ar)', answer: 'brother' },
        { pronunciation: '(guai) (i) (el) (el) (ou) (dabliu)', answer: 'yellow' },
        { pronunciation: '(bi) (el) (iu) (i)', answer: 'blue' },
        { pronunciation: '(ar) (i) (di)', answer: 'red' },
        { pronunciation: '(es) (iu) (en)', answer: 'sun' },
        { pronunciation: '(em) (ou) (ou) (en)', answer: 'moon' },
        { pronunciation: '(es) (ti) (iu) (di) (i) (en) (ti)', answer: 'student' }
    ];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [showCongratulations, setShowCongratulations] = useState(false);
    const { toast } = useToast();

    const currentExercise = abcExercises[currentIndex];

    const handleCheck = () => {
        if (answer.trim().toLowerCase() === currentExercise.answer.toLowerCase()) {
            if (currentIndex === abcExercises.length - 1) {
                setShowCongratulations(true);
                onGameComplete();
            } else {
                toast({ title: t('spellingExercise.correct'), description: t('spellingExercise.nextWord') });
                setCurrentIndex(prev => prev + 1);
                setAnswer('');
            }
        } else {
            toast({ variant: 'destructive', title: t('spellingExercise.incorrect'), description: t('spellingExercise.incorrectDescription') });
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleCheck();
        }
    };
    
    if (showCongratulations) {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
                    <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
                    <h2 className="text-3xl font-bold">{t('intro1Page.congratulations')}</h2>
                    <p className="text-muted-foreground mt-2">{t('spellingExercise.allExercisesComplete')}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>Ejercicio de ABC ({currentIndex + 1}/{abcExercises.length})</CardTitle>
                <CardDescription>{t('spellingExercise.writeWordForPronunciation')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg text-center font-mono text-lg tracking-widest">
                    {currentExercise.pronunciation}
                </div>
                <div>
                    <Input
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleCheck}>{t('spellingExercise.check')}</Button>
            </CardFooter>
        </Card>
    );
};
