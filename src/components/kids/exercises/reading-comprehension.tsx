
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Reading Comprehension Component
const readingText = {
    title: "Alex's Day",
    content: "My name is Alex. Every morning, I eat breakfast and drink milk. After school, I run in the park with my friends, and then I walk home. In the evening, I read a book and write in my notebook. I also listen to music before I sleep. On weekends, I study for my English class and play videogames.",
    questions: [
        { id: 'q1', question: "What does Alex drink in the morning?", answers: ["milk", "he drinks milk"] },
        { id: 'q2', question: "Where does Alex run?", answers: ["in the park", "he runs in the park"] },
        { id: 'q3', question: "What does he do before he sleeps?", answers: ["listens to music", "he listens to music", "listen to music"] },
        { id: 'q4', question: "What does Alex study on weekends?", answers: ["english", "his english class", "for his english class"] },
        { id: 'q5', question: "What does he play on weekends?", answers: ["videogames", "he plays videogames"] }
    ]
};

type ValidationStatus = 'correct' | 'incorrect' | 'unchecked';

export const ReadingComprehensionExercise = ({ onComplete }: { onComplete: () => void }) => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [validationStatus, setValidationStatus] = useState<Record<string, ValidationStatus>>({});

    const handleInputChange = (questionId: string, value: string) => {
        setUserAnswers(prev => ({ ...prev, [questionId]: value }));
        setValidationStatus(prev => ({ ...prev, [questionId]: 'unchecked' }));
    };

    const handleCheckAnswers = () => {
        let allCorrect = true;
        const newValidationStatus: Record<string, ValidationStatus> = {};

        readingText.questions.forEach(q => {
            const userAnswer = userAnswers[q.id]?.trim().toLowerCase().replace(/[.?]/g, '') || '';
            const correctAnswers = q.answers.map(a => a.toLowerCase().replace(/[.?]/g, ''));
            
            if (correctAnswers.includes(userAnswer)) {
                newValidationStatus[q.id] = 'correct';
            } else {
                newValidationStatus[q.id] = 'incorrect';
                allCorrect = false;
            }
        });

        setValidationStatus(newValidationStatus);

        if (allCorrect) {
            toast({ title: "¡Correcto!", description: "¡Todas las respuestas son correctas!" });
            onComplete();
        } else {
            toast({
                variant: 'destructive',
                title: "Incorrecto",
                description: "Revisa las respuestas marcadas en rojo."
            });
        }
    };

    const getInputClass = (questionId: string) => {
        const status = validationStatus[questionId];
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive';
        return '';
    };

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>{t('kidsA1Class2.reading')}</CardTitle>
                <CardDescription>{t('kidsA1Class2.readingDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 bg-muted rounded-lg border">
                    <h4 className="font-bold mb-2">{readingText.title}</h4>
                    <p className="text-base leading-relaxed">{readingText.content}</p>
                </div>
                <div className="space-y-4 pt-4 border-t">
                    {readingText.questions.map(q => (
                        <div key={q.id} className="grid gap-2">
                            <Label htmlFor={q.id}>{q.question}</Label>
                            <Input
                                id={q.id}
                                value={userAnswers[q.id] || ''}
                                onChange={(e) => handleInputChange(q.id, e.target.value)}
                                className={cn(getInputClass(q.id))}
                                autoComplete="off"
                            />
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleCheckAnswers}>{t('kidsA1Class2.checkAnswers')}</Button>
            </CardFooter>
        </Card>
    );
};
