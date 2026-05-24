'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from '@/lib/utils';
import { BookOpen, GraduationCap, CheckCircle, BrainCircuit, PenSquare, Lock, Loader2, ArrowRight, BookText } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ToBeMemoryGame } from '@/components/kids/exercises/tobe-memory-game';
import { PossessivesMemoryGame } from '@/components/kids/exercises/possessives-memory-game';
import { TranslationExercise } from '@/components/dashboard/translation-exercise';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { ShortAnswerExercise } from '@/components/dashboard/short-answer-exercise';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const vocabularyData = {
    weekdays: [
        { spanish: 'Lunes', english: 'Monday' },
        { spanish: 'Martes', english: 'Tuesday' },
        { spanish: 'Miércoles', english: 'Wednesday' },
        { spanish: 'Jueves', english: 'Thursday' },
        { spanish: 'Viernes', english: 'Friday' },
        { spanish: 'Sábado', english: 'Saturday' },
        { spanish: 'Domingo', english: 'Sunday' },
    ],
    months: [
        { spanish: 'Enero', english: 'January' },
        { spanish: 'Febrero', english: 'February' },
        { spanish: 'Marzo', english: 'March' },
        { spanish: 'Abril', english: 'April' },
        { spanish: 'Mayo', english: 'May' },
        { spanish: 'Junio', english: 'June' },
        { spanish: 'Julio', english: 'July' },
        { spanish: 'Agosto', english: 'August' },
        { spanish: 'Septiembre', english: 'September' },
        { spanish: 'Octubre', english: 'October' },
        { spanish: 'Noviembre', english: 'November' },
        { spanish: 'Diciembre', english: 'December' },
    ],
    seasons: [
        { spanish: 'Verano', english: 'Summer' },
        { spanish: 'Otoño', english: 'Autumn' },
        { spanish: 'Invierno', english: 'Winter' },
        { spanish: 'Primavera', english: 'Spring' },
    ],
    colors: [
        { spanish: 'Rojo', english: 'Red' },
        { spanish: 'Azul', english: 'Blue' },
        { spanish: 'Verde', english: 'Green' },
        { spanish: 'Amarillo', english: 'Yellow' },
        { spanish: 'Naranja', english: 'Orange' },
        { spanish: 'Morado', english: 'Purple' },
        { spanish: 'Negro', english: 'Black' },
        { spanish: 'Blanco', english: 'White' },
        { spanish: 'Gris', english: 'Gray' },
        { spanish: 'Marrón', english: 'Brown' },
    ]
};

const verbToBeData = [
    { ser: 'Yo soy', tobe: 'I am', estar: 'Yo estoy' },
    { ser: 'Tú eres / usted es', tobe: 'You are', estar: 'Tú estás / usted está' },
    { ser: 'Él es', tobe: 'He is', estar: 'Él está' },
    { ser: 'Ella es', tobe: 'She is', estar: 'Ella está' },
    { ser: 'Esto es', tobe: 'It is', estar: 'Esto está' },
    { ser: 'Nosotros somos', tobe: 'We are', estar: 'Nosotros estamos' },
    { ser: 'Ustedes son', tobe: 'You are', estar: 'Ustedes están' },
    { ser: 'Ellos son', tobe: 'They are', estar: 'Ellos están' },
];

const possessivesData = [
    { english: 'My', spanish: 'Mi / Mis' },
    { english: 'Your', spanish: 'Tu / Tus (de ti)' },
    { english: 'His', spanish: 'Su / Sus (de él)' },
    { english: 'Her', spanish: 'Su / Sus (de ella)' },
    { english: 'Its', spanish: 'Su / Sus (de eso)' },
    { english: 'Our', spanish: 'Nuestro / Nuestra / Nuestros / Nuestras' },
    { english: 'Your', spanish: 'Su / Sus (de ustedes)' },
    { english: 'Their', spanish: 'Su / Sus (de ellos/as)' },
];

interface Topic {
    key: string;
    name: string;
    icon: React.ElementType;
    status: 'locked' | 'active' | 'completed';
    subItems?: { key: string; name: string; status: 'locked' | 'active' | 'completed' }[];
}

const ICONS = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

export default function Class1Content() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const progressStorageKey = 'progress_a1_eng_u1_c1_v105_blindado';
    const mainProgressKey = 'progress_a1_eng_unit_1_class_1';

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('vocabulary');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [userAnswers, setUserAnswers] = useState<{[key: string]: string[]}>({});
    const [validationStatus, setValidationStatus] = useState<{[key: string]: ('correct' | 'incorrect' | 'unchecked')[]}>({});
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const studentDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'students', user.uid) : null),
        [firestore, user]
    );
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);

    const isAdmin = useMemo(() => {
        if (!user) return false;
        return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
    }, [user, studentProfile]);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: t('a1class1.vocabulary'), icon: BookOpen, status: 'active' },
        { key: 'tobe', name: 'Grammar: To Be', icon: GraduationCap, status: 'locked' },
        { key: 'memory-tobe', name: 'Memory: To Be', icon: BrainCircuit, status: 'locked' },
        { key: 'tobe-1', name: 'To be 1', icon: GraduationCap, status: 'locked' },
        { key: 'exercises1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'possessives', name: 'Grammar: Possessives', icon: GraduationCap, status: 'locked' },
        { key: 'memory-possessives', name: 'Memory: Possessives', icon: BrainCircuit, status: 'locked' },
        { key: 'tobe-2', name: 'To be 2', icon: GraduationCap, status: 'locked' },
        { key: 'exercises2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'tobe-3', name: 'To be 3', icon: GraduationCap, status: 'locked' },
        { key: 'exercises3', name: 'Exercise 3', icon: PenSquare, status: 'locked' },
        {
            key: 'mixed',
            name: 'Mixed Challenges',
            icon: PenSquare,
            status: 'locked',
            subItems: [
                { key: 'ex-mixto-1', name: 'Exercise 1', status: 'locked' },
                { key: 'ex-mixto-2', name: 'Exercise 2', status: 'locked' },
                { key: 'ex-mixto-3', name: 'Exercise 3', status: 'locked' },
                { key: 'ex-mixto-4', name: 'Exercise 4', status: 'locked' },
                { key: 'ex-mixto-5', name: 'Exercise 5', status: 'locked' },
                { key: 'ex-mixto-6', name: 'Exercise 6', status: 'locked' },
            ]
        }
    ], [t]);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile) return;

        let path = initialLearningPath.map(topic => ({
            ...topic,
            subItems: topic.subItems ? topic.subItems.map(sub => ({...sub})) : undefined,
        }));

        let savedSelectedTopic = '';

        if (isAdmin) {
          path.forEach(item => { 
            item.status = 'completed';
            if (item.subItems) item.subItems.forEach(sub => sub.status = 'completed');
           });
        } else if(studentProfile?.lessonProgress?.[progressStorageKey]) {
            const savedData = studentProfile.lessonProgress[progressStorageKey];
            path.forEach(item => {
                if (savedData[item.key]) item.status = savedData[item.key];
                if (item.subItems && savedData.subItems?.[item.key]) {
                    item.subItems.forEach(subItem => {
                        if (savedData.subItems[item.key][subItem.key]) {
                            subItem.status = savedData.subItems[item.key][subItem.key];
                        }
                    });
                }
            });
            savedSelectedTopic = savedData.lastSelectedTopic || '';
        }

        let lastDone = true;
        for(let i=0; i < path.length; i++) {
            if (lastDone && path[i].status === 'locked') {
                path[i].status = 'active';
                if (path[i].subItems) path[i].subItems[0].status = 'active';
            }
            lastDone = path[i].status === 'completed';
            if (path[i].subItems) {
                let allDone = true; let lastSubDone = true;
                for(let j=0; j < path[i].subItems.length; j++) {
                    if (lastSubDone && path[i].subItems[j].status === 'locked') path[i].subItems[j].status = 'active';
                    lastSubDone = path[i].subItems[j].status === 'completed';
                    if (!lastSubDone) allDone = false;
                }
                lastDone = allDone;
            }
        }

        setLearningPath(path);
        const firstA = path.find(p => p.status === 'active') || path.flatMap(p => p.subItems || []).find(sp => sp?.status === 'active');
        setSelectedTopic(savedSelectedTopic || firstA?.key || 'vocabulary');

        const newAnswers: {[key: string]: string[]} = {};
        const newValidation: {[key: string]: ('correct' | 'incorrect' | 'unchecked')[]} = {};
        for (const category in vocabularyData) {
            newAnswers[category] = Array((vocabularyData as any)[category].length).fill('');
            newValidation[category] = Array((vocabularyData as any)[category].length).fill('unchecked');
        }
        setUserAnswers(newAnswers);
        setValidationStatus(newValidation);
        setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        let total = 0; let done = 0;
        learningPath.forEach(t => {
            if(t.subItems) { total += t.subItems.length; done += t.subItems.filter(st => st.status === 'completed').length; }
            else { total++; if (t.status === 'completed') done++; }
        });
        return total > 0 ? Math.round((done / total) * 100) : 0;
    }, [learningPath]);

    useEffect(() => {
        if (isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;
        const data: Record<string, any> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => {
            data[item.key] = item.status;
            if (item.subItems) {
                if (!data.subItems) data.subItems = {};
                data.subItems[item.key] = {};
                item.subItems.forEach(sub => { data.subItems[item.key][sub.key] = sub.status; });
            }
        });
        updateDocumentNonBlocking(studentDocRef, {
            [`lessonProgress.${progressStorageKey}`]: data,
            [`progress.${mainProgressKey}`]: progressValue
        });
    }, [learningPath, isAdmin, progressValue, studentDocRef, selectedTopic, isInitialLoading]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(currentPath => {
            let wasUnlocked = false; let nextToSel: string | null = null;
            const newP = currentPath.map(t => ({ ...t, subItems: t.subItems ? t.subItems.map(s => ({ ...s })) : undefined }));
            let found = false;
            for (let i = 0; i < newP.length && !found; i++) {
                const curT = newP[i];
                if (curT.key === topicToComplete) {
                    if (curT.status !== 'completed') curT.status = 'completed';
                    if (i + 1 < newP.length && newP[i + 1].status === 'locked') {
                        const nextM = newP[i + 1]; nextM.status = 'active'; wasUnlocked = true;
                        nextToSel = nextM.subItems?.[0]?.key || nextM.key;
                        if (nextM.subItems?.[0]) nextM.subItems[0].status = 'active';
                    }
                    found = true;
                } else if (curT.subItems) {
                    const subIdx = curT.subItems.findIndex((sub: any) => sub.key === topicToComplete);
                    if (subIdx !== -1) {
                        if (curT.subItems[subIdx].status !== 'completed') curT.subItems[subIdx].status = 'completed';
                        const nextSubIdx = subIdx + 1;
                        if (nextSubIdx < curT.subItems.length && curT.subItems[nextSubIdx].status === 'locked') {
                            curT.subItems[nextSubIdx].status = 'active'; nextToSel = curT.subItems[nextSubIdx].key; wasUnlocked = true;
                        } else if (curT.subItems.every(sub => sub.status === 'completed')) {
                            if (curT.status !== 'completed') curT.status = 'completed';
                            if (i + 1 < newP.length && newP[i + 1].status === 'locked') {
                                const nextM = newP[i + 1]; nextM.status = 'active'; wasUnlocked = true;
                                nextToSel = nextM.subItems?.[0]?.key || nextM.key;
                                if (nextM.subItems?.[0]) nextM.subItems[0].status = 'active';
                            }
                        }
                        found = true;
                    }
                }
            }
            if (wasUnlocked) setTimeout(() => toast({ title: "¡Siguiente tema desbloqueado!" }), 0);
            if (nextToSel) { const n = nextToSel; setTimeout(() => setSelectedTopic(n), 0); }
            return newP;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const mainT = learningPath.find(t => t.key === topicKey || t.subItems?.some(st => st.key === topicKey));
        const subT = mainT?.subItems?.find(st => st.key === topicKey);
        if (!isAdmin && ((subT && subT.status === 'locked') || (!subT && mainT?.status === 'locked'))) { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        const autoView = ['tobe', 'possessives', 'tobe-1', 'tobe-2', 'tobe-3', 'demonstratives'];
        if (autoView.includes(topicKey)) setTopicToComplete(topicKey);
    };

    const handleVocabInputChange = (category: string, index: number, value: string) => {
        setUserAnswers(prev => ({ ...prev, [category]: prev[category].map((v, i) => i === index ? value : v) }));
        setValidationStatus(prev => ({ ...prev, [category]: prev[category].map((v, i) => i === index ? 'unchecked' : v) }));
        setCanAdvanceVocab(false);
    };

    const handleVocabCheck = () => {
        let atLeastOneCorrect = false;
        const nv: any = {};
        for (const cat in vocabularyData) {
            nv[cat] = (vocabularyData as any)[cat].map((item: any, idx: number) => {
                const ok = (userAnswers[cat][idx] || '').trim().toLowerCase() === item.english.toLowerCase();
                if (ok) atLeastOneCorrect = true;
                return ok ? 'correct' : 'incorrect';
            });
        }
        setValidationStatus(nv);
        if (atLeastOneCorrect) { toast({ title: '¡Bien hecho!' }); setCanAdvanceVocab(true); }
        else toast({ variant: 'destructive', title: 'Sigue intentando' });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center min-h-[400px]"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left">
                        <CardHeader><CardTitle>{t('a1class1.vocabulary')}</CardTitle></CardHeader>
                        <CardContent>
                            <Accordion type="multiple" defaultValue={['weekdays', 'months']} className="w-full">
                                {Object.entries(vocabularyData).map(([category, items]) => (
                                    <AccordionItem key={category} value={category}>
                                        <AccordionTrigger className="text-lg font-semibold">{t(`a1class1.${category}`)}</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                                <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.spanish')}</div>
                                                <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.english')}</div>
                                                {items.map((item, index) => (
                                                    <React.Fragment key={index}>
                                                        <div className="p-3 bg-card border rounded-lg flex items-center justify-center font-medium">{item.spanish}</div>
                                                        <Input value={userAnswers[category][index]} onChange={(e) => handleVocabInputChange(category, index, e.target.value)} className={cn(validationStatus[category][index] === 'correct' ? 'border-green-500' : validationStatus[category][index] === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" />
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                        <CardFooter className="flex justify-between"><Button onClick={handleVocabCheck}>{t('vocabulary.check')}</Button><Button onClick={() => setTopicToComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'tobe':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left">
                        <CardHeader><CardTitle>Grammar: To Be</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-lg text-black">
                                <div className="font-bold p-3 bg-muted rounded-lg text-center">SER</div><div className="font-bold p-3 bg-muted rounded-lg text-center">TO BE</div><div className="font-bold p-3 bg-muted rounded-lg text-center">ESTAR</div>
                                {verbToBeData.map((item, index) => (
                                    <React.Fragment key={index}><div className="p-3 bg-white border rounded-lg text-center">{item.ser}</div><div className="p-3 bg-white border rounded-lg font-medium text-center">{item.tobe}</div><div className="p-3 bg-white border rounded-lg text-center">{item.estar}</div></React.Fragment>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'memory-tobe': return <ToBeMemoryGame onGameComplete={() => setTopicToComplete('memory-tobe')} />;
            case 'tobe-1':
                return (
                    <div className="space-y-6">
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase tracking-tight">1. –VERBO TO BE</CardTitle></CardHeader>
                            <CardContent className="space-y-3 font-mono text-lg font-bold text-black dark:text-white">
                                <p><span className="text-green-600">(+)</span> = PRONOUN + TO BE + COMPLEMENT.</p>
                                <p><span className="text-red-600">(-)</span> = PRONOUN + TO BE + NOT+ COMPLEMENT.</p>
                                <p><span className="text-blue-600">(?)</span> = TO BE + PRONOUN + COMPLEMENT?</p>
                                <Separator className="my-4" />
                                <p className="font-sans uppercase text-sm text-muted-foreground">SHORT ANSWER:</p>
                                <p><span className="text-green-600">(+A)</span> = YES, + PRONOUN+ TO BE</p>
                                <p><span className="text-red-600">(-A)</span> = NO, PRONOUN + TO BE + NOT</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">Ejemplo = "Ellos son estudiantes"</CardTitle></CardHeader>
                            <CardContent className="space-y-3 font-mono text-lg font-bold text-black dark:text-white">
                                <p><span className="text-green-600">(+)</span> = they are students</p>
                                <p><span className="text-red-600">(-)</span> = they are not students</p>
                                <p><span className="text-blue-600">(?)</span> = are they students?</p>
                            </CardContent>
                            <CardFooter className="justify-center border-t pt-4">
                                <Button onClick={() => setTopicToComplete('tobe-1')}>Siguiente Paso</Button>
                            </CardFooter>
                        </div>
                    </div>
                );
            case 'exercises1': return <TranslationExercise exerciseKey="exercises1" onComplete={() => setTopicToComplete('exercises1')} vocabulary={{'un- una': 'a / an', 'abogado': 'lawyer', 'enfermo': 'sick', 'enfermero': 'nurse'}} highlightVocabulary={true} title="Exercise 1" />;
            case 'possessives':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left">
                        <CardHeader><CardTitle>Grammar: Possessives</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg text-black">
                                <div className="font-bold p-3 bg-muted rounded-lg text-center">Inglés</div><div className="font-bold p-3 bg-muted rounded-lg text-center">Español</div>
                                {possessivesData.map((item, index) => (<React.Fragment key={index}><div className="p-3 bg-white border rounded-lg font-medium text-center">{item.english}</div><div className="p-3 bg-white border rounded-lg text-center">{item.spanish}</div></React.Fragment>))}
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'memory-possessives': return <PossessivesMemoryGame onGameComplete={() => setTopicToComplete('memory-possessives')} />;
            case 'tobe-2':
                return (
                    <div className="space-y-6">
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase tracking-tight">2. –VERBO TO BE + POSSESSIVES</CardTitle></CardHeader>
                            <CardContent className="space-y-3 font-mono text-lg font-bold text-black dark:text-white">
                                <p><span className="text-green-600">(+)</span> = PRONOUN + TO BE + POSSESSIVE + NOUN + COMPLEMENT.</p>
                                <p><span className="text-red-600">(-)</span> = PRONOUN + TO BE + NOT+ POSSESSIVE + NOUN + COMPLEMENT.</p>
                                <p><span className="text-blue-600">(?)</span> = TO BE + PRONOUN + POSSESSIVE + NOUN + COMPLEMENT?</p>
                                <Separator className="my-4" />
                                <p className="font-sans uppercase text-sm text-muted-foreground">SHORT ANSWER:</p>
                                <p><span className="text-green-600">(+A)</span> = YES, + PRONOUN+ TO BE</p>
                                <p><span className="text-red-600">(-A)</span> = NO, PRONOUN + TO BE + NOT</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">Ejemplo = "Ellos son mis amigos"</CardTitle></CardHeader>
                            <CardContent className="space-y-3 font-mono text-lg font-bold text-black dark:text-white">
                                <p><span className="text-green-600">(+)</span> = they are my friends</p>
                                <p><span className="text-red-600">(-)</span> = they are not my friends</p>
                                <p><span className="text-blue-600">(?)</span> = are they my friends?</p>
                            </CardContent>
                            <CardFooter className="justify-center border-t pt-4">
                                <Button onClick={() => setTopicToComplete('tobe-2')}>Siguiente Paso</Button>
                            </CardFooter>
                        </div>
                    </div>
                );
            case 'exercises2': return <TranslationExercise exerciseKey="exercises2" onComplete={() => setTopicToComplete('exercises2')} vocabulary={{'amigo': 'friend', 'hijo': 'son', 'perro': 'dog'}} highlightVocabulary={true} title="Exercise 2" />;
            case 'tobe-3':
                return (
                    <div className="space-y-6">
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase tracking-tight">3. – POSSESSIVES + TO BE</CardTitle></CardHeader>
                            <CardContent className="space-y-3 font-mono text-lg font-bold text-black dark:text-white">
                                <p><span className="text-green-600">(+)</span> = POSSESSIVE + NOUN + TO BE +COMPLEMENT.</p>
                                <p><span className="text-red-600">(-)</span> = POSSESSIVE + NOUN + TO BE + NOT + COMPLEMENT.</p>
                                <p><span className="text-blue-600">(?)</span> = TO BE + POSSESSIVE + NOUN + COMPLEMENT?</p>
                                <Separator className="my-4" />
                                <p className="font-sans uppercase text-sm text-muted-foreground">SHORT ANSWER:</p>
                                <p><span className="text-green-600">(+A)</span> = YES, + PRONOUN+ TO BE</p>
                                <p><span className="text-red-600">(-A)</span> = NO, PRONOUN + TO BE + NOT</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">Ejemplo = "Mi mamá es una enfermera"</CardTitle></CardHeader>
                            <CardContent className="space-y-3 font-mono text-lg font-bold text-black dark:text-white text-left">
                                <p><span className="text-green-600">(+)</span> = my mother is a nurse</p>
                                <p><span className="text-red-600">(-)</span> = my mother is not a nurse</p>
                                <p><span className="text-blue-600">(?)</span> = is my mother a nurse?</p>
                                <Separator className="my-2" />
                                <p><span className="text-green-600">(+A)</span> = Yes, she is</p>
                                <p><span className="text-red-600">(-A)</span> = No, she is not</p>
                            </CardContent>
                            <CardFooter className="justify-center border-t pt-4">
                                <Button onClick={() => setTopicToComplete('tobe-3')}>Siguiente Paso</Button>
                            </CardFooter>
                        </div>
                    </div>
                );
            case 'exercises3': return <TranslationExercise exerciseKey="exercises3" onComplete={() => setTopicToComplete('exercises3')} vocabulary={{'enfermera': 'nurse', 'abuelos': 'grandparents', 'pensionado': 'retired', 'juguete': 'toy'}} highlightVocabulary={true} title="Exercise 3" />;
            case 'ex-mixto-1': return (
                <div className="space-y-4">
                    <Card className="border-2 border-brand-purple">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div><CardTitle>Exercise 1</CardTitle></div>
                            <Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                            <PopoverContent className="w-64"><div className="grid grid-cols-2 gap-2 text-sm">{Object.entries({estudiante: 'student', amigos: 'friends', padres: 'parents', hermana: 'sister', abogados: 'lawyers', Inglaterra: 'England'}).map(([es, en]) => (<React.Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-bold text-right">{en}</span></React.Fragment>))}</div></PopoverContent></Popover>
                        </CardHeader>
                    </Card>
                    <SimpleTranslationExercise course="a1" exerciseKey="mixed1" onComplete={() => setTopicToComplete('ex-mixto-1')} title="" />
                </div>
            );
            case 'ex-mixto-2': return (
                <div className="space-y-4">
                    <Card className="border-2 border-brand-purple">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div><CardTitle>Exercise 2</CardTitle></div>
                            <Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                            <PopoverContent className="w-64"><div className="grid grid-cols-2 gap-2 text-sm">{Object.entries({cansado: 'tired', amiga: 'friend', estudiantes: 'students', feliz: 'happy', curiosos: 'curious', novia: 'girlfriend', ocupada: 'busy', libres: 'free', España: 'Spain', ingeniero: 'engineer', hambriento: 'hungry', compañeros: 'coworkers', 'a tiempo': 'on time'}).map(([es, en]) => (<React.Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-bold text-right">{en}</span></React.Fragment>))}</div></PopoverContent></Popover>
                        </CardHeader>
                    </Card>
                    <TranslationExercise exerciseKey="qna2" formType="qna" onComplete={() => setTopicToComplete('ex-mixto-2')} title="" />
                </div>
            );
            case 'ex-mixto-3': return (
                <div className="space-y-4">
                    <Card className="border-2 border-brand-purple">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div><CardTitle>Exercise 3</CardTitle></div>
                            <Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                            <PopoverContent className="w-64"><div className="grid grid-cols-2 gap-2 text-sm">{Object.entries({estudiantes: 'students', apodos: 'nicknames', mamá: 'mom/mother', padres: 'parents', viejos: 'old', prima: 'cousin', abuela: 'grandma', hermanas: 'sisters', cansado: 'tired', aburridos: 'bored', profesores: 'teachers', enojados: 'angry', alta: 'tall', preocupados: 'worried'}).map(([es, en]) => (<React.Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-bold text-right">{en}</span></React.Fragment>))}</div></PopoverContent></Popover>
                        </CardHeader>
                    </Card>
                    <SimpleTranslationExercise course="a1" exerciseKey="mixed3" onComplete={() => setTopicToComplete('ex-mixto-3')} title="" />
                </div>
            );
            case 'ex-mixto-4': return (
                <div className="space-y-4">
                    <Card className="border-2 border-brand-purple">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div><CardTitle>Exercise 4</CardTitle></div>
                            <Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                            <PopoverContent className="w-64"><div className="grid grid-cols-2 gap-2 text-sm">{Object.entries({profesor: 'teacher', ingeniero: 'engineer', australiano: 'Australian', universidad: 'university', mesa: 'table', silla: 'chair', hobbies: 'hobbies', interesado: 'interested', estadio: 'stadium', primos: 'cousins', amiga: 'friend'}).map(([es, en]) => (<React.Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-bold text-right">{en}</span></React.Fragment>))}</div></PopoverContent></Popover>
                        </CardHeader>
                    </Card>
                    <SimpleTranslationExercise course="a1" exerciseKey="mixed4" onComplete={() => setTopicToComplete('ex-mixto-4')} title="" />
                </div>
            );
            case 'ex-mixto-5': return <ShortAnswerExercise onComplete={() => setTopicToComplete('ex-mixto-5')} />;
            case 'ex-mixto-6': return (
                <div className="space-y-4">
                    <Card className="border-2 border-brand-purple">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div><CardTitle>Exercise 6</CardTitle></div>
                            <Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                            <PopoverContent className="w-64"><div className="grid grid-cols-2 gap-2 text-sm">{Object.entries({profesora: 'teacher', trabajo: 'work', hijos: 'sons', padrastro: 'stepfather', primo: 'cousin', estante: 'shelf', escritorio: 'desk', iglesia: 'church', supermercado: 'supermarket'}).map(([es, en]) => (<React.Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-bold text-right">{en}</span></React.Fragment>))}</div></PopoverContent></Popover>
                        </CardHeader>
                    </Card>
                    <SimpleTranslationExercise course="a1" exerciseKey="mixed6" onComplete={() => setTopicToComplete('ex-mixto-6')} title="" />
                </div>
            );
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
                            {learningPath.map((item) => {
                                const isL = item.status === 'locked' && !isAdmin;
                                const isS = selectedTopic === item.key || item.subItems?.some(si => si.key === selectedTopic);
                                const Icon = ICONS[item.status] || BookOpen;
                                return (
                                    <li key={item.key}>
                                        {!item.subItems ? (
                                            <div onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isL ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', isS && 'bg-muted text-primary font-bold')}>
                                                <div className="flex items-center gap-3"><Icon className={cn("h-5 w-5", item.status === 'completed' && 'text-green-500')} /><span>{item.name}</span></div>
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <div className="px-3 py-2 text-sm font-bold text-primary uppercase tracking-wider">{item.name}</div>
                                                <ul className="pl-4 space-y-1">{item.subItems.map(sub => {
                                                    const subL = sub.status === 'locked' && !isAdmin;
                                                    const SubI = ICONS[sub.status] || PenSquare;
                                                    return (
                                                        <li key={sub.key} onClick={() => handleTopicSelect(sub.key)} className={cn('flex items-center gap-3 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer text-foreground', subL ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === sub.key && 'bg-muted text-primary font-bold')}>
                                                            <SubI className={cn("h-4 w-4", sub.status === 'completed' && 'text-green-500')} /><span>{sub.name}</span>
                                                        </li>
                                                    )
                                                })}</ul>
                                            </div>
                                        )}
                                    </li>
                                )
                            })}
                        </ul></nav>
                        <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2"><span>Progreso</span><span className="font-bold">{progressValue}%</span></div><Progress value={progressValue} className="h-1.5" /></div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
