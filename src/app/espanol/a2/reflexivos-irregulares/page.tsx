'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense, useRef } from 'react';
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
    Info,
    HelpCircle,
    Check,
    X,
    Search
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_a2_reflex_irreg_v2_final_content';
const mainProgressKey = 'progress_a2_es_reflexivos_irregulares';

// --- DATA ---

const irregularVerbsVocab = [
    { en: "TO WAKE UP", es: "DESPERTARSE" },
    { en: "TO GO TO BED", es: "ACOSTARSE" },
    { en: "TO GET DRESSED", es: "VESTIRSE" },
    { en: "TO HAVE FUN", es: "DIVERTIRSE" },
    { en: "TO FALL ASLEEP", es: "DORMIRSE" },
    { en: "TO FEEL", es: "SENTIRSE" },
    { en: "TO SAY GOODBYE", es: "DESPEDIRSE" },
    { en: "TO LAUGH", es: "REÍRSE" },
    { en: "TO SIT DOWN", es: "SENTARSE" },
    { en: "TO TRY ON", es: "PROBARSE" },
    { en: "TO REMEMBER", es: "ACORDARSE" },
    { en: "TO MEET (WITH SOMEONE)", es: "ENCONTRARSE" },
    { en: "TO BECOME", es: "VOLVERSE" },
    { en: "TO REGRATE / SORRY", es: "ARREPENTIRSE" },
    { en: "TO MEASURE ONESELF", es: "MEDIRSE" },
    { en: "TO SERVE ONESELF", es: "SERVIRSE" },
    { en: "TO BITE ONE'S (LIPS/NAILS)", es: "MORDERSE" },
    { en: "TO TWIST (ANKLE/WRIST)", es: "TORCERSE" },
];

const ex1Prompts = [
    { en: "I wake up at 6 am.", es: ["yo me despierto a las seis", "me despierto a las seis"] },
    { en: "He goes to bed early.", es: ["él se acuesta temprano", "se acuesta temprano"] },
    { en: "We have fun at the party.", es: ["nosotros nos divertimos en la fiesta", "nos divertimos en la fiesta"] },
    { en: "They get dressed in the room.", es: ["ellos se visten en el cuarto", "ellas se visten en el cuarto", "se visten en el cuarto"] },
    { en: "I feel happy.", es: ["yo me siento feliz", "me siento feliz"] },
    { en: "You sit on the chair.", es: ["tú te sientas en la silla", "te sientas en la silla"] },
    { en: "She says goodbye to her mother.", es: ["ella se despide de su madre", "se despide de su madre", "ella se despide de su mamá"] },
];

const ex2Prompts = [
    { en: "We fall asleep fast.", es: ["nosotros nos dormimos rápido", "nos dormimos rápido"] },
    { en: "I put on my jacket.", es: ["yo me pongo mi chaqueta", "me pongo mi chaqueta", "yo me pongo la chaqueta"] },
    { en: "They remember the date.", es: ["ellos se acuerdan de la fecha", "ellas se acuerdan de la fecha", "se acuerdan de la fecha"] },
    { en: "You try on the shoes.", es: ["tú te pruebas los zapatos", "te pruebas los zapatos"] },
    { en: "He becomes a professional.", es: ["él se vuelve un profesional", "se vuelve un profesional"] },
    { en: "We meet in the park.", es: ["nosotros nos encontramos en el parque", "nos encontramos en el parque"] },
    { en: "I get distracted easily.", es: ["yo me distraigo fácilmente", "me distraigo fácilmente"] },
    { en: "She laughs a lot.", es: ["ella se ríe mucho", "se ríe mucho"] },
];

const ex3Prompts = [
    { en: "They stay healthy.", es: ["ellos se mantienen saludables", "se mantienen saludables"] },
    { en: "I undo the knot.", es: ["yo me deshago del nudo", "me deshago del nudo"] },
    { en: "We move (transfer) to the city.", es: ["nosotros nos trasladamos a la ciudad", "nos trasladamos a la ciudad"] },
    { en: "You regret the decision.", es: ["tú te arrepientes de la decisión", "te arrepientes de la decisión"] },
    { en: "It breaks (gets broken).", es: ["se rompe", "eso se rompe"] },
    { en: "He gets lost in the street.", es: ["él se pierde en la calle", "se pierde en la calle"] },
    { en: "I have a seat.", es: ["yo me siento", "me siento"] },
    { en: "We say goodbye at the airport.", es: ["nosotros nos despedimos en el aeropuerto", "nos despedimos en el aeropuerto"] },
    { en: "They dress well.", es: ["ellos se visten bien", "ellas se visten bien", "se visten bien"] },
    { en: "I wake up late on Sundays.", es: ["yo me despierto tarde los domingos", "me despierto tarde los domingos"] },
];

const readingData = {
    title: "La rutina de Sofía",
    content: "Normalmente, Sofía se despierta muy temprano, pero no se levanta de inmediato. Ella se queda en la cama un poco más. A las siete, se viste rápidamente para ir a la oficina. En el trabajo, ella se siente muy motivada, pero por la tarde se cansa un poco. Cuando llega a casa, Sofía se divierte cocinando con su esposo. Ellos se ríen mucho juntos. Finalmente, ella se acuesta a las diez de la noche y se duerme en cinco minutos.",
    questions: [
        { q: "¿Sofía se levanta inmediatamente al despertar?", a: ["no", "no se levanta de inmediato"] },
        { q: "¿A qué hora se viste Sofía?", a: ["a las siete", "a las 7"] },
        { q: "¿Cómo se siente en el trabajo?", a: ["motivada", "se siente muy motivada"] },
        { q: "¿Qué hace Sofía con su esposo?", a: ["cocina", "se divierte cocinando", "cocinan"] },
        { q: "¿Cuánto tiempo tarda en dormirse?", a: ["cinco minutos", "5 minutos"] },
    ]
};

const finalExPrompts = [
    { sentence: "1. Yo _______ (despertarse) a las 5 am.", answer: "me despierto" },
    { sentence: "2. Nosotros _______ (divertirse) mucho en vacaciones.", answer: "nos divertimos" },
    { sentence: "3. Ellos _______ (acostarse) muy tarde hoy.", answer: "se acuestan" },
    { sentence: "4. Ella _______ (vestirse) de rojo para la fiesta.", answer: "se viste" },
    { sentence: "5. Tú _______ (sentarse) siempre en ese lugar.", answer: "te sientas" },
    { sentence: "6. Él _______ (sentirse) mal después de comer.", answer: "se siente" },
    { sentence: "7. Vosotros _______ (despedirse) de sus amigos.", answer: "os despedís" },
    { sentence: "8. El gato _______ (dormirse) bajo el sol.", answer: "se duerme" },
    { sentence: "9. Yo _______ (ponerse) la camisa nueva.", answer: "me pongo" },
    { sentence: "10. Nosotros _______ (acordarse) de tu cumpleaños.", answer: "nos acordamos" },
    { sentence: "11. Ellos _______ (encontrarse) en el centro comercial.", answer: "se encuentran" },
    { sentence: "12. Ustedes _______ (probarse) los pantalones azules.", answer: "se prueban" },
    { sentence: "13. Yo _______ (reírse) con tus chistes.", answer: "me río" },
    { sentence: "14. Ella _______ (volverse) loca con tanto trabajo.", answer: "se vuelve" },
    { sentence: "15. Nosotros _______ (mantenerse) en contacto por e-mail.", answer: "nos mantenemos" },
];

const globalVocabMap: Record<string, string> = irregularVerbsVocab.reduce((acc, curr) => {
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
                        <CardDescription className="font-bold text-foreground mt-1">Traduce la frase al español usando verbos reflexivos irregulares.</CardDescription>
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
                                <div className="space-y-2">
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

// --- MAIN CONTENT COMPONENT ---

function ReflexivosIrregularesContent() {
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
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(irregularVerbsVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(irregularVerbsVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const [readingAns, setReadingAns] = useState<string[]>(Array(readingData.questions.length).fill(''));
    const [readingVal, setReadingVal] = useState<any[]>(Array(readingData.questions.length).fill('unchecked'));

    const [finalAns, setFinalAns] = useState<string[]>(Array(finalExPrompts.length).fill(''));
    const [finalVal, setFinalVal] = useState<any[]>(Array(finalExPrompts.length).fill('unchecked'));

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
        { key: 'exercise3', name: '5. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'reading', name: '7. Lectura', icon: BookText, status: 'locked' },
        { key: 'final_ex', name: '8. Ejercicio Final', icon: Trophy, status: 'locked' },
    ], []);

    const handleTopicComplete = (completedKey: string) => {
        setTopicToComplete(completedKey);
    };

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

        if (progressValue >= 100) {
            window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
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
            
            if (wasUnlocked) setTimeout(() => toast({ title: "¡Siguiente misión desbloqueada!" }), 0);
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
            toast({ variant: "destructive", title: "Contenido Bloqueado", description: "Completa la misión anterior para avanzar." });
            return;
        }
        setSelectedTopic(topicKey);

        if (['grammar'].includes(topicKey)) {
            handleTopicComplete(topicKey);
        }
    };

    const handleCheckVocab = () => {
        let allOk = true;
        const nv = irregularVerbsVocab.map((item, idx) => {
            const isCorrect = item.es.toLowerCase() === (vocabAnswers[idx] || '').trim().toLowerCase();
            if (!isCorrect) allOk = false;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv as any);
        setCanAdvanceVocab(allOk);
        if (allOk) {
            toast({ title: "¡Excelente!", description: "Vocabulario completado correctamente." });
            handleTopicComplete('vocabulary');
        } else {
            toast({ variant: 'destructive', title: "Sigue intentando", description: "Revisa las palabras marcadas en rojo." });
        }
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
            toast({ title: "¡Muy bien!", description: "Comprensión superada." });
            handleTopicComplete('reading');
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
            toast({ title: "¡Misión Cumplida!", description: "Has dominado los verbos reflexivos irregulares." });
            handleTopicComplete('final_ex');
        } else {
            toast({ variant: 'destructive', title: "Sigue intentando" });
        }
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex flex-col items-center justify-center min-h-[400px]"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /></div>;

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
                        <CardHeader className='bg-primary/5 border-b'>
                            <CardTitle className="text-primary uppercase tracking-tight">Vocabulario: Verbos Reflexivos Irregulares</CardTitle>
                            <CardDescription className='font-bold text-foreground'>Escribe el significado en español para cada verbo.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs text-left">English</div>
                                <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs text-left">Español</div>
                                {irregularVerbsVocab.map((v, i) => (
                                    <React.Fragment key={i}>
                                        <div className="flex items-center font-bold text-left py-1">{v.en}</div>
                                        <Input 
                                            value={vocabAnswers[i] || ''} 
                                            onChange={e => { const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); setVocabValidation(v => { const nv = [...v]; nv[i] = 'unchecked'; return nv as any; }); }} 
                                            className={cn("h-10 uppercase font-mono border-2", vocabValidation[i] === 'correct' ? 'border-green-500' : vocabValidation[i] === 'incorrect' ? 'border-red-500' : '')} 
                                            autoComplete="off"
                                        />
                                    </React.Fragment>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 bg-muted/20">
                            <Button onClick={handleCheckVocab} variant="secondary">Verificar Vocabulario</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold px-12'>Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-foreground text-left overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Irregularidad Reflexiva</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <p className="text-lg font-bold mb-4">Los verbos reflexivos irregulares siguen las mismas reglas de pronombres (<span className="text-primary">me, te, se, nos, os, se</span>), pero su raíz cambia al conjugar.</p>
                                <Separator className='my-6'/>
                                <div className='grid gap-6 md:grid-cols-3'>
                                    <div className='p-4 bg-primary/10 rounded-xl border border-primary/20'>
                                        <h4 className='font-black text-primary uppercase text-sm mb-2'>Cambio e &rarr; ie</h4>
                                        <p className='text-xs italic'>Ejemplos: Despertarse, Divertirse, Sentarse, Sentirse.</p>
                                    </div>
                                    <div className='p-4 bg-brand-purple/10 rounded-xl border border-brand-purple/20'>
                                        <h4 className='font-black text-brand-purple uppercase text-sm mb-2'>Cambio o &rarr; ue</h4>
                                        <p className='text-xs italic'>Ejemplos: Acostarse, Dormirse, Probarse, Acordarse.</p>
                                    </div>
                                    <div className='p-4 bg-brand-blue/10 rounded-xl border border-brand-blue/20'>
                                        <h4 className='font-black text-brand-blue uppercase text-sm mb-2'>Cambio e &rarr; i</h4>
                                        <p className='text-xs italic'>Ejemplos: Vestirse, Despedirse, Reírse.</p>
                                    </div>
                                </div>
                            </div>

                            <div className='space-y-6'>
                                <h3 className='text-xl font-black text-primary uppercase tracking-tighter flex items-center gap-2'>
                                    <ListChecks className='h-6 w-6'/> Modelos de Conjugación
                                </h3>
                                <div className='grid gap-4 sm:grid-cols-3'>
                                    <Card className='p-4 border-2 border-brand-purple/20'>
                                        <h4 className='font-bold text-center border-b pb-2 mb-2'>DESPERTARSE (ie)</h4>
                                        <ul className='text-sm font-mono space-y-1 text-center'>
                                            <li>Me despierto</li>
                                            <li>Te despiertas</li>
                                            <li>Se despierta</li>
                                            <li>Nos despertamos*</li>
                                            <li>Se despiertan</li>
                                        </ul>
                                    </Card>
                                    <Card className='p-4 border-2 border-brand-purple/20'>
                                        <h4 className='font-bold text-center border-b pb-2 mb-2'>ACOSTARSE (ue)</h4>
                                        <ul className='text-sm font-mono space-y-1 text-center'>
                                            <li>Me acuesto</li>
                                            <li>Te acuestas</li>
                                            <li>Se acuesta</li>
                                            <li>Nos acostamos*</li>
                                            <li>Se acuestan</li>
                                        </ul>
                                    </Card>
                                    <Card className='p-4 border-2 border-brand-purple/20'>
                                        <h4 className='font-bold text-center border-b pb-2 mb-2'>VESTIRSE (i)</h4>
                                        <ul className='text-sm font-mono space-y-1 text-center'>
                                            <li>Me visto</li>
                                            <li>Te vistes</li>
                                            <li>Se viste</li>
                                            <li>Nos vestimos*</li>
                                            <li>Se visten</li>
                                        </ul>
                                    </Card>
                                </div>
                                <p className='text-xs text-muted-foreground italic text-center'>*Nota: "Nosotros" mantienen la raíz original sin cambio vocálico.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-16 font-black h-12 text-white shadow-lg">He comprendido la gramática</Button></CardFooter>
                    </Card>
                );
            case 'exercise1': return <BallsExercise title="Ejercicio 1" prompts={ex1Prompts} onComplete={() => handleTopicComplete('exercise1')} />;
            case 'exercise2': return <BallsExercise title="Ejercicio 2" prompts={ex2Prompts} onComplete={() => handleTopicComplete('exercise2')} />;
            case 'exercise3': return <BallsExercise title="Ejercicio 3" prompts={ex3Prompts} onComplete={() => handleTopicComplete('exercise3')} />;
            case 'vocab_game':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
                        <CardHeader><CardTitle className='text-primary uppercase font-black'>Misión: Parejas Irregulares</CardTitle></CardHeader>
                        <CardContent>
                            <VocabularyMatchingGame 
                                data={irregularVerbsVocab.slice(0, 10).map(v => ({ spanish: v.es, english: [v.en] }))} 
                                onComplete={() => handleTopicComplete('vocab_game')} 
                                title="Encuentra las parejas de verbos" 
                            />
                        </CardContent>
                    </Card>
                );
            case 'reading':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase'>{readingData.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-inner">{readingData.content}</div>
                            <Separator />
                            <div className="space-y-4 text-foreground">
                                <h3 className='font-black text-primary uppercase text-sm tracking-widest'>Preguntas de Comprensión:</h3>
                                {readingData.questions.map((q, i) => (
                                    <div key={i} className="space-y-2 p-3 bg-muted/20 rounded-xl border">
                                        <Label className="font-bold text-base">{q.q}</Label>
                                        <Input value={readingAns[i] || ''} onChange={e => { const na = [...readingAns]; na[i] = e.target.value; setReadingAns(na); const nv = [...readingVal]; nv[i] = 'unchecked'; setReadingVal(nv as any); }} className={cn("h-10 text-foreground", readingVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : readingVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/10"><Button onClick={handleCheckReading} size="lg" className="px-16 font-black h-12 shadow-md">Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'final_ex':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase'>Misión Final: Conjugación Precisa</CardTitle></CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[450px] p-6">
                                <div className="space-y-4 text-foreground">
                                    <p className='text-sm text-muted-foreground mb-4 italic'>Escribe la conjugación correcta del verbo entre paréntesis para el sujeto indicado.</p>
                                    {finalExPrompts.map((q, i) => (
                                        <div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm transition-all hover:bg-muted/20">
                                            <p className="font-bold text-lg">{q.sentence}</p>
                                            <Input 
                                                value={finalAns[i] || ''} 
                                                onChange={e => { const na = [...finalAns]; na[i] = e.target.value; setFinalAns(na); const nv = [...finalVal]; nv[i] = 'unchecked'; setFinalVal(nv as any); }} 
                                                className={cn("h-10 max-w-[220px] text-lg font-mono", finalVal[i] === 'correct' ? 'border-green-500 border-2' : finalVal[i] === 'incorrect' ? 'border-red-500 border-2' : '')} 
                                                placeholder="Respuesta..."
                                                autoComplete="off"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/20"><Button onClick={handleCheckFinal} size="lg" className="px-24 font-black h-14 text-xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground">Finalizar Misión <Trophy className='ml-2'/></Button></CardFooter>
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
                        <Link href="/espanol/a2" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2">
                            <ArrowLeft className="h-4 w-4" /> Volver al Curso A2
                        </Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight">
                            Reflexivos Irregulares 🇪🇸
                        </h1>
                    </div>

                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        {/* Contenido Principal */}
                        <div className="md:col-span-9 md:order-1 order-2">
                            {renderContent()}
                        </div>

                        {/* Sidebar de Ruta */}
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30">
                                    <CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-primary" />
                                        Misión A2
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
                                                            'flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer',
                                                            isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted',
                                                            isSelected && 'bg-muted text-primary font-black border-l-4 border-primary'
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
            <Footer />
        </div>
    );
}

// --- UTILS ---
const ListChecks = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>
    </svg>
);

export default function ReflexivosIrregularesPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
        }>
            <ReflexivosIrregularesContent />
        </Suspense>
    );
}
