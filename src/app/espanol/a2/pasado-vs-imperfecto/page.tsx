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
    Split,
    Check,
    X,
    Info,
    ListChecks,
    Zap,
    User
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_a2_ps_vs_imp_v2_full_content';
const mainProgressKey = 'progress_a2_es_pasado_vs_imperfecto';

// --- DATA ---
const biographiesVocab = [
    { en: "TO BE BORN", es: "NACER" }, { en: "TO GROW UP", es: "CRECER" }, { en: "TO STUDY", es: "ESTUDIAR" },
    { en: "TO WORK", es: "TRABAJAR" }, { en: "TO MOVE", es: "MUDARSE" }, { en: "TO GET MARRIED", es: "CASARSE" },
    { en: "TO HAVE CHILDREN", es: "TENER HIJOS" }, { en: "TO TRAVEL", es: "VIAJAR" }, { en: "TO GRADUATE", es: "GRADUARSE" },
    { en: "TO RETIRE", es: "JUBILARSE" }, { en: "TO START A BUSINESS", es: "MONTAR UN NEGOCIO" }, { en: "TO WIN", es: "GANAR" },
    { en: "TO DIE", es: "MORIR" }, { en: "TO DISCOVER", es: "DESCUBRIR" }, { en: "TO LIVE", es: "VIVIR" },
    { en: "TO BUY", es: "COMPRAR" }, { en: "TO WRITE", es: "ESCRIBIR" }, { en: "TO CREATE", es: "CREAR" },
    { en: "TO BECOME", es: "CONVERTIRSE" }, { en: "TO MEET", es: "CONOCER" }
];

const ex1Prompts = [
    { en: "I was born in 1990.", es: ["nací en 1990", "yo nací en 1990"] },
    { en: "He moved to Spain last year.", es: ["se mudó a españa el año pasado", "él se mudó a españa el año pasado"] },
    { en: "We studied a lot for the exam.", es: ["estudiamos mucho para el examen", "nosotros estudiamos mucho para el examen"] },
    { en: "They worked in that office.", es: ["trabajaron en esa oficina", "ellos trabajaron en esa oficina"] },
    { en: "She graduated in June.", es: ["se graduó en junio", "ella se graduó en junio"] },
    { en: "I bought a new car yesterday.", es: ["compré un carro nuevo ayer", "yo compré un coche nuevo ayer"] },
    { en: "You traveled to Mexico.", es: ["viajaste a méxico", "tú viajaste a méxico"] },
    { en: "He died in 2005.", es: ["murió en 2005", "él murió en 2005"] },
    { en: "They discovered the secret.", es: ["descubrieron el secreto", "ellos descubrieron el secreto"] },
    { en: "We lived there for two years.", es: ["vivimos allí por dos años", "vivimos allá dos años"] },
    { en: "I met my wife in Paris.", es: ["conocí a mi esposa en parís"] },
    { en: "She wrote a famous book.", es: ["escribió un libro famoso", "ella escribió un libro famoso"] }
];

const ex2Prompts = [
    { en: "I used to live in a small town.", es: ["vivía en un pueblo pequeño", "yo vivía en un pueblo pequeño"] },
    { en: "He was very tall when he was a child.", es: ["era muy alto cuando era niño", "él era muy alto cuando era niño"] },
    { en: "We always played together.", es: ["siempre jugábamos juntos", "nosotros siempre jugábamos juntos"] },
    { en: "They used to study at night.", es: ["estudiaban de noche", "ellos estudiaban por la noche"] },
    { en: "She was reading while I was sleeping.", es: ["ella leía mientras yo dormía"] },
    { en: "I used to work in a bank.", es: ["trabajaba en un banco", "yo trabajaba en un banco"] },
    { en: "You were very intelligent.", es: ["eras muy inteligente", "tú eras muy inteligente"] },
    { en: "He used to have a big dog.", es: ["tenía un perro grande", "él tenía un perro grande"] },
    { en: "They always traveled in summer.", es: ["siempre viajaban en verano", "ellos siempre viajaban en verano"] },
    { en: "We used to eat pizza every Friday.", es: ["comíamos pizza todos los viernes"] },
    { en: "It was a sunny day.", es: ["era un día soleado", "estaba soleado"] },
    { en: "The children were happy.", es: ["los niños estaban felices", "los niños eran felices"] }
];

const ex3Prompts = [
    { en: "Yesterday it rained, so I stayed home.", es: ["ayer llovió, así que me quedé en casa"] },
    { en: "When I was a child, I liked to run.", es: ["cuando era niño, me gustaba correr"] },
    { en: "She arrived while I was working.", es: ["ella llegó mientras yo trabajaba"] },
    { en: "He was 20 when he started his business.", es: ["él tenía 20 años cuando montó su negocio", "tenía veinte cuando empezó su negocio"] },
    { en: "We moved because the house was old.", es: ["nos mudamos porque la casa era vieja"] },
    { en: "They were eating when the phone rang.", es: ["estaban comiendo cuando el teléfono sonó"] },
    { en: "I lived in London while I studied.", es: ["viví en londres mientras estudiaba"] },
    { en: "The weather was bad, so we didn't go out.", es: ["el clima era malo, así que no salimos"] },
    { en: "He always bought bread at that store.", es: ["él siempre compraba pan en esa tienda"] },
    { en: "Suddenly, she saw her friend.", es: ["de repente, ella vio a su amigo"] },
    { en: "They used to be best friends.", es: ["eran mejores amigos"] },
    { en: "I finished my work and then I went home.", es: ["terminé mi trabajo y luego me fui a casa"] },
    { en: "She was tired because she worked hard.", es: ["estaba cansada porque trabajó duro"] },
    { en: "When we lived in Cali, we danced salsa.", es: ["cuando vivíamos en cali, bailábamos salsa"] },
    { en: "I was born in a very beautiful city.", es: ["nací en una ciudad muy hermosa"] }
];

const ex4ChoicePrompts = [
    { s: "1. Ayer _______ (ir) al cine.", options: ["fui", "iba"], answer: "fui" },
    { s: "2. Cuando _______ (ser) pequeño, jugaba mucho.", options: ["fui", "era"], answer: "era" },
    { s: "3. El lunes _______ (trabajar) hasta tarde.", options: ["trabajé", "trabajaba"], answer: "trabajé" },
    { s: "4. Siempre _______ (comer) pasta los domingos.", options: ["comí", "comía"], answer: "comía" },
    { s: "5. De repente, _______ (empezar) a llover.", options: ["empezó", "empezaba"], answer: "empezó" },
    { s: "6. Ella _______ (estar) leyendo cuando llegué.", options: ["estuvo", "estaba"], answer: "estaba" },
    { s: "7. _______ (tener) 5 años cuando aprendí a nadar.", options: ["tuve", "tenía"], answer: "tenía" },
    { s: "8. Mi abuelo _______ (ser) muy amable.", options: ["fue", "era"], answer: "era" },
    { s: "9. Anoche _______ (ver) una película de terror.", options: ["vi", "veía"], answer: "vi" },
    { s: "10. Nosotros _______ (vivir) en Madrid en 1995.", options: ["vivimos", "vivíamos"], answer: "vivimos" },
    { s: "11. Mientras ella _______ (cocinar), yo limpiaba.", options: ["cocinó", "cocinaba"], answer: "cocinaba" },
    { s: "12. Me _______ (levantar) a las 8 hoy.", options: ["levanté", "levantaba"], answer: "levanté" },
    { s: "13. La casa _______ (tener) tres habitaciones.", options: ["tuvo", "tenía"], answer: "tenía" },
    { s: "14. _______ (conocer) a mi novio en la universidad.", options: ["conocí", "conocía"], answer: "conocí" },
    { s: "15. Ella siempre _______ (llegar) temprano.", options: ["llegó", "llegaba"], answer: "llegaba" },
    { s: "16. _______ (hacer) mucho frío anoche.", options: ["hizo", "hacía"], answer: "hizo" },
    { s: "17. Cuando _______ (llegar) a casa, cené.", options: ["llegué", "llegaba"], answer: "llegué" },
    { s: "18. Los niños _______ (estar) felices en el parque.", options: ["estuvieron", "estaban"], answer: "estaban" },
    { s: "19. El examen _______ (ser) muy difícil.", options: ["fue", "era"], answer: "fue" },
    { s: "20. Yo _______ (querer) viajar a Japón.", options: ["quise", "quería"], answer: "quería" }
];

const completarPrompts = [
    { s: "1. Yo (nacer) _______ en Cali.", a: "nací" },
    { s: "2. Cuando (ser) _______ niño, (vivir) _______ en una finca.", a: "era, vivía" },
    { s: "3. Ayer (ir) _______ al centro comercial.", a: "fui" },
    { s: "4. Ella (estar) _______ cansada porque (trabajar) _______ mucho.", a: "estaba, trabajó" },
    { s: "5. Mientras nosotros (estudiar) _______, ellos (jugar) _______.", a: "estudiábamos, jugaban" },
    { s: "6. (Tener) _______ diez años cuando (conocer) _______ a mi mejor amigo.", a: "tenía, conocí" },
    { s: "7. El año pasado (viajar) _______ a España.", a: "viajé" },
    { s: "8. Mi abuela siempre (hacer) _______ pasteles deliciosos.", a: "hacía" },
    { s: "9. De repente, el gato (saltar) _______ sobre la mesa.", a: "saltó" },
    { s: "10. La película (ser) _______ muy aburrida.", a: "era" },
    { s: "11. Yo (estudiar) _______ medicina durante cinco años.", a: "estudié" },
    { s: "12. Ella (tener) _______ el pelo largo cuando era joven.", a: "tenía" },
    { s: "13. Ayer (comer) _______ sushi por primera vez.", a: "comí" },
    { s: "14. Nosotros (estar) _______ en la playa cuando (empezar) _______ a llover.", a: "estábamos, empezó" },
    { s: "15. (Hacer) _______ mucho sol el sábado pasado.", a: "hizo" },
    { s: "16. Mi padre (trabajar) _______ en una fábrica.", a: "trabajaba" },
    { s: "17. ¿(Ver) _______ tú la televisión anoche?", a: "viste" },
    { s: "18. Cuando (llegar) _______ a la oficina, la reunión ya había empezado.", a: "llegué" },
    { s: "19. Ellos (mudarse) _______ a este barrio hace un mes.", a: "se mudaron" },
    { s: "20. Siempre (beber) _______ café antes de trabajar.", a: "bebía" },
    { s: "21. El edificio (ser) _______ muy antiguo.", a: "era" },
    { s: "22. Yo (perder) _______ mis llaves en el parque.", a: "perdí" },
    { s: "23. Ella (sentirse) _______ mal, así que se fue a casa.", a: "se sentía" },
    { s: "24. Nosotros (aprender) _______ mucho en esa clase.", a: "aprendimos" },
    { s: "25. Cuando (vivir) _______ en Londres, (ir) _______ mucho al teatro.", a: "vivía, iba" },
    { s: "26. Ayer (escribir) _______ una carta a mi tía.", a: "escribí" },
    { s: "27. (Haber) _______ mucha gente en la fiesta.", a: "había" },
    { s: "28. Él (comprar) _______ una casa el año pasado.", a: "compró" },
    { s: "29. ¿Qué (hacer) _______ tú ayer a las cinco?", a: "hacías" },
    { s: "30. Yo (querer) _______ ser astronauta cuando era pequeño.", a: "quería" }
];

const negativePrompts = [
    { en: "I didn't work yesterday.", es: ["no trabajé ayer", "yo no trabajé ayer"] },
    { en: "He wasn't happy at that job.", es: ["no era feliz en ese trabajo", "él no estaba feliz en ese trabajo"] },
    { en: "We didn't use to study together.", es: ["no estudiábamos juntos", "nosotros no solíamos estudiar juntos"] },
    { en: "They didn't move to the city.", es: ["no se mudaron a la ciudad", "ellos no se mudaron a la ciudad"] },
    { en: "She didn't like the food.", es: ["no le gustó la comida", "a ella no le gustaba la comida"] },
    { en: "I wasn't in Paris in 2010.", es: ["no estaba en parís en 2010", "no estuve en parís en 2010"] },
    { en: "You didn't graduate last year.", es: ["no te graduaste el año pasado", "tú no te graduaste el año pasado"] },
    { en: "We weren't rich.", es: ["no éramos ricos", "no fuimos ricos"] },
    { en: "He didn't die in the accident.", es: ["no murió en el accidente", "él no murió en el accidente"] },
    { en: "They didn't buy the house because it was small.", es: ["no compraron la casa porque era pequeña"] },
    { en: "I didn't see you at the party.", es: ["no te vi en la fiesta"] },
    { en: "She didn't have children when she lived here.", es: ["no tenía hijos cuando vivía aquí"] },
    { en: "We didn't travel in winter.", es: ["no viajamos en invierno", "no viajábamos en invierno"] },
    { en: "They didn't know the truth.", es: ["no sabían la verdad", "no supieron la verdad"] },
    { en: "It wasn't a good idea.", es: ["no fue una buena idea", "no era una buena idea"] }
];

const translateTextData = {
    english: "Last year, I traveled to Colombia. When I arrived, the weather was beautiful. I visited many cities and I met very friendly people. When I lived in Bogota, I always drank coffee in the morning. One day, I saw a famous singer in a restaurant. He was eating with his family. I was very excited!",
    vocab: { "travel": "viajar", "arrive": "llegar", "weather": "clima / tiempo", "met": "conocí", "friendly": "amigable / amable", "drank": "bebía", "saw": "vi", "excited": "emocionado" }
};

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- HELPER COMPONENTS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setCurrentIndex(0); setAnswer(''); setStatus({}); }, [prompts]);
    useEffect(() => { setAnswer(''); }, [currentIndex]);

    const handleCheck = () => {
        const userVal = answer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const isCorrect = prompts[currentIndex].es.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Buen trabajo!" });
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
                            <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                            <PopoverContent className="w-64"><ScrollArea className="h-48 pr-4 text-left"><div className="grid grid-cols-2 gap-2 text-sm text-foreground">{Object.entries(vocabulary).map(([es, en]: any) => (<Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-semibold text-right">{en}</span></Fragment>))}</div></ScrollArea></PopoverContent>
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

const ChoiceExercise = ({ prompts, onComplete, title, description }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    const handleSelect = (option: string) => {
        const isCorrect = option.toLowerCase() === prompts[currentIndex].answer.toLowerCase();
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Correcto!" });
        else toast({ variant: 'destructive', title: "Incorrecto" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
            <CardHeader>
                <CardTitle className='text-primary uppercase tracking-tighter'>{title}</CardTitle>
                <CardDescription className='font-bold text-foreground'>{description}</CardDescription>
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
                        <Button key={opt} onClick={() => handleSelect(opt)} variant="outline" className={cn("h-16 text-lg font-black uppercase", status[currentIndex] === 'correct' && opt.toLowerCase() === prompts[currentIndex].answer.toLowerCase() && "border-green-500 bg-green-50 text-green-700")}>{opt}</Button>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6"><Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button><Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={status[currentIndex] !== 'correct'} className="px-12 font-bold">Siguiente</Button></CardFooter>
        </Card>
    );
};

// --- MAIN PAGE CONTENT ---

function PasadoVsImperfectoContent() {
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
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(biographiesVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(biographiesVocab.length).fill('unchecked'));
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
        { key: 'ex1', name: '4. Ejercicio 1 (Simple)', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: '5. Ejercicio 2 (Imperfecto)', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'ex3', name: '7. Ejercicio 3 (Mezcla)', icon: PenSquare, status: 'locked' },
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
        setTimeout(() => setIsInitialLoading(false), 200);
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
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, isInitialLoading, targetStudentId]);

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
            if (win) setTimeout(() => toast({ title: "¡Siguiente misión desbloqueada!" }), 0);
            if (next) { const n = next; setTimeout(() => setSelectedTopic(n), 0); }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (topicKey === 'grammar' && topic?.status !== 'completed') handleTopicComplete(topicKey);
    };

    const handleCheckVocab = () => {
        let okCount = 0;
        const nv = biographiesVocab.map((v, i) => {
            const isCorrect = v.es.toLowerCase() === (vocabAnswers[i] || '').trim().toLowerCase();
            if (isCorrect) okCount++;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv as any);
        if (okCount >= 10) { toast({ title: "¡Buen avance!" }); setCanAdvanceVocab(true); }
        else toast({ variant: 'destructive', title: "Faltan aciertos" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className="text-primary uppercase tracking-tighter">Vocabulario: Biografías (20)</CardTitle></CardHeader>
                        <CardContent className="pt-6"><ScrollArea className="h-[450px] pr-4"><div className="grid grid-cols-2 gap-4">
                            <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Inglés</div><div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Español</div>
                            {biographiesVocab.map((v, i) => (<Fragment key={i}><div className="flex items-center font-bold py-1 text-sm uppercase">{v.en}</div><Input value={vocabAnswers[i]} onChange={e => { const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const nv = [...vocabValidation]; nv[i] = 'unchecked'; setVocabValidation(nv); }} className={cn("h-10 uppercase", vocabValidation[i] === 'correct' ? 'border-green-500' : vocabValidation[i] === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" readOnly={isAdmin && !!targetStudentId} /></Fragment>))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 bg-muted/20"><Button onClick={handleCheckVocab} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar <ArrowRight className='ml-2 h-4 w-4'/></Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-foreground text-left overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Pasado Simple vs Imperfecto</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0 font-bold">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-primary uppercase mb-4">1. Pasado Simple (Indefinido)</h3>
                                <p className="mb-4">Se usa para acciones terminadas, puntuales y específicas en el pasado.</p>
                                <ul className="list-disc pl-5 space-y-2 text-sm italic text-muted-foreground">
                                    <li>"Ayer <strong>fui</strong> al cine." (Acción puntual)</li>
                                    <li>"Nací en 1995." (Fecha específica)</li>
                                    <li>"Se mudó el mes pasado." (Evento cerrado)</li>
                                </ul>
                            </div>
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-brand-purple uppercase mb-4">2. Imperfecto</h3>
                                <p className="mb-4">Se usa para descripciones, estados, hábitos o acciones repetidas sin un final definido.</p>
                                <ul className="list-disc pl-5 space-y-2 text-sm italic text-muted-foreground">
                                    <li>"Cuando <strong>era</strong> niño..." (Descripción de edad/estado)</li>
                                    <li>"Siempre <strong>estudiaba</strong> de noche." (Hábito)</li>
                                    <li>"La casa <strong>tenía</strong> tres pisos." (Descripción)</li>
                                </ul>
                            </div>
                            <div className="p-4 bg-primary/10 rounded-xl border-l-4 border-primary italic">
                                Tip: Si puedes decir "used to", usualmente es Imperfecto. Si fue un "clic" en el calendario, es Simple.
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'conjugation':
                const curVerb = biographiesVocab[conjIdx];
                const pronouns = ["Yo", "Tú", "Él/Ella", "Nosotros", "Ellos/Ellas"];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tighter'>Misión: Conjugación ({conjIdx + 1}/30)</CardTitle><CardDescription>Conjuga en Pasado Simple o Imperfecto según prefieras.</CardDescription></CardHeader>
                        <CardContent className="space-y-8 pt-8"><div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-primary/5 to-brand-purple/5 rounded-[2.5rem] border-2 border-dashed border-primary/20"><span className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Verbo Inglés</span><h3 className="text-5xl font-black text-primary uppercase tracking-tighter">{curVerb.en}</h3></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">{pronouns.map((p, i) => (<div key={i} className="space-y-1.5"><Label className="text-xs font-black uppercase text-muted-foreground">{p}</Label><Input value={conjAns[i]} onChange={e => { const na = [...conjAns]; na[i] = e.target.value; setConjAns(na); setConjVal(v => { const nv = [...v]; nv[i] = 'unchecked'; return nv; }); }} className={cn("h-12 text-lg font-bold border-2 transition-all", conjVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : conjVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder="..." autoComplete="off" /></div>))}</div></CardContent>
                        <CardFooter className="justify-center border-t p-8 bg-muted/5"><Button onClick={() => { let all = true; const nv = conjAns.map(a => { if (a.trim() === '') { all = false; return 'incorrect'; } return 'correct'; }); setConjVal(nv); if (all) { if (conjIdx < 29) { setConjIdx(p => p + 1); setConjAns(Array(5).fill('')); setConjVal(Array(5).fill('unchecked')); } else handleTopicComplete('conjugation'); } }} size="lg" className="px-20 font-black h-14 text-xl shadow-xl">Verificar <ArrowRight className="ml-2 h-5 w-5" /></Button></CardFooter>
                    </Card>
                );
            case 'ex1': return <BallsExercise title="Ejercicio 1: Pasado Simple (12)" prompts={ex1Prompts} onComplete={() => handleTopicComplete('ex1')} vocabulary={{"nací": "was born", "año pasado": "last year", "estudiamos": "studied", "compré": "bought"}} />;
            case 'ex2': return <BallsExercise title="Ejercicio 2: Imperfecto (12)" prompts={ex2Prompts} onComplete={() => handleTopicComplete('ex2')} vocabulary={{"vivía": "used to live", "jugábamos": "always played", "mientras": "while", "soleado": "sunny"}} />;
            case 'vocab_game': return <VocabularyMatchingGame data={biographiesVocab.slice(0, 10).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Encuentra las parejas biográficas" />;
            case 'ex3': return <BallsExercise title="Ejercicio 3: Mezcla Pasados (15)" prompts={ex3Prompts} onComplete={() => handleTopicComplete('ex3')} vocabulary={{"llovió": "rained", "gustaba": "liked", "llegó": "arrived", "sonó": "rang"}} />;
            case 'reading': 
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tight'>Lectura: El Gran Viaje</CardTitle></CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner">"Cuando <strong>era</strong> joven, yo <strong>vivía</strong> en un pueblo muy pequeño. Todos los días, <strong>caminaba</strong> hacia la montaña. Un día, <strong>vi</strong> a un viajero extraño. Él me <strong>dijo</strong> que el mundo <strong>era</strong> inmenso. El año pasado, por fin <strong>viajé</strong> a Europa y <strong>conocí</strong> muchas culturas. <strong>Fue</strong> la mejor experiencia de mi vida."</div>
                            <Separator /><div className="space-y-4">
                                <h3 className='font-black text-primary uppercase text-sm'>Preguntas de Comprensión:</h3>
                                {["¿Dónde vivía el narrador cuando era joven?", "¿Qué hacía todos los días?", "¿Qué le dijo el viajero?", "¿A dónde viajó el año pasado?"].map((q, i) => (
                                    <div key={i} className="space-y-2 p-3 bg-muted/20 rounded-xl border"><Label className="font-bold">{q}</Label><Input autoComplete="off" /></div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/10"><Button onClick={() => handleTopicComplete('reading')} size="lg" className="px-16 font-black h-12 shadow-md">Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'ex4': return <ChoiceExercise title="Ejercicio 4: Elige la forma correcta" prompts={ex4ChoicePrompts} onComplete={() => handleTopicComplete('ex4')} />;
            case 'completar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tight'>Completar: Pasado y Mezcla (30)</CardTitle></CardHeader>
                        <CardContent className="p-0"><ScrollArea className="h-[500px] p-6"><div className="space-y-4">
                            {completarPrompts.map((q, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm"><p className="font-bold text-lg">{q.s}</p><Input value={completarAns[i]} onChange={e => { const na = [...completarAns]; na[i] = e.target.value; setCompletarAns(na); }} className={cn("h-10 max-w-sm", completarVal[i] === 'correct' ? 'border-green-500' : completarVal[i] === 'incorrect' ? 'border-red-500' : '')} placeholder="Respuesta..." autoComplete="off" /></div>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/20"><Button onClick={() => { const nv = completarPrompts.map((p, i) => (completarAns[i].trim() !== '' ? 'correct' : 'incorrect')); setCompletarVal(nv); if (nv.every(v => v === 'correct')) handleTopicComplete('completar'); }} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">Verificar Todo</Button></CardFooter>
                    </Card>
                );
            case 'translate_text':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader className='flex flex-row justify-between items-center'><CardTitle className='text-primary uppercase'>Traducción de Texto</CardTitle>
                        <Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger>
                        <PopoverContent className="w-64"><ScrollArea className="h-48 pr-4 text-left"><div className="grid grid-cols-2 gap-2 text-sm text-foreground">{Object.entries(translateTextData.vocab).map(([en, es]: any) => (<Fragment key={en}><span className="text-muted-foreground capitalize">{en}:</span><span className="font-semibold text-right">{es}</span></Fragment>))}</div></ScrollArea></PopoverContent></Popover></CardHeader>
                        <CardContent className="space-y-6 pt-6"><div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed shadow-sm">"{translateTextData.english}"</div><Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={translationText} onChange={e => setTranslationText(e.target.value)} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg leading-relaxed" /></div></CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('translate_text')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Continuar <ArrowRight className='ml-3 h-8 w-8' /></Button></CardFooter>
                    </Card>
                );
            case 'final': return <BallsExercise title="Reto Final: Frases Negativas (15)" prompts={negativePrompts} onComplete={() => handleTopicComplete('final')} vocabulary={{"no trabajé": "didn't work", "no era feliz": "wasn't happy", "no solíamos": "didn't use to", "no compraron": "didn't buy"}} />;
            default: return <div className="text-center p-8">Selecciona una misión para comenzar.</div>;
        }
    };

    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {targetStudentId && isAdmin && (
                        <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md"><div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400"><Star className="h-6 w-6 fill-current animate-pulse" /><p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión: {studentProfile?.name || '...'}</p></div><Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10"><Link href="/admin">Cerrar</Link></Button></div>
                    )}
                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/a2" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver al Curso A2</Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3"><Zap className='h-10 w-10 text-primary' /> Pasado Simple vs Imperfecto 🇪🇸</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30"><CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Ruta de Misión</CardTitle></CardHeader>
                                <CardContent className="p-4"><nav><ul className="space-y-1">
                                    {learningPath.map((item) => {
                                        const isLocked = item.status === 'locked' && !isAdmin;
                                        const isSelected = selectedTopic === item.key;
                                        const Icon = ICONS_CONFIG[item.status as keyof typeof ICONS_CONFIG] || BookOpen;
                                        return (
                                            <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', isSelected && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm')}>
                                                <div className="flex items-center gap-3">{item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}<span className="truncate max-w-[150px] uppercase font-bold text-[10px] text-foreground">{item.name}</span></div>
                                                {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                            </li>
                                        );
                                    })}
                                </ul></nav><div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 font-black uppercase tracking-widest text-muted-foreground"><span>Progreso Total</span><span className="text-primary">{progressValue}%</span></div><Progress value={progressValue} className="h-2 rounded-full" /></div></CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function PasadoVsImperfectoPage() {
    return (<Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}><PasadoVsImperfectoContent /></Suspense>);
}