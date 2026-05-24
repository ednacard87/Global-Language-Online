'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    GraduationCap, 
    CheckCircle, 
    Loader2, 
    ArrowRight 
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ComparativeExercise } from '@/components/kids/exercises/comparative-exercise';
import { SuperlativeExercise } from '@/components/kids/exercises/superlative-exercise';

// --- DATA ---

const progressStorageVersion = 'progress_a1_eng_u3_c13_v130_blindado';
const mainProgressKey = 'progress_a1_eng_unit_3_class_13';

const vocabularyData = [
    { spanish: 'BONITO/A', english: ['pretty', 'beautiful'] },
    { spanish: 'ANCHO', english: ['wide'] },
];

interface Topic {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
}

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- COMPONENT ---

export default function Class13Content() {
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

    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(vocabularyData.length).fill(''));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulario', name: 'Vocabulario (Adjetivos)', icon: BookOpen, status: 'active' },
        { key: 'comparativos', name: 'Gramática: Comparativos', icon: GraduationCap, status: 'locked' },
        { key: 'ejercicio-comparativo', name: 'Ejercicio Comparativo', icon: PenSquare, status: 'locked' },
        { key: 'superlativos', name: 'Gramática: Superlativos', icon: GraduationCap, status: 'locked' },
        { key: 'ejercicio-superlativo', name: 'Ejercicio Superlativo', icon: PenSquare, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile) return;
        let path = initialLearningPath.map(t => ({ ...t }));
        let savedST = '';
        if (isAdmin) path.forEach(t => t.status = 'completed');
        else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const d = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(t => { if (d[t.key]) t.status = d[t.key]; });
            savedST = d.lastSelectedTopic || '';
        }
        let lastDone = true;
        for(let i=0; i < path.length; i++) { if (lastDone && path[i].status === 'locked') path[i].status = 'active'; lastDone = path[i].status === 'completed'; }
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
        const it = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && it?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (['comparativos', 'superlativos'].includes(topicKey)) handleTopicComplete(topicKey);
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulario':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left">
                        <CardHeader><CardTitle>Vocabulario (Adjetivos)</CardTitle></CardHeader>
                        <CardContent><div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                            {vocabularyData.map((v, i) => (<React.Fragment key={i}><div className="p-2 border rounded bg-white/5">{v.spanish}</div><Input value={vocabAnswers[i]} onChange={e => { const n = [...vocabAnswers]; n[i] = e.target.value; setVocabAnswers(n); setCanAdvanceVocab(false); }} autoComplete="off" /></React.Fragment>))}
                        </div></CardContent>
                        <CardFooter className='flex justify-between border-t pt-6 mt-4'>
                            <Button onClick={() => { let ok = false; vocabularyData.forEach((v, i) => { if (v.english.some(e => e.toLowerCase() === vocabAnswers[i].trim().toLowerCase())) ok = true; }); setCanAdvanceVocab(ok); if (ok) toast({ title: "¡Bien hecho!" }); else toast({variant: 'destructive', title: 'Inténtalo de nuevo'}); }} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulario')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'comparativos': 
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">COMPARATIVOS (+ER)</CardTitle></CardHeader>
                        <CardContent className="space-y-4 text-black font-bold">
                            <p className='text-lg'>Se usan para comparar dos cosas o personas.</p>
                            <div className="p-4 bg-white/20 rounded-xl border border-black/10 font-mono">
                                <p>ADJETIVO CORTO + ER + THAN</p>
                                <p className="text-sm italic mt-2 text-slate-700 dark:text-slate-300">Ej: Big &rarr; Bigger than / Fast &rarr; Faster than</p>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('comparativos')} size="lg" className="px-12 font-bold">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'ejercicio-comparativo': return <ComparativeExercise onComplete={() => handleTopicComplete('ejercicio-comparativo')} />;
            case 'superlativos': 
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">SUPERLATIVOS (+EST)</CardTitle></CardHeader>
                        <CardContent className="space-y-4 text-black font-bold">
                            <p className='text-lg'>Se usan para decir que algo es lo máximo en un grupo.</p>
                            <div className="p-4 bg-white/20 rounded-xl border border-black/10 font-mono">
                                <p>THE + ADJETIVO CORTO + EST</p>
                                <p className="text-sm italic mt-2 text-slate-700 dark:text-slate-300">Ej: Big &rarr; The biggest / Fast &rarr; The fastest</p>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('superlativos')} size="lg" className="px-12 font-bold">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'ejercicio-superlativo': return <SuperlativeExercise onComplete={() => handleTopicComplete('ejercicio-superlativo')} />;
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
                        <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2"><span>Progreso</span><span className="font-bold">{progressValue}%</span></div><Progress value={progressValue} className="h-2" /></div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}