'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    CheckCircle, 
    Loader2, 
    Trophy,
    ArrowRight
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';

// --- DATA & CONFIG ---

const progressStorageVersion = 'progress_a1_eng_u3_c14_v130_blindado';
const mainProgressKey = 'progress_a1_eng_unit_3_class_14';

const vocabularyData = {
    verbs: [
        { spanish: 'DAR', english: 'TO GIVE' }, 
        { spanish: 'IR', english: 'TO GO' }
    ],
    materials: [
        { spanish: 'ORO', english: 'GOLD' }, 
        { spanish: 'PLATA', english: 'SILVER' }
    ]
};

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

// --- MAIN COMPONENT ---

export default function Class14Content() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);
    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const [vocabAnswers, setVocabAnswers] = useState<any>({ verbs: ['', ''], materials: ['', ''] });
    const [vocabValidation, setVocabValidation] = useState<any>({ verbs: ['unchecked', 'unchecked'], materials: ['unchecked', 'unchecked'] });
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary', icon: BookOpen, status: 'active' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'last_ex', name: 'Final Mission', icon: CheckCircle, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile) return;
        
        let path = initialLearningPath.map(t => ({ ...t }));
        let savedST = '';

        if (isAdmin) {
            path.forEach(t => t.status = 'completed');
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const d = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(t => { if (d[t.key]) t.status = d[t.key]; });
            savedST = d.lastSelectedTopic || '';
        }

        // Sequential locking logic
        let lastDone = true;
        for(let i=0; i < path.length; i++) {
            if (lastDone && path[i].status === 'locked') path[i].status = 'active';
            lastDone = path[i].status === 'completed';
        }

        setLearningPath(path);
        setSelectedTopic(savedST || path.find(p => p.status === 'active')?.key || path[0].key);
        setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;
        const s: any = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(t => s[t.key] = t.status);
        
        const currentSaved = studentProfile?.lessonProgress?.[progressStorageVersion];
        if (JSON.stringify(s) !== JSON.stringify(currentSaved)) {
            updateDocumentNonBlocking(studentDocRef, { 
                [`lessonProgress.${progressStorageVersion}`]: s, 
                [`progress.${mainProgressKey}`]: progressValue 
            });
        }
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, isAdmin, progressValue, studentDocRef, selectedTopic, isInitialLoading, studentProfile]);

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
                    setTimeout(() => toast({ title: "¡Siguiente misión desbloqueada!" }), 0);
                }
            }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const t = learningPath.find(it => it.key === topicKey);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
    };

    const handleCheckVocab = () => {
        let okCount = 0;
        const nv: any = { verbs: [], materials: [] };
        
        vocabularyData.verbs.forEach((v, i) => {
            const res = v.english.toUpperCase() === (vocabAnswers.verbs[i] || '').trim().toUpperCase();
            if (res) okCount++;
            nv.verbs.push(res ? 'correct' : 'incorrect');
        });

        vocabularyData.materials.forEach((v, i) => {
            const res = v.english.toUpperCase() === (vocabAnswers.materials[i] || '').trim().toUpperCase();
            if (res) okCount++;
            nv.materials.push(res ? 'correct' : 'incorrect');
        });

        setVocabValidation(nv);
        if (okCount > 0) {
            setCanAdvanceVocab(true);
            toast({ title: "¡Progreso detectado!", description: "Has acertado al menos un término. Ya puedes avanzar." });
        } else {
            toast({ variant: 'destructive', title: "Sigue intentando" });
        }
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left">
                        <CardHeader>
                            <CardTitle>Vocabulary</CardTitle>
                            <CardDescription>Traduce los verbos y materiales básicos al inglés.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <h4 className="font-bold text-primary border-b pb-1 uppercase tracking-tight">Verbos</h4>
                                <div className="grid grid-cols-2 gap-2 text-base max-w-md">
                                    <div className="font-bold p-2 bg-muted rounded">Español</div>
                                    <div className="font-bold p-2 bg-muted rounded">Inglés</div>
                                    {vocabularyData.verbs.map((v, i) => (
                                        <React.Fragment key={i}>
                                            <div className="p-2 border rounded bg-white/5">{v.spanish}</div>
                                            <Input 
                                                value={vocabAnswers.verbs[i]} 
                                                onChange={e => { const n = {...vocabAnswers}; n.verbs[i] = e.target.value; setVocabAnswers(n); setCanAdvanceVocab(false); }} 
                                                className={cn(vocabValidation.verbs[i] === 'correct' ? 'border-green-500 bg-green-50/5' : vocabValidation.verbs[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')}
                                                autoComplete="off"
                                            />
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="font-bold text-primary border-b pb-1 uppercase tracking-tight">Materiales</h4>
                                <div className="grid grid-cols-2 gap-2 text-base max-w-md">
                                    {vocabularyData.materials.map((v, i) => (
                                        <React.Fragment key={i}>
                                            <div className="p-2 border rounded bg-white/5">{v.spanish}</div>
                                            <Input 
                                                value={vocabAnswers.materials[i]} 
                                                onChange={e => { const n = {...vocabAnswers}; n.materials[i] = e.target.value; setVocabAnswers(n); setCanAdvanceVocab(false); }} 
                                                className={cn(vocabValidation.materials[i] === 'correct' ? 'border-green-500 bg-green-50/5' : vocabValidation.materials[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')}
                                                autoComplete="off"
                                            />
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 mt-4">
                            <Button onClick={handleCheckVocab} variant="secondary">Verificar</Button>
                            <Button onClick={() => setSelectedTopic('ex1')} disabled={!canAdvanceVocab && !isAdmin} className="px-8">
                                Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                );
            case 'ex1': 
                return (
                    <div className="space-y-4">
                        <SimpleTranslationExercise exerciseKey="c14_general" course="a1" onComplete={() => setTopicToComplete('ex1')} />
                    </div>
                );
            case 'last_ex': 
                return (
                    <Card className="p-12 text-center shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm animate-in fade-in zoom-in duration-500">
                        <Trophy className="h-24 w-24 mx-auto text-yellow-400 mb-6 animate-bounce" />
                        <h2 className="text-3xl font-black bg-gradient-to-r from-brand-purple to-brand-teal text-transparent bg-clip-text uppercase tracking-tighter">¡Clase 14 Completada!</h2>
                        <p className="text-muted-foreground mt-4 mb-8 text-lg font-medium">Has superado todos los retos de esta lección. ¡Excelente trabajo!</p>
                        <Button onClick={() => setTopicToComplete('last_ex')} className="mt-8 px-16 font-bold h-12 text-lg">Finalizar Clase</Button>
                    </Card>
                );
            default: return null;
        }
    };

    return (
        <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
            <div className="md:col-span-3 md:order-2 order-1 text-left">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader><CardTitle className="text-lg">Ruta Clase 14</CardTitle></CardHeader>
                    <CardContent>
                        <nav><ul className="space-y-1">
                            {learningPath.map(item => (
                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', (item.status === 'locked' && !isAdmin) ? 'text-muted-foreground/50' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-bold')}>
                                    <div className="flex items-center gap-3">
                                        {(item.status === 'completed') ? <CheckCircle className="h-5 w-5 text-green-500" /> : <item.icon className="h-5 w-5" />}
                                        <span>{item.name}</span>
                                    </div>
                                    {(item.status === 'locked' && !isAdmin) && <Lock className="h-4 w-4 text-yellow-500" />}
                                </li>
                            ))}
                        </ul></nav>
                        <div className="mt-6 pt-6 border-t">
                            <div className="flex justify-between items-center text-xs mb-2 text-muted-foreground">
                                <span>Progreso</span>
                                <span className="font-bold text-foreground">{progressValue}%</span>
                            </div>
                            <Progress value={progressValue} className="h-1.5" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

