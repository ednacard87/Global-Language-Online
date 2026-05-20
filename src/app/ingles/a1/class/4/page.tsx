'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle, ChevronDown, HelpCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GenitiveCaseExercise } from '@/components/kids/exercises/genitive-case-exercise';
import { WhQuestionExercise } from '@/components/kids/exercises/wh-question-exercise';
import { WhQuestionsMainExercise } from '@/components/kids/exercises/wh-questions-main-exercise';
import { FillInTheBlanksExercise } from '@/components/kids/exercises/fill-in-the-blanks';
import { GenitiveSaxonGsExercise } from '@/components/kids/exercises/genitive-saxon-gs-exercise';
import { WhFillInTheBlanksExercise } from '@/components/kids/exercises/wh-fill-in-the-blanks-exercise';
import { WhQuestionsMainExercise3 } from '@/components/kids/exercises/wh-questions-main-exercise-3';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
  subItems?: { key: string; name: string; status: 'locked' | 'active' | 'completed', icon?: React.ElementType }[];
};

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const progressStorageVersion = 'progress_a1_eng_unit_1_class_4_v5_stable';
const mainProgressKey = 'progress_a1_eng_unit_1_class_4';

const vocabularyData = {
    basicAdjectives: [
        { spanish: 'ALTO', english: 'TALL' },
        { spanish: 'BAJO', english: 'SHORT' },
        { spanish: 'GRANDE', english: 'BIG' },
        { spanish: 'PEQUEÑO', english: 'SMALL' },
        { spanish: 'JOVEN', english: 'YOUNG' },
        { spanish: 'VIEJO', english: 'OLD' },
        { spanish: 'CARO', english: 'EXPENSIVE' },
        { spanish: 'BARATO', english: 'CHEAP' },
        { spanish: 'INTERESANTE', english: 'INTERESTING' },
        { spanish: 'FEO/A', english: 'UGLY' },
    ],
    basicWords: [
        { spanish: 'ANTES', english: 'BEFORE' },
        { spanish: 'DESPUÉS', english: 'AFTER' },
        { spanish: 'TEMPRANO', english: 'EARLY' },
        { spanish: 'TARDE', english: 'LATE' },
        { spanish: 'HASTA', english: 'UNTIL' },
        { spanish: 'DESDE', english: 'FROM' },
        { spanish: 'ACERCA DE', english: 'ABOUT' },
        { spanish: 'PRONTO', english: 'SOON' },
    ]
};

const whVocabularyExerciseData = [
    { spanish: 'ALTO', english: 'TALL', gapped: 'TA_L' },
    { spanish: 'BAJO', english: 'SHORT', gapped: 'S_ORT' },
    { spanish: 'GRANDE', english: 'BIG', gapped: 'B_G' },
    { spanish: 'PEQUEÑO', english: 'SMALL', gapped: 'SMA_L' },
    { spanish: 'JOVEN', english: 'YOUNG', gapped: 'Y_UNG' },
    { spanish: 'VIEJO', english: 'OLD', gapped: 'O_D' },
    { spanish: 'CARO', english: 'EXPENSIVE', gapped: 'EXP_NSIVE' },
    { spanish: 'BARATO', english: 'CHEAP', gapped: 'CH_AP' },
    { spanish: 'INTERESANTE', english: 'INTERESTING', gapped: 'INT_RESTING' },
    { spanish: 'FEO/A', english: 'UGLY', gapped: 'UG_Y' },
    { spanish: 'ANTES', english: 'BEFORE', gapped: 'BE_ORE' },
    { spanish: 'DESPUÉS', english: 'AFTER', gapped: 'A_TER' },
    { spanish: 'TEMPRANO', english: 'EARLY', gapped: 'EAR_Y' },
    { spanish: 'TARDE', english: 'LATE', gapped: 'LA_E' },
    { spanish: 'HASTA', english: 'UNTIL', gapped: 'UN_IL' },
    { spanish: 'DESDE', english: 'FROM', gapped: 'F_OM' },
    { spanish: 'ACERCA DE', english: 'ABOUT', gapped: 'ABO_T' },
    { spanish: 'PRONTO', english: 'SOON', gapped: 'S_ON' },
];

export default function EngA1Class4Page() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const studentDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'students', user.uid) : null),
        [firestore, user]
    );
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);

    const isAdmin = useMemo(() => {
        if (!user) return false;
        return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
    }, [user, studentProfile]);
    
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // State for vocabulary exercise
    const [userAnswers, setUserAnswers] = useState<{[key: string]: string[]}>({});
    const [validationStatus, setValidationStatus] = useState<{[key: string]: ('correct' | 'incorrect' | 'unchecked')[]}>({});
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: 'Grammar', icon: GraduationCap, status: 'locked' },
        { key: 'genitivo', name: 'Ejercicio: Genitivo Sajon', icon: PenSquare, status: 'locked' },
        { key: 'wh-questions', name: 'WH QUESTIONS', icon: HelpCircle, status: 'locked' },
        {
            key: 'practice',
            name: 'Practica',
            icon: PenSquare,
            status: 'locked',
            subItems: [
                { key: 'who', name: 'Who', icon: PenSquare, status: 'locked' },
                { key: 'what1', name: 'What1', icon: PenSquare, status: 'locked' },
                { key: 'what2', name: 'What2', icon: PenSquare, status: 'locked' },
                { key: 'what-kind-of', name: 'What kind of', icon: PenSquare, status: 'locked' },
                { key: 'how', name: 'How', icon: PenSquare, status: 'locked' },
                { key: 'how-adjective', name: 'How + Adjective', icon: PenSquare, status: 'locked' },
                { key: 'how-often', name: 'How + Often', icon: PenSquare, status: 'locked' },
                { key: 'whose', name: 'Whose', icon: PenSquare, status: 'locked' },
                { key: 'where', name: 'Where', icon: PenSquare, status: 'locked' },
                { key: 'which', name: 'Which', icon: PenSquare, status: 'locked' },
                { key: 'when', name: 'When', icon: PenSquare, status: 'locked' },
                { key: 'why', name: 'Why', icon: PenSquare, status: 'locked' },
            ],
        },
        { key: 'ejercicio-wh', name: 'Ejercicios Wh Questions', icon: PenSquare, status: 'locked' },
        { key: 'vocabulario-wh', name: 'Vocabulario Wh', icon: BookOpen, status: 'locked' },
        { key: 'ejercicio-gs', name: 'Ejercicio G.S', icon: PenSquare, status: 'locked' },
        { key: 'ejercicio2-wh', name: 'Ejercicio2 Wh', icon: PenSquare, status: 'locked' },
        { key: 'ejercicio3-wh', name: 'Ejercicio3 Wh', icon: PenSquare, status: 'locked' },
    ], []);
    
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
        for (const category in vocabularyData) {
            newAnswers[category] = Array((vocabularyData as any)[category].length).fill('');
            newValidation[category] = Array((vocabularyData as any)[category].length).fill('unchecked');
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
                setTimeout(() => toast({ title: "¡Siguiente tema desbloqueado!" }), 0);
            }
            if (nextToSelect) {
                const finalNext = nextToSelect;
                setTimeout(() => setSelectedTopic(finalNext), 0);
            }
            
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast, isAdmin]);

    const handleTopicComplete = (completedKey: string) => {
        setTopicToComplete(completedKey);
    };

    const handleTopicSelect = (topicKey: string) => {
        const mainTopic = learningPath.find(t => t.key === topicKey || t.subItems?.some(st => st.key === topicKey));
        const subTopic = mainTopic?.subItems?.find(st => st.key === topicKey);
        const isLocked = !isAdmin && ((subTopic && subTopic.status === 'locked') || (!subTopic && mainTopic?.status === 'locked'));

        if (isLocked) {
            toast({ variant: "destructive", title: "Contenido Bloqueado" });
            return;
        }
        
        setSelectedTopic(topicKey);

        const autoViewTopics = ['grammar', 'wh-questions'];
        if (autoViewTopics.includes(topicKey)) {
            handleTopicComplete(topicKey);
        }
    };

    const handleInputChange = (category: string, index: number, value: string) => {
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

    const handleCheckAnswers = () => {
        let atLeastOneCorrect = false;
        const newValidationStatus: {[key: string]: ('correct' | 'incorrect' | 'unchecked')[]} = {};
    
        Object.entries(vocabularyData).forEach(([category, items]) => {
            newValidationStatus[category] = items.map((item, index) => {
                const userAnswer = (userAnswers[category]?.[index] || '').trim().toLowerCase();
                const correctAnswer = item.english.toLowerCase();
                const isCorrect = userAnswer === correctAnswer;
                if (isCorrect) atLeastOneCorrect = true;
                return isCorrect ? 'correct' : 'incorrect';
            });
        });

        setValidationStatus(newValidationStatus);
        if (atLeastOneCorrect) {
            toast({ title: '¡Bien hecho!', description: 'Has acertado al menos una. ¡Tema desbloqueado!' });
            setCanAdvanceVocab(true);
        } else {
            toast({ variant: 'destructive', title: 'Sigue intentando' });
            setCanAdvanceVocab(false);
        }
    };
    
    const getInputClass = (category: string, index: number) => {
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
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Vocabulario</CardTitle>
                            <CardDescription>Adjetivos y Palabras Básicas</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="multiple" defaultValue={['basicAdjectives', 'basicWords']} className="w-full">
                                {Object.entries(vocabularyData).map(([category, items]) => (
                                    <AccordionItem key={category} value={category}>
                                        <AccordionTrigger className="text-lg font-semibold">
                                            {category === 'basicAdjectives' ? 'Adjetivos Básicos' : 'Palabras Básicas'}
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                                <div className="font-bold p-3 bg-muted rounded-lg">Español</div>
                                                <div className="font-bold p-3 bg-muted rounded-lg">Inglés</div>
                                                {(items as {spanish: string, english: string}[]).map((word, index) => (
                                                    <React.Fragment key={`${category}-${index}`}>
                                                        <div className="p-3 bg-card border rounded-lg flex items-center font-medium">{word.spanish}</div>
                                                        <div className="p-3 bg-card border rounded-lg flex items-center">
                                                            <Input
                                                                value={userAnswers[category]?.[index] || ''}
                                                                onChange={(e) => handleInputChange(category, index, e.target.value)}
                                                                className={cn(getInputClass(category, index))}
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
                            <Button onClick={handleCheckAnswers}>Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar</Button>
                        </CardFooter>
                    </Card>
                );

            case 'grammar':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                        <CardHeader><CardTitle>Genitivo Sajón ('s)</CardTitle></CardHeader>
                        <CardContent className="space-y-6 text-lg">
                            <Accordion type="single" collapsible defaultValue="rule-1" className="w-full">
                                <AccordionItem value="rule-1">
                                    <AccordionTrigger className="text-lg font-semibold">Regla General (Poseedor Singular)</AccordionTrigger>
                                    <AccordionContent className="space-y-2">
                                        <p>Se añade un apóstrofo y una "s" ('s) al final del nombre del poseedor.</p>
                                        <p className="font-mono bg-muted p-2 rounded">POSEEDOR + 'S + POSESIÓN</p>
                                        <p className="italic text-muted-foreground">Ej: la casa de Maria &rarr; Maria's house</p>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="rule-2">
                                    <AccordionTrigger className="text-lg font-semibold">Poseedores Plurales en "s"</AccordionTrigger>
                                    <AccordionContent className="space-y-2">
                                        <p>Solo se añade un apóstrofo (') al final.</p>
                                        <p className="font-mono bg-muted p-2 rounded">POSEEDOR + ' + POSESIÓN</p>
                                        <p className="italic text-muted-foreground">Ej: la casa de mis padres &rarr; my parents' house</p>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                );

            case 'genitivo': return <GenitiveCaseExercise onComplete={() => handleTopicComplete('genitivo')} />;
            case 'wh-questions':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple p-6"><CardTitle>WH Questions</CardTitle><CardContent className="pt-4"><p>Estructuras para hacer preguntas informativas usando WHAT, WHERE, WHEN, WHY, WHO, HOW.</p></CardContent></Card>
                );
            case 'vocabulario-wh':
                return <FillInTheBlanksExercise data={whVocabularyExerciseData} onComplete={() => handleTopicComplete('vocabulario-wh')} title="Vocabulario Wh" />;
            case 'ejercicio-gs':
                return <GenitiveSaxonGsExercise onComplete={() => handleTopicComplete('ejercicio-gs')} />;
            case 'ejercicio2-wh':
                return <WhFillInTheBlanksExercise onComplete={() => handleTopicComplete('ejercicio2-wh')} />;
            case 'ejercicio3-wh':
                return <WhQuestionsMainExercise3 onComplete={() => handleTopicComplete('ejercicio3-wh')} />;
            case 'ejercicio-wh':
                return <WhQuestionsMainExercise onComplete={() => handleTopicComplete('ejercicio-wh')} />;

            default:
                const practiceTopics = ['who', 'what1', 'what2', 'what-kind-of', 'how', 'how-adjective', 'how-often', 'whose', 'where', 'which', 'when', 'why'];
                if (practiceTopics.includes(selectedTopic)) {
                    return <WhQuestionExercise exerciseName={topic?.name || ''} onComplete={() => handleTopicComplete(selectedTopic)} />;
                }
                return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-left text-white">
                        <Link href="/ingles/a1/unit/1" className="hover:underline text-sm">Volver a la unidad 1</Link>
                        <h1 className="text-4xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase 4 (A1)</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9">{renderContent()}</div>
                        <div className="md:col-span-3 text-left">
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
}
