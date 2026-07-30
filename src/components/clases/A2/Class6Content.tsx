'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
    CardDescription, 
    CardFooter 
} from '@/components/ui/card';
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
    ArrowRight,
    Gamepad2,
    Trophy,
    Pencil,
    BookText,
    Star,
    Activity,
    Info,
    History,
    Zap,
    MessageSquare,
    CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_a2_eng_u2_c6_v1_skeleton';
const mainProgressKey = 'progress_a2_eng_unit_2_class_6';

interface Topic {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'completed' | 'active' | 'locked';
}

const ICONS_MAP = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

export default function Class6Content({ overrideStudentId }: { overrideStudentId?: string | null }) {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const currentUID = overrideStudentId || user?.uid;
    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any, name?: string}>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const hasInitialized = useRef(false);

    // Definición de la ruta de aprendizaje solicitada
    const initialPathData = useMemo((): Topic[] => [
        { key: 'vocabulary_irregular', name: '1. Vocabulary (Verbos irregulares)', icon: BookOpen, status: 'active' },
        { key: 'grammar_did', name: '2. Grammar DID', icon: GraduationCap, status: 'locked' },
        { key: 'past_simple_ed', name: '3. Past Simple = ED', icon: History, status: 'locked' },
        { key: 'exercise_1', name: '4. Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'exercise_plus', name: '5. Exercise (+)', icon: Zap, status: 'locked' },
        { key: 'exercise_minus', name: '6. Exercise (-)', icon: Zap, status: 'locked' },
        { key: 'exercise_question', name: '7. Exercise (?)', icon: Zap, status: 'locked' },
        { key: 'create_1', name: '8. Create 1', icon: Pencil, status: 'locked' },
        { key: 'vocab_game', name: '9. Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
        { key: 'create_2', name: '10. Create 2', icon: Pencil, status: 'locked' },
        { key: 'exercise_2', name: '11. Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'exercise_3', name: '12. Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'complete_verbs', name: '13. Complete Verbs', icon: ListChecks, status: 'locked' },
        { key: 'reading', name: '14. Reading', icon: BookText, status: 'locked' },
        { key: 'exercise_4', name: '15. Exercise 4', icon: PenSquare, status: 'locked' },
        { key: 'final_exercise', name: '16. Final Exercise', icon: Trophy, status: 'locked' },
    ], []);

    // ASYNC FLOW 1: Inicialización de la Ruta y carga de Firestore
    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || hasInitialized.current) return;

        let path = initialPathData.map((topic, i) => ({ ...topic, status: i === 0 ? 'active' : 'locked' as any }));
        let savedST = '';

        if (isAdmin && !overrideStudentId) {
            path.forEach(item => { item.status = 'completed'; });
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedData = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => { if (savedData[item.key]) item.status = savedData[item.key]; });
            savedST = savedData.lastSelectedTopic || '';
        }

        // Reparación de ruta lógica
        let lastDone = true;
        for (let i = 0; i < path.length; i++) {
            if (lastDone && path[i].status === 'locked') path[i].status = 'active';
            lastDone = path[i].status === 'completed';
        }

        setLearningPath(path);
        setSelectedTopic(savedST || path.find(p => p.status === 'active')?.key || path[0].key);
        setInitialLoadComplete(true);
        hasInitialized.current = true;
        setTimeout(() => setIsInitialLoading(false), 800);
    }, [isAdmin, initialPathData, studentProfile, isProfileLoading, isUserLoading, overrideStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    // ASYNC FLOW 2: Guardado automático de progreso (Debounced)
    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || overrideStudentId) return;
        
        const saveTimer = setTimeout(() => {
            const s: any = { lastSelectedTopic: selectedTopic };
            learningPath.forEach(item => { s[item.key] = item.status; });
            
            const currentSavedData = studentProfile?.lessonProgress?.[progressStorageVersion];
            if (JSON.stringify(s) !== JSON.stringify(currentSavedData)) {
                updateDocumentNonBlocking(studentDocRef, { 
                    [`lessonProgress.${progressStorageVersion}`]: s, 
                    [`progress.${mainProgressKey}`]: progressValue 
                });
            }
        }, 1500);

        return () => clearTimeout(saveTimer);
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, initialLoadComplete, overrideStudentId, studentProfile]);

    // ASYNC FLOW 3: Manejo de notificaciones y desbloqueos
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
            
            if (wasUnlocked) setTimeout(() => toast({ title: "¡Misión desbloqueada!" }), 0);
            if (nextToSelect) { 
                const finalNext = nextToSelect; 
                setTimeout(() => setSelectedTopic(finalNext), 0); 
            }
            return newPath;
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
                            <CardDescription className='font-bold text-foreground'>Sección de aprendizaje en desarrollo.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="py-20 flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
                    <div className='p-10 bg-muted/30 rounded-full animate-pulse'>
                        <topic.icon className='h-24 w-24 text-primary/30' />
                    </div>
                    <div className='space-y-2'>
                        <h3 className='text-4xl font-black uppercase tracking-tighter text-primary'>PRÓXIMAMENTE</h3>
                        <p className='text-muted-foreground text-xl'>El contenido interactivo para "{topic.name}" se está cargando.</p>
                    </div>
                </CardContent>
                <CardFooter className="justify-center border-t p-6 bg-muted/10">
                    <Button onClick={() => handleTopicComplete(selectedTopic)} size="lg" className="px-20 font-black h-14 text-xl shadow-xl uppercase transition-all active:scale-95">
                        Completar Paso <ArrowRight className="ml-2 h-6 w-6" />
                    </Button>
                </CardFooter>
            </Card>
        );
    };

    if (isInitialLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-white font-bold tracking-widest animate-pulse uppercase">Sincronizando Misión B1...</p>
            </div>
        );
    }

    return (
        <div className="grid gap-8 md:grid-cols-12 text-foreground animate-in fade-in duration-500">
            <div className="md:col-span-9 md:order-1 order-2">
                {renderContent()}
            </div>
            <div className="md:col-span-3 md:order-2 order-1 text-left">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader className="pb-4 border-b bg-muted/30">
                        <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-primary" /> Misión 6A
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <nav>
                            <ul className="space-y-1">
                                {learningPath.map((item) => {
                                    const isLocked = item.status === 'locked' && !isAdmin;
                                    const Icon = ICONS_MAP[item.status] || BookOpen;
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
                                <span>Avance Clase</span>
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

// Icono auxiliar faltante en lucide-react para la lista
function ListChecks(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m3 17 2 2 4-4" />
            <path d="m3 7 2 2 4-4" />
            <path d="M13 6h8" />
            <path d="M13 12h8" />
            <path d="M13 18h8" />
        </svg>
    )
}
