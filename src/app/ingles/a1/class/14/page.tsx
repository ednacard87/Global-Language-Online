'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
    Sparkles,
    Mic,
    Check,
    X
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type TopicStatus = 'completed' | 'active' | 'locked';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: TopicStatus;
};

const progressStorageVersion = 'progress_a1_eng_u3_c14_v5_fix_sync';
const mainProgressKey = 'progress_a1_eng_unit_3_class_14';

const vocabularyData = {
    verbs: [
        { spanish: 'DAR', english: 'TO GIVE' },
        { spanish: 'IR', english: 'TO GO' },
        { spanish: 'HABER-TENER', english: 'TO HAVE' },
        { spanish: 'OIR', english: 'TO HEAR' },
        { spanish: 'CONOCER', english: 'TO KNOW' },
        { spanish: 'IRSE', english: 'TO LEAVE' },
        { spanish: 'PERDER', english: 'TO LOSE' },
        { spanish: 'HACER', english: 'TO MAKE' },
        { spanish: 'ENCONTRAR', english: 'TO MEET' },
        { spanish: 'PONER', english: 'TO PUT' },
        { spanish: 'LEER', english: 'TO READ' },
        { spanish: 'MONTAR (HORSE-BIKE)', english: 'TO RIDE' },
        { spanish: 'CORRER', english: 'TO RUN' },
        { spanish: 'DECIR', english: 'TO SAY' },
        { spanish: 'VENDER', english: 'TO SELL' },
        { spanish: 'ENVIAR', english: 'TO SEND' },
        { spanish: 'CANTAR', english: 'TO SING' },
        { spanish: 'DORMIR', english: 'TO SLEEP' },
    ],
    materials: [
        { spanish: 'TEJIDO', english: 'FABRIC' },
        { spanish: 'LANA', english: 'WOOL' },
        { spanish: 'ALGODÓN', english: 'COTTON' },
        { spanish: 'SEDA', english: 'SILK' },
        { spanish: 'CUERO', english: 'LEATHER' },
        { spanish: 'PIEDRA', english: 'STONE' },
        { spanish: 'BRONCE', english: 'BRONZE' },
        { spanish: 'ACERO', english: 'STEEL' },
        { spanish: 'HIERRO', english: 'IRON' },
        { spanish: 'VIDRIO', english: 'GLASS' },
        { spanish: 'MADERA', english: 'WOOD' },
        { spanish: 'METAL', english: 'METAL' },
        { spanish: 'PLATA', english: 'SILVER' },
        { spanish: 'ORO', english: 'GOLD' },
        { spanish: 'PLASTICO', english: 'PLASTIC' },
    ]
};

// Component for Dictations with automatic saving and Admin Feedback
const LinesWritingExercise = ({ 
    title, 
    description, 
    lineCount = 12,
    onComplete, 
    studentDocRef, 
    initialData,
    initialGrades,
    savePath,
    savePathGrades,
    isAdmin = false,
    hasTitleLine = false
}: { 
    title: string, 
    description: string, 
    lineCount?: number,
    onComplete: () => void,
    studentDocRef: any,
    initialData: string[],
    initialGrades: Record<number, 'correct' | 'incorrect' | null>,
    savePath: string,
    savePathGrades: string,
    isAdmin?: boolean,
    hasTitleLine?: boolean
}) => {
    const totalLines = hasTitleLine ? lineCount + 1 : lineCount;
    const [lines, setLines] = useState<string[]>(Array(totalLines).fill(''));
    const [grades, setGrades] = useState<Record<number, 'correct' | 'incorrect' | null>>(initialGrades || {});
    const initializedRef = useRef(false);

    // Only initialize from server once to avoid blocking typing
    useEffect(() => {
        if (!initializedRef.current && initialData && Array.isArray(initialData)) {
            const newLines = [...Array(totalLines).fill('')];
            initialData.forEach((val, i) => {
                if (i < totalLines) newLines[i] = val || '';
            });
            setLines(newLines);
            if (initialData.length > 0) {
                initializedRef.current = true;
            }
        }
    }, [initialData, totalLines]);

    // Keep grades in sync as they are only changed by admin
    useEffect(() => {
        if (initialGrades) {
            setGrades(initialGrades);
        }
    }, [initialGrades]);

    const handleLineChange = (index: number, value: string) => {
        const newLines = [...lines];
        newLines[index] = value;
        setLines(newLines);
        
        if (studentDocRef) {
            updateDocumentNonBlocking(studentDocRef, {
                [savePath]: newLines
            });
        }
    };

    const handleToggleGrade = (index: number, type: 'correct' | 'incorrect') => {
        if (!isAdmin) return; // Only admins can grade

        const newGrades = { ...grades };
        if (newGrades[index] === type) {
            newGrades[index] = null;
        } else {
            newGrades[index] = type;
        }
        setGrades(newGrades);

        if (studentDocRef) {
            updateDocumentNonBlocking(studentDocRef, {
                [savePathGrades]: newGrades
            });
        }
    };

    const renderRenglon = (line: string, idx: number, isTitle: boolean = false) => {
        const status = grades[idx];
        const inputBorderClass = status === 'correct' ? 'border-green-500 ring-1 ring-green-500' : status === 'incorrect' ? 'border-red-500 ring-1 ring-red-500' : '';

        return (
            <div key={idx} className="flex items-center gap-3 group">
                <span className={cn("font-bold w-8 text-right shrink-0", isTitle ? "text-brand-purple w-20" : "text-primary")}>
                    {isTitle ? "TITULO:" : `${idx}.`}
                </span>
                <Input 
                    value={line} 
                    onChange={(e) => handleLineChange(idx, e.target.value)} 
                    placeholder={isTitle ? "Escribe el título aquí..." : "..."}
                    className={cn(
                        "flex-1 bg-muted/30 focus:bg-background transition-all h-11 border-primary/20",
                        isTitle && "bg-primary/5 h-12 font-bold",
                        inputBorderClass
                    )}
                    autoComplete="off"
                />
                
                {/* Admin Grade Controls */}
                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={() => handleToggleGrade(idx, 'correct')}
                        className={cn(
                            "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                            status === 'correct' 
                                ? "bg-green-500 border-green-600 text-white" 
                                : "bg-gray-200 border-gray-300 dark:bg-gray-800 dark:border-gray-700 text-transparent",
                            !isAdmin && "cursor-default pointer-events-none"
                        )}
                        title={isAdmin ? "Marcar como correcto" : ""}
                    >
                        <Check className="h-3 w-3" />
                    </button>
                    <button
                        onClick={() => handleToggleGrade(idx, 'incorrect')}
                        className={cn(
                            "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                            status === 'incorrect' 
                                ? "bg-red-500 border-red-600 text-white" 
                                : "bg-gray-200 border-gray-300 dark:bg-gray-800 dark:border-gray-700 text-transparent",
                            !isAdmin && "cursor-default pointer-events-none"
                        )}
                        title={isAdmin ? "Marcar como incorrecto" : ""}
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-2xl">{title}</CardTitle>
                <CardDescription className="text-lg font-semibold text-primary">{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto pr-2">
                    {hasTitleLine && renderRenglon(lines[0], 0, true)}
                    {lines.slice(hasTitleLine ? 1 : 0).map((line, idx) => {
                        const actualIndex = hasTitleLine ? idx + 1 : idx;
                        return renderRenglon(line, actualIndex);
                    })}
                </div>
            </CardContent>
            <CardFooter className="pt-6 border-t mt-4">
                <Button onClick={onComplete} size="lg" className="w-full sm:w-auto min-w-[200px]">Completar Tarea</Button>
            </CardFooter>
        </Card>
    );
};

export default function EngA1Class14Page() {
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

    // Vocab States
    const [vocabAnswers, setVocabAnswers] = useState<{[key: string]: string[]}>({});
    const [vocabValidation, setVocabValidation] = useState<{[key: string]: ('correct' | 'incorrect' | 'unchecked')[]}>({});
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary', icon: BookOpen, status: 'active' },
        { key: 'dictation1', name: 'Dictation 1', icon: Mic, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'general_ex', name: 'General Exercise', icon: GraduationCap, status: 'locked' },
        { key: 'dictation2', name: 'Dictation 2', icon: Mic, status: 'locked' },
        { key: 'last_ex', name: 'Last Exercise', icon: Sparkles, status: 'locked' },
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

        // Initialize vocab states
        const initAnswers: any = {};
        const initVal: any = {};
        Object.keys(vocabularyData).forEach(cat => {
            initAnswers[cat] = Array((vocabularyData as any)[cat].length).fill('');
            initVal[cat] = Array((vocabularyData as any)[cat].length).fill('unchecked');
        });
        setVocabAnswers(initAnswers);
        setVocabValidation(initVal);

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
                const correctVal = item.english.toUpperCase();
                const isCorrect = userVal === correctVal;
                if (isCorrect) oneCorrect = true;
                return isCorrect ? 'correct' : 'incorrect';
            });
        });

        setVocabValidation(newVal);
        if (oneCorrect) {
            toast({ title: "¡Buen trabajo!", description: "Has acertado al menos una. ¡Ya puedes avanzar!" });
            setCanAdvanceVocab(true);
        } else {
            toast({ variant: 'destructive', title: "Revisa tus respuestas", description: "Necesitas al menos una correcta para avanzar." });
        }
    };

    const getVocabClass = (cat: string, idx: number) => {
        const status = vocabValidation[cat]?.[idx];
        if (status === 'correct') return 'border-green-500 bg-green-50 dark:bg-green-900/10 focus-visible:ring-green-500';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive';
        return '';
    };

    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic);

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Vocabulary (Verbs and Materials)</CardTitle>
                            <CardDescription>Traduce las palabras al inglés. Para los verbos, incluye la palabra <strong>"TO"</strong> antes (ej: TO GIVE).</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="multiple" defaultValue={['verbs', 'materials']} className="w-full">
                                <AccordionItem value="verbs">
                                    <AccordionTrigger className="text-xl font-bold uppercase text-primary">Lexico: Verbos Básicos</AccordionTrigger>
                                    <AccordionItem value="verbs">
                                    <AccordionContent>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                            <div className="font-bold p-3 bg-muted rounded-lg text-left">Spanish</div>
                                            <div className="font-bold p-3 bg-muted rounded-lg text-left">English (Infinitive)</div>
                                            {vocabularyData.verbs.map((item, idx) => (
                                                <React.Fragment key={`v-${idx}`}>
                                                    <div className="p-3 bg-card border rounded-lg flex items-center font-medium">{item.spanish}</div>
                                                    <div className="p-3 bg-card border rounded-lg flex items-center">
                                                        <Input
                                                            value={vocabAnswers.verbs?.[idx] || ''}
                                                            onChange={e => handleVocabChange('verbs', idx, e.target.value)}
                                                            className={cn("h-11 font-mono uppercase", getVocabClass('verbs', idx))}
                                                            placeholder="TO..."
                                                            autoComplete="off"
                                                        />
                                                    </div>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                </AccordionItem>
                                <AccordionItem value="materials">
                                    <AccordionTrigger className="text-xl font-bold uppercase text-primary">Lexico: Materiales y Tejidos</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                            <div className="font-bold p-3 bg-muted rounded-lg text-left">Spanish</div>
                                            <div className="font-bold p-3 bg-muted rounded-lg text-left">English</div>
                                            {vocabularyData.materials.map((item, idx) => (
                                                <React.Fragment key={`m-${idx}`}>
                                                    <div className="p-3 bg-card border rounded-lg flex items-center font-medium">{item.spanish}</div>
                                                    <div className="p-3 bg-card border rounded-lg flex items-center">
                                                        <Input
                                                            value={vocabAnswers.materials?.[idx] || ''}
                                                            onChange={e => handleVocabChange('materials', idx, e.target.value)}
                                                            className={cn("h-11 font-mono uppercase", getVocabClass('materials', idx))}
                                                            placeholder="..."
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
                        <CardFooter className="flex justify-between items-center border-t pt-6">
                            <Button onClick={handleCheckVocab} variant="secondary" size="lg">Verificar</Button>
                            <Button 
                                onClick={() => handleTopicComplete('vocabulary')} 
                                disabled={!canAdvanceVocab && !isAdmin}
                                size="lg"
                                className={cn(canAdvanceVocab && "bg-green-600 hover:bg-green-700 shadow-lg")}
                            >
                                Avanzar <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </CardFooter>
                    </Card>
                );
            case 'dictation1':
                return (
                    <LinesWritingExercise 
                        key="dictation1"
                        title="DICTATION 1 = COMPARATIVES AND SUPERLATIVE ADJECTIVES" 
                        description="Escucha atentamente a tu profesor y escribe las frases en los renglones correspondientes." 
                        onComplete={() => handleTopicComplete('dictation1')} 
                        studentDocRef={studentDocRef}
                        lineCount={30}
                        hasTitleLine={true}
                        initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation1 || []}
                        initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation1Grades || {}}
                        savePath={`lessonProgress.${progressStorageVersion}.dictation1`}
                        savePathGrades={`lessonProgress.${progressStorageVersion}.dictation1Grades`}
                        isAdmin={isAdmin}
                    />
                );
            case 'ex1':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Exercise 1</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Contenido del ejercicio 1 próximamente.</p>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => handleTopicComplete('ex1')}>Finalizar Ejercicio</Button>
                        </CardFooter>
                    </Card>
                );
            case 'general_ex':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>General Exercise</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Repaso general de los temas vistos.</p>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => handleTopicComplete('general_ex')}>Finalizar Repaso</Button>
                        </CardFooter>
                    </Card>
                );
            case 'dictation2':
                return (
                    <LinesWritingExercise 
                        key="dictation2"
                        title="DICTATION 2" 
                        description="Escucha atentamente a tu profesor y escribe las frases en los renglones correspondientes." 
                        onComplete={() => handleTopicComplete('dictation2')} 
                        studentDocRef={studentDocRef}
                        lineCount={30}
                        hasTitleLine={true}
                        initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation2 || []}
                        initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation2Grades || {}}
                        savePath={`lessonProgress.${progressStorageVersion}.dictation2`}
                        savePathGrades={`lessonProgress.${progressStorageVersion}.dictation2Grades`}
                        isAdmin={isAdmin}
                    />
                );
            case 'last_ex':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Last Exercise</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center py-12">
                            <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold">¡Casi terminas!</h3>
                            <p className="text-muted-foreground mt-2">Completa el último desafío de la Clase 14.</p>
                        </CardContent>
                        <CardFooter className="justify-center">
                            <Button onClick={() => handleTopicComplete('last_ex')} size="lg" className="px-12">
                                Terminar Clase
                            </Button>
                        </CardFooter>
                    </Card>
                );
            default:
                return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>;
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
                        <h1 className="text-4xl font-bold text-white dark:text-primary [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Class 14 (A1)</h1>
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
