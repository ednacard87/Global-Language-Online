'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateDocumentNonBlocking } from '@/firebase';
import { DocumentReference } from 'firebase/firestore';

interface CreativeWritingExerciseProps {
    title: string;
    description?: string;
    prompts: { id: string; question: string; placeholder?: string }[];
    onComplete: () => void;
    studentDocRef: DocumentReference | null;
    initialData: Record<string, string>;
    savePath: string;
    isSingleLine?: boolean;
}

export function CreativeWritingExercise({ 
    title, 
    description, 
    prompts, 
    onComplete, 
    studentDocRef, 
    initialData, 
    savePath,
    isSingleLine = false
}: CreativeWritingExerciseProps) {
    const [answers, setAnswers] = useState<Record<string, string>>(initialData || {});

    useEffect(() => {
        if (initialData) {
            setAnswers(initialData);
        }
    }, [initialData]);

    const handleInputChange = (id: string, value: string) => {
        const newAnswers = { ...answers, [id]: value };
        setAnswers(newAnswers);
        
        if (studentDocRef) {
            updateDocumentNonBlocking(studentDocRef, {
                [`${savePath}`]: newAnswers
            });
        }
    };

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription className="text-base font-semibold">{description}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-6">
                {prompts.map((prompt) => (
                    <div key={prompt.id} className="space-y-3">
                        <Label className="text-lg font-bold text-primary">{prompt.question}</Label>
                        {isSingleLine ? (
                            <Input
                                value={answers[prompt.id] || ''}
                                onChange={(e) => handleInputChange(prompt.id, e.target.value)}
                                placeholder={prompt.placeholder || "Escribe tu frase aquí..."}
                                className="h-12 text-base"
                                autoComplete="off"
                            />
                        ) : (
                            <Textarea
                                value={answers[prompt.id] || ''}
                                onChange={(e) => handleInputChange(prompt.id, e.target.value)}
                                placeholder={prompt.placeholder || "Escribe aquí..."}
                                className="min-h-[150px] text-base leading-relaxed"
                            />
                        )}
                    </div>
                ))}
            </CardContent>
            <CardFooter className="justify-center border-t pt-6">
                <Button onClick={onComplete} size="lg" className="w-full sm:w-auto px-12">
                    Avanzar
                </Button>
            </CardFooter>
        </Card>
    );
}
