'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Trophy } from 'lucide-react';

const listeningSentencesWithAudio = [
    { text: "I eat an apple", audioSrc: "/Audio/KidsA1/Listening/1.mp3" },
    { text: "You run fast", audioSrc: "/Audio/KidsA1/Listening/2.mp3" },
    { text: "He sleeps a lot", audioSrc: "/Audio/KidsA1/Listening/3.mp3" },
    { text: "She reads a book", audioSrc: "/Audio/KidsA1/Listening/4.mp3" },
    { text: "We play in the park", audioSrc: "/Audio/KidsA1/Listening/5.mp3" },
    { text: "They listen to music", audioSrc: "/Audio/KidsA1/Listening/6.mp3" }
];


export const KidsListeningExercise = ({ onComplete }: { onComplete: () => void }) => {
    const { t } = useTranslation();
    const { toast } = useToast();
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [isCompleted, setIsCompleted] = useState(false);

    const currentExercise = listeningSentencesWithAudio[currentIndex];

    const handleCheck = () => {
        if (userAnswer.trim().toLowerCase().replace(/[.?]/g, '') === currentExercise.text.toLowerCase()) {
            if (currentIndex === listeningSentencesWithAudio.length - 1) {
                toast({ title: "¡Ejercicio Completado!" });
                setIsCompleted(true);
                onComplete();
            } else {
                toast({ title: "¡Correcto!" });
                setCurrentIndex(prev => prev + 1);
                setUserAnswer('');
            }
        } else {
            toast({ variant: 'destructive', title: "Incorrecto", description: "Inténtalo de nuevo." });
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCheck();
        }
    };
    
    const handleAudioError = () => {
        toast({
            variant: 'destructive',
            title: 'Error de Audio',
            description: 'No se pudo cargar o reproducir el archivo de audio. Asegúrate de que los archivos de audio estén en la carpeta public/Audio/KidsA1/Listening/.',
        });
    }

    if (isCompleted) {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
                    <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
                    <h2 className="text-3xl font-bold">¡Práctica de Escucha Completada!</h2>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>{t('kidsA1Class2.listening')}</CardTitle>
                <CardDescription>{t('kidsA1Class2.listeningDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Frase {currentIndex + 1} / {listeningSentencesWithAudio.length}</span>
                </div>
                <div className="flex items-center justify-center h-20">
                    <audio controls src={currentExercise.audioSrc} onError={handleAudioError} className="w-full">
                        Your browser does not support the audio element.
                    </audio>
                </div>
                <div>
                    <Input
                        placeholder="Escribe lo que escuchas..."
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleCheck}>Verificar</Button>
            </CardFooter>
        </Card>
    );
};