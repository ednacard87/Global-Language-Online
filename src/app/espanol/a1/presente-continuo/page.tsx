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
import { ScrollArea } from '@/components/ui/scroll-area';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { Textarea } from '@/components/ui/textarea';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_a1_pres_cont_v18_final_button_text';
const mainProgressKey = 'progress_a1_es_presente_continuo';

// --- DATA (COMPLETA) ---
const presenteContinuoVerbsVocab = [
    { en: "TO TALK", es: "HABLAR" }, { en: "TO EAT", es: "COMER" }, { en: "TO LIVE", es: "VIVIR" }, { en: "TO WORK", es: "TRABAJAR" }, { en: "TO STUDY", es: "ESTUDIAR" }, { en: "TO RUN", es: "CORRER" }, { en: "TO WRITE", es: "ESCRIBIR" }, { en: "TO SLEEP", es: "DORMIR" }, { en: "TO READ", es: "LEER" }, { en: "TO DO/MAKE", es: "HACER" }, { en: "TO SAY/TELL", es: "DECIR" }, { en: "TO GO", es: "IR" }, { en: "TO SEE", es: "VER" }, { en: "TO HEAR", es: "OIR" }, { en: "TO COME", es: "VENIR" }, { en: "TO ASK FOR", es: "PEDIR" }, { en: "TO THINK", es: "PENSAR" }, { en: "TO PLAY", es: "JUGAR" }, { en: "TO COOK", es: "COCINAR" }, { en: "TO SING", es: "CANTAR" }, { en: "TO DANCE", es: "BAILAR" }, { en: "TO DRINK", es: "BEBER" }, { en: "TO LEARN", es: "APRENDER" }, { en: "TO OPEN", es: "ABRIR" }, { en: "TO CLOSE", es: "CERRAR" }, { en: "TO BRING", es: "TRAER" }, { en: "TO FEEL", es: "SENTIR" }, { en: "TO SERVE", es: "SERVIR" }, { en: "TO FOLLOW", es: "SEGUIR" }, { en: "TO BUILD", es: "CONSTRUIR" }, { en: "TO DRIVE", es: "CONDUCIR" }, { en: "TO TRANSLATE", es: "TRADUCIR" }, { en: "TO LAUGH", es: "REIR" }, { en: "TO SMILE", es: "SONREIR" }, { en: "TO TRAVEL", es: "VIAJAR" }, { en: "TO CLEAN", es: "LIMPIAR" }, { en: "TO PAINT", es: "PINTAR" }, { en: "TO WALK", es: "CAMINAR" }, { en: "TO WAIT", es: "ESPERAR" }, { en: "TO WATCH", es: "MIRAR" }
];
const gerundFormationVerbs = [
    { v: "HABLAR", gerund: "hablando" }, { v: "COMER", gerund: "comiendo" }, { v: "VIVIR", gerund: "viviendo" }, { v: "LEER", gerund: "leyendo" }, { v: "DORMIR", gerund: "durmiendo" }, { v: "PEDIR", gerund: "pidiendo" }, { v: "TRABAJAR", gerund: "trabajando" }, { v: "APRENDER", gerund: "aprendiendo" }, { v: "ESCRIBIR", gerund: "escribiendo" }, { v: "OIR", gerund: "oyendo" }, { v: "REIR", gerund: "riendo" }, { v: "SEGUIR", gerund: "siguiendo" }, { v: "TRAER", gerund: "trayendo" }, { v: "CONSTRUIR", gerund: "construyendo" }, { v: "JUGAR", gerund: "jugando" },
];
const ex1Prompts = [
    { en: "I am talking.", es: ["estoy hablando", "yo estoy hablando"] }, 
    { en: "You are studying.", es: ["estás estudiando", "tú estás estudiando"] }, 
    { en: "He is working.", es: ["está trabajando", "él está trabajando"] }, 
    { en: "We are singing.", es: ["estamos cantando", "nosotros estamos cantando"] }, 
    { en: "They are dancing.", es: ["están bailando", "ellos están bailando"] }, 
    { en: "She is cooking.", es: ["está cocinando", "ella está cocinando"] }, 
    { en: "I am painting.", es: ["estoy pintando", "yo estoy pintando"] }, 
    { en: "You are cleaning.", es: ["estás limpiando", "tú estás limpiando"] }, 
    { en: "We are walking in the park.", es: ["estamos caminando en el parque", "nosotros estamos caminando en el parque"] }, 
    { en: "They are traveling to Spain.", es: ["están viajando a españa", "ellos están viajando a españa"] },
    { en: "You (formal) are waiting for the bus.", es: ["usted está esperando el autobús", "está esperando el autobús"] },
    { en: "She is buying new shoes.", es: ["ella está comprando zapatos nuevos", "está comprando zapatos nuevos"] },
    { en: "We are listening to music.", es: ["nosotros estamos escuchando música", "estamos escuchando música"] },
    { en: "You all are preparing dinner.", es: ["ustedes están preparando la cena", "están preparando la cena"] },
    { en: "They are helping at home.", es: ["ellos están ayudando en casa", "están ayudando en casa"] },
    { en: "I am looking for my keys.", es: ["yo estoy buscando mis llaves", "estoy buscando mis llaves"] },
    { en: "You are paying the bill.", es: ["tú estás pagando la cuenta", "estás pagando la cuenta"] },
    { en: "He is using the computer.", es: ["él está usando la computadora", "está usando la computadora"] },
    { en: "We are visiting the museum.", es: ["nosotros estamos visitando el museo", "estamos visitando el museo"] },
    { en: "They (fem.) are swimming.", es: ["ellas están nadando", "están nadando"] }
];
const ex2Prompts = [
    { en: "I am eating an apple.", es: ["estoy comiendo una manzana", "yo estoy comiendo una manzana"] }, { en: "You are learning Spanish.", es: ["estás aprendiendo español", "tú estás aprendiendo español"] }, { en: "He is living in a big house.", es: ["está viviendo en una casa grande", "él está viviendo en una casa grande"] }, { en: "We are drinking water.", es: ["estamos bebiendo agua", "nosotros estamos bebiendo agua"] }, { en: "They are writing a book.", es: ["están escribiendo un libro", "ellos están escribiendo un libro"] }, { en: "She is running fast.", es: ["está corriendo rápido", "ella está corriendo rápido"] }, { en: "I am opening the window.", es: ["estoy abriendo la ventana", "yo estoy abriendo la ventana"] }, { en: "You are understanding the class.", es: ["estás comprendiendo la clase", "tú estás comprendiendo la clase"] }, { en: "We are selling the car.", es: ["estamos vendiendo el coche", "nosotros estamos vendiendo el coche"] }, { en: "They are suffering a lot.", es: ["están sufriendo mucho", "ellos están sufriendo mucho"] }
];
const ex3Prompts = [
    { en: "I am reading a book.", es: ["estoy leyendo un libro", "yo estoy leyendo un libro"] }, { en: "You are sleeping.", es: ["estás durmiendo", "tú estás durmiendo"] }, { en: "He is asking for help.", es: ["está pidiendo ayuda", "él está pidiendo ayuda"] }, { en: "We are saying the truth.", es: ["estamos diciendo la verdad", "nosotros estamos diciendo la verdad"] }, { en: "They are following me.", es: ["me están siguiendo", "están siguiéndome"] }, { en: "She is serving the dinner.", es: ["está sirviendo la cena", "ella está sirviendo la cena"] }, { en: "I am feeling sick.", es: ["me estoy sintiendo mal", "estoy sintiéndome mal"] }, { en: "You are laughing.", es: ["te estás riendo", "estás riéndote"] }, { en: "They are building a house.", es: ["están construyendo una casa", "ellos están construyendo una casa"] }, { en: "He is bringing the drinks.", es: ["está trayendo las bebidas", "él está trayendo las bebidas"] }
];
const readingData = {
    title: "Un Domingo en Casa",
    content: "Hoy es domingo y toda mi familia está en casa. Yo estoy leyendo un libro interesante en el sofá. Mi mamá está cocinando en la cocina; huele delicioso. Mi papá está trabajando en el jardín. Mis hermanos están jugando videojuegos en su habitación, están gritando mucho. El perro está durmiendo a mis pies. Es un día tranquilo, y estoy sintiéndome muy feliz y relajado.",
    questions: [
        { q: "¿Qué estoy haciendo yo?", a: ["leyendo un libro", "estás leyendo un libro"] }, { q: "¿Qué está haciendo mi mamá?", a: ["cocinando", "está cocinando"] }, { q: "¿Dónde está trabajando mi papá?", a: ["en el jardín"] }, { q: "¿Qué están haciendo mis hermanos?", a: ["jugando videojuegos"] }, { q: "¿Cómo me estoy sintiendo?", a: ["feliz y relajado"] },
    ]
};
const finalExPrompts = [
    { s: "1. Yo _______ (hablar) por teléfono.", a: "estoy hablando" }, { s: "2. Tú _______ (comer) una pizza.", a: "estás comiendo" }, { s: "3. Él _______ (vivir) en Londres.", a: "está viviendo" }, { s: "4. Nosotros _______ (estudiar) mucho.", a: "estamos estudiando" }, { s: "5. Ellos _______ (correr) en el parque.", a: "están corriendo" }, { s: "6. Ella _______ (cantar) muy bien.", a: "está cantando" }, { s: "7. Yo _______ (leer) el periódico.", a: "estoy leyendo" }, { s: "8. Tú _______ (dormir) profundamente.", a: "estás durmiendo" }, { s: "9. Él _______ (escribir) un correo.", a: "está escribiendo" }, { s: "10. Nosotros _______ (aprender) español.", a: "estamos aprendiendo" }, { s: "11. Ellos _______ (jugar) al fútbol.", a: "están jugando" }, { s: "12. Ella _______ (hacer) la cena.", a: "está haciendo" }, { s: "13. Yo _______ (ver) la televisión.", a: "estoy viendo" }, { s: "14. Tú _______ (pedir) un favor.", a: "estás pidiendo" }, { s: "15. Nosotros _______ (viajar) a México.", a: "estamos viajando" },
];
const negativePrompts = [
    { en: "I am not working.", es: ["no estoy trabajando", "yo no estoy trabajando"] }, { en: "You are not eating.", es: ["no estás comiendo", "tú no estás comiendo"] }, { en: "He is not sleeping.", es: ["no está durmiendo", "él no está durmiendo"] }, { en: "We are not studying.", es: ["no estamos estudiando", "nosotros no estamos estudiando"] }, { en: "They are not playing.", es: ["no están jugando", "ellos no están jugando"] }, { en: "She is not cooking.", es: ["no está cocinando", "ella no está cocinando"] }, { en: "I am not reading.", es: ["no estoy leyendo", "yo no estoy leyendo"] }, { en: "You are not running.", es: ["no estás corriendo", "tú no estás corriendo"] }, { en: "He is not writing.", es: ["no está escribiendo", "él no está escribiendo"] }, { en: "We are not singing.", es: ["no estamos cantando", "nosotros no estamos cantando"] },
];

// --- NUEVO COMPONENTE DE EJERCICIO INDIVIDUAL ---
const SingleStepExercise = ({ title, prompts, onComplete }: { title: string, prompts: { en: string, es: string[] }[], onComplete: () => void }) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [statuses, setStatuses] = useState<('correct' | 'incorrect' | 'unchecked')[]>(() => Array(prompts.length).fill('unchecked'));

    useEffect(() => {
        setCurrentIndex(0);
        setCurrentAnswer('');
        setStatuses(Array(prompts.length).fill('unchecked'));
    }, [prompts]);

    useEffect(() => {
        // Reset answer when moving to a new prompt that is not yet correct
        if (statuses[currentIndex] !== 'correct') {
             setCurrentAnswer('');
        }
    }, [currentIndex, statuses]);

    const handleCheck = () => {
        const prompt = prompts[currentIndex];
        if (!prompt) return;

        const userAnswer = currentAnswer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const isCorrect = prompt.es.some(correctAnswer =>
            correctAnswer.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userAnswer
        );

        const newStatuses = [...statuses];
        newStatuses[currentIndex] = isCorrect ? 'correct' : 'incorrect';
        setStatuses(newStatuses);

        if (isCorrect) {
            toast({ title: "¡Correcto!" });
            // Automatically move to the next question if correct
            if (currentIndex < prompts.length - 1) {
                 setTimeout(() => setCurrentIndex(i => i + 1), 800);
            }
        } else {
            toast({ variant: 'destructive', title: "Incorrecto, intenta de nuevo." });
        }
    };

    const goToNext = () => {
        if (currentIndex < prompts.length - 1) {
            setCurrentIndex(i => i + 1);
        } else {
            checkCompletion();
        }
    };
    
    const checkCompletion = () => {
         if (statuses.every(s => s === 'correct')) {
             toast({ title: "¡Felicidades!", description: "Has completado el ejercicio.", className: "bg-green-500 text-white" });
             onComplete();
         } else {
             toast({ variant: 'destructive', title: "Aún hay errores", description: "Completa todas las frases correctamente para finalizar." });
             const firstIncorrect = statuses.findIndex(s => s !== 'correct');
             if (firstIncorrect !== -1) {
                 setCurrentIndex(firstIncorrect);
             }
         }
    };

    const isCurrentCorrect = statuses[currentIndex] === 'correct';
    const allDone = useMemo(() => statuses.every(s => s === 'correct'), [statuses]);

    return (
         <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <CardTitle className="text-primary uppercase tracking-tighter">{title}</CardTitle>
                 <CardDescription className="font-bold text-foreground mt-1">Frase {currentIndex + 1} de {prompts.length}</CardDescription>
                <div className="flex gap-1.5 justify-center flex-wrap pt-4">
                    {prompts.map((_, i) => (
                        <div
                            key={i}
                            onClick={() => setCurrentIndex(i)}
                            className={cn(
                                "h-3 flex-1 rounded-full cursor-pointer transition-all",
                                "min-w-[20px]",
                                currentIndex === i && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                                statuses[i] === 'correct' ? "bg-green-500" : 
                                statuses[i] === 'incorrect' ? "bg-red-500" : "bg-muted"
                            )}
                        />
                    ))}
                </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6 pt-6 text-center">
                 <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Traduce al español</p>
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-2xl uppercase tracking-tighter text-foreground min-h-[8rem] flex items-center justify-center w-full">
                    {prompts[currentIndex]?.en}
                </div>
                <Input
                    value={currentAnswer}
                    onChange={e => setCurrentAnswer(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { isCurrentCorrect ? goToNext() : handleCheck(); } }}
                    className={cn(
                        "h-12 text-lg text-foreground text-center max-w-md border-2",
                        isCurrentCorrect ? 'border-green-500' : 
                        statuses[currentIndex] === 'incorrect' ? 'border-red-500' : 'border-input'
                    )}
                    placeholder="Escribe en español..."
                    autoComplete="off"
                    disabled={isCurrentCorrect}
                />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6 bg-muted/10">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    {!isCurrentCorrect && (
                         <Button onClick={handleCheck} variant="secondary">
                             Verificar
                         </Button>
                    )}
                    {allDone ? (
                         <Button onClick={onComplete} className="font-bold text-white bg-green-600 hover:bg-green-700 animate-pulse">
                             Completar Ejercicio <Trophy className='ml-2 h-4 w-4'/>
                         </Button>
                    ) : (
                        <Button onClick={goToNext} disabled={!isCurrentCorrect}>
                            Siguiente <ArrowRight className='ml-2 h-4 w-4'/>
                        </Button>
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

function PresenteContinuoContent() {
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

    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(presenteContinuoVerbsVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(presenteContinuoVerbsVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);
    const [gerundIdx, setGerundIdx] = useState(0);
    const [gerundAnswer, setGerundAnswer] = useState('');
    const [gerundValidation, setGerundValidation] = useState('unchecked');
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
        { key: 'gerund_formation', name: '3. Formación de Gerundio', icon: Pencil, status: 'locked' },
        { key: 'ex1', name: '4. Ejercicio 1 (-ar)', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: '5. Ejercicio 2 (-er, -ir)', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'ex3', name: '7. Ejercicio 3 (Irregulares)', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: '8. Lectura', icon: BookText, status: 'locked' },
        { key: 'final_ex', name: '9. Ejercicio Final', icon: Trophy, status: 'locked' },
        { key: 'translate_text', name: '10. Traducir Texto', icon: MessageSquare, status: 'locked' },
        { key: 'final', name: '11. Final (Negativo)', icon: CheckCircle, status: 'locked' },
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
        setTimeout(() => setIsInitialLoading(false), 200);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete, targetStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / (learningPath.length || 1)) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || targetStudentId) return;
        const s: Record<string, any> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => { s[item.key] = item.status; });
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, isInitialLoading, targetStudentId]);

    const handleTopicComplete = (completedKey: string) => setTopicToComplete(completedKey);

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
        if (topicKey === 'grammar' && learningPath.find(t => t.key === 'grammar')?.status !== 'completed') {
            handleTopicComplete(topicKey); 
        }
    };

    const handleVocabCheck = () => {
        let okCount = 0;
        const nv = presenteContinuoVerbsVocab.map((item, idx) => {
            const isCorrect = item.es.toLowerCase() === (vocabAnswers[idx] || '').trim().toLowerCase();
            if (isCorrect) okCount++;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv as any);
        if (okCount >= 10) { setCanAdvanceVocab(true); toast({ title: "¡Buen avance!" }); }
        else toast({ variant: 'destructive', title: "Necesitas 10 aciertos para avanzar." });
    };
    
    const handleGerundCheck = () => {
        const verb = gerundFormationVerbs[gerundIdx];
        const isCorrect = gerundAnswer.trim().toLowerCase() === verb.gerund;
        setGerundValidation(isCorrect ? 'correct' : 'incorrect');
        if (isCorrect) {
            toast({ title: "¡Correcto!" });
            if (gerundIdx < gerundFormationVerbs.length - 1) {
                setTimeout(() => { setGerundIdx(prev => prev + 1); setGerundAnswer(''); setGerundValidation('unchecked'); }, 1000);
            } else { handleTopicComplete('gerund_formation'); }
        } else { toast({ variant: 'destructive', title: "Incorrecto, ¡intenta de nuevo!" }); }
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
        if (isInitialLoading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

        switch (selectedTopic) {
            case 'vocabulary': return <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left"><CardHeader className='bg-primary/5 border-b'><CardTitle className="text-primary uppercase tracking-tighter">Vocabulario: Verbos (40)</CardTitle><CardDescription className='font-bold text-foreground'>Escribe el infinitivo en español.</CardDescription></CardHeader><CardContent className="pt-6"><ScrollArea className="h-[450px] pr-4"><div className="grid grid-cols-2 gap-4">{presenteContinuoVerbsVocab.map((v, i) => (<Fragment key={i}><div className="flex items-center font-bold py-1 text-sm">{v.en}</div><Input value={vocabAnswers[i]} onChange={e => { const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); setVocabValidation(vv => { const nv = [...vv]; nv[i] = 'unchecked'; return nv as any; }); setCanAdvanceVocab(false); }} className={cn("h-10 uppercase", vocabValidation[i] === 'correct' ? 'border-green-500' : vocabValidation[i] === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></Fragment>))}</div></ScrollArea></CardContent><CardFooter className="flex justify-between border-t pt-6 bg-muted/20"><Button onClick={handleVocabCheck} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar <ArrowRight className='ml-2'/></Button></CardFooter></Card>;
            case 'grammar': return <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-foreground text-left overflow-hidden"><CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Presente Continuo</CardTitle></CardHeader><CardContent className="space-y-8 px-0"><div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm"><h3 className="text-xl font-black text-primary uppercase mb-4">La Fórmula: ESTAR + Gerundio</h3><p className="mb-4 text-muted-foreground">El presente continuo se usa para describir acciones que están sucediendo en este preciso momento. La fórmula es simple: el verbo <span className='font-bold text-primary'>ESTAR</span> conjugado + el <span className='font-bold text-primary'>gerundio</span>.</p><p className='font-bold text-center text-2xl p-4 bg-primary/10 rounded-lg text-primary tracking-wider'>Yo <span className="text-blue-500">estoy</span> <span className="text-red-500">hablando</span></p></div><div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm"><h3 className="text-xl font-black text-primary uppercase mb-4">1. Conjugación de ESTAR</h3><ul className="list-disc pl-5 space-y-2 text-lg"><li>Yo: <span className="font-bold">estoy</span></li><li>Tú: <span className="font-bold">estás</span></li><li>Él/Ella/Usted: <span className="font-bold">está</span></li><li>Nosotros/as: <span className="font-bold">estamos</span></li><li>Ellos/Ellas/Ustedes: <span className="font-bold">están</span></li></ul></div><div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm"><h3 className="text-xl font-black text-primary uppercase mb-4">2. Formación del Gerundio Regular</h3><ul className="list-disc pl-5 space-y-2 text-lg"><li>Verbos -AR (Hablar) → <span className="font-bold">hablando</span></li><li>Verbos -ER (Comer) → <span className="font-bold">comiendo</span></li><li>Verbos -IR (Vivir) → <span className="font-bold">viviendo</span></li></ul></div><div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm"><h3 className="text-xl font-black text-primary uppercase mb-4">3. Gerundios Irregulares Comunes</h3><ul className="list-disc pl-5 space-y-2 text-lg"><li>Cambio E → I: Pedir → <span className="font-bold">pidiendo</span></li><li>Cambio O → U: Dormir → <span className="font-bold">durmiendo</span></li><li>Terminación -YENDO: Leer → <span className="font-bold">leyendo</span></li><li>Terminación -YENDO: Oír → <span className="font-bold">oyendo</span></li></ul></div></CardContent><CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">Comprendido</Button></CardFooter></Card>;
            case 'gerund_formation': const curGerundVerb = gerundFormationVerbs[gerundIdx]; return <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden"><CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tighter'>Misión: Formar el Gerundio</CardTitle><CardDescription>Escribe el gerundio del verbo ({gerundIdx + 1}/{gerundFormationVerbs.length})</CardDescription></CardHeader><CardContent className="space-y-8 pt-8 flex flex-col items-center"><div className="p-8 bg-gradient-to-br from-primary/5 to-brand-purple/5 rounded-[2.5rem] border-2 border-dashed border-primary/20"><span className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Infinitivo</span><h3 className="text-5xl md:text-6xl font-black text-primary uppercase tracking-tighter drop-shadow-sm">{curGerundVerb.v}</h3></div><Input value={gerundAnswer} onChange={e => { setGerundAnswer(e.target.value); setGerundValidation('unchecked'); }} onKeyDown={e => e.key === 'Enter' && handleGerundCheck()} className={cn("h-14 text-2xl font-bold text-center max-w-sm border-2", gerundValidation === 'correct' ? 'border-green-500' : gerundValidation === 'incorrect' ? 'border-red-500' : '')} placeholder="Escribe el gerundio..." autoComplete="off" /></CardContent><CardFooter className="justify-center border-t p-8 bg-muted/5"><Button onClick={handleGerundCheck} size="lg" className="px-20 font-black h-14 text-xl shadow-xl">Verificar <ArrowRight className="ml-2 h-5 w-5" /></Button></CardFooter></Card>;
            case 'ex1': return <SingleStepExercise title="Ejercicio 1: Verbos -AR" prompts={ex1Prompts} onComplete={() => handleTopicComplete('ex1')} />;
            case 'ex2': return <SingleStepExercise title="Ejercicio 2: Verbos -ER/-IR" prompts={ex2Prompts} onComplete={() => handleTopicComplete('ex2')} />;
            case 'vocab_game': return <Card className="shadow-soft border-2 border-brand-purple bg-card/95"><CardHeader><CardTitle>Juego de Memoria</CardTitle></CardHeader><CardContent><VocabularyMatchingGame data={presenteContinuoVerbsVocab.slice(0, 10).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Encuentra las parejas de verbos" /></CardContent></Card>;
            case 'ex3': return <SingleStepExercise title="Ejercicio 3: Gerundios Irregulares" prompts={ex3Prompts} onComplete={() => handleTopicComplete('ex3')} />;
            case 'reading': return <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden"><CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tight'>{readingData.title}</CardTitle></CardHeader><CardContent className="space-y-6 pt-6"><div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-inner">{readingData.content}</div><Separator /><div className="space-y-4"><h3 className='font-black text-primary uppercase text-sm'>Preguntas de Comprensión:</h3>{readingData.questions.map((q, i) => (<div key={i} className="space-y-2 p-3 bg-muted/20 rounded-xl border"><Label className="font-bold">{q.q}</Label><Input value={readingAns[i]} onChange={e => { const na = [...readingAns]; na[i] = e.target.value; setReadingAns(na); setReadingVal(v => { const nv = [...v]; nv[i] = 'unchecked'; return nv as any; }); }} className={cn("h-10", readingVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : readingVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" /></div>))}</div></CardContent><CardFooter className="justify-center border-t p-6 bg-muted/10"><Button onClick={handleCheckReading} size="lg" className="px-16 font-black h-12 shadow-md">Verificar Lectura</Button></CardFooter></Card>;
            case 'final_ex': return <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden"><CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tight'>Ejercicio Final: Completar Frases (15)</CardTitle></CardHeader><CardContent className="p-0"><ScrollArea className="h-[450px] p-6"><div className="space-y-4">{finalExPrompts.map((q, i) => (<div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm"><p className="font-bold text-lg">{q.s}</p><Input value={finalExAns[i]} onChange={e => { const na = [...finalExAns]; na[i] = e.target.value; setFinalExAns(na); setFinalExVal(v => { const nv = [...v]; nv[i] = 'unchecked'; return nv as any; }); }} className={cn("h-10 max-w-sm text-lg", finalExVal[i] === 'correct' ? 'border-green-500' : finalExVal[i] === 'incorrect' ? 'border-red-500' : '')} placeholder="Respuesta..." autoComplete="off" /></div>))}</div></ScrollArea></CardContent><CardFooter className="justify-center border-t p-6 bg-muted/20"><Button onClick={handleCheckFinalEx} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">Verificar Todo</Button></CardFooter></Card>;
            case 'translate_text': return <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left"><CardHeader><div><CardTitle className='text-primary uppercase'>Traducción de Texto</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el siguiente párrafo al español.</CardDescription></div></CardHeader><CardContent className="space-y-6 pt-6"><div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-sm">"Right now, I am sitting in a café. I am drinking a coffee and my friend is reading a book. We are talking about our plans. Outside, many people are walking. A musician is playing the guitar. It is a beautiful day and we are feeling very happy."</div><Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={translationText} onChange={(e) => setTranslationText(e.target.value)} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg leading-relaxed" /></div></CardContent><CardFooter className="justify-center border-t pt-6 bg-muted/20"><Button onClick={() => handleTopicComplete('translate_text')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Misión Final <ArrowRight className='ml-3 h-8 w-8' /></Button></CardFooter></Card>;
            case 'final': return <SingleStepExercise title="Ejercicio Final: Frases Negativas" prompts={negativePrompts} onComplete={() => handleTopicComplete('final')} />;
            default: return <div className="text-center p-8">Selecciona una misión para comenzar.</div>;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {targetStudentId && isAdmin && (
                        <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md"><div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400"><Star className="h-6 w-6 fill-current animate-pulse" /><p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión: {studentProfile?.name || '...'}</p></div><Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10"><Link href="/admin">Cerrar</Link></Button></div>
                    )}
                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/a1" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver al Curso A1</Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3"><Activity className='h-10 w-10 text-primary' /> Presente Continuo 🇪🇸</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm"><CardHeader className="pb-4 border-b bg-muted/30"><CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Ruta de Misión</CardTitle></CardHeader><CardContent className="p-4"><nav><ul className="space-y-1">{learningPath.map((item) => { const isLocked = item.status === 'locked' && !isAdmin; const isSelected = selectedTopic === item.key; const Icon = item.icon; return (<li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', isSelected && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm')}><div className="flex items-center gap-3">{item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}<span className="truncate max-w-[150px]">{item.name}</span></div>{isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}</li>);})}</ul></nav><div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 font-black uppercase tracking-widest text-muted-foreground"><span>Progreso Total</span><span className="text-primary">{progressValue}%</span></div><Progress value={progressValue} className="h-2 rounded-full" /></div></CardContent></Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function PresenteContinuoPage() {
    return (<Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}><PresenteContinuoContent /></Suspense>);
}