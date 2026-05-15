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
    Sparkles,
    BookText,
    MessageSquare,
    Gamepad2,
    Pencil,
    Users
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { CreativeWritingExercise } from '@/components/dashboard/creative-writing-exercise';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';

type TopicStatus = 'completed' | 'active' | 'locked';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: TopicStatus;
};

const progressStorageVersion = 'progress_a1_eng_u3_c11_v1';
const mainProgressKey = 'progress_a1_eng_unit_3_class_11';

const familyVocabulary = [
    { spanish: 'PADRE', english: ['FATHER'] },
    { spanish: 'MADRE', english: ['MOTHER'] },
    { spanish: 'PADRES', english: ['PARENTS'] },
    { spanish: 'HIJO', english: ['SON'] },
    { spanish: 'HIJA', english: ['DAUGHTER'] },
    { spanish: 'HERMANO', english: ['BROTHER'] },
    { spanish: 'HERMANA', english: ['SISTER'] },
    { spanish: 'PARIENTES', english: ['RELATIVES'] },
    { spanish: 'TIA', english: ['AUNT'] },
    { spanish: 'TIO', english: ['UNCLE'] },
    { spanish: 'PRIMO/A', english: ['COUSIN'] },
    { spanish: 'CUÑADO', english: ['BROTHER IN LAW'] },
    { spanish: 'CUÑADA', english: ['SISTER IN LAW'] },
    { spanish: 'SUEGRO', english: ['FATHER IN LAW'] },
    { spanish: 'SUEGRA', english: ['MOTHER IN LAW'] },
    { spanish: 'ABUELO', english: ['GRANDFATHER'] },
    { spanish: 'ABUELA', english: ['GRANDMOTHER'] },
    { spanish: 'ABUELOS', english: ['GRANDPARENTS'] },
    { spanish: 'SOBRINO', english: ['NEPHEW'] },
    { spanish: 'SOBRINA', english: ['NIECE'] },
    { spanish: 'NIETOS (EN GENERAL)', english: ['GRANDCHILDREN'] },
    { spanish: 'NIETA', english: ['GRANDDAUGHTER'] },
    { spanish: 'NIETO', english: ['GRANDSON'] },
    { spanish: 'HIJO UNICO', english: ['ONLY CHILD'] },
    { spanish: 'HIJASTRO', english: ['STEPSON'] },
    { spanish: 'HIJASTRA', english: ['STEPDAUGHTER'] },
    { spanish: 'PADRASTRO', english: ['STEPFATHER'] },
    { spanish: 'MADRASTRA', english: ['STEPMOTHER'] },
    { spanish: 'ESPOSO', english: ['HUSBAND'] },
    { spanish: 'ESPOSA', english: ['WIFE'] },
    { spanish: 'NOVIO', english: ['BOYFRIEND'] },
    { spanish: 'NOVIA', english: ['GIRLFRIEND'] },
    { spanish: 'PAREJA', english: ['COUPLE'] },
];

export default function EngA1Class11Page() {
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
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(familyVocabulary.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(familyVocabulary.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary (Family)', icon: Users, status: 'active' },
        { key: 'grammar', name: 'Grammar', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'create1', name: 'Create 1', icon: Pencil, status: 'locked' },
        { key: 'ex2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'grammar2', name: 'Grammar 2', icon: GraduationCap, status: 'locked' },
        { key: 'ex3', name: 'Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'ex4', name: 'Exercise 4', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: 'Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
        { key: 'ex5', name: 'Exercise 5', icon: PenSquare, status: 'locked' },
        { key: 'create2', name: 'Create 2', icon: Pencil, status: 'locked' },
        { key: 'ex6', name: 'Exercise 6', icon: PenSquare, status: 'locked' },
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

        const autoViewTopics = ['grammar', 'grammar2'];
        if (autoViewTopics.includes(topicKey)) {
            handleTopicComplete(topicKey);
        }
    };

    const handleVocabChange = (idx: number, val: string) => {
        const newAns = [...vocabAnswers];
        newAns[idx] = val;
        setVocabAnswers(newAns);

        const newVal = [...vocabValidation];
        newVal[idx] = 'unchecked';
        setVocabValidation(newVal as any);
        setCanAdvanceVocab(false);
    };

    const handleCheckVocab = () => {
        let oneCorrect = false;
        const newVal = familyVocabulary.map((item, idx) => {
            const userVal = (vocabAnswers[idx] || '').trim().toUpperCase();
            const isCorrect = item.english.some(ans => ans.toUpperCase() === userVal);
            if (isCorrect) oneCorrect = true;
            return isCorrect ? 'correct' : 'incorrect';
        });

        setVocabValidation(newVal as any);
        if (oneCorrect) {
            toast({ title: "¡Buen trabajo!", description: "Has acertado al menos una. ¡Ya puedes avanzar!" });
            setCanAdvanceVocab(true);
        } else {
            toast({ variant: 'destructive', title: "Revisa tus respuestas", description: "Necesitas al menos una correcta para avanzar." });
        }
    };

    const getVocabClass = (idx: number) => {
        const status = vocabValidation[idx];
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
                            <CardTitle>Vocabulary (Family)</CardTitle>
                            <CardDescription>Traduce los miembros de la familia al inglés. Al menos una correcta para avanzar.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-lg">
                                <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-sm text-left">Spanish</div>
                                <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-sm text-left">English</div>
                                {familyVocabulary.map((item, idx) => (
                                    <React.Fragment key={idx}>
                                        <div className="flex items-center text-base font-medium py-1 text-left">
                                            {item.spanish}
                                        </div>
                                        <div className="flex items-center">
                                            <Input 
                                                value={vocabAnswers[idx] || ''}
                                                onChange={(e) => handleVocabChange(idx, e.target.value)}
                                                className={cn("h-9 uppercase font-mono text-sm", getVocabClass(idx))}
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
                                className={cn(canAdvanceVocab && "bg-green-600 hover:bg-green-700")}
                            >
                                Avanzar <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Grammar Review</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 text-lg">
                            <div className="bg-primary/5 p-6 rounded-xl border-l-4 border-primary">
                                <h3 className="text-xl font-bold mb-2">Describing Relationships</h3>
                                <p className="text-muted-foreground">
                                    Recuerda el uso de los adjetivos posesivos para hablar de tu familia:
                                </p>
                                <div className="mt-4 grid grid-cols-2 gap-4 text-sm font-mono">
                                    <div className="p-3 bg-background rounded border border-dashed">
                                        <p>My mother is a doctor.</p>
                                        <p className="text-muted-foreground italic">(Mi madre es doctora)</p>
                                    </div>
                                    <div className="p-3 bg-background rounded border border-dashed">
                                        <p>His brother is a student.</p>
                                        <p className="text-muted-foreground italic">(Su hermano es estudiante)</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6">
                            <Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-12">Entendido</Button>
                        </CardFooter>
                    </Card>
                );
            case 'ex1':
                return <SimpleTranslationExercise exerciseKey="c11_ex1" course="a1" onComplete={() => handleTopicComplete('ex1')} title="Exercise 1" />;
            case 'create1':
                return (
                    <CreativeWritingExercise 
                        title="Create 1: My Family Tree" 
                        description="Describe a 5 miembros de tu familia usando el vocabulario aprendido."
                        prompts={[
                            { id: 'family-desc', question: 'WRITE ABOUT 5 MEMBERS OF YOUR FAMILY:', placeholder: 'Ex: My mother is Anna. She is very kind...' }
                        ]}
                        onComplete={() => handleTopicComplete('create1')}
                        studentDocRef={studentDocRef}
                        initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.create1Data || {}}
                        savePath={`lessonProgress.${progressStorageVersion}.create1Data`}
                    />
                );
            case 'ex2':
                return <SimpleTranslationExercise exerciseKey="c11_ex2" course="a1" onComplete={() => handleTopicComplete('ex2')} title="Exercise 2" />;
            case 'grammar2':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Grammar 2: Plurals and Specifics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 text-lg">
                            <p className="text-muted-foreground italic">Contenido de gramática avanzada para el nivel A1...</p>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6">
                            <Button onClick={() => handleTopicComplete('grammar2')} size="lg" className="px-12">Siguiente</Button>
                        </CardFooter>
                    </Card>
                );
            case 'ex3':
                return <SimpleTranslationExercise exerciseKey="c11_ex3" course="a1" onComplete={() => handleTopicComplete('ex3')} title="Exercise 3" />;
            case 'ex4':
                return <SimpleTranslationExercise exerciseKey="c11_ex4" course="a1" onComplete={() => handleTopicComplete('ex4')} title="Exercise 4" />;
            case 'vocab_game':
                return <VocabularyMatchingGame data={familyVocabulary.map(v => ({ spanish: v.spanish, english: v.english }))} title="Vocabulary Game (Family)" onComplete={() => handleTopicComplete('vocab_game')} />;
            case 'ex5':
                return <SimpleTranslationExercise exerciseKey="c11_ex5" course="a1" onComplete={() => handleTopicComplete('ex5')} title="Exercise 5" />;
            case 'create2':
                return (
                    <CreativeWritingExercise 
                        title="Create 2: Relationships" 
                        description="Describe las relaciones entre los miembros de tu familia."
                        prompts={[
                            { id: 'rel-desc', question: 'DESCRIBE YOUR FAMILY RELATIONSHIPS:', placeholder: 'Ex: My brother has a dog. His dog is small...' }
                        ]}
                        onComplete={() => handleTopicComplete('create2')}
                        studentDocRef={studentDocRef}
                        initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.create2Data || {}}
                        savePath={`lessonProgress.${progressStorageVersion}.create2Data`}
                    />
                );
            case 'ex6':
                return <SimpleTranslationExercise exerciseKey="c11_ex6" course="a1" onComplete={() => handleTopicComplete('ex6')} title="Exercise 6" />;
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
                        <h1 className="text-4xl font-bold text-white dark:text-primary [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Class 11 (A1)</h1>
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
