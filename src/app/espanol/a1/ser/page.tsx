
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
    Search,
    UserCircle,
    Users
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
const progressStorageVersion = 'progress_es_a1_ser_v4_full_content';
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
    { en: "My father is serious.", es: ["mi padre es serio", "mi papá es serio"] },
    { en: "The students are creative.", es: ["los estudiantes son creativos"] },
    { en: "A teacher is patient.", es: ["un profesor es paciente", "una profesora es paciente"] },
    { en: "The actors are funny.", es: ["los actores son divertidos"] },
    { en: "She is a generous nurse.", es: ["ella es una enfermera generosa"] },
    { en: "We are brave police officers.", es: ["nosotros somos policías valientes"] },
    { en: "The writer is famous.", es: ["el escritor es famoso"] },
];

const ex3Prompts = [
    { word: "Yo _______ inteligente.", answer: "soy" },
    { word: "Tú _______ mi amigo.", answer: "eres" },
    { word: "Él _______ médico.", answer: "es" },
    { word: "Ella _______ muy alta.", answer: "es" },
    { word: "Nosotros _______ de Colombia.", answer: "somos" },
    { word: "Ellos _______ perezosos.", answer: "son" },
    { word: "Ustedes _______ estudiantes.", answer: "son" },
    { word: "El gato _______ pequeño.", answer: "es" },
    { word: "Las flores _______ rojas.", answer: "son" },
    { word: "Usted _______ muy amable.", answer: "es" },
];

const readingData = {
    title: "El Nuevo Estudiante",
    content: "Hola, yo soy Marco. Yo soy un estudiante nuevo en la escuela. Yo soy de Italia. Yo soy alto y moreno. Mis amigos dicen que yo soy muy alegre y amigable. Mi padre es ingeniero y mi madre es enfermera. Ellos son personas muy trabajadoras y generosas. Nosotros somos una familia feliz.",
    questions: [
        { q: "¿Quién es Marco?", a: ["un estudiante", "un estudiante nuevo"] },
        { q: "¿De dónde es Marco?", a: ["de italia"] },
        { q: "¿Cómo es físicamente Marco?", a: ["alto y moreno"] },
        { q: "¿Qué profesión tiene el padre?", a: ["ingeniero"] },
        { q: "¿Cómo es la familia de Marco?", a: ["feliz", "una familia feliz"] },
    ]
};

const finalExPrompts = [
    { s: "1. Yo _______ un artista.", a: "soy" },
    { s: "2. Las manzanas _______ dulces.", a: "son" },
    { s: "3. El sol _______ amarillo.", a: "es" },
    { s: "4. Nosotros _______ hermanos.", a: "somos" },
    { s: "5. Tú _______ muy joven.", a: "eres" },
    { s: "6. María _______ abogada.", a: "es" },
    { s: "7. Los libros _______ interesantes.", a: "son" },
    { s: "8. Juan y yo _______ amigos.", a: "somos" },
    { s: "9. El coche _______ azul.", a: "es" },
    { s: "10. Ustedes _______ valientes.", a: "son" },
    { s: "11. El mar _______ inmenso.", a: "es" },
    { s: "12. La nieve _______ blanca.", a: "es" },
    { s: "13. Mi perro _______ fiel.", a: "es" },
    { s: "14. Los pájaros _______ pequeños.", a: "son" },
    { s: "15. Nosotros _______ de España.", a: "somos" },
    { s: "16. Tú _______ muy honesto.", a: "eres" },
    { s: "17. Ella _______ mi madre.", a: "es" },
    { s: "18. Los días _______ largos.", a: "son" },
    { s: "19. El café _______ amargo.", a: "es" },
    { s: "20. Las casas _______ grandes.", a: "son" },
    { s: "21. El gato _______ negro.", a: "es" },
    { s: "22. Nosotros _______ pacientes.", a: "somos" },
    { s: "23. Los árboles _______ verdes.", a: "son" },
    { s: "24. El examen _______ fácil.", a: "es" },
    { s: "25. Tú _______ mi hermano.", a: "eres" },
    { s: "26. Yo _______ de México.", a: "soy" },
    { s: "27. La mesa _______ de madera.", a: "es" },
    { s: "28. Los niños _______ alegres.", a: "son" },
    { s: "29. Usted _______ un buen profesor.", a: "es" },
    { s: "30. El cielo _______ azul.", a: "es" },
];

const negativePrompts = [
    { en: "I am not lazy.", es: ["yo no soy perezoso", "no soy perezoso"] },
    { en: "She is not a doctor.", es: ["ella no es médica", "ella no es un médico", "no es médica"] },
    { en: "They are not serious.", es: ["ellos no son serios", "ellas no son serias", "no son serios"] },
    { en: "We are not tired.", es: ["nosotros no somos cansados", "no somos cansados"] },
    { en: "You are not short.", es: ["tú no eres bajo", "usted no es bajo"] },
    { en: "He is not an artist.", es: ["él no es artista", "él no es un artista"] },
    { en: "The cat is not black.", es: ["el gato no es negro"] },
    { en: "I am not a lawyer.", es: ["yo no soy abogado", "no soy abogado"] },
    { en: "They are not from Italy.", es: ["ellos no son de italia"] },
    { en: "We are not creative.", es: ["nosotros no somos creativos"] },
    { en: "She is not shy.", es: ["ella no es tímida"] },
    { en: "You are not old.", es: ["tú no eres viejo", "usted no es viejo"] },
    { en: "The sky is not green.", es: ["el cielo no es verde"] },
    { en: "He is not my friend.", es: ["él no es mi amigo"] },
    { en: "The books are not small.", es: ["los libros no son pequeños"] },
];

const translationVocabHelp = {
    "brother": "hermano", "tall": "alto", "blonde": "rubio", "cheerful": "alegre",
    "kind": "amable", "engineer": "ingeniero", "creative": "creativo", "serious": "serio",
    "doctor": "médico", "brave": "valiente", "sister": "hermana", "pretty": "bonita",
    "shy": "tímida", "artist": "artista", "happy": "feliz"
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
                            {type === 'translate' ? 'Traduce la frase al español.' : 'Completa la conjugación del verbo SER.'}
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
                                    {(vocabulary || allVocabList).map((v: any, i: number) => (
                                        <div key={i} className="flex justify-between text-[10px] border-b border-muted pb-1">
                                            <span className="text-muted-foreground text-left uppercase">{v.en}:</span>
                                            <span className="font-bold text-right text-primary">{v.es}</span>
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
                <Input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-12 text-lg text-foreground", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/5' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder={type === 'translate' ? "Escribe en español..." : "Conjugación..."} autoComplete="off" />
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

function SerContent() {
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
        { key: 'ex3', name: '5. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'reading', name: '7. Lectura', icon: BookText, status: 'locked' },
        { key: 'final_ex', name: '8. Ejercicio Final', icon: Trophy, status: 'locked' },
        { key: 'translate_text', name: '9. Traducir Texto', icon: MessageSquare, status: 'locked' },
        { key: 'final', name: '10. Final', icon: CheckCircle, status: 'locked' },
    ], []);

    // FUNCTIONS DEFINED BEFORE USE
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
            if (win) setTimeout(() => toast({ title: "¡Misión superada!" }), 0);
            if (next) { const n = next; setTimeout(() => setSelectedTopic(n), 0); }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleVocabCheck = () => {
        let totalCount = 0;
        let totalCorrect = 0;
        const newVal: Record<string, any[]> = {};
        
        Object.keys(vocabularyData).forEach(cat => {
            newVal[cat] = (vocabularyData as any)[cat].map((v: any, i: number) => {
                const isCorrect = v.es.toLowerCase() === (vocabAnswers[cat]?.[i] || '').trim().toLowerCase();
                totalCount++;
                if (isCorrect) totalCorrect++;
                return isCorrect ? 'correct' : 'incorrect';
            });
        });

        setVocabValidation(newVal);
        if (totalCorrect >= 15) { 
            setCanAdvanceVocab(true); 
            toast({ title: "¡Excelente avance!", description: `Llevas ${totalCorrect} aciertos.` });
        } else {
            toast({ variant: 'destructive', title: "Necesitas más aciertos", description: "Sigue completando el vocabulario." });
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
                                                                setVocabValidation(vv => {
                                                                    const nv = { ...vv };
                                                                    if (!nv[cat]) nv[cat] = [];
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
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-foreground text-left overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Verbo SER y Adjetivos</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-primary uppercase mb-4">1. El Verbo SER (Presente)</h3>
                                <Table><TableHeader className='bg-muted/50'><TableRow><TableHead>Sujeto</TableHead><TableHead>Conjugación</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    <TableRow><TableCell className='font-bold'>Yo</TableCell><TableCell>SOY</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Tú / Vosotros</TableCell><TableCell>ERES / SOIS</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Él / Ella / Usted</TableCell><TableCell>ES</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Nosotros / Nosotras</TableCell><TableCell>SOMOS</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Ellos / Ellas / Ustedes</TableCell><TableCell>SON</TableCell></TableRow>
                                </TableBody></Table>
                            </div>
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4">
                                <h3 className="text-xl font-black text-primary uppercase mb-2">2. Adjetivos y Concordancia</h3>
                                <div className='grid gap-4 md:grid-cols-2'>
                                    <div className='p-4 bg-primary/10 rounded-xl border border-primary/20'>
                                        <h4 className='font-bold text-primary'>Género:</h4>
                                        <p className="text-sm">El adjetivo debe coincidir con el sujeto.</p>
                                        <p className='text-xs font-mono mt-1'>Ej: Él es alt<span className='font-black'>o</span> / Ella es alt<span className='font-black'>a</span></p>
                                    </div>
                                    <div className='p-4 bg-primary/10 rounded-xl border border-primary/20'>
                                        <h4 className='font-bold text-primary'>Número:</h4>
                                        <p className="text-sm">Se agrega 's' o 'es' para el plural.</p>
                                        <p className='text-xs font-mono mt-1'>Ej: Él es amabl<span className='font-black'>e</span> / Ellos son amabl<span className='font-black'>es</span></p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">He comprendido la gramática</Button></CardFooter>
                    </Card>
                );
            case 'ex1': return <BallsExercise title="Ejercicio 1: Frases Básicas" prompts={ex1Prompts} onComplete={() => handleTopicComplete('ex1')} />;
            case 'ex2': return <BallsExercise title="Ejercicio 2: SER + Vocabulario" prompts={ex2Prompts} onComplete={() => handleTopicComplete('ex2')} />;
            case 'ex3': return <BallsExercise title="Ejercicio 3: Conjugación" type="article" prompts={ex3Prompts} onComplete={() => handleTopicComplete('ex3')} vocabulary={allVocabList} />;
            case 'vocab_game': return <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm"><CardHeader><CardTitle>Juego de Memoria</CardTitle></CardHeader><CardContent><VocabularyMatchingGame data={allVocabList.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Encuentra las parejas de la Clase Ser" /></CardContent></Card>;
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
                                <CardTitle className='text-primary uppercase tracking-tight'>Ejercicio Final: SER (30 frases)</CardTitle>
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
                                                {allVocabList.map((v: any, i) => (
                                                    <div key={i} className="flex justify-between text-[10px] border-b border-muted pb-1">
                                                        <span className="text-muted-foreground text-left uppercase">{v.en}:</span>
                                                        <span className="font-bold text-right text-primary">{v.es}</span>
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
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-sm">"My brother is tall and blonde. He is a very cheerful and kind engineer. I am a creative and serious student. My father is a brave doctor. My sister is pretty and shy, she is a famous artist. We are a very happy family."</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={translationText} onChange={(e) => setTranslationText(e.target.value)} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg leading-relaxed" /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20"><Button onClick={() => handleTopicComplete('translate_text')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Terminar Misión <Trophy className='ml-3 h-8 w-8' /></Button></CardFooter>
                    </Card>
                );
            case 'final': return <BallsExercise title="Final: Frases Negativas" prompts={negativePrompts} onComplete={() => handleTopicComplete('final')} />;
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