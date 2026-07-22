'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
    UtensilsCrossed,
    ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_b1_eng_u1_c2_v2_clean';
const mainProgressKey = 'progress_b1_eng_unit_1_class_2';

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

export default function Class2Content({ overrideStudentId }: { overrideStudentId?: string | null }) {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const currentUID = overrideStudentId || user?.uid;

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const hasInitialized = useRef(false);

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    // Ruta de 14 pasos para Clase 2
    const initialPathData = useMemo(() => [
        { key: 'vocab_kitchen', name: '1. Vocabulary (kitchen stuff)', icon: UtensilsCrossed },
        { key: 'grammar_phrasal', name: '2. Grammar 1 (Phrasal verbs)', icon: GraduationCap },
        { key: 'ex_phrasal', name: '3. Exercise phrasal verbs', icon: PenSquare },
        { key: 'grammar_comp', name: '4. Grammar 2 (comparatives)', icon: GraduationCap },
        { key: 'exercise_1', name: '5. Exercise 1', icon: PenSquare },
        { key: 'grammar_usedto', name: '6. Grammar 3 (used to)', icon: GraduationCap },
        { key: 'ex_usedto', name: '7. Exercise used to', icon: PenSquare },
        { key: 'create_1', name: '8. Create 1', icon: Pencil },
        { key: 'exercise_2', name: '9. Exercise 2', icon: PenSquare },
        { key: 'vocab_game', name: '10. Vocabulary (Game)', icon: Gamepad2 },
        { key: 'writing', name: '11. Writing', icon: Pencil },
        { key: 'exercise_3', name: '12. Exercise 3', icon: PenSquare },
        { key: 'reading', name: '13. Reading', icon: BookText },
        { key: 'last_exercise', name: '14. Last Exercise', icon: Trophy },
    ], []);

    useEffect(() => {
        if (!isUserLoading && !isProfileLoading) {
            setIsInitialLoading(false);
        }
    }, [isUserLoading, isProfileLoading]);

    useEffect(() => {
        if (isInitialLoading || hasInitialized.current) return;

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
    }, [isInitialLoading, studentProfile, isAdmin, initialPathData, overrideStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (isInitialLoading || isAdmin || !studentDocRef || overrideStudentId || !hasInitialized.current) return;
        
        const saveTimer = setTimeout(() => {
            const s: Record<string, any> = { lastSelectedTopic: selectedTopic };
            learningPath.forEach(item => { s[item.key] = item.status; });
            updateDocumentNonBlocking(studentDocRef, { 
                [`lessonProgress.${progressStorageVersion}`]: s, 
                [`progress.${mainProgressKey}`]: progressValue 
            });
        }, 1000);
        
        return () => clearTimeout(saveTimer);
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, overrideStudentId]);

    const handleTopicComplete = (completedKey: string) => {
        setLearningPath(current => {
            const newPath = current.map(t => ({ ...t }));
            const idx = newPath.findIndex(t => t.key === completedKey);
            if (idx !== -1 && newPath[idx].status !== 'completed') {
                newPath[idx].status = 'completed';
                if (idx + 1 < newPath.length && newPath[idx + 1].status === 'locked') {
                    newPath[idx + 1].status = 'active';
                    setSelectedTopic(newPath[idx + 1].key);
                    setTimeout(() => toast({ title: "¡Misión desbloqueada!", description: "Has avanzado al siguiente nivel." }), 0);
                }
            }
            return newPath;
        });
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
                            <CardDescription className='font-bold text-foreground'>Sección de aprendizaje preparada.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="py-12 flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
                    <div className='p-10 bg-muted/30 rounded-full animate-pulse'>
                        <topic.icon className='h-24 w-24 text-primary/30' />
                    </div>
                    <div className='space-y-2'>
                        <h3 className='text-4xl font-black uppercase tracking-tighter text-primary'>PROXIMAMENTE</h3>
                        <p className='text-muted-foreground text-xl leading-relaxed'>
                            El búnker de datos de la misión "{topic.name}" se está sincronizando.<br />
                            Pronto tendrás acceso a todos los desafíos interactivos.
                        </p>
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
            {/* Contenido Principal */}
            <div className="md:col-span-9 md:order-1 order-2">
                {renderContent()}
            </div>

            {/* Barra Lateral de Navegación */}
            <div className="md:col-span-3 md:order-2 order-1 text-left">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader className="pb-4 border-b bg-muted/30">
                        <CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-primary" /> Misión 2
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[60vh] overflow-y-auto px-4 py-6 text-foreground">
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
                        </div>
                        <div className="px-6 pb-6 pt-4 border-t">
                            <div className="flex justify-between items-center text-[10px] mb-2 font-black uppercase tracking-widest text-muted-foreground">
                                <span>Avance Clase</span>
                                <span className="text-primary">{progressValue}%</span>
                            </div>
                            <Progress value={progressValue} className="h-1.5 rounded-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}