'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, Fragment } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
    CardFooter, 
    CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    GraduationCap, 
    CheckCircle, 
    CheckCircle2,
    BrainCircuit, 
    Loader2, 
    ArrowRight, 
    BookText, 
    Check, 
    X, 
    ChevronDown,
    Gamepad2,
    Trophy,
    Pencil,
    Activity,
    Star,
    ArrowLeft
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { VerbMemoryGame } from '@/components/kids/exercises/verb-memory-game';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SingleFormExercise } from '@/components/kids/exercises/single-form';
import { PresentSimpleExercise } from '@/components/kids/exercises/present-simple';
import { DashboardHeader } from '@/components/dashboard/header';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_a1_eng_u1_c2_v321_fixed_icons';
const mainProgressKey = 'progress_a1_eng_unit_1_class_2';

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const verbVocabulary = [
    { spanish: 'JUGAR', english: 'to play' },
    { spanish: 'CAMINAR', english: 'to walk' },
    { spanish: 'IR', english: 'to go' },
    { spanish: 'TRABAJAR', english: 'to work' },
    { spanish: 'DORMIR', english: 'to sleep' },
    { spanish: 'COMER', english: 'to eat' },
    { spanish: 'BEBER', english: 'to drink' },
    { spanish: 'VER', english: 'to see' },
    { spanish: 'MIRAR', english: 'to look' },
    { spanish: 'SALIR', english: 'to go out' },
    { spanish: 'CORRER', english: 'to run' },
    { spanish: 'CANTAR', english: 'to sing' },
    { spanish: 'HABLAR', english: 'to speak' },
    { spanish: 'PENSAR', english: 'to think' },
    { spanish: 'TENER', english: 'to have' },
    { spanish: 'HACER', english: 'to do' },
    { spanish: 'ESTUDIAR', english: 'to study' },
    { spanish: 'ESCRIBIR', english: 'to write' },
    { spanish: 'LEER', english: 'to read' },
    { spanish: 'APRENDER', english: 'to learn' },
    { spanish: 'ENSEÑAR', english: 'to teach' },
];

const basicWords = [
    { spanish: 'AYER', english: 'yesterday' },
    { spanish: 'HOY', english: 'today' },
    { spanish: 'MAÑANA', english: 'tomorrow' },
    { spanish: 'AÑO', english: 'year' },
    { spanish: 'DÍA', english: 'day' },
    { spanish: 'SEMANA', english: 'week' },
    { spanish: 'MES', english: 'month' },
    { spanish: 'CON', english: 'with' },
    { spanish: 'DESAYUNO', english: 'breakfast' },
    { spanish: 'ALMUERZO', english: 'lunch' },
    { spanish: 'CENA', english: 'dinner' },
    { spanish: 'SIN', english: 'without' },
];

const simpleFormVocab = {
    "beber": "to drink", "agua": "water", "jugar": "to play", "futbol": "soccer/football", 
    "escuchar": "listen", "música": "music", "hablar": "speak", "abrir": "open", "puerta": "door"
};

const posExercises = [
    { spanish: 'yo bebo agua', answer: ["I drink water"] },
    { spanish: 'nosotros jugamos futbol', answer: ["we play soccer", "we play football"] },
    { spanish: 'ellos escuchan música', answer: ["they listen to music"] },
    { spanish: 'yo hablo ingles', answer: ["I speak English"] },
    { spanish: 'tu abres la puerta', answer: ["you open the door"] },
    { spanish: 'yo tomo leche', answer: ["I drink milk"] },
    { spanish: 'yo estudio inglés', answer: ["I study English"] },
    { spanish: 'nosotros comemos en el restaurante', answer: ["we eat at the restaurant" , "we eat in the restaurant"] },
    { spanish: 'ellos van al cine', answer: ["they go to the cinema"] },
    { spanish: 'nosotros aprendemos a cocinar', answer: ["we learn to cook"] },
];

const negExercises = [
    { spanish: 'yo no bebo agua', answer: ["I do not drink water", "I don't drink water"] },
    { spanish: 'nosotros no jugamos futbol', answer: ["we do not play soccer", "we don't play soccer", "we do not play football", "we don't play football"] },
    { spanish: 'ellos no escuchan música', answer: ["they do not listen to music", "they don't listen to music"] },
    { spanish: 'yo no hablo ingles', answer: ["I do not speak English", "I don't speak English"] },
    { spanish: 'yo no tomo leche', answer: ["I do not drink milk", "I don't drink milk"] },
    { spanish: 'yo no estudio inglés', answer: ["I do not study English", "I don't study English"] },
    { spanish: 'nosotros no comemos en el restaurante', answer: ["we do not eat at the restaurant", "we don't eat at the restaurant" , "we do not eat in the restaurant", "we don't eat in the restaurant"] },
    { spanish: 'ellos no van al cine', answer: ["they do not go to the cinema", "they don't go to the cinema"] },
    { spanish: 'nosotros no aprendemos a cocinar', answer: ["we do not learn to cook", "we don't learn to cook"] },
    { spanish: 'tu no abres la puerta', answer: ["you do not open the door", "you don't open the door"] },
];

const intExercises = [
    { spanish: '¿yo bebo agua?', answer: ["do i drink water?"] },
    { spanish: '¿nosotros jugamos futbol?', answer: ["do we play soccer?", "do we football?"] },
    { spanish: '¿ellos escuchan música?', answer: ["do they listen to music?"] },
    { spanish: '¿yo hablo ingles?', answer: ["do i speak english?"] },
    { spanish: '¿tu abres la puerta?', answer: ["do you open the door?"] },
    { spanish: '¿yo tomo leche?', answer: ["do i drink milk?"] },
    { spanish: '¿yo estudio inglés?', answer: ["do i study English?"] },
    { spanish: '¿nosotros comemos en el restaurante?', answer: ["do we eat at the restaurant?", "do we eat in the restaurant?"] },
    { spanish: '¿ellos van al cine?', answer: ["do they go to the cinema?"] },
    { spanish: '¿nosotros aprendemos a cocinar?', answer: ["do we learn to cook?"] },
];

const ex1Prompts = [
    { spanish: "TU JUEGAS TENIS EL LUNES", answers: { affirmative: ["you play tennis on monday"], negative: ["you do not play tennis on monday", "you don't play tennis on monday"], interrogative: ["do you play tennis on monday?"], shortAffirmative: ["yes, i do"], shortNegative: ["no, i do not", "no, i don't"] } },
    { spanish: "NOSOTROS CAMINAMOS EN EL PARQUE", answers: { affirmative: ["we walk in the park"], negative: ["we do not walk in the park", "we don't walk in the park"], interrogative: ["do we walk in the park?"], shortAffirmative: ["yes, we do"], shortNegative: ["no, i do not", "no, i don't"] } },
    { spanish: "ELLOS VAN A LA UNIVERSIDAD EL SABADO.", answers: { affirmative: ["they go to the university on saturday", "they go to university on saturday"], negative: ["they do not go to the university on saturday", "they don't go to the university on saturday"], interrogative: ["do they go to the university on saturday?"], shortAffirmative: ["yes, they do"], shortNegative: ["no, i do not", "no, i don't"] } },
    { spanish: "TÚ DUERMES EN LA TARDE", answers: { affirmative: ["you sleep in the afternoon"], negative: ["you do not sleep in the afternoon", "you don't sleep in the afternoon"], interrogative: ["do you sleep in the afternoon?"], shortAffirmative: ["yes, i do"], shortNegative: ["no, i do not", "no, i don't"] } },
    { spanish: "NOSOTROS COMEMOS CARNE Y ENSALADA", answers: { affirmative: ["we eat meat and salad"], negative: ["we do not eat meat and salad", "we don't eat meat and salad"], interrogative: ["do we eat meat and salad?"], shortAffirmative: ["yes, we do"], shortNegative: ["no, i do not", "no, i don't"] } },
    { spanish: "ELLOS BEBEN CERVEZA", answers: { affirmative: ["they drink beer"], negative: ["they do not drink beer", "they don't drink beer"], interrogative: ["do they drink beer?"], shortAffirmative: ["yes, they do"], shortNegative: ["no, i do not", "no, i don't"] } },
    { spanish: "ELLOS VAN A LA IGLESIA EL MIERCOLES", answers: { affirmative: ["they go to the church on wednesday"], negative: ["they do not go to thechurch on wednesday", "they don't go to the church on wednesday"], interrogative: ["do they go to the church on wednesday?"], shortAffirmative: ["yes, they do"], shortNegative: ["no, i do not", "no, i don't"] } },
    { spanish: "NOSOTROS JUGAMOS FUTBOL LOS SABADOS", answers: { affirmative: ["we play soccer on saturdays", "we play football on saturdays"], negative: ["we do not play soccer on saturdays", "we don't play soccer on saturdays", "we do not play football on saturdays", "we don't play football on saturdays"], interrogative: ["do we play soccer on saturdays?"], shortAffirmative: ["yes, we do"], shortNegative: ["no, i do not", "no, i don't"] } },
    { spanish: "YO VEO PELÍCULAS LOS VIERNES EN LA NOCHE", answers: { affirmative: ["i watch movies on fridays at night", "i see movies on fridays at night"], negative: ["i do not watch movies on fridays at night", "i don't watch movies on fridays at night", "i do not see movies on fridays at night", "i don't see movies on fridays at night"], interrogative: ["do i watch movies on fridays at night?"], shortAffirmative: ["yes, i do"], shortNegative: ["no, i do not", "no, i don't"] } },
    { spanish: "NOSOTROS TRABAJAMOS LOS SABADOS.", answers: { affirmative: ["we work on saturdays"], negative: ["we do not work on saturdays", "we don't work on saturdays"], interrogative: ["do we work on saturdays?"], shortAffirmative: ["yes, we do"], shortNegative: ["no, i do not", "no, i don't"] } },
];

const ex2Prompts = [
    { spanish: "TU HACES LA TAREA", answers: { affirmative: ["you do the homework"], negative: ["you do not do the homework", "you don't do the homework"], interrogative: ["do you do the homework?"], shortAffirmative: ["yes, i do"], shortNegative: ["no, i do not", "no, i don't"] } },
    { spanish: "ELLA HACE LA COMPRA", answers: { affirmative: ["she does the shopping"], negative: ["she does not do the shopping", "she doesn't do the shopping"], interrogative: ["does she do the shopping?"], shortAffirmative: ["yes, she does"], shortNegative: ["no, she does not", "no, she doesn't"] } },
    { spanish: "NOSOTROS COMEMOS PIZZA", answers: { affirmative: ["we eat pizza"], negative: ["we do not eat pizza", "we don't eat pizza"], interrogative: ["do we eat pizza?"], shortAffirmative: ["yes, we do"], shortNegative: ["no, we do not", "no, we don't"] } },
];

const readingData = {
    title: "Alex's Day",
    content: "My name is Alex. Every morning, I eat breakfast and drink milk. After school, I run in the park with my friends, and then I walk home. In the evening, I read a book and write in my notebook. I also listen to music before I sleep. On weekends, I study for my English class and play videogames.",
    vocabulary: {
        "breakfast": "desayuno",
        "morning": "mañana",
        "evening": "tarde/noche",
        "weekends": "fines de semana",
        "notebook": "cuaderno",
        "favorite": "favorito"
    },
    questions: [
        { id: 'q1', q: "What does Alex drink in the morning?", a: ["milk", "he drinks milk"] },
        { id: 'q2', q: "Where does Alex run?", a: ["in the park", "he runs in the park"] },
        { id: 'q3', q: "What does he do before he sleeps?", a: ["listens to music", "he listens to music", "listen to music"] },
        { id: 'q4', q: "What does Alex study on weekends?", a: ["english", "his english class", "for his english class"] },
        { id: 'q5', q: "Who does he run with?", a: ["his friends", "with his friends"] }
    ]
};

// --- MAIN CLASS COMPONENT ---

export default function Class2Content({ overrideStudentId }: { overrideStudentId?: string | null }) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const currentUID = overrideStudentId || user?.uid;
    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);
    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);

    const [learningPath, setLearningPath] = useState<any[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const hasInitialized = useRef(false);

    // States for content
    const [verbsAnswers, setVerbsAnswers] = useState<string[]>(Array(verbVocabulary.length).fill(''));
    const [verbsValidation, setVerbsValidation] = useState<any[]>(Array(verbVocabulary.length).fill('unchecked'));
    const [wordsAnswers, setWordsAnswers] = useState<string[]>(Array(basicWords.length).fill(''));
    const [wordsValidation, setWordsValidation] = useState<any[]>(Array(basicWords.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);
    const [readAns, setReadAns] = useState<Record<string, string>>({});
    const [readVal, setReadVal] = useState<Record<string, any>>({});
    const [isClassFinished, setIsClassFinished] = useState(false);

    const initialLearningPath = useMemo(() => [
        { key: 'vocabulary', name: '1. Vocabulary (Verbs)', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: '2. Grammar: Present Simple', icon: GraduationCap, status: 'locked' },
        {
            key: 'exercises',
            name: '3. Exercises',
            icon: PenSquare,
            status: 'locked',
            subItems: [
                { key: 'ex-pos', name: 'Positive', status: 'locked' },
                { key: 'ex-neg', name: 'Negative', status: 'locked' },
                { key: 'ex-int', name: 'Interrogative', status: 'locked' },
            ]
        },
        { key: 'memory-verbs', name: '4. Memory: Verbs', icon: BrainCircuit, status: 'locked' },
        { key: 'ex1', name: '5. Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: '6. Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: '7. Reading', icon: BookText, status: 'locked' },
        { key: 'vocab_game', name: '8. Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
    ], []);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    const handleTopicCompleteInternal = useCallback((key: string) => {
        handleTopicComplete(key);
    }, [handleTopicComplete]);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || hasInitialized.current) return;
        let path = initialLearningPath.map(topic => ({...topic, subItems: topic.subItems ? topic.subItems.map(sub => ({...sub})) : undefined}));
        const d = studentProfile.lessonProgress?.[progressStorageVersion] || {};
        if (isAdmin && !overrideStudentId) path.forEach(item => { item.status = 'completed'; if (item.subItems) item.subItems.forEach(s => s.status = 'completed'); });
        else {
            path.forEach(item => {
                if (d[item.key]) item.status = d[item.key];
                if (item.subItems && d.subItems?.[item.key]) {
                    item.subItems.forEach(s => { if (d.subItems[item.key][s.key]) s.status = d.subItems[item.key][s.key]; });
                }
            });
        }

        let lastMainDone = true;
        for(let i=0; i < path.length; i++) {
            if (lastMainDone && path[i].status === 'locked') path[i].status = 'active';
            if (path[i].subItems) {
                let allDone = true; let subStepReady = lastMainDone && path[i].status !== 'locked'; 
                for(let j=0; j < path[i].subItems!.length; j++) {
                    if (subStepReady && path[i].subItems![j].status === 'locked') path[i].subItems![j].status = 'active';
                    const isSubCompleted = path[i].subItems![j].status === 'completed';
                    subStepReady = isSubCompleted; if (!isSubCompleted) allDone = false;
                }
                lastMainDone = allDone;
            } else lastMainDone = (path[i].status === 'completed');
        }

        setLearningPath(path);
        setSelectedTopic(d.lastSelectedTopic || path.find(p => p.status === 'active')?.key || path[0].key);
        if (d.verbsAnswers) setVerbsAnswers(d.verbsAnswers);
        if (d.wordsAnswers) setWordsAnswers(d.wordsAnswers);
        if (d.isClassFinished) setIsClassFinished(true);
        setIsInitialLoading(false);
        hasInitialized.current = true;
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, overrideStudentId]);

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
        if (isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || overrideStudentId) return;
        const data: Record<string, any> = { 
            lastSelectedTopic: selectedTopic,
            verbsAnswers,
            wordsAnswers,
            isClassFinished
        };
        learningPath.forEach(item => {
            data[item.key] = item.status;
            if (item.subItems) {
                if (!data.subItems) data.subItems = {};
                data.subItems[item.key] = {};
                item.subItems.forEach(sub => { data.subItems[item.key][sub.key] = sub.status; });
            }
        });

        const timer = setTimeout(() => {
            updateDocumentNonBlocking(studentDocRef, {
                [`lessonProgress.${progressStorageVersion}`]: data,
                [`progress.${mainProgressKey}`]: progressValue
            });
            if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
        }, 1500);
        return () => clearTimeout(timer);
    }, [learningPath, isAdmin, progressValue, studentDocRef, selectedTopic, isInitialLoading, verbsAnswers, wordsAnswers, isClassFinished, overrideStudentId]);

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
                        } else if (curT.subItems.every((sub: any) => sub.status === 'completed')) {
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
        const autoView = ['tobe', 'possessives', 'tobe-1', 'tobe-2', 'tobe-3', 'demonstratives', 'grammar'];
        if (autoView.includes(topicKey)) handleTopicComplete(topicKey);
    };

    const handleCheckVocab = () => {
        let atLeastOneCorrect = false;
        const nvV = verbVocabulary.map((v, i) => {
            const res = (verbsAnswers[i] || '').trim().toLowerCase() === v.english.toLowerCase() || (verbsAnswers[i] || '').trim().toLowerCase() === v.english.toLowerCase().replace('to ', '');
            if (res) atLeastOneCorrect = true; return res ? 'correct' : 'incorrect';
        });
        const nvW = basicWords.map((v, i) => {
            const res = (wordsAnswers[i] || '').trim().toLowerCase() === v.english.toLowerCase();
            if (res) atLeastOneCorrect = true; return res ? 'correct' : 'incorrect';
        });
        setVerbsValidation(nvV); setWordsValidation(nvW);
        if (atLeastOneCorrect) { toast({ title: "¡Buen trabajo!" }); setCanAdvanceVocab(true); }
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const handleCheckReading = () => {
        let allOk = true; const nv: any = {};
        readingData.questions.forEach(q => {
            const userVal = (readAns[q.id] || '').trim().toLowerCase();
            const isOk = q.a.some(a => userVal.includes(a.toLowerCase()));
            nv[q.id] = isOk ? 'correct' : 'incorrect'; if (!isOk) allOk = false;
        });
        setReadVal(nv);
        if (allOk) toast({ title: "¡Lectura superada!" });
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left text-foreground">
                        <CardHeader><CardTitle>Vocabulary: Verbs & Basic Words</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <ScrollArea className="h-[400px] pr-4">
                                <div className="space-y-6">
                                    <div><h3 className="font-bold text-primary mb-2">1. Verbos</h3><div className="grid grid-cols-2 gap-2">{verbVocabulary.map((v, i) => (<Fragment key={i}><div className="p-2 border rounded bg-white/5 font-bold text-sm uppercase">{v.spanish}</div><Input value={verbsAnswers[i] || ''} onChange={e => { if (overrideStudentId) return; const na = [...verbsAnswers]; na[i] = e.target.value; setVerbsAnswers(na); setCanAdvanceVocab(false); }} className={cn("uppercase", verbsValidation[i] === 'correct' ? 'border-green-500 bg-green-50/10' : verbsValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} readOnly={!!overrideStudentId} autoComplete="off" /></Fragment>))}</div></div>
                                    <Separator />
                                    <div><h3 className="font-bold text-primary mb-2">2. Palabras Básicas</h3><div className="grid grid-cols-2 gap-2">{basicWords.map((v, i) => (<Fragment key={i}><div className="p-2 border rounded bg-white/5 font-bold text-sm uppercase">{v.spanish}</div><Input value={wordsAnswers[i] || ''} onChange={e => { if (overrideStudentId) return; const na = [...wordsAnswers]; na[i] = e.target.value; setWordsAnswers(na); setCanAdvanceVocab(false); }} className={cn("uppercase", wordsValidation[i] === 'correct' ? 'border-green-500 bg-green-50/10' : wordsValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} readOnly={!!overrideStudentId} autoComplete="off" /></Fragment>))}</div></div>
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 mt-4"><Button onClick={handleCheckVocab} variant="secondary">Check</Button><Button onClick={() => handleTopicCompleteInternal('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Next <ArrowRight className="ml-2 h-4 w-4"/></Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <div className="space-y-6 text-left">
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase tracking-tight">Present Simple: “DO - DOES”</CardTitle></CardHeader>
                        <CardContent className="space-y-8 font-bold text-lg pt-4 text-foreground">
                            <div className="p-6 bg-white/80 dark:bg-background/20 rounded-2xl border text-black dark:text-white">
                                <p className="text-1xl font-black text-primary uppercase tracking-tight">1 - USOS PRINCIPALES:</p>
                                <p className="mt-2 text-foreground"> AUXILIAR = “DO-DOES”  // como VERBO (HACER = TO DO).</p>
                                <p className="font-mono text-xl font-black text-primary mt-4 uppercase text-center"> I - YOU - WE - THEY = DO // HE - SHE - IT = DOES</p>
                            </div>

                              <div className="p-6 bg-white/80 dark:bg-background/20 rounded-2xl border text-black dark:text-white space-y-4">
                                  <p className="text-primary uppercase tracking-widest text-sm">2 - ESTRUCTURA (Fórmulas):</p>
                                  <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base text-foreground">
                                      <p><span className="text-green-500 font-bold mr-2">(+)</span> pronoun + verb + complement</p>
                                      <p><span className="text-red-500 font-bold mr-2">(-)</span> pronoun + Aux:Do/Does + Not + verb + complement</p>
                                      <p><span className="text-blue-500 font-bold mr-2">(?)</span> Aux:Do/Does + pronoun + verb + complement?</p>
                                      <Separator className='my-4'/>
                                      <p className="font-sans uppercase text-xs text-muted-foreground mb-1">Short Answers:</p>
                                      <p><span className="text-green-600 font-bold mr-2">(+A)</span> Yes, pronoun + Aux:Do/Does</p>
                                      <p><span className="text-red-600 font-bold mr-2">(-A)</span> No, pronoun + Aux:Do/Does + Not</p>
                                  </div>
                              </div>

                              <div className="p-6 bg-green-50 dark:bg-green-900/10 rounded-[2rem] border-2 border-dashed border-green-500/20 text-center">
                                  <div className="flex items-center justify-center gap-2 mb-2">
                                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                                      <p className="text-green-600 font-black uppercase tracking-widest">3 - Contracciones Negativas</p>
                                  </div>
                                  <div className="flex flex-col gap-2 text-2xl font-black text-slate-900 dark:text-slate-100">
                                      <p>DO NOT = <span className="text-green-600">DON’T</span></p>
                                      <p>DOES NOT = <span className="text-green-600">DOESN’T</span></p>
                                  </div>
                              </div>
                          </CardContent>
                          <CardFooter className="justify-center border-t pt-6">
                              <Button onClick={() => handleTopicCompleteInternal('grammar')} size="lg" className="px-16 font-bold h-14 text-xl text-white">
                                  Entendido <ArrowRight className="ml-2" />
                              </Button>
                          </CardFooter>
                      </Card>
                  </div>
                );
            case 'ex-pos': return <SingleFormExercise key="ex-pos" title="Positive Form" exerciseData={posExercises} onComplete={() => handleTopicCompleteInternal('ex-pos')} vocabulary={simpleFormVocab} formType="affirmative" />;
            case 'ex-neg': return <SingleFormExercise key="ex-neg" title="Negative Form" exerciseData={negExercises} onComplete={() => handleTopicCompleteInternal('ex-neg')} vocabulary={simpleFormVocab} formType="negative" />;
            case 'ex-int': return <SingleFormExercise key="ex-int" title="Interrogative Form" exerciseData={intExercises} onComplete={() => handleTopicCompleteInternal('ex-int')} vocabulary={simpleFormVocab} formType="interrogative" />;
            case 'memory-verbs': return <VerbMemoryGame onComplete={() => handleTopicCompleteInternal('memory-verbs')} />;
            case 'ex1': return <PresentSimpleExercise key="ex1" title="Exercise 1: Multi-Form" exerciseData={ex1Prompts} onComplete={() => handleTopicCompleteInternal('ex1')} />;
            case 'ex2': return <PresentSimpleExercise key="ex2" title="Exercise 2: Multi-Form" exerciseData={ex2Prompts} onComplete={() => handleTopicCompleteInternal('ex2')} vocabulary={{"tarea": "homework", "hacer": "to do", "pizza": "pizza", "comer": "to eat" , "la compra" : "the shopping"}} />;
            case 'reading':
                const readingOk = Object.keys(readVal).length === readingData.questions.length && Object.values(readVal).every(v => v === 'correct');
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader>
                            <div className="flex justify-between items-center text-foreground">
                                <div><CardTitle>{readingData.title}</CardTitle><CardDescription className='font-bold text-foreground mt-1'>Read the text and answer the questions.</CardDescription></div>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                                    <PopoverContent className="w-64">
                                        <div className="space-y-2 text-foreground text-left">
                                            <h4 className="font-bold border-b pb-1 text-primary">Vocabulary Aide</h4>
                                            <ScrollArea className="h-48 pr-4">
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    {Object.entries(readingData.vocabulary).map(([en, es]) => (
                                                        <Fragment key={en}><span className="text-muted-foreground capitalize">{en}:</span><span className="font-semibold text-right">{es}</span></Fragment>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-4">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner text-foreground">{readingData.content}</div>
                            <Separator /><div className="space-y-4">{readingData.questions.map(q => (
                                <div key={q.id} className="space-y-2 text-foreground"><Label className='font-bold'>{q.q}</Label>
                                <Input value={readAns[q.id] || ''} onChange={e => { if (overrideStudentId) return; setReadAns({...readAns, [q.id]: e.target.value}); setReadVal({...readVal, [q.id]: 'unchecked'}); }} className={cn('mt-1 text-lg h-12 text-foreground', readVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[q.id] === 'incorrect' ? 'border-destructive bg-destructive/10' : '')} autoComplete="off" readOnly={!!overrideStudentId} /></div>
                            ))}</div>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6">
                            <Button onClick={handleCheckReading} variant="secondary">Check Answers</Button>
                            <Button onClick={() => handleTopicCompleteInternal('reading')} disabled={!readingOk && !isAdmin} className='text-white font-bold'>Continue <ArrowRight className="ml-2 h-4 w-4"/></Button>
                        </CardFooter>
                    </Card>
                );
            case 'vocab_game':
                if (isClassFinished) {
                    return (
                        <Card className="shadow-soft rounded-lg border-2 border-green-500 bg-green-500/10 p-12 text-center flex flex-col items-center animate-in fade-in zoom-in duration-500 text-foreground">
                            <Trophy className="h-24 w-24 text-yellow-400 mb-6 animate-bounce" />
                            <h2 className="text-4xl font-black uppercase text-green-600 tracking-tighter">Congratulations!</h2>
                            <p className="text-2xl mt-4 font-bold text-black">Congratulations - you finish Class 2 (A1)</p>
                            <p className='text-muted-foreground mt-2 text-lg font-medium'>Misión completada al 100%.</p>
                            <Button asChild size="lg" className="mt-8 px-12 h-12 font-bold" variant="outline">
                                <Link href="/ingles/a1/unit/1">Back to Unit <ArrowRight className="ml-2 h-5 w-5" /></Link>
                            </Button>
                        </Card>
                    );
                }
                const gameData = [...verbVocabulary.slice(0, 10), ...basicWords.slice(0, 5)].map(v => ({ spanish: v.spanish, english: [v.english] }));
                return (
                    <div className="space-y-6">
                        <VocabularyMatchingGame data={gameData} onComplete={() => {}} title="Final Vocab Game" />
                        <Card className="border-t pt-6 bg-muted/20">
                            <CardFooter className="justify-center">
                                <Button onClick={() => { setIsClassFinished(true); handleTopicCompleteInternal('vocab_game'); }} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl uppercase bg-primary hover:bg-primary/90 text-white">
                                    Finish <CheckCircle className="ml-2 h-6 w-6" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {isAdmin && overrideStudentId && (
                        <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md">
                            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400"><Star className="h-6 w-6 fill-current animate-pulse" /><p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión: {studentProfile?.name || currentUID}</p></div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors">
                                <Link href="/admin">Cerrar</Link>
                            </Button>
                        </div>
                    )}
                    <div className="mb-8 text-left text-white">
                        <Link href="/ingles/a1/unit/1" className="hover:underline text-sm font-bold flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver a la Unidad 1</Link>
                        <h1 className="text-4xl font-black uppercase tracking-tighter [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)]">Class 2 (A1) 🇬🇧</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30">
                                    <CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Misión 2A</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <nav><ul className="space-y-1">
                                        {learningPath.map((item) => {
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            const Icon = ICONS_CONFIG[item.status as keyof typeof ICONS_CONFIG] || BookOpen;
                                            const isSelected = selectedTopic === item.key || item.subItems?.some(s => s.key === selectedTopic);
                                            return (
                                                <li key={item.key}>
                                                    {!item.subItems ? (
                                                        <div onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground dark:text-white', isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', isSelected && 'bg-muted text-primary font-bold shadow-sm')}>
                                                            <div className="flex items-center gap-3">
                                                                {item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}
                                                                <span className="truncate max-w-[150px] uppercase font-bold text-[10px]">{item.name}</span>
                                                            </div>
                                                            {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1 text-foreground dark:text-white">
                                                            <div className={cn('flex items-center gap-3 px-3 py-2 text-sm font-bold uppercase text-primary tracking-tighter', isLocked && "opacity-40")}><PenSquare className="h-5 w-5" /><span>{item.name}</span></div>
                                                            <ul className="pl-6 space-y-1">{item.subItems.map(sub => {
                                                                const subLocked = sub.status === 'locked' && !isAdmin;
                                                                return (
                                                                    <li key={sub.key} onClick={() => handleTopicSelect(sub.key)} className={cn('flex items-center justify-between gap-3 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer text-foreground dark:text-white', subLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === sub.key && 'bg-muted text-primary font-bold')}>
                                                                        <div className="flex items-center gap-2">
                                                                            {sub.status === 'completed' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <PenSquare className={cn("h-4 w-4", subLocked ? "text-yellow-500/50" : "text-primary")} />}
                                                                            <span className='uppercase font-bold text-[10px]'>{sub.name}</span>
                                                                        </div>
                                                                        {subLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                                                    </li>
                                                                );
                                                            })}</ul>
                                                        </div>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul></nav>
                                    <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 font-black uppercase text-muted-foreground"><span>Avance</span><span className="text-primary">{progressValue}%</span></div><Progress value={progressValue} className="h-2 rounded-full" /></div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
