'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

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

// --- Constants ---
const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const class1VocabularyData = {
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

const class2VocabularyData = {
    verbos: [
        { spanish: 'JUGAR', english: 'Play' },
        { spanish: 'CAMINAR', english: 'Walk' },
        { spanish: 'IR', english: 'Go' },
        { spanish: 'TRABAJAR', english: 'Work' },
        { spanish: 'DORMIR', english: 'Sleep' },
        { spanish: 'COMER', english: 'Eat' },
        { spanish: 'BEBER', english: 'Drink' },
        { spanish: 'VER', english: 'See' },
        { spanish: 'MIRAR', english: 'Look' },
        { spanish: 'SALIR', english: 'Go out' },
        { spanish: 'CORRER', english: 'Run' },
        { spanish: 'CANTAR', english: 'Sing' },
        { spanish: 'HABLAR', english: 'Speak' },
        { spanish: 'PENSAR', english: 'Think' },
        { spanish: 'HABER/TENER', english: 'Have' },
        { spanish: 'HACER', english: 'Do' },
        { spanish: 'ESTUDIAR', english: 'Study' },
        { spanish: 'ESCRIBIR', english: 'Write' },
        { spanish: 'LEER', english: 'Read' },
        { spanish: 'APRENDER', english: 'Learn' },
        { spanish: 'ENSEÑAR', english: 'Teach' },
    ],
    palabrasBasicas: [
        { spanish: 'AYER', english: 'Yesterday' },
        { spanish: 'HOY', english: 'Today' },
        { spanish: 'MAÑANA', english: 'Tomorrow' },
        { spanish: 'AÑO', english: 'Year' },
        { spanish: 'DÍA', english: 'Day' },
        { spanish: 'SEMANA', english: 'Week' },
        { spanish: 'MES', english: 'Month' },
        { spanish: 'CON', english: 'With' },
        { spanish: 'DESAYUNO', english: 'Breakfast' },
        { spanish: 'ALMUERZO', english: 'Lunch' },
        { spanish: 'CENA', english: 'Dinner' },
        { spanish: 'SIN', english: 'Without' },
    ]
};

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

// Exercise Data for Class 2
const positiveExercisesData = [
    { spanish: 'yo bebo agua', answer: ["I drink water"] },
    { spanish: 'nosotros jugamos futbol', answer: ["we play soccer", "we play football"] },
    { spanish: 'ellos escuchan musica', answer: ["they listen to music"] },
    { spanish: 'yo hablo ingles', answer: ["I speak English"] },
    { spanish: 'tu abres la puerta', answer: ["you open the door"] },
    { spanish: 'yo camino en el parque el domingo', answer: ["i walk in the park on sunday"] },
    { spanish: 'tu juegas tenis el lunes', answer: ["you play tennis on monday"] },
    { spanish: 'ellos van a la universidad el sabado', answer: ["they go to the university on saturday"] },
    { spanish: 'nosotros trabajamos el fin de semana', answer: ["we work on the weekend", "we work on weekend"] },
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
        spanish: "yo camino en el parque el domingo",
        answers: {
            affirmative: ["i walk in the park on sunday"],
            negative: ["i do not walk in the park on sunday", "i don't walk in the park on sunday"],
            interrogative: ["do i watch movies on friday nights?", "do i watch movies on fridays at night?"],
        }
    }
];
const class2Exercise2Data = [
    {
        spanish: "tu duermes en la tarde",
        answers: {
            affirmative: ["you sleep in the afternoon"],
            negative: ["you do not sleep in the afternoon", "you don't sleep in the afternoon"],
            interrogative: ["do you sleep in the afternoon?"],
        }
    }
];
const class2Exercise3Data = [
    {
        spanish: "Tu haces la tarea",
        answers: {
            affirmative: ["you do the homework", "you do your homework"],
            negative: ["you do not do the homework", "you don't do the homework", "you do not do your homework", "you don't do your homework"],
            interrogative: ["do you do the homework?", "do you do your homework?"],
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
    const progressStorageKey = `progress_a1_eng_u1_c1_v81_stable`;
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
        { key: 'tobe', name: 'Grammar: To Be', icon: GraduationCap, status: 'locked' },
        { key: 'memory-tobe', name: 'Memory: To Be', icon: BrainCircuit, status: 'locked' },
        { key: 'tobe-1', name: 'To be 1', icon: GraduationCap, status: 'locked' },
        { key: 'exercises1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'possessives', name: 'Grammar: Possessives', icon: GraduationCap, status: 'locked' },
        { key: 'memory-possessives', name: 'Memory: Possessives', icon: BrainCircuit, status: 'locked' },
        { key: 'tobe-2', name: 'To be 2', icon: GraduationCap, status: 'locked' },
        { key: 'exercises2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'tobe-3', name: 'To be 3', icon: GraduationCap, status: 'locked' },
        { key: 'exercises3', name: 'Exercise 3', icon: PenSquare, status: 'locked' },
        {
            key: 'mixto-1',
            name: 'Mixed Exercises 1',
            icon: PenSquare,
            status: 'locked',
            subItems: [
                { key: 'ex-mixto-1', name: 'Exercise 1', status: 'locked' },
                { key: 'ex-mixto-2', name: 'Exercise 2', status: 'locked' },
                { key: 'ex-mixto-3', name: 'Exercise 3', status: 'locked' },
            ]
        },
        {
            key: 'mixto-final',
            name: 'Final Challenges',
            icon: PenSquare,
            status: 'locked',
            subItems: [
                { key: 'ex-mixto-4', name: 'Exercise 4', status: 'locked' },
                { key: 'ex-mixto-5', name: 'Exercise 5', status: 'locked' },
                { key: 'ex-mixto-6', name: 'Exercise 6', status: 'locked' },
            ]
        }
    ], [t]);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

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

        // --- Sequential Locking Repair ---
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
        const firstA = path.find(p => p.status === 'active') || path.flatMap(p => p.subItems || []).find(sp => sp?.status === 'active');
        setSelectedTopic(savedSelectedTopic || firstA?.key || path[0].key);

        const newAnswers: {[key: string]: string[]} = {};
        const newValidation: {[key: string]: ('correct' | 'incorrect' | 'unchecked')[]} = {};
        for (const category in class1VocabularyData) {
            newAnswers[category] = Array((class1VocabularyData as any)[category].length).fill('');
            newValidation[category] = Array((class1VocabularyData as any)[category].length).fill('unchecked');
        }
        setUserAnswers(newAnswers);
        setValidationStatus(newValidation);

        setInitialLoadComplete(true);
        setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete, t]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        let total = 0; let done = 0;
        learningPath.forEach(t => {
            if(t.subItems) { total += t.subItems.length; done += t.subItems.filter(st => st.status === 'completed').length; }
            else { total++; if (t.status === 'completed') done++; }
        });
        return total > 0 ? (done / total) * 100 : 0;
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;

        const data: Record<string, any> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => {
            data[item.key] = item.status;
            if (item.subItems) {
                if (!data.subItems) data.subItems = {};
                data.subItems[item.key] = {};
                item.subItems.forEach(sub => { data.subItems[item.key][sub.key] = sub.status; });
            }
        });

        const savedData = studentProfile?.lessonProgress?.[progressStorageKey];
        if (JSON.stringify(data) !== JSON.stringify(savedData)) {
            updateDocumentNonBlocking(studentDocRef, {
                [`lessonProgress.${progressStorageKey}`]: data,
                [`progress.${mainProgressKey}`]: Math.round(progressValue)
            });
            window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, isInitialLoading, studentProfile]);

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

        const autoViewTopics = ['tobe', 'possessives', 'tobe-1', 'tobe-2', 'tobe-3'];
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

        for (const category in class1VocabularyData) {
            const items = (class1VocabularyData as any)[category];
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
        if (isInitialLoading) return <div className="flex justify-center items-center min-h-[400px] border-2 border-brand-purple rounded-xl"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left text-foreground">
                        <CardHeader>
                            <CardTitle>{t('a1class1.vocabulary')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="multiple" className="w-full">
                            {Object.entries(class1VocabularyData).map(([category, items]) => (
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
                            <Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'tobe':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left text-foreground">
                        <CardHeader><CardTitle>Grammar: To Be</CardTitle></CardHeader>
                        <CardContent>
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
                        </CardContent>
                    </Card>
                );
            case 'memory-tobe': return <ToBeMemoryGame onGameComplete={() => handleTopicComplete('memory-tobe')} />;
            case 'tobe-1':
                return (
                    <div className="space-y-6 text-left">
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
                            <CardHeader>
                                <CardTitle className="text-2xl font-black text-primary uppercase tracking-tight">To be 1</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-6 bg-slate-100 text-slate-900 rounded-[2rem] border border-border/50">
                                    <h3 className="text-xl font-bold text-primary mb-4">Estructura Verbo To be 1</h3>
                                    <div className="space-y-3 font-mono text-base">
                                        <p><span className="text-green-500 font-bold text-lg mr-2">(+)</span> pronoun + to be + complement</p>
                                        <p><span className="text-red-500 font-bold text-lg mr-2">(-)</span> pronoun + to be + not + complement</p>
                                        <p><span className="text-blue-500 font-bold text-lg mr-2">(?)</span> to be + pronoun + complement ?</p>
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-100 text-slate-900 rounded-[2rem] border border-border/50">
                                    <h3 className="text-xl font-bold text-primary mb-4">Ejemplo: "ellos son estudiantes"</h3>
                                    <div className="space-y-3 font-mono text-lg">
                                        <p><span className="text-green-500 font-bold mr-2">(+)</span> They are students</p>
                                        <p><span className="text-red-500 font-bold mr-2">(-)</span> They are not students</p>
                                        <p><span className="text-blue-500 font-bold mr-2">(?)</span> are they students?</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );
            case 'exercises1': return <TranslationExercise exerciseKey="exercises1" onComplete={() => handleTopicComplete('exercises1')} vocabulary={{'un- una': 'a / an', 'abogado': 'lawyer', 'enfermo': 'sick', 'enfermero': 'nurse'}} highlightVocabulary={true} title="Exercise 1" />;
            case 'possessives':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left text-foreground">
                        <CardHeader><CardTitle>Grammar: Possessives</CardTitle></CardHeader>
                        <CardContent>
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
                        </CardContent>
                    </Card>
                );
            case 'memory-possessives': return <PossessivesMemoryGame onGameComplete={() => handleTopicComplete('memory-possessives')} />;
            case 'tobe-2':
                return (
                    <div className="space-y-6 text-left">
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
                            <CardHeader>
                                <CardTitle className="text-2xl font-black text-primary uppercase tracking-tight">To be 2</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-6 bg-slate-100 text-slate-900 rounded-[2rem] border border-border/50">
                                    <h3 className="text-xl font-bold text-primary mb-4">Estructura Verbo To be 2</h3>
                                    <div className="space-y-3 font-mono text-base">
                                        <p><span className="text-green-500 font-bold text-lg mr-2">(+)</span> pronoun + To be + possessive + noun + complement</p>
                                        <p><span className="text-red-500 font-bold text-lg mr-2">(-)</span> pronoun + To be + Not + possessive + noun + complement</p>
                                        <p><span className="text-blue-500 font-bold text-lg mr-2">(?)</span> To be + pronoun + possessive + noun + complement ?</p>
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-100 text-slate-900 rounded-[2rem] border border-border/50">
                                    <h3 className="text-xl font-bold text-primary mb-4">Ejemplo: "Ellos son mis amigos"</h3>
                                    <div className="space-y-3 font-mono text-lg">
                                        <p><span className="text-green-500 font-bold mr-2">(+)</span> They are my friends</p>
                                        <p><span className="text-red-500 font-bold mr-2">(-)</span> They are not my friends</p>
                                        <p><span className="text-blue-500 font-bold mr-2">(?)</span> are they my friends ?</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );
            case 'exercises2': return <TranslationExercise exerciseKey="exercises2" onComplete={() => handleTopicComplete('exercises2')} vocabulary={{'amigo': 'friend', 'hijo': 'son', 'perro': 'dog'}} highlightVocabulary={true} title="Exercise 2" />;
            case 'tobe-3':
                return (
                    <div className="space-y-6 text-left">
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
                            <CardHeader>
                                <CardTitle className="text-2xl font-black text-primary uppercase tracking-tight">To be 3</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-6 bg-slate-100 text-slate-900 rounded-[2rem] border border-border/50">
                                    <h3 className="text-xl font-bold text-primary mb-4">Estructura Verbo To be 3</h3>
                                    <div className="space-y-3 font-mono text-base">
                                        <p><span className="text-green-500 font-bold text-lg mr-2">(+)</span> possessive + noun + to be + complement</p>
                                        <p><span className="text-red-500 font-bold text-lg mr-2">(-)</span> possessive + noun + to be + Not + complement</p>
                                        <p><span className="text-blue-500 font-bold text-lg mr-2">(?)</span> To be + possessive + noun + complement ?</p>
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-100 text-slate-900 rounded-[2rem] border border-border/50">
                                    <h3 className="text-xl font-bold text-primary mb-4">Ejemplo: "Mi mamá es una enfermera"</h3>
                                    <div className="space-y-3 font-mono text-lg">
                                        <p><span className="text-green-500 font-bold mr-2">(+)</span> My mother is a nurse</p>
                                        <p><span className="text-red-500 font-bold mr-2">(-)</span> My mother is not a nurse</p>
                                        <p><span className="text-blue-500 font-bold mr-2">(?)</span> is my mother a nurse?</p>
                                        <Separator className="my-2 bg-border/50" />
                                        <p><span className="text-green-500 font-bold mr-2">(+A)</span> yes, she is</p>
                                        <p><span className="text-red-500 font-bold mr-2">(-A)</span> no, she is not</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );
            case 'exercises3': return <TranslationExercise exerciseKey="exercises3" onComplete={() => handleTopicComplete('exercises3')} vocabulary={{'enfermera': 'nurse', 'abuelos': 'grandparents', 'pensionado': 'retired', 'juguete': 'toy'}} highlightVocabulary={true} title="Exercise 3" />;
            case 'ex-mixto-1': return <SimpleTranslationExercise course="a1" exerciseKey="mixed1" onComplete={() => handleTopicComplete('ex-mixto-1')} title="Exercise 1" vocabulary={{'estudiante': 'student', 'amigos': 'friends', 'padres': 'parents', 'hermana': 'sister', 'abogados': 'lawyers', 'de': 'from'}} highlightVocabulary={true} />;
            case 'ex-mixto-2': return <TranslationExercise exerciseKey="qna2" formType="qna" onComplete={() => handleTopicComplete('ex-mixto-2')} title="Exercise 2" vocabulary={{'cansado': 'tired', 'amiga': 'friend', 'estudiantes': 'students', 'feliz': 'happy', 'curiosos': 'curious', 'novia': 'girlfriend', 'ocupada': 'busy', 'libres': 'free', 'hambriento': 'hungry', 'compañeros de trabajo': 'coworkers', 'a tiempo': 'on time'}} highlightVocabulary={true} />;
            case 'ex-mixto-3': return <SimpleTranslationExercise course="a1" exerciseKey="mixed3" onComplete={() => handleTopicComplete('ex-mixto-3')} title="Exercise 3" vocabulary={{'estudiantes': 'students', 'amigos': 'friends', 'mamá': 'mother/mom', 'padres': 'parents', 'viejos': 'old', 'prima': 'cousin', 'abuela': 'grandmother', 'hermanas': 'sisters', 'cansado': 'tired', 'aburridos': 'bored', 'profesores': 'teachers', 'enojados': 'angry', 'alta': 'tall', 'preocupados': 'worried'}} highlightVocabulary={true} />;
            case 'ex-mixto-4': return <SimpleTranslationExercise course="a1" exerciseKey="mixed4" onComplete={() => handleTopicComplete('ex-mixto-4')} title="Exercise 4" vocabulary={{'ingeniero': 'engineer', 'australiano': 'australian', 'universidad': 'university', 'silla': 'chair', 'hobbies': 'hobbies', 'interesado': 'interested', 'películas románticas': 'romantic movies', 'estadio': 'stadium', 'primos': 'cousins'}} highlightVocabulary={true} />;
            case 'ex-mixto-5': return <ShortAnswerExercise onComplete={() => handleTopicComplete('ex-mixto-5')} />;
            case 'ex-mixto-6': return <SimpleTranslationExercise course="a1" exerciseKey="mixed6" onComplete={() => handleTopicComplete('ex-mixto-6')} title="Exercise 6" vocabulary={{'profesora': 'teacher', 'hijos': 'sons', 'padrastro': 'stepfather', 'estante': 'shelf', 'escritorio': 'desk', 'iglesia': 'church', 'hermanos': 'brothers/siblings', 'supermercado': 'supermarket'}} highlightVocabulary={true} />;
            
            default: return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
        }
    };
    
    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-left">
                        <Link href="/ingles/a1/unit/1" className="hover:underline text-sm text-white/80">Volver a la Unidad 1</Link>
                        <h1 className="text-4xl font-bold text-white dark:text-primary [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase {classId} (A1)</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-3 md:order-2 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader><CardTitle>Ruta de Aprendizaje</CardTitle></CardHeader>
                                <CardContent>
                                    <nav>
                                        <ul className="space-y-1">
                                            {learningPath.map((item) => {
                                                const isLocked = item.status === 'locked' && !isAdmin;
                                                const isSelected = selectedTopic === item.key || item.subItems?.some(si => si.key === selectedTopic);
                                                const StatusIcon = ICONS_CONFIG[item.status] || BookOpen;
                                                return(
                                                    <li key={item.key}>
                                                    {!item.subItems ? (
                                                        <div onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-semibold')}>
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
                                                                    <li key={subItem.key} onClick={() => handleTopicSelect(subItem.key)} className={cn('flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isSubLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === subItem.key && 'bg-muted text-primary font-semibold')}>
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
                                    <div className="mt-6 pt-6 border-t">
                                        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2"><span>Progreso</span><span className="font-bold text-foreground">{Math.round(progressValue)}%</span></div>
                                        <Progress value={progressValue} className="h-2" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="md:col-span-9 md:order-1">{renderContent()}</div>
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