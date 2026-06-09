'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Footer } from '@/components/footer';
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
    Gamepad2, 
    BookText, 
    Trophy,
    ArrowLeft,
    ArrowRight,
    HelpCircle,
    Check
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VerbVocabularyExercise } from '@/components/kids/exercises/verb-vocabulary';

/**
 * ESTRUCTURA BASE BLINDADA: ZERO CONDITIONAL (B1 NIÑOS)
 * ---------------------------------------------------
 */

type TopicStatus = 'locked' | 'active' | 'completed';

interface Topic {
  key: string;
  name: string;
  icon: React.ElementType;
  status: TopicStatus;
}

const progressStorageVersion = 'progress_kids_b1_zero_cond_v5_stable';
const mainProgressKey = 'progress_kids_b1_zero_conditional';

// --- DATA ---

const vocabularyData = {
    verbs: [
        { spanish: 'calentar', english: 'heat' },
        { spanish: 'hervir', english: 'boil' },
        { spanish: 'congelarse', english: 'freeze' },
        { spanish: 'derretirse', english: 'melt' },
        { spanish: 'llover', english: 'rain' },
        { spanish: 'crecer', english: 'grow' },
        { spanish: 'necesitar', english: 'need' },
        { spanish: 'estudiar', english: 'study' },
        { spanish: 'hacer ejercicio', english: 'exercise' },
        { spanish: 'comer', english: 'eat' },
        { spanish: 'beber', english: 'drink' },
        { spanish: 'dormir', english: 'sleep' },
    ],
    science: [
        { spanish: 'agua', english: 'water' },
        { spanish: 'hielo', english: 'ice' },
        { spanish: 'fuego', english: 'fire' },
        { spanish: 'planta', english: 'plant' },
        { spanish: 'sol', english: 'sun' },
        { spanish: 'temperatura', english: 'temperature' },
        { spanish: 'aire', english: 'air' },
        { spanish: 'tierra', english: 'earth' },
        { spanish: 'suelo', english: 'ground' },
    ],
    habits: [
        { spanish: 'cansado', english: 'tired' },
        { spanish: 'hambriento', english: 'hungry' },
        { spanish: 'sediento', english: 'thirsty' },
        { spanish: 'saludable', english: 'healthy' },
        { spanish: 'enfermo', english: 'sick' },
        { spanish: 'estresado', english: 'stressed' },
    ]
};

// --- Specific Vocabulary for Exercises ---
const ex1VocabSpecific = {
    "suelo": "ground", "mojar": "get wet", "calentar": "heat", "hervir": "boil",
    "congelar": "freeze", "convertir": "turn into", "hielo": "ice", "brillar": "shine",
    "temperatura": "temperature", "subir": "rise", "recibir": "get", "morir": "die"
};

const ex2VocabSpecific = {
    "hambre": "hungry", "comer": "eat", "algo": "something", "estudiar": "study",
    "aprender": "learn", "cansado": "tired", "ir a dormir": "go to sleep",
    "hacer ejercicio": "exercise", "saludable": "healthy", "tocar": "touch",
    "fuego": "fire", "quemar": "get burned", "sed": "thirsty", "beber": "drink",
    "frío": "cold", "chaqueta": "jacket"
};

const ex3VocabSpecific = {
    "aire": "air", "frío": "cold", "llover": "rain", "dormir": "sleep",
    "cansado": "tired", "enfermo": "sick", "quedarse en casa": "stay at home",
    "estresado": "stressed", "escuchar música": "listen to music", "sol": "sun",
    "ocultarse": "go down", "oscuro": "dark", "mezclar": "mix", "azul": "blue",
    "amarillo": "yellow", "obtener": "get", "verde": "green", "comer": "eat",
    "hambre": "hungry", "jugar": "play", "afuera": "outside", "ensuciarse": "get dirty",
    "calentar": "heat", "hielo": "ice", "derretirse": "melt", "tiempo libre": "free time",
    "leer": "read", "libro": "book"
};

const readingVocabSpecific = {
    "ciclo del agua": "water cycle", "hecho natural": "natural fact", "calentar": "heat",
    "tierra": "earth", "evaporarse": "evaporate", "subir": "go up", "vapor": "steam",
    "alcanzar": "reach", "aire": "air", "formar": "form", "nubes": "clouds",
    "frío": "cold", "llover": "rain", "crecer": "grow", "beber": "drink", "suelo": "ground"
};

const ex1Prompts = [
    { spanish: "Si llueve, el suelo se moja.", answer: ["if it rains, the ground gets wet"] },
    { spanish: "Si calientas agua, hierve.", answer: ["if you heat water, it boils"] },
    { spanish: "Si congelas agua, se convierte en hielo.", answer: ["if you freeze water, it turns into ice"] },
    { spanish: "Si el sol brilla, la temperatura sube.", answer: ["if the sun shines, the temperature rises"] },
    { spanish: "Si las plantas no reciben agua, mueren.", answer: ["if plants don't get water, they die"] },
];

const ex2Prompts = [
    { spanish: "Si tengo hambre, como algo.", answer: ["if i am hungry, i eat something", "if i'm hungry, i eat something"] },
    { spanish: "Si estudias mucho, aprendes mucho.", answer: ["if you study hard, you learn a lot"] },
    { spanish: "Si ella está cansada, se va a dormir.", answer: ["if she is tired, she goes to sleep", "if she's tired, she goes to sleep"] },
    { spanish: "Si hacemos ejercicio, nos sentimos saludables.", answer: ["if we exercise, we feel healthy"] },
    { spanish: "Si tocas el fuego, te quemas.", answer: ["if you touch fire, you get burned"] },
    { spanish: "Si tengo sed, bebo agua.", answer: ["if i am thirsty, i drink water", "if i'm thirsty, i drink water"] },
    { spanish: "Si hace frío, uso una chaqueta.", answer: ["if it is cold, i wear a jacket", "if it's cold, i wear a jacket"] },
];

const ex3Prompts = [
    { spanish: "Si el aire está frío, llueve.", answer: ["if the air is cold, it rains"] },
    { spanish: "Si no duermes, te sientes cansado.", answer: ["if you don't sleep, you feel tired"] },
    { spanish: "Si él está enfermo, se queda en casa.", answer: ["if he is sick, he stays at home", "if he's sick, he stays at home"] },
    { spanish: "Si estoy estresado, escucho música.", answer: ["if i am stressed, i listen to music", "if i'm stressed, i listen to music"] },
    { spanish: "Si el sol se oculta, se pone oscuro.", answer: ["if the sun goes down, it gets dark"] },
    { spanish: "Si mezclas azul y amarillo, obtienes verde.", answer: ["if you mix blue and yellow, you get green"] },
    { spanish: "Si no comemos, nos da hambre.", answer: ["if we don't eat, we get hungry"] },
    { spanish: "Si los niños juegan afuera, se ensucian.", answer: ["if children play outside, they get dirty"] },
    { spanish: "Si calientas el hielo, se derrite.", answer: ["if you heat ice, it melts"] },
    { spanish: "Si tengo tiempo libre, leo un libro.", answer: ["if i have free time, i read a book"] },
];

const readingText = {
    title: "The Water Cycle",
    content: "The water cycle is a natural fact. If the sun heats the water in the earth, it evaporates and goes up. If the steam reaches the air, it forms clouds. If the air is cold enough, it rains. If it rains, the plants grow and the animals drink from the ground. Nature is perfect!",
    questions: [
        { id: 'q1', question: "What happens if the sun heats the water?", answers: ["it evaporates", "it evaporates and goes up"] },
        { id: 'q2', question: "What happens if the steam reaches the air?", answers: ["it forms clouds", "clouds form"] },
        { id: 'q3', question: "What happens if it rains?", answers: ["the plants grow", "plants grow and animals drink"] },
    ]
};

// --- HELPER COMPONENTS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    const handleCheck = () => {
        const userVal = answer.trim().toLowerCase().replace(/[.?,]/g, '');
        const isCorrect = prompts[currentIndex].answer.some((a: string) => a.toLowerCase().replace(/[.?,]/g, '') === userVal);
        
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Buen trabajo!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse">
                                    <BookText className="mr-2 h-4 w-4" />
                                    Vocabulary
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <div className="space-y-2 text-foreground">
                                    <h4 className="font-bold border-b pb-1 text-primary">Vocabulario Útil</h4>
                                    <ScrollArea className="h-48 pr-4">
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                            {Object.entries(vocabulary).map(([es, en]: any) => (
                                                <React.Fragment key={es}>
                                                    <span className="text-muted-foreground capitalize">{es}:</span>
                                                    <span className="font-semibold text-right">{en}</span>
                                                </React.Fragment>
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
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl">{prompts[currentIndex].spanish}</div>
                <Input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-12 text-lg text-foreground", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/5' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder="Tu traducción..." autoComplete="off" />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck} variant="secondary">Verificar</Button>
                    <Button onClick={() => currentIndex < prompts.length - 1 ? (setCurrentIndex(i => i + 1), setAnswer('')) : onComplete()} disabled={status[currentIndex] !== 'correct'} className="text-white font-bold">{currentIndex === prompts.length - 1 ? 'Finalizar' : 'Siguiente'}</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

// --- PAGE COMPONENT ---

export default function ZeroConditionalKidsPage() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // Reading State
    const [readingAnswers, setReadingAnswers] = useState<Record<string, string>>({});
    const [readingStatus, setReadingStatus] = useState<Record<string, 'correct' | 'incorrect' | 'unchecked'>>({});

    const studentDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'students', user.uid) : null),
        [firestore, user]
    );
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);

    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);
    
    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: '1. Vocabulary', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: '2. Grammar', icon: GraduationCap, status: 'locked' },
        { key: 'exercise1', name: '3. Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'exercise2', name: '4. Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'exercise3', name: '5. Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
        { key: 'reading', name: '7. Lectura', icon: BookText, status: 'locked' },
        { key: 'final_ex', name: '8. Final Exercise', icon: Trophy, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;

        let path = initialLearningPath.map(topic => ({ ...topic }));
        let savedSelectedTopic = '';

        if (isAdmin) {
            path.forEach(item => { item.status = 'completed'; });
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedData = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => {
                if (savedData[item.key]) item.status = savedData[item.key];
            });
            savedSelectedTopic = savedData.lastSelectedTopic || '';
        }

        let lastDone = true;
        for (let i = 0; i < path.length; i++) {
            if (lastDone && path[i].status === 'locked') path[i].status = 'active';
            lastDone = path[i].status === 'completed';
        }

        setLearningPath(path);
        setSelectedTopic(savedSelectedTopic || path.find(p => p.status === 'active')?.key || path[0].key);
        setInitialLoadComplete(true);
        setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;

        const statusesToSave: Record<string, any> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => { statusesToSave[item.key] = item.status; });

        const savedData = studentProfile?.lessonProgress?.[progressStorageVersion];
        if (JSON.stringify(statusesToSave) !== JSON.stringify(savedData)) {
            updateDocumentNonBlocking(studentDocRef, {
                [`lessonProgress.${progressStorageVersion}`]: statusesToSave,
                [`progress.${mainProgressKey}`]: progressValue
            });
        }
        
        if (progressValue >= 100) {
            window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, studentProfile, isInitialLoading]);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

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
            
            if (wasUnlocked) {
                setTimeout(() => toast({ title: "¡Siguiente misión desbloqueada!" }), 0);
            }
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
            toast({ variant: "destructive", title: "Contenido Bloqueado", description: "Completa los retos anteriores para avanzar." });
            return;
        }
        setSelectedTopic(topicKey);

        const autoViewTopics = ['vocabulary', 'grammar'];
        if (autoViewTopics.includes(topicKey)) {
            handleTopicComplete(topicKey);
        }
    };

    const checkReading = () => {
        const newStatus: any = {};
        let allOk = true;
        readingText.questions.forEach(q => {
            const userAns = (readingAnswers[q.id] || '').trim().toLowerCase().replace(/[.?,]/g, '');
            const isCorrect = q.answers.some(a => a.toLowerCase().replace(/[.?,]/g, '') === userAns);
            newStatus[q.id] = isCorrect ? 'correct' : 'incorrect';
            if (!isCorrect) allOk = false;
        });
        setReadingStatus(newStatus);
        if (allOk) {
            toast({ title: "¡Excelente lectura!" });
            handleTopicComplete('reading');
        } else {
            toast({ variant: 'destructive', title: "Revisa las respuestas" });
        }
    };

    const renderContent = () => {
        if (isInitialLoading) return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-white font-bold animate-pulse">CARGANDO AVENTURA...</p>
            </div>
        );

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">Vocabulary: Zero Conditional</CardTitle></CardHeader>
                        <CardContent>
                            <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3']} className="w-full">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger className="font-bold text-lg">1. Verbos Comunes</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {vocabularyData.verbs.map((v, i) => (
                                                <div key={i} className="p-3 bg-muted/50 rounded-xl border flex flex-col items-center text-center">
                                                    <span className="text-xs text-muted-foreground uppercase font-bold">{v.spanish}</span>
                                                    <span className="font-black text-primary">{v.english}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-2">
                                    <AccordionTrigger className="font-bold text-lg">2. Ciencia y Naturaleza</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {vocabularyData.science.map((v, i) => (
                                                <div key={i} className="p-3 bg-muted/50 rounded-xl border flex flex-col items-center text-center">
                                                    <span className="text-xs text-muted-foreground uppercase font-bold">{v.spanish}</span>
                                                    <span className="font-black text-primary">{v.english}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-3">
                                    <AccordionTrigger className="font-bold text-lg">3. Hábitos y Rutinas</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {vocabularyData.habits.map((v, i) => (
                                                <div key={i} className="p-3 bg-muted/50 rounded-xl border flex flex-col items-center text-center">
                                                    <span className="text-xs text-muted-foreground uppercase font-bold">{v.spanish}</span>
                                                    <span className="font-black text-primary">{v.english}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6">
                            <Button onClick={() => handleTopicComplete('vocabulary')} size="lg" className="px-16 font-bold h-12">Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
                        <CardHeader>
                            <CardTitle className="text-3xl font-black text-primary uppercase">Zero Conditional</CardTitle>
                            <CardDescription className="text-lg font-bold">Hechos reales y verdades universales.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-slate-100 dark:bg-slate-800/50 rounded-[2rem] border-2 border-dashed border-primary/20 text-foreground">
                                <p className="text-lg font-bold mb-4">Lo usamos para hablar de cosas que siempre ocurren si se cumple una condición.</p>
                                <div className="p-6 bg-primary/10 rounded-2xl border-2 border-primary space-y-2 text-center">
                                    <p className="text-2xl font-black text-primary">IF + PRESENT SIMPLE, PRESENT SIMPLE</p>
                                    <Separator className="bg-primary/20" />
                                    <p className="text-sm uppercase tracking-widest font-bold">Condición &rarr; Resultado</p>
                                </div>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-muted rounded-xl border">
                                    <p className="font-bold text-primary mb-1">Example 1:</p>
                                    <p className="italic">If you heat ice, it melts.</p>
                                    <p className="text-xs text-muted-foreground">(Si calientas el hielo, se derrite)</p>
                                </div>
                                <div className="p-4 bg-muted rounded-xl border">
                                    <p className="font-bold text-primary mb-1">Example 2:</p>
                                    <p className="italic">If plants need water, they die.</p>
                                    <p className="text-xs text-muted-foreground">(Si las plantas necesitan agua, mueren)</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t">
                            <Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-16 font-bold h-12">Entendido</Button>
                        </CardFooter>
                    </Card>
                );
            case 'exercise1': return <BallsExercise title="Exercise 1" prompts={ex1Prompts} onComplete={() => handleTopicComplete('exercise1')} vocabulary={ex1VocabSpecific} />;
            case 'exercise2': return <BallsExercise title="Exercise 2" prompts={ex2Prompts} onComplete={() => handleTopicComplete('exercise2')} vocabulary={ex2VocabSpecific} />;
            case 'exercise3': return <BallsExercise title="Exercise 3" prompts={ex3Prompts} onComplete={() => handleTopicComplete('exercise3')} vocabulary={ex3VocabSpecific} />;
            case 'vocab_game':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple text-foreground">
                        <CardHeader><CardTitle>Vocabulary Game</CardTitle></CardHeader>
                        <CardContent>
                            <VocabularyMatchingGame 
                                data={[...vocabularyData.verbs, ...vocabularyData.science, ...vocabularyData.habits].map(v => ({ spanish: v.spanish, english: [v.english] }))} 
                                onComplete={() => handleTopicComplete('vocab_game')}
                                title="Empareja el Vocabulario"
                            />
                        </CardContent>
                    </Card>
                );
            case 'reading':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-foreground">{readingText.title}</CardTitle>
                                    <CardDescription>Lee el texto y responde para avanzar.</CardDescription>
                                </div>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse">
                                            <BookText className="mr-2 h-4 w-4" />
                                            Vocabulary
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64">
                                        <div className="space-y-2 text-foreground">
                                            <h4 className="font-bold border-b pb-1 text-primary">Vocabulario Útil</h4>
                                            <ScrollArea className="h-48 pr-4">
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                                    {Object.entries(readingVocabSpecific).map(([es, en]: any) => (
                                                        <React.Fragment key={es}>
                                                            <span className="text-muted-foreground capitalize">{es}:</span>
                                                            <span className="font-semibold text-right">{en}</span>
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 text-foreground text-left">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed">{readingText.content}</div>
                            <Separator />
                            <div className="space-y-4">
                                {readingText.questions.map(q => (
                                    <div key={q.id} className="space-y-2">
                                        <Label className="font-bold">{q.question}</Label>
                                        <Input value={readingAnswers[q.id] || ''} onChange={e => {setReadingAnswers(p => ({...p, [q.id]: e.target.value})); setReadingStatus(p => ({...p, [q.id]: 'unchecked'})); }} className={cn(readingStatus[q.id] === 'correct' ? 'border-green-500' : readingStatus[q.id] === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6">
                            <Button onClick={checkReading} size="lg" className="px-12 font-bold">Verificar Lectura</Button>
                        </CardFooter>
                    </Card>
                );
            case 'final_ex':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground">
                        <CardHeader>
                            <CardTitle>Final Vocabulary Challenge</CardTitle>
                            <CardDescription>Memoriza y traduce para completar la aventura.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <VerbVocabularyExercise 
                                data={[...vocabularyData.verbs, ...vocabularyData.science].slice(0, 15).map(v => ({ spanish: v.spanish, english: v.english }))}
                                onComplete={() => handleTopicComplete('final_ex')}
                            />
                        </CardContent>
                    </Card>
                );
            default: return null;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen will-lesson-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header de la clase */}
                    <div className="mb-8 text-left text-white">
                        <Link href="/kids/b1" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2">
                            <ArrowLeft className="h-4 w-4" /> Volver al Curso B1
                        </Link>
                        <h1 className="text-4xl font-black [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)] uppercase tracking-tight">
                            Zero Conditional ❄️
                        </h1>
                    </div>

                    <div className="grid gap-8 md:grid-cols-12">
                        {/* Area de Contenido */}
                        <div className="md:col-span-9 md:order-1 order-2">
                            {renderContent()}
                        </div>

                        {/* Sidebar de Navegación */}
                        <div className="md:col-span-3 md:order-2 order-1 text-left text-foreground">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 text-foreground">
                                    <CardTitle className="text-lg font-black text-primary uppercase tracking-tighter">Tu Misión</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <nav>
                                        <ul className="space-y-1">
                                            {learningPath.map((item) => {
                                                const Icon = item.icon;
                                                const isLocked = item.status === 'locked' && !isAdmin;
                                                const isCompleted = item.status === 'completed';

                                                return (
                                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                                        className={cn(
                                                            'flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground',
                                                            isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted',
                                                            selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary'
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3 text-foreground">
                                                            {isCompleted ? (
                                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                                            ) : (
                                                                <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500" : "text-primary")} />
                                                            )}
                                                            <span className="truncate">{item.name}</span>
                                                        </div>
                                                        {isLocked && <Lock className="h-4 w-4 text-yellow-500/50" />}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </nav>
                                    <div className="mt-6 pt-6 border-t text-foreground">
                                        <div className="flex justify-between items-center text-xs mb-2 font-bold uppercase tracking-widest text-muted-foreground">
                                            <span>Avance Total</span>
                                            <span className="text-primary">{progressValue}%</span>
                                        </div>
                                        <Progress value={progressValue} className="h-2" />
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
