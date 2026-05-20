'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle, Gamepad2, ChevronDown, Trophy, Loader2, ArrowRight } from 'lucide-react';
import { useTranslation } from "@/context/language-context";
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SingleFormExercise } from '@/components/kids/exercises/single-form';
import { PresentSimpleExercise } from '@/components/kids/exercises/present-simple';

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

const progressStorageVersion = 'progress_kids_b1_will_v10_stable';
const mainProgressKey = 'progress_kids_b1_will';

const vocabularyData = [
    { english: 'Global warming', spanish: 'Calentamiento global.' },
    { english: 'Renewable energy', spanish: 'Energía renovable.' },
    { english: 'Pollution', spanish: 'Contaminación.' },
    { english: 'Endangered species', spanish: 'Especies en peligro.' },
    { english: 'Waste', spanish: 'Desperdicios / Residuos.' },
    { english: 'To melt', spanish: 'Derretirse.' },
    { english: 'To improve', spanish: 'Mejorar.' },
];

const willPositiveExercises = [
    { spanish: 'ella comerá pollo', answer: ["she will eat chicken"] },
    { spanish: 'el vivirá en Londres', answer: ["he will live in london"] },
];

const willMixedExercises = [
    {
        spanish: "yo aprenderé ingles pronto",
        answers: {
            affirmative: ["I will learn English soon", "I'll learn English soon"],
            negative: ["I will not learn English soon", "I won't learn English soon"],
            interrogative: ["will I learn English soon?"],
            shortAffirmative: ["yes, I will"],
            shortNegative: ["no, I will not", "no, I won't"]
        }
    }
];

export default function WillPage() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const studentDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'students', user.uid) : null),
        [firestore, user]
    );
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);

    const isAdmin = useMemo(() => {
        if (!user) return false;
        return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
    }, [user, studentProfile]);
    
    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: t('kidsB1Will.vocabulary'), icon: BookOpen, status: 'active' },
        { key: 'grammar', name: t('kidsB1Will.grammar'), icon: GraduationCap, status: 'locked' },
        {
            key: 'exercise',
            name: t('kidsB1Will.exercise'),
            icon: PenSquare,
            status: 'locked',
            subItems: [
                { key: 'positive', name: t('kidsB1Will.positive'), icon: PenSquare, status: 'locked' },
                { key: 'negative', name: t('kidsB1Will.negative'), icon: PenSquare, status: 'locked' },
                { key: 'interrogative', name: t('kidsB1Will.interrogative'), icon: PenSquare, status: 'locked' },
            ],
        },
        { key: 'mixedExercises', name: t('kidsB1Will.mixedExercises'), icon: PenSquare, status: 'locked' },
    ], [t]);
    
    useEffect(() => {
        if (isUserLoading || isProfileLoading || !initialLearningPath.length) return;

        const path = initialLearningPath.map(topic => ({
            ...topic,
            subItems: topic.subItems ? topic.subItems.map(sub => ({ ...sub })) : undefined,
        }));

        if (isAdmin) {
            path.forEach(item => { item.status = 'completed'; if (item.subItems) item.subItems.forEach(s => s.status = 'completed'); });
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedStatuses = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => {
                if (savedStatuses[item.key]) item.status = savedStatuses[item.key];
                if (item.subItems && savedStatuses.subItems?.[item.key]) {
                    item.subItems.forEach(subItem => { if (savedStatuses.subItems[item.key][subItem.key]) subItem.status = savedStatuses.subItems[item.key][subItem.key]; });
                }
            });
        }

        setLearningPath(path);
        if (!initialLoadComplete) {
            const firstActive = path.find(p => p.status === 'active') || path.flatMap(p => p.subItems || []).find(sp => sp?.status === 'active');
            setSelectedTopic(firstActive?.key || path[0].key);
            setInitialLoadComplete(true);
        }
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete, t]);

    const handleTopicComplete = (completedKey: string) => {
        if (isAdmin) return;
        let wasUnlocked = false;
        let nextToSelect: string | null = null;

        setLearningPath(currentPath => {
            const newPath = currentPath.map(t => ({
                ...t,
                subItems: t.subItems ? t.subItems.map(s => ({ ...s })) : undefined,
            }));
          
            let found = false;
            for (let i = 0; i < newPath.length && !found; i++) {
                const currentTopic = newPath[i];
                if (currentTopic.key === completedKey) {
                    if (currentTopic.status !== 'completed') currentTopic.status = 'completed';
                    if (i + 1 < newPath.length && newPath[i + 1].status === 'locked') {
                        newPath[i + 1].status = 'active';
                        wasUnlocked = true;
                        nextToSelect = newPath[i + 1].subItems?.[0]?.key || newPath[i + 1].key;
                        if (newPath[i + 1].subItems?.[0]) newPath[i + 1].subItems![0].status = 'active';
                    }
                    found = true;
                } else if (currentTopic.subItems) {
                    const subIndex = currentTopic.subItems.findIndex(s => s.key === completedKey);
                    if (subIndex !== -1) {
                        newPath[i].subItems![subIndex].status = 'completed';
                        const nextSubIndex = subIndex + 1;
                        if (nextSubIndex < currentTopic.subItems.length && currentTopic.subItems[nextSubIndex].status === 'locked') {
                            currentTopic.subItems[nextSubIndex].status = 'active';
                            nextToSelect = currentTopic.subItems[nextSubIndex].key;
                            wasUnlocked = true;
                        } else if (currentTopic.subItems.every(s => s.status === 'completed')) {
                            if (currentTopic.status !== 'completed') currentTopic.status = 'completed';
                            if (i + 1 < newPath.length && newPath[i + 1].status === 'locked') {
                                newPath[i + 1].status = 'active';
                                wasUnlocked = true;
                                nextToSelect = newPath[i + 1].subItems?.[0]?.key || newPath[i + 1].key;
                                if (newPath[i + 1].subItems?.[0]) newPath[i + 1].subItems![0].status = 'active';
                            }
                        }
                        found = true;
                    }
                }
            }
            return newPath;
        });

        if (wasUnlocked) setTimeout(() => toast({ title: "¡Siguiente tema desbloqueado!" }), 0);
        if (nextToSelect) setSelectedTopic(nextToSelect);
    };

    const handleTopicSelect = (topicKey: string) => {
        const mainTopic = learningPath.find(t => t.key === topicKey || t.subItems?.some(st => st.key === topicKey));
        const subTopic = mainTopic?.subItems?.find(st => st.key === topicKey);
        if (!isAdmin && ((subTopic && subTopic.status === 'locked') || (!subTopic && mainTopic?.status === 'locked'))) {
            toast({ variant: "destructive", title: "Contenido Bloqueado" });
            return;
        }
        setSelectedTopic(topicKey);
        if (topicKey === 'vocabulary' || topicKey === 'grammar') handleTopicComplete(topicKey);
    };
    
    return (
        <div className="flex w-full flex-col min-h-screen will-lesson-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-white">
                        <Link href="/kids/b1" className="hover:underline text-sm">Volver al curso B1</Link>
                        <h1 className="text-4xl font-bold">{t('kidsB1.will')}</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9">
                            {selectedTopic === 'vocabulary' && (
                                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                                    <CardHeader><CardTitle>{t('kidsB1Will.vocabulary')}</CardTitle></CardHeader>
                                    <CardContent><div className="grid grid-cols-2 gap-4">{vocabularyData.map((v, i) => (<div key={i} className="p-3 bg-muted rounded-lg font-medium">{v.spanish} - {v.english}</div>))}</div></CardContent>
                                    <CardFooter><Button onClick={() => handleTopicComplete('vocabulary')}>He terminado de repasar</Button></CardFooter>
                                </Card>
                            )}
                            {selectedTopic === 'grammar' && (
                                <Card className="shadow-soft border-2 border-brand-purple p-6"><CardTitle>Estructura WILL</CardTitle><CardContent className="pt-4 font-mono">(+) pronoun + WILL + Verb</CardContent><CardFooter><Button onClick={() => handleTopicComplete('grammar')}>Entendido</Button></CardFooter></Card>
                            )}
                            {selectedTopic === 'positive' && <SingleFormExercise onComplete={() => handleTopicComplete('positive')} exerciseData={willPositiveExercises} title="Positiva" description="Usa WILL" formType="affirmative" />}
                            {selectedTopic === 'mixedExercises' && <PresentSimpleExercise onComplete={() => handleTopicComplete('mixedExercises')} exerciseData={willMixedExercises} title="Mixtos" />}
                        </div>
                        <div className="md:col-span-3 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader><CardTitle>Aventura</CardTitle></CardHeader>
                                <CardContent>
                                    <nav><ul className="space-y-1">
                                        {learningPath.map(item => (
                                            <li key={item.key}>
                                                {!item.subItems ? (
                                                    <div onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer', (item.status === 'locked' && !isAdmin) ? 'text-muted-foreground/50' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-semibold')}>
                                                        <div className="flex items-center gap-3">{(item.status === 'completed') ? <CheckCircle className="h-5 w-5 text-green-500" /> : <item.icon className="h-5 w-5" />}<span>{item.name}</span></div>
                                                    </div>
                                                ) : (
                                                    <div className="p-3 font-bold text-primary">{item.name}</div>
                                                )}
                                            </li>
                                        ))}
                                    </ul></nav>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
