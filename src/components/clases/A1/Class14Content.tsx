'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    CheckCircle, 
    Loader2, 
    ArrowRight, 
    Mic, 
    Pencil, 
    Gamepad2, 
    BookText, 
    Star,
    Check,
    X,
    Trophy,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';

// --- CONFIGURACIÓN ---
const progressStorageVersion = 'progress_a1_eng_u3_c14_v700_stable_final';
const mainProgressKey = 'progress_a1_eng_unit_3_class_14';

// --- DATA ---
const materialsVocab = [
    { es: "TEJIDO", en: "FABRIC" }, { es: "PIEDRA", en: "STONE" }, { es: "MADERA", en: "WOOD" },
    { es: "LANA", en: "WOOL" }, { es: "BRONCE", en: "BRONZE" }, { es: "METAL", en: "METAL" },
    { es: "ALGODÓN", en: "COTTON" }, { es: "ACERO", en: "STEEL" }, { es: "PLATA", en: "SILVER" },
    { es: "SEDA", en: "SILK" }, { es: "HIERRO", en: "IRON" }, { es: "ORO", en: "GOLD" },
    { es: "CUERO", en: "LEATHER" }, { es: "VIDRIO", en: "GLASS" }, { es: "PLASTICO", en: "PLASTIC" },
];

const ex1Prompts = [
    { text: "IS COLOMBIA __________________ COUNTRY OF SOUTH AMERICA?", options: ["NICE", "NICER", "THE NICEST", "THE MOST NICE"], answer: "THE NICEST" },
    { text: "ARE THEY __________________ THAN THEM?", options: ["THE MOST FAMOUS", "MORE FAMOUS", "FAMOUSER", "FAMOUS"], answer: "MORE FAMOUS" },
    { text: "I’M ________________________ OF MY FAMILY", options: ["THE MOST TALL", "TALLER", "THE TALLEST", "THE MORE TALL"], answer: "THE TALLEST" },
    { text: "ARE THEY __________________ THAN US?  ", options: ["YOUNG", "MORE YOUNG", "YOUNGER", "THE YOUNGESTS"], answer: "YOUNGER" },
];

const ex2Prompts = [
    { spanish: "¿DONDE ESTA EL ARBOL MAS ALTO? (HIGH)-", answer: ["where is the highest tree?"] },
    { spanish: "EL PUEDE AYUDARNOS-", answer: ["he can help us"] },
    { spanish: "NOSOTROS NO ESTAMOS MANEJANDO UN CAMION-", answer: ["we are not driving a truck", "we're not driving a truck", "we aren't driving a truck"] },
    { spanish: "¿ELLA JUEGA CON EL? -", answer: ["does she play with him?"] },
    { spanish: "¿BARRANQUILLA ES MAS CALIENTE QUE CARTAGENA? -", answer: ["is barranquilla hotter than cartagena?"] },
    { spanish: "ELLOS NO DESAYUNAN A LAS 9-", answer: ["they do not have breakfast at 9", "they don't have breakfast at 9"] },
    { spanish: "ELLA ESTA JUGANDO CON SU HIJO-", answer: ["she is playing with her son"] },
    { spanish: "¿COLOMBIA ES MAS GRANDE QUE PANAMA? -", answer: ["is colombia bigger than panama?"] },
    { spanish: "ELLA NO LOS ESTA LLAMANDO-", answer: ["she is not calling them", "she's not calling them"] },
    { spanish: "¿QUE LE ENSEÑAS A ELLOS? -", answer: ["what do you teach them?"] },
];

const ex3Prompts = [
    { text: "THIS IS THE ____________________VIDEO I’VE EVER SEEN!", options: ["FUNNIER", "THE MOST FUNNY", "THE FUNNIEST", "FUNNY"], answer: "THE FUNNIEST" },
    { text: "THIS BOX IS _________________________THAN THE OTHER", options: ["THE LIGHTER", "LIGHTER", "THE LIGHTEST", "LIGHT"], answer: "LIGHTER" },
    { text: "JANE IS__________________________THAN MARY", options: ["INTERESTINGER", "MORE INTERESTING", "INTERESTING", "THE INTERESTINGEST"], answer: "MORE INTERESTING" },
    { text: "HE IS ________________________ PILOT IN THE RACE", options: ["BAD", "THE WORST", "WORSE", "THE BADDEST"], answer: "THE WORST" },
    { text: "THAT MOVIE IS _______________________", options: ["BORINGER", "THE MOST BORING", "MORE BORING", "BORING"], answer: "BORING" },
    { text: "THESE JEANS ARE________________________ THAN THOSE ONES", options: ["DIRTIEST", "DIRTIER", "THE MOST DIRTY", "DIRTY"], answer: "DIRTIER" },
    { text: "THIS PLACE IS __________________________ OF THIS COUNTRY", options: ["MORE SAFE", "THE SAFEST", "THE MOST SAFE", "SAFER"], answer: "THE SAFEST" },
];

const readingData = {
    title: "The Material World",
    content: "The world is made of many things. Houses are usually built of stone and wood, but some modern ones use steel and glass. In summer, people wear clothes made of cotton and silk because they are cool. When it is cold, wool and leather are better. We also have precious metals like gold and silver for expensive jewelry.",
    questions: [
        { id: 'q1', question: "What materials are used for modern houses?", answers: ["steel and glass", "glass and steel"] },
        { id: 'q2', question: "Which materials are good for summer?", answers: ["cotton and silk", "silk and cotton"] },
        { id: 'q3', vote: "What are gold and silver used for?", answers: ["expensive jewelry", "jewelry"] }
    ]
};

const finalExPrompts = [
    { question: "¿TÚ TIO ESTA DURMIENDO?", trans: ["is your uncle sleeping?"], pos: ["yes, he is"], neg: ["no, he is not", "no, he isn't"] },
    { question: "¿ESTÁS MANEJANDO UN CARRO O UNA MOTO?", trans: ["are you driving a car or a motorcycle?", "are you driving a car or a bike?"], pos: ["yes, i am"], neg: ["no, i am not", "no, i'm not"] },
    { question: "¿NOSOTROS ESTAMOS ESTUDIANDO INGLES UNA VEZ A LA SEMANA?", trans: ["are we studying english once a week?"], pos: ["yes, we are"], neg: ["no, we are not", "no, we aren't"] },
    { question: "¿ÉL ESTA DIBUJANDO?", trans: ["is he drawing?"], pos: ["yes, he is"], neg: ["no, he is not", "no, he isn't"] },
    { question: "¿ELLOS ESTAN CANTANDO EN LA FIESTA?", trans: ["are they singing at the party?"], pos: ["yes, they are"], neg: ["no, they are not", "no, they aren't"] },
];

// --- HELPERS ---

const ChoiceExercise = ({ prompts, onComplete, title }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [solved, setSolved] = useState<Record<number, boolean>>({});

    const handleSelect = (option: string) => {
        if (solved[currentIndex]) return;
        if (option.toUpperCase() === prompts[currentIndex].answer.toUpperCase()) {
            setSolved(p => ({ ...p, [currentIndex]: true }));
            toast({ title: "¡Correcto!" });
        } else {
            toast({ variant: 'destructive', title: "Sigue intentando" });
        }
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <div className="flex gap-2 justify-start flex-wrap pt-4">
                    {prompts.map((_: any, i: number) => (
                        <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", solved[i] ? "bg-green-500 text-white border-green-500" : "bg-card")}>{i + 1}</div>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-8 py-10">
                <div className="text-2xl font-bold text-center leading-relaxed">
                    {prompts[currentIndex].text.split('__________________').map((part: string, i: number) => (
                        <React.Fragment key={i}>
                            {part}
                            {i < prompts[currentIndex].text.split('__________________').length - 1 && (
                                <span className={cn("border-b-2 border-dashed px-4 mx-2", solved[currentIndex] ? "text-primary border-primary" : "text-muted-foreground")}>
                                    {solved[currentIndex] ? prompts[currentIndex].answer : '...'}
                                </span>
                            )}
                        </React.Fragment>
                    ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
                    {prompts[currentIndex].options.map((opt: string) => (
                        <Button key={opt} onClick={() => handleSelect(opt)} variant="outline" className={cn("h-14 text-lg font-black uppercase transition-all", solved[currentIndex] && opt.toUpperCase() === prompts[currentIndex].answer.toUpperCase() && "border-green-500 bg-green-50 text-green-700 scale-105")}>
                            {opt}
                        </Button>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={!solved[currentIndex]} className="px-12 font-bold">Siguiente</Button>
            </CardFooter>
        </Card>
    );
};

const DictationGradingExercise = ({ title, prompts, onComplete, studentDocRef, isAdmin, storageKeyLines, storageKeyGrades, initialLines, initialGrades }: any) => {
    const [lines, setLines] = useState<string[]>(Array(prompts.length).fill(''));
    const [grades, setGrades] = useState<Record<number, 'correct' | 'incorrect' | null>>(initialGrades || {});
    const lastStudentDataRef = useRef<string[]>([]);

    useEffect(() => {
        if (initialLines && Array.isArray(initialLines)) {
            const newLines = [...Array(prompts.length).fill('')];
            initialLines.forEach((val: string, i: number) => { if (i < prompts.length) newLines[i] = val || ''; });
            
            if (isAdmin) {
                setLines(newLines);
            } else {
                // Escudo de escritura: solo actualizamos si el cambio viene de afuera y no estamos escribiendo activamente
                setLines(curr => {
                    const hasLocalChange = curr.some((l, idx) => l !== lastStudentDataRef.current[idx]);
                    return hasLocalChange ? curr : newLines;
                });
            }
            lastStudentDataRef.current = newLines;
        }
    }, [initialLines, prompts.length, isAdmin]);

    const handleLineChange = (idx: number, val: string) => {
        if (isAdmin) return;
        const nl = [...lines]; nl[idx] = val; 
        setLines(nl);
        lastStudentDataRef.current = nl;
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}.${storageKeyLines}`]: nl });
    };

    const handleToggleGrade = (idx: number, type: 'correct' | 'incorrect') => {
        if (!isAdmin) return;
        const ng = { ...grades }; ng[idx] = ng[idx] === type ? null : type; setGrades(ng);
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}.${storageKeyGrades}`]: ng });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader className='bg-primary/5 border-b'><CardTitle>{title}</CardTitle></CardHeader>
            <CardContent className="p-6"><ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                    {prompts.map((_: any, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                            <span className="font-bold w-10 text-right text-muted-foreground">{i + 1}.</span>
                            <Input value={lines[i] || ''} onChange={e => handleLineChange(i, e.target.value)} className={cn("flex-1 h-10 transition-all", grades[i] === 'correct' ? 'border-green-500 bg-green-50/10' : grades[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} readOnly={isAdmin} />
                            <div className="flex gap-1 shrink-0">
                                <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(i, 'correct')} className={cn("h-8 w-8 rounded-full", grades[i] === 'correct' ? "bg-green-500 text-white" : "bg-muted opacity-50")} disabled={!isAdmin}><Check className="h-4 w-4"/></Button>
                                <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(i, 'incorrect')} className={cn("h-8 w-8 rounded-full", grades[i] === 'incorrect' ? "bg-red-500 text-white" : "bg-muted opacity-50")} disabled={!isAdmin}><X className="h-4 w-4"/></Button>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea></CardContent>
            <CardFooter className="justify-center border-t pt-6"><Button onClick={onComplete} size="lg" className="px-16 font-bold h-14">Avanzar <ArrowRight className="ml-2 h-6 w-6" /></Button></CardFooter>
        </Card>
    );
};

const TripleLineTranslationExercise = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [ans, setAns] = useState({ trans: '', pos: '', neg: '' });
    const [val, setVal] = useState<any>({ trans: 'unchecked', pos: 'unchecked', neg: 'unchecked' });
    const [completedMap, setCompletedMap] = useState<Record<number, boolean>>({});

    useEffect(() => {
        setAns({ trans: '', pos: '', neg: '' });
        setVal({ trans: 'unchecked', pos: 'unchecked', neg: 'unchecked' });
    }, [currentIndex]);

    const handleCheck = () => {
        const fields: (keyof typeof ans)[] = ['trans', 'pos', 'neg'];
        const keysInPrompt = ['trans', 'pos', 'neg'];
        const newVal = { ...val };
        let allOk = true;

        fields.forEach((field, i) => {
            const userVal = ans[field].trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
            const corrects = prompts[currentIndex][keysInPrompt[i]].map((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' '));
            if (field === 'trans' && !ans.trans.trim().endsWith('?')) { allOk = false; newVal[field] = 'incorrect'; }
            else if (corrects.includes(userVal)) newVal[field] = 'correct';
            else { allOk = false; newVal[field] = 'incorrect'; }
        });

        setVal(newVal);
        if (allOk) { toast({ title: "¡Perfecto!" }); setCompletedMap(p => ({ ...p, [currentIndex]: true })); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="w-full text-left">
                        <CardTitle>{title}</CardTitle>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", completedMap[i] ? "bg-green-500 text-white border-green-500" : "bg-card text-foreground")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-4 rounded-lg border text-center font-bold text-xl uppercase">{prompts[currentIndex].question}</div>
                <div className="space-y-4 font-mono">
                    <div className="flex items-center gap-4"><Label className="w-10 font-bold text-blue-500 text-center">(?)</Label><Input value={ans.trans} onChange={e => setAns(p => ({...p, trans: e.target.value}))} className={cn(val.trans === 'correct' ? 'border-green-500' : val.trans === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></div>
                    <div className="flex items-center gap-4"><Label className="w-10 font-bold text-green-500 text-center">(+A)</Label><Input value={ans.pos} onChange={e => setAns(p => ({...p, pos: e.target.value}))} className={cn(val.pos === 'correct' ? 'border-green-500' : val.pos === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></div>
                    <div className="flex items-center gap-4"><Label className="w-10 font-bold text-red-500 text-center">(-A)</Label><Input value={ans.neg} onChange={e => setAns(p => ({...p, neg: e.target.value}))} className={cn(val.neg === 'correct' ? 'border-green-500' : val.neg === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></div>
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck} variant="secondary">Verificar</Button>
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={!completedMap[currentIndex]} className="font-bold">Siguiente</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

// --- MAIN COMPONENT ---

export default function Class14Content({ overrideStudentId }: { overrideStudentId?: string | null }) {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const currentUID = overrideStudentId || user?.uid;
    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any, name?: string}>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const [learningPath, setLearningPath] = useState<any[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(materialsVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(materialsVocab.length).fill('unchecked'));
    const [create1Text, setCreate1Text] = useState('');
    const [readingAnswers, setReadingAnswers] = useState<Record<string, string>>({});
    const [readingVal, setReadingVal] = useState<Record<string, 'correct' | 'incorrect' | 'unchecked'>>({});

    const initialLearningPath = useMemo(() => [
        { key: 'vocabulary', name: '1. Vocabulary', icon: BookOpen, status: 'active' },
        { key: 'dictation1', name: '2. Dictation 1', icon: Mic, status: 'locked' },
        { key: 'create1', name: '3. Create 1', icon: Pencil, status: 'locked' },
        { key: 'exercise1', name: '4. Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'exercise2', name: '5. Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'dictation2', name: '6. Dictation 2', icon: Mic, status: 'locked' },
        { key: 'vocab_game', name: '7. Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
        { key: 'exercise3', name: '8. Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'create2', name: '9. Create 2', icon: Pencil, status: 'locked' },
        { key: 'lectura', name: '10. Lectura', icon: BookText, status: 'locked' },
        { key: 'final_exercise', name: '11. Final Exercise', icon: Trophy, status: 'locked' },
    ], []);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    const handleTopicSelect = (topicKey: string) => {
        const t = learningPath.find(it => it.key === topicKey);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
    };

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
        const d = studentProfile.lessonProgress?.[progressStorageVersion] || {};
        let p = initialLearningPath.map(t => ({ ...t }));
        p.forEach(t => { if (d[t.key]) (t as any).status = d[t.key]; });
        
        if (isAdmin && !overrideStudentId) {
            p.forEach(t => (t as any).status = 'completed');
        }

        let last = true;
        for(let i=0; i < p.length; i++) { if (last && (p[i] as any).status === 'locked') (p[i] as any).status = 'active'; last = (p[i] as any).status === 'completed'; }
        setLearningPath(p);
        setSelectedTopic(d.lastSelectedTopic || p.find(it => it.status === 'active')?.key || p[0].key);
        if (d.create1Text !== undefined) setCreate1Text(d.create1Text);
        if (d.readingAnswers) setReadingAnswers(d.readingAnswers);
        if (d.readingValidation) setReadingVal(d.readingValidation);
        setInitialLoadComplete(true); setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete, overrideStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;
        const s: any = { lastSelectedTopic: selectedTopic, create1Text, readingAnswers, readingValidation: readingVal };
        learningPath.forEach(t => s[t.key] = t.status);
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, isInitialLoading, create1Text, readingAnswers, readingVal]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(curr => {
            let next: string | null = null; const np = [...curr];
            const i = np.findIndex(t => t.key === topicToComplete);
            if (i !== -1 && np[i].status !== 'completed') {
                np[i].status = 'completed';
                if (i + 1 < np.length && np[i + 1].status === 'locked') { np[i + 1].status = 'active'; next = np[i + 1].key; }
            }
            if (next) { const n = next; setTimeout(() => { toast({ title: "¡Misión completada!" }); setSelectedTopic(n); }, 0); }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><CardTitle>LEXICO: MATERIALES Y TEJIDOS</CardTitle></CardHeader>
                        <CardContent><div className="grid grid-cols-2 gap-4 text-lg">
                            {materialsVocab.map((v, i) => (<React.Fragment key={i}><div className="p-3 border rounded-lg font-bold">{v.es}</div><Input value={vocabAnswers[i]} onChange={e => { if (isAdmin) return; const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const nv = [...vocabValidation]; nv[i] = 'unchecked'; setVocabValidation(nv); }} className={cn("uppercase", vocabValidation[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} readOnly={isAdmin} /></React.Fragment>))}
                        </div></CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 mt-4"><Button onClick={() => { let all = true; const nv = materialsVocab.map((v, i) => { const ok = v.en.toUpperCase() === vocabAnswers[i].trim().toUpperCase(); if (!ok) all = false; return ok ? 'correct' : 'incorrect'; }); setVocabValidation(nv); if (all) toast({ title: "¡Perfecto!" }); }} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!vocabValidation.every(v => v === 'correct') && !isAdmin}>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'dictation1':
                return <DictationGradingExercise title="DICTATION 1: COMPARATIVES & SUPERLATIVES" description="Escribe las frases dictadas." prompts={Array(30).fill('')} onComplete={() => handleTopicComplete('dictation1')} studentDocRef={studentDocRef} isAdmin={isAdmin} storageKeyLines="dictation1Lines" storageKeyGrades="dictation1Grades" initialLines={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation1Lines} initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation1Grades} />;
            case 'create1':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><CardTitle>Create 1</CardTitle><CardDescription className="text-lg font-bold text-foreground uppercase">DID YOU GO TO THE CIRCUS? WHY? DID YOU LIKE IT OR NOT?</CardDescription></CardHeader>
                        <CardContent><textarea value={create1Text} onChange={(e) => { if (!isAdmin) setCreate1Text(e.target.value); }} readOnly={isAdmin} className={cn("w-full min-h-[250px] p-4 rounded-xl border bg-background text-lg leading-relaxed text-foreground focus:ring-2 focus:ring-primary", isAdmin && "bg-muted cursor-default")} placeholder={isAdmin ? "El alumno no ha escrito nada..." : "Escribe tu respuesta aquí..."}/></CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('create1')} size="lg" className="px-20 font-bold h-14">Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'exercise1': return <ChoiceExercise prompts={ex1Prompts} onComplete={() => handleTopicComplete('exercise1')} title="EXERCISE: COMPARATIVOS Y SUPERLATIVOS" />;
            case 'exercise2': return <SimpleTranslationExercise exerciseKey="c14_ex2_final" prompts={ex2Prompts} onComplete={() => handleTopicComplete('exercise2')} isAdmin={isAdmin} />;
            case 'dictation2': return <DictationGradingExercise title="DICTATION 2: AT WORK" description="Escribe las frases dictadas." prompts={Array(31).fill('')} onComplete={() => handleTopicComplete('dictation2')} studentDocRef={studentDocRef} isAdmin={isAdmin} storageKeyLines="dictation2Lines" storageKeyGrades="dictation2Grades" initialLines={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation2Lines} initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation2Grades} />;
            case 'vocab_game': return <VocabularyMatchingGame data={materialsVocab.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Misión: Encuentra las parejas" />;
            case 'exercise3': return <ChoiceExercise prompts={ex3Prompts} onComplete={() => handleTopicComplete('exercise3')} title="EXERCISE 3: COMPARATIVES & SUPERLATIVES" />;
            case 'create2': return <DictationGradingExercise title="CREATE 2" description="INVENTA 2 FRASES (+), 2 (-) Y 2 (?) CON PRONOMBRES OBJETO." prompts={Array(6).fill('')} onComplete={() => handleTopicComplete('create2')} studentDocRef={studentDocRef} isAdmin={isAdmin} storageKeyLines="create2Lines" storageKeyGrades="create2Grades" initialLines={studentProfile?.lessonProgress?.[progressStorageVersion]?.create2Lines} initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.create2Grades} />;
            case 'lectura':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>{readingData.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner">{readingData.content}</div>
                            <Separator /><div className="space-y-4">{readingData.questions.map(q => (
                                <div key={q.id} className="grid gap-2"><Label htmlFor={q.id} className='font-bold'>{q.question}</Label>
                                <Input id={q.id} value={readingAnswers[q.id] || ''} onChange={(e) => { if (!isAdmin) setReadingAnswers({...readingAnswers, [q.id]: e.target.value}); }} readOnly={isAdmin} className={cn('mt-1 text-lg h-12', readingVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/5' : readingVal[q.id] === 'incorrect' ? 'border-destructive bg-destructive/5' : '')} autoComplete="off" /></div>
                            ))}</div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6"><Button onClick={() => {
                            const nv: any = {}; let ok = true;
                            readingData.questions.forEach(q => {
                                const ans = (readingAnswers[q.id] || '').trim().toLowerCase();
                                const isOk = q.answers.some(a => ans.includes(a.toLowerCase()));
                                nv[q.id] = isOk ? 'correct' : 'incorrect'; if (!isOk) ok = false;
                            });
                            setReadingVal(nv); if (ok) handleTopicComplete('lectura');
                        }} size="lg" className="px-12 font-bold" disabled={isAdmin}>Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'final_exercise': return <TripleLineTranslationExercise title="Final Exercise: Short Answers" prompts={finalExPrompts} onComplete={() => handleTopicComplete('final_exercise')} />;
            default: return null;
        }
    };

    return (
        <div className="grid gap-8 md:grid-cols-12 text-foreground animate-in fade-in duration-500">
            <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
            <div className="md:col-span-3 md:order-2 order-1 text-left">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader className="pb-4"><CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2"><Star className="h-5 w-5 fill-primary" /> Tu Misión</CardTitle></CardHeader>
                    <CardContent><nav><ul className="space-y-1">
                        {learningPath.map((item) => (
                            <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer', (item.status === 'locked' && !isAdmin) ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary')}>
                                <div className="flex items-center gap-3">{item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <BookOpen className={cn("h-5 w-5", item.status === 'locked' ? "text-yellow-500" : "text-primary")} />}<span className="truncate max-w-[150px] uppercase font-bold text-[11px]">{item.name}</span></div>
                                {item.status === 'locked' && !isAdmin && <Lock className="h-4 w-4 text-yellow-500/50" />}
                            </li>
                        ))}
                    </ul></nav>
                    <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 font-black uppercase text-muted-foreground"><span>Avance</span><span className="text-primary">{progressValue}%</span></div><Progress value={progressValue} className="h-2" /></div></CardContent>
                </Card>
            </div>
        </div>
    );
}

