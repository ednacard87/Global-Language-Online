
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle, ChevronDown, XCircle } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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

const ICONS = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const progressStorageVersion = 'progress_a1_eng_unit_1_class_3_v1';
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
    {
        spanish: "TU TRABAJAS LOS SABADOS",
        answers: {
            affirmative: ["you work on saturdays"],
            negative: ["you do not work on saturdays", "you don't work on saturdays"],
            interrogative: ["do you work on saturdays?"],
        }
    },
    {
        spanish: "ELLA VE PELICULAS CON SU NOVIO",
        answers: {
            affirmative: ["she watches movies with her boyfriend"],
            negative: ["she does not watch movies with her boyfriend", "she doesn't watch movies with her boyfriend"],
            interrogative: ["does she watch movies with her boyfriend?"],
        }
    },
    {
        spanish: "EL COME CON SU NOVIA EN ESE RESTAURANTE",
        answers: {
            affirmative: ["he eats with his girlfriend in that restaurant"],
            negative: ["he does not eat with his girlfriend in that restaurant", "he doesn't eat with his girlfriend in that restaurant"],
            interrogative: ["does he eat with his girlfriend in that restaurant?"],
        }
    },
    {
        spanish: "ELLOS TRABAJAN EN EL HOSPITAL",
        answers: {
            affirmative: ["they work in the hospital"],
            negative: ["they do not work in the hospital", "they don't work in the hospital"],
            interrogative: ["do they work in the hospital?"],
        }
    },
    {
        spanish: "YO ESTUDIO INGLES LOS LUNES Y MARTES",
        answers: {
            affirmative: ["i study english on mondays and tuesdays"],
            negative: ["i do not study english on mondays and tuesdays", "i don't study english on mondays and tuesdays"],
            interrogative: ["do i study english on mondays and tuesdays?"],
        }
    },
    {
        spanish: "A ELLA LE GUSTA LA PIZZA",
        answers: {
            affirmative: ["she likes pizza"],
            negative: ["she does not like pizza", "she doesn't like pizza"],
            interrogative: ["does she like pizza?"],
        }
    },
    {
        spanish: "NOSOTROS QUEREMOS UN PASTEL DE PIÑA",
        answers: {
            affirmative: ["we want a pineapple cake"],
            negative: ["we do not want a pineapple cake", "we don't want a pineapple cake"],
            interrogative: ["do we want a pineapple cake?"],
        }
    }
];

const class3QAShortAnswerExerciseData: QAShortAnswerPrompt[] = [
    { spanish: '¿TU HABLAS INGLES?', answers: { interrogative: ["do you speak english?"], shortAffirmative: ["yes, i do"], shortNegative: ["no, i do not", "no, i don't"] } },
    { spanish: '¿ELLA COME HAMBURGUESA?', answers: { interrogative: ["does she eat hamburger?", "does she eat hamburgers?"], shortAffirmative: ["yes, she does"], shortNegative: ["no, she does not", "no, she doesn't"] } },
    { spanish: '¿QUIERES UN HELADO?', answers: { interrogative: ["do you want an ice cream?"], shortAffirmative: ["yes, i do"], shortNegative: ["no, i do not", "no, i don't"] } },
    { spanish: '¿ELLOS TRABAJAN AQUI?', answers: { interrogative: ["do they work here?"], shortAffirmative: ["yes, they do"], shortNegative: ["no, they do not", "no, they don't"] } },
    { spanish: '¿EL DUERME EN SU TRABAJO?', answers: { interrogative: ["does he sleep at his job?", "does he sleep at work?"], shortAffirmative: ["yes, he does"], shortNegative: ["no, he does not", "no, he doesn't"] } },
    { spanish: '¿ELLOS NECESITAN AYUDA?', answers: { interrogative: ["do they need help?"], shortAffirmative: ["yes, they do"], shortNegative: ["no, they do not", "no, they don't"] } },
];

const class3ShortAnswerEx3Data: ShortAnswerPresentSimplePrompt[] = [
    { question: "DO THEY LIKE CHOCOLATE?", answers: { shortAffirmative: ["yes, they do"], shortNegative: ["no, they do not", "no, they don't"] } },
    { question: "DOES SHE SPEAK ITALIAN?", answers: { shortAffirmative: ["yes, she does"], shortNegative: ["no, she does not", "no, she doesn't"] } },
    { question: "DO YOU EAT SALAD EVERY DAY?", answers: { shortAffirmative: ["yes, i do"], shortNegative: ["no, i do not", "no, i don't"] } },
    { question: "DO THEY WORK TOGETHER?", answers: { shortAffirmative: ["yes, they do"], shortNegative: ["no, they do not", "no, they don't"] } },
    { question: "DOES SHE PLAY VIDEO GAMES?", answers: { shortAffirmative: ["yes, she does"], shortNegative: ["no, she does not", "no, she doesn't"] } },
    { question: "DOES HE DRINK COFFEE?", answers: { shortAffirmative: ["yes, he does"], shortNegative: ["no, he does not", "no, he doesn't"] } },
    { question: "DO YOU LIKE ACTION MOVIES?", answers: { shortAffirmative: ["yes, i do"], shortNegative: ["no, i do not", "no, i don't"] } },
    { question: "DO THEY CALL THEIR MOTHER?", answers: { shortAffirmative: ["yes, they do"], shortNegative: ["no, they do not", "no, they don't"] } },
    { question: "DOES HE GO TO BOGOTA?", answers: { shortAffirmative: ["yes, he does"], shortNegative: ["no, he does not", "no, he doesn't"] } },
    { question: "DOES SHE TEACH MATH?", answers: { shortAffirmative: ["yes, she does"], shortNegative: ["no, she does not", "no, she doesn't"] } },
];

const class3LargeTextEx4Dialogue: DialogueLine[] = [
    { speaker: "MARY", line: "¿TE VISITA EN MADRID?", answer: ["does she visit you in Madrid?"] },
    { speaker: "JON", line: "ELLA NO VIENE A MADRID MUY A MENUDO. YO LA VISITO EN BARCELONA.", answer: ["she doesn't come to madrid very often. i visit her in barcelona", "she does not come to madrid very often. i visit her in barcelona"] },
    { speaker: "MARY", line: "¿Y LE GUSTA?", answer: ["and does she like it"] },
    { speaker: "JON", line: "SÍ, LE ENCANTA BARCELONA. ELLA TRABAJA EN UN BANCO POR LAS MAÑANAS. POR LAS TARDES, ELLA JUEGA AL TENIS CON SU NOVIO O ELLA MIRA LA TV EN CASA. POR LAS NOCHES, ELLA VA A LA PLAYA O ELLA HACE SU TAREA DE INGLÉS. ESTUDIA INGLÉS LOS SÁBADOS.", answer: ["yes, she loves barcelona. she works in a bank in the morning, in the afternoon, she plays tennis with her boyfriend or she watches tv at home, at night she goes to the beach or she does her english homework. she studies english on saturday"] },
    { speaker: "MARY", line: "¿VIVES EN BARCELONA?", answer: ["do you live in barcelona"] },
    { speaker: "JON", line: "NO, NO VIVO EN BARCELONA. VIVO EN MADRID, PERO MI HERMANA VIVE ALLÍ.", answer: ["no i do not live in barcelona i live in madrid but my sister lives there", "no i don't live in barcelona i live in madrid but my sister lives there"] },
];

export default function EngA1Class3Page() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user } = useUser();
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

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'grammar2', name: t('kidsA1Class3.grammar2'), icon: GraduationCap, status: 'active' },
        { key: 'mixedExercises1', name: t('kidsA1Class3.mixedExercises1'), icon: PenSquare, status: 'locked' },
        { key: 'presentSimpleUses', name: t('kidsA1Class3.presentSimpleUses'), icon: BookOpen, status: 'locked' },
        {
            key: 'mixedExercises2',
            name: t('kidsA1Class3.mixedExercises2'),
            icon: PenSquare,
            status: 'locked',
            subItems: [
                { key: 'ex2_1', name: t('kidsA1Class3.exercise1'), icon: PenSquare, status: 'locked' },
                { key: 'ex2_2', name: t('kidsA1Class3.exercise2'), icon: PenSquare, status: 'locked' },
            ],
        },
        { key: 'vocabulary2', name: t('kidsA1Class3.vocabulary2'), icon: BookOpen, status: 'locked' },
        {
            key: 'mixedExercises3',
            name: t('kidsA1Class3.mixedExercises3'),
            icon: PenSquare,
            status: 'locked',
            subItems: [
                { key: 'ex3_3', name: t('kidsA1Class3.exercise3'), icon: PenSquare, status: 'locked' },
                { key: 'ex3_4', name: t('kidsA1Class3.exercise4'), icon: PenSquare, status: 'locked' },
            ],
        },
        { key: 'can', name: t('kidsA1Class3.can'), icon: GraduationCap, status: 'locked' },
        {
            key: 'canExercises',
            name: t('kidsA1Class3.canExercises'),
            icon: PenSquare,
            status: 'locked',
            subItems: [
                { key: 'can1', name: t('kidsA1Class3.can1'), icon: PenSquare, status: 'locked' },
                { key: 'can2', name: t('kidsA1Class3.can2'), icon: PenSquare, status: 'locked' },
            ],
        },
    ], [t]);
    
    useEffect(() => {
        if (isProfileLoading) return;
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
        } else {
            setSelectedTopic(newPath[0]?.key || '');
        }
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading]);
    
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
        if (isProfileLoading) return;
        if (!isAdmin && studentDocRef) {
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
    }, [learningPath, isAdmin, progress, studentDocRef, isProfileLoading]);

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

        const exerciseKeys: string[] = ['mixedExercises1', 'ex2_1', 'ex2_2', 'ex3_3', 'ex3_4', 'can1', 'can2'];
        if (!exerciseKeys.includes(topicKey)) {
            setTopicToComplete(topicKey);
        }
    };
    
    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic) || learningPath.flatMap(t => t.subItems || []).find(st => st?.key === selectedTopic);

        if (selectedTopic === 'grammar2') {
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>Formación de la Tercera Persona Singular (he, she, it)</CardTitle>
                        <CardDescription>Reglas para el Presente Simple Afirmativo</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="multiple" defaultValue={['item-1']} className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger className="text-lg font-semibold">Regla General</AccordionTrigger>
                                <AccordionContent className="text-base space-y-2">
                                    <p>A la mayoría de los verbos en tercera persona del singular (he, she, it) se les agrega una <span className="font-bold text-primary">"s"</span> al final.</p>
                                    <div className="p-3 bg-muted rounded-lg font-mono">
                                        <p>She work<span className="font-bold text-primary">s</span></p>
                                        <p>He eat<span className="font-bold text-primary">s</span></p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger className="text-lg font-semibold">Verbos terminados en -o, -sh, -ch, -ss, -x, -z</AccordionTrigger>
                                <AccordionContent className="text-base space-y-2">
                                    <p>A los verbos que terminan en estas letras, se les agrega <span className="font-bold text-primary">"es"</span>.</p>
                                    <div className="p-3 bg-muted rounded-lg font-mono">
                                        <p>I go → He go<span className="font-bold text-primary">es</span></p>
                                        <p>I wish → She wish<span className="font-bold text-primary">es</span></p>
                                        <p>I kiss → He kiss<span className="font-bold text-primary">es</span></p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3">
                                <AccordionTrigger className="text-lg font-semibold">Verbos terminados en "y"</AccordionTrigger>
                                <AccordionContent className="space-y-4">
                                    <div>
                                        <h4 className="font-medium text-base">Consonante + "y"</h4>
                                        <p className="text-muted-foreground text-sm">Se cambia la "y" por <span className="font-bold text-primary">"ies"</span>.</p>
                                        <div className="p-3 bg-muted rounded-lg font-mono mt-1">
                                            <p>I study → She stud<span className="font-bold text-primary">ies</span></p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-base">Vocal + "y"</h4>
                                        <p className="text-muted-foreground text-sm">Solo se agrega la <span className="font-bold text-primary">"s"</span>.</p>
                                        <div className="p-3 bg-muted rounded-lg font-mono mt-1">
                                            <p>I buy → He buy<span className="font-bold text-primary">s</span></p>
                                            <p>I stay → She stay<span className="font-bold text-primary">s</span></p>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                        <div className="mt-6 p-4 bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-300 rounded-r-lg">
                            <p className="font-bold">NOTA IMPORTANTE:</p>
                            <p className="mt-2">Estas reglas solo se aplican a las oraciones afirmativas (<span className="inline-flex items-center gap-1 font-bold text-green-600">(+) <CheckCircle className="h-4 w-4"/></span>).</p>
                            <p className="mt-1">No se aplican en oraciones negativas ni interrogativas (<span className="inline-flex items-center gap-1 font-bold text-red-600">(-) (?) <XCircle className="h-4 w-4"/></span>).</p>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        if (selectedTopic === 'mixedExercises1') {
            return (
                <PresentSimpleExercise
                    exerciseData={class3MixedExercise1Data}
                    onComplete={() => handleTopicComplete('mixedExercises1')}
                    title="Ejercicios Mixtos 1"
                    showShortAnswers={false}
                />
            );
        }

        if (selectedTopic === 'presentSimpleUses') {
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>{t('kidsA1Class3.presentSimpleUses')}</CardTitle>
                        <CardDescription>Cuándo y cómo usar el Presente Simple.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="multiple" defaultValue={['item-1']} className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger className="text-lg font-semibold">Hechos y Verdades Generales</AccordionTrigger>
                                <AccordionContent className="text-base space-y-2">
                                    <p>Para cosas que siempre son ciertas.</p>
                                    <div className="p-3 bg-muted rounded-lg font-mono">
                                        <p>The Earth <span className="font-bold text-primary">goes</span> around the Sun.</p>
                                        <p className="text-sm text-muted-foreground">(La Tierra gira alrededor del Sol.)</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger className="text-lg font-semibold">Hábitos y Rutinas</AccordionTrigger>
                                <AccordionContent className="text-base space-y-2">
                                    <p>Para acciones que haces regularmente.</p>
                                    <div className="p-3 bg-muted rounded-lg font-mono">
                                        <p>I <span className="font-bold text-primary">play</span> soccer on Saturdays.</p>
                                        <p className="text-sm text-muted-foreground">(Juego al fútbol los sábados.)</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3">
                                <AccordionTrigger className="text-lg font-semibold">Horarios y Eventos Programados</AccordionTrigger>
                                <AccordionContent className="text-base space-y-2">
                                    <p>Para eventos futuros que tienen un horario fijo.</p>
                                    <div className="p-3 bg-muted rounded-lg font-mono">
                                        <p>The train <span className="font-bold text-primary">leaves</span> at 8:00 AM.</p>
                                        <p className="text-sm text-muted-foreground">(El tren sale a las 8:00 AM.)</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-4">
                                <AccordionTrigger className="text-lg font-semibold">Situaciones Permanentes</AccordionTrigger>
                                <AccordionContent className="text-base space-y-2">
                                    <p>Para situaciones que son verdaderas por mucho tiempo.</p>
                                    <div className="p-3 bg-muted rounded-lg font-mono">
                                        <p>She <span className="font-bold text-primary">works</span> in a hospital.</p>
                                        <p className="text-sm text-muted-foreground">(Ella trabaja en un hospital.)</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>
            );
        }

        if (selectedTopic === 'ex2_1') {
            return (
                <SimpleTranslationExercise
                    course="a1"
                    exerciseKey="c2_mixed1" 
                    onComplete={() => handleTopicComplete('ex2_1')}
                    title="Ejercicio 1"
                />
            );
        }
        
        if (selectedTopic === 'ex2_2') {
            return (
                <QAShortAnswerExercise
                    exerciseData={class3QAShortAnswerExerciseData}
                    onComplete={() => handleTopicComplete('ex2_2')}
                    title="Ejercicio 2"
                    description="Traduce la pregunta y escribe las respuestas cortas."
                />
            );
        }
        
        if (selectedTopic === 'ex3_3') {
            return (
                <ShortAnswerPresentSimpleExercise
                    exerciseData={class3ShortAnswerEx3Data}
                    onComplete={() => handleTopicComplete('ex3_3')}
                    title="Ejercicio 3"
                    description="Completa las respuestas cortas para cada pregunta."
                />
            );
        }

        if (selectedTopic === 'ex3_4') {
            return (
                <LargeTextTranslationExercise
                    title="Ejercicio 4: Traducción de Diálogo"
                    dialogue={class3LargeTextEx4Dialogue}
                    onComplete={() => handleTopicComplete('ex3_4')}
                />
            );
        }

        if (selectedTopic === 'can') {
            return (
                <div className="space-y-6">
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Verbo Modal "CAN"</CardTitle>
                            <CardDescription>Habilidad, Posibilidad, Permiso</CardDescription>
                        </CardHeader>
                        <CardContent className="text-lg">
                            <p>El verbo <span className="font-bold text-primary">'CAN'</span> es un verbo modal que se utiliza para expresar habilidad, posibilidad o permiso. En español, generalmente se traduce como <span className="font-semibold">'poder'</span>.</p>
                            <ul className="list-disc list-inside mt-4 space-y-2 text-base">
                                <li><span className="font-semibold">Habilidad:</span> "I can speak English." (Yo puedo hablar inglés.)</li>
                                <li><span className="font-semibold">Posibilidad:</span> "It can rain tomorrow." (Puede llover mañana.)</li>
                                <li><span className="font-semibold">Permiso:</span> "Can I go to the bathroom?" (¿Puedo ir al baño?)</li>
                            </ul>
                        </CardContent>
                    </Card>
        
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Estructura de "CAN"</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> pronoun + can + verb (infinitive) + complement</p>
                                <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> pronoun + can + not + verb (infinitive) + complement</p>
                                <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> Can + pronoun + verb (infinitive) + complement ?</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Respuestas Cortas</h3>
                                <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                    <p><span className="font-bold text-lg text-green-500 mr-2">(+A)</span> Yes, pronoun + can</p>
                                    <p><span className="font-bold text-lg text-red-500 mr-2">(-A)</span> No, pronoun + can't</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
        
                    <Card className="shadow-soft rounded-lg border-2 border-destructive">
                        <CardHeader>
                            <CardTitle>Contracción Negativa</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center font-mono text-xl p-6">
                           <p>CAN + NOT = <span className="font-bold text-destructive">CAN'T</span></p>
                        </CardContent>
                    </Card>
                </div>
            );
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
                        <h1 className="text-4xl font-bold dark:text-primary">Clase 3</h1>
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

