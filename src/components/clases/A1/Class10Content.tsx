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
    ArrowRight, 
    MessageSquare,
    BookText
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { LargeTextTranslation } from '@/components/dashboard/large-text-translation';
import { DialogueCompletionExercise } from '@/components/kids/exercises/dialogue-completion-exercise';
import { SentenceCompletionExercise, type CompletionPrompt } from '@/components/kids/exercises/sentence-completion-exercise';
import { Separator } from '@/components/ui/separator';

// --- DATA ---

const progressStorageVersion = 'progress_a1_eng_u2_c10_v130_blindado';
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

const dialogue1Phrases = [
    { spanish: "MARY: ¿CUANTO VALE ESTA BUFANDA?", answers: ["how much is this scarf?", "how much does this scarf cost?"] },
    { spanish: "JON: ESTA CUESTA 20 DOLARES", answers: ["this costs 20 dollars", "this one costs 20 dollars", "it is 20 dollars"] },
];

const dialogue2Data = [
    { speaker: "MARY", parts: ["EXCUSE ME. HOW MUCH ARE ", " T-SHIRTS?"], answers: [["THOSE", "THESE"]] },
    { speaker: "JON", parts: ["WHICH ", "? DO YOU MEAN ", "?"], answers: [["ONES"], ["THESE", "THOSE"]] },
];

const exerciseThe2Data: CompletionPrompt[] = [
    { parts: ["I WENT TO ", " SICILY ISLAND IN ITALY LAST YEAR."], answers: [""] },
    { parts: ["DO YOU LIKE ", " PARIS ARCHITECTURE?"], answers: ["THE"] },
];

interface Topic {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'completed' | 'active' | 'locked';
}

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- COMPONENT ---

export default function Class10Content() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);
    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const [vocabAnswers, setVocabAnswers] = useState<any>({});
    const [vocabValidation, setVocabValidation] = useState<any>({});
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary (Basic Words)', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: 'Grammar: What vs Which', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1 (One/Ones)', icon: PenSquare, status: 'locked' },
        { key: 'dialogue1', name: 'Dialogue 1', icon: MessageSquare, status: 'locked' },
        { key: 'exercise2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'dialogue2', name: 'Dialogue 2', icon: MessageSquare, status: 'locked' },
        { key: 'grammar2', name: 'Grammar: Article "THE"', icon: GraduationCap, status: 'locked' },
        { key: 'ex_the1', name: 'Exercise with "The" 1', icon: PenSquare, status: 'locked' },
        { key: 'ex_the2', name: 'Exercise with "The" 2', icon: PenSquare, status: 'locked' },
    ], []);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile) return;
        
        let path = initialLearningPath.map(t => ({ ...t }));
        let savedST = '';

        if (isAdmin) {
            path.forEach(t => t.status = 'completed');
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const d = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(t => { if (d[t.key]) t.status = d[t.key]; });
            savedST = d.lastSelectedTopic || '';
        }

        // Sequential locking logic
        let lastDone = true;
        for(let i=0; i < path.length; i++) {
            if (lastDone && path[i].status === 'locked') path[i].status = 'active';
            lastDone = path[i].status === 'completed';
        }

        setLearningPath(path);
        setSelectedTopic(savedST || path.find(p => p.status === 'active')?.key || path[0].key);
        
        const initA: any = {}; const initV: any = {};
        Object.keys(vocabularyData).forEach(c => {
            initA[c] = Array((vocabularyData as any)[c].length).fill('');
            initV[c] = Array((vocabularyData as any)[c].length).fill('unchecked');
        });
        setVocabAnswers(initA); setVocabValidation(initV);
        setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;
        const s: any = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(t => s[t.key] = t.status);
        
        const currentProgress = studentProfile?.lessonProgress?.[progressStorageVersion];
        if (JSON.stringify(s) !== JSON.stringify(currentProgress)) {
            updateDocumentNonBlocking(studentDocRef, { 
                [`lessonProgress.${progressStorageVersion}`]: s, 
                [`progress.${mainProgressKey}`]: progressValue 
            });
        }
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, isAdmin, progressValue, studentDocRef, selectedTopic, isInitialLoading, studentProfile]);

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
                    setTimeout(() => toast({ title: "¡Siguiente tema desbloqueado!" }), 0);
                }
            }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const t = learningPath.find(it => it.key === topicKey);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (['grammar', 'grammar2'].includes(topicKey)) handleTopicComplete(topicKey);
    };

    const handleVocabCheck = () => {
        let ok = false; const nv: any = {};
        Object.keys(vocabularyData).forEach(c => {
            nv[c] = (vocabularyData as any)[c].map((v: any, i: number) => {
                const res = v.english.toUpperCase() === (vocabAnswers[c][i] || '').trim().toUpperCase();
                if (res) ok = true; return res ? 'correct' : 'incorrect';
            });
        });
        setVocabValidation(nv); setCanAdvanceVocab(ok);
        if (ok) toast({ title: "¡Bien hecho!" }); else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                        <CardHeader><CardTitle>Vocabulary</CardTitle></CardHeader>
                        <CardContent>
                            <Accordion type="multiple" defaultValue={['verbos', 'palabras']}>
                                {Object.keys(vocabularyData).map(c => (
                                    <AccordionItem key={c} value={c}>
                                        <AccordionTrigger className="capitalize font-bold text-lg">{c}</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="grid grid-cols-2 gap-2 text-base">
                                                <div className="font-bold p-2 bg-muted rounded">Español</div>
                                                <div className="font-bold p-2 bg-muted rounded">Inglés</div>
                                                {(vocabularyData as any)[c].map((v: any, i: number) => (
                                                    <React.Fragment key={i}>
                                                        <div className="p-2 border rounded bg-white/5">{v.spanish}</div>
                                                        <Input 
                                                            value={vocabAnswers[c][i]} 
                                                            onChange={e => { const na = {...vocabAnswers}; na[c][i] = e.target.value; setVocabAnswers(na); setCanAdvanceVocab(false); }} 
                                                            className={cn(vocabValidation[c]?.[i] === 'correct' ? 'border-green-500 bg-green-50/5' : vocabValidation[c]?.[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} 
                                                            autoComplete="off"
                                                        />
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 mt-4">
                            <Button onClick={handleVocabCheck} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">WHAT vs WHICH</CardTitle></CardHeader>
                        <CardContent className="space-y-6 text-black dark:text-white font-bold text-lg">
                            <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                <p className="text-primary mb-2 uppercase tracking-tighter">WHAT (General):</p>
                                <p>Se usa para preguntar sobre cosas en general cuando hay infinitas posibilidades.</p>
                                <p className="text-sm font-mono mt-2 italic text-slate-700 dark:text-slate-300">"What is your name?" / "What kind of music do you like?"</p>
                            </div>
                            <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                <p className="text-primary mb-2 uppercase tracking-tighter">WHICH (Específico):</p>
                                <p>Se usa cuando hay una selección limitada de opciones (entre este o aquel).</p>
                                <p className="text-sm font-mono mt-2 italic text-slate-700 dark:text-slate-300">"Which dress do you prefer? The red one or the blue one?"</p>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6">
                            <Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-12 font-bold">Entendido</Button>
                        </CardFooter>
                    </Card>
                );
            case 'ex1': return <SimpleTranslationExercise course="a1" exerciseKey="c10_ex1" onComplete={() => handleTopicComplete('ex1')} />;
            case 'dialogue1': return <LargeTextTranslation title="Dialogue 1: Scarf" phrases={dialogue1Phrases} onComplete={() => handleTopicComplete('dialogue1')} />;
            case 'exercise2': return <SimpleTranslationExercise course="a1" exerciseKey="c10_ex2" onComplete={() => handleTopicComplete('exercise2')} title="Exercise 2" />;
            case 'dialogue2': return <DialogueCompletionExercise title="Dialogue 2" description="Completa con demostrativos correctos." dialogue={dialogue2Data} onComplete={() => handleTopicComplete('dialogue2')} />;
            case 'grammar2':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">THE DEFINITE ARTICLE: THE</CardTitle></CardHeader>
                        <CardContent className="space-y-6 text-black dark:text-white font-bold text-lg">
                            <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                <p className="text-primary mb-2 uppercase tracking-tighter">EL ARTÍCULO "THE":</p>
                                <p>Corresponde a: EL, LA, LOS, LAS.</p>
                                <p className="text-base font-normal mt-3 text-slate-800 dark:text-slate-200">
                                    Se usa para cosas específicas que ya conocemos o que son únicas. 
                                    <br/><strong>Nota:</strong> No se usa al generalizar (Ej: I like coffee, no: I like the coffee).
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6">
                            <Button onClick={() => handleTopicComplete('grammar2')} size="lg" className="px-12 font-bold">Entendido</Button>
                        </CardFooter>
                    </Card>
                );
            case 'ex_the1': return <SimpleTranslationExercise exerciseKey="c10_the1" course="a1" onComplete={() => handleTopicComplete('ex_the1')} title="Exercise with 'The' 1" />;
            case 'ex_the2': return <SentenceCompletionExercise title="Exercise with 'The' 2" description="Usa THE si es necesario, de lo contrario deja el espacio vacío." data={exerciseThe2Data} onComplete={() => handleTopicComplete('ex_the2')} />;
            default: return null;
        }
    };

    return (
        <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
            <div className="md:col-span-3 md:order-2 order-1 text-left">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader><CardTitle>Aventura Clase 10</CardTitle></CardHeader>
                    <CardContent>
                        <nav><ul className="space-y-1">
                            {learningPath.map(item => (
                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', (item.status === 'locked' && !isAdmin) ? 'text-muted-foreground/50' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-bold')}>
                                    <div className="flex items-center gap-3">{(item.status === 'completed') ? <CheckCircle className="h-5 w-5 text-green-500" /> : <item.icon className="h-5 w-5" />}<span>{item.name}</span></div>
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
