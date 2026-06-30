
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
    MapPin,
    Smile
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
const progressStorageVersion = 'progress_es_a1_estar_v4_reordered';
const mainProgressKey = 'progress_a1_es_estar';

// --- DATA ---

const vocabularyData = {
    emociones: [
        { en: "HAPPY", es: "ALEGRE" },
        { en: "SAD", es: "TRISTE" },
        { en: "ANGRY", es: "ENOJADO" },
        { en: "SURPRISED", es: "SORPRENDIDO" },
        { en: "BORED", es: "ABURRIDO" },
        { en: "EXCITED", es: "EMOCIONADO" },
        { en: "NERVOUS", es: "NERVIOSO" },
        { en: "CALM", es: "TRANQUILO" },
        { en: "WORRIED", es: "PREOCUPADO" },
        { en: "AFRAID", es: "ASUSTADO" },
    ],
    estados: [
        { en: "SICK", es: "ENFERMO" },
        { en: "HEALTHY", es: "SANO" },
        { en: "HUNGRY", es: "HAMBRIENTO" },
        { en: "THIRSTY", es: "SEDIENTO" },
        { en: "HOT (FEELING)", es: "CALIENTE" },
        { en: "COLD (FEELING)", es: "FRÍO" },
        { en: "BUSY", es: "OCUPADO" },
        { en: "FREE", es: "LIBRE" },
        { en: "DIRTY", es: "SUCIO" },
        { en: "CLEAN", es: "LIMPIO" },
    ],
    lugares: [
        { en: "SCHOOL", es: "ESCUELA" },
        { en: "PARK", es: "PARQUE" },
        { en: "RESTAURANT", es: "RESTAURANTE" },
        { en: "HOSPITAL", es: "HOSPITAL" },
        { en: "CHURCH", es: "IGLESIA" },
        { en: "LIBRARY", es: "BIBLIOTECA" },
        { en: "SUPERMARKET", es: "SUPERMERCADO" },
        { en: "BANK", es: "BANCO" },
        { en: "HOUSE", es: "CASA" },
        { en: "STREET", es: "CALLE" },
    ]
};

const allVocabList = [...vocabularyData.emociones, ...vocabularyData.estados, ...vocabularyData.lugares];

const ex1Prompts = [
    { word: "Yo _______ en el parque.", answer: "estoy" },
    { word: "Tú _______ muy feliz hoy.", answer: "estás" },
    { word: "Él _______ en el hospital.", answer: "está" },
    { word: "Ella _______ cansada.", answer: "está" },
    { word: "Nosotros _______ en la escuela.", answer: "estamos" },
    { word: "Ellos _______ en el restaurante.", answer: "están" },
    { word: "Ustedes _______ preocupados.", answer: "están" },
];

const ex2Prompts = [
    { en: "I am at the bank.", es: ["yo estoy en el banco", "estoy en el banco"] },
    { en: "She is very busy.", es: ["ella está muy ocupada", "está muy ocupada"] },
    { en: "We are in the park.", es: ["nosotros estamos en el parque", "estamos en el parque"] },
    { en: "They are hungry.", es: ["ellos están hambrientos", "están hambrientos"] },
    { en: "You are at home.", es: ["tú estás en casa", "usted está en casa"] },
    { en: "He is sick.", es: ["él está enfermo", "está enfermo"] },
    { en: "The street is dirty.", es: ["la calle está sucia"] },
    { en: "The restaurant is clean.", es: ["el restaurante está limpio"] },
];

const ex3Prompts = [
    { en: "I am surprised.", es: ["yo estoy sorprendido", "estoy sorprendido"] },
    { en: "Are you nervous?", es: ["¿estás nervioso?", "estás nervioso?"] },
    { en: "We are at the library.", es: ["nosotros estamos en la biblioteca", "estamos en la biblioteca"] },
    { en: "The supermarket is busy.", es: ["el supermercado está ocupado"] },
    { en: "They are cold.", es: ["ellos tienen frío", "están fríos", "ellos están fríos"] },
    { en: "She is at church.", es: ["ella está en la iglesia", "está en la iglesia"] },
    { en: "I am free tomorrow.", es: ["yo estoy libre mañana", "estoy libre mañana"] },
    { en: "Is he at school?", es: ["¿él está en la escuela?", "está en la escuela?"] },
    { en: "We are excited.", es: ["estamos emocionados", "nosotros estamos emocionados"] },
    { en: "The park is beautiful.", es: ["el parque está hermoso", "el parque es hermoso"] },
];

const readingData = {
    title: "Un día movido",
    content: "Hoy es lunes y estoy muy ocupado. Por la mañana, estoy en la escuela con mis amigos. Nosotros estamos felices porque la clase es interesante. Al mediodía, mi hermano está en el restaurante porque tiene mucha hambre. Por la tarde, mi madre está en el supermercado y mi padre está en el banco. En la noche, todos estamos en casa. Yo estoy un poco cansado, pero estoy tranquilo.",
    questions: [
        { q: "¿Cómo está el narrador por la mañana?", a: ["ocupado", "muy ocupado"] },
        { q: "¿Dónde están los amigos?", a: ["en la escuela"] },
        { q: "¿Por qué está el hermano en el restaurante?", a: ["tiene hambre", "hambre", "porque tiene mucha hambre"] },
        { q: "¿Dónde está el padre por la tarde?", a: ["en el banco"] },
        { q: "¿Cómo está el narrador al final del día?", a: ["cansado", "cansado pero tranquilo"] },
    ]
};

const finalExPrompts = [
    { s: "1. Yo _______ en mi cuarto.", a: "estoy" },
    { s: "2. Las ventanas _______ abiertas.", a: "están" },
    { s: "3. El café _______ muy caliente.", a: "está" },
    { s: "4. Nosotros _______ en la playa.", a: "estamos" },
    { s: "5. ¿Tú _______ listo para salir?", a: "estás" },
    { s: "6. Madrid _______ en España.", a: "está" },
    { s: "7. Los niños _______ en el jardín.", a: "están" },
    { s: "8. Mi mamá _______ en el trabajo.", a: "está" },
    { s: "9. El cielo _______ azul hoy.", a: "está" },
    { s: "10. Ustedes _______ invitados a la fiesta.", a: "están" },
    { s: "11. El gato _______ sobre la mesa.", a: "está" },
    { s: "12. Yo _______ muy emocionado por el viaje.", a: "estoy" },
    { s: "13. La comida _______ deliciosa.", a: "está" },
    { s: "14. Nosotros _______ perdidos en la ciudad.", a: "estamos" },
    { s: "15. ¿Dónde _______ mis llaves?", a: "están" },
    { s: "16. Él _______ estudiando en la biblioteca.", a: "está" },
    { s: "17. La sopa _______ fría.", a: "está" },
    { s: "18. Ellos _______ jugando fútbol.", a: "están" },
    { s: "19. Yo _______ en el banco ahora.", a: "estoy" },
    { s: "20. La puerta _______ cerrada.", a: "está" },
    { s: "21. ¿Cómo _______ tu abuelo?", a: "está" },
    { s: "22. Nosotros _______ muy agradecidos.", a: "estamos" },
    { s: "23. Los libros _______ en el estante.", a: "están" },
    { s: "24. El carro _______ en el taller.", a: "está" },
    { s: "25. Tú _______ haciendo un gran trabajo.", a: "estás" },
    { s: "26. Yo _______ cansado de caminar.", a: "estoy" },
    { s: "27. La casa _______ sucia.", a: "está" },
    { s: "28. Mis padres _______ de vacaciones.", a: "están" },
    { s: "29. El sol _______ muy fuerte hoy.", a: "está" },
    { s: "30. El hospital _______ cerca de aquí.", a: "está" },
];

const negativeSentencesData = [
    { en: "I am not at the park.", es: ["no estoy en el parque", "yo no estoy en el parque"] },
    { en: "You are not sad.", es: ["no estás triste", "tú no estás triste", "tu no estas triste"] },
    { en: "He is not sick.", es: ["él no está enfermo", "el no esta enfermo", "no está enfermo"] },
    { en: "She is not busy today.", es: ["ella no está ocupada hoy", "no está ocupada hoy"] },
    { en: "We are not at the library.", es: ["no estamos en la biblioteca", "nosotros no estamos en la biblioteca"] },
    { en: "They are not hungry.", es: ["ellos no están hambrientos", "ellas no están hambrientas", "no están hambrientos"] },
    { en: "The cat is not on the table.", es: ["el gato no está en la mesa", "el gato no está sobre la mesa"] },
    { en: "My mother is not at the supermarket.", es: ["mi madre no está en el supermercado", "mi mamá no está en el supermercado"] },
    { en: "The water is not hot.", es: ["el agua no está caliente"] },
    { en: "I am not free tomorrow.", es: ["no estoy libre mañana", "yo no estoy libre mañana"] },
    { en: "We are not in the house.", es: ["no estamos en la casa", "nosotros no estamos en la casa"] },
    { en: "The street is not dirty.", es: ["la calle no está sucia"] },
    { en: "She is not worried.", es: ["ella no está preocupada", "no está preocupada"] },
    { en: "They are not at the restaurant.", es: ["ellos no están en el restaurante", "no están en el restaurante"] },
    { en: "You are not nervous.", es: ["tú no estás nervioso", "usted no está nervioso", "ustedes no están nerviosos"] },
];

const translationVocabHelp = {
    "hungry": "hambriento", "thirsty": "sediento", "busy": "ocupado", "tired": "cansado",
    "excited": "emocionado", "worried": "preocupado", "nervous": "nervioso",
    "restaurant": "restaurante", "supermarket": "supermercado", "bank": "banco", "house": "casa"
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

    const helpList = useMemo(() => {
        if (Array.isArray(vocabulary)) return vocabulary;
        if (typeof vocabulary === 'object' && vocabulary !== null) {
            return Object.entries(vocabulary).map(([es, en]) => ({ es, en }));
        }
        return allVocabList;
    }, [vocabulary]);

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="text-left">
                        <CardTitle>{title}</CardTitle>
                        <CardDescription className="font-bold text-foreground mt-1">
                            {type === 'translate' ? 'Traduce la frase al español.' : 'Completa con la forma correcta de ESTAR.'}
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
                                            <span className="text-muted-foreground text-left uppercase">{(v.en || v.spanish || '').toUpperCase()}:</span>
                                            <span className="font-bold text-right text-primary">{(v.es || v.answer || '').toUpperCase()}</span>
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

function EstarContent() {
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
        { key: 'translate_text', name: '8. Traducir Texto', icon: MessageSquare, status: 'locked' },
        { key: 'ex_neg', name: '9. Ejercicio Negativo', icon: X, status: 'locked' },
        { key: 'final', name: '10. Ejercicio Final', icon: Trophy, status: 'locked' },
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
        if (totalCorrect >= 10) { 
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

    const handleCheckFinal = () => {
        let okCount = 0;
        const nv = finalExPrompts.map((q, i) => {
            const isOk = q.a.toLowerCase() === (finalExAns[i] || '').trim().toLowerCase();
            if (isOk) okCount++;
            return isOk ? 'correct' : 'incorrect';
        });
        setFinalExVal(nv as any);
        if (okCount === finalExPrompts.length) { toast({ title: "¡Dominio Total!" }); handleTopicComplete('final'); }
        else toast({ variant: 'destructive', title: "Hay errores en la lista." });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'>
                            <CardTitle className="text-primary uppercase tracking-tighter">Vocabulario: Emociones, Estados y Ciudad</CardTitle>
                            <CardDescription className='font-bold text-foreground'>Escribe el significado en español para cada término.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <Accordion type="multiple" defaultValue={['emociones']} className="w-full">
                                {Object.keys(vocabularyData).map(cat => (
                                    <AccordionItem key={cat} value={cat}>
                                        <AccordionTrigger className="capitalize font-black text-primary text-sm tracking-widest">
                                            {cat === 'emociones' ? 'Emociones' : cat === 'estados' ? 'Estados Físicos' : 'Lugares de la Ciudad'}
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
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-foreground text-left overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Verbo ESTAR</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-primary uppercase mb-4">1. Conjugación (Presente)</h3>
                                <Table><TableHeader className='bg-muted/50'><TableRow><TableHead>Sujeto</TableHead><TableHead>Conjugación</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    <TableRow><TableCell className='font-bold'>Yo</TableCell><TableCell>ESTOY</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Tú</TableCell><TableCell>ESTÁS</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Él / Ella / Usted</TableCell><TableCell>ESTÁ</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Nosotros / Nosotras</TableCell><TableCell>ESTAMOS</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Ellos / Ellas / Ustedes</TableCell><TableCell>ESTÁN</TableCell></TableRow>
                                </TableBody></Table>
                            </div>

                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-primary uppercase mb-4 flex items-center gap-2">
                                    <Info className="h-5 w-5" /> 2. Usos del Verbo ESTAR
                                </h3>
                                <p className="mb-4 text-muted-foreground">A diferencia de SER, el verbo <strong>ESTAR</strong> se usa para estados transitorios o específicos:</p>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="p-4 bg-muted/30 rounded-xl border-l-4 border-primary">
                                        <h4 className="font-bold text-sm uppercase text-primary">Estados Temporales/Ánimo</h4>
                                        <p className="text-sm italic">Estoy cansado. Ella está feliz hoy.</p>
                                    </div>
                                    <div className="p-4 bg-muted/30 rounded-xl border-l-4 border-primary">
                                        <h4 className="font-bold text-sm uppercase text-primary">Ubicación</h4>
                                        <p className="text-sm italic">Estamos en el parque. El gato está en la mesa.</p>
                                    </div>
                                    <div className="p-4 bg-muted/30 rounded-xl border-l-4 border-primary">
                                        <h4 className="font-bold text-sm uppercase text-primary">Salud</h4>
                                        <p className="text-sm italic">Él está enfermo. Estoy sano.</p>
                                    </div>
                                    <div className="p-4 bg-muted/30 rounded-xl border-l-4 border-primary">
                                        <h4 className="font-bold text-sm uppercase text-primary">Estados Civiles</h4>
                                        <p className="text-sm italic">Ellos están casados. Ella está soltera.</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">He comprendido la gramática</Button></CardFooter>
                    </Card>
                );
            case 'ex1': return <BallsExercise title="Ejercicio 1: Conjugación" prompts={ex1Prompts} onComplete={() => handleTopicComplete('ex1')} type="article" />;
            case 'ex2': return <BallsExercise title="Ejercicio 2: Estar + Vocabulario" prompts={ex2Prompts} onComplete={() => handleTopicComplete('ex2')} />;
            case 'vocab_game': return <VocabularyMatchingGame data={allVocabList.slice(0, 12).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Memory Game: Estar" />;
            case 'ex3': return <BallsExercise title="Ejercicio 3: Mixto" prompts={ex3Prompts} onComplete={() => handleTopicComplete('ex3')} />;
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
            case 'translate_text':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><div className="flex justify-between items-center"><div><CardTitle className='text-primary uppercase'>Traducción de Texto</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el siguiente párrafo al español.</CardDescription></div><Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger><PopoverContent className="w-64"><ScrollArea className="h-48 pr-4"><div className="space-y-2">{Object.entries(translationVocabHelp).map(([en, es], i) => (<div key={i} className="flex justify-between text-xs border-b pb-1"><span className="text-muted-foreground">{en}:</span><span className="font-bold text-primary">{es}</span></div>))}</div></ScrollArea></PopoverContent></Popover></div></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-sm">"I am very busy today. My brother is at the restaurant because he is hungry. My mother is at the supermarket and my father is at the bank. We are all at house tonight. I am a little tired, but I am calm."</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={translationText} onChange={(e) => setTranslationText(e.target.value)} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg leading-relaxed" /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20"><Button onClick={() => handleTopicComplete('translate_text')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Siguiente Misión <ArrowRight className="ml-2 h-6 w-6" /></Button></CardFooter>
                    </Card>
                );
            case 'ex_neg':
                return <BallsExercise title="Ejercicio Negativo" prompts={negativeSentencesData} onComplete={() => handleTopicComplete('ex_neg')} vocabulary={{ "parque": "park", "triste": "sad", "enfermo": "sick", "ocupada": "busy", "mañana": "tomorrow", "sucia": "dirty", "preocupada": "worried", "restaurante": "restaurant" }} />;
            case 'final':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'>
                            <CardTitle className='text-primary uppercase tracking-tight'>Ejercicio Final: Dominio de ESTAR (30 frases)</CardTitle>
                            <CardDescription>Completa con la conjugación adecuada del verbo estar.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0"><ScrollArea className="h-[450px] p-6"><div className="space-y-4">
                            {finalExPrompts.map((q, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm"><p className="font-bold text-lg">{q.s}</p><Input value={finalExAns[i]} onChange={e => { const na = [...finalExAns]; na[i] = e.target.value; setFinalExAns(na); setFinalExVal(v => { const nv = [...v]; nv[i] = 'unchecked'; return nv as any; }); }} className={cn("h-10 max-w-[150px] text-lg font-mono", finalExVal[i] === 'correct' ? 'border-green-500' : finalExVal[i] === 'incorrect' ? 'border-red-500' : '')} placeholder="Respuesta..." autoComplete="off" /></div>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/20"><Button onClick={handleCheckFinal} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">Finalizar Misión</Button></CardFooter>
                    </Card>
                );
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
                           <Smile className='h-10 w-10 text-primary' /> Verbo ESTAR 🇪🇸
                        </h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30"><CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Misión A1</CardTitle></CardHeader>
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

export default function EstarPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
        }>
            <EstarContent />
        </Suspense>
    );
}