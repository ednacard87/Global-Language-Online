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
    Star,
    Loader2,
    Pencil,
    ListChecks,
    Check,
    X,
    Info,
    ArrowRight
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

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_a2_pasado_reg_v3_final_update';
const mainProgressKey = 'progress_a2_es_6'; // Mapeado al Dashboard A2

// --- DATA ---

const pastRegularsVocab = [
    { en: "TO TALK", es: "HABLAR" },
    { en: "TO EAT", es: "COMER" },
    { en: "TO VIVE", es: "VIVIR" },
    { en: "TO STUDY", es: "ESTUDIAR" },
    { en: "TO WORK", es: "TRABAJAR" },
    { en: "TO WALK", es: "CAMINAR" },
    { en: "TO JUMP", es: "SALTAR" },
    { en: "TO LOVE", es: "AMAR" },
    { en: "TO SING", es: "CANTAR" },
    { en: "TO DANCE", es: "BAILAR" },
    { en: "TO WASH", es: "LAVAR" },
    { en: "TO CLEAN", es: "LIMPIAR" },
    { en: "TO CALL", es: "LLAMAR" },
    { en: "TO WATCH / LOOK", es: "MIRAR" },
    { en: "TO HAVE BREAKFAST", es: "DESAYUNAR" },
    { en: "TO HAVE LUNCH", es: "ALMORZAR" },
    { en: "TO HAVE DINNER", es: "CENAR" },
    { en: "TO COOK", es: "COCINAR" },
    { en: "TO BUY", es: "COMPRAR" },
    { en: "TO VISIT", es: "VISITAR" },
    { en: "TO LEARN", es: "APRENDER" },
    { en: "TO OPEN", es: "ABRIR" },
    { en: "TO CLOSE", es: "CERRAR" },
];

const ex1Prompts = [
    { spanish: "I spoke with my mother yesterday.", answer: ["yo hablé con mi madre ayer", "hablé con mi madre ayer"] },
    { spanish: "You ate pizza last night.", answer: ["tú comiste pizza anoche", "comiste pizza anoche"] },
    { spanish: "He lived in Spain 2 years ago.", answer: ["él vivió en españa hace dos años", "vivió en españa hace dos años"] },
    { spanish: "We studied for the exam.", answer: ["nosotros estudiamos para el examen", "estudiamos para el examen"] },
    { spanish: "They worked a lot last week.", answer: ["ellos trabajaron mucho la semana pasada", "trabajaron mucho la semana pasada"] },
    { spanish: "She walked in the park in the morning.", answer: ["ella caminó en el parque por la mañana", "caminó en el parque por la mañana"] },
    { spanish: "You (plural) jumped very high.", answer: ["ustedes saltaron muy alto", "saltaron muy alto"] },
];

const ex2Prompts = [
    { spanish: "I loved that book.", answer: ["yo amé ese libro", "amé ese libro"] },
    { spanish: "You sang your favorite song.", answer: ["tú cantaste tu canción favorita", "cantaste tu canción favorita"] },
    { spanish: "He danced at the party.", answer: ["él bailó en la fiesta", "bailó en la fiesta"] },
    { spanish: "We washed the dishes.", answer: ["nosotros lavamos los platos", "lavamos los platos"] },
    { spanish: "They cleaned the house on Saturday.", answer: ["ellas limpiaron la casa el sábado", "ellas limpiaron la casa el sabado", "limpiaron la casa el sábado"] },
    { spanish: "I called my friend later.", answer: ["yo llamé a mi amigo más tarde", "llamé a mi amigo más tarde"] },
    { spanish: "He watched television at night.", answer: ["él miró la televisión por la noche", "miró la televisión por la noche", "él miró televisión", "miró la tele"] },
    { spanish: "We had breakfast (eggs and coffee).", answer: ["nosotros desayunamos huevos y café", "desayunamos huevos y café"] },
];

const ex3Prompts = [
    { spanish: "I had lunch in an Italian restaurant.", answer: ["yo almorcé en un restaurante italiano", "almorcé en un restaurante italiano"] },
    { spanish: "They had dinner (salad).", answer: ["ellas cenaron ensalada", "cenaron ensalada", "ellos cenaron ensalada"] },
    { spanish: "You cooked a delicious pasta.", answer: ["tú cocinaste una pasta deliciosa", "cocinaste una pasta deliciosa"] },
    { spanish: "He bought a new car last month.", answer: ["él compró un carro nuevo el mes pasado", "compró un carro nuevo el mes pasado"] },
    { spanish: "We visited our grandparents.", answer: ["nosotros visitamos a nuestros abuelos", "visitamos a nuestros abuelos"] },
    { spanish: "I learned a lot in the class.", answer: ["yo aprendí mucho en la clase", "aprendí mucho en la clase"] },
    { spanish: "She opened the window.", answer: ["ella abrió la ventana", "abrió la ventana"] },
    { spanish: "They closed the door.", answer: ["ellos cerraron la puerta", "cerraron la puerta"] },
    { spanish: "You lived in that city for a long time.", answer: ["tú viviste en esa ciudad por mucho tiempo", "viviste en esa ciudad por mucho tiempo"] },
    { spanish: "I worked in that company last year.", answer: ["yo trabajé en esa empresa el año pasado", "trabajé en esa empresa el año pasado"] },
];

const ex4OptionsPrompts = [
    { sentence: "1. Ayer mi hermano _______ (trabajar) hasta tarde.", options: ["trabajé", "trabajó", "trabajamos"], answer: "trabajó" },
    { sentence: "2. Nosotros _______ (comer) pasta para el almuerzo.", options: ["comiste", "comieron", "comimos"], answer: "comimos" },
    { sentence: "3. Yo _______ (vivir) en Londres hace cinco años.", options: ["viví", "vivió", "viviste"], answer: "viví" },
    { sentence: "4. ¿Tú _______ (llamar) a tu jefe esta mañana?", options: ["llamé", "llamaste", "llamó"], answer: "llamaste" },
    { sentence: "5. Los niños _______ (saltar) en el jardín.", options: ["saltó", "saltamos", "saltaron"], answer: "saltaron" },
    { sentence: "6. Ella _______ (abrir) la caja de regalo.", options: ["abrió", "abrí", "abriste"], answer: "abrió" },
    { sentence: "7. Nosotros _______ (visitar) el museo el domingo.", options: ["visité", "visitamos", "visitaron"], answer: "visitamos" },
    { sentence: "8. Mi mamá _______ (cocinar) un pastel de chocolate.", options: ["cociné", "cocinó", "cocinaste"], answer: "cocinó" },
    { sentence: "9. Ellos _______ (aprender) a bailar salsa.", options: ["aprendí", "aprendieron", "aprendimos"], answer: "aprendieron" },
    { sentence: "10. Yo _______ (limpiar) mi habitación el viernes.", options: ["limpió", "limpiaste", "limpié"], answer: "limpié" },
];

const readingData = {
    title: "Unas vacaciones inolvidables",
    content: "El verano pasado, mi familia y yo viajamos a la costa. Nosotros alquilamos una casa pequeña cerca de la playa. El primer día, yo caminé por la arena y mi hermano nadó en el mar. Por la tarde, mi madre cocinó pescado fresco y nosotros cenamos en el balcón. El martes, visitamos un parque natural y aprendimos mucho sobre las plantas locales. Mis padres compraron muchos recuerdos y nosotros bailamos en un festival por la noche. ¡Nosotros disfrutamos mucho el viaje!",
    questions: [
        { q: "¿A dónde viajó la familia el verano pasado?", a: ["a la costa", "viajaron a la costa"] },
        { q: "¿Qué hizo el narrador el primer día?", a: ["caminó por la arena", "caminar por la arena"] },
        { q: "¿Qué cocinó la madre por la tarde?", a: ["pescado", "pescado fresco", "cocinó pescado"] },
        { q: "¿Qué hicieron el martes?", a: ["visitaron un parque natural", "visitar un parque", "aprendieron sobre plantas"] },
        { q: "¿Qué compraron los padres?", a: ["recuerdos", "muchos recuerdos"] },
    ]
};

const completionPrompts = [
    { sentence: "1. Yo _______ (estudiar) español ayer.", answer: "estudié" },
    { sentence: "2. Tú _______ (comer) ensalada hoy.", answer: "comiste" },
    { sentence: "3. Ella _______ (vivir) en esa casa.", answer: "vivió" },
    { sentence: "4. Nosotros _______ (caminar) mucho.", answer: "caminamos" },
    { sentence: "5. Ellos _______ (aprender) la lección.", answer: "aprendieron" },
    { sentence: "6. Ustedes _______ (llamar) tarde.", answer: "llamaron" },
    { sentence: "7. Él _______ (abrir) la puerta.", answer: "abrió" },
    { sentence: "8. Mi padre _______ (trabajar) el sábado.", answer: "trabajó" },
    { sentence: "9. Nosotros _______ (limpiar) el baño.", answer: "limpiamos" },
    { sentence: "10. Yo _______ (amar) la película.", answer: "amé" },
    { sentence: "11. Ella _______ (cantar) su canción favorita.", answer: "cantó" },
    { sentence: "12. Nosotros _______ (desayunar) a las 8.", answer: "desayunamos" },
    { sentence: "13. Ellos _______ (almorzar) tarde.", answer: "almorzaron" },
    { sentence: "14. Tú _______ (cerrar) la ventana.", answer: "cerraste" },
    { sentence: "15. Yo _______ (cocinar) pollo.", answer: "cociné" },
    { sentence: "16. Él _______ (saltar) la cuerda.", answer: "saltó" },
    { sentence: "17. Nosotros _______ (bailar) toda la noche.", answer: "bailamos" },
    { sentence: "18. Ellas _______ (lavar) la ropa.", answer: "lavaron" },
    { sentence: "19. Yo _______ (mirar) el cielo.", answer: "miré" },
    { sentence: "20. Tú _______ (visitar) el museo.", answer: "visitaste" },
    { sentence: "21. Ella _______ (aprender) francés.", answer: "aprendió" },
    { sentence: "22. Nosotros _______ (abrir) los regalos.", answer: "abrimos" },
    { sentence: "23. Ellos _______ (estudiar) mucho.", answer: "estudiaron" },
    { sentence: "24. Tú _______ (caminar) por la playa.", answer: "caminaste" },
    { sentence: "25. Yo _______ (comer) una manzana.", answer: "comí" },
    { sentence: "26. Él _______ (vivir) en Londres.", answer: "vivió" },
    { sentence: "27. Nosotros _______ (trabajar) ayer.", answer: "trabajamos" },
    { sentence: "28. Ustedes _______ (limpiar) la cocina.", answer: "limpiaron" },
    { sentence: "29. Yo _______ (llamar) a mi hermano.", answer: "llamé" },
    { sentence: "30. Ellas _______ (cocinar) la cena.", answer: "cocinaron" },
];

const finalConjugationVerbs = [
    "HABLAR", "COMER", "VIVIR", "ESTUDIAR", "TRABAJAR", 
    "CAMINAR", "SALTAR", "AMAR", "CANTAR", "BAILAR", 
    "LAVAR", "LIMPIAR", "LLAMAR", "MIRAR", "COCINAR"
];

const globalVocabMap: Record<string, string> = pastRegularsVocab.reduce((acc, curr) => {
    acc[curr.es.toLowerCase()] = curr.en.toLowerCase();
    return acc;
}, {} as Record<string, string>);

// --- HELPER COMPONENTS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setAnswer(''); }, [currentIndex]);

    const handleCheck = () => {
        const userVal = answer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const isCorrect = prompts[currentIndex].answer.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
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
                        <CardDescription className="font-bold text-foreground mt-1">Traduce la frase al español usando pasado regular.</CardDescription>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger>
                        <PopoverContent className="w-64"><ScrollArea className="h-64 pr-4"><div className="space-y-2 text-foreground text-left"><h4 className='font-black text-primary text-xs uppercase mb-2 border-b'>Ayuda de Misión</h4>{Object.entries(vocabulary || globalVocabMap).map(([es, en]: any, i) => (<div key={i} className="flex justify-between text-[10px] border-b border-muted pb-1"><span className="text-muted-foreground text-left uppercase">{en}:</span><span className="font-bold text-right text-primary">{es.toUpperCase()}</span></div>))}</div></ScrollArea></PopoverContent>
                    </Popover>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">{prompts[currentIndex].spanish}</div>
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

const ChoiceExercise = ({ prompts, onComplete, title }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    const handleSelect = (option: string) => {
        const isCorrect = option === prompts[currentIndex].answer;
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Correcto!" });
        else toast({ variant: 'destructive', title: "Incorrecto" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className='text-left'>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription className='font-bold text-foreground mt-1'>Elige la opción gramaticalmente correcta.</CardDescription>
                    <div className="flex gap-2 justify-start flex-wrap pt-4">
                        {prompts.map((_: any, i: number) => (
                            <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-8 py-10">
                <div className="text-2xl font-bold text-center leading-relaxed">
                    {prompts[currentIndex].sentence.split('_______').map((part: string, i: number) => (
                        <React.Fragment key={i}>{part}{i < prompts[currentIndex].sentence.split('_______').length - 1 && (<span className="text-primary border-b-2 border-dashed border-primary px-4 mx-2">{status[currentIndex] === 'correct' ? prompts[currentIndex].answer : '...'}</span>)}</React.Fragment>
                    ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
                    {prompts[currentIndex].options.map((opt: string) => (
                        <Button key={opt} onClick={() => handleSelect(opt)} variant="outline" className={cn("h-14 text-lg font-black uppercase", status[currentIndex] === 'correct' && opt === prompts[currentIndex].answer && "border-green-500 bg-green-50 text-green-700")}>{opt}</Button>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={status[currentIndex] !== 'correct'} className="px-12 font-bold">Siguiente</Button>
            </CardFooter>
        </Card>
    );
};

// --- MAIN CONTENT COMPONENT ---

function PasadoRegularesContent() {
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

    // States for content
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(pastRegularsVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(pastRegularsVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const [readingAns, setReadingAns] = useState<string[]>(Array(readingData.questions.length).fill(''));
    const [readingVal, setReadingVal] = useState<any[]>(Array(readingData.questions.length).fill('unchecked'));

    const [compAns, setCompAns] = useState<string[]>(Array(completionPrompts.length).fill(''));
    const [compVal, setCompVal] = useState<any[]>(Array(completionPrompts.length).fill('unchecked'));

    const [finalVerbsIdx, setFinalVerbsIdx] = useState(0);
    const [finalVerbsAns, setFinalVerbsAns] = useState<Record<number, string[]>>({});
    const [finalVerbsVal, setFinalVerbsVal] = useState<Record<number, any[]>>({});

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    
    const { data: authUserProfile } = useDoc<{ role?: string }>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string, lessonProgress?: any, progress?: any, name?: string }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialLearningPath = useMemo(() => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: '2. Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'exercise1', name: '3. Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'exercise2', name: '4. Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '5. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'exercise3', name: '6. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: '7. Lectura', icon: BookText, status: 'locked' },
        { key: 'exercise4', name: '8. Ejercicio 4', icon: PenSquare, status: 'locked' },
        { key: 'completar', name: '9. Completar', icon: Pencil, status: 'locked' },
        { key: 'final_ex', name: '10. Ejercicio Final', icon: Trophy, status: 'locked' },
    ], []);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;

        let path = initialLearningPath.map(topic => ({ ...topic }));
        let savedST = '';

        if (isAdmin && !targetStudentId) {
            path.forEach(item => { (item as any).status = 'completed'; });
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedData = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => { if (savedData[item.key]) (item as any).status = savedData[item.key]; });
            savedST = savedData.lastSelectedTopic || '';
        }

        let lastDone = true;
        for (let i = 0; i < path.length; i++) {
            if (lastDone && (path[i] as any).status === 'locked') (path[i] as any).status = 'active';
            lastDone = (path[i] as any).status === 'completed';
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
            let wasUnlocked = false; let next: string | null = null;
            const newPath = currentPath.map(t => ({ ...t }));
            const idx = newPath.findIndex(t => t.key === topicToComplete);
            if (idx !== -1 && newPath[idx].status !== 'completed') {
                newPath[idx].status = 'completed';
                if (idx + 1 < newPath.length && newPath[idx + 1].status === 'locked') {
                    newPath[idx + 1].status = 'active'; wasUnlocked = true; next = newPath[idx + 1].key;
                }
            }
            if (wasUnlocked) setTimeout(() => toast({ title: "¡Siguiente misión desbloqueada!" }), 0);
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

    const handleCheckVocab = () => {
        let allOk = true;
        const nv = pastRegularsVocab.map((item, idx) => {
            const isCorrect = item.es.toLowerCase() === (vocabAnswers[idx] || '').trim().toLowerCase();
            if (!isCorrect) allOk = false;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv as any);
        setCanAdvanceVocab(allOk);
        if (allOk) { toast({ title: "¡Excelente!" }); handleTopicComplete('vocabulary'); }
        else { toast({ variant: 'destructive', title: "Sigue intentando" }); }
    };

    const handleCheckReading = () => {
        let ok = true;
        const nv = readingData.questions.map((q, i) => {
            const isCorrect = q.a.some(ans => (readingAns[i] || '').trim().toLowerCase().includes(ans.toLowerCase()));
            if (!isCorrect) ok = false;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setReadingVal(nv as any);
        if (ok) { toast({ title: "¡Muy bien!" }); handleTopicComplete('reading'); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const handleCheckComp = () => {
        let ok = true;
        const nv = completionPrompts.map((q, i) => {
            const isCorrect = q.answer.toLowerCase() === (compAns[i] || '').trim().toLowerCase();
            if (!isCorrect) ok = false;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setCompVal(nv as any);
        if (ok) { toast({ title: "¡Perfecto!" }); handleTopicComplete('completar'); }
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const handleFinalVerbsCheck = () => {
        const currentVerb = finalConjugationVerbs[finalVerbsIdx];
        const answers = finalVerbsAns[finalVerbsIdx] || Array(5).fill('');
        const base = currentVerb.toLowerCase().slice(0, -2);
        const ending = currentVerb.toLowerCase().slice(-2);
        
        let corrects: string[] = [];
        if (ending === 'ar') corrects = [base + 'é', base + 'aste', base + 'ó', base + 'amos', base + 'aron'];
        else corrects = [base + 'í', base + 'iste', base + 'ió', base + 'imos', base + 'ieron'];

        const nv = answers.map((ans, i) => ans.trim().toLowerCase() === corrects[i] ? 'correct' : 'incorrect');
        setFinalVerbsVal(p => ({ ...p, [finalVerbsIdx]: nv }));

        if (nv.every(v => v === 'correct')) {
            toast({ title: "¡Verbo conjugado correctamente!" });
            if (finalVerbsIdx < finalConjugationVerbs.length - 1) setFinalVerbsIdx(v => v + 1);
            else handleTopicComplete('final_ex');
        } else toast({ variant: "destructive", title: "Hay errores en la conjugación" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex flex-col items-center justify-center min-h-[400px]"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /></div>;

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'>
                            <CardTitle className="text-primary uppercase">Vocabulario: Pasado Regulares</CardTitle>
                            <CardDescription className='font-bold text-foreground'>Escribe el significado en español para cada verbo.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ScrollArea className="h-[450px] pr-4">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                    <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">English</div>
                                    <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Español</div>
                                    {pastRegularsVocab.map((v, i) => (
                                        <React.Fragment key={i}>
                                            <div className="flex items-center font-bold py-1 uppercase">{v.en}</div>
                                            <Input value={vocabAnswers[i] || ''} onChange={e => handleVocabChange(i, e.target.value)} className={cn("h-10 uppercase font-mono border-2", vocabValidation[i] === 'correct' ? 'border-green-500' : vocabValidation[i] === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" />
                                        </React.Fragment>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 bg-muted/20">
                            <Button onClick={handleCheckVocab} variant="secondary">Verificar Vocabulario</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-foreground text-left overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Pretérito Indefinido (Pasado Regular)</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <p className="text-lg font-bold mb-4">El pasado regular en español se forma quitando la terminación del infinitivo (-ar, -er, -ir) y añadiendo sufijos específicos.</p>
                                <Separator className='my-6'/>
                                <div className='grid gap-6 md:grid-cols-2'>
                                    <div className='p-5 bg-primary/10 rounded-2xl border border-primary/20 space-y-4'>
                                        <h4 className='font-black text-primary uppercase text-sm border-b pb-1'>Terminados en -AR (Ej: Hablar)</h4>
                                        <ul className='space-y-1 font-mono text-sm'>
                                            <li className='flex justify-between'><span>Yo:</span> <span className='font-bold'>-é</span></li>
                                            <li className='flex justify-between'><span>Tú:</span> <span className='font-bold'>-aste</span></li>
                                            <li className='flex justify-between'><span>Él/Ella/Ud:</span> <span className='font-bold'>-ó</span></li>
                                            <li className='flex justify-between'><span>Nosotros:</span> <span className='font-bold'>-amos</span></li>
                                            <li className='flex justify-between'><span>Ellos/Uds:</span> <span className='font-bold'>-aron</span></li>
                                        </ul>
                                    </div>
                                    <div className='p-5 bg-brand-purple/10 rounded-2xl border border-brand-purple/20 space-y-4'>
                                        <h4 className='font-black text-brand-purple uppercase text-sm border-b pb-1'>Terminados en -ER / -IR (Ej: Comer/Vivir)</h4>
                                        <ul className='space-y-1 font-mono text-sm'>
                                            <li className='flex justify-between'><span>Yo:</span> <span className='font-bold'>-í</span></li>
                                            <li className='flex justify-between'><span>Tú:</span> <span className='font-bold'>-iste</span></li>
                                            <li className='flex justify-between'><span>Él/Ella/Ud:</span> <span className='font-bold'>-ió</span></li>
                                            <li className='flex justify-between'><span>Nosotros:</span> <span className='font-bold'>-imos</span></li>
                                            <li className='flex justify-between'><span>Ellos/Uds:</span> <span className='font-bold'>-ieron</span></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">He comprendido la gramática</Button></CardFooter>
                    </Card>
                );
            case 'exercise1': return <BallsExercise title="Ejercicio 1" prompts={ex1Prompts} onComplete={() => handleTopicComplete('exercise1')} />;
            case 'exercise2': return <BallsExercise title="Ejercicio 2" prompts={ex2Prompts} onComplete={() => handleTopicComplete('exercise2')} />;
            case 'vocab_game':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
                        <CardHeader><CardTitle className='text-primary uppercase font-black'>Misión: Parejas del Pasado</CardTitle></CardHeader>
                        <CardContent><VocabularyMatchingGame data={pastRegularsVocab.slice(0, 10).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Encuentra las parejas de verbos" /></CardContent>
                    </Card>
                );
            case 'exercise3': return <BallsExercise title="Ejercicio 3" prompts={ex3Prompts} onComplete={() => handleTopicComplete('exercise3')} />;
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
                                    <div key={i} className="space-y-2 p-3 bg-muted/20 rounded-xl border">
                                        <Label className="font-bold">{q.q}</Label>
                                        <Input value={readingAns[i] || ''} onChange={e => { const na = [...readingAns]; na[i] = e.target.value; setReadingAns(na); setReadingVal(v => { const nv = [...v]; nv[i] = 'unchecked'; return nv as any; }); }} className={cn("h-10 text-foreground", readingVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : readingVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/10"><Button onClick={handleCheckReading} size="lg" className="px-16 font-black h-12 shadow-md">Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'exercise4': return <ChoiceExercise title="Ejercicio 4: Elige el correcto" prompts={ex4OptionsPrompts} onComplete={() => handleTopicComplete('exercise4')} />;
            case 'completar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase'>Misión: Completar Frases</CardTitle></CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[450px] p-6">
                                <div className="space-y-4">
                                    {completionPrompts.map((q, i) => (
                                        <div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm">
                                            <p className="font-bold text-lg">{q.sentence}</p>
                                            <Input value={compAns[i] || ''} onChange={e => { const na = [...compAns]; na[i] = e.target.value; setCompAns(na); setCompVal(v => { const nv = [...v]; nv[i] = 'unchecked'; return nv as any; }); }} className={cn("h-10 max-w-[200px] text-lg font-mono border-2", compVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : compVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder="Respuesta..." autoComplete="off" />
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/20"><Button onClick={handleCheckComp} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">Verificar Respuestas</Button></CardFooter>
                    </Card>
                );
            case 'final_ex':
                const currentVerb = finalConjugationVerbs[finalVerbsIdx];
                const persons = ["Yo", "Tú", "Él/Ella/Ud", "Nosotros", "Ellos/Ellas/Uds"];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'>
                            <div className='flex justify-between items-center'>
                                <div>
                                    <CardTitle className='text-primary uppercase'>Ejercicio Final: Conjugación Completa</CardTitle>
                                    <CardDescription>Conjuga el verbo en todas sus formas del pasado regular.</CardDescription>
                                </div>
                                <div className='text-right'><p className='text-xs font-bold text-muted-foreground uppercase tracking-widest'>VERBO {finalVerbsIdx + 1} DE {finalConjugationVerbs.length}</p></div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className='text-center p-6 bg-primary/10 rounded-3xl border-2 border-primary/20'><h3 className='text-4xl font-black text-primary uppercase tracking-tighter'>{currentVerb}</h3></div>
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                {persons.map((p, i) => (
                                    <div key={i} className='space-y-1'>
                                        <Label className='font-bold ml-1'>{p}:</Label>
                                        <Input 
                                            value={finalVerbsAns[finalVerbsIdx]?.[i] || ''} 
                                            onChange={e => {
                                                const nv = { ...finalVerbsAns };
                                                const currentArr = nv[finalVerbsIdx] || Array(5).fill('');
                                                currentArr[i] = e.target.value;
                                                nv[finalVerbsIdx] = currentArr;
                                                setFinalVerbsAns(nv);
                                                setFinalVerbsVal(prev => ({ ...prev, [finalVerbsIdx]: undefined }));
                                            }}
                                            className={cn("h-11 font-mono uppercase border-2", finalVerbsVal[finalVerbsIdx]?.[i] === 'correct' ? 'border-green-500 bg-green-50/5' : finalVerbsVal[finalVerbsIdx]?.[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')}
                                            autoComplete='off'
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/20"><Button onClick={handleFinalVerbsCheck} size="lg" className="px-24 font-black h-14 text-xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground">Finalizar Verbo <ArrowRight className='ml-2'/></Button></CardFooter>
                    </Card>
                );
            default: return null;
        }
    };

    const handleVocabChange = (idx: number, val: string) => {
        const na = [...vocabAnswers]; na[idx] = val; setVocabAnswers(na);
        const nv = [...vocabValidation]; nv[idx] = 'unchecked'; setVocabValidation(nv as any);
        setCanAdvanceVocab(false);
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
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors"><Link href="/admin">Cerrar Supervisión</Link></Button>
                        </div>
                    )}

                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/a2" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver al Curso A2</Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight">Pasado Regulares 🇪🇸</h1>
                    </div>

                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
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

export default function PasadoRegularesPage() {
    return (<Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}><PasadoRegularesContent /></Suspense>);
}
