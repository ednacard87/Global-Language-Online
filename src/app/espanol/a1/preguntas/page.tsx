
'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense, Fragment, useRef } from 'react';
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
    HelpCircle,
    Globe,
    Pencil,
    Activity
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
import { Textarea } from '@/components/ui/textarea';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_a1_preguntas_v95_final_syntax_fix';
const mainProgressKey = 'progress_a1_es_preguntas';

const ICONS_CONFIG: Record<string, React.ElementType> = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const vocabularyData = [
    { en: "WHAT?", es: "QUÉ" },
    { en: "WHEN?", es: "CUÁNDO" },
    { en: "WHERE?", es: "DÓNDE" },
    { en: "WHO?", es: "QUIÉN" },
    { en: "WHICH?", es: "CUÁL" },
    { en: "WHY?", es: "POR QUÉ" },
    { en: "HOW?", es: "CÓMO" },
    { en: "HOW OLD?", es: "CUÁNTOS AÑOS" },
    { en: "HOW MUCH?", es: "CUÁNTO" },
    { en: "HOW MANY?", es: "CUÁNTOS" },
    { en: "WHAT KIND OF?", es: "QUÉ TIPO DE" },
    { en: "WHOSE?", es: "DE QUIÉN" },
    { en: "TO WORK", es: "TRABAJAR" },
    { en: "TO STUDY", es: "ESTUDIAR" },
    { en: "TO COOK", es: "COCINAR" },
    { en: "TO EAT", es: "COMER" },
    { en: "TO SLEEP", es: "DORMIR" },
    { en: "TO READ", es: "LEER" },
    { en: "TO WALK", es: "CAMINAR" },
    { en: "TO PLAY", es: "JUGAR" },
    { en: "TO CLEAN", es: "LIMPIAR" },
    { en: "TO LISTEN", es: "ESCUCHAR" },
    { en: "TODAY", es: "HOY" },
    { en: "TOMORROW", es: "MAÑANA" },
    { en: "NOW", es: "AHORA" },
    { en: "EARLY", es: "TEMPRANO" },
    { en: "LATE", es: "TARDE" },
    { en: "MORNING", es: "MAÑANA (M)" },
    { en: "AFTERNOON", es: "TARDE (A)" },
    { en: "NIGHT", es: "NOCHE" },
    { en: "FRIEND", es: "AMIGO" },
    { en: "MOTHER", es: "MADRE" },
    { en: "FATHER", es: "PADRE" },
    { en: "BROTHER", es: "HERMANO" },
    { en: "SISTER", es: "HERMANA" },
    { en: "COUSIN", es: "PRIMO" },
    { en: "UNCLE", es: "TÍO" },
    { en: "AUNT", es: "TÍA" },
    { en: "STUDENT", es: "ESTUDIANTE" },
    { en: "TEACHER", es: "PROFESOR" },
    { en: "GOOD", es: "BUENO" },
    { en: "BAD", es: "MALO" },
    { en: "INTERESTING", es: "INTERESANTE" },
    { en: "BORING", es: "ABURRIDO" },
    { en: "DIFFICULT", es: "DIFÍCIL" },
    { en: "EASY", es: "FÁCIL" },
    { en: "HAPPY", es: "FELIZ" },
    { en: "SAD", es: "TRISTE" },
    { en: "FUN", es: "DIVERTIDO" },
    { en: "IMPORTANT", es: "IMPORTANTE" },
];

const ex1Prompts = [
    { en: "How are you today?", answer: ["¿Cómo estás hoy?", "como estas hoy"] },
    { en: "Who is your best friend?", answer: ["¿Quién es tu mejor amigo?", "quien es tu mejor amigo"] },
    { en: "Where do you live now?", answer: ["¿Dónde vives ahora?", "donde vives ahora"] },
    { en: "What do you do in the afternoon?", answer: ["¿Qué haces en la tarde?", "que haces en la tarde"] },
    { en: "When is your birthday?", answer: ["¿Cuándo es tu cumpleaños?", "cuando es tu cumpleaños"] },
    { en: "Why are you happy?", answer: ["¿Por qué estás feliz?", "por que estas feliz"] },
    { en: "What do you want to eat today?", answer: ["¿Qué quieres comer hoy?", "que quieres comer hoy"] },
];

const ex2Prompts = [
    { en: "What time is it?", answer: ["¿Qué hora es?", "que hora es"] },
    { en: "Where is your father now?", answer: ["¿Dónde está tu padre ahora?", "donde esta tu padre ahora"] },
    { en: "When do you cook dinner?", answer: ["¿Cuándo cocinas la cena?", "cuando cocinas la cena"] },
    { en: "Who studies with her?", answer: ["¿Quién estudia con ella?", "quien estudia con ella"] },
    { en: "How do you go to school?", answer: ["¿Cómo vas a la escuela?", "como vas a la escuela"] },
    { en: "Why is the book boring?", answer: ["¿Por qué el libro es aburrido?", "por que el libro es aburrido"] },
    { en: "What do you drink in the morning?", answer: ["¿Qué bebes en la mañana?", "que bebes en la mañana"] },
];

const ex3Prompts = [
    { en: "Who is that tall man?", answer: ["¿Quién es ese hombre alto?", "quien es ese hombre alto"] },
    { en: "Why don't you study English?", answer: ["¿Por qué no estudias inglés?", "por que no estudias ingles"] },
    { en: "Where do you buy the food?", answer: ["¿Dónde compras la comida?", "donde compras la comida"] },
    { en: "When do you travel to Spain?", answer: ["¿Cuándo viajas a España?", "cuando viajas a españa"] },
    { en: "How old are you?", answer: ["¿Cuántos años tienes?", "cuantos años tienes"] },
    { en: "What kind of music do you listen to?", answer: ["¿Qué tipo de música escuchas?", "que tipo de musica escuchas"] },
    { en: "How is your new house?", answer: ["¿Cómo es tu nueva casa?", "como es tu nueva casa"] },
    { en: "Where are you from?", answer: ["¿De dónde eres tú?", "de donde eres", "de donde eres tu"] },
    { en: "What do you want to do later?", answer: ["¿Qué quieres hacer luego?", "que quieres hacer luego"] },
    { en: "Who cooks in your house?", answer: ["¿Quién cocina en tu casa?", "quien cocina en tu casa"] },
];

const readingData = {
    title: "Una entrevista interesante",
    content: "Hola, soy Marta y soy periodista. Hoy tengo una entrevista con un estudiante nuevo. Se llama Liam y es de Canadá. Liam, ¿cuándo estudias español? Liam responde: 'Estudio en la mañana'. ¿Por qué quieres aprender español? 'Porque es muy importante para mi trabajo'. ¿Dónde vives ahora? 'Vivo en un apartamento pequeño con mi hermano'. Liam es muy amigable y trabajador.",
    questions: [
        { id: 'q1', q: "¿De dónde es Liam?", a: ["canadá", "de canadá"] },
        { id: 'q2', q: "¿CUÁNDO estudia Liam español?", a: ["en la mañana", "mañana"] },
        { id: 'q3', q: "¿POR QUÉ quiere aprender Liam español?", a: ["importante para su trabajo", "trabajo"] },
        { id: 'q4', q: "¿DÓNDE vive Liam ahora?", a: ["en un apartamento", "apartamento pequeño"] },
        { id: 'q5', q: "¿CÓMO es Liam?", a: ["amigable y trabajador", "amigable"] },
    ]
};

const mixedExPrompts = [
    { en:  "1. ¿_______ es tu nombre?", answer: "cuál" },
    { en:  "2. ¿_______ vives?", answer: "dónde" },
    { en:  "3. ¿_______ es ese hombre?", answer: "quién" },
    { en:  "4. ¿_______ vas a la fiesta?", answer: "cuándo" },
    { en:  "5. ¿_______ estás triste hoy?", answer: "por qué" },
    { en:  "6. ¿_______ cuesta este libro?", answer: "cuánto" },
    { en:  "7. ¿_______ estás hoy?", answer: "cómo" },
    { en:  "8. ¿_______ es tu deporte favorito?", answer: "cuál" },
    { en:  "9. ¿_______ son ellos?", answer: "quiénes" },
    { en:  "10. ¿_______ haces en tu tiempo libre?", answer: "qué" },
    { en:  "11. ¿_______ vive tu hermana?", answer: "dónde" },
    { en:  "12. ¿_______ es tu película favorita?", answer: "cuál" },
    { en:  "13. ¿_______ cocinas la cena?", answer: "cuándo" },
    { en:  "14. ¿_______ no comes carne?", answer: "por qué" },
    { en:  "15. ¿_______ años tienes?", answer: "cuántos" },
    { en:  "16. ¿_______ es tu profesor?", answer: "quién" },
    { en:  "17. ¿_______ está el gato?", answer: "dónde" },
    { en:  "18. ¿_______ viajas a Londres?", answer: "cuándo" },
    { en:  "19. ¿_______ es esto?", answer: "qué" },
    { en:  "20. ¿_______ estás tan feliz?", answer: "por qué" },
    { en:  "21. ¿_______ vas al gimnasio?", answer: "cómo" },
    { en:  "22. ¿_______ dinero necesitas?", answer: "cuánto" },
    { en:  "23. ¿_______ son tus llaves?", answer: "cuáles" },
    { en:  "24. ¿_______ es tu color favorito?", answer: "cuál" },
    { en:  "25. ¿_______ duermes en la tarde?", answer: "por qué" },
    { en:  "26. ¿_______ es tu madre?", answer: "quién" },
    { en:  "27. ¿_______ está el supermercado?", aanswer: "dónde" },
    { en:  "28. ¿_______ estudias inglés?", answer: "cuándo" },
    { en:  "29. ¿_______ haces ahora?", answer: "qué" },
    { en:  "30. ¿_______ es tu hermano?", answer: "cómo" },
];

const negativePrompts = [
    { en: "Why don't you study?", answer: ["¿por qué no estudias?", "porque no estudias"] },
    { en: "Aren't you happy?", answer: ["¿no estás feliz?", "no estas feliz"] },
    { en: "Isn't she your sister?", answer: ["¿no es ella tu hermana?", "¿no es tu hermana?"] },
    { en: "Don't they work today?", answer: ["¿no trabajan ellos hoy?", "¿no trabajan hoy?"] },
    { en: "Why isn't he here?", answer: ["¿por qué no está él aquí?", "¿por que no esta aqui?"] },
    { en: "Don't you want to eat?", answer: ["¿no quieres comer?"] },
    { en: "Why don't we go now?", answer: ["¿por qué no vamos ahora?", "¿por que no vamos ahora?"] },
    { en: "Isn't the book interesting?", answer: ["¿no es interesante el libro?", "¿el libro no es interesante?"] },
    { en: "Aren't they your cousins?", answer: ["¿no son ellos tus primos?", "¿no son tus primos?"] },
    { en: "Why don't you call her?", answer: ["¿por qué no la llamas?", "¿por que no la llamas?"] },
    { en: "Isn't it cold today?", answer: ["¿no hace frío hoy?", "¿no esta frio hoy?"] },
    { en: "Don't you have a car?", answer: ["¿no tienes un carro?", "¿no tienes carro?"] },
    { en: "Why aren't you eating?", answer: ["¿por qué no estás comiendo?", "¿por que no estas comiendo?"] },
    { en: "Isn't your father a teacher?", answer: ["¿no es tu padre profesor?", "¿tu padre no es profesor?"] },
    { en: "Don't they live in Spain?", answer: ["¿no viven ellos en españa?", "¿no viven en españa?"] },
];

// --- HELPER COMPONENTS ---

const BlockValidationExercise = ({ title, prompts, onComplete, initialAns, onAnsChange, isAdmin, isSupervisionMode, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [valStatus, setValStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setCurrentIndex(0); setValStatus({}); }, [title]);

    const handleCheck = () => {
        const newVal: Record<number, 'correct' | 'incorrect'> = {};
        let allOk = true;
        prompts.forEach((p: any, i: number) => {
            const userVal = (initialAns[i] || '').trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
            const corrects = p.es || p.answer || [];
            const correctsNormalized = (Array.isArray(corrects) ? corrects : [corrects]).map((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' '));
            const isOk = correctsNormalized.includes(userVal);
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
                    <div className="w-full">
                        <CardTitle className="text-primary font-black uppercase tracking-tight">{title}</CardTitle>
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
                                    <div className="grid grid-cols-2 gap-2 text-sm">
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
                    {prompts[currentIndex]?.en}
                </div>
                <Input value={initialAns[currentIndex] || ''} onChange={e => { if (isSupervisionMode) return; onAnsChange(currentIndex, e.target.value); setValStatus({...valStatus, [currentIndex]: 'unchecked'}); }} className={cn("h-12 text-lg text-foreground", valStatus[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/10' : valStatus[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="Escribe tu traducción al español..." autoComplete="off" readOnly={isSupervisionMode} />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    {currentIndex === prompts.length - 1 && (
                        <>
                            {!isAllCorrect && !isSupervisionMode && <Button onClick={handleCheck} variant="secondary">Verificar</Button>}
                            <Button onClick={onComplete} disabled={!isAllCorrect && !isAdmin} className={cn("text-white font-bold", isAllCorrect ? "bg-green-600 hover:bg-green-700" : "bg-primary")}>
                                {title.includes('Mixto') ? 'Continuar' : title.includes('Final') ? 'Terminar' : 'Siguiente'}
                            </Button>
                        </>
                    )}
                    {currentIndex < prompts.length - 1 && <Button onClick={() => setCurrentIndex(i => i + 1)}>Siguiente</Button>}
                </div>
            </CardFooter>
        </Card>
    );
};

// --- MAIN PAGE ---

export default function PreguntasPage() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const targetStudentId = searchParams.get('studentId');
    const currentUID = targetStudentId || user?.uid;

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [learningPath, setLearningPath] = useState<any[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    
    // States for content
    const [vocabAns, setVocabAns] = useState<string[]>(Array(vocabularyData.length).fill(''));
    const [vocabVal, setVocabVal] = useState<any[]>(Array(vocabularyData.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);
    const [ex1Ans, setEx1Ans] = useState<string[]>(Array(ex1Prompts.length).fill(''));
    const [ex2Ans, setEx2Ans] = useState<string[]>(Array(ex2Prompts.length).fill(''));
    const [ex3Ans, setEx3Ans] = useState<string[]>(Array(ex3Prompts.length).fill(''));
    const [mixedExAns, setMixedExAns] = useState<string[]>(Array(mixedExPrompts.length).fill(''));
    const [negAns, setNegAns] = useState<string[]>(Array(negativePrompts.length).fill(''));
    const [readAns, setReadAns] = useState<Record<string, string>>({});
    const [readVal, setReadVal] = useState<Record<string, any>>({});
    const [transText, setTransText] = useState('');
    const [isFinished, setIsFinished] = useState(false);

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: authUserProfile } = useDoc<{ role?: string }>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string, lessonProgress?: any, progress?: any, name?: string }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialLearningPath = useMemo(() => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: '2. Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: '3. Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: '4. Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'ex3', name: '5. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'reading', name: '7. Lectura', icon: BookText, status: 'locked' },
        { key: 'mixed_ex', name: '8. Ejercicio Mixto', icon: Trophy, status: 'locked' },
        { key: 'translate', name: '9. Traducir Texto', icon: MessageSquare, status: 'locked' },
        { key: 'final', name: '10. Final (Negativos)', icon: CheckCircle, status: 'locked' },
    ], []);

    const handleTopicComplete = (completedKey: string) => {
        setTopicToComplete(completedKey);
    };

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (topicKey === 'grammar') handleTopicComplete('grammar');
    };

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
        let path = initialLearningPath.map(topic => ({ ...topic }));
        const d = studentProfile.lessonProgress?.[progressStorageVersion] || {};
        if (isAdmin && !targetStudentId) path.forEach(t => t.status = 'completed');
        else {
            path.forEach(t => { if (d[t.key]) (t as any).status = d[t.key]; });
            let lastDone = true;
            for (let i = 0; i < path.length; i++) {
                if (lastDone && path[i].status === 'locked') (path[i] as any).status = 'active';
                lastDone = (path[i] as any).status === 'completed';
            }
        }
        setLearningPath(path);
        setSelectedTopic(d.lastSelectedTopic || path.find(p => (p as any).status === 'active')?.key || path[0].key);
        if (d.ex1Ans) setEx1Ans(d.ex1Ans);
        if (d.ex2Ans) setEx2Ans(d.ex2Ans);
        if (d.ex3Ans) setEx3Ans(d.ex3Ans);
        if (d.mixedExAns) setMixedExAns(d.mixedExAns);
        if (d.negAns) setNegAns(d.negAns);
        if (d.readAns) setReadAns(d.readAns);
        if (d.transText) setTransText(d.transText);
        if (d.vocabAns) setVocabAns(d.vocabAns);
        if (d.isFinished) setIsFinished(d.isFinished);
        setInitialLoadComplete(true); setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete, targetStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || targetStudentId) return;
        const s: any = { lastSelectedTopic: selectedTopic, ex1Ans, ex2Ans, ex3Ans, mixedExAns, negAns, readAns, transText, vocabAns, isFinished };
        learningPath.forEach(t => s[t.key] = t.status);
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, ex1Ans, ex2Ans, ex3Ans, mixedExAns, negAns, readAns, transText, targetStudentId, vocabAns, isFinished]);

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
        const nv = vocabularyData.map((v, i) => {
            const userAns = (vocabAns[i] || '').trim().toLowerCase();
            const res = v.es.toLowerCase() === userAns;
            if (!res) allOk = false; 
            return res ? 'correct' : 'incorrect';
        });
        setVocabVal(nv); setCanAdvanceVocab(allOk);
        if (allOk) toast({ title: "¡Vocabulario correcto!" }); else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const vocabularyMap = useMemo(() => vocabularyData.reduce((acc, curr) => ({...acc, [curr.es.toLowerCase()]: curr.en.toLowerCase()}), {}), []);

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>Vocabulario: Las Preguntas</CardTitle><CardDescription className='font-bold text-foreground'>Escribe la definición en español para cada palabra en inglés.</CardDescription></CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[450px] pr-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="font-bold border-b pb-2">Inglés</div><div className="font-bold border-b pb-2">Español</div>
                                    {vocabularyData.map((v: any, i: number) => (
                                        <Fragment key={i}>
                                            <div className="p-2 border rounded bg-white/5 font-medium">{v.en}</div>
                                            <Input value={vocabAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...vocabAns]; na[i] = e.target.value; setVocabAns(na); const nv = [...vocabVal]; nv[i] = 'unchecked'; setVocabVal(nv); setCanAdvanceVocab(false); }} className={cn("uppercase transition-all", vocabVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} />
                                        </Fragment>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6">
                            <Button onClick={handleCheckVocab} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className="font-bold text-white bg-primary">Continuar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-foreground text-left overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Las Preguntas</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0 font-bold">
                        <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                    <h3 className="text-xl font-black text-primary uppercase mb-4 flex items-center gap-2"><Info className="h-5 w-5" /> 1. El Signo de Interrogación</h3>
                                    <p className="mb-4">En español, las preguntas <strong>obligatoriamente</strong> llevan dos signos: uno al inicio (<span className="text-primary font-bold">¿</span>) y uno al final (<span className="text-primary font-bold">?</span>).</p>
                                    <p className="mb-4">In Spanish, questions <strong>must</strong> have two marks: one at the beginning (<span className="text-primary font-bold">¿</span>) and one at the end (<span className="text-primary font-bold">?</span>).</p>
                                    <div className="bg-muted p-4 rounded-xl border-l-4 border-primary italic font-mono">¿Cómo estás? (Correcto) / Cómo estás? (Incorrecto)</div>
                                </div>
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-primary uppercase mb-4">¿ + Interrogativo + ?</h3>
                                <p className="text-lg text-foreground">En español siempre usamos dos signos de interrogación. El pronombre interrogativo suele ir al principio.</p>
                                <ul className="list-disc pl-5 mt-4 space-y-2 font-medium">
                                    <li><span className='font-bold text-primary'>QUÉ:</span> What?</li>
                                    <li><span className='font-bold text-primary'>CUÁNDO:</span> When?</li>
                                    <li><span className='font-bold text-primary'>DÓNDE:</span> Where?</li>
                                    <li><span className='font-bold text-primary'>QUIÉN:</span> Who?</li>
                                    <li><span className='font-bold text-primary'>CÓMO:</span> How?</li>
                                    <li><span className='font-bold text-primary'>POR QUÉ:</span> Why?</li>
                                </ul>
                            </div>
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-6">
                                    <h3 className="text-xl font-black text-primary uppercase mb-4">3. Estructura de las Preguntas</h3>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-bold text-foreground">A) Estructura Simple / Simple Structure</h4>
                                            <p className="text-sm mb-2 text-muted-foreground">La estructura más común en español es: / The most common structure in Spanish is:</p>
                                            <div className="p-4 bg-primary/10 rounded-xl border-2 border-dashed border-primary/30 text-center font-mono text-base">
                                                ¿ + Interrogativo + Verbo + Sujeto + ?
                                            </div>
                                            <p className="mt-2 text-sm italic">Ej: ¿Dónde (Where) vives (live) tú (you)?</p>
                                        </div>

                                        <Separator />

                                        <div>
                                            <h4 className="font-bold text-foreground">B) Con Preposiciones / With Prepositions</h4>
                                            <p className="text-sm mb-2 text-muted-foreground">A diferencia del inglés, en español la preposición siempre va <strong>antes</strong> de la palabra interrogativa. / Unlike English, in Spanish the preposition always goes <strong>before</strong> the interrogative word.</p>
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div className="p-3 bg-muted/50 rounded-xl border border-dashed font-mono text-sm">
                                                    <p className="text-primary font-bold">¿DE dónde eres?</p>
                                                    <p className="text-muted-foreground text-xs uppercase">Where are you FROM?</p>
                                                </div>
                                                <div className="p-3 bg-muted/50 rounded-xl border border-dashed font-mono text-sm">
                                                    <p className="text-primary font-bold">¿CON quién hablas?</p>
                                                    <p className="text-muted-foreground text-xs uppercase">WHO are you talking WITH?</p>
                                                </div>
                                                <div className="p-3 bg-muted/50 rounded-xl border border-dashed font-mono text-sm">
                                                    <p className="text-primary font-bold">¿PARA qué estudias?</p>
                                                    <p className="text-muted-foreground text-xs uppercase">WHAT are you studying FOR?</p>
                                                </div>
                                                <div className="p-3 bg-muted/50 rounded-xl border border-dashed font-mono text-sm">
                                                    <p className="text-primary font-bold">¿DESDE cuándo estás aquí?</p>
                                                    <p className="text-muted-foreground text-xs uppercase">SINCE when are you here?</p>
                                                </div>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div>
                                            <h4 className="font-bold text-foreground">C) Con Posesivos / With Possessives</h4>
                                            <p className="text-sm mb-2 text-muted-foreground">Usamos adjetivos posesivos (tu, su, nuestro) para preguntar por pertenencia. / We use possessive adjectives to ask about ownership.</p>
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div className="p-3 bg-muted/50 rounded-xl border border-dashed font-mono text-sm">
                                                    <p className="text-primary font-bold">¿Cuál es TU nombre?</p>
                                                    <p className="text-muted-foreground text-xs uppercase">What is YOUR name?</p>
                                                </div>
                                                <div className="p-3 bg-muted/50 rounded-xl border border-dashed font-mono text-sm">
                                                    <p className="text-primary font-bold">¿Dónde está SU casa?</p>
                                                    <p className="text-muted-foreground text-xs uppercase">Where is HIS/HER/THEIR house?</p>
                                                </div>
                                                <div className="p-3 bg-muted/50 rounded-xl border border-dashed font-mono text-sm">
                                                    <p className="text-primary font-bold">¿Cómo está NUESTRO hijo?</p>
                                                    <p className="text-muted-foreground text-xs uppercase">How is OUR son?</p>
                                                </div>
                                                <div className="p-3 bg-muted/50 rounded-xl border border-dashed font-mono text-sm">
                                                    <p className="text-primary font-bold">¿Cuándo es SU fiesta? (de ella)</p>
                                                    <p className="text-muted-foreground text-xs uppercase">When is HER party?</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>             
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'ex1': return <BlockValidationExercise key="ex1" title="Ejercicio 1" prompts={ex1Prompts} initialAns={ex1Ans} onAnsChange={(i: number, v: string) => { const na = [...ex1Ans]; na[i] = v; setEx1Ans(na); }} onComplete={() => handleTopicComplete('ex1')} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={vocabularyMap} />;
            case 'ex2': return <BlockValidationExercise key="ex2" title="Ejercicio 2" prompts={ex2Prompts} initialAns={ex2Ans} onAnsChange={(i: number, v: string) => { const na = [...ex2Ans]; na[i] = v; setEx2Ans(na); }} onComplete={() => handleTopicComplete('ex2')} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={vocabularyMap} />;
            case 'ex3': return <BlockValidationExercise key="ex3" title="Ejercicio 3" prompts={ex3Prompts} initialAns={ex3Ans} onAnsChange={(i: number, v: string) => { const na = [...ex3Ans]; na[i] = v; setEx3Ans(na); }} onComplete={() => handleTopicComplete('ex3')} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={vocabularyMap} />;
            case 'vocab_game': return <VocabularyMatchingGame data={vocabularyData.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Memory Game: Preguntas" />;
            case 'reading':
                {
                    const readingOk = Object.values(readVal).length === readingData.questions.length && Object.values(readVal).every(v => v === 'correct');
                    return (
                        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle>{readingData.title}</CardTitle>
                                    <Popover>
                                        <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                                        <PopoverContent className="w-64">
                                            <ScrollArea className="h-48 pr-4 text-left">
                                                <div className="grid grid-cols-2 gap-2 text-sm text-foreground">
                                                    {Object.entries({ "entrevista": "interview", "periodista": "journalist", "amigable": "friendly" }).map(([es, en]: any) => (<Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-semibold text-right text-primary">{(en || '').toUpperCase()}</span></Fragment>))}
                                                </div>
                                            </ScrollArea>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner">{readingData.content}</div>
                                <Separator /><div className="space-y-4">{readingData.questions.map(q => (
                                    <div key={q.id} className="space-y-2 text-foreground"><Label className='font-bold'>{q.q}</Label><Input value={readAns[q.id] || ''} onChange={e => { if (targetStudentId) return; setReadAns({...readAns, [q.id]: e.target.value}); setReadVal({...readVal, [q.id]: 'unchecked'}); }} className={cn('h-12', readVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[q.id] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                                ))}</div>
                            </CardContent>
                            <CardFooter className="justify-between border-t pt-6">
                                <Button onClick={() => {
                                    let ok = true; const nv: any = {};
                                    readingData.questions.forEach(q => { const user = (readAns[q.id] || '').trim().toLowerCase(); const isOk = q.a.some(a => user.includes(a.toLowerCase())); nv[q.id] = isOk ? 'correct' : 'incorrect'; if (!isOk) ok = false; });
                                    setReadVal(nv); if (ok) toast({ title: "¡Lectura superada!" }); else toast({ variant: 'destructive', title: "Revisa las respuestas" });
                                }} variant="secondary">Verificar</Button>
                                <Button onClick={() => handleTopicComplete('reading')} disabled={!readingOk && !isAdmin} className="font-bold text-white bg-primary">Continuar</Button>
                            </CardFooter>
                        </Card>
                    );
                }
            case 'mixed_ex': return <BlockValidationExercise key="mixed_ex" title="Ejercicio Mixto" prompts={mixedExPrompts} initialAns={mixedExAns} onAnsChange={(i: number, v: string) => { const na = [...mixedExAns]; na[i] = v; setMixedExAns(na); }} onComplete={() => handleTopicComplete('mixed_ex')} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={vocabularyMap} />;
            case 'translate':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader>
                            <div className="flex justify-between items-center w-full">
                                <div><CardTitle>Traducir Texto</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el siguiente párrafo al español.</CardDescription></div>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                                    <PopoverContent className="w-64">
                                        <ScrollArea className="h-48 pr-4 text-left">
                                            <div className="grid grid-cols-2 gap-2 text-sm text-foreground">
                                                {Object.entries({ "Italy": "Italia", "because": "porque" }).map(([en, es]) => (<Fragment key={en}><span className="text-muted-foreground capitalize">{en}:</span><span className="font-semibold text-right text-primary">{es.toUpperCase()}</span></Fragment>))}
                                            </div>
                                        </ScrollArea>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed shadow-sm text-foreground">"I am Maria and I am from Italy. I study Spanish because it is very important. Where do you live? When is the party? Why are you happy today?"</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={transText} onChange={(e) => { if (!targetStudentId) setTransText(e.target.value); }} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg text-foreground" readOnly={!!targetStudentId} /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20">
                            <Button onClick={() => handleTopicComplete('translate')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Siguiente Misión <ArrowRight className='ml-3 h-8 w-8' /></Button>
                        </CardFooter>
                    </Card>
                );
            case 'final':
                if (isFinished) {
                    return (
                        <Card className="shadow-soft border-2 border-green-500 bg-green-50/10 p-12 text-center flex flex-col items-center">
                            <Trophy className="h-24 w-24 text-yellow-400 mb-6 animate-bounce" />
                            <h2 className="text-4xl font-black uppercase text-green-600 tracking-tighter">¡FELICITACIONES!</h2>
                            <p className="text-2xl mt-4 font-bold">¡Has terminado la clase Preguntas!</p>
                            <p className='text-muted-foreground mt-2 text-lg'>Misión completada al 100%.</p>
                            <Button asChild className="mt-8 px-12 h-12 font-bold" variant="outline"><Link href="/espanol/a1">Regresar a la Ruta A1</Link></Button>
                        </Card>
                    );
                }
                return <BlockValidationExercise key="final" title="Final (Negativos)" prompts={negativePrompts} initialAns={negAns} onAnsChange={(i: number, v: string) => { const na = [...negAns]; na[i] = v; setNegAns(na); }} onComplete={() => { setIsFinished(true); handleTopicComplete('final'); }} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={vocabularyMap} />;
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
                            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400"><Star className="h-6 w-6 fill-current animate-pulse" /><p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión: {studentProfile?.name || targetStudentId}</p></div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors"><Link href="/admin">Cerrar</Link></Button>
                        </div>
                    )}
                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/a1" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver al Curso A1</Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3">
                           <HelpCircle className='h-10 w-10 text-primary' /> Preguntas 🇪🇸
                        </h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30">
                                    <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Tu Misión</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <nav><ul className="space-y-1">
                                        {learningPath.map((item) => {
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            const Icon = ICONS_CONFIG[item.status as keyof typeof ICONS_CONFIG] || BookOpen;
                                            return (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm')}>
                                                    <div className="flex items-center gap-3">
                                                        {item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}
                                                        <span className="truncate max-w-[150px] text-[10px] uppercase font-bold text-black dark:text-white">{item.name}</span>
                                                    </div>
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