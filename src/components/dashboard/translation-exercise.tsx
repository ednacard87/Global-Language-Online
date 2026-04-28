'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/context/language-context';
import { Progress } from '@/components/ui/progress';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ArrowRight, BookText } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';


const exercises = {
    exercises1: {
        title: 'intro1Page.exercises1',
        prompts: [
            { spanish: 'Ellos son amigos' },
            { spanish: 'Tú eres un estudiante' },
            { spanish: 'Ella es abogada' },
            { spanish: 'Nosotros somos amigos' },
            { spanish: 'Ellos son enfermeros' },
            { spanish: 'Ellos estan enfermos' },
        ],
    },
    exercises2: {
        title: 'intro1Page.exercises2',
        prompts: [
            { spanish: 'ella es mi hermana' },
            { spanish: 'él es tu padre' },
            { spanish: 'ellos son sus amigos (de ella)' },
            { spanish: 'él es su hijo (de ellos)' },
            { spanish: 'Tommy es tu perro' },
        ],
    },
    exercises3: {
        title: 'intro1Page.exercises3',
        prompts: [
            { spanish: 'su hermana es una enfermera (de ellos)' },
            { spanish: 'mis abuelos son pensionados' },
            { spanish: 'sus perros son pequeños (de ella)' },
            { spanish: 'sus juguetes están sobre la cama (del gato)' },
        ],
    },
    qna2: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: '¿ESTAS CANSADO?' },
            { spanish: '¿ELLA ES TU AMIGA?' },
            { spanish: '¿ELLOS SON ESTUDIANTES?' },
            { spanish: '¿MARY ESTA FELIZ?' },
            { spanish: '¿ELLOS SON CURIOSOS?' },
            { spanish: '¿ERES JIMMY?' },
            { spanish: '¿ELLA ES TU NOVIA?' },
            { spanish: '¿ELLA ESTA OCUPADA?' },
            { spanish: '¿ELLOS ESTAN LIBRES?' },
            { spanish: '¿ERES DE ESPAÑA?' },
            { spanish: '¿EL ES UN INGENIERO?' },
            { spanish: '¿ESTAS HAMBRIENTO?' },
            { spanish: '¿ELLOS SON COMPAÑEROS DE TRABAJO?' },
            { spanish: '¿EL ES JOSEPH?' },
            { spanish: '¿ESTAMOS A TIEMPO?' },
            { spanish: '¿ERES MATHEW?' },
        ]
    }
};

const answerKeys = {
    exercises1: [
        { // "Ellos son amigos"
            affirmative: ["they are friends", "they're friends"],
            negative: ["they are not friends", "they aren't friends"],
            interrogative: ["are they friends?"],
            shortAffirmative: ["yes, they are"],
            shortNegative: ["no, they are not", "no, they aren't"],
        },
        { // "Tú eres un estudiante"
            affirmative: ["you are a student", "you're a student"],
            negative: ["you are not a student", "you aren't a student"],
            interrogative: ["are you a student?"],
            shortAffirmative: ["yes, i am"],
            shortNegative: ["no, i am not", "no, i'm not"],
        },
        { // "Ella es abogada"
            affirmative: ["she is a lawyer", "she's a lawyer"],
            negative: ["she is not a lawyer", "she isn't a lawyer"],
            interrogative: ["is she a lawyer?"],
            shortAffirmative: ["yes, she is"],
            shortNegative: ["no, she is not", "no, she isn't"],
        },
        { // "Nosotros somos amigos"
            affirmative: ["we are friends", "we're friends"],
            negative: ["we are not friends", "we aren't friends"],
            interrogative: ["are we friends?"],
            shortAffirmative: ["yes, we are"],
            shortNegative: ["no, we are not", "no, we aren't"],
        },
        { // "Ellos son enfermeros"
            affirmative: ["they are nurses", "they're nurses"],
            negative: ["they are not nurses", "they aren't nurses"],
            interrogative: ["are they nurses?"],
            shortAffirmative: ["yes, they are"],
            shortNegative: ["no, they are not", "no, they aren't"],
        },
        { // "Ellos estan enfermos"
            affirmative: ["they are sick", "they're sick"],
            negative: ["they are not sick", "they aren't sick"],
            interrogative: ["are they sick?"],
            shortAffirmative: ["yes, they are"],
            shortNegative: ["no, they are not", "no, they aren't"],
        }
    ],
    exercises2: [
        { // "ella es mi hermana"
            affirmative: ["she is my sister", "she's my sister"],
            negative: ["she is not my sister", "she isn't my sister"],
            interrogative: ["is she my sister?"],
            shortAffirmative: ["yes, she is"],
            shortNegative: ["no, she is not", "no, she isn't"],
        },
        { // "él es tu padre"
            affirmative: ["he is your father", "he's your father", "he is your dad", "he's your dad"],
            negative: ["he is not your father", "he isn't your father", "he is not your dad", "he isn't your dad"],
            interrogative: ["is he your father?", "is he your dad?"],
            shortAffirmative: ["yes, he is"],
            shortNegative: ["no, he is not", "no, he isn't"],
        },
        { // "ellos son sus amigos (de ella)"
            affirmative: ["they are her friends", "they're her friends"],
            negative: ["they are not her friends", "they aren't her friends"],
            interrogative: ["are they her friends?"],
            shortAffirmative: ["yes, they are"],
            shortNegative: ["no, they are not", "no, they aren't"],
        },
        { // "él es su hijo (de ellos)"
            affirmative: ["he is their son", "he's their son"],
            negative: ["he is not their son", "he isn't their son"],
            interrogative: ["is he their son?"],
            shortAffirmative: ["yes, he is"],
            shortNegative: ["no, he is not", "no, he isn't"],
        },
        { // "Tommy es tu perro"
            affirmative: ["Tommy is your dog", "Tommy's your dog"],
            negative: ["Tommy is not your dog", "Tommy isn't your dog"],
            interrogative: ["is Tommy your dog?"],
            shortAffirmative: ["yes, he is"],
            shortNegative: ["no, he is not", "no, he isn't"],
        }
    ],
    exercises3: [
        { // "su hermana es una enfermera (de ellos)" -> "Their sister is a nurse"
            affirmative: ["their sister is a nurse", "their sister's a nurse"],
            negative: ["their sister is not a nurse", "their sister isn't a nurse"],
            interrogative: ["is their sister a nurse?"],
            shortAffirmative: ["yes, she is"],
            shortNegative: ["no, she is not", "no, she isn't"],
        },
        { // "mis abuelos son pensionados" -> "My grandparents are retired"
            affirmative: ["my grandparents are retired", "my grandparents're retired"],
            negative: ["my grandparents are not retired", "my grandparents aren't retired"],
            interrogative: ["are my grandparents retired?"],
            shortAffirmative: ["yes, they are"],
            shortNegative: ["no, they are not", "no, they aren't"],
        },
        { // "sus perros son pequeños (de ella)" -> "Her dogs are small"
            affirmative: ["her dogs are small", "her dogs're small"],
            negative: ["her dogs are not small", "her dogs aren't small"],
            interrogative: ["are her dogs small?"],
            shortAffirmative: ["yes, they are"],
            shortNegative: ["no, they are not", "no, they aren't"],
        },
        { // "sus juguetes están sobre la cama (del gato)" -> "Its toys are on the bed"
            affirmative: ["its toys are on the bed", "its toys're on the bed"],
            negative: ["its toys are not on the bed", "its toys aren't on the bed"],
            interrogative: ["are its toys on the bed?"],
            shortAffirmative: ["yes, they are"],
            shortNegative: ["no, they are not", "no, they aren't"],
        }
    ],
    qna2: [
        { affirmative: [], negative: [], interrogative: ["are you tired?"], shortAffirmative: ["yes, i am"], shortNegative: ["no, i am not", "no, i'm not"] },
        { affirmative: [], negative: [], interrogative: ["is she your friend?"], shortAffirmative: ["yes, she is"], shortNegative: ["no, she is not", "no, she isn't"] },
        { affirmative: [], negative: [], interrogative: ["are they students?"], shortAffirmative: ["yes, they are"], shortNegative: ["no, they are not", "no, they aren't"] },
        { affirmative: [], negative: [], interrogative: ["is mary happy?"], shortAffirmative: ["yes, she is"], shortNegative: ["no, she is not", "no, she isn't"] },
        { affirmative: [], negative: [], interrogative: ["are they curious?"], shortAffirmative: ["yes, they are"], shortNegative: ["no, they are not", "no, they aren't"] },
        { affirmative: [], negative: [], interrogative: ["are you jimmy?"], shortAffirmative: ["yes, i am"], shortNegative: ["no, i am not", "no, i'm not"] },
        { affirmative: [], negative: [], interrogative: ["is she your girlfriend?"], shortAffirmative: ["yes, she is"], shortNegative: ["no, she is not", "no, she isn't"] },
        { affirmative: [], negative: [], interrogative: ["is she busy?"], shortAffirmative: ["yes, she is"], shortNegative: ["no, she is not", "no, she isn't"] },
        { affirmative: [], negative: [], interrogative: ["are they free?"], shortAffirmative: ["yes, they are"], shortNegative: ["no, they are not", "no, they aren't"] },
        { affirmative: [], negative: [], interrogative: ["are you from spain?"], shortAffirmative: ["yes, i am"], shortNegative: ["no, i am not", "no, i'm not"] },
        { affirmative: [], negative: [], interrogative: ["is he an engineer?"], shortAffirmative: ["yes, he is"], shortNegative: ["no, he is not", "no, he isn't"] },
        { affirmative: [], negative: [], interrogative: ["are you hungry?"], shortAffirmative: ["yes, i am"], shortNegative: ["no, i am not", "no, i'm not"] },
        { affirmative: [], negative: [], interrogative: ["are they coworkers?"], shortAffirmative: ["yes, they are"], shortNegative: ["no, they are not", "no, they aren't"] },
        { affirmative: [], negative: [], interrogative: ["is he joseph?"], shortAffirmative: ["yes, he is"], shortNegative: ["no, he is not", "no, he isn't"] },
        { affirmative: [], negative: [], interrogative: ["are we on time?"], shortAffirmative: ["yes, we are"], shortNegative: ["no, we are not", "no, we aren't"] },
        { affirmative: [], negative: [], interrogative: ["are you mathew?"], shortAffirmative: ["yes, i am"], shortNegative: ["no, i am not", "no, i'm not"] },
    ]
};


type ValidationStatus = 'correct' | 'incorrect' | 'unchecked';

const nemoImage = PlaceHolderImages.find(p => p.id === 'nemo-icon');
const clownFishImage = PlaceHolderImages.find(p => p.id === 'clown-fish-guide');

export function TranslationExercise({
    exerciseKey,
    onComplete,
    formType = 'full',
    vocabulary,
    highlightVocabulary = false,
}: {
    exerciseKey: 'exercises1' | 'exercises2' | 'exercises3' | 'qna2';
    onComplete?: () => void;
    formType?: 'full' | 'qna';
    vocabulary?: Record<string, string>;
    highlightVocabulary?: boolean;
}) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const isQnaMode = formType === 'qna';

    const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
    const exerciseData = exercises[exerciseKey];
    const [completionStatus, setCompletionStatus] = useState<Record<number, boolean>>({});

    const currentPrompt = exerciseData.prompts[currentPromptIndex];
    const currentAnswerKey = answerKeys[exerciseKey][currentPromptIndex];

    const initialTranslations = {
        affirmative: '',
        negative: '',
        interrogative: '',
        shortAffirmative: '',
        shortNegative: '',
    };
    const [translations, setTranslations] = useState(initialTranslations);

    const initialValidationStatus: Record<keyof typeof translations, ValidationStatus> = {
        affirmative: 'unchecked',
        negative: 'unchecked',
        interrogative: 'unchecked',
        shortAffirmative: 'unchecked',
        shortNegative: 'unchecked',
    };
    const [validationStatus, setValidationStatus] = useState(initialValidationStatus);
    const [isPristine, setIsPristine] = useState(true);
    const [allCurrentFieldsCorrect, setAllCurrentFieldsCorrect] = useState(false);
    const [showCompletionMessage, setShowCompletionMessage] = useState(false);
    const exerciseVersion = "v2";

    useEffect(() => {
        const storedStatus = localStorage.getItem(`completionStatus_${exerciseKey}_${exerciseVersion}`);
        if (storedStatus) {
            try {
                const parsedStatus = JSON.parse(storedStatus);
                setCompletionStatus(parsedStatus);
            } catch {
                setCompletionStatus({});
            }
        } else {
            setCompletionStatus({});
        }
        setCurrentPromptIndex(0);
        setAllCurrentFieldsCorrect(false);
        setShowCompletionMessage(false);
    }, [exerciseKey]);

    useEffect(() => {
        localStorage.setItem(`completionStatus_${exerciseKey}_${exerciseVersion}`, JSON.stringify(completionStatus));
    }, [completionStatus, exerciseKey]);

    useEffect(() => {
        setTranslations(initialTranslations);
        setValidationStatus(initialValidationStatus);
        setIsPristine(true);
        setAllCurrentFieldsCorrect(false);
        setShowCompletionMessage(false);
    }, [exerciseKey, currentPromptIndex]);


    const progress = useMemo(() => {
        const totalPrompts = exerciseData.prompts.length;
        if (totalPrompts === 0) return 0;
        const completedPrompts = Object.values(completionStatus).filter(Boolean).length;
        return (completedPrompts / totalPrompts) * 100;
    }, [completionStatus, exerciseData.prompts.length]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTranslations(prev => ({ ...prev, [name]: value }));
        setAllCurrentFieldsCorrect(false);
        if (!isPristine) {
            setValidationStatus(initialValidationStatus);
        }
    };
    
    const handleCheck = () => {
        setIsPristine(false);
        const newStatus: Record<keyof typeof translations, ValidationStatus> = { ...validationStatus };
        let allAnswersCorrect = true;

        const fieldsToCheck: (keyof typeof translations)[] = isQnaMode
            ? ['interrogative', 'shortAffirmative', 'shortNegative']
            : ['affirmative', 'negative', 'interrogative', 'shortAffirmative', 'shortNegative'];

        fieldsToCheck.forEach(key => {
            const typedKey = key as keyof typeof translations;
            
            let userAnswer = translations[typedKey].trim().toLowerCase();
            let possibleAnswers = currentAnswerKey[typedKey].map(ans => ans.toLowerCase());

            if (typedKey !== 'interrogative') {
                userAnswer = userAnswer.replace(/[.?]/g, ''); // Remove punctuation for non-questions
                possibleAnswers = possibleAnswers.map(ans => ans.replace(/[.?]/g, ''));
            } else {
                 if (!userAnswer.endsWith('?')) {
                    newStatus[typedKey] = 'incorrect';
                    allAnswersCorrect = false;
                    return;
                }
            }
            
            if (possibleAnswers.includes(userAnswer)) {
                newStatus[typedKey] = 'correct';
            } else {
                newStatus[typedKey] = 'incorrect';
                allAnswersCorrect = false;
            }
        });

        setValidationStatus(newStatus);
        setAllCurrentFieldsCorrect(allAnswersCorrect);

        if (allAnswersCorrect) {
            toast({
                title: t('spellingExercise.correct'),
                description: '¡Excelente! Todas tus traducciones son correctas.',
            });
        } else {
            toast({
                variant: 'destructive',
                title: t('spellingExercise.incorrect'),
                description: 'Algunas respuestas son incorrectas. Revisa los campos marcados en rojo.',
            });
        }
    };
    
    const handleNext = () => {
        setCompletionStatus(prev => ({ ...prev, [currentPromptIndex]: true }));

        if (currentPromptIndex < exerciseData.prompts.length - 1) {
            setCurrentPromptIndex(prev => prev + 1);
        } else {
            setShowCompletionMessage(true);
            if (onComplete) {
                onComplete();
            }
        }
    };

    const isCheckButtonDisabled = isQnaMode
        ? translations.interrogative.trim() === '' || translations.shortAffirmative.trim() === '' || translations.shortNegative.trim() === ''
        : Object.values(translations).some(val => val.trim() === '');
        
    const isNextButtonDisabled = !allCurrentFieldsCorrect;
    
    const getInputClass = (field: keyof typeof validationStatus) => {
        switch (validationStatus[field]) {
            case 'correct':
                return 'border-green-500 focus-visible:ring-green-500';
            case 'incorrect':
                return 'border-destructive focus-visible:ring-destructive';
            default:
                return '';
        }
    };

    if (showCompletionMessage) {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardContent className="p-6">
                    <div className="text-center py-8">
                        <h2 className="text-5xl font-bold bg-gradient-to-r from-brand-purple to-brand-teal text-transparent bg-clip-text animate-pulse">
                            {t('intro1Page.congratulations')}
                        </h2>
                        <p className="text-xl mt-4 text-muted-foreground">{t('intro1Page.exerciseComplete')}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>{t(exerciseData.title, {number: 2})}</CardTitle>
                    <span className="text-sm font-medium text-muted-foreground">
                        {currentPromptIndex + 1} / {exerciseData.prompts.length}
                    </span>
                </div>
                 {vocabulary && (
                    <div className="flex justify-center mt-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className={cn("w-fit", highlightVocabulary && "border-2 border-brand-blue animate-border-pulse")}>
                                    <BookText className="mr-2 h-4 w-4" />
                                    Vocabulario
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent>
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Vocabulario Clave</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Palabras importantes para este ejercicio.
                                        </p>
                                    </div>
                                    <div className="grid gap-2 text-sm">
                                        {Object.entries(vocabulary).map(([spanish, english]) => (
                                            <div key={spanish} className="grid grid-cols-2 items-center gap-4">
                                                <span className="text-muted-foreground capitalize">{spanish}</span>
                                                <span className="font-semibold text-right">{english}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                )}
            </CardHeader>
            <CardContent className="space-y-6">
                
                <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-sm font-medium text-muted-foreground">{t('translationExercise.progressTitle')}</span>
                        <span className="text-sm font-bold">{Math.round(progress)}%</span>
                    </div>
                     <div className="relative flex items-center">
                        <Progress 
                            value={progress} 
                            className={cn(
                                "h-6 rounded-full bg-destructive/20"
                            )}
                            indicatorClassName={cn(
                                "rounded-full transition-all duration-500 !bg-brand-blue",
                                !isPristine && !allCurrentFieldsCorrect && "!bg-destructive",
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

                <div>
                    <h3 className="text-lg font-semibold mb-4">{t('translationExercise.translate')}</h3>
                    <div className="flex items-start gap-4">
                         {clownFishImage && <Image
                            src={clownFishImage.imageUrl}
                            alt={clownFishImage.description}
                            width={60}
                            height={60}
                            className="rounded-lg hidden sm:block"
                            data-ai-hint={clownFishImage.imageHint}
                        />}
                        <div className="relative w-full">
                             <div className="bg-muted p-4 rounded-lg border">
                                <p className="text-lg font-medium">{currentPrompt.spanish}</p>
                             </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-4">{t('translationExercise.yourTranslation')}</h3>
                    <div className="space-y-3 font-mono text-base">
                        {!isQnaMode && (
                            <>
                                <div className="flex items-center gap-3">
                                    <Label htmlFor="affirmative" className="w-12 font-bold text-lg text-green-500 text-center">(+)</Label>
                                    <Input id="affirmative" name="affirmative" value={translations.affirmative} onChange={handleInputChange} className={cn(getInputClass('affirmative'))} autoComplete="off" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <Label htmlFor="negative" className="w-12 font-bold text-lg text-red-500 text-center">(-)</Label>
                                    <Input id="negative" name="negative" value={translations.negative} onChange={handleInputChange} className={cn(getInputClass('negative'))} autoComplete="off" />
                                </div>
                            </>
                        )}
                        <div className="flex items-center gap-3">
                            <Label htmlFor="interrogative" className="w-12 font-bold text-lg text-blue-500 text-center">(?)</Label>
                            <Input id="interrogative" name="interrogative" value={translations.interrogative} onChange={handleInputChange} className={cn(getInputClass('interrogative'))} autoComplete="off" />
                        </div>
                        <div className="border-t my-2 border-border/50" />
                        <div className="flex items-center gap-3">
                            <Label htmlFor="shortAffirmative" className="w-12 font-bold text-lg text-green-500 text-center">(+A)</Label>
                            <Input id="shortAffirmative" name="shortAffirmative" value={translations.shortAffirmative} onChange={handleInputChange} className={cn(getInputClass('shortAffirmative'))} autoComplete="off" />
                        </div>
                        <div className="flex items-center gap-3">
                            <Label htmlFor="shortNegative" className="w-12 font-bold text-lg text-red-500 text-center">(-A)</Label>
                            <Input id="shortNegative" name="shortNegative" value={translations.shortNegative} onChange={handleInputChange} className={cn(getInputClass('shortNegative'))} autoComplete="off" />
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                 <Button onClick={handleCheck} disabled={isCheckButtonDisabled}>{t('translationExercise.check')}</Button>
                 <Button onClick={handleNext} disabled={isNextButtonDisabled}>
                     {currentPromptIndex < exerciseData.prompts.length - 1 ? 'Siguiente' : 'Finalizar'}
                     <ArrowRight className="ml-2 h-4 w-4" />
                 </Button>
            </CardFooter>
        </Card>
    );
}
