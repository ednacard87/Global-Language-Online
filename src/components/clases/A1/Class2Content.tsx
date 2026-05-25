'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
    BookOpen, 
    GraduationCap, 
    CheckCircle, 
    PenSquare, 
    Lock, 
    Loader2, 
    ArrowRight, 
    BookText,
    Check,
    X,
    Info
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';

// --- DATA ---

const progressStorageKey = 'progress_a1_eng_u1_c2_v170_blindado';
const mainProgressKey = 'progress_a1_eng_unit_1_class_2';

const vocabularyVerbs = [
    { spanish: 'JUGAR', english: 'play' },
    { spanish: 'CAMINAR', english: 'walk' },
    { spanish: 'IR', english: 'go' },
    { spanish: 'TRABAJAR', english: 'work' },
    { spanish: 'DORMIR', english: 'sleep' },
    { spanish: 'COMER', english: 'eat' },
    { spanish: 'BEBER', english: 'drink' },
    { spanish: 'VER', english: 'see' },
    { spanish: 'MIRAR', english: 'look' },
    { spanish: 'SALIR', english: 'go out' },
    { spanish: 'CORRER', english: 'run' },
    { spanish: 'CANTAR', english: 'sing' },
    { spanish: 'HABLAR', english: 'speak' },
    { spanish: 'PENSAR', english: 'think' },
    { spanish: 'HABER/TENER', english: 'have' },
    { spanish: 'HACER', english: 'do' },
    { spanish: 'ESTUDIAR', english: 'study' },
    { spanish: 'ESCRIBIR', english: 'write' },
    { spanish: 'LEER', english: 'read' },
    { spanish: 'APRENDER', english: 'learn' },
    { spanish: 'ENSEÑAR', english: 'teach' },
];

const vocabularyWords = [
    { spanish: 'AYER', english: 'yesterday' },
    { spanish: 'HOY', english: 'today' },
    { spanish: 'MAÑANA', english: 'tomorrow' },
    { spanish: 'AÑO', english: 'year' },
    { spanish: 'DÍA', english: 'day' },
    { spanish: 'SEMANA', english: 'week' },
    { spanish: 'MES', english: 'month' },
    { spanish: 'CON', english: 'with' },
    { spanish: 'DESAYUNO', english: 'breakfast' },
    { spanish: 'ALMUERZO', english: 'lunch' },
    { spanish: 'CENA', english: 'dinner' },
    { spanish: 'SIN', english: 'without' },
];

const ex1Vocab = {
    "tenis": "tennis",
    "caminar": "walk",
    "parque": "park",
    "universidad": "university",
    "domingos": "sundays",
    "tarde": "afternoon",
    "carne": "meat",
    "ensalada": "salad",
    "iglesia": "church",
    "miercoles": "wednesday",
    "futbol": "soccer / football",
    "peliculas": "movies",
    "viernes": "fridays",
    "noche": "night"
};

const ex2Vocab = {
    "tarea": "homework / task",
    "ejercicio": "exercise",
    "hacer": "do / does"
};

const exercise2Prompts = [
    { 
        spanish: "TU HACES LA TAREA", 
        answers: { 
            affirmative: ["you do the homework", "you do the task"], 
            negative: ["you do not do the homework", "you don't do the homework", "you do not do the task", "you don't do the task"], 
            interrogative: ["do you do the homework?", "do you do the task?"], 
            shortAffirmative: ["yes, i do"], 
            shortNegative: ["no, i do not", "no, i don't"] 
        } 
    },
    { 
        spanish: "ELLA HACE EJERCICIO", 
        answers: { 
            affirmative: ["she does exercise"], 
            negative: ["she does not do exercise", "she doesn't do exercise"], 
            interrogative: ["does she do exercise?"], 
            shortAffirmative: ["yes, she does"], 
            shortNegative: ["no, she does not", "no, she doesn't"] 
        } 
    }
];

interface Topic {
    key: string;
    name: string;
    icon: React.ElementType;
    status: 'locked' | 'active' | 'completed';
}

const ICONS = { locked: Lock, active: BookOpen, completed: CheckCircle };

// --- SUB-COMPONENT FOR EXERCISE 2 ---
const MultiFormExercise = ({ prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({ affirmative: '', negative: '', interrogative: '', shortAffirmative: '', shortNegative: '' });
    const [validation, setValidation] = useState<any>({ affirmative: 'unchecked', negative: 'unchecked', interrogative: 'unchecked', shortAffirmative: 'unchecked', shortNegative: 'unchecked' });
    const [completedMap, setCompletedMap] = useState<Record<number, boolean>>({});

    const currentPrompt = prompts[currentIndex];

    useEffect(() => {
        setAnswers({ affirmative: '', negative: '', interrogative: '', shortAffirmative: '', shortNegative: '' });
        setValidation({ affirmative: 'unchecked', negative: 'unchecked', interrogative: 'unchecked', shortAffirmative: 'unchecked', shortNegative: 'unchecked' });
    }, [currentIndex]);

    const handleCheck = () => {
        const fields: (keyof typeof answers)[] = ['affirmative', 'negative', 'interrogative', 'shortAffirmative', 'shortNegative'];
        const newVal = { ...validation };
        let allOk = true;

        fields.forEach(field => {
            const userVal = answers[field].trim().toLowerCase().replace(/[.?,]/g, '');
            const corrects = currentPrompt.answers[field].map((a: string) => a.toLowerCase().replace(/[.?,]/g, ''));
            
            if (field === 'interrogative' && !answers[field].trim().endsWith('?')) {
                newVal[field] = 'incorrect';
                allOk = false;
            } else if (corrects.includes(userVal)) {
                newVal[field] = 'correct';
            } else {
                newVal[field] = 'incorrect';
                allOk = false;
            }
        });

        setValidation(newVal);
        if (allOk) {
            toast({ title: "¡Correcto!" });
            setCompletedMap(prev => ({ ...prev, [currentIndex]: true }));
        } else {
            toast({ variant: 'destructive', title: "Incorrecto", description: "Revisa los campos en rojo." });
        }
    };

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Exercise 2</CardTitle>
                        <CardDescription>Traduce la frase en todas sus formas.</CardDescription>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {Object.entries(vocabulary).map(([es, en]: any) => (<React.Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-bold text-right">{en}</span></React.Fragment>))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
                <div className="flex gap-2 pt-4">
                    {prompts.map((_: any, i: number) => (
                        <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-6 w-6 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", completedMap[i] ? "bg-green-500 text-white border-green-500" : "bg-card")}>
                            {i + 1}
                        </div>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-4 rounded-lg border text-center font-bold text-xl">{currentPrompt.spanish}</div>
                <div className="space-y-3 font-mono">
                    {[
                        { k: 'affirmative', l: '(+)', c: 'text-green-500' },
                        { k: 'negative', l: '(-)', c: 'text-red-500' },
                        { k: 'interrogative', l: '(?)', c: 'text-blue-500' },
                        { k: 'shortAffirmative', l: '(+A)', c: 'text-green-600' },
                        { k: 'shortNegative', l: '(-A)', c: 'text-red-600' }
                    ].map(f => (
                        <div key={f.k} className="flex items-center gap-3">
                            <Label className={cn("w-10 font-bold", f.c)}>{f.l}</Label>
                            <Input value={(answers as any)[f.k]} onChange={e => setAnswers(prev => ({...prev, [f.k]: e.target.value}))} className={cn(validation[f.k] === 'correct' ? 'border-green-500 bg-green-50/5' : validation[f.k] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" />
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button onClick={handleCheck}>Verificar</Button>
                {currentIndex < prompts.length - 1 ? (
                    <Button onClick={() => setCurrentIndex(prev => prev + 1)} disabled={!completedMap[currentIndex]}>Siguiente <ArrowRight className="ml-2 h-4 w-4" /></Button>
                ) : (
                    <Button onClick={onComplete} disabled={!completedMap[currentIndex]} className='text-white'>Finalizar</Button>
                )}
            </CardFooter>
        </Card>
    );
};

// --- MAIN COMPONENT ---

export default function Class2Content() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('vocabulary');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const [verbsAnswers, setVerbsAnswers] = useState<string[]>(Array(vocabularyVerbs.length).fill(''));
    const [wordsAnswers, setWordsAnswers] = useState<string[]>(Array(vocabularyWords.length).fill(''));
    const [verbsValidation, setVerbsValidation] = useState<any[]>(Array(vocabularyVerbs.length).fill('unchecked'));
    const [wordsValidation, setWordsValidation] = useState<any[]>(Array(vocabularyWords.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);
    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary 2', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: 'Grammar: DO - DOES', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile) return;
        let path = initialLearningPath.map(t => ({...t}));
        let savedST = '';
        if (isAdmin) {
            path.forEach(item => { item.status = 'completed'; });
        } else if(studentProfile?.lessonProgress?.[progressStorageKey]) {
            const d = studentProfile.lessonProgress[progressStorageKey];
            path.forEach(item => { if (d[item.key]) item.status = d[item.key]; });
            savedST = d.lastSelectedTopic || '';
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
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageKey}`]: data, [`progress.${mainProgressKey}`]: progressValue });
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, isAdmin, progressValue, studentDocRef, selectedTopic, isInitialLoading]);

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
                }
            }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete]);

    const handleTopicSelect = (key: string) => {
        const t = learningPath.find(it => it.key === key);
        if (!isAdmin && t?.status === 'locked') return;
        setSelectedTopic(key);
        if (key === 'grammar') handleTopicComplete(key);
    };

    const handleVocabCheck = () => {
        let ok = false;
        const nvV = vocabularyVerbs.map((v, i) => {
            const u = (verbsAnswers[i] || '').trim().toLowerCase();
            const res = u === v.english.toLowerCase() || u === `to ${v.english.toLowerCase()}`;
            if (res) ok = true; return res ? 'correct' : 'incorrect';
        });
        const nvW = vocabularyWords.map((v, i) => {
            const res = (wordsAnswers[i] || '').trim().toLowerCase() === v.english.toLowerCase();
            if (res) ok = true; return res ? 'correct' : 'incorrect';
        });
        setVerbsValidation(nvV); setWordsValidation(nvW);
        if (ok) setCanAdvanceVocab(true);
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left">
                        <CardHeader>
                            <CardTitle className="text-black dark:text-primary">Vocabulary 2</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-xl font-black text-primary uppercase tracking-tight border-b pb-2 dark:text-white">1. Basic Verbs</h3>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                    <div className="font-bold p-3 bg-muted rounded-lg text-foreground uppercase tracking-widest text-xs dark:text-white">Español</div>
                                    <div className="font-bold p-3 bg-muted rounded-lg text-foreground uppercase tracking-widest text-xs dark:text-white">Inglés</div>
                                    {vocabularyVerbs.map((v, i) => (
                                        <React.Fragment key={`verb-${i}`}>
                                            <div className="p-3 border rounded bg-white/5 text-foreground font-medium flex items-center">{v.spanish}</div>
                                            <Input value={verbsAnswers[i]} onChange={e => { const na = [...verbsAnswers]; na[i] = e.target.value; setVerbsAnswers(na); setVerbsValidation(v => { const nv = [...v]; nv[i] = 'unchecked'; return nv; }); setCanAdvanceVocab(false); }} className={cn("h-12", verbsValidation[i] === 'correct' ? 'border-green-500 bg-green-50/5' : verbsValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" />
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className="text-xl font-black text-primary uppercase tracking-tight border-b pb-2 dark:text-white">2. Basic Words</h3>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                    <div className="font-bold p-3 bg-muted rounded-lg text-foreground uppercase tracking-widest text-xs dark:text-white">Español</div>
                                    <div className="font-bold p-3 bg-muted rounded-lg text-foreground uppercase tracking-widest text-xs dark:text-white">Inglés</div>
                                    {vocabularyWords.map((v, i) => (
                                        <React.Fragment key={`word-${i}`}>
                                            <div className="p-3 border rounded bg-white/5 text-foreground font-medium flex items-center">{v.spanish}</div>
                                            <Input value={wordsAnswers[i]} onChange={e => { const na = [...wordsAnswers]; na[i] = e.target.value; setWordsAnswers(na); setWordsValidation(v => { const nv = [...v]; nv[i] = 'unchecked'; return nv; }); setCanAdvanceVocab(false); }} className={cn("h-12", wordsValidation[i] === 'correct' ? 'border-green-500 bg-green-50/5' : wordsValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" />
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6"><Button onClick={handleVocabCheck} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white'>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <div className="space-y-6 text-left">
                        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-black">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">“DO - DOES”</CardTitle></CardHeader>
                            <CardContent className="space-y-6 text-lg font-bold">
                                <div className="p-6 bg-slate-100 rounded-2xl border">
                                    <p className="text-primary mb-2">DO-DOES EN INGLES PUEDE SERVIR COMO:</p>
                                    <p>1 - VERBO (HACER) // 2- AUXILIAR</p>
                                    <p className="font-mono text-xl mt-4">I DO - YOU DO - WE DO - THEY DO<br/>HE / SHE / IT DOES</p>
                                </div>
                                <div className="p-6 bg-slate-100 rounded-2xl border">
                                    <p className="text-primary uppercase mb-2">Estructura con Auxiliares (Do / Does):</p>
                                    <ul className="space-y-2 font-mono text-base">
                                        <li><span className="text-green-600">(+)</span> = pronoun + verb + complement</li>
                                        <li><span className="text-red-600">(-)</span> = pronoun + do/does + not + verb + complement</li>
                                        <li><span className="text-blue-600">(?)</span> = do/does + pronoun + verb + complement?</li>
                                    </ul>
                                </div>
                                <div className="p-6 bg-slate-100 rounded-2xl border">
                                    <p className="text-primary uppercase mb-2">Respuestas Cortas (Short Answers):</p>
                                    <ul className="space-y-1 font-mono text-base">
                                        <li><span className="text-green-600">(+A)</span> = Yes, pronoun + do/does</li>
                                        <li><span className="text-red-600">(-A)</span> = No, pronoun + do/does + not</li>
                                    </ul>
                                </div>
                                <div className="p-6 bg-destructive/10 rounded-2xl border-2 border-dashed border-destructive/30 text-center">
                                    <p className="text-destructive font-black uppercase">Contracciones Negativas:</p>
                                    <p className="text-2xl mt-2">DO NOT = DON’T<br/>DOES NOT = DOESN’T</p>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center pt-2 pb-6"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-16 font-bold text-white">Entendido <ArrowRight className="ml-2" /></Button></CardFooter>
                        </Card>
                    </div>
                );
            case 'ex1':
                return <SimpleTranslationExercise 
                            course="a1" 
                            exerciseKey="c2_ex1_full" 
                            title="Exercise 1" 
                            onComplete={() => handleTopicComplete('ex1')} 
                            vocabulary={ex1Vocab}
                            highlightVocabulary={true}
                        />;
            case 'ex2':
                return <MultiFormExercise 
                            prompts={exercise2Prompts} 
                            onComplete={() => handleTopicComplete('ex2')} 
                            vocabulary={ex2Vocab}
                        />;
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
