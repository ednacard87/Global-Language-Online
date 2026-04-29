
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Lock,
  GraduationCap,
  BrainCircuit,
  CheckCircle,
  Lightbulb,
  Languages,
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

interface Student {
    role?: 'admin' | 'student';
    lessonProgress?: any;
    progress?: Record<string, number>;
}

const progressStorageVersion = "kids_intro1_path_v3";

export default function KidsIntro1Page() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [selectedTopic, setSelectedTopic] = useState<string>('abc');
    const [highlightedLetter, setHighlightedLetter] = useState<string | null>(null);
    const [highlightedNumber, setHighlightedNumber] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [previousPath, setPreviousPath] = useState<Topic[] | null>(null);

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
            path.forEach(topic => { topic.status = 'completed' });
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedStatuses = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => {
              if (savedStatuses[item.key]) {
                item.status = savedStatuses[item.key];
              }
            });
        }
        setLearningPath(path);
        const firstActive = path.find(p => p.status === 'active');
        setSelectedTopic(firstActive?.key || path[0].key);
    }, [isAdmin, t, isClient, studentProfile, isProfileLoading, initialLearningPathData]);
    
    const progress = useMemo(() => {
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return learningPath.length > 0 ? Math.round((completedCount / learningPath.length) * 100) : 0;
    }, [learningPath]);

    useEffect(() => {
        if (!isClient || isProfileLoading || isAdmin || !studentDocRef) return;

        const statuses = learningPath.reduce((acc, item) => ({ ...acc, [item.key]: item.status }), {});
        updateDocumentNonBlocking(studentDocRef, {
            [`lessonProgress.${progressStorageVersion}`]: statuses,
            'progress.kidsIntro1Progress': progress
        });
        window.dispatchEvent(new CustomEvent('progressUpdated'));

    }, [learningPath, progress, isAdmin, isClient, studentDocRef, isProfileLoading]);

    useEffect(() => {
        if (previousPath && !isAdmin) {
          const newlyUnlocked = learningPath.find((newItem, index) => {
            const oldItem = previousPath[index];
            return oldItem && oldItem.status === 'locked' && newItem.status === 'active';
          });
      
          if (newlyUnlocked) {
            toast({
              title: '¡Siguiente tema desbloqueado!',
              description: `Ahora puedes continuar con ${newlyUnlocked.name}`,
            });
          }
        }
        setPreviousPath(learningPath);
    }, [learningPath, previousPath, toast, isAdmin]);

    useEffect(() => {
        if (!topicToComplete) return;

        setLearningPath(currentPath => {
            const newPath = currentPath.map(item => ({ ...item }));
            const currentIndex = newPath.findIndex((t) => t.key === topicToComplete);

            if (currentIndex !== -1 && newPath[currentIndex].status !== 'completed') {
                newPath[currentIndex].status = 'completed';

                if (currentIndex + 1 < newPath.length && newPath[currentIndex + 1].status === 'locked') {
                    newPath[currentIndex + 1].status = 'active';
                }
            }
            return newPath;
        });

        setTopicToComplete(null);
    }, [topicToComplete]);

    const handleTopicSelect = (topicKey: string) => {
        const currentItem = learningPath.find(item => item.key === topicKey);
        if (!isAdmin && (!currentItem || currentItem.status === 'locked')) return;
        
        setSelectedTopic(topicKey);

        const viewOnlyTopics = ['abc', 'numbers', 'tobe', 'possessives'];
        if (viewOnlyTopics.includes(topicKey)) {
            setTopicToComplete(topicKey);
        }
    };

    const renderContent = () => {
        switch (selectedTopic) {
            case 'abc':
                return <Card className="shadow-soft rounded-lg border-2 border-brand-purple"><CardHeader><CardTitle>{t('intro1Page.abc')}</CardTitle></CardHeader><CardContent><AlphabetGrid highlightedItem={highlightedLetter} onHighlight={setHighlightedLetter} /></CardContent></Card>;
            case 'abc-memory':
                return <AbcMemoryGame onGameComplete={() => setTopicToComplete('abc-memory')} />;
            case 'numbers':
                return <Card className="shadow-soft rounded-lg border-2 border-brand-purple"><CardHeader><CardTitle>{t('intro1Page.numbers')}</CardTitle></CardHeader><CardContent><NumbersGrid highlightedItem={highlightedNumber} onHighlight={setHighlightedNumber} /></CardContent></Card>;
            case 'numbers-memory':
                return <NumbersMemoryGame onGameComplete={() => setTopicToComplete('numbers-memory')} />;
            case 'tobe':
                return <Card className="shadow-soft rounded-lg border-2 border-brand-purple"><CardHeader><CardTitle>{t('intro1Page.pronouns')}</CardTitle></CardHeader><CardContent><div className="grid grid-cols-3 gap-x-4 gap-y-2 text-lg"><div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.ser')}</div><div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.tobe')}</div><div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.estar')}</div>{verbToBeData.map((item, index) => (<React.Fragment key={index}><div className="p-3 bg-card border rounded-lg text-center">{item.ser}</div><div className="p-3 bg-card border rounded-lg font-medium text-center">{item.tobe}</div><div className="p-3 bg-card border rounded-lg text-center">{item.estar}</div></React.Fragment>))}</div></CardContent></Card>;
            case 'tobe-memory':
                return <ToBeMemoryGame onGameComplete={() => setTopicToComplete('tobe-memory')} />;
            case 'possessives':
                return <Card className="shadow-soft rounded-lg border-2 border-brand-purple"><CardHeader><CardTitle>{t('intro1Page.possessives')}</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg"><div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.english')}</div><div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.spanish')}</div>{possessivesData.map((item, index) => (<React.Fragment key={index}><div className="p-3 bg-card border rounded-lg font-medium text-center">{item.english}</div><div className="p-3 bg-card border rounded-lg text-center">{item.spanish}</div></React.Fragment>))}</div></CardContent></Card>;
            case 'possessives-memory':
                return <PossessivesMemoryGame onGameComplete={() => setTopicToComplete('possessives-memory')} />;
            default:
                const topic = learningPath.find(t => t.key === selectedTopic);
                return (
                    <Card className="h-full">
                        <CardHeader className="text-center">
                            <CardTitle className="text-3xl">{topic?.name || '¡Bienvenido a la Aventura Intro 1!'}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center px-6 pb-6">
                            <p className="pt-4 text-lg">Selecciona un tema de la ruta de aprendizaje para comenzar.</p>
                            <div className="flex items-center justify-center pt-8 gap-2">
                                {guideFishImage && <Image src={guideFishImage.imageUrl} alt={guideFishImage.description} width={191} height={191} className="rounded-lg object-cover" data-ai-hint={guideFishImage.imageHint} />}
                            </div>
                        </CardContent>
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
                <div className="md:col-span-9">
                    <div className="mb-8">
                        <Link href="/kids/intro" className="hover:underline text-sm text-muted-foreground">
                            {t('kidsPage.backToKidsCourse')}
                        </Link>
                        <h1 className="text-4xl font-bold text-white dark:text-primary">{t('kidsPage.intro1AdventureTitle')}</h1>
                    </div>
                    {renderContent()}
                </div>
                <div className="md:col-span-3">
                    <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>{t('intro1Page.learningPath')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <nav>
                            <ul className="space-y-1">
                            {learningPath.map((item) => {
                                const Icon = item.icon;
                                const isLocked = item.status === 'locked';
                                const isSelected = selectedTopic === item.key;
                                return (
                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn(!isLocked || isAdmin ? "cursor-pointer" : "cursor-not-allowed")}>
                                        <div className={cn(
                                            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                            (!isLocked || isAdmin) && "hover:bg-muted",
                                            isSelected ? "bg-muted text-primary font-semibold" : (item.status === 'active' ? "text-foreground" : "text-muted-foreground"),
                                            item.status === 'completed' && "text-green-500 line-through"
                                        )}>
                                            {item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : isLocked && !isAdmin ? <Lock className="h-5 w-5 text-yellow-500" /> : <Icon className="h-5 w-5" />}
                                            <span>{item.name}</span>
                                        </div>
                                    </li>
                                );
                            })}
                            </ul>
                        </nav>
                        <div className="mt-6">
                            <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2">
                                <span>{t('intro1Page.progress')}</span>
                                <span className="font-bold text-foreground">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-4" />
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
      
    