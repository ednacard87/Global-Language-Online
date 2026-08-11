'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
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
import { ScrollArea } from '@/components/ui/scroll-area';



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
        { // "Ellas son hermanas"
            affirmative: ["they are sisters", "they're sisters"],
            negative: ["they are not sisters", "they aren't sisters", "they're not sisters"],
            interrogative: ["are they sisters?"],
            shortAffirmative: ["yes, they are"],
            shortNegative: ["no, they are not", "no, they aren't"],
        },
        { // "Tú eres un profesional"
            affirmative: ["you are a professional", "you're a professional"],
            negative: ["you are not a professional", "you aren't a professional", "you're not a professional"],
            interrogative: ["are you a professional?"],
            shortAffirmative: ["yes, i am"],
            shortNegative: ["no, i am not", "no, i'm not"],
        },
        { // "Ella es doctora"
            affirmative: ["she is a doctor", "she's a doctor"],
            negative: ["she is not a doctor", "she isn't a doctor", "she's not a doctor"],
            interrogative: ["is she a doctor?"],
            shortAffirmative: ["yes, she is"],
            shortNegative: ["no, she is not", "no, she isn't"],
        },
        { // "Nosotros estamos en casa"
            affirmative: ["we are at home", "we're at home"],
            negative: ["we are not at home", "we aren't at home", "we're not at home"],
            interrogative: ["are we at home?"],
            shortAffirmative: ["yes, we are"],
            shortNegative: ["no, we are not", "no, we aren't"],
        },
        { // "Ellos son hermanos"
            affirmative: ["they are brothers", "they're brothers"],
            negative: ["they are not brothers", "they aren't brothers", "they're not brothers"],
            interrogative: ["are they brothers?"],
            shortAffirmative: ["yes, they are"],
            shortNegative: ["no, they are not", "no, they aren't"],
        },
        { // "Ellos estan en la universidad"
            affirmative: ["they are at the university", "they're at the university"],
            negative: ["they are not at the university", "they aren't at the university", "they're not at the university"],
            interrogative: ["are they at the university?"],
            shortAffirmative: ["yes, they are"],
            shortNegative: ["no, they are not", "no, they aren't"],
        }
    ],
    exercises2: [
        { // "ella es mi mamá"
            affirmative: ["she is my mother", "she's my mother"],
            negative: ["she is not my mother", "she isn't my mother", "she's not my mother"],
            interrogative: ["is she my mother?"],
            shortAffirmative: ["yes, she is"],
            shortNegative: ["no, she is not", "no, she isn't"],
        },
        { // "él es tu padre"
            affirmative: ["he is your father", "he's your father", "he is your dad", "he's your dad"],
            negative: ["he is not your father", "he isn't your father", "he's not your father", "he is not your dad", "he isn't your dad", "he's not your dad"],
            interrogative: ["is he your father?", "is he your dad?"],
            shortAffirmative: ["yes, he is"],
            shortNegative: ["no, he is not", "no, he isn't"],
        },
        { // "ellos son sus primos (de ella)"
            affirmative: ["they are her cousins", "they're her cousins"],
            negative: ["they are not her cousins", "they aren't her cousins", "they're not her cousins"],
            interrogative: ["are they her cousins?"],
            shortAffirmative: ["yes, they are"],
            shortNegative: ["no, they are not", "no, they aren't"],
        },
        { // "él es su perro (de ellos)"
            affirmative: ["he is their dog", "he's their dog"],
            negative: ["he is not their dog", "he isn't their dog", "he's not their dog"],
            interrogative: ["is he their dog?"],
            shortAffirmative: ["yes, he is"],
            shortNegative: ["no, he is not", "no, he isn't"],
        },
        { // "Tommy es tu gato"
            affirmative: ["Tommy is your cat", "Tommy's your cat"],
            negative: ["Tommy is not your cat", "Tommy isn't your cat", "Tommy's not your cat"],
            interrogative: ["is Tommy your cat?"],
            shortAffirmative: ["yes, he is" ,"yes, it is"],
            shortNegative: ["no, he is not", "no, he isn't" , "no, it is not" , "no, it isn't"],
        }
    ],
    exercises3: [
        { // "su hermana es una abogada (de ellos)" -> "Their sister is a lawyer"
            affirmative: ["their sister is a lawyer", "their sister's a lawyer"],
            negative: ["their sister is not a lawyer", "their sister isn't a lawyer", "their sister's not a lawyer"],
            interrogative: ["is their sister a lawyer?"],
            shortAffirmative: ["yes, she is"],
            shortNegative: ["no, she is not", "no, she isn't"],
        },
        { // "mis abuelos están en la iglesia" -> "My grandparents are at the church"
            affirmative: ["my grandparents are at the church"],
            negative: ["my grandparents are not at the church", "my grandparents aren't at the church"],
            interrogative: ["are my grandparents at the church?"],
            shortAffirmative: ["yes, they are"],
            shortNegative: ["no, they are not", "no, they aren't"],
        },
        { // "sus perros son grandes (de ella)" -> "Her dogs are big"
            affirmative: ["her dogs are big"],
            negative: ["her dogs are not big", "her dogs aren't big"],
            interrogative: ["are her dogs big?"],
            shortAffirmative: ["yes, they are"],
            shortNegative: ["no, they are not", "no, they aren't"],
        },
        { // "sus juguetes están sobre la silla (del gato)" -> "Its toys are on the chair"
            affirmative: ["its toys are on the chair"],
            negative: ["its toys are not on the chair", "its toys aren't on the chair"],
            interrogative: ["are its toys on the chair?"],
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
        { affirmative: [], negative: [], interrogative: ["are they coworkers?" , "are they workmates?"], shortAffirmative: ["yes, they are"], shortNegative: ["no, they are not", "no, they aren't"] },
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
    title,
}: {
    exerciseKey: 'exercises1' | 'exercises2' | 'exercises3' | 'qna2';
    onComplete?: () => void;
    formType?: 'full' | 'qna';
    vocabulary?: Record<string, string>;
    highlightVocabulary?: boolean;
    title?: string;
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
            
            // Normalize: trim, lowercase, handle smart quotes and standardise spaces
            let userAnswer = translations[typedKey].trim().toLowerCase().replace(/’/g, "'").replace(/\s+/g, ' ');
            let possibleAnswers = currentAnswerKey[typedKey].map(ans => 
                ans.toLowerCase().replace(/’/g, "'").replace(/\s+/g, ' ')
            );

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
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle>{title || t(exerciseData.title, {number: exerciseKey.replace('exercises', '')})}</CardTitle>
                        <div className="text-sm font-medium text-muted-foreground">
                            {currentPromptIndex + 1} / {exerciseData.prompts.length}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className={cn("w-fit shrink-0", highlightVocabulary && "border-2 border-brand-blue animate-border-pulse")}>
                                    <BookText className="mr-2 h-4 w-4" />
                                    Vocabulario
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Vocabulario Clave</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Palabras importantes para este ejercicio.
                                        </p>
                                    </div>

                                    <ScrollArea className="h-40">
                                        <div className="grid gap-2 text-sm">
                                            {Object.entries(vocabulary).map(([spanish, english]) => (
                                                <div key={spanish} className="grid grid-cols-2 items-center gap-4">
                                                    <span className="text-muted-foreground capitalize">{spanish}</span>
                                                    <span className="font-semibold text-right">{english}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
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
                            className="h-6 rounded-full bg-destructive/20"
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
