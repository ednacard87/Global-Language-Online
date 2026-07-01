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
    HelpCircle,
    Search,
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
const progressStorageVersion = 'progress_es_a1_preguntas_v9_expanded_grammar';
const mainProgressKey = 'progress_a1_es_preguntas';

// --- DATA ---

const vocabularyData = {
    actividades: [
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
    ],
    tiempo: [
        { en: "TODAY", es: "HOY" },
        { en: "TOMORROW", es: "MAÑANA" },
        { en: "YESTERDAY", es: "AYER" },
        { en: "NOW", es: "AHORA" },
        { en: "LATER", es: "LUEGO" },
        { en: "EARLY", es: "TEMPRANO" },
        { en: "LATE", es: "TARDE" },
        { en: "MORNING", es: "MAÑANA (M)" },
        { en: "AFTERNOON", es: "TARDE (A)" },
        { en: "NIGHT", es: "NOCHE" },
    ],
    personas: [
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
    ],
    opiniones: [
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
    ]
};

const allVocabList = Object.values(vocabularyData).flat();

const ex1Prompts = [
    { en: "How are you today?", es: ["¿Cómo estás hoy?", "como estas hoy"] },
    { en: "Who is your best friend?", es: ["¿Quién es tu mejor amigo?", "quien es tu mejor amigo"] },
    { en: "Where do you live now?", es: ["¿Dónde vives ahora?", "donde vives ahora"] },
    { en: "What do you do in the afternoon?", es: ["¿Qué haces en la tarde?", "que haces en la tarde"] },
    { en: "When is your birthday?", es: ["¿Cuándo es tu cumpleaños?", "cuando es tu cumpleaños"] },
    { en: "Why are you happy?", es: ["¿Por qué estás feliz?", "por que estas feliz"] },
    { en: "What do you want to eat today?", es: ["¿Qué quieres comer hoy?", "que quieres comer hoy"] },
];

const ex1Vocab = {
    "how": "cómo", "today": "hoy", "who": "quién", "best friend": "mejor amigo",
    "where": "dónde", "live": "vivir", "now": "ahora", "what": "qué",
    "do": "hacer", "afternoon": "tarde", "when": "cuándo", "birthday": "cumpleaños",
    "why": "por qué", "happy": "feliz", "want": "querer", "eat": "comer"
};

const ex2Prompts = [
    { en: "What time is it?", es: ["¿Qué hora es?", "que hora es"] },
    { en: "At what time do you work tomorrow?", es: ["¿A qué hora trabajas mañana?", "a que hora trabajas mañana"] },
    { en: "Where is your father now?", es: ["¿Dónde está tu padre ahora?", "donde esta tu padre ahora"] },
    { en: "When do you cook dinner?", es: ["¿Cuándo cocinas la cena?", "cuando cocinas la cena"] },
    { en: "Who studies with her?", es: ["¿Quién estudia con ella?", "quien estudia con ella"] },
    { en: "Why is the book boring?", es: ["¿Por qué el libro es aburrido?", "por que el libro es aburrido"] },
    { en: "What do you drink in the morning?", es: ["¿Qué bebes en la mañana?", "que bebes en la mañana"] },
    { en: "How do you go to school?", es: ["¿Cómo vas a la escuela?", "como vas a la escuela"] },
];

const ex2Vocab = {
    "what time": "qué hora", "work": "trabajar", "tomorrow": "mañana", "where": "dónde",
    "father": "padre", "when": "cuándo", "cook": "cocinar", "dinner": "cena",
    "who": "quién", "studies": "estudia", "why": "por qué", "boring": "aburrido",
    "drink": "beber", "morning": "mañana", "how": "cómo", "school": "escuela"
};

const ex3Prompts = [
    { en: "Who is that tall man?", es: ["¿Quién es ese hombre alto?", "quien es ese hombre alto"] },
    { en: "Why don't you study English?", es: ["¿Por qué no estudias inglés?", "por que no estudias ingles"] },
    { en: "What kind of music do you listen to?", es: ["¿Qué tipo de música escuchas?", "que tipo de musica escuchas"] },
    { en: "Where do you buy the food?", es: ["¿Dónde compras la comida?", "donde compras la comida"] },
    { en: "When do you travel to Spain?", es: ["¿Cuándo viajas a España?", "cuando viajas a españa"] },
    { en: "How is your new house?", es: ["¿Cómo es tu nueva casa?", "como es tu nueva casa"] },
    { en: "How old are you?", es: ["¿Cuántos años tienes?", "cuantos años tienes"] },
    { en: "Where are you from?", es: ["¿De dónde eres tú?", "de donde eres", "de donde eres tu"] },
    { en: "What do you want to do later?", es: ["¿Qué quieres hacer luego?", "que quieres hacer luego"] },
    { en: "Who cooks in your house?", es: ["¿Quién cocina en tu casa?", "quien cocina en tu casa"] },
];

const ex3Vocab = {
    "who": "quién", "tall": "alto", "man": "hombre", "why": "por qué",
    "study": "estudiar", "what kind of": "qué tipo de", "music": "música",
    "listen": "escuchar", "where": "dónde", "buy": "comprar", "food": "comida",
    "when": "cuándo", "travel": "viajar", "spain": "españa", "how": "cómo",
    "house": "casa", "how old": "cuántos años", "from": "de", "want": "querer",
    "later": "luego", "cooks": "cocina"
};

const readingData = {
    title: "Una entrevista interesante",
    content: "Hola, soy Marta y soy periodista. Hoy tengo una entrevista con un estudiante nuevo. Se llama Liam y es de Canadá. Liam, ¿cuándo estudias español? Liam responde: 'Estudio en la mañana'. ¿Por qué quieres aprender español? 'Porque es muy importante para mi trabajo'. ¿Dónde vives ahora? 'Vivo en un apartamento pequeño con mi hermano'. Liam es muy amigable y trabajador.",
    questions: [
        { q: "¿De dónde es Liam?", a: ["canadá", "de canadá"] },
        { q: "¿CUÁNDO estudia Liam español?", a: ["en la mañana", "mañana"] },
        { q: "¿POR QUÉ quiere aprender Liam español?", a: ["importante para su trabajo", "trabajo"] },
        { q: "¿DÓNDE vive Liam ahora?", a: ["en un apartamento", "apartamento pequeño"] },
        { q: "¿CÓMO es Liam?", a: ["amigable y trabajador", "amigable"] },
    ]
};

const finalExPrompts = [
    { s: "1. ¿_______ es tu nombre?", a: "cuál" },
    { s: "2. ¿_______ vives?", a: "dónde" },
    { s: "3. ¿_______ es ese hombre?", a: "quién" },
    { s: "4. ¿_______ vas a la fiesta?", a: "cuándo" },
    { s: "5. ¿_______ estás triste hoy?", a: "por qué" },
    { s: "6. ¿_______ cuesta este libro?", a: "cuánto" },
    { s: "7. ¿_______ estás hoy?", a: "cómo" },
    { s: "8. ¿_______ es tu deporte favorito?", a: "cuál" },
    { s: "9. ¿_______ son ellos?", a: "quiénes" },
    { s: "10. ¿_______ haces en tu tiempo libre?", a: "qué" },
    { s: "11. ¿_______ vive tu hermana?", a: "dónde" },
    { s: "12. ¿_______ es tu película favorita?", a: "cuál" },
    { s: "13. ¿_______ cocinas la cena?", a: "cuándo" },
    { s: "14. ¿_______ no comes carne?", a: "por qué" },
    { s: "15. ¿_______ años tienes?", a: "cuántos" },
    { s: "16. ¿_______ es tu profesor?", a: "quién" },
    { s: "17. ¿_______ está el gato?", a: "dónde" },
    { s: "18. ¿_______ viajas a Londres?", a: "cuándo" },
    { s: "19. ¿_______ es esto?", a: "qué" },
    { s: "20. ¿_______ estás tan feliz?", a: "por qué" },
    { s: "21. ¿_______ vas al gimnasio?", a: "cómo" },
    { s: "22. ¿_______ dinero necesitas?", a: "cuánto" },
    { s: "23. ¿_______ son tus llaves?", a: "cuáles" },
    { s: "24. ¿_______ es tu color favorito?", a: "cuál" },
    { s: "25. ¿_______ duermes en la tarde?", a: "por qué" },
    { s: "26. ¿_______ es tu madre?", a: "quién" },
    { s: "27. ¿_______ está el supermercado?", a: "dónde" },
    { s: "28. ¿_______ estudias inglés?", a: "cuándo" },
    { s: "29. ¿_______ haces ahora?", a: "qué" },
    { s: "30. ¿_______ es tu hermano?", a: "cómo" },
];

const negativeSentencesData = [
    { en: "Why don't you study?", es: ["¿por qué no estudias?", "¿por que no estudias?"] },
    { en: "Aren't you happy?", es: ["¿no estás feliz?", "¿no estas feliz?"] },
    { en: "Isn't she your sister?", es: ["¿no es ella tu hermana?", "¿no es tu hermana?"] },
    { en: "Don't they work today?", es: ["¿no trabajan ellos hoy?", "¿no trabajan hoy?"] },
    { en: "Why isn't he here?", es: ["¿por qué no está él aquí?", "¿por que no esta aqui?"] },
    { en: "Don't you want to eat?", es: ["¿no quieres comer?"] },
    { en: "Why don't we go now?", es: ["¿por qué no vamos ahora?", "¿por que no vamos ahora?"] },
    { en: "Isn't the book interesting?", es: ["¿no es interesante el libro?", "¿el libro no es interesante?"] },
    { en: "Aren't they your cousins?", es: ["¿no son ellos tus primos?", "¿no son tus primos?"] },
    { en: "Why don't you call her?", es: ["¿por qué no la llamas?", "¿por que no la llamas?"] },
    { en: "Isn't it cold today?", es: ["¿no hace frío hoy?", "¿no esta frio hoy?"] },
    { en: "Don't you have a car?", es: ["¿no tienes un carro?", "¿no tienes carro?"] },
    { en: "Why aren't you eating?", es: ["¿por qué no estás comiendo?", "¿por que no estas comiendo?"] },
    { en: "Isn't your father a teacher?", es: ["¿no es tu padre profesor?", "¿tu padre no es profesor?"] },
    { en: "Don't they live in Spain?", es: ["¿no viven ellos en españa?", "¿no viven en españa?"] },
];

const translationVocabHelp = {
    "interview": "entrevista", "journalist": "periodista", "newspaper": "periódico",
    "every morning": "cada mañana", "busy": "ocupado", "later": "luego / más tarde",
    "important": "importante", "how": "cómo", "when": "cuándo", "why": "por qué", "where": "dónde"
};

// --- HELPER COMPONENTS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary, type = 'translate' }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setAnswer(''); }, [currentIndex]);

    const handleCheck = () => {
        const userVal = answer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        let isCorrect = false;
        
        if (type === 'translate') {
            const possibleAnswers = prompts[currentIndex].answer || prompts[currentIndex].es;
            isCorrect = possibleAnswers.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
        } else {
            isCorrect = userVal === prompts[currentIndex].answer.toLowerCase();
        }
        
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Buen trabajo!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const helpList = useMemo(() => {
        if (!vocabulary) return [];
        return Object.entries(vocabulary).map(([en, es]) => ({ en: en as string, es: es as string }));
    }, [vocabulary]);

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="text-left">
                        <CardTitle>{title}</CardTitle>
                        <CardDescription className="font-bold text-foreground mt-1">
                            Traduce la frase al español.
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
                                    {helpList.map((v: any, i: number) => (
                                        <div key={i} className="flex justify-between text-[10px] border-b border-muted pb-1">
                                            <span className="text-muted-foreground text-left uppercase">{v.en}:</span>
                                            <span className="font-bold text-right text-primary">{v.es.toUpperCase()}</span>
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
                <Input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-12 text-lg text-foreground", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/5' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder="Traduce al español..." autoComplete="off" />
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

function PreguntasContent() {
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
    const [vocabAnswers, setVocabAnswers] = useState<Record<string, string[]>>({});
    const [vocabValidation, setVocabValidation] = useState<Record<string, any[]>>({});
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
        { key: 'final', name: '10. Final (Negativos)', icon: CheckCircle, status: 'locked' },
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
        if (totalCorrect >= 15) { 
            setCanAdvanceVocab(true); 
            toast({ title: "¡Excelente avance!" });
        } else {
            toast({ variant: 'destructive', title: "Sigue intentando", description: "Completa más palabras correctamente." });
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
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
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
                        <CardHeader className='bg-primary/5 border-b'>
                            <CardTitle className="text-primary uppercase tracking-tighter">Vocabulario: Actividades, Tiempo y Personas</CardTitle>
                            <CardDescription className='font-bold text-foreground'>Traduce los términos al español para avanzar.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <Accordion type="multiple" defaultValue={['actividades']} className="w-full">
                                {Object.keys(vocabularyData).map(cat => (
                                    <AccordionItem key={cat} value={cat}>
                                        <AccordionTrigger className="capitalize font-black text-primary text-sm tracking-widest">
                                            {cat.replace('_', ' ')}
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="font-black text-muted-foreground uppercase tracking-widest text-[10px] border-b pb-1">English</div>
                                                <div className="font-black text-muted-foreground uppercase tracking-widest text-[10px] border-b pb-1">Español</div>
                                                {(vocabularyData as any)[cat].map((v: any, i: number) => (
                                                    <Fragment key={i}>
                                                        <div className="flex items-center font-bold py-1 text-sm text-left">{v.en}</div>
                                                        <Input 
                                                            value={vocabAnswers[cat]?.[i] || ''} 
                                                            onChange={e => {
                                                                const newAns = { ...vocabAnswers };
                                                                newAns[cat][i] = e.target.value;
                                                                setVocabAnswers(newAns);
                                                                setVocabValidation(vv => {
                                                                    const nv = { ...vv };
                                                                    nv[cat][i] = 'unchecked';
                                                                    return nv;
                                                                });
                                                                setCanAdvanceVocab(false);
                                                            }}
                                                            className={cn("h-10 uppercase", vocabValidation[cat]?.[i] === 'correct' ? 'border-green-500 bg-green-50/5' : vocabValidation[cat]?.[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} 
                                                            autoComplete="off" 
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
                    <div className="space-y-6 text-left text-foreground">
                        <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 overflow-hidden text-foreground">
                            <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Las Preguntas 🇪🇸</CardTitle></CardHeader>
                            <CardContent className="space-y-8 px-0">
                                <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                    <h3 className="text-xl font-black text-primary uppercase mb-4 flex items-center gap-2"><Info className="h-5 w-5" /> 1. El Signo de Interrogación</h3>
                                    <p className="mb-4">En español, las preguntas <strong>obligatoriamente</strong> llevan dos signos: uno al inicio (<span className="text-primary font-bold">¿</span>) y uno al final (<span className="text-primary font-bold">?</span>).</p>
                                    <p className="mb-4">In Spanish, questions <strong>must</strong> have two marks: one at the beginning (<span className="text-primary font-bold">¿</span>) and one at the end (<span className="text-primary font-bold">?</span>).</p>
                                    <div className="bg-muted p-4 rounded-xl border-l-4 border-primary italic font-mono">¿Cómo estás? (Correcto) / Cómo estás? (Incorrecto)</div>
                                </div>

                                <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                    <h3 className="text-xl font-black text-primary uppercase mb-4 flex items-center gap-2"><Globe className="h-5 w-5" /> 2. Palabras Interrogativas (Wh Words)</h3>
                                    <Table>
                                        <TableHeader className='bg-muted/50'><TableRow><TableHead>English</TableHead><TableHead>Español</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            <TableRow><TableCell className='font-bold'>What?</TableCell><TableCell>¿Qué? / ¿Cuál?</TableCell></TableRow>
                                            <TableRow><TableCell className='font-bold'>Who?</TableCell><TableCell>¿Quién?</TableCell></TableRow>
                                            <TableRow><TableCell className='font-bold'>Where?</TableCell><TableCell>¿Dónde?</TableCell></TableRow>
                                            <TableRow><TableCell className='font-bold'>When?</TableCell><TableCell>¿Cuándo?</TableCell></TableRow>
                                            <TableRow><TableCell className='font-bold'>Why?</TableCell><TableCell>¿Por qué?</TableCell></TableRow>
                                            <TableRow><TableCell className='font-bold'>How?</TableCell><TableCell>¿Cómo?</TableCell></TableRow>
                                            <TableRow><TableCell className='font-bold'>How much / many?</TableCell><TableCell>¿Cuánto / Cuántos?</TableCell></TableRow>
                                        </TableBody>
                                    </Table>
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
                                                    <p className="text-primary font-bold">¿Cuándo es VUESTRA fiesta?</p>
                                                    <p className="text-muted-foreground text-xs uppercase">When is YOUR (pl.) party?</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center pt-6 border-t">
                                <Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">He comprendido la gramática</Button>
                            </CardFooter>
                        </Card>
                    </div>
                );
            case 'ex1': return <BallsExercise title="Ejercicio 1" prompts={ex1Prompts} onComplete={() => handleTopicComplete('ex1')} vocabulary={ex1Vocab} />;
            case 'ex2': return <BallsExercise title="Ejercicio 2" prompts={ex2Prompts} onComplete={() => handleTopicComplete('ex2')} vocabulary={ex2Vocab} />;
            case 'vocab_game': return <VocabularyMatchingGame data={allVocabList.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Memory Game: Preguntas" />;
            case 'ex3': return <BallsExercise title="Ejercicio 3" prompts={ex3Prompts} onComplete={() => handleTopicComplete('ex3')} vocabulary={ex3Vocab} />;
            case 'reading':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tight'>{readingData.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-inner">{readingData.content}</div>
                            <Separator />
                            <div className="space-y-4 text-foreground">
                                <h3 className='font-black text-primary uppercase text-sm'>Comprensión:</h3>
                                {readingData.questions.map((q, i) => (
                                    <div key={i} className="space-y-2 p-3 bg-muted/20 rounded-xl border">
                                        <Label className="font-bold text-foreground text-left">{q.q}</Label>
                                        <Input value={readingAns[i]} onChange={e => { const na = [...readingAns]; na[i] = e.target.value; setReadingVal(v => { const nv = [...v]; nv[i] = 'unchecked'; return nv as any; }); }} className={cn("h-10", readingVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : readingVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" />
                                    </div>
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
                            <CardTitle className='text-primary uppercase tracking-tight'>Ejercicio Final: Completar Preguntas (30)</CardTitle>
                            <CardDescription>Completa con la palabra interrogativa adecuada (Qué, Cómo, Dónde, Quién, etc.).</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0"><ScrollArea className="h-[450px] p-6"><div className="space-y-4">
                            {finalExPrompts.map((q, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm text-foreground">
                                    <p className="font-bold text-lg">{q.s}</p>
                                    <Input value={finalExAns[i]} onChange={e => { const na = [...finalExAns]; na[i] = e.target.value; setFinalExAns(na); setFinalExVal(v => { const nv = [...v]; nv[i] = 'unchecked'; return nv as any; }); }} className={cn("h-10 max-w-[150px] text-lg font-mono", finalExVal[i] === 'correct' ? 'border-green-500' : finalExVal[i] === 'incorrect' ? 'border-red-500' : '')} placeholder="Respuesta..." autoComplete="off" />
                                </div>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/20"><Button onClick={handleCheckFinalEx} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">Verificar Misión</Button></CardFooter>
                    </Card>
                );
            case 'translate_text':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><div className="flex justify-between items-center"><div><CardTitle className='text-primary uppercase'>Traducción: La Entrevista</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el siguiente párrafo al español.</CardDescription></div><Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger><PopoverContent className="w-64"><ScrollArea className="h-48 pr-4"><div className="space-y-2">{Object.entries(translationVocabHelp).map(([en, es], i) => (<div key={i} className="flex justify-between text-xs border-b pb-1"><span className="text-muted-foreground">{en}:</span><span className="font-bold text-primary">{es}</span></div>))}</div></ScrollArea></PopoverContent></Popover></div></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-sm">"I have an interview for the newspaper today. I am very busy every morning. How are you today? When is your interview? Why do you want to learn Spanish? Where do you live now? We can study together later because it is important for your job."</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={translationText} onChange={(e) => setTranslationText(e.target.value)} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg leading-relaxed" /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20"><Button onClick={() => handleTopicComplete('translate_text')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Siguiente Misión <ArrowRight className='ml-3 h-8 w-8' /></Button></CardFooter>
                    </Card>
                );
            case 'final': return <BallsExercise title="Final: Preguntas Negativas" prompts={negativeSentencesData} onComplete={() => handleTopicComplete('final')} vocabulary={translationVocabHelp} />;
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
                           <HelpCircle className='h-10 w-10 text-primary' /> Preguntas 🇪🇸
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

export default function PreguntasPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
        }>
            <PreguntasContent />
        </Suspense>
    );
}