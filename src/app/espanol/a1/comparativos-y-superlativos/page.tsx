
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
    Scale,
    Pencil,
    Check,
    X,
    Info,
    ListChecks,
    Loader2,
    Star,
    Palette,
    Zap,
    Activity,
    Search
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
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { Textarea } from '@/components/ui/textarea';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_a1_comp_sup_v755_volatile_spaces';
const mainProgressKey = 'progress_a1_es_comparativos_y_superlativos';

const ICONS_CONFIG: Record<string, React.ElementType> = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const mainVocabData = [
    { en: "Tall", es: "Alto" }, { en: "Short", es: "Bajo" }, { en: "Big", es: "Grande" },
    { en: "Small", es: "Pequeño" }, { en: "Fast", es: "Rápido" }, { en: "Slow", es: "Lento" },
    { en: "Expensive", es: "Caro" }, { en: "Cheap", es: "Barato" }, { en: "Interesting", es: "Interesante" },
    { en: "Happy", es: "Feliz" }, { en: "Sad", es: "Triste" }, { en: "Strong", es: "Fuerte" },
    { en: "Boring", es: "Aburrido" }, { en: "Good", es: "Bueno" }, { en: "Bad", es: "Malo" },
    { en: "Better", es: "Mejor" }, { en: "Worse", es: "Peor" }, { en: "More", es: "Más" },
    { en: "Less", es: "Menos" }, { en: "Than", es: "Que" }, { en: "As... as", es: "Tan... como" },
    { en: "Young", es: "Joven" }, { en: "Old", es: "Viejo" }, { en: "Beautiful", es: "Bonito" },
    { en: "Difficult", es: "Difícil" }, { en: "Easy", es: "Fácil" }, { en: "Strong", es: "Fuerte" },
    { en: "Weak", es: "Débil" }, { en: "Clean", es: "Limpio" }, { en: "Dirty", es: "Sucio" },
    { en: "Safe", es: "Seguro" }, { en: "Dangerous", es: "Peligroso" }, { en: "Friendly", es: "Amigable" },
    { en: "Selfish", es: "Egoísta" }, { en: "Intelligent", es: "Inteligente" }, { en: "Funny", es: "Divertido" },
    { en: "Serious", es: "Serio" }, { en: "Wide", es: "Ancho" }, { en: "Narrow", es: "Estrecho" },
    { en: "Heavy", es: "Pesado" }, { en: "Light", es: "Liviano" }, { en: "Happy", es: "Feliz" },
    { en: "Sad", es: "Triste" }
];

const irregularTable = [
    { adjective: "BUENO (Good)", comparative: "MEJOR (Better)", superlative: "EL MEJOR (The best)" },
    { adjective: "MALO (Bad)", comparative: "PEOR (Worse)", superlative: "EL PEOR (The worst)" },
    { adjective: "VIEJO (Old)", comparative: "MAYOR (Older)", superlative: "EL MAYOR (The oldest)" },
    { adjective: "JOVEN (Young)", comparative: "MENOR (Younger)", superlative: "EL MENOR (The youngest)" },
    { adjective: "GRANDE (Big)", comparative: "MAYOR (Greater)", superlative: "EL MAYOR (The greatest)" },
    { adjective: "PEQUEÑO (Small)", comparative: "MENOR (Smaller)", superlative: "EL MENOR (The smallest)" },
];

const ex1Prompts = [
    { en: "The cat is small.", answer: ["el gato es pequeño"] },
    { en: "The house is big.", answer: ["la casa es grande"] },
    { en: "I am fast.", answer: ["yo soy rápido", "soy rápido"] },
    { en: "She is interesting.", answer: ["ella es interesante", "es interesante"] },
    { en: "She is tall.", answer: ["ella es alta"] },
    { en: "He is short.", answer: ["él es bajo", "el es bajo"] },
    { en: "The car is fast.", answer: ["el carro es rápido", "el coche es rápido"] },
    { en: "The book is interesting.", answer: ["el libro es interesante"] },
    { en: "The phone is expensive.", answer: ["el teléfono es caro", "el celular es caro"] },
    { en: "she is nice.", answer: ["ella es chevere"] },
];

const ex2Prompts = [
    { en: "He is taller than me.", answer: ["él es más alto que yo", "el es mas alto que yo"] },
    { en: "This is cheaper than that.", answer: ["esto es más barato que eso", "esto es mas barato que eso"] },
    { en: "My dog is faster than your cat.", answer: ["mi perro es más rápido que tu gato", "mi perro es mas rapido que tu gato"] },
    { en: "Spanish is easier than Chinese.", answer: ["el español es más fácil que el chino", "el espanol es mas facil que el chino"] },
    { en: "A car is more expensive than a bike.", answer: ["un carro es más caro que una bicicleta", "un coche es mas caro que una bicicleta"] },
    { en: "She is older than her sister.",  answer: ["ella es mayor que su hermana", "ella es mas vieja que su hermana"] },
    { en: "My car is faster than yours.",  answer: ["mi coche es mas rapido que el tuyo", "mi carro es mas rapido que el tuyo"] },
    { en: "She is taller than her brother.",  answer: ["ella es mas alta que su hermano"] },
    { en: "This book is more interesting than the last one.",  answer: ["este libro es mas interesante que el ultimo"] },
    { en: "The weather today is better than yesterday.",  answer: ["el clima hoy es mejor que ayer"] },
    { en: "An elephant is bigger than a mouse.",  answer: ["un elefante es mas grande que un raton"] },
    { en: "This house is more expensive than the apartment.",  answer: ["esta casa es mas cara que el apartamento"] },
    { en: "The new phone is worse than the old one.",  answer: ["el nuevo telefono es peor que el viejo"] },
    { en: "He is younger than his sister.",  answer: ["el es mas joven que su hermana"] },
    { en: "The park is more beautiful than the street.",  answer: ["el parque es mas bonito que la calle"] },
    { en: "The test was easier than I expected.",  answer: ["el examen fue mas facil de lo que esperaba"] },
    { en: "A book is cheaper than a computer.",  answer: ["un libro es mas barato que una computadora"] },
    { en: "She is more intelligent than him.",  answer: ["ella es mas inteligente que el"] },
    { en: "Summer is hotter than winter.",  answer: ["el verano es mas caluroso que el invierno"] },
    { en: "This exam is more difficult than the last one.",  answer: ["este examen es mas dificil que el anterior"] },
    { en: "He is stronger than his opponent.",  answer: ["el es mas fuerte que su oponente"] },
];

const ex3Prompts = [
    { en: "This is the tallest building in the city.", answer: ["este es el edificio mas alto de la ciudad", "este es el edificio más alto de la ciudad"] },
    { en: "She is the smartest student in the class.", answer: ["ella es la estudiante mas inteligente de la clase", "ella es la estudiante más inteligente de la clase"] },
    { en: "The blue whale is the biggest animal.", answer: ["la ballena azul es el animal más grande"] },
    { en: "It was the best day of my life.", answer: ["fue el mejor dia de mi vida", "fue el mejor día de mi vida"] },
    { en: "This is the most expensive car in the world.", answer: ["este es el coche mas caro del mundo", "este es el carro mas caro del mundo"] },
    { en: "He is the fastest runner on the team.", answer: ["él es el corredor más rápido del equipo", "el es el corredor mas rapido del equipo"] },
    { en: "That was the worst movie I have ever seen.", answer: ["esa fue la peor pelicula que he visto"] },
    { en: "The cheetah is the fastest animal.", answer: ["el guepardo es el animal mas rapido"] },
    { en: "This is the easiest exercise in the book.", answer: ["este es el ejercicio mas facil del libro"] },
    { en: "My grandmother is the oldest person in my family.", answer: ["mi abuela es la persona mas vieja de mi familia", "mi abuela es la persona mayor de mi familia"] },
    { en: "This is the most beautiful place I've visited.", answer: ["este es el lugar mas bonito que he visitado"] },
    { en: "This is the coldest winter.", answer: ["este es el invierno mas frio"] },
    { en: "This is the most dangerous animal in the jungle.", answer: ["este es el animal mas peligroso de la selva"] },
    { en: "He is the most famous actor.", answer: ["el es el actor mas famoso"] },
    { en: "This is the highest mountain in the country.", answer: ["esta es la montaña mas alta del pais"] },
    { en: "It's the cheapest restaurant in town.", answer: ["es el restaurante mas barato del pueblo"] },
];

const ex4Prompts = [
    { en: "This is better.", answer: ["esto es mejor"] },
    { en: "That is worse.", answer: ["eso es peor"] },
    { en: "I am older than her.", answer: ["soy mayor que ella", "soy mas viejo que ella"] },
    { en: "He is the best player.", answer: ["él es el mejor jugador", "es el mejor jugador"] },
    { en: "I am better than you.", answer: ["soy mejor que tú", "soy mejor que tu"] },
    { en: "He is worse than me.", answer: ["él es peor que yo", "el es peor que yo"] },
    { en: "This is the best.", answer: ["esto es lo mejor"] },
    { en: "That is the worst.", answer: ["eso es lo peor"] },
    { en: "I am older than her.", answer: ["soy mayor que ella", "soy mas viejo que ella"] },
];

const ex5Prompts = [
    { spanish: "Ella es la más bonita", options: ["She is prettier", "She is the most beautiful", "She is beautiful", "She is as beautiful"], answer: "She is the most beautiful" },
    { spanish: "Mi carro es más rápido que el tuyo", options: ["My car is fast", "My car is as fast as yours", "My car is faster than yours", "My car is the fastest"], answer: "My car is faster than yours" },
    { spanish: "Este libro es mejor", options: ["This book is good", "This book is better", "This book is the best", "This book is bad"], answer: "This book is better" },
    { spanish: "Soy el más alto de la clase", options: ["I am taller", "I am tall", "I am the tallest of the class", "I am more tall"], answer: "I am the tallest of the class" },
    { spanish: "Esa película es la peor", options: ["That movie is bad", "That movie is worse", "That movie is the worst", "That movie is not good"], answer: "That movie is the worst" },
    { spanish: "Tú eres más joven que yo", options: ["You are younger than me", "You are the youngest", "You are young", "You are less young"], answer: "You are younger than me" },
    { spanish: "Esto es más barato", options: ["This is cheap", "This is cheaper", "This is the cheapest", "This is more cheap"], answer: "This is cheaper" },
    { spanish: "Ese restaurante es más barato", options: ["That restaurant is cheap", "That restaurant is cheaper", "That restaurant is the cheapest", "That restaurant is more cheap"], answer: "That restaurant is cheaper" },
    { spanish: "Esta casa es más grande", options: ["This house is big", "This house is bigger", "This house is the biggest", "This house is more big"], answer: "This house is bigger" },
    { spanish: "Ese computador es mejor", options: ["That computer is good", "That computer is better", "That computer is the best", "That computer is bad"], answer: "That computer is better" },
];

const mixedExPrompts = [
    { en: "My brother is taller than me.", text: "Mi hermano es _______ que yo.", answer: "más alto" },
    { en: "This book is the best.", text: "Este libro es _______.", answer: "el mejor" },
    { en: "The car is more expensive than the bike.", text: "El carro es _______ que la bicicleta.", answer: "más caro" },
    { en: "I am as intelligent as you.", text: "Soy _______ como tú.", answer: "tan inteligente" },
    { en: "This is the worst day.", text: "Este es _______.", answer: "el peor día" },
    { en: "She is younger than her sister.", text: "Ella es _______ que su hermana.", answer: "menor" },
    { en: "Madrid is bigger than Valencia.", text: "Madrid es _______ que Valencia.", answer: "más grande" },
    { en: "This soup is hotter than that one.", text: "Esta sopa está _______ que esa.", answer: "más caliente" },
    { en: "He is the most famous actor.", text: "Él es _______.", answer: "el más famoso" },
    { en: "The Nile is the longest river.", text: "El Nilo es _______.", answer: "el más largo" },
    { en: "My house is as small as yours.", text: "Mi casa es _______ como la tuya.", answer: "tan pequeña" },
    { en: "This city is noisier than the town.", text: "Esta ciudad es _______ que el pueblo.", answer: "más ruidosa" },
    { en: "That exercise is more difficult.", text: "Ese ejercicio es _______.", answer: "más difícil" },
    { en: "She is the best doctor.", text: "Ella es _______.", answer: "la mejor" },
    { en: "I am older than him.", text: "Soy _______ que él.", answer: "mayor" },
    { en: "The cat is faster than the dog.", text: "El gato es _______ que el perro.", answer: "más rápido" },
    { en: "This building is the highest.", text: "Este edificio es _______.", answer: "el más alto" },
    { en: "The water is colder today.", text: "El agua está _______ que ayer.", answer: "más fría" },
    { en: "We are as tired as they are.", text: "Estamos _______ como ellos.", answer: "tan cansados" },
    { en: "This phone is less expensive.", text: "Este teléfono es _______.", answer: "menos caro" },
    { en: "They are the strongest players.", text: "Ellos son _______.", answer: "los más fuertes" },
    { en: "That movie is more boring.", text: "Esa película es _______.", answer: "más aburrida" },
    { en: "I am shorter than my father.", text: "Soy _______ que mi padre.", answer: "más bajo" },
    { en: "This is the cleanest room.", text: "Esta es _______.", answer: "la más limpia" },
    { en: "Your shoes are newer than mine.", text: "Tus zapatos son _______ que los míos.", answer: "más nuevos" },
    { en: "He is as friendly as she is.", text: "Él es _______ como ella.", answer: "tan amigable" },
    { en: "This bread is better than the other.", text: "Este pan es _______ que el otro.", answer: "mejor" },
    { en: "They are the poorest children.", text: "Ellos son _______.", answer: "los más pobres" },
    { en: "This street is narrower.", text: "Esta calle es _______.", answer: "más estrecha" },
    { en: "I have less money than you.", text: "Tengo _______ que tú.", answer: "menos dinero" },
];

const finalNegativePrompts = [
    { en: "I am not taller than my father.", answer: ["no soy más alto que mi padre", "yo no soy mas alto que mi padre"] },
    { en: "This is not the most expensive car.", answer: ["este no es el carro más caro", "este no es el coche mas caro"] },
    { en: "She is not better than me.", answer: ["ella no es mejor que yo", "no es mejor que yo"] },
    { en: "She is not older than me.", answer: ["ella no es mayor que yo"] },
    { en: "The cat is not faster than the dog.", answer: ["el gato no es más rápido que el perro"] },
    { en: "We are not the best in the class.", answer: ["no somos los mejores de la clase"] },
    { en: "The city is not cleaner than the town.", answer: ["la ciudad no es más limpia que el pueblo"] },
    { en: "This book is not more interesting than that one.", answer: ["este libro no es más interesante que ese"] },
    { en: "He is not the tallest student.", answer: ["él no es el estudiante más alto"] },
    { en: "The food is not better here.", answer: ["la comida no es mejor aquí"] },
    { en: "I am not the most intelligent.", answer: ["no soy el más inteligente"] },
    { en: "This movie is not better than the other.", answer: ["esta película no es mejor que la otra"] },
    { en: "You are not the youngest in the group.", answer: ["no eres el más joven del grupo"] },
    { en: "The hotel is not as expensive as yours.", answer: ["el hotel no es tan caro como el tuyo"] },
    { en: "They are not the best players.", answer: ["ellos no son los mejores jugadores"] },
    { en: "It is not the worst day.", answer: ["no es el peor día"] }
];

const readingData = {
    title: "Una competencia en la ciudad",
    text: "En mi ciudad hay dos restaurantes: 'La Cuchara Rápida' y 'El Tenedor Elegante'. La Cuchara Rápida es más barato que El Tenedor Elegante, pero la comida en El Tenedor Elegante es mejor. El parque de la ciudad es el lugar más bonito de todos, y es más grande que mi casa. La biblioteca es el edificio más viejo de la ciudad. Mi amigo Juan es más alto que yo, pero yo soy más rápido.",
    questions: [
        { id: 'q1', q: "¿Qué restaurante es más barato?", a: ["la cuchara rapida", "la cuchara rápida"] },
        { id: 'q2', q: "¿Cuál es el lugar más bonito de la ciudad?", a: ["el parque", "el parque de la ciudad"] },
        { id: 'q3', q: "¿Cuál es el edificio más viejo?", a: ["la biblioteca"] },
        { id: 'q4', q: "¿Quién es más alto, Juan o el narrador?", a: ["juan"] },
    ]
};

// --- HELPER COMPONENTS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary, initialAns, onAnsChange, isAdmin, isSupervisionMode }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [valStatus, setValStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setCurrentIndex(0); setValStatus({}); }, [title]);

    const handleCheck = () => {
        const newVal: Record<number, 'correct' | 'incorrect'> = {};
        let allOk = true;
        prompts.forEach((p: any, i: number) => {
            const userVal = (initialAns[i] || '').trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
            const rawAnswers = Array.isArray(p.answer) ? p.answer : [p.answer];
            const corrects = rawAnswers.map((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' '));
            const isOk = corrects.includes(userVal);
            newVal[i] = isOk ? 'correct' : 'incorrect';
            if (!isOk) allOk = false;
        });
        setValStatus(newVal);
        if (allOk) toast({ title: "¡Excelente!", description: "Todo está correcto." });
        else toast({ variant: 'destructive', title: "Hay errores", description: "Revisa las marcas rojas en las bolitas." });
    };

    const isAllCorrect = Object.values(valStatus).length === prompts.length && Object.values(valStatus).every(v => v === 'correct');

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-center text-left">
                    <div className="flex-1">
                        <CardTitle className="text-foreground">{title}</CardTitle>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", valStatus[i] === 'correct' ? "bg-green-500 text-white border-green-500" : valStatus[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4 text-left">
                                    <div className="flex flex-col gap-2 text-sm text-foreground">
                                        {Object.entries(vocabulary).map(([es, en]: any) => (
                                            <div key={es} className="flex justify-between border-b pb-1">
                                                <span className="text-muted-foreground capitalize font-bold">{es}:</span>
                                                <span className="font-semibold text-right text-primary">{(en || '').toUpperCase()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">
                    {prompts[currentIndex].en}
                </div>
                <Input value={initialAns[currentIndex] || ''} onChange={e => { if (isSupervisionMode) return; onAnsChange(currentIndex, e.target.value); setValStatus({...valStatus, [currentIndex]: 'unchecked'}); }} className={cn("h-12 text-lg text-foreground", valStatus[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/10' : valStatus[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="Tu respuesta..." autoComplete="off" readOnly={isSupervisionMode} />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    {currentIndex === prompts.length - 1 ? (
                        <>
                            {!isAllCorrect && !isSupervisionMode && <Button onClick={handleCheck} variant="secondary">Verificar</Button>}
                            <Button onClick={onComplete} disabled={!isAllCorrect && !isAdmin} className="text-white font-bold bg-primary hover:bg-primary/90">Continuar</Button>
                        </>
                    ) : (
                        <Button onClick={() => setCurrentIndex(i => i + 1)}>Siguiente</Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
};

// --- MAIN PAGE ---

interface Topic {
    key: string;
    name: string;
    icon: React.ElementType;
    status: 'locked' | 'active' | 'completed';
}

function ComparativosSuperlativosContentInternal() {
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
    const hasInitialized = useRef(false);

    // States for content (Volatile: not loaded from Firestore)
    const [vocabAns, setVocabAns] = useState<string[]>(Array(mainVocabData.length).fill(''));
    const [vocabVal, setVocabVal] = useState<any[]>(Array(mainVocabData.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);
    
    const [ex1Ans, setEx1Ans] = useState<string[]>(Array(ex1Prompts.length).fill(''));
    const [ex2Ans, setEx2Ans] = useState<string[]>(Array(ex2Prompts.length).fill(''));
    const [ex3Ans, setEx3Ans] = useState<string[]>(Array(ex3Prompts.length).fill(''));
    const [ex4Ans, setEx4Ans] = useState<string[]>(Array(ex4Prompts.length).fill(''));
    const [ex5Ans, setEx5Ans] = useState<string[]>(Array(ex5Prompts.length).fill(''));
    const [ex5Val, setEx5Val] = useState<any[]>(Array(ex5Prompts.length).fill('unchecked'));
    const [mixedAns, setMixedAns] = useState<string[]>(Array(mixedExPrompts.length).fill(''));
    const [mixedVal, setMixedVal] = useState<any[]>(Array(mixedExPrompts.length).fill('unchecked'));
    const [finalAns, setFinalAns] = useState<string[]>(Array(finalNegativePrompts.length).fill(''));
    const [finalVal, setFinalVal] = useState<any[]>(Array(finalNegativePrompts.length).fill('unchecked'));
    
    const [readAns, setReadAns] = useState<Record<string, string>>({});
    const [readVal, setReadVal] = useState<Record<string, any>>({});
    const [transText, setTransText] = useState('');
    const [isFinished, setIsFinished] = useState(false);

    const [currentIndex, setCurrentIndex] = useState(0);

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    
    const { data: authUserProfile } = useDoc<{ role?: string }>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string, lessonProgress?: any, progress?: any, name?: string }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: '2. Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: '3. Ejercicio 1 (Neutro)', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: '4. Ejercicio 2 (Comp)', icon: PenSquare, status: 'locked' },
        { key: 'ex3', name: '5. Ejercicio 3 (Sup)', icon: PenSquare, status: 'locked' },
        { key: 'grammar2', name: '6. Gramática 2', icon: GraduationCap, status: 'locked' },
        { key: 'vocab_game', name: '7. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'ex4', name: '8. Ejercicio 4 (Irregulares)', icon: PenSquare, status: 'locked' },
        { key: 'ex5', name: '9. Ejercicio 5 (Seleccion)', icon: ListChecks, status: 'locked' },
        { key: 'reading', name: '10. Lectura', icon: BookText, status: 'locked' },
        { key: 'mixed', name: '11. Ejercicio Mixto', icon: Trophy, status: 'locked' },
        { key: 'translate', name: '12. Traducir Texto', icon: Pencil, status: 'locked' },
        { key: 'final', name: '13. Final', icon: CheckCircle, status: 'locked' },
    ], []);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    const handleTopicSelectInternal = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        setCurrentIndex(0);
        if (['grammar', 'grammar2'].includes(topicKey)) handleTopicComplete(topicKey);
    };

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;

        let path = initialLearningPath.map(topic => ({ ...topic }));
        const d = studentProfile.lessonProgress?.[progressStorageVersion] || {};
        
        if (isAdmin && !targetStudentId) path.forEach(t => t.status = 'completed');
        else {
            path.forEach(t => { if (d[t.key]) (t as any).status = d[t.key]; });
            let last = true;
            for(let i=0; i < path.length; i++) {
                if (last && path[i].status === 'locked') (path[i] as any).status = 'active';
                last = (path[i] as any).status === 'completed';
            }
        }

        setLearningPath(path as Topic[]);
        setSelectedTopic(d.lastSelectedTopic || path.find(p => (p as any).status === 'active')?.key || path[0].key);
        
        setInitialLoadComplete(true);
        setTimeout(() => setIsInitialLoading(false), 200);
        hasInitialized.current = true;
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete, targetStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || targetStudentId || !hasInitialized.current || !user) return;
        const saveTimer = setTimeout(() => {
            const s: any = { lastSelectedTopic: selectedTopic };
            learningPath.forEach(item => { s[item.key] = item.status; });
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        }, 1500);
        return () => clearTimeout(saveTimer);
    }, [learningPath, progressValue, studentDocRef, initialLoadComplete, selectedTopic, isInitialLoading, targetStudentId, isAdmin, user]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(curr => {
            let next: string | null = null; const np = [...curr];
            const i = np.findIndex(t => t.key === topicToComplete);
            if (i !== -1 && np[i].status !== 'completed') {
                np[i].status = 'completed';
                if (i + 1 < np.length && np[i + 1].status === 'locked') {
                    (np[i + 1] as any).status = 'active';
                    next = np[i + 1].key;
                }
            }
            if (next) { const n = next; setTimeout(() => { toast({ title: "¡Misión desbloqueada!" }); setSelectedTopic(n); }, 0); }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleCheckVocab = () => {
        let ok = true;
        const nv = mainVocabData.map((v, i) => {
            const res = v.es.toLowerCase() === (vocabAns[i] || '').trim().toLowerCase();
            if (!res) ok = false;
            return res ? 'correct' : 'incorrect';
        });
        setVocabVal(nv); setCanAdvanceVocab(ok);
        if (ok) toast({ title: "¡Vocabulario completado!" }); else toast({ variant: 'destructive', title: "Revisa las respuestas" });
    };

    const handleChoiceCheck = () => {
        const nv: any[] = [];
        let allOk = true;
        ex5Prompts.forEach((p, i) => {
            const isOk = ex5Ans[i] === p.answer;
            nv[i] = isOk ? 'correct' : 'incorrect';
            if (!isOk) allOk = false;
        });
        setEx5Val(nv);
        if (allOk) toast({ title: "¡Excelente!", description: "Todo está correcto." });
        else toast({ variant: 'destructive', title: "Hay errores", description: "Revisa las marcas rojas en las bolitas." });
    };

    const handleMixedVerification = () => {
        const nv: any[] = [];
        let allOk = true;
        mixedExPrompts.forEach((p, i) => {
            const userAns = (mixedAns[i] || '').trim().toLowerCase();
            const isOk = userAns === p.answer.toLowerCase();
            nv[i] = isOk ? 'correct' : 'incorrect';
            if (!isOk) allOk = false;
        });
        setMixedVal(nv);
        if (allOk) toast({ title: "¡Excelente!", description: "Todo está correcto." });
        else toast({ variant: 'destructive', title: "Hay errores", description: "Revisa las marcas rojas." });
    };

    const handleFinalVerification = () => {
        const nv: any[] = [];
        let allOk = true;
        finalNegativePrompts.forEach((p, i) => {
            const userAns = (finalAns[i] || '').trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
            const corrects = p.answer.map(a => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' '));
            const isOk = corrects.includes(userAns);
            nv[i] = isOk ? 'correct' : 'incorrect';
            if (!isOk) allOk = false;
        });
        setFinalVal(nv);
        if (allOk) toast({ title: "¡Excelente!", description: "Misión terminada al 100%." });
        else toast({ variant: 'destructive', title: "Hay errores", description: "Revisa las marcas rojas." });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>Vocabulario: Comparación</CardTitle><CardDescription className='font-bold text-foreground'>Escribe la traducción al español.</CardDescription></CardHeader>
                        <CardContent><ScrollArea className="h-[450px] pr-4"><div className="grid grid-cols-2 gap-4 text-foreground">
                            <div className="font-black text-primary border-b pb-2 uppercase text-xs">Inglés</div><div className="font-black text-primary border-b pb-2 uppercase text-xs">Español</div>
                            {mainVocabData.map((v, i) => (
                                <Fragment key={i}>
                                    <div className="p-3 border rounded bg-white/5 font-bold flex items-center text-sm">{v.en}</div>
                                    <Input value={vocabAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...vocabAns]; na[i] = e.target.value; setVocabAns(na); const nv = [...vocabVal]; nv[i] = 'unchecked'; setVocabVal(nv); setCanAdvanceVocab(false); }} className={cn("uppercase text-foreground", vocabVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} />
                                </Fragment>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-between border-t pt-6 bg-muted/20">
                            <Button onClick={handleCheckVocab} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold bg-primary'>Continuar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <div className="space-y-6 text-left">
                        <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-foreground overflow-hidden">
                            <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Comparativos y Superlativos</CardTitle></CardHeader>
                            <CardContent className="space-y-8 px-0">
                                <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                    <h3 className="text-xl font-black text-primary uppercase mb-4">1. Comparativos (Comparisons)</h3>
                                    <p className="mb-4 text-muted-foreground italic">Used to compare two elements. / Se usan para comparar dos elementos.</p>
                                    <div className="p-6 bg-primary/10 rounded-2xl border-2 border-primary text-center">
                                        <p className="text-2xl font-black text-primary uppercase tracking-tighter">MÁS + ADJETIVO + QUE</p>
                                        <Separator className="bg-primary/20" />
                                        <p className="font-mono text-sm italic">"Juan es más alto que Pedro" (Juan is taller than Pedro)</p>
                                    </div>
                                </div>
                                <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                    <h3 className="text-xl font-black text-brand-purple uppercase mb-4">2. Superlativos (The Best)</h3>
                                    <p className="mb-4 text-muted-foreground italic">Highlight an element within a group. / Destacan un elemento dentro de un grupo.</p>
                                    <div className="p-6 bg-brand-purple/10 rounded-2xl border-2 border-brand-purple text-center">
                                        <p className="text-2xl font-black text-brand-purple uppercase tracking-tighter">EL/LA MÁS + ADJETIVO + DE</p>
                                        <Separator className="bg-brand-purple/20" />
                                        <p className="font-mono text-sm italic">"El Everest es la montaña más alta del mundo" (The Everest is the highest...)</p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">Comprendido</Button></CardFooter>
                        </Card>
                    </div>
                );
            case 'ex1': return <BallsExercise key="ex1" title="Ejercicio 1" prompts={ex1Prompts} initialAns={ex1Ans} onAnsChange={(i: number, v: string) => { const na = [...ex1Ans]; na[i] = v; setEx1Ans(na); }} onComplete={() => handleTopicComplete('ex1')} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={{"gato": "cat", "pequeño": "small", "casa": "house", "grande": "big", "alta": "tall"}} />;
            case 'ex2': return <BallsExercise key="ex2" title="Ejercicio 2" prompts={ex2Prompts} initialAns={ex2Ans} onAnsChange={(i: number, v: string) => { const na = [...ex2Ans]; na[i] = v; setEx2Ans(na); }} onComplete={() => handleTopicComplete('ex2')} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={{"más alto": "taller", "barato": "cheaper", "rápido": "faster", "fácil": "easier"}} />;
            case 'ex3': return <BallsExercise key="ex3" title="Ejercicio 3" prompts={ex3Prompts} initialAns={ex3Ans} onAnsChange={(i: number, v: string) => { const na = [...ex3Ans]; na[i] = v; setEx3Ans(na); }} onComplete={() => handleTopicComplete('ex3')} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={{"edificio": "building", "inteligente": "smartest", "mundo": "world"}} />;
            case 'grammar2':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-foreground text-left">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase flex items-center gap-2"><Scale className="h-6 w-6" /> Gramática 2: Irregulares</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <p className='font-bold'>Existen adjetivos que no siguen la regla general y cambian completamente en su forma comparativa y superlativa.</p>
                            <div className='bg-background/50 rounded-xl border p-2'>
                                <Table>
                                    <TableHeader className='bg-primary/10'>
                                        <TableRow>
                                            <TableHead className='font-black'>Adjetivo (Normal)</TableHead>
                                            <TableHead className='font-black'>Comparativo</TableHead>
                                            <TableHead className='font-black'>Superlativo</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {irregularTable.map((row, i) => (
                                            <TableRow key={i}>
                                                <TableCell className='font-bold'>{row.adjective}</TableCell>
                                                <TableCell className='text-primary font-black'>{row.comparative}</TableCell>
                                                <TableCell className='text-brand-purple font-black'>{row.superlative}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                        <CardFooter className='justify-center border-t pt-6'><Button onClick={() => handleTopicComplete('grammar2')} size="lg" className="px-20 font-bold">He aprendido los irregulares</Button></CardFooter>
                    </Card>
                );
            case 'vocab_game': return <VocabularyMatchingGame data={mainVocabData.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Memory Game: Comparación" />;
            case 'ex4': return <BallsExercise key="ex4" title="Ejercicio 4" prompts={ex4Prompts} initialAns={ex4Ans} onAnsChange={(i: number, v: string) => { const na = [...ex4Ans]; na[i] = v; setEx4Ans(na); }} onComplete={() => handleTopicComplete('ex4')} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={{"mejor": "better", "peor": "worse", "viejo": "old", "jugador": "player"}} />;
            case 'ex5':
                const curEx5 = ex5Prompts[currentIndex];
                const allEx5Ok = ex5Val.length > 0 && ex5Val.every(v => v === 'correct');
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader>
                            <div className='flex justify-between items-start gap-4'>
                                <div className="flex-1">
                                    <CardTitle className="uppercase font-black text-primary">Ejercicio 5: Selección Múltiple</CardTitle>
                                    <div className="flex gap-1.5 mt-4 flex-wrap">{ex5Prompts.map((_, i) => (<div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-7 w-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", ex5Val[i] === 'correct' ? "bg-green-500 text-white border-green-500" : ex5Val[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card")}>{i+1}</div>))}</div>
                                </div>
                                <Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className='border-2 border-brand-blue animate-border-pulse shrink-0'><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger><PopoverContent className="w-64"><ScrollArea className="h-48 pr-4"><div className="flex flex-col gap-2 text-sm text-foreground">{Object.entries({"más bonita": "beautiful", "más rápido": "faster", "mejor": "better", "más alto": "tallest"}).map(([es, en]) => (<div key={es} className='flex justify-between border-b pb-1'><span>{es}:</span><span className='font-bold uppercase text-primary'>{en}</span></div>))}</div></ScrollArea></PopoverContent></Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-8 pt-8">
                            <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-2xl uppercase tracking-tighter text-foreground">{curEx5.spanish}</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                                {curEx5.options.map((opt) => (
                                    <Button key={opt} onClick={() => { if (targetStudentId) return; const na = [...ex5Ans]; na[currentIndex] = opt; setEx5Ans(na); setEx5Val(v => { const nv = [...v]; nv[currentIndex] = 'unchecked'; return nv; }); }} variant="outline" className={cn("h-14 text-base font-bold uppercase transition-all", ex5Ans[currentIndex] === opt ? "bg-primary/20 border-primary shadow-md" : "")}>{opt}</Button>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6">
                            <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                            <div className="flex gap-2">
                                {currentIndex === ex5Prompts.length - 1 && <Button onClick={handleChoiceCheck} variant="secondary">Verificar</Button>}
                                <Button onClick={() => currentIndex < ex5Prompts.length - 1 ? setCurrentIndex(i => i + 1) : handleTopicComplete('ex5')} disabled={currentIndex === ex5Prompts.length - 1 && !allEx5Ok && !isAdmin}>Siguiente</Button>
                            </div>
                        </CardFooter>
                    </Card>
                );
            case 'reading':
                const readingOk = Object.values(readVal).length === readingData.questions.length && Object.values(readVal).every(v => v === 'correct');
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><div className="flex justify-between items-start"><div><CardTitle>{readingData.title}</CardTitle></div><Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className='border-2 border-brand-blue animate-border-pulse shrink-0'><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger><PopoverContent className="w-64"><ScrollArea className="h-48 pr-4"><div className="flex flex-col gap-2 text-sm text-foreground">{Object.entries({"barato": "cheap", "parque": "park", "biblioteca": "library", "más viejo": "oldest"}).map(([es, en]) => (<div key={es} className='flex justify-between border-b pb-1'><span>{es}:</span><span className='font-bold uppercase text-primary'>{en}</span></div>))}</div></ScrollArea></PopoverContent></Popover></div></CardHeader>
                        <CardContent className="space-y-6 text-foreground">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner text-foreground">{readingData.text}</div>
                            <Separator /><div className="space-y-4">{readingData.questions.map(q => (
                                <div key={q.id} className="space-y-2"><Label className='font-bold'>{q.q}</Label><Input value={readAns[q.id] || ''} onChange={e => { if (targetStudentId) return; setReadAns({...readAns, [q.id]: e.target.value}); setReadVal({...readVal, [q.id]: 'unchecked'}); }} className={cn('h-12 text-foreground', readVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[q.id] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                            ))}</div>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6">
                            <Button onClick={() => {
                                let ok = true; const nv: any = {};
                                readingData.questions.forEach(q => {
                                    const userAns = (readAns[q.id] || '').trim().toLowerCase();
                                    const isOk = q.a.some(a => userAns.includes(a.toLowerCase()));
                                    nv[q.id] = isOk ? 'correct' : 'incorrect'; if (!isOk) ok = false;
                                });
                                setReadVal(nv); if (ok) toast({ title: "¡Lectura superada!" }); else toast({ variant: 'destructive', title: "Revisa las respuestas" });
                            }} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('reading')} disabled={!readingOk && !isAdmin} className="font-bold text-white bg-primary">Continuar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'mixed':
                const curMixed = mixedExPrompts[currentIndex];
                const mixedOk = mixedVal.length > 0 && mixedVal.every(v => v === 'correct');
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader>
                            <div className='flex justify-between items-start gap-4'>
                                <div className="flex-1">
                                    <CardTitle className="uppercase font-black text-primary">Ejercicio Mixto</CardTitle>
                                    <div className="flex gap-1.5 mt-4 flex-wrap">{mixedExPrompts.map((_, i) => (<div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-7 w-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", mixedVal[i] === 'correct' ? "bg-green-500 text-white border-green-500" : mixedVal[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card")}>{i+1}</div>))}</div>
                                </div>
                                <Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className='border-2 border-brand-blue animate-border-pulse shrink-0'><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger><PopoverContent className="w-64"><ScrollArea className="h-48 pr-4"><div className="flex flex-col gap-2 text-sm text-foreground">{Object.entries({"hermano": "brother", "más alto": "taller", "mejor": "best"}).map(([es, en]) => (<div key={es} className='flex justify-between border-b pb-1'><span>{es}:</span><span className='font-bold uppercase text-primary'>{en}</span></div>))}</div></ScrollArea></PopoverContent></Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-8 pt-8 text-foreground">
                            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 text-center italic font-bold">"{curMixed.en}"</div>
                            <div className="text-3xl font-black text-center flex flex-wrap items-center justify-center gap-2">
                                {curMixed.text.split('_______').map((part, i) => (
                                    <Fragment key={i}>
                                        {part}
                                        {i === 0 && (
                                            <Input value={mixedAns[currentIndex] || ''} onChange={e => { if (targetStudentId) return; const na = [...mixedAns]; na[currentIndex] = e.target.value; setMixedAns(na); setMixedVal(v => { const nv = [...v]; nv[currentIndex] = 'unchecked'; return nv; }); }} className={cn("w-40 h-10 inline-block text-center font-bold uppercase transition-all", mixedVal[currentIndex] === 'correct' ? "border-green-500 bg-green-50/10 text-black dark:text-white" : "border-primary")} autoComplete="off" readOnly={!!targetStudentId}/>
                                        )}
                                    </Fragment>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6">
                            <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                            <div className="flex gap-2">
                                {currentIndex === mixedExPrompts.length - 1 && <Button onClick={handleMixedVerification} variant="secondary">Verificar</Button>}
                                <Button onClick={() => currentIndex < mixedExPrompts.length - 1 ? setCurrentIndex(i => i + 1) : handleTopicComplete('mixed')} disabled={currentIndex === mixedExPrompts.length - 1 && !mixedOk && !isAdmin} className="bg-primary text-white font-bold">Continuar</Button>
                            </div>
                        </CardFooter>
                    </Card>
                );
            case 'translate':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader>
                            <div className='flex justify-between items-center w-full'>
                                <div><CardTitle className='text-primary font-black uppercase'>Traducción de Texto</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el párrafo al español.</CardDescription></div>
                                <Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className='border-2 border-brand-blue animate-border-pulse shrink-0'><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger><PopoverContent className="w-64"><ScrollArea className="h-64 pr-4"><div className="flex flex-col gap-2 text-sm text-foreground">{Object.entries({"city": "ciudad", "beautiful": "bonito", "expensive": "caro", "easier": "más fácil", "smarter": "más inteligente"}).map(([en, es]: any) => (<div key={en} className="flex justify-between border-b pb-1"><span className="text-muted-foreground capitalize font-medium">{en}:</span><span className="font-black text-primary text-right uppercase">{es.toUpperCase()}</span></div>))}</div></ScrollArea></PopoverContent></Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed shadow-sm text-foreground">"My city is very big. The park is the most beautiful place in town. I think that learning Spanish is easier than learning Russian. My father is older than my mother, but she is the smartest person I know."</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={transText} onChange={(e) => { if (!targetStudentId) setTransText(e.target.value); }} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg text-foreground" readOnly={!!targetStudentId} /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20">
                            <Button onClick={() => handleTopicComplete('translate')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Siguiente Misión <ArrowRight className='ml-3 h-8 w-8' /></Button>
                        </CardFooter>
                    </Card>
                );
            case 'final':
                if (isFinished) {
                    return (
                        <Card className="shadow-soft border-2 border-green-500 bg-green-50/10 p-12 text-center flex flex-col items-center text-foreground animate-in zoom-in duration-500">
                            <Trophy className="h-24 w-24 text-yellow-400 mb-6 animate-bounce" />
                            <h2 className="text-4xl font-black uppercase text-green-600 tracking-tighter">¡FELICITACIONES!</h2>
                            <p className="text-2xl mt-4 font-bold text-black dark:text-white"> Tu completaste esta clase Comparativos y Superlativos</p>
                            <Button asChild className="mt-8 px-12 h-12 font-bold" variant="outline"><Link href="/espanol/a1">Regresar a la Ruta A1</Link></Button>
                        </Card>
                    );
                }
                const finalOk = finalVal.length > 0 && finalVal.every(v => v === 'correct');
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader>
                            <div className='flex justify-between items-start gap-4'>
                                <div className="flex-1">
                                    <CardTitle>Final: Frases Negativas</CardTitle>
                                    <div className="flex gap-1.5 mt-4 flex-wrap">{finalNegativePrompts.map((_, i) => (<div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-7 w-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", finalVal[i] === 'correct' ? "bg-green-500 text-white border-green-500" : finalVal[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i+1}</div>))}</div>
                                </div>
                                <Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className='border-2 border-brand-blue animate-border-pulse shrink-0'><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger><PopoverContent className="w-64"><ScrollArea className="h-48 pr-4"><div className="flex flex-col gap-2 text-sm text-foreground">{Object.entries({"más alto": "taller", "caro": "expensive"}).map(([es, en]) => (<div key={es} className='flex justify-between border-b pb-1'><span>{es}:</span><span className='font-bold uppercase text-primary'>{en}</span></div>))}</div></ScrollArea></PopoverContent></Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-4">
                            <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">{finalNegativePrompts[currentIndex].en}</div>
                            <Input value={finalAns[currentIndex] || ''} onChange={e => { if (targetStudentId) return; const na = [...finalAns]; na[currentIndex] = e.target.value; setFinalAns(na); setFinalVal(v => { const nv = [...v]; nv[currentIndex] = 'unchecked'; return nv; }); }} className={cn("h-12 text-lg text-foreground uppercase", finalVal[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/10' : finalVal[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="..." autoComplete="off" readOnly={!!targetStudentId} />
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6">
                            <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                            <div className="flex gap-2">
                                {currentIndex === finalNegativePrompts.length - 1 && <Button onClick={handleFinalVerification} variant="secondary">Verificar</Button>}
                                <Button onClick={() => { if(currentIndex < finalNegativePrompts.length - 1) { setCurrentIndex(i => i + 1); } else { setIsFinished(true); handleTopicComplete('final'); } }} disabled={currentIndex === finalNegativePrompts.length - 1 && !finalOk && !isAdmin} className={cn("font-bold text-white", finalOk && currentIndex === finalNegativePrompts.length - 1 ? "bg-green-600 hover:bg-green-700" : "bg-primary")}>{currentIndex === finalNegativePrompts.length - 1 ? 'Terminar' : 'Siguiente'}</Button>
                            </div>
                        </CardFooter>
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
                            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400">
                                <Star className="h-6 w-6 fill-current animate-pulse" />
                                <p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión Activo: {studentProfile?.name || targetStudentId}</p>
                            </div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors">
                                <Link href="/admin">Cerrar</Link>
                            </Button>
                        </div>
                    )}
                    
                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/a1" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver al Curso A1</Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3">
                           <Scale className='h-10 w-10 text-primary' /> Comparativos y Superlativos 🇪🇸
                        </h1>
                    </div>

                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        <div className="md:col-span-9 md:order-1 order-2">
                             <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>}>
                                {renderContent()}
                            </Suspense>
                        </div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30">
                                    <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Misión A1</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <nav><ul className="space-y-1">
                                        {learningPath.map((item) => {
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            const Icon = ICONS_CONFIG[item.status] || BookOpen;
                                            return (
                                                <li key={item.key} onClick={() => handleTopicSelectInternal(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm')}>
                                                    <div className="flex items-center gap-3">
                                                        {item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}
                                                        <span className="truncate max-w-[150px] text-[10px] uppercase font-bold text-black dark:text-white">{item.name}</span>
                                                    </div>
                                                    {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                                </li>
                                            );
                                        })}
                                    </ul></nav>
                                    <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 font-black uppercase text-muted-foreground"><span>Avance Clase</span><span className="text-primary">{progressValue}%</span></div><Progress value={progressValue} className="h-2 rounded-full" /></div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function ComparativosSuperlativosPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}>
            <ComparativosSuperlativosContentInternal />
        </Suspense>
    );
}