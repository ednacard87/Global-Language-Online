'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { BookOpen, GraduationCap, CheckCircle, PenSquare, Lock, Loader2, ArrowRight, Check, X } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { PresentSimpleExercise } from '@/components/kids/exercises/present-simple';
import { QAShortAnswerExercise } from '@/components/kids/exercises/q-a-short-answer-exercise';
import { ShortAnswerPresentSimpleExercise } from '@/components/kids/exercises/short-answer-present-simple';
import { LargeTextTranslationExercise } from '@/components/kids/exercises/large-text-translation-exercise';

const vocab2Data = [
    { es: "AYER", en: "yesterday" }, { es: "HOY", en: "today" }, { es: "MAÑANA", en: "tomorrow" },
    { es: "DESAYUNO", en: "breakfast" }, { es: "ALMUERZO", en: "lunch" }, { es: "CENA", en: "dinner" },
    { es: "DÍA", en: "day" }, { es: "SEMANA", en: "week" }, { es: "MES", en: "month" },
    { es: "AÑO", en: "year" }, { es: "CON", en: "with" }, { es: "SIN", en: "without" },
];

const can1Prompts = [
    "ELLA PUEDE CERRAR LAS VENTANAS EN LA NOCHE", "YO NO PUEDO COMER AZÚCAR",
    "ÉL NO PUEDE TOMAR LICOR PORQUE ÉL ESTÁ ENFERMO", "NOSOTRAS PODEMOS TRABAJAR LOS SABADOS EN LA MAÑANA",
    "ELLOS PUEDEN HACER EJERCICIO EN LA TARDE", "TU PUEDES VIAJAR EL JUEVES EN LA NOCHE",
    "ÉL PUEDE LAVAR LOS PLATOS", "ELLA PUEDE ESTAR EN CASA LOS FINES DE SEMANA",
    "ÉL PUEDE ESTUDIAR TODOS LOS DIAS PORQUE EL NO TRABAJA", "NOSOTROS NO PODEMOS IR A LA FINCA LA PROXIMA SEMANA"
];

interface Topic {
    key: string;
    name: string;
    icon: React.ElementType;
    status: 'locked' | 'active' | 'completed';
    subItems?: { key: string; name: string; status: 'locked' | 'active' | 'completed' }[];
}

const ICONS = { locked: Lock, active: BookOpen, completed: CheckCircle };

export default function Class3Content() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const progressStorageKey = 'progress_a1_eng_u1_c3_v100_blindado';
    const mainProgressKey = 'progress_a1_eng_unit_1_class_3';

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('grammar2');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const [vocab2Answers, setVocab2Answers] = useState<string[]>(Array(vocab2Data.length).fill(''));
    const [vocab2Validation, setVocab2Validation] = useState<any[]>(Array(vocab2Data.length).fill('unchecked'));

    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);

    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'grammar2', name: 'Gramática 2', icon: GraduationCap, status: 'active' },
        { key: 'mixed1', name: 'Ejercicios Mixtos 1', icon: PenSquare, status: 'locked' },
        { key: 'vocabulary2', name: 'Vocabulario 2', icon: BookOpen, status: 'locked' },
        { key: 'can', name: 'CAN modal verb', icon: GraduationCap, status: 'locked' },
        { key: 'can1', name: 'Ejercicio CAN 1', icon: PenSquare, status: 'locked' },
    ], []);

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
        setSelectedTopic(savedST || path.find(p => p.status === 'active')?.key || 'grammar2');
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
                    toast({ title: "¡Desbloqueado!" });
                }
            }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin" /></div>;
        switch (selectedTopic) {
            case 'grammar2':
                return (
                    <Card className="p-6 text-left space-y-6">
                        <CardTitle className="text-2xl font-black text-primary">3rd Person Singular (+s/es/ies)</CardTitle>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-muted rounded-xl"><p>He, She, It agregan "S" en oraciones afirmativas (+).</p></div>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Regla general: work -> works</li>
                                <li>Terminados en o, sh, ch, x, z: go -> goes</li>
                                <li>Consonante + y: study -> studies</li>
                            </ul>
                        </CardContent>
                        <CardFooter><Button onClick={() => handleTopicComplete('grammar2')} size="lg">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'vocabulary2':
                return (
                    <Card className="p-6 text-left">
                        <CardHeader><CardTitle>Vocabulario 2</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-2">
                            {vocab2Data.map((v, i) => (<React.Fragment key={i}><div className="p-2 border rounded">{v.es}</div><Input value={vocab2Answers[i]} onChange={e => { const n = [...vocab2Answers]; n[i] = e.target.value; setVocab2Answers(n); }} /></React.Fragment>))}
                        </CardContent>
                        <CardFooter><Button onClick={() => handleTopicComplete('vocabulary2')}>Verificar y Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'can':
                return (
                    <Card className="p-6 text-left">
                        <CardHeader><CardTitle>Modal Verb: CAN (Poder)</CardTitle></CardHeader>
                        <CardContent className="space-y-4"><p>CAN no cambia en 3ra persona y no usa "TO" antes del siguiente verbo.</p><div className="p-4 bg-muted font-mono"><p>(+) I can speak</p><p>(-) I can't speak</p><p>(?) Can I speak?</p></div></CardContent>
                        <CardFooter><Button onClick={() => handleTopicComplete('can')}>Continuar</Button></CardFooter>
                    </Card>
                );
            default: return <div className="p-6">Contenido interactivo cargando... <Button onClick={() => handleTopicComplete(selectedTopic)} className="mt-4">Completar</Button></div>;
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
