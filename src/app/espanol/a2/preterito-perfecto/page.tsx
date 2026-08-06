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
    Activity,
    Check,
    X,
    BookText as BookIcon,
    ListChecks,
    Zap
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
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_a2_pret_perf_v8_all_exercises_fixed';
const mainProgressKey = 'progress_a2_es_preterito_perfecto';

// --- DATA ---

const recentVocab = [
    { en: "THIS WEEK", es: "ESTA SEMANA" }, { en: "TODAY", es: "HOY" }, { en: "THIS MONTH", es: "ESTE MES" },
    { en: "RECENTLY", es: "RECIENTEMENTE" }, { en: "YET / STILL", es: "TODAVÍA" }, { en: "ALREADY", es: "YA" },
    { en: "LATELY", es: "ÚLTIMAMENTE" }, { en: "THIS YEAR", es: "ESTE AÑO" }, { en: "SO FAR", es: "HASTA AHORA" },
    { en: "THIS MORNING", es: "ESTA MAÑANA" }, { en: "A FEW DAYS AGO", es: "HACE UNOS DÍAS" }, { en: "JUST NOW", es: "AHORA MISMO" },
    { en: "EVER", es: "ALGUNA VEZ" }, { en: "NEVER", es: "NUNCA" }, { en: "ALWAYS", es: "SIEMPRE" },
    { en: "MANY TIMES", es: "MUCHAS VECES" }, { en: "ONCE", es: "UNA VEZ" }, { en: "TWICE", es: "DOS VECES" },
    { en: "SEVERAL TIMES", es: "VARIAS VECES" }, { en: "FINALLY", es: "FINALMENTE" }
];

const irregularParticiples = [
    { v: "HACER", p: "hecho" }, { v: "VER", p: "visto" }, { v: "ESCRIBIR", p: "escrito" },
    { v: "DECIR", p: "dicho" }, { v: "ABRIR", p: "abierto" }, { v: "PONER", p: "puesto" },
    { v: "VOLVER", p: "vuelto" }, { v: "ROMPER", p: "roto" }, { v: "MORIR", p: "muerto" }
];

const conjugationVerbs = [
    "HABLAR", "COMER", "VIVIR", "HACER", "VER", "ESCRIBIR", "DECIR", "ABRIR", "PONER", "VOLVER",
    "ROMPER", "MORIR", "ESTUDIAR", "TRABAJAR", "DORMIR", "BEBER", "LIMPIAR", "COCINAR", "VIAJAR", "LLEGAR",
    "COMPRAR", "CANTAR", "BAILAR", "ESCUCHAR", "LEER", "APRENDER", "CERRAR", "ENTENDER", "RECIBIR", "AYUDAR"
];

const ex1Prompts = [
    { en: "I have eaten a pizza.", es: ["he comido una pizza", "yo he comido una pizza"] },
    { en: "You have lived in Bogota.", es: ["has vivido en bogotá", "tú has vivido en bogota"] },
    { en: "He has worked a lot today.", es: ["ha trabajado mucho hoy", "él ha trabajado mucho hoy"] },
    { en: "We have traveled this week.", es: ["hemos viajado esta semana", "nosotros hemos viajado esta semana"] },
    { en: "They have spoken with me.", es: ["han hablado conmigo", "ellos han hablado conmigo"] },
    { en: "She has cleaned the house.", es: ["ha limpiado la casa", "ella ha limpiado la casa"] },
    { en: "I have studied for the exam.", es: ["he estudiado para el examen"] },
    { en: "You have drunk orange juice.", es: ["has bebido jugo de naranja"] },
    { en: "We have learned Spanish.", es: ["hemos aprendido español"] },
    { en: "They have arrived late.", es: ["han llegado tarde"] },
    { en: "He has cooked dinner.", es: ["ha cocinado la cena"] },
    { en: "She has bought new shoes.", es: ["ha comprado zapatos nuevos"] },
];

const ex2Prompts = [
    { en: "I have done the homework.", es: ["he hecho la tarea", "yo he hecho la tarea"] },
    { en: "You have seen that movie.", es: ["has visto esa película", "tú has visto esa pelicula"] },
    { en: "He has written a letter.", es: ["ha escrito una carta", "él ha escrito una carta"] },
    { en: "We have said the truth.", es: ["hemos dicho la verdad", "nosotros hemos dicho la verdad"] },
    { en: "They have opened the door.", es: ["han abierto la puerta", "ellos han abierto la puerta"] },
    { en: "She has returned home.", es: ["ha vuelto a casa", "ella ha vuelto a casa"] },
    { en: "I have broken the window.", es: ["he roto la ventana"] },
    { en: "You have put the keys on the table.", es: ["has puesto las llaves sobre la mesa"] },
    { en: "He has died recently.", es: ["ha muerto recientemente"] },
    { en: "We have made a mistake.", es: ["hemos hecho un error", "hemos cometido un error"] },
    { en: "They have seen the accident.", es: ["han visto el accidente"] },
    { en: "She has written a poem.", es: ["ha escrito un poema"] },
];

const ex3Prompts = [
    { en: "Have you ever been to Spain?", es: ["¿has estado alguna vez en españa?", "has estado alguna vez en españa"] },
    { en: "I have already finished my work.", es: ["ya he terminado mi trabajo", "yo ya he terminado mi trabajo"] },
    { en: "She hasn't arrived yet.", es: ["todavía no ha llegado", "ella aún no ha llegado"] },
    { en: "They have never eaten sushi.", es: ["nunca han comido sushi", "ellos nunca han comido sushi"] },
    { en: "Have you seen him lately?", es: ["¿lo has visto últimamente?", "lo has visto ultimamente?"] },
    { en: "We have already seen that film.", es: ["ya hemos visto esa película"] },
    { en: "He has finally finished.", es: ["finalmente ha terminado", "por fin ha terminado"] },
    { en: "I have visited France twice.", es: ["he visitado francia dos veces"] },
    { en: "Have they ever traveled by plane?", es: ["¿han viajado alguna vez en avión?"] },
    { en: "She has lived here for many years.", es: ["ha vivido aquí por muchos años"] },
    { en: "I have never said that.", es: ["nunca he dicho eso"] },
    { en: "We have had many experiences.", es: ["hemos tenido muchas experiencias"] },
    { en: "Has he done his job?", es: ["¿ha hecho su trabajo?"] },
    { en: "I haven't seen them so far.", es: ["no los he visto hasta ahora"] },
    { en: "They have already left.", es: ["ya se han ido", "ya han salido"] },
];

const ex4ChoicePrompts = [
    { s: "1. Yo _______ (comer) mucho hoy.", options: ["HE COMIDO", "HAS COMIDO", "HA COMIDO"], answer: "HE COMIDO" },
    { s: "2. Tú _______ (ver) esa serie.", options: ["HE VISTO", "HAS VISTO", "HA VISTO"], answer: "HAS VISTO" },
    { s: "3. Él _______ (hacer) la tarea.", options: ["HA HECHO", "HAS HECHO", "HECHO"], answer: "HA HECHO" },
    { s: "4. Nosotros _______ (vivir) aquí siempre.", options: ["HEMOS VIVIDO", "HABEMOS VIVIDO", "HAN VIVIDO"], answer: "HEMOS VIVIDO" },
    { s: "5. Ellos _______ (abrir) la tienda.", options: ["HAN ABIERTO", "HA ABIERTO", "HEMOS ABIERTO"], answer: "HAN ABIERTO" },
    { s: "6. Ella _______ (escribir) un libro.", options: ["HA ESCRITO", "HA ESCRIBIDO", "HE ESCRITO"], answer: "HA ESCRITO" },
    { s: "7. ¿_______ (estar) tú en París?", options: ["HAS ESTADO", "HA ESTADO", "HE ESTADO"], answer: "HAS ESTADO" },
    { s: "8. Yo _______ (decir) la verdad.", options: ["HE DICHO", "HA DICHO", "HAS DICHO"], answer: "HE DICHO" },
    { s: "9. Nosotros _______ (volver) tarde.", options: ["HEMOS VUELTO", "HEMOS VOLVIDO", "HAN VUELTO"], answer: "HEMOS VUELTO" },
    { s: "10. Ellos _______ (romper) el vaso.", options: ["HAN ROTO", "HAN ROMPIDO", "HA ROTO"], answer: "HAN ROTO" },
];

const completarPrompts = [
    { s: "1. Yo (hablar) _______ con ella hoy.", a: "he hablado" },
    { s: "2. Tú (comer) _______ pizza esta semana.", a: "has comido" },
    { s: "3. Él (vivir) _______ en Cali recientemente.", a: "ha vivido" },
    { s: "4. Nosotros (viajar) _______ mucho este año.", a: "hemos viajado" },
    { s: "5. Ellos (ver) _______ la tele hoy.", a: "han visto" },
    { s: "6. Ella (hacer) _______ la tarea ya.", a: "ha hecho" },
    { s: "7. Yo (escribir) _______ una carta.", a: "he escrito" },
    { s: "8. Tú (abrir) _______ la ventana.", a: "has abierto" },
    { s: "9. Él (decir) _______ la verdad siempre.", a: "ha dicho" },
    { s: "10. Nosotros (romper) _______ el vaso.", a: "hemos roto" },
    { s: "11. Yo (poner) _______ la mesa.", a: "he puesto" },
    { s: "12. Ella (morir) _______ en la película.", a: "ha muerto" },
    { s: "13. ¿Tú (estudiar) _______ para el test?", a: "has estudiado" },
    { s: "14. Ellos (beber) _______ mucho café.", a: "han bebido" },
    { s: "15. Nosotros (limpiar) _______ la sala.", a: "hemos limpiado" },
    { s: "16. Yo (cocinar) _______ pasta.", a: "he cocinado" },
    { s: "17. Él (llegar) _______ a tiempo.", a: "ha llegado" },
    { s: "18. Ella (comprar) _______ flores.", a: "ha comprado" },
    { s: "19. Nosotros (aprender) _______ mucho.", a: "hemos aprendido" },
    { s: "20. Ellos (cerrar) _______ la puerta.", a: "han cerrado" },
    { s: "21. Yo (entender) _______ la lección.", a: "he entendido" },
    { s: "22. Tú (recibir) _______ un regalo.", a: "has recibido" },
    { s: "23. Él (ayudar) _______ a su madre.", a: "ha ayudado" },
    { s: "24. Nosotros (leer) _______ el libro.", a: "hemos leído" },
    { s: "25. Ella (viajar) _______ a Londres.", a: "ha viajado" },
    { s: "26. Yo (volver) _______ de las vacaciones.", a: "he vuelto" },
    { s: "27. ¿Ellos (hacer) _______ las maletas?", a: "han hecho" },
    { s: "28. Tú (ver) _______ el accidente.", a: "has visto" },
    { s: "29. Nosotros (decir) _______ todo.", a: "hemos dicho" },
    { s: "30. Él (poner) _______ su abrigo.", a: "ha puesto" },
];

const negativePrompts = [
    { en: "I haven't eaten sushi.", es: ["no he comido sushi", "yo no he comido sushi"] },
    { en: "You haven't seen the movie.", es: ["no has visto la película", "tú no has visto la pelicula"] },
    { en: "He hasn't worked today.", es: ["no ha trabajado hoy", "él no ha trabajado hoy"] },
    { en: "We haven't traveled this month.", es: ["no hemos viajado este mes", "nosotros no hemos viajado este mes"] },
    { en: "They haven't spoken yet.", es: ["no han hablado todavía", "ellos no han hablado aún"] },
    { en: "She hasn't opened the window.", es: ["no ha abierto la ventana"] },
    { en: "I haven't done my homework.", es: ["no he hecho mi tarea"] },
    { en: "You haven't told the truth.", es: ["no has dicho la verdad"] },
    { en: "We haven't returned the book.", es: ["no hemos vuelto el libro", "no hemos devuelto el libro"] },
    { en: "They haven't put the keys there.", es: ["no han puesto las llaves allí"] },
    { en: "He hasn't broken anything.", es: ["no ha roto nada"] },
    { en: "She hasn't arrived so far.", es: ["no ha llegado hasta ahora"] },
    { en: "I haven't traveled recently.", es: ["no he viajado recientemente"] },
    { en: "You haven't written the letter.", es: ["no has escrito la carta"] },
    { en: "We haven't seen him today.", es: ["no lo hemos visto hoy"] },
];

const translateTextData = {
    english: "I have had a very busy week. I have worked until late every day and I have visited many clients. My brother has also had a lot of work. He has written several reports and he has done many meetings. Today, we have finally finished everything. We haven't traveled recently, but we are going to rest this weekend.",
    vocab: { "busy": "ocupado", "worked": "trabajado", "late": "tarde", "visited": "visitado", "reports": "informes", "meetings": "reuniones", "finally": "finalmente", "rest": "descansar" }
};

const ICONS_CONFIG_MAP = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- HELPERS ---

const normalize = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[.?,¿!¡]/g, "").replace(/\s+/g, ' ');

const BallsExercise = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setCurrentIndex(0); setAnswer(''); setStatus({}); }, [prompts]);
    useEffect(() => { setAnswer(''); }, [currentIndex]);

    const handleCheck = () => {
        const userVal = normalize(answer);
        const corrects = prompts[currentIndex].es.map((a: string) => normalize(a));
        const isOk = corrects.includes(userVal);
        setStatus(prev => ({ ...prev, [currentIndex]: isOk ? 'correct' : 'incorrect' }));
        if (isOk) toast({ title: "¡Buen trabajo!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start text-left">
                    <div className="w-full">
                        <CardTitle className='text-primary uppercase tracking-tighter'>{title}</CardTitle>
                        <CardDescription className='font-bold text-foreground mt-1'>Traduce al español correctamente.</CardDescription>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0">
                                    <BookIcon className="mr-2 h-4 w-4" /> Vocabulary
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4 text-left">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-foreground">
                                        {Object.entries(vocabulary).map(([es, en]: any) => (
                                            <Fragment key={es}>
                                                <span className="text-muted-foreground capitalize">{es}:</span>
                                                <span className="font-semibold text-right">{en}</span>
                                            </Fragment>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-8 rounded-2xl border-2 border-dashed text-center font-bold text-2xl uppercase tracking-tighter text-foreground">{prompts[currentIndex].en}</div>
                <Input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-12 text-lg text-foreground", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/5' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder="Escribe en español..." autoComplete="off" />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck} variant="secondary">Verificar</Button>
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={status[currentIndex] !== 'correct'} className="text-white font-bold">{currentIndex === prompts.length - 1 ? 'Finalizar' : 'Siguiente'}</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const ChoiceExercise = ({ prompts, onComplete, title }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    const handleSelect = (option: string) => {
        const isCorrect = option.toUpperCase() === prompts[currentIndex].answer.toUpperCase();
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Correcto!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
            <CardHeader>
                <CardTitle className='text-primary uppercase tracking-tighter'>{title}</CardTitle>
                <CardDescription className='font-bold text-foreground'>Elige la opción correcta para el Pretérito Perfecto.</CardDescription>
                <div className="flex gap-2 justify-start flex-wrap pt-4">
                    {prompts.map((_: any, i: number) => (
                        <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card")}>{i + 1}</div>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-8 py-10">
                <div className="text-2xl font-bold text-center leading-relaxed">
                    {prompts[currentIndex].s.split('_______').map((part: string, i: number) => (
                        <Fragment key={i}>{part}{i < 1 && <span className="text-primary border-b-2 border-dashed border-primary px-4 mx-2">{status[currentIndex] === 'correct' ? prompts[currentIndex].answer : '...'}</span>}</Fragment>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    {prompts[currentIndex].options.map((opt: string) => (
                        <Button key={opt} onClick={() => handleSelect(opt)} variant="outline" className={cn("h-16 text-lg font-black uppercase", status[currentIndex] === 'correct' && opt.toUpperCase() === prompts[currentIndex].answer.toUpperCase() && "border-green-500 bg-green-50 text-green-700")}>{opt}</Button>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6"><Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button><Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={status[currentIndex] !== 'correct'} className="px-12 font-bold">Siguiente</Button></CardFooter>
        </Card>
    );
};

// --- MAIN PAGE ---

function PreteritoPerfectoContent() {
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
    const [vocabAns, setVocabAns] = useState<string[]>(Array(recentVocab.length).fill(''));
    const [vocabVal, setVocabVal] = useState<any[]>(Array(recentVocab.length).fill('unchecked'));
    const [conjIdx, setConjIdx] = useState(0);
    const [conjAns, setConjAns] = useState<string[]>(Array(5).fill(''));
    const [conjVal, setConjVal] = useState<any[]>(Array(5).fill('unchecked'));
    const [completarAns, setCompletarAns] = useState<string[]>(Array(completarPrompts.length).fill(''));
    const [completarVal, setCompletarVal] = useState<any[]>(Array(completarPrompts.length).fill('unchecked'));
    const [translationText, setTranslationText] = useState('');

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
        { key: 'completar', name: '10. COMPLETAR', icon: Trophy, status: 'locked' },
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
        setTimeout(() => setIsInitialLoading(false), 200);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete, targetStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || targetStudentId) return;
        const s: any = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => { s[item.key] = item.status; });
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, initialLoadComplete, targetStudentId]);

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (topicKey === 'grammar' && topic?.status !== 'completed') setTopicToComplete(topicKey);
    };

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(curr => {
            const np = curr.map(t => ({ ...t }));
            const idx = np.findIndex(t => t.key === topicToComplete);
            if (idx !== -1 && np[idx].status !== 'completed') {
                np[idx].status = 'completed';
                if (idx + 1 < np.length && np[idx + 1].status === 'locked') {
                    np[idx + 1].status = 'active'; setSelectedTopic(np[idx + 1].key);
                    setTimeout(() => toast({ title: "¡Siguiente misión desbloqueada!" }), 0);
                }
            }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleConjCheck = () => {
        const verb = conjugationVerbs[conjIdx];
        let root = verb.toLowerCase();
        let participle = root.endsWith('ar') ? root.slice(0, -2) + 'ado' : root.slice(0, -2) + 'ido';
        const irr = irregularParticiples.find(p => p.v === verb);
        if (irr) participle = irr.p;

        const corrects = [
            "he " + participle, "has " + participle, "ha " + participle, "hemos " + participle, "han " + participle
        ];

        const nv = conjAns.map((a, i) => normalize(a) === normalize(corrects[i]) ? 'correct' : 'incorrect');
        setConjVal(nv);
        if (nv.every(v => v === 'correct')) {
            toast({ title: "¡Perfecto!" });
            if (conjIdx < 29) { setConjIdx(p => p + 1); setConjAns(Array(5).fill('')); setConjVal(Array(5).fill('unchecked')); }
            else setTopicToComplete('conjugation');
        } else toast({ variant: 'destructive', title: "Revisa la conjugación" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle>Vocabulario: Experiencias Recientes</CardTitle></CardHeader>
                        <CardContent className="pt-6"><ScrollArea className="h-[450px] pr-4"><div className="grid grid-cols-2 gap-4">
                            <div className="font-black text-primary border-b pb-2 uppercase text-xs">Inglés</div><div className="font-black text-primary border-b pb-2 uppercase text-xs">Español</div>
                            {recentVocab.map((v, i) => (<Fragment key={i}><div className="flex items-center font-bold py-1 text-sm uppercase">{v.en}</div><Input value={vocabAns[i]} onChange={e => { const na = [...vocabAns]; na[i] = e.target.value; setVocabAns(na); }} className={cn("uppercase", vocabVal[i] === 'correct' ? 'border-green-500' : vocabVal[i] === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></Fragment>))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="flex justify-between border-t pt-6"><Button onClick={() => { const nv = recentVocab.map((v, i) => (normalize(vocabAns[i]) === normalize(v.es) ? 'correct' : 'incorrect')); setVocabVal(nv); if (nv.every(v => v === 'correct')) setTopicToComplete('vocabulary'); }} variant="secondary">Verificar</Button><Button onClick={() => setTopicToComplete('vocabulary')} disabled={!vocabVal.every(v => v === 'correct') && !isAdmin} className='font-bold'>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-8 text-left text-foreground overflow-hidden font-bold">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Pretérito Perfecto</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-primary uppercase mb-4">¿Qué es?</h3>
                                <p>Se usa para hablar de acciones que ocurrieron en el pasado pero continúan o tienen relevancia en el presente.</p>
                                <div className='mt-4 p-4 bg-primary/10 rounded-xl border-l-4 border-primary'><p>Fórmula: HABER (Auxiliar) + PARTICIPIO (-ado, -ido)</p></div>
                                <ul className='list-disc pl-5 mt-4 space-y-1 text-sm'>
                                    <li>Yo <strong>he</strong> comido</li>
                                    <li>Tú <strong>has</strong> vivido</li>
                                    <li>Él/Ella <strong>ha</strong> trabajado</li>
                                    <li>Nosotros <strong>hemos</strong> viajado</li>
                                    <li>Ellos <strong>han</strong> terminado</li>
                                </ul>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => setTopicToComplete('grammar')} size="lg" className="px-24 font-black h-14 uppercase">Comprendido</Button></CardFooter>
                    </Card>
                );
            case 'conjugation':
                const curV = conjugationVerbs[conjIdx];
                const pronouns = ["Yo", "Tú", "Él/Ella", "Nosotros", "Ellos/Ellas"];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tighter'>Misión: Conjugación Compuesta ({conjIdx + 1}/30)</CardTitle><CardDescription>Escribe la forma completa (Auxiliar Haber + Participio).</CardDescription></CardHeader>
                        <CardContent className="space-y-8 pt-8"><div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-primary/5 to-brand-purple/5 rounded-[2.5rem] border-2 border-dashed border-primary/20"><span className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Verbo Infinitivo</span><h3 className="text-5xl font-black text-primary uppercase tracking-tighter">{curV}</h3></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">{pronouns.map((p, i) => (<div key={i} className="space-y-1.5"><Label className="text-xs font-black uppercase text-muted-foreground">{p}</Label><Input value={conjAns[i]} onChange={e => { const na = [...conjAns]; na[i] = e.target.value; setConjAns(na); setConjVal(v => { const nv = [...v]; nv[i] = 'unchecked'; return nv; }); }} className={cn("h-12 text-lg font-bold border-2", conjVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : conjVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder="..." autoComplete="off" /></div>))}</div></CardContent>
                        <CardFooter className="justify-center border-t p-8 bg-muted/5"><Button onClick={handleConjCheck} size="lg" className="px-20 font-black h-14 text-xl shadow-xl">Verificar Verbo <ArrowRight className="ml-2 h-5 w-5" /></Button></CardFooter>
                    </Card>
                );
            case 'ex1': return <BallsExercise title="Ejercicio 1: Pretérito Perfecto" prompts={ex1Prompts} onComplete={() => setTopicToComplete('ex1')} vocabulary={{"pizza": "pizza", "trabajado": "worked", "viajado": "traveled"}} />;
            case 'ex2': return <BallsExercise title="Ejercicio 2: Participios Irregulares" prompts={ex2Prompts} onComplete={() => setTopicToComplete('ex2')} vocabulary={{"hecho": "done", "visto": "seen", "escrito": "written", "dicho": "said"}} />;
            case 'vocab_game': return <VocabularyMatchingGame data={recentVocab.slice(0, 10).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => setTopicToComplete('vocab_game')} title="Memory: Experiencias" />;
            case 'ex3': return <BallsExercise title="Ejercicio 3: Mezcla" prompts={ex3Prompts} onComplete={() => setTopicToComplete('ex3')} vocabulary={{"alguna vez": "ever", "ya": "already", "todavía no": "not yet", "nunca": "never"}} />;
            case 'reading':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle>Lectura: Mi Semana Reciente</CardTitle></CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner">"Hola, soy Mario. Esta semana ha sido muy interesante. Hoy he terminado mi proyecto de español. Ayer he visto a mis amigos y hemos comido en un restaurante nuevo. Todavía no he ido al gimnasio, pero he caminado mucho en el parque. Recientemente he aprendido muchas palabras nuevas."</div>
                            <Separator /><div className="space-y-4">
                                {["¿Qué ha hecho Mario hoy?", "¿Donde ha comido con sus amigos?", "¿Qué no ha hecho todavía?"].map((q, i) => (
                                    <div key={i} className="space-y-2"><Label className='font-bold'>{q}</Label><Input autoComplete="off" /></div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => setTopicToComplete('reading')} size="lg" className="px-16 font-bold">Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'ex4': return <ChoiceExercise title="Ejercicio 4: Opciones" prompts={ex4ChoicePrompts} onComplete={() => setTopicToComplete('ex4')} />;
            case 'completar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tight'>Completar: Pretérito Perfecto (30)</CardTitle></CardHeader>
                        <CardContent className="p-0"><ScrollArea className="h-[500px] p-6"><div className="space-y-4">
                            {completarPrompts.map((q, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm"><p className="font-bold text-lg">{q.s}</p><Input value={completarAns[i]} onChange={e => { const na = [...completarAns]; na[i] = e.target.value; setCompletarAns(na); }} className={cn("h-10 max-w-sm", completarVal[i] === 'correct' ? 'border-green-500' : completarVal[i] === 'incorrect' ? 'border-red-500' : '')} placeholder="Respuesta..." autoComplete="off" /></div>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/20"><Button onClick={() => { const nv = completarPrompts.map((p, i) => (normalize(completarAns[i]) === normalize(p.a) ? 'correct' : 'incorrect')); setCompletarVal(nv); if (nv.every(v => v === 'correct')) handleTopicComplete('completar'); }} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">Verificar Todo</Button></CardFooter>
                    </Card>
                );
            case 'translate_text':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader className='flex flex-row justify-between items-center'><CardTitle className='text-primary uppercase'>Traducción de Texto</CardTitle>
                        <Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookIcon className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger>
                        <PopoverContent className="w-64"><ScrollArea className="h-48 pr-4 text-left"><div className="grid grid-cols-2 gap-2 text-sm text-foreground">{Object.entries(translateTextData.vocab).map(([en, es]: any) => (<Fragment key={en}><span className="text-muted-foreground capitalize">{en}:</span><span className="font-semibold text-right">{es}</span></Fragment>))}</div></ScrollArea></PopoverContent></Popover></CardHeader>
                        <CardContent className="space-y-6 pt-6"><div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed shadow-sm">"{translateTextData.english}"</div><Separator /><Textarea value={translationText} onChange={e => setTranslationText(e.target.value)} placeholder="Traduce el párrafo aquí..." className="min-h-[200px]" /></CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => setTopicToComplete('translate_text')} size="lg" className="px-24 font-black">Continuar <ArrowRight className='ml-3'/></Button></CardFooter>
                    </Card>
                );
            case 'final': return <BallsExercise title="Reto Final: Negativas" prompts={negativePrompts} onComplete={() => setTopicToComplete('final')} vocabulary={{"no he comido": "haven't eaten", "todavía": "yet", "recientemente": "recently", "carta": "letter"}} />;
            default: return null;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {targetStudentId && isAdmin && (
                        <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md"><div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400"><Star className="h-6 w-6 fill-current animate-pulse" /><p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión Activo</p></div><Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10"><Link href="/admin">Cerrar</Link></Button></div>
                    )}
                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/a2" className="hover:underline text-sm font-bold flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver al Curso A2</Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3"><Zap className='h-10 w-10 text-primary' /> Pretérito Perfecto 🇪🇸</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
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
                                            const Icon = ICONS_CONFIG_MAP[item.status as keyof typeof ICONS_CONFIG_MAP] || BookOpen;
                                            return (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm')}>
                                                    <div className="flex items-center gap-3">{item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}<span className="truncate max-w-[150px] uppercase font-bold text-[10px] text-foreground">{item.name}</span></div>
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
                </div>
            </main>
        </div>
    );
}

export default function PreteritoPerfectoPage() {
    return (<Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}><PreteritoPerfectoContent /></Suspense>);
}