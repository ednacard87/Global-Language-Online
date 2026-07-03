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

// --- Engineering Configuration ---
const progressStorageVersion = 'progress_es_a1_verbos_preferencia_v3_bug_fix';
const mainProgressKey = 'progress_a1_es_verbos_preferencia';

// --- Data ---
const preferenceVocab = [
    { en: "To like", es: "GUSTAR" },
    { en: "To love (things)", es: "ENCANTAR" },
    { en: "To be interested in", es: "INTERESAR" },
    { en: "To bother", es: "MOLESTAR" },
    { en: "To hurt", es: "DOLER (o:ue)" },
    { en: "To matter", es: "IMPORTAR" },
    { en: "To seem", es: "PARECER" },
    { en: "To bore", es: "ABURRIR" },
    { en: "Soccer", es: "El fútbol" },
    { en: "Music", es: "La música" },
    { en: "Movies", es: "Las películas" },
    { en: "Books", es: "Los libros" },
    { en: "To travel", es: "Viajar" },
    { en: "To cook", es: "Cocinar" },
    { en: "The head", es: "La cabeza" },
    { en: "The noise", es: "El ruido" },
];

const ex1Prompts = Array(20).fill(0).map((_, i) => {
    const prompts = [
        { q: "A mí me ______ la pizza.", a: "gusta" },
        { q: "A ellos les ______ los deportes.", a: "gustan" },
        { q: "A ti te ______ leer.", a: "gusta" },
        { q: "A nosotros nos ______ las películas de ciencia ficción.", a: "gustan" },
        { q: "A ella le ______ el café por la mañana.", a: "gusta" },
        { q: "A ustedes les ______ los días soleados.", a: "gustan" },
        { q: "A mí no me ______ las arañas.", a: "gustan" },
        { q: "A mi hermano le ______ escuchar música rock.", a: "gusta" },
        { q: "A mis padres les ______ los documentales.", a: "gustan" },
        { q: "¿Te ______ el helado de chocolate?", a: "gusta" },
        { q: "A nosotros nos ______ las fresas.", a: "gustan" },
        { q: "A María le ______ caminar por la playa.", a: "gusta" },
        { q: "A mí me ______ mucho tus zapatos.", a: "gustan" },
        { q: "A los niños les ______ jugar afuera.", a: "gusta" },
        { q: "A ti te ______ las matemáticas.", a: "gustan" },
        { q: "A mi jefe le ______ el orden.", a: "gusta" },
        { q: "A ellas les ______ los gatos negros.", a: "gustan" },
        { q: "Me ______ la idea.", a: "gusta" },
        { q: "Nos ______ los conciertos en vivo.", a: "gustan" },
        { q: "Le ______ la comida picante.", a: "gusta" },
    ];
    return prompts[i];
});

const ex2Prompts = Array(20).fill(0).map((_, i) => {
    const prompts = [
        { q: "A Juan ______ gusta el café.", a: "le" },
        { q: "A mis amigos y a mí ______ encanta viajar.", a: "nos" },
        { q: "¿A ti ______ molesta el ruido?", a: "te" },
        { q: "A mí ______ duelen los pies.", a: "me" },
        { q: "A ustedes ______ parece una buena idea.", a: "les" },
        { q: "A nosotros no ______ importa la hora.", a: "nos" },
        { q: "A ella ______ aburren las matemáticas.", a: "le" },
        { q: "A ellos ______ encantan los perros.", a: "les" },
        { q: "¿A usted ______ interesa la historia?", a: "le" },
        { q: "A mí ______ gusta mucho este libro.", a: "me" },
        { q: "A ti y a tu hermano ______ queda bien esa ropa.", a: "les" },
        { q: "A nosotros ______ duelen las manos.", a: "nos" },
        { q: "A los turistas ______ interesa la cultura local.", a: "les" },
        { q: "(A mí) ______ parece increíble.", a: "me" },
        { q: "¿(A ti) ______ apetece un helado?", a: "te" },
        { q: "A mi madre ______ preocupa la situación.", a: "le" },
        { q: "A mis abuelos ______ gusta recibir visitas.", a: "les" },
        { q: "(A nosotros) ______ encanta la playa.", a: "nos" },
        { q: "A ti ______ duele la cabeza, ¿verdad?", a: "te" },
        { q: "(A mí) no ______ gustan las despedidas.", a: "me" },
    ];
    return prompts[i];
});

const ex3Prompts = Array(20).fill(0).map((_, i) => {
    const prompts = [
        { q: "A mí me ______ las películas de terror. (encantar)", a: "encantan" },
        { q: "A ella no le ______ la política. (interesar)", a: "interesa" },
        { q: "A nosotros nos ______ los pies después de caminar. (doler)", a: "duelen" },
        { q: "A ti te ______ el ruido fuerte. (molestar)", a: "molesta" },
        { q: "A ellos les ______ mucho los videojuegos. (aburrir)", a: "aburren" },
        { q: "A mi padre le ______ el fútbol. (importar)", a: "importa" },
        { q: "A mí me ______ bien estos pantalones. (quedar)", a: "quedan" },
        { q: "A ustedes les ______ la comida exótica. (interesar)", a: "interesa" },
        { q: "A nosotros nos ______ las mañanas frías. (encantar)", a: "encantan" },
        { q: "A mi perro le ______ los truenos. (molestar)", a: "molestan" },
        { q: "Me ______ la espalda. (doler)", a: "duele" },
        { q: "Nos ______ las novelas de misterio. (interesar)", a: "interesan" },
        { q: "Te ______ raro que no llame. (parecer)", a: "parece" },
        { q: "Les ______ las mentiras. (molestar)", a: "molestan" },
        { q: "Me ______ solo cinco euros. (quedar)", a: "quedan" },
        { q: "Le ______ mucho su familia. (importar)", a: "importa" },
        { q: "Nos ______ las matemáticas. (aburrir)", a: "aburren" },
        { q: "Me ______ los días de lluvia. (encantar)", a: "encantan" },
        { q: "Te ______ las muelas. (doler)", a: "duelen" },
        { q: "Les ______ geniales tus ideas. (parecer)", a: "parecen" },
    ];
    return prompts[i];
});

const finalExPrompts = Array(20).fill(0).map((_, i) => {
    const prompts = [
        { en: "I like the blue car.", es: ["me gusta el coche azul"] },
        { en: "They love to dance.", es: ["a ellos les encanta bailar", "les encanta bailar"] },
        { en: "My head hurts.", es: ["me duele la cabeza"] },
        { en: "History interests us.", es: ["a nosotros nos interesa la historia", "nos interesa la historia"] },
        { en: "The noise bothers her.", es: ["a ella le molesta el ruido", "le molesta el ruido"] },
        { en: "Do you like fruits?", es: ["a ti te gustan las frutas?", "te gustan las frutas?"] },
        { en: "We love dogs.", es: ["a nosotros nos encantan los perros", "nos encantan los perros"] },
        { en: "His feet hurt.", es: ["a él le duelen los pies", "le duelen los pies"] },
        { en: "The idea seems good to me.", es: ["a mí me parece buena la idea", "me parece buena la idea"] },
        { en: "The news doesn't matter to them.", es: ["a ellos no les importa la noticia", "no les importa la noticia"] },
        { en: "I like to travel.", es: ["me gusta viajar"] },
        { en: "You love chocolate.", es: ["a ti te encanta el chocolate", "te encanta el chocolate"] },
        { en: "His stomach hurts.", es: ["a él le duele el estómago", "le duele el estómago"] },
        { en: "Are you bothered by the smoke?", es: ["a ti te molesta el humo?", "te molesta el humo?"] },
        { en: "We are interested in art.", es: ["a nosotros nos interesa el arte", "nos interesa el arte"] },
        { en: "They like horror movies.", es: ["a ellos les gustan las películas de terror", "les gustan las películas de terror"] },
        { en: "My eyes hurt.", es: ["me duelen los ojos"] },
        { en: "She loves sunny days.", es: ["a ella le encantan los días soleados", "le encantan los días soleados"] },
        { en: "It seems strange to us.", es: ["a nosotros nos parece raro", "nos parece raro"] },
        { en: "I have two euros left.", es: ["me quedan dos euros"] },
    ];
    return prompts[i];
});

// --- Reusable Sentence Fill-in-the-blank component (CORRECTED) ---
const FillInTheBlankExercise = ({ title, prompts, onComplete, instruction }: { title: string, prompts: { q: string, a: string }[], onComplete: () => void, instruction: string }) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [statuses, setStatuses] = useState<('correct' | 'incorrect' | 'unchecked')[]>(() => Array(prompts.length).fill('unchecked'));

    useEffect(() => {
        if (statuses[currentIndex] !== 'correct') {
             setCurrentAnswer('');
        }
    }, [currentIndex, statuses]);

    const handleCheck = () => {
        const prompt = prompts[currentIndex];
        if (!prompt) return;

        const isCorrect = currentAnswer.trim().toLowerCase() === prompt.a.toLowerCase();

        const newStatuses = [...statuses];
        newStatuses[currentIndex] = isCorrect ? 'correct' : 'incorrect';
        setStatuses(newStatuses);

        if (isCorrect) {
            toast({ title: "¡Correcto!" });
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
                        <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-3 flex-1 rounded-full cursor-pointer transition-all", "min-w-[20px]", currentIndex === i && "ring-2 ring-primary ring-offset-2 ring-offset-background", statuses[i] === 'correct' ? "bg-green-500" : statuses[i] === 'incorrect' ? "bg-red-500" : "bg-muted")} />
                    ))}
                </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6 pt-6 text-center">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">{instruction}</p>
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-2xl tracking-tighter text-foreground min-h-[8rem] flex items-center justify-center w-full">
                    {prompts[currentIndex]?.q}
                </div>
                <Input
                    value={currentAnswer}
                    onChange={e => setCurrentAnswer(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { isCurrentCorrect ? goToNext() : handleCheck(); } }}
                    className={cn("h-12 text-lg text-foreground text-center max-w-md border-2", isCurrentCorrect ? 'border-green-500' : statuses[currentIndex] === 'incorrect' ? 'border-red-500' : 'border-input')}
                    placeholder="Escribe aquí..."
                    autoComplete="off"
                    disabled={isCurrentCorrect}
                />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6 bg-muted/10">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    {!isCurrentCorrect && <Button onClick={handleCheck} variant="secondary">Verificar</Button>}
                    {allDone ? <Button onClick={onComplete} className="font-bold text-white bg-green-600 hover:bg-green-700 animate-pulse">Completar Ejercicio <Trophy className='ml-2 h-4 w-4'/></Button> : <Button onClick={goToNext} disabled={!isCurrentCorrect}>Siguiente <ArrowRight className='ml-2 h-4 w-4'/></Button>}
                </div>
            </CardFooter>
        </Card>
    );
};


// --- Reusable Translation Exercise Component ---
const SingleStepExercise = ({ title, prompts, onComplete }: { title: string, prompts: { en: string, es: string[] }[], onComplete: () => void }) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [statuses, setStatuses] = useState<('correct' | 'incorrect' | 'unchecked')[]>(() => Array(prompts.length).fill('unchecked'));

    useEffect(() => {
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
                        <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-3 flex-1 rounded-full cursor-pointer transition-all", "min-w-[20px]", currentIndex === i && "ring-2 ring-primary ring-offset-2 ring-offset-background", statuses[i] === 'correct' ? "bg-green-500" : statuses[i] === 'incorrect' ? "bg-red-500" : "bg-muted")} />
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
                    className={cn("h-12 text-lg text-foreground text-center max-w-md border-2", isCurrentCorrect ? 'border-green-500' : statuses[currentIndex] === 'incorrect' ? 'border-red-500' : 'border-input')}
                    placeholder="Escribe en español..."
                    autoComplete="off"
                    disabled={isCurrentCorrect}
                />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6 bg-muted/10">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    {!isCurrentCorrect && <Button onClick={handleCheck} variant="secondary">Verificar</Button>}
                    {allDone ? <Button onClick={onComplete} className="font-bold text-white bg-green-600 hover:bg-green-700 animate-pulse">Completar Ejercicio <Trophy className='ml-2 h-4 w-4'/></Button> : <Button onClick={goToNext} disabled={!isCurrentCorrect}>Siguiente <ArrowRight className='ml-2 h-4 w-4'/></Button>}
                </div>
            </CardFooter>
        </Card>
    );
};


// --- Main Page Component ---
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
    
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(preferenceVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(preferenceVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    
    const { data: authUserProfile } = useDoc<{ role?: string }>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string, lessonProgress?: any, progress?: any, name?: string }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar1', name: '2. Gramática: Estructura', icon: GraduationCap, status: 'locked' },
        { key: 'grammar2', name: '3. Gramática: Singular/Plural', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: '4. Ejercicio 1: gusta/gustan', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: '5. Ejercicio 2: Pronombres', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'ex3', name: '7. Ejercicio 3: Otros Verbos', icon: PenSquare, status: 'locked' },
        { key: 'final_ex', name: '8. Ejercicio Final', icon: Trophy, status: 'locked' },
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
        if ((topicKey === 'grammar1' || topicKey === 'grammar2') && topic?.status !== 'completed') {
            handleTopicComplete(topicKey); 
        }
    };

    const handleVocabCheck = () => {
        let okCount = 0;
        const nv = preferenceVocab.map((item, idx) => {
            const isCorrect = item.es.toLowerCase().split(' ')[0] === (vocabAnswers[idx] || '').trim().toLowerCase().split(' ')[0];
            if (isCorrect) okCount++;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv as any);
        if (okCount >= 8) { setCanAdvanceVocab(true); toast({ title: "¡Buen avance!" }); }
        else toast({ variant: 'destructive', title: `Necesitas ${8 - okCount} más aciertos para avanzar.` });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

        switch (selectedTopic) {
            case 'vocabulary': return <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm"><CardHeader><CardTitle>Vocabulario: Verbos de Preferencia</CardTitle><CardDescription>Escribe el verbo o sustantivo en español.</CardDescription></CardHeader><CardContent><div className="grid grid-cols-2 gap-4">{preferenceVocab.map((v, i) => (<Fragment key={i}><Label className='font-semibold'>{v.en}</Label><Input value={vocabAnswers[i]} onChange={e => { const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const newValidation = [...vocabValidation]; newValidation[i] = 'unchecked'; setVocabValidation(newValidation); setCanAdvanceVocab(false); }} className={cn("h-10 uppercase", vocabValidation[i] === 'correct' ? 'border-green-500' : vocabValidation[i] === 'incorrect' ? 'border-red-500' : '')} /></Fragment>))}</div></CardContent><CardFooter className="flex justify-between border-t pt-6"><Button onClick={handleVocabCheck} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar <ArrowRight className='ml-2 h-4 w-4' /></Button></CardFooter></Card>;
            case 'grammar1': return <Card className="shadow-soft border-2 border-brand-purple"><CardHeader><CardTitle>Gramática: La Estructura Especial</CardTitle></CardHeader><CardContent className="space-y-6"><div><h3 className='font-bold text-lg text-primary'>Estructura Inversa</h3><p>Con verbos como GUSTAR, la persona que siente la emoción (I, you, he) se convierte en un objeto indirecto en español (me, te, le). La cosa que provoca la emoción es el sujeto de la oración.</p><p className='mt-2 p-3 bg-muted rounded-lg font-mono'>I like music → <span className='text-blue-500'>Me</span> <span className='text-red-500'>gusta</span> <span className='text-green-500'>la música</span>.</p></div><div><h3 className='font-bold text-lg text-primary'>Pronombres de Objeto Indirecto</h3><p>Estos son los pronombres que SIEMPRE se usan con estos verbos:</p><ul className="list-none space-y-2 mt-2">{[ {p: "(A mí)", i: "me"}, {p: "(A ti)", i: "te"}, {p: "(A él/ella/usted)", i: "le"}, {p: "(A nosotros/as)", i: "nos"}, {p: "(A ellos/as/ustedes)", i: "les"}].map(item => <li key={item.i} className='flex items-center'><span className='w-1/3 text-muted-foreground'>{item.p}</span><span className='font-bold text-lg'>{item.i}</span></li>)}</ul><p className='text-sm text-muted-foreground mt-2'>La parte entre paréntesis (A mí, A ti...) es opcional y se usa para dar énfasis o aclarar.</p></div></CardContent><CardFooter className='justify-end'><Button onClick={() => handleTopicComplete('grammar1')}>Comprendido <CheckCircle className='ml-2 h-4 w-4' /></Button></CardFooter></Card>;
            case 'grammar2': return <Card className="shadow-soft border-2 border-brand-purple"><CardHeader><CardTitle>Gramática: Singular vs. Plural</CardTitle></CardHeader><CardContent className="space-y-6"><div><h3 className='font-bold text-lg text-primary'>Usando el Singular (gusta, encanta, duele)</h3><p>Usa la forma singular del verbo cuando la cosa que te gusta es:</p><ul className='list-disc pl-5 mt-2 space-y-1'><li>Un sustantivo singular: <span className='font-mono'>Me gusta <strong>el libro</strong>.</span></li><li>Un verbo en infinitivo: <span className='font-mono'>Nos encanta <strong>viajar</strong>.</span></li></ul></div><div><h3 className='font-bold text-lg text-primary'>Usando el Plural (gustan, encantan, duelen)</h3><p>Usa la forma plural del verbo cuando la cosa que te gusta es un sustantivo plural:</p><ul className='list-disc pl-5 mt-2 space-y-1'><li><span className='font-mono'>Te gustan <strong>los perros</strong>.</span></li><li><span className='font-mono'>Les duelen <strong>las muelas</strong>.</span></li></ul></div><div className='p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-800 dark:text-yellow-300'><p><strong>¡Recuerda!</strong> El verbo concuerda con la cosa (el sujeto), no con la persona (el objeto indirecto).</p></div></CardContent><CardFooter className='justify-end'><Button onClick={() => handleTopicComplete('grammar2')}>¡Listo! <CheckCircle className='ml-2 h-4 w-4' /></Button></CardFooter></Card>;
            case 'ex1': return <FillInTheBlankExercise title="Ejercicio 1: gusta vs. gustan" prompts={ex1Prompts} onComplete={() => handleTopicComplete('ex1')} instruction="Completa la frase con 'gusta' o 'gustan'." />;
            case 'ex2': return <FillInTheBlankExercise title="Ejercicio 2: Los Pronombres" prompts={ex2Prompts} onComplete={() => handleTopicComplete('ex2')} instruction="Completa la frase con el pronombre correcto." />;
            case 'vocab_game': return <Card className="shadow-soft border-2 border-brand-purple bg-card/95"><CardHeader><CardTitle>Juego de Vocabulario</CardTitle></CardHeader><CardContent><VocabularyMatchingGame data={preferenceVocab.slice(0, 8).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Encuentra las parejas" /></CardContent></Card>;
            case 'ex3': return <FillInTheBlankExercise title="Ejercicio 3: Otros Verbos de Preferencia" prompts={ex3Prompts} onComplete={() => handleTopicComplete('ex3')} instruction="Completa la frase con la forma correcta del verbo indicado." />;
            case 'final_ex': return <SingleStepExercise title="Ejercicio Final: Traducción" prompts={finalExPrompts} onComplete={() => handleTopicComplete('final_ex')} />;
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
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3"><Activity className='h-10 w-10 text-primary' /> Verbos de Preferencia 🇪🇸</h1>
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

export default function VerbosPreferenciaPage() {
    return (<Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}><VerbosPreferenciaContent /></Suspense>);
}