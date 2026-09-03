
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
    Check,
    X,
    Info,
    Search
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
const progressStorageVersion = 'progress_es_a1_art_gen_v6_final_fix';
const mainProgressKey = 'progress_a1_es_articulos_y_genero';

// --- DATA ---

const classVocab = [
    { en: "LAPTOP", es: "PORTÁTIL" },
    { en: "PENCIL", es: "LÁPIZ" },
    { en: "DESK", es: "ESCRITORIO" },
    { en: "CHAIR", es: "SILLA" },
    { en: "TABLE", es: "MESA" },
    { en: "ERASER", es: "BORRADOR" },
    { en: "NOTEBOOK", es: "CUADERNO" },
    { en: "PEN", es: "LAPICERO" },
    { en: "BLACKBOARD", es: "TABLERO" },
    { en: "BACKPACK", es: "MOCHILA" },
    { en: "RULER", es: "REGLA" },
    { en: "SHARPENER", es: "SACAPUNTAS" },
    { en: "GLUE", es: "PEGANTE" },
    { en: "SCISSORS", es: "TIJERAS" },
    { en: "MAP", es: "MAPA" },
    { en: "WINDOW", es: "VENTANA" },
    { en: "DOOR", es: "PUERTA" },
    { en: "FLOOR", es: "PISO" },
    { en: "WALL", es: "PARED" },
    { en: "RED", es: "ROJO" },
    { en: "BLUE", es: "AZUL" },
    { en: "GREEN", es: "VERDE" },
    { en: "YELLOW", es: "AMARILLO" },
    { en: "ORANGE", es: "NARANJA" },
    { en: "PURPLE", es: "MORADO" },
    { en: "BLACK", es: "NEGRO" },
    { en: "WHITE", es: "BLANCO" },
    { en: "GRAY", es: "GRIS" },
    { en: "BROWN", es: "MARRÓN" },
    { en: "KEY", es: "LLAVE" },
    { en: "WALLET", es: "BILLETERA" },
    { en: "PHONE", es: "TELÉFONO" },
    { en: "WATCH", es: "RELOJ" },
    { en: "BOOK", es: "LIBRO" },
    { en: "STUDENT", es: "ESTUDIANTE" },
];

const ex1Prompts = [
    { en: "The book", es: ["el libro"] },
    { en: "A chair", es: ["una silla"] },
    { en: "The tables", es: ["las mesas"] },
    { en: "Some pencils", es: ["unos lápices", "unos lapices"] },
    { en: "The windows", es: ["las ventanas"] },
    { en: "A backpack", es: ["una maleta", "una mochila"] },
    { en: "The floor", es: ["el piso"] },
    { en: "The city", es: ["la ciudad"] },
    { en: "The water", es: ["el agua"] },
    { en: "The problem", es: ["el problema"] },
];

const ex2Prompts = [
    { en: "The red pencil", es: ["el lápiz rojo", "el lapiz rojo"] },
    { en: "A blue chair", es: ["una silla azul"] },
    { en: "The green tables", es: ["las mesas verdes"] },
    { en: "Some yellow notebooks", es: ["unos cuadernos amarillos"] },
    { en: "The white door", es: ["la puerta blanca"] },
    { en: "A small eraser", es: ["un borrador pequeño", "un borrador pequeno"] },
    { en: "The black board", es: ["el tablero negro"] },
    { en: "Some gray rulers", es: ["unas reglas grises"] },
    { en: "the gray laptop", es: ["el portátil gris"] },
    { en: "The white watch", es: ["el reloj blanco"] },
];

const ex3Prompts = [
    { word: "PORTÁTIL", answer: "EL" },
    { word: "PARED", answer: "LA" },
    { word: "TABLEROS", answer: "LOS" },
    { word: "LLAVES", answer: "LAS" },
    { word: "RELOJ", answer: "EL" },
    { word: "BILLETERA", answer: "LA" },
    { word: "TELÉFONOS", answer: "LOS" },
    { word: "TIJERAS", answer: "LAS" },
    { word: "PISO", answer: "EL" },
    { word: "MOCHILA", answer: "LA" },
    { word: "CIELO", answer: "EL" },
    { word: "LUNA", answer: "LA" },
    { word: "SOL", answer: "EL" },
    { word: "ESTRELLAS", answer: "LAS" },
    { word: "FLORES", answer: "LAS" },
    { word: "CARRO", answer: "EL" },
    { word: "MANZANAS", answer: "LAS" },
    { word: "CUADERNOS", answer: "LOS" },
    { word: "REGLAS", answer: "LAS" },
    { word: "BORRADOR", answer: "EL" },
];

const readingData = {
    title: "El Salón de Clase de Ana",
    content: "En el salón de clase de Ana, hay una mesa grande y una silla azul. El tablero es blanco y las paredes son grises. Ana tiene un cuaderno rojo y unos lápices amarillos en su maleta. El borrador está sobre la mesa. Hay unas ventanas grandes y la puerta es de madera.",
    questions: [
        { id: 'q1', q: "¿De qué color es la silla?", a: ["azul"] },
        { id: 'q2', q: "¿De qué color son las paredes?", a: ["grises"] },
        { id: 'q3', q: "¿Qué tiene Ana en su maleta?", a: ["un cuaderno rojo y unos lápices amarillos", "un cuaderno y lápices", "un cuaderno y lapices"] },
        { id: 'q4', q: "¿Dónde está el borrador?", a: ["sobre la mesa", "en la mesa"] },
        { id: 'q5', q: "¿Cómo son las ventanas?", a: ["grandes"] },
    ]
};

const finalExPrompts = [
    { s: "1. ___ libro es interesante.", a: "el" },
    { s: "2. ___ sillas son cómodas.", a: "las" },
    { s: "3. Yo tengo ___ borrador.", a: "un" },
    { s: "4. ___ manzanas son rojas.", a: "las" },
    { s: "5. Ella compra ___ maleta azul.", a: "una" },
    { s: "6. ___ llaves están en la mesa.", a: "las" },
    { s: "7. Necesito ___ lápiz nuevo.", a: "un" },
    { s: "8. ___ ventanas están abiertas.", a: "las" },
    { s: "9. Él tiene ___ cuadernos grises.", a: "unos" },
    { s: "10. ___ puerta es grande.", a: "la" },
    { s: "11. ___ estudiantes son aplicados.", a: "los" },
    { s: "12. Hay ___ mapa en la pared.", a: "un" },
    { s: "13. ___ tijeras son filosas.", a: "las" },
    { s: "14. Busco ___ regla larga.", a: "una" },
    { s: "15. ___ niños juegan afuera.", a: "los" },
    { s: "16. Tienes ___ teléfono moderno.", a: "un" },
    { s: "17. ___ flores son bonitas.", a: "las" },
    { s: "18. Queremos ___ helado de chocolate.", a: "un" },
    { s: "19. ___ carros son rápidos.", a: "los" },
    { s: "20. Ella usa ___ gafas negras.", a: "unas" },
    { s: "21. ___ profesor es amable.", a: "el" },
    { s: "22. Hay ___ borrador verde.", a: "un" },
    { s: "23. ___ mochilas son pesadas.", a: "las" },
    { s: "24. Compro ___ zapato nuevo.", a: "un" },
    { s: "25. ___ gatas son pequeñas.", a: "las" },
    { s: "26. Veo ___ pájaro azul.", a: "un" },
    { s: "27. ___ reloj es antiguo.", a: "el" },
    { s: "28. Traigo ___ cajas grandes.", a: "unas" },
    { s: "29. ___ sol es amarillo.", a: "el" },
    { s: "30. ___ luna es blanca.", a: "la" },
];

const finalMissionPrompts = [
    { en: "The red book.", es: ["el libro rojo"] },
    { en: "A green chair.", es: ["una silla verde"] },
    { en: "The yellow pencils.", es: ["los lápices amarillos", "los lapices amarillos"] },
    { en: "Some blue tables.", es: ["unas mesas azules"] },
    { en: "The white wall.", es: ["la pared blanca"] },
    { en: "A black phone.", es: ["un teléfono negro", "un telefono negro"] },
    { en: "The gray erasers.", es: ["los borradores grises"] },
    { en: "Some orange notebooks.", es: ["unos cuadernos naranjas"] },
    { en: "The purple door.", es: ["la puerta morada"] },
    { en: "A small key.", es: ["una llave pequeña", "una llave pequena"] },
    { en: "The brown wallet.", es: ["la billetera marrón", "la billetera marron"] },
    { en: "Some clean windows.", es: ["unas ventanas limpias"] },
    { en: "The large blackboard.", es: ["el tablero grande"] },
    { en: "A new backpack.", es: ["una maleta nueva", "una mochila nueva"] },
    { en: "The pink flowers.", es: ["las flores rosadas", "las flores rosa"] },
];

const globalVocabMap: Record<string, string> = classVocab.reduce((acc, curr) => {
    acc[curr.es.toLowerCase()] = curr.en.toLowerCase();
    return acc;
}, {} as Record<string, string>);

const finalExVocab = {
    "interesante": "interesting", "cómodo": "comfortable", "borrador": "eraser", "llaves": "keys",
    "ventana": "window", "gris": "gray", "puerta": "door", "aplicado": "diligent", "mapa": "map",
    "tijeras": "scissors", "filoso": "sharp", "regla": "ruler", "teléfono": "phone", "flores": "flowers",
    "bonito": "pretty", "helado": "ice cream", "rápido": "fast", "gafas": "glasses", "amable": "kind",
    "pesado": "heavy", "zapato": "shoe", "pájaro": "bird", "antiguo": "ancient", "caja": "box"
};

// --- HELPER COMPONENTS ---

const FinalValidationExercise = ({ title, prompts, onComplete, vocabulary, type = 'translate', isFinal = false }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<string[]>(() => Array(prompts?.length || 0).fill(''));
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});
    const [hasValidated, setHasChecked] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        setCurrentIndex(0);
        setUserAnswers(Array(prompts?.length || 0).fill(''));
        setStatus({});
        setHasChecked(false);
        setIsFinished(false);
    }, [prompts]);

    if (!prompts || prompts.length === 0) return null;

    const isLast = currentIndex === prompts.length - 1;
    const currentPrompt = prompts[currentIndex];

    const handleCheckAll = () => {
        const newStatus: any = {};
        let allCorrect = true;

        prompts.forEach((p: any, i: number) => {
            const userVal = (userAnswers[i] || '').trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
            let isCorrect = false;
            if (type === 'translate') {
                isCorrect = p.es?.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
            } else {
                isCorrect = userVal === p.answer?.toLowerCase() || userVal === p.a?.toLowerCase();
            }
            newStatus[i] = isCorrect ? 'correct' : 'incorrect';
            if (!isCorrect) allCorrect = false;
        });

        setStatus(newStatus);
        setHasChecked(true);

        if (allCorrect) {
            toast({ title: "¡Excelente!", description: "Todas las respuestas son correctas." });
        } else {
            toast({ variant: 'destructive', title: "Revisa los errores", description: "Vuelve a las burbujas rojas para corregir." });
        }
    };

    const allAreCorrect = useMemo(() => {
        return hasValidated && Object.values(status).every(s => s === 'correct') && Object.keys(status).length === prompts.length;
    }, [status, hasValidated, prompts.length]);

    if (isFinished) {
        return (
            <Card className="shadow-soft border-2 border-green-500 bg-green-500/10 p-12 text-center flex flex-col items-center animate-in fade-in zoom-in duration-700">
                <Trophy className="h-24 w-24 text-yellow-500 mb-6 animate-bounce" />
                <h2 className="text-4xl font-black text-green-700 dark:text-green-400 uppercase tracking-tighter">¡FELICITACIONES!</h2>
                <p className="text-2xl mt-4 font-bold text-foreground">Terminaste la Clase de Artículos y Género</p>
                <Button asChild className="mt-8 px-12 h-14 text-xl font-black shadow-xl" size="lg">
                    <Link href="/espanol/a1/unit/1">Regresar a la unidad 1</Link>
                </Button>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="text-left">
                        <CardTitle className="uppercase font-black text-primary">{title}</CardTitle>
                        <CardDescription className="font-bold text-foreground mt-1">
                            {type === 'translate' ? 'Traduce la frase al español.' : 'Escribe el artículo correcto (EL, LA, LOS, LAS, UN, UNA, UNOS, UNAS).'}
                        </CardDescription>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div 
                                    key={i} 
                                    onClick={() => setCurrentIndex(i)} 
                                    className={cn(
                                        "h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", 
                                        currentIndex === i ? "border-primary ring-2 ring-primary scale-110" : "border-muted", 
                                        status[i] === 'correct' ? "bg-green-500 text-white border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : 
                                        status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : 
                                        "bg-card text-foreground"
                                    )}
                                >
                                    {i + 1}
                                </div>
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
                                    {Object.entries(vocabulary || globalVocabMap).map(([es, en]: any, i) => (
                                        <div key={i} className="flex justify-between text-[10px] border-b border-muted pb-1">
                                            <span className="text-muted-foreground text-left uppercase">{en}:</span>
                                            <span className="font-bold text-right text-primary">{(es as string).toUpperCase()}</span>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </PopoverContent>
                    </Popover>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-8 rounded-2xl border-2 border-dashed text-center font-bold text-2xl uppercase tracking-tighter text-foreground min-h-[100px] flex items-center justify-center">
                    {currentPrompt ? (currentPrompt.en || currentPrompt.word || currentPrompt.s) : '...'}
                </div>
                <Input 
                    value={userAnswers[currentIndex] || ''} 
                    onChange={e => {
                        const na = [...userAnswers]; na[currentIndex] = e.target.value; setUserAnswers(na);
                        if (status[currentIndex] && status[currentIndex] !== 'unchecked') {
                             const ns = {...status}; ns[currentIndex] = 'unchecked'; setStatus(ns);
                             setHasChecked(false);
                        }
                    }} 
                    onKeyDown={e => e.key === 'Enter' && (isLast ? handleCheckAll() : setCurrentIndex(i => i + 1))}
                    className={cn(
                        "h-14 text-xl text-foreground text-center border-2", 
                        status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/10' : 
                        status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/10' : 'border-primary'
                    )} 
                    placeholder={type === 'translate' ? "Escribe en español..." : "Artículo..."} 
                    autoComplete="off" 
                />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6 bg-muted/20">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                
                <div className="flex gap-2">
                    {isLast ? (
                        <Button onClick={handleCheckAll} variant="secondary" className="font-black px-8">Verificar Todo</Button>
                    ) : (
                        <Button onClick={() => setCurrentIndex(i => i + 1)} className="font-bold">Siguiente Frase</Button>
                    )}

                    {allAreCorrect && (
                        <Button 
                            onClick={isFinal ? () => setIsFinished(true) : onComplete} 
                            className={cn("font-black px-10 shadow-xl animate-bounce", isFinal ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/90")}
                        >
                            {isFinal ? 'Terminar' : 'Siguiente Paso'}
                        </Button>
                    )}
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

function ArticulosGeneroContent() {
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
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(classVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(classVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const [readingAns, setReadingAns] = useState<Record<string, string>>({});
    const [readingVal, setReadingVal] = useState<Record<string, any>>({});
    const [translationText, setTranslationText] = useState('');

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    
    const { data: authUserProfile } = useDoc<{ role?: string }>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string, lessonProgress?: any, progress?: any, name?: string }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: '2. Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: '3. Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: '4. Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '5. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'ex3', name: '6. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: '7. Lectura', icon: BookText, status: 'locked' },
        { key: 'final_ex', name: '8. Ejercicio Final', icon: Trophy, status: 'locked' },
        { key: 'translate_text', name: '9. Traducir Texto', icon: MessageSquare, status: 'locked' },
        { key: 'final', name: '10. Final', icon: CheckCircle, status: 'locked' },
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
        const nv = classVocab.map((item, idx) => {
            const isCorrect = item.es.toLowerCase() === (vocabAnswers[idx] || '').trim().toLowerCase();
            if (isCorrect) okCount++;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv as any);
        if (okCount >= 10) { setCanAdvanceVocab(true); toast({ title: "¡Buen avance!" }); }
        else toast({ variant: 'destructive', title: "Necesitas 10 aciertos para avanzar." });
    };

    const isReadingComplete = useMemo(() => {
        return readingData.questions.length > 0 && 
               readingData.questions.every(q => readingVal[q.id] === 'correct');
    }, [readingVal]);

    const handleCheckReading = () => {
        const nv: any = {};
        let allOk = true;
        readingData.questions.forEach((q) => {
            const userVal = (readingAns[q.id] || '').trim().toLowerCase();
            const isOk = q.a.some(ans => userVal.includes(ans.toLowerCase()));
            nv[q.id] = isOk ? 'correct' : 'incorrect';
            if (!isOk) allOk = false;
        });
        setReadingVal(nv);
        if (allOk) toast({ title: "¡Lectura superada!", description: "Pulsa CONTINUAR para desbloquear el siguiente paso." });
        else toast({ variant: 'destructive', title: "Revisa tus respuestas." });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className="text-primary uppercase tracking-tighter">Vocabulario: El Aula y Objetos</CardTitle><CardDescription className='font-bold text-foreground'>Escribe el significado en español para cada término.</CardDescription></CardHeader>
                        <CardContent className="pt-6"><ScrollArea className="h-[450px] pr-4"><div className="grid grid-cols-2 gap-4">
                            <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">English</div><div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Español</div>
                            {classVocab.map((v, i) => (<Fragment key={i}><div className="flex items-center font-bold py-1 text-sm">{v.en}</div><Input value={vocabAnswers[i]} onChange={e => { const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); setVocabValidation(vv => { const nv = [...vv]; nv[i] = 'unchecked'; return nv as any; }); setCanAdvanceVocab(false); }} className={cn("h-10 uppercase", vocabValidation[i] === 'correct' ? 'border-green-500' : vocabValidation[i] === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></Fragment>))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 bg-muted/20"><Button onClick={handleVocabCheck} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar <ArrowRight className='ml-2'/></Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-foreground text-left overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Artículos y Género</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-primary uppercase mb-4">1. Artículos Definidos (The)</h3>
                                <Table><TableHeader className='bg-muted/50'><TableRow><TableHead>Género</TableHead><TableHead>Singular</TableHead><TableHead>Plural</TableHead></TableRow></TableHeader>
                                <TableBody><TableRow><TableCell className='font-bold'>Masculino</TableCell><TableCell>EL (El libro)</TableCell><TableCell>LOS (Los libros)</TableCell></TableRow><TableRow><TableCell className='font-bold'>Femenino</TableCell><TableCell>LA (La mesa)</TableCell><TableCell>LAS (Las mesas)</TableCell></TableRow></TableBody></Table>
                            </div>
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-primary uppercase mb-4">2. Artículos Indefinidos (A / Some)</h3>
                                <Table><TableHeader className='bg-muted/50'><TableRow><TableHead>Género</TableHead><TableHead>Singular</TableHead><TableHead>Plural</TableHead></TableRow></TableHeader>
                                <TableBody><TableRow><TableCell className='font-bold'>Masculino</TableCell><TableCell>UN (Un lápiz)</TableCell><TableCell>UNOS (Unos lápices)</TableCell></TableRow><TableRow><TableCell className='font-bold'>Femenino</TableCell><TableCell>UNA (Una regla)</TableCell><TableCell>UNAS (Unas reglas)</TableCell></TableRow></TableBody></Table>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">He comprendido la gramática</Button></CardFooter>
                    </Card>
                );
            case 'ex1': return <FinalValidationExercise key="ex1" title="Ejercicio 1" prompts={ex1Prompts} onComplete={() => handleTopicComplete('ex1')} />;
            case 'ex2': return <FinalValidationExercise key="ex2" title="Ejercicio 2" prompts={ex2Prompts} onComplete={() => handleTopicComplete('ex2')} />;
            case 'vocab_game': return <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm"><CardHeader><CardTitle>Juego de Memoria</CardTitle></CardHeader><CardContent><VocabularyMatchingGame data={classVocab.slice(0, 10).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Encuentra las parejas de objetos" /></CardContent></Card>;
            case 'ex3': return <FinalValidationExercise key="ex3" title="Ejercicio 3: Artículos" type="article" prompts={ex3Prompts} onComplete={() => handleTopicComplete('ex3')} vocabulary={{"estrellas": "stars", "cuadernos": "notebooks", "carro": "car", "reglas": "rulers", "borrador": "eraser"}} />;
            case 'reading':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase font-black'>Misión: Lectura Comprensiva</CardTitle></CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-inner">{readingData.content}</div>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className='font-black text-primary uppercase text-sm'>Preguntas de Comprensión:</h3>
                                {readingData.questions.map((q) => (
                                    <div key={q.id} className="space-y-2 p-3 bg-muted/20 rounded-xl border">
                                        <Label className="font-bold">{q.q}</Label>
                                        <Input 
                                            value={readingAns[q.id] || ''} 
                                            onChange={e => { setReadingAns({...readingAns, [q.id]: e.target.value}); setReadingVal({...readingVal, [q.id]: 'unchecked'}); }} 
                                            className={cn("h-10 text-foreground", readingVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : readingVal[q.id] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} 
                                            autoComplete="off" 
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t p-6 bg-muted/10">
                            <Button onClick={handleCheckReading} variant="secondary" className="px-10 font-bold h-12">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('reading')} disabled={!isReadingComplete && !isAdmin} className="px-10 font-bold h-12 bg-primary text-white">Continuar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'final_ex':
                return <FinalValidationExercise key="final_ex" title="Ejercicio Final" type="article" prompts={finalExPrompts} onComplete={() => handleTopicComplete('final_ex')} vocabulary={finalExVocab} />;
            case 'translate_text':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader>
                            <CardTitle className='text-primary uppercase font-black'>Traducción de Texto</CardTitle>
                            <CardDescription className='font-bold text-foreground'>Traduce el siguiente párrafo al español.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-sm">"The classroom is large. There is a red pencil on the desk. The blackboard is white and the walls are gray. A student has the yellow rulers and a blue notebook. The door is brown and the floor is clean."</div>
                            <Separator />
                            <div className="space-y-2">
                                <Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label>
                                <Textarea value={translationText} onChange={(e) => setTranslationText(e.target.value)} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg leading-relaxed" />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20">
                            <Button onClick={() => { handleTopicComplete('translate_text'); setSelectedTopic('final'); }} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">
                                Siguiente Mision <ArrowRight className='ml-3 h-8 w-8' />
                            </Button>
                        </CardFooter>
                    </Card>
                );
            case 'final': 
                return <FinalValidationExercise key="final_mission" title="Final: Colores y Objetos" prompts={finalMissionPrompts} onComplete={() => handleTopicComplete('final')} vocabulary={{"libro": "book", "silla": "chair", "lápices": "pencils", "pared": "wall", "borradores": "erasers", "cuadernos": "notebooks", "llave": "key", "ventanas": "windows", "tablero": "blackboard", "maleta": "backpack", "flores": "flowers", "rosado": "pink", "marron": "brown"}} isFinal={true} />;
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
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight">Artículos y Género 🇪🇸</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
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

export default function ArticulosGeneroPage() {
    return (<Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}><ArticulosGeneroContent /></Suspense>);
}