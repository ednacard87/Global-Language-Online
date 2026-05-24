'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    GraduationCap, 
    CheckCircle, 
    ChevronDown, 
    HelpCircle, 
    Loader2, 
    ArrowRight, 
    Separator,
    BookText 
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Importación de ejercicios específicos
import { GenitiveCaseExercise } from '@/components/kids/exercises/genitive-case-exercise';
import { WhQuestionExercise } from '@/components/kids/exercises/wh-question-exercise';
import { WhQuestionsMainExercise } from '@/components/kids/exercises/wh-questions-main-exercise';
import { FillInTheBlanksExercise } from '@/components/kids/exercises/fill-in-the-blanks';
import { GenitiveSaxonGsExercise } from '@/components/kids/exercises/genitive-saxon-gs-exercise';
import { WhFillInTheBlanksExercise } from '@/components/kids/exercises/wh-fill-in-the-blanks-exercise';
import { WhQuestionsMainExercise3 } from '@/components/kids/exercises/wh-questions-main-exercise-3';

// --- DATA ---

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const progressStorageVersion = 'progress_a1_eng_u1_c4_v110_blindado';
const mainProgressKey = 'progress_a1_eng_unit_1_class_4';

const vocabularyData = {
    basicAdjectives: [
        { spanish: 'ALTO', english: 'TALL' },
        { spanish: 'BAJO', english: 'SHORT' },
        { spanish: 'GRANDE', english: 'BIG' },
        { spanish: 'PEQUEÑO', english: 'SMALL' },
        { spanish: 'JOVEN', english: 'YOUNG' },
        { spanish: 'VIEJO', english: 'OLD' },
        { spanish: 'CARO', english: 'EXPENSIVE' },
        { spanish: 'BARATO', english: 'CHEAP' },
        { spanish: 'INTERESANTE', english: 'INTERESTING' },
        { spanish: 'FEO/A', english: 'UGLY' },
    ],
    basicWords: [
        { spanish: 'ANTES', english: 'BEFORE' },
        { spanish: 'DESPUÉS', english: 'AFTER' },
        { spanish: 'TEMPRANO', english: 'EARLY' },
        { spanish: 'TARDE', english: 'LATE' },
        { spanish: 'HASTA', english: 'UNTIL' },
        { spanish: 'DESDE', english: 'FROM' },
        { spanish: 'ACERCA DE', english: 'ABOUT' },
        { spanish: 'PRONTO', english: 'SOON' },
    ]
};

const whVocabularyExerciseData = [
    { spanish: 'ALTO', english: 'TALL', gapped: 'TA_L' },
    { spanish: 'BAJO', english: 'SHORT', gapped: 'S_ORT' },
    { spanish: 'GRANDE', english: 'BIG', gapped: 'B_G' },
    { spanish: 'PEQUEÑO', english: 'SMALL', gapped: 'SMA_L' },
    { spanish: 'JOVEN', english: 'YOUNG', gapped: 'Y_UNG' },
    { spanish: 'VIEJO', english: 'OLD', gapped: 'O_D' },
    { spanish: 'CARO', english: 'EXPENSIVE', gapped: 'EXP_NSIVE' },
    { spanish: 'BARATO', english: 'CHEAP', gapped: 'CH_AP' },
    { spanish: 'INTERESANTE', english: 'INTERESTING', gapped: 'INT_RESTING' },
    { spanish: 'FEO/A', english: 'UGLY', gapped: 'UG_Y' },
    { spanish: 'ANTES', english: 'BEFORE', gapped: 'BE_ORE' },
    { spanish: 'DESPUÉS', english: 'AFTER', gapped: 'A_TER' },
    { spanish: 'TEMPRANO', english: 'EARLY', gapped: 'EAR_Y' },
    { spanish: 'PRONTO', english: 'SOON', gapped: 'S_ON' },
];

const practiceVocab: Record<string, Record<string, string>> = {
    'who': { "quién": "who", "tía": "aunt", "puerta": "door" },
    'what1': { "qué": "what", "haces": "do", "lees": "read", "bebe": "drink", "metro": "subway" },
    'what2': { "cuál": "what", "favorito": "favorite", "música": "music", "deporte": "sport", "comida": "food" },
    'what-kind-of': { "tipo/clase": "kind/type", "zapatos": "shoes", "ropa": "clothes" },
    'how': { "cómo": "how", "estás": "are you", "esposo": "husband", "ir": "go" },
    'how-adjective': { "alto": "tall", "picante": "spicy", "pequeño": "small", "grande": "big", "sopa": "soup" },
    'how-often': { "que tan seguido": "how often", "gimnasio": "gym", "comes": "eat" },
    'whose': { "de quién": "whose", "sombrilla": "umbrella", "llaves": "keys" },
    'where': { "dónde": "where", "vas": "are going", "libros": "books", "compras": "buy", "carne": "meat" },
    'which': { "cuál": "which", "moto": "motorcycle", "helado": "ice cream", "necesitas": "need", "comprar": "buy" },
    'when': { "cuándo": "when", "cumpleaños": "birthday", "fiesta": "party", "clase": "class" },
    'why': { "por qué": "why", "porque": "because", "triste": "sad", "viaje": "trip", "lejos": "far away" }
};

interface Topic {
    key: string;
    name: string;
    icon: React.ElementType;
    status: 'locked' | 'active' | 'completed';
    subItems?: { key: string; name: string; status: 'locked' | 'active' | 'completed', icon?: React.ElementType }[];
}

// --- COMPONENT ---

export default function Class4Content() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const [userAnswers, setUserAnswers] = useState<{[key: string]: string[]}>({});
    const [validationStatus, setValidationStatus] = useState<{[key: string]: ('correct' | 'incorrect' | 'unchecked')[]}>({});
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);
    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: 'Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'genitivo', name: 'Ejercicio: Genitivo Sajon', icon: PenSquare, status: 'locked' },
        { key: 'wh-questions', name: 'WH QUESTIONS', icon: HelpCircle, status: 'locked' },
        {
            key: 'practice',
            name: 'Practica WH',
            icon: PenSquare,
            status: 'locked',
            subItems: [
                { key: 'who', name: 'Who', icon: PenSquare, status: 'locked' },
                { key: 'what1', name: 'What1', icon: PenSquare, status: 'locked' },
                { key: 'what2', name: 'What2', icon: PenSquare, status: 'locked' },
                { key: 'what-kind-of', name: 'What kind of', icon: PenSquare, status: 'locked' },
                { key: 'how', name: 'How', icon: PenSquare, status: 'locked' },
                { key: 'how-adjective', name: 'How + Adjective', icon: PenSquare, status: 'locked' },
                { key: 'how-often', name: 'How + Often', icon: PenSquare, status: 'locked' },
                { key: 'whose', name: 'Whose', icon: PenSquare, status: 'locked' },
                { key: 'where', name: 'Where', icon: PenSquare, status: 'locked' },
                { key: 'which', name: 'Which', icon: PenSquare, status: 'locked' },
                { key: 'when', name: 'When', icon: PenSquare, status: 'locked' },
                { key: 'why', name: 'Why', icon: PenSquare, status: 'locked' },
            ],
        },
        { key: 'ejercicio-wh', name: 'Ejercicios Wh Questions', icon: PenSquare, status: 'locked' },
        { key: 'vocabulario-wh', name: 'Vocabulario Wh', icon: BookOpen, status: 'locked' },
        { key: 'ejercicio-gs', name: 'Ejercicio G.S', icon: PenSquare, status: 'locked' },
        { key: 'ejercicio2-wh', name: 'Ejercicio2 Wh', icon: PenSquare, status: 'locked' },
        { key: 'ejercicio3-wh', name: 'Ejercicio3 Wh', icon: PenSquare, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile) return;
        let path = initialLearningPath.map(t => ({...t, subItems: t.subItems ? t.subItems.map(s => ({...s})) : undefined}));
        let savedST = '';
        if (isAdmin) {
            path.forEach(item => { item.status = 'completed'; if (item.subItems) item.subItems.forEach(s => s.status = 'completed'); });
        } else if(studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const d = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => {
                if (d[item.key]) item.status = d[item.key];
                if (item.subItems && d.subItems?.[item.key]) {
                    item.subItems.forEach(s => { if (d.subItems[item.key][s.key]) s.status = d.subItems[item.key][s.key]; });
                }
            });
            savedST = d.lastSelectedTopic || '';
        }

        let lastDone = true;
        for(let i=0; i < path.length; i++) {
            if (lastDone && path[i].status === 'locked') {
                path[i].status = 'active';
                if (path[i].subItems) path[i].subItems[0].status = 'active';
            }
            lastDone = path[i].status === 'completed';
            if (path[i].subItems) {
                let allDone = true; let lastSubDone = true;
                for(let j=0; j < path[i].subItems.length; j++) {
                    if (lastSubDone && path[i].subItems[j].status === 'locked') path[i].subItems[j].status = 'active';
                    lastSubDone = path[i].subItems[j].status === 'completed';
                    if (!lastSubDone) allDone = false;
                }
                lastDone = allDone;
            }
        }
        setLearningPath(path);
        setSelectedTopic(savedST || path.find(p => p.status === 'active')?.key || path.flatMap(p => p.subItems || []).find(sp => sp?.status === 'active')?.key || 'vocabulary');

        const newAnswers: any = {}; const newValidation: any = {};
        for (const cat in vocabularyData) {
            newAnswers[cat] = Array((vocabularyData as any)[cat].length).fill('');
            newValidation[cat] = Array((vocabularyData as any)[cat].length).fill('unchecked');
        }
        setUserAnswers(newAnswers); setValidationStatus(newValidation);
        setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        let total = 0; let done = 0;
        learningPath.forEach(t => {
            if(t.subItems) { total += t.subItems.length; done += t.subItems.filter(st => st.status === 'completed').length; }
            else { total++; if (t.status === 'completed') done++; }
        });
        return total > 0 ? Math.round((done / total) * 100) : 0;
    }, [learningPath]);

    useEffect(() => {
        if (isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;
        const data: any = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => {
            data[item.key] = item.status;
            if (item.subItems) {
                if (!data.subItems) data.subItems = {};
                data.subItems[item.key] = {};
                item.subItems.forEach(sub => { data.subItems[item.key][sub.key] = sub.status; });
            }
        });
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageKey}`]: data, [`progress.${mainProgressKey}`]: progressValue });
    }, [learningPath, isAdmin, progressValue, studentDocRef, selectedTopic, isInitialLoading]);

    const handleTopicComplete = useCallback((completedKey: string) => setTopicToComplete(completedKey), []);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(currentPath => {
            let win = false; let nextToSel: string | null = null;
            const newP = currentPath.map(t => ({ ...t, subItems: t.subItems ? t.subItems.map(s => ({ ...s })) : undefined }));
            let found = false;
            for (let i = 0; i < newP.length && !found; i++) {
                const curT = newP[i];
                if (curT.key === topicToComplete) {
                    if (curT.status !== 'completed') curT.status = 'completed';
                    if (i + 1 < newP.length && newP[i + 1].status === 'locked') {
                        const n = newP[i + 1]; n.status = 'active'; win = true; nextToSel = n.subItems?.[0]?.key || n.key;
                        if (n.subItems?.[0]) n.subItems[0].status = 'active';
                    }
                    found = true;
                } else if (curT.subItems) {
                    const subIdx = curT.subItems.findIndex((sub: any) => sub.key === topicToComplete);
                    if (subIdx !== -1) {
                        if (curT.subItems[subIdx].status !== 'completed') curT.subItems[subIdx].status = 'completed';
                        const nextSubIdx = subIdx + 1;
                        if (nextSubIdx < newP[i].subItems!.length && newP[i].subItems![nextSubIdx].status === 'locked') {
                            newP[i].subItems![nextSubIdx].status = 'active'; nextToSel = newP[i].subItems![nextSubIdx].key; win = true;
                        } else if (newP[i].subItems!.every((sub: any) => sub.status === 'completed')) {
                            if (curT.status !== 'completed') curT.status = 'completed';
                            if (i + 1 < newP.length && newP[i + 1].status === 'locked') {
                                const n = newP[i + 1]; n.status = 'active'; win = true; nextToSel = n.subItems?.[0]?.key || n.key;
                                if (n.subItems?.[0]) n.subItems[0].status = 'active';
                            }
                        }
                        found = true;
                    }
                }
            }
            if (win) setTimeout(() => toast({ title: "¡Siguiente tema desbloqueado!" }), 0);
            if (nextToSel) { const n = nextToSel; setTimeout(() => setSelectedTopic(n), 0); }
            return newP;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const mainT = learningPath.find(t => t.key === topicKey || t.subItems?.some(st => st.key === topicKey));
        const subT = mainT?.subItems?.find(st => st.key === topicKey);
        if (!isAdmin && ((subT && subT.status === 'locked') || (!subT && mainT?.status === 'locked'))) { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (['grammar', 'wh-questions'].includes(topicKey)) handleTopicComplete(topicKey);
    };

    const handleCheckVocab = () => {
        let ok = false; const nv: any = {};
        for (const cat in vocabularyData) {
            nv[cat] = (vocabularyData as any)[cat].map((item: any, idx: number) => {
                const res = (userAnswers[cat][idx] || '').trim().toLowerCase() === item.english.toLowerCase();
                if (res) ok = true; return res ? 'correct' : 'incorrect';
            });
        }
        setValidationStatus(nv); if (ok) setCanAdvanceVocab(true);
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left">
                        <CardHeader><CardTitle>Vocabulario Clase 4</CardTitle></CardHeader>
                        <CardContent>
                            <Accordion type="multiple" defaultValue={['basicAdjectives', 'basicWords']}>
                                {Object.entries(vocabularyData).map(([cat, items]) => (
                                    <AccordionItem key={cat} value={cat}>
                                        <AccordionTrigger className="text-lg font-bold capitalize">{cat === 'basicAdjectives' ? 'Adjetivos' : 'Palabras Básicas'}</AccordionTrigger>
                                        <AccordionContent className="grid grid-cols-2 gap-2">
                                            {items.map((item, i) => (<React.Fragment key={i}><div className="p-3 border rounded bg-muted/10">{item.spanish}</div><Input value={userAnswers[cat][i]} onChange={e => { const na = {...userAnswers}; na[cat][i] = e.target.value; setUserAnswers(na); setCanAdvanceVocab(false); }} className={cn(validationStatus[cat]?.[i] === 'correct' ? 'border-green-500 bg-green-50/5' : validationStatus[cat]?.[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} /></React.Fragment>))}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6"><Button onClick={handleCheckVocab}>Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <div className="space-y-6 text-left">
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 text-black dark:text-white">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">Genitivo Sajón ('s)</CardTitle></CardHeader>
                            <CardContent className="space-y-6 text-lg font-bold">
                                <div className="p-6 bg-white/10 rounded-2xl border">
                                    <p className="text-primary uppercase">1 - Regla General (Singular)</p>
                                    <p className="mt-2">POSEEDOR + 'S + POSESIÓN</p>
                                    <p className="font-mono text-base italic text-muted-foreground mt-1">Example: Maria's house / My dad's car</p>
                                </div>
                                <div className="p-6 bg-white/10 rounded-2xl border">
                                    <p className="text-primary uppercase">2 - Plurales terminados en "S"</p>
                                    <p className="mt-2">POSEEDOR + ' + POSESIÓN</p>
                                    <p className="font-mono text-base italic text-muted-foreground mt-1">Example: My parents' house / The girls' school</p>
                                </div>
                                <div className="p-6 bg-destructive/10 rounded-2xl border-2 border-dashed border-destructive/20 text-center">
                                    <p className="text-destructive uppercase font-black">Nota: No se usa para objetos.</p>
                                    <p className="font-mono text-base text-muted-foreground">La puerta del carro &rarr; The door of the car</p>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center pt-2 pb-6"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-12">Entendido</Button></CardFooter>
                        </Card>
                    </div>
                );
            case 'genitivo': return <GenitiveCaseExercise onComplete={() => handleTopicComplete('genitivo')} />;
            case 'wh-questions':
                return (
                    <div className="space-y-6 text-left text-black dark:text-white">
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">WH Questions (Interrogativos)</CardTitle></CardHeader>
                            <CardContent className="space-y-4 text-lg font-bold">
                                <div className="p-4 border rounded bg-white/5"><p>WHO (Quién) / WHAT (Qué-Cuál) / WHERE (Dónde) / WHEN (Cuándo) / WHY (Por qué) / HOW (Cómo)</p></div>
                                <Separator />
                                <div className="space-y-2">
                                    <p className="text-primary">ESTRUCTURA CON TO BE:</p>
                                    <p className="font-mono text-base bg-white/5 p-3 rounded">WH + TO BE + PRONOUN + COMPLEMENT?</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-primary">ESTRUCTURA CON DO/DOES:</p>
                                    <p className="font-mono text-base bg-white/5 p-3 rounded">WH + DO/DOES + PRONOUN + VERB + COMPLEMENT?</p>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center pb-6"><Button onClick={() => handleTopicComplete('wh-questions')} size="lg" className="px-12">Continuar</Button></CardFooter>
                        </Card>
                    </div>
                );
            case 'ejercicio-wh': return <WhQuestionsMainExercise onComplete={() => handleTopicComplete('ejercicio-wh')} />;
            case 'vocabulario-wh': return <FillInTheBlanksExercise data={whVocabularyExerciseData} onComplete={() => handleTopicComplete('vocabulario-wh')} title="Vocabulario Wh" />;
            case 'ejercicio-gs': return <GenitiveSaxonGsExercise onComplete={() => handleTopicComplete('ejercicio-gs')} />;
            case 'ejercicio2-wh': return <WhFillInTheBlanksExercise onComplete={() => handleTopicComplete('ejercicio2-wh')} />;
            case 'ejercicio3-wh': return <WhQuestionsMainExercise3 onComplete={() => handleTopicComplete('ejercicio3-wh')} />;
            default:
                if (Object.keys(practiceVocab).includes(selectedTopic)) {
                    return <WhQuestionExercise exerciseName={topic?.name || ''} onComplete={() => handleTopicComplete(selectedTopic)} vocabulary={practiceVocab[selectedTopic]} />;
                }
                return null;
        }
    };

    return (
        <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
            <div className="md:col-span-3 md:order-2 order-1 text-left">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader><CardTitle>Aventura Clase 4</CardTitle></CardHeader>
                    <CardContent>
                        <nav><ul className="space-y-1">
                            {learningPath.map(item => (
                                <li key={item.key}>
                                    {!item.subItems ? (
                                        <div onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', (item.status === 'locked' && !isAdmin) ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-bold')}>
                                            <div className="flex items-center gap-3">{(item.status === 'completed') ? <CheckCircle className="h-5 w-5 text-green-500" /> : <item.icon className="h-5 w-5" />}<span>{item.name}</span></div>
                                        </div>
                                    ) : (
                                        <Collapsible defaultOpen={selectedTopic === item.key || item.subItems.some(si => si.key === selectedTopic)}>
                                            <CollapsibleTrigger className="w-full">
                                                <div className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors w-full cursor-pointer text-foreground', (item.status === 'locked' && !isAdmin) ? 'text-muted-foreground/50' : 'hover:bg-muted', (selectedTopic === item.key || item.subItems.some(si => si.key === selectedTopic)) && 'bg-muted text-primary font-bold')}>
                                                    <div className="flex items-center gap-3"><item.icon className="h-5 w-5" /><span>{item.name}</span></div>
                                                    <ChevronDown className="h-4 w-4" />
                                                </div>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent><ul className="pl-8 pt-1 space-y-1">{item.subItems.map(sub => {
                                                const subL = sub.status === 'locked' && !isAdmin;
                                                const SubI = ICONS_CONFIG[sub.status] || PenSquare;
                                                return (
                                                    <li key={sub.key} onClick={() => handleTopicSelect(sub.key)} className={cn('flex items-center gap-3 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer text-foreground', subL ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === sub.key && 'bg-muted text-primary font-bold')}>
                                                        <SubI className={cn("h-4 w-4", sub.status === 'completed' && 'text-green-500')} /><span>{sub.name}</span>
                                                    </li>
                                                )
                                            })}</ul></CollapsibleContent>
                                        </Collapsible>
                                    )}
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

