'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, BrainCircuit, CheckCircle, Lightbulb, ChevronDown, Ear, Shirt } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Imports for Class 1
import { ToBeMemoryGame } from '@/components/kids/exercises/tobe-memory-game';
import { PossessivesMemoryGame } from '@/components/kids/exercises/possessives-memory-game';
import { TranslationExercise } from '@/components/dashboard/translation-exercise';
import { SimpleTranslationExercise, ExerciseKey } from '@/components/dashboard/simple-translation-exercise';
import { ShortAnswerExercise } from '@/components/dashboard/short-answer-exercise';
import { VerbVocabularyExercise } from '@/components/kids/exercises/verb-vocabulary';

// Imports for Class 2
import { VerbMemoryGame } from '@/components/kids/exercises/verb-memory-game';
import { FillInTheBlanksExercise } from '@/components/kids/exercises/fill-in-the-blanks';
import { PresentSimpleExercise, ExercisePrompt } from '@/components/kids/exercises/present-simple';
import { SingleFormExercise, positiveExercisesData, negativeExercisesData, interrogativeExercisesData } from '@/components/kids/exercises/single-form';
import { ReadingComprehensionExercise } from '@/components/kids/exercises/reading-comprehension';


// Data for Class 1
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

const classVocabularyData = {
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
    seasons: [
        { spanish: 'Verano', english: 'Summer' },
        { spanish: 'Otoño', english: 'Autumn' },
        { spanish: 'Invierno', english: 'Winter' },
        { spanish: 'Primavera', english: 'Spring' },
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
    ]
};

const class2Exercise1Data: ExercisePrompt[] = [
    {
        spanish: "NOSOTROS CAMINAMOS EN EL PARQUE",
        answers: {
            affirmative: ["we walk in the park"],
            negative: ["we do not walk in the park", "we don't walk in the park"],
            interrogative: ["do we walk in the park?"],
        }
    },
    {
        spanish: "ELLOS VAN A LA UNIVERSIDAD EL SABADO.",
        answers: {
            affirmative: ["they go to the university on saturday"],
            negative: ["they do not go to the university on saturday", "they don't go to the university on saturday"],
            interrogative: ["do they go to the university on saturday?"],
        }
    },
    {
        spanish: "NOSOTROS TRABAJAMOS LOS DOMINGOS.",
        answers: {
            affirmative: ["we work on sundays"],
            negative: ["we do not work on sundays", "we don't work on sundays"],
            interrogative: ["do we work on sundays?"],
        }
    },
    {
        spanish: "TÚ DUERMES EN LA TARDE",
        answers: {
            affirmative: ["you sleep in the afternoon"],
            negative: ["you do not sleep in the afternoon", "you don't sleep in the afternoon"],
            interrogative: ["do you sleep in the afternoon?"],
        }
    },
    {
        spanish: "NOSOTROS COMEMOS CARNE Y ENSALADA",
        answers: {
            affirmative: ["we eat meat and salad"],
            negative: ["we do not eat meat and salad", "we don't eat meat and salad"],
            interrogative: ["do we eat meat and salad?"],
        }
    },
    {
        spanish: "ELLOS BEBEN CERVEZA",
        answers: {
            affirmative: ["they drink beer"],
            negative: ["they do not drink beer", "they don't drink beer"],
            interrogative: ["do they drink beer?"],
        }
    },
    {
        spanish: "ELLOS VAN A LA IGLESIA EL MIERCOLES",
        answers: {
            affirmative: ["they go to church on wednesday"],
            negative: ["they do not go to church on wednesday", "they don't go to church on wednesday"],
            interrogative: ["do they go to church on wednesday?"],
        }
    },
    {
        spanish: "NOSOTROS JUGAMOS FUTBOL LOS SABADOS",
        answers: {
            affirmative: ["we play soccer on saturdays", "we play football on saturdays"],
            negative: ["we do not play soccer on saturdays", "we don't play soccer on saturdays", "we do not play football on saturdays", "we don't play football on saturdays"],
            interrogative: ["do we play soccer on saturdays?", "do we play football on saturdays?"],
        }
    },
    {
        spanish: "YO VEO PELÍCULAS LOS VIERNES EN LA NOCHE",
        answers: {
            affirmative: ["i watch movies on friday nights", "i watch movies on fridays at night"],
            negative: ["i do not watch movies on friday nights", "i don't watch movies on friday nights", "i do not watch movies on fridays at night", "i don't watch movies on fridays at night"],
            interrogative: ["do i watch movies on friday nights?", "do i watch movies on fridays at night?"],
        }
    }
];

const class2Exercise2Data: ExercisePrompt[] = [
    {
        spanish: "tú haces la tarea",
        answers: {
            affirmative: ["you do the homework"],
            negative: ["you do not do the homework", "you don't do the homework"],
            interrogative: ["do you do the homework?"],
        }
    },
    {
        spanish: "ella hace ejercicio",
        answers: {
            affirmative: ["she does exercise", "she exercises"],
            negative: ["she does not do exercise", "she doesn't do exercise", "she does not exercise", "she doesn't exercise"],
            interrogative: ["does she do exercise?", "does she exercise?"],
        }
    },
    {
        spanish: "él come pizza",
        answers: {
            affirmative: ["he eats pizza"],
            negative: ["he does not eat pizza", "he doesn't eat pizza"],
            interrogative: ["does he eat pizza?"],
        }
    }
];


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

// =================================================================
//                 CLASS 1 COMPONENT
// =================================================================
const Class1Content = ({ t, toast, studentDocRef, studentProfile, isAdmin, isProfileLoading }: any) => {
    const progressStorageKey = `_eng_a1_class_1_v2_vocab`;
    const mainProgressKey = `progress_a1_eng_unit_1_class_1`;

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [userAnswers, setUserAnswers] = useState<{[key: string]: string[]}>({});
    const [validationStatus, setValidationStatus] = useState<{[key: string]: ('correct' | 'incorrect' | 'unchecked')[]}>({});
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [previousPath, setPreviousPath] = useState<Topic[] | null>(null);
    
    const initialLearningPath = useMemo((): Topic[] => {
        return [
            { key: 'vocabulary', name: t('a1class1.vocabulary'), icon: BookOpen, status: 'active' },
            { key: 'tobe', name: t('kidsA1.toBe'), icon: GraduationCap, status: 'locked' },
            { key: 'memory-tobe', name: t('kidsA1.memoryToBe'), icon: BrainCircuit, status: 'locked' },
            { key: 'tobe-1-grammar', name: t('kidsA1.toBe1Grammar'), icon: GraduationCap, status: 'locked' },
            { key: 'tobe-1-exercise', name: t('kidsA1.toBe1Exercise'), icon: PenSquare, status: 'locked' },
            { key: 'possessives', name: t('kidsA1.possessives'), icon: GraduationCap, status: 'locked' },
            { key: 'memory-possessives', name: t('kidsA1.memoryPossessives'), icon: BrainCircuit, status: 'locked' },
            { key: 'tobe-2-grammar', name: t('kidsA1.toBe2Grammar'), icon: GraduationCap, status: 'locked' },
            { key: 'tobe-2-exercise', name: t('kidsA1.toBe2Exercise'), icon: PenSquare, status: 'locked' },
            { key: 'tobe-3-grammar', name: t('kidsA1.toBe3Grammar'), icon: GraduationCap, status: 'locked' },
            { key: 'tobe-3-exercise', name: t('kidsA1.toBe3Exercise'), icon: PenSquare, status: 'locked' },
            {
                key: 'mixto-1',
                name: 'Mixto 1',
                icon: PenSquare,
                status: 'locked',
                subItems: [
                    { key: 'ex-mixto-1', name: 'Ejercicio 1', status: 'locked' },
                    { key: 'ex-mixto-2', name: 'Ejercicio 2', status: 'locked' },
                    { key: 'ex-mixto-3', name: 'Ejercicio 3', status: 'locked' },
                ]
            },
            {
                key: 'mixto-final',
                name: 'Mixto Final',
                icon: PenSquare,
                status: 'locked',
                subItems: [
                    { key: 'ex-mixto-4', name: 'Ejercicio 4', status: 'locked' },
                    { key: 'ex-mixto-5', name: 'Ejercicio 5', status: 'locked' },
                    { key: 'ex-mixto-6', name: 'Ejercicio 6', status: 'locked' },
                ]
            }
        ];
    }, [t]);

    useEffect(() => {
        if (isProfileLoading) return;
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
        setPreviousPath(newPath);

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
        for (const category in classVocabularyData) {
            newAnswers[category] = Array((classVocabularyData as any)[category].length).fill('');
            newValidation[category] = Array((classVocabularyData as any)[category].length).fill('unchecked');
        }
        setUserAnswers(newAnswers);
        setValidationStatus(newValidation);

    }, [isAdmin, initialLearningPath, studentProfile, progressStorageKey, isProfileLoading]);

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
        if (studentDocRef) {
            updateDocumentNonBlocking(studentDocRef, {
                [`progress.${mainProgressKey}`]: Math.round(progress)
            });
        }
        if (progress >= 100) {
          window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
    }, [learningPath, isAdmin, progress, studentDocRef, progressStorageKey, mainProgressKey, isProfileLoading]);
    
    useEffect(() => {
        if (previousPath && !isAdmin) {
          const newlyUnlocked = learningPath.find((newItem, index) => {
            const oldItem = previousPath?.[index];
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

    const handleTopicComplete = (completedKey: string) => {
        setTopicToComplete(completedKey);
    };

    useEffect(() => {
        if (!topicToComplete || isAdmin) {
            if (topicToComplete) setTopicToComplete(null);
            return;
        }
    
        setLearningPath(currentPath => {
            const newPath = currentPath.map(t => ({
                ...t,
                subItems: t.subItems ? t.subItems.map(s => ({...s})) : undefined,
            }));
          
            let nextSelectedTopic: string | null = null;
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
                }
                topicFound = true;
              } else if (currentTopic.subItems) {
                const subItemIndex = currentTopic.subItems.findIndex((sub: Topic) => sub.key === topicToComplete);
                if (subItemIndex !== -1) {
                  if (currentTopic.subItems[subItemIndex].status !== 'completed') {
                    currentTopic.subItems[subItemIndex].status = 'completed';
                  }
          
                  const nextSubItemIndex = subItemIndex + 1;
                  if (nextSubItemIndex < currentTopic.subItems.length && currentTopic.subItems[nextSubItemIndex].status === 'locked') {
                    currentTopic.subItems[nextSubItemIndex].status = 'active';
                    nextSelectedTopic = currentTopic.subItems[nextSubItemIndex].key;
                  } else if (currentTopic.subItems.every((sub: Topic) => sub.status === 'completed')) {
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
                    }
                  }
                  topicFound = true;
                }
              }
            }
        
            if (nextSelectedTopic) {
              setSelectedTopic(nextSelectedTopic);
            }
    
            return newPath;
        });
      
        setTopicToComplete(null);
    }, [topicToComplete, toast, isAdmin]);

    const handleTopicSelect = (topicKey: string) => {
        const mainTopic = learningPath.find(t => t.key === topicKey || t.subItems?.some(st => st.key === topicKey));
        const subTopic = mainTopic?.subItems?.find(st => st.key === topicKey);
    
        const topicStatus = mainTopic?.status ?? 'locked';
        const subTopicStatus = subTopic?.status ?? 'locked';

        if (!isAdmin && (topicStatus === 'locked' || (subTopic && subTopicStatus === 'locked'))) {
            toast({
                variant: "destructive",
                title: "Contenido Bloqueado",
                description: "Debes completar los pasos anteriores para desbloquear este tema.",
            });
            return;
        }
        
        setSelectedTopic(topicKey);

        const exerciseTopics = ['vocabulary', 'memory-tobe', 'tobe-1-exercise', 'memory-possessives', 'tobe-2-exercise', 'tobe-3-exercise', 'ex-mixto-1', 'ex-mixto-2', 'ex-mixto-3', 'ex-mixto-4', 'ex-mixto-5', 'ex-mixto-6'];
        if (!exerciseTopics.includes(topicKey)) {
            handleTopicComplete(topicKey);
        }
    };
    
    const handleInputChange = (category: string, index: number, value: string) => {
        setUserAnswers(prevAnswers => {
            const newCategoryAnswers = [...(prevAnswers[category] || [])];
            newCategoryAnswers[index] = value;
            return { ...prevAnswers, [category]: newCategoryAnswers };
        });
    
        setValidationStatus(prevStatus => {
            if (prevStatus[category]?.[index] !== 'unchecked') {
                const newCategoryStatus = [...(prevStatus[category] || [])];
                newCategoryStatus[index] = 'unchecked';
                return { ...prevStatus, [category]: newCategoryStatus };
            }
            return prevStatus;
        });
    };

    const handleCheckAnswers = () => {
        let atLeastOneCorrect = false;
        const newValidationStatus: {[key: string]: ('correct' | 'incorrect' | 'unchecked')[]} = {};

        for (const category in classVocabularyData) {
            const items = (classVocabularyData as any)[category];
            newValidationStatus[category] = items.map((item: {english: string}, index: number) => {
                const userAnswer = (userAnswers[category]?.[index] || '').trim().toLowerCase();
                const correctAnswer = item.english.toLowerCase();
                const isCorrect = userAnswer === correctAnswer;
                if (isCorrect) {
                    atLeastOneCorrect = true;
                }
                return isCorrect ? 'correct' : 'incorrect';
            });
        }
        setValidationStatus(newValidationStatus);
        
        if (atLeastOneCorrect) {
            toast({ title: '¡Bien hecho!', description: 'Has acertado al menos una. ¡Tema desbloqueado!' });
            handleTopicComplete('vocabulary');
        } else {
            toast({ 
                variant: 'destructive', 
                title: 'Sigue intentando', 
                description: 'Revisa tus respuestas. ¡Necesitas al menos una correcta para continuar!' 
            });
        }
    };
    
    const getInputClass = (category: string, index: number) => {
        const status = validationStatus[category]?.[index];
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive';
        return '';
    };

    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic) || learningPath.flatMap(t => t.subItems || []).find(sub => sub.key === selectedTopic);

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader><CardTitle>{t('a1class1.vocabulary')}</CardTitle></CardHeader>
                        <CardContent>
                            <Accordion type="multiple" className="w-full">
                            {Object.entries(classVocabularyData).map(([category, items]) => (
                                <AccordionItem key={category} value={category}>
                                    <AccordionTrigger>{t(`a1class1.${category}`)}</AccordionTrigger>
                                    <AccordionContent>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                        <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.spanish')}</div>
                                        <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.english')}</div>
                                        {(items as {spanish:string, english:string}[]).map((item, index) => (
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
                        <CardFooter>
                            <Button onClick={handleCheckAnswers}>{t('vocabulary.check')}</Button>
                        </CardFooter>
                    </Card>
                );
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
            default:
                if (selectedTopic === 'ex-mixto-1') {
                    return <SimpleTranslationExercise course="a1" exerciseKey="mixed1" onComplete={() => handleTopicComplete('ex-mixto-1')} />;
                }
                if (selectedTopic === 'ex-mixto-2') {
                    return <TranslationExercise exerciseKey="qna2" formType="qna" onComplete={() => handleTopicComplete('ex-mixto-2')} />;
                }
                if (selectedTopic === 'ex-mixto-3') {
                    return <SimpleTranslationExercise course="a1" exerciseKey="mixed3" onComplete={() => handleTopicComplete('ex-mixto-3')} />;
                }
                if (selectedTopic === 'ex-mixto-4') {
                    return <SimpleTranslationExercise course="a1" exerciseKey="mixed4" onComplete={() => handleTopicComplete('ex-mixto-4')} />;
                }
                if (selectedTopic === 'ex-mixto-5') {
                    return <ShortAnswerExercise onComplete={() => handleTopicComplete('ex-mixto-5')} />;
                }
                if (selectedTopic === 'ex-mixto-6') {
                    return <SimpleTranslationExercise course="a1" exerciseKey="mixed6" onComplete={() => handleTopicComplete('ex-mixto-6')} />;
                }
                return (
                  <Card className="shadow-soft rounded-lg border-2 border-brand-purple min-h-[500px]">
                    <CardHeader>
                      <CardTitle>{topic?.name || selectedTopic}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Contenido para {topic?.name || selectedTopic} vendrá aquí.</p>
                    </CardContent>
                  </Card>
                );
        }
    };
    
    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <Link href="/ingles/a1/unit/1" className="hover:underline text-sm text-muted-foreground">
                            {t('a1course.backToA1')}
                        </Link>
                        <h1 className="text-4xl font-bold dark:text-primary">{t('a1Eng.unit1')} - Clase 1</h1>
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
                                            const Icon = item.icon;
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            return(
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
};

// =================================================================
//                 CLASS 2 COMPONENT
// =================================================================
const Class2Content = ({ t, toast, studentDocRef, studentProfile, isAdmin, isProfileLoading }: any) => {
    const progressStorageVersion = 'progress_a1_eng_unit_1_class_2_v5';
    const mainProgressKey = 'progress_a1_eng_unit_1_class_2';
    
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [previousPath, setPreviousPath] = useState<Topic[]>([]);

    const [userAnswers, setUserAnswers] = useState<{[key: string]: string[]}>({});
    const [validationStatus, setValidationStatus] = useState<{[key: string]: ('correct' | 'incorrect' | 'unchecked')[]}>({});
    
    const vocabularyData = {
        verbos: [
            { spanish: 'JUGAR', english: 'play' }, { spanish: 'CAMINAR', english: 'walk' },
            { spanish: 'IR', english: 'go' }, { spanish: 'TRABAJAR', english: 'work' },
            { spanish: 'DORMIR', english: 'sleep' }, { spanish: 'COMER', english: 'eat' },
            { spanish: 'BEBER', english: 'drink' }, { spanish: 'VER', english: 'see' },
            { spanish: 'MIRAR', english: 'look' }, { spanish: 'SALIR', english: 'go out' },
            { spanish: 'CORRER', english: 'run' }, { spanish: 'CANTAR', english: 'sing' },
            { spanish: 'HABLAR', english: 'talk' }, { spanish: 'PENSAR', english: 'think' },
            { spanish: 'HABER/TENER', english: 'have' }, { spanish: 'HACER', english: 'do' },
            { spanish: 'ESTUDIAR', english: 'study' }, { spanish: 'ESCRIBIR', english: 'write' },
            { spanish: 'LEER', english: 'read' }, { spanish: 'APRENDER', english: 'learn' },
            { spanish: 'ENSEÑAR', english: 'teach' },
        ],
        palabrasBasicas: [
            { spanish: 'AYER', english: 'yesterday' }, { spanish: 'HOY', english: 'today' },
            { spanish: 'MAÑANA', english: 'tomorrow' }, { spanish: 'AÑO', english: 'year' },
            { spanish: 'DÍA', english: 'day' }, { spanish: 'SEMANA', english: 'week' },
            { spanish: 'MES', english: 'month' }, { spanish: 'CON', english: 'with' },
            { spanish: 'DESAYUNO', english: 'breakfast' }, { spanish: 'ALMUERZO', english: 'lunch' },
            { spanish: 'CENA', english: 'dinner' }, { spanish: 'SIN', english: 'without' },
        ]
    }

    const initialLearningPath = useMemo((): Topic[] => {
        const path: Topic[] = [
            { key: 'vocabulary', name: t('a1class1.vocabulary'), icon: BookOpen, status: 'active' },
            { key: 'grammar', name: t('kidsA1Class2.grammar'), icon: GraduationCap, status: 'locked' },
            {
                key: 'exercises',
                name: t('kidsA1Class2.exercises'),
                icon: PenSquare,
                status: 'locked',
                subItems: [
                    { key: 'ex-positive', name: t('kidsA1Class2.exercisesPositive'), status: 'locked', icon: PenSquare },
                    { key: 'ex-negative', name: t('kidsA1Class2.exercisesNegative'), status: 'locked', icon: PenSquare },
                    { key: 'ex-interrogative', name: t('kidsA1Class2.exercisesInterrogative'), status: 'locked', icon: PenSquare },
                ]
            },
            { key: 'memory-verbs', name: t('kidsA1Class2.memoryVerbs'), icon: BrainCircuit, status: 'locked' },
            {
                key: 'mixed-exercises-1',
                name: t('a1class1.exercise', { number: 1 }),
                icon: PenSquare,
                status: 'locked',
                subItems: [
                    { key: 'ex-mixed-1-1', name: t('a1class1.exercise', { number: 1 }), status: 'locked', icon: PenSquare },
                    { key: 'ex-mixed-1-2', name: t('a1class1.exercise', { number: 2 }), status: 'locked', icon: PenSquare },
                ]
            },
            { key: 'reading', name: t('kidsA1Class2.reading'), icon: BookOpen, status: 'locked' },
            { key: 'listening', name: t('kidsA1Class2.listening'), icon: Ear, status: 'locked' },
            { key: 'final-vocab', name: t('kidsA1Class2.finalVocab'), icon: BookOpen, status: 'locked' },
        ];
        return path;
    }, [t]);

    useEffect(() => {
        if (isProfileLoading) return;
        const newPath = initialLearningPath.map(topic => {
          const status = (isAdmin) ? 'completed' : 'active';
          return {
            ...topic,
            status: status,
            subItems: topic.subItems ? topic.subItems.map(sub => ({...sub, status: status })) : undefined,
          };
        });
      
        setLearningPath(newPath);
        setPreviousPath(newPath);
        setSelectedTopic(newPath[0]?.key || '');

        const newAnswers: {[key: string]: string[]} = {};
        const newValidation: {[key: string]: ('correct' | 'incorrect' | 'unchecked')[]} = {};

        for (const category in vocabularyData) {
            newAnswers[category] = Array((vocabularyData as any)[category].length).fill('');
            newValidation[category] = Array((vocabularyData as any)[category].length).fill('unchecked');
        }

        setUserAnswers(newAnswers);
        setValidationStatus(newValidation);
    }, [isAdmin, initialLearningPath, isProfileLoading]);

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
        return totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
      }, [learningPath]);
    
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
                [`lessonProgress.${progressStorageVersion}`]: statusesToSave
            });
        }
        if (studentDocRef) {
            updateDocumentNonBlocking(studentDocRef, {
                [`progress.${mainProgressKey}`]: Math.round(progress)
            });
        }
    
        if (progress >= 100) {
          window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
      }, [learningPath, isAdmin, progress, studentDocRef, progressStorageVersion, mainProgressKey, isProfileLoading]);

      useEffect(() => {
        if (!topicToComplete) return;

        setLearningPath(currentPath => {
            const newPath = currentPath.map(topic => {
                if (topic.subItems) {
                    return {
                        ...topic,
                        subItems: topic.subItems.map(sub => ({...sub}))
                    };
                }
                return {...topic};
            });
            
            let nextSelectedTopic: string | null = null;
            let topicFound = false;
            let wasTopicUnlocked = false;

            for (let i = 0; i < newPath.length && !topicFound; i++) {
                const currentTopic = newPath[i];
            
                if (currentTopic.key === topicToComplete) {
                    if (currentTopic.status !== 'completed') {
                        currentTopic.status = 'completed';
                    }
                    if (i + 1 < newPath.length && newPath[i+1].status === 'locked') {
                        newPath[i+1].status = 'active';
                        wasTopicUnlocked = true;
                        if (newPath[i+1].subItems) {
                            newPath[i+1].subItems![0].status = 'active';
                            nextSelectedTopic = newPath[i+1].subItems![0].key;
                        } else {
                            nextSelectedTopic = newPath[i+1].key;
                        }
                    }
                    topicFound = true;
                } else if (currentTopic.subItems) {
                    const subItemIndex = currentTopic.subItems.findIndex((sub: Topic) => sub.key === topicToComplete);
                    if (subItemIndex !== -1) {
                        if (currentTopic.subItems[subItemIndex].status !== 'completed') {
                            currentTopic.subItems[subItemIndex].status = 'completed';
                        }
                        
                        const nextSubItemIndex = subItemIndex + 1;
                        if (nextSubItemIndex < currentTopic.subItems.length && currentTopic.subItems[nextSubItemIndex].status === 'locked') {
                            currentTopic.subItems[nextSubItemIndex].status = 'active';
                            nextSelectedTopic = currentTopic.subItems[nextSubItemIndex].key;
                            wasTopicUnlocked = true;
                        } else if (currentTopic.subItems.every((sub: Topic) => sub.status === 'completed')) {
                            if (currentTopic.status !== 'completed') {
                                currentTopic.status = 'completed';
                            }
                            if (i + 1 < newPath.length && newPath[i+1].status === 'locked') {
                                newPath[i+1].status = 'active';
                                wasTopicUnlocked = true;
                                if (newPath[i+1].subItems) {
                                    newPath[i+1].subItems![0].status = 'active';
                                    nextSelectedTopic = newPath[i+1].subItems![0].key;
                                } else {
                                    nextSelectedTopic = newPath[i+1].key;
                                }
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

      const handleTopicComplete = (topicKey: string) => {
        setTopicToComplete(topicKey);
      };
    
      const handleTopicSelect = (topicKey: string) => {
        const mainTopic = learningPath.find(t => t.key === topicKey || t.subItems?.some(st => st.key === topicKey));
        const subTopic = mainTopic?.subItems?.find(st => st.key === topicKey);
    
        const topicStatus = mainTopic?.status ?? 'locked';
        const subTopicStatus = subTopic?.status ?? 'locked';

        if (!isAdmin && (topicStatus === 'locked' || (subTopic && subTopicStatus === 'locked'))) {
            toast({
                variant: "destructive",
                title: "Contenido Bloqueado",
                description: "Debes completar los pasos anteriores para desbloquear este tema.",
            });
            return;
        }
        
        setSelectedTopic(topicKey);
    
        const exerciseTopics = ['memory-verbs', 'final-vocab', 'ex-positive', 'ex-negative', 'ex-interrogative', 'ex-mixed-1-1', 'ex-mixed-1-2', 'reading', 'listening'];
        if (!exerciseTopics.includes(topicKey)) {
            handleTopicComplete(topicKey);
        }
    };

    const handleVocabInputChange = (category: string, index: number, value: string) => {
        setUserAnswers(prevAnswers => {
            const newCategoryAnswers = [...(prevAnswers[category] || [])];
            newCategoryAnswers[index] = value;
            return { ...prevAnswers, [category]: newCategoryAnswers };
        });
    
        setValidationStatus(prevStatus => {
            if (prevStatus[category]?.[index] !== 'unchecked') {
                const newCategoryStatus = [...(prevStatus[category] || [])];
                newCategoryStatus[index] = 'unchecked';
                return { ...prevStatus, [category]: newCategoryStatus };
            }
            return prevStatus;
        });
    };

    const handleVocabCheckAnswers = () => {
        let atLeastOneCorrect = false;
        const newValidationStatus: {[key: string]: ('correct' | 'incorrect' | 'unchecked')[]} = {};

        for (const category in vocabularyData) {
            const items = vocabularyData[category as keyof typeof vocabularyData];
            newValidationStatus[category] = items.map((item, index) => {
                const userAnswer = (userAnswers[category]?.[index] || '').trim().toLowerCase();
                const correctAnswer = item.english.toLowerCase();
                const isCorrect = userAnswer === correctAnswer;
                if (isCorrect) {
                    atLeastOneCorrect = true;
                }
                return isCorrect ? 'correct' : 'incorrect';
            });
        }
        setValidationStatus(newValidationStatus);
        
        if (atLeastOneCorrect) {
            toast({ title: '¡Bien hecho!', description: 'Has acertado al menos una. ¡Tema desbloqueado!' });
            handleTopicComplete('vocabulary');
        } else {
            toast({ 
                variant: 'destructive', 
                title: 'Sigue intentando', 
                description: 'Revisa tus respuestas. ¡Necesitas al menos una correcta para continuar!' 
            });
        }
    };
    
    const getVocabInputClass = (category: string, index: number) => {
        const status = validationStatus[category]?.[index];
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive';
        return '';
    };

    const renderContentForClass2 = () => {
        const topic = learningPath.find(t => t.key === selectedTopic) || learningPath.flatMap(t => t.subItems || []).find(st => st?.key === selectedTopic);

        if (selectedTopic === 'vocabulary') {
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader><CardTitle>{t('kidsA1Class2.vocabulario')}</CardTitle></CardHeader>
                    <CardContent>
                      <Accordion type="multiple" className="w-full" defaultValue={['verbos', 'palabrasBasicas']}>
                        <AccordionItem value="verbos">
                          <AccordionTrigger>{t('kidsA1Class2.verbos')}</AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.spanish')}</div>
                                <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.english')}</div>
                                {vocabularyData.verbos.map((item, index) => (
                                    <React.Fragment key={`verbos-${index}`}>
                                        <div className="p-3 bg-card border rounded-lg flex items-center justify-center">{item.spanish}</div>
                                        <div className="p-3 bg-card border rounded-lg flex items-center">
                                            <Input 
                                                value={userAnswers.verbos?.[index] || ''}
                                                onChange={(e) => handleVocabInputChange('verbos', index, e.target.value)}
                                                className={cn(getVocabInputClass('verbos', index))}
                                                autoComplete="off"
                                            />
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="palabrasBasicas">
                          <AccordionTrigger>{t('kidsA1Class2.palabrasBasicas')}</AccordionTrigger>
                          <AccordionContent>
                             <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.spanish')}</div>
                                <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.english')}</div>
                                {vocabularyData.palabrasBasicas.map((item, index) => (
                                    <React.Fragment key={`palabrasBasicas-${index}`}>
                                        <div className="p-3 bg-card border rounded-lg flex items-center justify-center">{item.spanish}</div>
                                        <div className="p-3 bg-card border rounded-lg flex items-center">
                                            <Input 
                                                value={userAnswers.palabrasBasicas?.[index] || ''}
                                                onChange={(e) => handleVocabInputChange('palabrasBasicas', index, e.target.value)}
                                                className={cn(getVocabInputClass('palabrasBasicas', index))}
                                                autoComplete="off"
                                            />
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleVocabCheckAnswers}>{t('vocabulary.check')}</Button>
                    </CardFooter>
                </Card>
            );
        }
    
        if (selectedTopic === 'memory-verbs') {
            return <VerbMemoryGame data={vocabularyData.verbos} onComplete={() => handleTopicComplete('memory-verbs')} />;
        }
    
        if (selectedTopic === 'final-vocab') {
             return <VerbVocabularyExercise data={vocabularyData.verbos} onComplete={() => handleTopicComplete('final-vocab')} />;
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
            if (selectedTopic === 'ex-mixed-1-1') {
                return <PresentSimpleExercise onComplete={() => handleTopicComplete('ex-mixed-1-1')} exerciseData={class2Exercise1Data} title={t('kidsA1Class2.exercisesMixed1')} showShortAnswers={false} />;
            }
            if (selectedTopic === 'ex-mixed-1-2') {
                return <PresentSimpleExercise onComplete={() => handleTopicComplete('ex-mixed-1-2')} exerciseData={class2Exercise2Data} title={t('a1class1.exercise', {number: 2})} showShortAnswers={false} />;
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
      
      const pageTitle = t('classPage.title', { course: 'A1', class: '2' });
    
      return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
          <DashboardHeader />
          <main className="flex-1 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <Link href={`/ingles/a1`} className="hover:underline text-sm text-muted-foreground">
                    {t('a1course.backToA1')}
                </Link>
                <h1 className="text-4xl font-bold dark:text-primary">{pageTitle}</h1>
              </div>
              <div className="grid gap-8 md:grid-cols-12">
                <div className="md:col-span-9">
                  {renderContentForClass2()}
                </div>
                <div className="md:col-span-3">
                  <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple">
                    <CardHeader><CardTitle>{t('a1class1.learningPath')}</CardTitle></CardHeader>
                    <CardContent>
                      <nav>
                        <ul className="space-y-1">
                          {learningPath.map((item) => {
                            const Icon = item.icon ?? BookOpen;
                            const isLocked = item.status === 'locked' && !isAdmin;
                            return(
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
                                          const SubIcon = subItem.icon || (subItem.status === 'completed' ? CheckCircle : (subItem.status === 'active' ? BookOpen : PenSquare));
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
                                              <div className="flex items-center gap-3">
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
};

// =================================================================
//                 MAIN ROUTER COMPONENT
// =================================================================
export default function EngA1ClassPage() {
    const params = useParams();
    const classId = params.classId as string;
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

    const commonProps = { t, toast, studentDocRef, studentProfile, isAdmin, isProfileLoading };

    if (classId === '1') {
        return <Class1Content {...commonProps} />;
    }
    
    if (classId === '2') {
        return <Class2Content {...commonProps} />;
    }

    return (
      <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <Link href="/ingles/a1/unit/1" className="hover:underline text-sm text-muted-foreground">
                  Volver a la unidad 1
              </Link>
              <h1 className="text-4xl font-bold dark:text-primary">Clase {classId}</h1>
            </div>
            <Card>
              <CardHeader><CardTitle>Contenido Próximamente</CardTitle></CardHeader>
              <CardContent><p>El contenido para esta clase estará disponible pronto.</p></CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
}
