
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
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
    Sparkles,
    BookText,
    MessageSquare,
    Gamepad2,
    Pencil,
    Users,
    Table as TableIcon,
    ArrowDownWideNarrow
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { CreativeWritingExercise } from '@/components/dashboard/creative-writing-exercise';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { SentenceCompletionExercise, type CompletionPrompt } from '@/components/kids/exercises/sentence-completion-exercise';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from '@/components/ui/separator';

type TopicStatus = 'completed' | 'active' | 'locked';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: TopicStatus;
};

const ICONS = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const progressStorageVersion = 'progress_a1_eng_u3_c11_v6_final';
const mainProgressKey = 'progress_a1_eng_unit_3_class_11';

const familyVocabulary = [
    { spanish: 'PADRE', english: ['FATHER'] },
    { spanish: 'MADRE', english: ['MOTHER'] },
    { spanish: 'PADRES', english: ['PARENTS'] },
    { spanish: 'HIJO', english: ['SON'] },
    { spanish: 'HIJA', english: ['DAUGHTER'] },
    { spanish: 'HERMANO', english: ['BROTHER'] },
    { spanish: 'HERMANA', english: ['SISTER'] },
    { spanish: 'PARIENTES', english: ['RELATIVES'] },
    { spanish: 'TIA', english: ['AUNT'] },
    { spanish: 'TIO', english: ['UNCLE'] },
    { spanish: 'PRIMO/A', english: ['COUSIN'] },
    { spanish: 'CUÑADO', english: ['BROTHER IN LAW'] },
    { spanish: 'CUÑADA', english: ['SISTER IN LAW'] },
    { spanish: 'SUEGRO', english: ['FATHER IN LAW'] },
    { spanish: 'SUEGRA', english: ['MOTHER IN LAW'] },
    { spanish: 'ABUELO', english: ['GRANDFATHER'] },
    { spanish: 'ABUELA', english: ['GRANDMOTHER'] },
    { spanish: 'ABUELOS', english: ['GRANDPARENTS'] },
    { spanish: 'SOBRINO', english: ['NEPHEW'] },
    { spanish: 'SOBRINA', english: ['NIECE'] },
    { spanish: 'NIETOS (EN GENERAL)', english: ['GRANDCHILDREN'] },
    { spanish: 'NIETA', english: ['GRANDDAUGHTER'] },
    { spanish: 'NIETO', english: ['GRANDSON'] },
    { spanish: 'HIJO UNICO', english: ['ONLY CHILD'] },
    { spanish: 'HIJASTRO', english: ['STEPSON'] },
    { spanish: 'HIJASTRA', english: ['STEPDAUGHTER'] },
    { spanish: 'PADRASTRO', english: ['STEPFATHER'] },
    { spanish: 'MADRASTRA', english: ['STEPMOTHER'] },
    { spanish: 'ESPOSO', english: ['HUSBAND'] },
    { spanish: 'ESPOSA', english: ['WIFE'] },
    { spanish: 'NOVIO', english: ['BOYFRIEND'] },
    { spanish: 'NOVIA', english: ['GIRLFRIEND'] },
    { spanish: 'PAREJA', english: ['COUPLE'] },
];

const objectPronounsData = [
    { personal: "I (YO)", object: "ME (A MI, CONMIGO)" },
    { personal: "YOU (TU)", object: "YOU (A TI, CONTIGO)" },
    { personal: "HE (EL)", object: "HIM (A EL, CON EL)" },
    { personal: "SHE (ELLA)", object: "HER (A ELLA, CON ELLA)" },
    { personal: "IT (ESTO)", object: "IT (A ESO, CON ESO)" },
    { personal: "WE (NOSOTROS)", object: "US (A NOSOTROS, CON NOSOTROS)" },
    { personal: "THEY (ELLOS)", object: "THEM (A ELLOS, CON ELLOS)" },
];

const prepositionsData = [
    { es: "CON", en: "WITH" },
    { es: "SIN", en: "WITHOUT" },
    { es: "CONTRA", en: "AGAINST" },
    { es: "DE", en: "OF" },
    { es: "DESDE", en: "FROM" },
    { es: "EN", en: "IN" },
    { es: "ENTRE", en: "BETWEEN" },
    { es: "HASTA", en: "UNTIL" },
    { es: "POR / PARA", en: "FOR" },
    { es: "SOBRE", en: "ON" },
];

const ex2Data: CompletionPrompt[] = [
    { parts: ["I HATE MY JOB, I WANT TO QUIT ", ""], answers: ["IT"] },
    { parts: ["MY PARENTS ARE REALLY SAD, I DON’T KNOW WHAT TO DO WITH ", ""], answers: ["THEM"] },
    { parts: ["SHE LIKES HER HOUSE, BUT SHE IS GOING TO SELL ", ""], answers: ["IT"] },
    { parts: ["I KNOW THEY’RE EXCITED, THEY HAVEN’T SEEN ", " FOR YEARS"], answers: ["HIM"] },
    { parts: ["MY BROTHER IS TOO SMART, I NEVER HELP ", " WITH HOMEWORK"], answers: ["HIM"] },
    { parts: ["WE ARE GOOD STUDENTS, BECAUSE THE TEACHER ALWAYS MOTIVATES ", ""], answers: ["US"] },
    { parts: ["SHE DOESN’T SEE HER FRIENDS AT THE PARTY, SO SHE CALLS ", ""], answers: ["THEM"] },
    { parts: ["THEY INVITE ", " TO THEIR HOUSE."], answers: ["US"] },
];

const conjunctionsData = [
    { word: "Because", function: "give a reason", example: "I study English because I need it for my job." },
    { word: "So", function: "give a consequence / result", example: "It is raining, so I have an umbrella." },
    { word: "After", function: "give the order of events", example: "She goes to bed after she finishes her homework." },
    { word: "Before", function: "give the order of events", example: "I brush my teeth before I sleep." },
    { word: "Until", function: "shows up to a point in time", example: "We stay at the office until 6:00 p.m." },
    { word: "But", function: "give a contrast", example: "He is tall, but his brother is short." },
    { word: "And", function: "give extra information", example: "I have a pen and a notebook." },
    { word: "Or", function: "shows options", example: "Do you want tea or coffee?" },
    { word: "If", function: "shows a condition", example: "Call me if you need help." },
    { word: "While", function: "shows actions at the same time", example: "I talk with my mom while I cook dinner." },
];

const ex2Vocab = {
    "renunciar": "to quit",
    "emocionados": "excited",
    "motiva": "motivates",
    "invitan": "invite",
    "demasiado": "too"
};

const ex3Vocab = {
    "inviernos": "winters",
    "cálidos": "warm",
    "fríos": "cold",
    "tiquetes": "tickets",
    "demasiado": "too",
    "tocineta": "bacon",
    "lechuga": "lettuce",
    "mientras": "while",
    "diario": "every day",
    "besa": "kisses"
};

export default function EngA1Class11Page() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const studentDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'students', user.uid) : null),
        [firestore, user]
    );
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);

    const isAdmin = useMemo(() => {
        if (!user) return false;
        return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
    }, [user, studentProfile]);
    
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // Vocab states
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(familyVocabulary.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(familyVocabulary.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary (Family)', icon: Users, status: 'active' },
        { key: 'grammar', name: 'Grammar', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'create1', name: 'Create 1', icon: Pencil, status: 'locked' },
        { key: 'ex2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'grammar2', name: 'Grammar 2', icon: GraduationCap, status: 'locked' },
        { key: 'ex3', name: 'Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'ex4', name: 'Exercise 4', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: 'Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
        { key: 'ex5', name: 'Exercise 5', icon: PenSquare, status: 'locked' },
        { key: 'ex6', name: 'Exercise 6', icon: PenSquare, status: 'locked' },
    ], []);
    
    useEffect(() => {
        if (isProfileLoading || isUserLoading || !initialLearningPath.length) return;

        const path = initialLearningPath.map(topic => ({ ...topic }));
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
        
        setLearningPath(path);
        if (!initialLoadComplete) {
            const firstActive = path.find(p => p.status === 'active');
            setSelectedTopic(savedSelectedTopic || firstActive?.key || 'vocabulary');
            setInitialLoadComplete(true);
        }
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete]);
    
    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isUserLoading || isProfileLoading || learningPath.length === 0 || isAdmin || !studentDocRef) return;

        const statusesToSave: Record<string, any> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => { statusesToSave[item.key] = item.status; });

        updateDocumentNonBlocking(studentDocRef, { 
            [`lessonProgress.${progressStorageVersion}`]: statusesToSave,
            [`progress.${mainProgressKey}`]: Math.round(progressValue)
        });
        
        if (progressValue >= 100) {
            window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isUserLoading, isProfileLoading, initialLoadComplete]);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    useEffect(() => {
        if (!topicToComplete) return;
    
        setLearningPath(currentPath => {
            const newPath = currentPath.map(item => ({ ...item }));
            const currentIndex = newPath.findIndex(item => item.key === topicToComplete);
            
            if (currentIndex !== -1 && newPath[currentIndex].status !== 'completed') {
                newPath[currentIndex].status = 'completed';
                const nextIndex = currentIndex + 1;
                if (nextIndex < newPath.length && newPath[nextIndex].status === 'locked') {
                    newPath[nextIndex].status = 'active';
                    setSelectedTopic(newPath[nextIndex].key);
                    toast({ title: "¡Siguiente tema desbloqueado!" });
                }
            }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') {
            toast({ variant: "destructive", title: "Contenido Bloqueado", description: "Debes completar los temas anteriores." });
            return;
        }
        setSelectedTopic(topicKey);

        const autoViewTopics = ['grammar', 'grammar2'];
        if (autoViewTopics.includes(topicKey)) {
            handleTopicComplete(topicKey);
        }
    };

    const handleVocabChange = (idx: number, val: string) => {
        const newAns = [...vocabAnswers];
        newAns[idx] = val;
        setVocabAnswers(newAns);

        const newVal = [...vocabValidation];
        newVal[idx] = 'unchecked';
        setVocabValidation(newVal as any);
        setCanAdvanceVocab(false);
    };

    const handleCheckVocab = () => {
        let oneCorrect = false;
        const newVal = familyVocabulary.map((item, idx) => {
            const userVal = (vocabAnswers[idx] || '').trim().toUpperCase();
            const isCorrect = item.english.some(ans => ans.toUpperCase() === userVal);
            if (isCorrect) oneCorrect = true;
            return isCorrect ? 'correct' : 'incorrect';
        });

        setVocabValidation(newVal as any);
        if (oneCorrect) {
            toast({ title: "¡Buen trabajo!", description: "Has acertado al menos una. ¡Ya puedes avanzar!" });
            setCanAdvanceVocab(true);
        } else {
            toast({ variant: 'destructive', title: "Revisa tus respuestas", description: "Necesitas al menos una correcta para avanzar." });
        }
    };

    const getVocabClass = (idx: number) => {
        const status = vocabValidation[idx];
        if (status === 'correct') return 'border-green-500 bg-green-50 dark:bg-green-900/10 focus-visible:ring-green-500';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive';
        return '';
    };

    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic);

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Vocabulary (Family)</CardTitle>
                            <CardDescription>Traduce los miembros de la familia al inglés. Al menos una correcta para avanzar.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-lg">
                                <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-sm text-left">Spanish</div>
                                <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-sm text-left">English</div>
                                {familyVocabulary.map((item, idx) => (
                                    <React.Fragment key={idx}>
                                        <div className="flex items-center text-base font-medium py-1 text-left">
                                            {item.spanish}
                                        </div>
                                        <div className="flex items-center">
                                            <Input 
                                                value={vocabAnswers[idx] || ''}
                                                onChange={(e) => handleVocabChange(idx, e.target.value)}
                                                className={cn("h-9 uppercase font-mono text-sm", getVocabClass(idx))}
                                                placeholder="..."
                                                autoComplete="off"
                                            />
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center border-t pt-6">
                            <Button onClick={handleCheckVocab} variant="secondary">Verificar</Button>
                            <Button 
                                onClick={() => handleTopicComplete('vocabulary')} 
                                disabled={!canAdvanceVocab && !isAdmin}
                                className={cn(canAdvanceVocab && "bg-green-600 hover:bg-green-700")}
                            >
                                Avanzar <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                        <CardHeader className="bg-primary/10 border-b">
                            <div className="flex items-center gap-3">
                                <GraduationCap className="h-6 w-6 text-primary" />
                                <CardTitle className="text-2xl">LOS PRONOMBRES OBJETO: (OBJECT PRONOUNS)</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-8">
                            <div className="bg-muted/50 p-6 rounded-2xl border-2 border-dashed">
                                <h3 className="text-xl font-bold text-primary mb-3">¿Qué son?</h3>
                                <p className="text-lg leading-relaxed">
                                    SON PRONOMBRES que <strong>RECIBEN LA ACCIÓN</strong> DEL VERBO. Siempre van <strong>DESPUÉS</strong> de un verbo o de una preposición.
                                </p>
                                <p className="font-mono text-xl font-black text-center mt-4 bg-primary/10 p-3 rounded-lg">
                                    Example: I LOVE <span className="underline text-primary">YOU</span>
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xl font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                    <TableIcon className="h-5 w-5" /> LOS PRONOMBRES OBJETO SON:
                                </h3>
                                <div className="border-2 rounded-xl overflow-hidden shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-muted">
                                            <TableRow>
                                                <TableHead className="font-bold text-foreground">PRONOMBRES PERSONALES</TableHead>
                                                <TableHead className="font-bold text-foreground">PRONOMBRES OBJETO</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {objectPronounsData.map((row, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">{row.personal}</TableCell>
                                                    <TableCell className="font-bold text-primary">{row.object}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-xl font-black text-primary uppercase tracking-widest">PREPOSITIONS</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {prepositionsData.map((prep, idx) => (
                                            <div key={idx} className="flex justify-between p-2 bg-muted rounded border text-sm font-medium">
                                                <span>{prep.es}:</span>
                                                <span className="text-primary font-bold">{prep.en}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col justify-center">
                                     <div className="p-6 bg-yellow-50 dark:bg-yellow-900/10 border-2 border-yellow-500 rounded-2xl">
                                        <h4 className="text-lg font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-2 mb-2">
                                            <Sparkles className="h-5 w-5" /> NOTA:
                                        </h4>
                                        <p className="text-sm leading-relaxed">
                                            Cuando los pronombres objeto tengan como significado “CONTIGO”, “CON EL”, “CON ELLA” ETC… hay que apoyarlos con la preposición <strong>“WITH”</strong>.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-6">
                                <h3 className="text-2xl font-black text-primary uppercase tracking-widest">EJEMPLOS</h3>
                                
                                <div className="space-y-4">
                                    <h4 className="font-bold text-lg border-l-4 border-primary pl-3">A. DESPUÉS DE UN VERBO</h4>
                                    <div className="space-y-3 p-4 bg-muted/30 rounded-xl border">
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground italic">1. Ella llama a su novio todos los días:</p>
                                            <p className="font-bold">SHE CALLS HER BOYFRIEND EVERY DAY</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground italic">2. Ella <span className="font-bold">lo</span> llama todos los días:</p>
                                            <p className="font-bold text-primary">SHE CALLS <span className="underline">HIM</span> EVERY DAY</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-bold text-lg border-l-4 border-primary pl-3">B. DESPUÉS DE UNA PREPOSICIÓN</h4>
                                    <div className="grid gap-3">
                                        <div className="p-3 bg-muted/30 rounded-xl border flex flex-col sm:flex-row justify-between sm:items-center">
                                            <p className="font-bold text-primary">THE PRESENT IS FOR <span className="underline">THEM</span></p>
                                            <span className="text-sm text-muted-foreground italic">(EL REGALO ES PARA ELLOS)</span>
                                        </div>
                                        <div className="p-3 bg-muted/30 rounded-xl border flex flex-col sm:flex-row justify-between sm:items-center">
                                            <p className="font-bold text-primary">DO YOU TRAVEL WITH <span className="underline">HER</span>?</p>
                                            <span className="text-sm text-muted-foreground italic">(¿VIAJAS CON ELLA?)</span>
                                        </div>
                                        <div className="p-3 bg-muted/30 rounded-xl border flex flex-col sm:flex-row justify-between sm:items-center">
                                            <p className="font-bold text-primary">IS SHE WITH <span className="underline">THEM</span>?</p>
                                            <span className="text-sm text-muted-foreground italic">(¿ELLA ESTÁ CON ELLOS?)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t">
                            <Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-12 font-bold">
                                Entendido <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                );
            case 'ex1':
                const vocabEx1 = {
                    "quizás": "maybe / perhaps",
                    "próxima semana": "next week",
                    "jugando": "playing",
                    "videojuegos": "videogames / video games",
                    "sin": "without",
                    "durante": "during",
                    "reunión": "meeting",
                    "cuñada": "sister-in-law",
                    "primos": "cousins",
                    "juegos de mesa": "board games",
                    "iglesia": "church",
                    "llamar": "to call"
                };
                return <SimpleTranslationExercise exerciseKey="c11_ex1" course="a1" onComplete={() => handleTopicComplete('ex1')} title="Exercise 1" vocabulary={vocabEx1} />;
            case 'create1':
                return (
                    <CreativeWritingExercise 
                        title="Create 1" 
                        description="EXERCISE: INVENT 4 SENTENCES WITH OBJECT PRONOUNS:"
                        prompts={[
                            { id: 'sentence1', question: 'Sentence 1:', placeholder: 'Write your first sentence...' },
                            { id: 'sentence2', question: 'Sentence 2:', placeholder: 'Write your second sentence...' },
                            { id: 'sentence3', question: 'Sentence 3:', placeholder: 'Write your third sentence...' },
                            { id: 'sentence4', question: 'Sentence 4:', placeholder: 'Write your fourth sentence...' }
                        ]}
                        onComplete={() => handleTopicComplete('create1')}
                        studentDocRef={studentDocRef}
                        initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.create1Data || {}}
                        savePath={`lessonProgress.${progressStorageVersion}.create1Data`}
                        isSingleLine={true}
                    />
                );
            case 'ex2':
                return (
                    <SentenceCompletionExercise
                        title="Exercise 2: Complete the sentences"
                        description="Escribe el pronombre objeto correcto para completar cada oración."
                        data={ex2Data}
                        onComplete={() => handleTopicComplete('ex2')}
                        vocabulary={ex2Vocab}
                    />
                );
            case 'grammar2':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                        <CardHeader className="bg-primary/10 border-b">
                            <div className="flex items-center gap-3">
                                <ArrowDownWideNarrow className="h-6 w-6 text-primary" />
                                <CardTitle className="text-2xl">CONJUNCIONES BÁSICAS: (CONJUNCTIONS)</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-8">
                            <div className="bg-muted/50 p-6 rounded-2xl border-2 border-dashed">
                                <h3 className="text-xl font-bold text-primary mb-3">¿Qué son?</h3>
                                <p className="text-lg leading-relaxed">
                                    Las conjunciones son palabras que <strong>conectan</strong> oraciones, frases o palabras individuales para darles sentido y fluidez.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xl font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                    <TableIcon className="h-5 w-5" /> CONJUNCIONES PRINCIPALES:
                                </h3>
                                <div className="border-2 rounded-xl overflow-hidden shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-muted">
                                            <TableRow>
                                                <TableHead className="font-bold text-foreground">CONJUNCTION</TableHead>
                                                <TableHead className="font-bold text-foreground">FUNCTION</TableHead>
                                                <TableHead className="font-bold text-foreground">EXAMPLE</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {conjunctionsData.map((row, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-black text-primary text-lg">{row.word}</TableCell>
                                                    <TableCell className="font-medium text-muted-foreground">{row.function}</TableCell>
                                                    <TableCell className="italic text-sm leading-relaxed">{row.example}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            <div className="p-6 bg-brand-lilac/30 rounded-2xl border-2 border-brand-purple">
                                <h4 className="text-lg font-bold text-primary flex items-center gap-2 mb-4">
                                    <Sparkles className="h-5 w-5" /> TIP DE APRENDIZAJE:
                                </h4>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <p className="text-sm font-bold">Contrast (Pero):</p>
                                        <p className="text-sm bg-background p-3 rounded-lg border">I like coffee, <strong>but</strong> I don't like tea.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-bold">Condition (Si):</p>
                                        <p className="text-sm bg-background p-3 rounded-lg border">I will go to the party <strong>if</strong> I finish my homework.</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t">
                            <Button onClick={() => handleTopicComplete('grammar2')} size="lg" className="px-12 font-bold">
                                Entendido <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                );
            case 'ex3':
                return <SimpleTranslationExercise exerciseKey="c11_ex3" course="a1" onComplete={() => handleTopicComplete('ex3')} title="Exercise 3" vocabulary={ex3Vocab} />;
            case 'ex4':
                return <SimpleTranslationExercise exerciseKey="c11_ex4" course="a1" onComplete={() => handleTopicComplete('ex4')} title="Exercise 4" />;
            case 'vocab_game':
                return <VocabularyMatchingGame data={familyVocabulary.map(v => ({ spanish: v.spanish, english: v.english }))} title="Vocabulary Game (Family)" onComplete={() => handleTopicComplete('vocab_game')} />;
            case 'ex5':
                return <SimpleTranslationExercise exerciseKey="c11_ex5" course="a1" onComplete={() => handleTopicComplete('ex5')} title="Exercise 5" />;
            case 'ex6':
                return <SimpleTranslationExercise exerciseKey="c11_ex6" course="a1" onComplete={() => handleTopicComplete('ex6')} title="Exercise 6" />;
            default:
                return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>;
        }
    };

    if (isUserLoading || isProfileLoading) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
    }

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-left">
                        <Link href="/ingles/a1" className="hover:underline text-sm text-white/80">Volver al curso A1</Link>
                        <h1 className="text-4xl font-bold text-white dark:text-primary [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Class 11 (A1)</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9">{renderContent()}</div>
                        <div className="md:col-span-3 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple">
                                <CardHeader><CardTitle>Ruta de Aprendizaje</CardTitle></CardHeader>
                                <CardContent>
                                    <nav>
                                        <ul className="space-y-1">
                                            {learningPath.map((item) => {
                                                const Icon = item.status === 'completed' ? CheckCircle : (item.status === 'active' ? item.icon : Lock);
                                                const isLocked = item.status === 'locked' && !isAdmin;
                                                const isActive = item.status === 'active';
                                                return (
                                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                                        className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer',
                                                            isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted',
                                                            selectedTopic === item.key && 'bg-muted text-primary font-semibold',
                                                            isActive && !isAdmin && "animate-pulse-glow"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Icon className={cn("h-5 w-5", item.status === 'completed' ? 'text-green-500' : (item.status === 'locked' ? 'text-yellow-500' : ''))} />
                                                            <span>{item.name}</span>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </nav>
                                    <div className="mt-6 pt-6 border-t">
                                        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2"><span>Progreso</span><span className="font-bold text-foreground">{progressValue}%</span></div>
                                        <Progress value={progressValue} className="h-2" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
