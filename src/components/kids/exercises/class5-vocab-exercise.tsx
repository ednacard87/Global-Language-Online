'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';

const vocabularyData = [
    { spanish: 'LUNES', english: 'MONDAY' },
    { spanish: 'MARTES', english: 'TUESDAY' },
    { spanish: 'MIERCOLES', english: 'WEDNESDAY' },
    { spanish: 'JUEVES', english: 'THURSDAY' },
    { spanish: 'VIERNES', english: 'FRIDAY' },
    { spanish: 'SABADO', english: 'SATURDAY' },
    { spanish: 'DOMINGO', english: 'SUNDAY' },
    { spanish: '¿QUÉ HORA ES?', english: 'WHAT TIME IS IT?' },
    { spanish: 'MUCHO GUSTO', english: 'NICE TO MEET YOU' },
    { spanish: 'GRACIAS', english: 'THANK YOU' },
    { spanish: 'DE NADA', english: "YOU'RE WELCOME" },
    { spanish: 'PRIMAVERA', english: 'SPRING' },
    { spanish: 'OTOÑO', english: 'AUTUMN' },
    { spanish: 'INVIERNO', english: 'WINTER' },
    { spanish: 'VERANO', english: 'SUMMER' },
    { spanish: 'AYER', english: 'YESTERDAY' },
    { spanish: 'HOY', english: 'TODAY' },
    { spanish: 'MAÑANA', english: 'TOMORROW' },
    { spanish: 'DESAYUNO', english: 'BREAKFAST' },
    { spanish: 'ALMUERZO', english: 'LUNCH' },
    { spanish: 'CENA', english: 'DINNER' },
    { spanish: 'CON', english: 'WITH' },
    { spanish: 'SIN', english: 'WITHOUT' },
    { spanish: 'ANTES', english: 'BEFORE' },
    { spanish: 'DESPUES', english: 'AFTER' },
    { spanish: 'TEMPRANO', english: 'EARLY' },
    { spanish: 'TARDE', english: 'LATE' },
    { spanish: 'HASTA', english: 'UNTIL' },
    { spanish: 'DESDE', english: 'FROM' },
    { spanish: 'PRONTO', english: 'SOON' },
    { spanish: 'FEO/A', english: 'UGLY' },
    { spanish: 'JOVEN', english: 'YOUNG' },
    { spanish: 'VIEJO', english: 'OLD' },
    { spanish: 'ALTO', english: 'TALL' },
    { spanish: 'BAJO', english: 'SHORT' },
    { spanish: '¿DÓNDE?', english: 'WHERE?' },
    { spanish: '¿CUÁNDO?', english: 'WHEN?' },
    { spanish: '¿QUIÉN?', english: 'WHO?' },
    { spanish: '¿CUÁL?', english: 'WHICH?' },
    { spanish: '¿POR QUÉ?', english: 'WHY?' },
    { spanish: 'ABURRIDO', english: 'BORED' },
    { spanish: 'CANSADO', english: 'TIRED' },
    { spanish: 'PESADO', english: 'HEAVY' },
    { spanish: 'HAMBRIENTO', english: 'HUNGRY' },
    { spanish: 'LLAMAR', english: 'CALL' },
    { spanish: 'LEVANTARSE', english: 'GET UP' },
    { spanish: 'DESPERTARSE', english: 'WAKE UP' },
    { spanish: 'VENIR', english: 'COME' },
    { spanish: 'LLEGAR', english: 'ARRIVE' },
    { spanish: 'ENVIAR', english: 'SEND' },
    { spanish: 'CERRAR', english: 'CLOSE' },
    { spanish: 'ABRIR', english: 'OPEN' },
    { spanish: 'GUSTAR', english: 'LIKE' },
    { spanish: 'QUERER', english: 'WANT' },
    { spanish: 'COCINAR', english: 'COOK' },
    { spanish: 'VIAJAR', english: 'TRAVEL' },
    { spanish: 'MIRAR', english: 'LOOK' },
    { spanish: 'VER', english: 'SEE' },
    { spanish: 'HABER-TENER', english: 'HAVE' },
    { spanish: 'ENSEÑAR', english: 'TEACH' },
    { spanish: 'APRENDER', english: 'LEARN' },
    { spanish: 'DORMIR', english: 'SLEEP' },
    { spanish: 'SALIR', english: 'GO OUT' },
    { spanish: 'CAMINAR', english: 'WALK' },
];

export function Class5VocabExercise({ onComplete }: { onComplete: () => void }) {
    const { toast } = useToast();
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [validationStatus, setValidationStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});
    const [showCompletionMessage, setShowCompletionMessage] = useState(false);

    const handleInputChange = (index: number, value: string) => {
        setUserAnswers(prev => ({ ...prev, [index]: value }));
        setValidationStatus(prev => {
            const newStatus = { ...prev };
            if (newStatus[index] && newStatus[index] !== 'unchecked') {
                newStatus[index] = 'unchecked';
            }
            return newStatus;
        });
    };

    const handleCheckAnswers = () => {
        let allCorrect = true;
        const newValidationStatus: Record<number, 'correct' | 'incorrect' | 'unchecked'> = {};

        vocabularyData.forEach((item, index) => {
            const userAnswer = (userAnswers[index] || '').trim().toLowerCase();
            const isCorrect = item.english.toLowerCase() === userAnswer;
            if (isCorrect) {
                newValidationStatus[index] = 'correct';
            } else {
                newValidationStatus[index] = 'incorrect';
                allCorrect = false;
            }
        });

        setValidationStatus(newValidationStatus);

        if (allCorrect) {
            toast({ title: "¡Excelente!", description: "Has completado el vocabulario." });
            setShowCompletionMessage(true);
            onComplete();
        } else {
            toast({ variant: 'destructive', title: "Sigue intentando", description: "Algunas respuestas son incorrectas." });
        }
    };
    
    const getInputClass = (index: number) => {
        const status = validationStatus[index];
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive';
        return '';
    };

    if (showCompletionMessage) {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
                    <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
                    <h2 className="text-3xl font-bold">¡Ejercicio Completado!</h2>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>Ejercicio Vocabulario</CardTitle>
                <CardDescription>Escribe la traducción correcta en inglés para cada palabra.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                    <div className="font-bold p-3 bg-muted rounded-lg text-left">Español</div>
                    <div className="font-bold p-3 bg-muted rounded-lg text-left">Inglés</div>
                    {vocabularyData.map((item, index) => (
                        <React.Fragment key={index}>
                            <div className="p-3 bg-card border rounded-lg flex items-center">{item.spanish}</div>
                            <div className="p-3 bg-card border rounded-lg flex items-center">
                                <Input
                                    value={userAnswers[index] || ''}
                                    onChange={(e) => handleInputChange(index, e.target.value)}
                                    className={cn(getInputClass(index))}
                                />
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleCheckAnswers}>Verificar Vocabulario</Button>
            </CardFooter>
        </Card>
    );
}
