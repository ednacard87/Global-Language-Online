'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
    Star,
    Info,
    HelpCircle,
    Check,
    XCircle,
    Globe
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';

// --- CONFIGURACIÓN ---
const progressStorageVersion = 'progress_kids_b1_first_cond_v12_stable';
const mainProgressKey = 'progress_kids_b1_first_conditional';

// --- DATA ---
const vocabularyData = {
    connectors: [
        { spanish: 'si', english: 'if' },
        { spanish: 'a menos que', english: 'unless' },
        { spanish: 'cuando', english: 'when' },
        { spanish: 'tan pronto como', english: 'as soon as' },
        { spanish: 'antes de', english: 'before' },
        { spanish: 'después de', english: 'after' },
    ],
    verbs: [
        { spanish: 'estudiar', english: 'study' },
        { spanish: 'trabajar', english: 'work' },
        { spanish: 'ir', english: 'go' },
        { spanish: 'venir', english: 'come' },
        { spanish: 'llamar', english: 'call' },
        { spanish: 'comprar', english: 'buy' },
        { spanish: 'viajar', english: 'travel' },
        { spanish: 'ayudar', english: 'help' },
        { spanish: 'ahorrar', english: 'save' },
        { spanish: 'aprobar', english: 'pass' },
        { spanish: 'reprobar', english: 'fail' },
        { spanish: 'aprender', english: 'learn' },
        { spanish: 'llegar', english: 'arrive' },
        { spanish: 'salir', english: 'leave' },
        { spanish: 'hacer ejercicio', english: 'exercise' },
    ],
    time: [
        { spanish: 'mañana', english: 'tomorrow' },
        { spanish: 'la próxima semana', english: 'next week' },
        { spanish: 'el próximo mes', english: 'next month' },
        { spanish: 'esta noche', english: 'tonight' },
        { spanish: 'este fin de semana', english: 'this weekend' },
        { spanish: 'más tarde', english: 'later' },
        { spanish: 'pronto', english: 'soon' },
    ],
    weather: [
        { spanish: 'llover', english: 'rain' },
        { spanish: 'soleado', english: 'sunny' },
        { spanish: 'nublado', english: 'cloudy' },
        { spanish: 'ventoso', english: 'windy' },
        { spanish: 'caliente', english: 'hot' },
        { spanish: 'frío', english: 'cold' },
    ],
    consequences: [
        { spanish: 'quedarse en casa', english: 'stay home' },
        { spanish: 'salir', english: 'go out' },
        { spanish: 'estar feliz', english: 'be happy' },
        { spanish: 'llegar tarde', english: 'be late' },
        { spanish: 'enfermarse', english: 'get sick' },
        { spanish: 'aprobar el examen', english: 'pass the exam' },
        { spanish: 'conseguir un trabajo', english: 'get a job' },
        { spanish: 'ganar dinero', english: 'earn money' },
    ]
};

const ex1Prompts = [
    { spanish: "Si llueve, me quedaré en casa.", answer: ["if it rains, i will stay home", "if it rains i will stay home"] },
    { spanish: "Si estudio mucho, aprobaré el examen.", answer: ["if i study hard, i will pass the exam", "if i study a lot, i will pass the exam"] },
    { spanish: "Si ella llega tarde, te llamará.", answer: ["if she is late, she will call you", "if she's late, she will call you"] },
    { spanish: "Si vienes pronto, saldremos.", answer: ["if you come soon, we will go out"] },
    { spanish: "Si él ahorra dinero, comprará un carro.", answer: ["if he saves money, he will buy a car"] },
];

const ex1Vocab = {
    "llover": "rain",
    "quedarse en casa": "stay home",
    "estudiar mucho": "study hard",
    "aprobar": "pass",
    "examen": "exam",
    "llegar tarde": "arrive late",
    "llamar": "call",
    "pronto": "soon",
    "salir": "go out",
    "ahorrar dinero": "save money",
    "comprar": "buy",
    "carro": "car"
};

const ex2Prompts = [
    { spanish: "A menos que estudies, reprobarás el examen.", answer: ["unless you study, you will fail the test", "unless you study, you will fail the exam"] },
    { spanish: "Si está soleado mañana, iremos al parque.", answer: ["if it is sunny tomorrow, we will go to the park", "if it's sunny tomorrow, we will go to the park"] },
    { spanish: "Tan pronto como llegue, llamaré a mi mamá.", answer: ["as soon as i arrive, i will call my mom", "as soon as i arrive, i will call my mother"] },
    { spanish: "Si ellos trabajan la próxima semana, ganarán dinero.", answer: ["if they work next week, they will earn money"] },
    { spanish: "Si no usas una chaqueta, te enfermarás.", answer: ["if you do not wear a jacket, you will get sick", "if you don't wear a jacket, you will get sick"] },
    { spanish: "Si la ayudamos, ella estará feliz.", answer: ["if we help her, she will be happy"] },
    { spanish: "Si él hace ejercicio esta noche, dormirá bien.", answer: ["if he exercises tonight, he will sleep well"] },
];

const ex2Vocab = {
    "a menos que": "unless",
    "estudiar": "study",
    "reprobar": "fail",
    "soleado": "sunny",
    "mañana": "tomorrow",
    "ir al parque": "go to the park",
    "tan pronto como": "as soon as",
    "llegar": "arrive",
    "mamá": "mom / mother",
    "trabajar": "work",
    "la próxima semana": "next week",
    "ganar dinero": "earn money",
    "usar una chaqueta": "wear a jacket",
    "enfermarse": "get sick",
    "ayudar": "help",
    "feliz": "happy",
    "hacer ejercicio": "exercise",
    "esta noche": "tonight",
    "dormir bien": "sleep well"
};

const ex3Prompts = [
    { spanish: "Cuando él venga a casa, cenará.", answer: ["when he comes home, he will eat dinner"] },
    { spanish: "Si consigo un trabajo, viajaré a Europa.", answer: ["if i get a job, i will travel to europe"] },
    { spanish: "Si el clima está ventoso, no volaremos nuestra cometa.", answer: ["if the weather is windy, we will not fly our kite", "if the weather is windy, we won't fly our kite"] },
    { spanish: "A menos que ella salga ahora, llegará tarde.", answer: ["unless she leaves now, she will be late"] },
    { spanish: "Si aprendes inglés, tendrás un mejor trabajo.", answer: ["if you learn english, you will have a better job"] },
    { spanish: "Si hace calor este fin de semana, iré a la playa.", answer: ["if it is hot this weekend, i will go to the beach", "if it's hot this weekend, i will go to the beach"] },
    { spanish: "Antes de ir a dormir, leeré un libro.", answer: ["before i go to sleep, i will read a book"] },
    { spanish: "Si ahorramos suficiente, compraremos una casa nueva el próximo mes.", answer: ["if we save enough, we will buy a new house next month"] },
    { spanish: "Si me llamas más tarde, te diré la verdad.", answer: ["if you call me later, i will tell you the truth"] },
    { spanish: "Después de que termine mi tarea, jugaré videojuegos.", answer: ["after i finish my homework, i will play video games"] },
];

const ex3Vocab = {
    "cuando": "when",
    "venir": "come",
    "casa": "home",
    "cenar": "eat dinner",
    "conseguir un trabajo": "get a job",
    "viajar": "travel",
    "ventoso": "windy",
    "clima": "weather",
    "volar una cometa": "fly a kite",
    "salir": "leave / go out",
    "aprender": "learn",
    "mejor trabajo": "better job",
    "calor": "hot",
    "este fin de semana": "this weekend",
    "playa": "beach",
    "antes de": "before",
    "go to sleep": "ir a dormir",
    "leer": "read",
    "ahorrar suficiente": "save enough",
    "el próximo mes": "next month",
    "decir la verdad": "tell the truth",
    "después de": "after",
    "terminar": "finish",
    "tarea": "homework"
};

const readingText = {
    title: "A Busy Weekend Plan",
    content: "Next Saturday, if the weather is sunny, my family and I will go to the lake. As soon as we arrive, we will start a picnic. My father will cook some hot dogs if we are hungry. If my sister finishes her homework early, she will come with us too. We will return home before it gets dark. Unless it rains, we will have a wonderful day!",
    questions: [
        { id: 'q1', question: "Where will the family go if it's sunny?", answers: ["the lake", "to the lake"] },
        { id: 'q2', question: "What will they do as soon as they arrive?", answers: ["start a picnic", "a picnic"] },
        { id: 'q3', question: "What will the father cook if they are hungry?", answers: ["hot dogs", "some hot dogs"] },
        { id: 'q4', question: "When will they return home?", answers: ["before it gets dark", "before dark"] },
    ]
};

const readingVocab = {
    "lake": "lago",
    "picnic": "día de campo",
    "hot dogs": "perros calientes",
    "hungry": "hambriento",
    "early": "temprano",
    "dark": "oscuro",
    "unless": "a menos que"
};

// --- HELPER COMPONENTS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => {
        setCurrentIndex(0);
        setAnswer('');
        setStatus({});
    }, [prompts]);

    useEffect(() => {
        setAnswer('');
    }, [currentIndex]);

    const currentPrompt = prompts[currentIndex];
    if (!currentPrompt) return null;

    const handleCheck = () => {
        const userVal = answer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const isCorrect = currentPrompt.answer.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
        
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Buen trabajo!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className='text-foreground'>{title}</CardTitle>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
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
                                <div className="space-y-2 text-foreground text-left">
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

interface Topic {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
}

const ICONS_MAP = { locked: Lock, active: BookOpen, completed: CheckCircle };

export default function FirstConditionalKidsPage() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // Reading & Final Vocab States
    const [readingAnswers, setReadingAnswers] = useState<Record<string, string>>({});
    const [readingStatus, setReadingStatus] = useState<Record<string, 'correct' | 'incorrect' | 'unchecked'>>({});
    const [finalVocabAnswers, setFinalVocabAnswers] = useState<Record<number, string>>({});
    const [finalVocabValidation, setFinalVocabValidation] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

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
        for(let i = 0; i < path.length; i++) {
            if (lastDone && path[i].status === 'locked') path[i].status = 'active';
            lastDone = path[i].status === 'completed';
        }

        setLearningPath(path as Topic[]);
        setSelectedTopic(savedSelectedTopic || path.find(p => p.status === 'active')?.key || path[0].key);
        setInitialLoadComplete(true);
        setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;

        const statusesToSave: Record<string, any> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => { statusesToSave[item.key] = item.status; });

        updateDocumentNonBlocking(studentDocRef, {
            [`lessonProgress.${progressStorageVersion}`]: statusesToSave,
            [`progress.${mainProgressKey}`]: progressValue
        });

        if (progressValue >= 100) {
            window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, studentProfile, isInitialLoading]);

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
            return newPath as Topic[];
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

        const autoViewTopics = ['vocabulary', 'grammar'];
        if (autoViewTopics.includes(topicKey)) {
            handleTopicComplete(topicKey);
        }
    };

    const handleFinalVocabInputChange = (index: number, value: string) => {
        setFinalVocabAnswers(prev => ({ ...prev, [index]: value }));
        setFinalVocabValidation(prev => ({ ...prev, [index]: 'unchecked' }));
    };

    const handleCheckFinalVocab = () => {
        const allVocab = Object.values(vocabularyData).flat();
        let allCorrect = true;
        const newValidation: any = {};
        
        allVocab.forEach((item, index) => {
            const userAnswer = (finalVocabAnswers[index] || '').trim().toLowerCase();
            const isCorrect = userAnswer === item.english.toLowerCase();
            newValidation[index] = isCorrect ? 'correct' : 'incorrect';
            if (!isCorrect) allCorrect = false;
        });

        setFinalVocabValidation(newValidation);
        if (allCorrect) {
            toast({ title: "¡Felicidades!", description: "Has dominado el vocabulario del First Conditional." });
            handleTopicComplete('final_ex');
        } else {
            toast({ variant: 'destructive', title: "Sigue intentando", description: "Algunos términos no son correctos." });
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
            toast({ variant: 'destructive', title: "Revisa las respuestas de la lectura" });
        }
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex flex-col items-center justify-center min-h-[400px]"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /></div>;

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">Vocabulary: First Conditional</CardTitle></CardHeader>
                        <CardContent>
                            <Accordion type="multiple" defaultValue={['item-1', 'item-2']} className="w-full">
                                {Object.entries(vocabularyData).map(([key, items], idx) => (
                                    <AccordionItem key={key} value={`item-${idx}`}>
                                        <AccordionTrigger className="font-bold text-lg capitalize">{key.replace('_', ' ')}</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {items.map((v: any, i: number) => (
                                                    <div key={i} className="p-3 bg-muted/50 rounded-xl border flex flex-col items-center text-center">
                                                        <span className="text-xs text-muted-foreground uppercase font-bold">{v.spanish}</span>
                                                        <span className="font-black text-primary">{v.english}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6">
                            <Button onClick={() => handleTopicComplete('vocabulary')} size="lg" className="px-16 font-bold h-12">Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader>
                            <CardTitle className="text-3xl font-black text-primary uppercase tracking-tighter">First Conditional</CardTitle>
                            <CardDescription className="font-bold text-foreground text-lg">Posibilidades reales en el futuro.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-slate-100 dark:bg-slate-800/50 rounded-[2rem] border-2 border-dashed border-primary/20">
                                <p className="text-lg font-bold mb-4">Lo usamos para hablar de cosas que probablemente sucederán si se cumple una condición hoy.</p>
                                <div className="p-6 bg-primary/10 rounded-2xl border-2 border-primary space-y-2 text-center">
                                    <p className="text-2xl font-black text-primary uppercase">IF + PRESENT SIMPLE, WILL + VERB</p>
                                    <Separator className="bg-primary/20" />
                                    <p className="text-sm uppercase tracking-widest font-bold">Condición &rarr; Resultado Futuro</p>
                                </div>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-muted rounded-xl border text-foreground">
                                    <p className="font-bold text-primary mb-1">Example 1:</p>
                                    <p className="italic">If it rains, I will stay home.</p>
                                    <p className="text-xs text-muted-foreground">(Si llueve, me quedaré en casa)</p>
                                </div>
                                <div className="p-4 bg-muted rounded-xl border text-foreground">
                                    <p className="font-bold text-primary mb-1">Example 2:</p>
                                    <p className="italic">If I study, I will pass.</p>
                                    <p className="text-xs text-muted-foreground">(Si estudio, aprobaré)</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t">
                            <Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-16 font-bold text-white h-12">Entendido</Button>
                        </CardFooter>
                    </Card>
                );
            case 'exercise1': return <BallsExercise key="ex1" title="Exercise 1" prompts={ex1Prompts} onComplete={() => handleTopicComplete('exercise1')} vocabulary={ex1Vocab} />;
            case 'exercise2': return <BallsExercise key="ex2" title="Exercise 2" prompts={ex2Prompts} onComplete={() => handleTopicComplete('exercise2')} vocabulary={ex2Vocab} />;
            case 'exercise3': return <BallsExercise key="ex3" title="Exercise 3" prompts={ex3Prompts} onComplete={() => handleTopicComplete('exercise3')} vocabulary={ex3Vocab} />;
            case 'vocab_game':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple text-foreground">
                        <CardHeader><CardTitle className='text-foreground'>Vocabulary Game</CardTitle></CardHeader>
                        <CardContent>
                            <VocabularyMatchingGame 
                                data={Object.values(vocabularyData).flat().map((v: any) => ({ spanish: v.spanish, english: [v.english] }))} 
                                onComplete={() => handleTopicComplete('vocab_game')}
                                title="Empareja el Vocabulario"
                            />
                        </CardContent>
                    </Card>
                );
            case 'reading':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className='text-foreground'>{readingText.title}</CardTitle>
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
                                            <h4 className="font-bold border-b pb-1 text-primary">Vocabulario de la Lectura</h4>
                                            <ScrollArea className="h-48 pr-4">
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                                    {Object.entries(readingVocab).map(([en, es]: any) => (
                                                        <React.Fragment key={en}>
                                                            <span className="text-muted-foreground capitalize">{en}:</span>
                                                            <span className="font-semibold text-right">{es}</span>
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed text-foreground">{readingText.content}</div>
                            <Separator />
                            <div className="space-y-4 text-foreground">
                                {readingText.questions.map(q => (
                                    <div key={q.id} className="space-y-2">
                                        <Label className="font-bold">{q.question}</Label>
                                        <Input value={readingAnswers[q.id] || ''} onChange={e => {setReadingAnswers(p => ({...p, [q.id]: e.target.value})); setReadingStatus(p => ({...p, [q.id]: 'unchecked'})); }} className={cn(readingStatus[q.id] === 'correct' ? 'border-green-500' : readingStatus[q.id] === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 text-foreground">
                            <Button onClick={checkReading} size="lg" className="px-12 font-bold">Verificar Lectura</Button>
                        </CardFooter>
                    </Card>
                );
            case 'final_ex':
                const allVocab = Object.values(vocabularyData).flat();
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm overflow-hidden text-foreground">
                        <CardHeader className="bg-primary/5 border-b">
                            <CardTitle className="text-2xl font-black text-primary uppercase">Final Vocabulary Challenge</CardTitle>
                            <CardDescription className="font-bold text-foreground">Traduce los términos al inglés para finalizar la misión.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[500px]">
                                <div className="p-8">
                                     <div className="max-w-2xl mx-auto">
                                        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                                            <div className="font-black text-primary uppercase tracking-widest text-xs border-b pb-2">Español</div>
                                            <div className="font-black text-primary uppercase tracking-widest text-xs border-b pb-2">Inglés</div>
                                            {allVocab.map((v: any, i: number) => (
                                                <React.Fragment key={i}>
                                                    <div className="flex items-center font-bold text-base capitalize">{v.spanish}</div>
                                                    <Input 
                                                        value={finalVocabAnswers[i] || ''} 
                                                        onChange={e => handleFinalVocabInputChange(i, e.target.value)}
                                                        className={cn("h-10 text-lg", getFinalVocabInputClass(i))}
                                                        autoComplete="off"
                                                    />
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/20">
                            <Button onClick={handleCheckFinalVocab} size="lg" className="px-20 font-black h-14 text-xl shadow-lg">Verificar Misión Final</Button>
                        </CardFooter>
                    </Card>
                );
            default: return null;
        }
    };

    const getFinalVocabInputClass = (index: number) => {
        const status = finalVocabValidation[index];
        if (status === 'correct') return 'border-green-500 bg-green-50/5 focus-visible:ring-green-500';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive bg-destructive/5';
        return '';
    };

    return (
        <div className="flex w-full flex-col min-h-screen will-lesson-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-left text-white">
                        <Link href="/kids/b1" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2">
                            <ArrowLeft className="h-4 w-4" /> Volver al Curso B1
                        </Link>
                        <h1 className="text-4xl font-black [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)] uppercase tracking-tight">
                            First Conditional ⚡
                        </h1>
                    </div>

                    <div className="grid gap-8 md:grid-cols-12">
                        {/* Contenido Principal */}
                        <div className="md:col-span-9 md:order-1 order-2">
                            {renderContent()}
                        </div>

                        {/* Sidebar de Ruta */}
                        <div className="md:col-span-3 md:order-2 order-1 text-left text-foreground">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2">
                                        <Star className="h-5 w-5 fill-primary" />
                                        Tu Misión
                                    </CardTitle>
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
                                                            'flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer',
                                                            isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted',
                                                            selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary'
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
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
                                    <div className="mt-6 pt-6 border-t">
                                        <div className="flex justify-between items-center text-xs mb-2 font-bold uppercase tracking-widest text-muted-foreground">
                                            <span>Avance</span>
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
