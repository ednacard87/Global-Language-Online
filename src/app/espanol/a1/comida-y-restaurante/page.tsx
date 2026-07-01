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
    UtensilsCrossed,
    Check,
    X,
    Info,
    Search,
    Pizza,
    Coffee,
    Beef
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
const progressStorageVersion = 'progress_es_a1_comida_v5_full_content';
const mainProgressKey = 'progress_a1_es_comida_y_restaurante';

// --- DATA ---

const vocabularyData = {
    comida: [
        { en: "CHICKEN", es: "POLLO" },
        { en: "MEAT", es: "CARNE" },
        { en: "FISH", es: "PESCADO" },
        { en: "RICE", es: "ARROZ" },
        { en: "SALAD", es: "ENSALADA" },
        { en: "SOUP", es: "SOPA" },
        { en: "BREAD", es: "PAN" },
        { en: "PASTA", es: "PASTA" },
        { en: "FRUITS", es: "FRUTAS" },
        { en: "VEGETABLES", es: "VERDURAS" },
        { en: "POTATOES", es: "PAPAS" },
        { en: "EGGS", es: "HUEVOS" },
        { en: "CHEESE", es: "QUESO" },
        { en: "DESSERT", es: "POSTRE" },
        { en: "ICE CREAM", es: "HELADO" },
    ],
    bebidas: [
        { en: "WATER", es: "AGUA" },
        { en: "JUICE", es: "JUGO" },
        { en: "SODA", es: "GASEOSA" },
        { en: "COFFEE", es: "CAFÉ" },
        { en: "TEA", es: "TÉ" },
        { en: "MILK", es: "LECHE" },
        { en: "WINE", es: "VINO" },
        { en: "BEER", es: "CERVEZA" },
        { en: "ICE", es: "HIELO" },
        { en: "SUGAR", es: "AZÚCAR" },
    ],
    restaurante: [
        { en: "WAITER", es: "MESERO" },
        { en: "MENU", es: "MENÚ" },
        { en: "TABLE", es: "MESA" },
        { en: "CHAIR", es: "SILLA" },
        { en: "BILL", es: "CUENTA" },
        { en: "TIP", es: "PROPINA" },
        { en: "FORK", es: "TENEDOR" },
        { en: "KNIFE", es: "CUCHILLO" },
        { en: "SPOON", es: "CUCHARA" },
        { en: "PLATE", es: "PLATO" },
        { en: "GLASS", es: "VASO" },
        { en: "NAPKIN", es: "SERVILLETA" },
        { en: "SALT", es: "SAL" },
        { en: "PEPPER", es: "PIMIENTA" },
        { en: "RESERVATION", es: "RESERVA" },
    ]
};

const allVocabList = [...vocabularyData.comida, ...vocabularyData.bebidas, ...vocabularyData.restaurante];

const ex1Prompts = [
    { en: "I want a glass of water.", es: ["yo quiero un vaso de agua", "quiero un vaso de agua"] },
    { en: "The waiter is friendly.", es: ["el mesero es amigable"] },
    { en: "We eat chicken and rice.", es: ["nosotros comemos pollo y arroz", "comemos pollo y arroz"] },
    { en: "She drinks orange juice.", es: ["ella bebe jugo de naranja", "bebe jugo de naranja"] },
    { en: "Do you have the menu?", es: ["¿tienes el menú?", "¿usted tiene el menú?", "¿tienes el menu?"] },
    { en: "The salad is fresh.", es: ["la ensalada está fresca", "la ensalada esta fresca"] },
    { en: "I take the coffee with sugar.", es: ["tomo el café con azúcar", "yo tomo el café con azúcar"] },
];

const ex2Prompts = [
    { en: "The bill, please.", es: ["la cuenta, por favor", "la cuenta por favor"] },
    { en: "They want dessert.", es: ["ellos quieren postre", "ellas quieren postre"] },
    { en: "I eat pasta for dinner.", es: ["como pasta para la cena", "yo como pasta para la cena"] },
    { en: "The soup is hot.", es: ["la sopa está caliente"] },
    { en: "We drink red wine.", es: ["nosotros bebemos vino tinto", "bebemos vino tinto"] },
    { en: "The table is for four people.", es: ["la mesa es para cuatro personas"] },
    { en: "I want a chocolate ice cream.", es: ["quiero un helado de chocolate"] },
    { en: "The spoon is small.", es: ["la cuchara es pequeña"] },
];

const ex3Prompts = [
    { en: "Is the restaurant open?", es: ["¿está el restaurante abierto?", "está abierto el restaurante?"] },
    { en: "We want a table near the window.", es: ["queremos una mesa cerca de la ventana"] },
    { en: "I drink tea in the morning.", es: ["bebo té en la mañana", "tomo té en la mañana"] },
    { en: "The meat is delicious.", es: ["la carne está deliciosa"] },
    { en: "She wants a green salad.", es: ["ella quiere una ensalada verde"] },
    { en: "Do they have vegetarian food?", es: ["¿tienen comida vegetariana?", "¿ellos tienen comida vegetariana?"] },
    { en: "I take the bus to the restaurant.", es: ["tomo el bus para el restaurante"] },
    { en: "The fruit is sweet.", es: ["la fruta es dulce"] },
    { en: "Is the tip included?", es: ["¿está la propina incluida?", "¿la propina está incluida?"] },
    { en: "I want more sugar.", es: ["quiero más azúcar", "quiero mas azucar"] },
];

const readingData = {
    title: "Una cena especial",
    content: "Hoy es el cumpleaños de mi madre. Mi familia y yo estamos en un restaurante italiano. El mesero es muy amable y nos da el menú. Yo quiero comer pasta con queso y mi padre prefiere carne con papas. Nosotros bebemos vino tinto y agua. De postre, pedimos helado de chocolate para todos. ¡La comida está deliciosa y estamos muy felices!",
    questions: [
        { q: "¿En qué tipo de restaurante están?", a: ["italiano", "un restaurante italiano"] },
        { q: "¿Qué quiere comer el narrador?", a: ["pasta con queso", "pasta"] },
        { q: "¿Qué beben?", a: ["vino tinto y agua", "vino y agua"] },
        { q: "¿Cuál es el postre?", a: ["helado de chocolate", "helado"] },
        { q: "¿Cómo está la comida?", a: ["deliciosa", "está deliciosa"] },
    ]
};

const finalExPrompts = [
    { s: "1. Yo _______ (querer) una pizza.", a: "quiero" },
    { s: "2. Nosotros _______ (comer) ensalada.", a: "comemos" },
    { s: "3. ¿Tú _______ (beber) café?", a: "bebes" },
    { s: "4. Él _______ (tomar) un jugo.", a: "toma" },
    { s: "5. La _______ (bill) por favor.", a: "cuenta" },
    { s: "6. El _______ (waiter) es rápido.", a: "mesero" },
    { s: "7. Quiero _______ (ice cream) de fresa.", a: "helado" },
    { s: "8. ¿Tienen _______ (sugar)?", a: "azúcar" },
    { s: "9. Ella _______ (querer) un vaso de agua.", a: "quiere" },
    { s: "10. Comemos en la _______ (table).", a: "mesa" },
    { s: "11. El _______ (fish) está fresco.", a: "pescado" },
    { s: "12. Nosotros _______ (beber) cerveza.", a: "bebemos" },
    { s: "13. ¿Qué _______ (querer) ustedes?", a: "quieren" },
    { s: "14. La sopa tiene mucha _______ (salt).", a: "sal" },
    { s: "15. Necesito una _______ (napkin).", a: "servilleta" },
    { s: "16. Ellos _______ (tomar) el menú.", a: "toman" },
    { s: "17. El postre es _______ (sweet).", a: "dulce" },
    { s: "18. ¿Dónde está mi _______ (fork)?", a: "tenedor" },
    { s: "19. Quiero _______ (meat) con papas.", a: "carne" },
    { s: "20. La _______ (tip) es opcional.", a: "propina" },
    { s: "21. Yo _______ (comer) frutas.", a: "como" },
    { s: "22. El vaso está _______ (empty).", a: "vacío" },
    { s: "23. Nosotros _______ (querer) la cuenta.", a: "queremos" },
    { s: "24. El cuchillo está _______ (sharp).", a: "afilado" },
    { s: "25. Bebemos _______ (juice) de naranja.", a: "jugo" },
    { s: "26. Tú _______ (comer) muy bien.", a: "comes" },
    { s: "27. Hay una _______ (reservation).", a: "reserva" },
    { s: "28. El plato está _______ (hot).", a: "caliente" },
    { s: "29. Ellas _______ (beber) té.", a: "beben" },
    { s: "30. Quiero un _______ (glass) de leche.", a: "vaso" },
];

const negativePrompts = [
    { en: "I don't want the bill yet.", es: ["no quiero la cuenta todavía", "no quiero la cuenta todavia"] },
    { en: "She doesn't eat meat.", es: ["ella no come carne", "no come carne"] },
    { en: "We don't drink soda.", es: ["nosotros no bebemos gaseosa", "no bebemos gaseosa"] },
    { en: "The waiter is not here.", es: ["el mesero no está aquí", "el mesero no esta aqui"] },
    { en: "They don't want dessert.", es: ["ellos no quieren postre", "ellas no quieren postre"] },
    { en: "I don't take sugar in my coffee.", es: ["no tomo azúcar en mi café", "no le pongo azucar al cafe"] },
    { en: "The restaurant is not expensive.", es: ["el restaurante no es caro"] },
    { en: "We don't have a reservation.", es: ["no tenemos una reserva", "nosotros no tenemos reserva"] },
    { en: "The soup is not cold.", es: ["la sopa no está fría", "la sopa no esta fria"] },
    { en: "You don't need a spoon for the salad.", es: ["no necesitas una cuchara para la ensalada"] },
    { en: "He doesn't drink alcohol.", es: ["él no bebe alcohol", "no bebe alcohol"] },
    { en: "There is no salt on the table.", es: ["no hay sal en la mesa"] },
    { en: "I am not hungry now.", es: ["no tengo hambre ahora", "no estoy hambriento ahora"] },
    { en: "The napkins are not clean.", es: ["las servilletas no están limpias"] },
    { en: "We don't want a table near the door.", es: ["no queremos una mesa cerca de la puerta"] },
];

const translationVocabHelp = {
    "welcome": "bienvenido", "customer": "cliente", "ready": "listo", "order": "pedir",
    "recommend": "recomendar", "specialty": "especialidad", "fresh": "fresco", "delicious": "delicioso",
    "anything else": "algo más", "right away": "enseguida", "enjoy": "disfrutar"
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
                                    {Object.entries(vocabulary || {}).map(([es, en]: any, i) => (
                                        <div key={i} className="flex justify-between text-[10px] border-b border-muted pb-1">
                                            <span className="text-muted-foreground text-left uppercase">{en}:</span>
                                            <span className="font-bold text-right text-primary">{es.toUpperCase()}</span>
                                        </div>
                                    ))}
                                    {(!vocabulary) && allVocabList.slice(0, 20).map((v, i) => (
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

function ComidaRestauranteContent() {
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
        
        const initAns: any = {}; const initVal: any = {};
        Object.keys(vocabularyData).forEach(cat => {
            initAns[cat] = Array((vocabularyData as any)[cat].length).fill('');
            initVal[cat] = Array((vocabularyData as any)[cat].length).fill('unchecked');
        });
        setVocabAnswers(initAns); setVocabValidation(initVal);

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
        if (totalCorrect >= 10) { 
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
                            <CardTitle className="text-primary uppercase tracking-tighter">Vocabulario: Comida y Restaurante</CardTitle>
                            <CardDescription className='font-bold text-foreground'>Escribe el significado en español para cada término (40+).</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <Accordion type="multiple" defaultValue={['comida']} className="w-full">
                                {Object.keys(vocabularyData).map(cat => (
                                    <AccordionItem key={cat} value={cat}>
                                        <AccordionTrigger className="capitalize font-black text-primary text-sm tracking-widest">
                                            {cat === 'comida' ? 'Platos y Alimentos' : cat === 'bebidas' ? 'Bebidas e Ingredientes' : 'En el Restaurante'}
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
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Verbos de la Mesa</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-primary uppercase mb-4">1. Verbos Frecuentes (Conjugación Presente)</h3>
                                <div className='grid gap-6 md:grid-cols-2'>
                                    <div className='p-4 bg-muted/30 rounded-xl'>
                                        <h4 className='font-bold text-primary mb-2'>QUERER (To want)</h4>
                                        <ul className='text-sm space-y-1 font-mono'>
                                            <li>Yo <strong>quiero</strong></li>
                                            <li>Tú <strong>quieres</strong></li>
                                            <li>Él/Ella <strong>quiere</strong></li>
                                            <li>Nosotros <strong>queremos</strong></li>
                                            <li>Ellos <strong>quieren</strong></li>
                                        </ul>
                                    </div>
                                    <div className='p-4 bg-muted/30 rounded-xl'>
                                        <h4 className='font-bold text-primary mb-2'>COMER (To eat)</h4>
                                        <ul className='text-sm space-y-1 font-mono'>
                                            <li>Yo <strong>como</strong></li>
                                            <li>Tú <strong>comes</strong></li>
                                            <li>Él/Ella <strong>come</strong></li>
                                            <li>Nosotros <strong>comemos</strong></li>
                                            <li>Ellos <strong>comen</strong></li>
                                        </ul>
                                    </div>
                                    <div className='p-4 bg-muted/30 rounded-xl'>
                                        <h4 className='font-bold text-primary mb-2'>BEBER / TOMAR (To drink / have)</h4>
                                        <ul className='text-sm space-y-1 font-mono'>
                                            <li>Yo <strong>bebo / tomo</strong></li>
                                            <li>Tú <strong>bebes / tomas</strong></li>
                                            <li>Él/Ella <strong>bebe / toma</strong></li>
                                            <li>Nosotros <strong>bebemos / tomamos</strong></li>
                                            <li>Ellos <strong>beben / toman</strong></li>
                                        </ul>
                                    </div>
                                    <div className='p-4 bg-primary/10 rounded-xl border-l-4 border-primary flex items-center'>
                                        <p className='text-sm italic'>"Tomar" se usa frecuentemente como sinónimo de "Beber" en contextos sociales.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4">
                                <h3 className="text-xl font-black text-primary uppercase mb-2">2. Expresiones en el Restaurante</h3>
                                <div className='grid gap-4 sm:grid-cols-2'>
                                    <div className='p-4 bg-background border rounded-xl'>
                                        <p className='font-bold text-primary'>Quisiera... / I would like...</p>
                                        <p className='text-sm italic text-muted-foreground'>Quisiera ver el menú, por favor.</p>
                                    </div>
                                    <div className='p-4 bg-background border rounded-xl'>
                                        <p className='font-bold text-primary'>¿Me puede traer...? / Can you bring me...?</p>
                                        <p className='text-sm italic text-muted-foreground'>¿Me puede traer la cuenta?</p>
                                    </div>
                                    <div className='p-4 bg-background border rounded-xl'>
                                        <p className='font-bold text-primary'>Para mí, el/la... / For me, the...</p>
                                        <p className='text-sm italic text-muted-foreground'>Para mí, la ensalada césar.</p>
                                    </div>
                                    <div className='p-4 bg-background border rounded-xl'>
                                        <p className='font-bold text-primary'>Soy alérgico a... / I am allergic to...</p>
                                        <p className='text-sm italic text-muted-foreground'>Soy alérgico al maní.</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">He comprendido la gramática</Button></CardFooter>
                    </Card>
                );
            case 'ex1': return <BallsExercise title="Ejercicio 1" prompts={ex1Prompts} onComplete={() => handleTopicComplete('ex1')} vocabulary={{"quiero": "want", "vaso": "glass", "agua": "water", "amigable": "friendly", "pollo": "chicken", "arroz": "rice", "naranja": "orange", "menú": "menu", "fresca": "fresh", "tomo": "take/have", "azúcar": "sugar"}} />;
            case 'ex2': return <BallsExercise title="Ejercicio 2" prompts={ex2Prompts} onComplete={() => handleTopicComplete('ex2')} vocabulary={{"cuenta": "bill", "por favor": "please", "postre": "dessert", "cena": "dinner", "caliente": "hot", "vino tinto": "red wine", "pequeña": "small"}} />;
            case 'vocab_game': return <VocabularyMatchingGame data={allVocabList.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Memory Game: Restaurante" />;
            case 'ex3': return <BallsExercise title="Ejercicio 3" prompts={ex3Prompts} onComplete={() => handleTopicComplete('ex3')} vocabulary={{"abierto": "open", "cerca de": "near", "ventana": "window", "té": "tea", "deliciosa": "delicious", "verde": "green", "vegetariana": "vegetarian", "propina": "tip", "más": "more"}} />;
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
                                                {allVocabList.slice(0, 30).map((v, i) => (
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
                        <CardHeader><div className="flex justify-between items-center"><div><CardTitle className='text-primary uppercase'>Traducción de Texto: En el Restaurante</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el siguiente párrafo al español.</CardDescription></div><Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger><PopoverContent className="w-64"><ScrollArea className="h-48 pr-4"><div className="space-y-2">{Object.entries(translationVocabHelp).map(([en, es], i) => (<div key={i} className="flex justify-between text-xs border-b pb-1"><span className="text-muted-foreground">{en}:</span><span className="font-bold text-primary">{es}</span></div>))}</div></ScrollArea></PopoverContent></Popover></div></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-sm">"Welcome to the restaurant. The customer is ready to order. I recommend the specialty: fresh fish with rice and salad. It is delicious! Would you like anything else to drink? I will bring your water and coffee right away. Enjoy your dinner!"</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={translationText} onChange={(e) => setTranslationText(e.target.value)} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg leading-relaxed" /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20">
                            <Button onClick={() => handleTopicComplete('translate_text')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">
                                Siguiente Misión <ArrowRight className='ml-3 h-8 w-8' />
                            </Button>
                        </CardFooter>
                    </Card>
                );
            case 'final': return <BallsExercise title="Final: Frases Negativas" prompts={negativePrompts} onComplete={() => handleTopicComplete('final')} vocabulary={{"todavía": "yet", "carne": "meat", "gaseosa": "soda", "reserva": "reservation", "fría": "cold", "cuchara": "spoon", "hambre": "hungry", "servilletas": "napkins"}} />;
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
                            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400">
                                <Star className="h-6 w-6 fill-current animate-pulse" />
                                <p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión Activo: {studentProfile?.name || targetStudentId}</p>
                            </div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors">
                                <Link href="/admin">Cerrar Supervisión</Link>
                            </Button>
                        </div>
                    )}
                    
                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/a1" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2">
                            <ArrowLeft className="h-4 w-4" /> Volver al Curso A1
                        </Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3">
                            <UtensilsCrossed className='h-10 w-10 text-primary' /> Comida y Restaurante 🇪🇸
                        </h1>
                    </div>

                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30">
                                    <CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-primary" /> Misión A1
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <nav>
                                        <ul className="space-y-1">
                                            {learningPath.map((item) => {
                                                const isLocked = item.status === 'locked' && !isAdmin;
                                                const isSelected = selectedTopic === item.key;
                                                const Icon = item.icon;
                                                return (
                                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                                        className={cn(
                                                            'flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground',
                                                            isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted',
                                                            isSelected && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm'
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {item.status === 'completed' ? (
                                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                                            ) : (
                                                                <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />
                                                            )}
                                                            <span className="truncate max-w-[150px]">{item.name}</span>
                                                        </div>
                                                        {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </nav>
                                    <div className="mt-6 pt-6 border-t">
                                        <div className="flex justify-between items-center text-xs mb-2 font-black uppercase tracking-widest text-muted-foreground">
                                            <span>Progreso Clase</span>
                                            <span className="text-primary">{progressValue}%</span>
                                        </div>
                                        <Progress value={progressValue} className="h-2 rounded-full" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function ComidaRestaurantePage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
        }>
            <ComidaRestauranteContent />
        </Suspense>
    );
}
