'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle, Gamepad2, ChevronDown, Trophy } from 'lucide-react';
import { useTranslation } from "@/context/language-context";
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
  subItems?: { key: string; name: string; status: 'locked' | 'active' | 'completed', icon?: React.ElementType }[];
};

const ICONS = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const progressStorageVersion = 'progress_kids_b1_may_v1';
const mainProgressKey = 'progress_kids_b1_may';

export default function MayPage() {
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

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulario (Life Goals)', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: 'Grammar', icon: GraduationCap, status: 'locked' },
        { key: 'exercise1', name: 'Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'exercise2', name: 'Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'exercise3', name: 'Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'game', name: 'Sopa de Letras (Life Goals)', icon: Gamepad2, status: 'locked' },
    ], []);
    
    useEffect(() => {
        if (isUserLoading || isProfileLoading) return;

        const newPath = initialLearningPath.map(topic => ({ ...topic }));

        if (isAdmin) {
            newPath.forEach(item => {
                item.status = 'completed';
            });
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedStatuses = studentProfile.lessonProgress[progressStorageVersion];
            newPath.forEach(item => {
                if (savedStatuses[item.key]) item.status = savedStatuses[item.key];
            });
        }

        setLearningPath(newPath);
        
        const firstActive = newPath.find(p => p.status === 'active');
        if (firstActive) {
            setSelectedTopic(firstActive.key);
        } else {
            setSelectedTopic(newPath[0]?.key || '');
        }
    
    }, [isAdmin, initialLearningPath, studentProfile, isUserLoading, isProfileLoading]);

    
    const progress = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedTopics = learningPath.filter(t => t.status === 'completed').length;
        return (completedTopics / learningPath.length) * 100;
    }, [learningPath]);

    useEffect(() => {
        if (isUserLoading || isProfileLoading || learningPath.length === 0) return;

        if (!isAdmin && studentDocRef) {
            const statusesToSave = learningPath.reduce((acc, item) => {
                acc[item.key] = item.status;
                return acc;
            }, {} as Record<string, string>);
            
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: statusesToSave });
            updateDocumentNonBlocking(studentDocRef, { [`progress.${mainProgressKey}`]: Math.round(progress) });
        }
        if (progress >= 100) {
          window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
    }, [learningPath, isAdmin, progress, studentDocRef, isUserLoading, isProfileLoading]);

    useEffect(() => {
        if (!topicToComplete) return;
    
        setLearningPath(currentPath => {
            const newPath = [...currentPath];
            const currentIndex = newPath.findIndex(t => t.key === topicToComplete);
            
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

        const exerciseKeys = ['exercise1', 'exercise2', 'exercise3', 'game'];
        if (!exerciseKeys.includes(topicKey)) {
             handleTopicComplete(topicKey);
        }
    };
    
    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic);

        switch(selectedTopic) {
            case 'vocabulary':
                const lifeGoalsVocab = [
                    { spanish: "Solicitar una beca.", english: "Apply for a scholarship" },
                    { spanish: "Tomarse un año sabático.", english: "Take a gap year" },
                    { spanish: "Estudiar en el extranjero.", english: "Study abroad" },
                    { spanish: "Obtener un ascenso.", english: "Get a promotion" },
                    { spanish: "Cambiar de carrera/profesión.", english: "Change career" },
                    { spanish: "Formar una familia.", english: "Start a family" },
                    { spanish: "Unirse a una organización benéfica.", english: "Join a charity" },
                    { spanish: "Aprender un oficio (ej. carpintería, mecánica).", english: "Learn a trade" },
                    { spanish: "Obtener un título universitario.", english: "Get a degree" },
                    { spanish: "Mudarse al extranjero.", english: "Move abroad" },
                    { spanish: "Jubilarse joven.", english: "Retire early" },
                    { spanish: "Montar un negocio.", english: "Set up a business" },
                ];

                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Life Goals and Events</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                <div className="font-bold p-3 bg-muted rounded-lg text-left">Español</div>
                                <div className="font-bold p-3 bg-muted rounded-lg text-left">Inglés</div>
                                {lifeGoalsVocab.map((item, index) => (
                                    <React.Fragment key={index}>
                                        <div className="p-3 bg-card border rounded-lg flex items-center">{item.spanish}</div>
                                        <div className="p-3 bg-card border rounded-lg flex items-center">{item.english}</div>
                                    </React.Fragment>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => handleTopicComplete('vocabulary')}>
                                Continuar con Grammar
                            </Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                 return (
                    <div className="space-y-6">
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                            <CardHeader>
                                <CardTitle>Diferencia entre MAY y MIGHT</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-lg">
                                <p>Ambos se usan para hablar de posibilidades en el futuro, pero hay un matiz de probabilidad:</p>
                                <div>
                                    <h4 className="font-bold text-primary">MAY (50% de probabilidad)</h4>
                                    <p className="text-muted-foreground">Se usa cuando algo es muy posible. Es un poco más formal.</p>
                                    <p className="mt-2 p-3 bg-muted rounded-lg font-mono text-base">"I have good grades, so I may get a degree next year." (Es probable).</p>
                                </div>
                                <div>
                                    <h4 className="font-bold text-primary">MIGHT (30% de probabilidad)</h4>
                                    <p className="text-muted-foreground">Se usa para posibilidades más remotas o distantes.</p>
                                    <p className="mt-2 p-3 bg-muted rounded-lg font-mono text-base">"I don't have much money, but I might move abroad someday." (Es un sueño lejano).</p>
                                </div>
                            </CardContent>
                        </Card>
            
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                            <CardHeader>
                                <CardTitle>Estructura Gramatical</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 font-mono text-base">
                                <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> pronoun + may/might + verb + complement</p>
                                <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> pronoun + may/might + not + verb + complement</p>
                                <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> May/Might + pronoun + verb + complement?</p>
                                <div className="border-t my-2" />
                                <p className="font-sans font-semibold pt-2">Respuestas Cortas</p>
                                <p><span className="font-bold text-lg text-green-500 mr-2">(+A)</span> Yes, pronoun + may/might.</p>
                                <p><span className="font-bold text-lg text-red-500 mr-2">(-A)</span> No, pronoun + may/might not.</p>
                            </CardContent>
                        </Card>
                        
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card">
                            <CardHeader>
                                <CardTitle>Nota Importante</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg">No se suelen usar contracciones (como <code className="font-mono bg-brand-lilac p-1 rounded">mightn't</code>) en el inglés moderno; es mejor decir <code className="font-mono bg-brand-lilac p-1 rounded">might not</code>.</p>
                            </CardContent>
                        </Card>
                    </div>
                );
            case 'exercise1':
            case 'exercise2':
            case 'exercise3':
                 return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>{topic?.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Contenido del ejercicio.</p>
                             <Button onClick={() => handleTopicComplete(selectedTopic)} className="mt-4">Marcar como completado</Button>
                        </CardContent>
                    </Card>
                );
            case 'game':
                 return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Sopa de Letras (Life Goals)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Aquí va el juego de sopa de letras.</p>
                            <Button onClick={() => handleTopicComplete('game')} className="mt-4">Marcar como completado</Button>
                        </CardContent>
                    </Card>
                );
            default:
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple min-h-[500px]">
                        <CardHeader>
                            <CardTitle>{topic?.name || 'Cargando...'}</CardTitle>
                            <CardDescription>Contenido para este tema estará disponible pronto.</CardDescription>
                        </CardHeader>
                    </Card>
                );
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen will-lesson-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <Link href="/kids/b1" className="hover:underline text-sm text-muted-foreground">Volver al curso B1</Link>
                        <h1 className="text-4xl font-bold text-white dark:text-primary">May and Might</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9">{renderContent()}</div>
                        <div className="md:col-span-3">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple">
                                <CardHeader><CardTitle>Ruta de Aprendizaje</CardTitle></CardHeader>
                                <CardContent>
                                    <nav>
                                        <ul className="space-y-1">
                                            {learningPath.map((item) => (
                                                <li key={item.key}>
                                                    <div onClick={() => handleTopicSelect(item.key)}
                                                        className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors', item.status === 'locked' && !isAdmin ? 'cursor-not-allowed text-muted-foreground/50' : 'cursor-pointer hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-semibold')}>
                                                        <div className="flex items-center gap-3">
                                                            <item.icon className={cn("h-5 w-5", item.status === 'completed' ? 'text-green-500' : '')} />
                                                            <span>{item.name}</span>
                                                        </div>
                                                        {item.status === 'locked' && !isAdmin && <Lock className="h-4 w-4 text-yellow-500" />}
                                                    </div>
                                                </li>
                                            ))}
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
