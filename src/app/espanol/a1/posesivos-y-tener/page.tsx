
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
    Users,
    Check,
    X,
    Info,
    Search,
    Pencil
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
const progressStorageVersion = 'progress_es_a1_pos_tener_v4_categorized';
const mainProgressKey = 'progress_a1_es_posesivos_y_tener';

// --- DATA ---

const classVocab = [
    // Familia (16)
    { en: "FATHER", es: "PADRE", cat: "Familia" },
    { en: "MOTHER", es: "MADRE", cat: "Familia" },
    { en: "SON", es: "HIJO", cat: "Familia" },
    { en: "DAUGHTER", es: "HIJA", cat: "Familia" },
    { en: "BROTHER", es: "HERMANO", cat: "Familia" },
    { en: "SISTER", es: "HERMANA", cat: "Familia" },
    { en: "GRANDFATHER", es: "ABUELO", cat: "Familia" },
    { en: "GRANDMOTHER", es: "ABUELA", cat: "Familia" },
    { en: "UNCLE", es: "TÍO", cat: "Familia" },
    { en: "AUNT", es: "TÍA", cat: "Familia" },
    { en: "COUSIN", es: "PRIMO", cat: "Familia" },
    { en: "NEPHEW", es: "SOBRINO", cat: "Familia" },
    { en: "NIECE", es: "SOBRINA", cat: "Familia" },
    { en: "HUSBAND", es: "ESPOSO", cat: "Familia" },
    { en: "WIFE", es: "ESPOSA", cat: "Familia" },
    { en: "PARENTS", es: "PADRES", cat: "Familia" },
    // Mascotas (8)
    { en: "DOG", es: "PERRO", cat: "Mascotas" },
    { en: "CAT", es: "GATO", cat: "Mascotas" },
    { en: "FISH", es: "PEZ", cat: "Mascotas" },
    { en: "BIRD", es: "PÁJARO", cat: "Mascotas" },
    { en: "RABBIT", es: "CONEJO", cat: "Mascotas" },
    { en: "HAMSTER", es: "HÁMSTER", cat: "Mascotas" },
    { en: "TURTLE", es: "TORTUGA", cat: "Mascotas" },
    { en: "PARROT", es: "LORO", cat: "Mascotas" },
    // Objetos Personales (16)
    { en: "CELLPHONE", es: "CELULAR", cat: "Objetos Personales" },
    { en: "WALLET", es: "BILLETERA", cat: "Objetos Personales" },
    { en: "KEYS", es: "LLAVES", cat: "Objetos Personales" },
    { en: "WATCH", es: "RELOJ", cat: "Objetos Personales" },
    { en: "BACKPACK", es: "MALETA", cat: "Objetos Personales" },
    { en: "LAPTOP", es: "PORTÁTIL", cat: "Objetos Personales" },
    { en: "GLASSES", es: "GAFAS", cat: "Objetos Personales" },
    { en: "RING", es: "ANILLO", cat: "Objetos Personales" },
    { en: "EARRINGS", es: "ARETES", cat: "Objetos Personales" },
    { en: "BRUSH", es: "CEPILLO", cat: "Objetos Personales" },
    { en: "COMB", es: "PEINE", cat: "Objetos Personales" },
    { en: "MIRROR", es: "ESPEJO", cat: "Objetos Personales" },
    { en: "UMBRELLA", es: "SOMBRILLA", cat: "Objetos Personales" },
    { en: "CREDIT CARD", es: "TARJETA DE CRÉDITO", cat: "Objetos Personales" },
    { en: "ID CARD", es: "CÉDULA", cat: "Objetos Personales" },
    { en: "KEYCHAIN", es: "LLAVERO", cat: "Objetos Personales" },
];

const ex1Prompts = [
    { en: "I have a dog.", es: ["yo tengo un perro", "tengo un perro"] },
    { en: "She has a cat.", es: ["ella tiene un gato", "tiene un gato"] },
    { en: "We have a house.", es: ["nosotros tenemos una casa", "nosotras tenemos una casa", "tenemos una casa"] },
    { en: "They have a car.", es: ["ellos tienen un carro", "ellas tienen un carro", "tienen un carro"] },
    { en: "You have keys.", es: ["tú tienes llaves", "tu tienes llaves", "usted tiene llaves"] },
    { en: "He has a watch.", es: ["él tiene un reloj", "el tiene un reloj"] },
    { en: "The cat has a toy.", es: ["el gato tiene un juguete"] },
];

const ex2Prompts = [
    { en: "My brother has a cellphone.", es: ["mi hermano tiene un celular"] },
    { en: "Your aunt has a bicycle.", es: ["tu tía tiene una bicicleta", "tu tia tiene una bicicleta"] },
    { en: "His dog has a ball.", es: ["su perro tiene una pelota"] },
    { en: "Her sister has a backpack.", es: ["su hermana tiene una maleta", "su hermana tiene una mochila"] },
    { en: "Our family has a house.", es: ["nuestra familia tiene una casa"] },
    { en: "Their parents have a car.", es: ["sus padres tienen un carro"] },
    { en: "My cat has a fish.", es: ["mi gato tiene un pez"] },
    { en: "Your cousin has glasses.", es: ["tu primo tiene gafas", "tu prima tiene gafas"] },
];

const ex3Prompts = [
    { en: "I have my keys.", es: ["yo tengo mis llaves", "tengo mis llaves"] },
    { en: "She has her backpack.", es: ["ella tiene su maleta", "ella tiene su mochila"] },
    { en: "We have our pet.", es: ["nosotros tenemos nuestra mascota", "tenemos nuestra mascota"] },
    { en: "He has his laptop.", es: ["él tiene su portátil", "él tiene su computador"] },
    { en: "They have their clothes.", es: ["ellos tienen su ropa", "ellas tienen su ropa"] },
    { en: "You have your ring.", es: ["tú tienes tu anillo", "usted tiene su anillo"] },
    { en: "My mother has her earrings.", es: ["mi madre tiene sus aretes", "mi mamá tiene sus aretes"] },
    { en: "His father has his car.", es: ["su padre tiene su carro", "su papá tiene su carro"] },
    { en: "Her grandmother has her cat.", es: ["su abuela tiene su gato"] },
    { en: "Our grandfather has his watch.", es: ["nuestro abuelo tiene su reloj"] },
];

const readingData = {
    title: "La Familia de Pedro",
    content: "Hola, yo soy Pedro. Yo tengo una familia muy bonita. Mi padre tiene un carro azul y mi madre tiene una bicicleta roja. Yo tengo un hermano y una hermana. Mi hermano tiene un perro pequeño y mi hermana tiene un gato blanco. Nosotros tenemos una casa grande en la ciudad. Mis abuelos tienen una finca con muchos animales. Yo tengo mis libros en mi maleta nueva.",
    questions: [
        { q: "¿Quién tiene un carro azul?", a: ["el padre", "su padre", "el papá"] },
        { q: "¿Qué tiene la hermana de Pedro?", a: ["un gato", "un gato blanco"] },
        { q: "¿Cómo es el perro del hermano?", a: ["pequeño", "es pequeño"] },
        { q: "¿Dónde está la casa de la familia?", a: ["en la ciudad"] },
        { q: "¿Qué tienen los abuelos?", a: ["una finca", "una finca con animales"] },
    ]
};

const finalExPrompts = [
    { s: "1. Yo tengo ___ (my) celular.", a: "mi" },
    { s: "2. Ella tiene ___ (her) llaves.", a: "sus" },
    { s: "3. Nosotros tenemos ___ (our) casa.", a: "nuestra" },
    { s: "4. Él tiene ___ (his) reloj.", a: "su" },
    { s: "5. Tú tienes ___ (your) mochila.", a: "tu" },
    { s: "6. Ellos tienen ___ (their) perro.", a: "su" },
    { s: "7. Ana tiene ___ (her) aretes.", a: "sus" },
    { s: "8. Carlos tiene ___ (his) anillo.", a: "su" },
    { s: "9. Mis padres tienen ___ (their) carro.", a: "su" },
    { s: "10. Nosotros tenemos ___ (our) libros.", a: "nuestros" },
    { s: "11. El gato tiene ___ (its) juguete.", a: "su" },
    { s: "12. Yo tengo ___ (my) gafas.", a: "mis" },
    { s: "13. Tú tienes ___ (your) zapatos.", a: "tus" },
    { s: "14. Ella tiene ___ (her) ropa.", a: "su" },
    { s: "15. Nosotros tenemos ___ (our) mascotas.", a: "nuestras" },
    { s: "16. ___ (My) padre es alto.", a: "mi" },
    { s: "17. ___ (Your) madre es amable.", a: "tu" },
    { s: "18. ___ (His) hermano estudia inglés.", a: "su" },
    { s: "19. ___ (Her) abuela cocina rico.", a: "su" },
    { s: "20. ___ (Our) perro es inteligente.", a: "nuestro" },
    { s: "21. ___ (Their) casa es blanca.", a: "su" },
    { s: "22. ___ (My) primos viven aquí.", a: "mis" },
    { s: "23. ___ (Your) llaves están allí.", a: "tus" },
    { s: "24. ___ (Our) abuelos son viejos.", a: "nuestros" },
    { s: "25. ___ (His) gato duerme mucho.", a: "su" },
    { s: "26. ___ (Her) maleta es pesada.", a: "su" },
    { s: "27. ___ (Their) hijos son jóvenes.", a: "sus" },
    { s: "28. ___ (My) portátil es nuevo.", a: "mi" },
    { s: "29. ___ (Our) tía es profesora.", a: "nuestra" },
    { s: "30. ___ (Your) anillo es caro.", a: "tu" },
];

const negativePrompts = [
    { en: "I don't have a car.", es: ["yo no tengo un carro", "no tengo un carro"] },
    { en: "She doesn't have her keys.", es: ["ella no tiene sus llaves", "no tiene sus llaves"] },
    { en: "We don't have a pet.", es: ["nosotros no tenemos una mascota", "no tenemos mascota"] },
    { en: "He doesn't have his watch.", es: ["él no tiene su reloj", "el no tiene su reloj"] },
    { en: "They don't have our books.", es: ["ellos no tienen nuestros libros", "ellas no tienen nuestros libros"] },
    { en: "You don't have my cellphone.", es: ["tú no tienes mi celular", "usted no tiene mi celular"] },
    { en: "My sister doesn't have a cat.", es: ["mi hermana no tiene un gato"] },
    { en: "Your uncle doesn't have a house.", es: ["tu tío no tiene una casa", "tu tio no tiene casa"] },
    { en: "His cousin doesn't have a laptop.", es: ["su primo no tiene un portátil", "su primo no tiene computador"] },
    { en: "Her parents don't have a bicycle.", es: ["sus padres no tienen una bicicleta"] },
    { en: "We don't have their address.", es: ["nosotros no tenemos su dirección", "no tenemos su direccion"] },
    { en: "I don't have your backpack.", es: ["yo no tengo tu maleta", "no tengo tu maleta"] },
    { en: "They don't have his shoes.", es: ["ellos no tienen sus zapatos", "ellas no tienen sus zapatos"] },
    { en: "She doesn't have my ring.", es: ["ella no tiene mi anillo"] },
    { en: "He doesn't have your glasses.", es: ["él no tiene tus gafas", "el no tiene tus gafas"] },
];

const globalVocabMap: Record<string, string> = classVocab.reduce((acc, curr) => {
    acc[curr.es.toLowerCase()] = curr.en.toLowerCase();
    return acc;
}, {} as Record<string, string>);

const translationVocabHelp = {
    "family": "familia", "small": "pequeña", "sister": "hermana", "name": "nombre",
    "beautiful": "hermoso", "dog": "perro", "parents": "padres", "car": "carro",
    "house": "casa", "city": "ciudad", "grandparents": "abuelos", "farm": "finca",
    "animals": "animales", "books": "libros", "backpack": "maleta"
};

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

function PosesivosTenerContent() {
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
        { key: 'ex3', name: '5. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'reading', name: '7. Lectura', icon: BookText, status: 'locked' },
        { key: 'final_ex', name: '8. Ejercicio Final', icon: Trophy, status: 'locked' },
        { key: 'translate_text', name: '9. Traducir Texto', icon: MessageSquare, status: 'locked' },
        { key: 'final', name: '10. Final', icon: CheckCircle, status: 'locked' },
    ], []);

    // FUNCTIONS DECLARED BEFORE handleTopicSelect TO PREVENT REFERENCE ERROR
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
        let okCount = 0;
        const nv = classVocab.map((item, idx) => {
            const isCorrect = item.es.toLowerCase() === (vocabAnswers[idx] || '').trim().toLowerCase();
            if (isCorrect) okCount++;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv as any);
        if (okCount >= 10) { setCanAdvanceVocab(true); toast({ title: "¡Buen avance!" }); }
        else toast({ variant: 'destructive', title: "Necesitas al menos 10 aciertos para avanzar." });
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
                const categories = ["Familia", "Mascotas", "Objetos Personales"];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'>
                            <CardTitle className="text-primary uppercase tracking-tighter">Vocabulario: Familia, Mascotas y Objetos</CardTitle>
                            <CardDescription className='font-bold text-foreground'>Escribe el significado en español para cada término.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <Accordion type="multiple" defaultValue={["Familia"]} className="w-full">
                                {categories.map(cat => (
                                    <AccordionItem key={cat} value={cat}>
                                        <AccordionTrigger className="text-primary font-black uppercase text-sm tracking-widest">{cat}</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="font-black text-muted-foreground uppercase tracking-widest text-[10px] border-b pb-1">English</div>
                                                <div className="font-black text-muted-foreground uppercase tracking-widest text-[10px] border-b pb-1">Español</div>
                                                {classVocab.filter(v => v.cat === cat).map((v) => {
                                                    const originalIndex = classVocab.findIndex(cv => cv.en === v.en);
                                                    return (
                                                        <Fragment key={v.en}>
                                                            <div className="flex items-center font-bold py-1 text-sm">{v.en}</div>
                                                            <Input 
                                                                value={vocabAnswers[originalIndex] || ''} 
                                                                onChange={e => { 
                                                                    const na = [...vocabAnswers]; 
                                                                    na[originalIndex] = e.target.value; 
                                                                    setVocabAnswers(na); 
                                                                    setVocabValidation(vv => { 
                                                                        const nv = [...vv]; 
                                                                        nv[originalIndex] = 'unchecked'; 
                                                                        return nv as any; 
                                                                    }); 
                                                                    setCanAdvanceVocab(false); 
                                                                }} 
                                                                className={cn("h-10 uppercase", vocabValidation[originalIndex] === 'correct' ? 'border-green-500' : vocabValidation[originalIndex] === 'incorrect' ? 'border-red-500' : '')} 
                                                                autoComplete="off" 
                                                            />
                                                        </Fragment>
                                                    );
                                                })}
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
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Posesivos y Tener</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-primary uppercase mb-4">1. El Verbo TENER (Presente)</h3>
                                <Table><TableHeader className='bg-muted/50'><TableRow><TableHead>Sujeto</TableHead><TableHead>Conjugación</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    <TableRow><TableCell className='font-bold'>Yo</TableCell><TableCell>TENGO</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Tú / Usted</TableCell><TableCell>TIENES / TIENE</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Él / Ella</TableCell><TableCell>TIENE</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Nosotros / Nosotras</TableCell><TableCell>TENEMOS</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Ellos / Ellas / Ustedes</TableCell><TableCell>TIENEN</TableCell></TableRow>
                                </TableBody></Table>
                            </div>
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-primary uppercase mb-4">2. Adjetivos Posesivos</h3>
                                <Table><TableHeader className='bg-muted/50'><TableRow><TableHead>Inglés</TableHead><TableHead>Español (Singular / Plural)</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    <TableRow><TableCell className='font-bold'>My</TableCell><TableCell>Mi / Mis</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Your</TableCell><TableCell>Tu / Tus</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>His / Her / Its / Their</TableCell><TableCell>Su / Sus</TableCell></TableRow>
                                    <TableRow><TableCell className='font-bold'>Our</TableCell><TableCell>Nuestro / Nuestros / Nuestra / Nuestras</TableCell></TableRow>
                                </TableBody></Table>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">He comprendido la gramática</Button></CardFooter>
                    </Card>
                );
            case 'ex1': return <BallsExercise title="Ejercicio 1: Verbo Tener" prompts={ex1Prompts} onComplete={() => handleTopicComplete('ex1')} />;
            case 'ex2': return <BallsExercise title="Ejercicio 2: Tener y Posesivos" prompts={ex2Prompts} onComplete={() => handleTopicComplete('ex2')} />;
            case 'ex3': return <BallsExercise title="Ejercicio 3: Mixto" prompts={ex3Prompts} onComplete={() => handleTopicComplete('ex3')} />;
            case 'vocab_game': return <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm"><CardHeader><CardTitle>Juego de Memoria</CardTitle></CardHeader><CardContent><VocabularyMatchingGame data={classVocab.slice(0, 10).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Encuentra las parejas" /></CardContent></Card>;
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
                                <CardTitle className='text-primary uppercase tracking-tight'>Ejercicio Final: Posesivos (30)</CardTitle>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse">
                                            <BookText className="mr-2 h-4 w-4" /> Vocabulario
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64">
                                        <div className="space-y-2 text-foreground text-left">
                                            <h4 className='font-black text-primary text-xs uppercase mb-2 border-b'>Ayuda de Misión</h4>
                                            <ScrollArea className="h-64 pr-4">
                                                {Object.entries(globalVocabMap).map(([es, en]: any, i) => (
                                                    <div key={i} className="flex justify-between text-[10px] border-b border-muted pb-1">
                                                        <span className="text-muted-foreground text-left uppercase">{es}:</span>
                                                        <span className="font-bold text-right text-primary">{en.toUpperCase()}</span>
                                                    </div>
                                                ))}
                                            </ScrollArea>
                                        </div>
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
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-sm">"My family is small. I have a sister and her name is Julia. We have a beautiful dog. My parents have a blue car. Our house is in the city. My grandparents have a farm with many animals. I have my books in my new backpack."</div>
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
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight">Posesivos y Tener 🇪🇸</h1>
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

export interface Topic {
    key: string;
    name: string;
    icon: React.ElementType;
    status: 'locked' | 'active' | 'completed';
}

export default function PosesivosTenerPage() {
    return (<Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}><PosesivosTenerContent /></Suspense>);
}