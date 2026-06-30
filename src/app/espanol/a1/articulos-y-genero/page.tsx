
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
const progressStorageVersion = 'progress_es_a1_art_gen_v3_expanded_content';
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
    { en: "BACKPACK", es: "MALETA" },
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
    { word: "MALETA", answer: "LA" },
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
        { q: "¿De qué color es la silla?", a: ["azul"] },
        { q: "¿De qué color son las paredes?", a: ["grises"] },
        { q: "¿Qué tiene Ana en su maleta?", a: ["un cuaderno rojo y unos lápices amarillos", "un cuaderno y lápices", "un cuaderno y lapices"] },
        { q: "¿Dónde está el borrador?", a: ["sobre la mesa", "en la mesa"] },
        { q: "¿Cómo son las ventanas?", a: ["grandes"] },
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

const translationVocabHelp = {
    "classroom": "salón de clase", "large": "grande", "red pencil": "lápiz rojo", "desk": "escritorio",
    "blackboard": "tablero", "white": "blanco", "walls": "paredes", "gray": "gris",
    "student": "estudiante", "yellow rulers": "reglas amarillas", "blue notebook": "cuaderno azul",
    "door": "puerta", "brown": "marrón", "floor": "piso", "clean": "limpio"
};

// --- HELPER COMPONENTS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary, type = 'translate' }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => {
        setAnswer('');
    }, [currentIndex]);

    const handleCheck = () => {
        const userVal = answer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        let isCorrect = false;
        
        if (type === 'translate') {
            isCorrect = prompts[currentIndex].es.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
        } else {
            isCorrect = userVal === prompts[currentIndex].answer.toLowerCase();
        }
        
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
                        <CardDescription className="font-bold text-foreground mt-1">
                            {type === 'translate' ? 'Traduce la frase al español.' : 'Escribe el artículo correcto (EL, LA, LOS, LAS).'}
                        </CardDescription>
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
                                    {Object.entries(vocabulary || globalVocabMap).map(([es, en]: any, i) => (
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
                    {type === 'translate' ? prompts[currentIndex].en : prompts[currentIndex].word}
                </div>
                <Input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-12 text-lg text-foreground", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/5' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder={type === 'translate' ? "Escribe en español..." : "Artículo..."} autoComplete="off" />
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

    const [readingAns, setReadingAns] = useState<string[]>(Array(readingData.questions.length).fill(''));
    const [readingVal, setReadingVal] = useState<any[]>(Array(readingData.questions.length).fill('unchecked'));

    const [finalExAns, setFinalExAns] = useState<string[]>(Array(finalExPrompts.length).fill(''));
    const [finalExVal, setFinalExVal] = useState<any[]>(Array(finalExPrompts.length).fill('unchecked'));

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
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4">
                                <h3 className="text-xl font-black text-primary uppercase mb-2">3. Excepciones de Género y Artículos</h3>
                                <div className='grid gap-4 md:grid-cols-2'>
                                    <div className='p-4 bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 rounded-r-xl'>
                                        <h4 className='font-bold text-yellow-800 dark:text-yellow-400'>A tónica inicial:</h4>
                                        <p className="text-sm italic">Palabras femeninas que empiezan con "a" o "ha" tónica usan <strong>EL</strong> en singular para evitar la cacofonía.</p>
                                        <p className='text-xs font-mono mt-1'>Ej: El agua / Las aguas, El águila / Las águilas.</p>
                                    </div>
                                    <div className='p-4 bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 rounded-r-xl'>
                                        <h4 className='font-bold text-blue-800 dark:text-blue-400'>Palabras en -MA:</h4>
                                        <p className="text-sm italic">Muchas palabras de origen griego terminadas en -ma son <strong>masculinas</strong>.</p>
                                        <p className='text-xs font-mono mt-1'>Ej: El problema, el tema, el sistema, el idioma, el mapa.</p>
                                    </div>
                                    <div className='p-4 bg-pink-50 dark:bg-pink-900/10 border-l-4 border-pink-500 rounded-r-xl'>
                                        <h4 className='font-bold text-pink-800 dark:text-pink-400'>Terminaciones Femeninas:</h4>
                                        <p className="text-sm italic">Palabras terminadas en <strong>-dad, -tad, -ción, -sión</strong> suelen ser femeninas.</p>
                                        <p className='text-xs font-mono mt-1'>Ej: La ciudad, la libertad, la canción, la televisión.</p>
                                    </div>
                                    <div className='p-4 bg-orange-50 dark:bg-orange-900/10 border-l-4 border-orange-500 rounded-r-xl'>
                                        <h4 className='font-bold text-orange-800 dark:text-orange-400'>Irregulares comunes:</h4>
                                        <ul className='text-xs font-mono space-y-1 mt-1'>
                                            <li>El día (Termina en -a pero es masculino)</li>
                                            <li>La mano (Termina en -o pero es femenina)</li>
                                            <li>La radio / La foto / La moto</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">He comprendido la gramática</Button></CardFooter>
                    </Card>
                );
            case 'ex1': return <BallsExercise title="Ejercicio 1" prompts={ex1Prompts} onComplete={() => handleTopicComplete('ex1')} />;
            case 'ex2': return <BallsExercise title="Ejercicio 2" prompts={ex2Prompts} onComplete={() => handleTopicComplete('ex2')} />;
            case 'vocab_game': return <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm"><CardHeader><CardTitle>Juego de Memoria</CardTitle></CardHeader><CardContent><VocabularyMatchingGame data={classVocab.slice(0, 10).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Encuentra las parejas de objetos" /></CardContent></Card>;
            case 'ex3': return <BallsExercise title="Ejercicio 3: ¿Qué artículo es?" type="article" prompts={ex3Prompts} onComplete={() => handleTopicComplete('ex3')} vocabulary={{"estrellas": "stars", "cuadernos": "notebooks", "carro": "car", "reglas": "rulers", "borrador": "eraser"}} />;
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
                        <CardHeader className='bg-primary/5 border-b'>
                            <div className="flex justify-between items-center w-full">
                                <CardTitle className='text-primary uppercase tracking-tight'>Ejercicio Final: Completar Frases (30)</CardTitle>
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
                                                {Object.entries(finalExVocab).map(([es, en]: any, i) => (
                                                    <div key={i} className="flex justify-between text-[10px] border-b border-muted pb-1">
                                                        <span className="text-muted-foreground text-left uppercase">{es}:</span>
                                                        <span className="font-bold text-right text-primary">{en.toUpperCase()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
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
                        <CardHeader><div className="flex justify-between items-center"><div><CardTitle className='text-primary uppercase'>Traducción de Texto</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el siguiente párrafo al español.</CardDescription></div><Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger><PopoverContent className="w-64"><ScrollArea className="h-48 pr-4"><div className="space-y-2">{Object.entries(translationVocabHelp).map(([en, es], i) => (<div key={i} className="flex justify-between text-xs border-b pb-1"><span className="text-muted-foreground">{en}:</span><span className="font-bold text-primary">{es}</span></div>))}</div></ScrollArea></PopoverContent></Popover></div></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-sm">"The classroom is large. There is a red pencil on the desk. The blackboard is white and the walls are gray. A student has the yellow rulers and a blue notebook. The door is brown and the floor is clean."</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={translationText} onChange={(e) => setTranslationText(e.target.value)} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg leading-relaxed" /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20"><Button onClick={() => handleTopicComplete('translate_text')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Terminar Misión <Trophy className='ml-3 h-8 w-8' /></Button></CardFooter>
                    </Card>
                );
            case 'final': return <BallsExercise title="Final: Colores y Objetos" prompts={finalMissionPrompts} onComplete={() => handleTopicComplete('final')} vocabulary={{"libro": "book", "silla": "chair", "lápices": "pencils", "pared": "wall", "borradores": "erasers", "cuadernos": "notebooks", "llave": "key", "ventanas": "windows", "tablero": "blackboard", "maleta": "backpack", "flores": "flowers", "rosado": "pink", "marron": "brown"}} />;
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
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', isSelected && 'bg-muted text-primary font-black border-l-4 border-primary')}>
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