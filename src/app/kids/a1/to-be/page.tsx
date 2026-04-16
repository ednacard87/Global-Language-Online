'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, BrainCircuit, CheckCircle, Lightbulb } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

// Reusing components and data
import { ToBeMemoryGame } from '@/components/kids/exercises/tobe-memory-game';
import { PossessivesMemoryGame } from '@/components/kids/exercises/possessives-memory-game';
import { TranslationExercise } from '@/components/dashboard/translation-exercise';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';

// Data for informational displays
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

const ICONS = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const progressStorageVersion = '_kids_a1_tobe_v2'; // Unique key for this lesson

export default function ToBePage() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [learningPath, setLearningPath] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');

  const { user } = useUser();
  const firestore = useFirestore();
  const studentDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'students', user.uid) : null),
    [firestore, user]
  );
  const { data: studentProfile } = useDoc<{role?: string, lessonProgress?: any}>(studentDocRef);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
  }, [user, studentProfile]);

  const initialLearningPath = useMemo((): Topic[] => {
    return [
        { key: 'tobe', name: t('kidsA1.toBe'), icon: GraduationCap, status: 'active' },
        { key: 'memory-tobe', name: t('kidsA1.memoryToBe'), icon: BrainCircuit, status: 'locked' },
        { key: 'tobe-1-grammar', name: t('kidsA1.toBe1Grammar'), icon: GraduationCap, status: 'locked' },
        { key: 'tobe-1-exercise', name: t('kidsA1.toBe1Exercise'), icon: PenSquare, status: 'locked' },
        { key: 'possessives', name: t('kidsA1.possessives'), icon: GraduationCap, status: 'locked' },
        { key: 'memory-possessives', name: t('kidsA1.memoryPossessives'), icon: BrainCircuit, status: 'locked' },
        { key: 'tobe-2-grammar', name: t('kidsA1.toBe2Grammar'), icon: GraduationCap, status: 'locked' },
        { key: 'tobe-2-exercise', name: t('kidsA1.toBe2Exercise'), icon: PenSquare, status: 'locked' },
        { key: 'tobe-3-grammar', name: t('kidsA1.toBe3Grammar'), icon: GraduationCap, status: 'locked' },
        { key: 'tobe-3-exercise', name: t('kidsA1.toBe3Exercise'), icon: PenSquare, status: 'locked' },
        { key: 'final-mixed', name: t('kidsA1.finalMixed'), icon: PenSquare, status: 'locked' },
    ];
  }, [t]);

  useEffect(() => {
    let pathIsLoadedFromProfile = false;
    let newPath: Topic[] = [...initialLearningPath];

    if (isAdmin) {
      newPath.forEach(item => { item.status = 'completed'; });
      pathIsLoadedFromProfile = true;
    } else if(studentProfile?.lessonProgress?.[progressStorageVersion]) {
        const savedStatuses = studentProfile.lessonProgress[progressStorageVersion];
        newPath.forEach(item => {
            if (savedStatuses[item.key]) {
                item.status = savedStatuses[item.key];
            }
        });
        pathIsLoadedFromProfile = true;
    }

    setLearningPath(newPath);

    if (pathIsLoadedFromProfile) {
        const firstActive = newPath.find(p => p.status === 'active');
        setSelectedTopic(firstActive?.key || newPath[0]?.key || '');
    }
  }, [isAdmin, initialLearningPath, studentProfile]);

  const progress = useMemo(() => {
    if (learningPath.length === 0) return 0;
    const completedTopics = learningPath.filter(t => t.status === 'completed').length;
    return Math.round((completedTopics / learningPath.length) * 100);
  }, [learningPath]);

  useEffect(() => {
    if (learningPath.length > 0 && !isAdmin && studentDocRef) {
        const statusesToSave: Record<string, any> = {};
        learningPath.forEach(item => {
            statusesToSave[item.key] = item.status;
        });
        updateDocumentNonBlocking(studentDocRef, {
            [`lessonProgress.${progressStorageVersion}`]: statusesToSave
        });
    }
    if (studentDocRef) {
        updateDocumentNonBlocking(studentDocRef, {
            'progress.progress_kids_a1_tobe': Math.round(progress)
        });
    }
    if (progress >= 100) {
      window.dispatchEvent(new CustomEvent('progressUpdated'));
    }
  }, [learningPath, isAdmin, progress, studentDocRef]);

  const handleTopicComplete = (topicKey: string) => {
    setLearningPath(currentPath => {
        const newPath = [...currentPath];
        const currentIndex = newPath.findIndex(t => t.key === topicKey);
        
        if (currentIndex === -1 || newPath[currentIndex].status === 'completed') {
            return currentPath;
        }

        newPath[currentIndex].status = 'completed';
        
        const nextTopicIndex = currentIndex + 1;
        if (nextTopicIndex < newPath.length && newPath[nextTopicIndex].status === 'locked') {
            newPath[nextTopicIndex].status = 'active';
            setSelectedTopic(newPath[nextTopicIndex].key);
            toast({
                title: "¡Siguiente tema desbloqueado!",
                description: "Puedes continuar con la aventura.",
            });
        }
        return newPath;
    });
  };

  const handleTopicSelect = (topicKey: string) => {
    const topic = learningPath.find(t => t.key === topicKey);

    if (topic?.status === 'locked' && !isAdmin) {
      toast({
        variant: "destructive",
        title: "Contenido Bloqueado",
        description: "Debes completar los pasos anteriores para desbloquear este tema.",
      });
      return;
    };
    
    setSelectedTopic(topicKey);

    const exerciseTopics = ['memory-tobe', 'tobe-1-exercise', 'memory-possessives', 'tobe-2-exercise', 'tobe-3-exercise', 'final-mixed'];
    if (!exerciseTopics.includes(topicKey)) {
        handleTopicComplete(topicKey);
    }
  };

  const renderContent = () => {
    const topic = learningPath.find(t => t.key === selectedTopic);

    switch (selectedTopic) {
        case 'tobe':
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader><CardTitle>Pronombres + To Be</CardTitle></CardHeader>
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
        case 'memory-tobe':
            return <ToBeMemoryGame onGameComplete={() => handleTopicComplete('memory-tobe')} />;
        case 'tobe-1-grammar':
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader><CardTitle>To be 1</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold mb-2">Estructura Verbo To be</h3>
                            <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> pronoun + to be + complement</p>
                                <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> pronoun + to be + not + complement</p>
                                <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> to be + pronoun + complement ?</p>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">Ejemplo: "ellos son estudiantes"</h3>
                            <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> They are students</p>
                                <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> They are not students</p>
                                <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> are they students?</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            );
        case 'tobe-1-exercise':
            return <TranslationExercise exerciseKey="exercises1" onComplete={() => handleTopicComplete('tobe-1-exercise')} />;
        case 'possessives':
             return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader><CardTitle>Posesivos</CardTitle></CardHeader>
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
        case 'memory-possessives':
            return <PossessivesMemoryGame onGameComplete={() => handleTopicComplete('memory-possessives')} />;
        case 'tobe-2-grammar':
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader><CardTitle>To be 2</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                         <div>
                            <h3 className="text-xl font-semibold mb-2">Estructura Verbo To be</h3>
                            <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> pronoun + To be + possessive + noun + complement</p>
                                <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> pronoun + To be + Not + possessive + noun + complement</p>
                                <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> To be + pronoun + possessive + noun + complement ?</p>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">Ejemplo: "Ellos son mis amigos"</h3>
                            <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> They are my friends</p>
                                <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> They are not my friends</p>
                                <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> are they my friends?</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            );
        case 'tobe-2-exercise':
             return <TranslationExercise exerciseKey="exercises2" onComplete={() => handleTopicComplete('tobe-2-exercise')} />;
        case 'tobe-3-grammar':
            return (
                 <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader><CardTitle>To be 3</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold mb-2">Estructura Verbo To be</h3>
                            <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> possessive + noun + to be + complement</p>
                                <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> possessive + noun + to be + Not + complement</p>
                                <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> To be + possessive + noun + complement ?</p>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">Ejemplo: "Mi mamá es una enfermera"</h3>
                            <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> My mother is a nurse</p>
                                <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> My mother is not a nurse</p>
                                <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> is my mother a nurse?</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            );
        case 'tobe-3-exercise':
            return <TranslationExercise exerciseKey="exercises3" onComplete={() => handleTopicComplete('tobe-3-exercise')} />;
        case 'final-mixed':
            return <SimpleTranslationExercise course="kids" exerciseKey="mixed1" onComplete={() => handleTopicComplete('final-mixed')} />;
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
    <div className="flex w-full flex-col min-h-screen a1-kids-bg">
      <DashboardHeader />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Link href="/kids" className="hover:underline text-sm text-muted-foreground">
                {t('kidsPage.backToKidsCourse')}
            </Link>
            <h1 className="text-4xl font-bold dark:text-primary">{t('kidsA1.toBe')}</h1>
          </div>
          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-9">
              {renderContent()}
            </div>
            <div className="md:col-span-3">
              <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple">
                <CardHeader><CardTitle>{t('a1class1.learningPath')}</CardTitle></CardHeader>
                <CardContent>
                  <nav>
                    <ul className="space-y-1">
                      {learningPath.map((item) => {
                        const Icon = ICONS[item.status];
                        return(
                            <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                              className={cn(
                                'flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                                item.status === 'locked' && !isAdmin ? 'cursor-not-allowed text-muted-foreground/50' : 'cursor-pointer hover:bg-muted',
                                selectedTopic === item.key && (item.status !== 'locked' || isAdmin) && 'bg-muted text-primary font-semibold'
                              )}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className="h-5 w-5" />
                                    <span>{item.name}</span>
                                </div>
                            </li>
                        );
                      })}
                    </ul>
                  </nav>
                   <div className="mt-6 pt-6 border-t">
                        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2">
                            <span>{t('intro1Page.progress')}</span>
                            <span className="font-bold text-foreground">{Math.round(progress)}%</span>
                        </div>
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
