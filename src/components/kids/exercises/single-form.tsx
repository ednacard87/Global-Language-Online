'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ArrowRight, Trophy } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export const positiveExercisesData = [
    { spanish: 'yo bebo agua', answer: ["I drink water"] },
    { spanish: 'nosotros jugamos futbol', answer: ["we play soccer", "we play football"] },
    { spanish: 'ellos escuchan musica', answer: ["they listen to music"] },
    { spanish: 'yo hablo ingles', answer: ["I speak English"] },
    { spanish: 'tu abres la puerta', answer: ["you open the door"] },
];
export const negativeExercisesData = [
    { spanish: 'yo no bebo agua', answer: ["I do not drink water", "I don't drink water"] },
    { spanish: 'nosotros no jugamos futbol', answer: ["we do not play soccer", "we don't play soccer", "we do not play football", "we don't play football"] },
    { spanish: 'ellos no escuchan musica', answer: ["they do not listen to music", "they don't listen to music"] },
    { spanish: 'yo no hablo ingles', answer: ["I do not speak English", "I don't speak English"] },
    { spanish: 'tu no abres la puerta', answer: ["you do not open the door", "you don't open the door"] },
];
export const interrogativeExercisesData = [
    { spanish: '¿yo bebo agua?', answer: ["do I drink water?"] },
    { spanish: '¿nosotros jugamos futbol?', answer: ["do we play soccer?", "do we play football?"] },
    { spanish: '¿ellos escuchan musica?', answer: ["do they listen to music?"] },
    { spanish: '¿yo hablo ingles?', answer: ["do I speak English?"] },
    { spanish: '¿tu abres la puerta?', answer: ["do you open the door?"] },
];

type ValidationStatus = 'correct' | 'incorrect' | 'unchecked';

const nemoImage = PlaceHolderImages.find(p => p.id === 'nemo-icon');
const clownFishImage = PlaceHolderImages.find(p => p.id === 'clown-fish-guide');


export const SingleFormExercise = ({
  onComplete,
  exerciseData,
  title,
  description,
  formType
}: {
  onComplete: () => void;
  exerciseData: { spanish: string; answer: string[] }[];
  title: string;
  description: string;
  formType: "affirmative" | "negative" | "interrogative";
}) => {
    const { toast } = useToast();
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [validationStatus, setValidationStatus] = useState<ValidationStatus>('unchecked');
    const [completedPrompts, setCompletedPrompts] = useState<boolean[]>(Array(exerciseData.length).fill(false));
    
    const currentExercise = exerciseData[currentIndex];

    useEffect(() => {
        setUserAnswer('');
        setValidationStatus('unchecked');
    }, [currentIndex]);
    
    const handleCheck = () => {
        const userAnswerClean = userAnswer.trim().toLowerCase().replace(/[.?]$/, '');

        if (formType === 'interrogative' && !userAnswer.trim().endsWith('?')) {
            toast({ variant: 'destructive', title: "Incorrecto", description: "Recuerda añadir el signo de interrogación al final." });
            setValidationStatus('incorrect');
            return;
        }

        const isCorrect = currentExercise.answer.some(ans => {
            const correctAnswerClean = ans.toLowerCase().replace(/[.?]$/, '');
            return correctAnswerClean === userAnswerClean;
        });

        if (isCorrect) {
            setValidationStatus('correct');
            toast({ title: "¡Correcto!" });
            const newCompleted = [...completedPrompts];
            if (!newCompleted[currentIndex]) {
                newCompleted[currentIndex] = true;
                setCompletedPrompts(newCompleted);
            }
        } else {
            setValidationStatus('incorrect');
            toast({ variant: 'destructive', title: "Incorrecto" });
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCheck();
        }
    };

    const handleNext = () => {
        if (currentIndex < exerciseData.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onComplete();
        }
    };
    
    const progress = (completedPrompts.filter(c => c).length / exerciseData.length) * 100;

    const formConfig = {
        affirmative: { label: '(+)', color: 'text-green-500' },
        negative: { label: '(-)', color: 'text-red-500' },
        interrogative: { label: '(?)', color: 'text-blue-500' },
    }[formType];

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
                <div className="pt-4 space-y-2">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-sm font-medium text-muted-foreground">Progreso del Ejercicio</span>
                        <span className="text-sm font-bold">{Math.round(progress)}%</span>
                    </div>
                     <div className="relative flex items-center">
                        <Progress 
                            value={progress} 
                            className="h-6 rounded-full bg-destructive/20"
                            indicatorClassName={cn(
                                "rounded-full transition-all duration-500 !bg-brand-blue",
                                validationStatus === 'incorrect' && "!bg-destructive",
                                progress === 100 ? '!bg-brand-blue' : ''
                            )}
                        />
                        {nemoImage && progress < 100 && (
                             <div 
                                className="absolute top-1/2 -translate-y-1/2 z-10 transition-all duration-500"
                                style={{ left: `calc(${progress}% - 14px)` }}
                             >
                                <Image
                                    src={nemoImage.imageUrl}
                                    alt={nemoImage.description}
                                    width={28}
                                    height={28}
                                    className="object-contain"
                                    data-ai-hint={nemoImage.imageHint}
                                />
                            </div>
                        )}
                        {clownFishImage && (
                             <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                                <Image
                                    src={clownFishImage.imageUrl}
                                    alt={clownFishImage.description}
                                    width={28}
                                    height={28}
                                    className="object-contain"
                                    data-ai-hint={clownFishImage.imageHint}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <p className="text-sm text-muted-foreground">Frase a traducir ({currentIndex + 1}/{exerciseData.length})</p>
                    <p className="text-xl font-bold p-3 bg-muted rounded-md text-center">{currentExercise.spanish}</p>
                </div>
                 <div className="space-y-3 font-mono text-base">
                    <div className="flex items-center gap-3">
                        <Label htmlFor={formType} className={cn("w-12 font-bold text-lg text-center", formConfig.color)}>{formConfig.label}</Label>
                        <Input 
                            id={formType}
                            name={formType} 
                            value={userAnswer} 
                            onChange={(e) => setUserAnswer(e.target.value)} 
                            onKeyDown={handleKeyDown}
                            className={cn(validationStatus === 'correct' ? 'border-green-500' : validationStatus === 'incorrect' ? 'border-destructive' : '')} 
                            autoComplete="off" />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button onClick={handleCheck}>Verificar</Button>
                <Button onClick={handleNext} disabled={validationStatus !== 'correct'}>
                    {currentIndex < exerciseData.length - 1 ? 'Siguiente' : 'Finalizar'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
};
