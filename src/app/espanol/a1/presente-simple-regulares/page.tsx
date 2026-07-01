'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense, Fragment } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    GraduationCap, 
    CheckCircle, 
    Gamepad2, 
    BookText, 
    Trophy,
    ArrowLeft,
    ArrowRight,
    Star,
    Loader2,
    MessageSquare,
    Pencil,
    Activity,
    Check,
    X,
    Info,
    ListChecks
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { Textarea } from '@/components/ui/textarea';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_a1_pres_reg_v5_full_content';
const mainProgressKey = 'progress_a1_es_presente_simple_regulares';

// --- DATA ---

const regularVerbsVocab = [
    { en: "TO SPEAK", es: "HABLAR" }, { en: "TO EAT", es: "COMER" }, { en: "TO LIVE", es: "VIVIR" },
    { en: "TO STUDY", es: "ESTUDIAR" }, { en: "TO WORK", es: "TRABAJAR" }, { en: "TO WALK", es: "CAMINAR" },
    { en: "TO RUN", es: "CORRER" }, { en: "TO JUMP", es: "SALTAR" }, { en: "TO SING", es: "CANTAR" },
    { en: "TO DANCE", es: "BAILAR" }, { en: "TO LISTEN", es: "ESCUCHAR" }, { en: "TO READ", es: "LEER" },
    { en: "TO WRITE", es: "ESCRIBIR" }, { en: "TO LEARN", es: "APRENDER" }, { en: "TO TEACH", es: "ENSEÑAR" },
    { en: "TO OPEN", es: "ABRIR" }, { en: "TO CLOSE", es: "CERRAR" }, { en: "TO DRINK", es: "BEBER" },
    { en: "TO UNDERSTAND", es: "COMPRENDER" }, { en: "TO BUY", es: "COMPRAR" }, { en: "TO SELL", es: "VENDER" },
    { en: "TO WAIT", es: "ESPERAR" }, { en: "TO LOOK", es: "MIRAR" }, { en: "TO CALL", es: "LLAMAR" },
    { en: "TO HELP", es: "AYUDAR" }, { en: "TO USE", es: "USAR" }, { en: "TO CLEAN", es: "LIMPIAR" },
    { en: "TO COOK", es: "COCINAR" }, { en: "TO TRAVEL", es: "VIAJAR" }, { en: "TO ARRIVE", es: "LLEGAR" },
    { en: "TO LEAVE", es: "PARTIR" }, { en: "TO SUFFER", es: "SUFRIR" }, { en: "TO DECIDE", es: "DECIDIR" },
    { en: "TO EXIST", es: "EXISTIR" }, { en: "TO ALLOW", es: "PERMITIR" }, { en: "TO DISCOVER", es: "DESCUBRIR" },
    { en: "TO RESPOND", es: "RESPONDER" }, { en: "TO PROMISE", es: "PROMETER" }, { en: "TO HIDE", es: "ESCONDER" },
    { en: "TO FEAR", es: "TEMER" }
];

const conjugationVerbsList = [
    { v: "HABLAR", type: "ar" }, { v: "COMER", type: "er" }, { v: "VIVIR", type: "ir" },
    { v: "ESTUDIAR", type: "ar" }, { v: "CAMINAR", type: "ar" }, { v: "CORRER", type: "er" },
    { v: "CANTAR", type: "ar" }, { v: "BAILAR", type: "ar" }, { v: "ESCUCHAR", type: "ar" },
    { v: "LEER", type: "er" }, { v: "ESCRIBIR", type: "ir" }, { v: "APRENDER", type: "er" },
    { v: "ABRIR", type: "ir" }, { v: "BEBER", type: "er" }, { v: "TRABAJAR", type: "ar" }
];

const ex1Prompts = [
    { en: "I speak Spanish.", es: ["yo hablo español", "hablo español"] },
    { en: "You eat an apple.", es: ["tú comes una manzana", "comes una manzana"] },
    { en: "He lives in Madrid.", es: ["él vive en madrid", "el vive en madrid"] },
    { en: "We study English.", es: ["nosotros estudiamos inglés", "estudiamos inglés"] },
    { en: "They work in a bank.", es: ["ellos trabajan en un banco", "ellas trabajan en un banco"] },
    { en: "She walks in the park.", es: ["ella camina en el parque", "camina en el parque"] },
    { en: "You all run fast.", es: ["ustedes corren rápido", "ustedes corren rapido"] },
];

const ex2Prompts = [
    { en: "I sing in the shower.", es: ["yo canto en la ducha", "me canto en la ducha"] },
    { en: "You dance well.", es: ["tú bailas bien", "tu bailas bien"] },
    { en: "He listens to music.", es: ["él escucha música", "el escucha musica"] },
    { en: "We read a book.", es: ["nosotros leemos un libro", "leemos un libro"] },
    { en: "They write a letter.", es: ["ellos escriben una carta", "ellas escriben una carta"] },
    { en: "She learns Spanish.", es: ["ella aprende español", "aprende español"] },
    { en: "I open the window.", es: ["yo abro la ventana", "abro la ventana"] },
    { en: "You close the door.", es: ["tú cierras la puerta", "tu cierras la puerta"] },
];

const ex3Prompts = [
    { en: "I drink water.", es: ["yo bebo agua", "bebo agua"] },
    { en: "You understand the lesson.", es: ["tú comprendes la lección", "tu comprendes la leccion"] },
    { en: "He buys bread.", es: ["él compra pan", "el compra pan"] },
    { en: "We sell the car.", es: ["nosotros vendemos el carro", "vendemos el carro"] },
    { en: "They wait for the bus.", es: ["ellos esperan el bus", "ellas esperan el bus"] },
    { spanish: "ella mira el cielo", en: "She looks at the sky." },
    { en: "I call my mother.", es: ["yo llamo a mi madre", "llamo a mi mamá", "llamo a mi mama"] },
    { en: "You help your friend.", es: ["tú ayudas a tu amigo", "ayudas a tu amigo"] },
    { en: "We use the computer.", es: ["nosotros usamos el computador", "usamos el computador"] },
    { en: "They clean the house.", es: ["ellos limpian la casa", "ellas limpian la casa"] },
];

const readingData = {
    title: "Un día normal",
    content: "Hola, soy Mateo. Todos los días, yo camino al trabajo. Yo trabajo en una oficina grande. Mi amiga Laura corre en el parque por la mañana. Nosotros comemos juntos al mediodía. Por la tarde, yo leo un libro y ella escribe en su diario. Por la noche, nosotros hablamos por teléfono. ¡Es una vida tranquila!",
    questions: [
        { q: "¿Qué hace Mateo todos los días?", a: ["camina al trabajo", "camina"] },
        { q: "¿Dónde trabaja Mateo?", a: ["en una oficina", "oficina grande"] },
        { q: "¿Qué hace Laura por la mañana?", a: ["corre en el parque", "corre"] },
        { q: "¿Qué hacen Mateo y Laura al mediodía?", a: ["comen juntos", "comen"] },
        { q: "¿Qué hace Mateo por la tarde?", a: ["lee un libro", "lee"] },
    ]
};

const finalExPrompts = [
    { s: "1. Yo _______ (hablar) español.", a: "hablo" },
    { s: "2. Tú _______ (comer) una pizza.", a: "comes" },
    { s: "3. Él _______ (vivir) en Londres.", a: "vive" },
    { s: "4. Nosotros _______ (estudiar) mucho.", a: "estudiamos" },
    { s: "5. Ellos _______ (caminar) despacio.", a: "caminan" },
    { s: "6. Ella _______ (cantar) muy bien.", a: "canta" },
    { s: "7. Ustedes _______ (aprender) rápido.", a: "aprenden" },
    { s: "8. Yo _______ (abrir) mi maleta.", a: "abro" },
    { s: "9. Él _______ (beber) jugo de naranja.", a: "bebe" },
    { s: "10. Nosotros _______ (correr) en el parque.", a: "corremos" },
    { s: "11. Tú _______ (mirar) la televisión.", a: "miras" },
    { s: "12. Ellos _______ (escribir) poemas.", a: "escriben" },
    { s: "13. Ella _______ (bailar) salsa.", a: "baila" },
    { s: "14. Yo _______ (escuchar) la radio.", a: "escucho" },
    { s: "15. Nosotros _______ (vender) frutas.", a: "vendemos" },
    { s: "16. Él _______ (ayudar) a su padre.", a: "ayuda" },
    { s: "17. Tú _______ (usar) el celular.", a: "usas" },
    { s: "18. Ellos _______ (cocinar) la cena.", a: "cocinan" },
    { s: "19. Nosotros _______ (viajar) en verano.", a: "viajamos" },
    { s: "20. Yo _______ (limpiar) el baño.", a: "limpio" },
    { s: "21. Ella _______ (esperar) el tren.", a: "espera" },
    { s: "22. Tú _______ (comprender) la clase.", a: "comprendes" },
    { s: "23. Ellos _______ (llegar) temprano.", a: "llegan" },
    { s: "24. Nosotros _______ (abrir) la puerta.", a: "abrimos" },
    { s: "25. Yo _______ (comprar) pan.", a: "compro" },
    { s: "26. Él _______ (partir) mañana.", a: "parte" },
    { s: "27. Tú _______ (sufrir) mucho.", a: "sufres" },
    { s: "28. Nosotros _______ (decidir) ahora.", a: "decidimos" },
    { s: "29. Ellos _______ (esconder) el tesoro.", a: "esconden" },
    { s: "30. Ella _______ (temer) a la oscuridad.", a: "teme" },
];

const negativePrompts = [
    { en: "I do not speak English.", es: ["yo no hablo inglés", "no hablo inglés"] },
    { en: "You do not eat meat.", es: ["tú no comes carne", "no comes carne"] },
    { en: "He does not live here.", es: ["él no vive aquí", "no vive aquí"] },
    { en: "We do not study today.", es: ["nosotros no estudiamos hoy", "no estudiamos hoy"] },
    { en: "They do not work on Sunday.", es: ["ellos no trabajan el domingo", "no trabajan el domingo"] },
    { en: "She does not walk alone.", es: ["ella no camina sola", "no camina sola"] },
    { en: "I do not run in the morning.", es: ["yo no corro en la mañana", "no corro en la mañana"] },
    { en: "You do not sing.", es: ["tú no cantas", "no cantas"] },
    { en: "He does not listen.", es: ["él no escucha", "no escucha"] },
    { en: "We do not read.", es: ["nosotros no leemos", "no leemos"] },
    { en: "They do not write.", es: ["ellos no escriben", "no escriben"] },
    { en: "She does not learn French.", es: ["ella no aprende francés", "no aprende francés"] },
    { en: "I do not open the door.", es: ["yo no abro la puerta", "no abro la puerta"] },
    { en: "You do not drink beer.", es: ["tú no bebes cerveza", "no bebes cerveza"] },
    { en: "We do not clean.", es: ["nosotros no limpiamos", "no limpiamos"] },
];

// --- HELPER COMPONENTS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setAnswer(''); }, [currentIndex]);

    const handleCheck = () => {
        const userVal = answer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const isCorrect = prompts[currentIndex].es.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Buen trabajo!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="text-left">
                        <CardTitle>{title}</CardTitle>
                        <CardDescription className="font-bold text-foreground mt-1">Traduce la frase al español.</CardDescription>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse">
                                <BookText className="mr-2 h-4 w-4" /> Vocabulario
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64">
                            <ScrollArea className="h-64 pr-4">
                                <div className="space-y-2 text-foreground text-left">
                                    <h4 className='font-black text-primary text-xs uppercase mb-2 border-b'>Ayuda de Misión</h4>
                                    {Object.entries(vocabulary || {}).map(([en, es]: any, i) => (
                                        <div key={i} className="flex justify-between text-[10px] border-b border-muted pb-1">
                                            <span className="text-muted-foreground text-left uppercase">{en}:</span>
                                            <span className="font-bold text-right text-primary">{es.toUpperCase()}</span>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </PopoverContent>
                    </Popover>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">
                    {prompts[currentIndex].en}
                </div>
                <Input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-12 text-lg text-foreground", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/5' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder="Escribe en español..." autoComplete="off" />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck} variant="secondary">Verificar</Button>
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={status[currentIndex] !== 'correct'} className="font-bold text-white">Siguiente</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

// --- MAIN PAGE ---

interface Topic {
    key: string;
    name: string;
    icon: React.ElementType;
    status: 'locked' | 'active' | 'completed';
}

function PresenteSimpleRegularesContent() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const targetStudentId = searchParams.get('studentId');
    const currentUID = targetStudentId || user?.uid;

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // States for content
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(regularVerbsVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(regularVerbsVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const [conjIdx, setConjIdx] = useState(0);
    const [conjAnswers, setConjAnswers] = useState<string[]>(Array(5).fill(''));
    const [conjValidation, setConjValidation] = useState<any[]>(Array(5).fill('unchecked'));

    const [finalExAns, setFinalExAns] = useState<string[]>(Array(finalExPrompts.length).fill(''));
    const [finalExVal, setFinalExVal] = useState<any[]>(Array(finalExPrompts.length).fill('unchecked'));

    const [readingAns, setReadingAns] = useState<string[]>(Array(readingData.questions.length).fill(''));
    const [readingVal, setReadingVal] = useState<any[]>(Array(readingData.questions.length).fill('unchecked'));

    const [translationText, setTranslationText] = useState('');

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    
    const { data: authUserProfile } = useDoc<{ role?: string }>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string, lessonProgress?: any, progress?: any, name?: string }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: '2. Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'conjugation', name: '3. Conjugación', icon: Pencil, status: 'locked' },
        { key: 'ex1', name: '4. Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: '5. Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'ex3', name: '7. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: '8. Lectura', icon: BookText, status: 'locked' },
        { key: 'final_ex', name: '9. Ejercicio Final', icon: Trophy, status: 'locked' },
        { key: 'translate_text', name: '10. Traducir Texto', icon: MessageSquare, status: 'locked' },
        { key: 'final', name: '11. Final', icon: CheckCircle, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;

        let path = initialLearningPath.map(topic => ({ ...topic }));
        let savedST = '';

        if (isAdmin && !targetStudentId) {
            path.forEach(item => { item.status = 'completed'; });
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedData = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => { if (savedData[item.key]) item.status = savedData[item.key]; });
            savedST = savedData.lastSelectedTopic || '';
        }

        let lastDone = true;
        for (let i = 0; i < path.length; i++) {
            if (lastDone && path[i].status === 'locked') path[i].status = 'active';
            lastDone = path[i].status === 'completed';
        }

        setLearningPath(path);
        setSelectedTopic(savedST || path.find(p => p.status === 'active')?.key || path[0].key);
        setInitialLoadComplete(true);
        setTimeout(() => setIsInitialLoading(false), 800);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete, targetStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || targetStudentId) return;
        const s: Record<string, any> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => { s[item.key] = item.status; });
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, isInitialLoading, targetStudentId]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(currentPath => {
            let win = false; let next: string | null = null;
            const newPath = currentPath.map(t => ({ ...t }));
            const idx = newPath.findIndex(t => t.key === topicToComplete);
            if (idx !== -1 && newPath[idx].status !== 'completed') {
                newPath[idx].status = 'completed';
                if (idx + 1 < newPath.length && newPath[idx + 1].status === 'locked') {
                    newPath[idx + 1].status = 'active'; win = true; next = newPath[idx + 1].key;
                }
            }
            if (win) setTimeout(() => toast({ title: "¡Siguiente misión desbloqueada!" }), 0);
            if (next) { const n = next; setTimeout(() => setSelectedTopic(n), 0); }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (topicKey === 'grammar') handleTopicComplete(topicKey);
    };

    const handleTopicComplete = (completedKey: string) => {
        setTopicToComplete(completedKey);
    };

    const handleVocabCheck = () => {
        let okCount = 0;
        const nv = regularVerbsVocab.map((item, idx) => {
            const isCorrect = item.es.toLowerCase() === (vocabAnswers[idx] || '').trim().toLowerCase();
            if (isCorrect) okCount++;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv as any);
        if (okCount >= 10) { setCanAdvanceVocab(true); toast({ title: "¡Buen avance!" }); }
        else toast({ variant: 'destructive', title: "Necesitas 10 aciertos para avanzar." });
    };

    const handleConjCheck = () => {
        const verb = conjugationVerbsList[conjIdx];
        const v = verb.v.toLowerCase();
        const base = v.slice(0, -2);
        const ending = verb.type;

        let corrects: string[] = [];
        if (ending === 'ar') {
            corrects = [base + 'o', base + 'as', base + 'a', base + 'amos', base + 'an'];
        } else if (ending === 'er') {
            corrects = [base + 'o', base + 'es', base + 'e', base + 'emos', base + 'en'];
        } else {
            corrects = [base + 'o', base + 'es', base + 'e', base + 'imos', base + 'en'];
        }

        const nv = conjAnswers.map((a, i) => a.trim().toLowerCase() === corrects[i] ? 'correct' : 'incorrect');
        setConjValidation(nv as any);

        if (nv.every(st => st === 'correct')) {
            toast({ title: "¡Perfecto!" });
            if (conjIdx < conjugationVerbsList.length - 1) {
                setConjIdx(prev => prev + 1);
                setConjAnswers(Array(5).fill(''));
                setConjValidation(Array(5).fill('unchecked'));
            } else {
                handleTopicComplete('conjugation');
            }
        } else {
            toast({ variant: 'destructive', title: "Revisa la conjugación" });
        }
    };

    const handleCheckReading = () => {
        let allOk = true;
        const nv = readingData.questions.map((q, i) => {
            const isOk = q.a.some(ans => (readingAns[i] || '').trim().toLowerCase().includes(ans.toLowerCase()));
            if (!isOk) allOk = false;
            return isOk ? 'correct' : 'incorrect';
        });
        setReadingVal(nv as any);
        if (allOk) { toast({ title: "¡Lectura superada!" }); handleTopicComplete('reading'); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas." });
    };

    const handleCheckFinalEx = () => {
        let okCount = 0;
        const nv = finalExPrompts.map((q, i) => {
            const isOk = q.a.toLowerCase() === (finalExAns[i] || '').trim().toLowerCase();
            if (isOk) okCount++;
            return isOk ? 'correct' : 'incorrect';
        });
        setFinalExVal(nv as any);
        if (okCount === finalExPrompts.length) { toast({ title: "¡Dominio Total!" }); handleTopicComplete('final_ex'); }
        else toast({ variant: 'destructive', title: "Hay errores en la lista." });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className="text-primary uppercase tracking-tighter">Vocabulario: Verbos Regulares (40)</CardTitle><CardDescription className='font-bold text-foreground'>Escribe el significado en español para cada verbo.</CardDescription></CardHeader>
                        <CardContent className="pt-6"><ScrollArea className="h-[450px] pr-4"><div className="grid grid-cols-2 gap-4">
                            <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">English</div><div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Español</div>
                            {regularVerbsVocab.map((v, i) => (<Fragment key={i}><div className="flex items-center font-bold py-1 text-sm">{v.en}</div><Input value={vocabAnswers[i]} onChange={e => { const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); setVocabValidation(vv => { const nv = [...vv]; nv[i] = 'unchecked'; return nv as any; }); setCanAdvanceVocab(false); }} className={cn("h-10 uppercase", vocabValidation[i] === 'correct' ? 'border-green-500' : vocabValidation[i] === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></Fragment>))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 bg-muted/20"><Button onClick={handleVocabCheck} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar <ArrowRight className='ml-2'/></Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-foreground text-left overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Presente Simple Regulares</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-primary uppercase mb-4">1. Verbos en -AR (Ej: Hablar)</h3>
                                <p className="mb-4 text-muted-foreground">La raíz se mantiene igual, solo cambia la terminación.</p>
                                <Table><TableHeader className='bg-muted/50'><TableRow><TableHead>Pronombre</TableHead><TableHead>Sufijo</TableHead><TableHead>Ejemplo</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    <TableRow><TableCell className='font-bold'>Yo</TableCell><TableCell>-O</TableCell><TableCell>HablO</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Tú</TableCell><TableCell>-AS</TableCell><TableCell>HablAS</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Él / Ella</TableCell><TableCell>-A</TableCell><TableCell>HablA</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Nosotros</TableCell><TableCell>-AMOS</TableCell><TableCell>HablAMOS</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Ellos / Ellas</TableCell><TableCell>-AN</TableCell><TableCell>HablAN</TableCell></TableRow>
                                </TableBody></Table>
                            </div>
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-primary uppercase mb-4">2. Verbos en -ER (Ej: Comer)</h3>
                                <Table><TableHeader className='bg-muted/50'><TableRow><TableHead>Pronombre</TableHead><TableHead>Sufijo</TableHead><TableHead>Ejemplo</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    <TableRow><TableCell className='font-bold'>Yo</TableCell><TableCell>-O</TableCell><TableCell>ComO</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Tú</TableCell><TableCell>-ES</TableCell><TableCell>ComES</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Él / Ella</TableCell><TableCell>-E</TableCell><TableCell>ComE</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Nosotros</TableCell><TableCell>-EMOS</TableCell><TableCell>ComEMOS</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Ellos / Ellas</TableCell><TableCell>-EN</TableCell><TableCell>ComEN</TableCell></TableRow>
                                </TableBody></Table>
                            </div>
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-primary uppercase mb-4">3. Verbos en -IR (Ej: Vivir)</h3>
                                <Table><TableHeader className='bg-muted/50'><TableRow><TableHead>Pronombre</TableHead><TableHead>Sufijo</TableHead><TableHead>Ejemplo</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    <TableRow><TableCell className='font-bold'>Yo</TableCell><TableCell>-O</TableCell><TableCell>VivO</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Tú</TableCell><TableCell>-ES</TableCell><TableCell>VivES</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Él / Ella</TableCell><TableCell>-E</TableCell><TableCell>VivE</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Nosotros</TableCell><TableCell>-IMOS</TableCell><TableCell>VivIMOS</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Ellos / Ellas</TableCell><TableCell>-EN</TableCell><TableCell>VivEN</TableCell></TableRow>
                                </TableBody></Table>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">He comprendido la gramática</Button></CardFooter>
                    </Card>
                );
            case 'conjugation':
                const curVerb = conjugationVerbsList[conjIdx];
                const pronouns = ["Yo", "Tú", "Él/Ella", "Nosotros", "Ellos/Ellas"];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'>
                            <div className="flex justify-between items-center w-full">
                                <div>
                                    <CardTitle className='text-primary uppercase tracking-tighter'>Misión: Conjugación</CardTitle>
                                    <CardDescription>Completa la tabla de verbos regulares ({conjIdx + 1}/15)</CardDescription>
                                </div>
                                <div className='px-4 py-1 bg-primary/10 rounded-full border border-primary/20 text-xs font-bold text-primary uppercase'>
                                    Grupo -{curVerb.type.toUpperCase()}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-8 pt-8">
                            <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-primary/5 to-brand-purple/5 rounded-[2.5rem] border-2 border-dashed border-primary/20">
                                <span className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Verbo a conjugar</span>
                                <h3 className="text-5xl md:text-6xl font-black text-primary uppercase tracking-tighter drop-shadow-sm">
                                    {curVerb.v}
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                                {pronouns.map((p, i) => (
                                    <div key={i} className="space-y-1.5">
                                        <div className="flex justify-between px-1">
                                            <Label className="text-xs font-black uppercase text-muted-foreground">{p}</Label>
                                            {conjValidation[i] === 'correct' && <Check className="h-3 w-3 text-green-500" />}
                                            {conjValidation[i] === 'incorrect' && <X className="h-3 w-3 text-red-500" />}
                                        </div>
                                        <Input 
                                            value={conjAnswers[i]} 
                                            onChange={e => { 
                                                const na = [...conjAnswers]; 
                                                na[i] = e.target.value; 
                                                setConjAnswers(na); 
                                                setConjValidation(vv => { const nvv = [...vv]; nvv[i] = 'unchecked'; return nvv as any; }); 
                                            }} 
                                            className={cn(
                                                "h-12 text-lg font-bold border-2 transition-all", 
                                                conjValidation[i] === 'correct' ? 'border-green-500 bg-green-50/5 focus-visible:ring-green-500' : 
                                                conjValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/5 focus-visible:ring-red-500' : 
                                                'border-muted focus-visible:ring-primary'
                                            )} 
                                            placeholder="..."
                                            autoComplete="off" 
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-8 bg-muted/5">
                            <Button 
                                onClick={handleConjCheck} 
                                size="lg" 
                                className="px-20 font-black h-14 text-xl shadow-xl transition-all active:scale-95 group"
                            >
                                Verificar Verbo <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </CardFooter>
                    </Card>
                );
            case 'ex1': return <BallsExercise title="Ejercicio 1" prompts={ex1Prompts} onComplete={() => handleTopicComplete('ex1')} vocabulary={{ "Spanish": "español", "apple": "manzana", "Madrid": "Madrid", "English": "inglés", "bank": "banco", "park": "parque", "fast": "rápido" }} />;
            case 'ex2': return <BallsExercise title="Ejercicio 2" prompts={ex2Prompts} onComplete={() => handleTopicComplete('ex2')} vocabulary={{ "sing": "cantar", "shower": "ducha", "dance": "bailar", "well": "bien", "listen": "escuchar", "music": "música", "read": "leer", "letter": "carta", "learn": "aprender", "window": "ventana", "door": "puerta" }} />;
            case 'vocab_game': return <Card className="shadow-soft border-2 border-brand-purple bg-card/95"><CardHeader><CardTitle>Juego de Memoria</CardTitle></CardHeader><CardContent><VocabularyMatchingGame data={regularVerbsVocab.slice(0, 10).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Encuentra las parejas de verbos" /></CardContent></Card>;
            case 'ex3': return <BallsExercise title="Ejercicio 3" prompts={ex3Prompts} onComplete={() => handleTopicComplete('ex3')} vocabulary={{ "drink": "beber", "water": "agua", "understand": "comprender", "lesson": "lección", "buy": "comprar", "bread": "pan", "sell": "vender", "car": "carro", "wait": "esperar", "bus": "bus", "look": "mirar", "sky": "cielo", "mother": "madre", "friend": "amigo", "computer": "computador", "house": "casa" }} />;
            case 'reading':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tight'>{readingData.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-inner">{readingData.content}</div>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className='font-black text-primary uppercase text-sm'>Preguntas de Comprensión:</h3>
                                {readingData.questions.map((q, i) => (
                                    <div key={i} className="space-y-2 p-3 bg-muted/20 rounded-xl border"><Label className="font-bold">{q.q}</Label><Input value={readingAns[i]} onChange={e => { const na = [...readingAns]; na[i] = e.target.value; setReadingVal(v => { const nv = [...v]; nv[i] = 'unchecked'; return nv as any; }); }} className={cn("h-10", readingVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : readingVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" /></div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/10"><Button onClick={handleCheckReading} size="lg" className="px-16 font-black h-12 shadow-md">Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'final_ex':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tight'>Ejercicio Final: Completar Frases (30)</CardTitle></CardHeader>
                        <CardContent className="p-0"><ScrollArea className="h-[450px] p-6"><div className="space-y-4">
                            {finalExPrompts.map((q, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm"><p className="font-bold text-lg">{q.s}</p><Input value={finalExAns[i]} onChange={e => { const na = [...finalExAns]; na[i] = e.target.value; setFinalExAns(na); setFinalExVal(v => { const nv = [...v]; nv[i] = 'unchecked'; return nv as any; }); }} className={cn("h-10 max-w-[150px] text-lg font-mono", finalExVal[i] === 'correct' ? 'border-green-500' : finalExVal[i] === 'incorrect' ? 'border-red-500' : '')} placeholder="Respuesta..." autoComplete="off" /></div>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/20"><Button onClick={handleCheckFinalEx} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">Verificar Todo</Button></CardFooter>
                    </Card>
                );
            case 'translate_text':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><div className="flex justify-between items-center"><div><CardTitle className='text-primary uppercase'>Traducción de Texto: Rutina Regular</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el siguiente párrafo al español.</CardDescription></div><Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger><PopoverContent className="w-64"><ScrollArea className="h-48 pr-4"><div className="space-y-2">{Object.entries({ "work": "trabajar", "office": "oficina", "together": "juntos", "noon": "mediodía", "write": "escribir", "daily": "diario", "night": "noche" }).map(([en, es], i) => (<div key={i} className="flex justify-between text-xs border-b pb-1"><span className="text-muted-foreground">{en}:</span><span className="font-bold text-primary">{es}</span></div>))}</div></ScrollArea></PopoverContent></Popover></div></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-sm">"I work in a big office. My friend Laura runs in the park in the morning. We eat together at noon. In the afternoon, I read a book and she writes in her diary. At night, we speak on the phone."</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={translationText} onChange={(e) => setTranslationText(e.target.value)} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg leading-relaxed" /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20"><Button onClick={() => handleTopicComplete('translate_text')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Siguiente Misión <ArrowRight className='ml-3 h-8 w-8' /></Button></CardFooter>
                    </Card>
                );
            case 'final': return <BallsExercise title="Final: Frases Negativas" prompts={negativePrompts} onComplete={() => handleTopicComplete('final')} vocabulary={{ "meat": "carne", "alone": "sola", "here": "aquí", "today": "hoy", "Sunday": "domingo", "morning": "mañana" }} />;
            default: return null;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {targetStudentId && isAdmin && (
                        <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md">
                            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400"><Star className="h-6 w-6 fill-current animate-pulse" /><p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión Activo: {studentProfile?.name || targetStudentId}</p></div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors"><Link href="/admin">Cerrar Supervisión</Link></Button>
                        </div>
                    )}
                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/a1" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver al Curso A1</Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3">
                           <Activity className='h-10 w-10 text-primary' /> Presente Simple Regulares 🇪🇸
                        </h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30"><CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Misión A1</CardTitle></CardHeader>
                                <CardContent className="p-4">
                                    <nav><ul className="space-y-1">
                                        {learningPath.map((item) => {
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            const isSelected = selectedTopic === item.key;
                                            const Icon = item.icon;
                                            return (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', isSelected && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm')}>
                                                    <div className="flex items-center gap-3">{item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}<span className="truncate max-w-[150px]">{item.name}</span></div>
                                                    {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                                </li>
                                            );
                                        })}
                                    </ul></nav>
                                    <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 font-black uppercase tracking-widest text-muted-foreground"><span>Progreso Clase</span><span className="text-primary">{progressValue}%</span></div><Progress value={progressValue} className="h-2 rounded-full" /></div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function PresenteSimpleRegularesPage() {
    return (<Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}><PresenteSimpleRegularesContent /></Suspense>);
}
