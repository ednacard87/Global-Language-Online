'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle, Gamepad2, Feather, Bot, Trophy, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { DashboardHeader } from "@/components/dashboard/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

// Ejercicios
import { ComparativeExercise } from '@/components/kids/exercises/comparative-exercise';
import { SuperlativeExercise } from '@/components/kids/exercises/superlative-exercise';
import { SyllableExercise, type SyllableExerciseData } from '@/components/kids/exercises/syllable-exercise';
import { MonosyllabicExercise } from '@/components/kids/exercises/monosyllabic-exercise';
import { BisyllabicExercise } from '@/components/kids/exercises/bisyllabic-exercise';
import { LongAdjectivesExercise } from '@/components/kids/exercises/long-adjectives-exercise';
import { IrregularAdjectivesExercise } from '@/components/kids/exercises/irregular-adjectives-exercise';
import { MixedComparativeSuperlativeExercise } from '@/components/kids/exercises/mixed-comparative-superlative-exercise';
import { MixedExercise3 } from '@/components/kids/exercises/mixed-exercise-3';
import { useTranslation } from '@/context/language-context';

const progressStorageKey = 'progress_kids_a1_comparatives_v7_restored';
const mainProgressKey = 'progress_kids_a1_comparatives';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
};

const vocabularyData = [
    { spanish: 'BONITO/A', english: ['pretty', 'beautiful'] },
    { spanish: 'ANCHO', english: ['wide'] },
    { spanish: 'DESPIERTO', english: ['awake'] },
    { spanish: 'DIFERENTE', english: ['different'] },
    { spanish: 'LARGO', english: ['long'] },
    { spanish: 'SECO', english: ['dry'] },
    { spanish: 'ENOJADO', english: ['angry'] },
    { spanish: 'CANSADO', english: ['tired'] },
    { spanish: 'BRILLANTE', english: ['bright'] },
    { spanish: 'SUCIO', english: ['dirty'] },
    { spanish: 'LIMPIO', english: ['clean'] },
    { spanish: 'MOJADO', english: ['wet'] },
];

const monosyllabicData: SyllableExerciseData = [
    { spanish: 'PEQUEÑO', answers: { adjective: 'small', comparative: 'smaller', superlative: 'the smallest' } },
    { spanish: 'ALTO', answers: { adjective: 'tall', comparative: 'taller', superlative: 'the tallest' } },
    { spanish: 'GORDO', answers: { adjective: 'fat', comparative: 'fatter', superlative: 'the fattest' } },
    { spanish: 'GRANDE', answers: { adjective: 'big', comparative: 'bigger', superlative: 'the biggest' } },
];

const bisyllabicData: SyllableExerciseData = [
    { spanish: 'FÁCIL', answers: { adjective: 'easy', comparative: 'easier', superlative: 'the easiest' } },
    { spanish: 'FELIZ', answers: { adjective: 'happy', comparative: 'happier', superlative: 'the happiest' } },
];

const longAdjectivesData: SyllableExerciseData = [
    { spanish: 'CARO', answers: { adjective: 'expensive', comparative: 'more expensive', superlative: 'the most expensive' } },
    { spanish: 'HERMOSO', answers: { adjective: 'beautiful', comparative: 'more beautiful', superlative: 'the most beautiful' } },
];

const irregularAdjectivesData: SyllableExerciseData = [
    { spanish: 'BUENO', answers: { adjective: 'good', comparative: 'better', superlative: 'the best' } },
    { spanish: 'MALO', answers: { adjective: 'bad', comparative: 'worse', superlative: 'the worst' } },
];

export default function KidsComparativosSuperlativosPage() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);

    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(vocabularyData.length).fill(''));
    const [validation, setValidation] = useState<any[]>(Array(vocabularyData.length).fill('unchecked'));

    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string; lessonProgress?: any; progress?: any }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);
    
    const initialPath = useMemo((): Topic[] => [
        { key: 'vocabulario', name: 'Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'comparativos', name: 'Gramática: Comparativos', icon: GraduationCap, status: 'locked' },
        { key: 'ex-comp', name: 'Ejercicio Comparativo', icon: PenSquare, status: 'locked' },
        { key: 'superlativos', name: 'Gramática: Superlativos', icon: GraduationCap, status: 'locked' },
        { key: 'ex-super', name: 'Ejercicio Superlativo', icon: PenSquare, status: 'locked' },
        { key: 'monosilabos', name: 'Misión: Monosílabos', icon: Feather, status: 'locked' },
        { key: 'bisilabos', name: 'Misión: Bisílabos', icon: Feather, status: 'locked' },
        { key: 'largos', name: 'Misión: Adjetivos Largos', icon: Feather, status: 'locked' },
        { key: 'irregulares', name: 'Misión: Irregulares', icon: Bot, status: 'locked' },
        { key: 'mixtos', name: 'Reto Final Mixto', icon: Trophy, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isUserLoading || isProfileLoading || !studentProfile) return;
        const newPath = initialPath.map(item => ({...item}));
        const saved = studentProfile?.lessonProgress?.[progressStorageKey] || {};
        
        if (isAdmin) {
            newPath.forEach(item => item.status = 'completed');
        } else {
            newPath.forEach(item => { if (saved[item.key]) item.status = saved[item.key]; });
            let lastDone = true;
            for(let i=0; i < newPath.length; i++) {
                if (lastDone && newPath[i].status === 'locked') newPath[i].status = 'active';
                lastDone = newPath[i].status === 'completed';
            }
        }
        setLearningPath(newPath);
        setSelectedTopic(saved.lastSelected || newPath.find(p => p.status === 'active')?.key || 'vocabulario');
        setIsInitialLoading(false);
    }, [isAdmin, initialPath, studentProfile, isUserLoading, isProfileLoading]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;
        const data: any = { lastSelected: selectedTopic };
        learningPath.forEach(t => data[t.key] = t.status);
        updateDocumentNonBlocking(studentDocRef, { 
            [`lessonProgress.${progressStorageKey}`]: data,
            [`progress.${mainProgressKey}`]: progressValue
        });
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, progressValue, isAdmin, studentDocRef, isInitialLoading, selectedTopic]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(prev => {
            const np = [...prev];
            const i = np.findIndex(t => t.key === topicToComplete);
            if (i !== -1 && np[i].status !== 'completed') {
                np[i].status = 'completed';
                if (i + 1 < np.length && np[i + 1].status === 'locked') {
                    np[i + 1].status = 'active';
                    setSelectedTopic(np[i + 1].key);
                }
            }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete]);

    const handleTopicSelect = (key: string) => {
        const topic = learningPath.find(t => t.key === key);
        if (topic?.status === 'locked' && !isAdmin) {
            toast({ variant: 'destructive', title: '¡Bloqueado!', description: 'Supera el reto anterior primero.' });
            return;
        }
        setSelectedTopic(key);
        if (['comparativos', 'superlativos', 'monosilabos', 'bisilabos', 'largos', 'irregulares'].includes(key)) {
          handleTopicComplete(key);
        }
    };

    const handleTopicComplete = (key: string) => {
        setTopicToComplete(key);
    };

    const handleCheckVocab = () => {
        let count = 0;
        const nv = vocabularyData.map((item, i) => {
            const res = item.english.some(e => e.toLowerCase() === vocabAnswers[i]?.trim().toLowerCase());
            if (res) count++;
            return res ? 'correct' : 'incorrect';
        });
        setValidation(nv as any);
        if (count >= 1) { toast({ title: "¡Bien hecho!" }); handleTopicComplete('vocabulario'); }
        else toast({ variant: "destructive", title: "Sigue intentando" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulario':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95">
                        <CardHeader><CardTitle>Vocabulario (Adjetivos)</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-2">
                            {vocabularyData.map((item, i) => (
                                <React.Fragment key={i}>
                                    <div className="p-3 bg-muted/30 border rounded-lg font-medium">{item.spanish}</div>
                                    <Input value={vocabAnswers[i] || ''} onChange={e => { const n = [...vocabAnswers]; n[i] = e.target.value; setVocabAnswers(n); setValidation(vv => { const nvv = [...vv]; nvv[i] = 'unchecked'; return nvv; }); }} className={cn(validation[i] === 'correct' ? 'border-green-500' : validation[i] === 'incorrect' ? 'border-red-500' : '')} />
                                </React.Fragment>
                            ))}
                        </CardContent>
                        <CardFooter className="justify-between"><Button onClick={handleCheckVocab} variant="secondary">Verificar</Button></CardFooter>
                    </Card>
                );
            case 'comparativos':
                return (
                    <Card className="p-6 border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">COMPARATIVOS (+ER)</CardTitle></CardHeader>
                        <CardContent className="pt-4 space-y-4 text-black dark:text-white font-bold">
                            <p className='text-lg'>Usamos <strong>-ER</strong> para comparar dos cosas.</p>
                            <div className="p-4 bg-white/20 rounded-lg border border-black/10 font-mono text-xl">ADJ + ER + THAN</div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6"><Button onClick={() => handleTopicComplete('comparativos')} size="lg" className="px-12 font-bold">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'ex-comp': return <ComparativeExercise onComplete={() => handleTopicComplete('ex-comp')} />;
            case 'superlativos':
                return (
                    <Card className="p-6 border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">SUPERLATIVOS (+EST)</CardTitle></CardHeader>
                        <CardContent className="pt-4 space-y-4 text-black dark:text-white font-bold">
                            <p className='text-lg'>Usamos <strong>-EST</strong> para decir que algo es "el más" de un grupo.</p>
                            <div className="p-4 bg-white/20 rounded-lg border border-black/10 font-mono text-xl">THE + ADJ + EST</div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6"><Button onClick={() => handleTopicComplete('superlativos')} size="lg" className="px-12 font-bold">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'ex-super': return <SuperlativeExercise onComplete={() => handleTopicComplete('ex-super')} />;
            case 'monosilabos': return <SyllableExercise data={monosyllabicData} title="Monosílabos" description="Añade ER o EST." onComplete={() => handleTopicComplete('monosilabos')} columnHeaders={{adjective: 'ADJ', comparative: 'ER', superlative: 'EST'}} />;
            case 'bisilabos': return <SyllableExercise data={bisyllabicData} title="Bisílabos" description="Terminados en Y (cambia a IER / IEST)." onComplete={() => handleTopicComplete('bisilabos')} columnHeaders={{adjective: 'ADJ', comparative: 'IER', superlative: 'IEST'}} />;
            case 'largos': return <SyllableExercise data={longAdjectivesData} title="Adjetivos Largos" description="Usa MORE y THE MOST." onComplete={() => handleTopicComplete('largos')} columnHeaders={{adjective: 'ADJ', comparative: 'MORE', superlative: 'THE MOST'}} />;
            case 'irregulares': return <SyllableExercise data={irregularAdjectivesData} title="Irregulares" description="¡Atención! Estos cambian completamente." onComplete={() => handleTopicComplete('irregulares')} columnHeaders={{adjective: 'ADJ', comparative: 'CMP', superlative: 'SUP'}} />;
            case 'mixtos': return <MixedExercise3 onComplete={() => handleTopicComplete('mixtos')} />;
            default: return null;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen a1-kids-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto grid gap-8 md:grid-cols-12">
                    <div className="md:col-span-8">
                        <Link href="/kids/a1" className="hover:underline text-sm text-white/80 flex items-center gap-2 mb-4">
                            <ArrowLeft className="h-4 w-4" /> Volver al curso A1
                        </Link>
                        <h1 className="text-4xl font-black text-white mb-8 [text-shadow:1px_1px_2px_black] uppercase tracking-tighter">Comparativos y Superlativos 🚀</h1>
                        {renderContent()}
                    </div>
                    <div className="md:col-span-4">
                        <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95">
                            <CardHeader><CardTitle className="text-lg uppercase font-black text-primary">Misiones</CardTitle></CardHeader>
                            <CardContent>
                                <nav><ul className="space-y-1">
                                    {learningPath.map(item => (
                                        <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', item.status === 'locked' && !isAdmin ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-bold')}>
                                            <div className="flex items-center gap-3">
                                                {item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500"/> : <item.icon className={cn("h-5 w-5", item.status === 'locked' ? 'text-yellow-500' : 'text-primary')} />}
                                                <span className="truncate">{item.name}</span>
                                            </div>
                                            {item.status === 'locked' && !isAdmin && <Lock className="h-4 w-4 text-yellow-500/50" />}
                                        </li>
                                    ))}
                                </ul></nav>
                                <div className="mt-6 pt-6 border-t">
                                    <div className="flex justify-between text-xs mb-2 text-muted-foreground uppercase font-bold"><span>Progreso Misión</span><span className="text-primary">{progressValue}%</span></div>
                                    <Progress value={progressValue} className="h-2" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}