'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { BookOpen, GraduationCap, CheckCircle, PenSquare, Lock, Loader2, Info, Gamepad2, Check, X } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { AdjectivesMemoryGame } from '@/components/kids/exercises/adjectives-memory-game';

const vocabularyData = [
    { spanish: 'SERIO', english: ['serious'] }, { spanish: 'ALEGRE', english: ['cheerful'] },
    { spanish: 'OCUPADO', english: ['busy'] }, { spanish: 'RARO, EXTRAÑO', english: ['strange'] },
    { spanish: 'AMIGABLE', english: ['friendly'] }, { spanish: 'INTELIGENTE', english: ['intelligent'] },
    { spanish: 'EGOÍSTA', english: ['selfish'] }, { spanish: 'FELIZ', english: ['happy'] },
    { spanish: 'AMABLE', english: ['kind'] }, { spanish: 'RAPIDO', english: ['fast'] },
    { spanish: 'ABURRIDOR', english: ['boring'] }, { spanish: 'LENTO', english: ['slow'] },
    { spanish: 'ORDENADO', english: ['tidy'] }, { spanish: 'TRABAJADOR', english: ['hardworking'] },
];

const LinesWritingExercise = ({ title, description, lineCount = 6, onComplete, studentDocRef, initialData, initialGrades, savePath, savePathGrades, isAdmin }: any) => {
    const [lines, setLines] = useState<string[]>(Array(lineCount).fill(''));
    const [grades, setGrades] = useState<Record<number, 'correct' | 'incorrect' | null>>(initialGrades || {});
    useEffect(() => { if (initialData) setLines(initialData); }, [initialData]);
    const handleLineChange = (idx: number, val: string) => {
        const nl = [...lines]; nl[idx] = val; setLines(nl);
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [savePath]: nl });
    };
    const handleGrade = (idx: number, type: 'correct' | 'incorrect') => {
        if (!isAdmin) return;
        const ng = { ...grades, [idx]: grades[idx] === type ? null : type }; setGrades(ng);
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [savePathGrades]: ng });
    };
    return (
        <Card className="border-2 border-brand-purple">
            <CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader>
            <CardContent className="space-y-3">
                {lines.map((l, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <Input value={l} onChange={e => handleLineChange(i, e.target.value)} className={cn(grades[i] === 'correct' ? 'border-green-500' : grades[i] === 'incorrect' ? 'border-red-500' : '')} />
                        {isAdmin && (
                            <div className="flex gap-1">
                                <Button size="icon" variant="ghost" onClick={() => handleGrade(i, 'correct')} className={cn("h-8 w-8 rounded-full", grades[i] === 'correct' ? "bg-green-500 text-white" : "bg-muted")}><Check className="h-4 w-4"/></Button>
                                <Button size="icon" variant="ghost" onClick={() => handleGrade(i, 'incorrect')} className={cn("h-8 w-8 rounded-full", grades[i] === 'incorrect' ? "bg-red-500 text-white" : "bg-muted")}><X className="h-4 w-4"/></Button>
                            </div>
                        )}
                    </div>
                ))}
            </CardContent>
            <CardFooter><Button onClick={onComplete}>Finalizar</Button></CardFooter>
        </Card>
    );
};

interface Topic {
    key: string;
    name: string;
    icon: React.ElementType;
    status: 'locked' | 'active' | 'completed';
}

const ICONS = { locked: Lock, active: BookOpen, completed: CheckCircle };

export default function Class6Content() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const progressStorageKey = 'progress_a1_eng_u1_c6_v101_blindado';
    const mainProgressKey = 'progress_a1_eng_unit_1_class_6';

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('vocabulary');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(vocabularyData.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(vocabularyData.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);
    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: 'Adjetivos vs Pronombres', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: 'Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: 'Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'ex3', name: 'Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'note', name: 'Nota', icon: Info, status: 'locked' },
        { key: 'ex4', name: 'Ejercicio 4', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: 'Juego de Memoria', icon: Gamepad2, status: 'locked' },
        { key: 'ex5', name: 'Ejercicio 5', icon: PenSquare, status: 'locked' },
        { key: 'ex6', name: 'Ejercicio 6', icon: PenSquare, status: 'locked' },
        { key: 'ex7', name: 'Ejercicio 7', icon: PenSquare, status: 'locked' },
        { key: 'ex8', name: 'Create 1', icon: Pencil, status: 'locked' },
    ], []);

    const handleTopicComplete = useCallback((key: string) => setTopicToComplete(key), []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile) return;
        let path = initialLearningPath.map(t => ({...t}));
        let savedST = '';
        if (isAdmin) path.forEach(t => t.status = 'completed');
        else if (studentProfile?.lessonProgress?.[progressStorageKey]) {
            const d = studentProfile.lessonProgress[progressStorageKey];
            path.forEach(t => { if (d[t.key]) t.status = d[t.key]; });
            savedST = d.lastSelectedTopic || '';
        }
        let lastDone = true;
        for(let i=0; i < path.length; i++) { if (lastDone && path[i].status === 'locked') path[i].status = 'active'; lastDone = path[i].status === 'completed'; }
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
        const d: any = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(t => d[t.key] = t.status);
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageKey}`]: d, [`progress.${mainProgressKey}`]: progressValue });
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
        if (['vocabulary', 'grammar', 'note'].includes(key)) handleTopicComplete(key);
    };

    const handleCheckVocab = () => {
        let ok = false;
        const nv = vocabularyData.map((item, idx) => {
            const res = item.english.some(e => e.toLowerCase() === vocabAnswers[idx].trim().toLowerCase());
            if (res) ok = true; return res ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv as any); if (ok) setCanAdvanceVocab(true);
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="p-6 text-left border-2 border-brand-purple">
                        <CardHeader><CardTitle>Vocabulario Clase 6</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-2">
                            {vocabularyData.map((item, i) => (<React.Fragment key={i}><div className="p-2 border rounded">{item.spanish}</div><Input value={vocabAnswers[i]} onChange={e => { const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); setCanAdvanceVocab(false); }} className={cn(vocabValidation[i] === 'correct' ? 'border-green-500' : vocabValidation[i] === 'incorrect' ? 'border-red-500' : '')} /></React.Fragment>))}
                        </CardContent>
                        <CardFooter className="flex justify-between"><Button onClick={handleCheckVocab}>Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar': return <Card className="p-6 text-left border-2 border-brand-purple"><CardTitle>Grammar: Possessives</CardTitle><CardContent className="pt-4"><p>My (Adjetivo) vs Mine (Pronombre). El adjetivo va antes del sustantivo, el pronombre va después.</p></CardContent><CardFooter><Button onClick={() => handleTopicComplete('grammar')}>Siguiente</Button></CardFooter></Card>;
            case 'ex1': return <SimpleTranslationExercise course="a1" exerciseKey="c6_ex1" onComplete={() => handleTopicComplete('ex1')} />;
            case 'ex2': return <SimpleTranslationExercise course="a1" exerciseKey="c6_ex2" onComplete={() => handleTopicComplete('ex2')} />;
            case 'ex3': return <SimpleTranslationExercise course="a1" exerciseKey="c6_ex3" onComplete={() => handleTopicComplete('ex3')} />;
            case 'note': return <Card className="p-6 text-left border-2 border-brand-purple"><CardTitle>Nota de Posesivos</CardTitle><CardContent className="pt-4 space-y-4"><p><strong>1- Adjetivos:</strong> ANTES del sustantivo (My house).</p><p><strong>2- Pronombres:</strong> DESPUÉS del sustantivo (That house is mine).</p></CardContent><CardFooter><Button onClick={() => handleTopicComplete('note')}>Entendido</Button></CardFooter></Card>;
            case 'ex4': return <SimpleTranslationExercise course="a1" exerciseKey="c6_ex4" onComplete={() => handleTopicComplete('ex4')} />;
            case 'vocab_game': return <AdjectivesMemoryGame data={vocabularyData} onComplete={() => handleTopicComplete('vocab_game')} />;
            case 'ex5': return <SimpleTranslationExercise course="a1" exerciseKey="c6_ex5" onComplete={() => handleTopicComplete('ex5')} />;
            case 'ex6': return <SimpleTranslationExercise course="a1" exerciseKey="c6_ex6" onComplete={() => handleTopicComplete('ex6')} />;
            case 'ex7': return <SimpleTranslationExercise course="a1" exerciseKey="c6_ex7" onComplete={() => handleTopicComplete('ex7')} />;
            case 'ex8': return <LinesWritingExercise title="Create 1" description="Escribe 6 frases usando pronombres posesivos." onComplete={() => handleTopicComplete('ex8')} studentDocRef={studentDocRef} isAdmin={isAdmin} savePath={`lessonProgress.${progressStorageKey}.writingEx8`} savePathGrades={`lessonProgress.${progressStorageKey}.writingEx8Grades`} initialData={studentProfile?.lessonProgress?.[progressStorageKey]?.writingEx8} initialGrades={studentProfile?.lessonProgress?.[progressStorageKey]?.writingEx8Grades} />;
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
                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer', (item.status === 'locked' && !isAdmin) ? 'text-muted-foreground/50' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-bold')}>
                                    <item.icon className={cn("h-5 w-5", item.status === 'completed' && 'text-green-500')} /><span>{item.name}</span>
                                </li>
                            ))}
                        </ul></nav>
                        <div className="mt-6 pt-6 border-t"><Progress value={progressValue} className="h-1.5" /></div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}