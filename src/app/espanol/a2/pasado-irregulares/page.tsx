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
    Pencil,
    Zap,
    MessageSquare,
    CheckCircle2,
    Info,
    ListChecks,
    Check,
    X,
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { Textarea } from '@/components/ui/textarea';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_a2_pasado_irreg_v2_full_content';
const mainProgressKey = 'progress_a2_es_pasado_irregulares';

// --- DATA ---

const pastIrregVocab = [
    { en: "TO BE", es: "SER" },
    { en: "TO GO", es: "IR" },
    { en: "TO HAVE", es: "TENER" },
    { en: "TO DO / MAKE", es: "HACER" },
    { en: "TO BE (LOCATION)", es: "ESTAR" },
    { en: "TO SAY / TELL", es: "DECIR" },
    { en: "TO BRING", es: "TRAER" },
    { en: "TO SEE", es: "VER" },
    { en: "TO GIVE", es: "DAR" },
    { en: "TO PUT", es: "PONER" },
    { en: "TO KNOW (INFO)", es: "SABER" },
    { en: "TO WANT", es: "QUERER" },
    { en: "TO COME", es: "VENIR" },
    { en: "TO BE ABLE TO", es: "PODER" },
    { en: "TO DRIVE", es: "CONDUCIR" },
    { en: "TO TRANSLATE", es: "TRADUCIR" },
    { en: "TO PRODUCE", es: "PRODUCIR" },
    { en: "TO WALK", es: "ANDAR" },
    { en: "TO BRING", es: "TRAER" },
    { en: "TO READ", es: "LEER" },
];

const conjugationVerbsList = [
    { en: "TO GO", es: "IR", stem: "fu" },
    { en: "TO HAVE", es: "TENER", stem: "tuv" },
    { en: "TO DO", es: "HACER", stem: "hic" },
    { en: "TO BE", es: "ESTAR", stem: "estuv" },
    { en: "TO SAY", es: "DECIR", stem: "dij" },
    { en: "TO BRING", es: "TRAER", stem: "traj" },
    { en: "TO SEE", es: "VER", stem: "v" },
    { en: "TO GIVE", es: "DAR", stem: "d" },
    { en: "TO PUT", es: "PONER", stem: "pus" },
    { en: "TO KNOW", es: "SABER", stem: "sup" },
    { en: "TO WANT", es: "QUERER", stem: "quis" },
    { en: "TO COME", es: "VENIR", stem: "vin" },
    { en: "TO BE ABLE TO", es: "PODER", stem: "pud" },
    { en: "TO DRIVE", es: "CONDUCIR", stem: "conduj" },
    { en: "TO TRANSLATE", es: "TRADUCIR", stem: "traduj" },
];

const ex1Prompts = [
    { en: "I went to the park yesterday.", es: ["yo fui al parque ayer", "fui al parque ayer"] },
    { en: "She had a lot of work.", es: ["ella tuvo mucho trabajo", "tuvo mucho trabajo"] },
    { en: "We did the homework together.", es: ["nosotros hicimos la tarea juntos", "hicimos la tarea juntos"] },
    { en: "They were in Spain last month.", es: ["ellos estuvieron en españa el mes pasado", "ellas estuvieron en españa el mes pasado"] },
    { en: "I told the truth.", es: ["yo dije la verdad", "dije la verdad"] },
    { en: "He brought a gift.", es: ["él trajo un regalo", "trajo un regalo"] },
    { en: "You saw the movie.", es: ["tú viste la película", "viste la película"] },
];

const ex2Prompts = [
    { en: "We gave a party on Saturday.", es: ["nosotros dimos una fiesta el sábado", "dimos una fiesta el sabado"] },
    { en: "I put the keys on the table.", es: ["yo puse las llaves sobre la mesa", "puse las llaves en la mesa"] },
    { en: "They knew the secret.", es: ["ellos supieron el secreto", "ellas supieron el secreto"] },
    { en: "She wanted to eat pizza.", es: ["ella quiso comer pizza", "quiso comer pizza"] },
    { en: "You came to my house late.", es: ["tú viniste a mi casa tarde", "viniste a mi casa tarde"] },
    { en: "I was able to finish the project.", es: ["yo pude terminar el proyecto", "pude terminar el proyecto"] },
    { en: "He drove his new car.", es: ["él condujo su carro nuevo", "condujo su carro nuevo"] },
    { en: "We translated the text.", es: ["nosotros tradujimos el texto", "tradujimos el texto"] },
];

const ex3Prompts = [
    { en: "I walked through the forest.", es: ["yo anduve por el bosque", "anduve por el bosque"] },
    { en: "The keys fit in the drawer.", es: ["las llaves cupieron en el cajón", "las llaves cupieron en el cajon"] },
    { en: "They produced a documentary.", es: ["ellos produjeron un documental", "produjeron un documental"] },
    { en: "I saw you at the airport.", es: ["yo te vi en el aeropuerto", "te vi en el aeropuerto"] },
    { en: "She gave me a kiss.", es: ["ella me dio un beso", "me dio un beso"] },
    { en: "We went to the beach.", es: ["nosotros fuimos a la playa", "fuimos a la playa"] },
    { en: "He made a delicious cake.", es: ["él hizo un pastel delicioso", "hizo una torta deliciosa"] },
    { en: "They had a beautiful baby.", es: ["ellos tuvieron un bebé hermoso", "tuvieron un bebe hermoso"] },
    { en: "I put on my jacket.", es: ["yo me puse la chaqueta", "me puse mi chaqueta"] },
    { en: "You told me a lie.", es: ["tú me dijiste una mentira", "me dijiste una mentira"] },
];

const readingData = {
    title: "Un viaje inesperado",
    content: "El verano pasado, mi mejor amigo y yo fuimos a las montañas. Nosotros tuvimos mucha suerte con el clima. El primer día, hicimos una caminata larga. Yo traje la comida y él trajo el agua. Por la noche, estuvimos muy cansados pero felices. Yo vi las estrellas más brillantes de mi vida. Al final, nosotros quisimos quedarnos más tiempo, pero no pudimos porque yo tuve que trabajar el lunes.",
    questions: [
        { q: "¿A dónde fueron los amigos?", a: ["a las montañas", "a la montaña"] },
        { q: "¿Qué hicieron el primer día?", a: ["una caminata larga", "caminaron"] },
        { q: "¿Qué trajo el narrador?", a: ["la comida"] },
        { q: "¿Cómo estuvieron por la noche?", a: ["muy cansados", "cansados pero felices"] },
        { q: "¿Por qué no pudieron quedarse más tiempo?", a: ["tuvo que trabajar", "por el trabajo"] },
    ]
};

const ex4OptionsPrompts = [
    { sentence: "1. Yo _______ (ir) al cine anoche.", options: ["Fui", "Iba", "Vaya"], answer: "Fui" },
    { sentence: "2. Ella _______ (tener) una idea genial.", options: ["Tuviste", "Tuvo", "Tuvieron"], answer: "Tuvo" },
    { sentence: "3. Nosotros _______ (hacer) una fiesta.", options: ["Hicimos", "Hacemos", "Hicieron"], answer: "Hicimos" },
    { sentence: "4. ¿Tú _______ (decir) la verdad?", options: ["Dijiste", "Dije", "Dijo"], answer: "Dijiste" },
    { sentence: "5. Ellos _______ (estar) en el estadio.", options: ["Estuvieron", "Estaba", "Estás"], answer: "Estuvieron" },
    { sentence: "6. Yo _______ (ver) a tu hermano.", options: ["Vi", "Veo", "Viste"], answer: "Vi" },
    { sentence: "7. Él _______ (traer) las cervezas.", options: ["Trajo", "Traje", "Trajeron"], answer: "Trajo" },
    { sentence: "8. Nosotros _______ (poder) llegar a tiempo.", options: ["Pudimos", "Poder", "Pueden"], answer: "Pudimos" },
    { sentence: "9. Ella _______ (querer) comprar flores.", options: ["Quiso", "Quise", "Quieren"], answer: "Quiso" },
    { sentence: "10. Yo _______ (poner) la mesa.", options: ["Puse", "Pusemos", "Puso"], answer: "Puse" },
    { sentence: "11. ¿Ustedes _______ (venir) en bus?", options: ["Vinieron", "Viniste", "Vengo"], answer: "Vinieron" },
    { sentence: "12. Yo _______ (saber) la respuesta.", options: ["Supe", "Sabe", "Supo"], answer: "Supe" },
    { sentence: "13. Ella _______ (conducir) hasta aquí.", options: ["Condujo", "Conduje", "Conducimos"], answer: "Condujo" },
    { sentence: "14. Nosotros _______ (traducir) la carta.", options: ["Tradujimos", "Traducimos", "Tradujeron"], answer: "Tradujimos" },
    { sentence: "15. Él _______ (dar) un discurso.", options: ["Dio", "Di", "Dimos"], answer: "Dio" },
    { sentence: "16. Yo _______ (andar) por el centro.", options: ["Anduve", "Ando", "Anduvo"], answer: "Anduve" },
    { sentence: "17. Ellos _______ (producir) una película.", options: ["Produjeron", "Producimos", "Produjo"], answer: "Produjeron" },
    { sentence: "18. ¿Tú _______ (caber) en el asiento?", options: ["Cupiste", "Cabe", "Cupo"], answer: "Cupiste" },
    { sentence: "19. El perro _______ (querer) salir.", options: ["Quiso", "Quise", "Quisieron"], answer: "Quiso" },
    { sentence: "20. Yo _______ (hacer) la cama.", options: ["Hice", "Hizo", "Hicimos"], answer: "Hice" },
];

const completionPrompts = [
    { s: "1. Yo _______ (ir) a la playa.", a: "fui" },
    { s: "2. Ella _______ (tener) un accidente.", a: "tuvo" },
    { s: "3. Nosotros _______ (hacer) la cena.", a: "hicimos" },
    { s: "4. Ellos _______ (decir) mentiras.", a: "dijeron" },
    { s: "5. Tú _______ (estar) muy triste.", a: "estuviste" },
    { s: "6. Yo _______ (ver) un fantasma.", a: "vi" },
    { s: "7. Él _______ (traer) el postre.", a: "trajo" },
    { s: "8. Nosotros _______ (poder) ganar.", a: "pudimos" },
    { s: "9. Ellas _______ (querer) bailar.", a: "quisieron" },
    { s: "10. Yo _______ (poner) la maleta aquí.", a: "puse" },
    { s: "11. Tú _______ (venir) ayer.", a: "viniste" },
    { s: "12. Él _______ (saber) el resultado.", a: "supo" },
    { s: "13. Nosotros _______ (conducir) mucho.", a: "condujimos" },
    { s: "14. Yo _______ (traducir) el libro.", a: "traduje" },
    { s: "15. Ellos _______ (dar) dinero.", a: "dieron" },
    { s: "16. Ella _______ (andar) por la calle.", a: "anduvo" },
    { s: "17. Yo _______ (hacer) ejercicio.", a: "hice" },
    { s: "18. Tú _______ (ver) a mi mamá.", a: "viste" },
    { s: "19. Nosotros _______ (estar) ocupados.", a: "estuvimos" },
    { s: "20. Ellos _______ (traer) flores.", a: "trajeron" },
    { s: "21. Yo _______ (ir) a la tienda.", a: "fui" },
    { s: "22. Él _______ (tener) hambre.", a: "tuvo" },
    { s: "23. Ella _______ (poner) la radio.", a: "puso" },
    { s: "24. Nosotros _______ (decir) hola.", a: "dijimos" },
    { s: "25. Tú _______ (querer) un helado.", a: "quisiste" },
    { s: "26. Yo _______ (venir) solo.", a: "vine" },
    { s: "27. Ellos _______ (saber) el camino.", a: "supieron" },
    { s: "28. Nosotros _______ (ver) un pájaro.", a: "vimos" },
    { s: "29. Yo _______ (dar) las gracias.", a: "di" },
    { s: "30. Él _______ (hacer) un dibujo.", a: "hizo" },
];

const negativePrompts = [
    { en: "I didn't go to the party.", es: ["yo no fui a la fiesta", "no fui a la fiesta"] },
    { en: "She didn't have time.", es: ["ella no tuvo tiempo", "no tuvo tiempo"] },
    { en: "We didn't do the homework.", es: ["nosotros no hicimos la tarea", "no hicimos la tarea"] },
    { en: "They weren't at home.", es: ["ellos no estuvieron en casa", "no estuvieron en casa"] },
    { en: "I didn't tell a lie.", es: ["yo no dije una mentira", "no dije una mentira"] },
    { en: "You didn't see me.", es: ["tú no me viste", "no me viste"] },
    { en: "He didn't bring the car.", es: ["él no trajo el carro", "no trajo el carro"] },
    { en: "We couldn't come.", es: ["nosotros no pudimos venir", "no pudimos venir"] },
    { en: "They didn't want to go.", es: ["ellos no quisieron ir", "no quisieron ir"] },
    { en: "I didn't put the books there.", es: ["yo no puse los libros allá", "no puse los libros allí"] },
    { en: "She didn't know the truth.", es: ["ella no supo la verdad", "no supo la verdad"] },
    { en: "You didn't give him anything.", es: ["tú no le diste nada", "no le diste nada"] },
    { en: "We didn't walk today.", es: ["nosotros no anduvimos hoy", "no anduvimos hoy"] },
    { en: "He didn't drive fast.", es: ["él no condujo rápido", "no condujo rápido"] },
    { en: "I didn't come with her.", es: ["yo no vine con ella", "no vine con ella"] },
];

const translationVocabHelp = {
    "Last night": "Anoche",
    "I went": "Fui",
    "to the house": "a la casa",
    "I had": "Tuve",
    "to do": "hacer",
    "I made": "Hice",
    "I brought": "Traje",
    "We saw": "Vimos",
    "We were": "Estuvimos",
    "I knew": "Supe",
    "I wanted": "Quise",
    "stay": "quedarme"
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
                        <CardDescription className="font-bold text-foreground mt-1">Traduce la frase al español usando pasado irregular.</CardDescription>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger>
                        <PopoverContent className="w-64"><ScrollArea className="h-64 pr-4"><div className="space-y-2 text-foreground text-left"><h4 className='font-black text-primary text-xs uppercase mb-2 border-b'>Ayuda de Misión</h4>{Object.entries(vocabulary || {}).map(([es, en]: any, i) => (<div key={i} className="flex justify-between text-[10px] border-b border-muted pb-1"><span className="text-muted-foreground text-left uppercase">{es}:</span><span className="font-bold text-right text-primary">{en.toUpperCase()}</span></div>))}</div></ScrollArea></PopoverContent>
                    </Popover>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">{prompts[currentIndex].en}</div>
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

// --- MAIN CONTENT COMPONENT ---

function PasadoIrregularesContent() {
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
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(pastIrregVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(pastIrregVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const [conjIdx, setConjIdx] = useState(0);
    const [conjAns, setConjAns] = useState<Record<number, string[]>>({});
    const [conjVal, setConjVal] = useState<Record<number, any[]>>({});

    const [compAns, setCompAns] = useState<string[]>(Array(completionPrompts.length).fill(''));
    const [compVal, setCompVal] = useState<any[]>(Array(completionPrompts.length).fill('unchecked'));

    const [finalVerbsIdx, setFinalVerbsIdx] = useState(0);
    const [finalVerbsAns, setFinalVerbsAns] = useState<Record<number, string[]>>({});
    const [finalVerbsVal, setFinalVerbsVal] = useState<Record<number, any[]>>({});

    const [readingAns, setReadingAns] = useState<string[]>(Array(readingData.questions.length).fill(''));
    const [readingVal, setReadingVal] = useState<any[]>(Array(readingData.questions.length).fill('unchecked'));

    const [translationText, setTranslationText] = useState('');

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    
    const { data: authUserProfile } = useDoc<{ role?: string }>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string, lessonProgress?: any, progress?: any, name?: string }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: '2. Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'conjugacion', name: '3. Conjugación', icon: Pencil, status: 'locked' },
        { key: 'exercise1', name: '4. Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'exercise2', name: '5. Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'exercise3', name: '7. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: '8. Lectura', icon: BookText, status: 'locked' },
        { key: 'exercise4', name: '9. Ejercicio 4', icon: PenSquare, status: 'locked' },
        { key: 'completar', name: '10. Completar', icon: Pencil, status: 'locked' },
        { key: 'final_ex', name: '11. Ejercicio Final', icon: Trophy, status: 'locked' },
        { key: 'traducir_texto', name: '12. Traducir Texto', icon: MessageSquare, status: 'locked' },
        { key: 'final_neg', name: '13. Final (Negativo)', icon: CheckCircle2, status: 'locked' },
    ], []);

    // ASYNC FLOW 1: Carga inicial
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

    // ASYNC FLOW 2: Guardado de progreso
    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || targetStudentId) return;
        const s: Record<string, any> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => { s[item.key] = item.status; });
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, isInitialLoading, targetStudentId]);

    // ASYNC FLOW 3: Desbloqueos
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
        if (['grammar'].includes(topicKey)) handleTopicComplete(topicKey);
    };

    const handleTopicComplete = (completedKey: string) => {
        setTopicToComplete(completedKey);
    };

    const handleVocabCheck = () => {
        let ok = false;
        const nv = pastIrregVocab.map((item, idx) => {
            const isCorrect = item.es.toLowerCase().includes((vocabAnswers[idx] || '').trim().toLowerCase()) && (vocabAnswers[idx] || '').length > 2;
            if (isCorrect) ok = true;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv as any);
        if (ok) { toast({ title: "¡Excelente!" }); setCanAdvanceVocab(true); handleTopicComplete('vocabulary'); }
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const handleConjCheck = () => {
        const verb = conjugationVerbsList[conjIdx];
        const ans = conjAns[conjIdx] || Array(5).fill('');
        const stem = verb.stem;
        
        let corrects: string[] = [];
        if (verb.es === 'IR') corrects = ["fui", "fuiste", "fue", "fuimos", "fueron"];
        else if (verb.es === 'VER') corrects = ["vi", "viste", "vio", "vimos", "vieron"];
        else if (verb.es === 'DAR') corrects = ["di", "diste", "dio", "dimos", "dieron"];
        else if (stem.endsWith('j')) corrects = [stem + "e", stem + "iste", stem + "o", stem + "imos", stem + "eron"];
        else if (verb.es === 'HACER') corrects = ["hice", "hiciste", "hizo", "hicimos", "hicieron"];
        else corrects = [stem + "e", stem + "iste", stem + "o", stem + "imos", stem + "ieron"];

        const nv = ans.map((a, i) => a.trim().toLowerCase() === corrects[i] ? 'correct' : 'incorrect');
        setConjVal(p => ({ ...p, [conjIdx]: nv }));
        if (nv.every(v => v === 'correct')) {
            toast({ title: "¡Perfecto!" });
            if (conjIdx < conjugationVerbsList.length - 1) setConjIdx(v => v + 1);
            else handleTopicComplete('conjugacion');
        } else toast({ variant: "destructive", title: "Errores detectados" });
    };

    const handleCheckReading = () => {
        let ok = true;
        const nv = readingData.questions.map((q, i) => {
            const res = q.a.some(ans => (readingAns[i] || '').trim().toLowerCase().includes(ans.toLowerCase()));
            if (!res) ok = false;
            return res ? 'correct' : 'incorrect';
        });
        setReadingVal(nv as any);
        if (ok) { toast({ title: "¡Muy bien!" }); handleTopicComplete('reading'); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const handleCheckComp = () => {
        let ok = true;
        const nv = completionPrompts.map((q, i) => {
            const res = q.a.toLowerCase() === (compAns[i] || '').trim().toLowerCase();
            if (!res) ok = false;
            return res ? 'correct' : 'incorrect';
        });
        setCompVal(nv as any);
        if (ok) { toast({ title: "¡Excelente precisión!" }); handleTopicComplete('completar'); }
        else toast({ variant: 'destructive', title: "Hay errores" });
    };

    const handleChoiceSelect = (option: string, idx: number) => {
        // Lógica simplificada para ejercicio 4
        handleTopicComplete('exercise4');
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex flex-col items-center justify-center min-h-[400px]"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /></div>;

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className="text-primary uppercase">Vocabulary: Past Irregulars</CardTitle><CardDescription className='font-bold text-foreground'>Escribe el significado en español.</CardDescription></CardHeader>
                        <CardContent className="pt-6">
                            <ScrollArea className="h-[450px] pr-4">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                    <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">English</div><div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Español</div>
                                    {pastIrregVocab.map((v, i) => (
                                        <Fragment key={i}>
                                            <div className="flex items-center font-bold py-1 uppercase">{v.en}</div>
                                            <Input value={vocabAnswers[i] || ''} onChange={e => { const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); setVocabValidation(vv => { const nv = [...vv]; nv[i] = 'unchecked'; return nv as any; }); }} className={cn("h-10 uppercase font-mono border-2", vocabValidation[i] === 'correct' ? 'border-green-500' : vocabValidation[i] === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" />
                                        </Fragment>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 bg-muted/20"><Button onClick={handleVocabCheck} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-foreground text-left overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Pasado Irregular</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <p className="text-lg font-bold mb-4">A diferencia de los regulares, estos verbos cambian su raíz y no llevan tilde en las formas de Yo y Él/Ella.</p>
                                <div className='grid gap-4 md:grid-cols-2'>
                                    <div className='p-4 bg-primary/10 rounded-xl border border-primary/20'>
                                        <h4 className='font-black text-primary uppercase text-sm mb-2'>Grupo UV</h4>
                                        <p className='text-xs italic'>Tener (Tuv-), Estar (Estuv-), Andar (Anduv-)</p>
                                    </div>
                                    <div className='p-4 bg-brand-purple/10 rounded-xl border border-brand-purple/20'>
                                        <h4 className='font-black text-brand-purple uppercase text-sm mb-2'>Grupo I</h4>
                                        <p className='text-xs italic'>Hacer (Hic-), Querer (Quis-), Venir (Vin-)</p>
                                    </div>
                                    <div className='p-4 bg-brand-blue/10 rounded-xl border border-brand-blue/20'>
                                        <h4 className='font-black text-brand-blue uppercase text-sm mb-2'>Grupo J</h4>
                                        <p className='text-xs italic'>Decir (Dij-), Traer (Traj-), Conducir (Conduj-)</p>
                                    </div>
                                    <div className='p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20'>
                                        <h4 className='font-black text-yellow-600 uppercase text-sm mb-2'>Grupo U</h4>
                                        <p className='text-xs italic'>Saber (Sup-), Poner (Pus-), Poder (Pud-)</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 shadow-xl">He comprendido la gramática</Button></CardFooter>
                    </Card>
                );
            case 'conjugacion':
                const currentV = conjugationVerbsList[conjIdx];
                const persons = ["Yo", "Tú", "Él/Ella/Ud", "Nosotros", "Ellos/Ellas/Uds"];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><div className='flex justify-between items-center'><div><CardTitle className='text-primary uppercase'>Misión: Conjugación</CardTitle><CardDescription>Conjuga el verbo en pasado irregular.</CardDescription></div><div className='text-right text-xs font-bold text-muted-foreground uppercase'>VERBO {conjIdx + 1} DE {conjugationVerbsList.length}</div></div></CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className='text-center p-6 bg-primary/10 rounded-3xl border-2 border-primary/20'><h3 className='text-4xl font-black text-primary uppercase tracking-tighter'>{currentV.en} ({currentV.es})</h3></div>
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                {persons.map((p, i) => (
                                    <div key={i} className='space-y-1'><Label className='font-bold ml-1'>{p}:</Label><Input value={conjAns[conjIdx]?.[i] || ''} onChange={e => { const nv = { ...conjAns }; const ca = nv[conjIdx] || Array(5).fill(''); ca[i] = e.target.value; nv[conjIdx] = ca; setConjAns(nv); setConjVal(pr => ({ ...pr, [conjIdx]: undefined })); }} className={cn("h-11 font-mono lowercase border-2", conjVal[conjIdx]?.[i] === 'correct' ? 'border-green-500 bg-green-50/5' : conjVal[conjIdx]?.[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete='off' /></div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/20"><Button onClick={handleConjCheck} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">Verificar Verbo <ArrowRight className='ml-2'/></Button></CardFooter>
                    </Card>
                );
            case 'exercise1': return <BallsExercise title="Ejercicio 1" prompts={ex1Prompts} onComplete={() => handleTopicComplete('exercise1')} />;
            case 'exercise2': return <BallsExercise title="Ejercicio 2" prompts={ex2Prompts} onComplete={() => handleTopicComplete('exercise2')} />;
            case 'exercise3': return <BallsExercise title="Ejercicio 3" prompts={ex3Prompts} onComplete={() => handleTopicComplete('exercise3')} />;
            case 'vocab_game': return <Card className="shadow-soft border-2 border-brand-purple"><CardHeader><CardTitle>Juego de Memoria</CardTitle></CardHeader><CardContent><VocabularyMatchingGame data={pastIrregVocab.slice(0, 10).map(v => ({ spanish: v.es.split(' ')[0], english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Encuentra las parejas de verbos" /></CardContent></Card>;
            case 'reading':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase'>{readingData.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-inner">{readingData.content}</div>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className='font-black text-primary uppercase text-sm'>Preguntas de Comprensión:</h3>
                                {readingData.questions.map((q, i) => (
                                    <div key={i} className="space-y-2 p-3 bg-muted/20 rounded-xl border"><Label className="font-bold">{q.q}</Label><Input value={readingAns[i] || ''} onChange={e => { const na = [...readingAns]; na[i] = e.target.value; setReadingVal(v => { const nv = [...v]; nv[i] = 'unchecked'; return nv as any; }); }} className={cn("h-10 text-foreground", readingVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : readingVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" /></div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/10"><Button onClick={handleCheckReading} size="lg" className="px-16 font-black h-12 shadow-md">Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'exercise4':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground">
                        <CardHeader><CardTitle>Ejercicio 4: Opción Múltiple</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {ex4OptionsPrompts.slice(0, 10).map((q, i) => (
                                <div key={i} className="p-4 border rounded-xl space-y-3">
                                    <p className="font-bold">{q.sentence}</p>
                                    <div className="flex gap-2">{q.options.map(opt => <Button key={opt} variant="outline" onClick={() => handleChoiceSelect(opt, i)}>{opt}</Button>)}</div>
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter><Button onClick={() => handleTopicComplete('exercise4')}>Siguiente Paso</Button></CardFooter>
                    </Card>
                );
            case 'completar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase'>Misión: Completar Frases (30)</CardTitle></CardHeader>
                        <CardContent className="p-0"><ScrollArea className="h-[450px] p-6"><div className="space-y-4">
                            {completionPrompts.map((q, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm">
                                    <p className="font-bold text-lg">{q.s}</p>
                                    <Input value={compAns[i] || ''} onChange={e => { const na = [...compAns]; na[i] = e.target.value; setCompAns(na); setCompVal(v => { const nv = [...v]; nv[i] = 'unchecked'; return nv as any; }); }} className={cn("h-10 max-w-[200px] text-lg font-mono border-2", compVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : compVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder="Respuesta..." autoComplete="off" />
                                </div>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/20"><Button onClick={handleCheckComp} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">Verificar Todo</Button></CardFooter>
                    </Card>
                );
            case 'final_ex':
                const finalVerbs = ["TENER", "HACER", "PODER", "ESTAR", "SABER"];
                const currentFinalV = finalVerbs[finalVerbsIdx];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><div className='flex justify-between items-center'><div><CardTitle className='text-primary uppercase'>Ejercicio Final: Dominio Total</CardTitle><CardDescription>Conjuga el verbo en todas sus formas.</CardDescription></div><div className='text-right text-xs font-bold text-muted-foreground uppercase'>TABLA {finalVerbsIdx + 1} DE {finalVerbs.length}</div></div></CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className='text-center p-6 bg-primary/10 rounded-3xl border-2 border-primary/20'><h3 className='text-4xl font-black text-primary uppercase tracking-tighter'>{currentFinalV}</h3></div>
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                {["Yo", "Tú", "Él/Ella/Ud", "Nosotros", "Ellos/Ellas/Uds"].map((p, i) => (
                                    <div key={i} className='space-y-1'><Label className='font-bold ml-1'>{p}:</Label><Input value={finalVerbsAns[finalVerbsIdx]?.[i] || ''} onChange={e => { const nv = { ...finalVerbsAns }; const ca = nv[finalVerbsIdx] || Array(5).fill(''); ca[i] = e.target.value; nv[finalVerbsIdx] = ca; setFinalVerbsAns(nv); setFinalVerbsVal(pr => ({ ...pr, [finalVerbsIdx]: undefined })); }} className={cn("h-11 font-mono lowercase border-2", finalVerbsVal[finalVerbsIdx]?.[i] === 'correct' ? 'border-green-500 bg-green-50/5' : finalVerbsVal[finalVerbsIdx]?.[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete='off' /></div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/20"><Button onClick={() => { if (finalVerbsIdx < finalVerbs.length - 1) setFinalVerbsIdx(v => v + 1); else handleTopicComplete('final_ex'); }} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">Siguiente Verbo <ArrowRight className='ml-2'/></Button></CardFooter>
                    </Card>
                );
            case 'traducir_texto':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader>
                            <div className="flex justify-between items-center"><div><CardTitle className='text-primary uppercase'>Traducción: Mi fin de semana</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el texto usando verbos irregulares.</CardDescription></div><Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger><PopoverContent className="w-64"><ScrollArea className="h-48 pr-4"><div className="space-y-2">{Object.entries(translationVocabHelp).map(([en, es], i) => (<div key={i} className="flex justify-between text-xs border-b pb-1"><span className="text-muted-foreground">{en}:</span><span className="font-bold text-primary">{es}</span></div>))}</div></ScrollArea></PopoverContent></Popover></div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-sm">"Last night I went to my house. I had to do a lot of things. I made dinner and I brought the wine. We saw a movie and we were very happy. I knew the truth. I wanted to stay there."</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={translationText} onChange={(e) => setTranslationText(e.target.value)} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg leading-relaxed" /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20"><Button onClick={() => handleTopicComplete('traducir_texto')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Terminar <Trophy className='ml-3 h-8 w-8' /></Button></CardFooter>
                    </Card>
                );
            case 'final_neg':
                return <BallsExercise title="Final (Frases Negativas)" prompts={negativePrompts} onComplete={() => handleTopicComplete('final_neg')} vocabulary={{ "fiesta": "party", "tiempo": "time", "mentira": "lie", "allá": "there", "nada": "nothing" }} />;
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
                        <Link href="/espanol/a2" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver al Curso A2</Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight">Pasado Irregulares 🇪🇸</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30"><CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Misión A2</CardTitle></CardHeader>
                                <CardContent className="p-4">
                                    <nav><ul className="space-y-1">
                                        {learningPath.map((item) => {
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            const isSelected = selectedTopic === item.key;
                                            const Icon = item.icon;
                                            return (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer', isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', isSelected && 'bg-muted text-primary font-black border-l-4 border-primary')}>
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

export default function PasadoIrregularesPage() {
    return (<Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}><PasadoIrregularesContent /></Suspense>);
}