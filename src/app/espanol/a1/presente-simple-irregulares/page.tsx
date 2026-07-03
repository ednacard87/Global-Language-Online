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
    Pencil,
    Activity,
    Check,
    X,
    Info,
    ListChecks,
    Zap
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
const progressStorageVersion = 'progress_es_a1_pres_irreg_v1_full';
const mainProgressKey = 'progress_a1_es_presente_simple_irregulares';

// --- DATA ---

const irregularVerbsVocab = [
    { en: "TO BE (essential)", es: "SER" },
    { en: "TO BE (state)", es: "ESTAR" },
    { en: "TO GO", es: "IR" },
    { en: "TO HAVE", es: "TENER" },
    { en: "TO DO / TO MAKE", es: "HACER" },
    { en: "TO BE ABLE TO / CAN", es: "PODER" },
    { en: "TO SAY / TO TELL", es: "DECIR" },
    { en: "TO COME", es: "VENIR" },
    { en: "TO SEE", es: "VER" },
    { en: "TO KNOW (facts)", es: "SABER" },
    { en: "TO WANT", es: "QUERER" },
    { en: "TO THINK", es: "PENSAR" },
    { en: "TO HEAR", es: "OIR" },
    { en: "TO SLEEP", es: "DORMIR" },
    { en: "TO PUT / TO PLACE", es: "PONER" },
    { en: "TO FOLLOW / TO CONTINUE", es: "SEGUIR" },
    { en: "TO FIND", es: "ENCONTRAR" },
    { en: "TO FEEL", es: "SENTIR" },
    { en: "TO ASK FOR / TO ORDER", es: "PEDIR" },
    { en: "TO PLAY (a sport/game)", es: "JUGAR" },
    { en: "TO BEGIN / TO START", es: "EMPEZAR" },
    { en: "TO KNOW (people/places)", es: "CONOCER" },
    { en: "TO LEAVE / TO GO OUT", es: "SALIR" },
    { en: "TO RETURN", es: "VOLVER" },
    { en: "TO BRING", es: "TRAER" },
    { en: "TO GIVE", es: "DAR" },
    { en: "TO REPEAT", es: "REPETIR" },
    { en: "TO CLOSE", es: "CERRAR" },
    { en: "TO COST", es: "COSTAR" },
    { en: "TO LOSE", es: "PERDER" },
    { en: "TO REMEMBER", es: "RECORDAR" },
    { en: "TO SERVE", es: "SERVIR" },
    { en: "TO FLY", es: "VOLAR" },
    { en: "TO SHOW", es: "MOSTRAR" },
    { en: "TO COUNT / TO TELL", es: "CONTAR" },
    { en: "TO LAUGH", es: "REIR" },
    { en: "TO SMILE", es: "SONREIR" },
    { en: "TO TRANSLATE", es: "TRADUCIR" },
    { en: "TO DRIVE", es: "CONDUCIR" },
    { en: "TO PRODUCE", es: "PRODUCIR" }
];

const irregularConjVerbs = [
    { v: "SER", type: "total", forms: ["soy", "eres", "es", "somos", "son"] },
    { v: "TENER", type: "yo-go, e-ie", forms: ["tengo", "tienes", "tiene", "tenemos", "tienen"] },
    { v: "IR", type: "total", forms: ["voy", "vas", "va", "vamos", "van"] },
    { v: "PODER", type: "o-ue", forms: ["puedo", "puedes", "puede", "podemos", "pueden"] },
    { v: "HACER", type: "yo-go", forms: ["hago", "haces", "hace", "hacemos", "hacen"] },
    { v: "QUERER", type: "e-ie", forms: ["quiero", "quieres", "quiere", "queremos", "quieren"] },
    { v: "DECIR", type: "yo-go, e-i", forms: ["digo", "dices", "dice", "decimos", "dicen"] },
    { v: "VENIR", type: "yo-go, e-ie", forms: ["vengo", "vienes", "viene", "venimos", "vienen"] },
    { v: "DORMIR", type: "o-ue", forms: ["duermo", "duermes", "duerme", "dormimos", "duermen"] },
    { v: "PEDIR", type: "e-i", forms: ["pido", "pides", "pide", "pedimos", "piden"] },
    { v: "JUGAR", type: "u-ue", forms: ["juego", "juegas", "juega", "jugamos", "juegan"] },
    { v: "SABER", type: "yo-sé", forms: ["sé", "sabes", "sabe", "sabemos", "saben"] },
    { v: "CONOCER", type: "yo-zco", forms: ["conozco", "conoces", "conoce", "conocemos", "conocen"] },
    { v: "DAR", type: "yo-doy", forms: ["doy", "das", "da", "damos", "dan"] },
    { v: "VER", type: "yo-veo", forms: ["veo", "ves", "ve", "vemos", "ven"] }
];

const ex1Prompts = [
    { en: "I am a doctor.", es: ["yo soy doctor", "soy doctor"] },
    { en: "You are tired.", es: ["tú estás cansado", "tu estas cansado", "estás cansado", "estas cansado"] },
    { en: "He has a book.", es: ["él tiene un libro", "el tiene un libro", "tiene un libro"] },
    { en: "We go to the cinema.", es: ["nosotros vamos al cine", "vamos al cine"] },
    { en: "They are in the house.", es: ["ellos están en la casa", "ellas estan en la casa", "están en la casa"] },
    { en: "She is from Mexico.", es: ["ella es de méxico", "es de mexico"] },
    { en: "I have to study.", es: ["yo tengo que estudiar", "tengo que estudiar"] },
];

const ex2Prompts = [
    { en: "I want a coffee.", es: ["yo quiero un café", "quiero un cafe"] },
    { en: "You can play.", es: ["tú puedes jugar", "tu puedes jugar", "puedes jugar"] },
    { en: "He thinks a lot.", es: ["él piensa mucho", "el piensa mucho", "piensa mucho"] },
    { en: "We sleep eight hours.", es: ["nosotros dormimos ocho horas", "dormimos ocho horas"] },
    { en: "They ask for help.", es: ["ellos piden ayuda", "ellas piden ayuda", "piden ayuda"] },
    { en: "She closes the door.", es: ["ella cierra la puerta", "cierra la puerta"] },
    { en: "I find the key.", es: ["yo encuentro la llave", "encuentro la llave"] },
    { en: "You return late.", es: ["tú vuelves tarde", "tu vuelves tarde", "vuelves tarde"] },
];

const ex3Prompts = [
    { en: "I do my homework.", es: ["yo hago mi tarea", "hago mi tarea"] },
    { en: "You put the book on the table.", es: ["tú pones el libro en la mesa", "pones el libro en la mesa"] },
    { en: "He leaves at eight.", es: ["él sale a las ocho", "el sale a las ocho", "sale a las ocho"] },
    { en: "We say the truth.", es: ["nosotros decimos la verdad", "decimos la verdad"] },
    { en: "They see a movie.", es: ["ellos ven una película", "ellas ven una pelicula", "ven una pelicula"] },
    { en: "I know the answer.", es: ["yo sé la respuesta", "sé la respuesta", "se la respuesta"] },
    { en: "You give a gift.", es: ["tú das un regalo", "das un regalo"] },
    { en: "She brings food.", es: ["ella trae comida", "trae comida"] },
    { en: "I know your brother.", es: ["yo conozco a tu hermano", "conozco a tu hermano"] },
    { en: "We hear a noise.", es: ["nosotros oímos un ruido", "oimos un ruido"] },
];

const readingData = {
    title: "Mi Fin de Semana",
    content: "Hola, soy Ana. Mis fines de semana son interesantes. El sábado por la mañana, yo voy al mercado. Yo veo muchas frutas y verduras. A veces, encuentro a mis amigos allí. Por la tarde, yo hago mi tarea y pienso en mis planes. Mi amigo Carlos viene a mi casa y nosotros jugamos videojuegos. Él siempre pierde. Por la noche, nosotros pedimos pizza. El domingo, yo duermo mucho. ¡Yo quiero fines de semana más largos!",
    questions: [
        { q: "¿Adónde va Ana el sábado?", a: ["al mercado"] },
        { q: "¿Qué hace Ana por la tarde?", a: ["hace su tarea y piensa en sus planes", "hace la tarea y piensa en los planes"] },
        { q: "¿Quién viene a su casa?", a: ["carlos", "su amigo carlos"] },
        { q: "¿Qué juegan Ana y Carlos?", a: ["videojuegos"] },
        { q: "¿Qué piden para cenar?", a: ["pizza"] },
    ]
};

const finalExPrompts = [
    { s: "1. Yo (ser) _______ de Colombia.", a: "soy" },
    { s: "2. Tú (tener) _______ un coche nuevo.", a: "tienes" },
    { s: "3. Él (ir) _______ a la escuela.", a: "va" },
    { s: "4. Nosotros (poder) _______ hablar español.", a: "podemos" },
    { s: "5. Ellos (hacer) _______ mucho ruido.", a: "hacen" },
    { s: "6. Ella (querer) _______ un helado.", a: "quiere" },
    { s: "7. Yo (poner) _______ la mesa.", a: "pongo" },
    { s: "8. Tú (venir) _______ a la fiesta.", a: "vienes" },
    { s: "9. Él (decir) _______ la verdad.", a: "dice" },
    { s: "10. Nosotros (dormir) _______ poco.", a: "dormimos" },
    { s: "11. Yo (saber) _______ la respuesta.", a: "sé" },
    { s: "12. Ellos (pedir) _______ ayuda.", a: "piden" },
    { s: "13. Ella (jugar) _______ al tenis.", a: "juega" },
    { s: "14. Yo (ver) _______ una película.", a: "veo" },
    { s: "15. Nosotros (empezar) _______ la clase.", a: "empezamos" },
    { s: "16. Él (conocer) _______ a mi familia.", a: "conoce" },
    { s: "17. Tú (sentir) _______ frío.", a: "sientes" },
    { s: "18. Ellos (volver) _______ tarde.", a: "vuelven" },
    { s: "19. Yo (salir) _______ con amigos.", a: "salgo" },
    { s: "20. Ella (seguir) _______ las instrucciones.", a: "sigue" },
    { s: "21. Nosotros (traer) _______ la comida.", a: "traemos" },
    { s: "22. Yo (dar) _______ un regalo.", a: "doy" },
    { s: "23. Tú (encontrar) _______ las llaves.", a: "encuentras" },
    { s: "24. Ellos (repetir) _______ la palabra.", a: "repiten" },
    { s: "25. Yo (traducir) _______ el texto.", a: "traduzco" },
    { s: "26. Él (perder) _______ siempre.", a: "pierde" },
    { s: "27. Nosotros (recordar) _______ la fecha.", a: "recordamos" },
    { s: "28. Tú (servir) _______ la cena.", a: "sirves" },
    { s: "29. Yo (conducir) _______ con cuidado.", a: "conduzco" },
    { s: "30. La camisa (costar) _______ veinte dolares.", a: "cuesta" },
];

const negativePrompts = [
    { en: "I am not a student.", es: ["yo no soy estudiante", "no soy estudiante"] },
    { en: "You are not at home.", es: ["tú no estás en casa", "no estas en casa"] },
    { en: "He does not have money.", es: ["él no tiene dinero", "el no tiene dinero", "no tiene dinero"] },
    { en: "We do not go to the party.", es: ["nosotros no vamos a la fiesta", "no vamos a la fiesta"] },
    { en: "They do not want to eat.", es: ["ellos no quieren comer", "ellas no quieren comer", "no quieren comer"] },
    { en: "She cannot come.", es: ["ella no puede venir", "no puede venir"] },
    { en: "I do not see the problem.", es: ["yo no veo el problema", "no veo el problema"] },
    { en: "You do not know the answer.", es: ["tú no sabes la respuesta", "no sabes la respuesta"] },
    { en: "He does not do anything.", es: ["él no hace nada", "el no hace nada", "no hace nada"] },
    { en: "We do not sleep well.", es: ["nosotros no dormimos bien", "no dormimos bien"] },
    { en: "They do not ask for anything.", es: ["ellos no piden nada", "ellas no piden nada", "no piden nada"] },
    { en: "I do not leave today.", es: ["yo no salgo hoy", "no salgo hoy"] },
];

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
                                    {Object.entries(vocabulary || {}).map(([en, es]: any, i) => (
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

interface Topic {
    key: string;
    name: string;
    icon: React.ElementType;
    status: 'locked' | 'active' | 'completed';
}

function PresenteSimpleIrregularesContent() {
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
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(irregularVerbsVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(irregularVerbsVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const [conjIdx, setConjIdx] = useState(0);
    const [conjAnswers, setConjAnswers] = useState<string[]>(Array(5).fill(''));
    const [conjValidation, setConjValidation] = useState<any[]>(Array(5).fill('unchecked'));

    const [finalExAns, setFinalExAns] = useState<string[]>(Array(finalExPrompts.length).fill(''));
    const [finalExVal, setFinalExVal] = useState<any[]>(Array(finalExPrompts.length).fill('unchecked'));

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
        { key: 'conjugation', name: '3. Conjugación', icon: Pencil, status: 'locked' },
        { key: 'ex1', name: '4. Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: '5. Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'ex3', name: '7. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: '8. Lectura', icon: BookText, status: 'locked' },
        { key: 'final_ex', name: '9. Ejercicio Final', icon: Trophy, status: 'locked' },
        { key: 'translate_text', name: '10. Traducir Texto', icon: MessageSquare, status: 'locked' },
        { key: 'final', name: '11. Final', icon: CheckCircle, status: 'locked' },
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
        const nv = irregularVerbsVocab.map((item, idx) => {
            const isCorrect = item.es.toLowerCase() === (vocabAnswers[idx] || '').trim().toLowerCase();
            if (isCorrect) okCount++;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv as any);
        if (okCount >= 10) { setCanAdvanceVocab(true); toast({ title: "¡Buen avance!" }); }
        else toast({ variant: 'destructive', title: "Necesitas 10 aciertos para avanzar." });
    };

    const handleConjCheck = () => {
        const verb = irregularConjVerbs[conjIdx];
        const corrects = verb.forms;
    
        const nv = conjAnswers.map((a, i) => a.trim().toLowerCase() === corrects[i] ? 'correct' : 'incorrect');
        setConjValidation(nv as any);
    
        if (nv.every(st => st === 'correct')) {
            toast({ title: "¡Perfecto!" });
            if (conjIdx < irregularConjVerbs.length - 1) {
                setConjIdx(prev => prev + 1);
                setConjAnswers(Array(5).fill(''));
                setConjValidation(Array(5).fill('unchecked'));
            } else {
                handleTopicComplete('conjugation');
            }
        } else {
            toast({ variant: 'destructive', title: "Revisa la conjugación" });
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
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className="text-primary uppercase tracking-tighter">Vocabulario: Verbos Irregulares (40)</CardTitle><CardDescription className='font-bold text-foreground'>Escribe el infinitivo en español para cada verbo.</CardDescription></CardHeader>
                        <CardContent className="pt-6"><ScrollArea className="h-[450px] pr-4"><div className="grid grid-cols-2 gap-4">
                            <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">English</div><div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Español</div>
                            {irregularVerbsVocab.map((v, i) => (<Fragment key={i}><div className="flex items-center font-bold py-1 text-sm">{v.en}</div><Input value={vocabAnswers[i]} onChange={e => { const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); setVocabValidation(vv => { const nv = [...vv]; nv[i] = 'unchecked'; return nv as any; }); setCanAdvanceVocab(false); }} className={cn("h-10 uppercase", vocabValidation[i] === 'correct' ? 'border-green-500' : vocabValidation[i] === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></Fragment>))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 bg-muted/20"><Button onClick={handleVocabCheck} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar <ArrowRight className='ml-2'/></Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                const irregularGroups = [
                    {
                        title: "1. Completamente Irregulares",
                        description: "Estos verbos tienen formas únicas que debes memorizar.",
                        verbs: [
                            { name: "SER (to be)", data: ["soy", "eres", "es", "somos", "son"] },
                            { name: "ESTAR (to be)", data: ["estoy", "estás", "está", "estamos", "están"] },
                            { name: "IR (to go)", data: ["voy", "vas", "va", "vamos", "van"] }
                        ]
                    },
                    {
                        title: "2. Verbos 'YO-GO'",
                        description: "Estos verbos terminan en '-go' solo en la forma 'Yo'. Las otras formas pueden ser regulares o tener otros cambios.",
                        verbs: [
                            { name: "TENER (e>ie)", data: ["tengo", "tienes", "tiene", "tenemos", "tienen"] },
                            { name: "HACER", data: ["hago", "haces", "hace", "hacemos", "hacen"] },
                            { name: "PONER", data: ["pongo", "pones", "pone", "ponemos", "ponen"] },
                            { name: "SALIR", data: ["salgo", "sales", "sale", "salimos", "salen"] },
                            { name: "DECIR (e>i)", data: ["digo", "dices", "dice", "decimos", "dicen"] },
                        ]
                    },
                    {
                        title: "3. Cambio de Raíz (E > IE)",
                        description: "La 'e' en la raíz del verbo cambia a 'ie' en todas las formas excepto 'nosotros'.",
                        verbs: [
                            { name: "QUERER", data: ["quiero", "quieres", "quiere", "queremos", "quieren"] },
                            { name: "PENSAR", data: ["pienso", "piensas", "piensa", "pensamos", "piensan"] },
                            { name: "CERRAR", data: ["cierro", "cierras", "cierra", "cerramos", "cierran"] },
                        ]
                    },
                     {
                        title: "4. Cambio de Raíz (O > UE)",
                        description: "La 'o' en la raíz del verbo cambia a 'ue' en todas las formas excepto 'nosotros'.",
                        verbs: [
                            { name: "PODER", data: ["puedo", "puedes", "puede", "podemos", "pueden"] },
                            { name: "DORMIR", data: ["duermo", "duermes", "duerme", "dormimos", "duermen"] },
                            { name: "ENCONTRAR", data: ["encuentro", "encuentras", "encuentra", "encontramos", "encuentran"] },
                        ]
                    },
                    {
                        title: "5. Cambio de Raíz (E > I)",
                        description: "La 'e' en la raíz del verbo cambia a 'i' en todas las formas excepto 'nosotros'. Se da principalmente en verbos -IR.",
                        verbs: [
                            { name: "PEDIR", data: ["pido", "pides", "pide", "pedimos", "piden"] },
                            { name: "SERVIR", data: ["sirvo", "sirves", "sirve", "servimos", "sirven"] },
                            { name: "REPETIR", data: ["repito", "repites", "repite", "repetimos", "repiten"] },
                        ]
                    },
                    {
                        title: "6. Otras formas 'Yo' irregulares",
                        description: "Estos verbos tienen una forma 'Yo' especial. Las demás son regulares.",
                        verbs: [
                            { name: "SABER", data: ["sé", "sabes", "sabe", "sabemos", "saben"] },
                            { name: "VER", data: ["veo", "ves", "ve", "vemos", "ven"] },
                            { name: "DAR", data: ["doy", "das", "da", "damos", "dan"] },
                            { name: "CONOCER", data: ["conozco", "conoces", "conoce", "conocemos", "conocen"] },
                        ]
                    }
                ];

                const pronouns = ["Yo", "Tú", "Él/Ella", "Nosotros", "Ellos/Ellas"];

                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-foreground text-left overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Presente Simple Irregulares</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0">
                            {irregularGroups.map(group => (
                                <div key={group.title} className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                    <h3 className="text-xl font-black text-primary uppercase mb-2">{group.title}</h3>
                                    <p className="mb-4 text-muted-foreground">{group.description}</p>
                                    {group.verbs.map(verb => (
                                         <div key={verb.name} className="mb-4">
                                            <h4 className="font-bold text-lg mb-2 text-brand-blue">{verb.name}</h4>
                                            <Table><TableHeader className='bg-muted/50'><TableRow>{pronouns.map(p=><TableHead key={p}>{p}</TableHead>)}</TableRow></TableHeader>
                                            <TableBody><TableRow>{verb.data.map((c, i)=><TableCell key={i}>{c}</TableCell>)}</TableRow></TableBody></Table>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">He comprendido la gramática</Button></CardFooter>
                    </Card>
                );
            case 'conjugation':
                const curVerb = irregularConjVerbs[conjIdx];
                const pronounsConj = ["Yo", "Tú", "Él/Ella", "Nosotros", "Ellos/Ellas"];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'>
                            <div className="flex justify-between items-center w-full">
                                <div>
                                    <CardTitle className='text-primary uppercase tracking-tighter'>Misión: Conjugación Irregular</CardTitle>
                                    <CardDescription>Completa la tabla de verbos irregulares ({conjIdx + 1}/{irregularConjVerbs.length})</CardDescription>
                                </div>
                                <div className='px-4 py-1 bg-primary/10 rounded-full border border-primary/20 text-xs font-bold text-primary uppercase'>
                                    {curVerb.type}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-8 pt-8">
                            <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-primary/5 to-brand-purple/5 rounded-[2.5rem] border-2 border-dashed border-primary/20">
                                <span className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Verbo a conjugar</span>
                                <h3 className="text-5xl md:text-6xl font-black text-primary uppercase tracking-tighter drop-shadow-sm">
                                    {curVerb.v}
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                                {pronounsConj.map((p, i) => (
                                    <div key={i} className="space-y-1.5">
                                        <div className="flex justify-between px-1">
                                            <Label className="text-xs font-black uppercase text-muted-foreground">{p}</Label>
                                            {conjValidation[i] === 'correct' && <Check className="h-3 w-3 text-green-500" />}
                                            {conjValidation[i] === 'incorrect' && <X className="h-3 w-3 text-red-500" />}
                                        </div>
                                        <Input 
                                            value={conjAnswers[i]} 
                                            onChange={e => { 
                                                const na = [...conjAnswers]; 
                                                na[i] = e.target.value; 
                                                setConjAnswers(na); 
                                                setConjValidation(vv => { const nvv = [...vv]; nvv[i] = 'unchecked'; return nvv as any; }); 
                                            }} 
                                            className={cn(
                                                "h-12 text-lg font-bold border-2 transition-all", 
                                                conjValidation[i] === 'correct' ? 'border-green-500 bg-green-50/5 focus-visible:ring-green-500' : 
                                                conjValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/5 focus-visible:ring-red-500' : 
                                                'border-muted focus-visible:ring-primary'
                                            )} 
                                            placeholder="..."
                                            autoComplete="off" 
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-8 bg-muted/5">
                            <Button 
                                onClick={handleConjCheck} 
                                size="lg" 
                                className="px-20 font-black h-14 text-xl shadow-xl transition-all active:scale-95 group"
                            >
                                Verificar Verbo <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </CardFooter>
                    </Card>
                );
            case 'ex1': return <BallsExercise title="Ejercicio 1: Ser, Estar, Tener, Ir" prompts={ex1Prompts} onComplete={() => handleTopicComplete('ex1')} vocabulary={{ "doctor": "doctor", "tired": "cansado", "book": "libro", "cinema": "cine", "house": "casa", "Mexico": "México", "to study": "estudiar"}} />;
            case 'ex2': return <BallsExercise title="Ejercicio 2: Verbos de cambio de raíz" prompts={ex2Prompts} onComplete={() => handleTopicComplete('ex2')} vocabulary={{ "coffee": "café", "to play": "jugar", "a lot": "mucho", "eight hours": "ocho horas", "help": "ayuda", "door": "puerta", "key": "llave", "late": "tarde" }} />;
            case 'vocab_game': return <Card className="shadow-soft border-2 border-brand-purple bg-card/95"><CardHeader><CardTitle>Juego de Memoria</CardTitle></CardHeader><CardContent><VocabularyMatchingGame data={irregularVerbsVocab.slice(0, 10).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Encuentra las parejas de verbos" /></CardContent></Card>;
            case 'ex3': return <BallsExercise title="Ejercicio 3: Verbos con 'Yo' irregular" prompts={ex3Prompts} onComplete={() => handleTopicComplete('ex3')} vocabulary={{ "homework": "tarea", "table": "mesa", "at eight": "a las ocho", "truth": "verdad", "movie": "película", "answer": "respuesta", "gift": "regalo", "food": "comida", "brother": "hermano", "noise": "ruido" }} />;
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
                                    <div key={i} className="space-y-2 p-3 bg-muted/20 rounded-xl border"><Label className="font-bold">{q.q}</Label><Input value={readingAns[i]} onChange={e => { const na = [...readingAns]; na[i] = e.target.value; setReadingAns(na); setReadingVal(v => { const nv = [...v]; nv[i] = 'unchecked'; return nv as any; }); }} className={cn("h-10", readingVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : readingVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" /></div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/10"><Button onClick={handleCheckReading} size="lg" className="px-16 font-black h-12 shadow-md">Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'final_ex':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tight'>Ejercicio Final: Completar Frases (30)</CardTitle></CardHeader>
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
                        <CardHeader><div className="flex justify-between items-center"><div><CardTitle className='text-primary uppercase'>Traducción de Texto: Rutina Irregular</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el siguiente párrafo al español.</CardDescription></div><Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger><PopoverContent className="w-64"><ScrollArea className="h-48 pr-4"><div className="space-y-2">{Object.entries({ "routine": "rutina", "with him": "con él", "friends": "amigos", "soccer": "fútbol", "to win": "ganar", "player": "jugador", "homework": "tarea", "late": "tarde", "more": "más" }).map(([en, es], i) => (<div key={i} className="flex justify-between text-xs border-b pb-1"><span className="text-muted-foreground">{en}:</span><span className="font-bold text-primary">{es}</span></div>))}</div></ScrollArea></PopoverContent></Popover></div></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-sm">"I am Carlos and this is my routine. I have a dog. I go to the park with him in the morning. I can see my friends there. We play soccer. I always want to win. My friend says that I am a good player. At night, I do my homework and I go to sleep late. I know that I have to sleep more."</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={translationText} onChange={(e) => setTranslationText(e.target.value)} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg leading-relaxed" /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20"><Button onClick={() => handleTopicComplete('translate_text')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Siguiente Misión <ArrowRight className='ml-3 h-8 w-8' /></Button></CardFooter>
                    </Card>
                );
            case 'final': return <BallsExercise title="Final: Frases Negativas" prompts={negativePrompts} onComplete={() => handleTopicComplete('final')} vocabulary={{ "student": "estudiante", "at home": "en casa", "money": "dinero", "party": "fiesta", "to eat": "comer", "to come": "venir", "problem": "problema", "answer": "respuesta", "anything": "nada", "well": "bien", "today": "hoy" }} />;
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
                           <Zap className='h-10 w-10 text-primary' /> Presente Simple Irregulares 🇪🇸
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
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', isSelected && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm')}>
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

export default function PresenteSimpleIrregularesPage() {
    return (<Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}><PresenteSimpleIrregularesContent /></Suspense>);
}