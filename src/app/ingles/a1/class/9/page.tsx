'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
    ChevronDown, 
    CloudSun,
    Home,
    ArrowRight,
    Lightbulb
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { LargeTextTranslation } from '@/components/dashboard/large-text-translation';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { CreativeWritingExercise } from '@/components/dashboard/creative-writing-exercise';
import { Separator } from '@/components/ui/separator';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'completed' | 'active' | 'locked';
};

const ICONS = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const progressStorageVersion = 'progress_a1_eng_u2_c9_v4_grammar3';
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
        { spanish: 'HACE CALOR', english: ["IT'S HOT", "IT IS HOT", "HAVE HEAT"] },
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

const fullVocabList = [...vocabularyData.weather, ...vocabularyData.house];

export default function EngA1Class9Page() {
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

    // Vocab States
    const [vocabAnswers, setVocabAnswers] = useState<{[key: string]: string[]}>({});
    const [vocabValidation, setVocabValidation] = useState<{[key: string]: ('correct' | 'incorrect' | 'unchecked')[]}>({});
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary (Weather and house)', icon: Home, status: 'active' },
        { key: 'grammar', name: 'Grammar', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'grammar2', name: 'Grammar 2', icon: GraduationCap, status: 'locked' },
        { key: 'ex2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'grammar3', name: 'Grammar 3', icon: GraduationCap, status: 'locked' },
        { key: 'ex3', name: 'Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'dialogue1', name: 'Dialogue 1', icon: MessageSquare, status: 'locked' },
        { key: 'ex4', name: 'Exercise 4', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: 'Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
        { key: 'ex5', name: 'Exercise 5', icon: PenSquare, status: 'locked' },
        { key: 'writing1', name: 'Writing 1', icon: Pencil, status: 'locked' },
        { key: 'dialogue2', name: 'Dialogue 2', icon: MessageSquare, status: 'locked' },
    ], []);
    
    useEffect(() => {
        if (isProfileLoading || isUserLoading) return;
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

        // Initialize vocab answers state
        const initialAnswers: { [key: string]: string[] } = {};
        const initialValidation: { [key: string]: ('correct' | 'incorrect' | 'unchecked')[] } = {};
        Object.keys(vocabularyData).forEach(category => {
            const cat = category as keyof typeof vocabularyData;
            initialAnswers[cat] = Array(vocabularyData[cat].length).fill('');
            initialValidation[cat] = Array(vocabularyData[cat].length).fill('unchecked');
        });
        setVocabAnswers(initialAnswers);
        setVocabValidation(initialValidation);
        setCanAdvanceVocab(false);

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

        const autoViewTopics = ['grammar', 'grammar2', 'grammar3'];
        if (autoViewTopics.includes(topicKey)) {
            handleTopicComplete(topicKey);
        }
    };

    const handleVocabInputChange = (category: string, index: number, value: string) => {
        setVocabAnswers(prev => ({
            ...prev,
            [category]: prev[category].map((ans, i) => (i === index ? value : ans)),
        }));
        const newValidation = { ...vocabValidation };
        const catKey = category as keyof typeof vocabValidation;
        if (newValidation[catKey]?.[index] !== 'unchecked') {
            newValidation[catKey][index] = 'unchecked';
            setVocabValidation(newValidation);
        }
        setCanAdvanceVocab(false);
    };

    const handleCheckVocab = () => {
        let atLeastOneCorrect = false;
        const newValidationStatus: { [key: string]: ('correct' | 'incorrect' | 'unchecked')[] } = {};

        Object.keys(vocabularyData).forEach(category => {
            const cat = category as keyof typeof vocabularyData;
            newValidationStatus[cat] = vocabularyData[cat].map((item, index) => {
                const userAnswer = (vocabAnswers[cat]?.[index] || '').trim().toUpperCase().replace(/[()]/g, '');
                const isCorrect = item.english.some(e => e.toUpperCase().replace(/[()]/g, '') === userAnswer);
                if (isCorrect) {
                    atLeastOneCorrect = true;
                }
                return isCorrect ? 'correct' : 'incorrect';
            });
        });

        setVocabValidation(newValidationStatus);

        if (atLeastOneCorrect) {
            toast({ title: "¡Bien hecho!", description: "Has acertado al menos una palabra. ¡Ya puedes avanzar!" });
            setCanAdvanceVocab(true);
        } else {
            toast({ 
                variant: "destructive", 
                title: "Respuesta incorrecta", 
                description: "Necesitas al menos una respuesta correcta para habilitar el avance." 
            });
            setCanAdvanceVocab(false);
        }
    };

    const getVocabInputClass = (category: string, index: number) => {
        const status = vocabValidation[category]?.[index];
        if (status === 'correct') return 'border-green-500 bg-green-50 dark:bg-green-900/10 focus-visible:ring-green-500';
        if (status === 'incorrect') return 'border-destructive bg-destructive/5 focus-visible:ring-destructive';
        return '';
    };

    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic);

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Vocabulary (Weather and house)</CardTitle>
                            <CardDescription>Escribe la traducción al inglés para cada palabra. Al menos una correcta para avanzar.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Accordion type="multiple" defaultValue={['weather', 'house']} className="w-full">
                                <AccordionItem value="weather">
                                    <AccordionTrigger className="text-xl font-bold uppercase text-primary">Atmospheric Weather</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                            <div className="font-bold p-3 bg-muted rounded-lg text-left">Español</div>
                                            <div className="font-bold p-3 bg-muted rounded-lg text-left">Inglés</div>
                                            {vocabularyData.weather.map((item, index) => (
                                                <React.Fragment key={`weather-${index}`}>
                                                    <div className="p-3 bg-card border rounded-lg flex items-center">{item.spanish}</div>
                                                    <div className="p-3 bg-card border rounded-lg flex items-center">
                                                        <Input
                                                            value={vocabAnswers.weather?.[index] || ''}
                                                            onChange={e => handleVocabInputChange('weather', index, e.target.value)}
                                                            className={cn(getVocabInputClass('weather', index))}
                                                            autoComplete="off"
                                                        />
                                                    </div>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="house">
                                    <AccordionTrigger className="text-xl font-bold uppercase text-primary">Places in the House</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                            <div className="font-bold p-3 bg-muted rounded-lg text-left">Español</div>
                                            <div className="font-bold p-3 bg-muted rounded-lg text-left">Inglés</div>
                                            {vocabularyData.house.map((item, index) => (
                                                <React.Fragment key={`house-${index}`}>
                                                    <div className="p-3 bg-card border rounded-lg flex items-center">{item.spanish}</div>
                                                    <div className="p-3 bg-card border rounded-lg flex items-center">
                                                        <Input
                                                            value={vocabAnswers.house?.[index] || ''}
                                                            onChange={e => handleVocabInputChange('house', index, e.target.value)}
                                                            className={cn(getVocabInputClass('house', index))}
                                                            autoComplete="off"
                                                        />
                                                    </div>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center border-t pt-6">
                            <Button onClick={handleCheckVocab}>Verificar</Button>
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
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Grammar: Demonstratives</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8 text-lg">
                            <div className="bg-brand-purple/5 p-6 rounded-xl border-l-4 border-brand-purple">
                                <h3 className="text-xl font-bold mb-2 text-brand-purple">DEMOSTRATIVOS</h3>
                                <p className="text-muted-foreground text-base mb-4">
                                    LOS DEMOSTRATIVOS (THIS, THESE, THAT, THOSE) SE USAN PARA INDICAR LA POSICION Y EL ESPACIO DE UN NOMBRE CON RESPETO AL SUJETO.
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-muted rounded-lg border">
                                        <p className="font-bold text-primary">THIS</p>
                                        <p className="text-sm">ESTE/A (CERCA, SINGULAR)</p>
                                    </div>
                                    <div className="p-3 bg-muted rounded-lg border">
                                        <p className="font-bold text-primary">THESE</p>
                                        <p className="text-sm">ESTAS/OS (CERCA, PLURAL)</p>
                                    </div>
                                    <div className="p-3 bg-muted rounded-lg border">
                                        <p className="font-bold text-brand-purple">THAT</p>
                                        <p className="text-sm">ESE/A (LEJOS, SINGULAR)</p>
                                    </div>
                                    <div className="p-3 bg-muted rounded-lg border">
                                        <p className="font-bold text-brand-purple">THOSE</p>
                                        <p className="text-sm">ESOS/AS (LEJOS, PLURAL)</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center">
                            <Button onClick={() => handleTopicComplete('grammar')}>Entendido</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar2':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>ONE AND ONES</CardTitle>
                            <CardDescription>Reemplaza el sustantivo para evitar repeticiones.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8 text-lg">
                            <div className="bg-primary/5 p-6 rounded-xl border-l-4 border-primary">
                                <p className="font-bold">REEMPLAZA EL SUSTANTIVO POR “ONE” (SINGULAR) Y “ONES” (PLURAL)</p>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-brand-purple">DEMOSTRATIVOS + ONE / ONES</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-muted rounded-lg border">
                                        <p className="font-bold text-primary">THIS ONE?</p>
                                        <p className="text-sm text-muted-foreground">(¿ESTE?) Cerca y Singular</p>
                                    </div>
                                    <div className="p-4 bg-muted rounded-lg border">
                                        <p className="font-bold text-primary">THESE ONES?</p>
                                        <p className="text-sm text-muted-foreground">(¿ESTOS?) Cerca y Plural</p>
                                    </div>
                                    <div className="p-4 bg-muted rounded-lg border">
                                        <p className="font-bold text-brand-purple">THAT ONE?</p>
                                        <p className="text-sm text-muted-foreground">(¿AQUEL?) Lejos y Singular</p>
                                    </div>
                                    <div className="p-4 bg-muted rounded-lg border">
                                        <p className="font-bold text-brand-purple">THOSE ONES?</p>
                                        <p className="text-sm text-muted-foreground">(¿AQUELLOS?) Lejos y Plural</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200">
                                    <Lightbulb className="h-5 w-5 text-yellow-500 shrink-0" />
                                    <p className="text-sm"><strong>NOTA:</strong> Tenemos la opción de utilizar números en reemplazo de "Ones".</p>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h3 className="text-xl font-bold">EXAMPLES</h3>
                                <div className="space-y-3 p-4 bg-muted/50 rounded-lg border border-dashed">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground italic">Frase base:</p>
                                        <p className="font-bold">SHE DOESN'T LIKE THESE COMPUTERS</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground italic">Usando "ones":</p>
                                        <p className="font-bold text-primary">SHE DOESN'T LIKE THESE ONES</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground italic">Usando un número:</p>
                                        <p className="font-bold text-brand-purple">SHE DOESN'T LIKE THESE THREE</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-primary/5 p-4 rounded-lg border-2 border-dashed border-primary/30">
                                <p className="text-base">PODEMOS USAR EL DEMOSTRATIVO SOLO SI YA SE DA POR ENTENDIDO EL CONTEXTO.</p>
                                <div className="mt-3 space-y-2 font-mono text-sm">
                                    <p>I DON’T LIKE <strong>THIS</strong> (NO ME GUSTA ESTO)</p>
                                    <p><strong>THAT</strong> WASN’T WHAT I EXPECTED (ESO NO ERA LO QUE ESPERABA)</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center">
                            <Button onClick={() => handleTopicComplete('grammar2')}>Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar3':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Grammar 3</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Contenido para Grammar 3 estará disponible pronto.</p>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => handleTopicComplete('grammar3')}>Continuar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'ex1':
                return <SimpleTranslationExercise exerciseKey="c9_ex1" course="a1" title="Exercise 1" onComplete={() => handleTopicComplete('ex1')} />;
            case 'ex2':
                return <SimpleTranslationExercise exerciseKey="c9_ex2" course="a1" title="Exercise 2" onComplete={() => handleTopicComplete('ex2')} />;
            case 'ex3':
                return <SimpleTranslationExercise exerciseKey="c9_ex3" course="a1" title="Exercise 3" onComplete={() => handleTopicComplete('ex3')} />;
            case 'ex4':
                return <SimpleTranslationExercise exerciseKey="c9_ex4" course="a1" title="Exercise 4" onComplete={() => handleTopicComplete('ex4')} />;
            case 'ex5':
                return <SimpleTranslationExercise exerciseKey="c9_ex5" course="a1" title="Exercise 5" onComplete={() => handleTopicComplete('ex5')} />;
            case 'dialogue1':
                return (
                    <LargeTextTranslation 
                        title="Dialogue 1" 
                        phrases={[
                            { spanish: "Hola, ¿cómo estás?", answers: ["hello, how are you?", "hi, how are you?"] },
                            { spanish: "¿Cómo está el clima afuera?", answers: ["how is the weather outside?"] },
                            { spanish: "Está muy soleado y hace calor.", answers: ["it is very sunny and hot", "it's very sunny and hot"] }
                        ]} 
                        onComplete={() => handleTopicComplete('dialogue1')} 
                    />
                );
            case 'dialogue2':
                return (
                    <LargeTextTranslation 
                        title="Dialogue 2" 
                        phrases={[
                            { spanish: "¿Dónde está tu gato?", answers: ["where is your cat?", "where's your cat?"] },
                            { spanish: "Él está en el jardín.", answers: ["he is in the garden", "he's in the garden"] },
                            { spanish: "Es un jardín muy grande.", answers: ["it is a very big garden", "it's a very big garden"] }
                        ]} 
                        onComplete={() => handleTopicComplete('dialogue2')} 
                    />
                );
            case 'vocab_game':
                return <VocabularyMatchingGame data={fullVocabList} title="Matching Game: Weather & House" onComplete={() => handleTopicComplete('vocab_game')} />;
            case 'writing1':
                return (
                    <CreativeWritingExercise 
                        title="Writing 1" 
                        description="Describe your house and today's weather."
                        prompts={[{ id: 'writing-c9', question: 'My House and the Weather', placeholder: 'In my house, there is a living room...' }]}
                        onComplete={() => handleTopicComplete('writing1')}
                        studentDocRef={studentDocRef}
                        initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.writing1 || {}}
                        savePath={`lessonProgress.${progressStorageVersion}.writing1`}
                    />
                );
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
                    <div className="mb-8">
                        <Link href="/ingles/a1" className="hover:underline text-sm text-muted-foreground">Volver al curso A1</Link>
                        <h1 className="text-4xl font-bold text-white dark:text-primary [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase 9</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9">{renderContent()}</div>
                        <div className="md:col-span-3">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple">
                                <CardHeader><CardTitle>Ruta de Aprendizaje</CardTitle></CardHeader>
                                <CardContent>
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
                                                            <span>{item.name}</span>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </nav>
                                    <div className="mt-6 pt-6 border-t">
                                        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2"><span>Progreso</span><span className="font-bold text-foreground">{Math.round(progressValue)}%</span></div>
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
