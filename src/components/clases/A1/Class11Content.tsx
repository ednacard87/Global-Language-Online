'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, Fragment } from 'react';
import Link from 'next/link';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
    CardDescription, 
    CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    GraduationCap, 
    CheckCircle, 
    Loader2, 
    Users,
    ArrowRight,
    ArrowLeft,
    Check,
    X,
    BookText,
    MessageSquare,
    Gamepad2,
    Star,
    ChevronDown,
    Trophy,
    Pencil,
    Info,
    Globe
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { SentenceCompletionExercise, type CompletionPrompt } from '@/components/kids/exercises/sentence-completion-exercise';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { LargeTextTranslation } from '@/components/dashboard/large-text-translation';
import { VerbVocabularyExercise } from '@/components/kids/exercises/verb-vocabulary';
import { DashboardHeader } from '@/components/dashboard/header';
import { Footer } from '@/components/footer';

// --- DATA & CONFIG ---

const progressStorageVersion = 'progress_a1_eng_u3_c11_v1000_final_stable';
const mainProgressKey = 'progress_a1_eng_unit_3_class_11';

const familyVocabularyData = {
    nuclear: [
        { spanish: 'PADRE', english: ['FATHER'] },
        { spanish: 'MADRE', english: ['MOTHER'] },
        { spanish: 'PADRES', english: ['PARENTS'] },
        { spanish: 'HIJO', english: ['SON'] },
        { spanish: 'HIJA', english: ['DAUGHTER'] },
        { spanish: 'HERMANO', english: ['BROTHER'] },
        { spanish: 'HERMANA', english: ['SISTER'] },
        { spanish: 'PARIENTES', english: ['RELATIVES'] },
        { spanish: 'HIJO ÚNICO', english: ['ONLY CHILD'] },
    ],
    extended: [
        { spanish: 'TÍA', english: ['AUNT'] },
        { spanish: 'TÍO', english: ['UNCLE'] },
        { spanish: 'PRIMO / PRIMA', english: ['COUSIN'] },
        { spanish: 'ABUELO', english: ['GRANDFATHER', 'GRANDPA'] },
        { spanish: 'ABUELA', english: ['GRANDMAMA', 'GRANDMOTHER', 'GRANDMA'] },
        { spanish: 'ABUELOS', english: ['GRANDPARENTS'] },
        { spanish: 'SOBRINO', english: ['NEPHEW'] },
        { spanish: 'SOBRINA', english: ['NIECE'] },
        { spanish: 'NIETOS (EN GENERAL)', english: ['GRANDCHILDREN'] },
        { spanish: 'NIETA', english: ['GRANDDAUGHTER'] },
        { spanish: 'NIETO', english: ['GRANDSON'] },
    ],
    inLaws: [
        { spanish: 'CUÑADO', english: ['BROTHER IN LAW', 'BROTHER-IN-LAW'] },
        { spanish: 'CUÑADA', english: ['SISTER IN LAW', 'SISTER-IN-LAW'] },
        { spanish: 'SUEGRO', english: ['FATHER IN LAW', 'FATHER-IN-LAW'] },
        { spanish: 'SUEGRA', english: ['MOTHER IN LAW', 'MOTHER-IN-LAW'] },
    ],
    stepFamily: [
        { spanish: 'HIJASTRO', english: ['STEPSON'] },
        { spanish: 'HIJASTRA', english: ['STEPDAUGHTER'] },
        { spanish: 'PADRASTRO', english: ['STEPFATHER'] },
        { spanish: 'MADRASTRA', english: ['STEPMOTHER'] },
    ],
    partners: [
        { spanish: 'ESPOSO', english: ['HUSBAND'] },
        { spanish: 'ESPOSA', english: ['WIFE'] },
        { spanish: 'NOVIO', english: ['BOYFRIEND'] },
        { spanish: 'NOVIA', english: ['GIRLFRIEND'] },
        { spanish: 'PAREJA', english: ['COUPLE'] },
    ]
};

const objectPronounsList = [
    { subject: 'I', subjectEs: '(YO)', object: 'ME', objectEs: '(A MI, CONMIGO)' },
    { subject: 'YOU', subjectEs: '(TU)', object: 'YOU', objectEs: '(A TI, CONTIGO)' },
    { subject: 'HE', subjectEs: '(EL)', object: 'HIM', objectEs: '(A EL, CON EL)' },
    { subject: 'SHE', subjectEs: '(ELLA)', object: 'HER', objectEs: '(A ELLA, CON ELLA)' },
    { subject: 'IT', subjectEs: '(ESTO)', object: 'IT', objectEs: '(A ESO, CON ESO)' },
    { subject: 'WE', subjectEs: '(NOSOTROS)', object: 'US', objectEs: '(A NOSOTROS, CON NOSOTROS)' },
    { subject: 'THEY', subjectEs: '(ELLOS)', object: 'THEM', objectEs: '(A ELLOS, CON ELLOS)' },
];

const prepositionsData = [
    { es: 'CON', en: 'WITH' },
    { es: 'SIN', en: 'WITHOUT' },
    { es: 'CONTRA', en: 'AGAINST' },
    { es: 'DE', en: 'OF' },
    { es: 'DESDE', en: 'FROM' },
    { es: 'EN', en: 'IN' },
    { es: 'ENTRE', en: 'BETWEEN' },
    { es: 'HASTA', en: 'UNTIL' },
    { es: 'POR/ PARA', en: 'FOR' },
    { es: 'SOBRE', en: 'ON' },
];

const examplesPhrases = [
    { spanish: "ella llama a su novio todos los dias - ella lo llama todos los dias", answers: ["she calls her boyfriend every day - she calls him every day"] },
    { spanish: "el regalo es para ellos", answers: ["the gift is for them", "the present is for them"] },
    { spanish: "viajas con ella?", answers: ["do you travel with her?"] },
    { spanish: "ella esta con ellos?", answers: ["is she with them?"] },
];

const ex1Vocab = { "quizás": "maybe", "próxima": "next", "guitarra": "guitar", "iglesia": "church", "juegos de mesa": "board games", "bufanda": "scarf", "sombrilla": "umbrella", "morada": "purple", "guantes": "gloves", "botas": "boots", "grises": "gray/grey", "cuero": "leather" };

const ex2Data: CompletionPrompt[] = [
    { parts: ["I LOVE MY MOTHER. I CALL ", " EVERY DAY."], answers: ["HER"] },
    { parts: ["WHERE IS MY BOOK? I CAN'T FIND ", "."], answers: ["IT"] },
    { parts: ["WE ARE LOST. CAN YOU HELP ", "?"], answers: ["US"] },
    { parts: ["I DON'T KNOW THAT MAN. DO YOU KNOW ", "?"], answers: ["HIM"] },
    { parts: ["MY FRIENDS ARE AT THE PARK. I AM GOING WITH ", "."], answers: ["THEM"] },
    { parts: ["THIS BAG IS HEAVY. CAN YOU CARRY ", " FOR ME?"], answers: ["IT"] },
    { parts: ["I HATE MY JOB, I WANT TO QUIT ", ""], answers: ["IT"] },
    { parts: ["MY PARENTS ARE REALLY SAD, I DON’T KNOW WHAT TO DO WITH ", ""], answers: ["THEM"] },
    { parts: ["SHE LIKES HER HOUSE, BUT SHE IS GOING TO SELL ", ""], answers: ["IT"] },
    { parts: ["MY BROTHER IS TOO SMART, I NEVER HELP ", " WITH HOMEWORK"], answers: ["HIM"] },
    { parts: ["WE ARE GOOD STUDENTS, BECAUSE THE TEACHER ALWAYS MOTIVATES ", ""], answers: ["US"] },
    { parts: ["SHE DOESN’T SEE HER FRIENDS AT THE PARTY, SO SHE CALLS ", ""], answers: ["THEM"] },
    { parts: ["THEY INVITE ", " TO THEIR HOUSE."], answers: ["ME"] },
    { parts: ["I KNOW THEY ARE EXCITED, THEY HAVEN’T SEEN ", " FOR YEARS."], answers: ["ME"] },
];

const ex3Vocab = { "canal": "canal", "caro": "expensive", "tocineta": "bacon", "lechuga": "lettuce", "chaqueta": "jacket", "por favor": "please", "mientras": "while", "ejercicio": "exercise", "espera": "waits", "padre": "father", "diariamente": "daily", "bebé": "baby", "besa": "kisses", "baila": "dances", "cumpleaños": "birthday" };

const ex4Vocab = { "hablar": "speak", "trabajo": "work", "nadar": "swim", "conmigo": "me", "canta": "sings", "hermano": "brother", "vas": "go", "gustar": "like", "chaqueta": "jacket", "casa": "house", "finca": "farm", "mío/tuyo": "mine/yours", "33 años": "33 years old", "supermercado": "supermarket", "guitarra": "guitar", "suyo/mío": "theirs/mine", "llamar": "call" };
const ex5Vocab = { "verlo": "see him", "tenerla": "have it", "olor": "smell", "atraso": "delay", "entrega": "delivery", "repetirlo": "repeat it" };
const ex6Vocab = { "enojados": "angry", "sótano": "basement", "ayudan": "help", "proyecto": "project", "platos": "dishes", "hace un año": "a year ago", "sola": "alone" };

const finalVocabList = Object.values(familyVocabularyData).flat();

interface TopicType {
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

// --- MAIN COMPONENT ---

export default function Class11Content() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);
    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);

    const [learningPath, setLearningPath] = useState<TopicType[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const [vocabAnswers, setVocabAnswers] = useState<Record<string, string[]>>({});
    const [vocabValidation, setVocabValidation] = useState<Record<string, string[]>>({});
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const [writingLines, setWritingLines] = useState<string[]>(['', '', '', '']);
    const [writingGrades, setWritingGrades] = useState<Record<number, 'correct' | 'incorrect' | null>>({});

    const initialLearningPath = useMemo((): TopicType[] => [
        { key: 'vocabulary', name: 'Vocabulary (Family)', icon: Users, status: 'active' },
        { key: 'grammar', name: 'Grammar: Object Pronouns', icon: GraduationCap, status: 'locked' },
        { key: 'examples', name: 'Examples', icon: Star, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'create1', name: 'Create 1', icon: Pencil, status: 'locked' },
        { key: 'ex2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'grammar2', name: 'Grammar 2', icon: GraduationCap, status: 'locked' },
        { key: 'ex3', name: 'Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'ex4', name: 'Exercise 4', icon: PenSquare, status: 'locked' },
        { key: 'vocab_memory', name: 'Vocabulary (Memory)', icon: Gamepad2, status: 'locked' },
        { key: 'ex5', name: 'Exercise 5', icon: PenSquare, status: 'locked' },
        { key: 'ex6', name: 'Exercise 6', icon: PenSquare, status: 'locked' },
        { key: 'final_vocab', name: 'Final Vocabulary', icon: BookOpen, status: 'locked' },
    ], []);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    const handleTopicSelect = (topicKey: string) => {
        const t = learningPath.find(it => it.key === topicKey);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (['grammar', 'grammar2', 'examples'].includes(topicKey)) handleTopicComplete(topicKey);
    };

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
        
        let path = initialLearningPath.map(t => ({ ...t }));
        let savedST = '';

        if (isAdmin) {
            path.forEach(t => t.status = 'completed');
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const d = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(t => { if (d[t.key]) t.status = d[t.key]; });
            savedST = d.lastSelectedTopic || '';
            if (d.create1Data) setWritingLines(d.create1Data);
            if (d.create1Grades) setWritingGrades(d.create1Grades);
        }

        let lastDone = true;
        for(let i=0; i < path.length; i++) {
            if (lastDone && path[i].status === 'locked') path[i].status = 'active';
            lastDone = path[i].status === 'completed';
        }

        setLearningPath(path);
        setSelectedTopic(savedST || path.find(p => p.status === 'active')?.key || path[0].key);
        
        const initialAnswers: Record<string, string[]> = {};
        const initialValidation: Record<string, string[]> = {};
        Object.entries(familyVocabularyData).forEach(([category, items]) => {
            initialAnswers[category] = Array(items.length).fill('');
            initialValidation[category] = Array(items.length).fill('unchecked');
        });
        setVocabAnswers(initialAnswers);
        setVocabValidation(initialValidation);
        
        setInitialLoadComplete(true);
        setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    const isFinalVocabFinished = useMemo(() => {
        return learningPath.find(t => t.key === 'final_vocab')?.status === 'completed';
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;
        const s: any = { 
            lastSelectedTopic: selectedTopic,
            create1Data: writingLines,
            create1Grades: writingGrades
        };
        learningPath.forEach(t => s[t.key] = t.status);
        
        const currentSaved = studentProfile?.lessonProgress?.[progressStorageVersion];
        if (JSON.stringify(s) !== JSON.stringify(currentSaved)) {
            updateDocumentNonBlocking(studentDocRef, { 
                [`lessonProgress.${progressStorageVersion}`]: s, 
                [`progress.${mainProgressKey}`]: progressValue 
            });
        }
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, isAdmin, progressValue, studentDocRef, selectedTopic, isInitialLoading, studentProfile, writingLines, writingGrades, initialLoadComplete]);

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

    const handleVocabInputChange = (category: string, index: number, value: string) => {
        const newAnswers = { ...vocabAnswers };
        newAnswers[category][index] = value;
        setVocabAnswers(newAnswers);

        const newValidation = { ...vocabValidation };
        newValidation[category][index] = 'unchecked';
        setVocabValidation(newValidation);
        setCanAdvanceVocab(false);
    };

    const handleVocabCheck = () => {
        let totalCorrect = 0;
        const newValidation: Record<string, string[]> = {};
        
        Object.entries(familyVocabularyData).forEach(([category, items]) => {
            newValidation[category] = items.map((v, i) => {
                const res = v.english.some(e => e.toUpperCase() === (vocabAnswers[category][i] || '').trim().toUpperCase());
                if (res) totalCorrect++;
                return res ? 'correct' : 'incorrect';
            });
        });
        
        setVocabValidation(newValidation);
        if (totalCorrect >= 10) {
            setCanAdvanceVocab(true);
            toast({ title: "¡Excelente!", description: "Has dominado lo suficiente para avanzar." });
        } else {
            toast({ variant: 'destructive', title: "Sigue intentando", description: `Necesitas al menos 10 correctas. Llevas ${totalCorrect}.` });
        }
    };

    const handleWritingLineChange = (index: number, value: string) => {
        const newLines = [...writingLines];
        newLines[index] = value;
        setWritingLines(newLines);
    };

    const handleToggleWritingGrade = (index: number, type: 'correct' | 'incorrect') => {
        if (!isAdmin) return;
        const newGrades = { ...writingGrades };
        newGrades[index] = newGrades[index] === type ? null : type;
        setWritingGrades(newGrades);
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left text-foreground">
                        <CardHeader>
                            <CardTitle>Vocabulary: The Family</CardTitle>
                            <CardDescription>Traduce los miembros de la familia al inglés. Desbloquea la misión con al menos 10 aciertos.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="multiple" defaultValue={['nuclear', 'extended']} className="w-full">
                                {Object.entries(familyVocabularyData).map(([catKey, items]) => (
                                    <AccordionItem key={catKey} value={catKey} className="border-b border-border/50">
                                        <AccordionTrigger className="capitalize font-black text-primary text-base">
                                            {catKey === 'nuclear' ? 'Familia Nuclear' : 
                                             catKey === 'extended' ? 'Parientes' : 
                                             catKey === 'inLaws' ? 'Políticos' : 
                                             catKey === 'stepFamily' ? 'Hijastros/Padrastros' : 'Parejas'}
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="grid grid-cols-2 gap-4 text-base p-2">
                                                {items.map((v, i) => (
                                                    <Fragment key={i}>
                                                        <div className="p-2 border rounded bg-white/5 font-bold flex items-center text-sm">{v.spanish}</div>
                                                        <Input 
                                                            value={vocabAnswers[catKey]?.[i] || ''} 
                                                            onChange={e => handleVocabInputChange(catKey, i, e.target.value)} 
                                                            className={cn("h-10 text-sm font-mono uppercase", vocabValidation[catKey]?.[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabValidation[catKey]?.[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} 
                                                            autoComplete="off"
                                                            placeholder="..."
                                                        />
                                                    </Fragment>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 mt-4">
                            <Button onClick={handleVocabCheck} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar <ArrowRight className="ml-2 h-4 w-4" /></Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <div className="space-y-6 text-left text-foreground">
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-xl font-bold text-primary uppercase">LOS PRONOMBRES OBJETO: (OBJECT PRONOUNS)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-border/50">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="font-black text-xs uppercase">Pronombres Personales</TableHead>
                                                <TableHead className="font-black text-xs uppercase text-primary">Object Pronouns</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {objectPronounsList.map((row, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">
                                                        <span className="font-bold">{row.subject}</span> <span className="text-xs text-muted-foreground ml-1">{row.subjectEs}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-black text-primary text-lg">{row.object}</span> <span className="text-xs text-muted-foreground ml-1">{row.objectEs}</span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="p-6 bg-primary/5 rounded-[2rem] border-2 border-dashed border-primary/20">
                                    <p className="text-lg font-bold italic">"Son pronombres que reciben la acción del verbo. Van después de un verbo o de una preposición."</p>
                                    <div className="mt-4 p-3 bg-background rounded-xl border text-center font-mono text-xl font-black text-primary">I LOVE YOU</div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                            <CardHeader><CardTitle className="text-xl font-bold text-brand-purple uppercase">PREPOSITIONS</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                    {prepositionsData.map((p, i) => (
                                        <div key={i} className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-border/50 text-center">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase">{p.es}</p>
                                            <p className="font-bold text-brand-purple">{p.en}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-6 bg-brand-purple/5 rounded-[2rem] border-2 border-dashed border-brand-purple/20 text-foreground">
                                    <p className="text-lg font-bold italic">"NOTA: Cuando los pronombres objeto tengan como significado “CONTIGO”, “CON EL”, “CON ELLA” etc… hay que apoyarlos con la preposición “WITH”."</p>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-16 font-bold h-12 text-white">Entendido</Button></CardFooter>
                        </Card>
                    </div>
                );
            case 'examples':
                return <LargeTextTranslation title="Examples: Translation & Replacement" phrases={examplesPhrases} onComplete={() => handleTopicComplete('examples')} vocabulary={{"novio": "boyfriend", "regalo": "present/gift", "viajas": "travel"}} />;
            case 'ex1':
                return <SimpleTranslationExercise exerciseKey="c11_ex1" course="a1" onComplete={() => handleTopicComplete('ex1')} vocabulary={ex1Vocab} highlightVocabulary={true} />;
            case 'create1':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
                        <CardHeader><CardTitle>Create 1</CardTitle><CardDescription>Inventa 4 frases usando pronombre objeto.</CardDescription></CardHeader>
                        <CardContent className="space-y-6">
                            {writingLines.map((line, idx) => {
                                const status = writingGrades[idx];
                                return (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs font-bold text-muted-foreground uppercase">Frase {idx + 1}</Label>
                                            <div className="flex gap-2">
                                                <Button size="icon" variant="ghost" onClick={() => handleToggleWritingGrade(idx, 'correct')} className={cn("h-8 w-8 rounded-full", status === 'correct' ? "bg-green-500 text-white" : "bg-muted")} disabled={!isAdmin}><Check className="h-4 w-4"/></Button>
                                                <Button size="icon" variant="ghost" onClick={() => handleToggleWritingGrade(idx, 'incorrect')} className={cn("h-8 w-8 rounded-full", status === 'incorrect' ? "bg-red-500 text-white" : "bg-muted")} disabled={!isAdmin}><X className="h-4 w-4"/></Button>
                                            </div>
                                        </div>
                                        <Input value={line} onChange={e => handleWritingLineChange(idx, e.target.value)} className={cn("h-12", status === 'correct' ? 'border-green-500 bg-green-50/5' : status === 'incorrect' ? 'border-red-500 bg-red-50/5' : "")} autoComplete="off" />
                                    </div>
                                )
                            })}
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('create1')} size="lg" className="px-12">Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'ex2':
                return <SentenceCompletionExercise title="Exercise 2" description="Completa con el PRONOMBRE OBJETO correcto." data={ex2Data} onComplete={() => handleTopicComplete('ex2')} />;
            case 'grammar2':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left text-foreground">
                        <CardHeader><CardTitle className="text-xl font-bold text-primary uppercase">CONJUNCIONES BÁSICAS</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl border">
                                <Table>
                                    <TableHeader><TableRow><TableHead>Conjunction</TableHead><TableHead>Purpose</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {[
                                            { c: 'Because', p: 'give a reason' },
                                            { c: 'So', p: 'give a consequence / result' },
                                            { c: 'After / Before', p: 'give the order of events' },
                                            { c: 'Until', p: 'until (deadline)' },
                                            { c: 'But', p: 'give a contrast' },
                                            { c: 'And', p: 'give extra information' },
                                            { c: 'OR', p: 'choice' },
                                            { c: 'IF', p: 'condition' },
                                            { c: 'While', p: 'simultaneous actions' },
                                        ].map((row, idx) => (
                                            <TableRow key={idx}><TableCell className="font-bold text-primary">{row.c}</TableCell><TableCell className="italic">{row.p}</TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="p-4 bg-primary/5 rounded-xl border border-dashed text-sm font-medium">Uso: Las conjunciones unen palabras o frases para crear oraciones más complejas y fluidas.</div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar2')} size="lg">Continuar</Button></CardFooter>
                    </Card>
                );
            case 'ex3':
                return <SimpleTranslationExercise exerciseKey="c11_ex3" course="a1" onComplete={() => handleTopicComplete('ex3')} title="Exercise 3" vocabulary={ex3Vocab} highlightVocabulary={true} />;
            case 'ex4':
                return <SimpleTranslationExercise exerciseKey="c11_ex4" course="a1" onComplete={() => handleTopicComplete('ex4')} vocabulary={ex4Vocab} highlightVocabulary={true} />;
            case 'vocab_memory':
                return <VocabularyMatchingGame data={familyVocabularyData.nuclear.map(v => ({ spanish: v.spanish, english: v.english }))} onComplete={() => handleTopicComplete('vocab_memory')} title="Family Memory" />;
            case 'ex5':
                return <SimpleTranslationExercise exerciseKey="c11_ex5" course="a1" onComplete={() => handleTopicComplete('ex5')} vocabulary={ex5Vocab} highlightVocabulary={true} />;
            case 'ex6':
                return <SimpleTranslationExercise exerciseKey="c11_ex6" course="a1" onComplete={() => handleTopicComplete('ex6')} vocabulary={ex6Vocab} highlightVocabulary={true} />;
            case 'final_vocab':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Final Vocabulary Challenge</CardTitle>
                            {isFinalVocabFinished && (
                                <div className="p-4 text-center animate-in zoom-in duration-500">
                                   <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-2 animate-bounce" />
                                   <h3 className="text-xl font-black text-primary uppercase">¡Misión Cumplida!</h3>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent>
                             <VerbVocabularyExercise data={finalVocabList.map(v => ({ spanish: v.spanish, english: v.english[0] }))} onComplete={() => handleTopicComplete('final_vocab')} />
                        </CardContent>
                    </Card>
                );
            default: return null;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-left text-white">
                        <Link href="/ingles/a1/unit/3" className="hover:underline text-sm font-bold text-primary flex items-center gap-2">
                            <ArrowLeft className='h-4 w-4'/> Volver a la Unidad 3
                        </Link>
                        <h1 className="text-4xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase 11 (A1)</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader><CardTitle className="text-lg uppercase font-black text-primary">Misión</CardTitle></CardHeader>
                                <CardContent>
                                    <nav><ul className="space-y-1">
                                        {learningPath.map(item => (
                                            <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', (!isAdmin && item.status === 'locked') ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-bold')}>
                                                <div className="flex items-center gap-3">{(item.status === 'completed') ? <CheckCircle className="h-5 w-5 text-green-500" /> : <ICONS_MAP.active className="h-5 w-5" />}<span>{item.name}</span></div>
                                            </li>
                                        ))}
                                    </ul></nav>
                                    <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2"><span>Progreso</span><span className="font-bold">{progressValue}%</span></div><Progress value={progressValue} className="h-1.5" /></div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}