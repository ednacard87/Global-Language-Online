'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle, Info, Gamepad2, Loader2, Check, X } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { AdjectivesMemoryGame } from '@/components/kids/exercises/adjectives-memory-game';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
};

const progressStorageVersion = 'progress_a1_eng_u2_c6_v16_stable';
const mainProgressKey = 'progress_a1_eng_unit_2_class_6';

const vocabularyData = [
    { spanish: 'SERIO', english: ['serious'] },
    { spanish: 'ALEGRE', english: ['cheerful'] },
    { spanish: 'OCUPADO', english: ['busy'] },
    { spanish: 'RARO, EXTRAÑO', english: ['strange'] },
    { spanish: 'AMIGABLE', english: ['friendly'] },
    { spanish: 'INTELIGENTE', english: ['intelligent'] },
    { spanish: 'EGOÍSTA', english: ['selfish'] },
    { spanish: 'FELIZ', english: ['happy'] },
    { spanish: 'AMABLE', english: ['kind'] },
    { spanish: 'RAPIDO', english: ['fast'] },
    { spanish: 'ABURRIDOR', english: ['boring'] },
    { spanish: 'LENTO', english: ['slow'] },
    { spanish: 'ORDENADO', english: ['tidy'] },
    { spanish: 'TRABAJADOR', english: ['hardworking'] },
];

const possessivesTable = [
    { adj: 'MY', adjEs: 'MI-MIS', pro: 'MINE', proEs: 'MIO (MIOS-MIA- MIAS)' },
    { adj: 'YOUR', adjEs: 'TU-TUS', pro: 'YOURS', proEs: 'TUYO (OS-A-AS)' },
    { adj: 'HIS', adjEs: 'SU-SUS DE EL', pro: 'HIS', proEs: '(SUYO/A/OS/AS DE EL)' },
    { adj: 'HER', adjEs: 'SU-SUS DE ELLA', pro: 'HERS', proEs: '(SUYO/A/OS/AS DE ELLA)' },
    { adj: 'OUR', adjEs: 'NUESTRO/A/OS/AS', pro: 'OURS', proEs: '( NUESTRO/A/OS/AS)' },
    { adj: 'THEIR', adjEs: 'SU- SUS DE ELLOS', pro: 'THEIRS', proEs: '( SUYO/A/OS/AS DE ELLOS)' },
];

const LinesWritingExercise = ({ 
    title, 
    description, 
    lineCount = 16,
    onComplete, 
    studentDocRef, 
    initialData,
    initialGrades,
    savePath,
    savePathGrades,
    isAdmin = false,
    hasTitleLine = false
}: any) => {
    const totalLines = hasTitleLine ? lineCount + 1 : lineCount;
    const [lines, setLines] = useState<string[]>(Array(totalLines).fill(''));
    const [grades, setGrades] = useState<Record<number, 'correct' | 'incorrect' | null>>(initialGrades || {});
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!initializedRef.current && initialData && Array.isArray(initialData)) {
            const newLines = [...Array(totalLines).fill('')];
            initialData.forEach((val, i) => { if (i < totalLines) newLines[i] = val || ''; });
            setLines(newLines);
            if (initialData.length > 0) initializedRef.current = true;
        }
    }, [initialData, totalLines]);

    const handleLineChange = (index: number, value: string) => {
        const newLines = [...lines];
        newLines[index] = value;
        setLines(newLines);
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [savePath]: newLines });
    };

    const handleToggleGrade = (index: number, type: 'correct' | 'incorrect') => {
        if (!isAdmin) return;
        const newGrades = { ...grades };
        newGrades[index] = newGrades[index] === type ? null : type;
        setGrades(newGrades);
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [savePathGrades]: newGrades });
    };

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
            <CardHeader><CardTitle>{title}</CardTitle><CardDescription className="font-semibold text-primary">{description}</CardDescription></CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2">
                    {lines.map((line, idx) => {
                        const status = grades[idx];
                        return (
                            <div key={idx} className="flex items-center gap-3">
                                <span className="font-bold w-8 text-right text-primary">{idx + 1}.</span>
                                <Input value={line} onChange={e => handleLineChange(idx, e.target.value)} className={cn("flex-1", status === 'correct' ? 'border-green-500' : status === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" />
                                <div className="flex gap-1 shrink-0">
                                    <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(idx, 'correct')} className={cn("h-6 w-6 rounded-full", status === 'correct' ? "bg-green-500 text-white" : "bg-muted")} disabled={!isAdmin}><Check className="h-3 w-3"/></Button>
                                    <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(idx, 'incorrect')} className={cn("h-6 w-6 rounded-full", status === 'incorrect' ? "bg-red-500 text-white" : "bg-muted")} disabled={!isAdmin}><X className="h-3 w-3"/></Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
            <CardFooter className="pt-6 border-t flex justify-center"><Button onClick={onComplete} size="lg">Avanzar</Button></CardFooter>
        </Card>
    );
};

export default function EngA1Class6Page() {
    const { t } = useTranslation();
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
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(vocabularyData.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(vocabularyData.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary (Basic Adjectives)', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: 'Grammar', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'ex3', name: 'Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'note', name: 'Note', icon: Info, status: 'locked' },
        { key: 'ex4', name: 'Exercise 4', icon: PenSquare, status: 'locked' },
        { key: 'text', name: 'Dictation 1', icon: BookOpen, status: 'locked' },
        { key: 'vocab_game', name: 'Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'ex5', name: 'Exercise 5', icon: PenSquare, status: 'locked' },
        { key: 'ex6', name: 'Exercise 6', icon: PenSquare, status: 'locked' },
        { key: 'ex7', name: 'Exercise 7', icon: PenSquare, status: 'locked' },
        { key: 'ex8', name: 'Create 1', icon: PenSquare, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
        let path = initialLearningPath.map(topic => ({ ...topic }));
        let savedSelectedTopic = '';

        if (isAdmin) {
          path.forEach(item => { item.status = 'completed'; });
        } else if(studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedData = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => { if (savedData[item.key]) item.status = savedData[item.key]; });
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
        setInitialLoadComplete(true);
        setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;
        const statusesToSave: Record<string, any> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => { statusesToSave[item.key] = item.status; });
        if (JSON.stringify(statusesToSave) !== JSON.stringify(studentProfile?.lessonProgress?.[progressStorageVersion])) {
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: statusesToSave, [`progress.${mainProgressKey}`]: progressValue });
        }
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, studentProfile, isInitialLoading]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(currentPath => {
            let wasUnlocked = false;
            let nextToSelect: string | null = null;
            const newPath = currentPath.map(t => ({ ...t }));
            const idx = newPath.findIndex(t => t.key === topicToComplete);
            if (idx !== -1 && newPath[idx].status !== 'completed') {
                newPath[idx].status = 'completed';
                if (idx + 1 < newPath.length && newPath[idx + 1].status === 'locked') {
                    newPath[idx + 1].status = 'active';
                    wasUnlocked = true;
                    nextToSelect = newPath[idx + 1].key;
                }
            }
            if (wasUnlocked) setTimeout(() => toast({ title: "¡Siguiente tema desbloqueado!" }), 0);
            if (nextToSelect) { const n = nextToSelect; setTimeout(() => setSelectedTopic(n), 0); }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (['grammar', 'note'].includes(topicKey)) handleTopicComplete(topicKey);
    };

    const handleCheckVocab = () => {
        let ok = false;
        const newVal = vocabularyData.map((item, idx) => {
            const isCorrect = item.english.some(e => e.toLowerCase() === vocabAnswers[idx].trim().toLowerCase());
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
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader><CardTitle>Vocabulary (Adjectives)</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                <div className="font-bold p-3 bg-muted rounded-lg text-left">Español</div>
                                <div className="font-bold p-3 bg-muted rounded-lg text-left">Inglés</div>
                                {vocabularyData.map((item, idx) => (
                                    <React.Fragment key={idx}>
                                        <div className="p-3 border rounded-lg">{item.spanish}</div>
                                        <Input value={vocabAnswers[idx]} onChange={e => { const n = [...vocabAnswers]; n[idx] = e.target.value; setVocabAnswers(n); setVocabValidation(v => { const nv = [...v]; nv[idx] = 'unchecked'; return nv as any; }); setCanAdvanceVocab(false); }} className={cn(vocabValidation[idx] === 'correct' ? 'border-green-500' : vocabValidation[idx] === 'incorrect' ? 'border-red-500' : '')} />
                                    </React.Fragment>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between"><Button onClick={handleCheckVocab}>Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader><CardTitle>Adjetivos vs Pronombres Posesivos</CardTitle></CardHeader>
                        <CardContent><Table className="text-base"><TableHeader className="bg-muted"><TableRow><TableHead>ADJ.</TableHead><TableHead>ES</TableHead><TableHead>PRO.</TableHead><TableHead>ES</TableHead></TableRow></TableHeader><TableBody>{possessivesTable.map((row, idx) => (<TableRow key={idx}><TableCell className="font-bold text-primary">{row.adj}</TableCell><TableCell>{row.adjEs}</TableCell><TableCell className="font-bold text-brand-purple">{row.pro}</TableCell><TableCell>{row.proEs}</TableCell></TableRow>))}</TableBody></Table></CardContent>
                        <CardFooter className="justify-center"><Button onClick={() => handleTopicComplete('grammar')}>Entendido</Button></CardFooter>
                    </Card>
                );
            case 'note':
                return (
                    <div className="space-y-6 text-left">
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50">
                            <CardHeader><CardTitle className="text-xl font-bold text-primary">1- Adjetivos Posesivos</CardTitle></CardHeader>
                            <CardContent className="text-slate-900 dark:text-slate-100"><p className="text-lg">Siempre en una frase están: <strong>ANTES</strong> del sustantivo.</p><div className="mt-4 p-3 bg-white/50 rounded-lg border font-mono"><p>Example = Ejemplo</p><p className="font-bold text-primary">My house / Your car</p></div></CardContent>
                        </Card>
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50">
                            <CardHeader><CardTitle className="text-xl font-bold text-primary">2- Pronombres Posesivos</CardTitle></CardHeader>
                            <CardContent className="text-slate-900 dark:text-slate-100"><p className="text-lg">Siempre en una frase están: <strong>DESPUÉS</strong> del sustantivo.</p><div className="mt-4 p-3 bg-white/50 rounded-lg border font-mono"><p>Example = Ejemplo</p><p className="font-bold text-primary">That house is mine (Esa casa es mía)</p></div></CardContent>
                        </Card>
                        <div className="flex justify-center pt-4"><Button onClick={() => handleTopicComplete('note')} size="lg" className="px-12">Continuar</Button></div>
                    </div>
                );
            case 'text':
                return <LinesWritingExercise title="DICTATION 1" description="Escribe las frases dictadas." onComplete={() => handleTopicComplete('text')} studentDocRef={studentDocRef} lineCount={16} hasTitleLine={true} initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation1} initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation1Grades} savePath={`lessonProgress.${progressStorageVersion}.dictation1`} savePathGrades={`lessonProgress.${progressStorageVersion}.dictation1Grades`} isAdmin={isAdmin} />;
            case 'vocab_game': return <AdjectivesMemoryGame data={vocabularyData} onComplete={() => handleTopicComplete('vocab_game')} />;
            case 'ex1': return <SimpleTranslationExercise exerciseKey="c6_ex1" onComplete={() => handleTopicComplete('ex1')} course="a1" title="Exercise 1" vocabulary={{"mascota": "pet", "carro": "car", "hermana": "sister", "caballo": "horse", "juguete": "toy", "finca": "farm", "casa": "house", "libro": "book"}} highlightVocabulary={true} />;
            case 'ex2': return <SimpleTranslationExercise exerciseKey="c6_ex2" onComplete={() => handleTopicComplete('ex2')} course="a1" title="Exercise 2" vocabulary={{"libros": "books", "hermanos": "brothers", "gato": "cat", "comida": "food", "hijo": "son", "zapatos": "shoes", "padres": "parents", "novia": "girlfriend", "amigos": "friends"}} highlightVocabulary={true} />;
            case 'ex3': return <SimpleTranslationExercise exerciseKey="c6_ex3" onComplete={() => handleTopicComplete('ex3')} course="a1" title="Exercise 3" vocabulary={{"mío": "mine", "tuya": "yours", "suyo/a": "his / hers", "suya": "theirs", "mías": "mine"}} highlightVocabulary={true} />;
            case 'ex4': return <SimpleTranslationExercise exerciseKey="c6_ex4" onComplete={() => handleTopicComplete('ex4')} course="a1" title="Exercise 4" vocabulary={{"computador": "computer", "casa": "house", "negro": "black", "perro": "dog", "gafas": "glasses", "hermano": "brother", "aquí": "here", "ahí": "there", "esperándote": "waiting for you", "puerta": "door", "cuero": "leather", "restaurante": "restaurant", "caliente": "hot", "tomarlo": "drink it"}} highlightVocabulary={true} />;
            case 'ex5': return <SimpleTranslationExercise exerciseKey="c6_ex5" onComplete={() => handleTopicComplete('ex5')} course="a1" title="Exercise 5" vocabulary={{"reloj": "watch", "vieja": "old", "mascota": "pet", "camisetas": "t-shirts", "página web": "website", "estudiantes": "students", "caja": "box", "portátil": "laptop"}} highlightVocabulary={true} />;
            case 'ex6': return <SimpleTranslationExercise exerciseKey="c6_ex6" onComplete={() => handleTopicComplete('ex6')} course="a1" title="Exercise 6" vocabulary={{"perdí": "lost", "llaves": "keys", "conozco": "know", "parientes": "relatives", "amigo": "friend", "aretas": "earrings", "chaqueta": "jacket"}} highlightVocabulary={true} />;
            case 'ex7': return <SimpleTranslationExercise exerciseKey="c6_ex7" onComplete={() => handleTopicComplete('ex7')} course="a1" title="Exercise 7" vocabulary={{"bolso": "bag", "francés": "french", "vive": "lives", "camiseta": "t-shirt", "familia": "family"}} highlightVocabulary={true} />;
            case 'ex8': return <LinesWritingExercise title="Create 1" description="Inventa frases usando pronombres posesivos." onComplete={() => handleTopicComplete('ex8')} studentDocRef={studentDocRef} lineCount={6} initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.writingEx8} initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.writingEx8Grades} savePath={`lessonProgress.${progressStorageVersion}.writingEx8`} savePathGrades={`lessonProgress.${progressStorageVersion}.writingEx8Grades`} isAdmin={isAdmin} />;
            default: return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin text-primary" /></div>;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-left text-white">
                        <Link href="/ingles/a1/unit/2" className="hover:underline text-sm font-bold text-primary">Volver a la Unidad 2</Link>
                        <h1 className="text-4xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase 6 (A1)</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader><CardTitle>Ruta</CardTitle></CardHeader>
                                <CardContent>
                                    <nav><ul className="space-y-1">
                                        {learningPath.map(item => (
                                            <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', (item.status === 'locked' && !isAdmin) ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-semibold')}>
                                                <div className="flex items-center gap-3">{(item.status === 'completed') ? <CheckCircle className="h-5 w-5 text-green-500" /> : <item.icon className="h-5 w-5" />}<span>{item.name}</span></div>
                                            </li>
                                        ))}
                                    </ul></nav>
                                    <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-sm mb-2"><span>Progreso</span><span className="font-bold">{progressValue}%</span></div><Progress value={progressValue} className="h-2" /></div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                    </div>
                </div>
            </main>
        </div>
    );
}
