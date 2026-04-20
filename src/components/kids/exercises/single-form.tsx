'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ArrowRight, Trophy, BookText } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';


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


export const SingleFormExercise = ({
  onComplete,
  exerciseData,
  title,
  description,
  formType,
  vocabulary
}: {
  onComplete: () => void;
  exerciseData: { spanish: string; answer: string[] }[];
  title: string;
  description: string;
  formType: "affirmative" | "negative" | "interrogative";
  vocabulary?: Record<string, string>;
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
    const isExerciseComplete = completedPrompts.every(c => c);

    const formConfig = {
        affirmative: { label: '(+)', color: 'text-green-500' },
        negative: { label: '(-)', color: 'text-red-500' },
        interrogative: { label: '(?)', color: 'text-blue-500' },
    }[formType];

    if (isExerciseComplete) {
        return (
             <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
                    <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
                    <h2 className="text-3xl font-bold">¡Ejercicio Completado!</h2>
                    <Button onClick={onComplete} className="mt-4">Continuar</Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
                {vocabulary && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="mt-2 w-fit">
                                <BookText className="mr-2 h-4 w-4" />
                                Vocabulario
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Vocabulario Clave</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Palabras importantes para este ejercicio.
                                    </p>
                                </div>
                                <div className="grid gap-2 text-sm">
                                    {Object.entries(vocabulary).map(([spanish, english]) => (
                                        <div key={spanish} className="grid grid-cols-2 items-center gap-4">
                                            <span className="text-muted-foreground capitalize">{spanish}</span>
                                            <span className="font-semibold text-right">{english}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                )}
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
