'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { BookOpen, GraduationCap, CheckCircle, PenSquare, Lock, Loader2, Pencil } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { CreativeWritingExercise } from '@/components/dashboard/creative-writing-exercise';

interface Topic {
    key: string;
    name: string;
    icon: React.ElementType;
    status: 'locked' | 'active' | 'completed';
}

const ICONS = { locked: Lock, active: BookOpen, completed: CheckCircle };

export default function Class7Content() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const progressStorageKey = 'progress_a1_eng_u1_c7_v100_blindado';
    const mainProgressKey = 'progress_a1_eng_unit_1_class_7';

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('grammar');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);
    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'grammar', name: 'Gramática: THE article', icon: GraduationCap, status: 'active' },
        { key: 'grammar2', name: 'A vs AN', icon: GraduationCap, status: 'locked' },
        { key: 'grammar3', name: 'Likes & Dislikes', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: 'Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'create1', name: 'Crea frases', icon: Pencil, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile) return;
        let path = initialLearningPath.map(t => ({...t}));
        let savedST = '';
        if (isAdmin) path.forEach(t => t.status = 'completed');
        else if (studentProfile?.lessonProgress?.[progressStorageKey]) {
            const d = studentProfile.lessonProgress[progressStorageKey];
            path.forEach(t => { if (d[t.key]) t.status = d[t.key]; });
            savedST = d.lastSelectedTopic || '';
        }
        let lastDone = true;
        for(let i=0; i < path.length; i++) { if (lastDone && path[i].status === 'locked') path[i].status = 'active'; lastDone = path[i].status === 'completed'; }
        setLearningPath(path);
        setSelectedTopic(savedST || path.find(p => p.status === 'active')?.key || 'grammar');
        setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading]);

    const progressValue = useMemo(() => {
        const done = learningPath.filter(t => t.status === 'completed').length;
        return learningPath.length > 0 ? Math.round((done / learningPath.length) * 100) : 0;
    }, [learningPath]);

    useEffect(() => {
        if (isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;
        const d: any = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(t => d[t.key] = t.status);
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageKey}`]: d, [`progress.${mainProgressKey}`]: progressValue });
    }, [learningPath, isAdmin, progressValue, studentDocRef, selectedTopic, isInitialLoading]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(curr => {
            const np = curr.map(t => ({ ...t }));
            const idx = np.findIndex(t => t.key === topicToComplete);
            if (idx !== -1 && np[idx].status !== 'completed') {
                np[idx].status = 'completed';
                if (idx + 1 < np.length && np[idx + 1].status === 'locked') {
                    np[idx + 1].status = 'active';
                    setSelectedTopic(np[idx + 1].key);
                }
            }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete]);

    const handleTopicSelect = (key: string) => {
        const t = learningPath.find(it => it.key === key);
        if (!isAdmin && t?.status === 'locked') return;
        setSelectedTopic(key);
        if (['grammar', 'grammar2', 'grammar3'].includes(key)) handleTopicComplete(key);
    };

    const handleTopicComplete = (key: string) => setTopicToComplete(key);

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin" /></div>;
        switch (selectedTopic) {
            case 'grammar': return <Card className="p-6 text-left"><CardTitle>Article: THE</CardTitle><CardContent className="pt-4"><p>THE = El, La, Los, Las. No se usa para generalizar.</p></CardContent><CardFooter><Button onClick={() => handleTopicComplete('grammar')}>Siguiente</Button></CardFooter></Card>;
            case 'grammar2': return <Card className="p-6 text-left"><CardTitle>Indefinite: A / AN</CardTitle><CardContent className="pt-4"><p>A + Consonante. AN + Vocal.</p></CardContent><CardFooter><Button onClick={() => handleTopicComplete('grammar2')}>Siguiente</Button></CardFooter></Card>;
            case 'grammar3': return <Card className="p-6 text-left"><CardTitle>Likes & Dislikes</CardTitle><CardContent className="pt-4"><p>I like cooking / I like to cook.</p></CardContent><CardFooter><Button onClick={() => handleTopicComplete('grammar3')}>Siguiente</Button></CardFooter></Card>;
            case 'ex1': return <SimpleTranslationExercise course="a1" exerciseKey="c7_ex1" onComplete={() => handleTopicComplete('ex1')} />;
            case 'create1': return <CreativeWritingExercise title="Create 1" prompts={[{id:'p1', question: 'What do you like?'}]} onComplete={() => handleTopicComplete('create1')} studentDocRef={studentDocRef} initialData={{}} savePath={`lessonProgress.${progressStorageKey}.create1`} />;
            default: return null;
        }
    };

    return (
        <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
            <div className="md:col-span-3 md:order-2 order-1 text-left">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader><CardTitle>Ruta de Aprendizaje</CardTitle></CardHeader>
                    <CardContent>
                        <nav><ul className="space-y-1">
                            {learningPath.map(item => (
                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer', (item.status === 'locked' && !isAdmin) ? 'text-muted-foreground/50' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-bold')}>
                                    <item.icon className={cn("h-5 w-5", item.status === 'completed' && 'text-green-500')} /><span>{item.name}</span>
                                </li>
                            ))}
                        </ul></nav>
                        <div className="mt-6 pt-6 border-t"><Progress value={progressValue} className="h-1.5" /></div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
