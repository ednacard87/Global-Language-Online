
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense, Fragment } from 'react';
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
    ListChecks,
    Info
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { Textarea } from '@/components/ui/textarea';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_a1_verbos_preferencia_v26_independent_fixes';
const mainProgressKey = 'progress_a1_es_verbos_preferencia';

const ICONS_CONFIG: Record<string, React.ElementType> = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---
const preferenceVocab = [
    { en: "To like", es: "GUSTAR" },
    { en: "To love (things)", es: "ENCANTAR" },
    { en: "To be interested in", es: "INTERESAR" },
    { en: "To bother", es: "MOLESTAR" },
    { en: "To hurt", es: "DOLER (o:ue)" },
    { en: "To matter", es: "IMPORTAR" },
    { en: "To seem", es: "PARECER" },
    { en: "To bore", es: "ABURRIR" },
    { en: "To Enjoy", es: "DISFRUTAR" },
    { en: "Soccer", es: "El fútbol" },
    { en: "Music", es: "La música" },
    { en: "Movies", es: "Las películas" },
    { en: "Books", es: "Los libros" },
    { en: "To travel", es: "Viajar" },
    { en: "To cook", es: "Cocinar" },
    { en: "The head", es: "La cabeza" },
    { en: "The noise", es: "El ruido" },
];

const ex1Prompts = [
    { en: "I like pizza.", es: ["me gusta la pizza", "a mi me gusta la pizza"] },
    { en: "She likes music.", es: ["le gusta la música", "a ella le gusta la música"] },
    { en: "We like movies.", es: ["nos gustan las películas", "a nosotros nos gustan las películas"] },
    { en: "They like sports.", es: ["a ellos les gustan los deportes", "les gustan los deportes"] },
    { en: "You like to read.", es: ["a ti te gusta leer", "te gusta leer"] },
    { en: "We like science fiction movies.", es: ["a nosotros nos gustan las películas de ciencia ficcion", "nos gustan las películas de ciencia ficción"] },
    { en: "She likes coffee in the morning.", es: ["a ella le gusta el café por la mañana", "le gusta el café por la mañana"] },
    { en: "You all like sunny days.", es: ["a ustedes les gustan los días soleados", "les gustan los días soleados"] },
    { en: "I don't like spiders.", es: ["no me gustan las arañas" , "a mi no me gustan las arañas"] },
    { en: "My brother likes to listen to rock music.", es: ["a mi hermano le gusta escuchar música rock"] },
    { en: "My parents like documentaries.", es: ["a mis padres les gustan los documentales"] },
    { en: "Do you like chocolate ice cream?", es: ["te gusta el helado de chocolate?", "a ti te gusta el helado de chocolate?"] },
    { en: "We like strawberries.", es: ["nos gustan las fresas" , "a nosotros nos gustan las fresas"] },
    { en: "Maria likes to walk on the beach.", es: ["a maría le gusta caminar por la playa"] },
    { en: "I like your shoes a lot.", es: ["me gustan mucho tus zapatos" , "a mi me gustan mucho tus zapatos"] },
    { en: "The children like to play outside.", es: ["a los niños les gusta jugar afuera"] },
    { en: "You like mathematics.", es: ["a ti te gustan las matemáticas", "te gustan las matematicas"] },
    { en: "My boss likes order.", es: ["a mi jefe le gusta el orden"] },
    { en: "They (fem.) like black cats.", es: ["a ellas les gustan los gatos negros"] },
    { en: "I like the idea.", es: ["me gusta la idea" , "a mi me gusta la idea"] },
    { en: "We like live concerts.", es: ["nos gustan los conciertos en vivo" , "a nosotros nos gustan los conciertos en vivo"] },
    { en: "He likes spicy food.", es: ["a él le gusta la comida picante", "le gusta la comida picante"] },
];

const ex2Prompts = [
    { q: "A Juan ______ gusta el café.", a: "le" },
    { q: "A mis amigos y a mí ______ encanta viajar.", a: "nos" },
    { q: "A ti ______ interesa el arte.", a: "te" },
    { q: "A ellos ______ molesta el ruido.", a: "les" },
    { q: "A mí ______ duele la cabeza.", a: "me" },
    { q: "¿A ti ______ molesta el ruido?", a: "te" },
    { q: "A mí ______ duelen los pies.", a: "me" },
    { q: "A ustedes ______ parece una buena idea.", a: "les" },
    { q: "A nosotros no ______ importa la hora.", a: "nos" },
    { q: "A ella ______ aburren las matematicas.", a: "le" },
    { q: "A ellos ______ encantan los perros.", a: "les" },
    { q: "¿A usted ______ interesa la historia?", a: "le" },
    { q: "A mí ______ gusta mucho este libro.", a: "me" },
    { q: "A ti y a tu hermano ______ queda bien esa ropa.", a: "les" },
    { q: "A nosotros ______ duelen las manos.", a: "nos" },
    { q: "A los turistas ______ interesa la cultura local.", a: "les" },
    { q: "(A mí) ______ parece increíble.", a: "me" },
    { q: "¿(A ti) ______ apetece un helado?", a: "te" },
    { q: "A mi madre ______ preocupa la situacion.", a: "le" },
    { q: "A mis abuelos ______ gusta recibir visitas.", a: "les" },
    { q: "(A nosotros) ______ encanta la playa.", a: "nos" },
    { q: "A ti ______ duele la cabeza, ¿verdad?", a: "te" },
    { q: "(A mí) no ______ gustan las despedidas.", a: "me" },
];

const ex3Prompts = [
    { en: "I love horror movies.", es: ["me encantan las películas de terror", "a mi me encantan las películas de terror"] },
    { en: "She is not interested in politics.", es: ["a ella no le interesa la política", "no le interesa la política"] },
    { en: "We enjoy traveling.", es: ["disfrutamos viajar", "nosotros disfrutamos viajar"] },
    { en: "It seems easy to me.", es: ["me parece fácil", "a mi me parece fácil"] },
    { en: "The noise bothers them.", es: ["les molesta el ruido", "a ellos les molesta el ruido"] },
    { en: "Our feet hurt after walking.", es: ["a nosotros nos duelen los pies después de caminar", "nos duelen los pies después de caminar"] },
    { en: "Loud noise bothers you.", es: ["a ti te molesta el ruido fuerte", "te molesta el ruido fuerte"] },
    { en: "Video games bore them.", es: ["a ellos les aburren los videojuegos", "les aburren los videojuegos"] },
    { en: "Soccer is important to my father.", es: ["a mi padre le importa el fútbol"] },
    { en: "These pants fit me well.", es: ["a mí me quedan bien estos pantalones", "me quedan bien estos pantalones"] },
    { en: "You all are interested in exotic food.", es: ["a ustedes les interesa la comida exótica"] },
    { en: "We love cold mornings.", es: ["a nosotros nos encantan las mañanas frías"] },
    { en: "Thunder bothers my dog.", es: ["a mi perro le molestan los truenos"] },
    { en: "My back hurts.", es: ["me duele la espalda" , "a mi me duele la espalda"] },
    { en: "Mystery novels interest us.", es: ["nos interesan las novelas de misterio" , "a nosotros nos interesan las novelas de misterio"] },
    { en: "It seems strange to you that he doesn't call.", es: ["te parece raro que no llame", "a ti te parece raro que no llame"] },
    { en: "Lies bother them.", es: ["a ellos les molestan las mentiras", "les molestan las mentiras"] },
    { en: "I only have five euros left.", es: ["me quedan solo cinco euros" , "yo solo tengo cinco euros"] },
    { en: "His family is very important to him.", es: ["a el le importa mucho su familia"] },
    { en: "Math bores us.", es: ["nos aburren las matemáticas" , "a nosotros nos aburren las matematicas"] },
    { en: "I love rainy days.", es: ["me encantan los días de lluvia" , "a mi me encantan los dias de lluvia"] },
    { en: "Your teeth hurt.", es: ["te duelen las muelas", "a ti te duelen las muelas"] },
    { en: "she enjoys to drive.", es: ["ella disfruta manejar"] },
];

const readingData = {
    title: "Cosas que nos gustan",
    content: "En mi familia, a todos nos gustan cosas diferentes. A mí me encanta leer libros de aventuras. A mi hermana le interesan mucho los animales; ella tiene dos perros y un gato. A mis padres les gusta escuchar música clásica. Los fines de semana, a nosotros nos gusta ver películas juntos, pero a mi hermana le aburren las películas de acción. A ella le gustan más las comedias. A mi abuelo le duele un poco la espalda, así que no le gusta caminar mucho, pero le encanta jugar ajedrez. A todos nos encanta la pizza que hace mi mamá los viernes. ¡Es la mejor!",
    questions: [
        { id: 'q1', q: "¿Qué tipo de libros me encantan?", a: ["libros de aventuras"] },
        { id: 'q2', q: "¿Qué le interesa a mi hermana?", a: ["los animales"] },
        { id: 'q3', q: "¿Qué tipo de películas le aburren a la hermana?", a: ["las de acción", "las películas de acción"] },
        { id: 'q4', q: "¿Qué le duele al abuelo?", a: ["la espalda"] },
        { id: 'q5', q: "¿Qué le encanta a toda la familia los viernes?", a: ["la pizza", "la pizza que hace mi mamá"] }
    ]
};

const mixedExPrompts = [
    { en: "I like the blue car but he likes the black one.", es: ["me gusta el carro azul pero a el le gusta el negro", "me gusta el carro azul pero a el le gusta el carro negro"] },
    { en: "They love to dance.", es: ["a ellos les encanta bailar", "les encanta bailar"] },
    { en: "My head hurts.", es: ["me duele la cabeza", "a mi me duele la cabeza"] },
    { en: "History interests us.", es: ["a nosotros nos interesa la historia", "nos interesa la historia"] },
    { en: "The noise bothers her.", es: ["a ella le molesta el ruido", "le molesta el ruido"] },
    { en: "Do you like fruits?", es: ["a ti te gustan las frutas?", "te gustan las frutas?"] },
    { en: "We love dogs.", es: ["a nosotros nos encantan los perros", "nos encantan los perros"] },
    { en: "His feet hurt.", es: ["a él le duelen los pies", "le duelen los pies"] },
    { en: "The idea seems good to me.", es: ["a mí me parece buena la idea", "me parece buena la idea"] },
    { en: "The news doesn't matter to them.", es: ["a ellos no les importa la noticia", "no les importa la noticia"] },
    { en: "I like to travel.", es: ["me gusta viajar"] },
    { en: "You love chocolate.", es: ["a ti te encanta el chocolate", "te encanta el chocolate"] },
    { en: "His stomach hurts.", es: ["a él le duelo el estomago", "le duele el estómago"] },
    { en: "Are you bothered by the smoke?", es: ["a ti te molesta el humo?", "te molesta el humo?"] },
    { en: "We are interested in art.", es: ["a nosotros nos interesa el arte", "nos interesa el arte"] },
    { en: "They like horror movies.", es: ["a ellos les gustan las películas de terror", "les gustan las películas de terror"] },
    { en: "My eyes hurt.", es: ["me duelen los ojos"] },
    { en: "She loves sunny days.", es: ["a ella le encantan los días soleados", "le encantan los dias soleados"] },
    { en: "It seems strange to us.", es: ["a nosotros nos parece raro", "nos parece raro"] },
    { en: "I have two euros left.", es: ["me quedan dos euros"] },
];

// --- HELPERS ---

const BlockValidationExercise = ({ title, prompts, onComplete, vocabulary, isAdmin, isSupervisionMode }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [validationStatus, setValidationStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    // IMPORTANTE: Resetear estados al cambiar de ejercicio (props)
    useEffect(() => {
        setCurrentIndex(0);
        setUserAnswers({});
        setValidationStatus({});
    }, [title]);

    const handleCheck = () => {
        const newVal: Record<number, 'correct' | 'incorrect'> = {};
        let allOk = true;
        prompts.forEach((p: any, i: number) => {
            const user = (userAnswers[i] || '').trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
            const rawAnswers = p.es || p.answer || [];
            const corrects = (Array.isArray(rawAnswers) ? rawAnswers : [rawAnswers])
                .map((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' '));
            const isOk = corrects.includes(user);
            newVal[i] = isOk ? 'correct' : 'incorrect';
            if (!isOk) allOk = false;
        });
        setValidationStatus(newVal);
        if (allOk) toast({ title: "¡Excelente!", description: "Todo está correcto." });
        else toast({ variant: 'destructive', title: "Hay errores", description: "Revisa los contornos rojos." });
    };

    const isFinished = Object.values(validationStatus).length === prompts.length && Object.values(validationStatus).every(v => v === 'correct');

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="text-left">
                        <CardTitle>{title}</CardTitle>
                        <CardDescription className='font-bold text-foreground mt-1'>Traduce la frase correctamente.</CardDescription>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", validationStatus[i] === 'correct' ? "bg-green-500 text-white border-green-500" : validationStatus[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
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
                                        {Object.entries(vocabulary).map(([en, es]: any) => (<Fragment key={en}><span className="text-muted-foreground capitalize font-bold">{en}:</span><span className="font-semibold text-right text-primary">{(es || '').toUpperCase()}</span></Fragment>))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">
                    {prompts[currentIndex]?.en}
                </div>
                <Input value={userAnswers[currentIndex] || ''} onChange={e => { if (isSupervisionMode) return; setUserAnswers({ ...userAnswers, [currentIndex]: e.target.value }); setValidationStatus({ ...validationStatus, [currentIndex]: 'unchecked' }); }} className={cn("h-12 text-lg text-foreground", validationStatus[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/10' : validationStatus[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="Respuesta..." autoComplete="off" readOnly={isSupervisionMode} />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    {currentIndex === prompts.length - 1 && !isFinished && !isSupervisionMode && (
                        <Button onClick={handleCheck} variant="secondary">Verificar</Button>
                    )}
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={!isFinished && !isAdmin} className="text-white font-bold bg-primary hover:bg-primary/90">
                        {currentIndex === prompts.length - 1 ? 'Continuar' : 'Siguiente'}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const FillInTheBlankExercise = ({ title, prompts, onComplete, instruction, isSupervisionMode, isAdmin }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setAnswer(''); }, [currentIndex]);

    const handleCheck = () => {
        if (isSupervisionMode) return;
        const isOk = answer.trim().toLowerCase() === prompts[currentIndex].a.toLowerCase();
        setStatus(prev => ({ ...prev, [currentIndex]: isOk ? 'correct' : 'incorrect' }));
        if (isOk) toast({ title: "¡Correcto!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
            <CardHeader>
                <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription className='font-bold text-foreground mt-1'>{instruction}</CardDescription>
                    <div className="flex gap-2 justify-start flex-wrap pt-4">
                        {prompts.map((_: any, i: number) => (
                            <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-8 py-10">
                <div className="text-2xl font-black text-center leading-relaxed text-foreground">
                    {prompts[currentIndex].q.split('______').map((part: string, i: number) => (
                        <Fragment key={i}>
                            {part}
                            {i < 1 && <span className={cn("border-b-4 border-dashed px-4 mx-2 text-primary", status[currentIndex] === 'correct' ? "border-primary" : "text-muted-foreground")}>{status[currentIndex] === 'correct' ? prompts[currentIndex].a : '...'}</span>}
                        </Fragment>
                    ))}
                </div>
                <Input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-12 text-lg text-center max-w-sm mx-auto", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/10' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="Escribe aquí..." autoComplete="off" readOnly={isSupervisionMode} />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    {!isSupervisionMode && <Button onClick={handleCheck} variant="secondary">Verificar</Button>}
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={status[currentIndex] !== 'correct' && !isAdmin} className="text-white font-bold">Siguiente</Button>
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

function VerbosPreferenciaContent() {
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
    const hasInitialized = useRef(false);

    // States for content
    const [vocabAns, setVocabAns] = useState<string[]>(Array(preferenceVocab.length).fill(''));
    const [vocabVal, setVocabVal] = useState<any[]>(Array(preferenceVocab.length).fill('unchecked'));
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
        { key: 'ex2', name: '4. Ejercicio 2', icon: ListChecks, status: 'locked' },
        { key: 'vocab_game', name: '5. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'reading', name: '6. Lectura', icon: BookText, status: 'locked' },
        { key: 'ex3', name: '7. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'mixed', name: '8. Ejercicio Mixto', icon: Trophy, status: 'locked' },
        { key: 'translate', name: '9. Traducir Texto', icon: Pencil, status: 'locked' },
    ], []);

    const handleTopicComplete = useCallback((completedKey: string) => { 
        setTopicToComplete(completedKey); 
    }, []);

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
            if (savedData.vocabAns) setVocabAns(savedData.vocabAns);
            if (savedData.readAns) setReadAns(savedData.readAns);
            if (savedData.transText) setTransText(savedData.transText);
            if (savedData.isFinished) setIsFinished(savedData.isFinished);
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
        hasInitialized.current = true;
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete, targetStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || targetStudentId || !hasInitialized.current || !user) return;
        const saveTimer = setTimeout(() => {
            const s: any = { lastSelectedTopic: selectedTopic, vocabAns, readAns, transText, isFinished };
            learningPath.forEach(t => s[t.key] = t.status);
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        }, 1500);
        return () => clearTimeout(saveTimer);
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, targetStudentId, initialLoadComplete, vocabAns, readAns, transText, isFinished, user]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(curr => {
            let next: string | null = null; const np = [...curr];
            const i = np.findIndex(t => t.key === topicToComplete);
            if (i !== -1 && np[i].status !== 'completed') {
                np[i].status = 'completed';
                if (i + 1 < np.length && np[i + 1].status === 'locked') { np[i + 1].status = 'active'; next = np[i + 1].key; }
            }
            if (next) { const n = next; setTimeout(() => { toast({ title: "¡Misión completada!" }); setSelectedTopic(n); }, 0); }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const t = learningPath.find(it => it.key === topicKey);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (['grammar'].includes(topicKey)) handleTopicComplete(topicKey);
    };

    const handleCheckVocab = () => {
        const nv = preferenceVocab.map((v, i) => {
            const res = v.es.toLowerCase() === (vocabAns[i] || '').trim().toLowerCase();
            return res ? 'correct' : 'incorrect';
        });
        setVocabVal(nv); 
        if (nv.every(v => v === 'correct')) toast({ title: "¡Vocabulario correcto!" }); else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const handleCheckReading = () => {
        let allOk = true; const nv: any = {};
        readingData.questions.forEach(q => {
            const userAns = (readAns[q.id] || '').trim().toLowerCase();
            const isOk = q.a.some(a => userAns.includes(a.toLowerCase()));
            nv[q.id] = isOk ? 'correct' : 'incorrect'; if (!isOk) allOk = false;
        });
        setReadVal(nv); 
        if (allOk) toast({ title: "¡Lectura superada!" }); 
        else toast({ variant: 'destructive', title: "Revisa las respuestas" });
    };

    const isReadComplete = Object.values(readVal).length === readingData.questions.length && Object.values(readVal).every(v => v === 'correct');

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                const vocabAllOk = vocabVal.length > 0 && vocabVal.every((v: any) => v === 'correct');
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>Vocabulario: Verbos de Preferencia</CardTitle></CardHeader>
                        <CardContent><ScrollArea className="h-[450px] pr-4"><div className="grid grid-cols-2 gap-4 text-foreground">
                            <div className="font-black text-primary border-b pb-2 uppercase text-xs">English</div><div className="font-black text-primary border-b pb-2 uppercase text-xs">Español</div>
                            {preferenceVocab.map((v, i) => (
                                <Fragment key={i}>
                                    <div className="p-2 border rounded bg-white/5 font-bold flex items-center text-sm">{v.en}</div>
                                    <Input value={vocabAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...vocabAns]; na[i] = e.target.value; setVocabAns(na); const nv = [...vocabVal]; nv[i] = 'unchecked'; setVocabVal(nv); }} className={cn("uppercase transition-all", vocabVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : vocabVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" readOnly={!!targetStudentId} />
                                </Fragment>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-between border-t pt-6"><Button onClick={handleCheckVocab} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!vocabAllOk && !isAdmin} className='text-white font-bold'>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-foreground text-left overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Estructura de Preferencias</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0 font-medium">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-primary uppercase mb-4">1. Pronombres de Objeto Directo</h3>
                                <p className="mb-4">Para expresar lo que nos gusta, nos duele o nos encanta, usamos:</p>
                                <div className='grid grid-cols-5 gap-2 text-center font-bold text-lg'>
                                    <div className='p-2 bg-primary/10 rounded border border-primary/20'>ME</div>
                                    <div className='p-2 bg-primary/10 rounded border border-primary/20'>TE</div>
                                    <div className='p-2 bg-primary/10 rounded border border-primary/20'>LE</div>
                                    <div className='p-2 bg-primary/10 rounded border border-primary/20'>NOS</div>
                                    <div className='p-2 bg-primary/10 rounded border border-primary/20'>LES</div>
                                </div><br />
                                <p className="mb-4">CONJUGACION</p><br />
                                <p className="mb-4">A mi me gusta : I like</p>
                                <p className="mb-4">A ti te gusta : you like</p>
                                <p className="mb-4">A él le gusta : he likes</p>
                                <p className="mb-4">A ella le gusta: she likes</p>
                                <p className="mb-4">A nosotros nos gusta: we like</p>
                                <p className="mb-4">A ellos les gusta   : they like</p>
                            </div>
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-6 text-foreground">
                                <h3 className="text-xl font-black text-primary uppercase mb-2">2. Concordancia: Singular vs Plural</h3>
                                <div className='text-foreground'>
                                    <h4 className='font-bold text-primary'>GUSTA / ENCANTA / DUELE (Singular):</h4>
                                    <p className='text-sm italic'>Se usa cuando lo que nos gusta es una sola cosa o una acción (verbo).</p>
                                    <p className='font-mono bg-muted p-2 rounded mt-1'>Me gusta la pizza / Me encanta viajar / Me duele la cabeza.</p>
                                </div>
                                <Separator />
                                <div className='text-foreground'>
                                    <h4 className='font-bold text-primary'>GUSTAN / ENCANTAN / DUELEN (Plural):</h4>
                                    <p className='text-sm italic'>Se usa cuando lo que nos gusta son varias cosas.</p>
                                    <p className='font-mono bg-muted p-2 rounded mt-1'>Me gustan los libros / Me encantan las flores / Me duelen los pies.</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'ex1': return <BlockValidationExercise title="Ejercicio 1" prompts={ex1Prompts} onComplete={() => handleTopicComplete('ex1')} vocabulary={preferenceVocab.reduce((acc, curr) => ({...acc, [curr.en]: curr.es}), {})} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} />;
            case 'ex2': return <FillInTheBlankExercise title="Ejercicio 2" prompts={ex2Prompts} onComplete={() => handleTopicComplete('ex2')} instruction="Completa con el pronombre correcto (me, te, le, nos, les)." isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} />;
            case 'vocab_game': return <VocabularyMatchingGame data={preferenceVocab.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Memory: Preferencias" />;
            case 'reading':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>{readingData.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner text-foreground">{readingData.content}</div>
                            <Separator /><div className="space-y-4">{readingData.questions.map(q => (
                                <div key={q.id} className="space-y-2 text-foreground"><Label className='font-bold text-foreground'>{q.q}</Label><Input value={readAns[q.id] || ''} onChange={e => { if (targetStudentId) return; setReadAns({...readAns, [q.id]: e.target.value}); setReadVal({...readVal, [q.id]: 'unchecked'}); }} className={cn('h-12 text-foreground', readVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[q.id] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                            ))}</div>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6 bg-muted/10">
                            <Button onClick={handleCheckReading} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('reading')} disabled={!isReadComplete && !isAdmin} className="font-bold text-white bg-primary hover:bg-primary/90">Continuar <ArrowRight className="ml-2 h-5 w-5" /></Button>
                        </CardFooter>
                    </Card>
                );
            case 'ex3': return <BlockValidationExercise key="ex3-independent" title="Ejercicio 3" prompts={ex3Prompts} onComplete={() => handleTopicComplete('ex3')} vocabulary={preferenceVocab.reduce((acc, curr) => ({...acc, [curr.en]: curr.es}), {})} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} />;
            case 'mixed': return <BlockValidationExercise key="mixed-independent" title="Ejercicio Mixto" prompts={mixedExPrompts} onComplete={() => handleTopicComplete('mixed')} vocabulary={preferenceVocab.reduce((acc, curr) => ({...acc, [curr.en]: curr.es}), {})} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} />;
            case 'translate':
                if (isFinished) {
                    return (
                        <Card className="shadow-soft border-2 border-green-500 bg-green-50/10 p-12 text-center flex flex-col items-center text-foreground animate-in fade-in duration-500">
                            <Trophy className="h-24 w-24 text-yellow-400 mb-6 animate-bounce" />
                            <h2 className="text-4xl font-black uppercase text-green-600 tracking-tighter">¡FELICITACIONES!</h2>
                            <p className="text-2xl mt-4 font-bold">Tu completaste esta clase Verbos de Preferencia</p>
                            <Button asChild className="mt-8 px-12 h-12 font-bold" variant="outline"><Link href="/espanol/a1">Regresar a la Ruta A1</Link></Button>
                        </Card>
                    );
                }
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader>
                            <div className='flex justify-between items-center w-full'>
                                <div><CardTitle>Traducción de Texto</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el párrafo al español.</CardDescription></div>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64">
                                        <ScrollArea className="h-48 pr-4 text-left text-foreground">
                                            <div className="grid grid-cols-2 gap-2 text-sm text-foreground">
                                                {Object.entries(preferenceVocab.reduce((acc, curr) => ({...acc, [curr.en]: curr.es}), {})).map(([en, es]: any) => (<Fragment key={en}><span className="text-muted-foreground capitalize font-bold">{en}:</span><span className="font-semibold text-right text-primary uppercase">{es}</span></Fragment>))}
                                            </div>
                                        </ScrollArea>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6 text-foreground">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed shadow-sm text-foreground">"I love my family and we enjoy to travel together. My sister is interested in animals, but she doesn't like spiders. My father likes classical music. My mother loves to cook, but she doesn't like loud noise because her head hurts."</div>
                            <Separator /><div className="space-y-2 text-foreground"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={transText} onChange={(e) => { if (!targetStudentId) setTransText(e.target.value); }} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg text-foreground" readOnly={!!targetStudentId} /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20">
                            <Button onClick={() => { if (targetStudentId && !isAdmin) return; setIsFinished(true); handleTopicComplete('translate'); }} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter transition-all active:scale-95">MISIÓN FINAL</Button>
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
                            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400"><Star className="h-6 w-6 fill-current animate-pulse" />
                            <p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión: {studentProfile?.name || targetStudentId}</p></div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors"><Link href="/admin">Cerrar</Link></Button>
                        </div>
                    )}
                    
                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/a1" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver al Curso A1</Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3 text-white"><Activity className='h-10 w-10 text-primary' /> Verbos de Preferencia 🇪🇸</h1>
                    </div>

                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
                                <CardHeader className="pb-4 border-b bg-muted/30">
                                    <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Misión A1</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <nav><ul className="space-y-1">
                                        {learningPath.map((item) => {
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            const isSelected = selectedTopic === item.key;
                                            const Icon = ICONS_CONFIG[item.status as keyof typeof ICONS_CONFIG] || BookOpen;
                                            return (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', isSelected && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm', item.status === 'active' && !isAdmin && "animate-pulse-glow")}>
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

export default function VerbosPreferenciaPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}>
            <VerbosPreferenciaContent />
        </Suspense>
    );
}