'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    GraduationCap, 
    CheckCircle, 
    Loader2, 
    ArrowRight,
    Pencil,
    Clock,
    Check,
    Info,
    Globe,
    ArrowLeft,
    Trophy
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { CreativeWritingExercise } from '@/components/dashboard/creative-writing-exercise';
import { ShortAnswerPresentSimpleExercise, type ShortAnswerPresentSimplePrompt } from '@/components/kids/exercises/short-answer-present-simple';
import { Label } from '@/components/ui/label';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'completed' | 'active' | 'locked';
};

const progressStorageVersion = 'progress_a1_eng_u3_c12_v11_more_ex4';
const mainProgressKey = 'progress_a1_eng_unit_3_class_12';

const timeExpressionsData = [
    { spanish: 'ANOCHE', english: ['LAST NIGHT'] },
    { spanish: 'ESTA NOCHE', english: ['TONIGHT'] },
    { spanish: 'LA SEMANA PASADA', english: ['LAST WEEK'] },
    { spanish: 'EL AÑO PASADO', english: ['LAST YEAR'] },
    { spanish: 'EN LA MAÑANA', english: ['IN THE MORNING'] },
    { spanish: 'EN LA TARDE', english: ['IN THE AFTERNOON'] },
    { spanish: 'EN LA NOCHE', english: ['AT NIGHT'] },
    { spanish: 'RECIENTEMENTE', english: ['RECENTLY', 'LATELY'] },
    { spanish: 'ESTA SEMANA', english: ['THIS WEEK'] },
    { spanish: 'LA PROX. SEMANA', english: ['NEXT WEEK'] },
    { spanish: 'ESTA MAÑANA', english: ['THIS MORNING'] },
    { spanish: 'HACE UNA HORA', english: ['AN HOUR AGO'] },
    { spanish: 'HACE 5 MINUTOS', english: ['FIVE MINUTES AGO'] },
    { spanish: 'EN EL PASADO', english: ['IN THE PAST'] },
    { spanish: 'EN EL FUTURO', english: ['IN THE FUTURE'] },
    { spanish: 'AHORA- YA', english: ['NOW'] },
];

const class12Exercise3Data: ShortAnswerPresentSimplePrompt[] = [
    { question: "ARE YOU CALLING YOUR MOTHER?", answers: { shortAffirmative: ["yes, i am"], shortNegative: ["no, i am not", "no, i'm not"] } },
    { question: "ARE YOU TIRED?", answers: { shortAffirmative: ["yes, i am"], shortNegative: ["no, i am not", "no, i'm not"] } },
    { question: "IS SHE SLEEPING?", answers: { shortAffirmative: ["yes, she is"], shortNegative: ["no, she is not", "no, she isn't"] } },
    { question: "IS SHE JULIA?", answers: { shortAffirmative: ["yes, she is"], shortNegative: ["no, she is not", "no, she isn't"] } },
    { question: "ARE THEY ARRIVING ON SUNDAY?", answers: { shortAffirmative: ["yes, they are"], shortNegative: ["no, they are not", "no, they aren't"] } },
    { question: "ARE THEY STUDENTS?", answers: { shortAffirmative: ["yes, they are"], shortNegative: ["no, they are not", "no, they aren't"] } },
    { question: "IS HE DRINKING RED WINE?", answers: { shortAffirmative: ["yes, he is"], shortNegative: ["no, he is not", "no, he isn't"] } },
    { question: "ARE THEY FOOTBALL PLAYERS?", answers: { shortAffirmative: ["yes, they are"], shortNegative: ["no, they are not", "no, they aren't"] } },
    { question: "ARE THEY EATING HAMBURGERS?", answers: { shortAffirmative: ["yes, they are"], shortNegative: ["no, they are not", "no, they aren't"] } },
    { question: "IS HE DRIVING A TRUCK?", answers: { shortAffirmative: ["yes, he is"], shortNegative: ["no, he is not", "no, he isn't"] } },
    { question: "IS MARIO SINGING IN THE BATHROOM?", answers: { shortAffirmative: ["yes, he is"], shortNegative: ["no, he is not", "no, he isn't"] } },
    { question: "IS SHE LOOKING FOR A JOB?", answers: { shortAffirmative: ["yes, she is"], shortNegative: ["no, she is not", "no, she isn't"] } },
];

const class12Exercise4Data = [
    { 
        spanish: "ELLA ESCRIBE - ELLA ESTA ESCRIBIENDO", 
        answers: { 
            simple: ["she writes"], 
            continuous: ["she is writing", "she's writing"] 
        } 
    },
    { 
        spanish: "ELLA NO TRABAJA - ELLA NO ESTA TRABAJANDO", 
        answers: { 
            simple: ["she does not work", "she doesn't work", "she works not"], 
            continuous: ["she is not working", "she'n not working", "she isn't working"] 
        } 
    },
    { 
        spanish: "¿EL CANTA? - ¿EL ESTA CANTANDO?", 
        answers: { 
            simple: ["does he sing?"], 
            continuous: ["is he singing?"] 
        } 
    },
    { 
        spanish: "¿TÚ ESTUDIAS? - ¿ESTÁS ESTUDIANDO?", 
        answers: { 
            simple: ["do you study?"], 
            continuous: ["are you studying?"] 
        } 
    },
    { 
        spanish: "¿ELLA HABLA ALEMAN? – ¿ELLA ESTA HABLANDO INGLÉS?", 
        answers: { 
            simple: ["does she speak german?"], 
            continuous: ["is she speaking english?"] 
        } 
    },
    { 
        spanish: "¿ELLOS ESTAN CORRIENDO? –¿ELLOS CORREN EN LA CASA?", 
        answers: { 
            simple: ["do they run in the house?"], 
            continuous: ["are they running?"] 
        } 
    },
    { 
        spanish: "¿QUE HACES? – ¿QUE ESTAS HACIENDO?", 
        answers: { 
            simple: ["what do you do?"], 
            continuous: ["what are you doing?", "what're you doing?"] 
        } 
    },
    { 
        spanish: "¿A DONDE ESTAS YENDO? - ¿A DONDE VAS?", 
        answers: { 
            simple: ["where do you go?"], 
            continuous: ["where are you going?", "where're you going?"] 
        } 
    },
    { 
        spanish: "¿DONDE TRABAJAS? –¿DONDE ESTAS TRABAJANDO?", 
        answers: { 
            simple: ["where do you work?"], 
            continuous: ["where are you working?", "where're you working?"] 
        } 
    },
    { 
        spanish: "¿ELLA ESTA DURMIENDO? - ¿ELLA DUERME EN LA TARDE?", 
        answers: { 
            simple: ["does she sleep in the afternoon?"], 
            continuous: ["is she sleeping?"] 
        } 
    },
    { 
        spanish: "¿ELLOS ESCRIBEN LIBROS? - ¿ELLOS ESTAN ESCRIBIENDO LIBROS ?", 
        answers: { 
            simple: ["do they write books?"], 
            continuous: ["are they writing books?"] 
        } 
    },
    { 
        spanish: "¿TRABAJAS? - ¿ESTÁS TRABAJANDO?", 
        answers: { 
            simple: ["do you work?"], 
            continuous: ["are you working?", "are you working?"] 
        } 
    },
];

const SimpleVsContinuousExercise = ({ onComplete }: { onComplete: () => void }) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({ simple: '', continuous: '' });
    const [validation, setValidation] = useState({ simple: 'unchecked', continuous: 'unchecked' });
    const [showCompletion, setShowCompletion] = useState(false);

    const currentPrompt = class12Exercise4Data[currentIndex];

    useEffect(() => {
        setAnswers({ simple: '', continuous: '' });
        setValidation({ simple: 'unchecked', continuous: 'unchecked' });
    }, [currentIndex]);

    const handleCheck = () => {
        const checkSimple = currentPrompt.answers.simple.map(a => a.toLowerCase().replace(/[.?]/g, ''))
            .includes(answers.simple.trim().toLowerCase().replace(/[.?]/g, ''));
        
        const checkContinuous = currentPrompt.answers.continuous.map(a => a.toLowerCase().replace(/[.?]/g, ''))
            .includes(answers.continuous.trim().toLowerCase().replace(/[.?]/g, ''));

        setValidation({
            simple: checkSimple ? 'correct' : 'incorrect',
            continuous: checkContinuous ? 'correct' : 'incorrect'
        });

        if (checkSimple && checkContinuous) {
            toast({ title: "¡Excelente!", description: "Ambas traducciones son correctas." });
        } else {
            toast({ variant: 'destructive', title: "Revisa tus respuestas", description: "Una o ambas traducciones no coinciden." });
        }
    };

    const handleNext = () => {
        if (currentIndex < class12Exercise4Data.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setShowCompletion(true);
            onComplete();
        }
    };

    if (showCompletion) {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
                    <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
                    <h2 className="text-3xl font-bold">¡Ejercicio Completado!</h2>
                    <p className="text-muted-foreground mt-2">Has dominado la diferencia entre los tiempos presentes.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>Exercise 4: Simple vs Continuous</CardTitle>
                <CardDescription>Traduce la frase a Present Simple y Present Continuous.</CardDescription>
                <div className="flex flex-wrap gap-2 pt-4">
                    {class12Exercise4Data.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={cn(
                                "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all",
                                currentIndex === idx ? "bg-primary border-primary text-white" : "bg-muted border-border"
                            )}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 bg-muted rounded-xl border-2 border-dashed">
                    <p className="text-center text-xl font-bold">"{currentPrompt.spanish}"</p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="font-bold text-primary">Present Simple</Label>
                        <Input 
                            value={answers.simple} 
                            onChange={e => { setAnswers(prev => ({ ...prev, simple: e.target.value })); setValidation(v => ({ ...v, simple: 'unchecked' })); }}
                            className={cn(validation.simple === 'correct' ? 'border-green-500' : validation.simple === 'incorrect' ? 'border-destructive' : '')}
                            placeholder="Escribe aquí..."
                            autoComplete="off"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="font-bold text-primary">Present Continuous</Label>
                        <Input 
                            value={answers.continuous} 
                            onChange={e => { setAnswers(prev => ({ ...prev, continuous: e.target.value })); setValidation(v => ({ ...v, continuous: 'unchecked' })); }}
                            className={cn(validation.continuous === 'correct' ? 'border-green-500' : validation.continuous === 'incorrect' ? 'border-destructive' : '')}
                            placeholder="Escribe aquí..."
                            autoComplete="off"
                        />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck}>Verificar</Button>
                    <Button onClick={handleNext} disabled={validation.simple !== 'correct' || validation.continuous !== 'correct'}>
                        {currentIndex === class12Exercise4Data.length - 1 ? 'Finalizar' : 'Siguiente'} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};

export default function EngA1Class12Page() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
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
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // Vocab State
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(timeExpressionsData.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(timeExpressionsData.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary (Time Expressions)', icon: Clock, status: 'active' },
        { key: 'grammar', name: 'Grammar', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'grammar2', name: 'Grammar 2', icon: GraduationCap, status: 'locked' },
        { key: 'ex2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'create1', name: 'Create 1', icon: Pencil, status: 'locked' },
        { key: 'ex3', name: 'Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'ex4', name: 'Exercise 4', icon: PenSquare, status: 'locked' },
        { key: 'ex5', name: 'Exercise 5', icon: PenSquare, status: 'locked' },
        { key: 'ex6', name: 'Exercise 6', icon: PenSquare, status: 'locked' },
        { key: 'grammar3', name: 'Grammar 3', icon: GraduationCap, status: 'locked' },
        { key: 'ex7', name: 'Exercise 7', icon: PenSquare, status: 'locked' },
        { key: 'ex8', name: 'Exercise 8', icon: Pencil, status: 'locked' },
        { key: 'ex9', name: 'Exercise 9', icon: PenSquare, status: 'locked' },
        { key: 'ex10', name: 'Exercise 10', icon: PenSquare, status: 'locked' },
    ], []);
    
    useEffect(() => {
        if (isProfileLoading || isUserLoading || !initialLearningPath.length) return;

        const path = initialLearningPath.map(topic => ({ ...topic }));
        let savedSelectedTopic = '';

        if (isAdmin) {
            path.forEach(item => { item.status = 'completed'; });
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedData = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => {
                if (savedData[item.key]) item.status = savedData[item.key];
            });
            savedSelectedTopic = savedData.lastSelectedTopic || '';
        }
        
        setLearningPath(path);
        if (!initialLoadComplete) {
            const firstActive = path.find(p => p.status === 'active');
            setSelectedTopic(savedSelectedTopic || firstActive?.key || 'vocabulary');
            setInitialLoadComplete(true);
        }
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete]);
    
    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isUserLoading || isProfileLoading || learningPath.length === 0 || isAdmin || !studentDocRef) return;

        const statusesToSave: Record<string, any> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => { statusesToSave[item.key] = item.status; });

        updateDocumentNonBlocking(studentDocRef, { 
            [`lessonProgress.${progressStorageVersion}`]: statusesToSave,
            [`progress.${mainProgressKey}`]: Math.round(progressValue)
        });
        
        if (progressValue >= 100) {
            window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isUserLoading, isProfileLoading, initialLoadComplete]);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    useEffect(() => {
        if (!topicToComplete) return;
    
        setLearningPath(currentPath => {
            const newPath = currentPath.map(item => ({ ...item }));
            const currentIndex = newPath.findIndex(item => item.key === topicToComplete);
            
            if (currentIndex !== -1 && newPath[currentIndex].status !== 'completed') {
                newPath[currentIndex].status = 'completed';
                const nextIndex = currentIndex + 1;
                if (nextIndex < newPath.length && newPath[nextIndex].status === 'locked') {
                    newPath[nextIndex].status = 'active';
                    setSelectedTopic(newPath[nextIndex].key);
                    toast({ title: "¡Siguiente tema desbloqueado!" });
                }
            }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') {
            toast({ variant: "destructive", title: "Contenido Bloqueado", description: "Debes completar los temas anteriores." });
            return;
        }
        setSelectedTopic(topicKey);

        const autoViewTopics = ['grammar', 'grammar2', 'grammar3'];
        if (autoViewTopics.includes(topicKey)) {
            handleTopicComplete(topicKey);
        }
    };

    const handleVocabInputChange = (index: number, value: string) => {
        const newAns = [...vocabAnswers];
        newAns[index] = value;
        setVocabAnswers(newAns);
        const newVal = [...vocabValidation];
        newVal[index] = 'unchecked';
        setVocabValidation(newVal as any);
        setCanAdvanceVocab(false);
    };

    const handleCheckVocab = () => {
        let atLeastOneCorrect = false;
        const newVal = timeExpressionsData.map((item, index) => {
            const userAnswer = vocabAnswers[index]?.trim().toUpperCase();
            const isCorrect = item.english.some(ans => ans.toUpperCase() === userAnswer);
            if (isCorrect) atLeastOneCorrect = true;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabValidation(newVal as any);
        if (atLeastOneCorrect) {
            toast({ title: "¡Buen trabajo!", description: "Has acertado al menos una. ¡Ya puedes avanzar!" });
            setCanAdvanceVocab(true);
        } else {
            toast({ variant: 'destructive', title: "Sigue intentando", description: "Necesitas al menos una correcta para avanzar." });
        }
    };

    const getVocabInputClass = (index: number) => {
        const status = vocabValidation[index];
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500 bg-green-50 dark:bg-green-900/10';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive bg-destructive/5';
        return '';
    };

    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic);

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Vocabulary (Time Expressions)</CardTitle>
                            <CardDescription>Traduce las expresiones de tiempo al inglés. Al menos una correcta para avanzar.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-lg">
                                <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-sm text-left">Spanish</div>
                                <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-sm text-left">English</div>
                                {timeExpressionsData.map((item, idx) => (
                                    <React.Fragment key={idx}>
                                        <div className="flex items-center text-base font-medium py-1 text-left">
                                            {item.spanish}
                                        </div>
                                        <div className="flex items-center">
                                            <Input 
                                                value={vocabAnswers[idx] || ''}
                                                onChange={(e) => handleVocabInputChange(idx, e.target.value)}
                                                className={cn("h-10 uppercase font-mono text-sm", getVocabInputClass(idx))}
                                                placeholder="..."
                                                autoComplete="off"
                                            />
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center border-t pt-6">
                            <Button onClick={handleCheckVocab} variant="secondary">Verificar</Button>
                            <Button 
                                onClick={() => handleTopicComplete('vocabulary')} 
                                disabled={!canAdvanceVocab && !isAdmin}
                                className={cn(canAdvanceVocab && "bg-green-600 hover:bg-green-700 shadow-lg")}
                            >
                                Avanzar <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                        <CardHeader className="bg-primary/10 border-b">
                            <div className="flex items-center gap-3">
                                <GraduationCap className="h-6 w-6 text-primary" />
                                <CardTitle className="text-2xl">PRESENT CONTINUOUS</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-8">
                            <div className="bg-muted/50 p-6 rounded-2xl border-2 border-dashed">
                                <h3 className="text-xl font-bold text-primary mb-3">¿Qué es?</h3>
                                <p className="text-lg leading-relaxed">
                                    Se utiliza para describir acciones que están ocurriendo <strong>en este preciso momento</strong>. El verbo principal termina en <strong>-ING</strong>, que equivale a las terminaciones <strong>"-ando"</strong> o <strong>"-endo"</strong> en español.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xl font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                    FORMAS Y ESTRUCTURA:
                                </h3>
                                
                                <div className="grid gap-4">
                                    <div className="p-4 border rounded-xl bg-background shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm">+</div>
                                            <h4 className="font-bold text-lg">AFIRMATIVA</h4>
                                        </div>
                                        <p className="font-mono text-base bg-muted p-2 rounded">
                                            Pronoun + <span className="text-primary font-bold">To Be</span> + Verb <span className="underline text-brand-purple font-bold">ING</span> + Complement
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-2 italic">Example: I am working now. (Yo estoy trabajando ahora).</p>
                                    </div>

                                    <div className="p-4 border rounded-xl bg-background shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-sm">-</div>
                                            <h4 className="font-bold text-lg">NEGATIVA</h4>
                                        </div>
                                        <p className="font-mono text-base bg-muted p-2 rounded">
                                            Pronoun + <span className="text-primary font-bold">To Be</span> + <span className="text-red-500 font-bold">NOT</span> + Verb <span className="underline text-brand-purple font-bold">ING</span> + Complement
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-2 italic">Example: She is not sleeping. (Ella no está durmiendo).</p>
                                    </div>

                                    <div className="p-4 border rounded-xl bg-background shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">?</div>
                                            <h4 className="font-bold text-lg">INTERROGATIVA</h4>
                                        </div>
                                        <p className="font-mono text-base bg-muted p-2 rounded">
                                            <span className="text-primary font-bold">To Be</span> + Pronoun + Verb <span className="underline text-brand-purple font-bold">ING</span> + Complement?
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-2 italic">Example: Are they playing soccer? (¿Están ellos jugando futbol?).</p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h3 className="text-xl font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                    SHORT ANSWERS (Respuestas Cortas):
                                </h3>
                                <div className="grid sm:grid-cols-2 gap-4 font-mono">
                                    <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 rounded-xl">
                                        <p className="font-bold text-green-700 dark:text-green-400 mb-1">(+A) POSITIVA</p>
                                        <p className="text-lg">Yes, Pronoun + To be</p>
                                        <p className="text-xs text-muted-foreground mt-1">Ex: Yes, I am. / Yes, he is.</p>
                                    </div>
                                    <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 rounded-xl">
                                        <p className="font-bold text-red-700 dark:text-red-400 mb-1">(-A) NEGATIVA</p>
                                        <p className="text-lg">No, Pronoun + To be + Not</p>
                                        <p className="text-xs text-muted-foreground mt-1">Ex: No, I am not. / No, they aren't.</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6">
                            <Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-12 font-bold">
                                Entendido <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                );
            case 'ex1':
                const vocabEx1 = {
                    "programación": "programming",
                    "escuchando": "listening",
                    "abuela": "grandmother / grandma",
                    "llegando": "arriving"
                };
                return <SimpleTranslationExercise exerciseKey="c12_ex1" course="a1" onComplete={() => handleTopicComplete('ex1')} title="Exercise 1" vocabulary={vocabEx1} />;
            case 'grammar2':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                        <CardHeader className="bg-primary/10 border-b">
                            <div className="flex items-center gap-3">
                                <GraduationCap className="h-6 w-6 text-primary" />
                                <CardTitle className="text-2xl uppercase tracking-tighter">Reglas de Ortografía para la forma "-ING"</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <Accordion type="multiple" defaultValue={['rule-1', 'rule-2']} className="w-full space-y-4">
                                <AccordionItem value="rule-1" className="border-2 rounded-xl px-4">
                                    <AccordionTrigger className="text-lg font-bold">1. Verbos terminados en "E"</AccordionTrigger>
                                    <AccordionContent className="space-y-4 pt-2">
                                        <p className="text-muted-foreground">Normalmente la <strong>"e"</strong> se quita delante de la terminación <strong>-ing</strong>.</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-muted rounded-lg font-mono">
                                                <p>To take {"=>"} <span className="text-primary font-bold">Taking</span></p>
                                                <p>To make {"=>"} <span className="text-primary font-bold">Making</span></p>
                                            </div>
                                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg">
                                                <h5 className="font-bold text-yellow-700 dark:text-yellow-400 text-xs uppercase mb-1">Exception:</h5>
                                                <p className="font-mono text-sm">To see {"=>"} <span className="font-bold">Seeing</span></p>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="rule-2" className="border-2 rounded-xl px-4">
                                    <AccordionTrigger className="text-lg font-bold">2. Verbos Monosilábicos (CVC)</AccordionTrigger>
                                    <AccordionContent className="space-y-4 pt-2">
                                        <p className="text-muted-foreground">Cuando el verbo es corto y termina en una <strong>sola vocal</strong> seguida por una <strong>consonante</strong>, la consonante final se duplica.</p>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="p-3 bg-muted rounded-lg font-mono space-y-1">
                                                <p>To stop {"=>"} <span className="text-primary font-bold">Stopping</span></p>
                                                <p>To sit {"=>"} <span className="text-primary font-bold">Sitting</span></p>
                                                <p>To win {"=>"} <span className="text-primary font-bold">Winning</span></p>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
                                                    <h5 className="font-bold text-red-700 dark:text-red-400 text-xs uppercase mb-1">Exception (X, W, Z):</h5>
                                                    <p className="font-mono text-sm">To fix {"=>"} <span className="font-bold">Fixing</span></p>
                                                    <p className="font-mono text-sm">To draw {"=>"} <span className="font-bold">Drawing</span></p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg">
                                            <h5 className="font-bold text-blue-700 dark:text-blue-400 text-xs uppercase mb-1">Nota:</h5>
                                            <p className="text-sm">Si hay <strong>más de una vocal</strong>, NO duplicamos la consonante.</p>
                                            <p className="font-mono text-sm mt-1">To read {"=>"} Reading // To open {"=>"} Opening</p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="rule-3" className="border-2 rounded-xl px-4">
                                    <AccordionTrigger className="text-lg font-bold">3. Verbos Bisilábicos</AccordionTrigger>
                                    <AccordionContent className="space-y-4 pt-2">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="p-3 bg-muted rounded-lg border-l-4 border-primary">
                                                <h5 className="font-bold text-sm mb-1">Acento en la 2ª sílaba:</h5>
                                                <p className="text-xs text-muted-foreground mb-2">La consonante final se dobla.</p>
                                                <div className="font-mono text-sm">
                                                    <p>To begin {"=>"} <span className="font-bold">Beginning</span></p>
                                                    <p>To prefer {"=>"} <span className="font-bold">Preferring</span></p>
                                                </div>
                                            </div>
                                            <div className="p-3 bg-muted rounded-lg border-l-4 border-muted-foreground">
                                                <h5 className="font-bold text-sm mb-1">Acento en la 1ª sílaba:</h5>
                                                <p className="text-xs text-muted-foreground mb-2">No existen modificaciones.</p>
                                                <div className="font-mono text-sm">
                                                    <p>To visit {"=>"} <span className="font-bold">Visiting</span></p>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="rule-4" className="border-2 rounded-xl px-4">
                                    <AccordionTrigger className="text-lg font-bold">4. Verbos terminados en "Y"</AccordionTrigger>
                                    <AccordionContent className="space-y-2 pt-2">
                                        <p className="text-muted-foreground">No existen modificaciones cuando el verbo acaba en vocal o consonante + <strong>Y</strong>.</p>
                                        <div className="p-3 bg-muted rounded-lg font-mono">
                                            <p>To play {"=>"} <span className="text-primary font-bold">Playing</span></p>
                                            <p>To study {"=>"} <span className="text-primary font-bold">Studying</span></p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="rule-5" className="border-2 rounded-xl px-4">
                                    <AccordionTrigger className="text-lg font-bold">5. Verbos terminados en "-IE"</AccordionTrigger>
                                    <AccordionContent className="space-y-2 pt-2">
                                        <p className="text-muted-foreground">Cambiamos este grupo de vocales por una <strong>"Y"</strong> delante de la terminación <strong>-ing</strong>.</p>
                                        <div className="p-3 bg-muted rounded-lg font-mono text-center text-xl">
                                            <p>To die {"=>"} <span className="text-primary font-bold italic">Dying</span></p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="rule-6" className="border-2 rounded-xl px-4">
                                    <AccordionTrigger className="text-lg font-bold">6. Inglés Británico vs Americano</AccordionTrigger>
                                    <AccordionContent className="space-y-4 pt-2">
                                        <p className="text-muted-foreground italic text-sm">Ejemplo con el verbo "Travel":</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-muted rounded-xl text-center border">
                                                <h5 className="font-bold text-primary flex items-center justify-center gap-2">
                                                    <Globe className="h-4 w-4" /> UK
                                                </h5>
                                                <p className="font-mono text-lg font-black">Travelling</p>
                                                <p className="text-[10px] text-muted-foreground">(Dobla la "L")</p>
                                            </div>
                                            <div className="p-4 bg-muted rounded-xl text-center border">
                                                <h5 className="font-bold text-primary flex items-center justify-center gap-2">
                                                    <Globe className="h-4 w-4" /> USA
                                                </h5>
                                                <p className="font-mono text-lg font-black">Traveling</p>
                                                <p className="text-[10px] text-muted-foreground">(Una sola "L")</p>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t">
                            <Button onClick={() => handleTopicComplete('grammar2')} size="lg" className="px-12">He terminado de estudiar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'ex2':
                const vocabEx2 = {
                    "mejor": "better",
                    "cirugía": "surgery",
                    "enseñando": "teaching",
                    "comenzando": "beginning",
                    "camión": "truck",
                    "ganando": "winning"
                };
                return <SimpleTranslationExercise exerciseKey="c12_ex2" course="a1" onComplete={() => handleTopicComplete('ex2')} title="Exercise 2" vocabulary={vocabEx2} />;
            case 'create1':
                return (
                    <CreativeWritingExercise
                        title="Create 1"
                        description="ESCRIBE 2 FRASES AFIRMATIVAS, 2 NEGATIVAS, 2 INTERROGATIVAS CON EL PRESENTE CONTINUO."
                        prompts={[
                            { id: 'af1', question: '1. AF.' },
                            { id: 'af2', question: '2. AF.' },
                            { id: 'neg1', question: '1. NEG.' },
                            { id: 'neg2', question: '2. NEG.' },
                            { id: 'int1', question: '1. INT.' },
                            { id: 'int2', question: '2. INT.' },
                        ]}
                        onComplete={() => handleTopicComplete('create1')}
                        studentDocRef={studentDocRef}
                        initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.create1Data || {}}
                        savePath={`lessonProgress.${progressStorageVersion}.create1Data`}
                        isSingleLine={true}
                    />
                );
            case 'ex3':
                return (
                    <ShortAnswerPresentSimpleExercise
                        title="Exercise 3: Short Answers"
                        description="Escribe las dos respuestas cortas para cada pregunta (+A) y (-A)."
                        exerciseData={class12Exercise3Data}
                        onComplete={() => handleTopicComplete('ex3')}
                    />
                );
            case 'ex4':
                return <SimpleVsContinuousExercise onComplete={() => handleTopicComplete('ex4')} />;
            case 'grammar3':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>{topic?.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Contenido gramatical próximamente.</p>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => handleTopicComplete(selectedTopic)}>Entendido</Button>
                        </CardFooter>
                    </Card>
                );
            default:
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple min-h-[500px]">
                        <CardHeader>
                            <CardTitle>{topic?.name || 'Cargando...'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Contenido interactivo próximamente.</p>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => handleTopicComplete(selectedTopic)}>Completar Actividad</Button>
                        </CardFooter>
                    </Card>
                );
        }
    };

    if (isUserLoading || isProfileLoading) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
    }

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-left">
                        <Link href="/ingles/a1" className="hover:underline text-sm text-white/80">Volver al curso A1</Link>
                        <h1 className="text-4xl font-bold text-white dark:text-primary [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Class 12 (A1)</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9">{renderContent()}</div>
                        <div className="md:col-span-3 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple">
                                <CardHeader><CardTitle>Ruta de Aprendizaje</CardTitle></CardHeader>
                                <CardContent>
                                    <nav>
                                        <ul className="space-y-1">
                                            {learningPath.map((item) => {
                                                const Icon = item.status === 'completed' ? CheckCircle : item.icon;
                                                const isLocked = item.status === 'locked' && !isAdmin;
                                                const isActive = item.status === 'active';
                                                return (
                                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                                        className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer',
                                                            isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted',
                                                            selectedTopic === item.key && 'bg-muted text-primary font-semibold',
                                                            isActive && !isAdmin && "animate-pulse-glow"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Icon className={cn("h-5 w-5", item.status === 'completed' ? 'text-green-500' : (item.status === 'locked' ? 'text-yellow-500' : ''))} />
                                                            <span>{item.name}</span>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </nav>
                                    <div className="mt-6 pt-6 border-t">
                                        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2"><span>Progreso</span><span className="font-bold text-foreground">{progressValue}%</span></div>
                                        <Progress value={progressValue} className="h-2" />
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
