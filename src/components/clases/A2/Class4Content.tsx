'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    GraduationCap, 
    CheckCircle, 
    Loader2, 
    ArrowRight,
    Gamepad2,
    Trophy,
    BookText,
    Pencil,
    Mic,
    HelpCircle,
    Briefcase
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_a2_eng_u1_c4_v1_base';
const mainProgressKey = 'progress_a2_eng_unit_1_class_4';

interface Topic {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'completed' | 'active' | 'locked';
}

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

export default function Class4Content({ overrideStudentId }: { overrideStudentId?: string | null }) {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const currentUID = overrideStudentId || user?.uid;
    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any, name?: string}>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const hasInitialized = useRef(false);

    // Definición de la ruta de 10 pasos solicitada
    const initialPathData = useMemo(() => [
        { key: 'vocabulary_professions', name: '1. Vocabulary (Professions)', icon: Briefcase },
        { key: 'grammar_adverbs', name: '2. Grammar (Adverbs)', icon: GraduationCap },
        { key: 'exercise_1', name: '3. Exercise 1', icon: PenSquare },
        { key: 'exercise_2', name: '4. Exercise 2', icon: PenSquare },
        { key: 'dictation_1', name: '5. Dictation 1', icon: Mic },
        { key: 'questions_dict1', name: '6. Questions about Dict1', icon: HelpCircle },
        { key: 'vocab_game', name: '7. Vocabulary (Game)', icon: Gamepad2 },
        { key: 'exercise_3', name: '8. Exercise 3', icon: PenSquare },
        { key: 'create_1', name: '9. Create 1', icon: Pencil },
        { key: 'reading', name: '10. Reading', icon: BookText },
    ], []);

    // ASYNC FLOW 1: Carga y Sincronización
    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || hasInitialized.current) return;

        let path = initialPathData.map((topic, index) => ({ 
            ...topic, 
            status: index === 0 ? 'active' : 'locked' as 'completed' | 'active' | 'locked'
        }));
        
        let savedTopic = '';

        if (isAdmin && !overrideStudentId) {
            path.forEach(t => t.status = 'completed');
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const data = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(t => { if (data[t.key]) t.status = data[t.key]; });
            savedTopic = data.lastSelectedTopic || '';
        }

        // Lógica de desbloqueo secuencial
        if (!isAdmin || overrideStudentId) {
            let lastDone = true;
            for (let i = 0; i < path.length; i++) {
                if (lastDone && path[i].status === 'locked') path[i].status = 'active';
                lastDone = path[i].status === 'completed';
            }
        }

        setLearningPath(path);
        setSelectedTopic(savedTopic || path.find(p => p.status === 'active')?.key || path[0].key);
        hasInitialized.current = true;
        setTimeout(() => setIsInitialLoading(false), 600);
    }, [isAdmin, initialPathData, studentProfile, isProfileLoading, isUserLoading, overrideStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    // ASYNC FLOW 2: Guardado de progreso (Debounce)
    useEffect(() => {
        if (!hasInitialized.current || isInitialLoading || isAdmin || !studentDocRef || overrideStudentId) return;
        
        const s: Record<string, any> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => { s[item.key] = item.status; });
        
        const timer = setTimeout(() => {
            updateDocumentNonBlocking(studentDocRef, { 
                [`lessonProgress.${progressStorageVersion}`]: s, 
                [`progress.${mainProgressKey}`]: progressValue 
            });
        }, 1000);
        
        return () => clearTimeout(timer);
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, overrideStudentId]);

    // ASYNC FLOW 3: Desbloqueos mediante Toasts Seguros
    useEffect(() => {
        if (!topicToComplete) return;

        setLearningPath(current => {
            const newPath = current.map(t => ({ ...t }));
            const idx = newPath.findIndex(t => t.key === topicToComplete);
            if (idx !== -1 && newPath[idx].status !== 'completed') {
                newPath[idx].status = 'completed';
                if (idx + 1 < newPath.length && newPath[idx + 1].status === 'locked') {
                    newPath[idx + 1].status = 'active';
                    setSelectedTopic(newPath[idx + 1].key);
                    setTimeout(() => toast({ title: "¡Paso completado!", description: "Siguiente misión desbloqueada." }), 0);
                }
            }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (key: string) => {
        const topic = learningPath.find(t => t.key === key);
        if (!isAdmin && topic?.status === 'locked') {
            toast({ variant: "destructive", title: "Contenido Bloqueado", description: "Completa el reto anterior para avanzar." });
            return;
        }
        setSelectedTopic(key);
    };

    const handleTopicComplete = (key: string) => {
        setTopicToComplete(key);
    };

    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic);
        if (!topic) return null;

        return (
            <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left overflow-hidden">
                <CardHeader className='bg-primary/5 border-b'>
                    <div className='flex items-center gap-3'>
                        <div className='p-2 bg-primary/20 rounded-lg text-primary'>
                            <topic.icon className='h-6 w-6' />
                        </div>
                        <div>
                            <CardTitle className="text-primary uppercase tracking-tighter">{topic.name}</CardTitle>
                            <CardDescription className='font-bold text-foreground'>Sección de aprendizaje para la Clase 4 (A2).</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="py-12 flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
                    <div className='p-10 bg-muted/30 rounded-full animate-pulse'>
                        <topic.icon className='h-24 w-24 text-primary/30' />
                    </div>
                    <div className='space-y-2'>
                        <h3 className='text-4xl font-black uppercase tracking-tighter text-primary'>PROXIMAMENTE</h3>
                        <p className='text-muted-foreground text-xl'>El contenido interactivo para "{topic.name}" se está cargando en la base de datos de misiones.</p>
                    </div>
                </CardContent>
                <CardFooter className="justify-center border-t p-6 bg-muted/10">
                    <Button onClick={() => handleTopicComplete(selectedTopic)} size="lg" className="px-20 font-black h-14 text-xl shadow-xl uppercase transition-all active:scale-95">
                        Completar Misión <ArrowRight className="ml-2 h-6 w-6" />
                    </Button>
                </CardFooter>
            </Card>
        );
    };

    if (isInitialLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-white font-bold tracking-widest animate-pulse uppercase">Sincronizando Misión A2...</p>
            </div>
        );
    }

    return (
        <div className="grid gap-8 md:grid-cols-12 text-foreground animate-in fade-in duration-500">
            {/* Contenido Principal */}
            <div className="md:col-span-9 md:order-1 order-2">
                {renderContent()}
            </div>

            {/* Sidebar de Navegación Lateral */}
            <div className="md:col-span-3 md:order-2 order-1 text-left">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader className="pb-4 border-b bg-muted/30">
                        <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-primary" /> Tu Misión
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <nav>
                            <ul className="space-y-1">
                                {learningPath.map((item) => {
                                    const isLocked = item.status === 'locked' && !isAdmin;
                                    const Icon = ICONS_CONFIG[item.status] || BookOpen;
                                    return (
                                        <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                            className={cn(
                                                'flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground',
                                                isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted',
                                                selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm'
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                {item.status === 'completed' ? (
                                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                                ) : (
                                                    <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />
                                                )}
                                                <span className="truncate max-w-[150px] text-[10px] uppercase font-bold">{item.name}</span>
                                            </div>
                                            {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>
                        <div className="mt-6 pt-6 border-t">
                            <div className="flex justify-between items-center text-xs mb-2 font-black uppercase text-muted-foreground">
                                <span>Avance</span>
                                <span className="text-primary">{progressValue}%</span>
                            </div>
                            <Progress value={progressValue} className="h-2 rounded-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
