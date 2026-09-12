
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
    MapPin,
    Book,
    Pencil,
    Check,
    X
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
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { Textarea } from '@/components/ui/textarea';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_a1_prep_lugar_v60_indep_vocab';
const mainProgressKey = 'progress_a1_es_preposiciones_de_lugar';

const ICONS_MAP = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const vocabularyData = {
    casa: [
        { en: "HOUSE", es: "CASA" },
        { en: "LIVING ROOM", es: "SALA" },
        { en: "KITCHEN", es: "COCINA" },
        { en: "BATHROOM", es: "BAÑO" },
        { en: "BEDROOM", es: "DORMITORIO" },
        { en: "DINING ROOM", es: "COMEDOR" },
        { en: "GARDEN", es: "JARDÍN" },
        { en: "WALL", es: "PARED" },
        { en: "FLOOR", es: "PISO" },
        { en: "WINDOW", es: "VENTANA" },
        { en: "DOOR", es: "PUERTA" },
    ],
    aula: [
        { en: "CLASSROOM", es: "AULA" },
        { en: "BLACKBOARD", es: "TABLERO" },
        { en: "PENCIL", es: "LÁPIZ" },
        { en: "PEN", es: "LAPICERO" },
        { en: "NOTEBOOK", es: "CUADERNO" },
        { en: "ERASER", es: "BORRADOR" },
        { en: "BACKPACK", es: "MALETA" },
        { en: "RULER", es: "REGLA" },
        { en: "CALCULATOR", es: "CALCULADORA" },
        { en: "MAP", es: "MAPA" },
        { en: "DESK", es: "ESCRITORIO" },
    ],
    muebles: [
        { en: "SOFA", es: "SOFÁ" },
        { en: "BED", es: "CAMA" },
        { en: "TABLE", es: "MESA" },
        { en: "CHAIR", es: "SILLA" },
        { en: "LAMP", es: "LÁMPARA" },
        { en: "SHELF", es: "ESTANTE" },
        { en: "MIRROR", es: "ESPEJO" },
        { en: "OVEN", es: "HORNO" },
        { en: "FRIDGE", es: "NEVERA" },
        { en: "TELEVISION", es: "TELEVISIÓN" },
    ]
};

// --- VOCABULARIO INDEPENDIENTE POR EJERCICIO ---
const ex1VocabHelp = { "mesa": "table", "silla": "chair", "delante de": "in front of", "detrás de": "behind", "entre": "between", "al lado de": "next to", "dentro de": "inside", "libro": "book", "gato": "cat", "perro": "dog" };
const ex2VocabHelp = { "piso": "floor", "llaves": "keys", "sofá": "sofa", "profesor": "teacher", "tablero": "blackboard", "jardín": "garden", "casa": "house", "nevera": "fridge", "cocina": "kitchen", "espejo": "mirror", "puerta": "door", "regla": "ruler" };
const ex3VocabHelp = { "computador": "computer", "escritorio": "desk", "zapatos": "shoes", "mesa": "table", "mapa": "map", "pared": "pared", "silla": "chair", "ventana": "window", "horno": "oven", "carro": "car", "parque": "park", "escuela": "school" };
const translateVocabHelp = { "cerca de": "near", "parque": "park", "sala": "living room", "sofá": "sofa", "tv": "television", "cocina": "kitchen", "limpia": "clean", "nevera": "fridge", "horno": "oven", "perro": "dog", "árbol": "tree", "feliz": "happy" };
const finalExVocabHelp = { "encima de": "on / above", "debajo de": "under", "delante de": "in front of", "detrás de": "behind", "entre": "between", "al lado de": "next to", "dentro de": "inside" };
const negativeVocabHelp = { "jardín": "garden", "mesa": "table", "cocina": "kitchen", "llaves": "keys", "cama": "bed", "escuela": "school", "casa": "house", "sofá": "sofa", "cuarto": "room", "maleta": "backpack" };

const allVocabList = [...vocabularyData.casa, ...vocabularyData.aula, ...vocabularyData.muebles];

const ex1Prompts = [
    { en: "The book is on the table.", es: ["el libro está encima de la mesa", "el libro esta sobre la mesa", "el libro está en la mesa"] },
    { en: "The cat is under the chair.", es: ["el gato está debajo de la silla", "el gato está bajo la silla"] },
    { en: "The pencil is in front of the notebook.", es: ["el lápiz está delante del cuaderno", "el lápiz está en frente del cuaderno"] },
    { en: "The dog is behind the door.", es: ["el perro está detrás de la puerta"] },
    { en: "The lamp is between the bed and the desk.", es: ["la lámpara está entre la cama y el escritorio"] },
    { en: "The window is next to the shelf.", es: ["la ventana está al lado del estante"] },
    { en: "The student is inside the classroom.", es: ["el estudiante está dentro del aula", "el estudiante está en el salón de clase"] },
];

const ex2Prompts = [
    { en: "My backpack is on the floor.", es: ["mi maleta está en el piso", "mi maleta está sobre el piso"] },
    { en: "Your keys are under the sofa.", es: ["tus llaves están debajo del sofá", "tus llaves están bajo el sofá"] },
    { en: "The teacher is in front of the blackboard.", es: ["el profesor está delante del tablero", "el profesor está en frente del tablero"] },
    { en: "The garden is behind the house.", es: ["el jardín está detrás de la casa"] },
    { en: "The fridge is in the kitchen.", es: ["la nevera está en la cocina"] },
    { en: "The mirror is next to the door.", es: ["el espejo está al lado de la puerta"] },
    { en: "The ruler is between the pencil and the pen.", es: ["la regla está entre el lápiz y el lapicero"] },
];

const ex3Prompts = [
    { en: "The computer is on the desk.", es: ["el computador está encima del escritorio", "el computador esta sobre el escritorio"] },
    { en: "The shoes are under the table.", es: ["los zapatos están debajo de la mesa"] },
    { en: "There is a map on the wall.", es: ["hay un mapa en la pared", "hay un mapa sobre la pared"] },
    { en: "The chair is next to the window.", es: ["la silla está al lado de la ventana"] },
    { en: "The oven is in the kitchen.", es: ["el horno está en la cocina"] },
    { en: "The car is in front of the house.", es: ["el carro está delante de la casa", "el carro está en frente de la casa"] },
    { en: "The park is behind the school.", es: ["el parque está detrás de la escuela", "el parque está detrás del colegio"] },
    { en: "The pen is inside the backpack.", es: ["el lapicero está dentro de la maleta", "el boligrafo esta en la maleta"] },
    { en: "Is your father in the living room?", es: ["¿está tu padre en la sala?", "¿tu papa esta en la sala?"] },
    { en: "The cat is between the sofa and the lamp.", es: ["el gato está entre el sofá y la lámpara"] },
];

const readingData = {
    title: "La Casa de Carlos",
    content: "Carlos vive en una casa hermosa. En la sala, hay un sofá gris y una lámpara está al lado del sofá. La televisión está delante de la mesa. En la cocina, la nevera está entre el horno y la puerta. Carlos tiene un perro que siempre está debajo de la mesa del comedor. En su dormitorio, los libros están encima del estante y su maleta está detrás de la puerta.",
    questions: [
        { id: 'q1', q: "¿Dónde está la lámpara?", a: ["al lado del sofá", "junto al sofa"] },
        { id: 'q2', q: "¿Dónde está la nevera?", a: ["entre el horno y la puerta"] },
        { id: 'q3', q: "¿Dónde está el perro?", a: ["debajo de la mesa", "bajo la mesa"] },
        { id: 'q4', q: "¿Qué hay encima del estante?", a: ["libros", "los libros"] },
        { id: 'q5', q: "¿Dónde está la maleta?", a: ["detrás de la puerta"] },
    ]
};

const finalExPrompts = [
    { s: "1. El libro está _______ (on) la mesa.", answer: ["encima de", "sobre", "en"] },
    { s: "2. El gato está _______ (under) la silla.", answer: ["debajo de", "bajo"] },
    { s: "3. La niña está _______ (in front of) la casa.", answer: ["delante de", "en frente de"] },
    { s: "4. El parque está _______ (behind) el colegio.", answer: ["detrás de", "detras de"] },
    { s: "5. Mi casa está _______ (between) el banco y la tienda.", answer: ["entre"] },
    { s: "6. Tu maleta está _______ (next to) la puerta.", answer: ["al lado de", "junto a"] },
    { s: "7. Las llaves están _______ (inside) el bolso.", answer: ["dentro de", "en"] },
    { s: "8. El perro duerme _______ (under) el sofá.", answer: ["debajo de", "bajo"] },
    { s: "9. El tablero está _______ (on) la pared.", answer: ["en", "sobre", "encima de"] },
    { s: "10. La cuchara está _______ (next to) el plato.", answer: ["al lado de", "junto al"] },
    { s: "11. Hay un espejo ___ (in front of) la cama.", answer: ["delante de"] },
    { s: "12. El jardín está ___ (behind) el edificio.", answer: ["detrás de"] },
    { s: "13. La nevera está ___ (between) la pared y la mesa.", answer: ["entre"] },
    { s: "14. El lápiz está ___ (inside) el estuche.", answer: ["dentro de"] },
    { s: "15. El sol está ___ (above) las nubes.", answer: ["encima de"] },
    { s: "16. El carro está ___ (in front of) el garaje.", answer: ["delante de"] },
    { s: "17. La farmacia está ___ (next to) el hospital.", answer: ["al lado de"] },
    { s: "18. El ratón está ___ (under) el escritorio.", answer: ["debajo de"] },
    { s: "19. Estamos ___ (inside) la clase.", answer: ["dentro de"] },
    { s: "20. La biblioteca está ___ (between) el parque y el cine.", answer: ["entre"] },
    { s: "21. El cuadro está ___ (on) la pared.", answer: ["en"] },
    { s: "22. El borrador está ___ (next to) el tablero.", answer: ["al lado de"] },
    { s: "23. La maleta está ___ (behind) la silla.", answer: ["detrás de"] },
    { s: "24. Hay una alfombra ___ (under) la mesa.", answer: ["debajo de"] },
    { s: "25. Mi teléfono está ___ (inside) mi bolsillo.", answer: ["dentro de"] },
    { s: "26. La panadería está ___ (in front of) la plaza.", answer: ["delante de"] },
    { s: "27. El gato salta ___ (on) la cama.", answer: ["encima de"] },
    { s: "28. El profesor está ___ (between) los estudiantes.", answer: ["entre"] },
    { s: "29. La ventana está ___ (next to) el escritorio.", answer: ["al lado de"] },
    { s: "30. El sótano está ___ (under) la casa.", answer: ["debajo de"] },
];

const negativePrompts = [
    { en: "I am not in the garden.", es: ["no estoy en el jardín", "yo no estoy en el jardín"] },
    { en: "The book is not on the table.", es: ["el libro no está encima de la mesa", "el libro no esta sobre la mesa"] },
    { en: "She is not in the kitchen.", es: ["ella no está en la cocina", "no está en la cocina"] },
    { en: "The keys are not under the bed.", es: ["las llaves no están debajo de la cama", "las llaves no estan bajo la cama"] },
    { en: "We are not in front of the school.", es: ["no estamos delante de la escuela", "nosotros no estamos en frente del colegio"] },
    { en: "The car is not behind the house.", es: ["el carro no está detrás de la casa", "el coche no esta detras de la casa"] },
    { en: "The lamp is not next to the sofa.", es: ["la lámpara no está al lado del sofá"] },
    { en: "They are not inside the room.", es: ["ellos no están dentro del cuarto", "no estan en la habitacion"] },
    { en: "The pencil is not in the backpack.", es: ["el lápiz no está en la maleta", "el lapiz no esta en la mochila"] },
    { en: "He is not between my mother and my father.", es: ["él no está entre mi madre y mi padre"] },
    { en: "The map is not on the wall.", es: ["el mapa no está en la pared"] },
    { en: "The cat is not under the table.", es: ["el gato no está debajo de la mesa"] },
    { en: "I am not in front of the mirror.", es: ["no estoy delante del espejo", "yo no estoy en frente del espejo"] },
    { en: "The flowers are not in the garden.", es: ["las flores no están en el jardín"] },
    { en: "The notebook is not next to the computer.", es: ["el cuaderno no está al lado del computador"] },
    { en: "You are not behind me.", es: ["tú no estás detrás de mí", "usted no esta detras de mi"] },
    { en: "She is not behind the house.", es: ["no está detrás de la casa", "ella no está detrás de la casa"] },
    { en: "We are not between the park and the bank.", es: ["no estamos entre el parque y el banco", "nosotros no estamos entre el parque y el banco"] },
    { en: "The books are not next to the lamp.", es: ["los libros no están al lado de la lámpara"] },
    { en: "You are not in front of the door.", es: ["no estás delante de la puerta", "tú no estás delante de la puerta"] },
    { en: "The cat is not inside the box.", es: ["el gato no está dentro de la caja"] },
    { en: "The cars are not on the street.", es: ["los carros no están en la calle"] },
    { en: "The coffee is not on the table.", es: ["el café no está en la mesa", "el cafe no esta sobre la mesa"] },
    { en: "The students are not in the classroom.", es: ["los estudiantes no están en el aula", "los estudiantes no están en el salón de clase"] },
];

// --- COMPONENTS ---

const VocabHelp = ({ vocabulary }: { vocabulary: Record<string, string> }) => (
    <Popover>
        <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0">
                <Book className="mr-2 h-4 w-4" /> Vocabulario
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
            <ScrollArea className="h-48 pr-4 text-left">
                <div className="grid grid-cols-2 gap-2 text-sm text-foreground">
                    {Object.entries(vocabulary).map(([es, en]) => (
                        <Fragment key={es}>
                            <span className="text-muted-foreground capitalize font-bold">{es}:</span>
                            <span className="font-semibold text-right text-primary">{(en || '').toUpperCase()}</span>
                        </Fragment>
                    ))}
                </div>
            </ScrollArea>
        </PopoverContent>
    </Popover>
);

const BlockValidationExercise = ({ title, prompts, onComplete, vocabulary, savedAnswers, onAnswerChange, isAdmin, isSupervisionMode, isFinal = false, type = 'translate' }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [validationStatus, setValidationStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    const handleCheck = () => {
        const newVal: Record<number, 'correct' | 'incorrect'> = {};
        let allOk = true;
        prompts.forEach((p: any, i: number) => {
            const user = (savedAnswers[i] || '').trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
            const rawAnswers = p.es || p.answer || [];
            const corrects = (Array.isArray(rawAnswers) ? rawAnswers : [rawAnswers])
                .map((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' '));
            const isOk = corrects.includes(user);
            newVal[i] = isOk ? 'correct' : 'incorrect';
            if (!isOk) allOk = false;
        });
        setValidationStatus(newVal);
        if (allOk) toast({ title: "¡Excelente!", description: "Todo está correcto." });
        else toast({ variant: 'destructive', title: "Hay errores", description: "Revisa las marcas." });
    };

    const allCorrect = Object.values(validationStatus).length === prompts.length && Object.values(validationStatus).every(v => v === 'correct');

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="text-left">
                        <CardTitle className="text-foreground">{title}</CardTitle>
                        <CardDescription className='font-bold text-foreground'>Completa o traduce según corresponda.</CardDescription>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", validationStatus[i] === 'correct' ? "bg-green-500 text-white border-green-500" : validationStatus[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && <VocabHelp vocabulary={vocabulary} />}
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">
                    {type === 'translate' ? prompts[currentIndex]?.en : prompts[currentIndex]?.s}
                </div>
                <Input value={savedAnswers[currentIndex] || ''} onChange={e => { if (isSupervisionMode) return; onAnswerChange(currentIndex, e.target.value); setValidationStatus({ ...validationStatus, [currentIndex]: 'unchecked' }); }} className={cn("h-12 text-lg text-foreground", validationStatus[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/10' : validationStatus[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="Respuesta..." autoComplete="off" readOnly={isSupervisionMode} />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    {currentIndex === prompts.length - 1 && (
                        <>
                            {!allCorrect && !isSupervisionMode && <Button onClick={handleCheck} variant="secondary">Verificar Todo</Button>}
                            <Button onClick={onComplete} disabled={!allCorrect && !isAdmin} className="text-white font-bold bg-primary hover:bg-primary/90">
                                {isFinal ? 'TERMINAR' : 'Continuar'}
                            </Button>
                        </>
                    )}
                    {currentIndex < prompts.length - 1 && <Button onClick={() => setCurrentIndex(i => i + 1)}>Siguiente</Button>}
                </div>
            </CardFooter>
        </Card>
    );
};

// --- MAIN PAGE ---

function PreposicionesLugarContent() {
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
    const [vocabAns, setVocabAns] = useState<Record<number, string>>({});
    const [vocabVal, setVocabVal] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});
    const [ex1Ans, setEx1Ans] = useState<Record<number, string>>({});
    const [ex2Ans, setEx2Ans] = useState<Record<number, string>>({});
    const [ex3Ans, setEx3Ans] = useState<Record<number, string>>({});
    const [readAns, setReadAns] = useState<Record<string, string>>({});
    const [readVal, setReadVal] = useState<Record<string, any>>({});
    const [transText, setTransText] = useState('');
    const [finalExAns, setFinalExAns] = useState<Record<number, string>>({});
    const [negativeAns, setNegativeAns] = useState<Record<number, string>>({});
    const [isFinished, setIsFinished] = useState(false);

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: authUserProfile } = useDoc<{ role?: string }>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string, lessonProgress?: any, progress?: any, name?: string }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    const initialPathData = useMemo(() => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: '2. Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: '3. Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: '4. Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'ex3', name: '5. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'reading', name: '7. Lectura', icon: BookText, status: 'locked' },
        { key: 'final_exercise', name: '8. Ejercicio Final', icon: Pencil, status: 'locked' },
        { key: 'translate', name: '9. Traducir Texto', icon: Pencil, status: 'locked' },
        { key: 'final', name: '10. Final', icon: Trophy, status: 'locked' },
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
        if (d.vocabAns) setVocabAns(d.vocabAns);
        if (d.ex1Ans) setEx1Ans(d.ex1Ans);
        if (d.ex2Ans) setEx2Ans(d.ex2Ans);
        if (d.ex3Ans) setEx3Ans(d.ex3Ans);
        if (d.readAns) setReadAns(d.readAns);
        if (d.transText) setTransText(d.transText);
        if (d.finalExAns) setFinalExAns(d.finalExAns);
        if (d.negativeAns) setNegativeAns(d.negativeAns);
        if (d.isFinished) setIsFinished(d.isFinished);
        setInitialLoadComplete(true); setIsInitialLoading(false);
    }, [isAdmin, initialPathData, studentProfile, isProfileLoading, isUserLoading, targetStudentId, initialLoadComplete]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || targetStudentId) return;
        const s: any = { lastSelectedTopic: selectedTopic, vocabAns, ex1Ans, ex2Ans, ex3Ans, readAns, transText, finalExAns, negativeAns, isFinished };
        learningPath.forEach(t => s[t.key] = t.status);
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, targetStudentId, initialLoadComplete, vocabAns, ex1Ans, ex2Ans, ex3Ans, readAns, transText, finalExAns, negativeAns, isFinished]);

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

    const handleCheckVocab = () => {
        const newVal: Record<number, 'correct' | 'incorrect'> = {};
        let allOk = true;
        allVocabList.forEach((v, i) => {
            const user = (vocabAns[i] || '').trim().toUpperCase();
            const isOk = v.es === user;
            newVal[i] = isOk ? 'correct' : 'incorrect';
            if (!isOk) allOk = false;
        });
        setVocabVal(newVal);
        if (allOk) toast({ title: "¡Todo correcto!", description: "Puedes continuar." });
        else toast({ variant: 'destructive', title: "Sigue intentando", description: "Revisa las palabras en rojo." });
    };

    const allVocabCorrect = useMemo(() => {
        return allVocabList.length > 0 && Object.values(vocabVal).length === allVocabList.length && Object.values(vocabVal).every(v => v === 'correct');
    }, [vocabVal]);

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>Vocabulario: Casa y Aula</CardTitle><CardDescription className='font-bold text-foreground'>Escribe la traducción al español.</CardDescription></CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[500px] pr-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="font-black text-primary border-b pb-2 uppercase text-xs">Inglés</div><div className="font-black text-primary border-b pb-2 uppercase text-xs">Español</div>
                                    {allVocabList.map((v, i) => (
                                        <Fragment key={i}>
                                            <div className="p-3 border rounded bg-white/5 font-bold flex items-center text-sm">{v.en}</div>
                                            <Input value={vocabAns[i] || ''} onChange={e => { if (targetStudentId) return; setVocabAns({...vocabAns, [i]: e.target.value}); setVocabVal({...vocabVal, [i]: 'unchecked'}); }} className={cn("uppercase", vocabVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} />
                                        </Fragment>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6">
                            <Button onClick={handleCheckVocab} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary')} disabled={!allVocabCorrect && !isAdmin} className='text-white font-bold'>Continuar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-foreground text-left overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Preposiciones de Lugar</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-primary uppercase mb-4">Uso de las Preposiciones</h3>
                                <p className="text-lg leading-relaxed mb-6">Las preposiciones de lugar se utilizan para indicar la posición de un objeto o persona con respecto a otro. <br/> Prepositions of place are used to indicate the position of an object or person in relation to another.</p>
                                <div className='grid gap-4 sm:grid-cols-2'>
                                    {[
                                        { es: "Encima de / Sobre", en: "On / Above" },
                                        { es: "Debajo de", en: "Under / Below" },
                                        { es: "Delante de / En frente de", en: "In front of" },
                                        { es: "Detrás de", en: "Behind" },
                                        { es: "Entre", en: "Between" },
                                        { es: "Al lado de", en: "Next to / Beside" },
                                        { es: "Dentro de", en: "Inside / In" },
                                        { es: "Fuera de", en: "Outside" }
                                    ].map((p, i) => (
                                        <div key={i} className='p-4 bg-background/50 rounded-xl border flex justify-between items-center text-foreground'>
                                            <span className='font-bold text-primary'>{p.es}</span>
                                            <span className='text-sm italic text-muted-foreground'>{p.en}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'ex1': return <BlockValidationExercise key="ex1" title="Ejercicio 1" prompts={ex1Prompts} onComplete={() => handleTopicComplete('ex1')} savedAnswers={ex1Ans} onAnswerChange={(idx: number, val: string) => setEx1Ans({...ex1Ans, [idx]: val})} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={ex1VocabHelp} />;
            case 'ex2': return <BlockValidationExercise key="ex2" title="Ejercicio 2" prompts={ex2Prompts} onComplete={() => handleTopicComplete('ex2')} savedAnswers={ex2Ans} onAnswerChange={(idx: number, val: string) => setEx2Ans({...ex2Ans, [idx]: val})} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={ex2VocabHelp} />;
            case 'ex3': return <BlockValidationExercise key="ex3" title="Ejercicio 3" prompts={ex3Prompts} onComplete={() => handleTopicComplete('ex3')} savedAnswers={ex3Ans} onAnswerChange={(idx: number, val: string) => setEx3Ans({...ex3Ans, [idx]: val})} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={ex3VocabHelp} />;
            case 'vocab_game': return <VocabularyMatchingGame data={allVocabList.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Memory: Casa y Aula" />;
            case 'reading':
                const readingOk = readingData.questions.every(q => readVal[q.id] === 'correct');
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>{readingData.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner text-foreground">{readingData.content}</div>
                            <Separator /><div className="space-y-4">{readingData.questions.map((q, i) => (
                                <div key={i} className="space-y-2"><Label className='font-bold text-foreground'>{q.q}</Label><Input value={readAns[q.id] || ''} onChange={e => { if (targetStudentId) return; setReadAns({...readAns, [q.id]: e.target.value}); setReadVal({...readVal, [q.id]: 'unchecked'}); }} className={cn('h-12 text-foreground', readVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[q.id] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                            ))}</div>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6">
                            <Button onClick={() => {
                                let ok = true; const nv: any = {};
                                readingData.questions.forEach(q => {
                                    const user = (readAns[q.id] || '').trim().toLowerCase();
                                    const isOk = q.a.some(a => user.includes(a.toLowerCase()));
                                    nv[q.id] = isOk ? 'correct' : 'incorrect'; if (!isOk) ok = false;
                                });
                                setReadVal(nv);
                            }} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('reading')} disabled={!readingOk && !isAdmin} className="font-bold text-white bg-primary">Continuar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'final_exercise': return <BlockValidationExercise key="final_exercise" title="Ejercicio Final (Completar)" prompts={finalExPrompts} onComplete={() => handleTopicComplete('final_exercise')} savedAnswers={finalExAns} onAnswerChange={(idx: number, val: string) => setFinalExAns({...finalExAns, [idx]: val})} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} type="spanish" vocabulary={finalExVocabHelp} />;
            case 'translate':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader>
                            <div className='flex justify-between items-start'>
                                <div><CardTitle>Traducción de Texto</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el párrafo al español.</CardDescription></div>
                                <VocabHelp vocabulary={translateVocabHelp} />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed shadow-sm text-foreground">"My house is near the park. The living room has a large sofa and a TV in front of it. The kitchen is clean and the fridge is next to the oven. In the garden, my dog is playing under the tree. I am happy in my house."</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={transText} onChange={(e) => { if (!targetStudentId) setTransText(e.target.value); }} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg text-foreground" readOnly={!!targetStudentId} /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20">
                            <Button onClick={() => handleTopicComplete('translate')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Siguiente Misión <ArrowRight className='ml-3 h-8' /></Button>
                        </CardFooter>
                    </Card>
                );
            case 'final':
                if (isFinished) {
                    return (
                        <Card className="shadow-soft border-2 border-green-500 bg-green-50/10 p-12 text-center flex flex-col items-center text-foreground">
                            <Trophy className="h-24 w-24 text-yellow-400 mb-6 animate-bounce" />
                            <h2 className="text-4xl font-black uppercase text-green-600 tracking-tighter">¡EXCELENTE!</h2>
                            <p className="text-2xl mt-4 font-bold">¡Has terminado la clase Preposiciones de Lugar!</p>
                            <p className='text-muted-foreground mt-2 text-lg'>Misión completada al 100%.</p>
                            <Button asChild className="mt-8 px-12 h-12 font-bold" variant="outline"><Link href="/espanol/a1">Regresar a la Ruta A1</Link></Button>
                        </Card>
                    );
                }
                return <BlockValidationExercise key="final_negatives" title="Final: Frases Negativas" prompts={negativePrompts} onComplete={() => { setIsFinished(true); handleTopicComplete('final'); }} isFinal={true} savedAnswers={negativeAns} onAnswerChange={(idx: number, val: string) => setNegativeAns({...negativeAns, [idx]: val})} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={negativeVocabHelp} />;
            default: return null;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {isAdmin && targetStudentId && (
                        <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md text-foreground">
                            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400">
                                <Star className="h-6 w-6 fill-current animate-pulse" />
                                <p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión: {studentProfile?.name || targetStudentId}</p>
                            </div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors"><Link href="/admin">Cerrar</Link></Button>
                        </div>
                    )}
                    
                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/a1" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver al Curso A1</Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3"><MapPin className='h-10 w-10 text-primary' /> Preposiciones de Lugar 🇪🇸</h1>
                    </div>

                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30">
                                    <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Misión A1</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <nav><ul className="space-y-1">
                                        {learningPath.map((item) => {
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            const Icon = ICONS_MAP[item.status as keyof typeof ICONS_MAP] || BookOpen;
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

export default function PreposicionesLugarPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}>
            <PreposicionesLugarContent />
        </Suspense>
    );
}