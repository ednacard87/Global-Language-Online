'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Trophy } from 'lucide-react';
import { Label } from '@/components/ui/label';

const timePrompts = [
  { time: '2:30', answers: ["it's half past two", "it is half past two"] },
  { time: '5:15', answers: ["it's a quarter past five", "it is a quarter past five"] },
  { time: '9:45', answers: ["it's a quarter to ten", "it is a quarter to ten"] },
  { time: '11:00', answers: ["it's eleven o'clock", "it is eleven o'clock"] },
  { time: '3:05', answers: ["it's five past three", "it is five past three"] },
  { time: '7:50', answers: ["it's ten to eight", "it is ten to eight"] },
  { time: '8:20', answers: ["it's twenty past eight", "it is twenty past eight"] },
  { time: '4:35', answers: ["it's twenty-five to five", "it is twenty five to five"] },
  { time: '1:55', answers: ["it's five to two", "it is five to two"] },
  { time: '6:00', answers: ["it's six o'clock", "it is six o'clock"] },
];

type ValidationStatus = 'correct' | 'incorrect' | 'unchecked';

export function TimeExercise({ onComplete }: { onComplete: () => void }) {
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>(Array(timePrompts.length).fill(''));
  const [validationStates, setValidationStates] = useState<ValidationStatus[]>(Array(timePrompts.length).fill('unchecked'));
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);

  const handleAnswerChange = (value: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentIndex] = value;
    setUserAnswers(newAnswers);

    if (validationStates[currentIndex] !== 'unchecked') {
      const newValidationStates = [...validationStates];
      newValidationStates[currentIndex] = 'unchecked';
      setValidationStates(newValidationStates);
    }
  };

  const handleFinalCheck = () => {
    let allCorrect = true;
    const newValidationStates = timePrompts.map((prompt, index) => {
      const userAnswer = userAnswers[index]?.trim().toLowerCase().replace(/[.]/g, '') || '';
      const correctAnswers = prompt.answers.map(a => a.toLowerCase().replace(/[.]/g, ''));
      const isCorrect = correctAnswers.includes(userAnswer);
      if (!isCorrect) {
        allCorrect = false;
      }
      return isCorrect ? 'correct' : 'incorrect';
    });
    setValidationStates(newValidationStates);

    if (allCorrect) {
      toast({ title: '¡Excelente!', description: 'Todas tus respuestas son correctas.' });
      setShowCompletionMessage(true);
      onComplete();
    } else {
      toast({
        variant: 'destructive',
        title: 'Algunas respuestas son incorrectas',
        description: 'Revisa las bolitas rojas y corrige tus respuestas.',
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (currentIndex < timePrompts.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        handleFinalCheck();
      }
    }
  };

  if (showCompletionMessage) {
    return (
      <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
        <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
          <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
          <h2 className="text-3xl font-bold">¡Ejercicio Completado!</h2>
          <p className="text-muted-foreground mt-2">Has dominado los ejercicios de la hora.</p>
        </CardContent>
      </Card>
    );
  }

  const currentPrompt = timePrompts[currentIndex];

  return (
    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
      <CardHeader>
        <CardTitle>Ejercicios: ¿Qué hora es?</CardTitle>
        <CardDescription>Escribe la hora en inglés.</CardDescription>
        <div className="flex items-center justify-start flex-wrap gap-2 pt-4">
          {timePrompts.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center font-bold border-2 transition-all',
                currentIndex === index ? 'border-primary ring-2 ring-primary' : 'border-muted-foreground/50',
                validationStates[index] === 'correct' && 'bg-green-500/20 border-green-500 text-green-700',
                validationStates[index] === 'incorrect' && 'bg-red-500/20 border-destructive text-destructive'
              )}
              aria-label={`Ir a la pregunta ${index + 1}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Hora a escribir:</h3>
          <div className="bg-muted p-4 rounded-lg border">
            <p className="text-3xl font-mono text-center font-bold tracking-wider">{currentPrompt?.time}</p>
          </div>
        </div>
        <div>
          <Input
            value={userAnswers[currentIndex] || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              'text-lg',
              validationStates[currentIndex] === 'correct'
                ? 'border-green-500'
                : validationStates[currentIndex] === 'incorrect'
                ? 'border-destructive'
                : ''
            )}
            placeholder="Escribe la hora aquí..."
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <Button onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))} disabled={currentIndex === 0}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>

        {currentIndex === timePrompts.length - 1 ? (
          <Button onClick={handleFinalCheck}>Verificar Todo</Button>
        ) : (
          <Button onClick={() => setCurrentIndex((p) => Math.min(timePrompts.length - 1, p + 1))}>
            Siguiente
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
