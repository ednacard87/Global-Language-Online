'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle, Gamepad2, Feather, FileText, Bot } from 'lucide-react';
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
};

const progressStorageKey = 'progress_kids_a1_comparatives_v1';
const mainProgressKey = 'progress_kids_a1_comparatives';

// New vocabulary data
const vocabularyData = [
    { spanish: 'BONITO/A', english: ['pretty', 'beautiful'] },
    { spanish: 'ANCHO', english: ['wide'] },
    { spanish: 'DESPIERTO', english: ['awake'] },
    { spanish: 'DIFERENTE', english: ['different'] },
    { spanish: 'LARGO', english: ['long'] },
    { spanish: 'SECO', english: ['dry'] },
    { spanish: 'ENOJADO', english: ['angry'] },
    { spanish: 'CANSADO', english: ['tired'] },
    { spanish: 'BRILLANTE', english: ['bright'] },
    { spanish: 'SUCIO', english: ['dirty'] },
    { spanish: 'LIMPIO', english: ['clean'] },
    { spanish: 'MOJADO', english: ['wet'] },
];

export default function ComparativosSuperlativosPage() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);

    // State for the new exercise
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(vocabularyData.length).fill(''));
    const [validationStatus, setValidationStatus] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(vocabularyData.length).fill('unchecked'));
    const [canAdvanceFromVocab, setCanAdvanceFromVocab] = useState(false);

    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string; lessonProgress?: any; progress?: any }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);
    
    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulario', name: 'Vocabulario (Adjetivos)', icon: BookOpen, status: 'active' },
        { key: 'gramatica', name: 'Comparativos', icon: GraduationCap, status: 'locked' },
        { key: 'superlativos', name: 'Superlativos', icon: GraduationCap, status: 'locked' },
        { key: 'grammar-mixto', name: 'Grammar mixto', icon: GraduationCap, status: 'locked' },
        { key: 'monosilabos', name: 'Monosilabos', icon: Feather, status: 'locked' },
        { key: 'bisilabos', name: 'Bisilabos', icon: Feather, status: 'locked' },
        { key: 'largos', name: 'Largos', icon: Feather, status: 'locked' },
        { key: 'irregulares', name: 'Irregulares', icon: Bot, status: 'locked' },
        { key: 'mixtos', name: 'Mixtos', icon: PenSquare, status: 'locked' },
        { key: 'sopa_letras', name: 'Sopa de Letras (Adjetivos)', icon: Gamepad2, status: 'locked' },
        { key: 'mixtos2', name: 'Mixtos 2', icon: PenSquare, status: 'locked' },
        { key: 'adjetivos', name: 'Adjetivos', icon: FileText, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isUserLoading || isProfileLoading) return;
        const newPath = initialLearningPath.map(item => ({...item}));
        
        if (isAdmin) {
            newPath.forEach(item => item.status = 'completed');
        } else if (studentProfile?.lessonProgress?.[progressStorageKey]) {
            const savedStatuses = studentProfile.lessonProgress[progressStorageKey];
            newPath.forEach(item => { if (savedStatuses[item.key]) item.status = savedStatuses[item.key]; });
        }
        
        setLearningPath(newPath);
        const firstActive = newPath.find(p => p.status === 'active');
        setSelectedTopic(firstActive?.key || 'vocabulario');
    }, [isAdmin, initialLearningPath, studentProfile, isUserLoading, isProfileLoading]);

    const progress = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (isProfileLoading || isUserLoading) return;
        if (!isAdmin && studentDocRef && learningPath.length > 0) {
            const statusesToSave: Record<string, string> = {};
            learningPath.forEach(item => { statusesToSave[item.key] = item.status; });
            updateDocumentNonBlocking(studentDocRef, { 
                [`lessonProgress.${progressStorageKey}`]: statusesToSave,
                [`progress.${mainProgressKey}`]: progress
            });
        }
         if (progress >= 100) {
          window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
    }, [learningPath, progress, isAdmin, studentDocRef, isProfileLoading, isUserLoading, mainProgressKey]);

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
                     toast({ title: "¡Tema desbloqueado!", description: `Ahora puedes continuar con ${newPath[nextIndex].name}` });
                } else if (newPath.every(item => item.status === 'completed')) {
                    toast({ title: "¡Felicidades!", description: "Has completado todos los temas de esta lección." });
                }
            }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (key: string) => {
        const topic = learningPath.find(t => t.key === key);
        if (topic?.status === 'locked' && !isAdmin) {
            toast({ variant: 'destructive', title: 'Tema Bloqueado' });
            return;
        }
        setSelectedTopic(key);
        if (!['vocabulario', 'mixtos', 'sopa_letras', 'mixtos2'].includes(key)) {
          setTopicToComplete(key);
        }
    };

    const handleVocabInputChange = (index: number, value: string) => {
        const newAnswers = [...vocabAnswers];
        newAnswers[index] = value;
        setVocabAnswers(newAnswers);

        const newValidation = [...validationStatus];
        if (newValidation[index] !== 'unchecked') {
            newValidation[index] = 'unchecked';
            setValidationStatus(newValidation);
        }
        setCanAdvanceFromVocab(false);
    };

    const handleCheckVocab = () => {
        let atLeastOneCorrect = false;
        const newValidation = vocabularyData.map((item, index) => {
            const userAnswer = vocabAnswers[index]?.trim().toLowerCase();
            const correctAnswers = item.english.map(e => e.toLowerCase());
            const isCorrect = correctAnswers.includes(userAnswer);
            if (isCorrect) {
                atLeastOneCorrect = true;
            }
            return isCorrect ? 'correct' : 'incorrect';
        });
        setValidationStatus(newValidation as ('correct' | 'incorrect' | 'unchecked')[]);

        if (atLeastOneCorrect) {
            toast({ title: "¡Bien hecho!", description: "Has acertado al menos una. ¡Tema desbloqueado!" });
            setTopicToComplete('vocabulario');
            setCanAdvanceFromVocab(true);
        } else {
            toast({ 
                variant: "destructive", 
                title: "Sigue intentando", 
                description: "Revisa tus respuestas. ¡Necesitas al menos una correcta para continuar!" 
            });
            setCanAdvanceFromVocab(false);
        }
    };

    const getInputClass = (index: number) => {
        const status = validationStatus[index];
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive';
        return '';
    };

    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic);
        
        if (selectedTopic === 'vocabulario') {
            return (
                <Card>
                    <CardHeader>
                        <CardTitle>Vocabulario (Adjetivos)</CardTitle>
                        <CardDescription>Escribe la traducción en inglés para cada adjetivo.</CardDescription>
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
                                            value={vocabAnswers[index]}
                                            onChange={e => handleVocabInputChange(index, e.target.value)}
                                            className={cn(getInputClass(index))}
                                        />
                                    </div>
                                </React.Fragment>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button onClick={handleCheckVocab}>Verificar Vocabulario</Button>
                        <Button 
                            onClick={() => setSelectedTopic('gramatica')} 
                            disabled={!canAdvanceFromVocab}
                        >
                            Avanzar
                        </Button>
                    </CardFooter>
                </Card>
            );
        }

        if (selectedTopic === 'gramatica') {
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>LOS ADJETIVOS EN GRADO COMPARATIVO: (ADJETIVO + ER)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 text-lg">
                        <div>
                            <h3 className="text-xl font-bold text-primary">COMPARATIVOS (Adjective+ ER)</h3>
                            <p className="mt-2 text-muted-foreground"><span className="font-semibold">USO:</span> se usa en inglés para comparar diferencias entre los dos sustantivos a los que modifica.</p>
                        </div>

                        <Separator />

                        <div>
                            <h3 className="text-xl font-bold text-primary">Modificación del Adjetivo</h3>
                            <div className="mt-2 space-y-1 font-mono bg-muted p-4 rounded-lg">
                                <p>small =&gt; <span className="font-bold">SMALLER</span> (más pequeño que)</p>
                                <p>high =&gt; <span className="font-bold">HIGHER</span> (más alto que)</p>
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <h3 className="text-xl font-bold text-primary">Estructura</h3>
                            <p className="mt-2 font-mono bg-muted p-4 rounded-lg">sustantivo + verbo + adjetivo comparativo + than + sustantivo</p>
                        </div>
                        
                        <Separator />
                        
                        <div>
                            <h3 className="text-xl font-bold text-primary">TOPICS</h3>
                            <ul className="mt-2 list-disc list-inside space-y-2 text-base">
                                <li><span className="font-semibold">Monosilabos:</span> Adjetivos Cortos (Adjective + ER)</li>
                                <li><span className="font-semibold">Bisilabos:</span> Adjetivos con 2 sílabas (Adjective + ER)</li>
                                <li><span className="font-semibold">Adjetivos Largos:</span> Tienen más de 2 sílabas (more + adjetivo largo + than)</li>
                                <li><span className="font-semibold">Adjetivos Irregulares:</span> Cambian en todas sus formas</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            );
        }
        
        if (selectedTopic === 'superlativos') {
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>LOS ADJETIVOS EN GRADO SUPERLATIVO: (ADJETIVO + EST)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 text-lg">
                        <div>
                            <h3 className="text-xl font-bold text-primary">SUPERLATIVOS (Adjective + EST)</h3>
                            <p className="mt-2 text-muted-foreground"><span className="font-semibold">USO:</span> se emplea para describir un sustantivo que se encuentra en el extremo superior (el más) o el inferior (el menos).</p>
                        </div>

                        <Separator />

                        <div>
                            <h3 className="text-xl font-bold text-primary">Modificación del Adjetivo</h3>
                            <div className="mt-2 space-y-1 font-mono bg-muted p-4 rounded-lg">
                                <p>Tall =&gt; The <span className="font-bold">TALLEST</span> (el más alto)</p>
                                <p>Fast =&gt; The <span className="font-bold">FASTEST</span> (el más rápido)</p>
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <h3 className="text-xl font-bold text-primary">ESTRUCTURA</h3>
                            <p className="mt-2 font-mono bg-muted p-4 rounded-lg">sustantivo + verbo + THE + Adjetivo superlativo + Sustantivos o complemento</p>
                        </div>
                        
                        <Separator />
                        
                        <div>
                            <h3 className="text-xl font-bold text-primary">TOPICS</h3>
                            <ul className="mt-2 list-disc list-inside space-y-2 text-base">
                                <li><span className="font-semibold">Monosilabos:</span> Adjetivos Cortos (Adjective + EST)</li>
                                <li><span className="font-semibold">Bisílabos:</span> Adjetivos con 2 sílabas (Adjective + EST)</li>
                                <li><span className="font-semibold">Adjetivos Largos:</span> Tienen más de 2 sílabas (The Most + adjetivo largo)</li>
                                <li><span className="font-semibold">Adjetivos Irregulares:</span> Cambian en todas sus formas</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        if (selectedTopic === 'grammar-mixto') {
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>Grammar Mixto: Reglas de Ortografía</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 text-lg">
                        <p className='text-base text-muted-foreground'>PARA LA FORMACION DE LOS GRADOS COMPARATIVOS Y SUPERLATIVO DE LOS ADJETIVOS ‘’CORTOS’’, DEBEN TENERSE EN CUENTA LAS SIGUIENTES CONSIDERACIONES:</p>
                        <ol className="list-decimal list-inside space-y-4">
                            <li>
                                <span className='font-semibold'>LOS QUE TERMINAN EN ‘’-E’’ SOLO AÑADEN ‘’-R’’ Y ‘’-ST’’</span>
                                <div className="mt-2 space-y-1 font-mono bg-muted p-4 rounded-lg text-base">
                                    <p>NICE - NICER – THE NICEST</p>
                                </div>
                            </li>
                             <li>
                                <span className='font-semibold'>LOS QUE TERMINAN EN ‘’-Y’’ PRECEDIDA DE CONSONANTE, CAMBIAN LA ‘’Y’’ POR ‘’I’’</span>
                                <div className="mt-2 space-y-1 font-mono bg-muted p-4 rounded-lg text-base">
                                    <p>EASY - EASIER – THE EASIEST</p>
                                </div>
                            </li>
                             <li>
                                <span className='font-semibold'>LOS QUE TERMINAN EN ‘’-Y’’ PRECEDIDA POR VOCAL, MANTIENEN LA REGLA GENERAL</span>
                                 <div className="mt-2 space-y-1 font-mono bg-muted p-4 rounded-lg text-base">
                                    <p>GRAY - GRAYER – THE GRAYEST</p>
                                </div>
                            </li>
                             <li>
                                <span className='font-semibold'>LOS TERMINADOS EN UNA SOLA CONSONANTE PRECEDIDA DE VOCAL, DOBLAN LA CONSONANTE ANTES DE LAS TERMINACIONES</span>
                                <div className="mt-2 space-y-1 font-mono bg-muted p-4 rounded-lg text-base">
                                    <p>BIG - BIGGER – THE BIGGEST</p>
                                    <p>HOT - HOTTER – THE HOTTEST</p>
                                </div>
                                <p className="text-sm text-muted-foreground italic mt-2">– excepción: new</p>
                            </li>
                        </ol>
                    </CardContent>
                </Card>
            );
        }

        const isExercise = ['mixtos', 'sopa_letras', 'mixtos2'].includes(selectedTopic);
        return (
            <Card>
                <CardHeader><CardTitle>{topic?.name}</CardTitle></CardHeader>
                <CardContent>
                    <p>Contenido para {topic?.name} estará disponible pronto.</p>
                    {isExercise && (
                      <Button className="mt-4" onClick={() => setTopicToComplete(selectedTopic)}>Completar Ejercicio</Button>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="flex w-full flex-col min-h-screen a1-kids-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <Link href="/kids/a1" className="hover:underline text-sm text-muted-foreground">Volver al curso A1 de Niños</Link>
                        <h1 className="text-4xl font-bold dark:text-primary">Comparativos y Superlativos</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-8">{renderContent()}</div>
                        <div className="md:col-span-4">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple">
                                <CardHeader><CardTitle>Ruta de Aprendizaje</CardTitle></CardHeader>
                                <CardContent>
                                    <nav>
                                        <ul className="space-y-1">
                                            {learningPath.map(item => (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                                    className={cn('flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer',
                                                        item.status === 'locked' && !isAdmin ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted',
                                                        selectedTopic === item.key && 'bg-muted text-primary font-semibold'
                                                    )}>
                                                    {item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500"/> : <item.icon className="h-5 w-5" />}
                                                    <span>{item.name}</span>
                                                    {item.status === 'locked' && !isAdmin && <Lock className="h-4 w-4 text-yellow-500 ml-auto" />}
                                                </li>
                                            ))}
                                        </ul>
                                    </nav>
                                     <div className="mt-6 pt-6 border-t">
                                        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2">
                                            <span>Progreso</span><span className="font-bold text-foreground">{progress}%</span>
                                        </div>
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