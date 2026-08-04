'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, Fragment, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
    History,
    Activity,
    AlertCircle,
    Check,
    X,
    Eye,
    Star,
    ArrowLeft,
    MessageSquare,
    ListChecks
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { Textarea } from '@/components/ui/textarea';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_a2_reflex_pasado_v28_jsx_fix';
const mainProgressKey = 'progress_a2_es_reflexivos_pasado';

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---
const reflexiveVerbsVocab = [
    { en: "TO FALL DOWN", es: "CAERSE" }, { en: "TO FALL ASLEEP", es: "DORMIRSE" },
    { en: "TO GET INJURED", es: "LESIONARSE" }, { en: "TO FORGET", es: "OLVIDARSE" },
    { en: "TO WAKE UP", es: "DESPERTARSE" }, { en: "TO GET UP", es: "LEVANTARSE" },
    { en: "TO SHOWER", es: "DUCHARSE" }, { en: "TO GET DRESSED", es: "VESTIRSE" },
    { en: "TO FEEL", es: "SENTIRSE" }, { en: "TO GO TO BED", es: "ACOSTARSE" },
    { en: "TO GET HURT", es: "LASTIMARSE" }, { en: "TO BREAK (BONE)", es: "ROMPERSE" },
    { en: "TO BURN ONESELF", es: "QUEMARSE" }, { en: "TO CUT ONESELF", es: "CORTARSE" },
    { en: "TO BATHE", es: "BAÑARSE" }, { en: "TO COMB HAIR", es: "PEINARSE" },
    { en: "TO BRUSH TEETH", es: "CEPILLARSE" }, { en: "TO WASH HANDS", es: "LAVARSE" },
    { en: "TO STAY", es: "QUEDARSE" }, { en: "TO MOVE HOUSE", es: "MUDARSE" }
];

const conjugationVerbs = reflexiveVerbsVocab.concat([
    { en: "TO LOOK AT ONESELF", es: "MIRARSE" }, { en: "TO CALL ONESELF", es: "LLAMARSE" },
    { en: "TO SIT DOWN", es: "SENTARSE" }, { en: "TO HAVE FUN", es: "DIVERTIRSE" },
    { en: "TO GET ANGRY", es: "ENOJARSE" }, { en: "TO COMPLAIN", es: "QUEJARSE" },
    { en: "TO WORRY", es: "PREOCUPARSE" }, { en: "TO REALIZE", es: "DARSE CUENTA" },
    { en: "TO FALL IN LOVE", es: "ENAMORARSE" }, { en: "TO GRADUATE", es: "GRADUARSE" }
]);

const ex1RegularData = [
    { en: "I showered this morning.", answer: ["yo me duche esta mañana", "me duche esta mañana"] },
    { en: "You got up early.", answer: ["tu te levantaste temprano", "te levantaste temprano"] },
    { en: "He moved yesterday.", answer: ["el se mudo ayer", "se mudo ayer"] },
    { en: "We stayed at home.", answer: ["nosotros nos quedamos en casa", "nos quedamos en casa"] },
    { en: "They washed their hands.", answer: ["ellos se lavaron las manos", "se lavaron las manos"] },
    { en: "She combed her hair.", answer: ["ella se peino el cabello", "se peino el cabello"] },
    { en: "I brushed my teeth.", answer: ["yo me cepille los dientes", "me cepille los dientes"] },
    { en: "You all bathed in the sea.", answer: ["ustedes se bañaron en el mar", "se bañaron en el mar"] },
    { en: "We woke up at 6.", answer: ["nosotros nos despertamos a las 6", "nos despertamos a las 6"] },
    { en: "She got burned by the sun.", answer: ["ella se quemo con el sol", "se quemo con el sol"] },
    { en: "You cut your finger.", answer: ["tu te cortaste el dedo", "te cortaste el dedo"] },
    { en: "They got married last year.", answer: ["ellos se casaron el año pasado", "se casaron el año pasado"] }
];

const ex2IrregularData = [
    { en: "I fell asleep on the sofa.", answer: ["yo me dormi en el sofa", "me dormi en el sofa"] },
    { en: "He fell asleep during the movie.", answer: ["el se durmio durante la pelicula", "se durmio durante la pelicula"] },
    { en: "You got dressed very elegantly.", answer: ["tu te vestiste muy elegante", "te vestiste muy elegante"] },
    { en: "She got dressed for the party.", answer: ["ella se vistio para la fiesta", "se vistio para la fiesta"] },
    { en: "We felt bad yesterday.", answer: ["nosotros nos sentimos mal ayer", "nos sentimos mal ayer"] },
    { en: "They felt happy.", answer: ["ellos se sintieron felices", "se sintieron felices"] },
    { en: "I had a lot of fun.", answer: ["yo me diverti mucho", "me diverti mucho"] },
    { en: "She had fun in the park.", answer: ["ella se divirtio en el parque", "se divirtio en el parque"] },
    { en: "He fell off the bicycle.", answer: ["el se cayo de la bicicleta", "se cayo de la bicicleta"] },
    { en: "They fell in the street.", answer: ["ellos se cayeron en la calle", "se cayeron en la calle"] },
    { en: "I put on the jacket.", answer: ["yo me puse la chaqueta", "me puse la chaqueta"] },
    { en: "You died of laughter.", answer: ["tu te moriste de la risa", "te moriste de la risa"] }
];

const ex3MixedData = [
    { en: "I got up and showered.", answer: ["yo me levante y me duche", "me levante y me duche"] },
    { en: "She forgot the keys.", answer: ["ella se olvido de las llaves", "se olvido de las llaves"] },
    { en: "They fell asleep late.", answer: ["ellos se durmieron tarde", "se durmieron tarde"] },
    { en: "We got dressed fast.", answer: ["nosotros nos vestimos rapido", "nos vestimos rapido"] },
    { en: "He hurt his leg.", answer: ["el se lastimo la pierna", "se lastimo la pierna"] },
    { en: "You stayed in the hotel.", answer: ["tu te quedaste en el hotel", "te quedaste en el hotel"] },
    { en: "I felt sick yesterday.", answer: ["yo me senti enfermo ayer", "me senti enfermo ayer"] },
    { en: "They combed their hair together.", answer: ["ellas se peinaron juntas", "se peinaron juntas"] },
    { en: "You all moved house.", answer: ["ustedes se mudaron de casa", "se mudaron de casa"] },
    { en: "He woke up scared.", answer: ["el se desperto asustado", "se desperto asustado"] },
    { en: "I broke my arm.", answer: ["yo me rompi el brazo", "me rompi el brazo"] },
    { en: "We had fun yesterday.", answer: ["nosotros nos divertimos ayer", "nos divertimos ayer"] },
    { en: "They burned their hand.", answer: ["ellos se quemaron la mano", "se quemaron la mano"] },
    { en: "She cut her hair.", answer: ["ella se corto el cabello", "se corto el cabello"] },
    { en: "You sat at the table.", answer: ["tu te sentaste en la mesa", "te sentaste en la mesa"] }
];

const ex4OptionsData = [
    { text: "Ayer yo _______ tarde.", options: ["ME LEVANTÉ", "SE LEVANTÓ"], answer: "ME LEVANTÉ" },
    { text: "Ella _______ con agua fría.", options: ["SE DUCHÓ", "NOS DUCHAMOS"], answer: "SE DUCHÓ" },
    { text: "Nosotros _______ en la fiesta.", options: ["ME DIVERTÍ", "NOS DIVERTIMOS"], answer: "NOS DIVERTIMOS" },
    { text: "Ellos _______ de vacaciones.", options: ["SE FUERON", "TE FUISTE"], answer: "SE FUERON" },
    { text: "Tú _______ los dientes.", options: ["TE CEPILLASTE", "ME CEPILLÉ"], answer: "TE CEPILLASTE" },
    { text: "ÉL _______ el brazo jugando fútbol.", options: ["SE ROMPIÓ", "NOS ROMPIMOS"], answer: "SE ROMPIÓ" },
    { text: "Yo _______ de las llaves.", options: ["ME OLVIDÉ", "TE OLVIDASTE"], answer: "ME OLVIDÉ" },
    { text: "Ellas _______ muy temprano.", options: ["SE DESPERTARON", "ME DESPERTÉ"], answer: "SE DESPERTARON" },
    { text: "Nosotros _______ en el hotel.", options: ["NOS QUEDAMOS", "SE QUEDARON"], answer: "NOS QUEDAMOS" },
    { text: "Él _______ en el cine.", options: ["SE DURMIÓ", "ME DORMÍ"], answer: "SE DURMIÓ" },
    { text: "Tú _______ una chaqueta nueva.", options: ["TE PUSISTE", "SE PUSO"], answer: "TE PUSISTE" },
    { text: "Yo _______ triste ayer.", options: ["ME SENTÍ", "SE SINTIÓ"], answer: "ME SENTÍ" },
    { text: "Ella _______ para el trabajo.", options: ["SE VISTIÓ", "TE VISTE"], answer: "SE VISTIÓ" },
    { text: "Ellos _______ en la calle.", options: ["SE CAYERON", "NOS CAÍMOS"], answer: "SE CAYERON" },
    { text: "Ustedes _______ en Miami.", options: ["SE CASARON", "ME CASÉ"], answer: "SE CASARON" },
    { text: "Yo _______ la mano con el fuego.", options: ["ME QUEMÉ", "SE QUEMÓ"], answer: "ME QUEMÉ" },
    { text: "Tú _______ el cabello.", options: ["TE CORTASTE", "SE CORTÓ"], answer: "TE CORTASTE" },
    { text: "Ella _______ en el espejo.", options: ["SE MIRÓ", "NOS MIRAMOS"], answer: "SE MIRÓ" },
    { text: "Nosotros _______ de la risa.", options: ["NOS MORIMOS", "SE MURIÓ"], answer: "NOS MORIMOS" },
    { text: "Ellos _______ a otra ciudad.", options: ["SE MUDARON", "ME MUDÉ"], answer: "SE MUDARON" }
];

const finalFillData = [
    { s: "1. Yo (despertarse) _______ a las 7:00.", a: "me desperté" },
    { s: "2. Tú (levantarse) _______ de la cama.", a: "te levantaste" },
    { s: "3. Él (ducharse) _______ con agua caliente.", a: "se duchó" },
    { s: "4. Ella (vestirse) _______ rápido.", a: "se vistió" },
    { s: "5. Nosotros (cepillarse) _______ los dientes.", a: "nos cepillamos" },
    { s: "6. Ellos (peinarse) _______ frente al espejo.", a: "se peinaron" },
    { s: "7. Yo (desayunarse) _______ un café.", a: "me desayuné" },
    { s: "8. Tú (irse) _______ al trabajo.", a: "te fuiste" },
    { s: "9. Él (quedarse) _______ en la oficina.", a: "se quedó" },
    { s: "10. Nosotros (sentirse) _______ cansados.", a: "nos sentimos" },
    { s: "11. Ella (enfermarse) _______ el lunes.", a: "se enfermó" },
    { s: "12. Ellos (lastimarse) _______ la espalda.", a: "se lastimaron" },
    { s: "13. Yo (caerse) _______ en el parque.", a: "me caí" },
    { s: "14. Tú (quemarse) _______ la mano.", a: "te quemaste" },
    { s: "15. Él (romperse) _______ la pierna.", a: "se rompió" },
    { s: "16. Nosotros (olvidarse) _______ de la tarea.", a: "nos olvidamos" },
    { s: "17. Ella (dormirse) _______ en clase.", a: "se durmió" },
    { s: "18. Ellos (reírse) _______ mucho.", a: "se rieron" },
    { s: "19. Yo (mudarse) _______ el mes pasado.", a: "me mudé" },
    { s: "20. Tú (acostarse) _______ a las 11:00.", a: "te acostaste" },
    { s: "21. Él (cortarse) _______ afeitándose.", a: "se cortó" },
    { s: "22. Nosotros (divertirse) _______ en la fiesta.", a: "nos divertimos" },
    { s: "23. Ella (enamorarse) _______ de Lucas.", a: "se enamoró" },
    { s: "24. Ellos (graduarse) _______ de la universidad.", a: "se graduaron" },
    { s: "25. Yo (darse) _______ cuenta del error.", a: "me di" },
    { s: "26. Tú (ponerse) _______ los zapatos.", a: "te pusiste" },
    { s: "27. Él (preocuparse) _______ por el examen.", a: "se preocupó" },
    { s: "28. Nosotros (quejarse) _______ del ruido.", a: "nos quejamos" },
    { s: "29. Ellas (sentarse) _______ en la silla.", a: "se sentaron" },
    { s: "30. Yo (morirse) _______ de hambre.", a: "me morí" },
];

const negativeTranslations = [
    { en: "I didn't wake up early.", es: ["no me desperte temprano", "yo no me desperte temprano"] },
    { en: "She didn't shower yesterday.", es: ["ella no se ducho ayer", "no se ducho ayer"] },
    { en: "They didn't feel well.", es: ["ellos no se sintieron bien", "no se sintieron bien"] },
    { en: "We didn't go to bed late.", es: ["no nos acostamos tarde", "nosotros no nos acostamos tarde"] },
    { en: "He didn't fall down.", es: ["el no se cayo", "no se cayo"] },
    { en: "You didn't forget the keys.", es: ["no te olvidaste de las llaves", "tu no te olvidaste de las llaves"] },
    { en: "I didn't get dressed for the party.", es: ["no me vesti para la fiesta", "yo no me vesti para la fiesta"] },
    { en: "She didn't burn her hand.", es: ["ella no se quemo la mano", "no se quemo la mano"] },
    { en: "They didn't stay at home.", es: ["ellos no se quedaron en casa", "no se quedaron en casa"] },
    { en: "We didn't get lost.", es: ["no nos perdimos"] },
    { en: "You didn't move last month.", es: ["no te mudaste el mes pasado", "tu no te mudaste el mes pasado"] },
    { en: "He didn't break his phone.", es: ["el no se rompio su celular", "no se rompio el celular"] },
    { en: "I didn't brush my teeth.", es: ["no me cepille los dientes", "yo no me cepille los dientes"] },
    { en: "They didn't wash their faces.", es: ["no se lavaron la cara", "ellos no se lavaron la cara"] },
    { en: "She didn't comb her hair.", es: ["no se peino el cabello", "ella no se peino el cabello"] }
];

// --- HELPER COMPONENTS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setCurrentIndex(0); setAnswer(''); setStatus({}); }, [prompts]);
    useEffect(() => { setAnswer(''); }, [currentIndex]);

    const handleCheck = () => {
        const userVal = answer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const corrects = prompts[currentIndex].answer.map((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ').normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
        const isCorrect = corrects.includes(userVal);
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Buen trabajo!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start text-left">
                    <div className="w-full">
                        <CardTitle>{title}</CardTitle>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-foreground text-left">
                                        {Object.entries(vocabulary).map(([es, en]: any) => (
                                            <Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-semibold text-right">{en}</span></Fragment>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">{prompts[currentIndex].en}</div>
                <Input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-12 text-lg text-foreground", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/5' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder="Traduce al español..." autoComplete="off" />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck} variant="secondary">Verificar</Button>
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={status[currentIndex] !== 'correct'} className="font-bold text-white">Siguiente</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

// --- MAIN PAGE ---

function ReflexivosPasadoContent() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const targetStudentId = searchParams.get('studentId');
    const currentUID = targetStudentId || user?.uid;

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [learningPath, setLearningPath] = useState<any[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // States for content
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(reflexiveVerbsVocab.length).fill(''));
    const [vocabVal, setVocabVal] = useState<any[]>(Array(reflexiveVerbsVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const [conjIdx, setConjIdx] = useState(0);
    const [conjAns, setConjAns] = useState<string[]>(Array(5).fill(''));
    const [conjVal, setConjVal] = useState<any[]>(Array(5).fill('unchecked'));

    const [opIdx, setOpIdx] = useState(0);
    const [opVal, setOpVal] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    const [finalAns, setFinalAns] = useState<string[]>(Array(finalFillData.length).fill(''));
    const [finalVal, setFinalVal] = useState<any[]>(Array(finalFillData.length).fill('unchecked'));

    const [readAns, setReadAns] = useState<Record<string, string>>({});
    const [readVal, setReadVal] = useState<Record<string, any>>({});
    const [translateText, setTranslateText] = useState('');

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    
    const { data: authUserProfile } = useDoc<{ role?: string }>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string, lessonProgress?: any, progress?: any, name?: string }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialLearningPath = useMemo(() => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: '2. Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'conjugation', name: '3. Conjugación', icon: Pencil, status: 'locked' },
        { key: 'ex1', name: '4. Ejercicio 1 (Regulares)', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: '5. Ejercicio 2 (Irregulares)', icon: PenSquare, status: 'locked' },
        { key: 'ex3', name: '6. Ejercicio 3 (Mixto)', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '7. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'reading', name: '8. Lectura', icon: BookText, status: 'locked' },
        { key: 'ex4', name: '9. Ejercicio 4 (Opciones)', icon: ListChecks, status: 'locked' },
        { key: 'final_ex', name: '10. COMPLETAR', icon: Trophy, status: 'locked' },
        { key: 'translate_text', name: '11. Traducir Texto', icon: MessageSquare, status: 'locked' },
        { key: 'final', name: '12. Final (Negativo)', icon: CheckCircle, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;

        let path = initialLearningPath.map(topic => ({ ...topic }));
        let savedST = '';

        if (isAdmin && !targetStudentId) {
            path.forEach(item => { item.status = 'completed'; });
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedData = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => { if (savedData[item.key]) item.status = savedData[item.key]; });
            savedST = savedData.lastSelectedTopic || '';
        }

        let lastDone = true;
        for (let i = 0; i < path.length; i++) {
            if (lastDone && path[i].status === 'locked') path[i].status = 'active';
            lastDone = path[i].status === 'completed';
        }

        setLearningPath(path);
        setSelectedTopic(savedST || path.find(p => p.status === 'active')?.key || path[0].key);
        setInitialLoadComplete(true);
        setTimeout(() => setIsInitialLoading(false), 800);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete, targetStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || targetStudentId) return;
        const s: Record<string, any> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => { s[item.key] = item.status; });
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, progressValue, studentDocRef, initialLoadComplete, selectedTopic, isInitialLoading, isAdmin, targetStudentId]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(currentPath => {
            let win = false; let next: string | null = null;
            const newPath = currentPath.map(t => ({ ...t }));
            const idx = newPath.findIndex(t => t.key === topicToComplete);
            if (idx !== -1 && newPath[idx].status !== 'completed') {
                newPath[idx].status = 'completed';
                if (idx + 1 < newPath.length && newPath[idx + 1].status === 'locked') {
                    newPath[idx + 1].status = 'active'; win = true; next = newPath[idx + 1].key;
                }
            }
            if (win) setTimeout(() => toast({ title: "¡Misión desbloqueada!" }), 0);
            if (next) { const n = next; setTimeout(() => setSelectedTopic(n), 0); }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (topicKey === 'grammar') handleTopicComplete('grammar');
    };

    const handleTopicComplete = (completedKey: string) => setTopicToComplete(completedKey);

    const handleVocabCheck = () => {
        let okCount = 0;
        const nv = reflexiveVerbsVocab.map((v, i) => {
            const user = (vocabAnswers[i] || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const res = v.es.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === user;
            if (res) okCount++;
            return res ? 'correct' : 'incorrect';
        });
        setVocabVal(nv);
        if (okCount >= 10) { setCanAdvanceVocab(true); toast({ title: "¡Buen avance!" }); }
        else toast({ variant: 'destructive', title: "Necesitas 10 aciertos para avanzar." });
    };

    const handleConjCheck = () => {
        const verb = conjugationVerbs[conjIdx % conjugationVerbs.length];
        const esVerb = verb.es.toUpperCase();
        
        let corrects: string[] = [];
        if (esVerb === "CAERSE") {
            corrects = ["me caí", "te caíste", "se cayó", "nos caímos", "se cayeron"];
        } else if (esVerb === "DORMIRSE") {
            corrects = ["me dormí", "te dormiste", "se durmió", "nos dormimos", "se durmieron"];
        } else if (esVerb === "VESTIRSE" || esVerb === "SENTIRSE") {
            const b = esVerb.slice(0, -4).toLowerCase();
            const root = b.replace('e', 'i');
            const end = esVerb.endsWith('IRSE') ? ['í', 'iste', 'ió', 'imos', 'ieron'] : ['é', 'aste', 'ó', 'amos', 'aron'];
            corrects = [
                `me ${b}${end[0]}`, `te ${b}${end[1]}`, `se ${root}${end[2]}`, `nos ${b}${end[3]}`, `se ${root}${end[4]}`
            ];
        } else {
            const base = verb.es.slice(0, -2).toLowerCase();
            const forms = verb.es.endsWith('arse') ? ['é', 'aste', 'ó', 'amos', 'aron'] : ['í', 'iste', 'ió', 'imos', 'ieron'];
            const pronouns = ['me', 'te', 'se', 'nos', 'se'];
            corrects = forms.map((f, i) => `${pronouns[i]} ${base}${f}`);
        }

        const nv = conjAns.map((a, i) => {
            const u = a.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const c = corrects[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return u === c ? 'correct' : 'incorrect';
        });
        
        setConjVal(nv as any);

        if (nv.every(st => st === 'correct')) {
            toast({ title: "¡Perfecto!" });
            if (conjIdx < conjugationVerbs.length - 1) {
                setConjIdx(prev => prev + 1); setConjAns(Array(5).fill('')); setConjVal(Array(5).fill('unchecked'));
            } else { handleTopicComplete('conjugation'); }
        } else { toast({ variant: 'destructive', title: "Revisa la conjugación" }); }
    };

    const handleOpSelect = (opt: string) => {
        const isOk = opt.toUpperCase() === ex4OptionsData[opIdx].answer.toUpperCase();
        setOpVal({ ...opVal, [opIdx]: isOk ? 'correct' : 'incorrect' });
        if (isOk) {
            toast({ title: "¡Correcto!" });
            if (opIdx < ex4OptionsData.length - 1) setTimeout(() => setOpIdx(p => p + 1), 600);
        } else toast({ variant: 'destructive', title: "Incorrecto" });
    };

    const handleReadingCheck = () => {
        let ok = true; const nv: any = {};
        const qIds = ['q1', 'q2', 'q3'];
        const correctAnswers: Record<string, string[]> = {
            q1: ["tarde"], q2: ["el bano", "el baño"], q3: ["quemarse la mano", "quemo la mano", "la mano"]
        };
        qIds.forEach(id => {
            const user = (readAns[id] || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const res = correctAnswers[id].some(a => user.includes(a.normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
            nv[id] = res ? 'correct' : 'incorrect'; if (!res) ok = false;
        });
        setReadVal(nv);
        if (ok) { toast({ title: "¡Excelente lectura!" }); handleTopicComplete('reading'); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className="text-primary uppercase tracking-tighter">Vocabulario: Reflexivos (Pasado)</CardTitle><CardDescription className='font-bold text-foreground'>Escribe el significado en español para cada verbo reflexivo.</CardDescription></CardHeader>
                        <CardContent className="pt-6"><ScrollArea className="h-[500px] pr-4"><div className="grid grid-cols-2 gap-4">
                            <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">English</div><div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Español</div>
                            {reflexiveVerbsVocab.map((v, i) => (
                                <Fragment key={i}>
                                    <div className="p-2 border rounded bg-white/5 font-bold py-1 text-sm">{v.en}</div>
                                    <Input value={vocabAnswers[i] || ''} onChange={e => { if (isAdmin && !!targetStudentId) return; const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const nv = [...vocabVal]; nv[i] = 'unchecked'; setVocabVal(nv); setCanAdvanceVocab(false); }} className={cn("h-10 uppercase", vocabVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={isAdmin && !!targetStudentId} /></Fragment>))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 bg-muted/20"><Button onClick={handleVocabCheck} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar <ArrowRight className='ml-2'/></Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <div className="space-y-6 text-left text-foreground">
                        <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-8 text-foreground overflow-hidden">
                            <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Reflexivos en Pasado</CardTitle></CardHeader>
                            <CardContent className="space-y-8 px-0 font-bold">
                                <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                    <h3 className="text-xl font-black text-primary uppercase mb-4">¿Qué es un verbo reflexivo en pasado?</h3>
                                    <p className="mb-4 text-lg">Es cuando la acción recae sobre el mismo sujeto que la realizó en un tiempo terminado. En español, el pronombre reflexivo (me, te, se, nos) va ANTES del verbo conjugado.</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-sm mb-6">
                                        {['YO: me', 'TÚ: te', 'ÉL/ELLA: se', 'NOS.: nos', 'ELLOS: se'].map(p => <div key={p} className='p-2 bg-primary/10 rounded-lg border border-primary/20'>{p}</div>)}
                                    </div>
                                    <Separator />
                                    <div className="mt-6 space-y-4">
                                        <h4 className="text-primary font-black uppercase text-sm">1. Verbos Regulares:</h4>
                                        <p>Mantienen su raíz y usan las terminaciones estándar del pasado (-ar: é, aste, ó, amos, aron | -er/ir: í, iste, ió...).</p>
                                        <p>Verbos Terminan en AR =  ( é, aste, ó, amos, aron).</p>
                                        <p>Verbos Terminan en ER/IR = (í, iste, ió, imos, ieron).</p>
                                        <div className="p-3 bg-muted rounded-md italic">Ej: Yo me bañé / Nosotros nos lavamos.</div>
                                    </div>
                                    <div className="mt-4 space-y-4">
                                        <h4 className="text-brand-purple font-black uppercase text-sm">2. Verbos Irregulares:</h4>
                                         <p>Tienen cambios en la raíz.</p>
                                         <p>(ej: dormirse {'->'} se durmió) o cambios ortográficos.</p>
                                         <p> (ej: caerse {'->'} se cayó en 3ª persona // Ellos se cayeron).</p>
                                         <p> (ej: Irse {'->'} fui, fuiste, fue, fuimos, fueron).</p>
                                        <div className="p-3 bg-muted rounded-md italic">Ej: Ella se durmió / El se cayó.</div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Entendido</Button></CardFooter>
                        </Card>
                    </div>
                );
            case 'conjugation':
                const curVerb = conjugationVerbs[conjIdx % conjugationVerbs.length];
                const pronouns = ["Yo", "Tú", "Él/Ella", "Nosotros", "Ellos/Ellas"];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tighter'>Misión: Conjugación Reflexiva ({conjIdx + 1}/{conjugationVerbs.length})</CardTitle><CardDescription>Conjuga el verbo en pasado reflexivo.</CardDescription></CardHeader>
                        <CardContent className="space-y-8 pt-8 flex flex-col items-center">
                            <div className="p-8 bg-gradient-to-br from-primary/5 to-brand-purple/5 rounded-[2.5rem] border-2 border-dashed border-primary/20 text-center">
                                <span className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Verbo en Inglés</span>
                                <h3 className="text-5xl font-black text-primary uppercase tracking-tighter">{curVerb.en} <span className='text-lg block text-muted-foreground'>({curVerb.es})</span></h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
                                {pronouns.map((p, i) => (
                                    <div key={i} className="space-y-1">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">{p}</Label>
                                        <Input value={conjAns[i]} onChange={e => { const na = [...conjAns]; na[i] = e.target.value; setConjAns(na); const nv = [...conjVal]; nv[i] = 'unchecked'; setConjVal(nv); }} className={cn("h-10 text-lg font-bold border-2", conjVal[i] === 'correct' ? 'border-green-500' : conjVal[i] === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-8 bg-muted/5"><Button onClick={handleConjCheck} size="lg" className="px-20 font-black h-14 text-xl shadow-xl uppercase">Verificar <ArrowRight className="ml-2" /></Button></CardFooter>
                    </Card>
                );
            case 'ex1': return <BallsExercise title="Ejercicio 1: Regulares" prompts={ex1RegularData} onComplete={() => handleTopicComplete('ex1')} vocabulary={{"shower": "ducharse", "early": "temprano", "move": "mudarse", "stay": "quedarse", "marry": "casarse"}} />;
            case 'ex2': return <BallsExercise title="Ejercicio 2: Irregulares" prompts={ex2IrregularData} onComplete={() => handleTopicComplete('ex2')} vocabulary={{"fall asleep": "dormirse", "get dressed": "vestirse", "feel": "sentirse", "fun": "divertirse", "fall down": "caerse"}} />;
            case 'ex3': return <BallsExercise title="Ejercicio 3: Mixto" prompts={ex3MixedData} onComplete={() => handleTopicComplete('ex3')} vocabulary={{"forget": "olvidarse", "hurt": "lastimarse", "scared": "asustado", "break": "romperse", "sick": "enfermo"}} />;
            case 'vocab_game': return <VocabularyMatchingGame data={reflexiveVerbsVocab.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Memory Game: Reflexivos Pasado" />;
            case 'reading':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tight'>Lectura: Un Día de Accidentes</CardTitle></CardHeader>
                        <CardContent className="space-y-6 pt-6 text-foreground">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner">"Ayer fue un día difícil para mi familia. Primero, mi hermano se despertó tarde y se vistió con prisa. En el baño, él se resbaló y se cayó. Mi mamá se preocupó mucho. Después, yo me quemé la mano en la cocina mientras me preparaba el desayuno. Mi papá se olvidó de su maleta y se mudó de habitación por un error. Afortunadamente, al final del día todos nos sentimos mejor."</div>
                            <Separator /><div className="space-y-4">
                                <div className="space-y-2"><Label className="font-bold">¿A qué hora se despertó el hermano?</Label><Input value={readAns['q1'] || ''} onChange={e => setReadAns({...readAns, q1: e.target.value})} className={cn(readVal['q1'] === 'correct' ? 'border-green-500 bg-green-50/5' : readVal['q1'] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" /></div>
                                <div className="space-y-2"><Label className="font-bold">¿En dónde se cayó el hermano?</Label><Input value={readAns['q2'] || ''} onChange={e => setReadAns({...readAns, q2: e.target.value})} className={cn(readVal['q2'] === 'correct' ? 'border-green-500 bg-green-50/5' : readVal['q2'] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" /></div>
                                <div className="space-y-2"><Label className="font-bold">¿Qué accidente tuvo el narrador?</Label><Input value={readAns['q3'] || ''} onChange={e => setReadAns({...readAns, q3: e.target.value})} className={cn(readVal['q3'] === 'correct' ? 'border-green-500 bg-green-50/5' : readVal['q3'] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" /></div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-6"><Button onClick={handleReadingCheck} size="lg" className="px-16 font-black h-12 shadow-md uppercase">Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'ex4':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
                        <CardHeader>
                            <CardTitle>Ejercicio 4: Opciones Correctas</CardTitle>
                            <div className="flex gap-2 justify-start flex-wrap pt-4">
                                {ex4OptionsData.map((_, i) => (<div key={i} onClick={() => setOpIdx(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", opIdx === i ? "border-primary ring-2 ring-primary" : "border-muted", opVal[i] === 'correct' ? "bg-green-500 text-white border-green-500" : opVal[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>))}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-8 py-10">
                            <div className="text-3xl font-black text-center leading-relaxed tracking-tighter uppercase">{ex4OptionsData[opIdx].text}</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
                                {ex4OptionsData[opIdx].options.map(opt => (<Button key={opt} onClick={() => handleOpSelect(opt)} variant="outline" className={cn("h-16 text-lg font-black uppercase transition-all hover:scale-105", opVal[opIdx] === 'correct' && opt === ex4OptionsData[opIdx].answer && "bg-green-500 text-white border-green-600")}>{opt}</Button>))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6"><Button variant="outline" onClick={() => setOpIdx(p => Math.max(0, p - 1))} disabled={opIdx === 0}>Anterior</Button><Button onClick={() => opIdx < ex4OptionsData.length - 1 ? setOpIdx(p => p + 1) : handleTopicComplete('ex4')} disabled={opVal[opIdx] !== 'correct'} className='font-bold uppercase'>Siguiente</Button></CardFooter>
                    </Card>
                );
            case 'final_ex':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tight'>COMPLETAR: Pasado Reflexivo (30 frases)</CardTitle></CardHeader>
                        <CardContent className="p-0"><ScrollArea className="h-[450px] p-6"><div className="space-y-4">
                            {finalFillData.map((q, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm">
                                    <p className="font-bold text-lg">{q.s}</p>
                                    <Input value={finalAns[i]} onChange={e => { const na = [...finalAns]; na[i] = e.target.value; setFinalAns(na); const nv = [...finalVal]; nv[i] = 'unchecked'; setFinalVal(nv); }} className={cn("h-10 max-w-sm text-lg uppercase", finalVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : finalVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder="Respuesta..." autoComplete="off" />
                                </div>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-center border-t p-6"><Button onClick={() => {
                            let ok = true; const nv = finalFillData.map((q, i) => { const res = q.a.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === (finalAns[i] || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); if (!res) ok = false; return res ? 'correct' : 'incorrect'; }); setFinalVal(nv); if (ok) { toast({ title: "¡Dominio Total!" }); handleTopicComplete('final_ex'); }
                        }} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Verificar Todo</Button></CardFooter>
                    </Card>
                );
            case 'translate_text':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div><CardTitle className='text-primary uppercase'>Traducción: Mi Mañana Accidentada</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el siguiente párrafo al español.</CardDescription></div>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger>
                                    <PopoverContent className="w-64">
                                        <ScrollArea className="h-48 pr-4">
                                            <div className="space-y-2 text-xs text-foreground">{Object.entries({ "Suddenly": "De repente", "Stairs": "Escaleras", "Arm": "Brazo", "Floor": "Piso / Suelo", "Mess": "Desorden", "Poor me": "Pobre de mí" }).map(([en, es]) => (<div key={en} className="flex justify-between border-b pb-1"><span>{en}:</span><span className="font-bold text-primary">{es}</span></div>))}</div>
                                        </ScrollArea>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed shadow-sm text-foreground">"Yesterday, I woke up at 8:00 AM. I showered and dressed quickly. Suddenly, I fell down on the stairs and hurt my leg. I felt very bad. I forgot my bag and I returned home. It was a complete mess! But later, I stayed with my family and I felt better."</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-xs tracking-widest'>Tu Traducción:</Label><Textarea value={translateText} onChange={e => setTranslateText(e.target.value)} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg" /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('translate_text')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl uppercase bg-primary hover:bg-primary/90 text-primary-foreground">Continuar <ArrowRight className='ml-3'/></Button></CardFooter>
                    </Card>
                );
            case 'final':
                return <BallsExercise title="Final: Repaso de Negativas" prompts={negativeTranslations} onComplete={() => handleTopicComplete('final')} vocabulary={{"early": "temprano", "yesterday": "ayer", "late": "tarde", "keys": "llaves", "get lost": "perderse", "last month": "mes pasado", "brush": "cepillarse"}} />;
            default: return null;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>}>
                        {targetStudentId && isAdmin && (
                            <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md">
                                <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400">
                                    <Star className="h-6 w-6 fill-current animate-pulse" />
                                    <p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión: {studentProfile?.name || targetStudentId}</p>
                                </div>
                                <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors">
                                    <Link href="/admin">Cerrar</Link>
                                </Button>
                            </div>
                        )}
                        <div className="mb-8 text-left text-white">
                            <Link href="/espanol/a2" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver al Curso A2</Link>
                            <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3"><History className='h-10 w-10 text-primary' /> Reflexivos Pasado 🇪🇸</h1>
                        </div>
                        <div className="grid gap-8 md:grid-cols-12 text-foreground">
                            <div className="md:col-span-9 md:order-1 order-2">
                                {renderContent()}
                            </div>
                            <div className="md:col-span-3 md:order-2 order-1 text-left">
                                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
                                    <CardHeader className="pb-4 border-b bg-muted/30">
                                        <CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Misión Final</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <nav><ul className="space-y-1">
                                            {learningPath.map((item) => {
                                                const isLocked = item.status === 'locked' && !isAdmin;
                                                const Icon = ICONS_CONFIG[item.status as keyof typeof ICONS_CONFIG] || BookOpen;
                                                return (
                                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-bold')}>
                                                        <div className="flex items-center gap-3 text-foreground">
                                                            {item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}
                                                            <span className="truncate max-w-[150px] uppercase font-bold text-[10px] text-foreground">{item.name}</span>
                                                        </div>
                                                        {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                                    </li>
                                                );
                                            })}
                                        </ul></nav>
                                        <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 font-black uppercase text-muted-foreground"><span>Avance Total</span><span className="text-primary">{progressValue}%</span></div><Progress value={progressValue} className="h-2 rounded-full" /></div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </Suspense>
                </div>
            </main>
        </div>
    );
}

export default function ReflexivosPasadoPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
        }>
            <ReflexivosPasadoContent />
        </Suspense>
    );
}