'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, Fragment, Suspense } from 'react';
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
const progressStorageVersion = 'progress_es_a1_pres_reg_v47_final_label_fix';
const mainProgressKey = 'progress_a1_es_presente_simple_regulares';

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

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

const conjugationData = [
    { v: "HABLAR", forms: ["hablo", "hablas", "habla", "hablamos", "hablan"] },
    { v: "COMER", forms: ["como", "comes", "come", "comemos", "comen"] },
    { v: "VIVIR", forms: ["vivo", "vives", "vive", "vivimos", "viven"] },
    { v: "ESTUDIAR", forms: ["estudio", "estudias", "estudia", "estudiamos", "estudian"] },
    { v: "CAMINAR", forms: ["camino", "caminas", "camina", "caminamos", "caminan"] },
    { v: "CORRER", forms: ["corro", "corres", "corre", "corremos", "corren"] },
    { v: "CANTAR", forms: ["canto", "cantas", "canta", "cantamos", "cantan"] },
    { v: "BAILAR", forms: ["bailo", "bailas", "baila", "bailamos", "bailan"] },
    { v: "ESCUCHAR", forms: ["escucho", "escuchas", "escucha", "escuchamos", "escuchan"] },
    { v: "LEER", forms: ["leo", "lees", "lee", "leemos", "leen"] },
    { v: "ESCRIBIR", forms: ["escribo", "escribes", "escribe", "escribimos", "escriben"] },
    { v: "APRENDER", forms: ["aprendo", "aprendes", "aprende", "aprendemos", "aprenden"] },
    { v: "ABRIR", forms: ["abro", "abres", "abre", "abrimos", "abren"] },
    { v: "BEBER", forms: ["bebo", "bebes", "bebe", "bebemos", "beben"] },
    { v: "TRABAJAR", forms: ["trabajo", "trabajas", "trabaja", "trabajamos", "trabajan"] },
];

const ex1Prompts = [
    { en: "I speak Spanish.", answer: ["yo hablo español", "hablo español"] },
    { en: "You eat an apple.", answer: ["tú comes una manzana", "comes una manzana"] },
    { en: "He lives in Madrid.", answer: ["él vive en madrid", "el vive en madrid"] },
    { en: "We study English.", answer: ["nosotros estudiamos inglés", "estudiamos inglés"] },
    { en: "They work in a bank.", answer: ["ellos trabajan en un banco", "ellas trabajan en un banco"] },
    { en: "She walks in the park.", answer: ["ella camina en el parque", "camina en el parque"] },
    { en: "You all run fast.", answer: ["ustedes corren rápido", "ustedes corren rapido"] },
];

const ex2Prompts = [
    { en: "I sing in the shower.", answer: ["yo canto en la ducha", "canto en la ducha"] },
    { en: "You dance well.", answer: ["tú bailas bien", "tu bailas bien"] },
    { en: "He listens to music.", answer: ["él escucha música", "el escucha musica"] },
    { en: "We read a book.", answer: ["nosotros leemos un libro", "leemos un libro"] },
    { en: "They write a letter.", answer: ["ellos escriben una carta", "ellas escriben una carta"] },
    { en: "She learns Spanish.", answer: ["ella aprende español", "aprende español"] },
    { en: "I open the window.", answer: ["yo abro la ventana", "abro la ventana"] },
    { en: "You close the door.", answer: ["tú cierras la puerta", "tu cierras la puerta"] },
];

const ex3Prompts = [
    { en: "I drink water.", answer: ["yo bebo agua", "bebo agua"] },
    { en: "You understand the lesson.", answer: ["tú comprendes la lección", "tu comprendes la leccion"] },
    { en: "He buys bread.", answer: ["él compra pan", "el compra pan"] },
    { en: "We sell the car.", answer: ["nosotros vendemos el carro", "vendemos el carro"] },
    { en: "They wait for the bus.", answer: ["ellos esperan el bus", "ellas esperan el bus"] },
    { en: "She looks at the sky.", answer: ["ella mira el cielo", "mira el cielo"] },
    { en: "I call my mother.", answer: ["yo llamo a mi madre", "llamo a mi mamá", "llamo a mi mama"] },
    { en: "You help your friend.", answer: ["tú ayudas a tu amigo", "ayudas a tu amigo"] },
    { en: "We use the computer.", answer: ["nosotros usamos el computador", "usamos el computador"] },
    { en: "They clean the house.", answer: ["ellos limpian la casa", "ellas limpian la casa"] },
];

const readingData = {
    title: "Un día normal",
    content: "Hola, soy Mateo. Todos los días, yo camino al trabajo. Yo trabajo en una oficina grande. Mi amiga Laura corre en el parque por la mañana. Nosotros comemos juntos al mediodía. Por la tarde, yo leo un libro y ella escribe en su diario. Por la noche, nosotros hablamos por teléfono. ¡Es una vida tranquila!",
    questions: [
        { id: 'q1', q: "¿Qué hace Mateo todos los días?", a: ["camina al trabajo", "camina"] },
        { id: 'q2', q: "¿Dónde trabaja Mateo?", a: ["en una oficina", "oficina grande"] },
        { id: 'q3', q: "¿Qué hace Laura por la mañana?", a: ["corre en el parque", "corre"] },
        { id: 'q4', q: "¿Qué hacen Mateo y Laura al mediodía?", a: ["comen juntos", "comen"] },
        { id: 'q5', q: "¿Qué hace Mateo por la tarde?", a: ["lee un libro", "lee"] },
    ]
};

const mixedExPrompts = [
    { spanish: "Yo (hablar) _______ español.", answer: ["hablo"] },
    { spanish: "Tú (comer) _______ una pizza.", answer: ["comes"] },
    { spanish: "Él (vivir) _______ en Londres.", answer: ["vive"] },
    { spanish: "Nosotros (estudiar) _______ mucho.", answer: ["estudiamos"] },
    { spanish: "Ellos (caminar) _______ despacio.", answer: ["caminan"] },
    { spanish: "Ella (cantar) _______ muy bien.", answer: ["canta"] },
    { spanish:"Ustedes (aprender) _______ rápido.", answer: ["aprenden"] },
    { spanish: "Yo _______ (abrir) mi maleta.", answer: "abro" },
    { spanish: "Él _______ (beber) jugo de naranja.", answer: "bebe" },
    { spanish: "Nosotros _______ (correr) en el parque.", answer: "corremos" },
    { spanish: "Tú _______ (mirar) la televisión.", answer: "miras" },
    { spanish: "Ellos _______ (escribir) poemas.", answer: "escriben" },
    { spanish: "Ella _______ (bailar) salsa.", answer: "baila" },
    { spanish: "Yo _______ (escuchar) la radio.", answer: "escucho" },
    { spanish: "Nosotros _______ (vender) frutas.", answer: "vendemos" },
    { spanish: "Él _______ (ayudar) a su padre.", answer: "ayuda" },
    { spanish: "Tú _______ (usar) el celular.", answer: "usas" },
    { spanish: "Ellos _______ (cocinar) la cena.", answer: "cocinan" },
    { spanish: "Nosotros _______ (viajar) en verano.", answer: "viajamos" },
    { spanish: "Yo _______ (limpiar) el baño.", answer: "limpio" },
    { spanish: "Ella _______ (esperar) el tren.", answer: "espera" },
    { spanish: "Tú _______ (comprender) la clase.", answer: "comprendes" },
    { spanish: "Ellos _______ (llegar) temprano.", answer: "llegan" },
    { spanish: "Nosotros _______ (abrir) la puerta.", answer: "abrimos" },
    { spanish: "Yo _______ (comprar) pan.", answer: "compro" },
    { spanish: "Él _______ (partir) mañana.", answer: "parte" },
    { spanish: "Tú _______ (sufrir) mucho.", answer: "sufres" },
    { spanish: "Nosotros _______ (decidir) ahora.", answer: "decidimos" },
    { spanish: "Ellos _______ (esconder) el tesoro.", answer: "esconden" },
    { spanish: "Ella _______ (temer) a la oscuridad.", answer: "teme" },
];

const negativePrompts = [
    { en: "I do not speak English.", answer: ["no hablo inglés", "yo no hablo inglés"] },
    { en: "You do not eat meat.", answer: ["no comes carne", "tú no comes carne"] },
    { en: "He does not live here.", answer: ["no vive aquí", "él no vive aquí"] },
    { en: "We do not study today.", answer: ["no estudiamos hoy", "nosotros no estudiamos hoy"] },
    { en: "They do not work on Sunday.", answer: ["no trabajan el domingo", "ellos no trabajan el domingo"] },
    { en: "She does not learn French.", answer: ["no aprende francés", "ella no aprende francés"] },
    { en: "We do not clean.", answer: ["no limpiamos", "nosotros no limpiamos"] },
    { en: "She does not walk alone.", answer: ["ella no camina sola", "no camina sola"] },
    { en: "I do not run in the morning.", answer: ["yo no corro en la mañana", "no corro en la mañana"] },
    { en: "You do not sing.", answer: ["tú no cantas", "no cantas"] },
    { en: "He does not listen.", answer: ["él no escucha", "no escucha"] },
    { en: "We do not read.", answer: ["nosotros no leemos", "no leemos"] },
    { en: "They do not write.", answer: ["ellos no escriben", "no escriben"] },
    { en: "She does not learn French.", answer: ["ella no aprende francés", "no aprende francés"] },
    { en: "I do not open the door.", answer: ["yo no abro la puerta", "no abro la puerta"] },
    { en: "You do not drink beer.", answer: ["tú no bebes cerveza", "no bebes cerveza"] },
];

// --- HELPER COMPONENTS ---

const BlockValidationExercise = ({ title, prompts, onComplete, vocabulary, initialAns, onAnsChange, isAdmin, isSupervisionMode, showNext = true }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [valStatus, setValStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setCurrentIndex(0); setValStatus({}); }, [title]);

    const handleCheck = () => {
        const newVal: Record<number, 'correct' | 'incorrect'> = {};
        let allOk = true;
        prompts.forEach((p: any, i: number) => {
            const userVal = (initialAns[i] || '').trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
            const rawAnswers = Array.isArray(p.answer) ? p.answer : [p.answer];
            const corrects = rawAnswers.map((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' '));
            const isOk = corrects.includes(userVal);
            newVal[i] = isOk ? 'correct' : 'incorrect';
            if (!isOk) allOk = false;
        });
        setValStatus(newVal);
        if (allOk) toast({ title: "¡Excelente!", description: "Todo está correcto." });
        else toast({ variant: 'destructive', title: "Hay errores", description: "Revisa las marcas rojas en las bolitas." });
    };

    const isAllCorrect = Object.values(valStatus).length === prompts.length && Object.values(valStatus).every(v => v === 'correct');

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start text-left">
                    <div className="w-full text-foreground">
                        <CardTitle>{title}</CardTitle>
                        <CardDescription className='font-bold text-foreground mt-1'>Traduce la frase correctamente.</CardDescription>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", valStatus[i] === 'correct' ? "bg-green-500 text-white border-green-500" : valStatus[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4 text-left text-foreground">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-foreground">
                                        {Object.entries(vocabulary).map(([es, en]: any) => (<Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-semibold text-right text-primary">{(en || '').toUpperCase()}</span></Fragment>))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">
                    {prompts[currentIndex].en || prompts[currentIndex].spanish}
                </div>
                <Input value={initialAns[currentIndex] || ''} onChange={e => { if (isSupervisionMode) return; onAnsChange(currentIndex, e.target.value); setValStatus({...valStatus, [currentIndex]: 'unchecked'}); }} className={cn("h-12 text-lg text-foreground", valStatus[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/10' : valStatus[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="Tu respuesta..." autoComplete="off" readOnly={isSupervisionMode} />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    {currentIndex === prompts.length - 1 ? (
                        <>
                            {!isAllCorrect && !isSupervisionMode && <Button onClick={handleCheck} variant="secondary">Verificar</Button>}
                            <Button onClick={onComplete} disabled={!isAllCorrect && !isAdmin} className="text-white font-bold bg-primary hover:bg-primary/90">
                                {title.includes('Final') ? 'Terminar' : 'Continuar'}
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => setCurrentIndex(i => i + 1)}>Siguiente</Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
};

// --- MAIN PAGE ---

function PresenteSimpleRegularesContentInternal() {
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
    const hasInitialized = useRef(false);

    // States for content
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(regularVerbsVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(regularVerbsVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const [conjIdx, setConjIdx] = useState(0);
    const [conjAns, setConjAns] = useState<string[]>(Array(5).fill(''));
    const [conjVal, setConjVal] = useState<any[]>(Array(5).fill('unchecked'));

    const [ex1Ans, setEx1Ans] = useState<string[]>(Array(ex1Prompts.length).fill(''));
    const [ex2Ans, setEx2Ans] = useState<string[]>(Array(ex2Prompts.length).fill(''));
    const [ex3Ans, setEx3Ans] = useState<string[]>(Array(ex3Prompts.length).fill(''));
    const [mixedAns, setMixedAns] = useState<string[]>(Array(mixedExPrompts.length).fill(''));
    const [finalAns, setFinalAns] = useState<string[]>(Array(negativePrompts.length).fill(''));
    const [readAns, setReadAns] = useState<Record<string, string>>({});
    const [readVal, setReadVal] = useState<Record<string, any>>({});
    const [transText, setTransText] = useState('');
    const [isFinished, setIsFinished] = useState(false);

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
        { key: 'mixed', name: '9. Ejercicio Mixto', icon: Trophy, status: 'locked' },
        { key: 'translate_text', name: '10. Traducir Texto', icon: MessageSquare, status: 'locked' },
        { key: 'final', name: '11. Final', icon: CheckCircle, status: 'locked' },
    ], []);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    const handleTopicSelect = (key: string) => {
        const t = learningPath.find(it => it.key === key);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(key);
        if (key === 'grammar') handleTopicComplete(key);
    };

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;

        let path = initialLearningPath.map(topic => ({ ...topic }));
        const d = studentProfile.lessonProgress?.[progressStorageVersion] || {};
        
        if (isAdmin && !targetStudentId) path.forEach(t => t.status = 'completed');
        else {
            path.forEach(t => { if (d[t.key]) (t as any).status = d[t.key]; });
            let last = true;
            for(let i=0; i < path.length; i++) {
                if (last && path[i].status === 'locked') (path[i] as any).status = 'active';
                last = (path[i] as any).status === 'completed';
            }
        }

        setLearningPath(path as Topic[]);
        setSelectedTopic(d.lastSelectedTopic || path.find(p => (p as any).status === 'active')?.key || path[0].key);
        
        if (d.ex1Ans) setEx1Ans(d.ex1Ans);
        if (d.ex2Ans) setEx2Ans(d.ex2Ans);
        if (d.ex3Ans) setEx3Ans(d.ex3Ans);
        if (d.mixedAns) setMixedAns(d.mixedAns);
        if (d.finalAns) setFinalAns(d.finalAns);
        if (d.readAns) setReadAns(d.readAns);
        if (d.transText) setTransText(d.transText);
        if (d.vocabAnswers) setVocabAnswers(d.vocabAnswers);
        if (d.isFinished) setIsFinished(d.isFinished);

        setInitialLoadComplete(true);
        setTimeout(() => setIsInitialLoading(false), 200);
        hasInitialized.current = true;
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete, targetStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || targetStudentId || !hasInitialized.current || !user) return;
        const saveTimer = setTimeout(() => {
            const s: any = { 
                lastSelectedTopic: selectedTopic, 
                ex1Ans, ex2Ans, ex3Ans, mixedAns, finalAns, readAns, transText, vocabAnswers, isFinished 
            };
            learningPath.forEach(item => { s[item.key] = item.status; });
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        }, 1500);
        return () => clearTimeout(saveTimer);
    }, [learningPath, progressValue, studentDocRef, initialLoadComplete, selectedTopic, isInitialLoading, ex1Ans, ex2Ans, ex3Ans, mixedAns, finalAns, readAns, transText, targetStudentId, vocabAnswers, isFinished, isAdmin, user, studentProfile]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(curr => {
            let next: string | null = null; const np = [...curr];
            const i = np.findIndex(t => t.key === topicToComplete);
            if (i !== -1 && np[i].status !== 'completed') {
                np[i].status = 'completed';
                if (i + 1 < np.length && np[i + 1].status === 'locked') { (np[i + 1] as any).status = 'active'; next = np[i + 1].key; }
            }
            if (next) { const n = next; setTimeout(() => { toast({ title: "¡Misión completada!" }); setSelectedTopic(n); }, 0); }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleCheckVocab = () => {
        let allOk = true;
        const nv = regularVerbsVocab.map((v, i) => {
            const res = v.es.toLowerCase() === (vocabAnswers[i] || '').trim().toLowerCase();
            if (!res) allOk = false;
            return res ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv);
        setCanAdvanceVocab(allOk);
        if (allOk) toast({ title: "¡Excelente!", description: "Vocabulario completado al 100%." });
        else toast({ variant: 'destructive', title: "Hay errores", description: "Revisa los campos en rojo." });
    };

    const handleConjCheck = () => {
        const verb = conjugationData[conjIdx];
        const corrects = verb.forms;
        const nv = conjAns.map((a, i) => a.trim().toLowerCase() === corrects[i] ? 'correct' : 'incorrect');
        setConjVal(nv);
        if (nv.every(st => st === 'correct')) {
            toast({ title: "¡Perfecto!" });
            if (conjIdx < conjugationData.length - 1) {
                setTimeout(() => { setConjIdx(p => p+1); setConjAns(Array(5).fill('')); setConjVal(Array(5).fill('unchecked')); }, 800);
            } else handleTopicComplete('conjugation');
        } else toast({ variant: 'destructive', title: "Revisa la conjugación" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>Vocabulario: Verbos Regulares</CardTitle><CardDescription className='font-bold text-foreground'>Escribe la traducción al español de cada verbo.</CardDescription></CardHeader>
                        <CardContent className='pt-6'><ScrollArea className="h-[500px] pr-4"><div className="grid grid-cols-2 gap-4">
                            <div className="font-black text-primary border-b pb-2 uppercase text-xs">Inglés</div><div className="font-black text-primary border-b pb-2 uppercase text-xs">Español</div>
                            {regularVerbsVocab.map((v, i) => (
                                <Fragment key={i}>
                                    <div className="p-3 border rounded bg-white/5 font-bold flex items-center text-sm">{v.en}</div>
                                    <Input 
                                        value={vocabAnswers[i] || ''} 
                                        onChange={e => { if (targetStudentId) return; const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const nv = [...vocabValidation]; nv[i] = 'unchecked'; setVocabValidation(nv); setCanAdvanceVocab(false); }} 
                                        className={cn("uppercase", vocabValidation[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} 
                                        autoComplete="off" 
                                        readOnly={!!targetStudentId} 
                                    />
                                </Fragment>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-between border-t pt-6 bg-muted/20">
                            <Button onClick={handleCheckVocab} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold bg-primary'>Continuar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-foreground text-left overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Presente Simple Regulares</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-primary uppercase mb-4">1. Verbos en -AR (Ej: Hablar)</h3>
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
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">He comprendido la gramática</Button></CardFooter>
                    </Card>
                );
            case 'conjugation':
                const curV = conjugationData[conjIdx];
                const pronouns = ["Yo", "Tú", "Él/Ella", "Nosotros", "Ellos/Ellas"];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tighter'>Misión: Conjugación Regular ({conjIdx+1}/{conjugationData.length})</CardTitle></CardHeader>
                        <CardContent className="space-y-8 pt-8 flex flex-col items-center">
                            <div className="p-8 bg-gradient-to-br from-primary/5 to-brand-purple/5 rounded-[2.5rem] border-2 border-dashed border-primary/20 text-center"><h3 className="text-5xl font-black text-primary uppercase tracking-tighter">{curV.v}</h3></div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl'>
                                {pronouns.map((p, i) => (
                                    <div key={i} className='space-y-1'><Label className='text-[10px] font-black uppercase text-muted-foreground'>{p}</Label><Input value={conjAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...conjAns]; na[i] = e.target.value; setConjAns(na); const nv = [...conjVal]; nv[i] = 'unchecked'; setConjVal(nv); }} className={cn("h-10 text-lg uppercase transition-all", conjVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : conjVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-8 bg-muted/5"><Button onClick={handleConjCheck} size="lg" className="px-20 font-black h-14 text-xl shadow-xl uppercase">Verificar Verbo</Button></CardFooter>
                    </Card>
                );
            case 'ex1': return <BlockValidationExercise key="ex1" title="Ejercicio 1" prompts={ex1Prompts} initialAns={ex1Ans} onAnsChange={(i: number, v: string) => { const na = [...ex1Ans]; na[i] = v; setEx1Ans(na); }} onComplete={() => handleTopicComplete('ex1')} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={{"hablar": "speak", "manzana": "apple", "vivir": "live", "estudiar": "study", "trabajar": "work"}} />;
            case 'ex2': return <BlockValidationExercise key="ex2" title="Ejercicio 2" prompts={ex2Prompts} initialAns={ex2Ans} onAnsChange={(i: number, v: string) => { const na = [...ex2Ans]; na[i] = v; setEx2Ans(na); }} onComplete={() => handleTopicComplete('ex2')} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={{"cantar": "sing", "ducha": "shower", "bailar": "dance", "escuchar": "listen", "escribir": "write"}} />;
            case 'vocab_game': return <VocabularyMatchingGame data={regularVerbsVocab.slice(0, 10).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Memory Game: Verbos Regulares" />;
            case 'ex3': return <BlockValidationExercise key="ex3" title="Ejercicio 3" prompts={ex3Prompts} initialAns={ex3Ans} onAnsChange={(i: number, v: string) => { const na = [...ex3Ans]; na[i] = v; setEx3Ans(na); }} onComplete={() => handleTopicComplete('ex3')} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={{"beber": "drink", "comprar": "buy", "vender": "sell", "esperar": "wait", "mirar": "look"}} />;
            case 'reading':
                const readingOk = Object.values(readVal).length === readingData.questions.length && Object.values(readVal).every(v => v === 'correct');
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary font-black uppercase'>{readingData.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner text-foreground">{readingData.content}</div>
                            <Separator /><div className="space-y-4 text-foreground">{readingData.questions.map(q => (
                                <div key={q.id} className="space-y-2"><Label className='font-bold text-foreground'>{q.q}</Label><Input value={readAns[q.id] || ''} onChange={e => { if (targetStudentId) return; setReadAns({...readAns, [q.id]: e.target.value}); setReadVal({...readVal, [q.id]: 'unchecked'}); }} className={cn('h-12 text-foreground', readVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[q.id] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                            ))}</div>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6">
                            <Button onClick={() => {
                                let ok = true; const nv: any = {};
                                readingData.questions.forEach(q => {
                                    const userAns = (readAns[q.id] || '').trim().toLowerCase();
                                    const isOk = q.a.some(a => userAns.includes(a.toLowerCase()));
                                    nv[q.id] = isOk ? 'correct' : 'incorrect'; if (!isOk) ok = false;
                                });
                                setReadVal(nv); if (ok) toast({ title: "¡Lectura correcta!" }); else toast({ variant: 'destructive', title: "Revisa las respuestas" });
                            }} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('reading')} disabled={!readingOk && !isAdmin} className="font-bold text-white bg-primary px-8">Continuar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'mixed': return <BlockValidationExercise key="mixed" title="Ejercicio Mixto" prompts={mixedExPrompts} initialAns={mixedAns} onAnsChange={(i: number, v: string) => { const na = [...mixedAns]; na[i] = v; setMixedAns(na); }} onComplete={() => handleTopicComplete('mixed')} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={{"hablar": "speak", "comer": "eat", "vivir": "live", "estudiar": "study"}} />;
            case 'translate_text':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'>
                            <div className='flex justify-between items-center w-full text-foreground'>
                                <div><CardTitle className='text-foreground'>Traducción de Texto</CardTitle><CardDescription className='font-bold text-foreground mt-1'>Traduce el párrafo al español.</CardDescription></div>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                                    <PopoverContent className="w-64"><ScrollArea className="h-48 pr-4 text-left text-foreground"><div className="grid grid-cols-2 gap-2 text-sm text-foreground">{Object.entries({"office": "oficina", "together": "juntos", "noon": "mediodía", "diary": "diario", "night": "noche"}).map(([en, es]) => (<Fragment key={en}><span className="text-muted-foreground capitalize font-bold">{en}:</span><span className="font-semibold text-right text-primary">{es.toUpperCase()}</span></Fragment>))}</div></ScrollArea></PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6 text-foreground">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed shadow-sm text-foreground text-black dark:text-white">"I work in a big office. My friend Laura runs in the park in the morning. We eat together at noon. In the afternoon, I read a book and she writes in her diary. At night, we speak on the phone."</div>
                            <Separator /><div className="space-y-2 text-foreground"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={transText} onChange={(e) => { if (isAdmin && targetStudentId) return; setTransText(e.target.value); }} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg text-foreground" readOnly={isAdmin && !!targetStudentId} /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20 text-foreground">
                            <Button onClick={() => handleTopicComplete('translate_text')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Siguiente Misión <ArrowRight className='ml-3 h-8 w-8' /></Button>
                        </CardFooter>
                    </Card>
                );
            case 'final':
                if (isFinished) {
                    return (
                        <Card className="shadow-soft border-2 border-green-500 bg-green-50/10 p-12 text-center flex flex-col items-center text-foreground">
                            <Trophy className="h-24 w-24 text-yellow-400 mb-6 animate-bounce" />
                            <h2 className="text-4xl font-black uppercase text-green-600 tracking-tighter">¡FELICITACIONES!</h2>
                            <p className="text-2xl mt-4 font-bold">tu completaste esta clase Presente Simple Regulares</p>
                            <p className='text-muted-foreground mt-2 text-lg'>Misión completada al 100%.</p>
                            <Button asChild className="mt-8 px-12 h-12 font-bold" variant="outline"><Link href="/espanol/a1">Regresar a Ruta A1</Link></Button>
                        </Card>
                    );
                }
                return <BlockValidationExercise key="final" title="Reto Final: Negativos" prompts={negativePrompts} initialAns={finalAns} onAnsChange={(i: number, v: string) => { const na = [...finalAns]; na[i] = v; setFinalAns(na); }} onComplete={() => { if (isAdmin && targetStudentId) return; setIsFinished(true); handleTopicComplete('final'); }} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={{"no hablo": "do not speak", "carne": "meat", "domingo": "Sunday", "sola": "alone", "mañana": "morning"}} showNext={false} />;
            default: return null;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {isAdmin && targetStudentId && (
                        <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md">
                            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400">
                                <Star className="h-6 w-6 fill-current animate-pulse" />
                                <p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión: {studentProfile?.name || targetStudentId}</p>
                            </div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors">
                                <Link href="/admin">Cerrar</Link>
                            </Button>
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
                        <div className="md:col-span-3 md:order-2 order-1 text-left text-foreground">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30">
                                    <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2 text-foreground"><Trophy className="h-5 w-5 text-primary" /> Misión A1</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <nav><ul className="space-y-1">
                                        {learningPath.map((item) => {
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            const Icon = ICONS_CONFIG[item.status as keyof typeof ICONS_CONFIG] || BookOpen;
                                            const isActive = item.status === 'active';
                                            return (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm', isActive && !isAdmin && 'animate-pulse-glow')}>
                                                    <div className="flex items-center gap-3">
                                                        {item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}
                                                        <span className="truncate max-w-[150px] text-[10px] uppercase font-bold text-black dark:text-white">{item.name}</span>
                                                    </div>
                                                    {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                                </li>
                                            );
                                        })}
                                    </ul></nav>
                                    <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 font-black uppercase text-muted-foreground"><span>Avance Clase</span><span className="text-primary">{progressValue}%</span></div><Progress value={progressValue} className="h-2 rounded-full" /></div>
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
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}>
            <PresenteSimpleRegularesContentInternal />
        </Suspense>
    );
}
