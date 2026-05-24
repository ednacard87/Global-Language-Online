'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
    Clock,
    ArrowRight
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';

// --- DATA & CONFIG ---

const progressStorageVersion = 'progress_a1_eng_u3_c12_v130_blindado';
const mainProgressKey = 'progress_a1_eng_unit_3_class_12';

const timeExpressionsData = [
    { spanish: 'ANOCHE', english: ['LAST NIGHT'] },
    { spanish: 'ESTA NOCHE', english: ['TONIGHT'] },
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

// --- MAIN COMPONENT ---

export default function Class12Content() {
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

    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(timeExpressionsData.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(timeExpressionsData.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary (Time Expressions)', icon: Clock, status: 'active' },
        { key: 'grammar', name: 'Grammar: Present Continuous', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'grammar2', name: 'Grammar: ING Rules', icon: GraduationCap, status: 'locked' },
        { key: 'ex2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
    ], []);

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
        
        const currentSaved = studentProfile?.lessonProgress?.[progressStorageVersion];
        if (JSON.stringify(s) !== JSON.stringify(currentSaved)) {
            updateDocumentNonBlocking(studentDocRef, { 
                [`lessonProgress.${progressStorageVersion}`]: s, 
                [`progress.${mainProgressKey}`]: progressValue 
            });
        }
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
        if (['grammar', 'grammar2'].includes(topicKey)) setTopicToComplete(topicKey);
    };

    const handleCheckVocab = () => {
        let ok = false;
        const nv = timeExpressionsData.map((v, i) => {
            const cor = v.english.some(e => e.toUpperCase() === vocabAnswers[i].trim().toUpperCase());
            if (cor) ok = true; return cor ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv);
        if (ok) {
            toast({ title: "¡Bien hecho!", description: "Has acertado al menos una. ¡Ya puedes avanzar!" });
            setCanAdvanceVocab(true);
        } else {
            toast({ variant: 'destructive', title: "Sigue intentando" });
        }
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left">
                        <CardHeader><CardTitle>Time Expressions</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-2 text-base max-w-md mx-auto">
                                <div className="font-bold p-2 bg-muted rounded">Español</div>
                                <div className="font-bold p-2 bg-muted rounded">Inglés</div>
                                {timeExpressionsData.map((v, i) => (
                                    <React.Fragment key={i}>
                                        <div className="p-2 border rounded bg-white/5">{v.spanish}</div>
                                        <Input 
                                            value={vocabAnswers[i]} 
                                            onChange={e => { const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); setCanAdvanceVocab(false); }} 
                                            className={cn(vocabValidation[i] === 'correct' ? 'border-green-500 bg-green-50/5' : vocabValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} 
                                            autoComplete="off"
                                        />
                                    </React.Fragment>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 mt-4">
                            <Button onClick={handleCheckVocab} variant="secondary">Verificar</Button>
                            <Button onClick={() => setTopicToComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">PRESENT CONTINUOUS</CardTitle></CardHeader>
                        <CardContent className="space-y-6 text-black dark:text-white font-bold text-lg">
                            <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                <p className="text-primary mb-4 uppercase tracking-tighter">¿Qué es?</p>
                                <p className="mb-4">Se usa para hablar de acciones que están ocurriendo en este preciso momento.</p>
                                <div className="bg-muted/50 p-4 rounded-xl border font-mono">
                                    <p className="text-primary font-black uppercase text-sm mb-2">Estructura Básica:</p>
                                    <p>Subject + To be + Verb-ING</p>
                                    <p className="text-sm italic mt-2 text-slate-700 dark:text-slate-300">Ej: I AM working / She IS eating</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6">
                            <Button onClick={() => setTopicToComplete('grammar')} size="lg" className="px-12 font-bold">Entendido</Button>
                        </CardFooter>
                    </Card>
                );
            case 'ex1': return <SimpleTranslationExercise exerciseKey="c12_ex1" course="a1" onComplete={() => setTopicToComplete('ex1')} />;
            case 'grammar2':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">ING RULES</CardTitle></CardHeader>
                        <CardContent className="space-y-6 text-black dark:text-white font-bold text-lg">
                            <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                <p className="text-primary mb-4 uppercase tracking-tighter">Reglas de Ortografía (-ING):</p>
                                <ul className="list-disc pl-5 space-y-2 font-normal text-base">
                                    <li>General: add <span className="font-bold">-ing</span> (Eat &rarr; Eating)</li>
                                    <li>Ends in <span className="font-bold">-e</span>: remove 'e' (Take &rarr; Taking)</li>
                                    <li>Short verb (CVC): double consonant (Stop &rarr; Stopping)</li>
                                </ul>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6">
                            <Button onClick={() => setTopicToComplete('grammar2')} size="lg" className="px-12 font-bold">Entendido</Button>
                        </CardFooter>
                    </Card>
                );
            case 'ex2': return <SimpleTranslationExercise exerciseKey="c12_ex2" course="a1" onComplete={() => setTopicToComplete('ex2')} />;
            default: return null;
        }
    };

    return (
        <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
            <div className="md:col-span-3 md:order-2 order-1 text-left">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader><CardTitle>Ruta Clase 12</CardTitle></CardHeader>
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
