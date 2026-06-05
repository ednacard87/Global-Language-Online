'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    GraduationCap, 
    CheckCircle, 
    Loader2, 
    ArrowRight, 
    MessageSquare, 
    BookText, 
    ArrowLeft,
    XCircle,
    Info,
    Globe,
    HelpCircle,
    Gamepad2,
    Check
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
import { DialogueCompletionExercise } from '@/components/kids/exercises/dialogue-completion-exercise';
import { SentenceCompletionExercise, type CompletionPrompt } from '@/components/kids/exercises/sentence-completion-exercise';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DashboardHeader } from '@/components/dashboard/header';
import { Footer } from '@/components/footer';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { Label } from '@/components/ui/label';

// --- DATA ---

const progressStorageVersion = 'progress_a1_eng_u2_c10_v215_stable';
const mainProgressKey = 'progress_a1_eng_unit_2_class_10';

const vocabularyData = {
    verbos: [
        { spanish: 'CAER', english: 'TO FALL' },
        { spanish: 'SENTIR', english: 'TO FEEL' },
        { spanish: 'LUCHAR', english: 'TO FIGHT' },
        { spanish: 'ENCONTRAR', english: 'TO FIND' },
        { spanish: 'DAR', english: 'TO GIVE' },
        { spanish: 'VOLAR', english: 'TO FLY' },
        { spanish: 'OLVIDAR', english: 'TO FORGET' },
        { spanish: 'PERDONAR', english: 'TO FORGIVE' },
    ],
    palabras: [
        { spanish: 'CALIENTE', english: 'HOT' },
        { spanish: 'CALIDO', english: 'WARM' },
        { spanish: 'ESTACION (TIEMPO)', english: 'SEASON' },
        { spanish: 'CUCHILLO', english: 'KNIFE' },
        { spanish: 'OLLA', english: 'POT' },
        { spanish: 'TENEDOR', english: 'FORK' },
        { spanish: 'CUCHARA', english: 'SPOON' },
        { spanish: 'PLATO', english: 'DISH' },
        { spanish: 'VASO', english: 'GLASS' },
        { spanish: 'CUBIERTOS', english: 'SILVERWARE' },
    ]
};

const dialogue1Phrases = [
    { spanish: "MARY: ¿CUANTO VALE ESTA BUFANDA?", answers: ["how much is this scarf?", "how much does this scarf cost?"] },
    { spanish: "JON: ESTA CUESTA 20 DOLARES", answers: ["this costs 20 dollars", "this one costs 20 dollars"] },
    { spanish: "MARY: ¿CUANTO VALE ESA SOMBRILLA?", answers: ["how much is that umbrella?", "how much does that umbrella cost?"] },
    { spanish: "JON: ¿CUAL?", answers: ["which one?"] },
    { spanish: "MARY: LA MORADA", answers: ["the purple one"] },
    { spanish: "JON: ESA CUESTA 13", answers: ["that one costs 13", "that one is 13"] },
    { spanish: "MARY: ¿CUANTO VALEN ESOS GUANTES?", answers: ["how much are those gloves?"] },
    { spanish: "JON: ESTOS CUESTAN 18", answers: ["these ones cost 18", "these cost 18"] },
    { spanish: "MARY: ¿CUANTO VALEN ESAS BOTAS?", answers: ["how much are those boots?"] },
    { spanish: "JON: ¿CUALES?", answers: ["which ones?"] },
    { spanish: "MARY: LAS GRISES", answers: ["the gray ones", "the grey ones"] },
    { spanish: "JON: ESAS CUESTAN $ 40, PORQUE ESAS SON DE CUERO", answers: ["those ones cost 40 because those are leather", "those cost 40 dollars because they are made of leather"] },
    { spanish: "MARY: GRACIAS, PASARÉ DE NUEVO", answers: ["thank you, i will pass by again", "thanks, i'll come back again"] },
];

const dialogue2Data = [
    { speaker: "MARY", parts: ["EXCUSE ME. HOW MUCH ARE ", " T-SHIRTS?"], answers: [["THOSE", "THESE"]] },
    { speaker: "JON", parts: ["WHICH ", "? DO YOU MEAN ", "?"], answers: [["ONES"], ["THESE", "THOSE"]] },
    { speaker: "MARY", parts: ["NO, THE WHITE ", "."], answers: [["ONES", "ONE"]] },
    { speaker: "JON", parts: ["OH, THOSE ", " 16"], answers: [["ARE"]] },
    { speaker: "MARY", parts: ["WOW! THAT’S EXPENSIVE!"], answers: [] },
    { speaker: "MARY", parts: ["HOW MUCH IS ", " BACKPACK?"], answers: [["THIS", "THAT"]] },
    { speaker: "JON", parts: ["WHICH ", "?"], answers: [["ONE"]] },
    { speaker: "MARY", parts: ["THE PINK ", "."], answers: [["ONE"]] },
    { speaker: "JON", parts: ["IT’S $ 36 BUT ", " GREEN ", " IS ONLY $ 22."], answers: [["THIS", "THAT"], ["ONE"]] },
    { speaker: "MARY", parts: ["THAT’S NOT BAD. CAN I SEE IT? PLEASE"], answers: [] },
];

const exerciseThe2Data: CompletionPrompt[] = [
    { parts: ["I WENT TO ", " SICILY ISLAND IN ITALY LAST YEAR. THAT WAS WONDERFUL"], answers: ["THE"] },
    { parts: ["WHEN I WAS 16, I WENT TO ", " EUROPE WITH MY PARENTS."], answers: [""] },
    { parts: ["THEY GO TO ", " MOUNT EVEREST BECAUSE THEY WANT TO CLIMB THAT MOUNTAIN."], answers: [""] },
    { parts: ["DO YOU LIKE ", " PARIS ARCHITECTURE?"], answers: ["THE"] },
    { parts: ["WE WENT BY TRAIN TO ", " NORTH OF FRANCE."], answers: ["THE"] },
    { parts: ["I SAW TO ", " ATLANTIC OCEAN WHEN I WENT TO THE COAST."], answers: ["THE"] },
    { parts: ["SHE LIVES CLOSE TO ", " MAGDALENA RIVER."], answers: ["THE"] },
    { parts: ["DID THEY GO TO ", " UNITED STATES LAST YEAR?"], answers: ["THE"] },
    { parts: ["THEY TRAVEL TO ", " ALPS."], answers: ["THE"] },
    { parts: ["I WANT TO VISIT ", " UNITED KINGDOM NEXT YEAR."], answers: ["THE"] },
];

const ex1Vocab = { "tigre": "tiger", "pequeño": "small", "portátil": "laptop", "nuevo": "new", "sombrilla": "umbrella", "vestido": "dress", "postre": "dessert", "chocolate": "chocolate", "celular": "cellphone", "gafas": "glasses", "chaqueta": "jacket", "jugo": "juice", "maracuyá": "passion fruit", "botas": "boots" };
const dial1Vocab = { "bufanda": "scarf", "sombrilla": "umbrella", "morada": "purple", "guantes": "gloves", "botas": "boots", "grises": "gray/grey", "cuero": "leather", "pasaré de nuevo": "come back / pass by again" };
const ex2Vocab = { "juego": "game", "gafas": "glasses", "relojes": "watches", "viejo": "old", "serie": "series", "gorras": "caps", "computadores": "computers", "mientras que": "while", "camiseta": "t-shirt", "moto": "motorcycle", "finca": "farm" };
const dial2Vocab = { "backpack": "maleta", "expensive": "caro", "white": "blanco", "pink": "rosado", "green": "verde" };
const the1Vocab = { "Reino Unido": "United Kingdom", "Alemania": "Germany", "Bahamas": "Bahamas", "sur": "south", "Monte Everest": "Everest mount", "Alpes": "Alps", "rio": "river", "Europa": "Europe", "lago": "lake", "luna de miel": "honeymoon", "isla": "island" };
const the2Vocab = { "wonderful": "maravilloso", "architecture": "arquitectura", "ocean": "océano", "coast": "costa", "close to": "cerca de", "next year": "próximo año" };

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

// --- MAIN COMPONENT ---

export default function Class10Content() {
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
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const [vocabAnswers, setVocabAnswers] = useState<any>({});
    const [vocabValidation, setVocabValidation] = useState<any>({});
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary (Basic Words)', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: 'Grammar: Intro', icon: GraduationCap, status: 'locked' },
        { key: 'grammar3', name: 'Grammar One-Ones', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'dialogue1', name: 'Dialogue 1', icon: MessageSquare, status: 'locked' },
        { key: 'exercise2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'dialogue2', name: 'Dialogue 2', icon: MessageSquare, status: 'locked' },
        { key: 'grammar2', name: 'Grammar: The', icon: GraduationCap, status: 'locked' },
        { key: 'ex_the1', name: 'Exercise with "The" 1', icon: PenSquare, status: 'locked' },
        { key: 'ex_the2', name: 'Exercise with "The" 2', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: 'Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
    ], []);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
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
        
        const initA: any = {}; const initV: any = {};
        Object.keys(vocabularyData).forEach(c => {
            initA[c] = Array((vocabularyData as any)[c].length).fill('');
            initV[c] = Array((vocabularyData as any)[c].length).fill('unchecked');
        });
        setVocabAnswers(initA); setVocabValidation(initV);
        setInitialLoadComplete(true); setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;
        const s: any = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(t => (s as any)[t.key] = t.status);
        if (JSON.stringify(s) !== JSON.stringify(studentProfile?.lessonProgress?.[progressStorageVersion])) {
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        }
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, studentProfile, isInitialLoading]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(curr => {
            let win = false; let next: string | null = null;
            const np = curr.map(t => ({ ...t }));
            const i = np.findIndex(t => t.key === topicToComplete);
            if (i !== -1 && np[i].status !== 'completed') {
                np[i].status = 'completed';
                if (i + 1 < np.length && np[i + 1].status === 'locked') {
                    np[i + 1].status = 'active';
                    win = true;
                    next = np[i + 1].key;
                }
            }
            if (win) setTimeout(() => toast({ title: "¡Siguiente tema desbloqueado!" }), 0);
            if (next) { const n = next; setTimeout(() => setSelectedTopic(n), 0); }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const t = learningPath.find(it => it.key === topicKey);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (['grammar', 'grammar2', 'grammar3'].includes(topicKey)) handleTopicComplete(topicKey);
    };

    const handleVocabCheck = () => {
        let ok = false; const nv: any = {};
        Object.keys(vocabularyData).forEach(c => {
            nv[c] = (vocabularyData as any)[c].map((v: any, i: number) => {
                const res = v.english.toUpperCase() === (vocabAnswers[c][i] || '').trim().toUpperCase();
                if (res) ok = true; return res ? 'correct' : 'incorrect';
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
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left">
                        <CardHeader><CardTitle>Vocabulary</CardTitle></CardHeader>
                        <CardContent><Accordion type="multiple" defaultValue={['verbos', 'palabras']}>{Object.keys(vocabularyData).map(c => (<AccordionItem key={c} value={c}><AccordionTrigger className="capitalize font-bold">{c}</AccordionTrigger><AccordionContent><div className="grid grid-cols-2 gap-2">{(vocabularyData as any)[c].map((v: any, i: number) => (<React.Fragment key={i}><div className="p-2 border rounded bg-muted/10">{v.spanish}</div><Input value={vocabAnswers[c][i]} onChange={e => { const na = {...vocabAnswers}; na[c][i] = e.target.value; setVocabAnswers(na); setCanAdvanceVocab(false); }} className={cn(vocabValidation[c]?.[i] === 'correct' ? 'border-green-500' : vocabValidation[c]?.[i] === 'incorrect' ? 'border-red-500' : '')} /></React.Fragment>))}</div></AccordionContent></AccordionItem>))}</Accordion></CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 mt-4"><Button onClick={handleVocabCheck} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <div className="space-y-6 text-left">
                        <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6">
                            <CardHeader>
                                <CardTitle className="text-2xl font-black text-primary uppercase">DIFERENCIA ENTRE "WHAT" - "WHICH"</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="p-6 bg-white/50 dark:bg-background/20 rounded-2xl border flex flex-col items-center justify-center text-center">
                                        <p className="text-3xl font-black text-primary mb-2">WHAT?</p>
                                        <Separator className="w-12 h-1 bg-primary mb-2" />
                                        <p className="text-lg font-bold text-foreground">¿CUÁL? - ¿QUÉ?</p>
                                    </div>
                                    <div className="p-6 bg-white/50 dark:bg-background/20 rounded-2xl border flex flex-col items-center justify-center text-center">
                                        <p className="text-3xl font-black text-brand-purple mb-2">WHICH?</p>
                                        <Separator className="w-12 h-1 bg-brand-purple mb-2" />
                                        <p className="text-lg font-bold text-foreground">¿CUÁL?</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                        <h3 className="text-primary font-black uppercase text-sm mb-2 flex items-center gap-2">
                                            <Globe className="h-4 w-4" /> WHAT? : ¿CUAL?
                                        </h3>
                                        <p className="font-bold text-lg text-foreground">ES UNA PREGUNTA GENERAL, NO ESTAMOS EN EL CONTEXTO.</p>
                                    </div>

                                    <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                        <h3 className="text-brand-purple font-black uppercase text-sm mb-2 flex items-center gap-2">
                                            <Info className="h-4 w-4" /> WHICH? : ¿CUAL?
                                        </h3>
                                        <p className="font-bold text-lg text-foreground">PARA ELEGIR EN UN GRUPO DEFINIDO DE ELEMENTOS - VES LOS OBJETOS.</p>
                                    </div>
                                </div>

                                <div className="p-6 bg-muted/50 rounded-2xl border-2 border-dashed space-y-4">
                                    <h3 className="font-black text-primary uppercase text-sm flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4" /> EXAMPLE:
                                    </h3>
                                    <div className="space-y-3 font-mono text-base">
                                        <div className="p-3 bg-background rounded-xl border text-foreground">
                                            <p className="text-muted-foreground text-sm mb-1">1- ¿CUAL ES TU HELADO FAVORITO?</p>
                                            <p className="font-bold text-primary">WHAT IS YOUR FAVORITE ICE CREAM?</p>
                                        </div>
                                        <div className="p-3 bg-background rounded-xl border text-foreground">
                                            <p className="text-muted-foreground text-sm mb-1">2- ¿CUAL HELADO QUIERES? –(ENTRE ESTOS):</p>
                                            <p className="font-bold text-brand-purple">WHICH ICE CREAM DO YOU WANT?</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center border-t pt-6">
                                <Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-16 font-bold text-white h-12">Entendido</Button>
                            </CardFooter>
                        </Card>
                    </div>
                );
            case 'grammar3':
                return (
                    <div className="space-y-6 text-left">
                        <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left text-foreground">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">ONE - ONES</CardTitle></CardHeader>
                            <CardContent className="space-y-6 text-black dark:text-white font-bold text-lg">
                                 <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                    <p className="text-lg font-bold text-foreground">Podemos elegir reemplazar el sustantivo por ONE / ONES solo si ya conocemos el contexto.</p>
                                </div>
                                <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                    <ol className="list-decimal pl-5 space-y-2 mb-6 text-foreground">
                                        <li>DEMOSTRATIVOS</li>
                                        <li>ADJETIVOS</li>
                                        <li>WHICH?</li>
                                        <li>OTHER – ANOTHER</li>
                                    </ol>
                                    
                                    <div className="space-y-4">
                                        <div className="p-4 bg-background/50 rounded-xl border border-primary/20 text-foreground">
                                            <p className="text-primary font-black text-sm uppercase mb-1">ANOTHER</p>
                                            <p className="text-base font-normal">Se utiliza para referirse a una cosa ó persona adicional del mismo tipo de la que ya se mencionó.</p>
                                        </div>
                                        <div className="p-4 bg-background/50 rounded-xl border border-brand-purple/20 text-foreground">
                                            <p className="text-brand-purple font-black text-sm uppercase mb-1">OTHER</p>
                                            <p className="text-base font-normal">Se utiliza para referirse a una cosa o a una persona que es diferente o distinta de una que ya se mencionó.</p>
                                        </div>
                                    </div>
                                </div>
                                
                            </CardContent>
                        </Card>

                        <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left text-foreground">
                            <CardHeader>
                                <CardTitle className="text-2xl font-black text-primary uppercase">WHICH + ONE/ ONES</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/50 dark:bg-background/20 rounded-xl border flex flex-col items-center justify-center text-center">
                                        <p className="text-xl font-black text-primary">Which one?</p>
                                        <p className="text-sm">Singular – ¿Cuál?</p>
                                    </div>
                                    <div className="p-4 bg-white/50 dark:bg-background/20 rounded-xl border flex flex-col items-center justify-center text-center">
                                        <p className="text-xl font-black text-brand-purple">Which ones?</p>
                                        <p className="text-sm">Plural – ¿Cuáles?</p>
                                    </div>
                                </div>
                                
                                <div className="p-6 bg-muted/50 rounded-2xl border-2 border-dashed space-y-4">
                                    <h3 className="font-black text-primary uppercase text-sm flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4" /> EXAMPLE:
                                    </h3>
                                    <div className="space-y-4 font-mono text-base">
                                        <div className="p-3 bg-background rounded-xl border text-foreground">
                                            <p className="text-muted-foreground text-xs mb-1">¿CUÁL CASA COMPRA ELLA?</p>
                                            <p className="font-bold">WHICH HOUSE DOES SHE BUY?</p>
                                            <Separator className="my-2" />
                                            <p className="text-muted-foreground text-xs mb-1">¿CUÁL COMPRA ELLA?</p>
                                            <p className="font-bold text-primary">WHICH ONE DOES SHE BUY?</p>
                                        </div>
                                        <div className="p-3 bg-background rounded-xl border text-foreground">
                                            <p className="text-muted-foreground text-xs mb-1">¿CUÁLES MANZANAS COMEN ELLOS?</p>
                                            <p className="font-bold">WHICH MANGOES DO THEY EAT?</p>
                                            <Separator className="my-2" />
                                            <p className="text-muted-foreground text-xs mb-1">¿CUÁLES SE COMEN ELLOS?</p>
                                            <p className="font-bold text-brand-purple">WHICH ONES DO THEY EAT?</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center border-t pt-6">
                                <Button onClick={() => handleTopicComplete('grammar3')} size="lg" className="px-12 font-bold text-white">Entendido</Button>
                            </CardFooter>
                        </Card>
                    </div>
                );
            case 'ex1': return <SimpleTranslationExercise exerciseKey="c10_ex1" course="a1" onComplete={() => handleTopicComplete('ex1')} title="Exercise 1: ONE / ONES" vocabulary={ex1Vocab} highlightVocabulary={true} />;
            case 'dialogue1': return <LargeTextTranslation title="Dialogue 1" phrases={dialogue1Phrases} onComplete={() => handleTopicComplete('dialogue1')} vocabulary={dial1Vocab} highlightVocabulary={true} />;
            case 'exercise2': return <SimpleTranslationExercise exerciseKey="c10_ex2" course="a1" onComplete={() => handleTopicComplete('exercise2')} title="Exercise 2" vocabulary={ex2Vocab} highlightVocabulary={true} />;
            case 'dialogue2': return <DialogueCompletionExercise title="Dialogue 2" description="Completa con demostrativos, 'one' o 'ones'." dialogue={dialogue2Data} onComplete={() => handleTopicComplete('dialogue2')} vocabulary={dial2Vocab} />;
            case 'grammar2':
                return (
                    <div className="space-y-6 text-left">
                        <h2 className="text-3xl font-black text-center text-primary uppercase tracking-tighter">THE DEFINITE ARTICLE: “THE” 🚀</h2>
                        
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
                            <CardHeader>
                                <CardTitle className="text-xl font-bold text-primary uppercase tracking-tight">ARTICULO DEFINIDO - DEFINITE ARTICLE</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-6 bg-slate-100 dark:bg-slate-800/50 rounded-[2rem] border border-border/50">
                                    <p className="text-lg font-bold">1- THE = el, la, los, las</p>
                                </div>

                                <div className="p-6 bg-slate-100 dark:bg-slate-800/50 rounded-[2rem] border border-border/50">
                                    <h3 className="font-bold text-primary mb-3 uppercase tracking-tight">2- Pronunciation</h3>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="p-4 bg-background rounded-xl border-2 border-dashed">
                                            <p className="text-lg font-black text-primary">(de) = the + consonant</p>
                                            <p className="mt-1 font-mono text-sm">the motorcycle / the house</p>
                                        </div>
                                        <div className="p-4 bg-background rounded-2xl border-2 border-dashed">
                                            <p className="text-lg font-black text-primary">(di) = the + vowel</p>
                                            <p className="mt-1 font-mono text-sm">the elevator / the oranges / the apples</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-100 dark:bg-slate-800/50 rounded-[2rem] border border-border/50 space-y-4">
                                    <h3 className="font-bold text-primary mb-1 uppercase tracking-tight">3- USE = specific things</h3>
                                    <div className="space-y-2">
                                        <p className="font-mono bg-background p-3 rounded-lg border text-sm italic">
                                            "i like <span className="font-bold text-primary">the gray computer</span> that i bought in Monterrey shopping center last month"
                                        </p>
                                        <Separator className="my-2" />
                                        <div className="grid grid-cols-2 gap-4 text-center">
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">me gustan los computadores</p>
                                                <p className="font-bold">i like Computers</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
                            <CardHeader>
                                <CardTitle className="text-xl font-bold text-primary uppercase">4- NOMBRES GEOGRAFICOS CON "THE"</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-foreground">
                                    <li className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-border/50">
                                        <p className="font-bold text-primary text-sm mb-1 uppercase">1. PAISES CON PALABRAS CLAVE</p>
                                        <p className="text-sm">“REPUBLICA”, “ESTADO”, “REINO” – “UNION”</p>
                                        <p className="text-xs font-mono mt-1 text-muted-foreground italic">Ex: THE UNITED STATES / THE UNITED KINGDOM</p>
                                    </li>
                                    <li className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-border/50">
                                        <p className="font-bold text-primary text-sm mb-1 uppercase">2. PAISES CON NOMBRE EN PLURAL</p>
                                        <p className="text-xs font-mono mt-1 text-muted-foreground italic">Ex: THE NETHERLANDS</p>
                                    </li>
                                    <li className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-border/50">
                                        <p className="font-bold text-primary text-sm mb-1 uppercase">3. ISLAS CON NOMBRE EN PLURAL</p>
                                        <p className="text-xs font-mono mt-1 text-muted-foreground italic">Ex: THE BAHAMAS</p>
                                    </li>
                                    <li className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-border/50">
                                        <p className="font-bold text-primary text-sm mb-1 uppercase">4. MONTAÑAS CON NOMBRE EN PLURAL</p>
                                        <p className="text-xs font-mono mt-1 text-muted-foreground italic">Ex: THE ANDES / THE ALPS</p>
                                    </li>
                                    <li className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-border/50">
                                        <p className="font-bold text-primary text-sm mb-1 uppercase">5. REGIONES</p>
                                        <p className="text-xs font-mono mt-1 text-muted-foreground italic">Ex: THE SOUTH OF CANADA / THE NORTH OF GERMANY</p>
                                    </li>
                                    <li className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-border/50">
                                        <p className="font-bold text-primary text-sm mb-1 uppercase">6. OCEANOS, MARES Y RIOS</p>
                                        <p className="text-xs font-mono mt-1 text-muted-foreground italic">Ex: THE MISSISSIPPI RIVER / THE ATLANTIC OCEAN</p>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
                            <CardHeader>
                                <CardTitle className="text-xl font-bold text-destructive uppercase">NO LLEVAN EL ARTICULO “THE”</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm text-foreground">
                                    <div className="p-3 bg-muted/50 rounded-xl border border-dashed flex flex-col gap-1">
                                        <p className="font-bold uppercase text-xs text-muted-foreground">1. CONTINENTES</p>
                                        <p className="font-mono italic">EUROPE – AFRICA</p>
                                    </div>
                                    <div className="p-3 bg-muted/50 rounded-xl border border-dashed flex flex-col gap-1">
                                        <p className="font-bold uppercase text-xs text-muted-foreground">2. PAISES Y ESTADOS</p>
                                        <p className="font-mono italic">GREECE - TEXAS</p>
                                    </div>
                                    <div className="p-3 bg-muted/50 rounded-xl border border-dashed flex flex-col gap-1">
                                        <p className="font-bold uppercase text-xs text-muted-foreground">3. CIUDADES</p>
                                        <p className="font-mono italic">LONDON – PARIS - BERLIN</p>
                                    </div>
                                    <div className="p-3 bg-muted/50 rounded-xl border border-dashed flex flex-col gap-1">
                                        <p className="font-bold uppercase text-xs text-muted-foreground">4. MONTAÑAS EN SINGULAR</p>
                                        <p className="font-mono italic">MOUNT EVEREST</p>
                                    </div>
                                    <div className="p-3 bg-muted/50 rounded-xl border border-dashed flex flex-col gap-1">
                                        <p className="font-bold uppercase text-xs text-muted-foreground">5. ISLAS EN SINGULAR</p>
                                        <p className="font-mono italic">SICILY</p>
                                    </div>
                                    <div className="p-3 bg-muted/50 rounded-xl border border-dashed flex flex-col gap-1">
                                        <p className="font-bold uppercase text-xs text-muted-foreground">6. LAGOS</p>
                                        <p className="font-mono italic">LAKE MICHIGAN</p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center border-t pt-6">
                                <Button onClick={() => handleTopicComplete('grammar2')} size="lg" className="px-12 font-bold text-white">Entendido</Button>
                            </CardFooter>
                        </Card>
                    </div>
                );
            case 'ex_the1': return <SimpleTranslationExercise exerciseKey="c10_the1" course="a1" onComplete={() => handleTopicComplete('ex_the1')} title="Exercise with 'The' 1" vocabulary={the1Vocab} highlightVocabulary={true} />;
            case 'ex_the2': return <SentenceCompletionExercise title="Exercise with 'The' 2" description="Usa THE si es necesario. Si no es necesario, deja en blanco o pon un guion (-)." data={exerciseThe2Data} onComplete={() => handleTopicComplete('ex_the2')} vocabulary={the2Vocab} />;
            case 'vocab_game':
                const matchingData = [
                    ...vocabularyData.verbos.map(v => ({ spanish: v.spanish, english: [v.english] })),
                    ...vocabularyData.palabras.map(v => ({ spanish: v.spanish, english: [v.english] }))
                ];
                return <VocabularyMatchingGame data={matchingData} onComplete={() => handleTopicComplete('vocab_game')} title="Vocab Game: Basic Words" />;
            default: return null;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-left text-white">
                        <Link href="/ingles/a1/unit/2" className="hover:underline text-sm font-bold text-primary flex items-center gap-2">
                            <ArrowLeft className='h-4 w-4'/> Volver a la Unidad 2
                        </Link>
                        <h1 className="text-4xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase 10 (A1)</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader><CardTitle className="text-lg">Ruta</CardTitle></CardHeader>
                                <CardContent>
                                    <nav><ul className="space-y-1">
                                        {learningPath.map(item => (
                                            <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', (item.status === 'locked' && !isAdmin) ? 'text-muted-foreground/50' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-semibold')}>
                                                <div className="flex items-center gap-3">{(item.status === 'completed') ? <CheckCircle className="h-5 w-5 text-green-500" /> : <item.icon className="h-5 w-5" />}<span>{item.name}</span></div>
                                            </li>
                                        ))}
                                    </ul></nav>
                                    <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 text-foreground"><span>Progreso</span><span className="font-bold">{progressValue}%</span></div><Progress value={progressValue} className="h-2" /></div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
