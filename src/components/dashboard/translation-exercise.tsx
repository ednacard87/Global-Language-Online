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
    // --- INTRO 1 ---
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
    // --- CLASE 1 A1 ---
    class1_ex1: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'Tú eres el profesor' },
            { spanish: 'Ella no es mi madre' },
            { spanish: 'Nosotros somos estudiantes inteligentes' },
            { spanish: 'Él es de Estados Unidos' },
            { spanish: 'Ellos están en la oficina' },
            { spanish: 'Yo soy un profesional' },
        ]
    },
    class1_ex2: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'Tu hermano es mi amigo' },
            { spanish: 'Su hija es muy bonita (de ella)' },
            { spanish: 'Nuestro perro es grande' },
            { spanish: 'Ese es su carro (de él)' },
            { spanish: 'Sus padres están en Italia (de ellos)' },
        ]
    },
    class1_ex3: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'Su hermana es una doctora famosa (de ellos)' },
            { spanish: 'Mi abuelo es pensionado' },
            { spanish: '¿Sus libros están sobre la mesa? (de él)' },
            { spanish: 'Su gato es muy independiente (de ella)' },
        ]
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
        { affirmative: ["they are friends", "they're friends"], negative: ["they are not friends", "they aren't friends", "they're not friends"], interrogative: ["are they friends?"], shortAffirmative: ["yes, they are"], shortNegative: ["no, they are not", "no, they aren't"] },
        { affirmative: ["you are a student", "you're a student"], negative: ["you are not a student", "you aren't a student", "you're not a student"], interrogative: ["are you a student?"], shortAffirmative: ["yes, i am"], shortNegative: ["no, i am not", "no, i'm not"] },
        { affirmative: ["she is a lawyer", "she's a lawyer"], negative: ["she is not a lawyer", "she isn't a lawyer", "she's not a lawyer"], interrogative: ["is she a lawyer?"], shortAffirmative: ["yes, she is"], shortNegative: ["no, she is not", "no, she isn't"] },
        { affirmative: ["we are friends", "we're friends"], negative: ["we are not friends", "we aren't friends", "we're not friends"], interrogative: ["are we friends?"], shortAffirmative: ["yes, we are"], shortNegative: ["no, we are not", "no, we aren't"] },
        { affirmative: ["they are nurses", "they're nurses"], negative: ["they are not nurses", "they aren't nurses", "they're not nurses"], interrogative: ["are they nurses?"], shortAffirmative: ["yes, they are"], shortNegative: ["no, they are not", "no, they aren't"] },
        { affirmative: ["they are sick", "they're sick"], negative: ["they are not sick", "they aren't sick", "they're not sick"], interrogative: ["are they sick?"], shortAffirmative: ["yes, they are"], shortNegative: ["no, they are not", "no, they aren't"] }
    ],
    exercises2: [
        { affirmative: ["she is my sister", "she's my sister"], negative: ["she is not my sister", "she isn't my sister", "she's not my sister"], interrogative: ["is she my sister?"], shortAffirmative: ["yes, she is"], shortNegative: ["no, she is not", "no, she isn't"] },
        { affirmative: ["he is your father", "he's your father", "he is your dad", "he's your dad"], negative: ["he is not your father", "he isn't your father", "he's not your father", "he is not your dad", "he isn't your dad", "he's not your dad"], interrogative: ["is he your father?", "is he your dad?"], shortAffirmative: ["yes, he is"], shortNegative: ["no, he is not", "no, he isn't"] },
        { affirmative: ["they are her friends", "they're her friends"], negative: ["they are not her friends", "they aren't her friends", "they're not her friends"], interrogative: ["are they her friends?"], shortAffirmative: ["yes, they are"], shortNegative: ["no, they are not", "no, they aren't"] },
        { affirmative: ["he is their son", "he's their son"], negative: ["he is not their son", "he isn't their son", "he's not their son"], interrogative: ["is he their son?"], shortAffirmative: ["yes, he is"], shortNegative: ["no, he is not", "no, he isn't"] },
        { affirmative: ["Tommy is your dog", "Tommy's your dog"], negative: ["Tommy is not your dog", "Tommy isn't your dog", "Tommy's not your dog"], interrogative: ["is Tommy your dog?"], shortAffirmative: ["yes, he is"], shortNegative: ["no, he is not", "no, he isn't"] }
    ],
    exercises3: [
        { affirmative: ["their sister is a nurse", "their sister's a nurse"], negative: ["their sister is not a nurse", "their sister isn't a nurse"], interrogative: ["is their sister a nurse?"], shortAffirmative: ["yes, she is"], shortNegative: ["no, she is not", "no, she isn't"] },
        { affirmative: ["my grandparents are retired", "my grandparents're retired"], negative: ["my grandparents are not retired", "my grandparents aren't retired", "my grandparents're not retired"], interrogative: ["are my grandparents retired?"], shortAffirmative: ["yes, they are"], shortNegative: ["no, they are not", "no, they aren't"] },
        { affirmative: ["her dogs are small", "her dogs're small"], negative: ["her dogs are not small", "her dogs aren't small", "her dogs're not small"], interrogative: ["are her dogs small?"], shortAffirmative: ["yes, they are"], shortNegative: ["no, they are not", "no, they aren't"] },
        { affirmative: ["its toys are on the bed", "its toys're on the bed"], negative: ["its toys are not on the bed", "its toys aren't on the bed", "its toys're not on the bed"], interrogative: ["are its toys on the bed?"], shortAffirmative: ["yes, they are"], shortNegative: ["no, they are not", "no, they aren't"] }
    ],
    class1_ex1: [
        { affirmative: ["you are the teacher", "you're the teacher"], negative: ["you are not the teacher", "you're not the teacher", "you aren't the teacher"], interrogative: ["are you the teacher?"], shortAffirmative: ["yes, i am"], shortNegative: ["no, i am not", "no, i'm not"] },
        { affirmative: ["she is my mother", "she's my mother"], negative:["she is not my mother", "she isn't my mother", "she's not my mother"] , interrogative: ["is she my mother?"], shortAffirmative: ["yes, she is"], shortNegative: ["no, she is not", "no, she isn't"] },
        { affirmative: ["we are intelligent students", "we're intelligent students"], negative: ["we are not intelligent students", "we aren't intelligent students"], interrogative: ["are we intelligent students?"], shortAffirmative: ["yes, we are"], shortNegative: ["no, we are not", "no, we aren't"] },
        { affirmative: ["he is from the united states", "he's from the united states"], negative: ["he is not from the united states", "he isn't from the united states"], interrogative: ["is he from the united states?"], shortAffirmative: ["yes, he is"], shortNegative: ["no, he is not", "no, he isn't"] },
        { affirmative: ["they are at the office", "they're at the office"], negative: ["they are not at the office", "they're not at the office", "they aren't at the office"], interrogative: ["are they at the office?"], shortAffirmative: ["yes, they are"], shortNegative: ["no, they are not", "no, they aren't"] },
        { affirmative: ["i am a professional", "i'm a professional"], negative: ["i am not a professional", "i'm not a professional"], interrogative: ["am i a professional?"], shortAffirmative: ["yes, i am"], shortNegative: ["no, i am not", "no, i'm not"] }
    ],
    class1_ex2: [
        { affirmative: ["your brother is my friend", "your brother's my friend"], negative: ["your brother is not my friend", "your brother isn't my friend"], interrogative: ["is your brother my friend?"], shortAffirmative: ["yes, he is"], shortNegative: ["no, he is not", "no, he isn't"] },
        { affirmative: ["her daughter is very pretty", "her daughter's very pretty"], negative: ["her daughter is not very pretty", "her daughter isn't very pretty"], interrogative: ["is her daughter very pretty?"], shortAffirmative: ["yes, she is"], shortNegative: ["no, she is not", "no, she isn't"] },
        { affirmative: ["our dog is big", "our dog's big"], negative: ["our dog is not big", "our dog isn't big"], interrogative: ["is our dog big?"], shortAffirmative: ["yes, it is", "yes, he is", "yes, she is"], shortNegative: ["no, it is not", "no, it isn't" , "no, he is not", "no, he isn't"] },
        { affirmative: ["that is his car"], negative: ["that is not his car", "that isn't his car"], interrogative: ["is that his car?"], shortAffirmative: ["yes, it is"], shortNegative: ["no, it is not", "no, it isn't"] },
        { affirmative: ["their parents are in italy", "their parents're in italy"], negative: ["their parents are not in italy", "their parents aren't in italy"], interrogative: ["are their parents in italy?"], shortAffirmative: ["yes, they are"], shortNegative: ["no, they are not", "no, they aren't"] }
    ],
    class1_ex3: [
        { affirmative: ["their sister is a famous doctor", "their sister's a famous doctor"], negative: ["their sister is not a famous doctor", "their sister isn't a famous doctor"], interrogative: ["is their sister a famous doctor?"], shortAffirmative: ["yes, she is"], shortNegative: ["no, she is not", "no, she isn't"] },
        { affirmative: ["my grandfather is retired", "my grandfather's retired", "my grandpa is retired"], negative: ["my grandfather is not retired", "my grandfather isn't retired"], interrogative: ["is my grandfather retired?"], shortAffirmative: ["yes, he is"], shortNegative: ["no, he is not", "no, he isn't"] },
        { affirmative: ["his books are on the table"], negative: ["his books are not on the table", "his books aren't on the table"], interrogative: ["are his books on the table?"], shortAffirmative: ["yes, they are"], shortNegative: ["no, they are not", "no, they aren't"] },
        { affirmative: ["her cat is very independent", "her cat's very independent"], negative: ["her cat is not very independent"], interrogative: ["is her cat very independent?"], shortAffirmative: ["yes, it is", "yes, he is"], shortNegative: ["no, it is not", "no, it isn't" ,"no, he is not", "no, he isn't"] }
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
    title,
}: {
    exerciseKey: string;
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
    const exerciseData = exercises[exerciseKey as keyof typeof exercises];
    const [completionStatus, setCompletionStatus] = useState<Record<number, boolean>>({});

    const currentPrompt = exerciseData?.prompts[currentPromptIndex];
    const currentAnswerKey = answerKeys[exerciseKey as keyof typeof answerKeys]?.[currentPromptIndex];

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
    const [validationStates, setValidationStates] = useState<ValidationStatus[]>([]);
    const [isPristine, setIsPristine] = useState(true);
    const [allCurrentFieldsCorrect, setAllCurrentFieldsCorrect] = useState(false);
    const [showCompletionMessage, setShowCompletionMessage] = useState(false);
    const exerciseVersion = "v3_sep";

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
        
        if (exerciseData?.prompts.length) {
            setValidationStates(Array(exerciseData.prompts.length).fill('unchecked'));
        }

        setCurrentPromptIndex(0);
        setAllCurrentFieldsCorrect(false);
        setShowCompletionMessage(false);
    }, [exerciseKey, exerciseData?.prompts.length]);

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
        const totalPrompts = exerciseData?.prompts.length || 0;
        if (totalPrompts === 0) return 0;
        const completedPrompts = Object.values(completionStatus).filter(Boolean).length;
        return (completedPrompts / totalPrompts) * 100;
    }, [completionStatus, exerciseData?.prompts.length]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTranslations(prev => ({ ...prev, [name]: value }));
        setAllCurrentFieldsCorrect(false);
        if (!isPristine) {
            setValidationStatus(initialValidationStatus);
        }
    };
    
    const handleCheck = () => {
        if (!currentAnswerKey) return;
        setIsPristine(false);
        const newStatus: Record<keyof typeof translations, ValidationStatus> = { ...validationStatus };
        let allAnswersCorrect = true;

        const fieldsToCheck: (keyof typeof translations)[] = isQnaMode
            ? ['interrogative', 'shortAffirmative', 'shortNegative']
            : ['affirmative', 'negative', 'interrogative', 'shortAffirmative', 'shortNegative'];

        fieldsToCheck.forEach(key => {
            const typedKey = key as keyof typeof translations;
            
            let userAnswer = translations[typedKey].trim().toLowerCase().replace(/’/g, "'").replace(/\s+/g, ' ');
            let possibleAnswers = (currentAnswerKey[typedKey] || []).map(ans => 
                ans.toLowerCase().replace(/’/g, "'").replace(/\s+/g, ' ')
            );

            if (typedKey !== 'interrogative') {
                userAnswer = userAnswer.replace(/[.?]/g, ''); 
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
        
        setValidationStates(prev => {
            const next = [...prev];
            next[currentPromptIndex] = allAnswersCorrect ? 'correct' : 'incorrect';
            return next;
        });

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

        if (currentPromptIndex < (exerciseData?.prompts.length || 0) - 1) {
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

    if (!exerciseData) return null;

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
                                    <div className="space-y-2 text-foreground text-left">
                                        <h4 className="font-medium leading-none">Vocabulario Clave</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Palabras importantes para este ejercicio.
                                        </p>
                                    </div>
                                    
                                    <ScrollArea className="max-h-[300px] overflow-y-auto pr-4">
                                        <div className="grid gap-2 text-sm">
                                            {Object.entries(vocabulary).map(([spanish, english]) => (
                                                <div key={spanish} className="grid grid-cols-2 items-center gap-4 py-1 border-b border-border/50 last:border-0 text-foreground text-left">
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
                <div className="flex items-center justify-start flex-wrap gap-2 mt-4">
                    {exerciseData.prompts.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentPromptIndex(index)}
                            className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center font-bold border-2 transition-all",
                                currentPromptIndex === index ? "border-primary ring-2 ring-primary" : "border-muted-foreground/50",
                                validationStates[index] === 'correct' && 'bg-green-500/20 border-green-500 text-green-700',
                                validationStates[index] === 'incorrect' && 'bg-red-500/20 border-destructive text-destructive',
                            )}
                            aria-label={`Ir al ejercicio ${index + 1}`}
                        >
                            {index + 1}
                        </button>
                    ))}
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
                            className="h-6 rounded-full bg-secondary"
                            indicatorClassName={cn(
                                "rounded-full transition-all duration-500 !bg-primary",
                                !isPristine && !allCurrentFieldsCorrect && "!bg-destructive",
                                progress === 100 ? '!bg-primary' : ''
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
                                <p className="text-lg font-medium text-foreground">{currentPrompt?.spanish}</p>
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
                     {currentPromptIndex < (exerciseData?.prompts.length || 0) - 1 ? 'Siguiente' : 'Finalizar'}
                     <ArrowRight className="ml-2 h-4 w-4" />
                 </Button>
            </CardFooter>
        </Card>
    );
}
