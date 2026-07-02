'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
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
    Check,
    X,
    HelpCircle,
    Info,
    Search,
    Pencil
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Footer } from '@/components/footer';
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
const progressStorageVersion = 'progress_es_a2_reflex_reg_v4_final_extended';
const mainProgressKey = 'progress_a2_es_reflexivos_regulares';

// --- DATA ---

const reflexiveVocab = [
    { en: "TO NAME ONESELF", es: "LLAMARSE" },
    { en: "TO WASH ONESELF", es: "LAVARSE" },
    { en: "TO SHOWER", es: "DUCHARSE" },
    { en: "TO BATHE", es: "BAÑARSE" },
    { en: "TO COMB ONE'S HAIR", es: "PEINARSE" },
    { en: "TO BRUSH ONE'S TEETH", es: "CEPILLARSE" },
    { en: "TO SHAVE", es: "AFEITARSE" },
    { en: "TO PUT ON MAKEUP", es: "MAQUILLARSE" },
    { en: "TO DRY ONESELF", es: "SECARSE" },
    { en: "TO GET UP", es: "LEVANTARSE" },
    { en: "TO PREPARE ONESELF", es: "PREPARARSE" },
    { en: "TO TAKE OFF", es: "QUITARSE" },
    { en: "TO STRETCH", es: "ESTIRARSE" },
    { en: "TO CALM DOWN", es: "CALMARSE" },
    { en: "TO TRAIN", es: "ENTRENARSE" },
    { en: "TO RELAX", es: "RELAJARSE" },
    { en: "TO GET TIRED", es: "CANSARSE" },
    { en: "TO GET BORED", es: "ABURRIRSE" },
    { en: "TO ALLOW ONESELF", es: "PERMITIRSE" },
    { en: "TO FIX ONESELF UP", es: "ARREGLARSE" },
    { en: "TO STAY", es: "QUEDARSE" },
    { en: "TO HELP ONESELF", es: "AYUDARSE" },
];

const conjugarVerbsList = [
    "LLAMARSE", "LAVARSE", "DUCHARSE", "BAÑARSE", "PEINARSE", 
    "CEPILLARSE", "AFEITARSE", "MAQUILLARSE", "ESTIRARSE", 
    "LEVANTARSE", "PREPARARSE", "QUITARSE"
];

const ex1Prompts = [
    { en: "I shower in the morning.", es: ["yo me ducho en la mañana", "me ducho en la mañana"] },
    { en: "You wash your hands.", es: ["tú te lavas las manos", "te lavas las manos"] },
    { en: "He shaves every day.", es: ["él se afeita todos los días", "se afeita todos los días"] },
    { en: "We get up at 7:00.", es: ["nosotros nos levantamos a las siete", "nos levantamos a las siete"] },
    { en: "They comb their hair.", es: ["ellos se peinan", "ellas se peinan", "se peinan"] },
    { en: "She puts on makeup for the party.", es: ["ella se maquilla para la fiesta", "se maquilla para la fiesta"] },
    { en: "I dry myself with a towel.", es: ["yo me seco con una toalla", "me seco con una toalla"] },
];

const ex2Prompts = [
    { en: "We prepare for the exam.", es: ["nosotros nos preparamos para el examen", "nos preparamos para el examen"] },
    { en: "You (formal) stay at home.", es: ["usted se queda en casa", "se queda en casa"] },
    { en: "The children get tired fast.", es: ["los niños se cansan rápido", "los hijos se cansan rápido"] },
    { en: "I take off my jacket.", es: ["yo me quito mi chaqueta", "yo me quito la chaqueta", "me quito la chaqueta"] },
    { en: "She brushes her teeth.", es: ["ella se cepilla los dientes", "se cepilla los dientes"] },
    { en: "We relax on Sundays.", es: ["nosotros nos relajamos los domingos", "nos relajamos los domingos"] },
    { en: "They train at the gym.", es: ["ellos se entrenan en el gimnasio", "se entrenan en el gimnasio"] },
    { en: "You (plural) calm down.", es: ["ustedes se calman"] },
];

const ex3Prompts = [
    { en: "I name myself Juan.", es: ["yo me llamo juan", "me llamo juan"] },
    { en: "He gets bored in class.", es: ["él se aburre en clase", "se aburre en clase"] },
    { en: "We help each other with homework.", es: ["nosotros nos ayudamos con la tarea", "nos ayudamos con la tarea"] },
    { en: "They fasten their seatbelts.", es: ["ellos se abrochan los cinturones", "se abrochan los cinturones"] },
    { en: "I stretch before running.", es: ["yo me estiro antes de correr", "me estiro antes de correr"] },
    { en: "She bathes (herself).", es: ["ella se baña", "se baña"] },
    { en: "We fix ourselves up for the wedding.", es: ["nosotros nos arreglamos para la boda", "nos arreglamos para la boda"] },
    { en: "You (informal) allow yourself a break.", es: ["tú te permites un descanso", "te permites un descanso"] },
    { en: "The cat licks itself (washes itself).", es: ["el gato se lava"] },
];

const readingData = {
    title: "Mi Rutina de la Mañana",
    content: "Hola, soy Mateo. Todos los días, yo me levanto a las seis de la mañana. Primero, me estiro un poco en la cama. Luego, me ducho con agua fría para despertar. Después de la ducha, me seco bien y me afeito. Mi esposa, Elena, se levanta más tarde. Ella se lava la cara y se maquilla rápidamente. Nosotros desayunamos juntos y luego nos preparamos para ir al trabajo. En la oficina, yo me canso un poco por la tarde, pero me relajo cuando llego a casa.",
    questions: [
        { q: "¿A qué hora se levanta Mateo?", a: ["a las seis", "a las 6", "a las seis de la mañana"] },
        { q: "¿Qué hace Mateo primero en la cama?", a: ["se estira", "se estira un poco"] },
        { q: "¿Con qué tipo de agua se ducha?", a: ["agua fría", "con agua fría"] },
        { q: "¿Qué hace Elena después de lavarse la cara?", a: ["se maquilla"] },
        { q: "¿Cuándo se relaja Mateo?", a: ["cuando llega a casa", "en la casa"] },
    ]
};

const finalExPrompts = [
    { sentence: "1. Yo _______ (lavarse) las manos antes de comer.", answer: "me lavo" },
    { sentence: "2. Nosotros _______ (quedarse) en este hotel.", answer: "nos quedamos" },
    { sentence: "3. Ellos _______ (ducharse) por la noche.", answer: "se duchan" },
    { sentence: "4. Tú _______ (peinarse) frente al espejo.", answer: "te peinas" },
    { sentence: "5. Ella _______ (cepillarse) el cabello.", answer: "se cepilla" },
    { sentence: "6. Ustedes _______ (cansarse) de caminar mucho.", answer: "se cansan" },
    { sentence: "7. ÉL _______ (afeitarse) la barba.", answer: "se afeita" },
    { sentence: "8. Nosotras _______ (maquillarse) juntas.", answer: "nos maquillamos" },
    { sentence: "9. Ellos _______ (estirarse) después del yoga.", answer: "se estiran" },
    { sentence: "10. El perro _______ (bañarse) en el río.", answer: "se baña" },
    { sentence: "11. El gato _______ (calmarse) en la caja.", answer: "se calma" },
    { sentence: "12. El niño _______ (levantarse) tarde.", answer: "se levanta" },
    { sentence: "13. Las mujeres _______ (maquillarse) antes de la fiesta.", answer: "se maquillan" },
    { sentence: "14. Yo _______ (prepararse) el desayuno.", answer: "me preparo" },
    { sentence: "15. Ella _______ (cansarse) de entrenar rápido.", answer: "se cansa" },
    { sentence: "16. Tú _______ (bañarse) en el mar.", answer: "te bañas" },
    { sentence: "17. Él _______ (secarse) las manos.", answer: "se seca" },
    { sentence: "18. Nosotros _______ (estirarse) antes de correr.", answer: "nos estiramos" },
    { sentence: "19. Ellas _______ (ayudarse) con la tarea.", answer: "se ayudan" },
    { sentence: "20. Usted _______ (afeitarse) cada mañana.", answer: "se afeita" },
    { sentence: "21. Yo _______ (quitarse) la chaqueta.", answer: "me quito" },
    { sentence: "22. Los niños _______ (lavarse) la cara.", answer: "se lavan" },
    { sentence: "23. Mi hermana _______ (maquillarse) poco.", answer: "se maquilla" },
    { sentence: "24. Ustedes _______ (relajarse) en la playa.", answer: "se relajan" },
    { sentence: "25. Yo _______ (levantarse) a las 8 am.", answer: "me levanto" },
];

const translationVocabHelp = {
    "Every morning": "cada mañana",
    "wake up": "despertarse",
    "I get up": "levantarse",
    "I shower": "ducharse",
    "Cold water": "agua fría",
    "wash": "lavarse",
    "face" : "cara" ,
    "shave": "afeitarse",
    "Later": "más tarde",
    "Puts on makeup": "maquillarse",
    "Quickly": "rápidamente",
    "have breakfast": "desayunar",
    "Together": "juntos",
    "We prepare ourselves": "nos preparamos",
    "To go to work": "para ir al trabajo"
};

const globalVocabMap: Record<string, string> = reflexiveVocab.reduce((acc, curr) => {
    acc[curr.es.toLowerCase()] = curr.en.toLowerCase();
    return acc;
}, {} as Record<string, string>);

// --- HELPER COMPONENTS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => {
        setAnswer('');
    }, [currentIndex]);

    const currentPrompt = prompts[currentIndex];

    const handleCheck = () => {
        const userVal = answer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const isCorrect = currentPrompt.es.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
        
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
                        <CardDescription className="font-bold text-foreground mt-1">Traduce la frase al español usando verbos reflexivos regulares.</CardDescription>
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
                            <ScrollArea className="h-48 pr-4">
                                <div className="space-y-2 text-foreground">
                                    {reflexiveVocab.map((v, i) => (
                                        <div key={i} className="flex justify-between text-xs border-b pb-1">
                                            <span className="text-muted-foreground text-left">{v.en}:</span>
                                            <span className="font-bold text-right">{v.es}</span>
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
                    {currentPrompt.en}
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

// --- MAIN PAGE COMPONENT ---

function ReflexivosRegularesContent() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const targetStudentId = searchParams.get('studentId');
    const currentUID = targetStudentId || user?.uid;

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [learningPath, setLearningPath] = useState<any[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // Misión 1 Vocab
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(reflexiveVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(reflexiveVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    // Misión 3 Conjugar
    const [conjVerbsIdx, setConjVerbsIdx] = useState(0);
    const [conjAnswers, setConjAnswers] = useState<Record<number, string[]>>({});
    const [conjValidation, setConjValidation] = useState<Record<number, any[]>>({});

    // Misión 7 Lectura
    const [readingAns, setReadingAns] = useState<string[]>(Array(readingData.questions.length).fill(''));
    const [readingVal, setReadingVal] = useState<any[]>(Array(readingData.questions.length).fill('unchecked'));

    // Misión 9 Final Ex
    const [finalAns, setFinalAns] = useState<string[]>(Array(finalExPrompts.length).fill(''));
    const [finalVal, setFinalVal] = useState<any[]>(Array(finalExPrompts.length).fill('unchecked'));

    // Misión 10 Traducir Texto
    const [translationText, setTranslationText] = useState('');

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: authUserProfile } = useDoc<{ role?: string }>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string, lessonProgress?: any, progress?: any, name?: string }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialLearningPath = useMemo(() => [
        { key: 'vocabulario', name: '1. Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'gramatica', name: '2. Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'conjugar', name: '3. Conjugar', icon: Pencil, status: 'locked' },
        { key: 'ejercicio1', name: '4. Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'ejercicio2', name: '5. Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'ejercicio3', name: '6. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '7. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'lectura', name: '8. Lectura', icon: BookText, status: 'locked' },
        { key: 'final_ex', name: '9. Ejercicio Final', icon: Trophy, status: 'locked' },
        { key: 'traducir_texto', name: '10. Traducir Texto', icon: BookText, status: 'locked' },
    ], []);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;

        let path = initialLearningPath.map(topic => ({ ...topic }));
        let savedSelectedTopic = '';

        if (isAdmin && !targetStudentId) {
            path.forEach(item => { (item as any).status = 'completed'; });
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedData = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => {
                if (savedData[item.key]) (item as any).status = savedData[item.key];
            });
            savedSelectedTopic = savedData.lastSelectedTopic || '';
        }

        let lastDone = true;
        for (let i = 0; i < path.length; i++) {
            if (lastDone && (path[i] as any).status === 'locked') (path[i] as any).status = 'active';
            lastDone = (path[i] as any).status === 'completed';
        }

        setLearningPath(path);
        setSelectedTopic(savedSelectedTopic || path.find(p => p.status === 'active')?.key || path[0].key);
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
        const statusesToSave: Record<string, any> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => { statusesToSave[item.key] = item.status; });

        updateDocumentNonBlocking(studentDocRef, {
            [`lessonProgress.${progressStorageVersion}`]: statusesToSave,
            [`progress.${mainProgressKey}`]: progressValue
        });
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, isInitialLoading, targetStudentId]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(currentPath => {
            let wasUnlocked = false;
            let nextToSelect: string | null = null;
            const newPath = currentPath.map(t => ({ ...t }));
            const idx = newPath.findIndex(t => t.key === topicToComplete);
            if (idx !== -1 && newPath[idx].status !== 'completed') {
                newPath[idx].status = 'completed';
                if (idx + 1 < newPath.length && newPath[idx + 1].status === 'locked') {
                    newPath[idx + 1].status = 'active';
                    wasUnlocked = true;
                    nextToSelect = newPath[idx + 1].key;
                }
            }
            if (wasUnlocked) setTimeout(() => toast({ title: "¡Siguiente tema desbloqueado!" }), 0);
            if (nextToSelect) {
                const finalNext = nextToSelect;
                setTimeout(() => setSelectedTopic(finalNext), 0);
            }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') {
            toast({ variant: "destructive", title: "Contenido Bloqueado" });
            return;
        }
        setSelectedTopic(topicKey);
        if (['gramatica'].includes(topicKey)) handleTopicComplete(topicKey);
    };

    const handleCheckVocab = () => {
        let allOk = true;
        const nv = reflexiveVocab.map((item, idx) => {
            const isCorrect = item.es.toLowerCase() === (vocabAnswers[idx] || '').trim().toLowerCase();
            if (!isCorrect) allOk = false;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv as any);
        setCanAdvanceVocab(allOk);
        if (allOk) {
            toast({ title: "¡Excelente!" });
            handleTopicComplete('vocabulario');
        } else {
            toast({ variant: 'destructive', title: "Sigue intentando" });
        }
    };

    const handleConjCheck = () => {
        const currentVerb = conjugarVerbsList[conjVerbsIdx];
        const answers = conjAnswers[conjVerbsIdx] || Array(5).fill('');
        const root = currentVerb.toLowerCase().replace("se", "").slice(0, -2);
        const ending = currentVerb.toLowerCase().replace("se", "").slice(-2);
        
        let corrects: string[] = [];
        if (ending === 'ar') {
            corrects = [`me ${root}o`, `te ${root}as`, `se ${root}a`, `nos ${root}amos`, `se ${root}an`];
        } else if (ending === 'er') {
            corrects = [`me ${root}o`, `te ${root}es`, `se ${root}e`, `nos ${root}emos`, `se ${root}en`];
        } else { // ir
            corrects = [`me ${root}o`, `te ${root}es`, `se ${root}e`, `nos ${root}imos`, `se ${root}en`];
        }

        const nv = answers.map((ans, i) => ans.trim().toLowerCase() === corrects[i] ? 'correct' : 'incorrect');
        setConjValidation(p => ({ ...p, [conjVerbsIdx]: nv }));

        if (nv.every(v => v === 'correct')) {
            toast({ title: "¡Verbo conjugado correctamente!" });
            if (conjVerbsIdx < conjugarVerbsList.length - 1) setConjVerbsIdx(v => v + 1);
            else handleTopicComplete('conjugar');
        } else toast({ variant: "destructive", title: "Hay errores en la conjugación" });
    };

    const handleCheckReading = () => {
        let ok = true;
        const nv = readingData.questions.map((q, i) => {
            const isCorrect = q.a.some(ans => ans.toLowerCase() === (readingAns[i] || '').trim().toLowerCase());
            if (!isCorrect) ok = false;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setReadingVal(nv as any);
        if (ok) {
            toast({ title: "¡Muy bien!" });
            handleTopicComplete('lectura');
        } else {
            toast({ variant: 'destructive', title: "Revisa tus respuestas" });
        }
    };

    const handleCheckFinal = () => {
        let ok = true;
        const nv = finalExPrompts.map((q, i) => {
            const isCorrect = q.answer.toLowerCase() === (finalAns[i] || '').trim().toLowerCase();
            if (!isCorrect) ok = false;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setFinalVal(nv as any);
        if (ok) {
            toast({ title: "¡Misión Cumplida!" });
            handleTopicComplete('final_ex');
        } else {
            toast({ variant: 'destructive', title: "Sigue intentando" });
        }
    };

    const handleFinishClass = () => {
        if (translationText.length < 20 && !isAdmin) {
            toast({ variant: "destructive", title: "Traducción incompleta", description: "Por favor, traduce el texto completo para terminar." });
            return;
        }
        toast({ title: "¡Clase finalizada!", description: "Has completado la clase de Reflexivos Regulares." });
        handleTopicComplete('traducir_texto');
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex flex-col items-center justify-center min-h-[400px]"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /></div>;

        switch (selectedTopic) {
            case 'vocabulario':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
                        <CardHeader className='bg-primary/5 border-b'>
                            <CardTitle className="text-primary uppercase">Vocabulario: Verbos Reflexivos Regulares</CardTitle>
                            <CardDescription className='font-bold text-foreground'>Escribe el significado en español para cada verbo.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-foreground">
                                <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs text-left">English</div>
                                <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs text-left">Español</div>
                                {reflexiveVocab.map((v, i) => (
                                    <React.Fragment key={i}>
                                        <div className="flex items-center font-bold text-left py-1">{v.en}</div>
                                        <Input 
                                            value={vocabAnswers[i] || ''} 
                                            onChange={e => { const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); setVocabValidation(vv => { const nv = [...vv]; nv[i] = 'unchecked'; return nv as any; }); }} 
                                            className={cn("h-10 uppercase font-mono border-2", vocabValidation[i] === 'correct' ? 'border-green-500' : vocabValidation[i] === 'incorrect' ? 'border-red-500' : '')} 
                                            autoComplete="off"
                                        />
                                    </React.Fragment>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 bg-muted/20">
                            <Button onClick={handleCheckVocab} variant="secondary">Verificar Vocabulario</Button>
                            <Button onClick={() => handleTopicComplete('vocabulario')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold px-12'>Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'gramatica':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-foreground text-left">
                        <CardHeader><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Verbos Reflexivos</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-4 bg-white/50 dark:bg-background/20 rounded-2xl border">
                                <p className="text-lg font-bold">Un verbo es reflexivo cuando la acción recae sobre el mismo sujeto que la realiza.</p>
                                <p className="mt-2">En el infinitivo, estos verbos terminan en <span className="font-black text-primary">"SE"</span> (Ej: Lavar<span className="underline">se</span>, Duchar<span className="underline">se</span>).</p>
                            </div>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-primary uppercase">Pronombres Reflexivos</h3>
                                <div className="grid grid-cols-2 gap-4 max-w-sm">
                                    <div className="p-2 border rounded bg-card text-foreground"><strong>Yo:</strong> me</div>
                                    <div className="p-2 border rounded bg-card text-foreground"><strong>Nosotros:</strong> nos</div>
                                    <div className="p-2 border rounded bg-card text-foreground"><strong>Tú:</strong> te</div>
                                    <div className="p-2 border rounded bg-card text-foreground"><strong>Vosotros:</strong> os</div>
                                    <div className="p-2 border rounded bg-card text-foreground"><strong>Él/Ella/Ud:</strong> se</div>
                                    <div className="p-2 border rounded bg-card text-foreground"><strong>Ellos/Ellas:</strong> se</div>
                                </div>
                            </div>
                            <div className="p-4 bg-primary/10 rounded-xl border-2 border-dashed border-primary/20 text-foreground">
                                <p className="font-black text-primary uppercase mb-2">Conjugación (Ej: LAVARSE):</p>
                                <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
                                    <li>Yo <strong>me lavo</strong></li>
                                    <li>Nosotros <strong>nos lavamos</strong></li>
                                    <li>Tú <strong>te lavas</strong></li>
                                    <li>Él/Ella <strong>se lava</strong></li>
                                    <li>Ellos <strong>se lavan</strong></li>
                                </ul>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('gramatica')} size="lg" className="px-12 font-bold text-white">He comprendido</Button></CardFooter>
                    </Card>
                );
            case 'conjugar':
                const currentVerb = conjugarVerbsList[conjVerbsIdx];
                const persons = ["Yo", "Tú", "Él/Ella/Ud", "Nosotros", "Ellos/Ellas/Uds"];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'>
                            <div className='flex justify-between items-center'>
                                <div>
                                    <CardTitle className='text-primary uppercase'>Misión: Conjugar</CardTitle>
                                    <CardDescription>Conjuga el verbo reflexivo para todas las personas en presente.</CardDescription>
                                </div>
                                <div className='text-right'><p className='text-xs font-bold text-muted-foreground uppercase tracking-widest'>VERBO {conjVerbsIdx + 1} DE {conjugarVerbsList.length}</p></div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6 text-foreground">
                            <div className='text-center p-6 bg-primary/10 rounded-3xl border-2 border-primary/20'><h3 className='text-4xl font-black text-primary uppercase tracking-tighter'>{currentVerb}</h3></div>
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                {persons.map((p, i) => (
                                    <div key={i} className='space-y-1'>
                                        <Label className='font-bold ml-1'>{p}:</Label>
                                        <Input 
                                            value={conjAnswers[conjVerbsIdx]?.[i] || ''} 
                                            onChange={e => {
                                                const nv = { ...conjAnswers };
                                                const currentArr = nv[conjVerbsIdx] || Array(5).fill('');
                                                currentArr[i] = e.target.value;
                                                nv[conjVerbsIdx] = currentArr;
                                                setConjAnswers(nv);
                                                setConjValidation(prev => ({ ...prev, [conjVerbsIdx]: undefined }));
                                            }}
                                            className={cn("h-11 font-mono lowercase border-2", conjValidation[conjVerbsIdx]?.[i] === 'correct' ? 'border-green-500 bg-green-50/5' : conjValidation[conjVerbsIdx]?.[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')}
                                            autoComplete='off'
                                            placeholder="me ..."
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/20"><Button onClick={handleConjCheck} size="lg" className="px-24 font-black h-14 text-xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground">Verificar Verbo <ArrowRight className='ml-2'/></Button></CardFooter>
                    </Card>
                );
            case 'ejercicio1': return <BallsExercise title="Ejercicio 1" prompts={ex1Prompts} onComplete={() => handleTopicComplete('ejercicio1')} />;
            case 'ejercicio2': return <BallsExercise title="Ejercicio 2" prompts={ex2Prompts} onComplete={() => handleTopicComplete('ejercicio2')} />;
            case 'ejercicio3': return <BallsExercise title="Ejercicio 3" prompts={ex3Prompts} onComplete={() => handleTopicComplete('ejercicio3')} />;
            case 'vocab_game':
                return <VocabularyMatchingGame data={reflexiveVocab.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Misión: Parejas Reflexivas" />;
            case 'lectura':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-foreground'>{readingData.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-inner">{readingData.content}</div>
                            <Separator />
                            <div className="space-y-4 text-foreground">
                                {readingData.questions.map((q, i) => (
                                    <div key={i} className="space-y-2">
                                        <Label className="font-bold">{q.q}</Label>
                                        <Input value={readingAns[i] || ''} onChange={e => { const na = [...readingAns]; na[i] = e.target.value; const nv = [...readingVal]; nv[i] = 'unchecked'; setReadingVal(nv as any); }} className={cn("h-10 text-foreground", readingVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : readingVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={handleCheckReading} size="lg" className="px-12 font-bold text-white">Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'final_ex':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-foreground'>Ejercicio Final: Conjugación Adecuada</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <ScrollArea className="h-[400px] pr-4">
                                <div className="space-y-4 text-foreground">
                                    {finalExPrompts.map((q, i) => (
                                        <div key={i} className="flex flex-col gap-2 p-3 bg-muted/20 rounded-xl border">
                                            <p className="font-medium text-lg">{q.sentence}</p>
                                            <Input 
                                                value={finalAns[i] || ''} 
                                                onChange={e => { const na = [...finalAns]; na[i] = e.target.value; const nv = [...finalVal]; nv[i] = 'unchecked'; setFinalVal(nv as any); }} 
                                                className={cn("h-10 max-w-[200px] text-foreground", finalVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : finalVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} 
                                                placeholder="Conjugación..."
                                                autoComplete="off"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={handleCheckFinal} size="lg" className="px-20 font-black h-14 text-xl text-white">Siguiente Paso</Button></CardFooter>
                    </Card>
                );
            case 'traducir_texto':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className='text-primary uppercase'>Traducción de Texto</CardTitle>
                                    <CardDescription className='font-bold text-foreground'>Traduce el siguiente texto al español usando los verbos reflexivos que aprendiste.</CardDescription>
                                </div>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse">
                                            <BookText className="mr-2 h-4 w-4" /> Vocabulario
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64">
                                        <ScrollArea className="h-64 pr-4">
                                            <div className="space-y-2">
                                                <h4 className='font-black text-primary text-xs uppercase mb-2 border-b'>Ayuda de Traducción</h4>
                                                {Object.entries(translationVocabHelp).map(([en, es], i) => (
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
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-sm">
                                "Every morning, I wake up at six. I get up and I shower with cold water. Then, I wash my face and I shave. My wife Elena gets up later. She washes her face and she puts on makeup quickly. We have breakfast together and then we prepare ourselves to go to work."
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label>
                                <Textarea 
                                    value={translationText}
                                    onChange={(e) => setTranslationText(e.target.value)}
                                    placeholder="Escribe el texto en español aquí..."
                                    className="min-h-[200px] text-lg leading-relaxed"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20">
                            <Button onClick={handleFinishClass} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">
                                Terminar <Trophy className='ml-3 h-8 w-8' />
                            </Button>
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
                    {targetStudentId && isAdmin && (
                        <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400">
                                <Star className="h-6 w-6 fill-current" />
                                <p className="font-bold uppercase tracking-tight text-sm">Modo Supervisión: {studentProfile?.name || targetStudentId}</p>
                            </div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700"><Link href="/admin">Cerrar</Link></Button>
                        </div>
                    )}
                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/a2" className="hover:underline text-sm font-bold flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver al Curso A2</Link>
                        <h1 className="text-4xl font-black [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)] uppercase tracking-tight">Reflexivos Regulares 🇪🇸</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader><CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2"><Star className="h-5 w-5 fill-primary" /> Tu Misión</CardTitle></CardHeader>
                                <CardContent>
                                    <nav><ul className="space-y-1">
                                        {learningPath.map(item => {
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            const isSelected = selectedTopic === item.key;
                                            const Icon = item.icon;
                                            return (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', isSelected && 'bg-muted text-primary font-black border-l-4 border-primary')}>
                                                    <div className="flex items-center gap-3">
                                                        {item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500" : "text-primary")} />}
                                                        <span className="truncate">{item.name}</span>
                                                    </div>
                                                    {isLocked && <Lock className="h-4 w-4 text-yellow-500/50" />}
                                                </li>
                                            );
                                        })}
                                    </ul></nav>
                                    <div className="mt-6 pt-6 border-t">
                                        <div className="flex justify-between items-center text-xs mb-2 font-black uppercase text-muted-foreground"><span>Avance</span><span className="text-primary">{progressValue}%</span></div>
                                        <Progress value={progressValue} className="h-2" />
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

export default function ReflexivosRegularesPage() {
    return (<Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>}><ReflexivosRegularesContent /></Suspense>);
}
