'use client';

import React, { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
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
    BookText,
    HelpCircle,
    Lightbulb,
    MessageSquare,
    Gamepad2
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from '@/components/ui/separator';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'completed' | 'active' | 'locked';
};

const ICONS = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const progressStorageVersion = 'progress_a1_eng_u2_c10_v6_ex1_bubbles';
const mainProgressKey = 'progress_a1_eng_unit_2_class_10';

const vocabularyData = {
    verbos: [
        { spanish: 'CAER', english: 'TO FALL' },
        { spanish: 'SENTIR', english: 'TO FEEL' },
        { spanish: 'LUCHAR', english: 'TO FIGHT' },
        { spanish: 'ENCONTRAR', english: 'TO FIND' },
        { spanish: 'DAR', english: 'TO GIVE' },
        { spanish: 'VOLAR', english: 'TO FLY' },
        { spanish: 'OLVIDAR', english: 'TO FORGET' },
        { spanish: 'PERDONAR', english: 'TO FORGIVE' },
    ],
    palabras: [
        { spanish: 'CALIENTE', english: 'HOT' },
        { spanish: 'CALIDO', english: 'WARM' },
        { spanish: 'ESTACION (TIEMPO)', english: 'SEASON' },
        { spanish: 'CUCHILLO', english: 'KNIFE' },
        { spanish: 'OLLA', english: 'POT' },
        { spanish: 'TENEDOR', english: 'FORK' },
        { spanish: 'CUCHARA', english: 'SPOON' },
        { spanish: 'PLATO', english: 'DISH' },
        { spanish: 'VASO', english: 'GLASS' },
        { spanish: 'CUBIERTOS', english: 'SILVERWARE' },
    ]
};

export default function EngA1Class10Page() {
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

    // Vocab states
    const [vocabAnswers, setVocabAnswers] = useState<{[key: string]: string[]}>({});
    const [vocabValidation, setVocabValidation] = useState<{[key: string]: ('correct' | 'incorrect' | 'unchecked')[]}>({});
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary (Basic Words)', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: 'Grammar', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'dialogue1', name: 'Dialogue 1', icon: MessageSquare, status: 'locked' },
        { key: 'exercise2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'dialogue2', name: 'Dialogue 2', icon: MessageSquare, status: 'locked' },
        { key: 'grammar2', name: 'Grammar 2', icon: GraduationCap, status: 'locked' },
        { key: 'ex_the1', name: 'Exercise with "The" 1', icon: PenSquare, status: 'locked' },
        { key: 'ex_the2', name: 'Exercise with "The" 2', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: 'Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
        { key: 'exercise3', name: 'Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'dialogue3', name: 'Dialogue 3', icon: MessageSquare, status: 'locked' },
        { key: 'general_vocab', name: 'General Vocabulary', icon: BookText, status: 'locked' },
        { key: 'last_exercise', name: 'Last Exercise', icon: Sparkles, status: 'locked' },
    ], [t]);
    
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

        const autoViewTopics = ['grammar', 'grammar2', 'general_vocab'];
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
        if (status === 'incorrect') return 'border-destructive bg-destructive/5 focus-visible:ring-destructive';
        return '';
    };

    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic);

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Vocabulary (Basic Words)</CardTitle>
                            <CardDescription>Traduce las siguientes palabras al inglés.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="multiple" defaultValue={['verbos', 'palabras']} className="w-full">
                                <AccordionItem value="verbos">
                                    <AccordionTrigger className="text-xl font-bold uppercase text-primary">Lexico: Verbos Básicos</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                            <div className="font-bold p-3 bg-muted rounded-lg text-left">Spanish</div>
                                            <div className="font-bold p-3 bg-muted rounded-lg text-left">English</div>
                                            {vocabularyData.verbos.map((item, idx) => (
                                                <Fragment key={`v-${idx}`}>
                                                    <div className="p-3 bg-card border rounded-lg flex items-center font-medium">{item.spanish}</div>
                                                    <div className="p-3 bg-card border rounded-lg flex items-center">
                                                        <Input
                                                            value={vocabAnswers.verbos?.[idx] || ''}
                                                            onChange={e => handleVocabChange('verbos', idx, e.target.value)}
                                                            className={cn("h-11 font-mono uppercase", getVocabClass('verbos', idx))}
                                                            placeholder="TO..."
                                                            autoComplete="off"
                                                        />
                                                    </div>
                                                </Fragment>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="palabras">
                                    <AccordionTrigger className="text-xl font-bold uppercase text-primary">Palabras Básicas</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                            <div className="font-bold p-3 bg-muted rounded-lg text-left">Spanish</div>
                                            <div className="font-bold p-3 bg-muted rounded-lg text-left">English</div>
                                            {vocabularyData.palabras.map((item, idx) => (
                                                <Fragment key={`p-${idx}`}>
                                                    <div className="p-3 bg-card border rounded-lg flex items-center font-medium">{item.spanish}</div>
                                                    <div className="p-3 bg-card border rounded-lg flex items-center">
                                                        <Input
                                                            value={vocabAnswers.palabras?.[idx] || ''}
                                                            onChange={e => handleVocabChange('palabras', idx, e.target.value)}
                                                            className={cn("h-11 font-mono uppercase", getVocabClass('palabras', idx))}
                                                            placeholder="..."
                                                            autoComplete="off"
                                                        />
                                                    </div>
                                                </Fragment>
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
            case 'grammar':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Grammar: Diferencia entre "WHAT" y "WHICH"</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8 text-lg">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-muted rounded-xl border-l-4 border-primary">
                                        <h3 className="font-bold text-primary mb-2">WHAT?</h3>
                                        <p className="text-sm">Cual? - Qué?</p>
                                        <p className="text-xs text-muted-foreground mt-2">Pregunta general, fuera de contexto.</p>
                                    </div>
                                    <div className="p-4 bg-muted rounded-xl border-l-4 border-brand-blue">
                                        <h3 className="font-bold text-brand-blue mb-2">WHICH?</h3>
                                        <p className="text-sm">Cual?</p>
                                        <p className="text-xs text-muted-foreground mt-2">Para elegir en un grupo definido (ves los objetos).</p>
                                    </div>
                                </div>
                                
                                <div className="bg-primary/5 p-4 rounded-lg border border-dashed">
                                    <h4 className="font-bold mb-2 flex items-center gap-2">
                                        <HelpCircle className="h-5 w-5" /> EXAMPLES:
                                    </h4>
                                    <p className="text-sm italic">1- ¿CUAL ES TU HELADO FAVORITO? (General)</p>
                                    <p className="font-mono text-base font-bold">What is your favorite ice cream?</p>
                                    <Separator className="my-2" />
                                    <p className="text-sm italic">2- ¿CUAL HELADO QUIERES? (Entre estos que ves aquí)</p>
                                    <p className="font-mono text-base font-bold text-primary">Which ice cream do you want?</p>
                                </div>
                            </div>

                            <div className="bg-brand-purple/10 p-6 rounded-2xl border border-brand-purple">
                                <h3 className="text-xl font-bold mb-4 text-brand-purple">ONE / ONES</h3>
                                <p className="text-base mb-4">Se utiliza con:</p>
                                <ol className="grid grid-cols-2 gap-2 text-sm font-bold">
                                    <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-brand-purple" /> 1- DEMOSTRATIVOS</li>
                                    <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-brand-purple" /> 2- ADJETIVOS</li>
                                    <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-brand-purple" /> 3- WHICH</li>
                                    <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-brand-purple" /> 4- OTHER / ANOTHER</li>
                                </ol>

                                <div className="mt-6 p-4 bg-background rounded-lg border-2 border-dashed">
                                    <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                                        <ArrowRight className="h-4 w-4" /> ANOTHER vs OTHER:
                                    </h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                                        Ambos significan lo mismo, pero <strong>Another</strong> es para singular y <strong>Other</strong> para plurales o incontables.
                                    </p>
                                    <div className="space-y-2 font-mono text-xs">
                                        <p className="text-foreground">She's going to the cinema with <span className="font-bold text-primary underline">another friend</span>. (Singular)</p>
                                        <p className="text-foreground">She's going to the cinema with <span className="font-bold text-primary underline">other friends</span>. (Plural)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-brand-blue/5 p-6 rounded-xl border-l-4 border-brand-blue">
                                <h3 className="text-xl font-bold mb-2">WHICH + ONE / ONES</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="font-bold">Which one?</p>
                                        <p className="text-sm text-muted-foreground">Singular – Cual?</p>
                                    </div>
                                    <div>
                                        <p className="font-bold">Which ones?</p>
                                        <p className="text-sm text-muted-foreground">Plural – Cuales?</p>
                                    </div>
                                </div>
                                <p className="mt-4 text-sm bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200">
                                    <Lightbulb className="inline-block h-4 w-4 mr-1 text-yellow-500" />
                                    Podemos elegir reemplazar el sustantivo por <strong>ONE / ONES</strong> solo si ya conocemos el contexto.
                                </p>
                            </div>

                            <div className="bg-primary/5 p-6 rounded-xl border-l-4 border-primary mt-6">
                                <h3 className="text-xl font-bold mb-4">EXAMPLE:</h3>
                                <div className="space-y-4 font-mono text-sm">
                                    <div className="p-3 bg-background rounded border border-dashed">
                                        <p className="font-bold">WHICH HOUSE DOES SHE BUY?</p>
                                        <p className="text-muted-foreground italic">(¿CUAL CASA COMPRA ELLA? )</p>
                                    </div>
                                    <div className="p-3 bg-background rounded border border-dashed">
                                        <p className="font-bold text-primary">WHICH ONE DOES SHE BUY?</p>
                                        <p className="text-muted-foreground italic">(¿CUAL COMPRA ELLA?)</p>
                                    </div>
                                    <div className="p-3 bg-background rounded border border-dashed">
                                        <p className="font-bold">WHICH MANGOES DO THEY EAT?</p>
                                        <p className="text-muted-foreground italic">(¿CUALES MANGOS COMEN ELLOS?)</p>
                                    </div>
                                    <div className="p-3 bg-background rounded border border-dashed">
                                        <p className="font-bold text-primary">WHICH ONES DO THEY EAT?</p>
                                        <p className="text-muted-foreground italic">(¿CUALES SE COMEN ELLOS?)</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center">
                            <Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-12">Entendido</Button>
                        </CardFooter>
                    </Card>
                );
            case 'ex1':
                return <SimpleTranslationExercise exerciseKey="c10_ex1" course="a1" onComplete={() => handleTopicComplete('ex1')} title="Exercise 1: ONE / ONES" />;
            default:
                if (selectedTopic.startsWith('ex') || selectedTopic.startsWith('last') || selectedTopic.startsWith('dialogue') || selectedTopic.startsWith('vocab_game') || selectedTopic === 'grammar2') {
                    return (
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple min-h-[400px]">
                            <CardHeader>
                                <CardTitle>{topic?.name}</CardTitle>
                                <CardDescription>Actividad interactiva próximamente.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center gap-6 h-full">
                                <p className="text-muted-foreground">Aquí aparecerá el ejercicio para {topic?.name}.</p>
                                <Button onClick={() => handleTopicComplete(selectedTopic)}>Completar Actividad</Button>
                            </CardContent>
                        </Card>
                    );
                }
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
                        <h1 className="text-4xl font-bold text-white dark:text-primary [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase 10</h1>
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
