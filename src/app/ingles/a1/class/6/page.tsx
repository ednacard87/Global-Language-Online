'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle, Info, Gamepad2, BookText, Loader2 } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from '@/components/ui/separator';

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

const progressStorageVersion = 'progress_a1_eng_unit_2_class_6_v3';
const mainProgressKey = 'progress_a1_eng_unit_2_class_6';

const vocabularyData = [
    { spanish: 'SERIO', english: ['serious'] },
    { spanish: 'ALEGRE', english: ['cheerful'] },
    { spanish: 'OCUPADO', english: ['busy'] },
    { spanish: 'RARO, EXTRAÑO', english: ['strange'] },
    { spanish: 'CURIOSO', english: ['curious'] },
    { spanish: 'AMIGABLE', english: ['friendly'] },
    { spanish: 'DULCE', english: ['sweet'] },
    { spanish: 'INTELIGENTE', english: ['intelligent'] },
    { spanish: 'LIBRE', english: ['free'] },
    { spanish: 'EGOÍSTA', english: ['selfish'] },
    { spanish: 'ENVIDIOSO', english: ['envious'] },
    { spanish: 'FELIZ', english: ['happy'] },
    { spanish: 'AMABLE', english: ['kind'] },
    { spanish: 'RAPIDO', english: ['fast'] },
    { spanish: 'ABURRIDOR', english: ['boring'] },
    { spanish: 'GENEROSO', english: ['generous'] },
    { spanish: 'MINUSCULO', english: ['tiny'] },
    { spanish: 'HERMOSO', english: ['beautiful'] },
    { spanish: 'LENTO', english: ['slow'] },
    { spanish: 'ENORME', english: ['huge'] },
    { spanish: 'ORDENADO', english: ['tidy'] },
    { spanish: 'TERCO', english: ['stubborn'] },
    { spanish: 'NERVIOSO', english: ['nervous'] },
    { spanish: 'DESORDENADO', english: ['messy', 'untidy'] },
    { spanish: 'TRABAJADOR', english: ['hardworking'] },
    { spanish: 'PESIMISTA', english: ['pessimistic'] },
    { spanish: 'OPTIMISTA', english: ['optimistic'] },
    { spanish: 'FLEXIBLE', english: ['flexible'] },
];

const possessivesTable = [
    { adj: 'MY', adjEs: 'MI-MIS', pro: 'MINE', proEs: 'MIO (MIOS-MIA- MIAS)' },
    { adj: 'YOUR', adjEs: 'TU-TUS', pro: 'YOURS', proEs: 'TUYO (OS-A-AS)' },
    { adj: 'HIS', adjEs: 'SU-SUS DE EL', pro: 'HIS', proEs: '(SUYO/A/OS/AS DE EL)' },
    { adj: 'HER', adjEs: 'SU-SUS DE ELLA', pro: 'HERS', proEs: '(SUYO/A/OS/AS DE ELLA)' },
    { adj: 'ITS', adjEs: 'SU-SUS DE ESO', pro: 'ITS', proEs: '(SUYO/A/OS/AS DE ESO)' },
    { adj: 'OUR', adjEs: 'NUESTRO/A/OS/AS', pro: 'OURS', proEs: '( NUESTRO/A/OS/AS)' },
    { adj: 'THEIR', adjEs: 'SU- SUS DE ELLOS', pro: 'THEIRS', proEs: '( SUYO/A/OS/AS DE ELLOS)' },
];

export default function EngA1Class6Page() {
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
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(vocabularyData.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(vocabularyData.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary (Basic Adjectives)', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: 'Grammar', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: 'Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: 'Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'ex3', name: 'Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'note', name: 'Nota', icon: Info, status: 'locked' },
        { key: 'ex4', name: 'Ejercicio 4', icon: PenSquare, status: 'locked' },
        { key: 'text', name: 'Texto', icon: BookOpen, status: 'locked' },
        { key: 'vocab_game', name: 'Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'ex5', name: 'Ejercicio 5', icon: PenSquare, status: 'locked' },
        { key: 'ex6', name: 'Ejercicio 6', icon: PenSquare, status: 'locked' },
        { key: 'ex7', name: 'Ejercicio 7', icon: PenSquare, status: 'locked' },
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
        
        setVocabAnswers(Array(vocabularyData.length).fill(''));
        setVocabValidation(Array(vocabularyData.length).fill('unchecked'));
        setCanAdvanceVocab(false);
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

        const autoViewTopics = ['grammar', 'note', 'text'];
        if (autoViewTopics.includes(topicKey)) {
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
            setVocabValidation(newValidation);
        }
        setCanAdvanceVocab(false);
    };

    const handleCheckVocab = () => {
        let atLeastOneCorrect = false;
        const newValidation = vocabularyData.map((item, index) => {
            const userAnswer = vocabAnswers[index]?.trim().toLowerCase();
            const isCorrect = item.english.some(e => e.toLowerCase() === userAnswer);
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

    const getInputClass = (index: number) => {
        const status = vocabValidation[index];
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500 bg-green-50 dark:bg-green-900/10';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive bg-destructive/5';
        return '';
    };
    
    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic);

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Vocabulary (Basic Adjectives)</CardTitle>
                            <CardDescription>Traduce los adjetivos del español al inglés.</CardDescription>
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
                                                className={cn(getInputClass(index))}
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
                                disabled={!canAdvanceVocab}
                                className={cn(!canAdvanceVocab && "opacity-50")}
                            >
                                Avanzar
                            </Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Gramática: Adjetivos y Pronombres Posesivos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="overflow-x-auto">
                                <Table className="border text-base">
                                    <TableHeader className="bg-muted">
                                        <TableRow>
                                            <TableHead className="font-bold text-foreground">ADJETIVOS POSESIVOS</TableHead>
                                            <TableHead className="font-bold text-foreground">ESPAÑOL</TableHead>
                                            <TableHead className="font-bold text-foreground">PRONOMBRES POSESIVOS</TableHead>
                                            <TableHead className="font-bold text-foreground">ESPAÑOL</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {possessivesTable.map((row, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-semibold text-primary">{row.adj}</TableCell>
                                                <TableCell>{row.adjEs}</TableCell>
                                                <TableCell className="font-semibold text-brand-purple">{row.pro}</TableCell>
                                                <TableCell>{row.proEs}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6">
                            <Button onClick={() => handleTopicComplete('grammar')}>Entendido y Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'note':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Nota: Los Adjetivos Posesivos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-primary/5 p-6 rounded-xl border-l-4 border-primary">
                                <h3 className="text-xl font-bold mb-2">USO Y REGLAS</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Se utilizan para indicar quién tiene la propiedad sobre una(s) cosa(s). 
                                    <strong> La cantidad de objetos no se refleja en la forma del adjetivo posesivo</strong> (siempre es la misma palabra).
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <Card className="bg-muted/50 border-dashed border-2">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">Posición en la frase</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="font-mono text-sm uppercase">Before Noun : Antes del sustantivo</p>
                                    </CardContent>
                                </Card>
                                
                                <Card className="bg-muted/50 border-dashed border-2">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">Ejemplos</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <p className="text-sm"><strong>IT’S MY CAR</strong><br/><span className="text-muted-foreground">(ESTE ES MI CARRO)</span></p>
                                        <p className="text-sm"><strong>THESE ARE MY CARS</strong><br/><span className="text-muted-foreground">(ESTOS SON MIS CARROS)</span></p>
                                    </CardContent>
                                </Card>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center">
                            <Button onClick={() => handleTopicComplete('note')}>Entendido</Button>
                        </CardFooter>
                    </Card>
                );
            default:
                if (selectedTopic.startsWith('ex')) {
                    return (
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple min-h-[400px]">
                            <CardHeader>
                                <CardTitle>{topic?.name}</CardTitle>
                                <CardDescription>Completa el ejercicio para avanzar.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center">
                                <PenSquare className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
                                <p className="text-muted-foreground">Contenido del ejercicio interactivo próximamente.</p>
                            </CardContent>
                            <CardFooter className="justify-center">
                                <Button onClick={() => handleTopicComplete(selectedTopic)}>Simular Completado</Button>
                            </CardFooter>
                        </Card>
                    );
                }
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple min-h-[500px]">
                        <CardHeader>
                            <CardTitle>{topic?.name || 'Cargando...'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Contenido para este tema estará disponible pronto.</p>
                        </CardContent>
                    </Card>
                );
        }
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
                        <h1 className="text-4xl font-bold text-white dark:text-primary [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase 6</h1>
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
                                                return (
                                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                                        className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer',
                                                            isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted',
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
