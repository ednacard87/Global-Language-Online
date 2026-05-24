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
import { ArrowRight, Trophy, BookText } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
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
    { spanish: 'ellos no escuchan música', answer: ["they do not listen to music", "they don't listen to music"] },
    { spanish: 'yo no hablo ingles', answer: ["I do not speak English", "I don't speak English"] },
    { spanish: 'tu no abres la puerta', answer: ["you do not open the door", "you don't open the door"] },
];
export const interrogativeExercisesData = [
    { spanish: '¿yo bebo agua?', answer: ["do I drink water?"] },
    { spanish: '¿nosotros jugamos futbol?', answer: ["do we play soccer?", "do we play football?"] },
    { spanish: '¿ellos escuchan música?', answer: ["do they listen to music?"] },
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
  vocabulary,
  highlightVocabulary = false
}: {
  onComplete: () => void;
  exerciseData: { spanish: string; answer: string[] }[];
  title: string;
  description: string;
  formType: "affirmative" | "negative" | "interrogative";
  vocabulary?: Record<string, string>;
  highlightVocabulary?: boolean;
}) => {
    const { toast } = useToast();
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [validationStatus, setValidationStatus] = useState<ValidationStatus>('unchecked');
    const [completedPrompts, setCompletedPrompts] = useState<boolean[]>([]);

    useEffect(() => {
        if (exerciseData) {
            setCompletedPrompts(Array(exerciseData.length).fill(false));
        }
    }, [exerciseData]);

    useEffect(() => {
        setUserAnswer('');
        setValidationStatus('unchecked');
    }, [currentIndex]);
    
    const handleCheck = () => {
        const cleanAnswer = userAnswer.trim().toLowerCase().replace(/[.?]$/, '');
        const correctAnswers = exerciseData[currentIndex].answer.map(ans => ans.toLowerCase().replace(/[.?]$/, ''));
        
        if (formType === 'interrogative' && !userAnswer.trim().endsWith('?')) {
            setValidationStatus('incorrect');
            toast({ variant: 'destructive', title: "Incorrecto", description: "Falta el signo de interrogación." });
            return;
        }

        if (correctAnswers.includes(cleanAnswer)) {
            setValidationStatus('correct');
            toast({ title: "¡Correcto!" });
            const nc = [...completedPrompts]; nc[currentIndex] = true; setCompletedPrompts(nc);
        } else {
            setValidationStatus('incorrect');
            toast({ variant: 'destructive', title: "Incorrecto" });
        }
    };

    const handleNext = () => {
        if (currentIndex < exerciseData.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onComplete();
        }
    };
    
    const isExerciseComplete = completedPrompts.every(c => c);
    const formConfig = { affirmative: { label: '(+)', color: 'text-green-500' }, negative: { label: '(-)', color: 'text-red-500' }, interrogative: { label: '(?)', color: 'text-blue-500' } }[formType];

    if (isExerciseComplete) {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardContent className="p-12 text-center flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
                    <Trophy className="h-16 w-16 text-yellow-400 mb-4 animate-bounce" />
                    <h2 className="text-3xl font-bold">¡Ejercicio Completado!</h2>
                    <p className="text-muted-foreground mt-2">Buen trabajo con la forma {formType}.</p>
                    <Button onClick={onComplete} className="mt-8 px-12" size="lg">Continuar aventura <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-4 rounded-lg border text-center"><p className="text-xl font-bold">{exerciseData[currentIndex].spanish}</p></div>
                 <div className="flex items-center gap-3 font-mono">
                    <Label className={cn("w-12 font-bold text-lg text-center", formConfig.color)}>{formConfig.label}</Label>
                    <Input value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} className={cn(validationStatus === 'correct' ? 'border-green-500 bg-green-50/5' : validationStatus === 'incorrect' ? 'border-destructive bg-destructive/5' : '')} autoComplete="off" />
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button onClick={handleCheck}>Verificar</Button>
                <Button onClick={handleNext} disabled={validationStatus !== 'correct'}>Siguiente <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </CardFooter>
        </Card>
    );
};
