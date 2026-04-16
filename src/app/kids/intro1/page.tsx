'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, Star, GraduationCap, Languages, BrainCircuit, CheckCircle, Lightbulb } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { SpellingExercise, type SpellingExerciseKey } from '@/components/dashboard/spelling-exercise';
import { getNumbersSpellingPathData, type SpellingPathItem } from '@/lib/course-data';
import { Progress } from "@/components/ui/progress";
import { TranslationExercise } from '@/components/dashboard/translation-exercise';
import { AlphabetGrid } from '@/components/kids/alphabet-grid';
import { NumbersGrid } from '@/components/kids/numbers-grid';
import { AbcMemoryGame } from '@/components/kids/exercises/abc-memory-game';
import { NumbersMemoryGame } from '@/components/kids/exercises/numbers-memory-game';
import { ToBeMemoryGame } from '@/components/kids/exercises/tobe-memory-game';
import { AbcPronunciationExercise } from '@/components/kids/exercises/abc-pronunciation-exercise';
import { PossessivesMemoryGame } from '@/components/kids/exercises/possessives-memory-game';
import { DashboardHeader } from '@/components/dashboard/header';

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

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
};

const ICONS = { locked: Lock, active: BookOpen, completed: CheckCircle };
const progressStorageVersion = "kids_intro1_path_v2";

const initialLearningPathData: Omit<Topic, 'status'>[] = [
    { key: 'abc', name: 'ABC', icon: BookOpen },
    { key: 'abc-exercise', name: 'Ejercicio de ABC', icon: PenSquare },
    { key: 'abc-memory', name: 'Memory (ABC)', icon: BrainCircuit },
    { key: 'numbers', name: 'Numeros', icon: GraduationCap },
    { key: 'memory1', name: 'Memory (Numeros)', icon: BrainCircuit },
    { key: 'numbers-exercise', name: 'Ejercicios de Numeros', icon: PenSquare },
    { key: 'tobe', name: 'Pronombres + To be', icon: Languages },
    { key: 'memory2', name: 'Memory (To be)', icon: BrainCircuit },
    { key: 'tobe-exercise', name: 'To be 1', icon: PenSquare },
    { key: 'tobe-exercise-1', name: 'Ejercicio To be 1', icon: PenSquare },
    { key: 'possessives', name: 'Posesivos', icon: Star },
    { key: 'memory-possessives', name: 'Memory (posesivos)', icon: BrainCircuit },
];

export default function KidsIntro1Page() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedTopic, setSelectedTopic] = useState<string>('abc');
  const [highlightedLetter, setHighlightedLetter] = useState<string | null>(null);
  const [highlightedNumber, setHighlightedNumber] = useState<string | null>(null);

  const [numbersSpellingPath, setNumbersSpellingPath] = useState<SpellingPathItem[]>([]);
  const [selectedSpellingTopic, setSelectedSpellingTopic] = useState<SpellingExerciseKey | null>(null);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [topicToComplete, setTopicToComplete] = useState<string | null>(null);

  const { user } = useUser();
  const firestore = useFirestore();

  const studentDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'students', user.uid) : null),
    [firestore, user]
  );
  const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: 'admin' | 'student', lessonProgress?: any}>(studentDocRef);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
  }, [user, studentProfile]);

  const [learningPath, setLearningPath] = useState<Topic[]>(
    initialLearningPathData.map((item, index) => ({
      ...item,
      status: index === 0 ? 'active' : 'locked',
    }))
  );

  const [previousPath, setPreviousPath] = useState<Topic[] | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || isProfileLoading) return;

    let path = initialLearningPathData.map((item, index) => ({
      ...item,
      status: index === 0 ? 'active' : 'locked',
    }));

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

    const fullNumbersPath = getNumbersSpellingPathData(t);
    const simplifiedNumbersPath = fullNumbersPath.filter(
        item => item.key === 'numbers1' || item.key === 'numbers2'
    );
    setNumbersSpellingPath(isAdmin ? simplifiedNumbersPath.map(i => ({...i, status: 'active'})) : simplifiedNumbersPath);
  }, [isAdmin, t, isClient, studentProfile, isProfileLoading]);
  
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
    if (previousPath) {
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
  }, [learningPath, previousPath, toast]);

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

  const handleTopicSelect = (topicKey: string) => {
    const topic = learningPath.find(t => t.key === topicKey);
    if (topic?.status === 'locked' && !isAdmin) {
        return;
    }
    
    setSelectedTopic(topicKey);
    setShowCongratulations(false);

    if(topicKey === 'numbers-exercise' && !selectedSpellingTopic) {
        setSelectedSpellingTopic('numbers1');
    }

    const isSimpleView = ['abc', 'numbers', 'tobe', 'possessives', 'tobe-exercise'].includes(topicKey);
    if (isSimpleView) {
        setTopicToComplete(topicKey);
    }
  };

  const renderContent = () => {
    const topic = learningPath.find(t => t.key === selectedTopic);
    
    switch (selectedTopic) {
        case 'abc':
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>ABC</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AlphabetGrid 
                            highlightedItem={highlightedLetter}
                            onHighlight={setHighlightedLetter}
                        />
                    </CardContent>
                </Card>
            );
        case 'abc-memory':
            return <AbcMemoryGame onGameComplete={() => setTopicToComplete('abc-memory')} />;
        case 'abc-exercise':
            return <AbcPronunciationExercise onGameComplete={() => setTopicToComplete('abc-exercise')} />;
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
                                            {numbersSpellingPath.map((item) => {
                                                const Icon = ICONS[item.status as keyof typeof ICONS];
                                                const isLocked = item.status === 'locked';
                                                const isSelected = selectedSpellingTopic === item.key;
                                                const isActive = item.status === 'active';
                                                return (
                                                    <li key={item.key} onClick={() => handleSpellingTopicSelect(item.key as SpellingExerciseKey)} className={cn(!isLocked || isAdmin ? "cursor-pointer" : "cursor-not-allowed")}>
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
        case 'numbers':
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>Numeros</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <NumbersGrid 
                            highlightedItem={highlightedNumber}
                            onHighlight={setHighlightedNumber}
                        />
                    </CardContent>
                </Card>
            );
        case 'tobe':
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>Pronombres + To be</CardTitle>
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
                        <CardTitle>To be 1</CardTitle>
                        <CardDescription className="pt-2 text-lg font-semibold flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-yellow-400 animate-pulse" />
                            <span className="bg-gradient-to-r from-brand-purple to-brand-teal text-transparent bg-clip-text">
                                {t('intro1Page.verbtobeStructureHint')}
                            </span>
                        </CardDescription>
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
                            <h3 className="text-xl font-semibold mb-2">{t('intro1Page.shortAnswersTitle')}</h3>
                            <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                <p><span className="font-bold text-lg text-green-500 mr-2">(+A)</span> Yes, pronoun + to be</p>
                                <p><span className="font-bold text-lg text-red-500 mr-2">(-A)</span> No, pronoun + to be + not</p>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">{t('intro1Page.exampleTitle')}</h3>
                            <p className="text-lg italic text-muted-foreground mb-2">"ellos son estudiantes"</p>
                            <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> They are students</p>
                                <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> They are not students</p>
                                <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> are they students?</p>
                                <div className="border-t my-2 border-border/50" />
                                <p><span className="font-bold text-lg text-green-500 mr-2">(+A)</span> Yes, they are</p>
                                <p><span className="font-bold text-lg text-red-500 mr-2">(-A)</span> No, they are not</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            );
        case 'tobe-exercise-1':
            return <TranslationExercise exerciseKey="exercises1" onComplete={() => setTopicToComplete('tobe-exercise-1')} />;
        case 'possessives':
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>Posesivos</CardTitle>
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
              <Card className="shadow-soft rounded-lg border-2 border-brand-purple min-h-[500px]">
                <CardHeader>
                  <CardTitle>{topic?.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Contenido para {topic?.name} vendrá aquí.</p>
                </CardContent>
              </Card>
            );
    }
  };

  return (
    <div className="flex w-full flex-col min-h-screen">
      <DashboardHeader />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Link href="/intro" className="hover:underline text-sm text-muted-foreground">
              {t('kidsPage.backToKidsCourse')}
            </Link>
            <h1 className="text-4xl font-bold dark:text-primary">{t('kidsPage.intro1AdventureTitle')}</h1>
          </div>
          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-3">
              <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple">
                <CardHeader><CardTitle>Aventura</CardTitle></CardHeader>
                <CardContent>
                  <nav>
                    <ul className="space-y-1">
                      {learningPath.map((item) => {
                        const isLocked = item.status === 'locked';
                        const isSelected = selectedTopic === item.key;
                        const StatusIcon = ICONS[item.status];
                        return(
                            <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                              className={cn(
                                'flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                                isLocked && !isAdmin ? 'cursor-not-allowed text-muted-foreground/50' : 'cursor-pointer hover:bg-muted',
                                isSelected && (!isLocked || isAdmin) && 'bg-muted text-primary font-semibold'
                              )}
                            >
                                <div className="flex items-center gap-3">
                                    <StatusIcon className="h-5 w-5" />
                                    <span>{item.name}</span>
                                </div>
                            </li>
                        );
                      })}
                    </ul>
                  </nav>
                  <div className="mt-6 pt-6 border-t">
                      <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2">
                          <span>Progreso de la Aventura</span>
                          <span className="font-bold text-foreground">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-4" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-9">
              {renderContent()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
