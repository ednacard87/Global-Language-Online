'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Lock,
  GraduationCap,
  BrainCircuit,
  CheckCircle,
  Lightbulb,
  PenSquare,
  Pencil,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Trophy
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, updateDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useTranslation } from '@/context/language-context';
import { getKidsIntro1PathData, type Topic } from '@/lib/course-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AlphabetGrid } from '@/components/kids/alphabet-grid';
import { NumbersGrid } from '@/components/kids/numbers-grid';
import { AbcMemoryGame } from '@/components/kids/exercises/abc-memory-game';
import { NumbersMemoryGame } from '@/components/kids/exercises/numbers-memory-game';
import { ToBeMemoryGame } from '@/components/kids/exercises/tobe-memory-game';
import { TranslationExercise } from '@/components/dashboard/translation-exercise';
import { PossessivesMemoryGame } from '@/components/kids/exercises/possessives-memory-game';
import { AbcPronunciationExercise } from '@/components/kids/exercises/abc-pronunciation-exercise';
import { SpellingExercise, type SpellingExerciseKey } from '@/components/dashboard/spelling-exercise';
import { Separator } from '@/components/ui/separator';

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

const demonstrativesData = [
    { english: 'This', spanish: 'Este - Esta', usage: 'Singular, cerca' },
    { english: 'These', spanish: 'Estos - Estas', usage: 'Plural, cerca' },
    { english: 'That', spanish: 'Ese - Esa', usage: 'Singular, lejos' },
    { english: 'Those', spanish: 'Esos - Esas', usage: 'Plural, lejos' },
];

interface Student {
    role?: 'admin' | 'student';
    lessonProgress?: any;
    progress?: Record<string, number>;
}

const progressStorageVersion = "kids_intro1_path_v6_fixed";

export default function KidsIntro1Page() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [selectedTopicKey, setSelectedTopicKey] = useState<string>('abc');
    const [highlightedLetter, setHighlightedLetter] = useState<string | null>(null);
    const [highlightedNumber, setHighlightedNumber] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [isIntro1Finished, setIsIntro1Finished] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const { user } = useUser();
    const firestore = useFirestore();
    const guideFishImage = PlaceHolderImages.find(p => p.id === 'guide-fish');
    
    const studentDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'students', user.uid) : null),
        [firestore, user]
    );
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<Student>(studentDocRef);

    const isAdmin = useMemo(() => {
        if (!user) return false;
        return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
    }, [user, studentProfile]);

    const initialLearningPathData = useMemo(() => getKidsIntro1PathData(t), [t]);

    useEffect(() => {
        setIsClient(true);
    }, []);
    
    useEffect(() => {
        if (!isClient || isProfileLoading) return;

        let path = initialLearningPathData.map(item => ({...item}));

        if (isAdmin) {
            path.forEach(topic => { (topic as any).status = 'completed' });
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedStatuses = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => {
              if (savedStatuses[item.key]) {
                (item as any).status = savedStatuses[item.key];
              }
            });
            if (savedStatuses.isIntro1Finished) setIsIntro1Finished(true);
        }

        if (!isAdmin) {
            let lastDone = true;
            for (let i = 0; i < path.length; i++) {
                if (lastDone && path[i].status === 'locked') (path[i] as any).status = 'active';
                lastDone = path[i].status === 'completed';
            }
        }

        setLearningPath(path as Topic[]);
        const firstActive = path.find(p => p.status === 'active');
        setSelectedTopicKey(studentProfile?.lessonProgress?.[progressStorageVersion]?.lastSelectedTopic || firstActive?.key || path[0].key);
        setIsInitialLoading(false);
    }, [isAdmin, t, isClient, studentProfile, isProfileLoading, initialLearningPathData]);
    
    const progressValue = useMemo(() => {
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return learningPath.length > 0 ? Math.round((completedCount / learningPath.length) * 100) : 0;
    }, [learningPath]);

    useEffect(() => {
        if (!isClient || isInitialLoading || isAdmin || !studentDocRef) return;

        const statuses: any = learningPath.reduce((acc, item) => ({ ...acc, [item.key]: item.status }), {});
        statuses.lastSelectedTopic = selectedTopicKey;
        statuses.isIntro1Finished = isIntro1Finished;

        updateDocumentNonBlocking(studentDocRef, {
            [`lessonProgress.${progressStorageVersion}`]: statuses,
            'progress.kidsIntro1Progress': progressValue
        });
        window.dispatchEvent(new CustomEvent('progressUpdated'));

    }, [learningPath, progressValue, isAdmin, isClient, studentDocRef, isInitialLoading, selectedTopicKey, isIntro1Finished]);

    useEffect(() => {
        if (!topicToComplete) return;

        setLearningPath(currentPath => {
            const newPath = currentPath.map(item => ({ ...item }));
            const currentIndex = newPath.findIndex((t) => t.key === topicToComplete);
            
            if (currentIndex !== -1 && newPath[currentIndex].status !== 'completed') {
                newPath[currentIndex].status = 'completed';

                if (currentIndex + 1 < newPath.length && newPath[currentIndex + 1].status === 'locked') {
                    (newPath[currentIndex + 1] as any).status = 'active';
                    setSelectedTopicKey(newPath[currentIndex + 1].key);
                    toast({ title: '¡Misión desbloqueada!', description: `Avanzamos a: ${newPath[currentIndex + 1].name}` });
                }
            }
            return newPath;
        });

        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const currentItem = learningPath.find(item => item.key === topicKey);
        if (!isAdmin && (!currentItem || currentItem.status === 'locked')) {
            toast({ variant: 'destructive', title: 'Contenido Bloqueado' });
            return;
        }
        
        setSelectedTopicKey(topicKey);

        const viewOnlyTopics = ['abc', 'numbers', 'tobe', 'possessives', 'tobe-1-grammar', 'tobe-2-grammar', 'tobe-3-grammar'];
        if (viewOnlyTopics.includes(topicKey)) {
            setTopicToComplete(topicKey);
        }
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

        switch (selectedTopicKey) {
            case 'abc':
                return <Card className="shadow-soft rounded-lg border-2 border-brand-purple"><CardHeader><CardTitle>{t('intro1Page.abc')}</CardTitle></CardHeader><CardContent><AlphabetGrid highlightedItem={highlightedLetter} onHighlight={setHighlightedLetter} /></CardContent><CardFooter className="justify-center"><Button onClick={() => setTopicToComplete('abc')} size="lg" className="px-12 font-bold">He terminado de estudiar</Button></CardFooter></Card>;
            case 'abcExercise':
                return <AbcPronunciationExercise onGameComplete={() => setTopicToComplete('abcExercise')} />;
            case 'abc-memory':
                return <AbcMemoryGame onGameComplete={() => setTopicToComplete('abc-memory')} />;
            case 'abcspelling':
                return <SpellingExercise exerciseKey="femaleNames" onComplete={() => setTopicToComplete('abcspelling')} />;
            case 'numbers':
                return <Card className="shadow-soft rounded-lg border-2 border-brand-purple"><CardHeader><CardTitle>{t('intro1Page.numbers')}</CardTitle></CardHeader><CardContent><NumbersGrid highlightedItem={highlightedNumber} onHighlight={setHighlightedNumber} /></CardContent><CardFooter className="justify-center"><Button onClick={() => setTopicToComplete('numbers')} size="lg" className="px-12 font-bold">He terminado de estudiar</Button></CardFooter></Card>;
            case 'numbers-memory':
                return <NumbersMemoryGame onGameComplete={() => setTopicToComplete('numbers-memory')} />;
            case 'numbersspelling':
                return <SpellingExercise exerciseKey="numbers1" onComplete={() => setTopicToComplete('numbersspelling')} />;
            case 'tobe':
                return <Card className="shadow-soft rounded-lg border-2 border-brand-purple"><CardHeader><CardTitle>{t('intro1Page.pronouns')}</CardTitle></CardHeader><CardContent><div className="grid grid-cols-3 gap-x-4 gap-y-2 text-lg"><div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.ser')}</div><div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.tobe')}</div><div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.estar')}</div>{verbToBeData.map((item, index) => (<React.Fragment key={index}><div className="p-3 bg-card border rounded-lg text-center">{item.ser}</div><div className="p-3 bg-card border rounded-lg font-medium text-center">{item.tobe}</div><div className="p-3 bg-card border rounded-lg text-center">{item.estar}</div></React.Fragment>))}</div></CardContent><CardFooter className="justify-center"><Button onClick={() => setTopicToComplete('tobe')} size="lg" className="px-12 font-bold">Entendido</Button></CardFooter></Card>;
            case 'tobe-memory':
                return <ToBeMemoryGame onGameComplete={() => setTopicToComplete('tobe-memory')} />;
            case 'tobe-1-grammar':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>To be 1</CardTitle>
                            <CardDescription>Aprende la estructura básica del verbo To be.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold mb-2">{t('intro1Page.verbtobeStructureTitle')}</h3>
                                <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                    <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> pronoun + to be + complement</p>
                                    <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> pronoun + to be + not + complement</p>
                                    <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> to be + pronoun + complement ?</p>
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <h3 className="text-xl font-semibold mb-2">{t('intro1Page.shortAnswersTitle')}</h3>
                                <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                    <p><span className="font-bold text-lg text-green-500 mr-2">(+A)</span> Yes, pronoun + to be</p>
                                    <p><span className="font-bold text-lg text-red-500 mr-2">(-A)</span> No, pronoun + to be + not</p>
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <h3 className="text-xl font-semibold mb-2">{t('intro1Page.exampleTitle')}</h3>
                                <p className="text-lg italic text-muted-foreground mb-2">"ellos son estudiantes"</p>
                                <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                    <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> They are students</p>
                                    <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> They are not students</p>
                                    <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> Are they students?</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className='justify-center border-t pt-4'><Button onClick={() => setTopicToComplete('tobe-1-grammar')} size="lg" className="font-bold">Continuar</Button></CardFooter>
                    </Card>
                );
            case 'tobe-1-exercise':
                return <TranslationExercise exerciseKey="exercises1" onComplete={() => setTopicToComplete('tobe-1-exercise')} />;
            case 'possessives':
                return <Card className="shadow-soft rounded-lg border-2 border-brand-purple"><CardHeader><CardTitle>{t('intro1Page.possessives')}</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg"><div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.english')}</div><div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.spanish')}</div>{possessivesData.map((item, index) => (<React.Fragment key={index}><div className="p-3 bg-card border rounded-lg font-medium text-center">{item.english}</div><div className="p-3 bg-card border rounded-lg text-center">{item.spanish}</div></React.Fragment>))}</div></CardContent><CardFooter className="justify-center"><Button onClick={() => setTopicToComplete('possessives')} size="lg" className="px-12 font-bold">Estudiado</Button></CardFooter></Card>;
            case 'possessives-memory':
                return <PossessivesMemoryGame onGameComplete={() => setTopicToComplete('possessives-memory')} />;
            case 'tobe-2-grammar':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>To be 2</CardTitle>
                            <CardDescription>Estructura con adjetivos posesivos.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold mb-2">{t('intro1Page.verbtobeStructureTitle')}</h3>
                                <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                    <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> pronoun + to be + possessive + noun + complement</p>
                                    <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> pronoun + to be + not + possessive + noun + complement</p>
                                    <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> to be + pronoun + possessive + noun + complement ?</p>
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <h3 className="text-xl font-semibold mb-2">{t('intro1Page.exampleTitle')}</h3>
                                <p className="text-lg italic text-muted-foreground mb-2">"Ellos son mis amigos"</p>
                                <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                    <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> They are my friends</p>
                                    <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> They are not my friends</p>
                                    <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> Are they my friends?</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className='justify-center border-t pt-4'><Button onClick={() => setTopicToComplete('tobe-2-grammar')} size="lg" className="font-bold">Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'tobe-2-exercise':
                return <TranslationExercise exerciseKey="exercises2" onComplete={() => setTopicToComplete('tobe-2-exercise')} />;
            case 'tobe-3-grammar':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>To be 3</CardTitle>
                            <CardDescription>Estructura iniciando con adjetivos posesivos.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold mb-2">{t('intro1Page.verbtobeStructureTitle')}</h3>
                                <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                    <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> possessive + noun + to be + complement</p>
                                    <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> possessive + noun + to be + not + complement</p>
                                    <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> to be + possessive + noun + complement ?</p>
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <h3 className="text-xl font-semibold mb-2">{t('intro1Page.exampleTitle')}</h3>
                                <p className="text-lg italic text-muted-foreground mb-2">"Mi mamá es una enfermera"</p>
                                <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                    <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> My mother is a nurse</p>
                                    <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> My mother is not a nurse</p>
                                    <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> Is my mother a nurse?</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className='justify-center border-t pt-4'><Button onClick={() => setTopicToComplete('tobe-3-grammar')} size="lg" className="font-bold">Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'tobe-3-exercise':
                return <TranslationExercise exerciseKey="exercises3" onComplete={() => setTopicToComplete('tobe-3-exercise')} />;
            case 'demonstratives':
                if (isIntro1Finished) {
                    return (
                        <Card className="shadow-soft border-2 border-green-500 bg-green-500/10 p-12 text-center flex flex-col items-center text-foreground">
                            <Trophy className="h-24 w-24 text-yellow-400 mb-6 animate-bounce" />
                            <h2 className="text-4xl font-black uppercase text-green-600 tracking-tighter">Congratulations!</h2>
                            <p className="text-2xl mt-4 font-bold text-black dark:text-white">You finish Intro 1 Kids</p>
                            <Button asChild className="mt-8 px-12 h-12 font-bold" variant="outline">
                                <Link href="/kids/intro">Volver al Laberinto</Link>
                            </Button>
                        </Card>
                    );
                }
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple text-foreground text-left">
                        <CardHeader>
                            <CardTitle>{t('intro1Page.demonstratives')}</CardTitle>
                            <CardDescription className="pt-2 text-lg font-semibold flex items-center gap-2">
                                <Lightbulb className="h-5 w-5 text-yellow-400 animate-pulse" />
                                <span className="bg-gradient-to-r from-brand-purple to-brand-teal text-transparent bg-clip-text">
                                    {t('intro1Page.demonstrativesStudyHint')}
                                </span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-lg">
                                <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.english')}</div>
                                <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.spanish')}</div>
                                <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('intro1Page.usage')}</div>
                                {demonstrativesData.map((item, index) => (
                                    <React.Fragment key={index}>
                                        <div className="p-3 bg-card border rounded-lg font-medium text-center">{item.english}</div>
                                        <div className="p-3 bg-card border rounded-lg text-center">{item.spanish}</div>
                                        <div className="p-3 bg-card border rounded-lg text-center text-xs flex items-center justify-center">{item.usage}</div>
                                    </React.Fragment>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end">
                            <Button onClick={() => {
                                setIsIntro1Finished(true);
                                setTopicToComplete('demonstratives');
                            }} className="px-12 font-bold">Finish</Button>
                        </CardFooter>
                    </Card>
                );
            default:
                return (
                    <Card className="flex flex-col items-center justify-center min-h-[400px]">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground font-bold tracking-widest animate-pulse uppercase">Cargando Misión...</p>
                    </Card>
                );
        }
    };
    
    return (
        <div className="flex w-full flex-col kids-page-container min-h-screen">
          <DashboardHeader />
          <main className="flex-1 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="grid gap-8 md:grid-cols-12">
                <div className="md:col-span-9 md:order-1 order-2">
                    <div className="mb-8 text-left text-white">
                        <Link href="/kids/intro" className="hover:underline text-sm font-bold flex items-center gap-2 mb-2">
                            <ArrowLeft className="h-4 w-4" /> Volver al laberinto
                        </Link>
                        <h1 className="text-4xl font-black uppercase tracking-tighter [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)]">
                            {t('kidsPage.intro1AdventureTitle')}
                        </h1>
                    </div>
                    {renderContent()}
                </div>
                <div className="md:col-span-3 md:order-2 order-1">
                    <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader className="bg-primary/5 border-b text-left">
                        <CardTitle className="text-primary font-black uppercase tracking-tighter">Tu Misión</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <nav>
                            <ul className="space-y-1">
                            {learningPath.map((item) => {
                                const isLocked = item.status === 'locked';
                                const isSelected = selectedTopicKey === item.key;
                                const isCompleted = item.status === 'completed';
                                
                                const Icon = isCompleted ? CheckCircle : (isLocked && !isAdmin ? Lock : (item.icon || BookOpen));

                                return (
                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn(!isLocked || isAdmin ? "cursor-pointer" : "cursor-not-allowed")}>
                                        <div className={cn(
                                            "flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                            (!isLocked || isAdmin) && "hover:bg-muted",
                                            isSelected ? "bg-muted text-primary font-black border-l-4 border-primary shadow-sm" : "text-foreground",
                                            item.status === 'active' && !isAdmin && 'animate-pulse-glow'
                                        )}>
                                            <div className="flex items-center gap-3 text-left">
                                                <Icon className={cn("h-5 w-5 shrink-0", isLocked && !isAdmin ? "text-yellow-500/50" : isCompleted ? "text-green-500" : "text-primary" )} />
                                                <span className="truncate max-w-[150px] uppercase font-bold text-[10px]">{item.name}</span>
                                            </div>
                                            {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                        </div>
                                    </li>
                                );
                            })}
                            </ul>
                        </nav>
                        <div className="mt-6 pt-6 border-t text-left">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                                <span>Progreso</span>
                                <span className="text-primary">{progressValue}%</span>
                            </div>
                            <Progress value={progressValue} className="h-1.5" />
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
