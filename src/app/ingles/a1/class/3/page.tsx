'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle, ChevronDown, Loader2, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { PresentSimpleExercise, type ExercisePrompt } from '@/components/kids/exercises/present-simple';
import { QAShortAnswerExercise, type QAShortAnswerPrompt } from '@/components/kids/exercises/q-a-short-answer-exercise';
import { ShortAnswerPresentSimpleExercise, type ShortAnswerPresentSimplePrompt } from '@/components/kids/exercises/short-answer-present-simple';
import { LargeTextTranslationExercise, type DialogueLine } from '@/components/kids/exercises/large-text-translation-exercise';

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

const progressStorageVersion = 'progress_a1_eng_u1_c3_v67_stable';
const mainProgressKey = 'progress_a1_eng_unit_1_class_3';

const class3MixedExercise1Data: ExercisePrompt[] = [
    {
        spanish: "EL BEBE VINO TINTO",
        answers: {
            affirmative: ["he drinks red wine"],
            negative: ["he does not drink red wine", "he doesn't drink red wine"],
            interrogative: ["does he drink red wine?"],
        }
    },
    {
        spanish: "ELLA JUEGA TENIS CON SU HERMANO",
        answers: {
            affirmative: ["she plays tennis with her brother"],
            negative: ["she does not play tennis with her brother", "she doesn't play tennis with her brother"],
            interrogative: ["does she play tennis with her brother?"],
        }
    },
    {
        spanish: "YO MONTO BICICLETA EL DOMINGO",
        answers: {
            affirmative: ["i ride a bike on sunday", "i ride a bicycle on sunday"],
            negative: ["i do not ride a bike on sunday", "i don't ride a bike on sunday"],
            interrogative: ["do i ride a bike on sunday?"],
        }
    },
];

const class3QAShortAnswerExerciseData: QAShortAnswerPrompt[] = [
    { spanish: '¿TU HABLAS INGLES?', answers: { interrogative: ["do you speak english?"], shortAffirmative: ["yes, i do"], shortNegative: ["no, i do not", "no, i don't"] } },
    { spanish: '¿ELLA COME HAMBURGUESA?', answers: { interrogative: ["does she eat hamburger?", "does she eat hamburgers?"], shortAffirmative: ["yes, she does"], shortNegative: ["no, she does not", "no, she doesn't"] } },
];

const class3ShortAnswerEx3Data: ShortAnswerPresentSimplePrompt[] = [
    { question: "DO THEY LIKE CHOCOLATE?", answers: { shortAffirmative: ["yes, they do"], shortNegative: ["no, they do not", "no, they don't"] } },
    { question: "DOES SHE SPEAK ITALIAN?", answers: { shortAffirmative: ["yes, she does"], shortNegative: ["no, she does not", "no, she doesn't"] } },
];

const class3LargeTextEx4Dialogue: DialogueLine[] = [
    { speaker: "MARY", line: "¿TE VISITA EN MADRID?", answer: ["does she visit you in Madrid?"] },
    { speaker: "JON", line: "ELLA NO VIENE A MADRID MUY A MENUDO. YO LA VISITO EN BARCELONA.", answer: ["she doesn't come to Madrid very often. i visit her in Barcelona.", "she does not come to Madrid very often. i visit her in Barcelona."] },
    { speaker: "MARY", line: "¿Y LE GUSTA?", answer: ["and does she like it?", "and does she like?"] },
    { speaker: "JON", line: "SÍ, LE ENCANTA BARCELONA. ELLA TRABAJA EN UN BANCO POR LAS MAÑANAS. POR LAS TARDES, ELLA JUEGA AL TENIS CON SU NOVIO O ELLA MIRA LA TV EN CASA. POR LAS NOCHES, ELLA VA A LA PLAYA O ELLA HACE SU TAREA DE INGLÉS. ESTUDIA INGLÉS LOS SÁBADOS.", answer: ["yes, she loves barcelona. she works in a bank in the mornings. in the afternoons, she plays tennis with her boyfriend or she watches tv at home. in the evenings, she goes to the beach or she does her english homework. she studies english on saturdays."] },
    { speaker: "MARY", line: "¿VIVES EN BARCELONA?", answer: ["do you live in Barcelona?"] },
    { speaker: "JON", line: "NO, NO VIVO EN BARCELONA. VIVO EN MADRID, PERO MI HERMANA VIVE ALLÍ.", answer: ["no, i don't live in barcelona. i live in madrid, but my sister lives there.", "no, i do not live in barcelona. i live in madrid, but my sister lives there."] },
];

const can1ExerciseData: ExercisePrompt[] = [
    {
        spanish: "Yo puedo nadar",
        answers: {
            affirmative: ["i can swim"],
            negative: ["i cannot swim", "i can't swim"],
            interrogative: ["can i swim?"],
            shortAffirmative: ["yes, i can"],
            shortNegative: ["no, i cannot", "no, i can't"],
        }
    },
];

export default function EngA1Class3Page() {
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

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'grammar2', name: 'Gramática 2', icon: GraduationCap, status: 'active' },
        { key: 'mixedExercises1', name: 'Ejercicios Mixtos 1', icon: PenSquare, status: 'locked' },
        { key: 'presentSimpleUses', name: 'Usos del Presente Simple', icon: BookOpen, status: 'locked' },
        {
            key: 'mixedExercises2',
            name: 'Ejercicios Mixtos 2',
            icon: PenSquare,
            status: 'locked',
            subItems: [
                { key: 'ex2_1', name: 'Ejercicio 1', icon: PenSquare, status: 'locked' },
                { key: 'ex2_2', name: 'Ejercicio 2', icon: PenSquare, status: 'locked' },
            ],
        },
        { key: 'vocabulary2', name: 'Vocabulario 2', icon: BookOpen, status: 'locked' },
        {
            key: 'mixedExercises3',
            name: 'Ejercicios Mixtos 3',
            icon: PenSquare,
            status: 'locked',
            subItems: [
                { key: 'ex3_3', name: 'Ejercicio 3', icon: PenSquare, status: 'locked' },
                { key: 'ex3_4', name: 'Ejercicio 4', icon: PenSquare, status: 'locked' },
            ],
        },
        { key: 'can', name: 'CAN', icon: GraduationCap, status: 'locked' },
        {
            key: 'canExercises',
            name: 'Ejercicios CAN',
            icon: PenSquare,
            status: 'locked',
            subItems: [
                { key: 'can1', name: 'Ejercicios con CAN', icon: PenSquare, status: 'locked' },
            ],
        },
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
        setInitialLoadComplete(true);
        setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete]);

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

        updateDocumentNonBlocking(studentDocRef, {
            [`lessonProgress.${progressStorageVersion}`]: statusesToSave,
            [`progress.${mainProgressKey}`]: Math.round(progressValue)
        });
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
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const mainTopic = learningPath.find(t => t.key === topicKey || t.subItems?.some(st => st.key === topicKey));
        const subTopic = mainTopic?.subItems?.find(st => st.key === topicKey);
        const isLocked = !isAdmin && ((subTopic && subTopic.status === 'locked') || (!subTopic && mainTopic?.status === 'locked'));

        if (isLocked) {
            toast({ variant: "destructive", title: "Contenido Bloqueado" });
            return;
        }
        
        setSelectedTopic(topicKey);

        const autoViewTopics = ['vocabulary2'];
        if (autoViewTopics.includes(topicKey)) {
            handleTopicComplete(topicKey);
        }
    };
    
    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center min-h-[400px]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

        switch (selectedTopic) {
            case 'grammar2':
                return (
                    <div className="space-y-6 text-left">
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
                            <CardHeader>
                                <CardTitle className="text-2xl font-black text-primary uppercase tracking-tight">Formación de la Tercera Persona Singular (he, she, it)</CardTitle>
                                <CardDescription className="font-bold text-foreground">Reglas para el Presente Simple Afirmativo</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-border/50">
                                    <h3 className="text-lg font-bold text-primary mb-3">Regla General</h3>
                                    <div className="space-y-3 font-mono text-base">
                                        <p>A la mayoría de los verbos en tercera persona del singular (he, she, it) se les agrega una <span className="font-bold text-primary">"s"</span> al final.</p>
                                        <div className="pt-2 space-y-1">
                                            <p className="font-bold text-lg">She works</p>
                                            <p className="font-bold text-lg">He eats</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-border/50">
                                    <h3 className="text-lg font-bold text-primary mb-3">Verbos terminados en -o, -sh, -ch, -ss, -x, -z</h3>
                                    <div className="space-y-3 font-mono text-base">
                                        <p>A los verbos que terminan en estas letras, se les agrega <span className="font-bold text-primary">"es"</span>.</p>
                                        <div className="pt-2 space-y-2">
                                            <p className="font-bold">I go &rarr; <span className="text-primary">He goes</span></p>
                                            <p className="font-bold">I wish &rarr; <span className="text-primary">She wishes</span></p>
                                            <p className="font-bold">I kiss &rarr; <span className="text-primary">He kisses</span></p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-border/50">
                                    <h3 className="text-lg font-bold text-primary mb-3">Verbos terminados en "y"</h3>
                                    <div className="space-y-6 font-mono text-base">
                                        <div className="space-y-2">
                                            <h4 className="font-bold text-foreground">Consonante + "y"</h4>
                                            <p className="text-sm">Se cambia la "y" por <span className="font-bold text-primary">"ies"</span>.</p>
                                            <p className="font-bold">I study &rarr; <span className="text-primary">She studies</span></p>
                                        </div>
                                        <Separator className="bg-border/50" />
                                        <div className="space-y-2">
                                            <h4 className="font-bold text-foreground">Vocal + "y"</h4>
                                            <p className="text-sm">Solo se agrega la <span className="font-bold text-primary">"s"</span>.</p>
                                            <div className="space-y-1">
                                                <p className="font-bold">I buy &rarr; <span className="text-primary">He buys</span></p>
                                                <p className="font-bold">I stay &rarr; <span className="text-primary">She stays</span></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-destructive/5 rounded-[2rem] border-2 border-dashed border-destructive/20">
                                    <h3 className="text-lg font-black text-destructive uppercase mb-2 text-center">NOTA IMPORTANTE</h3>
                                    <div className="space-y-3 font-mono text-base text-center">
                                        <p>Estas reglas solo se aplican a las oraciones afirmativas <span className="font-bold text-green-500 font-sans">(+)</span>.</p>
                                        <p>No se aplican en oraciones negativas ni interrogativas <span className="font-bold text-red-500 font-sans">(-)</span> <span className="font-bold text-blue-500 font-sans">(?)</span>.</p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center border-t pt-6">
                                <Button onClick={() => handleTopicComplete('grammar2')} size="lg" className="px-16 font-bold h-14 text-xl">
                                    Entendido <ArrowRight className="ml-2 h-6 w-6" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                );
            case 'mixedExercises1':
                return <PresentSimpleExercise key={selectedTopic} exerciseData={class3MixedExercise1Data} onComplete={() => handleTopicComplete('mixedExercises1')} title="Ejercicios Mixtos 1" showShortAnswers={false} />;
            case 'presentSimpleUses':
                return (
                    <div className="space-y-6 text-left">
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
                            <CardHeader>
                                <CardTitle className="text-2xl font-black text-primary uppercase tracking-tight">Usos del Presente Simple</CardTitle>
                                <CardDescription className="font-bold text-foreground">Cuándo y cómo usar el Presente Simple.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-primary uppercase tracking-tight">Hechos y Verdades Generales</h3>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-border/50">
                                        <p className="text-muted-foreground mb-3 font-medium">Para cosas que siempre son ciertas.</p>
                                        <div className="font-mono text-lg space-y-1">
                                            <p className="font-black text-primary">The Earth goes around the Sun.</p>
                                            <p className="text-sm text-muted-foreground italic">(La Tierra gira alrededor del Sol.)</p>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="opacity-50" />

                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-primary uppercase tracking-tight">Hábitos y Rutinas</h3>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-border/50">
                                        <p className="text-muted-foreground mb-3 font-medium">Para acciones que haces regularmente.</p>
                                        <div className="font-mono text-lg space-y-1">
                                            <p className="font-black text-primary">I play soccer on Saturdays.</p>
                                            <p className="text-sm text-muted-foreground italic">(Juego al fútbol los sábados.)</p>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="opacity-50" />

                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-primary uppercase tracking-tight">Horarios y Eventos Programados</h3>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-border/50">
                                        <p className="text-muted-foreground mb-3 font-medium">Para eventos futuros que tienen un horario fijo.</p>
                                        <div className="font-mono text-lg space-y-1">
                                            <p className="font-black text-primary">The train leaves at 8:00 AM.</p>
                                            <p className="text-sm text-muted-foreground italic">(El tren sale a las 8:00 AM.)</p>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="opacity-50" />

                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-primary uppercase tracking-tight">Situaciones Permanentes</h3>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-border/50">
                                        <p className="text-muted-foreground mb-3 font-medium">Para situaciones que son verdaderas por mucho tiempo.</p>
                                        <div className="font-mono text-lg space-y-1">
                                            <p className="font-black text-primary">She works in a hospital.</p>
                                            <p className="text-sm text-muted-foreground italic">(Ella trabaja en un hospital.)</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center border-t pt-6">
                                <Button onClick={() => handleTopicComplete('presentSimpleUses')} size="lg" className="px-16 font-bold h-14 text-xl">
                                    Continuar <ArrowRight className="ml-2 h-6 w-6" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                );
            case 'ex2_1':
                return <SimpleTranslationExercise key={selectedTopic} course="a1" exerciseKey="c2_mixed1" onComplete={() => handleTopicComplete('ex2_1')} title="Ejercicio 1" />;
            case 'ex2_2':
                return <QAShortAnswerExercise key={selectedTopic} exerciseData={class3QAShortAnswerExerciseData} onComplete={() => handleTopicComplete('ex2_2')} title="Ejercicio 2" description="Traduce y responde." />;
            case 'ex3_3':
                return <ShortAnswerPresentSimpleExercise key={selectedTopic} exerciseData={class3ShortAnswerEx3Data} onComplete={() => handleTopicComplete('ex3_3')} title="Ejercicio 3" description="Responde cortamente." />;
            case 'ex3_4':
                return <LargeTextTranslationExercise key={selectedTopic} title="Ejercicio 4: Diálogo" dialogue={class3LargeTextEx4Dialogue} onComplete={() => handleTopicComplete('ex3_4')} />;
            case 'can':
                return (
                    <div className="space-y-6 text-left">
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
                            <CardHeader>
                                <CardTitle className="text-2xl font-black text-primary uppercase tracking-tight">Verbo Modal "CAN"</CardTitle>
                                <CardDescription className="font-bold text-foreground">Habilidad, Posibilidad, Permiso</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-lg leading-relaxed">El verbo <span className="font-bold text-primary">'CAN'</span> es un verbo modal que se utiliza para expresar habilidad, posibilidad o permiso. En español, generalmente se traduce como <span className="italic">'poder'</span>.</p>
                                
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] space-y-4 border">
                                    <div className="font-mono text-lg space-y-3">
                                        <div>
                                            <p className="font-black text-primary">Habilidad:</p>
                                            <p>"I can speak English." <span className="text-sm text-muted-foreground italic">(Yo puedo hablar inglés.)</span></p>
                                        </div>
                                        <div>
                                            <p className="font-black text-primary">Posibilidad:</p>
                                            <p>"It can rain tomorrow." <span className="text-sm text-muted-foreground italic">(Puede llover mañana.)</span></p>
                                        </div>
                                        <div>
                                            <p className="font-black text-primary">Permiso:</p>
                                            <p>"Can I go to the bathroom?" <span className="text-sm text-muted-foreground italic">(¿Puedo ir al baño?)</span></p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
                            <CardHeader>
                                <CardTitle className="text-2xl font-black text-primary uppercase tracking-tight">Estructura de "CAN"</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] space-y-3 font-mono text-base border">
                                    <div className="flex items-center gap-4">
                                        <span className="text-green-500 font-bold w-10 text-center text-lg">(+)</span>
                                        <span className="text-muted-foreground">pronoun + can + verb (infinitive) + complement</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-red-500 font-bold w-10 text-center text-lg">(-)</span>
                                        <span className="text-muted-foreground">pronoun + can + not + verb (infinitive) + complement</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-blue-500 font-bold w-10 text-center text-lg">(?)</span>
                                        <span className="text-muted-foreground">Can + pronoun + verb (infinitive) + complement ?</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-lg font-bold text-foreground">Respuestas Cortas</h3>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] space-y-3 font-mono text-base border">
                                        <div className="flex items-center gap-4">
                                            <span className="text-green-500 font-bold w-10 text-center text-lg">(+A)</span>
                                            <span>Yes, pronoun + can</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-red-500 font-bold w-10 text-center text-lg">(-A)</span>
                                            <span>No, pronoun + can't</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
                            <CardHeader>
                                <CardTitle className="text-2xl font-black text-primary uppercase tracking-tight">Contracción Negativa</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border text-center">
                                    <p className="text-2xl font-black font-mono tracking-tighter text-primary">CAN + NOT = <span className="text-destructive">CAN'T</span></p>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center border-t pt-6">
                                <Button onClick={() => handleTopicComplete('can')} size="lg" className="px-16 font-bold h-14 text-xl">
                                    Entendido <ArrowRight className="ml-2 h-6 w-6" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                );
            case 'can1':
                return <PresentSimpleExercise key={selectedTopic} exerciseData={can1ExerciseData} onComplete={() => handleTopicComplete('can1')} title="Ejercicios CAN" showShortAnswers={true} />;
            case 'vocabulary2':
                 return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple p-6">
                        <CardHeader><CardTitle>Vocabulario 2</CardTitle></CardHeader>
                        <CardContent>
                            <p className='text-lg'>Estudia los nuevos términos presentados en esta unidad para mejorar tu fluidez.</p>
                        </CardContent>
                        <CardFooter><Button onClick={() => handleTopicComplete('vocabulary2')}>Continuar</Button></CardFooter>
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
                    <div className="mb-8 text-left text-white">
                        <Link href="/ingles/a1/unit/1" className="hover:underline text-sm">Volver a la unidad 1</Link>
                        <h1 className="text-4xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase 3 (A1)</h1>
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