
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
    Check,
    X,
    Info,
    Pencil,
    Activity,
    ListChecks,
    Split
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from '@/components/ui/textarea';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_a2_reflex_irreg_v48_dark_mode_fix';
const mainProgressKey = 'progress_a2_es_reflexivos_irregulares';

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const irregularVerbsVocab = [
    { en: "TO WAKE UP", es: "DESPERTARSE" },
    { en: "TO GO TO BED", es: "ACOSTARSE" },
    { en: "TO GET DRESSED", es: "VESTIRSE" },
    { en: "TO HAVE FUN", es: "DIVERTIRSE" },
    { en: "TO FALL ASLEEP", es: "DORMIRSE" },
    { en: "TO FEEL", es: "SENTIRSE" },
    { en: "TO SAY GOODBYE", es: "DESPEDIRSE" },
    { en: "TO LAUGH", es: "REÍRSE" },
    { en: "TO SIT DOWN", es: "SENTARSE" },
    { en: "TO TRY ON", es: "PROBARSE" },
    { en: "TO REMEMBER", es: "ACORDARSE" },
    { en: "TO MEET (WITH SOMEONE)", es: "ENCONTRARSE" },
    { en: "TO BECOME", es: "VOLVERSE" },
    { en: "TO REGRET", es: "ARREPENTIRSE" },
    { en: "TO MEASURE ONESELF", es: "MEDIRSE" },
    { en: "TO SERVE ONESELF", es: "SERVIRSE" },
    { en: "TO BITE ONE'S NAILS", es: "MORDERSE" },
    { en: "TO TWIST (ANKLE)", es: "TORCERSE" },
    { en: "TO GET DISTRACTED", es: "DISTRAERSE" },
    { en: "TO FALL DOWN", es: "CAERSE" },
];

const conjugationVerbsData = [
    { v: "DESPERTARSE", type: "e:ie", forms: ["me despierto", "te despiertas", "se despierta", "nos despertamos", "se despiertan"] },
    { v: "ACOSTARSE", type: "o:ue", forms: ["me acuesto", "te acuestas", "se acuesta", "nos acostamos", "se acuestan"] },
    { v: "VESTIRSE", type: "e:i", forms: ["me visto", "te vistes", "se viste", "nos vestimos", "se visten"] },
    { v: "DIVERTIRSE", type: "e:ie", forms: ["me divierto", "te diviertes", "se divierte", "nos divertimos", "se divierten"] },
    { v: "DORMIRSE", type: "o:ue", forms: ["me duermo", "te duermes", "se duerme", "nos dormimos", "se duermen"] },
    { v: "SENTIRSE", type: "e:ie", forms: ["me siento", "te sientes", "se siente", "nos sentimos", "se sienten"] },
    { v: "DESPEDIRSE", type: "e:i", forms: ["me despido", "te despides", "se despide", "nos despedimos", "se despiden"] },
    { v: "REIRSE", type: "e:i", forms: ["me río", "te ríes", "se ríe", "nos reímos", "se ríen"] },
    { v: "SENTARSE", type: "e:ie", forms: ["me siento", "te sientas", "se sienta", "nos sentamos", "se sientan"] },
    { v: "PROBARSE", type: "o:ue", forms: ["me pruebo", "te pruebas", "se prueba", "nos probamos", "se prueban"] },
    { v: "ACORDARSE", type: "o:ue", forms: ["me acuerdo", "te acuerdas", "se acuerda", "nos acordamos", "se acuerdan"] },
    { v: "ENCONTRARSE", type: "o:ue", forms: ["me encuentro", "te encuentras", "se encuentra", "nos encontramos", "se encuentran"] },
];

const ex1ChoiceData = [
    { spanish: "YO _______ (DESPERTARSE) A LAS 6 AM.", options: ["ME DESPIERTO", "TE DESPIERTAS", "SE DESPIERTA"], answer: "ME DESPIERTO" },
    { spanish: "ELLA _______ (ACOSTARSE) TARDE.", options: ["ME ACUESTO", "SE ACUESTA", "TE ACUESTAS"], answer: "SE ACUESTA" },
    { spanish: "NOSOTROS _______ (DIVERTIRSE) MUCHO.", options: ["NOS DIVERTIMOS", "NOS DIVIERTIMOS", "NOS DIVERTIR"], answer: "NOS DIVERTIMOS" },
    { spanish: "ÉL _______ (SENTARSE) EN LA SILLA.", options: ["SE SIENTA", "SE SIENTAN", "TE SIENTAS"], answer: "SE SIENTA" },
    { spanish: "ELLOS _______ (REÍRSE) DE TODO.", options: ["NOS REÍMOS", "SE RÍEN", "TE RÍES"], answer: "SE RÍEN" },
    { spanish: "TÚ _______ (VESTIRSE) MUY BIEN.", options: ["SE VISTEN", "ME VISTO", "TE VISTES"], answer: "TE VISTES" },
    { spanish: "NOSOTROS _______ (ACORDARSE) DE LA FECHA.", options: ["NOS ACORDAMOS", "ME ACUERDO", "SE ACUERDA"], answer: "NOS ACORDAMOS" },
    { spanish: "YO _________ (SENTIRSE) BIEN", options: ["SE SIENTE", "TE SIENTES", "ME SIENTO"], answer: "ME SIENTO" },
    { spanish: "TÚ _______ (VESTIRSE) MUY BIEN.", options: ["ME VISTO", "TE VISTES", "SE VISTEN"], answer: "TE VISTES" },
    { spanish: "NOSOTROS _______ (PROBARSE) LOS ZAPATOS.", options: ["NOS PROBAMOS", "NOS PRUEBAMOS", "SE PRUEBA"], answer: "NOS PROBAMOS" },
    { spanish: "ELLA _______ (ENCONTRARSE) CON SU AMIGA.", options: ["ME ENCUENTRO", "SE ENCUENTRA", "TE ENCUENTRAS"], answer: "SE ENCUENTRA" },
    { spanish: "ELLA _______ (REIRSE) DE TODO.", options: ["TE RÍES", "ME RÍO", "SE RÍE"], answer: "SE RÍE" },
];

const ex2Prompts = [
    { en: "I feel happy.", es: ["me siento feliz", "yo me siento feliz"] },
    { en: "She says goodbye to her mother.", es: ["se despide de su madre", "ella se despide de su madre"] },
    { en: "They fall asleep fast.", es: ["se duermen rápido", "ellos se duermen rápido"] },
    { en: "You try on the shoes.", es: ["te pruebas los zapatos", "tú te pruebas los zapatos"] },
    { en: "He becomes a professional.", es: ["se vuelve un profesional", "él se vuelve un profesional"] },
    { en: "We fall asleep fast.", es: ["nosotros nos dormimos rápido", "nos dormimos rápido"] },
    { en: "I put on my jacket.", es: ["yo me pongo mi chaqueta", "me pongo mi chaqueta", "yo me pongo la chaqueta"] },
    { en: "They remember the date.", es: ["ellos se acuerdan de la fecha", "ellas se acuerdan de la fecha", "se acuerdan de la fecha"] },
    { en: "You try on the shoes.", es: ["tú te pruebas los zapatos", "te pruebas los zapatos"] },
    { en: "He becomes a professional.", es: ["él se vuelve un profesional", "se vuelve un profesional"] },
    { en: "We meet in the park.", es: ["nosotros nos encontramos en el parque", "nos encontramos en el parque"] },
    { en: "I get distracted easily.", es: ["yo me distraigo fácilmente", "me distraigo fácilmente"] },
    { en: "She laughs a lot.", es: ["ella se ríe mucho", "se ríe mucho"] },
];

const ex3Prompts = [
    { en: "We meet in the park.", es: ["nos encontramos en el parque", "nosotros nos encontramos en el parque"] },
    { en: "I remember the date.", es: ["me acuerdo de la fecha", "yo me acuerdo de la fecha"] },
    { en: "They laugh a lot.", es: ["se ríen mucho", "ellos se ríen mucho"] },
    { en: "She sits on the sofa.", es: ["se sienta en el sofá", "ella se sienta en el sofá"] },
    { en: "I wake up late on Sundays.", es: ["me despierto tarde los domingos", "yo me despierto tarde los domingos"] },
    { en: "They stay healthy.", es: ["ellos se mantienen saludables", "se mantienen saludables"] },
    { en: "I undo the knot.", es: ["yo me deshago del nudo", "me deshago del nudo"] },
    { en: "We move (transfer) to the city.", es: ["nosotros nos trasladamos a la ciudad", "nos trasladamos a la ciudad"] },
    { en: "You regret the decision.", es: ["tú te arrepientes de la decisión", "te arrepientes de la decisión"] },
    { en: "It breaks (gets broken).", es: ["se rompe", "eso se rompe"] },
    { en: "He gets lost in the street.", es: ["él se pierde en la calle", "se pierde en la calle"] },
    { en: "I have a seat.", es: ["yo me siento", "me siento"] },
    { en: "We say goodbye at the airport.", es: ["nosotros nos despedimos en el aeropuerto", "nos despedimos en el aeropuerto"] },
    { en: "They dress well.", es: ["ellos se visten bien", "ellas se visten bien", "se visten bien"] },
    { en: "I wake up late on Sundays.", es: ["yo me despierto tarde los domingos", "me despierto tarde los domingos"] },
];

const readingData = {
    title: "La rutina de Sofía",
    content: "Normalmente, Sofía se despierta muy temprano, pero no se levanta de inmediato. Ella se queda en la cama un poco más. A las siete, se viste rápidamente para ir a la oficina. En el trabajo, ella se siente muy motivada, pero por la tarde se cansa un poco. Cuando llega a casa, Sofía se divierte cocinando con su esposo. Ellos se ríen mucho juntos. Finalmente, ella se acuesta a las diez de la noche y se duerme en cinco minutos.",
    questions: [
        { id: "q1", question: "¿Sofía se levanta inmediatamente al despertar?", a: ["no", "no se levanta de inmediato"] },
        { id: "q2", question: "¿A qué hora se viste Sofía?", a: ["a las siete", "a las 7"] },
        { id: "q3", question: "¿Cómo se siente Sofía en el trabajo?", a: ["motivada", "muy motivada"] },
        { id: "q4", question: "¿Qué hace Sofía con su esposo?", a: ["cocina", "se divierte cocinando"] },
        { id: "q5", question: "¿Cuánto tiempo tarda en dormirse?", a: ["cinco minutos", "5 minutos"] },
    ]
};

const finalExPrompts = [
    { spanish: "1. Yo (despertarse) _______ a las 5 am.", answer: ["me despierto"] },
    { spanish: "2. Nosotros (divertirse) _______ mucho.", answer: ["nos divertimos"] },
    { spanish: "3. Ella (vestirse) _______ de rojo.", answer: ["se viste"] },
    { spanish: "4. Tú (sentarse) _______ en el sofá.", answer: ["te sientas"] },
    { spanish: "5. Él (sentirse) _______ muy bien.", answer: ["se siente"] },
    { spanish: "6. Ellas (despedirse) _______ de sus amigos.", answer: ["se despiden"] },
    { spanish: "7. El gato (dormirse) _______ bajo el sol.", answer: ["se duerme"] },
    { spanish: "8. Yo (ponerse) _______ la camisa nueva.", answer: ["me pongo"] },
    { spanish: "9. Nosotros (acordarse) _______ de tu cumpleaños.", answer: ["nos acordamos"] },
    { spanish: "10. Ellos (encontrarse) _______ en el centro comercial.", answer: ["se encuentran"] },
    { spanish: "11. Ustedes (probarse) _______ los pantalones azules.", answer: ["se prueban"] },
    { spanish: "12. Yo (reírse) _______ con tus chistes.", answer: ["me río"] },
    { spanish: "13. Ella (volverse) _______ loca con tanto trabajo.", answer: ["se vuelve"] },
    { spanish: "14. Nosotros (mantenerse) _______ en contacto por e-mail.", answer: ["nos mantenemos"] },
    { spanish: "15. Tú (arrepentirse) _______ de no ir.", answer: ["te arrepientes"] },
    { spanish: "16. Yo (medirse) _______ la presión cada día.", answer: ["me mido"] },
    { spanish: "17. Él (servirse) _______ un vaso de agua.", answer: ["se sirve"] },
    { spanish: "18. El niño (muerde) _______ las uñas.", answer: ["se muerde"] },
    { spanish: "19. Ella (torcerse) _______ el tobillo corriendo.", answer: ["se tuerce"] },
    { spanish: "20. Ellos (distraerse) _______ con el celular.", answer: ["se distraen"] },
    { spanish: "21. El anciano (caerse) _______ en la calle.", answer: ["se cae"] },
    { spanish: "22. Yo (reírse) _______ de la situación.", answer: ["me río"] },
    { spanish: "23. Nosotros (sentarse) _______ a descansar.", answer: ["nos sentamos"] },
    { spanish: "24. Tú (dormirse) _______ en el sofá.", answer: ["te duermes"] },
];

// --- COMPONENTES AUXILIARES ---

const ChoiceValidationExercise = ({ title, prompts, onComplete, isAdmin, isSupervisionMode }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [validationStatus, setValidationStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    const handleSelect = (opt: string) => {
        if (isSupervisionMode) return;
        setUserAnswers({ ...userAnswers, [currentIndex]: opt });
        setValidationStatus({ ...validationStatus, [currentIndex]: 'unchecked' });
    };

    const handleCheck = () => {
        const newVal: Record<number, 'correct' | 'incorrect'> = {};
        let allOk = true;
        prompts.forEach((p: any, i: number) => {
            const isOk = userAnswers[i] === p.answer;
            newVal[i] = isOk ? 'correct' : 'incorrect';
            if (!isOk) allOk = false;
        });
        setValidationStatus(newVal);
        if (allOk) toast({ title: "¡Muy bien!" }); else toast({ variant: 'destructive', title: "Revisa las opciones" });
    };

    const handleNext = () => {
        if (currentIndex < prompts.length - 1) setCurrentIndex(prev => prev + 1);
        else onComplete();
    };

    const allCorrect = Object.values(validationStatus).length === prompts.length && Object.values(validationStatus).every(v => v === 'correct');

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground">
            <CardHeader>
                <div className="text-left">
                    <CardTitle>{title}</CardTitle>
                    <div className="flex gap-2 justify-start flex-wrap pt-4">
                        {prompts.map((_: any, i: number) => (
                            <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", validationStatus[i] === 'correct' ? "bg-green-500 text-white border-green-500" : validationStatus[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-8 py-10">
                <div className="text-2xl font-black text-center uppercase tracking-tight">{prompts[currentIndex].spanish}</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {prompts[currentIndex].options.map((opt: string) => (
                        <Button key={opt} variant={userAnswers[currentIndex] === opt ? 'default' : 'outline'} onClick={() => handleSelect(opt)} className="h-14 font-black transition-all" disabled={isSupervisionMode}>{opt}</Button>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    {currentIndex === prompts.length - 1 && !allCorrect && !isSupervisionMode && <Button onClick={handleCheck} variant="secondary">Verificar</Button>}
                    <Button onClick={handleNext} disabled={!allCorrect && !isAdmin} className="text-white font-bold">{currentIndex === prompts.length - 1 ? 'Continuar' : 'Siguiente'}</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const FinalValidationExercise = ({ title, description, prompts, onComplete, vocabulary, type = 'translate', isAdmin, isSupervisionMode }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [validationStatus, setValidationStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { 
        setCurrentIndex(0); 
        setUserAnswers({}); 
        setValidationStatus({}); 
    }, [title]);

    const handleCheck = () => {
        const newVal: Record<number, 'correct' | 'incorrect'> = {};
        let allOk = true;
        prompts.forEach((p: any, i: number) => {
            const user = (userAnswers[i] || '').trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
            const rawAnswers = p.es || p.answer || [];
            const corrects = (Array.isArray(rawAnswers) ? rawAnswers : [rawAnswers])
                .map((a: string) => String(a).toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' '));
            const isOk = corrects.includes(user);
            newVal[i] = isOk ? 'correct' : 'incorrect';
            if (!isOk) allOk = false;
        });
        setValidationStatus(newVal);
        if (allOk) toast({ title: "¡Excelente!" }); else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const handleNext = () => {
        if (currentIndex < prompts.length - 1) setCurrentIndex(prev => prev + 1);
        else onComplete();
    };

    const allCorrect = Object.values(validationStatus).length === prompts.length && Object.values(validationStatus).every(v => v === 'correct');

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="text-left">
                        <CardTitle>{title}</CardTitle>
                        <CardDescription className='font-bold text-foreground'>{description || "Traduce la frase."}</CardDescription>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", validationStatus[i] === 'correct' ? "bg-green-500 text-white border-green-500" : validationStatus[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4 text-left">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-foreground">
                                        {Object.entries(vocabulary).map(([en, es]: any) => (
                                            <Fragment key={en}>
                                                <span className="text-muted-foreground capitalize">{en}:</span>
                                                <span className="font-semibold text-right text-primary">{String(es).toUpperCase()}</span>
                                            </Fragment>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">
                    {type === 'translate' ? prompts[currentIndex]?.en : prompts[currentIndex]?.spanish}
                </div>
                <Input value={userAnswers[currentIndex] || ''} onChange={e => { if (isSupervisionMode) return; setUserAnswers({ ...userAnswers, [currentIndex]: e.target.value }); setValidationStatus({ ...validationStatus, [currentIndex]: 'unchecked' }); }} className={cn("h-12 text-lg text-foreground", validationStatus[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/10' : validationStatus[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="Respuesta..." autoComplete="off" readOnly={isSupervisionMode} />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    {currentIndex === prompts.length - 1 && !allCorrect && !isSupervisionMode && <Button onClick={handleCheck} variant="secondary">Verificar</Button>}
                    <Button onClick={handleNext} disabled={!allCorrect && !isAdmin} className="text-white font-bold">{currentIndex === prompts.length - 1 ? (title.includes('Final') || title.includes('Traducir') ? 'TERMINAR' : 'Continuar') : 'Siguiente'}</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

// --- MAIN PAGE ---

function ReflexivosIrregularesInternal() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const searchParams = useSearchParams();

    const targetStudentId = searchParams.get('studentId');
    const currentUID = targetStudentId || user?.uid;

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [learningPath, setLearningPath] = useState<any[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    
    // States for content
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(irregularVerbsVocab.length).fill(''));
    const [vocabVal, setVocabVal] = useState<any[]>(Array(irregularVerbsVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);
    const [conjIdx, setConjIdx] = useState(0);
    const [conjAns, setConjAns] = useState<string[]>(Array(5).fill(''));
    const [conjVal, setConjVal] = useState<any[]>(Array(5).fill('unchecked'));
    const [readAns, setReadAns] = useState<Record<string, string>>({});
    const [readVal, setReadVal] = useState<Record<string, 'correct' | 'incorrect' | 'unchecked'>>({});
    const [transText, setTransText] = useState('');
    const [isFinished, setIsFinished] = useState(false);

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: authUserProfile } = useDoc<{ role?: string }>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string, lessonProgress?: any, progress?: any, name?: string }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialPathData = useMemo(() => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: '2. Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'conjugation', name: '3. Conjugación', icon: Pencil, status: 'locked' },
        { key: 'exercise1', name: '4. Ejercicio 1', icon: ListChecks, status: 'locked' },
        { key: 'exercise2', name: '5. Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'exercise3', name: '6. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '7. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'reading', name: '8. Lectura', icon: BookText, status: 'locked' },
        { key: 'final', name: '9. Ejercicio Final', icon: Trophy, status: 'locked' },
        { key: 'translate', name: '10. Traducir Texto', icon: Pencil, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
        let path = initialPathData.map((topic, i) => ({ ...topic, status: i === 0 ? 'active' : 'locked' as any }));
        const d = studentProfile.lessonProgress?.[progressStorageVersion] || {};
        if (isAdmin && !targetStudentId) path.forEach(t => t.status = 'completed');
        else {
            path.forEach(t => { if (d[t.key]) t.status = d[t.key]; });
            let lastDone = true;
            for (let i = 0; i < path.length; i++) { if (lastDone && path[i].status === 'locked') path[i].status = 'active'; lastDone = path[i].status === 'completed'; }
        }
        setLearningPath(path); 
        setSelectedTopic(d.lastSelectedTopic || path.find(it => it.status === 'active')?.key || path[0].key);
        if (d.vocabAnswers) setVocabAnswers(d.vocabAnswers);
        if (d.readAns) setReadAns(d.readAns);
        if (d.transText) setTransText(d.transText);
        setInitialLoadComplete(true); setIsInitialLoading(false);
    }, [isAdmin, initialPathData, studentProfile, isProfileLoading, isUserLoading, targetStudentId, initialLoadComplete]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    const handleTopicComplete = (completedKey: string) => { setTopicToComplete(completedKey); };

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || targetStudentId) return;
        const s: any = { lastSelectedTopic: selectedTopic, vocabAnswers, readAns, transText, isFinished };
        learningPath.forEach(t => s[t.key] = t.status);
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, targetStudentId, initialLoadComplete, vocabAnswers, readAns, transText, isFinished]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(curr => {
            let next: string | null = null; const np = [...curr];
            const i = np.findIndex(t => t.key === topicToComplete);
            if (i !== -1 && np[i].status !== 'completed') {
                np[i].status = 'completed';
                if (i + 1 < np.length && np[i + 1].status === 'locked') { np[i + 1].status = 'active'; next = np[i + 1].key; }
            }
            if (next) { const n = next; setTimeout(() => { toast({ title: "¡Misión completada!" }); setSelectedTopic(n); }, 0); }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const t = learningPath.find(it => it.key === topicKey);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (['grammar'].includes(topicKey)) handleTopicComplete(topicKey);
    };

    const handleVocabCheck = () => {
        let allOk = true; 
        const nv = irregularVerbsVocab.map((v, i) => {
            const res = v.es.toLowerCase() === (vocabAnswers[i] || '').trim().toLowerCase();
            if (!res) allOk = false; return res ? 'correct' : 'incorrect';
        });
        setVocabVal(nv); 
        const correctCount = nv.filter(v => v === 'correct').length;
        if (correctCount === irregularVerbsVocab.length) {
            setCanAdvanceVocab(true);
            toast({ title: "¡Vocabulario correcto!" }); 
        } else {
            setCanAdvanceVocab(false);
            toast({ variant: 'destructive', title: "Revisa las palabras", description: `Llevas ${correctCount} de ${irregularVerbsVocab.length}.` });
        }
    };

    const handleConjCheck = () => {
        const v = conjugationVerbsData[conjIdx];
        const nv = conjAns.map((a, i) => a.trim().toLowerCase() === v.forms[i] ? 'correct' : 'incorrect');
        setConjVal(nv);
        if (nv.every(st => st === 'correct')) {
            toast({ title: "¡Perfecto!" });
            if (conjIdx < conjugationVerbsData.length - 1) {
                setTimeout(() => { setConjIdx(p => p+1); setConjAns(Array(5).fill('')); setConjVal(Array(5).fill('unchecked')); }, 800);
            } else handleTopicComplete('conjugation');
        } else toast({ variant: 'destructive', title: "Revisa la conjugación" });
    };

    const handleReadingCheck = () => {
        let allOk = true; const nv: any = {};
        readingData.questions.forEach(q => {
            const res = q.a.some(a => (readAns[q.id] || '').trim().toLowerCase().includes(a.toLowerCase()));
            nv[q.id] = res ? 'correct' : 'incorrect'; if (!res) allOk = false;
        });
        setReadVal(nv); if (allOk) toast({ title: "¡Lectura correcta!" }); else toast({ variant: 'destructive', title: "Revisa las respuestas" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>Vocabulario: Reflexivos Irregulares</CardTitle><CardDescription className='font-bold text-foreground'>Escribe el verbo en español.</CardDescription></CardHeader>
                        <CardContent><ScrollArea className="h-[450px] pr-4"><div className="grid grid-cols-2 gap-4">
                            <div className="font-black text-primary border-b pb-2 uppercase text-xs">English</div><div className="font-black text-primary border-b pb-2 uppercase text-xs">Español</div>
                            {irregularVerbsVocab.map((v, i) => (
                                <Fragment key={i}>
                                    <div className="p-2 border rounded bg-white/5 font-bold flex items-center text-sm">{v.en}</div>
                                    <Input 
                                        value={vocabAnswers[i] || ''} 
                                        onChange={e => { if (targetStudentId) return; const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const nv = [...vocabVal]; nv[i] = 'unchecked'; setVocabVal(nv); setCanAdvanceVocab(false); }} 
                                        className={cn("uppercase text-foreground", vocabVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} 
                                        autoComplete="off" 
                                        readOnly={!!targetStudentId} 
                                    />
                                </Fragment>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-between border-t pt-6">
                            <Button onClick={handleVocabCheck} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Continuar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-foreground text-left overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Irregularidad Reflexiva</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <p className="text-lg font-bold mb-4">Los verbos reflexivos irregulares siguen las mismas reglas de pronombres (<span className="text-primary">me, te, se, nos, os, se</span>), pero su raíz cambia al conjugar.</p>
                                <Separator className='my-6'/>
                                <div className='grid gap-6 md:grid-cols-3'>
                                    <div className='p-4 bg-primary/10 rounded-xl border border-primary/20'>
                                        <h4 className='font-black text-primary uppercase text-sm mb-2'>Cambio e &rarr; ie</h4>
                                        <p className='text-xs italic'>Ejemplos: Despertarse, Divertirse, Sentarse, Sentirse.</p>
                                    </div>
                                    <div className='p-4 bg-brand-purple/10 rounded-xl border border-brand-purple/20'>
                                        <h4 className='font-black text-brand-purple uppercase text-sm mb-2'>Cambio o &rarr; ue</h4>
                                        <p className='text-xs italic'>Ejemplos: Acostarse, Dormirse, Probarse, Acordarse.</p>
                                    </div>
                                    <div className='p-4 bg-brand-blue/10 rounded-xl border border-brand-blue/20'>
                                        <h4 className='font-black text-brand-blue uppercase text-sm mb-2'>Cambio e &rarr; i</h4>
                                        <p className='text-xs italic'>Ejemplos: Vestirse, Despedirse, Reírse.</p>
                                    </div>
                                </div>
                            </div>

                            <div className='space-y-6 text-foreground'>
                                <h3 className='text-xl font-black text-primary uppercase tracking-tighter flex items-center gap-2'>
                                    <ListChecks className='h-6 w-6'/> Modelos de Conjugación
                                </h3>
                                <div className='grid gap-4 sm:grid-cols-3'>
                                    <Card className='p-4 border-2 border-brand-purple/20'>
                                        <h4 className='font-bold text-center border-b pb-2 mb-2'>DESPERTARSE (ie)</h4>
                                        <ul className='text-sm font-mono space-y-1 text-center'>
                                            <li>Me despierto</li>
                                            <li>Te despiertas</li>
                                            <li>Se despierta</li>
                                            <li>Nos despertamos*</li>
                                            <li>Se despiertan</li>
                                        </ul>
                                    </Card>
                                    <Card className='p-4 border-2 border-brand-purple/20'>
                                        <h4 className='font-bold text-center border-b pb-2 mb-2'>ACOSTARSE (ue)</h4>
                                        <ul className='text-sm font-mono space-y-1 text-center'>
                                            <li>Me acuesto</li>
                                            <li>Te acuestas</li>
                                            <li>Se acuesta</li>
                                            <li>Nos acostamos*</li>
                                            <li>Se acuestan</li>
                                        </ul>
                                    </Card>
                                    <Card className='p-4 border-2 border-brand-purple/20'>
                                        <h4 className='font-bold text-center border-b pb-2 mb-2'>VESTIRSE (i)</h4>
                                        <ul className='text-sm font-mono space-y-1 text-center'>
                                            <li>Me visto</li>
                                            <li>Te vistes</li>
                                            <li>Se viste</li>
                                            <li>Nos vestimos*</li>
                                            <li>Se visten</li>
                                        </ul>
                                    </Card>
                                </div>
                                <p className='text-xs text-muted-foreground italic text-center'>*Nota: "Nosotros" mantienen la raíz original sin cambio vocálico.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-16 font-black h-12 text-white shadow-lg">He comprendido la gramática</Button></CardFooter>
                    </Card>
                );
            case 'conjugation':
                const v = conjugationVerbsData[conjIdx];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tighter'>Misión: Conjugación ({conjIdx+1}/{conjugationVerbsData.length})</CardTitle></CardHeader>
                        <CardContent className="space-y-8 pt-8 flex flex-col items-center text-foreground">
                            <div className="p-8 bg-gradient-to-br from-primary/5 to-brand-purple/5 rounded-[2.5rem] border-2 border-dashed border-primary/20 text-center"><h3 className="text-5xl font-black text-primary uppercase tracking-tighter">{v.v} ({v.type})</h3></div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl'>
                                {["YO", "TÚ", "ÉL", "NOSOTROS", "ELLOS"].map((p, i) => (
                                    <div key={i} className='space-y-1'><Label className='text-[10px] font-black uppercase text-muted-foreground'>{p}</Label><Input value={conjAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...conjAns]; na[i] = e.target.value; setConjAns(na); const nv = [...conjVal]; nv[i] = 'unchecked'; setConjVal(nv); }} className={cn("h-10 text-lg uppercase transition-all text-foreground", conjVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : conjVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-8 bg-muted/5"><Button onClick={handleConjCheck} size="lg" className="px-20 font-black h-14 text-xl shadow-xl uppercase">Verificar Verbo</Button></CardFooter>
                    </Card>
                );
            case 'exercise1': return <ChoiceValidationExercise title="Ejercicio 1" prompts={ex1ChoiceData} onComplete={() => handleTopicComplete('exercise1')} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} />;
            case 'exercise2': return <FinalValidationExercise title="Ejercicio 2" prompts={ex2Prompts} onComplete={() => handleTopicComplete('exercise2')} vocabulary={irregularVerbsVocab.reduce((acc, curr) => ({...acc, [curr.en.toLowerCase()]: curr.es.toLowerCase()}), {})} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} />;
            case 'exercise3': return <FinalValidationExercise title="Ejercicio 3" prompts={ex3Prompts} onComplete={() => handleTopicComplete('exercise3')} vocabulary={irregularVerbsVocab.reduce((acc, curr) => ({...acc, [curr.en.toLowerCase()]: curr.es.toLowerCase()}), {})} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} />;
            case 'vocab_game': return <VocabularyMatchingGame data={irregularVerbsVocab.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Reflexivos Memory" />;
            case 'reading':
                const readingOk = readingData.questions.every(q => readVal[q.id] === 'correct');
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>{readingData.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner text-foreground">{readingData.content}</div>
                            <Separator />
                            <div className="space-y-4 text-foreground">
                                {readingData.questions.map((q, i) => (
                                    <div key={i} className="space-y-2">
                                        <Label className='font-bold text-foreground'>{q.question}</Label>
                                        <Input 
                                            value={readAns[q.id] || ''} 
                                            onChange={e => { if (targetStudentId) return; setReadAns({...readAns, [q.id]: e.target.value}); setReadVal({...readVal, [q.id]: 'unchecked'}); }} 
                                            className={cn('h-12 text-foreground', readVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[q.id] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} 
                                            autoComplete="off" 
                                            readOnly={!!targetStudentId} 
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6">
                            <Button onClick={handleReadingCheck} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('reading')} disabled={!readingOk && !isAdmin} className="font-bold text-white bg-primary">Continuar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'final':
                return (
                    <FinalValidationExercise 
                        title="Ejercicio Final" 
                        description="Completa con el reflexivo correcto." 
                        prompts={finalExPrompts} 
                        onComplete={() => handleTopicComplete('final')} 
                        type="spanish" 
                        isAdmin={isAdmin} 
                        isSupervisionMode={!!targetStudentId} 
                        vocabulary={irregularVerbsVocab.reduce((acc, curr) => ({...acc, [curr.en.toLowerCase()]: curr.es.toLowerCase()}), {})} 
                    />
                );
            case 'translate':
                if (isFinished) {
                    return (
                        <Card className="shadow-soft border-2 border-green-500 bg-green-50/10 p-12 text-center flex flex-col items-center text-foreground">
                            <Trophy className="h-24 w-24 text-yellow-400 mb-6 animate-bounce" />
                            <h2 className="text-4xl font-black uppercase text-green-600 tracking-tighter">¡FELICITACIONES!</h2>
                            <p className="text-2xl mt-4 font-bold">tu completaste esta clase DE Reflexivos Irregulares</p>
                            <Button asChild className="mt-8 px-12 h-12 font-bold" variant="outline"><Link href="/espanol/a2">Regresar a la Unidad A2</Link></Button>
                        </Card>
                    );
                }
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader>
                            <div className='flex justify-between items-center w-full'>
                                <div><CardTitle>Traducción de Texto</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el párrafo final.</CardDescription></div>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                                    <PopoverContent className="w-64">
                                        <ScrollArea className="h-48 pr-4 text-left">
                                            <div className="grid grid-cols-2 gap-2 text-sm text-foreground">
                                                {irregularVerbsVocab.map((v: any, i: number) => (
                                                    <Fragment key={i}>
                                                        <span className="text-muted-foreground capitalize">{v.en}:</span>
                                                        <span className="font-semibold text-right text-primary">{(v.es || '').toUpperCase()}</span>
                                                    </Fragment>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6 text-foreground">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed shadow-sm text-foreground">"Every morning, I wake up at 7 am. My sister stays in bed for ten minutes more. We have breakfast and then she gets dressed for work. In the afternoon, we have fun with our friends and laugh a lot. At night, we go to bed early and fall asleep quickly."</div>
                            <Separator /><div className="space-y-2 text-foreground"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={transText} onChange={(e) => { if (!targetStudentId) setTransText(e.target.value); }} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg text-foreground" readOnly={!!targetStudentId} /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20"><Button onClick={() => { if (!isAdmin && targetStudentId) return; setIsFinished(true); handleTopicComplete('translate'); }} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">TERMINAR</Button></CardFooter>
                    </Card>
                );
            default: return null;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {isAdmin && targetStudentId && (
                        <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md">
                            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400"><Star className="h-6 w-6 fill-current animate-pulse" /><p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión: {studentProfile?.name || targetStudentId}</p></div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors"><Link href="/admin">Cerrar</Link></Button>
                        </div>
                    )}
                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/a2" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver a Ruta A2</Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3">Reflexivos Irregulares 🇪🇸</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30"><CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Misión A2</CardTitle></CardHeader>
                                <CardContent className="p-4">
                                    <nav><ul className="space-y-1">
                                        {learningPath.map((item) => {
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            const Icon = ICONS_CONFIG[item.status as keyof typeof ICONS_CONFIG] || BookOpen;
                                            return (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm')}>
                                                    <div className="flex items-center gap-3">
                                                        {item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}
                                                        <span className="truncate max-w-[150px] text-[10px] uppercase font-bold text-black dark:text-white">{item.name}</span>
                                                    </div>
                                                    {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                                </li>
                                            );
                                        })}
                                    </ul></nav>
                                    <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 font-black uppercase text-muted-foreground"><span>Avance</span><span className="text-primary">{progressValue}%</span></div><Progress value={progressValue} className="h-2 rounded-full" /></div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function ReflexivosIrregularesPage() {
    return (<Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}><ReflexivosIrregularesInternal /></Suspense>);
}
