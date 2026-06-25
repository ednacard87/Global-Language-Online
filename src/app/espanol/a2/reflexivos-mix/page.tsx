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
    Star,
    Loader2,
    Check,
    X,
    Info,
    ListChecks,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_a2_reflex_mix_v2_final_content';
const mainProgressKey = 'progress_a2_es_reflexivos_mix';

// --- DATA ---

const mixedVocab = [
    { en: "TO NAME ONESELF", es: "LLAMARSE" },
    { en: "TO WASH ONESELF", es: "LAVARSE" },
    { en: "TO SHOWER", es: "DUCHARSE" },
    { en: "TO GET UP", es: "LEVANTARSE" },
    { en: "TO COMB ONE'S HAIR", es: "PEINARSE" },
    { en: "TO BRUSH ONE'S TEETH", es: "CEPILLARSE" },
    { en: "TO SHAVE", es: "AFEITARSE" },
    { en: "TO PUT ON MAKEUP", es: "MAQUILLARSE" },
    { en: "TO DRY ONESELF", es: "SECARSE" },
    { en: "TO STAY", es: "QUEDARSE" },
    { en: "TO GET TIRED", es: "CANSARSE" },
    { en: "TO GET BORED", es: "ABURRIRSE" },
    { en: "TO RELAX", es: "RELAJARSE" },
    { en: "TO TRAIN", es: "ENTRENARSE" },
    { en: "TO CALM DOWN", es: "CALMARSE" },
    { en: "TO FIX ONESELF UP", es: "ARREGLARSE" },
    { en: "TO PREPARE ONESELF", es: "PREPARARSE" },
    { en: "TO TAKE OFF", es: "QUITARSE" },
    { en: "TO STRETCH", es: "ESTIRARSE" },
    { en: "TO BATHE", es: "BAÑARSE" },
    // Irregulares
    { en: "TO WAKE UP", es: "DESPERTARSE" },
    { en: "TO GO TO BED", es: "ACOSTARSE" },
    { en: "TO GET DRESSED", es: "VESTIRSE" },
    { en: "TO HAVE FUN", es: "DIVERTIRSE" },
    { en: "TO FALL ASLEEP", es: "DORMIRSE" },
    { en: "TO FEEL", es: "SENTIRSE" },
    { en: "TO SAY GOODBYE", es: "DESPEDIRSE" },
    { en: "TO LAUGH", es: "REÍRSE" },
    { en: "TO SIT DOWN", es: "SENTARSE" },
    { en: "TO REMEMBER", es: "ACORDARSE" },
];

const ex1Prompts = [
    { en: "I wake up at 7 am.", es: ["yo me despierto a las siete", "me despierto a las siete"] },
    { en: "She washes her face.", es: ["ella se lava la cara", "se lava la cara"] },
    { en: "We have fun together.", es: ["nosotros nos divertimos juntos", "nos divertimos juntos"] },
    { en: "They get up early.", es: ["ellos se levantan temprano", "se levantan temprano"] },
    { en: "You shower in the morning.", es: ["tú te duchas en la mañana", "te duchas en la mañana"] },
    { en: "He shaves before work.", es: ["él se afeita antes del trabajo", "se afeita antes del trabajo"] },
    { en: "I sit on the sofa.", es: ["yo me siento en el sofá", "me siento en el sofá"] },
];

const ex2Prompts = [
    { en: "We fall asleep watching TV.", es: ["nosotros nos dormimos viendo televisión", "nos dormimos viendo tele"] },
    { en: "She brushes her teeth.", es: ["ella se cepilla los dientes", "se cepilla los dientes"] },
    { en: "They say goodbye at the door.", es: ["ellos se despiden en la puerta", "se despiden en la puerta"] },
    { en: "I feel very tired.", es: ["yo me siento muy cansado", "me siento muy cansado"] },
    { en: "You comb your hair.", es: ["tú te peinas", "te peinas"] },
    { en: "We stay at home.", es: ["nosotros nos quedamos en casa", "nos quedamos en casa"] },
    { en: "He goes to bed late.", es: ["él se acuesta tarde", "se acuesta tarde"] },
    { en: "I put on makeup for the party.", es: ["yo me maquillo para la fiesta", "me maquillo para la fiesta"] },
];

const ex3Prompts = [
    { en: "They get dressed in the room.", es: ["ellos se visten en el cuarto", "se visten en la habitación"] },
    { en: "I remember your name.", es: ["yo me acuerdo de tu nombre", "me acuerdo de tu nombre"] },
    { en: "We relax on Sundays.", es: ["nosotros nos relajamos los domingos", "nos relajamos los domingos"] },
    { en: "She laughs with her friends.", es: ["ella se ríe con sus amigos", "se ríe con sus amigas"] },
    { en: "They train at the gym.", es: ["ellos se entrenan en el gimnasio", "se entrenan en el gimnasio"] },
    { en: "I dry myself with a towel.", es: ["yo me seco con una toalla", "me seco con una toalla"] },
    { en: "We prepare for the exam.", es: ["nosotros nos preparamos para el examen", "nos preparamos para el examen"] },
    { en: "You take off your shoes.", es: ["tú te quitas los zapatos", "te quitas los zapatos"] },
    { en: "He becomes happy.", es: ["él se pone feliz", "se pone contento"] },
    { en: "I calm down slowly.", es: ["yo me calmo lentamente", "me calmo despacio"] },
];

const readingData = {
    title: "Un domingo en familia",
    content: "Los domingos en mi casa son especiales. Yo me despierto tarde y me quedo en la cama un rato. Mi esposo se levanta primero y se prepara un café. Nosotros desayunamos juntos en el jardín. Después, mis hijos se visten para ir al parque. Ellos se divierten mucho jugando fútbol. Por la tarde, todos nos relajamos viendo una película. Antes de dormir, yo me lavo la cara, me cepillo y me acuesto feliz.",
    questions: [
        { q: "¿Quién se levanta primero?", a: ["mi esposo", "el esposo"] },
        { q: "¿Dónde desayunan?", a: ["en el jardín", "el jardin"] },
        { q: "¿Qué hacen los hijos en el parque?", a: ["juegan fútbol", "juegan futbol", "jugar futbol"] },
        { q: "¿Cómo se siente la narradora al acostarse?", a: ["feliz"] },
        { q: "¿Qué hacen por la tarde?", a: ["se relajan", "ven una película", "ven una pelicula"] },
    ]
};

const finalExPrompts = [
    { s: "1. Yo _______ (lavarse) las manos.", a: "me lavo" },
    { s: "2. Ella _______ (despertarse) a las 6 am.", a: "se despierta" },
    { s: "3. Nosotros _______ (quedarse) aquí.", a: "nos quedamos" },
    { s: "4. Ellos _______ (vestirse) rápido.", a: "se visten" },
    { s: "5. Tú _______ (ducharse) con agua fría.", a: "te duchas" },
    { s: "6. Él _______ (acostarse) en el sofá.", a: "se acuesta" },
    { s: "7. Vosotros _______ (reírse) mucho.", a: "os reís" },
    { s: "8. El perro _______ (dormirse) afuera.", a: "se duerme" },
    { s: "9. Yo _______ (maquillarse) en el baño.", a: "me maquillo" },
    { s: "10. Nosotros _______ (divertirse) en la playa.", a: "nos divertimos" },
    { s: "11. Ella _______ (sentarse) en la silla.", a: "se sienta" },
    { s: "12. Ellos _______ (afeitarse) cada mañana.", a: "se afeitan" },
    { s: "13. Tú _______ (acordarse) de mi cumpleaños.", a: "te acuerdas" },
    { s: "14. Yo _______ (sentirse) muy bien hoy.", a: "me siento" },
    { s: "15. Nosotros _______ (peinarse) frente al espejo.", a: "nos peinamos" },
];

const globalVocabMap: Record<string, string> = mixedVocab.reduce((acc, curr) => {
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
                        <CardDescription className="font-bold text-foreground mt-1">Traduce la frase al español usando verbos reflexivos.</CardDescription>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger>
                        <PopoverContent className="w-64"><ScrollArea className="h-64 pr-4"><div className="space-y-2"><h4 className='font-black text-primary text-xs uppercase mb-2 border-b'>Ayuda de Misión</h4>{Object.entries(vocabulary || globalVocabMap).map(([es, en]: any, i) => (<div key={i} className="flex justify-between text-[10px] border-b border-muted pb-1"><span className="text-muted-foreground text-left uppercase">{en}:</span><span className="font-bold text-right text-primary">{es.toUpperCase()}</span></div>))}</div></ScrollArea></PopoverContent>
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

function ReflexivosMixContent() {
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
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(mixedVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(mixedVocab.length).fill('unchecked'));
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
        { key: 'vocab_game', name: '5. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'exercise3', name: '6. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: '7. Lectura Mix', icon: BookText, status: 'locked' },
        { key: 'final_ex', name: '8. Ejercicio Final', icon: Trophy, status: 'locked' },
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
        const nv = mixedVocab.map((item, idx) => {
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
            const isCorrect = q.a.some(ans => ans.toLowerCase() === (readingAns[i] || '').trim().toLowerCase());
            if (!isCorrect) ok = false;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setReadingVal(nv as any);
        if (ok) { toast({ title: "¡Muy bien!" }); handleTopicComplete('reading'); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const handleCheckFinal = () => {
        let ok = true;
        const nv = finalExPrompts.map((q, i) => {
            const isCorrect = q.a.toLowerCase() === (finalAns[i] || '').trim().toLowerCase();
            if (!isCorrect) ok = false;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setFinalVal(nv as any);
        if (ok) { toast({ title: "¡Misión Cumplida!" }); handleTopicComplete('final_ex'); }
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex flex-col items-center justify-center min-h-[400px]"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className="text-primary uppercase">Vocabulario Mix (Regulares e Irregulares)</CardTitle></CardHeader>
                        <CardContent className="pt-6"><div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm"><div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">English</div><div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Español</div>{mixedVocab.map((v, i) => (<Fragment key={i}><div className="flex items-center font-bold py-1 uppercase">{v.en}</div><Input value={vocabAnswers[i] || ''} onChange={e => { const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); setVocabValidation(v => { const nv = [...v]; nv[i] = 'unchecked'; return nv as any; }); }} className={cn("h-10 uppercase font-mono border-2", vocabValidation[i] === 'correct' ? 'border-green-500' : vocabValidation[i] === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></Fragment>))}</div></CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 bg-muted/20"><Button onClick={handleCheckVocab} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-foreground text-left">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Regulares vs Irregulares</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4">
                                <p className="text-lg font-bold">Ambos tipos de verbos usan los mismos pronombres reflexivos: <span className="text-primary font-black">me, te, se, nos, os, se</span>.</p>
                                <Separator />
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <h4 className="font-black text-primary uppercase text-sm">Regulares</h4>
                                        <p className="text-sm">La raíz se mantiene igual al conjugar.</p>
                                        <p className="font-mono text-xs p-2 bg-muted rounded">Lavar &rarr; Me lavo, Te lavas...</p>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-black text-brand-purple uppercase text-sm">Irregulares</h4>
                                        <p className="text-sm">La raíz cambia (e&rarr;ie, o&rarr;ue, e&rarr;i).</p>
                                        <p className="font-mono text-xs p-2 bg-muted rounded">Vestirse &rarr; Me visto, Te vistes...</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-16 font-black h-12 text-white">He comprendido la diferencia</Button></CardFooter>
                    </Card>
                );
            case 'exercise1': return <BallsExercise title="Ejercicio 1 (Mix)" prompts={ex1Prompts} onComplete={() => handleTopicComplete('exercise1')} />;
            case 'exercise2': return <BallsExercise title="Ejercicio 2 (Mix)" prompts={ex2Prompts} onComplete={() => handleTopicComplete('exercise2')} />;
            case 'exercise3': return <BallsExercise title="Ejercicio 3 (Mix)" prompts={ex3Prompts} onComplete={() => handleTopicComplete('exercise3')} />;
            case 'vocab_game': return <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground"><CardHeader><CardTitle className='text-primary uppercase font-black'>Misión: Parejas Mix</CardTitle></CardHeader><CardContent><VocabularyMatchingGame data={mixedVocab.slice(0, 10).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Encuentra las parejas" /></CardContent></Card>;
            case 'reading':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase'>{readingData.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-inner">{readingData.content}</div>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className='font-black text-primary uppercase text-sm'>Preguntas:</h3>
                                {readingData.questions.map((q, i) => (
                                    <div key={i} className="space-y-2 p-3 bg-muted/20 rounded-xl border">
                                        <Label className="font-bold">{q.q}</Label>
                                        <Input value={readingAns[i] || ''} onChange={e => { const na = [...readingAns]; na[i] = e.target.value; setReadingAns(na); setReadingVal(v => { const nv = [...v]; nv[i] = 'unchecked'; return nv as any; }); }} className={cn("h-10 text-foreground", readingVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : readingVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/10"><Button onClick={handleCheckReading} size="lg" className="px-16 font-black h-12">Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'final_ex':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase'>Misión Final: Conjugación Mixta</CardTitle></CardHeader>
                        <CardContent className="p-0"><ScrollArea className="h-[450px] p-6"><div className="space-y-4">{finalExPrompts.map((q, i) => (<div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm"><p className="font-bold text-lg">{q.s}</p><Input value={finalAns[i] || ''} onChange={e => { const na = [...finalAns]; na[i] = e.target.value; setFinalAns(na); setFinalVal(v => { const nv = [...v]; nv[i] = 'unchecked'; return nv as any; }); }} className={cn("h-10 max-w-[220px] text-lg font-mono border-2", finalVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : finalVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder="Respuesta..." autoComplete="off" /></div>))}</div></ScrollArea></CardContent>
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
                            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400"><Star className="h-6 w-6 fill-current animate-pulse" /><p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión Activo: {studentProfile?.name || targetStudentId}</p></div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors"><Link href="/admin">Cerrar Supervisión</Link></Button>
                        </div>
                    )}
                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/a2" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver al Curso A2</Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight">Reflexivos Mix 🇪🇸</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30"><CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" />Misión A2</CardTitle></CardHeader>
                                <CardContent className="p-4">
                                    <nav><ul className="space-y-1">
                                        {learningPath.map((item) => {
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            const isSelected = selectedTopic === item.key;
                                            const Icon = item.icon;
                                            return (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer', isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', isSelected && 'bg-muted text-primary font-black border-l-4 border-primary')}>
                                                    <div className="flex items-center gap-3">{item.status === 'completed' ? (<CheckCircle className="h-5 w-5 text-green-500" />) : (<Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />)}<span className="truncate max-w-[150px]">{item.name}</span></div>
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

export default function ReflexivosMixPage() {
    return (<Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}><ReflexivosMixContent /></Suspense>);
}
