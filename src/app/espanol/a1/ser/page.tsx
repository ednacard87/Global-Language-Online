
'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense, Fragment } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
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
    UserCircle,
    Users,
    Clock,
    Globe
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_a1_ser_v10_final_validation';
const mainProgressKey = 'progress_a1_es_ser';

// --- DATA ---

const vocabularyData = {
    apariencia: [
        { en: "TALL", es: "ALTO" },
        { en: "SHORT", es: "BAJO" },
        { en: "FAT", es: "GORDO" },
        { en: "THIN", es: "FLACO" },
        { en: "BLONDE", es: "RUBIO" },
        { en: "BRUNETTE", es: "MORENO" },
        { en: "PRETTY", es: "BONITO" },
        { en: "UGLY", es: "FEO" },
        { en: "YOUNG", es: "JOVEN" },
        { en: "OLD", es: "VIEJO" },
        { en: "STRONG", es: "FUERTE" },
        { en: "WEAK", es: "DÉBIL" },
        { en: "BIG", es: "GRANDE" },
        { en: "SMALL", es: "PEQUEÑO" },
    ],
    personalidad: [
        { en: "INTELLIGENT", es: "INTELIGENTE" },
        { en: "KIND", es: "AMABLE" },
        { en: "SERIOUS", es: "SERIO" },
        { en: "CHEERFUL", es: "ALEGRE" },
        { en: "FUNNY", es: "DIVERTIDO" },
        { en: "SHY", es: "TÍMIDO" },
        { en: "BRAVE", es: "VALIENTE" },
        { en: "LAZY", es: "PEREZOSO" },
        { en: "HONEST", es: "HONESTO" },
        { en: "PATIENT", es: "PACIENTE" },
        { en: "CREATIVE", es: "CREATIVO" },
        { en: "GENEROUS", es: "GENEROSO" },
        { en: "CALM", es: "TRANQUILO" },
        { en: "FRIENDLY", es: "AMIGABLE" },
    ],
    profesiones: [
        { en: "DOCTOR", es: "MÉDICO" },
        { en: "TEACHER", es: "PROFESOR" },
        { en: "ENGINEER", es: "INGENIERO" },
        { en: "NURSE", es: "ENFERMERO" },
        { en: "LAWYER", es: "ABOGADO" },
        { en: "ARTIST", es: "ARTISTA" },
        { en: "WRITER", es: "ESCRITOR" },
        { en: "STUDENT", es: "ESTUDIANTE" },
        { en: "WAITER", es: "MESERO" },
        { en: "CHEF", es: "COCINERO" },
        { en: "POLICE OFFICER", es: "POLICÍA" },
        { en: "DENTIST", es: "DENTISTA" },
        { en: "ACTOR", es: "ACTOR" },
        { en: "SINGER", es: "CANTANTE" },
    ]
};

const allVocabList = [...vocabularyData.apariencia, ...vocabularyData.personalidad, ...vocabularyData.profesiones];

const ex1Prompts = [
    { en: "I am a student.", es: ["yo soy estudiante", "soy estudiante"] },
    { en: "You are kind.", es: ["tú eres amable", "usted es amable"] },
    { en: "He is a doctor.", es: ["él es médico", "él es un médico"] },
    { en: "She is pretty.", es: ["ella es bonita"] },
    { en: "We are friends.", es: ["nosotros somos amigos", "nosotras somos amigas"] },
    { en: "They are tall.", es: ["ellos son altos", "ellas son altas"] },
    { en: "The dog is big.", es: ["el perro es grande"] },
];

const ex2Prompts = [
    { en: "The engineer is intelligent.", es: ["el ingeniero es inteligente"] },
    { en: "My father is serious.", es: ["mi padre es serio"] },
    { en: "The students are creative.", es: ["los estudiantes son creativos"] },
    { en: "A teacher is patient.", es: ["un profesor es paciente", "una profesora es paciente"] },
    { en: "The actors are funny.", es: ["los actores son divertidos"] },
    { en: "She is a generous nurse.", es: ["ella es una enfermera generosa", "es una enfermera generosa"] },
    { en: "We are brave police officers.", es: ["nosotros somos policías valientes", "somos policias valientes"] },
    { en: "The writer is famous.", es: ["el escritor es famoso"] },
];

const ex3Prompts = [
    { word: "Yo _______ inteligente.", answer: ["soy"] },
    { word: "Tú _______ mi amigo.", answer: ["eres"] },
    { word: "Él _______ médico.", answer: ["es"] },
    { word: "Ella _______ muy alta.", answer: ["es"] },
    { word: "Nosotros _______ de Colombia.", answer: ["somos"] },
    { word: "Ellos _______ perezosos.", answer: ["son"] },
    { word: "Ustedes _______ estudiantes.", answer: ["son"] },
    { word: "El gato _______ pequeño.", answer: ["es"] },
    { word: "Las flores _______ rojas.", answer: ["son"] },
    { word: "Usted _______ muy amable.", answer: ["es"] },
];

const readingData = {
    title: "El Nuevo Estudiante",
    content: "Hola, yo soy Marco. Yo soy un estudiante nuevo en la escuela. Yo soy de Italia. Yo soy alto y moreno. Mis amigos dicen que yo soy muy alegre y amigable. Mi padre es ingeniero y mi madre es enfermera. Ellos son personas muy trabajadoras y generosas. Nosotros somos una familia feliz.",
    questions: [
        { id: 'q1', q: "¿Quién es Marco?", a: ["un estudiante", "un estudiante nuevo", "marco es un estudiante"] },
        { id: 'q2', q: "¿De dónde es Marco?", a: ["de italia", "es de italia"] },
        { id: 'q3', q: "¿Cómo es físicamente Marco?", a: ["alto y moreno", "es alto y moreno"] },
        { id: 'q4', q: "¿Qué profesión tiene el padre?", a: ["ingeniero", "es ingeniero"] },
        { id: 'q5', q: "¿Cómo es la familia de Marco?", a: ["feliz", "una familia feliz", "es feliz"] },
    ]
};

const finalExPrompts = [
    { s: "1. Yo _______ un artista.", a: ["soy"] },
    { s: "2. Las manzanas _______ dulces.", a: ["son"] },
    { s: "3. El sol _______ amarillo.", a: ["es"] },
    { s: "4. Nosotros _______ hermanos.", a: ["somos"] },
    { s: "5. Tú _______ muy joven.", a: ["eres"] },
    { s: "6. María _______ abogada.", a: ["es"] },
    { s: "7. Los libros _______ interesantes.", a: ["son"] },
    { s: "8. Juan y yo _______ amigos.", a: ["somos"] },
    { s: "9. El coche _______ azul.", a: ["es"] },
    { s: "10. Ustedes _______ valientes.", a: ["son"] },
];

const negativePrompts = [
    { en: "I am not lazy.", es: ["yo no soy perezoso", "no soy perezoso"] },
    { en: "She is not a doctor.", es: ["ella no es médica", "ella no es un médico", "ella no es una doctora"] },
    { en: "They are not serious.", es: ["ellos no son serios", "ellas no son serias", "no son serios"] },
    { en: "We are not friends.", es: ["nosotros no somos amigos", "no somos amigos"] },
    { en: "You are not short.", es: ["tú no eres bajo", "tu no eres bajo", "usted no es bajo"] },
    { en: "He is not an artist.", es: ["el no es artista", "el no es un artista"] },
    { en: "The cat is not black.", es: ["el gato no es negro"] },
    { en: "I am not a lawyer.", es: ["yo no soy abogado", "yo no soy un abogado"] },
    { en: "They are not from Italy.", es: ["ellos no son de italia"] },
    { en: "We are not creative.", es: ["nosotros no somos creativos"] },
];

const translationVocabHelp = {
    "brother": "hermano", "tall": "alto", "blonde": "rubio", "cheerful": "alegre",
    "kind": "amable", "engineer": "ingeniero", "creative": "creativo", "serious": "serio",
    "doctor": "médico", "brave": "valiente", "sister": "hermana", "pretty": "bonita",
    "shy": "tímida", "artist": "artista", "happy": "feliz"
};

// --- COMPONENTES AUXILIARES ---

const FinalValidationExercise = ({ title, prompts, onComplete, vocabulary, isFinal = false, type = 'translate' }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<string[]>(Array(prompts.length).fill(''));
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});
    const [isValidated, setIsValidated] = useState(false);

    useEffect(() => {
        setCurrentIndex(0);
        setUserAnswers(Array(prompts.length).fill(''));
        setStatus({});
        setIsValidated(false);
    }, [prompts]);

    const handleCheck = () => {
        const newStatus: Record<number, 'correct' | 'incorrect' | 'unchecked'> = {};
        let allOk = true;

        prompts.forEach((p: any, i: number) => {
            const userVal = (userAnswers[i] || '').trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
            const corrects = p.es || p.a || p.answer;
            const isCorrect = corrects.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
            newStatus[i] = isCorrect ? 'correct' : 'incorrect';
            if (!isCorrect) allOk = false;
        });

        setStatus(newStatus);
        setIsValidated(true);

        if (allOk) {
            toast({ title: "¡Excelente!", description: isFinal ? "Misión completada. Pulsa Terminar." : "¡Todo correcto! Pulsa Siguiente para avanzar." });
        } else {
            toast({ variant: 'destructive', title: "Hay errores", description: "Revisa las burbujas en rojo y corrige tus respuestas." });
        }
    };

    const isAllCorrect = useMemo(() => {
        return Object.values(status).length === prompts.length && Object.values(status).every(s => s === 'correct');
    }, [status, prompts.length]);

    const currentPrompt = prompts[currentIndex];
    if (!currentPrompt) return null;

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="w-full">
                        <CardTitle className="uppercase font-black text-primary">{title}</CardTitle>
                        <CardDescription className='font-bold text-foreground mt-1'>
                            Completa todas las frases y verifica al final.
                        </CardDescription>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} 
                                    className={cn(
                                        "h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", 
                                        currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted",
                                        status[i] === 'correct' ? "bg-green-500 text-white border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" : 
                                        status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]" : "bg-card text-foreground"
                                    )}
                                >
                                    {i + 1}
                                </div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-left">
                                        {Array.isArray(vocabulary) ? (
                                            vocabulary.map((v: any, i: number) => (
                                                <Fragment key={i}>
                                                    <span className="text-muted-foreground capitalize">{v.en}:</span>
                                                    <span className="font-semibold text-right text-primary">{String(v.es || '').toUpperCase()}</span>
                                                </Fragment>
                                            ))
                                        ) : (
                                            Object.entries(vocabulary).map(([en, es]: any) => (
                                                <Fragment key={en}>
                                                    <span className="text-muted-foreground capitalize">{en}:</span>
                                                    <span className="font-semibold text-right text-primary">{String(es || '').toUpperCase()}</span>
                                                </Fragment>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-8 rounded-2xl border-2 border-dashed text-center font-bold text-2xl uppercase tracking-tighter text-foreground">
                    {currentPrompt.en || currentPrompt.word || currentPrompt.s}
                </div>
                <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase text-primary ml-1">Tu Respuesta:</Label>
                    <Input 
                        value={userAnswers[currentIndex] || ''} 
                        onChange={e => {
                            const na = [...userAnswers]; na[currentIndex] = e.target.value; setUserAnswers(na);
                            if (status[currentIndex]) { const ns = {...status}; delete ns[currentIndex]; setStatus(ns); }
                        }} 
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                if (currentIndex < prompts.length - 1) setCurrentIndex(p => p + 1);
                                else handleCheck();
                            }
                        }}
                        className={cn("h-14 text-xl font-bold uppercase transition-all", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/10' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/10' : 'border-primary/40')} 
                        placeholder="..." 
                        autoComplete="off" 
                    />
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    {currentIndex === prompts.length - 1 ? (
                        <Button onClick={handleCheck} variant="secondary" className="font-black uppercase tracking-widest px-8">Verificar</Button>
                    ) : (
                        <Button onClick={() => setCurrentIndex(p => p + 1)} className="font-bold">Siguiente</Button>
                    )}
                    {isFinal ? (
                        <Button onClick={onComplete} disabled={!isAllCorrect} className="font-black bg-green-600 hover:bg-green-700 text-white px-10 shadow-lg">Terminar</Button>
                    ) : (
                        <Button onClick={onComplete} disabled={!isAllCorrect} className="font-bold">Siguiente Misión <ArrowRight className="ml-2 h-4 w-4" /></Button>
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

function SerContent() {
    const { toast } = useToast();
    const router = useRouter();
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
    const [isClassFinished, setIsClassFinished] = useState(false);

    // States for content
    const [vocabAnswers, setVocabAnswers] = useState<Record<string, string[]>>({});
    const [vocabValidation, setVocabValidation] = useState<Record<string, any[]>>({});
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const [readingAns, setReadingAns] = useState<Record<string, string>>({});
    const [readingVal, setReadingVal] = useState<Record<string, 'correct' | 'incorrect' | 'unchecked'>>({});

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
        { key: 'ex3', name: '5. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'reading', name: '7. Lectura', icon: BookText, status: 'locked' },
        { key: 'final_ex', name: '8. Ejercicio Final', icon: Trophy, status: 'locked' },
        { key: 'translate_text', name: '9. Traducir Texto', icon: MessageSquare, status: 'locked' },
        { key: 'final', name: '10. Final', icon: CheckCircle, status: 'locked' },
    ], []);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (topicKey === 'grammar') handleTopicComplete(topicKey);
    };

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
            if (savedData.isClassFinished) setIsClassFinished(true);
        }

        let lastDone = true;
        for (let i = 0; i < path.length; i++) {
            if (lastDone && path[i].status === 'locked') path[i].status = 'active';
            lastDone = path[i].status === 'completed';
        }

        setLearningPath(path);
        setSelectedTopic(savedST || path.find(p => p.status === 'active')?.key || path[0].key);
        
        const initAns: Record<string, string[]> = {};
        const initVal: Record<string, any[]> = {};
        Object.keys(vocabularyData).forEach(cat => {
            initAns[cat] = Array((vocabularyData as any)[cat].length).fill('');
            initVal[cat] = Array((vocabularyData as any)[cat].length).fill('unchecked');
        });
        setVocabAnswers(initAns);
        setVocabValidation(initVal);
        
        setInitialLoadComplete(true);
        setTimeout(() => setIsInitialLoading(false), 800);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete, targetStudentId]);

    const progressValue = useMemo(() => {
        if (isClassFinished) return 100;
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.min(Math.round((completedCount / learningPath.length) * 100), 99);
    }, [learningPath, isClassFinished]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || targetStudentId) return;
        const s: Record<string, any> = { lastSelectedTopic: selectedTopic, isClassFinished };
        learningPath.forEach(item => { s[item.key] = item.status; });
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, isInitialLoading, targetStudentId, isClassFinished]);

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
            if (win) setTimeout(() => toast({ title: "¡Misión superada!" }), 0);
            if (next) { const n = next; setTimeout(() => setSelectedTopic(n), 0); }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleVocabCheck = () => {
        let totalCorrect = 0;
        const newVal: Record<string, any[]> = {};
        Object.keys(vocabularyData).forEach(cat => {
            newVal[cat] = (vocabularyData as any)[cat].map((v: any, i: number) => {
                const isCorrect = v.es.toLowerCase() === (vocabAnswers[cat]?.[i] || '').trim().toLowerCase();
                if (isCorrect) totalCorrect++;
                return isCorrect ? 'correct' : 'incorrect';
            });
        });
        setVocabValidation(newVal);
        if (totalCorrect >= 15) { setCanAdvanceVocab(true); toast({ title: "¡Excelente avance!" }); }
        else toast({ variant: 'destructive', title: "Sigue completando el vocabulario." });
    };

    const handleCheckReading = () => {
        const nv: Record<string, 'correct' | 'incorrect' | 'unchecked'> = {};
        let allOk = true;
        readingData.questions.forEach(q => {
            const userVal = (readingAns[q.id] || '').trim().toLowerCase();
            const isOk = q.a.some(correct => userVal.includes(correct.toLowerCase()));
            nv[q.id] = isOk ? 'correct' : 'incorrect';
            if (!isOk) allOk = false;
        });
        setReadingVal(nv);
        if (allOk) toast({ title: "¡Lectura superada!", description: "Ahora puedes continuar." });
        else toast({ variant: 'destructive', title: "Revisa las respuestas", description: "Hay errores en la comprensión." });
    };

    const readingIsAllCorrect = useMemo(() => {
        return readingData.questions.length > 0 && 
               readingData.questions.every(q => readingVal[q.id] === 'correct');
    }, [readingVal]);

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;

        if (isClassFinished) {
            return (
                <Card className="shadow-soft rounded-lg border-2 border-green-500 bg-green-500/10 p-12 text-center flex flex-col items-center animate-in fade-in zoom-in duration-500 text-foreground">
                    <Trophy className="h-24 w-24 text-yellow-400 mb-6 animate-bounce" />
                    <h2 className="text-4xl font-black uppercase text-green-600 tracking-tighter">FELICITACIONES!</h2>
                    <p className="text-2xl mt-4 font-bold">Tu completaste esta clase</p>
                    <Button asChild className="mt-8 px-12 h-12 font-bold" variant="outline">
                        <Link href="/espanol/a1">Regresar a la unidad 1</Link>
                    </Button>
                </Card>
            );
        }

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'>
                            <CardTitle className="text-primary uppercase tracking-tighter">Vocabulario: Apariencia, Personalidad y Profesiones</CardTitle>
                            <CardDescription className='font-bold text-foreground'>Escribe el significado en español para cada término.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <Accordion type="multiple" defaultValue={['apariencia']} className="w-full">
                                {Object.keys(vocabularyData).map(cat => (
                                    <AccordionItem key={cat} value={cat}>
                                        <AccordionTrigger className="capitalize font-black text-primary text-sm tracking-widest">
                                            {cat === 'apariencia' ? 'Apariencia Física' : cat === 'personalidad' ? 'Personalidad' : 'Profesiones'}
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="font-black text-muted-foreground uppercase tracking-widest text-[10px] border-b pb-1">English</div>
                                                <div className="font-black text-muted-foreground uppercase tracking-widest text-[10px] border-b pb-1">Español</div>
                                                {(vocabularyData as any)[cat].map((v: any, i: number) => (
                                                    <Fragment key={i}>
                                                        <div className="flex items-center font-bold py-1 text-sm">{v.en}</div>
                                                        <Input 
                                                            value={vocabAnswers[cat]?.[i] || ''} 
                                                            onChange={e => {
                                                                const newAns = { ...vocabAnswers };
                                                                if (!newAns[cat]) newAns[cat] = [];
                                                                newAns[cat][i] = e.target.value;
                                                                setVocabAnswers(newAns);
                                                                const newVal = { ...vocabValidation };
                                                                if (!newVal[cat]) newVal[cat] = [];
                                                                newVal[cat][i] = 'unchecked';
                                                                setVocabValidation(newVal);
                                                                setCanAdvanceVocab(false);
                                                            }}
                                                            className={cn("h-10 uppercase", vocabValidation[cat]?.[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabValidation[cat]?.[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} 
                                                            autoComplete="off" 
                                                            readOnly={!!targetStudentId}
                                                        />
                                                    </Fragment>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 bg-muted/20">
                            <Button onClick={handleVocabCheck} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar <ArrowRight className='ml-2'/></Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-foreground text-left overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Verbo SER y Adjetivos</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-primary uppercase mb-4">1. El Verbo SER (Presente)</h3>
                                <Table><TableHeader className='bg-muted/50'><TableRow><TableHead>Sujeto</TableHead><TableHead>Conjugación</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    <TableRow><TableCell className='font-bold'>Yo</TableCell><TableCell className="font-black text-primary">SOY</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Tú / Vosotros</TableCell><TableCell className="font-black text-primary">ERES / SOIS</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Él / Ella / Usted</TableCell><TableCell className="font-black text-primary">ES</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Nosotros / Nosotras</TableCell><TableCell className="font-black text-primary">SOMOS</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Ellos / Ellas / Ustedes</TableCell><TableCell className="font-black text-primary">SON</TableCell></TableRow>
                                </TableBody></Table>
                            </div>

                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-primary uppercase mb-4 flex items-center gap-2">
                                    <Info className="h-5 w-5" /> 2. Usos del Verbo SER
                                </h3>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="p-4 bg-muted/30 rounded-xl border-l-4 border-primary">
                                        <h4 className="font-bold text-sm uppercase text-primary">Identidad y Relaciones</h4>
                                        <p className="text-sm italic">Yo soy Juan. Ellos son mis padres.</p>
                                    </div>
                                    <div className="p-4 bg-muted/30 rounded-xl border-l-4 border-primary">
                                        <h4 className="font-bold text-sm uppercase text-primary">Origen y Nacionalidad</h4>
                                        <p className="text-sm italic">Él es de México. Somos colombianos.</p>
                                    </div>
                                    <div className="p-4 bg-muted/30 rounded-xl border-l-4 border-primary">
                                        <h4 className="font-bold text-sm uppercase text-primary">Profesión</h4>
                                        <p className="text-sm italic">Ella es doctora. Soy estudiante.</p>
                                    </div>
                                    <div className="p-4 bg-muted/30 rounded-xl border-l-4 border-primary">
                                        <h4 className="font-bold text-sm uppercase text-primary">Características Físicas</h4>
                                        <p className="text-sm italic">El perro es grande. Eres inteligente.</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">He comprendido la gramática</Button></CardFooter>
                    </Card>
                );
            case 'ex1': return <FinalValidationExercise key="ex1" title="Ejercicio 1: Frases Básicas" prompts={ex1Prompts} onComplete={() => handleTopicComplete('ex1')} vocabulary={allVocabList} />;
            case 'ex2': return <FinalValidationExercise key="ex2" title="Ejercicio 2: SER + Vocabulario" prompts={ex2Prompts} onComplete={() => handleTopicComplete('ex2')} vocabulary={allVocabList} />;
            case 'ex3': return <FinalValidationExercise key="ex3" title="Ejercicio 3: Conjugación" type="article" prompts={ex3Prompts} onComplete={() => handleTopicComplete('ex3')} vocabulary={allVocabList} />;
            case 'vocab_game': return <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm"><CardHeader><CardTitle>Juego de Memoria</CardTitle></CardHeader><CardContent><VocabularyMatchingGame data={allVocabList.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Encuentra las parejas de la Clase Ser" /></CardContent></Card>;
            case 'reading':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tight'>{readingData.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6 pt-6 text-foreground">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-inner">{readingData.content}</div>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className='font-black text-primary uppercase text-sm'>Preguntas de Comprensión:</h3>
                                {readingData.questions.map((q, i) => (
                                    <div key={q.id} className="space-y-2 p-3 bg-muted/20 rounded-xl border">
                                        <Label className="font-bold text-foreground">{q.q}</Label>
                                        <Input 
                                            value={readingAns[q.id] || ''} 
                                            onChange={e => {
                                                if (targetStudentId) return;
                                                const val = e.target.value;
                                                setReadingAns(prev => ({...prev, [q.id]: val}));
                                                setReadingVal(prev => ({...prev, [q.id]: 'unchecked'}));
                                            }} 
                                            className={cn("h-10 transition-all text-foreground", readingVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : readingVal[q.id] === 'incorrect' ? 'border-red-500 bg-red-50/10' : 'border-primary/30')} 
                                            autoComplete="off" 
                                            readOnly={!!targetStudentId}
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between border-t p-6 bg-muted/10">
                            <Button onClick={handleCheckReading} variant="secondary" className="px-8 font-bold">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('reading')} disabled={!readingIsAllCorrect && !isAdmin} className="px-10 font-black text-white">Continuar <ArrowRight className="ml-2 h-4 w-4" /></Button>
                        </CardFooter>
                    </Card>
                );
            case 'final_ex':
                return <FinalValidationExercise key="final_ex" title="Ejercicio Final: SER (10 frases)" prompts={finalExPrompts} onComplete={() => handleTopicComplete('final_ex')} vocabulary={allVocabList} />;
            case 'translate_text':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><div className="flex justify-between items-center"><div><CardTitle className='text-primary uppercase'>Traducción de Texto</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el siguiente párrafo al español.</CardDescription></div><Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger><PopoverContent className="w-64"><ScrollArea className="h-48 pr-4"><div className="space-y-2">{Object.entries(translationVocabHelp).map(([en, es], i) => (<div key={i} className="flex justify-between text-xs border-b pb-1"><span className="text-muted-foreground">{en}:</span><span className="font-bold text-primary">{es}</span></div>))}</div></ScrollArea></PopoverContent></Popover></div></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-sm">"My brother is tall and blonde. He is a very cheerful and kind engineer. I am a creative and serious student. My father is a brave doctor. My sister is pretty and shy, she is a famous artist. We are a very happy family."</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={translationText} onChange={(e) => { if (!targetStudentId) setTranslationText(e.target.value); }} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg leading-relaxed text-foreground" readOnly={!!targetStudentId} /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20">
                            <Button onClick={() => handleTopicComplete('translate_text')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Siguiente Misión <ArrowRight className='ml-3 h-8 w-8' /></Button>
                        </CardFooter>
                    </Card>
                );
            case 'final': return <FinalValidationExercise key="final" title="Final: Frases Negativas" prompts={negativePrompts} onComplete={() => setIsClassFinished(true)} vocabulary={allVocabList} isFinal={true} />;
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
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight">Verbo SER 🇪🇸</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30"><CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Misión A1</CardTitle></CardHeader>
                                <CardContent className="p-4">
                                    <nav><ul className="space-y-1">
                                        {learningPath.map((item) => {
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            const isSelected = selectedTopic === item.key;
                                            const Icon = item.icon;
                                            return (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', isSelected && 'bg-muted text-primary font-black border-l-4 border-primary')}>
                                                    <div className="flex items-center gap-3">
                                                        {item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}
                                                        <span className="truncate max-w-[150px] uppercase font-bold text-[10px]">{item.name}</span>
                                                    </div>
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

export default function SerClassPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
        }>
            <SerContent />
        </Suspense>
    );
}