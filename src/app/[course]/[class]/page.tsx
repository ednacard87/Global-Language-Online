'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, ChevronDown, Lock, CheckCircle, Loader2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { SimpleTranslationExercise, ExerciseKey } from '@/components/dashboard/simple-translation-exercise';
import { TranslationExercise } from '@/components/dashboard/translation-exercise';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ShortAnswerExercise } from '@/components/dashboard/short-answer-exercise';

// Data structure for class content.
const classData = {
  a1: {
    '1': {
      vocabulary: {
        weekdays: [
          { spanish: 'Lunes', english: 'Monday' },
          { spanish: 'Martes', english: 'Tuesday' },
          { spanish: 'Miércoles', english: 'Wednesday' },
          { spanish: 'Jueves', english: 'Thursday' },
          { spanish: 'Viernes', english: 'Friday' },
          { spanish: 'Sábado', english: 'Saturday' },
          { spanish: 'Domingo', english: 'Sunday' },
        ],
        months: [
          { spanish: 'Enero', english: 'January' },
          { spanish: 'Febrero', english: 'February' },
          { spanish: 'Marzo', english: 'March' },
          { spanish: 'Abril', english: 'April' },
          { spanish: 'Mayo', english: 'May' },
          { spanish: 'Junio', english: 'June' },
          { spanish: 'Julio', english: 'July' },
          { spanish: 'Agosto', english: 'August' },
          { spanish: 'Septiembre', english: 'September' },
          { spanish: 'Octubre', english: 'October' },
          { spanish: 'Noviembre', english: 'November' },
          { spanish: 'Diciembre', english: 'December' },
        ],
        colors: [
          { spanish: 'Rojo', english: 'Red' },
          { spanish: 'Azul', english: 'Blue' },
          { spanish: 'Verde', english: 'Green' },
          { spanish: 'Amarillo', english: 'Yellow' },
          { spanish: 'Naranja', english: 'Orange' },
          { spanish: 'Morado', english: 'Purple' },
          { spanish: 'Negro', english: 'Black' },
          { spanish: 'Blanco', english: 'White' },
          { spanish: 'Gris', english: 'Gray' },
          { spanish: 'Marrón', english: 'Brown' },
        ],
        seasons: [
          { spanish: 'Verano', english: 'Summer' },
          { spanish: 'Otoño', english: 'Autumn' },
          { spanish: 'Invierno', english: 'Winter' },
          { spanish: 'Primavera', english: 'Spring' },
        ]
      }
    }
  }
};


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

export default function ClassPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const course = (params.course as string) || 'a1';
  const classNumber = (params.class as string) || '1';
  const { toast } = useToast();
  
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  const studentDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'students', user.uid) : null),
    [firestore, user]
  );
  const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, unlockedClasses?: string[], progress?: Record<string, number>}>(studentDocRef);

  const classId = `${course}-${classNumber}`;
  const isClassLocked = useMemo(() => {
    if (classNumber === '1') return false; // Class 1 is always unlocked
    if (!user || !studentProfile) return true; // if no user, lock it.
    if (studentProfile.role === 'admin' || user.email === 'ednacard87@gmail.com') return false;
    return !(studentProfile.unlockedClasses || []).includes(classId);
  }, [user, studentProfile, classId, classNumber]);


  const progressStorageKey = `progress_${course}_${classNumber}_v1`;

  const isAdmin = useMemo(() => {
    if (!user) return false;
    return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
  }, [user, studentProfile]);

  const vocabularyData = useMemo(() => {
    return (classData as any)[course]?.[classNumber]?.vocabulary || {};
  }, [course, classNumber]);
  
  const [userAnswers, setUserAnswers] = useState<{[key: string]: string[]}>({});
  const [validationStatus, setValidationStatus] = useState<{[key: string]: ('correct' | 'incorrect' | 'unchecked')[]}>({});
  const [showQuizletButton, setShowQuizletButton] = useState(false);
  
  const [possessivesAnswers, setPossessivesAnswers] = useState<string[]>([]);
  const [possessivesValidationStatus, setPossessivesValidationStatus] = useState<('correct' | 'incorrect' | 'unchecked')[]>([]);

  const [learningPath, setLearningPath] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('vocabulary');
  const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

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

  const class1LearningPath = useMemo((): Topic[] => {
    return [
        { key: 'vocabulary', name: t('a1class1.vocabulary'), icon: BookOpen, status: 'active' },
        { key: 'grammar', name: t('a1class1.grammar'), icon: PenSquare, status: 'locked' },
        {
            key: 'exercises',
            name: t('a1class1.exercises'),
            icon: PenSquare,
            status: 'locked',
            subItems: [
                { key: 'ex1', name: t('a1class1.exercise', { number: 1 }), status: 'locked' },
                { key: 'ex2', name: t('a1class1.exercise', { number: 2 }), status: 'locked' },
            ],
        },
        { key: 'possessives_ex', name: t('intro1Page.possessives'), icon: PenSquare, status: 'locked' },
        {
            key: 'mixed_exercises',
            name: t('a1class1.mixedExercises'),
            icon: PenSquare,
            status: 'locked',
            subItems: [
                { key: 'ex3', name: t('a1class1.exercise', { number: 3 }), status: 'locked' },
                { key: 'ex4', name: t('a1class1.exercise', { number: 4 }), status: 'locked' },
                { key: 'ex5', name: t('a1class1.exercise', { number: 5 }), status: 'locked' },
                { key: 'ex6', name: t('a1class1.exercise', { number: 6 }), status: 'locked' },
            ],
        },
    ];
  }, [t]);

  const standardLearningPath = useMemo((): Topic[] => {
    return [
        { key: 'vocabulary', name: t('a1class1.vocabulary'), icon: BookOpen, status: 'active' },
        { key: 'grammar', name: t('a1class1.grammar'), icon: PenSquare, status: 'locked' },
        {
            key: 'exercises',
            name: t('a1class1.exercises'),
            icon: PenSquare,
            status: 'locked',
            subItems: [
                { key: 'ex1', name: t('a1class1.exercise', { number: 1 }), status: 'locked' },
                { key: 'ex2', name: t('a1class1.exercise', { number: 2 }), status: 'locked' },
                { key: 'ex3', name: t('a1class1.exercise', { number: 3 }), status: 'locked' },
                { key: 'ex4', name: t('a1class1.exercise', { number: 4 }), status: 'locked' },
                { key: 'ex5', name: t('a1class1.exercise', { number: 5 }), status: 'locked' },
                { key: 'ex6', name: t('a1class1.exercise', { number: 6 }), status: 'locked' },
                { key: 'ex7', name: t('a1class1.exercise', { number: 7 }), status: 'locked' },
            ],
        },
    ];
  }, [t]);

  const initialLearningPath = useMemo(() => {
    if (course === 'a1' && classNumber === '1') {
        return class1LearningPath;
    }
    return standardLearningPath;
  }, [course, classNumber, class1LearningPath, standardLearningPath]);

  useEffect(() => {
      setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || isProfileLoading) return;

    let pathIsLoadedFromProfile = false;
    let newPath: Topic[] = initialLearningPath.map(topic => ({
      ...topic,
      subItems: topic.subItems ? topic.subItems.map(sub => ({...sub})) : undefined,
    }));

    if (isAdmin) {
      newPath.forEach(item => {
        item.status = 'completed';
        if (item.subItems) {
            item.subItems.forEach(sub => sub.status = 'completed');
        }
      });
      pathIsLoadedFromProfile = true;
    } else if(studentProfile?.lessonProgress?.[progressStorageKey]) {
        const savedStatuses = studentProfile.lessonProgress[progressStorageKey];
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
        pathIsLoadedFromProfile = true;
    }
    
    setLearningPath(newPath);

    if (pathIsLoadedFromProfile) {
        const firstActiveItem = 
            newPath.find(p => p.status === 'active' && !p.subItems) || 
            newPath.find(p => p.subItems?.some(sp => sp.status === 'active'));

        if (firstActiveItem?.subItems) {
            const firstActiveSubItem = firstActiveItem.subItems.find(sp => sp.status === 'active');
            setSelectedTopic(firstActiveSubItem?.key || firstActiveItem.key);
        } else {
            setSelectedTopic(firstActiveItem?.key || newPath[0]?.key || '');
        }
    }

    const newAnswers: {[key: string]: string[]} = {};
    const newValidation: {[key: string]: ('correct' | 'incorrect' | 'unchecked')[]} = {};

    if (vocabularyData && typeof vocabularyData === 'object' && Object.keys(vocabularyData).length > 0) {
      for (const category in vocabularyData) {
        newAnswers[category] = Array((vocabularyData as any)[category].length).fill('');
        newValidation[category] = Array((vocabularyData as any)[category].length).fill('unchecked');
      }
    }
    setUserAnswers(newAnswers);
    setValidationStatus(newValidation);
    setShowQuizletButton(false);
    
    setPossessivesAnswers(Array(possessivesData.length).fill(''));
    setPossessivesValidationStatus(Array(possessivesData.length).fill('unchecked'));

  }, [course, classNumber, t, vocabularyData, isAdmin, possessivesData.length, initialLearningPath, studentProfile, progressStorageKey, isClient, isProfileLoading]);


  useEffect(() => {
    if (isProfileLoading) return;
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
            [`lessonProgress.${progressStorageKey}`]: statusesToSave
        });
    }
}, [learningPath, isAdmin, studentDocRef, progressStorageKey, isProfileLoading]);


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
    if (isProfileLoading) return;
    if (studentDocRef && course && classNumber) {
        updateDocumentNonBlocking(studentDocRef, {
            [`progress.progress_${course}_${classNumber}`]: progress
        });
        window.dispatchEvent(new CustomEvent('progressUpdated'));
    }
}, [progress, course, classNumber, studentDocRef, isProfileLoading]);


  const handleTopicComplete = (completedKey: string) => {
    setTopicToComplete(completedKey);
  };
  
  useEffect(() => {
    if (!topicToComplete) return;

    setLearningPath(currentLearningPath => {
        let wasTopicUnlocked = false;
        let nextSelectedTopic: string | null = null;
      
        const newPath = currentLearningPath.map(topic => ({
          ...topic,
          subItems: topic.subItems ? topic.subItems.map(sub => ({ ...sub })) : undefined
        }));
      
        let topicFound = false;
        for (let i = 0; i < newPath.length && !topicFound; i++) {
          const currentTopic = newPath[i];
      
          if (currentTopic.key === topicToComplete) {
            if (currentTopic.status !== 'completed') {
              currentTopic.status = 'completed';
            }
            if (i + 1 < newPath.length && newPath[i + 1].status === 'locked') {
              const nextMainTopic = newPath[i + 1];
              nextMainTopic.status = 'active';
              if (nextMainTopic.subItems && nextMainTopic.subItems.length > 0) {
                nextMainTopic.subItems[0].status = 'active';
                nextSelectedTopic = nextMainTopic.subItems[0].key;
              } else {
                nextSelectedTopic = nextMainTopic.key;
              }
              wasTopicUnlocked = true;
            }
            topicFound = true;
          } else if (currentTopic.subItems) {
            const subItemIndex = currentTopic.subItems.findIndex(sub => sub.key === topicToComplete);
            if (subItemIndex !== -1) {
              if (currentTopic.subItems[subItemIndex].status !== 'completed') {
                currentTopic.subItems[subItemIndex].status = 'completed';
              }
      
              const nextSubItemIndex = subItemIndex + 1;
              if (nextSubItemIndex < currentTopic.subItems.length && currentTopic.subItems[nextSubItemIndex].status === 'locked') {
                currentTopic.subItems[nextSubItemIndex].status = 'active';
                nextSelectedTopic = currentTopic.subItems[nextSubItemIndex].key;
                wasTopicUnlocked = true;
              } else if (currentTopic.subItems.every(sub => sub.status === 'completed')) {
                if (currentTopic.status !== 'completed') {
                  currentTopic.status = 'completed';
                }
                if (i + 1 < newPath.length && newPath[i + 1].status === 'locked') {
                  const nextMainTopic = newPath[i + 1];
                  nextMainTopic.status = 'active';
                  if (nextMainTopic.subItems && nextMainTopic.subItems.length > 0) {
                    nextMainTopic.subItems[0].status = 'active';
                    nextSelectedTopic = nextMainTopic.subItems[0].key;
                  } else {
                    nextSelectedTopic = nextMainTopic.key;
                  }
                  wasTopicUnlocked = true;
                }
              }
              topicFound = true;
            }
          }
        }
      
        if (wasTopicUnlocked) {
            toast({
                title: "¡Siguiente tema desbloqueado!",
                description: "Puedes continuar con la aventura.",
            });
        }
    
        if (nextSelectedTopic) {
          setSelectedTopic(nextSelectedTopic);
        }
      
        return newPath;
    });

    setTopicToComplete(null);
  }, [topicToComplete, toast]);

  const handleExerciseComplete = (completedKey: string) => {
    handleTopicComplete(completedKey);
  };

  const handleTopicSelect = (topicKey: string) => {
    const mainTopic = learningPath.find(t => t.key === topicKey || t.subItems?.some(st => st.key === topicKey));
    const subTopic = mainTopic?.subItems?.find(st => st.key === topicKey);

    const topicStatus = mainTopic?.status ?? 'locked';
    const subTopicStatus = subTopic?.status ?? 'locked';

    if (!isAdmin && (topicStatus === 'locked' || subTopicStatus === 'locked')) {
        toast({
            variant: "destructive",
            title: "Contenido Bloqueado",
            description: "Debes completar los pasos anteriores para desbloquear este tema.",
        });
        return;
    }
    
    setSelectedTopic(topicKey);

    if (topicKey === 'grammar') {
      handleTopicComplete('grammar');
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

    setShowQuizletButton(false);
  };
  
  const handlePossessivesInputChange = (index: number, value: string) => {
    const newAnswers = [...possessivesAnswers];
    newAnswers[index] = value;
    setPossessivesAnswers(newAnswers);

    if (possessivesValidationStatus[index] !== 'unchecked') {
        const newValidation = [...possessivesValidationStatus];
        newValidation[index] = 'unchecked';
        setPossessivesValidationStatus(newValidation);
    }
  };

  const handleCheckAnswers = () => {
    let allCorrect = true;
    const newValidationStatus: {[key: string]: ('correct' | 'incorrect' | 'unchecked')[]} = {};

    for (const category in vocabularyData) {
        const items = (vocabularyData as any)[category];
        newValidationStatus[category] = items.map((item: {english: string}, index: number) => {
            const userAnswer = (userAnswers[category]?.[index] || '').trim().toLowerCase();
            const correctAnswer = item.english.toLowerCase();
            const isCorrect = userAnswer === correctAnswer;
            if (!isCorrect) allCorrect = false;
            return isCorrect ? 'correct' : 'incorrect';
        });
    }
    setValidationStatus(newValidationStatus);
    
    if (allCorrect) {
        handleTopicComplete('vocabulary');
    }

    if (!allCorrect) {
        setShowQuizletButton(true);
    }
  };
  
  const handleCheckPossessives = () => {
    let allCorrect = true;
    const newValidation = possessivesData.map((item, index) => {
        const userAnswer = (possessivesAnswers[index] || '').trim().toLowerCase();
        const correctAnswer = item.english.toLowerCase();
        const isCorrect = userAnswer === correctAnswer;
        if (!isCorrect) allCorrect = false;
        return isCorrect ? 'correct' : 'incorrect';
    });
    setPossessivesValidationStatus(newValidation as any);

    if(allCorrect) {
        handleTopicComplete('possessives_ex');
    } else {
        toast({
            variant: "destructive",
            title: "Algunas respuestas son incorrectas",
            description: "Por favor, revisa los campos marcados en rojo.",
        });
    }
  };


  const getInputClass = (category: string, index: number) => {
    const status = validationStatus[category]?.[index];
    if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500';
    if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive';
    return '';
  };
  
  const getPossessivesInputClass = (index: number) => {
    const status = possessivesValidationStatus[index];
    if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500';
    if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive';
    return '';
  };


  const renderContent = () => {
    switch (selectedTopic) {
      case 'vocabulary':
        if (!vocabularyData || Object.keys(vocabularyData).length === 0) {
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader><CardTitle>{t('a1class1.vocabulary')}</CardTitle></CardHeader>
                    <CardContent><p>{t('a1class1.contentPlaceholder', { topic: t('a1class1.vocabulary') })}</p></CardContent>
                </Card>
            )
        }
        return (
          <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader><CardTitle>{t('a1class1.vocabulary')}</CardTitle></CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {Object.entries(vocabularyData).map(([category, items]) => (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger>{t(`a1class1.${category}`)}</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                        <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.spanish')}</div>
                        <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.english')}</div>
                        {(items as {spanish: string, english: string}[]).map((item, index) => (
                            <React.Fragment key={index}>
                                <div className="p-3 bg-card border rounded-lg flex items-center justify-center">{item.spanish}</div>
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
            <CardFooter className="flex justify-between items-center">
                <Button onClick={handleCheckAnswers}>{t('vocabulary.check')}</Button>
                {showQuizletButton && (
                    <Button asChild variant="outline">
                        <Link href="https://quizlet.com/co" target="_blank" rel="noopener noreferrer">
                            Quizlet
                        </Link>
                    </Button>
                )}
            </CardFooter>
          </Card>
        );
      case 'grammar':
        if (course === 'a1' && classNumber === '1') {
           return (
              <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardHeader><CardTitle>{t('a1class1.grammar')}</CardTitle></CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="pronouns">
                      <AccordionTrigger>{t('intro1Page.pronouns')}</AccordionTrigger>
                      <AccordionContent>
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
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="verbtobe1">
                      <AccordionTrigger>{t('intro1Page.verbtobe1')}</AccordionTrigger>
                      <AccordionContent className="space-y-6">
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
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="verbtobe2">
                      <AccordionTrigger>{t('intro1Page.verbtobe2')}</AccordionTrigger>
                      <AccordionContent className="space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold mb-2">{t('intro1Page.verbtobeStructureTitle')}</h3>
                            <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> pronoun + To be + possessive + noun + complement</p>
                                <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> pronoun + To be + Not + possessive + noun + complement</p>
                                <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> To be + pronoun + possessive + noun + complement ?</p>
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
                            <p className="text-lg italic text-muted-foreground mb-2">"{t('intro1Page.exampleSentence')}"</p>
                            <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> They are my friends</p>
                                <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> They are not my friends</p>
                                <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> are they my friends?</p>
                                <div className="border-t my-2 border-border/50" />
                                <p><span className="font-bold text-lg text-green-500 mr-2">(+A)</span> Yes, they are</p>
                                <p><span className="font-bold text-lg text-red-500 mr-2">(-A)</span> No, they are not</p>
                            </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="verbtobe3">
                      <AccordionTrigger>{t('intro1Page.verbtobe3')}</AccordionTrigger>
                      <AccordionContent className="space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold mb-2">{t('intro1Page.verbtobeStructureTitle')}</h3>
                            <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> possessive + noun + to be + complement</p>
                                <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> possessive + noun + to be + Not + complement</p>
                                <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> To be + possessive + noun + complement ?</p>
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
                            <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> My mother is a nurse</p>
                                <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> My mother is not a nurse</p>
                                <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> is my mother a nurse?</p>
                                <div className="border-t my-2 border-border/50" />
                                <p><span className="font-bold text-lg text-green-500 mr-2">(+A)</span> yes, she is</p>
                                <p><span className="font-bold text-lg text-red-500 mr-2">(-A)</span> no, she is not</p>
                            </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
           );
        }
        return (
          <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader><CardTitle>{t('a1class1.grammar')}</CardTitle></CardHeader>
            <CardContent><p>{t('a1class1.contentPlaceholder', { topic: t('a1class1.grammar') })}</p></CardContent>
          </Card>
        );
      case 'possessives_ex':
        return (
          <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader><CardTitle>{t('intro1Page.possessives')}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.spanish')}</div>
                <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.english')}</div>
                {possessivesData.map((item, index) => (
                    <React.Fragment key={index}>
                        <div className="p-3 bg-card border rounded-lg flex items-center justify-center">{item.spanish}</div>
                        <div className="p-3 bg-card border rounded-lg flex items-center">
                            <Input 
                                value={possessivesAnswers[index] || ''}
                                onChange={(e) => handlePossessivesInputChange(index, e.target.value)}
                                className={cn(getPossessivesInputClass(index))}
                                autoComplete="off"
                            />
                        </div>
                    </React.Fragment>
                ))}
              </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleCheckPossessives}>{t('vocabulary.check')}</Button>
            </CardFooter>
          </Card>
        );
      default: // Exercises
        if (selectedTopic === 'ex2') {
            return <TranslationExercise exerciseKey="qna2" formType="qna" onComplete={() => handleExerciseComplete('ex2')} />;
        }
        if (selectedTopic === 'ex5') {
            return <ShortAnswerExercise onComplete={() => handleExerciseComplete('ex5')} />;
        }
        if (selectedTopic.startsWith('ex')) {
            const exerciseKey = selectedTopic.replace('ex', 'mixed');
            return <SimpleTranslationExercise course={course} exerciseKey={exerciseKey} onComplete={() => handleExerciseComplete(selectedTopic)} />;
        }

        return (
          <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader><CardTitle>{selectedTopic}</CardTitle></CardHeader>
            <CardContent><p>{t('a1class1.contentPlaceholder', { topic: selectedTopic })}</p></CardContent>
          </Card>
        );
    }
  };

  const pageTitle = t('classPage.title', { course: course.toUpperCase(), class: classNumber });

  if (isUserLoading || !user) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  if (isClassLocked) {
    return (
        <div className="flex w-full flex-col min-h-screen">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple text-center">
                    <CardHeader>
                        <CardTitle>Clase Bloqueada</CardTitle>
                        <CardDescription>
                            Esta clase no está disponible para ti.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Lock className="h-16 w-16 mx-auto text-yellow-500" />
                        <p className="mt-4 text-muted-foreground">
                            Contacta al administrador para desbloquear esta clase.
                        </p>
                    </CardContent>
                    <CardFooter className="justify-center">
                        <Button asChild>
                            <Link href={`/${course}`}>Volver al curso</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
  }

  return (
    <div className="flex w-full flex-col min-h-screen">
      <DashboardHeader />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Link href={`/${course}`} className="hover:underline text-sm text-muted-foreground">
                {t(`dashboard.course${course.toUpperCase()}`)}
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
                        const isLocked = item.status === 'locked' && !isAdmin;

                        return (
                        <li key={item.key}>
                          {!item.subItems ? (
                            <div
                              onClick={() => handleTopicSelect(item.key)}
                              className={cn(
                                'flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                                isLocked ? 'cursor-not-allowed text-muted-foreground/50' : 'cursor-pointer hover:bg-muted',
                                selectedTopic === item.key && !isLocked && 'bg-muted text-primary font-semibold'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                  <Icon className={cn("h-5 w-5", item.status === 'completed' ? 'text-green-500' : '')} />
                                  <span>{item.name}</span>
                              </div>
                              {isLocked && <Lock className="h-4 w-4 text-yellow-500" />}
                            </div>
                          ) : (
                            <Collapsible defaultOpen={item.subItems?.some(si => si.status !== 'locked')} disabled={isLocked}>
                              <CollapsibleTrigger className="w-full" asChild>
                                  <div className={cn(
                                      'flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors w-full',
                                      isLocked ? 'cursor-not-allowed text-muted-foreground/50' : 'cursor-pointer hover:bg-muted',
                                      (item.subItems?.some(si => si.key === selectedTopic)) && !isLocked && 'bg-muted text-primary font-semibold'
                                    )}>
                                    <div className="flex items-center gap-3">
                                      <Icon className={cn("h-5 w-5", item.status === 'completed' ? 'text-green-500' : '')} />
                                      <span>{item.name}</span>
                                    </div>
                                    {isLocked ? (
                                        <Lock className="h-4 w-4 text-yellow-500" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />
                                    )}
                                  </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <ul className="pl-8 pt-1 space-y-1">
                                  {item.subItems.map((subItem) => {
                                    const SubIcon = subItem.status === 'completed' ? CheckCircle : (subItem.status === 'active' ? BookOpen : PenSquare);
                                    const isSubLocked = subItem.status === 'locked' && !isAdmin;
                                    return (
                                        <li
                                        key={subItem.key}
                                        onClick={() => handleTopicSelect(subItem.key)}
                                        className={cn(
                                            'flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                                            isSubLocked ? 'cursor-not-allowed text-muted-foreground/50' : 'cursor-pointer hover:bg-muted',
                                            selectedTopic === subItem.key && !isSubLocked && 'bg-muted text-primary font-semibold'
                                        )}
                                        >
                                        <div className='flex items-center gap-3'>
                                            <SubIcon className={cn("h-5 w-5", subItem.status === 'completed' ? 'text-green-500' : '')} />
                                            <span>{subItem.name}</span>
                                        </div>
                                        {isSubLocked && <Lock className="h-4 w-4 text-yellow-500" />}
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
