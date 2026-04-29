'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  PenSquare,
  Lock,
  GraduationCap,
  Languages,
  BrainCircuit,
  CheckCircle,
  Lightbulb,
  Clock,
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { SpellingExercise, type SpellingExerciseKey } from '@/components/dashboard/spelling-exercise';
import { TranslationExercise } from '@/components/dashboard/translation-exercise';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useTranslation } from '@/context/language-context';
import { getIntro1PathData, getAbcSpellingPathData, getNumbersSpellingPathData, type SpellingPathItem } from '@/lib/course-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AlphabetGrid } from '@/components/kids/alphabet-grid';
import { NumbersGrid } from '@/components/kids/numbers-grid';
import { AbcMemoryGame } from '@/components/kids/exercises/abc-memory-game';
import { NumbersMemoryGame } from '@/components/kids/exercises/numbers-memory-game';
import { ToBeMemoryGame } from '@/components/kids/exercises/tobe-memory-game';
import { AbcPronunciationExercise } from '@/components/kids/exercises/abc-pronunciation-exercise';
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

const demonstrativesData = [
    { english: 'This', spanish: 'Este - Esta', usage: 'Singular, cerca' },
    { english: 'These', spanish: 'Estos - Estas', usage: 'Plural, cerca' },
    { english: 'That', spanish: 'Ese - Esa', usage: 'Singular, lejos' },
    { english: 'Those', spanish: 'Esos - Esas', usage: 'Plural, lejos' },
];

type Topic = {
    key: string;
    name: string;
    icon: React.ElementType;
    status: 'locked' | 'active' | 'completed';
};

const ICONS = { locked: Lock, active: BookOpen, completed: CheckCircle };
const progressStorageVersion = "kids_intro1_path_v2";

interface Student {
    role?: 'admin' | 'student';
    lessonProgress?: any;
    progress?: Record<string, number>;
}


export default function KidsIntro1Page() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedTopic, setSelectedTopic] = useState<string>('abc');
  const [selectedTopicKey, setSelectedTopicKey] = useState<string | null>(null);
  const [highlightedLetter, setHighlightedLetter] = useState<string | null>(null);
  const [highlightedNumber, setHighlightedNumber] = useState<string | null>(null);

  const [numbersSpellingPath, setNumbersSpellingPath] = useState<SpellingPathItem[]>([]);
  const [selectedSpellingTopic, setSelectedSpellingTopic] = useState<SpellingExerciseKey | null>(null);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [topicToComplete, setTopicToComplete] = useState<string | null>(null);

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

  const [learningPath, setLearningPath] = useState<Topic[]>([]);

  const initialLearningPathData = useMemo(() => getIntro1PathData(t), [t]);

  const [previousPath, setPreviousPath] = useState<Topic[] | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || isProfileLoading) return;

    let path = initialLearningPathData.map((item, index) => ({
      ...item,
      status: index === 0 ? 'active' : 'locked',
    })) as Topic[];

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
    setSelectedTopic(firstActive?.name || path[0].name);
    setSelectedTopicKey(firstActive?.key || path[0].key);

    const fullNumbersPath = getNumbersSpellingPathData(t);
    const simplifiedNumbersPath = fullNumbersPath.filter(
        item => item.key === 'numbers1' || item.key === 'numbers2'
    );
    setNumbersSpellingPath(isAdmin ? simplifiedNumbersPath.map(i => ({...i, status: 'active'})) : simplifiedNumbersPath);
  }, [isAdmin, t, isClient, studentProfile, isProfileLoading, initialLearningPathData]);
  
  const progress = useMemo(() => {
    const completedCount = learningPath.filter(t => t.status === 'completed').length;
    return Math.round((completedCount / learningPath.length) * 100);
  }, [learningPath]);

  useEffect(() => {
    if (!isClient || isProfileLoading) return;
    
    if (!isAdmin && studentDocRef && learningPath.length > 0) {
        const statuses = learningPath.reduce((acc, item) => {
            acc[item.key] = item.status;
            return acc;
        }, {} as Record<string, Topic['status']>);
        updateDocumentNonBlocking(studentDocRef, {
            [`lessonProgress.${progressStorageVersion}`]: statuses
        });
    }
    
    if (studentDocRef) {
        updateDocumentNonBlocking(studentDocRef, {
            'progress.kidsIntro1Progress': progress
        });
    }

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

      if (currentIndex === -1 || newPath[currentIndex].status === 'completed') {
        return currentPath;
      }

      newPath[currentIndex].status = 'completed';

      if (currentIndex + 1 < newPath.length && newPath[currentIndex + 1].status === 'locked') {
        newPath[currentIndex + 1].status = 'active';
      }

      return newPath;
    });

    setTopicToComplete(null);
  }, [topicToComplete]);

  const handleSpellingTopicSelect = (topicKey: SpellingExerciseKey) => {
      const path = numbersSpellingPath;
      const currentItem = path.find(item => item.key === topicKey);

      if (isAdmin || (currentItem && currentItem.status !== 'locked')) {
          setShowCongratulations(false);
          setSelectedSpellingTopic(topicKey);
      }
  };

  const handleSpellingTopicComplete = (completedTopicKey: SpellingExerciseKey) => {
      setShowCongratulations(true);

      const newSubPath = [...numbersSpellingPath];
      const currentItemIndex = newSubPath.findIndex(item => item.key === completedTopicKey);
      
      if (currentItemIndex !== -1 && newSubPath[currentItemIndex].status !== 'completed') {
          newSubPath[currentItemIndex].status = 'completed';

          const nextSubItemIndex = currentItemIndex + 1;
          if (nextSubItemIndex < newSubPath.length && newSubPath[nextSubItemIndex].status === 'locked') {
              newSubPath[nextSubItemIndex].status = 'active';
          }
          setNumbersSpellingPath(newSubPath);

          const allSubTopicsCompleted = newSubPath.every(item => item.status === 'completed');
          if (allSubTopicsCompleted) {
              setTopicToComplete('numbers-exercise');
          }
      }
  };

  const handleTopicSelect = (topicName: string) => {
    const currentItem = learningPath.find(item => item.name === topicName);
    if (!isAdmin && (!currentItem || currentItem.status === 'locked')) return;

    setSelectedTopic(topicName);
    setSelectedTopicKey(currentItem!.key);
    setShowCongratulations(false);

    if (currentItem!.key === 'numbers-exercise' && !selectedSpellingTopic) {
        setSelectedSpellingTopic('numbers1');
    }

    const viewOnlyTopics = ['abc', 'numbers', 'tobe', 'possessives', 'tobe-exercise', 'demonstratives'];
    if (viewOnlyTopics.includes(currentItem!.key)) {
        setTopicToComplete(currentItem!.key);
    }
  };

  const renderContent = () => {
    switch (selectedTopicKey) {
        case 'abc':
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader><CardTitle>{t('intro1Page.abc')}</CardTitle></CardHeader>
                    <CardContent>
                        <AlphabetGrid 
                            highlightedItem={highlightedLetter}
                            onHighlight={setHighlightedLetter}
                        />
                    </CardContent>
                </Card>
            );
        case 'abc-exercise':
            return <AbcPronunciationExercise onGameComplete={() => setTopicToComplete('abc-exercise')} />;
        case 'abc-memory':
            return <AbcMemoryGame onGameComplete={() => setTopicToComplete('abc-memory')} />;
        case 'numbers':
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader><CardTitle>{t('intro1Page.numbers')}</CardTitle></CardHeader>
                    <CardContent>
                        <NumbersGrid 
                            highlightedItem={highlightedNumber}
                            onHighlight={setHighlightedNumber}
                        />
                    </CardContent>
                </Card>
            );
        case 'memory1':
             return <NumbersMemoryGame onGameComplete={() => setTopicToComplete('memory1')} />;
        case 'numbers-exercise':
            return (
                <div className="grid gap-8 md:grid-cols-12">
                    <div className="md:col-span-4">
                        <div className="sticky top-24 space-y-4">
                            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                                <CardHeader>
                                    <CardTitle>{t('spellingExercise.numbersspelling')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <nav>
                                        <ul className="space-y-1">
                                            {numbersSpellingPath.map((item, index) => {
                                                const Icon = ICONS[item.status as keyof typeof ICONS];
                                                const isLocked = item.status === 'locked';
                                                const isSelected = selectedSpellingTopic === item.key;
                                                const isActive = item.status === 'active';
                                                return (
                                                    <li key={index} onClick={() => handleSpellingTopicSelect(item.key as SpellingExerciseKey)} className={cn(!isLocked || isAdmin ? "cursor-pointer" : "cursor-not-allowed")}>
                                                        <div className={cn(
                                                            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                                            (!isLocked || isAdmin) && "hover:bg-muted",
                                                            isSelected ? "bg-muted text-primary font-semibold" : (isActive ? "text-foreground" : "text-muted-foreground"),
                                                        )}>
                                                            <Icon className={cn("h-5 w-5", isLocked && !isAdmin ? "text-yellow-500" : (item.status === 'completed' || isSelected || isActive) ? "text-primary" : "text-muted-foreground")} />
                                                            <span>{item.name}</span>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </nav>
                                </CardContent>
                            </Card>
                            <Card className="shadow-soft rounded-lg flex items-center gap-2 cursor-pointer hover:opacity-80 animate-pulse-glow border-2 border-brand-purple p-4 mt-4" onClick={() => handleTopicSelect(t('intro1Page.numbers'))}>
                                <Lightbulb className="h-5 w-5 text-yellow-400 animate-pulse flex-shrink-0" />
                                <p className="text-base font-semibold bg-gradient-to-r from-brand-purple to-brand-teal text-transparent bg-clip-text">
                                    {t('intro1Page.backToNumbersHint')}
                                </p>
                            </Card>
                        </div>
                    </div>
                    <div className="md:col-span-8">
                        {showCongratulations && (
                            <div className="text-center py-8 mt-4">
                                <h2 className="text-5xl font-bold bg-gradient-to-r from-brand-purple to-brand-teal text-transparent bg-clip-text animate-pulse">
                                    {t('intro1Page.congratulations')}
                                </h2>
                                <p className="text-xl mt-4 text-muted-foreground">{t('intro1Page.exerciseComplete')}</p>
                            </div>
                        )}
                        {selectedSpellingTopic && !showCongratulations ? (
                            <SpellingExercise
                                exerciseKey={selectedSpellingTopic}
                                onComplete={handleSpellingTopicComplete}
                            />
                        ) : null}
                    </div>
                </div>
            );
        case 'tobe':
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>{t('intro1Page.pronouns')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-lg">
                            <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.ser')}</div>
                            <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.tobe')}</div>
                            <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.estar')}</div>
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
        case 'memory2':
            return <ToBeMemoryGame onGameComplete={() => setTopicToComplete('memory2')} />;
        case 'tobe-exercise':
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>{t('intro1Page.verbtobe1')}</CardTitle>
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
                        <div>
                            <h3 className="text-xl font-semibold mb-2">{t('intro1Page.exampleTitle')}</h3>
                            <p className="text-lg italic text-muted-foreground mb-2">"ellos son estudiantes"</p>
                            <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> They are students</p>
                                <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> They are not students</p>
                                <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> are they students?</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            );
        case 'tobe-exercise-1':
            return <TranslationExercise exerciseKey="exercises1" onComplete={() => setTopicToComplete('tobe-exercise-1')} formType="full" />;
        case 'possessives':
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>{t('intro1Page.possessives')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                            <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.english')}</div>
                            <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.spanish')}</div>
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
        case 'memory-possessives':
            return <PossessivesMemoryGame onGameComplete={() => setTopicToComplete('memory-possessives')} />;
        default:
            return (
                <div className="flex flex-col items-center">
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader className="text-center">
                            <CardTitle className="text-3xl">{t('intro1Page.welcomeTitle')}</CardTitle>
                            <CardDescription className="text-base">{t('intro1Page.welcomeDescription')}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center px-6 pb-6">
                            <p className="pt-4 text-lg">{t('intro1Page.welcomeHint')}</p>
                        </CardContent>
                    </Card>
                    <div className="flex items-center justify-center pt-8 gap-2">
                        <div className="relative bg-card p-4 rounded-lg shadow-soft text-center text-base max-w-[220px] border-2 border-brand-purple">
                            <p className="font-bold text-lg bg-gradient-to-r from-brand-purple to-brand-teal text-transparent bg-clip-text">{t('intro1Page.penguinHint')}</p>
                            <div className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-card" />
                        </div>
                        {guideFishImage && <Image
                            src={guideFishImage.imageUrl}
                            alt={guideFishImage.description}
                            width={191}
                            height={191}
                            className="rounded-lg object-cover"
                            data-ai-hint={guideFishImage.imageHint}
                        />}
                    </div>
                </div>
            );
    }
  };

  return (
    <div className="flex w-full flex-col min-h-screen">
      <DashboardHeader />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
            <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-9">
                <div className="mb-8">
                    <Link href="/kids/intro" className="hover:underline text-sm text-muted-foreground">
                        {t('kidsPage.backToKidsCourse')}
                    </Link>
                    <h1 className="text-4xl font-bold dark:text-primary">{t('kidsPage.intro1AdventureTitle')}</h1>
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
                            const isSelected = selectedTopic === item.name;
                            const isActive = item.status === 'active';
                            
                            return (
                                <li key={item.key} onClick={() => handleTopicSelect(item.name)} className={cn(!isLocked || isAdmin ? "cursor-pointer" : "cursor-not-allowed")}>
                                    <div className={cn(
                                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                        (!isLocked || isAdmin) && "hover:bg-muted",
                                        isSelected ? "bg-muted text-primary font-semibold" : (isActive ? "text-foreground" : "text-muted-foreground"),
                                    )}>
                                        <Icon className={cn("h-5 w-5", isLocked && !isAdmin ? "text-yellow-500" : (item.status === 'completed' || isSelected || isActive) ? "text-primary" : "text-muted-foreground")} />
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
