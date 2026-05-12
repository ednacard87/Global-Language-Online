'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle, Info, Loader2, Plus, Minus, Star } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from '@/components/ui/separator';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
};

const ICONS = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const progressStorageVersion = 'progress_a1_eng_unit_2_class_7_v5_ex3';
const mainProgressKey = 'progress_a1_eng_unit_2_class_7';

const vocabularyData = [
    { spanish: 'VOLVERSE, LLEGAR A SER', english: 'TO BECOME' },
    { spanish: 'COMENZAR', english: 'TO BEGIN' },
    { spanish: 'ROMPER', english: 'TO BREAK' },
    { spanish: 'TRAER, LLEVAR', english: 'TO BRING' },
    { spanish: 'CONSTRUIR', english: 'TO BUILD' },
    { spanish: 'COMPRAR', english: 'TO BUY' },
    { spanish: 'VENIR', english: 'TO COME' },
    { spanish: 'COSTAR', english: 'TO COST' },
    { spanish: 'CORTAR', english: 'TO CUT' },
    { spanish: 'HACER', english: 'TO DO' },
    { spanish: 'DIBUJAR', english: 'TO DRAW' },
    { spanish: 'BEBER', english: 'TO DRINK' },
    { spanish: 'MANEJAR', english: 'TO DRIVE' },
    { spanish: 'COMER', english: 'TO EAT' },
];

export default function EngA1Class7Page() {
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

    // Vocab State
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(vocabularyData.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(vocabularyData.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary (Basic Verbs)', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: 'Grammar', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'grammar2', name: 'Grammar 2', icon: GraduationCap, status: 'locked' },
        { key: 'ex2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'ex3', name: 'Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'grammar3', name: 'Grammar 3', icon: GraduationCap, status: 'locked' },
        { key: 'ex4', name: 'Exercise 4', icon: PenSquare, status: 'locked' },
        { key: 'ex5', name: 'Exercise 5', icon: PenSquare, status: 'locked' },
        { key: 'ex6', name: 'Exercise 6', icon: PenSquare, status: 'locked' },
        { key: 'ex7', name: 'Exercise 7', icon: PenSquare, status: 'locked' },
        { key: 'ex8', name: 'Exercise 8', icon: PenSquare, status: 'locked' },
        { key: 'ex9', name: 'Exercise 9', icon: PenSquare, status: 'locked' },
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
            updateDocumentNonBlocking(studentDocRef, { 
                [`lessonProgress.${progressStorageVersion}`]: statusesToSave,
                [`progress.${mainProgressKey}`]: Math.round(progress)
            });
        }
        if (progress >= 100) {
          window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
    }, [learningPath, isAdmin, progress, studentDocRef, isProfileLoading, isUserLoading]);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

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

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        
        if (!isAdmin && topic?.status === 'locked') {
            toast({ variant: "destructive", title: "Contenido Bloqueado", description: "Debes completar los temas anteriores." });
            return;
        }
        setSelectedTopic(topicKey);

        const viewOnlyTopics = ['grammar', 'grammar2', 'grammar3'];
        if (viewOnlyTopics.includes(topicKey)) {
            handleTopicComplete(topicKey);
        }
    };

    const handleVocabInputChange = (index: number, value: string) => {
        const newAnswers = [...vocabAnswers];
        newAnswers[index] = value;
        setVocabAnswers(newAnswers);

        const newValidation = [...vocabValidation];
        if (newValidation[index] !== 'unchecked') {
            newValidation[index] = 'unchecked';
            setValidationStatus(newValidation);
        }
        setCanAdvanceVocab(false);
    };

    const handleCheckVocab = () => {
        let atLeastOneCorrect = false;
        const newValidation = vocabularyData.map((item, index) => {
            const userAnswer = vocabAnswers[index]?.trim().toUpperCase();
            const isCorrect = userAnswer === item.english.toUpperCase();
            if (isCorrect) {
                atLeastOneCorrect = true;
            }
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabValidation(newValidation as ('correct' | 'incorrect' | 'unchecked')[]);

        if (atLeastOneCorrect) {
            toast({ title: "¡Bien hecho!", description: "Has acertado al menos una. ¡Ya puedes avanzar!" });
            setCanAdvanceVocab(true);
        } else {
            toast({ 
                variant: "destructive", 
                title: "Sigue intentando", 
                description: "Revisa tus respuestas. ¡Necesitas al menos una correcta para continuar!" 
            });
            setCanAdvanceVocab(false);
        }
    };

    const getVocabInputClass = (index: number) => {
        const status = vocabValidation[index];
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500 bg-green-50 dark:bg-green-900/10';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive bg-destructive/5';
        return '';
    };
    
    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic);

        if (selectedTopic === 'vocabulary') {
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>Vocabulary: Basic Verbs</CardTitle>
                        <CardDescription>Traduce los verbos al inglés (usa "TO" + verbo, ej: TO EAT).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                            <div className="font-bold p-3 bg-muted rounded-lg text-left">Español</div>
                            <div className="font-bold p-3 bg-muted rounded-lg text-left">Inglés</div>
                            {vocabularyData.map((item, index) => (
                                <React.Fragment key={index}>
                                    <div className="p-3 bg-card border rounded-lg flex items-center">{item.spanish}</div>
                                    <div className="p-3 bg-card border rounded-lg flex items-center">
                                        <Input
                                            value={vocabAnswers[index] || ''}
                                            onChange={e => handleVocabInputChange(index, e.target.value)}
                                            className={cn(getVocabInputClass(index))}
                                            placeholder="TO..."
                                            autoComplete="off"
                                        />
                                    </div>
                                </React.Fragment>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center border-t pt-6">
                        <Button onClick={handleCheckVocab}>Verificar Vocabulario</Button>
                        <Button 
                            onClick={() => handleTopicComplete('vocabulary')} 
                            disabled={!canAdvanceVocab && !isAdmin}
                        >
                            Avanzar
                        </Button>
                    </CardFooter>
                </Card>
            );
        }

        if (selectedTopic === 'grammar') {
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>EL ARTÍCULO DETERMINADO "THE"</CardTitle>
                        <CardDescription>THE DEFINITE ARTICLE "THE"</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-lg">En inglés hay un artículo que corresponde a los siguientes artículos en castellano:</p>
                        
                        <Accordion type="multiple" className="w-full" defaultValue={['item-1', 'item-2', 'item-3', 'item-4']}>
                            <AccordionItem value="item-1">
                                <AccordionTrigger className="text-lg font-bold">1. SIGNIFICADO</AccordionTrigger>
                                <AccordionContent className="space-y-4">
                                    <p className="text-base font-semibold">THE = "EL", "LA", "LOS", "LAS"</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-muted rounded-lg space-y-2">
                                            <h4 className="font-bold border-b pb-1">MASCULINO / SINGULAR</h4>
                                            <p className="font-mono">THE BOY (EL NIÑO)</p>
                                            <p className="font-mono">THE BOOK (EL LIBRO)</p>
                                        </div>
                                        <div className="p-4 bg-muted rounded-lg space-y-2">
                                            <h4 className="font-bold border-b pb-1">FEMENINO / SINGULAR</h4>
                                            <p className="font-mono">THE GIRL (LA NIÑA)</p>
                                            <p className="font-mono">THE TABLE (LA MESA)</p>
                                        </div>
                                        <div className="p-4 bg-muted rounded-lg space-y-2">
                                            <h4 className="font-bold border-b pb-1">MASCULINO / PLURAL</h4>
                                            <p className="font-mono">THE BOYS (LOS NIÑOS)</p>
                                            <p className="font-mono">THE BOOKS (LOS LIBROS)</p>
                                        </div>
                                        <div className="p-4 bg-muted rounded-lg space-y-2">
                                            <h4 className="font-bold border-b pb-1">FEMENINO / PLURAL</h4>
                                            <p className="font-mono">THE GIRLS (LAS NIÑAS)</p>
                                            <p className="font-mono">THE TABLES (LAS MESAS)</p>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-2">
                                <AccordionTrigger className="text-lg font-bold">2. PRONUNCIACIÓN</AccordionTrigger>
                                <AccordionContent className="space-y-4">
                                    <div className="space-y-2 text-base">
                                        <p><strong>a)</strong> Precedida de <strong>consonante</strong> se pronuncia <span className="font-bold text-primary">"DE"</span>:</p>
                                        <p className="font-mono ml-4">THE LAMP, LA LÁMPARA (DE LAMP)</p>
                                        
                                        <p className="pt-2"><strong>b)</strong> Precedida de <strong>vocal</strong> se pronuncia <span className="font-bold text-primary">"DI"</span>:</p>
                                        <p className="font-mono ml-4">THE ENEMY, EL ENEMIGO (DI ENEMI)</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-3">
                                <AccordionTrigger className="text-lg font-bold">3. USO PRINCIPAL DEL ARTÍCULO "THE"</AccordionTrigger>
                                <AccordionContent className="space-y-4">
                                    <p className="text-base">El artículo <span className="font-bold">"THE"</span> se pone cuando se habla de <span className="italic underline">algo en particular o específico</span>:</p>
                                    <div className="space-y-3 p-4 bg-muted rounded-lg">
                                        <p className="font-mono text-sm">1. WHAT IS THE NAME OF THE RESTAURANT? (¿CUÁL ES EL NOMBRE DEL RESTAURANTE?)</p>
                                        <p className="font-mono text-sm">2. DO YOU REMEMBER THE DAY WHEN WE WENT TO WASHINGTON? (¿RECUERDAS EL DÍA CUANDO FUIMOS A WASHINGTON?)</p>
                                        <p className="font-mono text-sm">3. THE DOCTOR IS VERY GOOD (EL DOCTOR ES MUY BUENO)</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-4">
                                <AccordionTrigger className="text-lg font-bold">4. CUÁNDO NO SE PONE "THE"</AccordionTrigger>
                                <AccordionContent className="space-y-4">
                                    <p className="text-base font-semibold text-destructive">EL ARTÍCULO "THE" NO SE PONE CUANDO SE HABLA EN GENERAL / SE GENERALIZA:</p>
                                    <div className="space-y-3 p-4 bg-muted rounded-lg">
                                        <p className="font-mono text-sm">1. I LIKE FOOTBALL (ME GUSTA EL FÚTBOL)</p>
                                        <p className="font-mono text-sm">2. SHE LOVES MUSIC (A ELLA LE GUSTA LA MÚSICA)</p>
                                        <p className="font-mono text-sm">3. PEOPLE ARE STRANGE (LAS PERSONAS SON RARAS)</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                    <CardFooter className="justify-center pt-6 border-t">
                        <Button onClick={() => handleTopicComplete('grammar')}>He terminado de estudiar</Button>
                    </CardFooter>
                </Card>
            );
        }

        if (selectedTopic === 'ex1') {
            return (
                <SimpleTranslationExercise 
                    exerciseKey="c7_ex1" 
                    course="a1" 
                    onComplete={() => handleTopicComplete('ex1')} 
                    title="Exercise 1"
                />
            );
        }

        if (selectedTopic === 'grammar2') {
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>INDEFINITE ARTICLES "A - AN"</CardTitle>
                        <CardDescription>Uso de los artículos indefinidos en inglés.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-primary/10 p-6 rounded-xl border-l-4 border-primary">
                            <h3 className="text-2xl font-bold text-primary">A - AN = un / una</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <Card className="bg-muted/50 border-2 border-dashed">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">A + Consonante</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="font-mono text-xl font-bold">A car</p>
                                    <p className="text-sm text-muted-foreground">(Un carro)</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-muted/50 border-2 border-dashed">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">An + Vocal</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="font-mono text-xl font-bold">An elevator</p>
                                    <p className="text-sm text-muted-foreground">(Un elevador)</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-primary">USO PRINCIPAL</h3>
                            <p className="text-lg leading-relaxed">
                                Son utilizados para referirnos a algo o alguien en: <span className="font-bold underline">SINGULAR</span>.
                            </p>
                            <p className="text-sm text-muted-foreground italic">
                                * Nota: No puedes usar "A/AN" con palabras en plural (ej: no se dice "a cars").
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-center pt-6 border-t">
                        <Button onClick={() => handleTopicComplete('grammar2')}>Continuar</Button>
                    </CardFooter>
                </Card>
            );
        }

        if (selectedTopic === 'ex2') {
            return (
                <SimpleTranslationExercise 
                    exerciseKey="c7_ex2" 
                    course="a1" 
                    onComplete={() => handleTopicComplete('ex2')} 
                    title="Exercise 2"
                />
            );
        }

        if (selectedTopic === 'ex3') {
            return (
                <SimpleTranslationExercise 
                    exerciseKey="c7_ex3" 
                    course="a1" 
                    onComplete={() => handleTopicComplete('ex3')} 
                    title="Exercise 3"
                />
            );
        }

        if (selectedTopic === 'grammar3') {
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>LIKES AND DISLIKES (VERBOS DE PREFERENCIA)</CardTitle>
                        <CardDescription>Expresa lo que te gusta y lo que no te gusta.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <h4 className="flex items-center gap-2 font-bold text-green-600 text-xl">
                                    <Plus className="h-6 w-6" /> Positivos
                                </h4>
                                <div className="space-y-2 p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200">
                                    <p><strong>Love :</strong> Encantar</p>
                                    <p><strong>Like :</strong> Gustar</p>
                                    <p><strong>Enjoy :</strong> Disfrutar</p>
                                    <p><strong>Prefer :</strong> Preferir</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h4 className="flex items-center gap-2 font-bold text-red-600 text-xl">
                                    <Minus className="h-6 w-6" /> Negativos
                                </h4>
                                <div className="space-y-2 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200">
                                    <p><strong>Dislike :</strong> No gustar</p>
                                    <p><strong>Hate :</strong> Odiar</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                            <h4 className="font-bold flex items-center gap-2 mb-2 uppercase">
                                <Star className="h-4 w-4 text-primary" /> NOTICA: Intensidad
                            </h4>
                            <p className="text-muted-foreground italic mb-2">"De verdad me gusta / Realmente me gusta / Me gusta muchísimo"</p>
                            <div className="p-3 bg-muted rounded font-mono text-lg font-bold">
                                <p>I <span className="text-primary underline">really</span> like water.</p>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-6">
                            <h3 className="text-2xl font-bold text-primary">USOS</h3>
                            <p className="text-muted-foreground">Estos verbos se utilizan para expresar preferencias de cosas o actividades:</p>
                            
                            <Accordion type="multiple" className="w-full" defaultValue={['nouns', 'verbs', 'prefer']}>
                                <AccordionItem value="nouns">
                                    <AccordionTrigger className="text-lg font-bold">1. CON SUSTANTIVOS (NOUNS)</AccordionTrigger>
                                    <AccordionContent className="space-y-3 pt-2">
                                        <div className="grid gap-2 font-mono bg-muted p-4 rounded-lg">
                                            <p>I <span className="font-bold">like</span> movies.</p>
                                            <p>I <span className="font-bold text-red-500">don't like</span> hamburgers.</p>
                                            <p>She <span className="font-bold text-red-500">doesn't like</span> garlic.</p>
                                            <p>He <span className="font-bold text-red-600">hates</span> series.</p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="verbs">
                                    <AccordionTrigger className="text-lg font-bold">2. CON OTROS VERBOS (ACCIONES)</AccordionTrigger>
                                    <AccordionContent className="space-y-4 pt-2">
                                        <p>Cuando usamos un verbo de preferencia seguido de otra acción, tenemos <strong>dos opciones con el mismo significado</strong>:</p>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="p-4 bg-muted rounded-lg border">
                                                <h5 className="font-bold mb-2">a) Con "TO" (Infinitivo)</h5>
                                                <p className="font-mono">I like <span className="text-primary font-bold">to cook</span> pasta.</p>
                                            </div>
                                            <div className="p-4 bg-muted rounded-lg border">
                                                <h5 className="font-bold mb-2">b) Con "-ING" (Gerundio)</h5>
                                                <p className="font-mono">I like <span className="text-primary font-bold">cooking</span> pasta.</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-brand-lilac/50 border rounded-lg italic text-sm">
                                            <p>Ejemplos adicionales:</p>
                                            <ul className="list-disc list-inside mt-1">
                                                <li>You love walking at night. / You love to walk at night.</li>
                                                <li>She likes reading books. / She likes to read books.</li>
                                            </ul>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="prefer">
                                    <AccordionTrigger className="text-lg font-bold">3. EL USO DE "PREFER"</AccordionTrigger>
                                    <AccordionContent className="space-y-6 pt-2">
                                        <div>
                                            <h5 className="font-bold text-primary mb-1">A) PARA COMPARAR SUSTANTIVOS (OBJETOS)</h5>
                                            <p className="text-sm font-mono bg-muted p-2 rounded mb-2">Pronoun + prefer + NOUN + <span className="text-primary font-bold">TO</span> + NOUN</p>
                                            <p className="italic">"Yo prefiero la pizza a la hamburguesa"</p>
                                            <p className="font-mono font-bold">I prefer pizza <span className="text-primary">to</span> hamburger.</p>
                                        </div>
                                        
                                        <div>
                                            <h5 className="font-bold text-primary mb-1">B) PARA COMPARAR VERBOS (ACTIVIDADES)</h5>
                                            <p className="text-sm font-mono bg-muted p-2 rounded mb-2">Pronoun + prefer + verb-ING + <span className="text-primary font-bold">TO</span> + verb-ING</p>
                                            <p className="italic">"Yo prefiero ir a la playa que quedarme en la piscina"</p>
                                            <p className="font-mono font-bold">I prefer going to the beach <span className="text-primary">to</span> staying at the pool.</p>
                                        </div>

                                        <div className="p-4 border-l-4 border-primary bg-primary/5 rounded-r-lg">
                                            <p className="font-bold">Recuerda:</p>
                                            <p>Debemos colocar el verbo <span className="font-bold italic">prefer</span> seguido de otro verbo acabado en <strong>-ing</strong>.</p>
                                            <p className="font-mono mt-1">I prefer playing tennis.</p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-center border-t pt-6">
                        <Button onClick={() => handleTopicComplete('grammar3')}>He terminado de estudiar preferencias</Button>
                    </CardFooter>
                </Card>
            );
        }

        if (selectedTopic?.startsWith('ex')) {
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple min-h-[400px]">
                    <CardHeader>
                        <CardTitle>{topic?.name}</CardTitle>
                        <CardDescription>Práctica interactiva.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center p-12">
                        <p className="text-muted-foreground text-center mb-8">El ejercicio interactivo para {topic?.name} estará disponible pronto.</p>
                        <Button onClick={() => handleTopicComplete(selectedTopic)}>
                            Simular Completado
                        </Button>
                    </CardContent>
                </Card>
            );
        }

        return null;
    };

    if (isUserLoading || isProfileLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <Link href="/ingles/a1" className="hover:underline text-sm text-muted-foreground">Volver al curso A1</Link>
                        <h1 className="text-4xl font-bold text-white dark:text-primary [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase 7</h1>
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
