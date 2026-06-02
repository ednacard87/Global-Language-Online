'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle, Info, Mic, Loader2, Gamepad2, Pencil, ArrowRight, Check, X, BookText } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { SentenceCompletionExercise, type CompletionPrompt } from '@/components/kids/exercises/sentence-completion-exercise';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CreativeWritingExercise } from '@/components/dashboard/creative-writing-exercise';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'completed' | 'active' | 'locked';
};

const progressStorageVersion = 'progress_a1_eng_u1_c8_v12_stable';
const mainProgressKey = 'progress_a1_eng_unit_1_class_8';

const vocabularyData = [
    { spanish: 'ESTE/A', english: ['THIS'] },
    { spanish: 'ESTOS/AS', english: ['THESE'] },
    { spanish: 'ESE/A', english: ['THAT'] },
    { spanish: 'ESOS/AS', english: ['THOSE'] },
    { spanish: 'PERO', english: ['BUT'] },
    { spanish: 'MIENTRAS', english: ['WHILE'] },
    { spanish: 'ENTONCES', english: ['SO'] },
    { spanish: 'LUEGO', english: ['THEN'] },
    { spanish: 'ALREDEDOR', english: ['AROUND'] },
    { spanish: 'MEDIA NOCHE', english: ['MIDNIGHT'] },
    { spanish: 'MEDIO DIA', english: ['MIDDAY', 'NOON'] },
    { spanish: 'DESDE', english: ['FROM'] },
    { spanish: 'TAMBIÉN', english: ['ALSO', 'TOO'] },
    { spanish: 'ACERCA DE', english: ['ABOUT'] },
    { spanish: 'CADA', english: ['EVERY', 'EACH'] },
    { spanish: 'CASI', english: ['ALMOST'] },
];

const exercise5Data: CompletionPrompt[] = [
    { parts: ["WHERE IS ", " WALLET?"], answers: ["THE"] },
    { parts: ["THEY LOVE ", " LANGUAGES"], answers: [""] },
    { parts: ["THIS IS ", " SARA'S PRESENT."], answers: [""] },
    { parts: ["THIS IS ", " JOHN'S HOUSE."], answers: [""] },
    { parts: ["THESE ARE ", " KEYS HE GAVE ME."], answers: ["THE"] },
    { parts: ["", " STRAWBERRIES ARE DELICIOUS."], answers: [""] },
    { parts: ["HE LIKES ", " SUN GLASSES."], answers: [""] },
    { parts: ["WHERE ARE ", " SHOES?"], answers: ["THE"] },
    { parts: ["I DO NOT LIKE ", " SUNNY DAYS."], answers: [""] },
    { parts: ["HE ISN'T ", " ANTHONY'S HOUSE."], answers: [""] },
    { parts: ["", " DOOR OF MY HOUSE."], answers: ["THE"] },
    { parts: ["SHE WORKS WITH ", " ENGINEER."], answers: [""] },
];

const ManualGradingExercise = ({ 
    title,
    description,
    onComplete, 
    studentDocRef, 
    initialData, 
    initialGrades,
    savePath, 
    savePathGrades,
    isAdmin,
    lineCount = 13,
}: any) => {
    const [lines, setLines] = useState<string[]>(Array(lineCount).fill(''));
    const [grades, setGrades] = useState<Record<number, 'correct' | 'incorrect' | null>>(initialGrades || {});
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!initializedRef.current && initialData && Array.isArray(initialData)) {
            const newLines = [...Array(lineCount).fill('')];
            initialData.forEach((val, i) => { if (i < lineCount) newLines[i] = val || ''; });
            setLines(newLines);
            if (initialData.length > 0) initializedRef.current = true;
        }
    }, [initialData, lineCount]);

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
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg text-primary">
                        {title.includes('DICTATION') ? <Mic className="h-6 w-6" /> : <Pencil className="h-6 w-6" />}
                    </div>
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                    {lines.map((line, idx) => {
                        const status = grades[idx];
                        const isTitleLine = idx === 0 && (title.includes('DICTATION') || title.includes('Writing 2'));
                        return (
                            <div key={idx} className="flex items-center gap-3">
                                <span className={cn("font-bold w-8 text-right", isTitleLine ? "text-primary" : "text-muted-foreground")}>
                                    {idx + 1}.
                                </span>
                                <Input 
                                    value={line} 
                                    onChange={e => handleLineChange(idx, e.target.value)} 
                                    className={cn(
                                        "flex-1 text-lg h-10 transition-all",
                                        isTitleLine && "font-bold border-primary/50",
                                        status === 'correct' ? 'border-green-500 bg-green-50/5' : 
                                        status === 'incorrect' ? 'border-red-500 bg-red-50/5' : ''
                                    )} 
                                    placeholder={isTitleLine ? "Escribe el título aquí..." : "Escribe aquí..."}
                                    autoComplete="off" 
                                />
                                <div className="flex gap-1 shrink-0">
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        onClick={() => handleToggleGrade(idx, 'correct')} 
                                        className={cn(
                                            "h-8 w-8 rounded-full transition-colors", 
                                            status === 'correct' ? "bg-green-500 text-white hover:bg-green-600" : "bg-muted text-muted-foreground opacity-50"
                                        )} 
                                        disabled={!isAdmin}
                                    >
                                        <Check className="h-4 w-4"/>
                                    </Button>
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        onClick={() => handleToggleGrade(idx, 'incorrect')} 
                                        className={cn(
                                            "h-8 w-8 rounded-full transition-colors", 
                                            status === 'incorrect' ? "bg-red-500 text-white hover:bg-red-600" : "bg-muted text-muted-foreground opacity-50"
                                        )} 
                                        disabled={!isAdmin}
                                    >
                                        <X className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
            <CardFooter className="pt-6 border-t flex justify-center">
                <Button onClick={onComplete} size="lg" className="px-16 font-bold h-14 text-xl">
                    Avanzar <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
            </CardFooter>
        </Card>
    );
};

export default function EngA1Class8Page() {
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

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary (Basic Words)', icon: BookOpen, status: 'active' },
        { key: 'dictation1', name: 'Dictation 1', icon: Mic, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'dictation2', name: 'Dictation 2', icon: Mic, status: 'locked' },
        { key: 'ex2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'ex3', name: 'Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: 'Vocabulary (game)', icon: Gamepad2, status: 'locked' },
        { key: 'ex4', name: 'Exercise 4', icon: PenSquare, status: 'locked' },
        { key: 'ex5', name: 'Exercise 5', icon: PenSquare, status: 'locked' },
        { key: 'writing1', name: 'Writing 1', icon: Pencil, status: 'locked' },
        { key: 'writing2', name: 'Writing 2', icon: Pencil, status: 'locked' },
    ], []);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
        let path = initialLearningPath.map(t => ({ ...t }));
        let savedST = '';
        if (isAdmin) path.forEach(t => t.status = 'completed');
        else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const data = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(t => { if (data[t.key]) t.status = data[t.key]; });
            savedST = data.lastSelectedTopic || '';
        }
        let lastDone = true;
        for(let i=0; i < path.length; i++) { if (lastDone && path[i].status === 'locked') path[i].status = 'active'; lastDone = path[i].status === 'completed'; }
        setLearningPath(path);
        setSelectedTopic(savedST || path.find(p => p.status === 'active')?.key || path[0].key);
        setInitialLoadComplete(true); setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;
        const save = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(t => (save as any)[t.key] = t.status);
        if (JSON.stringify(save) !== JSON.stringify(studentProfile?.lessonProgress?.[progressStorageVersion])) {
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: save, [`progress.${mainProgressKey}`]: progressValue });
        }
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, studentProfile, isInitialLoading]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(curr => {
            let win = false; let next: string | null = null;
            const np = curr.map(t => ({ ...t }));
            const i = np.findIndex(t => t.key === topicToComplete);
            if (i !== -1 && np[i].status !== 'completed') {
                np[i].status = 'completed';
                if (i + 1 < np.length && np[i + 1].status === 'locked') {
                    np[i + 1].status = 'active';
                    win = true;
                    next = np[i + 1].key;
                }
            }
            if (win) setTimeout(() => toast({ title: "¡Siguiente tema desbloqueado!" }), 0);
            if (next) { const n = next; setTimeout(() => setSelectedTopic(n), 0); }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const t = learningPath.find(it => it.key === topicKey);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
    };

    const handleCheckVocab = () => {
        let atLeastOneCorrect = false;
        const nv = vocabularyData.map((v, i) => {
            const c = v.english.some(e => e.toLowerCase() === vocabAnswers[i].trim().toLowerCase());
            if (c) atLeastOneCorrect = true;
            return c ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv);
        if (atLeastOneCorrect) {
            toast({ title: "¡Buen trabajo!", description: "Has acertado al menos una. ¡Ya puedes avanzar!" });
            setCanAdvanceVocab(true);
        } else {
            toast({ variant: 'destructive', title: "Sigue intentando" });
            setCanAdvanceVocab(false);
        }
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple text-left">
                        <CardHeader><CardTitle>Vocabulary</CardTitle></CardHeader>
                        <CardContent><div className="grid grid-cols-2 gap-2">{vocabularyData.map((v, i) => (<React.Fragment key={i}><div className="p-3 border rounded-lg bg-muted/20">{v.spanish}</div><Input value={vocabAnswers[i]} onChange={e => { const n = [...vocabAnswers]; n[i] = e.target.value; setVocabAnswers(n); setVocabValidation(vv => { const nv = [...vv]; nv[i] = 'unchecked'; return nv; }); setCanAdvanceVocab(false); }} className={cn(vocabValidation[i] === 'correct' ? 'border-green-500' : vocabValidation[i] === 'incorrect' ? 'border-red-500' : '')} /></React.Fragment>))}</div></CardContent>
                        <CardFooter className="flex justify-between"><Button onClick={handleCheckVocab} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'dictation1': 
                return <ManualGradingExercise title="DICTATION 1" description="Escucha y escribe las frases dictadas. El primer renglón es para el título." lineCount={13} onComplete={() => handleTopicComplete('dictation1')} studentDocRef={studentDocRef} isAdmin={isAdmin} initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation1} initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation1Grades} savePath={`lessonProgress.${progressStorageVersion}.dictation1`} savePathGrades={`lessonProgress.${progressStorageVersion}.dictation1Grades`} />;
            case 'dictation2': 
                return <ManualGradingExercise title="DICTATION 2" description="Escucha y escribe las frases dictadas. El primer renglón es para el título." lineCount={15} onComplete={() => handleTopicComplete('dictation2')} studentDocRef={studentDocRef} isAdmin={isAdmin} initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation2} initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation2Grades} savePath={`lessonProgress.${progressStorageVersion}.dictation2`} savePathGrades={`lessonProgress.${progressStorageVersion}.dictation2Grades`} />;

                // ----- Vocabulario de los ejercicios ----
            case 'ex1': return <SimpleTranslationExercise exerciseKey="c8_ex1" course="a1" onComplete={() => handleTopicComplete('ex1')} vocabulary={{ "Enojado" : "angry", "contrario": "on the contrary", "otro lado": "on the other hand", "Vegetariano" : "vegetarian" , "hermana" : "sister" , "gafas" : "glasses" , "Tenis" : "Tennis" , "cine": "cinema", "estadio": "stadium", "celular": "cellphone" , "pescado" : "fish" , "tristes": "sad" , "computador" : "computer" }} highlightVocabulary={true} />;
            case 'ex2': return <SimpleTranslationExercise exerciseKey="c8_ex2" course="a1" onComplete={() => handleTopicComplete('ex2')} vocabulary={{ "mío": "mine", "tuyo": "yours", "suyo/a": "his/hers", "nuestro": "ours", "suya (de ellos)": "theirs", "cuadros": "paintings" }} highlightVocabulary={true} />;
            case 'ex3': return <SimpleTranslationExercise exerciseKey="c8_ex3" course="a1" onComplete={() => handleTopicComplete('ex3')} vocabulary={{ "nadar": "swim", "domingos": "sundays", "veloz": "fast", "triste": "sad", "feliz": "happy", "Baloncesto" : "basketball" , "Viajar" : "to travel" , "Tio" : "uncle" , "comportamiento": "behavior" , "iglesia": "church"}} highlightVocabulary={true} />;
            case 'ex4': return <SimpleTranslationExercise exerciseKey="c8_ex4" course="a1" onComplete={() => handleTopicComplete('ex4')} vocabulary={{ "vaso": "glass", "chaqueta": "jacket", "cumpleaños": "birthday", "allá": "there", "Correr" : "to run" , "saber": "know", "ir": "to go" }} highlightVocabulary={true} />;
            case 'ex5': return <SentenceCompletionExercise title="Exercise 5" description="Completa con THE." data={exercise5Data} onComplete={() => handleTopicComplete('ex5')} vocabulary={{ "billetera": "wallet", "idiomas": "languages", "regalo": "present", "llaves": "keys", "gafas de sol": "sunglasses", "fresas" : "strawberries" , "shoes" : "zapatos" , "dias soleados" : "sunny days" , "puerta": "door" }} />;
            case 'vocab_game': return <VocabularyMatchingGame data={vocabularyData} onComplete={() => handleTopicComplete('vocab_game')} />;
            case 'writing1': return <CreativeWritingExercise title="Writing 1" description="About your school." prompts={[{ id: 'w1', question: '' }]} onComplete={() => handleTopicComplete('writing1')} studentDocRef={studentDocRef} initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.writing1 || {}} savePath={`lessonProgress.${progressStorageVersion}.writing1`} />;
            case 'writing2': return <ManualGradingExercise title="Writing 2" description="Crea frases usando los temas aprendidos hoy." lineCount={6} onComplete={() => handleTopicComplete('writing2')} studentDocRef={studentDocRef} isAdmin={isAdmin} initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.writing2} initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.writing2Grades} savePath={`lessonProgress.${progressStorageVersion}.writing2`} savePathGrades={`lessonProgress.${progressStorageVersion}.writing2Grades`} />;
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
                        <h1 className="text-4xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase 8 (A1)</h1>
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
