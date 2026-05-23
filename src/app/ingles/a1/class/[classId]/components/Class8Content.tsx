'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle, Info, Mic, Loader2, ArrowRight, Check, X, Pencil, BookText } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { SentenceCompletionExercise } from '@/components/kids/exercises/sentence-completion-exercise';

const vocabularyData = [
    { spanish: 'ESTE/A', english: ['THIS'] }, { spanish: 'ESTOS/AS', english: ['THESE'] },
    { spanish: 'ESE/A', english: ['THAT'] }, { spanish: 'ESOS/AS', english: ['THOSE'] },
    { spanish: 'PERO', english: ['BUT'] }, { spanish: 'MIENTRAS', english: ['WHILE'] },
];

const ManualGradingExercise = ({ title, description, lineCount = 10, onComplete, studentDocRef, initialData, initialGrades, savePath, savePathGrades, isAdmin }: any) => {
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
                        <span className="w-6 font-bold">{i + 1}</span>
                        <Input value={l} onChange={e => handleLineChange(i, e.target.value)} className={cn(grades[i] === 'correct' ? 'border-green-500' : grades[i] === 'incorrect' ? 'border-red-500' : '')} />
                        <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => handleGrade(i, 'correct')} className={cn("h-8 w-8 rounded-full", grades[i] === 'correct' ? "bg-green-500 text-white" : "bg-muted")} disabled={!isAdmin}><Check className="h-4 w-4"/></Button>
                            <Button size="icon" variant="ghost" onClick={() => handleGrade(i, 'incorrect')} className={cn("h-8 w-8 rounded-full", grades[i] === 'incorrect' ? "bg-red-500 text-white" : "bg-muted")} disabled={!isAdmin}><X className="h-4 w-4"/></Button>
                        </div>
                    </div>
                ))}
            </CardContent>
            <CardFooter className="justify-center"><Button onClick={onComplete} size="lg">Avanzar</Button></CardFooter>
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

export default function Class8Content() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const progressStorageKey = 'progress_a1_eng_u1_c8_v101_blindado';
    const mainProgressKey = 'progress_a1_eng_unit_1_class_8';

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
        { key: 'vocabulary', name: 'Vocabulary', icon: BookOpen, status: 'active' },
        { key: 'dictation1', name: 'Dictation 1', icon: Mic, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'dictation2', name: 'Dictation 2', icon: Mic, status: 'locked' },
        { key: 'writing2', name: 'Writing 2', icon: Pencil, status: 'locked' },
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
        if (key === 'vocabulary') handleTopicComplete(key);
    };

    const handleCheckVocab = () => {
        let ok = false;
        const newVal = vocabularyData.map((item, idx) => {
            const res = item.english.some(e => e.toLowerCase() === vocabAnswers[idx].trim().toLowerCase());
            if (res) ok = true; return res ? 'correct' : 'incorrect';
        });
        setVocabValidation(newVal as any); if (ok) setCanAdvanceVocab(true);
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="p-6 text-left border-2 border-brand-purple">
                        <CardHeader><CardTitle>Vocabulario Clase 8</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-2">
                            {vocabularyData.map((item, i) => (<React.Fragment key={i}><div className="p-2 border rounded">{item.spanish}</div><Input value={vocabAnswers[i]} onChange={e => { const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); setCanAdvanceVocab(false); }} className={cn(vocabValidation[i] === 'correct' ? 'border-green-500' : vocabValidation[i] === 'incorrect' ? 'border-red-500' : '')} /></React.Fragment>))}
                        </CardContent>
                        <CardFooter className="flex justify-between"><Button onClick={handleCheckVocab}>Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'dictation1': return <ManualGradingExercise title="DICTATION 1" description="Escribe las frases dictadas. El primer renglón es el título." lineCount={13} onComplete={() => handleTopicComplete('dictation1')} studentDocRef={studentDocRef} isAdmin={isAdmin} savePath={`lessonProgress.${progressStorageKey}.dict1`} savePathGrades={`lessonProgress.${progressStorageKey}.dict1Grades`} initialData={studentProfile?.lessonProgress?.[progressStorageKey]?.dict1} initialGrades={studentProfile?.lessonProgress?.[progressStorageKey]?.dict1Grades} />;
            case 'dictation2': return <ManualGradingExercise title="DICTATION 2" description="Escribe las frases dictadas. El primer renglón es el título." lineCount={15} onComplete={() => handleTopicComplete('dictation2')} studentDocRef={studentDocRef} isAdmin={isAdmin} savePath={`lessonProgress.${progressStorageKey}.dict2`} savePathGrades={`lessonProgress.${progressStorageKey}.dict2Grades`} initialData={studentProfile?.lessonProgress?.[progressStorageKey]?.dict2} initialGrades={studentProfile?.lessonProgress?.[progressStorageKey]?.dict2Grades} />;
            case 'ex1': return <SimpleTranslationExercise course="a1" exerciseKey="c8_ex1" onComplete={() => handleTopicComplete('ex1')} vocabulary={{"contrario": "on the contrary", "jefe": "boss"}} highlightVocabulary={true} />;
            case 'ex2': return <SimpleTranslationExercise course="a1" exerciseKey="c8_ex2" onComplete={() => handleTopicComplete('ex2')} />;
            case 'writing2': return <ManualGradingExercise title="Writing 2" description="Escritura libre para calificar por el profesor." lineCount={10} onComplete={() => handleTopicComplete('writing2')} studentDocRef={studentDocRef} isAdmin={isAdmin} savePath={`lessonProgress.${progressStorageKey}.write2`} savePathGrades={`lessonProgress.${progressStorageKey}.write2Grades`} initialData={studentProfile?.lessonProgress?.[progressStorageKey]?.write2} initialGrades={studentProfile?.lessonProgress?.[progressStorageKey]?.write2Grades} />;
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
                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer', (item.status === 'locked' && !isAdmin) ? 'text-muted-foreground/50' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-bold')}>
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