'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Trophy } from 'lucide-react';

const defaultFillInTheBlanksVerbs = [
    { spanish: 'comer', english: 'eat', gapped: 'e_t' },
    { spanish: 'beber', english: 'drink', gapped: 'dr_nk' },
    { spanish: 'dormir', english: 'sleep', gapped: 'sle_p' },
    { spanish: 'correr', english: 'run', gapped: 'r_n' },
    { spanish: 'caminar', english: 'walk', gapped: 'w_lk' },
    { spanish: 'jugar', english: 'play', gapped: 'pl_y' },
    { spanish: 'leer', english: 'read', gapped: 're_d' },
    { spanish: 'escribir', english: 'write', gapped: 'wr_te' },
    { spanish: 'escuchar', english: 'listen', gapped: 'list_n' },
    { spanish: 'estudiar', english: 'study', gapped: 'stu_y' },
    { spanish: 'abrir', english: 'open', gapped: 'op_n' },
    { spanish: 'cerrar', english: 'close', gapped: 'cl_se' },
    { spanish: 'sentarse', english: 'sit', gapped: 's_t' },
    { spanish: 'estar de pie', english: 'stand', gapped: 'sta_d' },
];

export const FillInTheBlanksExercise = ({ onComplete, data, title }: { onComplete: () => void, data?: { spanish: string; english: string; gapped: string; }[], title?: string }) => {
    const { t } = useTranslation();
    const { toast } = useToast();
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [isCompleted, setIsCompleted] = useState(false);

    const exerciseData = data || defaultFillInTheBlanksVerbs;
    const currentExercise = exerciseData[currentIndex];
    
    const missingLetter = useMemo(() => {
        const full = currentExercise.english;
        const gapped = currentExercise.gapped;
        const gapIndex = gapped.indexOf('_');
        if (gapIndex === -1) return '';
        return full[gapIndex];
    }, [currentExercise]);


    const handleCheck = () => {
        if (userAnswer.trim().toLowerCase() === missingLetter.toLowerCase()) {
            if (currentIndex === exerciseData.length - 1) {
                toast({ title: t('spellingExercise.correct'), description: '¡Ejercicio completado!' });
                setIsCompleted(true);
                onComplete();
            } else {
                toast({ title: t('spellingExercise.correct') });
                setCurrentIndex(prev => prev + 1);
                setUserAnswer('');
            }
        } else {
            toast({ variant: 'destructive', title: t('spellingExercise.incorrect') });
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCheck();
        }
    };

    const GappedWordDisplay = () => {
        const parts = currentExercise.gapped.split('_');
        return (
            <div className="flex items-center justify-center font-mono tracking-widest bg-muted p-6 rounded-lg gap-2">
                <span className="text-xl">{parts[0]}</span>
                <Input
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    maxLength={1}
                    className="w-12 h-12 text-3xl text-center border-2 border-dashed border-primary rounded-md"
                />
                <span className="text-xl">{parts[1]}</span>
            </div>
        )
    }

    if (isCompleted) {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
                    <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
                    <h2 className="text-3xl font-bold">¡Ejercicio Completado!</h2>
                    <p className="text-muted-foreground mt-2">Has completado el ejercicio de vocabulario.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>{title || t('kidsA1Class2.vocabVerbs')}</CardTitle>
                <CardDescription>Completa la palabra con la letra que falta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>{currentIndex + 1} / {exerciseData.length}</span>
                </div>
                <div className="text-center text-2xl font-semibold text-muted-foreground">{currentExercise.spanish}</div>
                <GappedWordDisplay />
            </CardContent>
            <CardFooter>
                <Button onClick={handleCheck}>Verificar</Button>
            </CardFooter>
        </Card>
    );
};
