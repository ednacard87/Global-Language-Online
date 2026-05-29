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
    Gamepad2,
    Pencil,
    MessageSquare,
    Info,
    ListChecks,
    Check,
    HelpCircle,
    XCircle,
    Globe
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'completed' | 'active' | 'locked';
};

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const progressStorageVersion = 'progress_b1_eng_u1_c1_v5_stable';
const mainProgressKey = 'progress_b1_eng_unit_1_class_1';

const phrasalVocabForButton = {
    "levantarse": "get up",
    "despertarse": "wake up",
    "encender": "turn on",
    "apagar": "turn off",
    "recoger": "pick up",
    "buscar": "look for",
    "cuidar": "take care",
    "averiguar": "find out",
    "regresar": "come back",
    "salir": "go out",
    "maquillarse": "make up",
    "sentarse": "sit down"
};

const phrasalVerbsData = [
    { spanish: 'LEVANTARSE', english: 'GET UP' },
    { spanish: 'DESPERTARSE', english: 'WAKE UP' },
    { spanish: 'ENCENDER', english: 'TURN ON' },
    { spanish: 'APAGAR', english: 'TURN OFF' },
    { spanish: 'RECOGER', english: 'PICK UP' },
    { spanish: 'BUSCAR', english: 'LOOK FOR' },
    { spanish: 'CUIDAR', english: 'TAKE CARE' },
    { spanish: 'AVERIGUAR', english: 'FIND OUT' },
    { spanish: 'REGRESAR', english: 'COME BACK' },
    { spanish: 'SALIR', english: 'GO OUT' },
    { spanish: 'MAQUILLARSE', english: 'MAKE UP' },
    { spanish: 'SENTARSE', english: 'SIT DOWN' },
];

const exerciseSomeVocab = {
    "unas rosas": "some roses",
    "unos pajaros": "some birds",
    "alli": "there",
    "algo de leche": "some milk",
    "la botella": "the bottle",
    "unas cervezas": "some beers",
    "la nevera": "the fridge",
    "algunos arboles": "some trees",
    "la finca": "the farm / country house",
    "algo de dinero": "some money"
};

const exerciseAnyVocab = {
    "papas": "potatoes",
    "nevera": "fridge / kitchen",
    "torta": "cake",
    "plata": "money",
    "azúcar": "sugar",
    "afuera": "outside"
};

const exerciseMixVocab = {
    "agua": "water",
    "te": "tea",
    "vino": "wine",
    "pan": "bread",
    "casi nunca": "hardly ever",
    "tarea": "homework",
    "quisieras": "would you like",
    "puedo": "can i"
};

export default function EngB1Class1Page() {
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
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // Vocab states
    const [phrasalAnswers, setPhrasalAnswers] = useState<string[]>(Array(phrasalVerbsData.length).fill(''));
    const [phrasalValidation, setPhrasalValidation] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(phrasalVerbsData.length).fill('unchecked'));
    const [canAdvancePhrasal, setCanAdvancePhrasal] = useState(false);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary_phrasal', name: 'Vocabulary (Phrasal Verbs)', icon: BookOpen, status: 'active' },
        { key: 'ex_phrasal', name: 'Exercise Phrasal Verbs', icon: PenSquare, status: 'locked' },
        { key: 'grammar_some', name: 'Grammar (Some)', icon: GraduationCap, status: 'locked' },
        { key: 'ex_some', name: 'Exercise With Some', icon: PenSquare, status: 'locked' },
        { key: 'grammar_any', name: 'Grammar (Any)', icon: GraduationCap, status: 'locked' },
        { key: 'ex_any', name: 'Exercise With Any', icon: PenSquare, status: 'locked' },
        { key: 'grammar_2', name: 'Grammar 2', icon: GraduationCap, status: 'locked' },
        { key: 'ex_mix', name: 'Exercise Mix', icon: PenSquare, status: 'locked' },
        { key: 'complete_1', name: 'Complete 1', icon: ListChecks, status: 'locked' },
        { key: 'grammar_indefinite', name: 'Grammar 3 (Pronombres indefinidos)', icon: GraduationCap, status: 'locked' },
        { key: 'rules', name: 'RULES', icon: Info, status: 'locked' },
        { key: 'complete_2', name: 'Complete 2', icon: ListChecks, status: 'locked' },
        { key: 'complete_3', name: 'Complete 3', icon: ListChecks, status: 'locked' },
        { key: 'complete_4', name: 'Complete 4', icon: ListChecks, status: 'locked' },
        { key: 'ex_mix_2', name: 'Exercise Mix 2', icon: PenSquare, status: 'locked' },
        { key: 'ex_mix_3', name: 'Exercise Mix 3', icon: PenSquare, status: 'locked' },
        { key: 'create_1', name: 'Create 1', icon: Pencil, status: 'locked' },
        { key: 'ex_mix_4', name: 'Exercise Mix 4', icon: PenSquare, status: 'locked' },
    ], []);
    
    // ASYNC FLOW 1: Carga inicial de Firestore
    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;

        let path = initialLearningPath.map(topic => ({ ...topic }));
        let savedSelectedTopic = '';

        if (isAdmin) {
          path.forEach(item => { item.status = 'completed'; });
        } else if(studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedData = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => {
                if (savedData[item.key]) item.status = savedData[item.key];
            });
            savedSelectedTopic = savedData.lastSelectedTopic || '';
        }

        // Reparación de ruta: Si uno está completado, el siguiente DEBE estar al menos activo
        let lastDone = true;
        for(let i=0; i < path.length; i++) {
            if (lastDone && path[i].status === 'locked') {
                path[i].status = 'active';
            }
            lastDone = path[i].status === 'completed';
        }

        setLearningPath(path);
        const firstActive = path.find(p => p.status === 'active');
        setSelectedTopic(savedSelectedTopic || firstActive?.key || path[0].key);
        setInitialLoadComplete(true);
        setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    // ASYNC FLOW 2: Guardado automático en Firestore
    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;

        const statusesToSave: Record<string, any> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => { statusesToSave[item.key] = item.status; });

        // Solo guardamos si hay un cambio real para no agotar la banda ancha
        const savedData = studentProfile?.lessonProgress?.[progressStorageVersion];
        if (JSON.stringify(statusesToSave) !== JSON.stringify(savedData)) {
            updateDocumentNonBlocking(studentDocRef, {
                [`lessonProgress.${progressStorageVersion}`]: statusesToSave,
                [`progress.${mainProgressKey}`]: progressValue
            });
        }
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, studentProfile, isInitialLoading]);

    // ASYNC FLOW 3: Manejo de desbloqueos (Toaster sanado)
    useEffect(() => {
        if (!topicToComplete) return;
    
        setLearningPath(currentPath => {
            let wasUnlocked = false;
            let nextToSelect: string | null = null;
            const newPath = currentPath.map(t => ({ ...t }));
          
            let topicFound = false;
            for (let i = 0; i < newPath.length && !topicFound; i++) {
                if (newPath[i].key === topicToComplete) {
                    if (newPath[i].status !== 'completed') {
                        newPath[i].status = 'completed';
                    }
                    if (i + 1 < newPath.length && newPath[i + 1].status === 'locked') {
                        newPath[i + 1].status = 'active';
                        wasUnlocked = true;
                        nextToSelect = newPath[i + 1].key;
                    }
                    topicFound = true;
                }
            }
            
            if (wasUnlocked) {
                // Notificación diferida para evitar error de renderizado
                setTimeout(() => toast({ title: "¡Siguiente tema desbloqueado!" }), 0);
            }
            if (nextToSelect) {
                const finalNext = nextToSelect;
                setTimeout(() => setSelectedTopic(finalNext), 0);
            }
            
            return newPath;
        });

        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicComplete = (completedKey: string) => {
        setTopicToComplete(completedKey);
    };

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') {
            toast({ variant: "destructive", title: "Contenido Bloqueado", description: "Debes completar los temas anteriores." });
            return;
        }
        setSelectedTopic(topicKey);

        const autoViewTopics = ['grammar_some', 'grammar_any', 'grammar_2', 'grammar_indefinite', 'rules'];
        if (autoViewTopics.includes(topicKey)) {
            handleTopicComplete(topicKey);
        }
    };

    const handlePhrasalChange = (idx: number, val: string) => {
        const newAns = [...phrasalAnswers];
        newAns[idx] = val;
        setPhrasalAnswers(newAns);

        const newVal = [...phrasalValidation];
        newVal[idx] = 'unchecked';
        setPhrasalValidation(newVal as any);
        setCanAdvancePhrasal(false);
    };

    const handleCheckPhrasal = () => {
        let atLeastOneCorrect = false;
        const newVal = phrasalVerbsData.map((item, idx) => {
            const userVal = (phrasalAnswers[idx] || '').trim().toUpperCase();
            const correctVal = item.english.toUpperCase();
            const isCorrect = userVal === correctVal;
            if (isCorrect) atLeastOneCorrect = true;
            return isCorrect ? 'correct' : 'incorrect';
        });

        setPhrasalValidation(newVal as any);
        if (atLeastOneCorrect) {
            toast({ title: "¡Buen trabajo!", description: "Has acertado al menos una. ¡Ya puedes avanzar!" });
            setCanAdvancePhrasal(true);
        } else {
            toast({ variant: 'destructive', title: "Revisa tus respuestas", description: "Necesitas al menos una correcta para avanzar." });
        }
    };

    const getPhrasalInputClass = (idx: number) => {
        const status = phrasalValidation[idx];
        if (status === 'correct') return 'border-green-500 bg-green-50 dark:bg-green-900/10 focus-visible:ring-green-500';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive';
        return '';
    };

    const renderContent = () => {
        if (isInitialLoading) {
            return (
                <Card className="flex flex-col items-center justify-center min-h-[400px] border-2 border-brand-purple">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground animate-pulse">Recuperando tu progreso...</p>
                </Card>
            );
        }

        const topic = learningPath.find(t => t.key === selectedTopic);
        if (!topic) return null;

        //-----VOCABULARY PHRASAL VERBS -----------
        switch (selectedTopic) {
            case 'vocabulary_phrasal':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Vocabulary (Phrasal Verbs)</CardTitle>
                            <CardDescription>Traduce los phrasal verbs al inglés. Necesitas al menos uno correcto para desbloquear la ruta.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-lg">
                                <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-sm text-left">Español</div>
                                <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-sm text-left">Inglés</div>
                                {phrasalVerbsData.map((item, idx) => (
                                    <React.Fragment key={idx}>
                                        <div className="flex items-center text-base font-medium py-1 text-left">
                                            {item.spanish}
                                        </div>
                                        <div className="flex items-center">
                                            <Input 
                                                value={phrasalAnswers[idx] || ''}
                                                onChange={(e) => handlePhrasalChange(idx, e.target.value)}
                                                className={cn("h-10 uppercase font-mono text-sm", getPhrasalInputClass(idx))}
                                                placeholder="..."
                                                autoComplete="off"
                                            />
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center border-t pt-6 mt-4">
                            <Button onClick={handleCheckPhrasal} variant="secondary">Verificar</Button>
                            <Button 
                                onClick={() => handleTopicComplete('vocabulary_phrasal')} 
                                disabled={!canAdvancePhrasal && !isAdmin}
                                className={cn(canAdvancePhrasal && "bg-green-600 hover:bg-green-700 shadow-lg")}
                            >
                                Avanzar <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                );

                //-------EXERCISE PHRASAL VERBS-----------
            case 'ex_phrasal':
              return <SimpleTranslationExercise exerciseKey="c1_b1_phrasal" course="b1" onComplete={() => handleTopicComplete('ex_phrasal')} vocabulary={phrasalVocabForButton} highlightVocabulary={true} />;

                //------------Grammar Some--------
            case 'grammar_some':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader className="bg-primary/10 border-b">
                            <div className="flex items-center gap-3">
                                <GraduationCap className="h-6 w-6 text-primary" />
                                <CardTitle className="text-2xl font-black">USOS DE "SOME" Y "ANY"</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-8 text-left">
                            <div className="space-y-4">
                                <p className="text-lg leading-relaxed">
                                    El plural del artículo indeterminado <span className="font-bold">"A"</span> o <span className="font-bold">"AN"</span> es <span className="font-bold text-primary">"SOME"</span> o <span className="font-bold text-brand-purple">"ANY"</span>.
                                </p>
                                <p className="text-lg leading-relaxed">
                                    <span className="font-bold">"SOME"</span> y <span className="font-bold">"ANY"</span> significan: <span className="italic">ALGÚN, ALGUNA, ALGUNOS, ALGUNAS, ALGO DE.</span>
                                </p>
                            </div>

                            <div className="bg-muted/50 p-6 rounded-2xl border-2 border-dashed space-y-4">
                                <h3 className="text-xl font-bold text-primary mb-3 uppercase">Ejemplos:</h3>
                                <div className="space-y-3 font-mono text-base">
                                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 p-2 bg-background rounded border">
                                        <span className="font-bold">THERE ARE SOME BOOKS</span>
                                        <span className="text-muted-foreground text-sm">(HAY UNOS LIBROS SOBRE LA MESA)</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 p-2 bg-background rounded border">
                                        <span className="font-bold">THERE AREN'T ANY CHAIRS</span>
                                        <span className="text-muted-foreground text-sm">(NO HAY NINGUNA SILLA EN ESE SALON)</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 p-2 bg-background rounded border">
                                        <span className="font-bold">THERE ARE SOME BEERS IN THE FRIDGE</span>
                                        <span className="text-muted-foreground text-sm">(HAY UNAS CERVESAS EN LA NEVERA)</span>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-6">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-lg">+</div>
                                    <h3 className="text-2xl font-black text-primary uppercase tracking-tighter">SOME (+) frases afirmativas</h3>
                                </div>

                                <div className="bg-primary/5 p-4 rounded-lg border border-dashed text-center">
                                    <p className="font-bold text-lg uppercase tracking-widest text-primary">Countable and Uncountable</p>
                                </div>
                                
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="p-6 bg-brand-teal/10 rounded-2xl border-2 border-brand-teal space-y-3">
                                        <h4 className="font-black text-brand-teal text-lg uppercase">Countable</h4>
                                        <p className="text-sm">Significado: <strong>unos(as) - algunos(as)</strong></p>
                                        <div className="flex items-center gap-2 text-xs font-bold bg-background p-2 rounded border border-brand-teal/20">
                                            <Check className="h-4 w-4 text-green-500" />
                                            EL VERBO Y EL SUSTANTIVO VAN EN PLURAL
                                        </div>
                                    </div>

                                    <div className="p-6 bg-brand-purple/10 rounded-2xl border-2 border-brand-purple space-y-3">
                                        <h4 className="font-black text-brand-purple text-lg uppercase">Uncountable</h4>
                                        <p className="text-sm">Significado: <strong>algo ó algo de</strong></p>
                                        <div className="flex items-center gap-2 text-xs font-bold bg-background p-2 rounded border border-brand-purple/20">
                                            <Check className="h-4 w-4 text-green-500" />
                                            EL VERBO Y EL SUSTANTIVO VA EN SINGULAR
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6">
                            <Button onClick={() => handleTopicComplete('grammar_some')} size="lg" className="px-16 font-bold h-14 text-xl">
                                Entendido <ArrowRight className="ml-2 h-6 w-6" />
                            </Button>
                        </CardFooter>
                    </Card>
                );

                //Exercise with some
            case 'ex_some':
                return (
                    <SimpleTranslationExercise 
                        exerciseKey="custom_ex_some"
                        title="Exercise With Some"
                        onComplete={() => handleTopicComplete('ex_some')}
                        vocabulary={exerciseSomeVocab}
                        course="b1"
                    />
                );

                //------------Grammar Any--------
            case 'grammar_any':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader className="bg-brand-purple/10 border-b">
                            <div className="flex items-center gap-3">
                                <GraduationCap className="h-6 w-6 text-brand-purple" />
                                <CardTitle className="text-2xl font-black">ANY</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-8 text-left">
                            <div className="bg-muted/50 p-6 rounded-2xl border-2 border-dashed space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Info className="h-6 w-6 text-brand-purple" />
                                        USO DE "ANY"
                                    </h3>
                                    <p className="text-lg leading-relaxed">
                                        Se usa en <span className="font-bold text-red-500">(-) Frases negativas</span> e <span className="font-bold text-blue-500">(?) interrogativas</span>.
                                    </p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <XCircle className="h-5 w-5 text-red-500" />
                                            <h4 className="font-bold text-red-700 dark:text-red-400">(-) NEGATIVO</h4>
                                        </div>
                                        <p className="text-sm">Significado: <strong>Ninguno(a) - nada de</strong></p>
                                    </div>

                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <HelpCircle className="h-5 w-5 text-blue-500" />
                                            <h4 className="font-bold text-blue-700 dark:text-blue-400">(?) INTERROGATIVO</h4>
                                        </div>
                                        <p className="text-sm">Significado: <strong>alguno(a) - algo de</strong></p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-dashed">
                                    <div className="flex items-center gap-2 font-bold text-lg text-primary">
                                        <Globe className="h-5 w-5" />
                                        <span>Countable and Uncountable</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1 italic">Funciona tanto con sustantivos que se pueden contar como con los que no.</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6">
                            <Button onClick={() => handleTopicComplete('grammar_any')} size="lg" className="px-16 font-bold h-14 text-xl bg-brand-purple hover:bg-brand-purple/90 text-purple-900">
                                Entendido <ArrowRight className="ml-2 h-6 w-6" />
                            </Button>
                        </CardFooter>
                    </Card>
                );

                // --- Exercise with any ---- 
            case 'ex_any':
                return (
                    <SimpleTranslationExercise 
                        exerciseKey="custom_ex_any"
                        title="Exercise With Any"
                        onComplete={() => handleTopicComplete('ex_any')}
                        vocabulary={exerciseAnyVocab}
                        course="b1"
                    />
                );

                //--- GRAMMAR 2: SOME EN OFRECIMIENTOS Y PETICIONES + ANY EN AFIRMATIVAS
            case 'grammar_2':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader className="bg-primary/10 border-b">
                            <div className="flex items-center gap-3">
                                <GraduationCap className="h-6 w-6 text-primary" />
                                <CardTitle className="text-2xl font-black">SOME AND ANY - USOS ESPECIALES</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-8 text-left">
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-primary flex items-center gap-2 uppercase">
                                    <Info className="h-5 w-5" /> 1. Repaso General
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-muted rounded-xl border-l-4 border-primary">
                                        <p className="font-bold">SOME</p>
                                        <p className="text-sm">(+) Frases Afirmativas</p>
                                    </div>
                                    <div className="p-4 bg-muted rounded-xl border-l-4 border-brand-purple">
                                        <p className="font-bold">ANY</p>
                                        <p className="text-sm">(-) Negativas / (?) Interrogativas</p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-primary flex items-center gap-2 uppercase">
                                    <HelpCircle className="h-5 w-5" /> 2. SOME en preguntas (?)
                                </h3>
                                <p className="text-muted-foreground">Usamos <span className="font-bold text-primary">SOME</span> en preguntas cuando se trata de ofrecimientos (Offer) o peticiones (Request):</p>
                                
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-primary/5 rounded-xl border-2 border-dashed border-primary/30">
                                        <h4 className="font-bold text-primary uppercase text-sm mb-2">Offer (Ofrecimiento)</h4>
                                        <p className="font-mono text-base">Would you like <strong>some</strong>____?</p>
                                        <p className="text-xs text-muted-foreground italic mt-1">(¿Te gustaría algo de...?)</p>
                                    </div>
                                    <div className="p-4 bg-primary/5 rounded-xl border-2 border-dashed border-primary/30">
                                        <h4 className="font-bold text-primary uppercase text-sm mb-2">Request (Petición)</h4>
                                        <p className="font-mono text-base">Can I have <strong>some</strong>_____?</p>
                                        <p className="text-xs text-muted-foreground italic mt-1">(¿Podría darme algo de...?)</p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-primary flex items-center gap-2 uppercase">
                                    <CheckCircle className="h-5 w-5" /> 3. ANY en frases afirmativas (+)
                                </h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-muted rounded-xl border">
                                        <h4 className="font-bold text-foreground">Significado: "Cualquiera"</h4>
                                        <p className="text-sm italic mt-1">Example: Dame cualquiera de ellos</p>
                                        <p className="font-mono text-primary font-bold mt-1">Give me <strong>any</strong> of them.</p>
                                    </div>

                                    <div className="p-4 bg-muted rounded-xl border">
                                        <h4 className="font-bold text-foreground flex items-center gap-2">
                                            Significado Negativo
                                        </h4>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Se trata de frases que contienen palabras negativas como <span className="font-bold">Never</span>, <span className="font-bold">Hardly ever</span>, etc.
                                        </p>
                                        <p className="text-sm italic">Example: Yo nunca bebo ningún vino</p>
                                        <p className="font-mono text-primary font-bold mt-1">I <strong>never</strong> drink <strong>any</strong> wine.</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6">
                            <Button onClick={() => handleTopicComplete('grammar_2')} size="lg" className="px-16 font-bold h-14 text-xl">
                                He terminado de estudiar <ArrowRight className="ml-2 h-6 w-6" />
                            </Button>
                        </CardFooter>
                    </Card>
                );
            case 'ex_mix':
                return (
                    <SimpleTranslationExercise 
                        exerciseKey="custom_ex_mix"
                        title="Exercise Mix"
                        onComplete={() => handleTopicComplete('ex_mix')}
                        vocabulary={exerciseMixVocab}
                        course="b1"
                    />
                );
            default:
                const isGrammar = topic.key.startsWith('grammar') || topic.key === 'rules';
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <topic.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle>{topic.name}</CardTitle>
                                    <CardDescription>
                                        {isGrammar ? 'Estudia la lección de gramática.' : 'Completa la actividad para avanzar.'}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="min-h-[300px] flex flex-col justify-center items-center text-center space-y-4">
                            <p className="text-lg text-muted-foreground">
                                {isGrammar ? 'El contenido gramatical de esta sección estará disponible pronto.' : 'Aquí aparecerá el ejercicio interactivo.'}
                            </p>
                            <div className="p-8 bg-muted/30 rounded-full">
                                <topic.icon className="h-24 w-24 text-primary/20" />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6">
                            <Button onClick={() => handleTopicComplete(topic.key)} size="lg" className="px-12 font-bold">
                                {isGrammar ? 'He terminado de leer' : 'Completar actividad'}
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </CardFooter>
                    </Card>
                );
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-left text-white">
                        <Link href="/ingles/b1/unit/1" className="hover:underline text-sm font-bold text-primary">Volver a la Unidad 1</Link>
                        <h1 className="text-4xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Class 1 (B1)</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-3 md:order-2 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4"><CardTitle className="text-lg">Ruta de Aprendizaje</CardTitle></CardHeader>
                                <CardContent className="p-0">
                                    <div className="max-h-[60vh] overflow-y-auto px-6 pb-6 text-foreground">
                                        {isInitialLoading ? (
                                            <div className="space-y-2">
                                                {Array.from({ length: 6 }).map((_, i) => (
                                                    <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
                                                ))}
                                            </div>
                                        ) : (
                                            <nav>
                                                <ul className="space-y-1">
                                                    {learningPath.map((item) => {
                                                        const Icon = item.status === 'completed' ? CheckCircle : item.icon;
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
                                                                    <span className="truncate max-w-[150px]">{item.name}</span>
                                                                </div>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </nav>
                                        )}
                                    </div>
                                    <div className="p-6 border-t">
                                        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2"><span>Progreso</span><span className="font-bold text-foreground">{progressValue}%</span></div>
                                        <Progress value={progressValue} className="h-2" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="md:col-span-9 md:order-1">{renderContent()}</div>
                    </div>
                </div>
            </main>
        </div>
    );
}