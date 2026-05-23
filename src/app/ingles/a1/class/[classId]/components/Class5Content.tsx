'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle, Info, Loader2, ArrowRight, Mic, Pencil, Check, X } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ErrorCorrectionExercise } from '@/components/kids/exercises/error-correction-exercise';
import { PresentSimpleExercise } from '@/components/kids/exercises/present-simple';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { Class5VocabExercise } from '@/components/kids/exercises/class5-vocab-exercise';

const vocabularyData = {
    verbos: [
        { spanish: 'SALTAR', english: 'JUMP' }, { spanish: 'QUERER', english: 'WANT' },
        { spanish: 'PODER', english: 'CAN' }, { spanish: 'DEBER', english: 'SHOULD' },
        { spanish: 'VIAJAR', english: 'TRAVEL' }, { spanish: 'LLAMAR', english: 'CALL' },
        { spanish: 'MANEJAR', english: 'DRIVE' }, { spanish: 'COCINAR', english: 'COOK' },
        { spanish: 'LEVANTARSE', english: 'GET UP' }, { spanish: 'VENIR', english: 'COME' },
        { spanish: 'LLEGAR', english: 'ARRIVE' },
    ],
    adjetivos: [
        { spanish: 'ABURRIDO', english: 'BORED' }, { spanish: 'CANSADO', english: 'TIRED' },
        { spanish: 'HAMBRIENTO', english: 'HUNGRY' }, { spanish: 'ENOJADO', english: 'ANGRY' },
    ]
};

const exercise1Data = [
    { incorrect: "SHE DONT ANSWER MY QUESTION", translationHint: "(ELLA NO CONTESTA MIS PREGUNTAS)", correctAnswers: ["she does not answer my questions", "she doesn't answer my questions"] },
    { incorrect: "WE DONT GOES TO SCHOL THE SONDAYS.", translationHint: "", correctAnswers: ["we do not go to school on sundays", "we don't go to school on sundays"] },
    { incorrect: "DOIS JOSEPH LIKES MUVIS?", translationHint: "(¿A JOSEPH LE GUSTAN LAS PELÍCULAS?)", correctAnswers: ["does joseph like movies?"] },
];

const class5Exercise2Data = [
    { spanish: "EL BEBE LECHE", answers: { affirmative: ["he drinks milk"], negative: ["he does not drink milk", "he doesn't drink milk"], interrogative: ["does he drink milk?"] } },
    { spanish: "YO NADO LOS DOMINGOS", answers: { affirmative: ["i swim on sundays"], negative: ["i do not swim on sundays", "i don't swim on sundays"], interrogative: ["do i swim on sundays?"] } },
];

interface Topic {
    key: string;
    name: string;
    icon: React.ElementType;
    status: 'locked' | 'active' | 'completed';
}

const ICONS = { locked: Lock, active: BookOpen, completed: CheckCircle };

export default function Class5Content() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const progressStorageKey = 'progress_a1_eng_u1_c5_v101_blindado';
    const mainProgressKey = 'progress_a1_eng_unit_1_class_5';

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('vocabulary');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const [vocabAnswers, setVocabAnswers] = useState<{[key: string]: string[]}>({});
    const [vocabValidation, setVocabValidation] = useState<{[key: string]: ('correct' | 'incorrect' | 'unchecked')[]}>({});
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);
    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'nota-importante', name: 'Nota Importante', icon: Info, status: 'locked' },
        { key: 'ejercicio-1', name: 'Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'ejercicio-vocabulario', name: 'Ejercicio Vocabulario', icon: PenSquare, status: 'locked' },
    ], []);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

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

        const initAnswers: any = {}; const initVal: any = {};
        Object.keys(vocabularyData).forEach(cat => {
            initAnswers[cat] = Array((vocabularyData as any)[cat].length).fill('');
            initVal[cat] = Array((vocabularyData as any)[cat].length).fill('unchecked');
        });
        setVocabAnswers(initAnswers); setVocabValidation(initVal);
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
        if (key === 'nota-importante' || key === 'vocabulary') handleTopicComplete(key);
    };

    const handleVocabChange = (cat: string, idx: number, val: string) => {
        const na = { ...vocabAnswers }; na[cat][idx] = val; setVocabAnswers(na);
        const nv = { ...vocabValidation }; nv[cat][idx] = 'unchecked'; setVocabValidation(nv);
        setCanAdvanceVocab(false);
    };

    const handleCheckVocab = () => {
        let ok = false; const nv: any = {};
        Object.keys(vocabularyData).forEach(cat => {
            nv[cat] = (vocabularyData as any)[cat].map((item: any, idx: number) => {
                const uv = (vocabAnswers[cat][idx] || '').trim().toUpperCase();
                const cv = item.english.toUpperCase();
                let res = uv === cv || uv === `TO ${cv}`;
                if (res) ok = true; return res ? 'correct' : 'incorrect';
            });
        });
        setVocabValidation(nv); if (ok) setCanAdvanceVocab(true);
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="p-6 text-left border-2 border-brand-purple">
                        <CardHeader><CardTitle>Vocabulario Clase 5</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {Object.entries(vocabularyData).map(([cat, items]) => (
                                <div key={cat}><h4 className="font-bold capitalize">{cat}</h4><div className="grid grid-cols-2 gap-2">{items.map((item, i) => (<React.Fragment key={i}><div className="p-2 border rounded">{item.spanish}</div><Input value={vocabAnswers[cat][i]} onChange={e => handleVocabChange(cat, i, e.target.value)} className={cn(vocabValidation[cat][i] === 'correct' ? 'border-green-500' : vocabValidation[cat][i] === 'incorrect' ? 'border-red-500' : '')} /></React.Fragment>))}</div></div>
                            ))}
                        </CardContent>
                        <CardFooter className="flex justify-between"><Button onClick={handleCheckVocab}>Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'nota-importante': return <Card className="p-6 text-left border-2 border-brand-purple"><CardTitle>Notas de Gramática</CardTitle><CardContent className="pt-4 space-y-4"><p>Recuerda el uso de "TO" entre dos verbos y las reglas de "GO".</p></CardContent><CardFooter><Button onClick={() => handleTopicComplete('nota-importante')}>Entendido</Button></CardFooter></Card>;
            case 'ejercicio-1': return <ErrorCorrectionExercise exerciseData={exercise1Data} onComplete={() => handleTopicComplete('ejercicio-1')} title="Ejercicio 1" />;
            case 'ejercicio-vocabulario': return <Class5VocabExercise onComplete={() => handleTopicComplete('ejercicio-vocabulario')} />;
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