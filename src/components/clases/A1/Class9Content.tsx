'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    GraduationCap, 
    CheckCircle, 
    Info, 
    Gamepad2, 
    MessageSquare, 
    Pencil, 
    Loader2, 
    Home, 
    ArrowRight, 
    HelpCircle, 
    XCircle,
    BookText,
    ArrowLeft
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { LargeTextTranslation } from '@/components/dashboard/large-text-translation';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { DialogueCompletionExercise } from '@/components/kids/exercises/dialogue-completion-exercise';
import { CreativeWritingExercise } from '@/components/dashboard/creative-writing-exercise';
import { DashboardHeader } from '@/components/dashboard/header';
import { Footer } from '@/components/footer';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// --- DATA ---

const progressStorageVersion = 'progress_a1_eng_u2_c9_v135_stable';
const mainProgressKey = 'progress_a1_eng_unit_2_class_9';

const vocabularyData = {
    weather: [
        { spanish: 'NEVAR', english: ['(TO) SNOW', 'SNOW', 'TO SNOW'] },
        { spanish: 'LLOVER', english: ['(TO) RAIN', 'RAIN', 'TO RAIN'] },
        { spanish: 'SOLEADO', english: ['SUNNY'] },
        { spanish: 'LLUVIOSO', english: ['RAINY'] },
        { spanish: 'EL CLIMA', english: ['THE WEATHER'] },
        { spanish: 'FRIO', english: ['COLD'] },
        { spanish: 'FRESCO', english: ['COOL'] },
        { spanish: 'CIELO', english: ['SKY'] },
        { spanish: 'NIEVE', english: ['SNOW'] },
        { spanish: 'HACE CALOR', english: ["IT'S HOT", "IT IS HOT"] },
        { spanish: 'HUMEDO', english: ['HUMID'] },
        { spanish: 'LLUVIA', english: ['RAIN'] },
        { spanish: 'NUBE', english: ['CLOUD'] },
        { spanish: 'NUBLADO', english: ['CLOUDY'] },
        { spanish: 'TORMENTA', english: ['STORM'] },
        { spanish: 'NIEBLA', english: ['FOG'] },
        { spanish: 'DESPEJADO', english: ['CLEAR'] },
        { spanish: 'ARCO IRIS', english: ['RAINBOW'] },
        { spanish: 'VIENTO', english: ['WIND'] },
        { spanish: 'VENTOSO', english: ['WINDY'] },
        { spanish: 'CALIDO', english: ['WARM', 'HOT'] },
    ],
    house: [
        { spanish: 'BAÑO', english: ['BATHROOM-TOILET', 'BATHROOM', 'TOILET'] },
        { spanish: 'CUARTO', english: ['BEDROOM'] },
        { spanish: 'SOTANO', english: ['BASEMENT'] },
        { spanish: 'COCINA', english: ['KITCHEN'] },
        { spanish: 'PUERTA', english: ['DOOR'] },
        { spanish: 'TIMBRE', english: ['DOORBELL'] },
        { spanish: 'TECHO', english: ['CEILING'] },
        { spanish: 'BALCON', english: ['BALCONY'] },
        { spanish: 'SALA', english: ['LIVING ROOM'] },
        { spanish: 'COMEDOR', english: ['DINING ROOM', 'DINNING ROOM'] },
        { spanish: 'JARDIN', english: ['GARDEN'] },
        { spanish: 'VENTANA', english: ['WINDOW'] },
        { spanish: 'PARED', english: ['WALL'] },
        { spanish: 'PISO', english: ['FLOOR'] },
        { spanish: 'PATIO', english: ['COURTYARD'] },
    ]
};

const dialogue1Phrases = [
    { spanish: "MARY: ¿PUEDO AYUDARTE?", answers: ["can i help you?", "may i help you?"] },
    { spanish: "JON: SI, GRACIAS ¿CUANTO CUESTAN ESOS ARETES?", answers: ["yes, thank you. how much do those earrings cost?", "yes, thanks. how much are those earrings?"] },
    { spanish: "MARY: ¿LOS BLANCOS? ESTOS CUESTAN 18 USD", answers: ["the white ones? these cost 18 usd"] },
    { spanish: "JON: THAT IS NOT BAD. THESE ________ ARE FOR MY WIFE. DO THEY COME IN GOLDEN?", answers: ["that is not bad. these ones are for my wife. do they come in golden?"] },
    { spanish: "MARY: NO, LO SIENTO, SOLO PLATEADOS", answers: ["no, i am sorry, only silver ones", "no, i'm sorry, only silver"] },
    { spanish: "JON: OK. ME LOS LLEVO, ¿CUANTO CUESTA ESA CHAQUETA?", answers: ["ok. i take them, how much does that jacket cost?", "ok. i'll take them, how much is that jacket?"] },
    { spanish: "MARY: ¿CUAL? – LA AZUL O LA BLANCA?", answers: ["which one? - the blue one or the white one?"] },
    { spanish: "JON: NO, LA MARRON", answers: ["no, the brown one"] },
    { spanish: "MARY: DEJAME VER (LET’S SEE) ESA CUESTA 30 USD", answers: ["let's see. that one costs 30 usd"] },
    { spanish: "JON: ESTA BONITA, ME LA LLEVO TAMBIEN, GRACIAS", answers: ["it is pretty, i take it too, thank you"] },
    { spanish: "MARY: CON MUCHO GUSTO", answers: ["you are welcome", "you're welcome"] },
];

const dialogue2Data = [
    { speaker: "MARY", parts: ["HOW MUCH IS ", " DRESS?"], answers: [["THIS", "THAT"]] },
    { speaker: "JON", parts: ["THE WHITE ", "? OR THE GRAY ", "?"], answers: [["ONE"], ["ONE"]] },
    { speaker: "MARY", parts: ["THE GRAY ", " PLEASE…"], answers: [["ONE"]] },
    { speaker: "JON", parts: ["IT IS…...$195"], answers: [] },
    { speaker: "MARY", parts: ["OH! QUITE EXPENSIVE! AND HOW MUCH ARE ", " GREY JEANS?"], answers: [["THESE", "THOSE"]] },
    { speaker: "JON", parts: ["", " ONES? - THOSE ARE…. $55."], answers: [["THESE", "THOSE"]] },
];

// ---- VOCABULARIO REFINADO PARA EJERCICIOS CLASE 9 --------
const ex1Vocab = { 
    "conocer": "know", 
    "hombre": "man", 
    "negro": "black", 
    "guitarra": "guitar", 
    "mucho": "really / very much", 
    "restaurante": "restaurant", 
    "altos": "tall", 
    "veloz": "fast", 
    "hermosos": "beautiful", 
    "inteligentes": "intelligent", 
    "vestidos": "dresses", 
    "grandes": "big", 
    "cómodo": "comfortable", 
    "cuesta más": "costs more", 
    "camiseta": "t-shirt", 
    "muchacha": "girl", 
    "lugares": "places", 
    "cantante": "singer" 
};

const ex2Vocab = { 
    "qué": "what", 
    "ese": "that", 
    "oficina": "office", 
    "amigos": "friends", 
    "casas": "houses", 
    "viejas": "old" 
};

const ex3Vocab = { 
    "libro": "book", 
    "interesante": "interesting", 
    "zapatos": "shoes", 
    "caros": "expensive", 
    "flores": "flowers", 
    "hermosas": "beautiful" 
};

const ex4Vocab = { 
    "celular": "phone / cellphone", 
    "llaves": "keys", 
    "mesa": "table", 
    "parientes": "relatives" 
};

const ex5Vocab = { 
    "qué tan grande": "how big", 
    "caja": "box", 
    "niño": "boy", 
    "alto": "tall", 
    "manzanas": "apples", 
    "ventana": "window", 
    "abierta": "open" 
};

const dial1Vocab = { 
    "ayudarte": "help you", 
    "aretes": "earrings", 
    "esposa": "wife", 
    "dorados": "golden", 
    "plateados": "silver", 
    "chaqueta": "jacket", 
    "marrón": "brown", 
    "me los llevo": "i take them", 
    "también": "too" 
};

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

// --- COMPONENT ---

export default function Class9Content() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);
    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const [vocabAnswers, setVocabAnswers] = useState<{[key: string]: string[]}>({});
    const [vocabValidation, setVocabValidation] = useState<any>({});
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary (Weather & House)', icon: Home, status: 'active' },
        { key: 'grammar', name: 'Grammar: Intro', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'grammar2', name: 'Grammar: Distance', icon: GraduationCap, status: 'locked' },
        { key: 'ex2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'grammar3', name: 'Grammar: Questions', icon: GraduationCap, status: 'locked' },
        { key: 'ex3', name: 'Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'ex4', name: 'Exercise 4', icon: PenSquare, status: 'locked' },
        { key: 'ex5', name: 'Exercise 5', icon: PenSquare, status: 'locked' },
        { key: 'dialogue1', name: 'Dialogue 1', icon: MessageSquare, status: 'locked' },
        { key: 'vocab_game', name: 'Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
        { key: 'writing1', name: 'Writing 1', icon: Pencil, status: 'locked' },
        { key: 'dialogue2', name: 'Dialogue 2', icon: MessageSquare, status: 'locked' },
    ], []);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile) return;
        let path = initialLearningPath.map(t => ({ ...t }));
        let savedST = '';
        if (isAdmin) path.forEach(t => t.status = 'completed');
        else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const d = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(t => { if (d[t.key]) t.status = d[t.key]; });
            savedST = d.lastSelectedTopic || '';
        }
        let lastDone = true;
        for(let i=0; i < path.length; i++) { if (lastDone && path[i].status === 'locked') path[i].status = 'active'; lastDone = path[i].status === 'completed'; }
        setLearningPath(path);
        setSelectedTopic(savedST || path.find(p => p.status === 'active')?.key || path[0].key);
        
        const initAns: any = {}; const initVal: any = {};
        Object.keys(vocabularyData).forEach(c => {
            initAns[c] = Array((vocabularyData as any)[c].length).fill('');
            initVal[c] = Array((vocabularyData as any)[c].length).fill('unchecked');
        });
        setVocabAnswers(initAns); setVocabValidation(initVal);
        setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;
        const s: any = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(t => s[t.key] = t.status);
        if (JSON.stringify(s) !== JSON.stringify(studentProfile?.lessonProgress?.[progressStorageVersion])) {
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        }
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, isAdmin, progressValue, studentDocRef, selectedTopic, isInitialLoading, studentProfile]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(curr => {
            const np = curr.map(t => ({ ...t }));
            const idx = np.findIndex(t => t.key === topicToComplete);
            if (idx !== -1 && np[idx].status !== 'completed') {
                np[idx].status = 'completed';
                if (idx + 1 < np.length && np[idx + 1].status === 'locked') {
                    np[idx + 1].status = 'active';
                    setSelectedTopic(np[idx + 1].key);
                    setTimeout(() => toast({ title: "¡Siguiente tema desbloqueado!" }), 0);
                }
            }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (['grammar', 'grammar2', 'grammar3'].includes(topicKey)) handleTopicComplete(topicKey);
    };

    const handleVocabCheck = () => {
        let ok = false; const nv: any = {};
        Object.keys(vocabularyData).forEach(c => {
            nv[c] = (vocabularyData as any)[c].map((v: any, i: number) => {
                const cor = v.english.some((e: string) => e.toLowerCase() === vocabAnswers[c][i].trim().toLowerCase());
                if (cor) ok = true; return cor ? 'correct' : 'incorrect';
            });
        });
        setVocabValidation(nv); setCanAdvanceVocab(ok);
        if (ok) toast({ title: "¡Bien hecho!" }); else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left text-foreground">
                        <CardHeader><CardTitle>Vocabulary</CardTitle></CardHeader>
                        <CardContent>
                            <Accordion type="multiple" defaultValue={['weather', 'house']}>
                                {Object.keys(vocabularyData).map(c => (
                                    <AccordionItem key={c} value={c}>
                                        <AccordionTrigger className="capitalize font-bold text-lg">{c}</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="grid grid-cols-2 gap-2 text-base">
                                                <div className="font-bold p-2 bg-muted rounded">Español</div>
                                                <div className="font-bold p-2 bg-muted rounded">Inglés</div>
                                                {(vocabularyData as any)[c].map((v: any, i: number) => (
                                                    <React.Fragment key={i}>
                                                        <div className="p-2 border rounded bg-white/5">{v.spanish}</div>
                                                        <Input 
                                                            value={vocabAnswers[c][i]} 
                                                            onChange={e => { const na = {...vocabAnswers}; na[c][i] = e.target.value; setVocabAnswers(na); setCanAdvanceVocab(false); }} 
                                                            className={cn(vocabValidation[c]?.[i] === 'correct' ? 'border-green-500 bg-green-50/5' : vocabValidation[c]?.[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} 
                                                            autoComplete="off"
                                                        />
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 mt-4">
                            <Button onClick={handleVocabCheck} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left text-foreground">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">DEMONSTRATIVES (Intro)</CardTitle></CardHeader>
                        <CardContent className="space-y-6 font-bold text-lg">
                            <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                <p className="text-primary mb-2 uppercase tracking-tighter">THIS vs THESE (Cerca):</p>
                                <p>Usamos <span className="text-primary">THIS</span> para singular y <span className="text-primary">THESE</span> para plural cuando algo está cerca.</p>
                                <p className="text-sm font-mono mt-2 italic text-slate-700 dark:text-slate-300">"This is my book" / "These are my keys"</p>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6">
                            <Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-12 font-bold text-white">Entendido</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar2':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left text-foreground">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">DEMONSTRATIVES (Distance)</CardTitle></CardHeader>
                        <CardContent className="space-y-6 font-bold text-lg">
                            <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                <p className="text-primary mb-2 uppercase tracking-tighter">THAT vs THOSE (Lejos):</p>
                                <p>Usamos <span className="text-primary">THAT</span> para singular y <span className="text-primary">THOSE</span> para plural cuando algo está lejos.</p>
                                <p className="text-sm font-mono mt-2 italic text-slate-700 dark:text-slate-300">"That is his house" / "Those are your cars"</p>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6">
                            <Button onClick={() => handleTopicComplete('grammar2')} size="lg" className="px-12 font-bold text-white">Entendido</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar3':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left text-foreground">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">QUESTIONS WITH DEMONSTRATIVES</CardTitle></CardHeader>
                        <CardContent className="space-y-6 font-bold text-lg">
                            <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                <p className="text-primary mb-2 uppercase tracking-tighter">STRUCTURE:</p>
                                <p>Para hacer preguntas, simplemente invertimos el verbo "To Be".</p>
                                <p className="text-sm font-mono mt-2 italic text-slate-700 dark:text-slate-300">"Is this your phone?" / "Are those his friends?"</p>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6">
                            <Button onClick={() => handleTopicComplete('grammar3')} size="lg" className="px-12 font-bold text-white">Entendido</Button>
                        </CardFooter>
                    </Card>
                );
            case 'ex1': return <SimpleTranslationExercise exerciseKey="c9_ex1" course="a1" onComplete={() => handleTopicComplete('ex1')} vocabulary={ex1Vocab} highlightVocabulary={true} />;
            case 'ex2': return <SimpleTranslationExercise exerciseKey="c9_ex2" course="a1" onComplete={() => handleTopicComplete('ex2')} vocabulary={ex2Vocab} highlightVocabulary={true} />;
            case 'ex3': return <SimpleTranslationExercise exerciseKey="c9_ex3" course="a1" onComplete={() => handleTopicComplete('ex3')} vocabulary={ex3Vocab} highlightVocabulary={true} />;
            case 'ex4': return <SimpleTranslationExercise exerciseKey="c9_ex4" course="a1" onComplete={() => handleTopicComplete('ex4')} vocabulary={ex4Vocab} highlightVocabulary={true} />;
            case 'ex5': return <SimpleTranslationExercise exerciseKey="c9_ex5" course="a1" onComplete={() => handleTopicComplete('ex5')} vocabulary={ex5Vocab} highlightVocabulary={true} />;
            case 'dialogue1': return <LargeTextTranslation title="Dialogue 1" phrases={dialogue1Phrases} onComplete={() => handleTopicComplete('dialogue1')} vocabulary={dial1Vocab} highlightVocabulary={true} />;
            case 'vocab_game': return <VocabularyMatchingGame data={[...vocabularyData.weather, ...vocabularyData.house].map(v => ({ spanish: v.spanish, english: v.english }))} onComplete={() => handleTopicComplete('vocab_game')} />;
            case 'writing1': return <CreativeWritingExercise title="Writing 1" prompts={[{ id: 'w1', question: 'Describe your house and the weather today using at least 5 sentences.' }]} onComplete={() => handleTopicComplete('writing1')} studentDocRef={studentDocRef} initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.writing1Data} savePath={`lessonProgress.${progressStorageVersion}.writing1Data`} />;
            case 'dialogue2': return <DialogueCompletionExercise title="Dialogue 2" description="Completa con demostrativos." dialogue={dialogue2Data} onComplete={() => handleTopicComplete('dialogue2')} />;
            default: return null;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Títulos Superiores */}
                    <div className="mb-8 text-left">
                        <Link href="/ingles/a1/unit/2" className="hover:underline text-sm font-bold text-primary flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" /> Volver a la Unidad 2
                        </Link>
                        <h1 className="text-4xl font-bold text-white [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">
                            Clase 9 (A1)
                        </h1>
                    </div>

                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader><CardTitle className="text-lg uppercase font-black text-primary">Ruta Clase 9</CardTitle></CardHeader>
                                <CardContent>
                                    <nav><ul className="space-y-1">
                                        {learningPath.map(item => (
                                            <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', (item.status === 'locked' && !isAdmin) ? 'text-muted-foreground/50' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-bold')}>
                                                <div className="flex items-center gap-3">{(item.status === 'completed') ? <CheckCircle className="h-5 w-5 text-green-500" /> : <item.icon className="h-5 w-5" />}<span>{item.name}</span></div>
                                            </li>
                                        ))}
                                    </ul></nav>
                                    <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 text-foreground"><span>Progreso</span><span className="font-bold">{progressValue}%</span></div><Progress value={progressValue} className="h-1.5" /></div>
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
