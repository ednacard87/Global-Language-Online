'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, Info, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { ErrorCorrectionExercise, type ErrorCorrectionPrompt } from '@/components/kids/exercises/error-correction-exercise';
import { PresentSimpleExercise, type ExercisePrompt } from '@/components/kids/exercises/present-simple';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { Class5VocabExercise } from '@/components/kids/exercises/class5-vocab-exercise';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
};

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const progressStorageVersion = 'progress_a1_eng_unit_1_class_5_v5_stable';
const mainProgressKey = 'progress_a1_eng_unit_1_class_5';

const vocabularyData = {
    verbos: [
        { spanish: 'SALTAR', english: 'JUMP' },
        { spanish: 'QUERER', english: 'WANT' },
        { spanish: 'PODER', english: 'CAN' },
        { spanish: 'DEBER', english: 'SHOULD' },
        { spanish: 'VIAJAR', english: 'TRAVEL' },
        { spanish: 'LLAMAR', english: 'CALL' },
        { spanish: 'MANEJAR', english: 'DRIVE' },
        { spanish: 'COCINAR', english: 'COOK' },
        { spanish: 'LEVANTARSE', english: 'GET UP' },
        { spanish: 'ESTAR DE PIE', english: 'STAND UP' },
        { spanish: 'DESPERTARSE', english: 'WAKE UP' },
        { spanish: 'RECIBIR', english: 'RECEIVE' },
        { spanish: 'ENVIAR', english: 'SEND' },
        { spanish: 'VIVIR', english: 'LIVE' },
        { spanish: 'TOMAR- AGARRAR', english: 'TAKE' },
        { spanish: 'ABRIR', english: 'OPEN' },
        { spanish: 'CERRAR', english: 'CLOSE' },
        { spanish: 'VENIR', english: 'COME' },
        { spanish: 'LLEGAR', english: 'ARRIVE' },
    ],
    adjetivos: [
        { spanish: 'ABURRIDO', english: 'BORED' },
        { spanish: 'CANSADO', english: 'TIRED' },
        { spanish: 'HAMBRIENTO', english: 'HUNGRY' },
        { spanish: 'ENOJADO', english: 'ANGRY' },
        { spanish: 'PREOCUPADO', english: 'WORRIED' },
        { spanish: 'SEDIENTO-CON SED', english: 'THIRSTY' },
        { spanish: 'PESADO', english: 'HEAVY' },
        { spanish: 'LIVIANO', english: 'LIGHT' },
        { spanish: 'TRISTE', english: 'SAD' },
        { spanish: 'OCUPADO', english: 'BUSY' },
    ]
};

const exercise1Data: ErrorCorrectionPrompt[] = [
    { incorrect: "SHE DONT ANSWER MY QUESTION", translationHint: "(ELLA NO CONTESTA MIS PREGUNTAS)", correctAnswers: ["she does not answer my questions", "she doesn't answer my questions"] },
    { incorrect: "WE DONT GOES TO SCHOL THE SONDAYS.", translationHint: "", correctAnswers: ["we do not go to school on sundays", "we don't go to school on sundays"] },
    { incorrect: "DOIS JOSEPH LIKES MUVIS?", translationHint: "(¿A JOSEPH LE GUSTAN LAS PELÍCULAS?)", correctAnswers: ["does joseph like movies?"] },
    { incorrect: "I DONT WORKS THERE", translationHint: "( YO NO TRABAJO ALLA)", correctAnswers: ["i do not work there", "i don't work there"] },
    { incorrect: "SHI ARE NO ROSE", translationHint: "( ELLA NO ES LUISA)", correctAnswers: ["she is not rose", "she isn't rose"] },
    { incorrect: "DOES SHE ARE YUR MOTHER?", translationHint: "(ELLA ES TU MAMA?)", correctAnswers: ["is she your mother?"] },
    { incorrect: "DO YOU TRAVELS EVERY WINTAR OR SOMER?", translationHint: "(¿VIAJAS CADA VERANO?)", correctAnswers: ["do you travel every winter or summer?"] },
    { incorrect: "DOES MARCO AND MARIA GOES THERE?", translationHint: "(¿MARCO Y MARIA VAN ALLA?)", correctAnswers: ["do marco and maria go there?"] },
    { incorrect: "MARY’S PLEY EVERY DEY", translationHint: "", correctAnswers: ["mary plays every day"] },
    { incorrect: "WHAT DO SHE DOES?", translationHint: "(QUE HACE ELLA?)", correctAnswers: ["what does she do?"] },
    { incorrect: "WHERE DOES HE GOUS?", translationHint: "(¿DONDE VA EL?)", correctAnswers: ["where does he go?"] },
    { incorrect: "WHY DOES YOU WORKS IN THE NIGTH?", translationHint: "", correctAnswers: ["why do you work at night?"] },
    { incorrect: "SHE STUDYS ITALIANO END ESPANISH.", translationHint: "(ELLA ESTUDIA ITALIANO Y ESPAÑOL)", correctAnswers: ["she studies italian and spanish"] },
    { incorrect: "THEY DON’T ARE OUR TEACHERS", translationHint: "(ELLOS NO SON NUESTROS PROFESORES)", correctAnswers: ["they are not our teachers", "they aren't our teachers"] },
    { incorrect: "DO YOU WORK ARE IN JON COMPANY?", translationHint: "(¿TRABAJAS EN LA EMPRESA DE JON?)", correctAnswers: ["do you work in jon's company?"] }
];

const class5Exercise2Data: ExercisePrompt[] = [
    {
        spanish: "EL BEBE LECHE",
        answers: {
            affirmative: ["he drinks milk"],
            negative: ["he does not drink milk", "he doesn't drink milk"],
            interrogative: ["does he drink milk?"],
        }
    },
    {
        spanish: "EL JUEGA FUTBOL CON SU HERMANO",
        answers: {
            affirmative: ["he plays soccer with his brother", "he plays football with his brother"],
            negative: ["he does not play soccer with his brother", "he doesn't play soccer with his brother", "he does not play football with his brother", "he doesn't play football with his brother"],
            interrogative: ["does he play soccer with his brother?", "does he play football with his brother?"],
        }
    },
    {
        spanish: "YO NADO LOS DOMINGOS",
        answers: {
            affirmative: ["i swim on sundays"],
            negative: ["i do not swim on sundays", "i don't swim on sundays"],
            interrogative: ["do i swim on sundays?"],
        }
    },
    {
        spanish: "TU TRABAJAS LOS SABADOS",
        answers: {
            affirmative: ["you work on saturdays"],
            negative: ["you do not work on saturdays", "you don't work on saturdays"],
            interrogative: ["do you work on saturdays?"],
        }
    }
];

export default function EngA1Class5Page() {
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
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // State for vocabulary exercise
    const [vocabAnswers, setVocabAnswers] = useState<{[key: string]: string[]}>({});
    const [vocabValidation, setVocabValidation] = useState<{[key: string]: ('correct' | 'incorrect' | 'unchecked')[]}>({});
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'nota-importante', name: 'Nota Importante', icon: Info, status: 'locked' },
        { key: 'ejercicio-1', name: 'Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'ejercicio-2', name: 'Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'ejercicio-3', name: 'Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'ejercicio-vocabulario', name: 'Ejercicio Vocabulario', icon: PenSquare, status: 'locked' },
        { key: 'ejercicio-4', name: 'Ejercicio 4', icon: PenSquare, status: 'locked' },
    ], []);
    
    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;

        let path = initialLearningPath.map(topic => ({ ...topic }));
        let savedSelectedTopic = '';

        if (isAdmin) {
          path.forEach(item => { item.status = 'completed'; });
        } else if(studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedData = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => {
                if (savedData[item.key]) item.status = savedData[item.key];
            });
            savedSelectedTopic = savedData.lastSelectedTopic || '';
        }

        let lastDone = true;
        for(let i=0; i < path.length; i++) {
            if (lastDone && path[i].status === 'locked') path[i].status = 'active';
            lastDone = path[i].status === 'completed';
        }

        setLearningPath(path);
        const firstActive = path.find(p => p.status === 'active');
        setSelectedTopic(savedSelectedTopic || firstActive?.key || path[0].key);

        const initAnswers: any = {};
        const initVal: any = {};
        Object.keys(vocabularyData).forEach(cat => {
            initAnswers[cat] = Array((vocabularyData as any)[cat].length).fill('');
            initVal[cat] = Array((vocabularyData as any)[cat].length).fill('unchecked');
        });
        setVocabAnswers(initAnswers);
        setVocabValidation(initVal);

        setInitialLoadComplete(true);
        setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete, t]);
    
    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;

        const statusesToSave: Record<string, any> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => { statusesToSave[item.key] = item.status; });

        const savedData = studentProfile?.lessonProgress?.[progressStorageVersion];
        if (JSON.stringify(statusesToSave) !== JSON.stringify(savedData)) {
            updateDocumentNonBlocking(studentDocRef, {
                [`lessonProgress.${progressStorageVersion}`]: statusesToSave,
                [`progress.${mainProgressKey}`]: Math.round(progressValue)
            });
        }
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, studentProfile, isInitialLoading]);

    useEffect(() => {
        if (!topicToComplete) return;
    
        setLearningPath(currentPath => {
            let wasUnlocked = false;
            let nextToSelect: string | null = null;
            const newPath = currentPath.map(t => ({ ...t }));
          
            let topicFound = false;
            for (let i = 0; i < newPath.length && !topicFound; i++) {
                if (newPath[i].key === topicToComplete) {
                    if (newPath[i].status !== 'completed') newPath[i].status = 'completed';
                    if (i + 1 < newPath.length && newPath[i + 1].status === 'locked') {
                        newPath[i + 1].status = 'active';
                        wasUnlocked = true;
                        nextToSelect = newPath[i + 1].key;
                    }
                    topicFound = true;
                }
            }
            if (wasUnlocked) setTimeout(() => toast({ title: "¡Siguiente tema desbloqueado!" }), 0);
            if (nextToSelect) {
                const finalNext = nextToSelect;
                setTimeout(() => setSelectedTopic(finalNext), 0);
            }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast, isAdmin]);

    const handleTopicComplete = (completedKey: string) => {
        setTopicToComplete(completedKey);
    };

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') {
            toast({ variant: "destructive", title: "Contenido Bloqueado" });
            return;
        }
        setSelectedTopic(topicKey);

        const autoViewTopics = ['nota-importante'];
        if (autoViewTopics.includes(topicKey)) {
            handleTopicComplete(topicKey);
        }
    };

    const handleVocabChange = (cat: string, idx: number, val: string) => {
        const newAns = { ...vocabAnswers };
        newAns[cat][idx] = val;
        setVocabAnswers(newAns);
        const newVal = { ...vocabValidation };
        newVal[cat][idx] = 'unchecked';
        setVocabValidation(newVal);
        setCanAdvanceVocab(false);
    };

    const handleCheckVocab = () => {
        let oneCorrect = false;
        const newVal: any = {};
        Object.keys(vocabularyData).forEach(cat => {
            newVal[cat] = (vocabularyData as any)[cat].map((item: any, idx: number) => {
                const userVal = (vocabAnswers[cat][idx] || '').trim().toUpperCase();
                const isCorrect = userVal === item.english.toUpperCase();
                if (isCorrect) oneCorrect = true;
                return isCorrect ? 'correct' : 'incorrect';
            });
        });
        setVocabValidation(newVal);
        if (oneCorrect) {
            toast({ title: '¡Bien hecho!' });
            setCanAdvanceVocab(true);
        } else {
            toast({ variant: 'destructive', title: 'Sigue intentando' });
        }
    };

    const getVocabClass = (cat: string, idx: number) => {
        const status = vocabValidation[cat]?.[idx];
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500 bg-green-50 dark:bg-green-900/10';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive bg-destructive/5';
        return '';
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center min-h-[400px]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

        const topic = learningPath.find(t => t.key === selectedTopic);

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader><CardTitle>Vocabulario</CardTitle></CardHeader>
                        <CardContent>
                            <Accordion type="multiple" defaultValue={['verbos', 'adjetivos']} className="w-full">
                                {Object.keys(vocabularyData).map(cat => (
                                    <AccordionItem key={cat} value={cat}>
                                        <AccordionTrigger className="text-lg font-semibold capitalize">{cat}</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                                <div className="font-bold p-3 bg-muted rounded-lg text-left">Español</div>
                                                <div className="font-bold p-3 bg-muted rounded-lg text-left">Inglés</div>
                                                {(vocabularyData as any)[cat].map((word: any, index: number) => (
                                                    <React.Fragment key={`${cat}-${index}`}>
                                                        <div className="p-3 bg-card border rounded-lg flex items-center font-medium">{word.spanish}</div>
                                                        <div className="p-3 bg-card border rounded-lg flex items-center">
                                                             <Input value={vocabAnswers[cat]?.[index] || ''} onChange={e => handleVocabChange(cat, index, e.target.value)} className={cn(getVocabClass(cat, index))} autoComplete="off" />
                                                        </div>
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button onClick={handleCheckVocab}>Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'nota-importante':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader><CardTitle>Notas Importantes</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg space-y-2 text-base">
                                <p><strong>1. Dos verbos juntos:</strong> se agrega "TO" en la mitad.</p>
                                <p><strong>2. Verbo "GO":</strong> "go to the + lugar" o "go + sin lugar".</p>
                                <p><strong>3. ¡NUNCA!:</strong> Una frase tiene verbo TO BE y DO/DOES al tiempo.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center"><Button onClick={() => handleTopicComplete('nota-importante')} size="lg">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'ejercicio-1': return <ErrorCorrectionExercise exerciseData={exercise1Data} onComplete={() => handleTopicComplete('ejercicio-1')} title="Ejercicio 1" />;
            case 'ejercicio-2': return <PresentSimpleExercise exerciseData={class5Exercise2Data} onComplete={() => handleTopicComplete('ejercicio-2')} title="Ejercicio 2" showShortAnswers={false} />;
            case 'ejercicio-3': return <SimpleTranslationExercise course="a1" exerciseKey="c5_mixed3" onComplete={() => handleTopicComplete('ejercicio-3')} title="Ejercicio 3" />;
            case 'ejercicio-vocabulario': return <Class5VocabExercise onComplete={() => handleTopicComplete('ejercicio-vocabulario')} />;
            case 'ejercicio-4': return <SimpleTranslationExercise course="a1" exerciseKey="c5_mixed4" onComplete={() => handleTopicComplete('ejercicio-4')} title="Ejercicio 4" />;
            default: return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-left text-white">
                        <Link href="/ingles/a1/unit/1" className="hover:underline text-sm">Volver a la unidad 1</Link>
                        <h1 className="text-4xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase 5 (A1)</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9">{renderContent()}</div>
                        <div className="md:col-span-3 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader><CardTitle>Ruta de Aprendizaje</CardTitle></CardHeader>
                                <CardContent>
                                    <nav>
                                        <ul className="space-y-1">
                                            {learningPath.map((item) => {
                                                const Icon = item.status === 'completed' ? CheckCircle : (item.status === 'active' ? item.icon : Lock);
                                                const isLocked = item.status === 'locked' && !isAdmin;
                                                return (
                                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                                        className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer',
                                                            isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted',
                                                            selectedTopic === item.key && 'bg-muted text-primary font-semibold'
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Icon className={cn("h-5 w-5", item.status === 'completed' ? 'text-green-500' : '')} />
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
