'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Prompt {
  q: string;
  a: string[];
}

interface MultiStepExerciseProps {
  title: string;
  prompts: Prompt[];
  onComplete: () => void;
  instruction: string;
}

export const MultiStepExercise = ({ title, prompts, onComplete, instruction }: MultiStepExerciseProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string[]>>({});
  const [results, setResults] = useState<Record<number, boolean[] | null>>({});
  const { toast } = useToast();

  const currentPrompt = prompts[currentStep];
  const placeholders = currentPrompt.q.split('______');
  const numInputs = currentPrompt.a.length;

  const handleInputChange = (inputIndex: number, value: string) => {
    setUserAnswers(prev => {
      const newAnswers = [...(prev[currentStep] || [])];
      newAnswers[inputIndex] = value;
      return { ...prev, [currentStep]: newAnswers };
    });
    setResults(prev => ({ ...prev, [currentStep]: null }));
  };

  const handleCheck = () => {
    const answers = userAnswers[currentStep] || [];
    const currentResults: boolean[] = [];
    let allCorrect = true;

    for (let i = 0; i < numInputs; i++) {
      const isCorrect = (answers[i] || '').trim().toLowerCase() === currentPrompt.a[i].toLowerCase();
      currentResults.push(isCorrect);
      if (!isCorrect) {
        allCorrect = false;
      }
    }
    
    setResults(prev => ({ ...prev, [currentStep]: currentResults }));

    if (allCorrect) {
      toast({ title: "¡Correcto!", className: "bg-green-500 text-white" });
    } else {
      toast({ title: "Algunas respuestas son incorrectas", description: "¡Revisa y vuelve a intentarlo!", variant: "destructive" });
    }
  };

  const handleNext = () => {
    if (currentStep < prompts.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };
  
  const progress = (Object.keys(results).filter(k => results[parseInt(k)]?.every(r => r === true)).length / prompts.length) * 100;
  const isCurrentCorrect = results[currentStep]?.every(r => r === true) ?? false;

  const renderQuestion = () => {
    const parts = currentPrompt.q.split('______');
    const elements = [];
    for (let i = 0; i < parts.length; i++) {
      elements.push(<span key={`text-${i}`}>{parts[i]}</span>);
      if (i < numInputs) {
        const currentResult = results[currentStep]?.[i];
        elements.push(
          <Input
            key={`input-${i}`}
            value={userAnswers[currentStep]?.[i] || ''}
            onChange={(e) => handleInputChange(i, e.target.value)}
            className={cn(
                "inline-block w-36 mx-2",
                currentResult === true && "border-green-500",
                currentResult === false && "border-red-500"
            )}
            disabled={isCurrentCorrect}
          />
        );
      }
    }
    return <div className="text-lg font-semibold text-center leading-loose">{elements}</div>;
  };

  return (
    <div className="p-6 w-full max-w-3xl mx-auto flex flex-col items-center">
      <div className="w-full mb-4 text-center">
        <h3 className="text-2xl font-bold text-primary">{title}</h3>
        <p className="text-muted-foreground mt-1">{instruction}</p>
        <Progress value={progress} className="w-full h-2 mt-4" />
        <p className="text-sm text-muted-foreground mt-2">
            {Object.keys(results).filter(k => results[parseInt(k)]?.every(r => r === true)).length} / {prompts.length}
        </p>
      </div>

      <Card className="w-full min-h-[250px] flex flex-col justify-center items-center shadow-lg p-8">
        {renderQuestion()}
      </Card>

      <div className="flex w-full justify-between items-center mt-6">
        <Button variant="outline" onClick={() => setCurrentStep(p => p - 1)} disabled={currentStep === 0}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
        </Button>
        
        {!isCurrentCorrect ? (
          <Button onClick={handleCheck} size="lg">
              Verificar <CheckCircle className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          currentStep < prompts.length - 1 ? (
            <Button onClick={handleNext} size="lg" className="bg-green-600 hover:bg-green-700">
              Siguiente <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={onComplete} size="lg" className="bg-green-600 hover:bg-green-700">
              Finalizar <Trophy className="ml-2 h-4 w-4" />
            </Button>
          )
        )}
      </div>
    </div>
  );
};