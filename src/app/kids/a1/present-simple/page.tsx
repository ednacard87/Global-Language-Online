
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, Ear, BrainCircuit, CheckCircle } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

import { VerbVocabularyExercise, verbVocabularyData } from '@/components/kids/exercises/verb-vocabulary';
import { VerbMemoryGame } from '@/components/kids/exercises/verb-memory-game';
import { FillInTheBlanksExercise } from '@/components/kids/exercises/fill-in-the-blanks';
import { PresentSimpleExercise, presentSimpleExercises, presentSimpleExercises2 } from '@/components/kids/exercises/present-simple';
import { SingleFormExercise, positiveExercisesData, negativeExercisesData, interrogativeExercisesData } from '@/components/kids/exercises/single-form';
import { ReadingComprehensionExercise } from '@/components/kids/exercises/reading-comprehension';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
  subItems?: { key: string; name: string; status: 'locked' | 'active' | 'completed' }[];
};

const ICONS = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const progressStorageVersion = '_kids_a1_presentsimple_v4';

export default function PresentSimplePage() {
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
    const pathData: Omit<Topic, 'status' | 'subItems'>[] = [
        { key: 'verbs', name: t('kidsA1Class2.verbs'), icon: BookOpen },
        { key: 'memory-verbs', name: t('kidsA1Class2.memoryVerbs'), icon: BrainCircuit },
        { key: 'vocab-verbs', name: t('kidsA1Class2.vocabVerbs'), icon: BookOpen },
        { key: 'grammar', name: t('kidsA1Class2.grammar'), icon: GraduationCap },
        { key: 'exercises', name: t('kidsA1Class2.exercises'), icon: PenSquare },
        { key: 'reading', name: t('kidsA1Class2.reading'), icon: BookOpen },
        { key: 'ex-mixed-2', name: t('kidsA1Class2.exercisesMixed2'), icon: PenSquare },
        { key: 'listening', name: t('kidsA1Class2.listening'), icon: Ear },
        { key: 'final-vocab', name: t('kidsA1Class2.finalVocab'), icon: BookOpen },
    ];
    
    const path: Topic[] = pathData.map((item, index) => ({
        ...item,
        status: index === 0 ? 'active' : 'locked'
    }));

    const exercisesIndex = path.findIndex(p => p.key === 'exercises');
    if (exercisesIndex !== -1) {
        path[exercisesIndex].subItems = [
            { key: 'ex-positive', name: t('kidsA1Class2.exercisesPositive'), status: 'locked' },
            { key: 'ex-negative', name: t('kidsA1Class2.exercisesNegative'), status: 'locked' },
            { key: 'ex-interrogative', name: t('kidsA1Class2.exercisesInterrogative'), status: 'locked' },
            { key: 'ex-mixed', name: t('kidsA1Class2.exercisesMixed'), status: 'locked' }
        ].map(sub => ({...sub, status: 'locked'}));
    }
    return path;
}, [t]);

  useEffect(() => {
    let newPath: Topic[] = initialLearningPath.map(topic => ({
      ...topic,
      subItems: topic.subItems ? topic.subItems.map(sub => ({...sub, status: 'locked'})) : undefined,
    }));

    if (isAdmin) {
      newPath.forEach(item => {
        item.status = 'completed';
        if (item.subItems) {
            item.subItems.forEach(sub => sub.status = 'completed');
        }
      });
    } else if(studentProfile?.lessonProgress?.[progressStorageVersion]) {
        const savedStatuses = studentProfile.lessonProgress[progressStorageVersion];
        newPath.forEach(item => {
            if (savedStatuses[item.key]) {
                item.status = savedStatuses[item.key];
            }
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
    if (!selectedTopic) {
        const firstActive = newPath.find(p => p.status === 'active') || newPath.flatMap(p => p.subItems || []).find(sp => sp?.status === 'active');
        setSelectedTopic(firstActive?.key || newPath[0]?.key || '');
    }
  }, [isAdmin, initialLearningPath, selectedTopic, studentProfile]);
  
  const progress = useMemo(() => {
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

    return totalTopics > 0 ? (completedTopics/totalTopics) * 100 : 0;
  }, [learningPath]);


  useEffect(() => {
    if (learningPath.length > 0 && !isAdmin && studentDocRef) {
        const statusesToSave: Record<string, any> = {};
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
            [`lessonProgress.${progressStorageVersion}`]: statusesToSave
        });
    }
    if (studentDocRef) {
        updateDocumentNonBlocking(studentDocRef, {
            'progress.progress_kids_a1_presentsimple': Math.round(progress)
        });
    }

    if (progress >= 100) {
      window.dispatchEvent(new CustomEvent('progressUpdated'));
    }
}, [learningPath, isAdmin, progress, studentDocRef]);

  const handleTopicComplete = (topicKey: string) => {
    setLearningPath(currentPath => {
        const newPath = currentPath.map(topic => ({
            ...topic,
            subItems: topic.subItems ? topic.subItems.map(sub => ({ ...sub })) : undefined
        }));

        let nextTopicKey: string | null = null;
        let topicFound = false;
        let wasTopicUnlocked = false;

        for (let i = 0; i < newPath.length && !topicFound; i++) {
            const currentTopic = newPath[i];
            
            if (currentTopic.key === topicKey) {
                if (currentTopic.status !== 'completed') {
                    currentTopic.status = 'completed';
                }
                if (i + 1 < newPath.length && newPath[i+1].status === 'locked') {
                    newPath[i+1].status = 'active';
                    nextTopicKey = newPath[i+1].key;
                    wasTopicUnlocked = true;
                }
                topicFound = true;
            } else if (currentTopic.subItems) {
                const subItemIndex = currentTopic.subItems.findIndex(sub => sub.key === topicKey);
                if (subItemIndex !== -1) {
                    if (currentTopic.subItems[subItemIndex].status !== 'completed') {
                        currentTopic.subItems[subItemIndex].status = 'completed';
                    }
                    
                    const nextSubItemIndex = subItemIndex + 1;
                    if (nextSubItemIndex < currentTopic.subItems.length && currentTopic.subItems[nextSubItemIndex].status === 'locked') {
                        currentTopic.subItems[nextSubItemIndex].status = 'active';
                        nextTopicKey = currentTopic.subItems[nextSubItemIndex].key;
                        wasTopicUnlocked = true;
                    } else if (currentTopic.subItems.every(sub => sub.status === 'completed')) {
                        if (currentTopic.status !== 'completed') {
                            currentTopic.status = 'completed';
                        }
                        if (i + 1 < newPath.length && newPath[i+1].status === 'locked') {
                            newPath[i+1].status = 'active';
                            nextTopicKey = newPath[i+1].key;
                            wasTopicUnlocked = true;
                        }
                    }
                    topicFound = true;
                }
            }
        }
        
        if (nextTopicKey) {
            setSelectedTopic(nextTopicKey);
        }
        
        if (wasTopicUnlocked) {
            toast({
                title: "¡Siguiente tema desbloqueado!",
                description: "Puedes continuar con la aventura.",
            });
        }
        return newPath;
    });
  };

  const handleTopicSelect = (topicKey: string) => {
    const mainTopic = learningPath.find(t => t.key === topicKey);
    const subTopicParent = learningPath.find(t => t.subItems?.some(st => st.key === topicKey));
    const subTopic = subTopicParent?.subItems?.find(st => st.key === topicKey);

    const topicStatus = mainTopic?.status ?? subTopic?.status ?? 'locked';
    
    if (topicStatus === 'locked' && !isAdmin) {
      toast({
        variant: "destructive",
        title: "Contenido Bloqueado",
        description: "Debes completar los pasos anteriores para desbloquear este tema.",
      });
      return;
    };
    
    setSelectedTopic(topicKey);

    const exerciseTopics = ['memory-verbs', 'vocab-verbs', 'final-vocab', 'ex-positive', 'ex-negative', 'ex-interrogative', 'ex-mixed', 'ex-mixed-2', 'reading', 'listening'];
    if (!exerciseTopics.includes(topicKey)) {
        handleTopicComplete(topicKey);
    }
  };

  const renderContent = () => {
    const topic = learningPath.find(t => t.key === selectedTopic) || learningPath.flatMap(t => t.subItems || []).find(st => st?.key === selectedTopic);

    if (selectedTopic === 'verbs') {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardHeader>
                    <CardTitle>{t('kidsA1Class2.verbs')}</CardTitle>
                    <CardDescription>{t('kidsA1Class2.verbsDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="max-w-md mx-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-2 text-left">{t('common.spanish')}</th>
                                    <th className="p-2 text-left">{t('common.english')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {verbVocabularyData.map((verb, index) => (
                                    <tr key={index} className="border-b">
                                        <td className="p-2 font-medium">{verb.spanish}</td>
                                        <td className="p-2">{verb.english}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (selectedTopic === 'memory-verbs') {
        return <VerbMemoryGame onComplete={() => handleTopicComplete('memory-verbs')} />;
    }

    if (selectedTopic === 'vocab-verbs') {
        return <FillInTheBlanksExercise onComplete={() => handleTopicComplete('vocab-verbs')} />;
    }

    if (selectedTopic === 'final-vocab') {
        return <VerbVocabularyExercise onComplete={() => handleTopicComplete('final-vocab')} />;
    }

    if (selectedTopic === 'grammar') {
        return (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-center">PRESENT SIMPLE</h2>

                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>ESTRUCTURA</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 font-mono text-base">
                        <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> = Afirmativa</p>
                        <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> = Negativa</p>
                        <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> = interrogativa ?</p>
                        <div className="border-t my-2" />
                        <p className="font-sans font-semibold pt-2">Short Answers = Respuestas Cortas</p>
                        <p><span className="font-bold text-lg text-green-500 mr-2">(+A)</span> = Respuesta corta positiva</p>
                        <p><span className="font-bold text-lg text-red-500 mr-2">(-A)</span> =  Respuesta corta Negativa</p>
                    </CardContent>
                </Card>

                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>ESTRUCTURA DO/DOES</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                            <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> pronoun + verb + Complement</p>
                            <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> pronoun + Do/Does + Not +verb + Complement</p>
                            <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> Do/Does + pronoun + verb + Complement ?</p>
                        </div>
                         <div>
                            <h3 className="text-xl font-semibold mb-2">Short Answers = Respuestas Cortas</h3>
                            <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                <p><span className="font-bold text-lg text-green-500 mr-2">(+A)</span> Yes, pronoun + Do/Does</p>
                                <p><span className="font-bold text-lg text-red-500 mr-2">(-A)</span> No, pronoun + Do/Does + Not</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                 <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>Conjugaciones</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 font-mono text-lg text-center">
                        <p className="p-2 bg-muted rounded-md"><span className="font-bold">DO</span> = I - YOU - WE - THEY</p>
                        <p className="p-2 bg-muted rounded-md"><span className="font-bold">DOES</span> = HE - SHE - IT</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (selectedTopic === 'reading') {
        return <ReadingComprehensionExercise onComplete={() => handleTopicComplete('reading')} />;
    }

    if (selectedTopic === 'grammar-2') {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardHeader>
                    <CardTitle>FORMACION DE LA TERCERA PERSONA SINGULAR AFIRMATIVA (HE/SHE/IT) EN EL PRESENTE SIMPLE</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-lg">
                    <div>
                        <h4 className="font-semibold text-xl">Regla General</h4>
                        <p className="p-3 bg-muted rounded-lg font-mono mt-2">(+) he, she, it + verb + "s"</p>
                        <p className="text-base text-muted-foreground mt-1">
                            Example: <span className="font-semibold">she works</span>, <span className="font-semibold">he cooks</span>
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-xl">Verbos terminados en = (O, sh, ss, ch, x, z )</h4>
                        <p className="p-3 bg-muted rounded-lg font-mono mt-2">se le agrega: "ES"</p>
                        <p className="text-base text-muted-foreground mt-1">
                            Example: <span className="font-semibold">she goes</span>
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-xl">Verbos terminados en "Y"</h4>
                        <div className="mt-2 space-y-4">
                            <div>
                                <h5 className="font-medium">Consonante + "y"</h5>
                                <p className="p-3 bg-muted rounded-lg font-mono mt-1">elimino la "y" y agrego = "ies"</p>
                                <p className="text-base text-muted-foreground mt-1">
                                    Example: <span className="font-semibold">he studies</span>
                                </p>
                            </div>
                            <div>
                                <h5 className="font-medium">Vocal + "y"</h5>
                                <p className="p-3 bg-muted rounded-lg font-mono mt-1">agrego = "s"</p>
                                <p className="text-base text-muted-foreground mt-1">
                                    Example: <span className="font-semibold">she plays</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="border-t pt-4 mt-4">
                        <h4 className="font-bold text-destructive text-xl">NOTA:</h4>
                        <p className="text-muted-foreground text-lg">
                            Esto solo se utiliza en oraciones afirmativas <span className="font-mono text-xl text-green-500 font-bold">(+)</span>.
                        </p>
                        <p className="text-muted-foreground text-lg mt-2">
                            En oraciones negativas <span className="font-mono text-xl text-red-500 font-bold">(-)</span> e interrogativas <span className="font-mono text-xl text-blue-500 font-bold">(?)</span>, el verbo no cambia.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (selectedTopic === 'listening') {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardHeader>
                    <CardTitle>{t('kidsA1Class2.listening')}</CardTitle>
                    <CardDescription>Escucha la frase y escríbela.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-4">
                     <p className="text-muted-foreground text-center">
                        Haz clic en el siguiente enlace para ir a tu ejercicio de escucha y escritura.
                     </p>
                    <Button asChild>
                        <Link href="https://dailydictation.com/exercises/short-stories/5-my-house.8/listen-and-type" target="_blank" rel="noopener noreferrer">
                            Ir al ejercicio de Daily Dictation
                        </Link>
                    </Button>
                </CardContent>
                <CardFooter className="justify-center">
                    <Button onClick={() => handleTopicComplete('listening')}>He completado el ejercicio</Button>
                </CardFooter>
            </Card>
        );
    }

    if (selectedTopic.startsWith('ex-')) {
        if (selectedTopic === 'ex-positive') {
            return <SingleFormExercise
                        onComplete={() => handleTopicComplete('ex-positive')}
                        exerciseData={positiveExercisesData}
                        title={t('kidsA1Class2.exercisePositive')}
                        description={t('kidsA1Class2.exercisePositiveDescription')}
                        formType="affirmative"
                    />;
        }
        if (selectedTopic === 'ex-negative') {
             return <SingleFormExercise
                        onComplete={() => handleTopicComplete('ex-negative')}
                        exerciseData={negativeExercisesData}
                        title={t('kidsA1Class2.exerciseNegative')}
                        description={t('kidsA1Class2.exerciseNegativeDescription')}
                        formType="negative"
                    />;
        }
        if (selectedTopic === 'ex-interrogative') {
            return <SingleFormExercise
                        onComplete={() => handleTopicComplete('ex-interrogative')}
                        exerciseData={interrogativeExercisesData}
                        title={t('kidsA1Class2.exerciseInterrogative')}
                        description={t('kidsA1Class2.exerciseInterrogativeDescription')}
                        formType="interrogative"
                    />;
        }
        if (selectedTopic === 'ex-mixed') {
            return <PresentSimpleExercise onComplete={() => handleTopicComplete('ex-mixed')} exerciseData={presentSimpleExercises} />;
        }
        if (selectedTopic === 'ex-mixed-2') {
             return <PresentSimpleExercise onComplete={() => handleTopicComplete('ex-mixed-2')} exerciseData={presentSimpleExercises2} />;
        }
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple min-h-[600px]">
              <CardHeader>
                <CardTitle>{topic?.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Contenido para {topic?.name} vendrá aquí.</p>
              </CardContent>
            </Card>
        );
    }

    return (
      <Card className="shadow-soft rounded-lg border-2 border-brand-purple min-h-[600px]">
        <CardHeader>
          <CardTitle>{topic?.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Contenido para {topic?.name} vendrá aquí.</p>
        </CardContent>
      </Card>
    );
  };
  
  const pageTitle = t('kidsA1.presentSimple');

  return (
    <div className="flex w-full flex-col min-h-screen a1-kids-bg">
      <DashboardHeader />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Link href={`/kids/a1`} className="hover:underline text-sm text-muted-foreground">
                {t('kidsA1.backToA1')}
            </Link>
            <h1 className="text-4xl font-bold dark:text-primary">{pageTitle}</h1>
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
                        <li key={item.key}>
                          {!item.subItems ? (
                            <div
                              onClick={() => handleTopicSelect(item.key)}
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
                            </div>
                          ) : (
                            <Collapsible defaultOpen={item.subItems.some(si => si.status !== 'locked')} disabled={item.status === 'locked' && !isAdmin}>
                              <CollapsibleTrigger className="w-full" asChild>
                                  <div className={cn(
                                      'flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors w-full',
                                      item.status === 'locked' && !isAdmin ? 'cursor-not-allowed text-muted-foreground/50' : 'cursor-pointer hover:bg-muted',
                                      selectedTopic.startsWith('ex-') && (item.status !== 'locked' || isAdmin) && 'bg-muted text-primary font-semibold'
                                    )}>
                                    <div className="flex items-center gap-3">
                                      <Icon className="h-5 w-5" />
                                      <span>{item.name}</span>
                                    </div>
                                    {item.status === 'locked' && !isAdmin ? (
                                        <Lock className="h-4 w-4 text-yellow-500" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />
                                    )}
                                  </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <ul className="pl-8 pt-1 space-y-1">
                                  {item.subItems.map((subItem) => {
                                      const SubIcon = ICONS[subItem.status];
                                      return (
                                        <li
                                          key={subItem.key}
                                          onClick={() => handleTopicSelect(subItem.key)}
                                          className={cn(
                                            'flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                                            subItem.status === 'locked' && !isAdmin ? 'cursor-not-allowed text-muted-foreground/50' : 'cursor-pointer hover:bg-muted',
                                            selectedTopic === subItem.key && (subItem.status !== 'locked' || isAdmin) && 'bg-muted text-primary font-semibold'
                                          )}
                                        >
                                          <div className="flex items-center gap-3">
                                            <SubIcon className="h-5 w-5" />
                                            <span>{subItem.name}</span>
                                          </div>
                                        </li>
                                      )
                                  })}
                                </ul>
                              </CollapsibleContent>
                            </Collapsible>
                          )}
                        </li>
                      )})}
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
