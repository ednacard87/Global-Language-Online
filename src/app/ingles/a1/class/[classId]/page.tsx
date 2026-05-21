'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, BrainCircuit, CheckCircle, ChevronDown, Loader2, XCircle, Ear, ArrowRight, BookText } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

// Imports for Exercises
import { ToBeMemoryGame } from '@/components/kids/exercises/tobe-memory-game';
import { PossessivesMemoryGame } from '@/components/kids/exercises/possessives-memory-game';
import { TranslationExercise } from '@/components/dashboard/translation-exercise';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { ShortAnswerExercise } from '@/components/dashboard/short-answer-exercise';
import { VerbMemoryGame } from '@/components/kids/exercises/verb-memory-game';
import { VerbVocabularyExercise } from '@/components/kids/exercises/verb-vocabulary';
import { SingleFormExercise } from '@/components/kids/exercises/single-form';
import { PresentSimpleExercise } from '@/components/kids/exercises/present-simple';
import { ReadingComprehensionExercise } from '@/components/kids/exercises/reading-comprehension';
import { FillInTheBlanksExercise } from '@/components/kids/exercises/fill-in-the-blanks';

// --- Constants ---
const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// Data for Class 1
const verbToBeData = [
    { ser: 'Yo soy', tobe: 'I am', estar: 'Yo estoy' },
    { ser: 'Tú eres / usted es', tobe: 'You are', estar: 'Tú estás / usted está' },
    { ser: 'Él es', tobe: 'He is', estar: 'Él está' },
    { ser: 'Ella es', tobe: 'She is', estar: 'Ella está' },
    { ser: 'Esto es', tobe: 'It is', estar: 'Esto está' },
    { ser: 'Nosotros somos', tobe: 'We are', estar: 'Nosotros estamos' },
    { ser: 'Ustedes son', tobe: 'You are', estar: 'Ustedes están' },
    { ser: 'Ellos son', tobe: 'They are', estar: 'Ellos están' },
];

const possessivesData = [
    { english: 'My', spanish: 'Mi / Mis' },
    { english: 'Your', spanish: 'Tu / Tus (de ti)' },
    { english: 'His', spanish: 'Su / Sus (de él)' },
    { english: 'Her', spanish: 'Su / Sus (de ella)' },
    { english: 'Its', spanish: 'Su / Sus (de eso)' },
    { english: 'Our', spanish: 'Nuestro / Nuestra / Nuestros / Nuestras' },
    { english: 'Your', spanish: 'Su / Sus (de ustedes)' },
    { english: 'Their', spanish: 'Su / Sus (de ellos/as)' },
];

const classVocabularyData = {
    weekdays: [
        { spanish: 'Lunes', english: 'Monday' },
        { spanish: 'Martes', english: 'Tuesday' },
        { spanish: 'Miércoles', english: 'Wednesday' },
        { spanish: 'Jueves', english: 'Thursday' },
        { spanish: 'Viernes', english: 'Friday' },
        { spanish: 'Sábado', english: 'Saturday' },
        { spanish: 'Domingo', english: 'Sunday' },
    ],
    months: [
        { spanish: 'Enero', english: 'January' },
        { spanish: 'Febrero', english: 'February' },
        { spanish: 'Marzo', english: 'March' },
        { spanish: 'Abril', english: 'April' },
        { spanish: 'Mayo', english: 'May' },
        { spanish: 'Junio', english: 'June' },
        { spanish: 'Julio', english: 'July' },
        { spanish: 'Agosto', english: 'August' },
        { spanish: 'Septiembre', english: 'September' },
        { spanish: 'Octubre', english: 'October' },
        { spanish: 'Noviembre', english: 'November' },
        { spanish: 'Diciembre', english: 'December' },
    ],
    seasons: [
        { spanish: 'Verano', english: 'Summer' },
        { spanish: 'Otoño', english: 'Autumn' },
        { spanish: 'Invierno', english: 'Winter' },
        { spanish: 'Primavera', english: 'Spring' },
    ],
    colors: [
        { spanish: 'Rojo', english: 'Red' },
        { spanish: 'Azul', english: 'Blue' },
        { spanish: 'Verde', english: 'Green' },
        { spanish: 'Amarillo', english: 'Yellow' },
        { spanish: 'Naranja', english: 'Orange' },
        { spanish: 'Morado', english: 'Purple' },
        { spanish: 'Negro', english: 'Black' },
        { spanish: 'Blanco', english: 'White' },
        { spanish: 'Gris', english: 'Gray' },
        { spanish: 'Marrón', english: 'Brown' },
        { spanish: 'Azul claro', english: 'Light blue' },
        { spanish: 'Azul oscuro', english: 'Dark blue' },
    ]
};

// Data for Class 2
const class2VocabularyData = {
    verbos: [
        { spanish: 'LLAMAR', english: 'Call' },
        { spanish: 'COCINAR', english: 'Cook' },
        { spanish: 'BEBER', english: 'Drink' },
        { spanish: 'COMER', english: 'Eat' },
        { spanish: 'IR', english: 'Go' },
        { spanish: 'VIVIR', english: 'Live' },
        { spanish: 'ABRIR', english: 'Open' },
        { spanish: 'JUGAR', english: 'Play' },
        { spanish: 'LEER', english: 'Read' },
        { spanish: 'CORRER', english: 'Run' },
        { spanish: 'HABLAR', english: 'Speak' },
        { spanish: 'TRABAJAR', english: 'Work' },
        { spanish: 'ESCRIBIR', english: 'Write' },
        { spanish: 'ESTUDIAR', english: 'Study' },
        { spanish: 'DORMIR', english: 'Sleep' },
    ],
    palabrasBasicas: [
        { spanish: 'POR FAVOR', english: 'Please' },
        { spanish: 'DE NADA', english: "You're welcome" },
        { spanish: 'CON MUCHO GUSTO', english: "With pleasure" },
        { spanish: 'GRACIAS', english: 'Thank you' },
        { spanish: 'BIENVENIDO', english: 'Welcome' },
        { spanish: 'A TIEMPO', english: 'On time' },
    ]
};

const positiveExercisesData = [
    { spanish: 'yo bebo agua', answer: ["I drink water"] },
    { spanish: 'nosotros jugamos futbol', answer: ["we play soccer", "we play football"] },
    { spanish: 'ellos escuchan musica', answer: ["they listen to music"] },
    { spanish: 'yo hablo ingles', answer: ["I speak English"] },
    { spanish: 'tu abres la puerta', answer: ["you open the door"] },
];
const negativeExercisesData = [
    { spanish: 'yo no bebo agua', answer: ["I do not drink water", "I don't drink water"] },
    { spanish: 'nosotros no jugamos futbol', answer: ["we do not play soccer", "we don't play soccer", "we do not play football", "we don't play football"] },
    { spanish: 'ellos no escuchan musica', answer: ["they do not listen to music", "they don't listen to music"] },
    { spanish: 'yo no hablo ingles', answer: ["I do not speak English", "I don't speak English"] },
    { spanish: 'tu no abres la puerta', answer: ["you do not open the door", "you don't open the door"] },
];
const interrogativeExercisesData = [
    { spanish: '¿yo bebo agua?', answer: ["do I drink water?"] },
    { spanish: '¿nosotros jugamos futbol?', answer: ["do we play soccer?", "do we play football?"] },
    { spanish: '¿ellos escuchan musica?', answer: ["do they listen to music?"] },
    { spanish: '¿yo hablo ingles?', answer: ["do I speak English?"] },
    { spanish: '¿tu abres la puerta?', answer: ["do you open the door?"] },
];

const class2Exercise1Data = [
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
    }
];

const class2Exercise2Data = [
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
    }
];

interface Topic {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
  subItems?: { key: string; name: string; status: 'locked' | 'active' | 'completed', icon?: React.ElementType }[];
}

interface ClassContentProps {
    t: any;
    toast: any;
    studentDocRef: any;
    studentProfile: any;
    isAdmin: boolean;
    isProfileLoading: boolean;
    isUserLoading: boolean;
}

// =================================================================
//                 CLASS 1 COMPONENT
// =================================================================
const Class1Content = ({ t, toast, studentDocRef, studentProfile, isAdmin, isProfileLoading, isUserLoading }: ClassContentProps) => {
    const progressStorageKey = `progress_a1_eng_u1_c1_v65_stable`;
    const mainProgressKey = `progress_a1_eng_unit_1_class_1`;

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [userAnswers, setUserAnswers] = useState<{[key: string]: string[]}>({});
    const [validationStatus, setValidationStatus] = useState<{[key: string]: ('correct' | 'incorrect' | 'unchecked')[]}>({});
    
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);
    
    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: t('a1class1.vocabulary'), icon: BookOpen, status: 'active' },
        { key: 'tobe', name: t('kidsA1.toBe'), icon: GraduationCap, status: 'locked' },
        { key: 'memory-tobe', name: t('kidsA1.memoryToBe'), icon: BrainCircuit, status: 'locked' },
        { key: 'tobe-1-grammar', name: t('kidsA1.toBe1Grammar'), icon: GraduationCap, status: 'locked' },
        { key: 'tobe-1-exercise', name: t('kidsA1.toBe1Exercise'), icon: PenSquare, status: 'locked' },
        { key: 'possessives', name: t('kidsA1.possessives'), icon: GraduationCap, status: 'locked' },
        { key: 'memory-possessives', name: t('kidsA1.memoryPossessives'), icon: BrainCircuit, status: 'locked' },
        { key: 'tobe-2-grammar', name: t('kidsA1.toBe2Grammar'), icon: GraduationCap, status: 'locked' },
        { key: 'tobe-2-exercise', name: t('kidsA1.toBe2Exercise'), icon: PenSquare, status: 'locked' },
        { key: 'tobe-3-grammar', name: t('kidsA1.toBe3Grammar'), icon: GraduationCap, status: 'locked' },
        { key: 'tobe-3-exercise', name: t('kidsA1.toBe3Exercise'), icon: PenSquare, status: 'locked' },
        {
            key: 'mixto-1',
            name: 'Mixto 1',
            icon: PenSquare,
            status: 'locked',
            subItems: [
                { key: 'ex-mixto-1', name: 'Ejercicio 1', status: 'locked' },
                { key: 'ex-mixto-2', name: 'Ejercicio 2', status: 'locked' },
                { key: 'ex-mixto-3', name: 'Ejercicio 3', status: 'locked' },
            ]
        },
        {
            key: 'mixto-final',
            name: 'Mixto Final',
            icon: PenSquare,
            status: 'locked',
            subItems: [
                { key: 'ex-mixto-4', name: 'Ejercicio 4', status: 'locked' },
                { key: 'ex-mixto-5', name: 'Ejercicio 5', status: 'locked' },
                { key: 'ex-mixto-6', name: 'Ejercicio 6', status: 'locked' },
            ]
        }
    ], [t]);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;

        let path = initialLearningPath.map(topic => ({
            ...topic,
            subItems: topic.subItems ? topic.subItems.map(sub => ({...sub})) : undefined,
        }));

        let savedSelectedTopic = '';

        if (isAdmin) {
          path.forEach(item => { 
            item.status = 'completed';
            if (item.subItems) item.subItems.forEach(sub => sub.status = 'completed');
           });
        } else if(studentProfile?.lessonProgress?.[progressStorageKey]) {
            const savedData = studentProfile.lessonProgress[progressStorageKey];
            path.forEach(item => {
                if (savedData[item.key]) item.status = savedData[item.key];
                if (item.subItems && savedData.subItems?.[item.key]) {
                    item.subItems.forEach(subItem => {
                        if (savedData.subItems[item.key][subItem.key]) {
                            subItem.status = savedData.subItems[item.key][subItem.key];
                        }
                    });
                }
            });
            savedSelectedTopic = savedData.lastSelectedTopic || '';
        }

        let lastDone = true;
        for(let i=0; i < path.length; i++) {
            if (lastDone && path[i].status === 'locked') {
                path[i].status = 'active';
                if (path[i].subItems) path[i].subItems[0].status = 'active';
            }
            lastDone = path[i].status === 'completed';
            if (path[i].subItems) {
                let allDone = true;
                let lastSubDone = true;
                for(let j=0; j < path[i].subItems.length; j++) {
                    if (lastSubDone && path[i].subItems[j].status === 'locked') path[i].subItems[j].status = 'active';
                    lastSubDone = path[i].subItems[j].status === 'completed';
                    if (!lastSubDone) allDone = false;
                }
                lastDone = allDone;
            }
        }

        setLearningPath(path);
        const firstActive = path.find(p => p.status === 'active') || path.flatMap(p => p.subItems || []).find(sp => sp?.status === 'active');
        setSelectedTopic(savedSelectedTopic || firstActive?.key || path[0].key);

        const newAnswers: {[key: string]: string[]} = {};
        const newValidation: {[key: string]: ('correct' | 'incorrect' | 'unchecked')[]} = {};
        for (const category in classVocabularyData) {
            newAnswers[category] = Array((classVocabularyData as any)[category].length).fill('');
            newValidation[category] = Array((classVocabularyData as any)[category].length).fill('unchecked');
        }
        setUserAnswers(newAnswers);
        setValidationStatus(newValidation);

        setInitialLoadComplete(true);
        setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete, t]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        let totalTopics = 0;
        let completedTopics = 0;
        learningPath.forEach(t => {
            if(t.subItems) {
                totalTopics += t.subItems.length;
                completedTopics += t.subItems.filter(st => st.status === 'completed').length;
            } else {
                totalTopics++;
                if (t.status === 'completed') completedTopics++;
            }
        });
        return totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;

        const statusesToSave: Record<string, any> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => {
            statusesToSave[item.key] = item.status;
            if (item.subItems) {
                if (!statusesToSave.subItems) statusesToSave.subItems = {};
                statusesToSave.subItems[item.key] = {};
                item.subItems.forEach(sub => {
                    statusesToSave.subItems[item.key][sub.key] = sub.status;
                });
            }
        });

        const savedData = studentProfile?.lessonProgress?.[progressStorageKey];
        if (JSON.stringify(statusesToSave) !== JSON.stringify(savedData)) {
            updateDocumentNonBlocking(studentDocRef, {
                [`lessonProgress.${progressStorageKey}`]: statusesToSave,
                [`progress.${mainProgressKey}`]: Math.round(progressValue)
            });
        }
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, studentProfile, isInitialLoading]);

    useEffect(() => {
        if (!topicToComplete) return;
    
        setLearningPath(currentPath => {
            let wasUnlocked = false;
            let nextToSelect: string | null = null;
            const newPath = currentPath.map(t => ({
                ...t,
                subItems: t.subItems ? t.subItems.map(s => ({ ...s })) : undefined,
            }));
          
            let topicFound = false;
            for (let i = 0; i < newPath.length && !topicFound; i++) {
                const currentTopic = newPath[i];
  
                if (currentTopic.key === topicToComplete) {
                    if (currentTopic.status !== 'completed') currentTopic.status = 'completed';
                    if (i + 1 < newPath.length && newPath[i + 1].status === 'locked') {
                        const nextMain = newPath[i + 1];
                        nextMain.status = 'active';
                        wasUnlocked = true;
                        nextToSelect = nextMain.subItems?.[0]?.key || nextMain.key;
                        if (nextMain.subItems?.[0]) nextMain.subItems[0].status = 'active';
                    }
                    topicFound = true;
                } else if (currentTopic.subItems) {
                    const subIndex = currentTopic.subItems.findIndex((sub: any) => sub.key === topicToComplete);
                    if (subIndex !== -1) {
                        if (currentTopic.subItems[subIndex].status !== 'completed') currentTopic.subItems[subIndex].status = 'completed';
                        const nextSubIndex = subIndex + 1;
                        if (nextSubIndex < currentTopic.subItems.length && currentTopic.subItems[nextSubIndex].status === 'locked') {
                            currentTopic.subItems[nextSubIndex].status = 'active';
                            nextToSelect = currentTopic.subItems[nextSubIndex].key;
                            wasUnlocked = true;
                        } else if (currentTopic.subItems.every((sub: any) => sub.status === 'completed')) {
                            if (currentTopic.status !== 'completed') currentTopic.status = 'completed';
                            if (i + 1 < newPath.length && newPath[i + 1].status === 'locked') {
                                const nextMain = newPath[i + 1];
                                nextMain.status = 'active';
                                wasUnlocked = true;
                                nextToSelect = nextMain.subItems?.[0]?.key || nextMain.key;
                                if (nextMain.subItems?.[0]) nextMain.subItems[0].status = 'active';
                            }
                        }
                        topicFound = true;
                    }
                }
            }
            
            if (wasUnlocked) {
                setTimeout(() => toast({ title: "¡Siguiente tema desbloqueado!" }), 100);
            }
            if (nextToSelect) {
                const finalNext = nextToSelect;
                setTimeout(() => setSelectedTopic(finalNext), 100);
            }
            
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast, isAdmin]);

    const handleTopicSelect = (topicKey: string) => {
        const mainTopic = learningPath.find(t => t.key === topicKey || t.subItems?.some(st => st.key === topicKey));
        const subTopic = mainTopic?.subItems?.find(st => st.key === topicKey);
        const isLocked = !isAdmin && ((subTopic && subTopic.status === 'locked') || (!subTopic && mainTopic?.status === 'locked'));

        if (isLocked) {
            toast({ variant: "destructive", title: "Contenido Bloqueado" });
            return;
        }
        
        setSelectedTopic(topicKey);

        const autoViewTopics = ['tobe', 'possessives', 'tobe-1-grammar', 'tobe-2-grammar', 'tobe-3-grammar'];
        if (autoViewTopics.includes(topicKey)) {
            handleTopicComplete(topicKey);
        }
    };
    
    const handleVocabInputChange = (category: string, index: number, value: string) => {
        setUserAnswers(prevAnswers => {
            const newCategoryAnswers = [...(prevAnswers[category] || [])];
            newCategoryAnswers[index] = value;
            return { ...prevAnswers, [category]: newCategoryAnswers };
        });
        setValidationStatus(prevStatus => {
            if (prevStatus[category]?.[index] !== 'unchecked') {
                const newCategoryStatus = [...(prevStatus[category] || [])];
                newCategoryStatus[index] = 'unchecked';
                return { ...prevStatus, [category]: newCategoryStatus };
            }
            return prevStatus;
        });
        setCanAdvanceVocab(false);
    };

    const handleVocabCheckAnswers = () => {
        let atLeastOneCorrect = false;
        const newValidationStatus: {[key: string]: ('correct' | 'incorrect' | 'unchecked')[]} = {};

        for (const category in classVocabularyData) {
            const items = (classVocabularyData as any)[category];
            newValidationStatus[category] = items.map((item: {english: string}, index: number) => {
                const userAnswer = (userAnswers[category]?.[index] || '').trim().toLowerCase();
                const isCorrect = userAnswer === item.english.toLowerCase();
                if (isCorrect) atLeastOneCorrect = true;
                return isCorrect ? 'correct' : 'incorrect';
            });
        }
        setValidationStatus(newValidationStatus);
        if (atLeastOneCorrect) {
            toast({ title: '¡Bien hecho!' });
            setCanAdvanceVocab(true);
        } else {
            toast({ variant: 'destructive', title: 'Sigue intentando' });
            setCanAdvanceVocab(false);
        }
    };

    const getVocabInputClass = (category: string, index: number) => {
        const status = validationStatus[category]?.[index];
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500 bg-green-50 dark:bg-green-900/10';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive bg-destructive/5';
        return '';
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center min-h-[400px]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

        const topic = learningPath.find(t => t.key === selectedTopic) || 
                      learningPath.flatMap(t => t.subItems || []).find(st => st?.key === selectedTopic);

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left text-foreground">
                        <CardHeader><CardTitle>{t('a1class1.vocabulary')}</CardTitle></CardHeader>
                        <CardContent>
                            <Accordion type="multiple" className="w-full">
                            {Object.entries(classVocabularyData).map(([category, items]) => (
                                <AccordionItem key={category} value={category}>
                                    <AccordionTrigger className="text-lg font-semibold">{t(`a1class1.${category}`)}</AccordionTrigger>
                                    <AccordionContent>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                        <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.spanish')}</div>
                                        <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.english')}</div>
                                        {(items as {spanish:string, english:string}[]).map((item, index) => (
                                            <React.Fragment key={index}>
                                                <div className="p-3 bg-card border rounded-lg flex items-center justify-center font-medium">{item.spanish}</div>
                                                <div className="p-3 bg-card border rounded-lg flex items-center">
                                                    <Input 
                                                        value={userAnswers[category]?.[index] || ''} 
                                                        onChange={(e) => handleVocabInputChange(category, index, e.target.value)} 
                                                        className={cn(getVocabInputClass(category, index))} 
                                                        autoComplete="off" 
                                                    />
                                                </div>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                            </Accordion>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button onClick={handleVocabCheckAnswers}>{t('vocabulary.check')}</Button>
                            <Button onClick={() => setTopicToComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'memory-tobe': return <ToBeMemoryGame key={selectedTopic} onGameComplete={() => setTopicToComplete('memory-tobe')} />;
            case 'tobe-1-exercise': return <TranslationExercise key={selectedTopic} exerciseKey="exercises1" onComplete={() => setTopicToComplete('tobe-1-exercise')} vocabulary={{'un- una': 'a / an', 'abogado': 'lawyer', 'enfermo': 'sick', 'enfermero': 'nurse'}} highlightVocabulary={true} />;
            case 'memory-possessives': return <PossessivesMemoryGame key={selectedTopic} onGameComplete={() => setTopicToComplete('memory-possessives')} />;
            case 'tobe-2-exercise': return <TranslationExercise key={selectedTopic} exerciseKey="exercises2" onComplete={() => setTopicToComplete('tobe-2-exercise')} vocabulary={{'amigo': 'friend', 'hijo': 'son', 'perro': 'dog'}} highlightVocabulary={true} />;
            case 'tobe-3-exercise': return <TranslationExercise key={selectedTopic} exerciseKey="exercises3" onComplete={() => setTopicToComplete('tobe-3-exercise')} vocabulary={{'enfermera': 'nurse', 'abuelos': 'grandparents', 'pensionado': 'retired', 'juguete': 'toy'}} highlightVocabulary={true} />;
            case 'ex-mixto-1': return <SimpleTranslationExercise key={selectedTopic} course="a1" exerciseKey="mixed1" onComplete={() => setTopicToComplete('ex-mixto-1')} vocabulary={{"estudiante": "student", "amigos": "friends", "padres": "parents", "hermana": "sister", "abogados": "lawyers", "de": "from"}} highlightVocabulary={true} />;
            case 'ex-mixto-2': return <TranslationExercise key={selectedTopic} exerciseKey="qna2" formType="qna" onComplete={() => setTopicToComplete('ex-mixto-2')} title="Ejercicio 2" vocabulary={{"cansado": "tired", "curiosos": "curious", "hambriento": "hungry", "compañeros de trabajo": "coworkers", "a tiempo": "on time"}} highlightVocabulary={true} />;
            case 'ex-mixto-3': return <SimpleTranslationExercise key={selectedTopic} course="a1" exerciseKey="mixed3" onComplete={() => setTopicToComplete('ex-mixto-3')} vocabulary={{"estudiantes": "students", "mamá": "mother / mom", "abuela": "grandmother", "hermanas": "sisters", "cansado": "tired", "aburridos": "bored", "enojados": "angry", "preocupados": "worried"}} highlightVocabulary={true} />;
            case 'ex-mixto-4': return <SimpleTranslationExercise key={selectedTopic} course="a1" exerciseKey="mixed4" onComplete={() => setTopicToComplete('ex-mixto-4')} vocabulary={{"profesor": "teacher", "ingeniero": "engineer", "americano": "american", "en casa": "at home", "sobre": "on", "interesado": "interested", "estadio": "stadium"}} highlightVocabulary={true} />;
            case 'ex-mixto-5': return <ShortAnswerExercise key={selectedTopic} onComplete={() => setTopicToComplete('ex-mixto-5')} />;
            case 'ex-mixto-6': return <SimpleTranslationExercise key={selectedTopic} course="a1" exerciseKey="mixed6" onComplete={() => setTopicToComplete('ex-mixto-6')} vocabulary={{"padrastro": "stepfather", "estante": "shelf", "escritorio": "desk", "en el trabajo": "at work", "iglesia": "church", "supermercado": "supermarket"}} highlightVocabulary={true} />;
            
            case 'tobe-1-grammar':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left text-foreground">
                        <CardHeader>
                            <CardTitle>To be 1</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold text-foreground">Estructura</h3>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] space-y-3 font-mono text-base border">
                                    <div className="flex items-center gap-4">
                                        <span className="text-green-500 font-bold w-10 text-center text-lg">(+)</span>
                                        <span className="text-muted-foreground">pronoun + to be + complement</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-red-500 font-bold w-10 text-center text-lg">(-)</span>
                                        <span className="text-muted-foreground">pronoun + to be + not + complement</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-blue-500 font-bold w-10 text-center text-lg">(?)</span>
                                        <span className="text-muted-foreground">to be + pronoun + complement ?</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-lg font-bold text-foreground">Ejemplo: "ellos son estudiantes"</h3>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] space-y-3 font-mono text-base border">
                                    <div className="flex items-center gap-4">
                                        <span className="text-green-500 font-bold w-10 text-center text-lg">(+)</span>
                                        <span>They are students</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-red-500 font-bold w-10 text-center text-lg">(-)</span>
                                        <span>They are not students</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-blue-500 font-bold w-10 text-center text-lg">(?)</span>
                                        <span>are they students?</span>
                                    </div>
                                    <div className="pt-4 space-y-3 border-t border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-4">
                                            <span className="text-green-500 font-bold w-10 text-center text-lg">(+A)</span>
                                            <span>Yes, they are</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-red-500 font-bold w-10 text-center text-lg">(-A)</span>
                                            <span>No, they are not</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'tobe-2-grammar':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left text-foreground">
                        <CardHeader>
                            <CardTitle>To be 2</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold text-foreground">Estructura</h3>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] space-y-3 font-mono text-base border">
                                    <div className="flex items-center gap-4">
                                        <span className="text-green-500 font-bold w-10 text-center text-lg">(+)</span>
                                        <span className="text-muted-foreground">pronoun + To be + possessive + noun + complement</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-red-500 font-bold w-10 text-center text-lg">(-)</span>
                                        <span className="text-muted-foreground">pronoun + To be + Not + possessive + noun + complement</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-blue-500 font-bold w-10 text-center text-lg">(?)</span>
                                        <span className="text-muted-foreground">To be + pronoun + possessive + noun + complement ?</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-lg font-bold text-foreground">Ejemplo: "Ellos son mis amigos"</h3>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] space-y-3 font-mono text-base border">
                                    <div className="flex items-center gap-4">
                                        <span className="text-green-500 font-bold w-10 text-center text-lg">(+)</span>
                                        <span>They are my friends</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-red-500 font-bold w-10 text-center text-lg">(-)</span>
                                        <span>They are not my friends</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-blue-500 font-bold w-10 text-center text-lg">(?)</span>
                                        <span>are they my friends?</span>
                                    </div>
                                    <div className="pt-4 space-y-3 border-t border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-4">
                                            <span className="text-green-500 font-bold w-10 text-center text-lg">(+A)</span>
                                            <span>Yes, they are</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-red-500 font-bold w-10 text-center text-lg">(-A)</span>
                                            <span>No, they are not</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'tobe-3-grammar':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left text-foreground">
                        <CardHeader>
                            <CardTitle>To be 3</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold text-foreground">Estructura</h3>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] space-y-3 font-mono text-base border">
                                    <div className="flex items-center gap-4">
                                        <span className="text-green-500 font-bold w-10 text-center text-lg">(+)</span>
                                        <span className="text-muted-foreground">possessive + noun + to be + complement</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-red-500 font-bold w-10 text-center text-lg">(-)</span>
                                        <span className="text-muted-foreground">possessive + noun + to be + Not + complement</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-blue-500 font-bold w-10 text-center text-lg">(?)</span>
                                        <span className="text-muted-foreground">To be + possessive + noun + complement ?</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-lg font-bold text-foreground">Ejemplo: "Mi mamá es una enfermera"</h3>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] space-y-3 font-mono text-base border">
                                    <div className="flex items-center gap-4">
                                        <span className="text-green-500 font-bold w-10 text-center text-lg">(+)</span>
                                        <span>My mother is a nurse</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-red-500 font-bold w-10 text-center text-lg">(-)</span>
                                        <span>My mother is not a nurse</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-blue-500 font-bold w-10 text-center text-lg">(?)</span>
                                        <span>is my mother a nurse?</span>
                                    </div>
                                    <div className="pt-4 space-y-3 border-t border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-4">
                                            <span className="text-green-500 font-bold w-10 text-center text-lg">(+A)</span>
                                            <span>yes, she is</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-red-500 font-bold w-10 text-center text-lg">(-A)</span>
                                            <span>no, she is not</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'tobe':
            case 'possessives':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left text-foreground">
                        <CardHeader><CardTitle>{topic?.name}</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {selectedTopic === 'tobe' && (
                                <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-lg">
                                    <div className="font-bold p-3 bg-muted rounded-lg text-center">SER</div>
                                    <div className="font-bold p-3 bg-muted rounded-lg text-center">TO BE</div>
                                    <div className="font-bold p-3 bg-muted rounded-lg text-center">ESTAR</div>
                                    {verbToBeData.map((item, index) => (
                                        <React.Fragment key={index}>
                                            <div className="p-3 bg-card border rounded-lg text-center">{item.ser}</div>
                                            <div className="p-3 bg-card border rounded-lg font-medium text-center">{item.tobe}</div>
                                            <div className="p-3 bg-card border rounded-lg text-center">{item.estar}</div>
                                        </React.Fragment>
                                    ))}
                                </div>
                            )}
                            {selectedTopic === 'possessives' && (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                    <div className="font-bold p-3 bg-muted rounded-lg text-center">Inglés</div>
                                    <div className="font-bold p-3 bg-muted rounded-lg text-center">Español</div>
                                    {possessivesData.map((item, index) => (
                                        <React.Fragment key={index}>
                                            <div className="p-3 bg-card border rounded-lg font-medium text-center">{item.english}</div>
                                            <div className="p-3 bg-card border rounded-lg text-center">{item.spanish}</div>
                                        </React.Fragment>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            default: return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
        }
    };
    
    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-left">
                        <Link href="/ingles/a1" className="hover:underline text-sm text-white/80">Volver al curso A1</Link>
                        <h1 className="text-4xl font-bold text-white dark:text-primary [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase 1 (A1)</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9">{renderContent()}</div>
                        <div className="md:col-span-3 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader><CardTitle>Ruta de Aprendizaje</CardTitle></CardHeader>
                                <CardContent>
                                    {isInitialLoading ? <div className="h-48 w-full bg-muted animate-pulse rounded-md" /> : (
                                        <nav>
                                            <ul className="space-y-1">
                                            {learningPath.map((item) => {
                                                const isLocked = item.status === 'locked' && !isAdmin;
                                                const isSelected = selectedTopic === item.key || item.subItems?.some(si => si.key === selectedTopic);
                                                const StatusIcon = ICONS_CONFIG[item.status] || BookOpen;
                                                return(
                                                    <li key={item.key}>
                                                    {!item.subItems ? (
                                                        <div onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer', isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-semibold')}>
                                                        <div className="flex items-center gap-3">
                                                            <StatusIcon className={cn("h-5 w-5", item.status === 'completed' ? 'text-green-500' : '')} />
                                                            <span>{item.name}</span>
                                                        </div>
                                                        {isLocked && <Lock className="h-4 w-4 text-yellow-500" />}
                                                        </div>
                                                    ) : (
                                                        <Collapsible defaultOpen={isSelected}>
                                                        <CollapsibleTrigger className="w-full">
                                                            <div className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors w-full cursor-pointer', isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', isSelected && 'bg-muted text-primary font-semibold')}>
                                                                <div className="flex items-center gap-3">
                                                                <StatusIcon className={cn("h-5 w-5", item.status === 'completed' ? 'text-green-500' : '')} />
                                                                <span>{item.name}</span>
                                                                </div>
                                                                {isLocked ? <Lock className="h-4 w-4 text-yellow-500" /> : <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />}
                                                            </div>
                                                        </CollapsibleTrigger>
                                                        <CollapsibleContent>
                                                            <ul className="pl-8 pt-1 space-y-1">
                                                            {item.subItems.map((subItem) => {
                                                                const isSubLocked = subItem.status === 'locked' && !isAdmin;
                                                                const SubIcon = ICONS_CONFIG[subItem.status] || PenSquare;
                                                                return (
                                                                    <li key={subItem.key} onClick={() => handleTopicSelect(subItem.key)} className={cn('flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer', isSubLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === subItem.key && 'bg-muted text-primary font-semibold')}>
                                                                        <div className='flex items-center gap-3'>
                                                                            <SubIcon className={cn("h-5 w-5", subItem.status === 'completed' ? 'text-green-500' : '')} />
                                                                            <span>{subItem.name}</span>
                                                                        </div>
                                                                        {isSubLocked && <Lock className="h-4 w-4 text-yellow-500" />}
                                                                    </li>
                                                                );
                                                            })}
                                                            </ul>
                                                        </CollapsibleContent>
                                                        </Collapsible>
                                                    )}
                                                    </li>
                                                );
                                            })}
                                            </ul>
                                        </nav>
                                    )}
                                    <div className="mt-6 pt-6 border-t">
                                        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2"><span>Progreso</span><span className="font-bold text-foreground">{Math.round(progressValue)}%</span></div>
                                        <Progress value={progressValue} className="h-2" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

// =================================================================
//                 CLASS 2 COMPONENT
// =================================================================
const Class2Content = ({ t, toast, studentDocRef, studentProfile, isAdmin, isProfileLoading, isUserLoading }: ClassContentProps) => {
    const progressStorageVersion = 'progress_a1_eng_u1_c2_v75_stable';
    const mainProgressKey = 'progress_a1_eng_unit_1_class_2';
    
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [userAnswers, setUserAnswers] = useState<{[key: string]: string[]}>({});
    const [validationStatus, setValidationStatus] = useState<{[key: string]: ('correct' | 'incorrect' | 'unchecked')[]}>({});
    
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: t('a1class1.vocabulary'), icon: BookOpen, status: 'active' },
        { key: 'grammar', name: t('kidsA1Class2.grammar'), icon: GraduationCap, status: 'locked' },
        {
            key: 'exercises',
            name: t('kidsA1Class2.exercises'),
            icon: PenSquare,
            status: 'locked',
            subItems: [
                { key: 'ex-positive', name: t('kidsA1Class2.exercisesPositive'), status: 'locked', icon: PenSquare },
                { key: 'ex-negative', name: t('kidsA1Class2.exercisesNegative'), status: 'locked', icon: PenSquare },
                { key: 'ex-interrogative', name: t('kidsA1Class2.exercisesInterrogative'), status: 'locked', icon: PenSquare },
            ]
        },
        { key: 'memory-verbs', name: t('kidsA1Class2.memoryVerbs'), icon: BrainCircuit, status: 'locked' },
        {
            key: 'mixed-exercises-1',
            name: t('a1class1.exercise', { number: 1 }),
            icon: PenSquare,
            status: 'locked',
            subItems: [
                { key: 'ex-mixed-1-1', name: t('a1class1.exercise', { number: 1 }), status: 'locked', icon: PenSquare },
                { key: 'ex-mixed-1-2', name: t('a1class1.exercise', { number: 2 }), status: 'locked', icon: PenSquare },
            ]
        },
        { key: 'reading', name: t('kidsA1Class2.reading'), icon: BookOpen, status: 'locked' },
        { key: 'listening', name: t('kidsA1Class2.listening'), icon: Ear, status: 'locked' },
        { key: 'final-vocab', name: t('kidsA1Class2.finalVocab'), icon: BookOpen, status: 'locked' },
    ], [t]);

    const handleTopicComplete = (topicKey: string) => {
        setTopicToComplete(topicKey);
    };

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;

        let path = initialLearningPath.map(topic => ({
            ...topic,
            subItems: topic.subItems ? topic.subItems.map(sub => ({...sub})) : undefined,
        }));

        let savedSelectedTopic = '';

        if (isAdmin) {
          path.forEach(item => { 
            item.status = 'completed';
            if (item.subItems) item.subItems.forEach(sub => sub.status = 'completed');
           });
        } else if(studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedData = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => {
                if (savedData[item.key]) item.status = savedData[item.key];
                if (item.subItems && savedData.subItems?.[item.key]) {
                    item.subItems.forEach(subItem => {
                        if (savedData.subItems[item.key][subItem.key]) {
                            subItem.status = savedData.subItems[item.key][subItem.key];
                        }
                    });
                }
            });
            savedSelectedTopic = savedData.lastSelectedTopic || '';
        }

        let lastDone = true;
        for(let i=0; i < path.length; i++) {
            if (lastDone && path[i].status === 'locked') {
                path[i].status = 'active';
                if (path[i].subItems) path[i].subItems[0].status = 'active';
            }
            lastDone = path[i].status === 'completed';
            if (path[i].subItems) {
                let allDone = true;
                let lastSubDone = true;
                for(let j=0; j < path[i].subItems.length; j++) {
                    if (lastSubDone && path[i].subItems[j].status === 'locked') path[i].subItems[j].status = 'active';
                    lastSubDone = path[i].subItems[j].status === 'completed';
                    if (!lastSubDone) allDone = false;
                }
                lastDone = allDone;
            }
        }

        setLearningPath(path);
        const firstActive = path.find(p => p.status === 'active') || path.flatMap(p => p.subItems || []).find(sp => sp?.status === 'active');
        setSelectedTopic(savedSelectedTopic || firstActive?.key || path[0].key);

        const newAnswers: {[key: string]: string[]} = {};
        const newValidation: {[key: string]: ('correct' | 'incorrect' | 'unchecked')[]} = {};
        for (const category in class2VocabularyData) {
            newAnswers[category] = Array((class2VocabularyData as any)[category].length).fill('');
            newValidation[category] = Array((class2VocabularyData as any)[category].length).fill('unchecked');
        }
        setUserAnswers(newAnswers);
        setValidationStatus(newValidation);
        
        setInitialLoadComplete(true);
        setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete, t]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        let totalTopics = 0;
        let completedTopics = 0;
        learningPath.forEach(t => {
            if(t.subItems) {
                totalTopics += t.subItems.length;
                completedTopics += t.subItems.filter(st => st.status === 'completed').length;
            } else {
                totalTopics++;
                if (t.status === 'completed') completedTopics++;
            }
        });
        return totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;

        const statusesToSave: Record<string, any> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => {
            statusesToSave[item.key] = item.status;
            if (item.subItems) {
                if (!statusesToSave.subItems) statusesToSave.subItems = {};
                statusesToSave.subItems[item.key] = {};
                item.subItems.forEach(sub => {
                    statusesToSave.subItems[item.key][sub.key] = sub.status;
                });
            }
        });

        const savedData = studentProfile?.lessonProgress?.[progressStorageVersion];
        if (JSON.stringify(statusesToSave) !== JSON.stringify(savedData)) {
            updateDocumentNonBlocking(studentDocRef, {
                [`lessonProgress.${progressStorageVersion}`]: statusesToSave,
                [`progress.${mainProgressKey}`]: Math.round(progressValue)
            });
        }
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, studentProfile, isInitialLoading]);

    useEffect(() => {
        if (!topicToComplete) return;
    
        setLearningPath(currentPath => {
            let wasUnlocked = false;
            let nextToSelect: string | null = null;
            const newPath = currentPath.map(t => ({
                ...t,
                subItems: t.subItems ? t.subItems.map(s => ({...s})) : undefined,
            }));
          
            let topicFound = false;
            for (let i = 0; i < newPath.length && !topicFound; i++) {
                const currentTopic = newPath[i];
                if (currentTopic.key === topicToComplete) {
                    if (currentTopic.status !== 'completed') currentTopic.status = 'completed';
                    if (i + 1 < newPath.length && newPath[i + 1].status === 'locked') {
                        const nextMain = newPath[i + 1];
                        nextMain.status = 'active';
                        wasUnlocked = true;
                        nextToSelect = nextMain.subItems?.[0]?.key || nextMain.key;
                        if (nextMain.subItems?.[0]) nextMain.subItems[0].status = 'active';
                    }
                    topicFound = true;
                } else if (currentTopic.subItems) {
                    const subIndex = currentTopic.subItems.findIndex((sub: any) => sub.key === topicToComplete);
                    if (subIndex !== -1) {
                        if (currentTopic.subItems[subIndex].status !== 'completed') currentTopic.subItems[subItemIndex].status = 'completed';
                        const nextSubIndex = subIndex + 1;
                        if (nextSubIndex < currentTopic.subItems.length && currentTopic.subItems[nextSubIndex].status === 'locked') {
                            currentTopic.subItems[nextSubIndex].status = 'active';
                            nextToSelect = currentTopic.subItems[nextSubIndex].key;
                            wasUnlocked = true;
                        } else if (currentTopic.subItems.every(s => s.status === 'completed')) {
                            if (currentTopic.status !== 'completed') currentTopic.status = 'completed';
                            if (i + 1 < newPath.length && newPath[i + 1].status === 'locked') {
                                const nextMain = newPath[i + 1];
                                nextMain.status = 'active';
                                wasUnlocked = true;
                                nextToSelect = nextMain.subItems?.[0]?.key || nextMain.key;
                                if (nextMain.subItems?.[0]) nextMain.subItems[0].status = 'active';
                            }
                        }
                        topicFound = true;
                    }
                }
            }
            if (wasUnlocked) setTimeout(() => toast({ title: "¡Siguiente tema desbloqueado!" }), 0);
            if (nextToSelect) {
                const finalNext = nextToSelect;
                setTimeout(() => setSelectedTopic(finalNext), 0);
            }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast, isAdmin]);

    const handleTopicSelect = (topicKey: string) => {
        const mainTopic = learningPath.find(t => t.key === topicKey || t.subItems?.some(st => st.key === topicKey));
        const subTopic = mainTopic?.subItems?.find(st => st.key === topicKey);
        const isLocked = !isAdmin && ((subTopic && subTopic.status === 'locked') || (!subTopic && mainTopic?.status === 'locked'));

        if (isLocked) {
            toast({ variant: "destructive", title: "Contenido Bloqueado" });
            return;
        }
        
        setSelectedTopic(topicKey);
    };

    const handleVocabInputChange = (category: string, index: number, value: string) => {
        setUserAnswers(prevAnswers => {
            const newCategoryAnswers = [...(prevAnswers[category] || [])];
            newCategoryAnswers[index] = value;
            return { ...prevAnswers, [category]: newCategoryAnswers };
        });
        setValidationStatus(prevStatus => {
            if (prevStatus[category]?.[index] !== 'unchecked') {
                const newCategoryStatus = [...(prevStatus[category] || [])];
                newCategoryStatus[index] = 'unchecked';
                return { ...prevStatus, [category]: newCategoryStatus };
            }
            return prevStatus;
        });
        setCanAdvanceVocab(false);
    };

    const handleVocabCheckAnswers = () => {
        let atLeastOneCorrect = false;
        const newValidationStatus: {[key: string]: ('correct' | 'incorrect' | 'unchecked')[]} = {};

        for (const category in class2VocabularyData) {
            const items = (class2VocabularyData as any)[category];
            newValidationStatus[category] = items.map((item: {english: string}, index: number) => {
                const userAnswer = (userAnswers[category]?.[index] || '').trim().toLowerCase();
                const isCorrect = userAnswer === item.english.toLowerCase();
                if (isCorrect) atLeastOneCorrect = true;
                return isCorrect ? 'correct' : 'incorrect';
            });
        }
        setValidationStatus(newValidationStatus);
        if (atLeastOneCorrect) {
            toast({ title: '¡Bien hecho!' });
            setCanAdvanceVocab(true);
        } else {
            toast({ variant: 'destructive', title: 'Sigue intentando' });
            setCanAdvanceVocab(false);
        }
    };
    
    const getVocabInputClass = (category: string, index: number) => {
        const status = validationStatus[category]?.[index];
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500 bg-green-50 dark:bg-green-900/10';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive bg-destructive/5';
        return '';
    };

    const renderContentForClass2 = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center min-h-[400px]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

        const topic = learningPath.find(t => t.key === selectedTopic) || 
                      learningPath.flatMap(t => t.subItems || []).find(st => st?.key === selectedTopic);

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left text-foreground">
                        <CardHeader><CardTitle>Vocabulary - Class 2 (A1)</CardTitle></CardHeader>
                        <CardContent>
                          <Accordion type="multiple" className="w-full" defaultValue={['verbos', 'palabrasBasicas']}>
                            <AccordionItem value="verbos">
                              <AccordionTrigger className="text-lg font-semibold">Verbos</AccordionTrigger>
                              <AccordionContent>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                    <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.spanish')}</div>
                                    <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.english')}</div>
                                    {class2VocabularyData.verbos.map((item, index) => (
                                        <React.Fragment key={`verbos-${index}`}>
                                            <div className="p-3 bg-card border rounded-lg flex items-center justify-center font-medium">{item.spanish}</div>
                                            <div className="p-3 bg-card border rounded-lg flex items-center">
                                                <Input value={userAnswers.verbos?.[index] || ''} onChange={(e) => handleVocabInputChange('verbos', index, e.target.value)} className={cn(getVocabInputClass('verbos', index))} autoComplete="off" />
                                            </div>
                                        </React.Fragment>
                                    ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="palabrasBasicas">
                              <AccordionTrigger className="text-lg font-semibold">Palabras Básicas</AccordionTrigger>
                              <AccordionContent>
                                 <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                    <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.spanish')}</div>
                                    <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.english')}</div>
                                    {class2VocabularyData.palabrasBasicas.map((item, index) => (
                                        <React.Fragment key={`palabrasBasicas-${index}`}>
                                            <div className="p-3 bg-card border rounded-lg flex items-center justify-center font-medium">{item.spanish}</div>
                                            <div className="p-3 bg-card border rounded-lg flex items-center">
                                                <Input value={userAnswers.palabrasBasicas?.[index] || ''} onChange={(e) => handleVocabInputChange('palabrasBasicas', index, e.target.value)} className={cn(getVocabInputClass('palabrasBasicas', index))} autoComplete="off" />
                                            </div>
                                        </React.Fragment>
                                    ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button onClick={handleVocabCheckAnswers}>{t('vocabulary.check')}</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-center text-white mb-8 [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">PRESENT SIMPLE</h2>
                        
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left overflow-hidden text-foreground">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-2xl font-black text-primary uppercase">ESTRUCTURA</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] space-y-3 font-mono text-base border">
                                    <div className="flex items-center gap-4">
                                        <span className="text-green-500 font-bold w-12 text-center text-lg">(+)</span>
                                        <span>= Afirmativa</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-red-500 font-bold w-12 text-center text-lg">(-)</span>
                                        <span>= Negativa</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-blue-500 font-bold w-12 text-center text-lg">(?)</span>
                                        <span>= interrogativa ?</span>
                                    </div>
                                    <div className="pt-4 mt-4 border-t">
                                        <h4 className="font-bold mb-3 text-foreground">Short Answers = Respuestas Cortas</h4>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-4">
                                                <span className="text-green-500 font-bold w-12 text-center text-lg">(+A)</span>
                                                <span>= Respuesta corta positiva</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-red-500 font-bold w-12 text-center text-lg">(-A)</span>
                                                <span>= Respuesta corta Negativa</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left overflow-hidden text-foreground">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-2xl font-black text-primary uppercase">ESTRUCTURA DO/DOES</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] space-y-3 font-mono text-base border">
                                    <div className="flex items-center gap-4">
                                        <span className="text-green-500 font-bold w-12 text-center text-lg">(+)</span>
                                        <span>pronoun + verb + Complement</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-red-500 font-bold w-12 text-center text-lg">(-)</span>
                                        <span>pronoun + Do/Does + Not +verb + Complement</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-blue-500 font-bold w-12 text-center text-lg">(?)</span>
                                        <span>Do/Does + pronoun + verb + Complement ?</span>
                                    </div>
                                    <div className="pt-4 mt-4 border-t">
                                        <h4 className="font-bold mb-3 text-foreground">Short Answers = Respuestas Cortas</h4>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-4">
                                                <span className="text-green-500 font-bold w-12 text-center text-lg">(+A)</span>
                                                <span>Yes, pronoun + Do/Does</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-red-500 font-bold w-12 text-center text-lg">(-A)</span>
                                                <span>No, pronoun + Do/Does + Not</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left overflow-hidden text-foreground">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-2xl font-black text-primary uppercase">Conjugaciones</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] space-y-4 font-mono text-lg border">
                                    <div className="p-4 bg-background rounded-xl border border-primary/20 text-center">
                                        <span className="font-bold text-primary">DO</span> = I - YOU - WE - THEY
                                    </div>
                                    <div className="p-4 bg-background rounded-xl border border-brand-purple/20 text-center">
                                        <span className="font-bold text-brand-purple">DOES</span> = HE - SHE - IT
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center border-t pt-6">
                                <Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-16 font-bold h-14 text-xl">
                                    Entendido <ArrowRight className="ml-2 h-6 w-6" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                )
            case 'memory-verbs': return <VerbMemoryGame key={selectedTopic} onComplete={() => handleTopicComplete('memory-verbs')} />;
            case 'final-vocab': return <VerbVocabularyExercise key={selectedTopic} data={class2VocabularyData.verbos} onComplete={() => handleTopicComplete('final-vocab')} />;
            case 'listening':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left text-foreground">
                        <CardHeader><CardTitle>{t('kidsA1Class2.listening')}</CardTitle></CardHeader>
                        <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
                             <p className="text-muted-foreground text-foreground">Haz clic en el enlace para ir a tu ejercicio de escucha y escritura.</p>
                            <Button asChild><Link href="https://dailydictation.com/exercises/short-stories/5-my-house.8/listen-and-type" target="_blank" rel="noopener noreferrer">Ir al ejercicio</Link></Button>
                        </CardContent>
                        <CardFooter className="justify-center"><Button onClick={() => handleTopicComplete('listening')}>He completado el ejercicio</Button></CardFooter>
                    </Card>
                );
            case 'ex-positive': return <SingleFormExercise key={selectedTopic} onComplete={() => handleTopicComplete('ex-positive')} exerciseData={positiveExercisesData} title={t('kidsA1Class2.exercisePositive')} description={t('kidsA1Class2.exercisePositiveDescription')} formType="affirmative" />;
            case 'ex-negative': return <SingleFormExercise key={selectedTopic} onComplete={() => handleTopicComplete('ex-negative')} exerciseData={negativeExercisesData} title={t('kidsA1Class2.exerciseNegative')} description={t('kidsA1Class2.exerciseNegativeDescription')} formType="negative" />;
            case 'ex-interrogative': return <SingleFormExercise key={selectedTopic} onComplete={() => handleTopicComplete('ex-interrogative')} exerciseData={interrogativeExercisesData} title={t('kidsA1Class2.exerciseInterrogative')} description={t('kidsA1Class2.exerciseInterrogativeDescription')} formType="interrogative" />;
            case 'ex-mixed-1-1': return <PresentSimpleExercise key={selectedTopic} onComplete={() => handleTopicComplete('ex-mixed-1-1')} exerciseData={class2Exercise1Data} title="Ejercicios Mixtos 1" showShortAnswers={false} />;
            case 'ex-mixed-1-2': return <PresentSimpleExercise key={selectedTopic} onComplete={() => handleTopicComplete('ex-mixed-1-2')} exerciseData={class2Exercise2Data} title={t('a1class1.exercise', {number: 2})} showShortAnswers={false} />;
            case 'reading': return <ReadingComprehensionExercise key={selectedTopic} onComplete={() => handleTopicComplete('reading')} />;
            default: return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
        }
    };
    
    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
          <DashboardHeader />
          <main className="flex-1 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8 text-left">
                <Link href={`/ingles/a1/unit/1`} className="hover:underline text-sm text-white/80">Volver a la unidad 1</Link>
                <h1 className="text-4xl font-bold text-white dark:text-primary [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase 2 (A1)</h1>
              </div>
              <div className="grid gap-8 md:grid-cols-12">
                <div className="md:col-span-9">{renderContentForClass2()}</div>
                <div className="md:col-span-3 text-left">
                  <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader><CardTitle>Ruta de Aprendizaje</CardTitle></CardHeader>
                    <CardContent>
                      {isInitialLoading ? <div className="h-48 w-full bg-muted animate-pulse rounded-md" /> : (
                        <nav>
                          <ul className="space-y-1">
                            {learningPath.map((item) => {
                              const isLocked = item.status === 'locked' && !isAdmin;
                              const isSelected = selectedTopic === item.key || item.subItems?.some(si => si.key === selectedTopic);
                              const StatusIcon = ICONS_CONFIG[item.status] || BookOpen;
                              return(
                                <li key={item.key}>
                                {!item.subItems ? (
                                  <div onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && (item.status !== 'locked' || isAdmin) && 'bg-muted text-primary font-semibold')}>
                                    <div className="flex items-center gap-3">
                                        <StatusIcon className={cn("h-5 w-5", item.status === 'completed' ? 'text-green-500' : '')} />
                                        <span>{item.name}</span>
                                    </div>
                                    {isLocked && <Lock className="h-4 w-4 text-yellow-500" />}
                                  </div>
                                ) : (
                                  <Collapsible defaultOpen={isSelected}>
                                    <CollapsibleTrigger className="w-full">
                                        <div className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors w-full cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', isSelected && 'bg-muted text-primary font-semibold')}>
                                          <div className="flex items-center gap-3">
                                            <StatusIcon className={cn("h-5 w-5", item.status === 'completed' ? 'text-green-500' : '')} />
                                            <span>{item.name}</span>
                                          </div>
                                          {isLocked ? <Lock className="h-4 w-4 text-yellow-500" /> : <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />}
                                        </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                      <ul className="pl-8 pt-1 space-y-1">
                                        {item.subItems.map((subItem) => {
                                          const isSubLocked = subItem.status === 'locked' && !isAdmin;
                                          const SubIcon = ICONS_CONFIG[subItem.status] || PenSquare;
                                          return (
                                          <li key={subItem.key} onClick={() => handleTopicSelect(subItem.key)} className={cn('flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isSubLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === subItem.key && (subItem.status !== 'locked' || isAdmin) && 'bg-muted text-primary font-semibold')}>
                                            <div className="flex items-center gap-3">
                                              <SubIcon className={cn("h-5 w-5", subItem.status === 'completed' ? 'text-green-500' : '')} />
                                              <span>{subItem.name}</span>
                                            </div>
                                            {isSubLocked && <Lock className="h-4 w-4 text-yellow-500" />}
                                          </li>
                                        )})}
                                      </ul>
                                    </CollapsibleContent>
                                  </Collapsible>
                                )}
                                </li>
                              )})}
                          </ul>
                        </nav>
                      )}
                       <div className="mt-6 pt-6 border-t">
                            <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2"><span>Progreso</span><span className="font-bold text-foreground">{Math.round(progressValue)}%</span></div>
                            <Progress value={progressValue} className="h-2" />
                        </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
    );
};

// --- MAIN ROUTER COMPONENT ---
export default function EngA1ClassPage() {
    const params = useParams();
    const classId = params.classId as string;
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    
    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc(studentDocRef);
    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);

    const commonProps: ClassContentProps = { t, toast, studentDocRef, studentProfile, isAdmin, isProfileLoading, isUserLoading };

    if (classId === '1') return <Class1Content {...commonProps} />;
    if (classId === '2') return <Class2Content {...commonProps} />;

    return (
      <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-8"><div className="max-w-7xl mx-auto text-white text-left"><h1 className="text-4xl font-bold">Clase {classId} próximamente.</h1></div></main>
      </div>
    );
}
