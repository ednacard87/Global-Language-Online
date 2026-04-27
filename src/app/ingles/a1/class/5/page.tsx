'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, Info, CheckCircle } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { ErrorCorrectionExercise, type ErrorCorrectionPrompt } from '@/components/kids/exercises/error-correction-exercise';
import { PresentSimpleExercise, type ExercisePrompt } from '@/components/kids/exercises/present-simple';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
};

const progressStorageVersion = 'progress_a1_eng_unit_1_class_5_v1';
const mainProgressKey = 'progress_a1_eng_unit_1_class_5';

const vocabularyData = {
    verbos: [
        { spanish: 'SALTAR', english: 'JUMP' },
        { spanish: 'QUERER', english: 'WANT' },
        { spanish: 'PODER', english: 'CAN' },
        { spanish: 'DEBER', english: 'SHOULD' },
        { spanish: 'VIAJAR', english: 'TRAVEL' },
        { spanish: 'LLAMAR', english: 'CALL' },
        { spanish: 'MANEJAR', english: 'DRIVE' },
        { spanish: 'COCINAR', english: 'COOK' },
        { spanish: 'LEVANTARSE', english: 'GET UP' },
        { spanish: 'ESTAR DE PIE', english: 'STAND UP' },
        { spanish: 'DESPERTARSE', english: 'WAKE UP' },
        { spanish: 'RECIBIR', english: 'RECEIVE' },
        { spanish: 'ENVIAR', english: 'SEND' },
        { spanish: 'VIVIR', english: 'LIVE' },
        { spanish: 'TOMAR- AGARRAR', english: 'TAKE' },
        { spanish: 'ABRIR', english: 'OPEN' },
        { spanish: 'CERRAR', english: 'CLOSE' },
        { spanish: 'VENIR', english: 'COME' },
        { spanish: 'LLEGAR', english: 'ARRIVE' },
    ],
    adjetivos: [
        { spanish: 'ABURRIDO', english: 'BORED' },
        { spanish: 'CANSADO', english: 'TIRED' },
        { spanish: 'HAMBRIENTO', english: 'HUNGRY' },
        { spanish: 'ENOJADO', english: 'ANGRY' },
        { spanish: 'PREOCUPADO', english: 'WORRIED' },
        { spanish: 'SEDIENTO-CON SED', english: 'THIRSTY' },
        { spanish: 'PESADO', english: 'HEAVY' },
        { spanish: 'LIVIANO', english: 'LIGHT' },
        { spanish: 'TRISTE', english: 'SAD' },
        { spanish: 'OCUPADO', english: 'BUSY' },
    ]
};

const exercise1Data: ErrorCorrectionPrompt[] = [
    { incorrect: "SHE DONT ANSWER MY QUESTION", translationHint: "(ELLA NO CONTESTA MIS PREGUNTAS)", correctAnswers: ["she does not answer my questions", "she doesn't answer my questions"] },
    { incorrect: "WE DONT GOES TO SCHOL THE SONDAYS.", translationHint: "", correctAnswers: ["we do not go to school on sundays", "we don't go to school on sundays"] },
    { incorrect: "DOIS JOSEPH LIKES MUVIS?", translationHint: "(¿A JOSEPH LE GUSTAN LAS PELÍCULAS?)", correctAnswers: ["does joseph like movies?"] },
    { incorrect: "I DONT WORKS THERE", translationHint: "( YO NO TRABAJO ALLA)", correctAnswers: ["i do not work there", "i don't work there"] },
    { incorrect: "SHI ARE NO ROSE", translationHint: "( ELLA NO ES LUISA)", correctAnswers: ["she is not rose", "she isn't rose"] },
    { incorrect: "DOES SHE ARE YUR MOTHER?", translationHint: "(ELLA ES TU MAMA?)", correctAnswers: ["is she your mother?"] },
    { incorrect: "DO YOU TRAVELS EVERY WINTAR OR SOMER?", translationHint: "(¿VIAJAS CADA VERANO?)", correctAnswers: ["do you travel every winter or summer?"] },
    { incorrect: "DOES MARCO AND MARIA GOES THERE?", translationHint: "(¿MARCO Y MARIA VAN ALLA?)", correctAnswers: ["do marco and maria go there?"] },
    { incorrect: "MARY’S PLEY EVERY DEY", translationHint: "", correctAnswers: ["mary plays every day"] },
    { incorrect: "WHAT DO SHE DOES?", translationHint: "(QUE HACE ELLA?)", correctAnswers: ["what does she do?"] },
    { incorrect: "WHERE DOES HE GOUS?", translationHint: "(¿DONDE VA EL?)", correctAnswers: ["where does he go?"] },
    { incorrect: "WHY DOES YOU WORKS IN THE NIGTH?", translationHint: "", correctAnswers: ["why do you work at night?"] },
    { incorrect: "SHE STUDYS ITALIANO END ESPANISH.", translationHint: "(ELLA ESTUDIA ITALIANO Y ESPAÑOL)", correctAnswers: ["she studies italian and spanish"] },
    { incorrect: "THEY DON’T ARE OUR TEACHERS", translationHint: "(ELLOS NO SON NUESTROS PROFESORES)", correctAnswers: ["they are not our teachers", "they aren't our teachers"] },
    { incorrect: "DO YOU WORK ARE IN JON COMPANY?", translationHint: "(¿TRABAJAS EN LA EMPRESA DE JON?)", correctAnswers: ["do you work in jon's company?"] }
];

const class5Exercise2Data: ExercisePrompt[] = [
    {
        spanish: "EL BEBE LECHE",
        answers: {
            affirmative: ["he drinks milk"],
            negative: ["he does not drink milk", "he doesn't drink milk"],
            interrogative: ["does he drink milk?"],
        }
    },
    {
        spanish: "EL JUEGA FUTBOL CON SU HERMANO",
        answers: {
            affirmative: ["he plays soccer with his brother", "he plays football with his brother"],
            negative: ["he does not play soccer with his brother", "he doesn't play soccer with his brother", "he does not play football with his brother", "he doesn't play football with his brother"],
            interrogative: ["does he play soccer with his brother?", "does he play football with his brother?"],
        }
    },
    {
        spanish: "YO NADO LOS DOMINGOS",
        answers: {
            affirmative: ["i swim on sundays"],
            negative: ["i do not swim on sundays", "i don't swim on sundays"],
            interrogative: ["do i swim on sundays?"],
        }
    },
    {
        spanish: "TU TRABAJAS LOS SABADOS",
        answers: {
            affirmative: ["you work on saturdays"],
            negative: ["you do not work on saturdays", "you don't work on saturdays"],
            interrogative: ["do you work on saturdays?"],
        }
    },
    {
        spanish: "ELLA VE PELICULAS CON SU FAMILIA",
        answers: {
            affirmative: ["she watches movies with her family"],
            negative: ["she does not watch movies with her family", "she doesn't watch movies with her family"],
            interrogative: ["does she watch movies with her family?"],
        }
    },
    {
        spanish: "EL COME PIZZA CON SU NOVIA",
        answers: {
            affirmative: ["he eats pizza with his girlfriend"],
            negative: ["he does not eat pizza with his girlfriend", "he doesn't eat pizza with his girlfriend"],
            interrogative: ["does he eat pizza with his girlfriend?"],
        }
    },
    {
        spanish: "YO ESTUDIO INGLES DURANTE LA SEMANA",
        answers: {
            affirmative: ["i study english during the week"],
            negative: ["i do not study english during the week", "i don't study english during the week"],
            interrogative: ["do i study english during the week?"],
        }
    },
    {
        spanish: "A ELLA LE GUSTA VIAJAR",
        answers: {
            affirmative: ["she likes to travel"],
            negative: ["she does not like to travel", "she doesn't like to travel"],
            interrogative: ["does she like to travel?"],
        }
    },
    {
        spanish: "NOSOTROS COMPRAMOS UNA CASA",
        answers: {
            affirmative: ["we buy a house"],
            negative: ["we do not buy a house", "we don't buy a house"],
            interrogative: ["do we buy a house?"],
        }
    },
    {
        spanish: "ELLA COCINA PASTA",
        answers: {
            affirmative: ["she cooks pasta"],
            negative: ["she does not cook pasta", "she doesn't cook pasta"],
            interrogative: ["does she cook pasta?"],
        }
    },
    {
        spanish: "ELLOS SON TUS PRIMOS",
        answers: {
            affirmative: ["they are your cousins"],
            negative: ["they are not your cousins", "they aren't your cousins"],
            interrogative: ["are they your cousins?"],
        }
    },
    {
        spanish: "NOSOTROS VAMOS A LA ESCUELA",
        answers: {
            affirmative: ["we go to school"],
            negative: ["we do not go to school", "we don't go to school"],
            interrogative: ["do we go to school?"],
        }
    },
    {
        spanish: "ELLA ES SU ESPOSA (de él)",
        answers: {
            affirmative: ["she is his wife"],
            negative: ["she is not his wife", "she isn't his wife"],
            interrogative: ["is she his wife?"],
        }
    },
    {
        spanish: "ELLOS TRABAJAN EN LA MAÑANA",
        answers: {
            affirmative: ["they work in the morning"],
            negative: ["they do not work in the morning", "they don't work in the morning"],
            interrogative: ["do they work in the morning?"],
        }
    }
];

export default function EngA1Class5Page() {
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

    // State for vocabulary exercise
    const [vocabAnswers, setVocabAnswers] = useState<{[key: string]: string[]}>({});
    const [vocabValidation, setVocabValidation] = useState<{[key: string]: ('correct' | 'incorrect' | 'unchecked')[]}>({});
    const [canAdvance, setCanAdvance] = useState(false);


    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'nota-importante', name: 'Nota Importante', icon: Info, status: 'locked' },
        { key: 'ejercicio-1', name: 'Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'ejercicio-2', name: 'Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'ejercicio-3', name: 'Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'ejercicio-vocabulario', name: 'Ejercicio Vocabulario', icon: PenSquare, status: 'locked' },
        { key: 'ejercicio-4', name: 'Ejercicio 4', icon: PenSquare, status: 'locked' },
    ], []);
    
    useEffect(() => {
        if (isProfileLoading || isUserLoading) return;
        const newPath = initialLearningPath.map(topic => ({
            ...topic,
            status: isAdmin ? 'completed' : topic.status,
        }));
        
        if (studentProfile?.lessonProgress?.[progressStorageVersion] && !isAdmin) {
            const savedStatuses = studentProfile.lessonProgress[progressStorageVersion];
            newPath.forEach(item => {
                if (savedStatuses[item.key]) item.status = savedStatuses[item.key];
            });
        }
        
        setLearningPath(newPath);

        const firstActive = newPath.find(p => p.status === 'active');
        if (firstActive) {
            setSelectedTopic(firstActive.key);
        } else if (newPath.length > 0) {
            setSelectedTopic(newPath[0].key);
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
        setCanAdvance(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading]);
    
    const progress = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedTopics = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedTopics / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (isProfileLoading || isUserLoading) return;
        if (!isAdmin && studentDocRef && learningPath.length > 0) {
            const statusesToSave: Record<string, any> = {};
            learningPath.forEach(item => {
                statusesToSave[item.key] = item.status;
            });
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: statusesToSave });
            updateDocumentNonBlocking(studentDocRef, { [`progress.${mainProgressKey}`]: Math.round(progress) });
        }
        if (progress >= 100) {
          window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
    }, [learningPath, isAdmin, progress, studentDocRef, isProfileLoading, isUserLoading]);

    useEffect(() => {
        if (!topicToComplete) return;
    
        setLearningPath(currentPath => {
            const newPath = [...currentPath];
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

    const handleTopicComplete = (completedKey: string) => {
        setTopicToComplete(completedKey);
    };

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        
        if (!isAdmin && topic?.status === 'locked') {
            toast({ variant: "destructive", title: "Contenido Bloqueado" });
            return;
        }
        setSelectedTopic(topicKey);

        const exerciseKeys = ['vocabulary', 'ejercicio-1', 'ejercicio-2', 'ejercicio-3', 'ejercicio-vocabulario', 'ejercicio-4'];
        if (!exerciseKeys.includes(topicKey)) {
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
        setCanAdvance(false);
    };

    const handleCheckVocab = () => {
        let atLeastOneCorrect = false;
        const newValidationStatus: { [key: string]: ('correct' | 'incorrect' | 'unchecked')[] } = {};

        Object.keys(vocabularyData).forEach(category => {
            const cat = category as keyof typeof vocabularyData;
            newValidationStatus[cat] = vocabularyData[cat].map((item, index) => {
                const userAnswer = (vocabAnswers[cat]?.[index] || '').trim().toLowerCase();
                const isCorrect = item.english.toLowerCase() === userAnswer;
                if (isCorrect) {
                    atLeastOneCorrect = true;
                }
                return isCorrect ? 'correct' : 'incorrect';
            });
        });

        setValidationStatus(newValidationStatus);

        if (atLeastOneCorrect) {
            toast({ title: "¡Bien hecho!", description: "Has acertado al menos una. ¡Ya puedes avanzar!" });
            setCanAdvance(true);
        } else {
            toast({
                variant: 'destructive',
                title: "Sigue intentando",
                description: "Revisa tus respuestas. ¡Necesitas al menos una correcta para continuar!",
            });
            setCanAdvance(false);
        }
    };
    
    const getVocabInputClass = (category: string, index: number) => {
        const status = vocabValidation[category as keyof typeof vocabValidation]?.[index];
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive';
        return '';
    };
    
    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic);

        if (selectedTopic === 'vocabulary') {
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>Vocabulario</CardTitle>
                        <CardDescription>Escribe la traducción correcta en inglés para cada palabra.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="multiple" defaultValue={['verbos', 'adjetivos']} className="w-full">
                            <AccordionItem value="verbos">
                                <AccordionTrigger className="text-lg font-semibold">Verbos</AccordionTrigger>
                                <AccordionContent>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                        <div className="font-bold p-3 bg-muted rounded-lg text-left">Español</div>
                                        <div className="font-bold p-3 bg-muted rounded-lg text-left">Inglés</div>
                                        {vocabularyData.verbos.map((word, index) => (
                                            <React.Fragment key={`verbo-${index}`}>
                                                <div className="p-3 bg-card border rounded-lg flex items-center">{word.spanish}</div>
                                                <div className="p-3 bg-card border rounded-lg flex items-center">
                                                     <Input
                                                        value={vocabAnswers.verbos?.[index] || ''}
                                                        onChange={(e) => handleVocabInputChange('verbos', index, e.target.value)}
                                                        className={cn(getVocabInputClass('verbos', index))}
                                                        autoComplete="off"
                                                    />
                                                </div>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="adjetivos">
                                <AccordionTrigger className="text-lg font-semibold">Adjetivos Básicos</AccordionTrigger>
                                <AccordionContent>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                        <div className="font-bold p-3 bg-muted rounded-lg text-left">Español</div>
                                        <div className="font-bold p-3 bg-muted rounded-lg text-left">Inglés</div>
                                        {vocabularyData.adjetivos.map((word, index) => (
                                            <React.Fragment key={`adj-${index}`}>
                                                <div className="p-3 bg-card border rounded-lg flex items-center">{word.spanish}</div>
                                                <div className="p-3 bg-card border rounded-lg flex items-center">
                                                    <Input
                                                        value={vocabAnswers.adjetivos?.[index] || ''}
                                                        onChange={(e) => handleVocabInputChange('adjetivos', index, e.target.value)}
                                                        className={cn(getVocabInputClass('adjetivos', index))}
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
                    <CardFooter className="flex justify-between">
                       <Button onClick={handleCheckVocab}>
                           Verificar
                       </Button>
                       <Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvance}>
                           Avanzar
                       </Button>
                   </CardFooter>
                </Card>
            );
        }
        
        if (selectedTopic === 'nota-importante') {
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>Notas Importantes</CardTitle>
                        <CardDescription>Reglas y tips para recordar.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="multiple" className="w-full" defaultValue={['item-1']}>
                            <AccordionItem value="item-1">
                                <AccordionTrigger>1. Dos verbos juntos</AccordionTrigger>
                                <AccordionContent>
                                    <p>Cuando tenemos dos verbos juntos, en la mitad se agrega "TO".</p>
                                </AccordionContent>
                            </AccordionItem>
        
                            <AccordionItem value="item-2">
                                <AccordionTrigger>2. Verbo "GO"</AccordionTrigger>
                                <AccordionContent>
                                    <p className="font-mono">go to the + lugar especifico</p>
                                    <p className="font-mono">go + cuando no tenemos un lugar</p>
                                </AccordionContent>
                            </AccordionItem>
        
                            <AccordionItem value="item-3">
                                <AccordionTrigger>3. NUNCA PERO NUNCA</AccordionTrigger>
                                <AccordionContent>
                                    <p>Una frase tiene verbo TO BE y DO/DOES.</p>
                                </AccordionContent>
                            </AccordionItem>
        
                            <AccordionItem value="item-4">
                                <AccordionTrigger>4. Genitivo Sajón</AccordionTrigger>
                                <AccordionContent>
                                    <p>Nunca tiene el artículo "THE" adelante de él.</p>
                                    <div className="mt-2 p-3 bg-muted rounded-lg font-mono text-sm">
                                        <p>la casa de maria</p>
                                        <p className="text-green-600">Maria's house</p>
                                        <p className="text-red-600">the Maria's house (incorrecto)</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            
                            <AccordionItem value="item-5">
                                <AccordionTrigger>5. Preposiciones Comunes</AccordionTrigger>
                                <AccordionContent>
                                   <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <h4 className="font-bold">IN</h4>
                                            <ul className="list-disc list-inside text-sm">
                                                <li>in the morning</li>
                                                <li>in the afternoon</li>
                                                <li>in + months</li>
                                            </ul>
                                        </div>
                                       <div>
                                            <h4 className="font-bold">AT</h4>
                                             <ul className="list-disc list-inside text-sm">
                                                <li>at night</li>
                                                <li>at work</li>
                                                <li>at school</li>
                                                <li>at university</li>
                                                <li>at home</li>
                                            </ul>
                                       </div>
                                       <div>
                                            <h4 className="font-bold">ON</h4>
                                             <ul className="list-disc list-inside text-sm">
                                                <li>on + dias de la semana</li>
                                                <li>on weekend</li>
                                                <li>on + month + day</li>
                                            </ul>
                                       </div>
                                   </div>
                                </AccordionContent>
                            </AccordionItem>
        
                            <AccordionItem value="item-6">
                                <AccordionTrigger>6. Diferencias entre TÚ y TU</AccordionTrigger>
                                <AccordionContent>
                                    <h4 className="font-bold">TÚ = PRONOUN</h4>
                                    <p className="font-mono">PRONOUN = TÚ + VERB</p>
                                    <div className="mt-2 p-3 bg-muted rounded-lg font-mono text-sm">
                                        <p>tú eres = you are</p>
                                        <p>tú estás = you are</p>
                                        <p>tú vives = you live</p>
                                    </div>
        
                                     <h4 className="font-bold mt-4">TU = POSSESSIVE</h4>
                                    <p className="font-mono">POSSESSIVE = TU + NOUN</p>
                                     <div className="mt-2 p-3 bg-muted rounded-lg font-mono text-sm">
                                        <p>tu casa = your house</p>
                                        <p>tu celular = your cellphone</p>
                                        <p>tu perro = your dog</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
        
                            <AccordionItem value="item-7">
                                <AccordionTrigger>7. Explanation: Desde</AccordionTrigger>
                                <AccordionContent>
                                    <h4 className="font-bold">Since: Años</h4>
                                    <p>Es un tiempo específico en el pasado hasta ahora.</p>
                                    <div className="mt-2 p-3 bg-muted rounded-lg font-mono text-sm">
                                        <p>yo trabajo en esa empresa desde 2022</p>
                                        <p>i work in that company since 2022</p>
                                    </div>
                                    <h4 className="font-bold mt-4">From .... To /Until: Rango de tiempo</h4>
                                    <div className="mt-2 p-3 bg-muted rounded-lg font-mono text-sm">
                                        <p>yo trabajo desde las 8 a.m hasta las 7 p.m</p>
                                        <p>i work from 8 a.m until 7 p.m</p>
                                        <br/>
                                        <p>yo trabajo de 8 a.m a 7 p.m</p>
                                        <p>i work from 8 a.m to 7 p.m</p>
                                    </div>
                                     <h4 className="font-bold mt-4">de: from: Origen de una persona</h4>
                                    <div className="mt-2 p-3 bg-muted rounded-lg font-mono text-sm">
                                        <p>i am from Colombia</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
        
                            <AccordionItem value="item-8">
                                <AccordionTrigger>8. Adjectives: -ED vs -ING</AccordionTrigger>
                                <AccordionContent>
                                     <h4 className="font-bold">ED = Bored</h4>
                                    <p>la persona lo siente desde adentro. (sentimientos, emociones)</p>
                                    <div className="mt-2 p-3 bg-muted rounded-lg font-mono text-sm">
                                        <p>yo estoy aburrida : i'm bored</p>
                                        <p>él está aburrido : he's bored</p>
                                    </div>
                                     <h4 className="font-bold mt-4">ING = Boring</h4>
                                    <p>caracteristicas de un sustantivo.</p>
                                     <div className="mt-2 p-3 bg-muted rounded-lg font-mono text-sm">
                                        <p>él es aburridor : he's boring</p>
                                        <br/>
                                        <p>esa pelicula es aburridora, no me gusta</p>
                                        <p>that movie is boring, i don't like it</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            
                            <AccordionItem value="item-9">
                                <AccordionTrigger>9. Futuro en Ingles (WILL)</AccordionTrigger>
                                <AccordionContent>
                                    <div className="mt-2 p-3 bg-muted rounded-lg font-mono text-sm">
                                        <p>yo llamaré</p>
                                        <p>i will call you</p>
                                        <br/>
                                        <p>yo trabajaré el fin de semana</p>
                                        <p>i will work on weekend</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
        
                        </Accordion>
                    </CardContent>
                </Card>
            );
        }
        
        if (selectedTopic === 'ejercicio-1') {
            return (
                <ErrorCorrectionExercise
                    exerciseData={exercise1Data}
                    onComplete={() => handleTopicComplete('ejercicio-1')}
                    title="Ejercicio 1: Encuentra el error"
                />
            );
        }

        if (selectedTopic === 'ejercicio-2') {
            return (
                <PresentSimpleExercise
                    exerciseData={class5Exercise2Data}
                    onComplete={() => handleTopicComplete('ejercicio-2')}
                    title="Ejercicio 2: Transforma"
                    showShortAnswers={false}
                />
            );
        }

        if (selectedTopic === 'ejercicio-3') {
             return (
                 <SimpleTranslationExercise
                    course="a1"
                    exerciseKey="c5_mixed3" 
                    onComplete={() => handleTopicComplete('ejercicio-3')}
                    title="Ejercicio 3: Adjetivos Posesivos"
                />
            );
        }

        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple min-h-[500px]">
              <CardHeader>
                <CardTitle>{topic?.name || 'Cargando...'}</CardTitle>
                <CardDescription>Contenido para este tema estará disponible pronto.</CardDescription>
              </CardHeader>
              <CardContent>
                {topic && topic.key.startsWith('ejercicio') && (
                    <Button onClick={() => handleTopicComplete(topic.key)}>
                        Completar Ejercicio (placeholder)
                    </Button>
                )}
              </CardContent>
            </Card>
        );
    };

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <Link href="/ingles/a1/unit/1" className="hover:underline text-sm text-muted-foreground">Volver a la unidad 1</Link>
                        <h1 className="text-4xl font-bold dark:text-primary">Clase 5</h1>
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
                                                const Icon = item.status === 'completed' ? CheckCircle : (item.status === 'active' ? item.icon : Lock);
                                                return (
                                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                                        className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer',
                                                            item.status === 'locked' && !isAdmin ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted',
                                                            selectedTopic === item.key && 'bg-muted text-primary font-semibold'
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
                                        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2"><span>Progreso</span><span className="font-bold text-foreground">{Math.round(progress)}%</span></div>
                                        <Progress value={progress} className="h-2" />
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
