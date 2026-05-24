'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    GraduationCap, 
    CheckCircle, 
    Loader2, 
    Plus, 
    Minus, 
    ChevronDown, 
    Pencil, 
    ArrowRight, 
    BookText, 
    XCircle 
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from '@/components/ui/separator';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { CreativeWritingExercise } from '@/components/dashboard/creative-writing-exercise';
import { SentenceCompletionExercise, type CompletionPrompt } from '@/components/kids/exercises/sentence-completion-exercise';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// --- DATA ---

const progressStorageVersion = 'progress_a1_eng_u2_c7_v120_blindado';
const mainProgressKey = 'progress_a1_eng_unit_2_class_7';

const vocabularyData = [
    { spanish: 'VOLVERSE, LLEGAR A SER', english: 'TO BECOME' },
    { spanish: 'COMENZAR', english: 'TO BEGIN' },
    { spanish: 'ROMPER', english: 'TO BREAK' },
    { spanish: 'TRAER, LLEVAR', english: 'TO BRING' },
    { spanish: 'CONSTRUIR', english: 'TO BUILD' },
    { spanish: 'COMPRAR', english: 'TO BUY' },
    { spanish: 'VENIR', english: 'TO COME' },
    { spanish: 'COSTAR', english: 'TO COST' },
    { spanish: 'HACER', english: 'TO DO' },
    { spanish: 'DIBUJAR', english: 'TO DRAW' },
    { spanish: 'BEBER', english: 'TO DRINK' },
    { spanish: 'MANEJAR', english: 'TO DRIVE' },
    { spanish: 'COMER', english: 'TO EAT' },
];

const exercise6Data: CompletionPrompt[] = [
    { parts: ["", " CAR THAT I BOUGHT IS FAST."], answers: ["THE"] },
    { parts: ["", " ENGLISH IS SPOKEN IN MANY COUNTRIES."], answers: [""] },
    { parts: ["", " HOUSES ARE BIG ON THAT FARM."], answers: ["THE"] },
    { parts: ["", " BLUE CAR IS BETTER THAN THE RED ONE."], answers: ["THE"] },
    { parts: ["DOGS ARE ", " BEST PETS."], answers: ["THE"] },
    { parts: ["", " SPORTS ARE IMPORTANT IN MY LIFE."], answers: [""] },
    { parts: ["", " LIONS ARE THE MOST BEAUTIFUL ANIMALS."], answers: [""] },
    { parts: ["I HATE ", " BASKETBALL."], answers: [""] },
    { parts: ["I LIKE ", " WEATHER IN THAT CITY."], answers: ["THE"] },
];

interface Topic {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
}

const ICONS = { locked: Lock, active: BookOpen, completed: CheckCircle };

// --- COMPONENT ---

export default function Class7Content() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(vocabularyData.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(vocabularyData.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);
    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary (Verbs)', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: 'Grammar: Definite Article', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'grammar2', name: 'Grammar: A vs AN', icon: GraduationCap, status: 'locked' },
        { key: 'ex2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'ex3', name: 'Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'grammar3', name: 'Grammar: Preferences', icon: GraduationCap, status: 'locked' },
        { key: 'ex4', name: 'Exercise 4', icon: PenSquare, status: 'locked' },
        { key: 'create1', name: 'Create 1', icon: Pencil, status: 'locked' },
        { key: 'ex6', name: 'Exercise 6', icon: PenSquare, status: 'locked' },
        { key: 'ex7', name: 'Exercise 7', icon: PenSquare, status: 'locked' },
        { key: 'create2', name: 'Create 2', icon: Pencil, status: 'locked' },
        { key: 'ex9', name: 'Exercise 9', icon: PenSquare, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile) return;
        let path = initialLearningPath.map(t => ({ ...t }));
        let savedST = '';

        if (isAdmin) {
            path.forEach(item => { item.status = 'completed'; });
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedData = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => { if (savedData[item.key]) item.status = savedData[item.key]; });
            savedST = savedData.lastSelectedTopic || '';
        }

        let lastDone = true;
        for(let i=0; i < path.length; i++) {
            if (lastDone && path[i].status === 'locked') path[i].status = 'active';
            lastDone = path[i].status === 'completed';
        }

        setLearningPath(path);
        setSelectedTopic(savedST || path.find(p => p.status === 'active')?.key || 'vocabulary');
        setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading]);

    const progressValue = useMemo(() => {
        const done = learningPath.filter(t => t.status === 'completed').length;
        return learningPath.length > 0 ? Math.round((done / learningPath.length) * 100) : 0;
    }, [learningPath]);

    useEffect(() => {
        if (isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;
        const data: any = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(t => data[t.key] = t.status);
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: data, [`progress.${mainProgressKey}`]: progressValue });
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, isAdmin, progressValue, studentDocRef, selectedTopic, isInitialLoading]);

    const handleTopicComplete = useCallback((completedKey: string) => setTopicToComplete(completedKey), []);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(curr => {
            const np = curr.map(t => ({ ...t }));
            const idx = np.findIndex(t => t.key === topicToComplete);
            if (idx !== -1 && np[idx].status !== 'completed') {
                np[idx].status = 'completed';
                if (idx + 1 < np.length && np[idx + 1].status === 'locked') {
                    np[idx + 1].status = 'active';
                    setSelectedTopic(np[idx + 1].key);
                    toast({ title: "¡Siguiente tema desbloqueado!" });
                }
            }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (key: string) => {
        const t = learningPath.find(it => it.key === key);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(key);
        if (['grammar', 'grammar2', 'grammar3'].includes(key)) handleTopicComplete(key);
    };

    const handleVocabCheck = () => {
        let ok = false;
        const newVal = vocabularyData.map((item, idx) => {
            const isCorrect = item.english.toUpperCase() === vocabAnswers[idx].trim().toUpperCase();
            if (isCorrect) ok = true;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabValidation(newVal as any);
        if (ok) { toast({ title: "¡Bien hecho!" }); setCanAdvanceVocab(true); }
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left">
                        <CardHeader><CardTitle>Vocabulary (Verbs)</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                <div className="font-bold p-3 bg-muted rounded-lg">Español</div><div className="font-bold p-3 bg-muted rounded-lg">Inglés</div>
                                {vocabularyData.map((item, idx) => (
                                    <React.Fragment key={idx}>
                                        <div className="p-3 border rounded-lg bg-white/5">{item.spanish}</div>
                                        <Input value={vocabAnswers[idx]} onChange={e => { const n = [...vocabAnswers]; n[idx] = e.target.value; setVocabAnswers(n); setVocabValidation(v => { const nv = [...v]; nv[idx] = 'unchecked'; return nv as any; }); setCanAdvanceVocab(false); }} className={cn(vocabValidation[idx] === 'correct' ? 'border-green-500 bg-green-50/5' : vocabValidation[idx] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} />
                                    </React.Fragment>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6"><Button onClick={handleVocabCheck}>Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <div className="space-y-6 text-left">
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 text-black">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">THE DEFINITE ARTICLE “THE” 🚀</CardTitle></CardHeader>
                            <CardContent className="space-y-6 text-lg font-bold">
                                <div className="p-6 bg-white/10 rounded-2xl border">
                                    <p className="text-primary uppercase">1 - SIGNIFICADO</p>
                                    <p className="mt-2">THE corresponde a: “EL”, “LA”, “LOS”, “LAS”.</p>
                                </div>
                                <div className="p-6 bg-white/10 rounded-2xl border">
                                    <p className="text-primary uppercase">2 - USO ESPECÍFICO</p>
                                    <p className="mt-2">Se usa cuando se habla de "algo en particular o específico".</p>
                                </div>
                                <div className="p-6 bg-destructive/10 rounded-2xl border-2 border-dashed border-destructive/20 text-center">
                                    <p className="text-destructive uppercase font-black">Nota: No se usa para generalizar.</p>
                                    <p className="font-mono text-base text-muted-foreground">I like football (No: I like the football)</p>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center pb-6"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-12 font-bold">Entendido</Button></CardFooter>
                        </Card>
                    </div>
                );
            case 'grammar2':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 text-black p-6">
                        <CardTitle className="text-2xl font-black text-primary uppercase">INDEFINITIVE ARTICLES (A - AN)</CardTitle>
                        <CardContent className="pt-6 space-y-4">
                            <p className="text-xl font-bold">Significado: un / una</p>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="p-6 bg-white/50 rounded-xl border-2 border-dashed"><p className="font-black text-primary text-xl">A</p><p>+ Consonante</p></div>
                                <div className="p-6 bg-white/50 rounded-xl border-2 border-dashed"><p className="font-black text-primary text-xl">AN</p><p>+ Vocal</p></div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center"><Button onClick={() => handleTopicComplete('grammar2')} size="lg" className="px-12">Continuar</Button></CardFooter>
                    </Card>
                );
            case 'grammar3':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 text-black p-6">
                        <CardTitle className="text-2xl font-black text-primary uppercase">LIKES AND DISLIKES</CardTitle>
                        <CardContent className="pt-6 space-y-6">
                            <p className="text-lg font-bold">Cuando van seguidos de verbos, se pueden usar dos formas:</p>
                            <div className="grid sm:grid-cols-2 gap-4 font-mono">
                                <div className="p-4 bg-white/50 rounded-xl border text-center"><p className="text-primary font-black">LIKE + TO + VERBO</p><p className="text-sm mt-1">I like to cook</p></div>
                                <div className="p-4 bg-white/50 rounded-xl border text-center"><p className="text-primary font-black">LIKE + VERBO-ING</p><p className="text-sm mt-1">I like cooking</p></div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center"><Button onClick={() => handleTopicComplete('grammar3')} size="lg" className="px-12">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'ex1': return <SimpleTranslationExercise course="a1" exerciseKey="c7_ex1" onComplete={() => handleTopicComplete('ex1')} title="Exercise 1" />;
            case 'ex2': return <SimpleTranslationExercise course="a1" exerciseKey="c7_ex2" onComplete={() => handleTopicComplete('ex2')} title="Exercise 2" />;
            case 'ex3': return <SimpleTranslationExercise course="a1" exerciseKey="c7_ex3" onComplete={() => handleTopicComplete('ex3')} title="Exercise 3" />;
            case 'ex4': return <SimpleTranslationExercise course="a1" exerciseKey="c7_ex4" onComplete={() => handleTopicComplete('ex4')} title="Exercise 4" />;
            case 'create1': return <CreativeWritingExercise title="Create 1" prompts={[{id:'p1', question: 'What do you like and dislike?'}, {id:'p2', question: 'Describe someone else\'s tastes.'}]} onComplete={() => handleTopicComplete('create1')} studentDocRef={studentDocRef} initialData={studentProfile?.lessonProgress?.[progressStorageKey]?.create1 || {}} savePath={`lessonProgress.${progressStorageKey}.create1`} />;
            case 'ex6': return <SentenceCompletionExercise title="Exercise 6" description='Inserta "THE" donde sea necesario o déjalo vacío.' data={exercise6Data} onComplete={() => handleTopicComplete('ex6')} />;
            case 'ex7': return <SimpleTranslationExercise course="a1" exerciseKey="c7_ex7" onComplete={() => handleTopicComplete('ex7')} title="Exercise 7: A vs AN" />;
            case 'create2': return <CreativeWritingExercise title="Create 2" prompts={[{id:'p1', question: 'What do you like and dislike about your city?'}]} onComplete={() => handleTopicComplete('create2')} studentDocRef={studentDocRef} initialData={studentProfile?.lessonProgress?.[progressStorageKey]?.create2 || {}} savePath={`lessonProgress.${progressStorageKey}.create2`} />;
            case 'ex9': return <SimpleTranslationExercise course="a1" exerciseKey="c7_ex9" onComplete={() => handleTopicComplete('ex9')} title="Exercise 9" />;
            default: return null;
        }
    };

    return (
        <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
            <div className="md:col-span-3 md:order-2 order-1 text-left">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader><CardTitle>Ruta de Aprendizaje</CardTitle></CardHeader>
                    <CardContent>
                        <nav><ul className="space-y-1">
                            {learningPath.map(item => (
                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', (item.status === 'locked' && !isAdmin) ? 'text-muted-foreground/50' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-bold')}>
                                    <item.icon className={cn("h-5 w-5", item.status === 'completed' && 'text-green-500')} /><span>{item.name}</span>
                                </li>
                            ))}
                        </ul></nav>
                        <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2"><span>Progreso</span><span className="font-bold">{progressValue}%</span></div><Progress value={progressValue} className="h-1.5" /></div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
