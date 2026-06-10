'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
    Sparkles,
    Lightbulb,
    Info
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
const progressStorageVersion = 'progress_kids_b1_second_cond_v15_stable';
const mainProgressKey = 'progress_kids_b1_second_conditional';

// --- DATA ---
const vocabularyData = {
    verbs: [
        { spanish: 'tener', english: 'have' },
        { spanish: 'ser/estar', english: 'be' },
        { spanish: 'comprar', english: 'buy' },
        { spanish: 'viajar', english: 'travel' },
        { spanish: 'vivir', english: 'live' },
        { spanish: 'trabajar', english: 'work' },
        { spanish: 'estudiar', english: 'study' },
        { spanish: 'aprender', english: 'learn' },
        { spanish: 'ayudar', english: 'help' },
        { spanish: 'ahorrar', english: 'save' },
        { spanish: 'ganar (dinero)', english: 'earn' },
        { spanish: 'elegir', english: 'choose' },
        { spanish: 'conocer', english: 'meet' },
    ],
    money: [
        { spanish: 'dinero', english: 'money' },
        { spanish: 'rico', english: 'rich' },
        { spanish: 'millonario', english: 'millionaire' },
        { spanish: 'lotería', english: 'lottery' },
        { spanish: 'salario', english: 'salary' },
        { spanish: 'negocio', english: 'business' },
        { spanish: 'cuenta bancaria', english: 'bank account' },
    ],
    travel: [
        { spanish: 'viajar', english: 'travel' },
        { spanish: 'país', english: 'country' },
        { spanish: 'ciudad', english: 'city' },
        { spanish: 'playa', english: 'beach' },
        { spanish: 'hotel', english: 'hotel' },
        { spanish: 'aeropuerto', english: 'airport' },
        { spanish: 'boleto', english: 'ticket' },
        { spanish: 'vacaciones', english: 'vacation' },
    ],
    jobs: [
        { spanish: 'médico', english: 'doctor' },
        { spanish: 'profesor', english: 'teacher' },
        { spanish: 'ingeniero', english: 'engineer' },
        { spanish: 'gerente', english: 'manager' },
        { spanish: 'empresa', english: 'company' },
        { spanish: 'ascenso', english: 'promotion' },
        { spanish: 'empleado', english: 'employee' },
    ],
    adjectives: [
        { spanish: 'rico', english: 'rich' },
        { spanish: 'famoso', english: 'famous' },
        { spanish: 'feliz', english: 'happy' },
        { spanish: 'exitoso', english: 'successful' },
        { spanish: 'saludable', english: 'healthy' },
        { spanish: 'inteligente', english: 'intelligent' },
        { spanish: 'fuerte', english: 'strong' },
    ],
    expressions: [
        { spanish: 'alrededor del mundo', english: 'around the world' },
        { spanish: 'más dinero', english: 'more money' },
        { spanish: 'un carro nuevo', english: 'a new car' },
        { spanish: 'una casa grande', english: 'a big house' },
        { spanish: 'el trabajo de mis sueños', english: 'my dream job' },
        { spanish: 'tiempo libre', english: 'free time' },
    ]
};

const ex1Prompts = [
    { spanish: "Si tuviera dinero, compraría un carro nuevo.", answer: ["if i had money, i would buy a new car"] },
    { spanish: "Si ganara la lotería, viajaría alrededor del mundo.", answer: ["if i won the lottery, i would travel around the world"] },
    { spanish: "Si fuera rico, viviría en un hotel.", answer: ["if i were rich, i would live in a hotel"] },
    { spanish: "Si tuviera tiempo libre, conocería gente nueva.", answer: ["if i had free time, i would meet new people"] },
    { spanish: "Si fuera millonario, ayudaría a mucha gente.", answer: ["if i were a millionaire, i would help many people", "if i were a millionaire, i would help a lot of people"] },
];

const ex1Vocab = {
    "tener": "had (pasado)",
    "dinero": "money",
    "comprar": "buy",
    "un carro nuevo": "a new car",
    "ganar": "won (pasado)",
    "lotería": "lottery",
    "viajar": "travel",
    "alrededor del mundo": "around the world",
    "ser": "were (pasado)",
    "rico": "rich",
    "vivir": "live",
    "hotel": "hotel",
    "tiempo libre": "free time",
    "conocer": "meet",
    "gente nueva": "new people",
    "millonario": "millionaire",
    "ayudar": "help",
    "mucha gente": "many people / a lot of people"
};

const ex2Prompts = [
    { spanish: "Si estudiara mucho, sería un ingeniero exitoso.", answer: ["if i studied hard, i would be a successful engineer"] },
    { spanish: "Si ella fuera la gerente, elegiría un mejor salario.", answer: ["if she were the manager, she would choose a better salary"] },
    { spanish: "Si ellos trabajaran en esa empresa, estarían felices.", answer: ["if they worked in that company, they would be happy"] },
    { spanish: "Si yo tuviera el trabajo de mis sueños, me mudaría a otra ciudad.", answer: ["if i had my dream job, i would move to another city"] },
    { spanish: "Si nosotros ahorráramos dinero, compraríamos boletos para las vacaciones.", answer: ["if we saved money, we would buy tickets for the vacation"] },
    { spanish: "Si él aprendiera inglés, obtendría un ascenso.", answer: ["if he learned english, he would get a promotion"] },
    { spanish: "Si fueras famoso, viajarías en un aeropuerto privado.", answer: ["if you were famous, you would travel in a private airport"] },
];

const ex2Vocab = {
    "estudiar": "studied (pasado)",
    "duro / mucho": "hard",
    "ingeniero": "engineer",
    "exitoso": "successful",
    "gerente": "manager",
    "elegir": "choose",
    "mejor": "better",
    "salario": "salary",
    "trabajar": "worked (pasado)",
    "empresa": "company",
    "feliz": "happy",
    "trabajo de mis sueños": "my dream job",
    "mudarse": "move",
    "otra ciudad": "another city",
    "ahorrar": "saved (pasado)",
    "boletos": "tickets",
    "vacaciones": "vacation",
    "aprender": "learned (pasado)",
    "ascenso": "promotion",
    "famoso": "famous",
    "aeropuerto": "airport",
    "privado": "private"
};

const ex3Prompts = [
    { spanish: "Si comiera saludable, sería más fuerte.", answer: ["if i ate healthy, i would be stronger"] },
    { spanish: "Si ella fuera doctora, ayudaría a los enfermos.", answer: ["if she were a doctor, she would help the sick"] },
    { spanish: "Si viviéramos cerca de la playa, iríamos cada día.", answer: ["if we lived near the beach, we would go every day"] },
    { spanish: "Si yo ganara más dinero, compraría una casa grande.", answer: ["if i earned more money, i would buy a big house"] },
    { spanish: "Si ellos tuvieran vacaciones, viajarían a otro país.", answer: ["if they had vacation, they would travel to another country"] },
    { spanish: "Si él fuera inteligente, estudiaría para el examen.", answer: ["if he were intelligent, he would study for the exam"] },
    { spanish: "Si yo fuera un empleado, trabajaría duro.", answer: ["if i were an employee, i would work hard"] },
    { spanish: "Si nosotros ahorráramos, iríamos a un hotel caro.", answer: ["if we saved, we would go to an expensive hotel"] },
    { spanish: "Si ella conociera al profesor, aprendería más rápido.", answer: ["if she met the teacher, she would learn faster"] },
    { spanish: "Si ganaras la lotería, serías millonario.", answer: ["if you won the lottery, you would be a millionaire"] },
];

const ex3Vocab = {
    "comer": "ate (pasado)",
    "saludable": "healthy",
    "fuerte": "strong",
    "doctora": "doctor",
    "enfermos": "the sick",
    "vivir": "lived (pasado)",
    "cerca de": "near",
    "playa": "beach",
    "ganar": "earned (pasado)",
    "más dinero": "more money",
    "casa grande": "a big house",
    "país": "country",
    "inteligente": "intelligent",
    "examen": "exam",
    "empleado": "employee",
    "caro": "expensive",
    "conocer": "met (pasado)",
    "profesor": "teacher",
    "rápido": "fast"
};

const readingText = {
    title: "My Imaginary Life",
    content: "If I won the lottery, my life would change. I would not work in an office. I would travel around the world with my friends. We would visit many countries and eat in expensive restaurants. If I were a millionaire, I would buy a big house near the beach. I would help my family with more money. What would you do if you were rich?",
    questions: [
        { id: 'q1', question: "What would happen if the narrator won the lottery?", answers: ["life would change", "their life would change"] },
        { id: 'q2', question: "Who would they travel with around the world?", answers: ["friends", "with my friends", "with friends"] },
        { id: 'q3', question: "Where would they buy a big house?", answers: ["near the beach", "the beach"] },
        { id: 'q4', question: "Who would they help with more money?", answers: ["family", "their family", "my family"] },
    ]
};

const readingVocab = {
    "won": "ganó",
    "lottery": "lotería",
    "change": "cambiar",
    "office": "oficina",
    "expensive": "caro",
    "restaurants": "restaurantes",
    "millionaire": "millonario",
    "rich": "rico"
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

// --- MAIN PAGE COMPONENT ---

export default function SecondConditionalKidsPage() {
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
        { key: 'reading', name: '7. Lectura', icon: BookOpen, status: 'locked' },
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
            toast({ title: "¡Felicidades!", description: "Misión completada. Has dominado el Second Conditional." });
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

    const getFinalVocabInputClass = (index: number) => {
        const status = finalVocabValidation[index];
        if (status === 'correct') return 'border-green-500 bg-green-50/5 focus-visible:ring-green-500';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive bg-destructive/5';
        return '';
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex flex-col items-center justify-center min-h-[400px]"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /></div>;

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">Vocabulary: Life & Dreams</CardTitle></CardHeader>
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
                            <CardTitle className="text-3xl font-black text-primary uppercase tracking-tighter">Second Conditional</CardTitle>
                            <CardDescription className="font-bold text-foreground text-lg">Situaciones hipotéticas o sueños imposibles.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-slate-100 dark:bg-slate-800/50 rounded-[2rem] border-2 border-dashed border-primary/20">
                                <p className="text-lg font-bold mb-4">Lo usamos para hablar de cosas que no son reales ahora o son muy improbables en el futuro.</p>
                                <div className="p-6 bg-primary/10 rounded-2xl border-2 border-primary space-y-2 text-center">
                                    <p className="text-2xl font-black text-primary uppercase">IF + PAST SIMPLE, WOULD + VERB</p>
                                    <Separator className="bg-primary/20" />
                                    <p className="text-sm uppercase tracking-widest font-bold">Condición Imaginaria &rarr; Resultado Hipotético</p>
                                </div>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-muted rounded-xl border text-foreground">
                                    <p className="font-bold text-primary mb-1">Example 1:</p>
                                    <p className="italic">If I had a million dollars, I would travel the world.</p>
                                    <p className="text-xs text-muted-foreground">(Si tuviera un millón, viajaría...)</p>
                                </div>
                                <div className="p-4 bg-muted rounded-xl border text-foreground">
                                    <p className="font-bold text-primary mb-1">Example 2:</p>
                                    <p className="italic">If I were you, I would study harder.</p>
                                    <p className="text-xs text-muted-foreground">(Si fuera tú, estudiaría más...)</p>
                                </div>
                            </div>
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 rounded-r-xl">
                                <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200 uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles className="h-4 w-4" /> Tip de Pro:
                                </p>
                                <p className="text-sm mt-1 italic">Con el verbo TO BE, se prefiere usar "WERE" para todos los pronombres (I were, He were, She were) en el condicional.</p>
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
                                            <h4 className="font-bold border-b pb-1 text-primary">Vocabulario Útil</h4>
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
                            <CardDescription className="font-bold text-foreground">Traduce los términos de la lección para finalizar la misión.</CardDescription>
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
                            Second Conditional ❄️
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
