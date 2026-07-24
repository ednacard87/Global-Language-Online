'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    GraduationCap, 
    CheckCircle, 
    Loader2, 
    ArrowRight,
    Gamepad2,
    Trophy,
    Pencil,
    BookText,
    Star,
    Activity,
    Clock,
    Search,
    User,
    Split,
    ArrowLeft,
    Check,
    X,
    Info,
    HelpCircle,
    MapPin,
    HeartPulse,
    Book,
    Scale
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/dashboard/header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { SentenceCompletionExercise, type CompletionPrompt } from '@/components/kids/exercises/sentence-completion-exercise';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_a2_eng_u1_c1_v17_fix_refs';
const mainProgressKey = 'progress_a2_eng_unit_1_class_1';

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const bodyPartsVocab = [
    { es: "PELO", en: "HAIR" }, { es: "CABEZA", en: "HEAD" }, { es: "NARIZ", en: "NOSE" },
    { es: "BOCA", en: "MOUTH" }, { es: "OREJA", en: "EAR" }, { es: "ESPALDA", en: "BACK" },
    { es: "PECHO", en: "CHEST" }, { es: "ESTOMAGO", en: "STOMACH" }, { es: "HOMBRO", en: "SHOULDER" },
    { es: "BRAZO", en: "ARM" }, { es: "CODO", en: "ELBOW" }, { es: "MANO", en: "HAND" },
    { es: "DEDO", en: "FINGER" }, { es: "MUÑECA", en: "WRIST" }, { es: "PIERNA", en: "LEG" },
    { es: "RODILLA", en: "KNEE" }, { es: "TOBILLO", en: "ANKLE" }, { es: "PIÉ / PIES", en: "FOOT / FEET" },
    { es: "DEDO DEL PIE", en: "TOE" }, { es: "HUESO", en: "BONE" },
];

const physicalVocab = {
    "delgada": "thin",
    "pelo largo": "long hair",
    "gafas": "glasses",
    "bigote": "mustache",
    "anciana": "old / elderly",
    "canosa": "gray-haired / grey-haired",
    "rubios": "blond",
    "gordo": "fat",
    "bajo": "short",
    "divertido": "funny"
};

const ex1Prompts: CompletionPrompt[] = [
    { parts: ["THERE ARE A LOT OF ANIMALS ", " THE SEA."], answers: ["IN"] },
    { parts: ["DOES SHE LIVE ", " NEW YORK?"], answers: ["IN"] },
    { parts: ["THEY ARE ", " THE AIRPORT."], answers: ["AT"] },
    { parts: ["ARE YOU ", " THE TRAIN STATION?"], answers: ["AT"] },
    { parts: ["STARS ARE ", " THE SKY."], answers: ["IN"] },
];

const ex2Prompts = [
    { spanish: "ELLA ES DELGADA Y TIENE EL PELO LARGO", answer: ["she is thin and she has long hair", "she is thin and has long hair"] },
    { spanish: "ÉL TIENE GAFAS Y UN BIGOTE", answer: ["he has glasses and a mustache"] },
    { spanish: "ELLA ES ANCIANA Y CANOSA", answer: ["she is old and gray-haired", "she is old and grey-haired"] },
    { spanish: "ELLOS SON MUY ALTOS Y RUBIOS", answer: ["they are very tall and blond", "they're very tall and blond"] },
    { spanish: "ÉL ES GORDO, BAJO Y MUY DIVERTIDO", answer: ["he is fat, short and very funny", "he's fat, short and very funny"] },
];

const error1Prompts = [
    { incorrect: "HE HAVE 20 YEARS OLD", translationHint: "He is 20 years old", correctAnswers: ["he is 20 years old", "he is twenty years old"] },
    { incorrect: "THEY IS TALLS", translationHint: "They are tall", correctAnswers: ["they are tall", "they're tall"] },
    { incorrect: "SHE IS STRAIG THAIR", translationHint: "She has straight hair", correctAnswers: ["she has straight hair"] },
    { incorrect: "SHE ARE 13 OLD YEARS", translationHint: "She is 13 years old", correctAnswers: ["she is 13 years old", "she is thirteen years old"] },
    { incorrect: "MY PARENT HAVE 50-YEAR-OLD", translationHint: "My parents are 50 years old", correctAnswers: ["my parents are 50 years old", "my parents are fifty years old"] },
];

const ex3Prompts: CompletionPrompt[] = [
    { parts: ["I LEFT MY LUGGAGE (MALETA) ", " THE CAR."], answers: ["IN"] },
    { parts: ["MY FLAT IS ", " THE TENTH FLOOR."], answers: ["ON"] },
    { parts: ["I STUDY LAW (DERECHO) ", " THE MADRID UNIVERSITY."], answers: ["AT"] },
    { parts: ["MY DOG PLAYS WITH A LITTLE BALL ", " THE SQUARE (PLAZA)."], answers: ["IN"] },
    { parts: ["IN JAPAN PEOPLE DRIVE ", " THE LEFT, THE SAME AS IN ENGLAND."], answers: ["ON"] },
];

const ex4Prompts = [
    { spanish: "¿ES NEW YORK MÁS GRANDE QUE NUESTRA CIUDAD?", answer: ["is new york bigger than our city?"] },
    { spanish: "ESTA PELÍCULA NO ES TAN INTERESANTE COMO LA OTRA (THE OTHER)", answer: ["this movie is not as interesting as the other one", "this film isn't as interesting as the other one"] },
    { spanish: "ELLOS ESTÁN EN EL AEROPUERTO CONMIGO", answer: ["they are at the airport with me", "they're at the airport with me"] },
    { spanish: "¿A DONDE VAS CON ELLOS?", answer: ["where are you going with them?", "where do you go with them?"] },
    { spanish: "ESTA ES LA CIUDAD MÁS CALIENTE DE COLOMBIA", answer: ["this is the hottest city in colombia"] },
];

const completePrompts: CompletionPrompt[] = [
    { parts: ["I HAVE READ THAT THEORY ", " A VERY OLD BOOK."], answers: ["IN"] },
    { parts: ["THEY ARE ", " A TRAIN AT THIS MOMENT."], answers: ["ON"] },
    { parts: ["SHE PUT THE BOOKS ", " THE TABLE."], answers: ["ON"] },
    { parts: ["I LIVE IN MADISON AVENUE ", " NEW YORK CITY."], answers: ["IN"] },
    { parts: ["MANY PEOPLE WORK ", " THAT BUILDING."], answers: ["IN"] },
];

const ex5Prompts = [
    { spanish: "ELLA ES MUY ALTA Y ES PELIROJA", answer: ["she is very tall and she is a redhead", "she's very tall and she is red-haired"] },
    { spanish: "ELLAS TIENEN EL PELO RUBIO, SON BAJAS Y DELGADAS", answer: ["they have blond hair, they are short and thin"] },
    { spanish: "MI TÍO ES CALVO, BAJO Y TIENE SOBREPESO", answer: ["my uncle is bald, short and he is overweight", "my uncle is bald, short and has overweight"] },
    { spanish: "ELLOS SON ALTOS, RUBIOS Y TIENEN GAFAS", answer: ["they are tall, blond and they have glasses"] },
    { spanish: "ELLA ES BAJA, con pelo castaño y es muy divertida", answer: ["she is short with brown hair and she is very funny"] },
];

const error2Prompts = [
    { incorrect: "SHE HAS THIRTY YEAR OLD", translationHint: "She is 30 years old", correctAnswers: ["she is thirty years old", "she is 30 years old"] },
    { incorrect: "SHE HAVE GLASES AND HAVE A MOUSTOCHE", translationHint: "She has glasses and has a mustache", correctAnswers: ["she has glasses and has a mustache", "she has glasses and has a moustache"] },
    { incorrect: "THEY IS 33 OLD", translationHint: "They are 33 years old", correctAnswers: ["they are 33 years old", "they're 33 years old"] },
    { incorrect: "HE HAVES GLASS AND A BEER", translationHint: "He has glasses and a beer", correctAnswers: ["he has glasses and a beer"] },
    { incorrect: "SHE IS HAIR LONG WITH EYES BLUE", translationHint: "She has long hair with blue eyes", correctAnswers: ["she has long hair with blue eyes"] },
];

const lastExPrompts = [
    { spanish: "Kevin hablará en la conferencia", answer: ["kevin will speak at the conference"] }
];

const readingContent = {
    title: "Meeting My New Friend",
    text: `I am at the park today with my new friend, Lucas. He is very tall and has short, brown hair. We are sitting on a green bench next to the lake. 

Lucas is from Brazil, so he is Brazilian. He has big green eyes and always has a smile on his face. 

In his free time, he likes to exercise at the gym. Right now, his arm hurts a little, but he is happy to be outside in the sun.`,
    questions: [
        { id: 'q1', question: "Where are they today?", answers: ["at the park", "the park"] },
        { id: 'q2', question: "How is Lucas's hair?", answers: ["short and brown", "short brown hair"] },
        { id: 'q3', question: "What hurts Lucas right now?", answers: ["his arm", "arm"] }
    ]
};

// --- HELPER COMPONENTS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => {
        setCurrentIndex(0); setAnswer(''); setStatus({});
    }, [prompts]);

    useEffect(() => {
        setAnswer('');
    }, [currentIndex]);

    const currentPrompt = prompts[currentIndex];
    if (!currentPrompt) return null;

    const handleCheck = () => {
        const userVal = answer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const corrects = currentPrompt.answer || currentPrompt.english;
        const isCorrect = corrects.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
        
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Buen trabajo!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="w-full text-left">
                        <CardTitle>{title}</CardTitle>
                        <CardDescription className='font-bold text-foreground mt-1'>Traduce la frase correctamente.</CardDescription>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0">
                                    <BookText className="mr-2 h-4 w-4" />
                                    Vocabulary
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <div className="space-y-2 text-foreground text-left">
                                    <h4 className="font-bold border-b pb-1 text-primary">Vocabulario Útil</h4>
                                    <ScrollArea className="h-48 pr-4">
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                            {Object.entries(vocabulary).map(([es, en]: any) => (
                                                <React.Fragment key={es}>
                                                    <span className="text-muted-foreground capitalize">{es}:</span>
                                                    <span className="font-semibold text-right">{en}</span>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">
                    {currentPrompt.spanish}
                </div>
                <Input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-12 text-lg text-foreground", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/5' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder="Tu traducción..." autoComplete="off" />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck} variant="secondary">Verificar</Button>
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={status[currentIndex] !== 'correct'} className="text-white font-bold">{currentIndex === prompts.length - 1 ? 'Finalizar' : 'Siguiente'}</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const ErrorCorrectionExercise = ({ prompts, onComplete, title }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setAnswer(''); }, [currentIndex]);

    const currentPrompt = prompts[currentIndex];

    const handleCheck = () => {
        const userVal = answer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const isOk = currentPrompt.correctAnswers.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
        setStatus(p => ({ ...p, [currentIndex]: isOk ? 'correct' : 'incorrect' }));
        if (isOk) toast({ title: "¡Corregido!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription className='font-bold text-foreground mt-1'>Encuentra el error y escribe la frase correcta.</CardDescription>
                <div className="flex gap-2 justify-start flex-wrap pt-4">
                    {prompts.map((_: any, i: number) => (
                        <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-6 bg-destructive/10 rounded-xl border-2 border-dashed border-destructive text-center font-bold text-lg text-destructive uppercase">
                    {currentPrompt.incorrect}
                </div>
                <Input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} placeholder="Tu corrección..." className={cn("h-12 text-lg uppercase", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/5' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck} variant="secondary">Verificar</Button>
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={status[currentIndex] !== 'correct'} className="font-bold">Siguiente</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

// --- MAIN CLASS COMPONENT ---

export default function Class1Content({ overrideStudentId }: { overrideStudentId?: string | null }) {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const searchParams = useSearchParams();

    const targetStudentId = overrideStudentId || searchParams.get('studentId');
    const currentUID = targetStudentId || user?.uid;

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const hasInitialized = useRef(false);

    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(bodyPartsVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(bodyPartsVocab.length).fill('unchecked'));
    const [readAns, setReadAns] = useState<Record<string, string>>({});
    const [readVal, setReadVal] = useState<Record<string, any>>({});

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any, name?: string}>(studentDocRef);
    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialPathData = useMemo(() => [
        { key: 'vocabulary_body', name: '1. Vocabulary (Body)', icon: Activity },
        { key: 'grammar_prepositions', name: '2. Grammar (AT-ON-IN)', icon: Clock },
        { key: 'exercise_1', name: '3. Exercise 1', icon: PenSquare },
        { key: 'grammar_description', name: '4. Grammar 2 (Physical)', icon: User },
        { key: 'exercise_2', name: '5. Exercise 2', icon: PenSquare },
        { key: 'find_mistake_1', name: '6. Find the Mistake', icon: Search },
        { key: 'exercise_3', name: '7. Exercise 3', icon: PenSquare },
        { key: 'vocab_game', name: '8. Vocabulary (Game)', icon: Gamepad2 },
        { key: 'exercise_4', name: '9. Exercise 4', icon: PenSquare },
        { key: 'complete_activity', name: '10. Complete', icon: Pencil },
        { key: 'exercise_5', name: '11. Exercise 5', icon: PenSquare },
        { key: 'find_mistake_2', name: '12. Find the Mistake 2', icon: Search },
        { key: 'reading_section', name: '13. Reading', icon: BookText },
        { key: 'differences_section', name: '14. Differences', icon: Split },
        { key: 'final_exercise', name: '15. Last Exercise', icon: Trophy },
    ], []);

    useEffect(() => {
        if (!isUserLoading && !isProfileLoading) setIsInitialLoading(false);
    }, [isUserLoading, isProfileLoading]);

    useEffect(() => {
        if (isInitialLoading || hasInitialized.current) return;
        let p = initialPathData.map((topic, i) => ({ ...topic, status: i === 0 ? 'active' : 'locked' as any }));
        const d = studentProfile?.lessonProgress?.[progressStorageVersion] || {};
        if (isAdmin && !targetStudentId) p.forEach(t => t.status = 'completed');
        else {
            p.forEach(t => { if (d[t.key]) t.status = d[t.key]; });
            let last = true;
            for (let i = 0; i < p.length; i++) { if (last && p[i].status === 'locked') p[i].status = 'active'; last = p[i].status === 'completed'; }
        }
        setLearningPath(p); setSelectedTopic(d.lastSelectedTopic || p.find(it => it.status === 'active')?.key || p[0].key);
        hasInitialized.current = true;
    }, [isInitialLoading, studentProfile, isAdmin, initialPathData, targetStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (isInitialLoading || isAdmin || !studentDocRef || targetStudentId || !hasInitialized.current) return;
        const s: any = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(t => s[t.key] = t.status);
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, targetStudentId]);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setLearningPath(curr => {
            const np = curr.map(t => ({ ...t }));
            const idx = np.findIndex(t => t.key === completedKey);
            if (idx !== -1 && np[idx].status !== 'completed') {
                np[idx].status = 'completed';
                if (idx + 1 < np.length && np[idx + 1].status === 'locked') {
                    np[idx + 1].status = 'active'; setSelectedTopic(np[idx + 1].key);
                    setTimeout(() => toast({ title: "¡Misión desbloqueada!" }), 0);
                }
            }
            return np;
        });
    }, [toast]);

    const handleTopicSelect = (key: string) => {
        const t = learningPath.find(it => it.key === key);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(key);
        if (['grammar_prepositions', 'grammar_description', 'differences_section'].includes(key)) handleTopicComplete(key);
    };

    const handleCheckVocab = () => {
        let ok = true;
        const nv = bodyPartsVocab.map((v, i) => {
            const res = v.en === (vocabAnswers[i] || '').trim().toUpperCase();
            if (!res) ok = false;
            return res ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv);
        if (ok) {
            toast({ title: "¡Vocabulario Completo!" });
            handleTopicComplete('vocabulary_body');
        } else {
            toast({ variant: 'destructive', title: "Revisa tus respuestas" });
        }
    };

    const handleCheckReading = () => {
        let allOk = true;
        const nv: any = {};
        readingContent.questions.forEach(q => {
            const userAns = (readAns[q.id] || '').trim().toLowerCase();
            const res = q.answers.some(a => userAns.includes(a.toLowerCase()));
            nv[q.id] = res ? 'correct' : 'incorrect';
            if (!res) allOk = false;
        });
        setReadVal(nv);
        if (allOk) {
            toast({ title: "¡Lectura Superada!" });
            handleTopicComplete('reading_section');
        } else {
            toast({ variant: 'destructive', title: "Revisa tus respuestas" });
        }
    };

    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic);
        if (!topic) return null;

        switch (selectedTopic) {
            case 'vocabulary_body':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><CardTitle>Vocabulary: The Body (20)</CardTitle></CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[500px] pr-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="font-black text-primary border-b pb-2 uppercase text-xs">Español</div><div className="font-black text-primary border-b pb-2 uppercase text-xs">Inglés</div>
                                    {bodyPartsVocab.map((v, i) => (
                                        <Fragment key={i}>
                                            <div className="p-3 border rounded bg-white/5 font-bold flex items-center text-sm">{v.es}</div>
                                            <Input value={vocabAnswers[i] || ''} onChange={e => { const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const nv = [...vocabValidation]; nv[i] = 'unchecked'; setVocabValidation(nv); }} className={cn("h-12 uppercase font-mono", vocabValidation[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={isAdmin && !!targetStudentId} />
                                        </Fragment>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 mt-4">
                            <Button onClick={handleCheckVocab} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary_body')} disabled={!vocabValidation.every(v => v === 'correct') && !isAdmin} className='text-white font-bold'>Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar_prepositions':
                return (
                    <div className="space-y-6 text-left text-foreground">
                        <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">GRAMMAR: AT - ON - IN</CardTitle></CardHeader>
                            <CardContent className="space-y-8 font-bold">
                                <div className="grid md:grid-cols-3 gap-4">
                                    {[
                                        { title: "AT (Point)", items: ["At home", "At the airport", "At the bus stop", "At work"] },
                                        { title: "ON (Surface)", items: ["On the table", "On the wall", "On the floor", "On the map"] },
                                        { title: "IN (Enclosed)", items: ["In the city", "In the water", "In a box", "In the sky"] }
                                    ].map((ficha, idx) => (
                                        <div key={idx} className="p-5 bg-card/80 rounded-2xl border-2 border-primary/20 shadow-lg">
                                            <h3 className="text-xl font-black text-primary uppercase mb-3">{ficha.title}</h3>
                                            <ul className="space-y-1 text-sm list-disc pl-4">{ficha.items.map(it => <li key={it}>{it}</li>)}</ul>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar_prepositions')} size="lg" className="px-12 font-bold h-12 uppercase tracking-widest">Entendido</Button></CardFooter>
                        </Card>
                    </div>
                );
            case 'exercise_1': return <SentenceCompletionExercise title="Exercise 1" description="Completa con AT, ON o IN." data={ex1Prompts} onComplete={() => handleTopicComplete('exercise_1')} />;
            case 'grammar_description':
                return (
                    <div className="space-y-6 text-left text-foreground">
                        <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">GRAMMAR 2: PHYSICAL DESCRIPTION</CardTitle></CardHeader>
                            <CardContent className="space-y-6 font-bold">
                                <div className="p-6 bg-white/40 rounded-2xl border-2 border-dashed border-primary/20">
                                    <h4 className="text-lg text-primary uppercase mb-2">1. Usamos "TO BE" (Am, Is, Are)</h4>
                                    <p className="mb-2">Para rasgos generales como altura, peso, edad o personalidad.</p>
                                    <p className="font-mono bg-muted p-2 rounded">Example: He is tall / She is thin.</p>
                                </div>
                                <div className="p-6 bg-white/40 rounded-2xl border-2 border-dashed border-primary/20">
                                    <h4 className="text-lg text-primary uppercase mb-2">2. Usamos "TO HAVE" (Have, Has)</h4>
                                    <p className="mb-2">Para partes específicas: color de ojos, tipo de pelo, barba, gafas.</p>
                                    <p className="font-mono bg-muted p-2 rounded">Example: I have blue eyes / He has glasses.</p>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar_description')} size="lg" className="px-12 font-bold h-12 uppercase">¡Listo!</Button></CardFooter>
                        </Card>
                    </div>
                );
            case 'exercise_2': return <BallsExercise title="Exercise 2: Translation" prompts={ex2Prompts} onComplete={() => handleTopicComplete('exercise_2')} vocabulary={physicalVocab} />;
            case 'find_mistake_1': return <ErrorCorrectionExercise title="Find the Mistake 1" prompts={error1Prompts} onComplete={() => handleTopicComplete('find_mistake_1')} />;
            case 'exercise_3': return <SentenceCompletionExercise title="Exercise 3" description="Completa con AT, ON o IN." data={ex3Prompts} onComplete={() => handleTopicComplete('exercise_3')} />;
            case 'vocab_game': 
                return (
                    <VocabularyMatchingGame 
                        data={bodyPartsVocab.map(v => ({ spanish: v.es, english: [v.en] }))} 
                        onComplete={() => handleTopicComplete('vocab_game')} 
                        title="Body Parts Memory" 
                    />
                );
            case 'exercise_4': return <BallsExercise title="Exercise 4: Comparisons" prompts={ex4Prompts} onComplete={() => handleTopicComplete('exercise_4')} vocabulary={{"más grande": "bigger", "que": "than", "tan": "as", "aeropuerto": "airport", "caliente": "hot / hottest"}} />;
            case 'complete_activity': return <SentenceCompletionExercise title="Complete: Place Prepositions" description="Completa con AT, ON o IN." data={completePrompts} onComplete={() => handleTopicComplete('complete_activity')} />;
            case 'exercise_5': return <BallsExercise title="Exercise 5: Detailed Description" prompts={ex5Prompts} onComplete={() => handleTopicComplete('exercise_5')} vocabulary={{"pelirroja": "redhead", "bajas": "short", "calvo": "bald", "sobrepeso": "overweight", "castaño": "brown (hair)"}} />;
            case 'find_mistake_2': return <ErrorCorrectionExercise title="Find the Mistake 2" prompts={error2Prompts} onComplete={() => handleTopicComplete('find_mistake_2')} />;
            case 'reading_section':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>{readingContent.title}</CardTitle></CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner whitespace-pre-wrap">{readingContent.text}</div>
                            <Separator /><div className="space-y-4">{readingContent.questions.map(q => (
                                <div key={q.id} className="space-y-2"><Label className='font-bold'>{q.question}</Label>
                                <Input value={readAns[q.id] || ''} onChange={e => setReadAns({...readAns, [q.id]: e.target.value})} className={cn(readVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[q.id] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={isAdmin && !!targetStudentId} /></div>
                            ))}</div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={handleCheckReading} size="lg" className="px-12 font-bold" disabled={isAdmin && !!targetStudentId}>Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'differences_section':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left text-foreground">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">GRAMMAR TIPS: DIFFERENCES</CardTitle></CardHeader>
                        <CardContent className="space-y-8 font-bold text-foreground">
                            <Accordion type="multiple" defaultValue={['verbs-1', 'verbs-2']} className="w-full">
                                <AccordionItem value="verbs-1">
                                    <AccordionTrigger className="text-xl">TO SPEAK vs TALK vs TELL vs SAY</AccordionTrigger>
                                    <AccordionContent className="space-y-4 text-base pt-2">
                                        <p><span className="text-primary font-black">SPEAK:</span> Idiomas o situaciones formales. (Speak English)</p>
                                        <p><span className="text-primary font-black">TALK:</span> Conversar informalmente. (Talk to me)</p>
                                        <p><span className="text-primary font-black">TELL:</span> Contar algo a alguien (objeto directo). (Tell me a secret)</p>
                                        <p><span className="text-primary font-black">SAY:</span> Decir algo general. (Say hello)</p>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="verbs-2">
                                    <AccordionTrigger className="text-xl">TO SEE vs LOOK vs WATCH</AccordionTrigger>
                                    <AccordionContent className="space-y-4 text-base pt-2">
                                        <p><span className="text-blue-500 font-black">SEE:</span> Percibir con los ojos (automático). (I see a bird)</p>
                                        <p><span className="text-blue-500 font-black">LOOK:</span> Mirar con atención algo fijo. (Look at the map)</p>
                                        <p><span className="text-blue-500 font-black">WATCH:</span> Observar algo en movimiento/evolución. (Watch TV)</p>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('differences_section')} size="lg" className="px-12 font-bold h-12 uppercase">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'final_exercise': return <BallsExercise title="Last Exercise" prompts={lastExPrompts} onComplete={() => handleTopicComplete('final_exercise')} vocabulary={{"conferencia": "conference"}} />;
            default: return null;
        }
    };

    if (isInitialLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-bold tracking-widest animate-pulse uppercase">Sincronizando Misión A2...</p>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Ojo Admin: Modo Supervisión */}
                    {targetStudentId && isAdmin && (
                        <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md">
                            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400">
                                <Star className="h-6 w-6 fill-current animate-pulse" />
                                <p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión Activo: {studentProfile?.name || targetStudentId}</p>
                            </div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors">
                                <Link href="/admin">Cerrar Supervisión</Link>
                            </Button>
                        </div>
                    )}
                    <div className="mb-8 text-left text-white">
                        <Link href="/ingles/a2" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver al Curso A2</Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight">Misión: Clase 1 (A2) 🇬🇧</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30">
                                    <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Misión A2</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <nav><ul className="space-y-1">
                                        {learningPath.map((item) => {
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            const Icon = ICONS_CONFIG[item.status as keyof typeof ICONS_CONFIG] || BookOpen;
                                            return (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm')}>
                                                    <div className="flex items-center gap-3">{item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}<span className="truncate max-w-[150px] text-[10px] uppercase font-bold">{item.name}</span></div>
                                                    {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
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
