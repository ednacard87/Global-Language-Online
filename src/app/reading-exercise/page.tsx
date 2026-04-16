
'use client';

import React, { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

const texts = {
    step1: {
        title: "Sophie",
        content: "I moved to Canada last year with my family. My friends told me English is difficult to learn, but it’s easy for me. I take classes at a school to learn more. I also watch movies with English subtitles. People in Canada are very friendly. They say “thank you” and “sorry” a lot. I love going to the park and playing football in my free time.",
        questions: [
            { id: 'q1', question: "Where did Sophie move to?", answers: ["canada", "she moved to canada"] },
            { id: 'q2', question: "Is learning English difficult for her?", answers: ["no", "no, it isn't", "no, it is not"] },
            { id: 'q3', question: "What does she do in her free time?", answers: ["going to the park and playing football", "playing football and going to the park", "playing football", "going to the park", "she loves going to the park and playing football"] }
        ]
    },
    step2: {
        title: "Ahmed from Egypt",
        content: "I am living in Germany for my job. Learning German is not easy. I study every night after work. I also practice by speaking to my neighbours. The food here is not like in my country, but I like trying new things. On Saturday and Sunday, I go hiking with my friends. It is my new favorite hobby.",
        questions: [
            { id: 'q1', question: "Why is Ahmed in Germany?", answers: ["for his job", "for work", "because it's for his job", "he lives in germany for his job"] },
            { id: 'q2', question: "Is learning German easy for him?", answers: ["no", "no, it isn't", "no, it is not"] },
            { id: 'q3', question: "What does he do on weekends?", answers: ["go hiking with his friends", "hiking with his friends", "go hiking", "he goes hiking"] }
        ]
    },
    step3: {
        title: "Ling from China",
        content: "I came to Australia to study. I didn’t speak English when I moved, but I’m learning now. I speak English every day with my classmates. Australian people are very relaxed and they are great! They like to have barbecues. After school and at the weekend, I go to the beach or learn how to surf. I enjoy my new life here.",
        questions: [
            { id: 'q1', question: "Why is Ling in Australia?", answers: ["to study", "she came to australia to study", "because she studies", "she studies"] },
            { id: 'q2', question: "Does she speak English with her classmates?", answers: ["yes", "yes she does", "yes, she is"] },
            { id: 'q3', question: "What does she do on weekends?", answers: ["go to the beach or learn how to surf", "she goes to the beach or learn how to surf", "she goes to the beach or learns how to surf"] }
        ]
    },
    step4: {
        title: "Carlos from Brazil",
        content: "I moved to Japan for work. Japanese is very hard, but I am learning slowly. I take lessons at night. People here are very polite. Bowing when you meet someone is a custom. I like learning about Japanese culture. In my free time, I visit temples and try local food. My favorite is sushi.",
        questions: [
            { id: 'q1', question: "Why did Carlos move to Japan?", answers: ["for work", "he moved for work", "he moved to japan for work", "because he works", "for his job"] },
            { id: 'q2', question: "Is Japanese easy for him?", answers: ["no", "no, it isn't", "no, it is not"] },
            { id: 'q3', question: "What does he do in his free time?", answers: ["visit temples and try local food", "he visits temples and try local food", "he visits temples and tries local food"] }
        ]
    }
};

type StepKey = 'step1' | 'step2' | 'step3' | 'step4';
type ValidationStatus = 'correct' | 'incorrect' | 'unchecked';

export default function ReadingExercisePage() {
    const [currentStep, setCurrentStep] = useState<StepKey>('step1');
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [validationStatus, setValidationStatus] = useState<Record<string, ValidationStatus>>({});
    const [isStep1Complete, setIsStep1Complete] = useState(false);
    const [isStep2Complete, setIsStep2Complete] = useState(false);
    const [isStep3Complete, setIsStep3Complete] = useState(false);
    const [isStep4Complete, setIsStep4Complete] = useState(false);
    const { toast } = useToast();

    const currentTextData = texts[currentStep];

    useEffect(() => {
        // Clear answers when switching steps
        setUserAnswers({});
        setValidationStatus({});
    }, [currentStep]);

    const handleInputChange = (questionId: string, value: string) => {
        setUserAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
        setValidationStatus(prev => ({
            ...prev,
            [questionId]: 'unchecked'
        }));
    };

    const handleCheckAnswers = () => {
        let allCorrect = true;
        const newValidationStatus: Record<string, ValidationStatus> = {};

        currentTextData.questions.forEach(q => {
            const userAnswer = userAnswers[q.id]?.trim().toLowerCase().replace(/[.?]/g, '') || '';
            const correctAnswers = q.answers.map(a => a.toLowerCase());
            
            if (correctAnswers.includes(userAnswer)) {
                newValidationStatus[q.id] = 'correct';
            } else {
                newValidationStatus[q.id] = 'incorrect';
                allCorrect = false;
            }
        });

        setValidationStatus(newValidationStatus);

        if (allCorrect) {
            toast({ title: "Correct!", description: "All answers are correct. Well done!" });
            if (currentStep === 'step1') {
                setIsStep1Complete(true);
            } else if (currentStep === 'step2') {
                setIsStep2Complete(true);
            } else if (currentStep === 'step3') {
                setIsStep3Complete(true);
            } else if (currentStep === 'step4') {
                setIsStep4Complete(true);
            }
        } else {
            toast({
                variant: 'destructive',
                title: "Not quite",
                description: "Some answers are incorrect. Please review the red fields."
            });
        }
    };
    
    const getInputClass = (questionId: string) => {
        const status = validationStatus[questionId];
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive';
        return '';
    };

    const renderTextAndQuestions = (stepKey: StepKey) => {
        const data = texts[stepKey];
        const isComplete = stepKey === 'step1' ? isStep1Complete : (stepKey === 'step2' ? isStep2Complete : (stepKey === 'step3' ? isStep3Complete : isStep4Complete));
        const isCurrent = currentStep === stepKey;

        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardHeader>
                    <CardTitle>{data.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-base leading-relaxed text-muted-foreground">{data.content}</p>
                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="font-semibold text-lg">Questions</h3>
                        {data.questions.map(q => (
                            <div key={q.id} className="grid gap-2">
                                <Label htmlFor={`${stepKey}-${q.id}`}>{q.question}</Label>
                                <Input
                                    id={`${stepKey}-${q.id}`}
                                    value={userAnswers[q.id] || ''}
                                    onChange={(e) => handleInputChange(q.id, e.target.value)}
                                    className={cn(getInputClass(q.id))}
                                    disabled={!isCurrent || isComplete}
                                    autoComplete="off"
                                />
                            </div>
                        ))}
                    </div>
                </CardContent>
                {isCurrent && !isComplete && (
                    <CardFooter>
                        <Button onClick={handleCheckAnswers}>Check Answers</Button>
                    </CardFooter>
                )}
                 {isCurrent && isComplete && currentStep === 'step1' && (
                    <CardFooter>
                        <Button onClick={() => setCurrentStep('step2')}>Continue to Text 2</Button>
                    </CardFooter>
                )}
                {isCurrent && isComplete && currentStep === 'step2' && (
                    <CardFooter>
                        <Button onClick={() => setCurrentStep('step3')}>Continue to Text 3</Button>
                    </CardFooter>
                )}
                {isCurrent && isComplete && currentStep === 'step3' && (
                    <CardFooter>
                        <Button onClick={() => setCurrentStep('step4')}>Continue to Text 4</Button>
                    </CardFooter>
                )}
            </Card>
        );
    }
    
    return (
        <div className="flex w-full flex-col min-h-screen">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8 flex flex-col items-center">
                <div className="w-full max-w-3xl space-y-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold">My life abroad</h1>
                    </div>

                    {currentStep === 'step1' && renderTextAndQuestions('step1')}
                    {currentStep === 'step2' && renderTextAndQuestions('step2')}
                    {currentStep === 'step3' && renderTextAndQuestions('step3')}
                    {currentStep === 'step4' && renderTextAndQuestions('step4')}

                    {isStep4Complete && (
                        <Card className="shadow-soft rounded-lg border-2 border-green-500 bg-green-500/10">
                            <CardContent className="p-6 text-center">
                                <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                                <h2 className="text-3xl font-bold text-green-600">Congratulations!</h2>
                                <p className="text-muted-foreground mt-2">You have completed the reading exercise.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
