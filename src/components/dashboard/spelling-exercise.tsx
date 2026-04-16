'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Bomb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/language-context';
import { spellingExercisesData, type SpellingExerciseKey } from '@/lib/course-data';

export { type SpellingExerciseKey };

export function SpellingExercise({ exerciseKey, onComplete }: { exerciseKey?: SpellingExerciseKey | null, onComplete?: (completedTopicName: SpellingExerciseKey) => void }) {
    const { t } = useTranslation();
    const data = exerciseKey ? spellingExercisesData[exerciseKey] : undefined;
    const { title, exercises } = data || { title: 'spellingExercise.loading', exercises: [] };
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [inputValue, setInputValue] = useState('');
    const { toast } = useToast();

    const currentExercise = exercises?.[currentIndex];
    
    useEffect(() => {
        setCurrentIndex(0);
        setInputValue('');
    }, [exerciseKey]);
    
    const handleCheck = () => {
        if (!currentExercise || !exerciseKey) return;
        if (inputValue.trim().toLowerCase() === currentExercise.transcript.toLowerCase()) {
            if (exercises && currentIndex === exercises.length - 1) {
                if (onComplete) {
                    onComplete(exerciseKey);
                }
            } else {
                toast({ title: t('spellingExercise.correct') });
                if (exercises && currentIndex < exercises.length - 1) {
                    setCurrentIndex(currentIndex + 1);
                    setInputValue('');
                }
            }
        } else {
            toast({
                variant: 'destructive',
                title: t('spellingExercise.incorrect'),
                description: t('spellingExercise.incorrectDescription')
            });
        }
    };

    const handleAudioError = () => {
        toast({
            variant: 'destructive',
            title: t('audio.errorTitle'),
            description: t('audio.loadError'),
        });
    }
    
    if (!data || !exercises || !exerciseKey) {
        return (
             <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardHeader>
                    <CardTitle>{t(title) || t('spellingExercise.loading')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                </CardContent>
             </Card>
        );
    }

    const isNumberExercise = exerciseKey.startsWith('numbers') || exerciseKey === 'phoneNumbers';

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>{t(title)}</CardTitle>
            </CardHeader>
            <CardContent>
                 {exerciseKey === 'phoneNumbers' && (
                    <div className="mb-4 rounded-lg border-2 border-destructive bg-destructive/20 p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                            <Bomb className="h-6 w-6 text-destructive animate-pulse" />
                            <h3 className="text-xl font-bold uppercase text-destructive [text-shadow:0_0_8px_hsl(var(--destructive)/0.5)]">
                                {t('spellingExercise.superDifficult')}
                            </h3>
                            <Bomb className="h-6 w-6 text-destructive animate-pulse" />
                        </div>
                    </div>
                )}
                <div className="border-t pt-4">
                    <div className="flex items-center justify-start mb-4">
                        <span className="text-left">{currentExercise.id} / {exercises.length}</span>
                    </div>

                    <div className="space-y-2 mb-4">
                        <p className="text-sm text-muted-foreground">{t('spellingExercise.listenAndType')}</p>
                        
                        {(exerciseKey === 'femaleNames' || exerciseKey === 'maleNames' || exerciseKey === 'animalNames' || isNumberExercise) && (
                            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg border space-y-1">
                                <p className="font-semibold text-foreground">Ejemplo:</p>
                                {exerciseKey === 'femaleNames' && <>
                                    <p>Si escuchas la pronunciación de cada letra ( /em/, /ei/, /ar/, /guai/ ),</p>
                                    <p>debes escribir el nombre completo: <span className="font-bold text-foreground">Mary</span>.</p>
                                </>}
                                {exerciseKey === 'maleNames' && <>
                                    <p>Si escuchas la pronunciación de cada letra ( /yei/, /eich/, /ou/, /en/ ),</p>
                                    <p>debes escribir el nombre: <span className="font-bold text-foreground">Jhon</span>.</p>
                                </>}
                                {exerciseKey === 'animalNames' && <>
                                    <p>Si escuchas la pronunciación de cada letra ( /di/, /ou/, /yi/ ),</p>
                                    <p>debes escribir el nombre: <span className="font-bold text-foreground">dog</span>.</p>
                                </>}
                                {isNumberExercise && <>
                                    <p>{t('spellingExercise.numbersExampleListen')}</p>
                                    <p>{t('spellingExercise.numbersExampleWrite')}</p>
                                </>}
                            </div>
                        )}

                        {currentExercise.audioSrc ? (
                            <audio controls src={currentExercise.audioSrc} onError={handleAudioError} className="w-full" />
                        ) : (
                            <div className="w-full h-10 flex items-center justify-center bg-muted rounded-md text-muted-foreground">
                                {t('spellingExercise.audioErrorTitle')}
                            </div>
                        )}
                    </div>
                    
                    <div className="relative">
                        <Textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>

                    <div className="flex gap-2 mt-4">
                        <Button onClick={handleCheck}>{t('spellingExercise.check')}</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
