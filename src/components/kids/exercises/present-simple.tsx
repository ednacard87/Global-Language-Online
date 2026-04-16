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
import { ArrowRight, Trophy } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export type ExercisePrompt = {
    spanish: string;
    answers: {
        affirmative: string[];
        negative: string[];
        interrogative: string[];
        shortAffirmative?: string[];
        shortNegative?: string[];
    }
};


export const presentSimpleExercises = [
    {
        spanish: "NOSOTROS CAMINAMOS EN EL PARQUE",
        answers: {
            affirmative: ["we walk in the park"],
            negative: ["we do not walk in the park", "we don't walk in the park"],
            interrogative: ["do we walk in the park?"],
        }
    },
    {
        spanish: "ELLOS VAN A LA UNIVERSIDAD EL SABADO.",
        answers: {
            affirmative: ["they go to the university on saturday"],
            negative: ["they do not go to the university on saturday", "they don't go to the university on saturday"],
            interrogative: ["do they go to the university on saturday?"],
        }
    },
    {
        spanish: "NOSOTROS TRABAJAMOS LOS DOMINGOS.",
        answers: {
            affirmative: ["we work on sundays"],
            negative: ["we do not work on sundays", "we don't work on sundays"],
            interrogative: ["do we work on sundays?"],
        }
    },
    {
        spanish: "TÚ DUERMES EN LA TARDE",
        answers: {
            affirmative: ["you sleep in the afternoon"],
            negative: ["you do not sleep in the afternoon", "you don't sleep in the afternoon"],
            interrogative: ["do you sleep in the afternoon?"],
        }
    },
    {
        spanish: "NOSOTROS COMEMOS CARNE Y ENSALADA",
        answers: {
            affirmative: ["we eat meat and salad"],
            negative: ["we do not eat meat and salad", "we don't eat meat and salad"],
            interrogative: ["do we eat meat and salad?"],
        }
    },
    {
        spanish: "ELLOS BEBEN CERVEZA",
        answers: {
            affirmative: ["they drink beer"],
            negative: ["they do not drink beer", "they don't drink beer"],
            interrogative: ["do they drink beer?"],
        }
    },
    {
        spanish: "ELLOS VAN A LA IGLESIA EL MIERCOLES",
        answers: {
            affirmative: ["they go to church on wednesday"],
            negative: ["they do not go to church on wednesday", "they don't go to church on wednesday"],
            interrogative: ["do they go to church on wednesday?"],
        }
    },
    {
        spanish: "NOSOTROS JUGAMOS FUTBOL LOS SABADOS",
        answers: {
            affirmative: ["we play soccer on saturdays", "we play football on saturdays"],
            negative: ["we do not play soccer on saturdays", "we don't play soccer on saturdays", "we do not play football on saturdays", "we don't play football on saturdays"],
            interrogative: ["do we play soccer on saturdays?", "do we play football on saturdays?"],
        }
    },
    {
        spanish: "YO VEO PELÍCULAS LOS VIERNES EN LA NOCHE",
        answers: {
            affirmative: ["i watch movies on friday nights", "i watch movies on fridays at night"],
            negative: ["i do not watch movies on friday nights", "i don't watch movies on friday nights", "i do not watch movies on fridays at night", "i don't watch movies on fridays at night"],
            interrogative: ["do i watch movies on friday nights?", "do i watch movies on fridays at night?"],
        }
    }
];


export const presentSimpleExercises2 = [
    {
        spanish: "nosotros escuchamos musica",
        answers: {
            affirmative: ["we listen to music"],
            negative: ["we do not listen to music", "we don't listen to music"],
            interrogative: ["do we listen to music?"],
            shortAffirmative: ["yes, we do"],
            shortNegative: ["no, we do not", "no, we don't"],
        }
    },
    {
        spanish: "ella come pizza",
        answers: {
            affirmative: ["she eats pizza"],
            negative: ["she does not eat pizza", "she doesn't eat pizza"],
            interrogative: ["does she eat pizza?"],
            shortAffirmative: ["yes, she does"],
            shortNegative: ["no, she does not", "no, she doesn't"],
        }
    },
    {
        spanish: "ellos duermen en la tarde",
        answers: {
            affirmative: ["they sleep in the afternoon"],
            negative: ["they do not sleep in the afternoon", "they don't sleep in the afternoon"],
            interrogative: ["did they sleep in the afternoon?"],
            shortAffirmative: ["yes, they do"],
            shortNegative: ["no, they do not", "no, they don't"],
        }
    },
    {
        spanish: "el juega videojuegos",
        answers: {
            affirmative: ["he plays videogames"],
            negative: ["he does not play videogames", "he didn't play videogames"],
            interrogative: ["did he play videogames?"],
            shortAffirmative: ["yes, he did"],
            shortNegative: ["no, he did not", "no, he didn't"],
        }
    },
];

type TranslationForms = {
    affirmative: string;
    negative: string;
    interrogative: string;
    shortAffirmative: string;
    shortNegative: string;
};

type ValidationStatus = 'correct' | 'incorrect' | 'unchecked';

const nemoImage = PlaceHolderImages.find(p => p.id === 'nemo-icon');
const clownFishImage = PlaceHolderImages.find(p => p.id === 'clown-fish-guide');

export const PresentSimpleExercise = ({
    onComplete,
    exerciseData,
    title,
    showShortAnswers = true
}: {
    onComplete: () => void,
    exerciseData: ExercisePrompt[],
    title?: string,
    showShortAnswers?: boolean
}) => {
    const { toast } = useToast();
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [translations, setTranslations] = useState<TranslationForms>({ affirmative: '', negative: '', interrogative: '', shortAffirmative: '', shortNegative: '' });
    const [validationStatus, setValidationStatus] = useState<Record<keyof TranslationForms, ValidationStatus>>({ affirmative: 'unchecked', negative: 'unchecked', interrogative: 'unchecked', shortAffirmative: 'unchecked', shortNegative: 'unchecked' });
    const [isCurrentCorrect, setIsCurrentCorrect] = useState(false);
    const [completedPrompts, setCompletedPrompts] = useState<boolean[]>([]);

    useEffect(() => {
        if (exerciseData) {
            setCompletedPrompts(Array(exerciseData.length).fill(false))
        }
    }, [exerciseData]);

    const currentExercise = exerciseData?.[currentIndex];

    useEffect(() => {
        // Reset state when index changes
        setTranslations({ affirmative: '', negative: '', interrogative: '', shortAffirmative: '', shortNegative: '' });
        setValidationStatus({ affirmative: 'unchecked', negative: 'unchecked', interrogative: 'unchecked', shortAffirmative: 'unchecked', shortNegative: 'unchecked' });
        setIsCurrentCorrect(false);
    }, [currentIndex]);
    
    if (!currentExercise) {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardHeader>
                    <CardTitle>{title || 'Ejercicio'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>No hay datos para este ejercicio.</p>
                </CardContent>
            </Card>
        );
    }
    
    const shouldShowShortAnswers = showShortAnswers && currentExercise.answers.shortAffirmative !== undefined && currentExercise.answers.shortNegative !== undefined;
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTranslations(prev => ({ ...prev, [name]: value }));
        setIsCurrentCorrect(false); // Reset correctness on change
    };

    const handleCheck = () => {
        const newStatus: Record<keyof TranslationForms, ValidationStatus> = { ...validationStatus };
        let allCorrect = true;

        const fieldsToCheck: (keyof TranslationForms)[] = ['affirmative', 'negative', 'interrogative'];
        if (shouldShowShortAnswers) {
            fieldsToCheck.push('shortAffirmative', 'shortNegative');
        }

        fieldsToCheck.forEach(key => {
            const typedKey = key as keyof TranslationForms;
            if (!currentExercise.answers[typedKey]) return;
            
            let userAnswer = translations[typedKey].trim().toLowerCase().replace(/[.?]$/, '');
            const possibleAnswers = currentExercise.answers[typedKey]?.map(ans => ans.toLowerCase().replace(/[.?]$/, '')) || [];
            
            if (typedKey === 'interrogative' && !translations[typedKey].trim().endsWith('?')) {
                 newStatus[typedKey] = 'incorrect';
                 allCorrect = false;
                 return;
            }

            if (possibleAnswers.length > 0 && possibleAnswers.includes(userAnswer)) {
                newStatus[typedKey] = 'correct';
            } else {
                newStatus[typedKey] = 'incorrect';
                allCorrect = false;
            }
        });

        setValidationStatus(newStatus);
        setIsCurrentCorrect(allCorrect);

        if (allCorrect) {
            toast({ title: "¡Correcto!", description: "Puedes pasar al siguiente." });
            const newCompleted = [...completedPrompts];
            newCompleted[currentIndex] = true;
            setCompletedPrompts(newCompleted);
        } else {
            toast({ variant: 'destructive', title: "Incorrecto", description: "Revisa tus respuestas." });
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
    
    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>{title || 'Ejercicios (Presente Simple)'}</CardTitle>
                <CardDescription>Traduce la frase a todas sus formas.</CardDescription>
                <div className="pt-4 space-y-2">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-sm font-medium text-muted-foreground">Progreso del Ejercicio</span>
                        <span className="text-sm font-bold">{Math.round(progress)}%</span>
                    </div>
                     <div className="relative flex items-center">
                        <Progress 
                            value={progress} 
                            className="h-6 rounded-full bg-destructive/20"
                            indicatorClassName={cn(
                                "rounded-full transition-all duration-500 !bg-brand-blue",
                                Object.values(validationStatus).some(s => s === 'incorrect') && "!bg-destructive",
                                progress === 100 ? '!bg-brand-blue' : ''
                            )}
                        />
                        {nemoImage && progress < 100 && (
                             <div 
                                className="absolute top-1/2 -translate-y-1/2 z-10 transition-all duration-500"
                                style={{ left: `calc(${progress}% - 14px)` }}
                             >
                                <Image
                                    src={nemoImage.imageUrl}
                                    alt={nemoImage.description}
                                    width={28}
                                    height={28}
                                    className="object-contain"
                                    data-ai-hint={nemoImage.imageHint}
                                />
                            </div>
                        )}
                        {clownFishImage && (
                             <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                                <Image
                                    src={clownFishImage.imageUrl}
                                    alt={clownFishImage.description}
                                    width={28}
                                    height={28}
                                    className="object-contain"
                                    data-ai-hint={clownFishImage.imageHint}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <p className="text-sm text-muted-foreground">Frase a traducir ({currentIndex + 1}/{exerciseData.length})</p>
                    <p className="text-xl font-bold p-3 bg-muted rounded-md text-center">{currentExercise.spanish}</p>
                </div>
                 <div className="space-y-3 font-mono text-base">
                    <div className="flex items-center gap-3">
                        <Label htmlFor="affirmative" className="w-12 font-bold text-lg text-green-500 text-center">(+)</Label>
                        <Input id="affirmative" name="affirmative" value={translations.affirmative} onChange={handleInputChange} className={cn(validationStatus.affirmative === 'correct' ? 'border-green-500' : validationStatus.affirmative === 'incorrect' ? 'border-destructive' : '')} autoComplete="off" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Label htmlFor="negative" className="w-12 font-bold text-lg text-red-500 text-center">(-)</Label>
                        <Input id="negative" name="negative" value={translations.negative} onChange={handleInputChange} className={cn(validationStatus.negative === 'correct' ? 'border-green-500' : validationStatus.negative === 'incorrect' ? 'border-destructive' : '')} autoComplete="off" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Label htmlFor="interrogative" className="w-12 font-bold text-lg text-blue-500 text-center">(?)</Label>
                        <Input id="interrogative" name="interrogative" value={translations.interrogative} onChange={handleInputChange} className={cn(validationStatus.interrogative === 'correct' ? 'border-green-500' : validationStatus.interrogative === 'incorrect' ? 'border-destructive' : '')} autoComplete="off" />
                    </div>
                    {shouldShowShortAnswers && (
                        <>
                            <div className="border-t my-2" />
                            <div className="flex items-center gap-3">
                                <Label htmlFor="shortAffirmative" className="w-12 font-bold text-lg text-green-500 text-center">(+A)</Label>
                                <Input id="shortAffirmative" name="shortAffirmative" value={translations.shortAffirmative} onChange={handleInputChange} className={cn(validationStatus.shortAffirmative === 'correct' ? 'border-green-500' : validationStatus.shortAffirmative === 'incorrect' ? 'border-destructive' : '')} autoComplete="off" />
                            </div>
                            <div className="flex items-center gap-3">
                                <Label htmlFor="shortNegative" className="w-12 font-bold text-lg text-red-500 text-center">(-A)</Label>
                                <Input id="shortNegative" name="shortNegative" value={translations.shortNegative} onChange={handleInputChange} className={cn(validationStatus.shortNegative === 'correct' ? 'border-green-500' : validationStatus.shortNegative === 'incorrect' ? 'border-destructive' : '')} autoComplete="off" />
                            </div>
                        </>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button onClick={handleCheck}>Verificar</Button>
                <Button onClick={handleNext} disabled={!isCurrentCorrect}>
                    {currentIndex < exerciseData.length - 1 ? 'Siguiente' : 'Finalizar'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    )
};
