'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, Fragment } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
    BookText,
    ArrowLeft,
    Check,
    X,
    Trophy,
    Palette,
    Star
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
import { DashboardHeader } from '@/components/dashboard/header';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_a1_eng_u2_c9_v402_vocab_buttons';
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

const ex1Vocab = { "conocer": "know", "hombre": "man", "negro": "black", "guitarra": "guitar", "mucho": "really / very much", "restaurante": "restaurant", "altos": "tall", "veloz": "fast", "hermosos": "beautiful", "inteligentes": "intelligent", "vestidos": "dresses", "grandes": "big", "cómodo": "comfortable", "cuesta más": "costs more", "camiseta": "t-shirt", "muchacha": "girl", "lugares": "places", "cantante": "singer" };
const ex2Vocab = { "grande": "big", "pequeño": "small", "azul": "blue", "gris": "gray", "fuerte": "strong", "barato": "cheap", "caro": "expensive" };
const ex3Vocab = { "cuadros": "pictures", "vestido": "dress", "película": "movie", "blanca": "white", "negro": "black", "mesas": "tables", "helado": "ice cream" };
const ex4Vocab = { "mientras": "while", "regalo": "gift", "compré": "bought", "otra": "other one", "salvaje": "wild", "perezoso": "lazy", "camiseta": "t-shirt" };
const dial1Vocab = { "ayudarte": "help you", "aretes": "earrings", "esposa": "wife", "dorados": "golden", "plateados": "silver", "chaqueta": "jacket", "marrón": "brown", "me los llevo": "i take them", "también": "too" };

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

interface Topic {
    key: string;
    name: string;
    icon: React.ElementType;
    status: 'locked' | 'active' | 'completed';
}

export default function Class9Content({ overrideStudentId }: { overrideStudentId?: string | null }) {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const searchParams = useSearchParams();

    const currentUID = overrideStudentId || user?.uid;
    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any, name?: string}>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const hasInitialized = useRef(false);

    // States for content
    const [vocabAnswers, setVocabAnswers] = useState<{[key: string]: string[]}>({});
    const [vocabValidation, setVocabValidation] = useState<any>({});
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);
    const [writingLines, setWritingLines] = useState<string[]>(['', '', '', '']);
    const [d2Answers, setD2Answers] = useState<Record<string, string>>({});
    const [d2Val, setD2Val] = useState<Record<string, 'correct' | 'incorrect' | 'unchecked'>>({});
    const [isD2Finished, setIsD2Finished] = useState(false);

    const initialLearningPath = useMemo(() => [
        { key: 'vocabulary', name: '1. Vocabulary (Weather & House)', icon: Home, status: 'active' },
        { key: 'grammar', name: '2. Grammar: Intro', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: '3. Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'grammar2', name: '4. Grammar 2', icon: GraduationCap, status: 'locked' },
        { key: 'ex2', name: '5. Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'grammar3', name: '6. Grammar 3', icon: GraduationCap, status: 'locked' },
        { key: 'dialogue1', name: '7. Dialogue 1', icon: MessageSquare, status: 'locked' },
        { key: 'ex3', name: '8. Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'ex4', name: '9. Exercise 4', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '10. Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
        { key: 'writing1', name: '11. Writing 1', icon: Pencil, status: 'locked' },
        { key: 'dialogue2', name: '12. Dialogue 2', icon: MessageSquare, status: 'locked' },
    ], []);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    const handleTopicSelect = (key: string) => {
        const t = learningPath.find(it => it.key === key);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(key);
        if (['grammar', 'grammar2', 'grammar3'].includes(key)) handleTopicComplete(key);
    };

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
        let path = initialLearningPath.map(t => ({ ...t }));
        let savedST = '';
        if (isAdmin && !overrideStudentId) path.forEach(t => (t as any).status = 'completed');
        else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const d = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(t => { if (d[t.key]) (t as any).status = d[t.key]; });
            savedST = d.lastSelectedTopic || '';
            if (d.writingLines) setWritingLines(d.writingLines);
            if (d.d2Answers) setD2Answers(d.d2Answers);
            if (d.isD2Finished) setIsD2Finished(d.isD2Finished);
        }
        let lastDone = true;
        for(let i=0; i < path.length; i++) { if (lastDone && (path[i] as any).status === 'locked') (path[i] as any).status = 'active'; lastDone = (path[i] as any).status === 'completed'; }
        setLearningPath(path as Topic[]);
        setSelectedTopic(savedST || path.find(p => p.status === 'active')?.key || path[0].key);
        
        const initAns: any = {}; const initVal: any = {};
        Object.keys(vocabularyData).forEach(c => {
            initAns[c] = Array((vocabularyData as any)[c].length).fill('');
            initVal[c] = Array((vocabularyData as any)[c].length).fill('unchecked');
        });
        setVocabAnswers(initAns); setVocabValidation(initVal);
        setInitialLoadComplete(true); setIsInitialLoading(false);
        hasInitialized.current = true;
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, overrideStudentId, initialLoadComplete]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || overrideStudentId || !hasInitialized.current || !user) return;
        const saveTimer = setTimeout(() => {
            const s: any = { 
                lastSelectedTopic: selectedTopic,
                writingLines,
                d2Answers,
                isD2Finished
            };
            learningPath.forEach(t => s[t.key] = t.status);
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
            if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
        }, 1500);
        return () => clearTimeout(saveTimer);
    }, [learningPath, isAdmin, progressValue, studentDocRef, selectedTopic, isInitialLoading, writingLines, d2Answers, isD2Finished, initialLoadComplete, user, overrideStudentId]);

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

    const handleD2Check = () => {
        const newVal: any = {};
        let allOk = true;
        dialogue2Data.forEach((line, lIdx) => {
            line.answers.forEach((ansGroup, aIdx) => {
                const userAns = (d2Answers[`${lIdx}-${aIdx}`] || '').trim().toUpperCase();
                const isOk = ansGroup.some(correct => correct.toUpperCase() === userAns);
                newVal[`${lIdx}-${aIdx}`] = isOk ? 'correct' : 'incorrect';
                if (!isOk) allOk = false;
            });
        });
        setD2Val(newVal);
        if (allOk) toast({ title: "¡Perfecto!", description: "Pulsa FINISH para terminar la clase." });
        else toast({ variant: 'destructive', title: "Revisa el diálogo", description: "Hay campos en rojo." });
    };

    const isD2Valid = useMemo(() => {
        const totalBlanks = dialogue2Data.reduce((acc, line) => acc + line.answers.length, 0);
        const correctBlanks = Object.values(d2Val).filter(v => v === 'correct').length;
        return totalBlanks > 0 && correctBlanks === totalBlanks;
    }, [d2Val]);

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>Vocabulary</CardTitle></CardHeader>
                        <CardContent>
                            <Accordion type="multiple" defaultValue={['weather', 'house']}>
                                {Object.keys(vocabularyData).map(c => (
                                    <AccordionItem key={c} value={c}>
                                        <AccordionTrigger className="capitalize font-bold text-lg">{c}</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="grid grid-cols-2 gap-2 text-base">
                                                {(vocabularyData as any)[c].map((v: any, i: number) => (
                                                    <React.Fragment key={i}>
                                                        <div className="p-2 border rounded bg-white/5">{v.spanish}</div>
                                                        <Input value={vocabAnswers[c][i] || ''} onChange={e => { if (overrideStudentId) return; const na = {...vocabAnswers}; na[c][i] = e.target.value; setVocabAnswers(na); }} className={cn(vocabValidation[c]?.[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabValidation[c]?.[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!overrideStudentId} />
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6"><Button onClick={handleVocabCheck} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-8 text-left text-foreground">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">GRAMMAR: DEMONSTRATIVES</CardTitle></CardHeader>
                        <CardContent className="space-y-6 font-bold text-lg">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4">
                                <p>SE USAN PARA INDICAR LA POSICION Y EL ESPACIO DE UN NOMBRE CON RESPETO AL SUJETO.</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-base">
                                    <div className='p-4 border rounded bg-muted'><p className='text-primary'>THIS: ESTE/A</p><p className='text-xs italic'>(CERCA, SINGULAR)</p></div>
                                    <div className='p-4 border rounded bg-muted'><p className='text-primary'>THESE: ESTAS/OS</p><p className='text-xs italic'>(CERCA, PLURAL)</p></div>
                                    <div className='p-4 border rounded bg-muted'><p className='text-primary'>THAT: ESE/A</p><p className='text-xs italic'>(LEJOS, SINGULAR)</p></div>
                                    <div className='p-4 border rounded bg-muted'><p className='text-primary'>THOSE: ESOS/AS</p><p className='text-xs italic'>(LEJOS, PLURAL)</p></div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'ex1': return <SimpleTranslationExercise course="a1" exerciseKey="c9_ex1" onComplete={() => handleTopicComplete('ex1')} vocabulary={ex1Vocab} highlightVocabulary={true} />;
            case 'grammar2':
                return (
                    <div className="space-y-6 text-left text-foreground">
                        <h2 className="text-3xl font-black text-center text-primary uppercase tracking-tighter">Grammar 2: One and Ones 🚀</h2>
                        
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                            <CardHeader><CardTitle className="text-xl font-bold text-primary uppercase">ONE AND ONES</CardTitle></CardHeader>
                            <CardContent className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border">
                                <p className="text-lg font-bold">REEMPLAZA EL SUSTANTIVO POR “ONE” (SINGULAR) Y “ONES” (PLURAL)</p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                            <CardHeader><CardTitle className="text-xl font-bold text-primary uppercase">DEMOSTRATIVOS + ONE/ ONES</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2 font-mono text-base bg-muted p-4 rounded-xl border">
                                    <p>THIS ONE? (ESTE?) <span className="text-muted-foreground text-sm italic">IMPLICITANDO EL SUJETO CERCA Y SINGULAR</span></p>
                                    <p>THESE ONES? (ESTOS?) <span className="text-muted-foreground text-sm italic">IMPLICITANDO EL SUJETO CERCA Y PLURAL</span></p>
                                    <p>THAT ONE? (AQUEL?) <span className="text-muted-foreground text-sm italic">IMPLICITANDO EL SUJETO LEJOS Y SINGULAR</span></p>
                                    <p>THOSE ONES? (AQUELLOS?) <span className="text-muted-foreground text-sm italic">IMPLICITANDO EL SUJETO LEJOS Y PLURAL</span></p>
                                </div>
                                <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                                    <p className="text-sm font-bold flex items-center gap-2"><Info className="h-4 w-4" /> NOTA: tenemos la opcion de utilizar numeros en reemplazo de "Ones"</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-xl font-bold text-primary uppercase">EXAMPLE: TODAS FRASES TIENEN RELACION</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 bg-background rounded-xl border space-y-3 font-mono">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">A ELLA NO LE GUSTAN ESTOS COMPUTADORES</p>
                                        <p className="font-bold text-primary">SHE DOESN'T LIKE THESE COMPUTERS</p>
                                    </div>
                                    <Separator className="opacity-30" />
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">A ELLA NO LE GUSTAN ESTOS</p>
                                        <p className="font-bold text-primary">SHE DOESN'T LIKE THESE ONES</p>
                                    </div>
                                    <Separator className="opacity-30" />
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">A ELLA NO LE GUSTAN ESTOS TRES</p>
                                        <p className="font-bold text-primary">SHE DOESN'T LIKE THESE THREE</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-xl font-bold text-primary uppercase">PODEMOS USAR EL DEMOSTRATIVO SOLO SI YA SE DA POR ENTENDIDO EL CONTEXTO.</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-4 bg-muted/50 rounded-xl border font-mono space-y-2">
                                    <p>I DON’T LIKE THIS <span className="text-muted-foreground text-sm">(NO ME GUSTA ESTO)</span></p>
                                    <p>THAT WASN’T WHAT I EXPECTED <span className="text-muted-foreground text-sm">(ESO NO ERA LO QUE ESPERABA)</span></p>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <h4 className="font-black text-primary uppercase text-sm border-b pb-1">EJEMPLOS (SINGULAR)</h4>
                                        <div className="space-y-4 text-sm font-medium">
                                            <div>
                                                <p>1- ¿TE GUSTA ESTE VESTIDO? - ¿TE GUSTA ESTE?</p>
                                            </div>
                                            <div>
                                                <p>2- ¿TE GUSTA ESE CARRO? - ¿TE GUSTA ESE?</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="font-black text-primary uppercase text-sm border-b pb-1">EJEMPLOS "PLURAL"</h4>
                                        <div className="space-y-4 text-sm font-medium">
                                            <div>
                                                <p>1- ¿TE GUSTAN ESTAS BOTAS? - ¿TE GUSTAN ESTAS?</p>
                                            </div>
                                            <div>
                                                <p>2- ¿TE GUSTAN ESOS CABALLOS? - ¿TE GUSTAN ESOS?</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center border-t pt-6">
                                <Button onClick={() => handleTopicComplete('grammar2')} size="lg" className="px-16 font-bold h-14 text-xl text-white">Entendido <ArrowRight className="ml-2" /></Button>
                            </CardFooter>
                        </Card>
                    </div>
                );
            case 'ex2': return <SimpleTranslationExercise course="a1" exerciseKey="c9_ex2" onComplete={() => handleTopicComplete('ex2')} vocabulary={ex2Vocab} highlightVocabulary={true} />;
            case 'grammar3':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left text-foreground">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">ONE - ONES: Estructuras y Variantes</CardTitle></CardHeader>
                        <CardContent className="space-y-6 font-bold text-lg">
                            <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                <ol className="list-decimal pl-5 space-y-1 mb-6">
                                    <li>DEMOSTRATIVOS</li>
                                    <li>ADJETIVOS</li>
                                    <li>WHICH?</li>
                                    <li>OTHER – ANOTHER</li>
                                </ol>
                                
                                <div className="space-y-4">
                                    <div className="p-4 bg-background/50 rounded-xl border border-primary/20">
                                        <p className="text-primary font-black text-sm uppercase mb-1">ANOTHER</p>
                                        <p className="text-base font-normal">Se utiliza para referirse a una cosa ó persona adicional del mismo tipo de la que ya se mencionó.</p>
                                    </div>
                                    <div className="p-4 bg-background/50 rounded-xl border border-brand-purple/20">
                                        <p className="text-brand-purple font-black text-sm uppercase mb-1">OTHER</p>
                                        <p className="text-base font-normal">Se utiliza para referirse a una cosa o a una persona que es diferente o distinta de una que ya se mencionó.</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6">
                            <Button onClick={() => handleTopicComplete('grammar3')} size="lg" className="px-12 font-bold text-white">Entendido</Button>
                        </CardFooter>
                    </Card>
                );
            case 'dialogue1': return <LargeTextTranslation title="Dialogue 1" phrases={dialogue1Phrases} onComplete={() => handleTopicComplete('dialogue1')} vocabulary={dial1Vocab} highlightVocabulary={true} />;
            case 'ex3': return <SimpleTranslationExercise course="a1" exerciseKey="c9_ex3" onComplete={() => handleTopicComplete('ex3')} vocabulary={ex3Vocab} highlightVocabulary={true} />;
            case 'ex4': return <SimpleTranslationExercise course="a1" exerciseKey="c9_ex4" onComplete={() => handleTopicComplete('ex4')} vocabulary={ex4Vocab} highlightVocabulary={true} />;
            case 'vocab_game': return <VocabularyMatchingGame data={[...vocabularyData.weather, ...vocabularyData.house].map(v => ({ spanish: v.spanish, english: v.english }))} onComplete={() => handleTopicComplete('vocab_game')} title="Memory Game: Weather & House" />;
            case 'writing1':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>Writing 1</CardTitle><CardDescription>Crea una frase con This- That- These- Those + One/Ones.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            {writingLines.map((line, idx) => (
                                <div key={idx} className="space-y-1">
                                    <Label className='font-bold uppercase text-[10px] text-muted-foreground'>Sentence {idx+1}:</Label>
                                    <Input value={line} onChange={e => { if (overrideStudentId) return; const nl = [...writingLines]; nl[idx] = e.target.value; setWritingLines(nl); }} readOnly={!!overrideStudentId} autoComplete="off" />
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('writing1')} size="lg" className='px-12 font-bold uppercase'>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'dialogue2':
                if (isD2Finished) {
                    return (
                        <Card className="shadow-soft rounded-lg border-2 border-green-500 bg-green-500/10 p-12 text-center flex flex-col items-center animate-in fade-in zoom-in duration-500 text-foreground">
                            <Trophy className="h-24 w-24 text-yellow-400 mb-6 animate-bounce" />
                            <h2 className="text-4xl font-black uppercase text-green-600 tracking-tighter">CONGRATULATIONS!</h2>
                            <p className="text-2xl mt-4 font-bold">You finish Class 9 (A1)</p>
                            <p className='text-slate-800 dark:text-slate-200 mt-2 text-lg font-medium'>Misión completada al 100%.</p>
                            <Button asChild className="mt-8 px-12 h-12 font-bold" variant="outline">
                                <Link href="/ingles/a1/unit/2">Volver a la Unidad 2</Link>
                            </Button>
                        </Card>
                    );
                }
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>Dialogue 2</CardTitle><CardDescription>Completa el diálogo con los demostrativos y "one/ones" correctos.</CardDescription></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-6 bg-muted/30 p-6 rounded-2xl border text-black dark:text-white">
                                {dialogue2Data.map((line, lIdx) => (
                                    <div key={lIdx} className="flex gap-2 items-baseline text-base sm:text-lg flex-wrap leading-relaxed">
                                        <span className="font-black text-primary shrink-0 min-w-[70px]">{line.speaker}:</span>
                                        {line.parts.map((part, pIdx) => (
                                            <Fragment key={pIdx}>
                                                <span>{part}</span>
                                                {pIdx < line.answers.length && (
                                                    <Input
                                                        value={d2Answers[`${lIdx}-${pIdx}`] || ''}
                                                        onChange={(e) => {
                                                            if (overrideStudentId) return;
                                                            setD2Answers({...d2Answers, [`${lIdx}-${pIdx}`]: e.target.value});
                                                            setD2Val({...d2Val, [`${lIdx}-${pIdx}`]: 'unchecked'});
                                                        }}
                                                        className={cn(
                                                            "w-28 h-8 inline-block text-center font-bold uppercase transition-all",
                                                            d2Val[`${lIdx}-${pIdx}`] === 'correct' && "border-green-500 bg-green-50/10 shadow-[0_0_8px_rgba(34,197,94,0.3)]",
                                                            d2Val[`${lIdx}-${pIdx}`] === 'incorrect' && "border-red-500 bg-red-50/10 shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                                                        )}
                                                        placeholder="..."
                                                        autoComplete="off"
                                                        readOnly={!!overrideStudentId}
                                                    />
                                                )}
                                            </Fragment>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6">
                            <Button onClick={handleD2Check} variant="secondary" disabled={!!overrideStudentId}>Verificar Diálogo</Button>
                            <Button 
                                onClick={() => {
                                    setIsD2Finished(true);
                                    handleTopicComplete('dialogue2');
                                }} 
                                disabled={!isD2Valid && !isAdmin} 
                                className="font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg px-8 uppercase tracking-widest"
                            >
                                Finish
                            </Button>
                        </CardFooter>
                    </Card>
                );
            default: return null;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {isAdmin && overrideStudentId && (
                        <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md">
                            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400"><Star className="h-6 w-6 fill-current animate-pulse" /><p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión: {studentProfile?.name || currentUID}</p></div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors"><Link href="/admin">Cerrar</Link></Button>
                        </div>
                    )}

                    <div className="mb-8 text-left text-white">
                        <Link href="/ingles/a1/unit/2" className="hover:underline text-sm font-bold text-primary flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver a la Unidad 2</Link>
                        <h1 className="text-4xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase 9 (A1)</h1>
                    </div>

                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30">
                                    <CardTitle className="text-lg uppercase font-black text-primary">Misión 9A</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <nav><ul className="space-y-1">
                                        {learningPath.map((item) => {
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            const Icon = ICONS_CONFIG[item.status as keyof typeof ICONS_CONFIG] || BookOpen;
                                            return (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm')}>
                                                    <div className="flex items-center gap-3">
                                                        {item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}
                                                        <span className="truncate max-w-[150px] text-[10px] uppercase font-bold text-black dark:text-white">{item.name}</span>
                                                    </div>
                                                    {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                                </li>
                                            );
                                        })}
                                    </ul></nav>
                                    <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 font-black uppercase text-muted-foreground"><span>Avance Clase</span><span className="text-primary">{progressValue}%</span></div><Progress value={progressValue} className="h-2 rounded-full" /></div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

