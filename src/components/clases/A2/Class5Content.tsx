
'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    GraduationCap, 
    CheckCircle, 
    Loader2, 
    ArrowRight,
    Gamepad2,
    Trophy,
    BookText,
    Pencil,
    Star,
    Info,
    MapPin,
    Link as LinkIcon,
    ArrowLeft,
    Check,
    X,
    Book as BookIcon,
    HelpCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_a2_eng_u1_c5_v106_fixed_refs';
const mainProgressKey = 'progress_a2_eng_unit_1_class_5';

interface Topic {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'completed' | 'active' | 'locked';
}

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const cityVerbsVocab = [
    { es: "ENSEÑAR", en: "TEACH" }, { es: "DECIR", en: "TELL" }, { es: "PENSAR", en: "THINK" },
    { es: "LANZAR-BOTAR", en: "THROW" }, { es: "ENTENDER", en: "UNDERSTAND" }, { es: "PONERSE-LLEVAR PUESTO", en: "WEAR" },
    { es: "GANAR", en: "WIN" }, { es: "ESCRIBIR", en: "WRITE" },
    { es: "AEROPUERTO", en: "AIRPORT" }, { es: "BANCO", en: "BANK" }, { es: "CASTILLO", en: "CASTLE" },
    { es: "IGLESIA", en: "CHURCH" }, { es: "FARMACIA", en: "DRUGSTORE" }, { es: "PARQUE", en: "PARK" },
    { es: "RESTAURANTE", en: "RESTAURANT" }, { es: "TRANVIA", en: "STREETCAR" }, { es: "TEATRO", en: "THEATER" },
    { es: "ARBOLES", en: "TREES" }, { es: "MUSEO", en: "MUSEUM" }, { es: "BARRIO", en: "NEIGHBORHOOD" },
    { es: "AUTOPISTA", en: "HIGHWAY" }, { es: "EDIFICIOS", en: "BUILDINGS" }, { es: "CENTRO DE LA CIUDAD", en: "DOWNTOWN" },
    { es: "PUENTE", en: "BRIDGE" }, { es: "PARADA DEL BUS", en: "BUS STOP" }, { es: "FUENTE", en: "FOUNTAIN" },
    { es: "ESQUINA", en: "CORNER" }, { es: "AVENIDA", en: "AVENUE" }
];

const connectorsGrammar = [
    { en: "ALTHOUGH / THOUGH", es: "AUNQUE" },
    { en: "EVEN IF", es: "INCLUSO SI – AÚN SI" },
    { en: "NOT EVEN IF", es: "NI SIQUIERA SI" },
    { en: "EVEN SO", es: "AUN ASI" },
    { en: "DESPITE / IN SPITE OF", es: "A PESAR DE" },
    { en: "REGARDLESS OF", es: "SIN IMPORTAR QUE" },
    { en: "ON THE OTHER HAND", es: "POR OTRO LADO" },
    { en: "ON THE CONTRARY", es: "POR EL CONTRARIO" },
    { en: "NOT ONLY... BUT ALSO", es: "NO SOLO... PERO TAMBIEN" },
    { en: "THEREFORE", es: "POR LO TANTO" },
    { en: "AS A RESULT", es: "COMO RESULTADO" },
    { en: "THIS IS WHY", es: "ESTA ES LA RAZON" },
    { en: "IN OTHER WORDS", es: "EN OTRAS PALABRAS" },
    { en: "ABOVE ALL", es: "SOBRE TODO" },
    { en: "NOWADAYS", es: "HOY EN DIA" },
    { en: "IN CONCLUSION / TO SUM UP", es: "EN CONCLUSION / PARA RESUMIR" },
    { en: "BESIDES", es: "ADEMAS" }
];

const ex1Prompts = [
    { spanish: "A PESAR DE QUE JACK NO ES MUY ALTO, ES EXCELENTE EN BALONCESTO", answer: ["despite jack is not very tall, he is excellent in basketball", "in spite of jack is not very tall, he is excellent in basketball"] },
    { spanish: "ELLA DECIDE IR A TRABAJAR, AUNQUE ELLA NO SE SIENTE BIEN", answer: ["she decides to go to work, although she does not feel well", "she decides to go to work, although she doesn't feel well"] },
    { spanish: "AUN SI ELLOS NO SON LOS MEJORES, ESTAN HACIENDO UN MUY BUEN TRABAJO", answer: ["even if they are not the best, they are doing a very good job"] },
];

const ex2Prompts = [
    { spanish: "INCLUSO SI EL TIENE RAZON, NO DEDE SER GROSERO", answer: ["even if he is right, he must not be rude"] },
    { spanish: "YO VOY A CAMINAR MAÑANA EN LA MAÑANA INCLUSO SI ESTA LLOVIENDO", answer: ["i am going to walk tomorrow in the morning even if it is raining"] },
    { spanish: "TERMINARE EL PROYECTO PARA MAÑANA, INCLUSO SI TENGO QUE TRABAJAR TODA LA NOCHE", answer: ["i will finish the project for tomorrow, even if i have to work all night"] },
];

const ex3Prompts = [
    { spanish: "EL NO HARA ESE TRABAJO, NI SIQUIERA SI ELLOS LE PAGARAN POR ESO", answer: ["he will not do that job, not even if they pay him for it"] },
    { spanish: "ELLOS NO TERMINARAN A TIEMPO, NI SIQUIERA SI SE DAN PRISA (HURRY UP)", answer: ["they will not finish on time, not even if they hurry up"] },
    { spanish: "NO TE PRESTO DINERO NI SIQUIERA SI ME PROMETES PAGARLO", answer: ["i do not lend you money not even if you promise me to pay it"] },
];

const ex4Prompts = [
    { spanish: "A PESAR DE SU MALA REPUTACION, EL POLITICO GANÓ LAS ELECCIONES", answer: ["despite his bad reputation, the politician won the elections", "in spite of his bad reputation, the politician won the elections"] },
    { spanish: "EL NO USA CHAQUETA A PESAR DE QUE EL TIENE FRIO", answer: ["he does not wear a jacket despite he is cold"] },
    { spanish: "NOSOTROS NO VAMOS DE VIAJE A PESAR DE QUE TENEMOS DINERO PERO NO TENEMOS TIEMPO", answer: ["we do not go on a trip despite we have money but we do not have time"] },
];

const ex5Prompts = [
    { spanish: "DECIDIERON TERMINAR EL PROYECTO, SIN IMPORTAR EL COSTO", answer: ["they decided to finish the project, regardless of the cost"] },
    { spanish: "LA GENTE DEFENDERA A SU NACION, SIN IMPORTAR LAS CONSECUENCIAS", answer: ["people will defend their nation, regardless of the consequences"] },
    { spanish: "LOS TRABAJADORES CONSTRUYEN ESA CASA SIN IMPORTAR QUE LES PAGAN CADA 2 MESES", answer: ["the workers build that house regardless of they are paid every 2 months"] },
];

const ex6Prompts = [
    { spanish: "SI NO ESTA AQUI, ENTONCES SE PERDIÓ", answer: ["if it is not here, then it was lost"] },
    { spanish: "SI TE GUSTAN ESOS ZAPATOS, ENTONCES ¿PORQUE NO LOS COMPRAS?", answer: ["if you like those shoes, then why don't you buy them?"] },
    { spanish: "SI TE GUSTA ESE LIBRO ENTONCES DILE QUE TE LO PRESTE", answer: ["if you like that book then tell him to lend it to you"] },
];

const ex7Prompts = [
    { spanish: "EL FUTBOL ES UN BUEN DEPORTE. ADEMAS ES MUY FACIL DE APRENDERLO", answer: ["soccer is a good sport. moreover it is very easy to learn it"] },
    { spanish: "ELLOS TRABAJAN MUY DURO. ADEMAS HACEN UN BUEN EQUIPO", answer: ["they work very hard. moreover they make a good team"] },
    { spanish: "LOS PERROS SON BUENA COMPAÑÍA ADEMAS SON LOS MEJORES AMIGOS DEL HOMBRE", answer: ["dogs are good company moreover they are man's best friends"] },
];

const ex8Prompts = [
    { spanish: "ADEMAS DE SER UNA GRAN PERSONA, ESE MEDICO ES UN EXCELENTE PROFESIONAL", answer: ["in addition to being a great person, that doctor is an excellent professional"] },
    { spanish: "ADEMAS DE SU INTERES POR LA MUSICA, LA SRA. PARKER TIENE UN GRAN INTERES POR LA LITERATURA", answer: ["in addition to her interest in music, mrs. parker has a great interest in literature"] },
    { spanish: "ADEMAS DE APRENDER INGLES, ELLA ESTUDIA FINANZAS", answer: ["in addition to learning english, she studies finance"] },
];

const readingContent = {
    title: "The Modern Explorer",
    text: `Nowadays, many people want to travel around the world. Although it can be expensive, they save money every month. 

Even if they don't have a lot of time, they enjoy visiting new buildings and museums in downtown. 

In other words, they value experiences above all. Therefore, they are always looking for a bridge to new cultures. 

In conclusion, regardless of the challenges, the world is fairly interesting to explore!`,
    questions: [
        { id: 'q1', question: "What do many people want to do nowadays?", answers: ["travel around the world", "travel"] },
        { id: 'q2', question: "What do they visit in downtown?", answers: ["new buildings and museums", "buildings and museums"] },
        { id: 'q3', question: "What do they value above all?", answers: ["experiences", "they value experiences"] }
    ]
};

// --- HELPER COMPONENTS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setCurrentIndex(0); setAnswer(''); setStatus({}); }, [prompts]);
    useEffect(() => { setAnswer(''); }, [currentIndex]);

    const currentPrompt = prompts[currentIndex];
    if (!currentPrompt) return null;

    const handleCheck = () => {
        const userVal = answer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const corrects = currentPrompt.answer;
        const isCorrect = corrects.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
        
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Buen trabajo!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start text-left">
                    <div className="w-full">
                        <CardTitle>{title}</CardTitle>
                        <CardDescription className='font-bold text-foreground mt-1'>Traduce la frase correctamente.</CardDescription>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0">
                                    <HelpCircle className="mr-2 h-4 w-4" /> Vocabulary
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <div className="space-y-2 text-foreground text-left">
                                    <h4 className="font-bold border-b pb-1 text-primary">Vocabulario Útil</h4>
                                    <ScrollArea className="h-48 pr-4">
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                            {Object.entries(vocabulary).map(([es, en]: any) => (
                                                <Fragment key={es}>
                                                    <span className="text-muted-foreground capitalize">{es}:</span>
                                                    <span className="font-semibold text-right">{en}</span>
                                                </Fragment>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">
                    {currentPrompt.spanish}
                </div>
                <Input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-12 text-lg text-foreground", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/5' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder="Tu traducción..." autoComplete="off" />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck} variant="secondary">Verificar</Button>
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={status[currentIndex] !== 'correct'} className="text-white font-bold">{currentIndex === prompts.length - 1 ? 'Finalizar' : 'Siguiente'}</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

// --- MAIN CLASS COMPONENT ---

export default function Class5Content({ overrideStudentId }: { overrideStudentId?: string | null }) {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const searchParams = useSearchParams();

    const targetStudentId = overrideStudentId || searchParams.get('studentId');
    const currentUID = targetStudentId || user?.uid;

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const hasInitialized = useRef(false);

    // Form states
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(cityVerbsVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(cityVerbsVocab.length).fill('unchecked'));
    const [readAns, setReadAns] = useState<Record<string, string>>({});
    const [readVal, setReadVal] = useState<Record<string, any>>({});

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any, name?: string}>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    const initialPathData = useMemo(() => [
        { key: 'vocabulary_verbs_city', name: '1. Vocabulary (Verbs & City)', icon: MapPin },
        { key: 'grammar_connectors', name: '2. Grammar (Connectors)', icon: LinkIcon },
        { key: 'exercise_1', name: '3. Exercise 1', icon: PenSquare },
        { key: 'exercise_2', name: '4. Exercise 2', icon: PenSquare },
        { key: 'exercise_3', name: '5. Exercise 3', icon: PenSquare },
        { key: 'exercise_4', name: '6. Exercise 4', icon: PenSquare },
        { key: 'exercise_5', name: '7. Exercise 5', icon: PenSquare },
        { key: 'vocab_game', name: '8. Vocabulary (Game)', icon: Gamepad2 },
        { key: 'exercise_6', name: '9. Exercise 6', icon: PenSquare },
        { key: 'exercise_7', name: '10. Exercise 7', icon: PenSquare },
        { key: 'exercise_8', name: '11. Exercise 8', icon: PenSquare },
        { key: 'reading', name: '12. Reading', icon: BookText },
    ], []);

    useEffect(() => {
        if (!isUserLoading && !isProfileLoading) setIsInitialLoading(false);
    }, [isUserLoading, isProfileLoading]);

    useEffect(() => {
        if (isInitialLoading || hasInitialized.current) return;
        let p = initialPathData.map((topic, index) => ({ 
            ...topic, 
            status: index === 0 ? 'active' : 'locked' as any
        }));
        const d = studentProfile?.lessonProgress?.[progressStorageVersion] || {};
        if (isAdmin && !targetStudentId) p.forEach(t => t.status = 'completed');
        else {
            p.forEach(t => { if (d[t.key]) t.status = d[t.key]; });
            let last = true;
            for (let i = 0; i < p.length; i++) { if (last && p[i].status === 'locked') p[i].status = 'active'; last = p[i].status === 'completed'; }
        }
        setLearningPath(p); 
        setSelectedTopic(d.lastSelectedTopic || p.find(it => it.status === 'active')?.key || p[0].key);
        setInitialLoadComplete(true);
        hasInitialized.current = true;
    }, [isInitialLoading, studentProfile, isAdmin, initialPathData, targetStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || targetStudentId || !hasInitialized.current) return;
        const s: any = { lastSelectedTopic: selectedTopic, vocabAnswers, readAns };
        learningPath.forEach(t => s[t.key] = t.status);
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, vocabAnswers, readAns, targetStudentId, initialLoadComplete]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(current => {
            const newPath = current.map(t => ({ ...t }));
            const idx = newPath.findIndex(t => t.key === topicToComplete);
            if (idx !== -1 && newPath[idx].status !== 'completed') {
                newPath[idx].status = 'completed';
                if (idx + 1 < newPath.length && newPath[idx + 1].status === 'locked') {
                    newPath[idx + 1].status = 'active'; 
                    setSelectedTopic(newPath[idx + 1].key);
                    setTimeout(() => toast({ title: "¡Misión desbloqueada!" }), 0);
                }
            }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const t = learningPath.find(it => it.key === topicKey);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (topicKey === 'grammar_connectors') handleTopicComplete(topicKey);
    };

    const handleCheckVocab = () => {
        let okCount = 0;
        const nv = cityVerbsVocab.map((v, i) => {
            const res = v.en === (vocabAnswers[i] || '').trim().toUpperCase();
            if (res) okCount++;
            return res ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv);
        if (okCount === cityVerbsVocab.length) toast({ title: "¡Vocabulario Completo!" });
        else toast({ variant: 'destructive', title: `Te faltan ${cityVerbsVocab.length - okCount} palabras.` });
    };

    const handleCheckReading = () => {
        let allOk = true;
        const nv: any = {};
        readingContent.questions.forEach(q => {
            const userAns = (readAns[q.id] || '').trim().toLowerCase();
            const res = q.answers.some(a => userAns.includes(a.toLowerCase()));
            nv[q.id] = res ? 'correct' : 'incorrect';
            if (!res) allOk = false;
        });
        setReadVal(nv);
        if (allOk) { toast({ title: "¡Lectura Superada!" }); handleTopicComplete('reading'); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic);
        if (!topic) return null;

        switch (selectedTopic) {
            case 'vocabulary_verbs_city':
                const allVocabOk = vocabValidation.length > 0 && vocabValidation.every(v => v === 'correct');
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><CardTitle>LEXICO: VERBOS Y CIUDAD</CardTitle></CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[500px] pr-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="font-black text-primary border-b pb-2 uppercase text-xs">Español</div><div className="font-black text-primary border-b pb-2 uppercase text-xs">Inglés</div>
                                    {cityVerbsVocab.map((v, i) => (
                                        <Fragment key={i}>
                                            <div className="p-3 border rounded bg-white/5 font-bold flex items-center text-sm">{v.es}</div>
                                            <Input value={vocabAnswers[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const nv = [...vocabValidation]; nv[i] = 'unchecked'; setVocabValidation(nv); }} className={cn("h-12 uppercase font-mono", vocabValidation[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={isAdmin && !!targetStudentId} />
                                        </Fragment>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 mt-4">
                            <Button onClick={handleCheckVocab} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary_verbs_city')} disabled={!allVocabOk && !isAdmin} className='text-white font-bold'>Continuar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar_connectors':
                return (
                    <div className="space-y-6 text-left text-foreground">
                        <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">GRAMMAR: CONNECTORS</CardTitle></CardHeader>
                            <CardContent className="space-y-6 font-bold">
                                <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border-2 border-dashed border-primary/20 shadow-inner">
                                    <p className="mb-6 text-lg italic text-muted-foreground">Los conectores nos ayudan a unir ideas de forma coherente en una frase.</p>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {connectorsGrammar.map((c, i) => (
                                            <div key={i} className="flex justify-between p-3 border-b border-border/50 text-sm">
                                                <span className="text-primary font-black">{c.en}</span>
                                                <span className="text-muted-foreground">{c.es}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('grammar_connectors')} size="lg" className="px-16 font-bold h-12 uppercase">Entendido</Button></CardFooter>
                        </Card>
                    </div>
                );
            case 'exercise_1': return <BallsExercise title="Exercise 1" prompts={ex1Prompts} onComplete={() => handleTopicComplete('exercise_1')} vocabulary={{"a pesar de": "despite / in spite of", "aunque": "although", "aun si": "even if"}} />;
            case 'exercise_2': return <BallsExercise title="Exercise 2 (Even If)" prompts={ex2Prompts} onComplete={() => handleTopicComplete('exercise_2')} vocabulary={{"razón": "right / reason", "grosero": "rude", "mañana": "tomorrow", "lloviendo": "raining", "toda la noche": "all night"}} />;
            case 'exercise_3': return <BallsExercise title="Exercise 3 (Not Even If)" prompts={ex3Prompts} onComplete={() => handleTopicComplete('exercise_3')} vocabulary={{"pagaran": "pay", "darse prisa": "hurry up", "prestar": "lend", "prometes": "promise"}} />;
            case 'exercise_4': return <BallsExercise title="Exercise 4 (Despite)" prompts={ex4Prompts} onComplete={() => handleTopicComplete('exercise_4')} vocabulary={{"reputación": "reputation", "elecciones": "elections", "chaqueta": "jacket", "frío": "cold", "viaje": "trip"}} />;
            case 'exercise_5': return <BallsExercise title="Exercise 5 (Regardless Of)" prompts={ex5Prompts} onComplete={() => handleTopicComplete('exercise_5')} vocabulary={{"costo": "cost", "defender": "defend", "nación": "nation", "consecuencias": "consequences", "trabajadores": "workers"}} />;
            case 'vocab_game': return <VocabularyMatchingGame data={cityVerbsVocab.slice(0, 12).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Connectors & City Memory" />;
            case 'exercise_6': return <BallsExercise title="Exercise 6 (Then)" prompts={ex6Prompts} onComplete={() => handleTopicComplete('exercise_6')} vocabulary={{"entonces": "then", "perdió": "lost", "zapatos": "shoes", "preste": "lend"}} />;
            case 'exercise_7': return <BallsExercise title="Exercise 7 (Moreover)" prompts={ex7Prompts} onComplete={() => handleTopicComplete('exercise_7')} vocabulary={{"fútbol": "soccer / football", "aprender": "learn", "equipo": "team", "compañía": "company"}} />;
            case 'exercise_8': return <BallsExercise title="Exercise 8 (In addition to)" prompts={ex8Prompts} onComplete={() => handleTopicComplete('exercise_8')} vocabulary={{"persona": "person", "médico": "doctor", "interés": "interest", "literatura": "literature", "finanzas": "finance"}} />;
            case 'reading':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className="uppercase tracking-tighter">Reading: {readingContent.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner whitespace-pre-wrap">{readingContent.text}</div>
                            <Separator /><div className="space-y-4">{readingContent.questions.map(q => (
                                <div key={q.id} className="space-y-2"><Label className='font-bold'>{q.question}</Label>
                                <Input value={readAns[q.id] || ''} onChange={e => { if (targetStudentId) return; setReadAns({...readAns, [q.id]: e.target.value}); setReadVal({...readVal, [q.id]: 'unchecked'}); }} readOnly={isAdmin && !!targetStudentId} className={cn('mt-1 text-lg h-12', readVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[q.id] === 'incorrect' ? 'border-destructive bg-destructive/5' : '')} autoComplete="off" /></div>
                            ))}</div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={handleCheckReading} size="lg" className="px-12 font-bold" disabled={isAdmin && !!targetStudentId}>Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            default: return null;
        }
    };

    if (isInitialLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-white font-bold tracking-widest animate-pulse uppercase">Sincronizando Misión A2...</p>
            </div>
        );
    }

    return (
        <div className="grid gap-8 md:grid-cols-12 text-foreground animate-in fade-in duration-500">
            {isAdmin && targetStudentId && (
                <div className="col-span-12 mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md">
                    <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400"><Star className="h-6 w-6 fill-current animate-pulse" /><p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión: {studentProfile?.name || targetStudentId}</p></div>
                    <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10"><Link href="/admin">Cerrar</Link></Button>
                </div>
            )}
            <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
            <div className="md:col-span-3 md:order-2 order-1 text-left">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader className="pb-4 border-b bg-muted/30">
                        <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Misión 5A</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <nav>
                            <ul className="space-y-1">
                                {learningPath.map((item) => {
                                    const isLocked = item.status === 'locked' && !isAdmin;
                                    const Icon = ICONS_CONFIG[item.status as keyof typeof ICONS_CONFIG] || BookOpen;
                                    return (
                                        <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm')}>
                                            <div className="flex items-center gap-3">{item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}<span className="truncate max-w-[150px] text-[10px] uppercase font-bold">{item.name}</span></div>
                                            {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>
                        <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 font-black uppercase text-muted-foreground"><span>Avance Clase</span><span className="text-primary">{progressValue}%</span></div><Progress value={progressValue} className="h-2 rounded-full" /></div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
