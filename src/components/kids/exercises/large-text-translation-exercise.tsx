'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


interface LargeTextTranslationExerciseProps {
    title: string;
    spanishText: string[];
    onComplete: () => void;
}

export const LargeTextTranslationExercise = ({ title, spanishText, onComplete }: LargeTextTranslationExerciseProps) => {
    const { toast } = useToast();
    const [translation, setTranslation] = useState('');

    const handleCheck = () => {
        // For now, since checking a large text is complex, we will just mark as complete
        toast({
            title: "¡Ejercicio Enviado!",
            description: "Tu traducción ha sido registrada. ¡Buen trabajo!",
        });
        onComplete();
    };

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Traduce el siguiente diálogo al inglés.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>Ver texto en Español</AccordionTrigger>
                        <AccordionContent>
                           <div className="p-4 bg-muted rounded-lg border space-y-2">
                                {spanishText.map((line, index) => (
                                    <p key={index} className="text-base">{line}</p>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                <div>
                    <Textarea
                        value={translation}
                        onChange={(e) => setTranslation(e.target.value)}
                        placeholder="Escribe tu traducción aquí..."
                        className="min-h-[250px] text-base"
                    />
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleCheck}>Verificar y Completar</Button>
            </CardFooter>
        </Card>
    );
};
