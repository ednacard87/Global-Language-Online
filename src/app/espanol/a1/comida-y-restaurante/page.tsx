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
    UtensilsCrossed,
    Check,
    X,
    Info,
    Search,
    Pizza,
    Coffee,
    Beef,
    Pencil,
    HelpCircle
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
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { Textarea } from '@/components/ui/textarea';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_a1_comida_v25_final_one_by_one';
const mainProgressKey = 'progress_a1_es_comida_y_restaurante';

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const vocabularyData = [
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
];

const ex1Prompts = [
    { en: "I want a glass of water.", answer: ["yo quiero un vaso de agua", "quiero un vaso de agua"] },
    { en: "The waiter is friendly.", answer: ["el mesero es amigable"] },
    { en: "We eat chicken and rice.", answer: ["nosotros comemos pollo y arroz", "comemos pollo y arroz"] },
    { en: "She drinks orange juice.", answer: ["ella bebe jugo de naranja", "bebe jugo de naranja"] },
    { en: "Do you have the menu?", answer: ["¿tienes el menú?", "¿usted tiene el menú?", "¿tienes el menu?"] },
    { en: "The salad is fresh.", answer: ["la ensalada está fresca", "la ensalada esta fresca"] },
    { en: "I take the coffee with sugar.", answer: ["tomo el café con azúcar", "yo tomo el café con azúcar"] },
];

const ex2Prompts = [
    { en: "The bill, please.", answer: ["la cuenta, por favor", "la cuenta por favor"] },
    { en: "They want dessert.", answer: ["ellos quieren postre", "ellas quieren postre"] },
    { en: "I eat pasta for dinner.", answer: ["como pasta para la cena", "yo como pasta para la cena"] },
    { en: "The soup is hot.", answer: ["la sopa está caliente"] },
    { en: "We drink red wine.", answer: ["nosotros bebemos vino tinto", "bebemos vino tinto"] },
    { en: "The table is for four people.", answer: ["la mesa es para cuatro personas"] },
    { en: "I want a chocolate ice cream.", answer: ["quiero un helado de chocolate"] },
    { en: "The spoon is small.", answer: ["la cuchara es pequeña"] },
];

const ex3Prompts = [
    { en: "Is the restaurant open?", answer: ["¿está el restaurante abierto?", "está abierto el restaurante?"] },
    { en: "We want a table near the window.", answer: ["queremos una mesa cerca de la ventana"] },
    { en: "I drink tea in the morning.", answer: ["bebo té en la mañana", "tomo té en la mañana"] },
    { en: "The meat is delicious.", answer: ["la carne está deliciosa"] },
    { en: "She wants a green salad.", answer: ["ella quiere una ensalada verde"] },
    { en: "Do they have vegetarian food?", answer: ["¿tienen comida vegetariana?", "¿ellos tienen comida vegetariana?"] },
    { en: "I take the bus to the restaurant.", answer: ["tomo el bus para el restaurante"] },
    { en: "The fruit is sweet.", answer: ["la fruta es dulce"] },
    { en: "Is the tip included?", answer: ["¿está la propina incluida?", "¿la propina está incluida?"] },
    { en: "I want more sugar.", answer: ["quiero más azúcar", "quiero mas azucar"] },
];

const readingData = {
    title: "Una cena especial",
    content: "Hoy es el cumpleaños de mi madre. Mi familia y yo estamos en un restaurante italiano. El mesero es muy amable y nos da el menú. Yo quiero comer pasta con queso y mi padre prefiere carne con papas. Nosotros bebemos vino tinto y agua. De postre, pedimos helado de chocolate para todos. ¡La comida está deliciosa y estamos muy felices!",
    questions: [
        { id: 'q1', q: "¿En qué tipo de restaurante están?", a: ["italiano", "un restaurante italiano"] },
        { id: 'q2', q: "¿Qué quiere comer el narrador?", a: ["pasta con queso", "pasta"] },
        { id: 'q3', q: "¿Qué beben?", a: ["vino tinto y agua", "vino y agua"] },
        { id: 'q4', q: "¿Cuál es el postre?", a: ["helado de chocolate", "helado"] },
        { id: 'q5', q: "¿Cómo está la comida?", a: ["deliciosa", "está deliciosa"] },
    ]
};

const mixedExPrompts = [
    { en: "1. Yo (querer) una pizza.", answer: ["quiero"] },
    { en: "2. Nosotros (comer) ensalada.", answer: ["comemos"] },
    { en: "3. ¿Tú (beber) café?", answer: ["bebes"] },
    { en: "4. Él (tomar) un jugo.", answer: ["toma"] },
    { en: "5. La (bill) por favor.", answer: ["cuenta"] },
    { en: "6. El (waiter) es rápido.", answer: ["mesero"] },
    { en: "7. Quiero (ice cream) de fresa.", answer: ["helado"] },
    { en: "8. ¿Tienen (sugar)?", answer: ["azúcar", "azucar"] },
    { en: "9. Ella (querer) un vaso de agua.", answer: ["quiere"] },
    { en: "10. Comemos en la (table).", answer: ["mesa"] },
    { en: "11. El _______ (fish) está fresco.", answer: ["pescado"] },
    { en: "12. Nosotros _______ (beber) cerveza.", answer: ["bebemos"] },
    { en: "13. ¿Qué _______ (querer) ustedes?", answer: ["quieren"] },
    { en: "14. La sopa tiene mucha _______ (salt).", answer: ["sal"] },
    { en: "15. Necesito una _______ (napkin).", answer: ["servilleta"] },
    { en: "16. Ellos _______ (tomar) el menú.", answer: ["toman"] },
    { en: "17. El postre es _______ (sweet).", answer: ["dulce"] },
    { en: "18. ¿Dónde está mi _______ (fork)?", answer: ["tenedor"] },
    { en: "19. Quiero _______ (meat) con papas.", answer: ["carne"] },
    { en: "20. La _______ (tip) es opcional.", answer: ["propina"] },
    { en: "21. Yo _______ (comer) frutas.", answer: ["como"] },
    { en: "22. El vaso está _______ (empty).", answer: ["vacío"] },
    { en: "23. Nosotros _______ (querer) la cuenta.", answer: ["queremos"] },
    { en: "24. El cuchillo está _______ (sharp).", answer: ["afilado"] },
    { en: "25. Bebemos _______ (juice) de naranja.", answer: ["jugo"] },
    { en: "26. Tú _______ (comer) muy bien.", answer: ["comes"] },
    { en: "27. Hay una _______ (reservation).", answer: ["reserva"] },
    { en: "28. El plato está _______ (hot).", answer: ["caliente"] },
    { en: "29. Ellas _______ (beber) té.", answer: ["beben"] },
    { en: "30. Quiero un _______ (glass) de leche.", answer: ["vaso"] },
];

const negativePrompts = [
    { en: "I don't want the bill yet.", answer: ["no quiero la cuenta todavía", "no quiero la cuenta todavia"] },
    { en: "She doesn't eat meat.", answer: ["ella no come carne", "no come carne"] },
    { en: "We don't drink soda.", answer: ["nosotros no bebemos gaseosa", "no bebemos gaseosa"] },
    { en: "The waiter is not here.", answer: ["el mesero no está aquí", "el mesero no esta aqui"] },
    { en: "They don't want dessert.", answer: ["ellos no quieren postre", "ellas no quieren postre"] },
    { en: "I don't take sugar in my coffee.", answer: ["no tomo azúcar en mi café", "no le pongo azucar al cafe"] },
    { en: "The restaurant is not expensive.", answer: ["el restaurante no es caro"] },
    { en: "We don't have a reservation.", answer: ["no tenemos una reserva", "nosotros no tenemos reserva"] },
    { en: "The soup is not cold.", answer: ["la sopa no está fría", "la sopa no esta fria"] },
    { en: "You don't need a spoon for the salad.", answer: ["no necesitas una cuchara para la ensalada"] },
    { en: "He doesn't drink alcohol.", answer: ["él no bebe alcohol", "no bebe alcohol"] },
    { en: "There is no salt on the table.", answer: ["no hay sal en la mesa"] },
    { en: "I am not hungry now.", answer: ["no tengo hambre ahora", "no estoy hambriento ahora"] },
    { en: "The napkins are not clean.", answer: ["las servilletas no están limpias"] },
    { en: "We don't want a table near the door.", answer: ["no queremos una mesa cerca de la puerta"] },
];

// --- HELPER COMPONENTS ---

const BlockValidationExercise = ({ title, prompts, onComplete, vocabulary, initialAns, onAnsChange, isAdmin, isSupervisionMode }: any) => {
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
                        <CardDescription className='font-bold text-foreground mt-1'>Traduce la frase al español.</CardDescription>
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
                    {prompts[currentIndex].en}
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

interface Topic {
    key: string;
    name: string;
    icon: React.ElementType;
    status: 'locked' | 'active' | 'completed';
}

function ComidaRestauranteContentInternal() {
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
    const [vocabAns, setVocabAns] = useState<string[]>(Array(vocabularyData.length).fill(''));
    const [vocabVal, setVocabVal] = useState<any[]>(Array(vocabularyData.length).fill('unchecked'));
    
    const [ex1Ans, setEx1Ans] = useState<string[]>(Array(ex1Prompts.length).fill(''));
    const [ex2Ans, setEx2Ans] = useState<string[]>(Array(ex2Prompts.length).fill(''));
    const [ex3Ans, setEx3Ans] = useState<string[]>(Array(ex3Prompts.length).fill(''));
    const [mixedAns, setMixedAns] = useState<string[]>(Array(mixedExPrompts.length).fill(''));
    const [finalAns, setFinalAns] = useState<string[]>(Array(negativePrompts.length).fill(''));
    const [finalVal, setFinalVal] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});
    const [currentIndexFinal, setCurrentIndexFinal] = useState(0);

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
        { key: 'ex1', name: '3. Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: '4. Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '5. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'ex3', name: '6. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: '7. Lectura', icon: BookText, status: 'locked' },
        { key: 'mixed', name: '8. Ejercicio Mixto', icon: Trophy, status: 'locked' },
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
        if (d.finalVal) setFinalVal(d.finalVal);
        if (d.readAns) setReadAns(d.readAns);
        if (d.transText) setTransText(d.transText);
        if (d.vocabAns) setVocabAns(d.vocabAns);

        setInitialLoadComplete(true);
        setTimeout(() => setIsInitialLoading(false), 200);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete, targetStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || targetStudentId) return;
        const saveTimer = setTimeout(() => {
            const s: any = { 
                lastSelectedTopic: selectedTopic, 
                ex1Ans, ex2Ans, ex3Ans, mixedAns, finalAns, finalVal, readAns, transText, vocabAns 
            };
            learningPath.forEach(item => { s[item.key] = item.status; });
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        }, 1500);
        return () => clearTimeout(saveTimer);
    }, [learningPath, progressValue, studentDocRef, initialLoadComplete, selectedTopic, isInitialLoading, ex1Ans, ex2Ans, ex3Ans, mixedAns, finalAns, finalVal, readAns, transText, targetStudentId, vocabAns, isAdmin]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(curr => {
            let next: string | null = null; const np = [...curr];
            const i = np.findIndex(t => t.key === topicToComplete);
            if (i !== -1 && np[i].status !== 'completed') {
                np[i].status = 'completed';
                if (i + 1 < np.length && np[i + 1].status === 'locked') { (np[i + 1] as any).status = 'active'; next = np[i + 1].key; }
            }
            if (next) { const n = next; setTimeout(() => { toast({ title: "¡Misión desbloqueada!" }); setSelectedTopic(n); }, 0); }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleCheckVocab = () => {
        const nv = vocabularyData.map((v, i) => {
            return v.es.toLowerCase() === (vocabAns[i] || '').trim().toLowerCase() ? 'correct' : 'incorrect';
        });
        setVocabVal(nv);
        if (nv.every(v => v === 'correct')) toast({ title: "¡Perfecto!", description: "Vocabulario completado." });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const handleCheckFinal = () => {
        const nv: Record<number, 'correct' | 'incorrect'> = {};
        let allOk = true;
        negativePrompts.forEach((p, i) => {
            const userVal = (finalAns[i] || '').trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
            const corrects = p.answer.map(a => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' '));
            const isOk = corrects.includes(userVal);
            nv[i] = isOk ? 'correct' : 'incorrect';
            if (!isOk) allOk = false;
        });
        setFinalVal(nv);
        if (allOk) toast({ title: "¡Excelente!", description: "Todo está correcto. Haz clic en Terminar." });
        else toast({ variant: 'destructive', title: "Hay errores", description: "Revisa las marcas rojas en las bolitas." });
    };

    const isFinalComplete = useMemo(() => {
        return Object.values(finalVal).length === negativePrompts.length && Object.values(finalVal).every(v => v === 'correct');
    }, [finalVal]);

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;

        switch (selectedTopic) {
            case 'vocabulary':
                const vocabOk = vocabVal.length > 0 && vocabVal.every((v: string) => v === 'correct');
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>Vocabulario: Comida y Restaurante</CardTitle><CardDescription className='font-bold text-foreground'>Traduce las palabras del inglés al español.</CardDescription></CardHeader>
                        <CardContent><ScrollArea className="h-[500px] pr-4"><div className="grid grid-cols-2 gap-4">
                            <div className="font-black text-primary border-b pb-2 uppercase text-xs">Inglés</div><div className="font-black text-primary border-b pb-2 uppercase text-xs">Español</div>
                            {vocabularyData.map((v, i) => (
                                <Fragment key={i}>
                                    <div className="p-3 border rounded bg-white/5 font-bold flex items-center text-sm">{v.en}</div>
                                    <Input value={vocabAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...vocabAns]; na[i] = e.target.value; setVocabAns(na); const nv = [...vocabVal]; nv[i] = 'unchecked'; setVocabVal(nv); }} className={cn("uppercase", vocabVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} />
                                </Fragment>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-between border-t pt-6 bg-muted/20">
                            <Button onClick={handleCheckVocab} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary')} disabled={!vocabOk && !isAdmin} className='text-white font-bold'>Continuar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-foreground text-left overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Verbos de la Mesa</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0 font-bold">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm text-foreground">
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
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">He comprendido la gramática</Button></CardFooter>
                    </Card>
                );
            case 'ex1': return <BlockValidationExercise key="ex1" title="Ejercicio 1" prompts={ex1Prompts} initialAns={ex1Ans} onAnsChange={(i: number, v: string) => { const na = [...ex1Ans]; na[i] = v; setEx1Ans(na); }} onComplete={() => handleTopicComplete('ex1')} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={{"quiero": "want", "vaso": "glass", "agua": "water", "amigable": "friendly", "pollo": "chicken", "arroz": "rice", "naranja": "orange"}} />;
            case 'ex2': return <BlockValidationExercise key="ex2" title="Ejercicio 2" prompts={ex2Prompts} initialAns={ex2Ans} onAnsChange={(i: number, v: string) => { const na = [...ex2Ans]; na[i] = v; setEx2Ans(na); }} onComplete={() => handleTopicComplete('ex2')} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={{"cuenta": "bill", "por favor": "please", "postre": "dessert", "cena": "dinner", "caliente": "hot", "vino tinto": "red wine"}} />;
            case 'vocab_game': return <VocabularyMatchingGame data={vocabularyData.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Memory Game: Comida" />;
            case 'ex3': return <BlockValidationExercise key="ex3" title="Ejercicio 3" prompts={ex3Prompts} initialAns={ex3Ans} onAnsChange={(i: number, v: string) => { const na = [...ex3Ans]; na[i] = v; setEx3Ans(na); }} onComplete={() => handleTopicComplete('ex3')} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={{"abierto": "open", "cerca de": "near", "té": "tea", "deliciosa": "delicious", "verde": "green", "vegetariana": "vegetarian"}} />;
            case 'reading':
                const readingOk = Object.values(readVal).length === readingData.questions.length && Object.values(readVal).every((v: string) => v === 'correct');
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div><CardTitle className='text-primary font-black uppercase'>{readingData.title}</CardTitle></div>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                                    <PopoverContent className="w-64">
                                        <ScrollArea className="h-48 pr-4 text-left">
                                            <div className="grid grid-cols-2 gap-2 text-sm text-foreground">
                                                {Object.entries({"cumpleaños": "birthday", "amable": "kind", "prefiere": "prefers", "pedimos": "order"}).map(([es, en]: any) => (<Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-semibold text-right text-primary">{(en || '').toUpperCase()}</span></Fragment>))}
                                            </div>
                                        </ScrollArea>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner text-foreground">{readingData.content}</div>
                            <Separator /><div className="space-y-4">{readingData.questions.map(q => (
                                <div key={q.id} className="space-y-2 text-foreground"><Label className='font-bold'>{q.q}</Label><Input value={readAns[q.id] || ''} onChange={e => { if (targetStudentId) return; setReadAns({...readAns, [q.id]: e.target.value}); setReadVal({...readVal, [q.id]: 'unchecked'}); }} className={cn('h-12', readVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[q.id] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
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
                                setReadVal(nv); if (ok) toast({ title: "¡Lectura superada!" }); else toast({ variant: 'destructive', title: "Revisa las respuestas" });
                            }} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('reading')} disabled={!readingOk && !isAdmin} className="font-bold text-white bg-primary">Continuar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'mixed': return <BlockValidationExercise key="mixed" title="Ejercicio Mixto" prompts={mixedExPrompts} initialAns={mixedAns} onAnsChange={(i: number, v: string) => { const na = [...mixedAns]; na[i] = v; setMixedAns(na); }} onComplete={() => handleTopicComplete('mixed')} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={{"pizza": "pizza", "ensalada": "salad", "cuenta": "bill", "mesero": "waiter"}} />;
            case 'translate_text':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader>
                            <div className='flex justify-between items-center w-full'>
                                <div><CardTitle>Traducción de Texto</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el párrafo al español.</CardDescription></div>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                                    <PopoverContent className="w-64"><ScrollArea className="h-48 pr-4 text-left text-foreground"><div className="grid grid-cols-2 gap-2 text-sm text-foreground">{Object.entries({"customer": "cliente", "ready": "listo", "order": "ordenar", "specialty": "especialidad"}).map(([en, es]) => (<Fragment key={en}><span className="text-muted-foreground capitalize font-bold">{en}:</span><span className="font-semibold text-right text-primary">{es.toUpperCase()}</span></Fragment>))}</div></ScrollArea></PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6 text-foreground">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed shadow-sm">"Welcome to the restaurant. The customer is ready to order. I recommend the specialty: fresh fish with rice and salad. It is delicious! Would you like anything else to drink? I will bring your water and coffee right away. Enjoy your dinner!"</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={transText} onChange={(e) => { if (!targetStudentId) setTransText(e.target.value); }} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg text-foreground" readOnly={!!targetStudentId} /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20">
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
                            <p className="text-2xl mt-4 font-bold">¡Terminaste la clase Comida y Restaurante!</p>
                            <p className='text-muted-foreground mt-2 text-lg'>Misión completada al 100%.</p>
                            <Button asChild className="mt-8 px-12 h-12 font-bold" variant="outline"><Link href="/espanol/a1">Regresar a Ruta A1</Link></Button>
                        </Card>
                    );
                }
                const curNeg = negativePrompts[currentIndexFinal];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader>
                            <div className="flex justify-between items-start text-left">
                                <div className="w-full text-foreground">
                                    <CardTitle>Final: Frases Negativas</CardTitle>
                                    <CardDescription className='font-bold text-foreground mt-1'>Traduce la frase negativa al español ({currentIndexFinal + 1}/{negativePrompts.length}).</CardDescription>
                                    <div className="flex gap-2 justify-start flex-wrap pt-4">
                                        {negativePrompts.map((_: any, i: number) => (
                                            <div key={i} onClick={() => setCurrentIndexFinal(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndexFinal === i ? "border-primary ring-2 ring-primary" : "border-muted", finalVal[i] === 'correct' ? "bg-green-500 text-white border-green-500" : finalVal[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                                        ))}
                                    </div>
                                </div>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                                    <PopoverContent className="w-64"><ScrollArea className="h-48 pr-4 text-left text-foreground"><div className="grid grid-cols-2 gap-2 text-sm text-foreground">{Object.entries({"yet": "todavía", "meat": "carne", "soda": "gaseosa", "expensive": "caro"}).map(([en, es]) => (<Fragment key={en}><span className="text-muted-foreground capitalize font-bold">{en}:</span><span className="font-semibold text-right text-primary">{es.toUpperCase()}</span></Fragment>))}</div></ScrollArea></PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 py-6">
                            <div className="bg-muted p-8 rounded-2xl border-2 border-dashed text-center font-bold text-2xl uppercase tracking-tighter text-foreground">
                                {curNeg.en}
                            </div>
                            <Input value={finalAns[currentIndexFinal] || ''} onChange={e => { if (targetStudentId) return; const na = [...finalAns]; na[currentIndexFinal] = e.target.value; setFinalAns(na); setFinalVal({...finalVal, [currentIndexFinal]: 'unchecked'}); }} className={cn("h-14 text-xl text-foreground", finalVal[currentIndexFinal] === 'correct' ? 'border-green-500 bg-green-50/10' : finalVal[currentIndexFinal] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="Tu traducción..." autoComplete="off" readOnly={!!targetStudentId} />
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6 bg-muted/20">
                            <Button variant="outline" onClick={() => setCurrentIndexFinal(p => Math.max(0, p - 1))} disabled={currentIndexFinal === 0}>Anterior</Button>
                            <div className="flex gap-2">
                                {currentIndexFinal === negativePrompts.length - 1 ? (
                                    <>
                                        {!isFinalComplete && !targetStudentId && <Button onClick={handleCheckFinal} variant="secondary">Verificar</Button>}
                                        <Button onClick={() => { setIsFinished(true); handleTopicComplete('final'); }} disabled={!isFinalComplete && !isAdmin} className='text-white font-bold bg-primary hover:bg-primary/90'>Terminar</Button>
                                    </>
                                ) : (
                                    <Button onClick={() => setCurrentIndexFinal(i => i + 1)}>Siguiente</Button>
                                )}
                            </div>
                        </CardFooter>
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
                           <UtensilsCrossed className='h-10 w-10 text-primary' /> Comida y Restaurante 🇪🇸
                        </h1>
                    </div>

                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30">
                                    <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Misión A1</CardTitle>
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

export default function ComidaRestaurantePage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}>
            <ComidaRestauranteContentInternal />
        </Suspense>
    );
}
