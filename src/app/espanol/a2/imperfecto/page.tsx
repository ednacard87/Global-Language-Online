'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense, Fragment, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    GraduationCap, 
    CheckCircle, 
    Gamepad2, 
    BookText, 
    Trophy,
    ArrowLeft,
    ArrowRight,
    Star,
    Loader2,
    MessageSquare,
    Pencil,
    History,
    Check,
    X,
    Info,
    ListChecks,
    Baby,
    Activity
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
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { Textarea } from '@/components/ui/textarea';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_a2_imperfecto_v11_fix_refs';
const mainProgressKey = 'progress_a2_es_imperfecto';

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// Helper for string comparison
const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// --- DATA ---

const childhoodVocab = [
    { en: "TOYS", es: "JUGUETES" }, { en: "SCHOOL", es: "ESCUELA" }, { en: "FRIENDS", es: "AMIGOS" },
    { en: "HOLIDAYS", es: "VACACIONES" }, { en: "NEIGHBORHOOD", es: "BARRIO" }, { en: "PLAYGROUND", es: "PARQUE" },
    { en: "SWING", es: "COLUMPIO" }, { en: "SLIDE", es: "TOBOGAN" }, { en: "HIDE AND SEEK", es: "ESCONDITE" },
    { en: "TAG", es: "LA LLEVA / COGIDAS" }, { en: "BICYCLE", es: "BICICLETA" }, { en: "DOLL", es: "MUÑECA" },
    { en: "MARBLES", es: "CANICAS" }, { en: "CARTOONS", es: "DIBUJOS ANIMADOS" }, { en: "CHILDHOOD", es: "INFANCIA" },
    { en: "YOUTH", es: "JUVENTUD" }, { en: "TEACHER", es: "PROFESOR" }, { en: "STREET", es: "CALLE" },
    { en: "ICE CREAM", es: "HELADO" }, { en: "KINDERGARTEN", es: "JARDIN INFANTIL" },
];

const conjugationVerbs = [
    { v: "HABLAR", type: "ar", forms: ["hablaba", "hablabas", "hablaba", "hablábamos", "hablaban"] },
    { v: "COMER", type: "er", forms: ["comía", "comías", "comía", "comíamos", "comían"] },
    { v: "VIVIR", type: "ir", forms: ["vivía", "vivías", "vivía", "vivíamos", "vivían"] },
    { v: "JUGAR", type: "ar", forms: ["jugaba", "jugabas", "jugaba", "jugábamos", "jugaban"] },
    { v: "TENER", type: "er", forms: ["tenía", "tenías", "tenía", "teníamos", "tenían"] },
    { v: "SER", type: "irreg", forms: ["era", "eras", "era", "éramos", "eran"] },
    { v: "IR", type: "irreg", forms: ["iba", "ibas", "iba", "íbamos", "iban"] },
    { v: "VER", type: "irreg", forms: ["veía", "veías", "veía", "veíamos", "veían"] },
];

const ex1Prompts = [
    { en: "I was a very active child.", es: ["yo era un niño muy activo", "era un niño muy activo"] },
    { en: "We lived in a small house near the river.", es: ["vivíamos en una casa pequeña cerca del río", "nosotros vivíamos en una casa pequeña cerca del río"] },
    { en: "She played with dolls all afternoon.", es: ["ella jugaba con muñecas toda la tarde", "jugaba con muñecas toda la tarde"] },
    { en: "They studied in that school many years ago.", es: ["ellos estudiaban en esa escuela hace muchos años", "estudiaban en esa escuela hace muchos años"] },
    { en: "I was a good student.", es: ["yo era un buen estudiante", "era un buen estudiante"] },
    { en: "He was a talented musician.", es: ["él era un músico talentoso", "era un músico talentoso"] },
    { en: "We were happy with our lives.", es: ["éramos felices con nuestras vidas", "nosotras éramos felices con nuestras vidas"] },
    { en: "She was a beautiful woman.", es: ["ella era una mujer hermosa", "era una mujer hermosa"] },
    { en: "They were excited about the trip.", es: ["ellos estaban emocionados por el viaje", "estaban emocionados por el viaje"] },
    { en: "I was tired after the long day.", es: ["yo estaba cansado después del día largo", "estaba cansado después del día largo"] },
];

const ex2Prompts = [
    { en: "My father worked in a bank.", es: ["mi padre trabajaba en un banco", "mi papá trabajaba en un banco"] },
    { en: "We used to go to the park every Sunday.", es: ["íbamos al parque todos los domingos", "nosotros íbamos al parque todos los domingos"] },
    { en: "The neighbors were very kind.", es: ["los vecinos eran muy amables"] },
    { en: "I didn't like vegetables when I was little.", es: ["no me gustaban las verduras cuando era pequeño", "no me gustaban las verduras cuando era pequeña"] },
    { en: "She was a kind girl.", es: ["ella era una niña amable", "era una niña amable"] },
    { en: "He was a strict teacher.", es: ["él era un maestro estricto", "era un maestro estricto"] },
    { en: "We were students at the same school.", es: ["éramos estudiantes en la misma escuela", "nosotras éramos estudiantes en la misma escuela"] },
    { en: "They were happy with the results.", es: ["ellos estaban felices con los resultados", "estaban felices con los resultados"] },
    { en: "I was interested in the book.", es: ["yo estaba interesado en el libro", "estaba interesado en el libro"] },
];

const ex3Prompts = [
    { en: "You read many books in the library.", es: ["tú leías muchos libros en la biblioteca", "leías muchos libros en la biblioteca"] },
    { en: "They saw cartoons every morning.", es: ["veían dibujos animados cada mañana", "ellos veían dibujos animados cada mañana"] },
    { en: "It was a beautiful childhood.", es: ["era una infancia hermosa"] },
    { en: "We ate ice cream after school.", es: ["comíamos helado después de la escuela"] },
    { en: "I was a shy child.", es: ["yo era un niño tímido", "era un niño tímido"] },
    { en: "You were a good student.", es: ["tú eras un buen estudiante", "eras un buen estudiante"] },
    { en: "They were always helpful.", es: ["ellos siempre eran útiles", "siempre eran útiles"] },
    { en: "We were excited about the party.", es: ["éramos emocionados por la fiesta", "nosotras éramos emocionadas por la fiesta"] },
    { en: "She was a talented artist.", es: ["ella era una artista talentosa", "era una artista talentosa"] },
    { en: "He was a kind man.", es: ["él era un hombre amable", "era un hombre amable"] },
    { en: "the teacher was angry with his students.", es: ["el maestro estaba enojado con sus estudiantes", "estaba enojado con sus estudiantes"] },
    { en: "We were worried about the exam.", es: ["éramos preocupados por el examen", "nosotras éramos preocupadas por el examen"] },
    { en: "They were surprised by the news.", es: ["ellos estaban sorprendidos por las noticias", "estaban sorprendidos por las noticias"] },
    { en: "I was confused by the instructions.", es: ["yo estaba confundido por las instrucciones", "estaba confundido por las instrucciones"] },
    { en: "We were not interested in the movie.", es: ["no nos interesaba la película", "nosotros no nos interesaba la película"] },
];

const ex4OptionsPrompts = [
    { s: "Cuando yo _______ (ser) pequeño, jugaba en el parque.", options: ["ERA", "ERAS", "ERAMOS"], answer: "ERA" },
    { s: "Nosotros _______ (vivir) en un barrio muy tranquilo.", options: ["VIVIA", "VIVIAMOS", "VIVIAN"], answer: "VIVIAMOS" },
    { s: "Ella _______ (tener) una colección de canicas.", options: ["TENIAS", "TENIA", "TENIAN"], answer: "TENIA" },
    { s: "Mis amigos y yo _______ (ir) a la playa cada verano.", options: ["IBA", "IBAS", "IBAMOS"], answer: "IBAMOS" },
    { s: "Ellos _______ (ser) muy simpáticos.", options: ["ERA", "ERAMOS", "ERAN"], answer: "ERAN" },
    { s: "Ella _______ (tener) un hermano mayor.", options: ["TENIAS", "TENIA", "TENIAN"], answer: "TENIA" },
    { s: "cuando yo_____ (estar) en Nueva York.", options: ["ESTABAS", "ESTABAMOS", "ESTABA"], answer: "ESTABA" },
    { s: "Ellos _______ (ser) muy groseros.", options: ["ERAN", "ERAS", "ERAMOS"], answer: "ERAN" },
    { s: "Nosotros _______ (tener) un perro.", options: ["TENIA", "TENIAMOS", "TENIAN"], answer: "TENIAMOS" },
    { s: "Ella _______ (ser) muy inteligente.", options: ["ERAA", "ERA", "ERAMOS"], answer: "ERA" },
    { s: "Ellos _______ (ir) al cine todos los viernes.", options: ["IVAN", "IBAN", "IBAMOS"], answer: "IBAN" },
    { s: "Yo _______ (tener) un hermano menor.", options: ["TENIIA", "TENIA", "TENIAN"], answer: "TENIA" },
    { s: "Nosotros _______ (ser) muy felices.", options: ["ERAMS", "ERAMOS", "ERAMO"], answer: "ERAMOS" },
    { s: "Ella _______ (estar) en casa.", options: ["ESTABAN", "ESTABA", "ESTABAMOS"], answer: "ESTABA" },
    { s: "Ellos _______ (ir) al parque todos los dias.", options: ["IBAN", "IBAS", "IBAMOS"], answer: "IBAN" },
    { s: "Tú _______ (tener) un hermano?.", options: ["TENIASS", "TENIA", "TENIAS"], answer: "TENIAS" },
    { s: "Yo _______ (ser) estudiante.", options: ["ERAN", "ERA", "ERAMOS"], answer: "ERA" },
    { s: "Nosotros _______ (vivir) en esa ciudad.", options: ["VIVI", "VIVIAMOS", "VIVIANOS"], answer: "VIVIAMOS" },
    { s: "Ella _______ (tener) un libro.", options: ["TENTA", "TENIA", "TENIAN"], answer: "TENIA" },
    { s: "Ellos _______ (ser) muy peligrosos.", options: ["ERASO", "ERAM", "ERAN"], answer: "ERAN" },
];

const completarPrompts = [
    { s: "1. Yo (estar) _______ muy feliz en Boston.", a: "estaba" },
    { s: "2. Tú (tener) _______ un gato.", a: "tenías" },
    { s: "3. Él (ir) _______ a la iglesia.", a: "iba" },
    { s: "4. Nosotros (ser) _______ amigos.", a: "éramos" },
    { s: "5. Ellos (vivir) _______ en Madrid.", a: "vivían" },
    { s: "6. Yo (jugar) _______ con mis amigos.", a: "jugaba" },
    { s: "7. Ella (ser) _______ muy inteligente.", a: "era" },
    { s: "8. Ellos (tener) _______ un coche.", a: "tenían" },
    { s: "9. Tú (tener) _______ un hermano.", a: "tenías" },
    { s: "10. Nosotros (ser) _______ estudiantes.", a: "éramos" },
    { s: "11. El (tener) _______ un libro.", a: "tenía" },
    { s: "12. Ella (ser) _______ muy inteligente.", a: "era" },
    { s: "13. Ellos (vivir) _______ en esa ciudad.", a: "vivían" },
    { s: "14. Yo (jugar) _______ con mis amigos.", a: "jugaba" },
    { s: "15. Tú (tener) _______ un gato.", a: "tenías" },
    { s: "16. Ella (ir) _______ a la universidad caminando.", a: "iba" },
    { s: "17. Nosotros (vivir) _______ en ese barrio.", a: "vivíamos" },
    { s: "18. El (tener) _______ una finca.", a: "tenía" },
    { s: "19. Tú (ser) _______ muy terca.", a: "eras" },
    { s: "20. Ellos (tener) _______ un amigo rico.", a: "tenían" },
    { s: "21. Yo (ser) _______ muy feliz con mi familia.", a: "era" },
    { s: "22. Tú (tener) _______ un hermano.", a: "tenías" },
    { s: "23. Ella (estar) _______ en Inglaterra.", a: "era" },
    { s: "24. Nosotros (vivir) _______ en ese barrio.", a: "vivíamos" },
    { s: "25. El (tener) _______ una finca.", a: "tenía" },
    { s: "26. Tú (ser) _______ muy fea en el colegio.", a: "eras" },
    { s: "27. Ella (tener) _______ un tio ciego.", a: "tenía" },
    { s: "28. Ellos (estar) _______ en la playa.", a: "estaban" },
    { s: "29. Yo (tener) _______ un perro hace 2 años.", a: "tenía" },
    { s: "30. Nosotros (ser) _______ muy buenos estudiantes.", a: "éramos" },
];

const negativePrompts = [
    { en: "I didn't have many toys.", es: ["no tenía muchos juguetes", "yo no tenía muchos juguetes"] },
    { en: "We didn't live in a big city.", es: ["no vivíamos en una ciudad grande", "nosotros no vivíamos en una ciudad grande"] },
     { en: "I wasn't a good student.", es: ["no era un buen estudiante", "yo no era un buen estudiante"] },
     { en: "You weren't happy.", es: ["no estabas feliz", "tú no estabas feliz"] },
     { en: "She wasn't tired.", es: ["no estaba cansada", "ella no estaba cansada"] },
     { en: "They weren't interested.", es: ["no estaban interesados", "ellos no estaban interesados"] },
     { en: "We weren't late.", es: ["no estábamos tarde", "nosotros no estábamos tarde"] },
     { en: "You weren't here.", es: ["no estabas aquí", "tú no estabas aquí"] },
     { en: "I didn't have many animals.", es: ["no tenía muchos animales", "yo no tenía muchos animales"] },
     { en: "We didn't live in that country.", es: ["no vivíamos en esa país", "nosotros no vivíamos en esa país"] },
     { en: "I didn't have many friends.", es: ["no tenía muchos amigos", "yo no tenía muchos amigos"] },
     { en: "We didn't have a lot of money.", es: ["no teníamos mucho dinero", "nosotros no teníamos mucho dinero"] },
     { en: "You didn't like the movie before.", es: ["no te gustó la película", "a ti no te gustaba la película"] },
     { en: "They didn't know the answer.", es: ["no sabían la respuesta", "ellos no sabían la respuesta"] },
     { en: "We didn't watch that show.", es: ["no veíamos ese programa", "nosotros no veíamos ese programa"] },
];

const readingContent = {
    title: "Mi Infancia en el Barrio",
    text: "Cuando yo era niño, vivía en un barrio muy tranquilo. Todos los días, mis amigos y yo jugábamos en la calle. Nosotros no teníamos celulares, así que corríamos y montábamos en bicicleta. Mi madre siempre preparaba meriendas ricas. Yo era muy feliz porque la vida era más simple antes.",
    questions: [
        { id: 'q1', q: "¿Dónde vivía el narrador?", a: ["en un barrio tranquilo", "en un barrio"] },
        { id: 'q2', q: "¿Qué hacían los amigos todos los días?", a: ["jugaban en la calle", "jugaban"] },
        { id: 'q3', q: "¿Por qué era feliz el narrador?", a: ["porque la vida era más simple", "porque era feliz"] }
    ]
};

// --- HELPERS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setCurrentIndex(0); setAnswer(''); setStatus({}); }, [prompts]);
    useEffect(() => { setAnswer(''); }, [currentIndex]);

    const handleCheck = () => {
        const userVal = normalize(answer);
        const currentPrompt = prompts[currentIndex];
        const isOk = currentPrompt.es.some((a: string) => normalize(a) === userVal);
        setStatus(p => ({ ...p, [currentIndex]: isOk ? 'correct' : 'incorrect' }));
        if (isOk) toast({ title: "¡Correcto!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(vocabulary).map(([en, es]: any) => (<Fragment key={en}><span className="text-muted-foreground">{en}:</span><span className="font-bold text-primary">{es}</span></Fragment>))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">{prompts[currentIndex].en}</div>
                <Input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-12 text-lg", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/5' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder="Traduce al español..." autoComplete="off" />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck} variant="secondary">Verificar</Button>
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={status[currentIndex] !== 'correct'} className="font-bold">Siguiente</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

// --- MAIN COMPONENT ---

function ImperfectoContent() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const targetStudentId = searchParams.get('studentId');
    const currentUID = targetStudentId || user?.uid;

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // States for content
    const [vocabAns, setVocabAns] = useState<string[]>(Array(childhoodVocab.length).fill(''));
    const [vocabVal, setVocabVal] = useState<any[]>(Array(childhoodVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);
    const [conjIdx, setConjIdx] = useState(0);
    const [conjAns, setConjAns] = useState<string[]>(Array(5).fill(''));
    const [conjVal, setConjVal] = useState<any[]>(Array(5).fill('unchecked'));
    const [choiceIdx, setChoiceIdx] = useState(0);
    const [choiceVal, setChoiceVal] = useState<Record<number, 'correct' | 'incorrect'>>({});
    const [compAns, setCompAns] = useState<string[]>(Array(completarPrompts.length).fill(''));
    const [compVal, setCompVal] = useState<any[]>(Array(completarPrompts.length).fill('unchecked'));
    const [readAns, setReadAns] = useState<Record<string, string>>({});
    const [readVal, setReadVal] = useState<Record<string, any>>({});
    const [textTrans, setTextTrans] = useState('');
    const [isFinished, setIsFinished] = useState(false);

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    
    const { data: authUserProfile } = useDoc<{ role?: string }>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string, lessonProgress?: any, progress?: any, name?: string }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: '2. Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'conjugation', name: '3. Conjugación', icon: Pencil, status: 'locked' },
        { key: 'ex1', name: '4. Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: '5. Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'ex3', name: '7. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: '8. Lectura', icon: BookText, status: 'locked' },
        { key: 'ex4', name: '9. Ejercicio 4 (Opciones)', icon: ListChecks, status: 'locked' },
        { key: 'completar', name: '10. Completar', icon: Trophy, status: 'locked' },
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
        const s: any = { lastSelectedTopic: selectedTopic, textTrans, readAns, compAns };
        learningPath.forEach(item => { s[item.key] = item.status; });
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, isInitialLoading, targetStudentId, textTrans, readAns, compAns]);

    const handleTopicComplete = (completedKey: string) => setTopicToComplete(completedKey);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(currentPath => {
            let next: string | null = null;
            const newPath = currentPath.map(t => ({ ...t }));
            const idx = newPath.findIndex(t => t.key === topicToComplete);
            if (idx !== -1 && newPath[idx].status !== 'completed') {
                newPath[idx].status = 'completed';
                if (idx + 1 < newPath.length && newPath[idx + 1].status === 'locked') {
                    newPath[idx + 1].status = 'active'; next = newPath[idx + 1].key;
                }
            }
            if (next) { const n = next; setTimeout(() => setSelectedTopic(n), 0); }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete]);

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (topicKey === 'grammar') handleTopicComplete(topicKey);
    };

    const handleCheckVocab = () => {
        let count = 0;
        const nv = childhoodVocab.map((v, i) => {
            const ok = normalize(v.es) === normalize(vocabAns[i] || '');
            if (ok) count++; return ok ? 'correct' : 'incorrect';
        });
        setVocabVal(nv);
        if (count >= 10) { setCanAdvanceVocab(true); toast({ title: "¡Buen avance!" }); }
        else toast({ variant: 'destructive', title: "Sigue intentando", description: `Llevas ${count}. Necesitas 10.` });
    };

    const handleConjCheck = () => {
        const verb = conjugationVerbs[conjIdx];
        const corrects = verb.forms;
        const nv = conjAns.map((a, i) => normalize(a) === normalize(corrects[i]) ? 'correct' : 'incorrect');
        setConjVal(nv);
        if (nv.every(st => st === 'correct')) {
            toast({ title: "¡Perfecto!" });
            if (conjIdx < conjugationVerbs.length - 1) { setConjIdx(i => i + 1); setConjAns(Array(5).fill('')); setConjVal(Array(5).fill('unchecked')); }
            else handleTopicComplete('conjugation');
        } else toast({ variant: 'destructive', title: "Revisa la conjugación" });
    };

    const handleCheckReading = () => {
        let allOk = true; const nv: any = {};
        readingContent.questions.forEach(q => {
            const userAns = normalize(readAns[q.id] || '');
            const ok = q.a.some(a => userAns.includes(normalize(a)));
            nv[q.id] = ok ? 'correct' : 'incorrect';
            if (!ok) allOk = false;
        });
        setReadVal(nv);
        if (allOk) { toast({ title: "¡Lectura superada!" }); handleTopicComplete('reading'); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='uppercase tracking-tighter'>Vocabulary: Childhood</CardTitle><CardDescription className='font-bold text-foreground'>Escribe el significado en español (20 términos).</CardDescription></CardHeader>
                        <CardContent className="pt-6"><ScrollArea className="h-[450px] pr-4"><div className="grid grid-cols-2 gap-4">
                            <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Inglés</div><div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Español</div>
                            {childhoodVocab.map((v, i) => (
                                <Fragment key={i}>
                                    <div className="p-2 border rounded bg-white/5 font-bold text-sm uppercase">{v.en}</div>
                                    <Input value={vocabAns[i] || ''} onChange={e => { const na = [...vocabAns]; na[i] = e.target.value; setVocabAns(na); setCanAdvanceVocab(false); }} className={cn("uppercase", vocabVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={isAdmin && !!targetStudentId} />
                                </Fragment>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 bg-muted/20"><Button onClick={handleCheckVocab} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-8 text-foreground text-left overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: El Pretérito Imperfecto</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0 font-bold">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-primary uppercase mb-4">¿Para qué sirve?</h3>
                                <p className="mb-4">Se usa para describir acciones habituales en el pasado ("yo jugaba"), descripciones de personas o lugares, y estados emocionales prolongados. Equivale al "used to" en inglés.</p>
                            </div>
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-brand-purple uppercase mb-4">Conjugación Regular</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-muted rounded-xl border">
                                        <h4 className="text-primary uppercase mb-2">Verbos -AR (Hablar)</h4>
                                        <ul className="text-sm space-y-1"><li>Yo: habl<strong>aba</strong></li><li>Tú: habl<strong>abas</strong></li><li>Él/Ella: habl<strong>aba</strong></li><li>Nosotros: habl<strong>ábamos</strong></li><li>Ellos: habl<strong>aban</strong></li></ul>
                                    </div>
                                    <div className="p-4 bg-muted rounded-xl border">
                                        <h4 className="text-brand-purple uppercase mb-2">Verbos -ER/-IR (Comer/Vivir)</h4>
                                        <ul className="text-sm space-y-1"><li>Yo: com<strong>ía</strong></li><li>Tú: com<strong>ías</strong></li><li>Él/Ella: com<strong>ía</strong></li><li>Nosotros: com<strong>íamos</strong></li><li>Ellos: com<strong>ían</strong></li></ul>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-red-500 uppercase mb-4">¡Solo 3 Irregulares!</h3>
                                <div className="grid md:grid-cols-3 gap-4 text-xs">
                                    <div className="p-3 bg-muted rounded-lg border"><strong>SER:</strong> era, eras, era, éramos, eran</div>
                                    <div className="p-3 bg-muted rounded-lg border"><strong>IR:</strong> iba, ibas, iba, íbamos, iban</div>
                                    <div className="p-3 bg-muted rounded-lg border"><strong>VER:</strong> veía, veías, veía, veíamos, veían</div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'conjugation':
                const curVerb = conjugationVerbs[conjIdx];
                const pronouns = ["Yo", "Tú", "Él/Ella", "Nosotros", "Ellos/Ellas"];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tighter'>Misión: Conjugación ({conjIdx + 1}/8)</CardTitle><CardDescription>Escribe la forma correcta en Imperfecto.</CardDescription></CardHeader>
                        <CardContent className="space-y-8 pt-8">
                            <div className="flex flex-col items-center p-8 bg-gradient-to-br from-primary/5 to-brand-purple/5 rounded-[2.5rem] border-2 border-dashed border-primary/20"><span className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Verbo</span><h3 className="text-5xl font-black text-primary uppercase tracking-tighter">{curVerb.v}</h3></div>
                            <div className="grid md:grid-cols-2 gap-4 max-w-xl mx-auto">
                                {pronouns.map((p, i) => (<div key={i} className="space-y-1"><Label className="text-[10px] font-black uppercase text-muted-foreground">{p}</Label><Input value={conjAns[i] || ''} onChange={e => { const na = [...conjAns]; na[i] = e.target.value; setConjAns(na); setConjVal(v => { const nv = [...v]; nv[i] = 'unchecked'; return nv; }); }} className={cn("uppercase h-10 font-bold", conjVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : conjVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" /></div>))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/5"><Button onClick={handleConjCheck} size="lg" className="px-20 font-black h-14 text-xl shadow-xl">Verificar <ArrowRight className='ml-2'/></Button></CardFooter>
                    </Card>
                );
            case 'ex1': return <BallsExercise title="Ejercicio 1" prompts={ex1Prompts} onComplete={() => handleTopicComplete('ex1')} vocabulary={{"activo": "active", "cerca": "near", "río": "river", "muñecas": "dolls"}} />;
            case 'ex2': return <BallsExercise title="Ejercicio 2" prompts={ex2Prompts} onComplete={() => handleTopicComplete('ex2')} vocabulary={{"banco": "bank", "domingos": "Sundays", "amables": "kind", "verduras": "vegetables"}} />;
            case 'vocab_game': return <VocabularyMatchingGame data={childhoodVocab.slice(0, 10).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Memoria de la Infancia" />;
            case 'ex3': return <BallsExercise title="Ejercicio 3" prompts={ex3Prompts} onComplete={() => handleTopicComplete('ex3')} vocabulary={{"biblioteca": "library", "dibujos animados": "cartoons", "hermosa": "beautiful", "helado": "ice cream"}} />;
            case 'reading':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tight'>{readingContent.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner">{readingContent.text}</div>
                            <Separator />
                            <div className="space-y-4">
                                {readingContent.questions.map((q, i) => (
                                    <div key={q.id} className="space-y-2"><Label className="font-bold">{q.q}</Label><Input value={readAns[q.id] || ''} onChange={e => { setReadAns({...readAns, [q.id]: e.target.value}); setReadVal({...readVal, [q.id]: 'unchecked'}); }} className={cn(readVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[q.id] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" /></div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={handleCheckReading} variant="secondary">Verificar Lectura</Button><Button onClick={() => handleTopicComplete('reading')} disabled={!Object.values(readVal).every(v => v === 'correct') && !isAdmin} className='ml-2 text-white font-bold'>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'ex4':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>Ejercicio 4: Opciones</CardTitle><div className="flex gap-2 pt-4">{ex4OptionsPrompts.map((_, i) => (<div key={i} className={cn("h-2 flex-1 rounded-full", i < choiceIdx ? "bg-green-500" : i === choiceIdx ? "bg-primary" : "bg-muted")} />))}</div></CardHeader>
                        <CardContent className="space-y-8 pt-10">
                            <div className="p-8 bg-muted rounded-2xl border-2 border-dashed font-bold text-2xl text-center uppercase tracking-tighter text-foreground">"{ex4OptionsPrompts[choiceIdx].s}"</div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {ex4OptionsPrompts[choiceIdx].options.map(opt => (
                                    <Button key={opt} onClick={() => { const ok = opt === ex4OptionsPrompts[choiceIdx].answer; setChoiceVal({...choiceVal, [choiceIdx]: ok ? 'correct' : 'incorrect'}); if (ok) { toast({ title: "¡Correcto!" }); if (choiceIdx < ex4OptionsPrompts.length - 1) setTimeout(() => setChoiceIdx(i => i + 1), 800); } else toast({ variant: 'destructive', title: "Incorrecto" }); }} variant="outline" className={cn("h-16 text-xl font-black uppercase", choiceVal[choiceIdx] === 'correct' && opt === ex4OptionsPrompts[choiceIdx].answer ? 'bg-green-500 text-white' : '')}>{opt}</Button>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('ex4')} disabled={Object.keys(choiceVal).length < ex4OptionsPrompts.length && !isAdmin} className='px-16 font-bold h-12'>Finalizar Misión</Button></CardFooter>
                    </Card>
                );
            case 'completar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle>Misión: Completar (30 frases)</CardTitle></CardHeader>
                        <CardContent className="p-0"><ScrollArea className="h-[450px] p-6"><div className="space-y-4">
                            {completarPrompts.map((q, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm">
                                    <p className="font-bold text-lg">{q.s}</p>
                                    <Input value={compAns[i] || ''} onChange={e => { const na = [...compAns]; na[i] = e.target.value; setCompAns(na); setCompVal(v => { const nv = [...v]; nv[i] = 'unchecked'; return nv; }); }} className={cn("h-10 max-w-sm uppercase font-bold", compVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : compVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" />
                                </div>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/20"><Button onClick={() => {
                            let ok = true; const nv = completarPrompts.map((q, i) => { const res = normalize(q.a) === normalize(compAns[i] || ''); if (!res) ok = false; return res ? 'correct' : 'incorrect'; });
                            setCompVal(nv); if (ok) { toast({ title: "¡Misión Cumplida!" }); handleTopicComplete('completar'); } else toast({ variant: 'destructive', title: "Hay errores" });
                        }} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">Verificar Todo</Button></CardFooter>
                    </Card>
                );
            case 'translate_text':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div><CardTitle>Traducir Texto: Mi Infancia</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el párrafo al español.</CardDescription></div>
                                <Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger><PopoverContent className="w-64">
                                    <ScrollArea className="h-48 pr-4"><div className="space-y-2 text-sm">{Object.entries({ "used to be": "solía ser", "neighborhood": "barrio", "hide and seek": "escondite", "every day": "cada día", "happy": "feliz" }).map(([en, es]) => (<div key={en} className="flex justify-between border-b pb-1"><span className="text-muted-foreground">{en}:</span><span className="font-bold text-primary">{es}</span></div>))}</div></ScrollArea>
                                </PopoverContent></Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed shadow-sm">"When I was a child, I used to be very happy. I lived in a quiet neighborhood and played with my friends every day. We played hide and seek and rode our bicycles in the park. My mother always cooked delicious food and we ate together at noon. I loved my childhood!"</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={textTrans} onChange={e => setTextTrans(e.target.value)} placeholder="Escribe en español aquí..." className="min-h-[200px] text-lg" /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20"><Button onClick={() => handleTopicComplete('translate_text')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl uppercase">Continuar <ArrowRight className='ml-2 h-8 w-8'/></Button></CardFooter>
                    </Card>
                );
            case 'final':
                if (isFinished) return <Card className="p-12 text-center flex flex-col items-center animate-in fade-in zoom-in border-2 border-green-500 bg-card/95"><Trophy className="h-24 w-24 text-yellow-400 mb-6 animate-bounce" /><h2 className="text-4xl font-black uppercase text-primary tracking-tighter">¡FELICITACIONES!</h2><p className="text-2xl mt-4 font-bold text-foreground">Has terminado la clase 7 (A2) - Imperfecto</p><Button asChild className="mt-8 px-12 h-12 font-bold" variant="outline"><Link href="/espanol/a2">Volver al Curso</Link></Button></Card>;
                return <BallsExercise title="Reto Final: Negativas" prompts={negativePrompts} onComplete={() => setIsFinished(true)} vocabulary={{ "juguetes": "toys", "ciudad": "city" }} />;
            default: return null;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {targetStudentId && isAdmin && (
                        <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md">
                            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400"><Star className="h-6 w-6 fill-current animate-pulse" /><p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión Activo: {studentProfile?.name || targetStudentId}</p></div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10"><Link href="/admin">Cerrar</Link></Button>
                        </div>
                    )}
                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/a2" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver al Curso A2</Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3"><History className='h-10 w-10 text-primary' /> El Copretérito (Imperfecto) 🇪🇸</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30">
                                    <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Misión A2</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <nav><ul className="space-y-1">
                                        {learningPath.map((item) => {
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            const Icon = ICONS_CONFIG[item.status as keyof typeof ICONS_CONFIG] || BookOpen;
                                            return (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm')}>
                                                    <div className="flex items-center gap-3">{item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}<span className="truncate max-w-[150px] text-[10px] uppercase font-bold">{item.name}</span></div>
                                                    {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                                </li>
                                            );
                                        })}
                                    </ul></nav>
                                    <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 font-black uppercase text-muted-foreground"><span>Avance Total</span><span className="text-primary">{progressValue}%</span></div><Progress value={progressValue} className="h-2 rounded-full" /></div></CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function ImperfectoPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}>
            <ImperfectoContent />
        </Suspense>
    );
}