'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle, ChevronDown, HelpCircle } from 'lucide-react';
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


type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
  subItems?: { key: string; name: string; status: 'locked' | 'active' | 'completed', icon?: React.ElementType }[];
};

const ICONS = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const progressStorageVersion = 'progress_a1_eng_unit_1_class_4_v1';
const mainProgressKey = 'progress_a1_eng_unit_1_class_4';

// Vocabulary data from the image
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

    // State for vocabulary exercise
    const [userAnswers, setUserAnswers] = useState<{[key: string]: string[]}>({});
    const [validationStatus, setValidationStatus] = useState<{[key: string]: ('correct' | 'incorrect' | 'unchecked')[]}>({});

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
        { key: 'ejercicio-wh', name: 'Ejercicio Wh', icon: PenSquare, status: 'locked' },
        { key: 'vocabulario-wh', name: 'Vocabulario Wh', icon: BookOpen, status: 'locked' },
        { key: 'ejercicio-gs', name: 'Ejercicio G.S', icon: PenSquare, status: 'locked' },
        { key: 'ejercicio2-wh', name: 'Ejercicio2 Wh', icon: PenSquare, status: 'locked' },
        { key: 'ejercicio3-wh', name: 'Ejercicio3 Wh', icon: PenSquare, status: 'locked' },
    ], []);
    
    useEffect(() => {
        if (isProfileLoading || isUserLoading) return;
        const newPath = initialLearningPath.map(topic => ({
            ...topic,
            status: isAdmin ? 'completed' : topic.status,
            subItems: topic.subItems ? topic.subItems.map(sub => ({ ...sub, status: isAdmin ? 'completed' : sub.status })) : undefined,
        }));
        
        if (studentProfile?.lessonProgress?.[progressStorageVersion] && !isAdmin) {
            const savedStatuses = studentProfile.lessonProgress[progressStorageVersion];
            newPath.forEach(item => {
                if (savedStatuses[item.key]) item.status = savedStatuses[item.key];
                if (item.subItems && savedStatuses.subItems?.[item.key]) {
                    item.subItems.forEach(subItem => {
                        if (savedStatuses.subItems[item.key][subItem.key]) {
                            subItem.status = savedStatuses.subItems[item.key][subItem.key];
                        }
                    });
                }
            });
        }
        
        setLearningPath(newPath);

        const firstActive = newPath.find(p => p.status === 'active') || newPath.flatMap(p => p.subItems || []).find(sp => sp?.status === 'active');
        if (firstActive) {
            setSelectedTopic(firstActive.key);
        } else if (newPath.length > 0) {
            setSelectedTopic(newPath[0].key);
        }

        // Initialize vocabulary answers
        const newAnswers: {[key: string]: string[]} = {};
        const newValidation: {[key: string]: ('correct' | 'incorrect' | 'unchecked')[]} = {};
        for (const category in vocabularyData) {
            newAnswers[category] = Array((vocabularyData as any)[category].length).fill('');
            newValidation[category] = Array((vocabularyData as any)[category].length).fill('unchecked');
        }
        setUserAnswers(newAnswers);
        setValidationStatus(newValidation);

    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading]);
    
    const progress = useMemo(() => {
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
        if (isProfileLoading || isUserLoading) return;
        if (!isAdmin && studentDocRef && learningPath.length > 0) {
            const statusesToSave: Record<string, any> = {};
            learningPath.forEach(item => {
                statusesToSave[item.key] = item.status;
                if (item.subItems) {
                    if (!statusesToSave.subItems) statusesToSave.subItems = {};
                    statusesToSave.subItems[item.key] = {};
                    item.subItems.forEach(sub => { statusesToSave.subItems[item.key][sub.key] = sub.status; });
                }
            });
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: statusesToSave });
            updateDocumentNonBlocking(studentDocRef, { [`progress.${mainProgressKey}`]: Math.round(progress) });
        }
        if (progress >= 100) {
          window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
    }, [learningPath, isAdmin, progress, studentDocRef, isProfileLoading, isUserLoading]);

    useEffect(() => {
        if (!topicToComplete) return;
    
        setLearningPath(currentPath => {
            const newPath = currentPath.map(t => ({
                ...t,
                subItems: t.subItems ? t.subItems.map(s => ({ ...s })) : undefined,
            }));
          
            let nextSelectedTopic: string | null = null;
            let topicFound = false;
            let wasTopicUnlocked = false;

            for (let i = 0; i < newPath.length && !topicFound; i++) {
                const currentTopic = newPath[i];
          
                if (currentTopic.key === topicToComplete) {
                    if (currentTopic.status !== 'completed') { currentTopic.status = 'completed'; }
                    if (i + 1 < newPath.length && newPath[i + 1].status === 'locked') {
                        const next = newPath[i + 1];
                        next.status = 'active';
                        if (next.subItems?.[0]) { next.subItems[0].status = 'active'; nextSelectedTopic = next.subItems[0].key; } 
                        else { nextSelectedTopic = next.key; }
                        wasTopicUnlocked = true;
                    }
                    topicFound = true;
                } else if (currentTopic.subItems) {
                    const subIndex = currentTopic.subItems.findIndex(s => s.key === topicToComplete);
                    if (subIndex !== -1) {
                        if (currentTopic.subItems[subIndex].status !== 'completed') { currentTopic.subItems[subIndex].status = 'completed'; }
                        const nextSubIndex = subIndex + 1;
                        if (nextSubIndex < currentTopic.subItems.length && currentTopic.subItems[nextSubIndex].status === 'locked') {
                            currentTopic.subItems[nextSubIndex].status = 'active';
                            nextSelectedTopic = currentTopic.subItems[nextSubIndex].key;
                            wasTopicUnlocked = true;
                        } else if (currentTopic.subItems.every(s => s.status === 'completed')) {
                            if (currentTopic.status !== 'completed') { currentTopic.status = 'completed'; }
                            if (i + 1 < newPath.length && newPath[i + 1].status === 'locked') {
                                const next = newPath[i + 1];
                                next.status = 'active';
                                if (next.subItems?.[0]) { next.subItems[0].status = 'active'; nextSelectedTopic = next.subItems[0].key; } 
                                else { nextSelectedTopic = next.key; }
                                wasTopicUnlocked = true;
                            }
                        }
                        topicFound = true;
                    }
                }
            }
        
            if (nextSelectedTopic) { setSelectedTopic(nextSelectedTopic); }
            if(wasTopicUnlocked) { toast({ title: "¡Siguiente tema desbloqueado!" }); }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicComplete = (completedKey: string) => {
        setTopicToComplete(completedKey);
    };

    const handleTopicSelect = (topicKey: string) => {
        const mainTopic = learningPath.find(t => t.key === topicKey || t.subItems?.some(st => st.key === topicKey));
        const subTopic = mainTopic?.subItems?.find(st => st.key === topicKey);
        
        if (!isAdmin && ((subTopic && subTopic.status === 'locked') || (!subTopic && mainTopic?.status === 'locked'))) {
            toast({ variant: "destructive", title: "Contenido Bloqueado" });
            return;
        }
        setSelectedTopic(topicKey);

        const exerciseKeys = ['vocabulary', 'genitivo', 'who', 'what1', 'what2', 'what-kind-of', 'how', 'how-adjective', 'how-often', 'whose', 'where', 'which', 'when', 'why', 'ejercicio-wh', 'ejercicio-gs', 'ejercicio2-wh', 'ejercicio3-wh'];
        if (!exerciseKeys.includes(topicKey)) {
            handleTopicComplete(topicKey);
        }
    };

    const handleInputChange = (category: string, index: number, value: string) => {
        setUserAnswers(prevAnswers => {
            const newCategoryAnswers = [...(prevAnswers[category] || [])];
            newCategoryAnswers[index] = value;
            const newAnswers = { ...prevAnswers, [category]: newCategoryAnswers };
            return newAnswers;
        });
    
        setValidationStatus(prevStatus => {
            if (prevStatus[category]?.[index] !== 'unchecked') {
                const newCategoryStatus = [...(prevStatus[category] || [])];
                newCategoryStatus[index] = 'unchecked';
                const newValidation = { ...prevStatus, [category]: newCategoryStatus };
                return newValidation;
            }
            return prevStatus;
        });
    };

    const handleCheckAnswers = () => {
        let atLeastOneCorrect = false;
        const newValidationStatus: {[key: string]: ('correct' | 'incorrect' | 'unchecked')[]} = {};
    
        Object.entries(vocabularyData).forEach(([category, items]) => {
            newValidationStatus[category] = items.map((item, index) => {
                const userAnswer = (userAnswers[category]?.[index] || '').trim().toLowerCase();
                const correctAnswer = item.english.toLowerCase();
                const isCorrect = userAnswer === correctAnswer;
                if (isCorrect) {
                    atLeastOneCorrect = true;
                }
                return isCorrect ? 'correct' : 'incorrect';
            });
        });

        setValidationStatus(newValidationStatus);
        
        if (atLeastOneCorrect) {
            handleTopicComplete('vocabulary');
            toast({ title: '¡Bien hecho!', description: 'Has acertado al menos una. ¡Tema desbloqueado!' });
        } else {
            toast({ 
                variant: 'destructive', 
                title: 'Sigue intentando', 
                description: 'Revisa tus respuestas. ¡Necesitas al menos una correcta para continuar!' 
            });
        }
    };
    
    const getInputClass = (category: string, index: number) => {
        const status = validationStatus[category]?.[index];
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive';
        return '';
    };
    
    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic) || learningPath.flatMap(t => t.subItems || []).find(st => st?.key === selectedTopic);

        if (selectedTopic === 'vocabulary') {
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
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
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-base">
                                            <div className="font-bold p-3 bg-muted rounded-lg">Español</div>
                                            <div className="font-bold p-3 bg-muted rounded-lg">Inglés</div>
                                            {(items as {spanish: string, english: string}[]).map((word, index) => (
                                                <React.Fragment key={`${category}-${index}`}>
                                                    <div className="p-3 bg-card border rounded-lg flex items-center">{word.spanish}</div>
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
                    <CardFooter>
                        <Button onClick={handleCheckAnswers}>Verificar</Button>
                    </CardFooter>
                </Card>
            );
        }

        if (selectedTopic === 'grammar') {
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>Genitivo Sajón ('s)</CardTitle>
                        <CardDescription>Se utiliza para indicar posesión (quién es el dueño de algo).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Accordion type="multiple" defaultValue={['rule-1']} className="w-full">
                            <AccordionItem value="rule-1">
                                <AccordionTrigger className="text-lg font-semibold">Regla General (Poseedor Singular)</AccordionTrigger>
                                <AccordionContent className="text-base space-y-2">
                                    <p>Se añade un apóstrofo y una "s" ('s) al final del nombre del poseedor.</p>
                                    <p className="font-semibold">Estructura: POSEEDOR + 'S + POSESIÓN</p>
                                    <div className="p-3 bg-muted rounded-lg font-mono">
                                        <p>el carro de mi papá → my dad<span className="font-bold text-primary">'s</span> car</p>
                                        <p>la casa de Maria → Maria<span className="font-bold text-primary">'s</span> house</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="rule-2">
                                <AccordionTrigger className="text-lg font-semibold">Poseedores Plurales terminados en "s"</AccordionTrigger>
                                <AccordionContent className="text-base space-y-2">
                                    <p>Solo se añade un apóstrofo (') al final del nombre.</p>
                                    <p className="font-semibold">Estructura: POSEEDOR + ' + POSESIÓN</p>
                                    <div className="p-3 bg-muted rounded-lg font-mono">
                                        <p>la casa de mis padres → my parents<span className="font-bold text-primary">'</span> house</p>
                                        <p>el colegio de las niñas → the girls<span className="font-bold text-primary">'</span> school</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="rule-3">
                                <AccordionTrigger className="text-lg font-semibold">Poseedores Plurales que NO terminan en "s"</AccordionTrigger>
                                <AccordionContent className="text-base space-y-2">
                                    <p>Se aplica la regla general: se añade apóstrofo y "s" ('s).</p>
                                     <div className="p-3 bg-muted rounded-lg font-mono">
                                        <p>los juguetes de los niños → the children<span className="font-bold text-primary">'s</span> toys</p>
                                        <p>la ropa de los hombres → the men<span className="font-bold text-primary">'s</span> clothes</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                        <div className="mt-6 p-4 bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-300 rounded-r-lg">
                            <p className="font-bold">¡OJO!</p>
                            <p className="mt-2">No se usa el genitivo sajón cuando el poseedor es un objeto. En su lugar, se usa la estructura "the... of the...".</p>
                            <p className="font-mono bg-background p-2 rounded mt-1">la puerta del carro → the door <span className="font-bold text-primary">of the</span> car</p>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        if (selectedTopic === 'genitivo') {
            return <GenitiveCaseExercise onComplete={() => handleTopicComplete('genitivo')} />;
        }

        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple min-h-[500px]">
              <CardHeader>
                <CardTitle>{topic?.name || 'Cargando...'}</CardTitle>
                <CardDescription>Contenido para este tema estará disponible pronto.</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
        );
    };

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <Link href="/ingles/a1/unit/1" className="hover:underline text-sm text-muted-foreground">Volver a la unidad 1</Link>
                        <h1 className="text-4xl font-bold dark:text-primary">Clase 4</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9">{renderContent()}</div>
                        <div className="md:col-span-3">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple">
                                <CardHeader><CardTitle>Ruta de Aprendizaje</CardTitle></CardHeader>
                                <CardContent>
                                    <nav>
                                        <ul className="space-y-1">
                                            {learningPath.map((item) => (
                                                <li key={item.key}>
                                                    {!item.subItems ? (
                                                        <div onClick={() => handleTopicSelect(item.key)}
                                                            className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors', item.status === 'locked' && !isAdmin ? 'cursor-not-allowed text-muted-foreground/50' : 'cursor-pointer hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-semibold')}>
                                                            <div className="flex items-center gap-3">
                                                                <item.icon className={cn("h-5 w-5", item.status === 'completed' ? 'text-green-500' : '')} />
                                                                <span>{item.name}</span>
                                                            </div>
                                                            {item.status === 'locked' && !isAdmin && <Lock className="h-4 w-4 text-yellow-500" />}
                                                        </div>
                                                    ) : (
                                                        <Collapsible defaultOpen={item.subItems.some(si => si.status !== 'locked')} disabled={item.status === 'locked' && !isAdmin}>
                                                            <CollapsibleTrigger className="w-full">
                                                                <div className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors w-full', item.status === 'locked' && !isAdmin ? 'cursor-not-allowed text-muted-foreground/50' : 'cursor-pointer hover:bg-muted', item.subItems.some(si => si.key === selectedTopic) && 'bg-muted text-primary font-semibold')}>
                                                                    <div className="flex items-center gap-3">
                                                                        <item.icon className={cn("h-5 w-5", item.status === 'completed' ? 'text-green-500' : '')} />
                                                                        <span>{item.name}</span>
                                                                    </div>
                                                                    {item.status === 'locked' && !isAdmin ? <Lock className="h-4 w-4 text-yellow-500" /> : <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />}
                                                                </div>
                                                            </CollapsibleTrigger>
                                                            <CollapsibleContent>
                                                                <ul className="pl-8 pt-1 space-y-1">
                                                                    {item.subItems.map((subItem) => (
                                                                        <li key={subItem.key} onClick={() => handleTopicSelect(subItem.key)}
                                                                            className={cn('flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors', subItem.status === 'locked' && !isAdmin ? 'cursor-not-allowed text-muted-foreground/50' : 'cursor-pointer hover:bg-muted', selectedTopic === subItem.key && 'bg-muted text-primary font-semibold')}>
                                                                            <div className='flex items-center gap-3'>
                                                                                <subItem.icon className={cn("h-5 w-5", subItem.status === 'completed' ? 'text-green-500' : '')} />
                                                                                <span>{subItem.name}</span>
                                                                            </div>
                                                                            {subItem.status === 'locked' && !isAdmin && <Lock className="h-4 w-4 text-yellow-500" />}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </CollapsibleContent>
                                                        </Collapsible>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </nav>
                                    <div className="mt-6 pt-6 border-t">
                                        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2"><span>Progreso</span><span className="font-bold text-foreground">{Math.round(progress)}%</span></div>
                                        <Progress value={progress} className="h-2" />
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
