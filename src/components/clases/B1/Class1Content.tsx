'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    GraduationCap, 
    CheckCircle, 
    Loader2, 
    ArrowRight,
    Mic,
    Pencil,
    Info,
    ListChecks,
    Check,
    HelpCircle,
    XCircle,
    Globe
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// --- DATA ---

const progressStorageVersion = 'progress_b1_eng_u1_c1_v130_blindado';
const mainProgressKey = 'progress_b1_eng_unit_1_class_1';

const phrasalVerbsData = [
    { spanish: 'LEVANTARSE', english: 'GET UP' },
    { spanish: 'DESPERTARSE', english: 'WAKE UP' },
    { spanish: 'ENCENDER', english: 'TURN ON' },
    { spanish: 'APAGAR', english: 'TURN OFF' },
    { spanish: 'RECOGER', english: 'PICK UP' },
    { spanish: 'BUSCAR', english: 'LOOK FOR' },
    { spanish: 'CUIDAR', english: 'TAKE CARE' },
    { spanish: 'AVERIGUAR', english: 'FIND OUT' },
    { spanish: 'REGRESAR', english: 'COME BACK' },
    { spanish: 'SALIR', english: 'GO OUT' },
    { spanish: 'MAQUILLARSE', english: 'MAKE UP' },
    { spanish: 'SENTARSE', english: 'SIT DOWN' },
];

const exerciseSomeVocab = {
    "unas rosas": "some roses",
    "unos pajaros": "some birds",
    "algo de leche": "some milk",
    "la botella": "the bottle",
    "unas cervezas": "some beers",
    "la nevera": "the fridge",
    "algunos arboles": "some trees",
    "algo de dinero": "some money"
};

const exerciseAnyVocab = {
    "papas": "potatoes",
    "nevera": "fridge / kitchen",
    "torta": "cake",
    "plata": "money",
    "azúcar": "sugar",
    "afuera": "outside"
};

const exerciseMixVocab = {
    "agua": "water",
    "te": "tea",
    "vino": "wine",
    "pan": "bread",
    "casi nunca": "hardly ever",
    "quisieras": "would you like",
    "puedo": "can i"
};

interface Topic {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'completed' | 'active' | 'locked';
}

// --- COMPONENT ---

export default function Class1Content() {
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

    const [phrasalAnswers, setPhrasalAnswers] = useState<string[]>(Array(phrasalVerbsData.length).fill(''));
    const [phrasalValidation, setPhrasalValidation] = useState<any[]>(Array(phrasalVerbsData.length).fill('unchecked'));
    const [canAdvancePhrasal, setCanAdvancePhrasal] = useState(false);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary_phrasal', name: 'Vocabulario: Phrasal Verbs', icon: BookOpen, status: 'active' },
        { key: 'grammar_some', name: 'Gramática: Some', icon: GraduationCap, status: 'locked' },
        { key: 'ex_some', name: 'Ejercicio: Some', icon: PenSquare, status: 'locked' },
        { key: 'grammar_any', name: 'Gramática: Any', icon: GraduationCap, status: 'locked' },
        { key: 'ex_any', name: 'Ejercicio: Any', icon: PenSquare, status: 'locked' },
        { key: 'grammar_2', name: 'Usos Especiales', icon: GraduationCap, status: 'locked' },
        { key: 'ex_mix', name: 'Ejercicio Mix', icon: PenSquare, status: 'locked' },
        { key: 'grammar_indefinite', name: 'Indefinite Pronouns', icon: GraduationCap, status: 'locked' },
        { key: 'rules', name: 'Reglas de Oro', icon: Info, status: 'locked' },
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
                    setTimeout(() => toast({ title: "¡Misión desbloqueada!" }), 0);
                }
            }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const t = learningPath.find(it => it.key === topicKey);
        if (!isAdmin && t?.status === 'locked') return;
        setSelectedTopic(topicKey);
        if (['grammar_some', 'grammar_any', 'grammar_2', 'grammar_indefinite', 'rules'].includes(topicKey)) setTopicToComplete(topicKey);
    };

    const handleCheckPhrasal = () => {
        let okCount = 0;
        const nv = phrasalVerbsData.map((item, idx) => {
            const res = (phrasalAnswers[idx] || '').trim().toUpperCase() === item.english.toUpperCase();
            if (res) okCount++;
            return res ? 'correct' : 'incorrect';
        });
        setPhrasalValidation(nv as any);
        if (okCount > 0) {
            setCanAdvancePhrasal(true);
            toast({ title: "¡Bien hecho!", description: "Has acertado al menos un verbo. Ya puedes avanzar." });
        } else {
            toast({ variant: 'destructive', title: "Sigue intentando" });
        }
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        
        switch (selectedTopic) {
            case 'vocabulary_phrasal':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left">
                        <CardHeader><CardTitle>Phrasal Verbs</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-2 text-base max-w-lg mx-auto">
                                <div className="font-bold p-2 bg-muted rounded">Español</div>
                                <div className="font-bold p-2 bg-muted rounded">Inglés</div>
                                {phrasalVerbsData.map((v, i) => (
                                    <React.Fragment key={i}>
                                        <div className="p-2 border rounded bg-white/5">{v.spanish}</div>
                                        <Input 
                                            value={phrasalAnswers[i]} 
                                            onChange={e => { const na = [...phrasalAnswers]; na[i] = e.target.value; setPhrasalAnswers(na); setCanAdvancePhrasal(false); }} 
                                            className={cn(phrasalValidation[i] === 'correct' ? 'border-green-500 bg-green-50/5' : phrasalValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} 
                                            autoComplete="off"
                                        />
                                    </React.Fragment>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 mt-4">
                            <Button onClick={handleCheckPhrasal} variant="secondary">Verificar</Button>
                            <Button onClick={() => setTopicToComplete('vocabulary_phrasal')} disabled={!canAdvancePhrasal && !isAdmin}>Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar_some':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">USO DE "SOME"</CardTitle></CardHeader>
                        <CardContent className="space-y-6 text-black font-bold text-lg">
                            <p>SOME se usa en frases AFIRMATIVAS (+).</p>
                            <div className="p-6 bg-white/20 rounded-2xl border border-black/10 space-y-4">
                                <div>
                                    <p className="text-primary uppercase tracking-tighter">1. CONTABLES (Plural):</p>
                                    <p>Significa: Unos, unas, algunos, algunas.</p>
                                    <p className="font-mono text-sm italic mt-1 text-slate-700">"There are some books on the table."</p>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-primary uppercase tracking-tighter">2. INCONTABLES (Singular):</p>
                                    <p>Significa: Algo de.</p>
                                    <p className="font-mono text-sm italic mt-1 text-slate-700">"There is some milk in the bottle."</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => setTopicToComplete('grammar_some')} size="lg" className="px-12 font-bold text-white">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'ex_some': return <SimpleTranslationExercise exerciseKey="custom_ex_some" title="Exercise With Some" onComplete={() => setTopicToComplete('ex_some')} vocabulary={exerciseSomeVocab} course="b1" />;
            case 'grammar_any':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">USO DE "ANY"</CardTitle></CardHeader>
                        <CardContent className="space-y-6 text-black font-bold text-lg">
                            <p>ANY se usa en frases NEGATIVAS (-) e INTERROGATIVAS (?).</p>
                            <div className="p-6 bg-white/20 rounded-2xl border border-black/10 space-y-4">
                                <div>
                                    <p className="text-red-600 uppercase tracking-tighter">NEGATIVO (-):</p>
                                    <p>Significa: Ningún, ninguna, nada de.</p>
                                    <p className="font-mono text-sm italic mt-1 text-slate-700">"There aren't any chairs."</p>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-blue-600 uppercase tracking-tighter">INTERROGATIVO (?):</p>
                                    <p>Significa: Algún, alguna, algo de.</p>
                                    <p className="font-mono text-sm italic mt-1 text-slate-700">"Do you have any apples?"</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => setTopicToComplete('grammar_any')} size="lg" className="px-12 font-bold text-white">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'ex_any': return <SimpleTranslationExercise exerciseKey="custom_ex_any" title="Exercise With Any" onComplete={() => setTopicToComplete('ex_any')} vocabulary={exerciseAnyVocab} course="b1" />;
            case 'grammar_2':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left text-black">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">USOS ESPECIALES</CardTitle></CardHeader>
                        <CardContent className="space-y-6 font-bold text-lg">
                            <div className="p-4 border rounded bg-white/10">
                                <p className="text-primary">SOME EN PREGUNTAS (?):</p>
                                <p className="text-base font-normal">Se usa para ofrecer o pedir algo.</p>
                                <p className="text-sm italic font-mono mt-1">"Would you like some tea?" (Ofrecer)</p>
                            </div>
                            <div className="p-4 border rounded bg-white/10">
                                <p className="text-primary">ANY EN AFIRMATIVAS (+):</p>
                                <p className="text-base font-normal">Significa "Cualquiera" o cuando hay palabras negativas como "Never".</p>
                                <p className="text-sm italic font-mono mt-1">"Give me any book." / "I never drink any wine."</p>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => setTopicToComplete('grammar_2')} size="lg" className="px-12 font-bold text-white">Continuar</Button></CardFooter>
                    </Card>
                );
            case 'ex_mix': return <SimpleTranslationExercise exerciseKey="custom_ex_mix" title="Exercise Mix" onComplete={() => setTopicToComplete('ex_mix')} vocabulary={exerciseMixVocab} course="b1" />;
            case 'grammar_indefinite':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left text-black">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">INDEFINITE PRONOUNS</CardTitle></CardHeader>
                        <CardContent className="space-y-6 text-lg font-bold">
                            <p>Combinamos SOME/ANY/NO con BODY/ONE/THING.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 border rounded bg-white/10">
                                    <p className="text-primary">PERSONAS:</p>
                                    <p>Somebody / Someone</p>
                                    <p>Anybody / Anyone</p>
                                    <p>Nobody / No one</p>
                                </div>
                                <div className="p-4 border rounded bg-white/10">
                                    <p className="text-primary">COSAS:</p>
                                    <p>Something</p>
                                    <p>Anything</p>
                                    <p>Nothing</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => setTopicToComplete('grammar_indefinite')} size="lg" className="px-12 font-bold text-white">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'rules':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left text-black">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">GOLDEN RULES</CardTitle></CardHeader>
                        <CardContent className="space-y-6 text-lg font-bold">
                            <div className="p-6 border-2 border-dashed border-destructive/20 bg-destructive/10 rounded-2xl text-center">
                                <p className="text-destructive uppercase font-black">REGLA 1: DOBLE NEGACIÓN</p>
                                <p className="mt-2 text-base font-normal">En inglés NO existe la doble negación. "I don't have nothing" es incorrecto.</p>
                                <p className="mt-2 font-mono text-sm">Correcto: I have nothing / I don't have anything.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => setTopicToComplete('rules')} size="lg" className="px-12 font-bold text-white">He leído todo</Button></CardFooter>
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
                    <CardHeader><CardTitle className="text-lg">Ruta Clase 1 (B1)</CardTitle></CardHeader>
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
                        <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2"><span>Progreso</span><span className="font-bold">{progressValue}%</span></div><Progress value={progressValue} className="h-1.5" /></div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
