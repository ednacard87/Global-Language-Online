'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense, Fragment } from 'react';
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

// --- Engineering Configuration ---
const progressStorageVersion = 'progress_es_a1_verbos_preferencia_v5_vocab_buttons';
const mainProgressKey = 'progress_a1_es_verbos_preferencia';

// --- Data ---
const preferenceVocab = [
    { en: "To like", es: "GUSTAR" },
    { en: "To love (things)", es: "ENCANTAR" },
    { en: "To be interested in", es: "INTERESAR" },
    { en: "To bother", es: "MOLESTAR" },
    { en: "To hurt", es: "DOLER (o:ue)" },
    { en: "To matter", es: "IMPORTAR" },
    { en: "To seem", es: "PARECER" },
    { en: "To bore", es: "ABURRIR" },
    { en: "Soccer", es: "El fútbol" },
    { en: "Music", es: "La música" },
    { en: "Movies", es: "Las películas" },
    { en: "Books", es: "Los libros" },
    { en: "To travel", es: "Viajar" },
    { en: "To cook", es: "Cocinar" },
    { en: "The head", es: "La cabeza" },
    { en: "The noise", es: "El ruido" },
];

const ex1Prompts = [
    { en: "I like pizza.", es: ["me gusta la pizza"] },
    { en: "They like sports.", es: ["a ellos les gustan los deportes", "les gustan los deportes"] },
    { en: "You like to read.", es: ["a ti te gusta leer", "te gusta leer"] },
    { en: "We like science fiction movies.", es: ["a nosotros nos gustan las películas de ciencia ficción", "nos gustan las películas de ciencia ficción"] },
    { en: "She likes coffee in the morning.", es: ["a ella le gusta el café por la mañana", "le gusta el café por la mañana"] },
    { en: "You all like sunny days.", es: ["a ustedes les gustan los días soleados", "les gustan los días soleados"] },
    { en: "I don't like spiders.", es: ["no me gustan las arañas"] },
    { en: "My brother likes to listen to rock music.", es: ["a mi hermano le gusta escuchar música rock"] },
    { en: "My parents like documentaries.", es: ["a mis padres les gustan los documentales"] },
    { en: "Do you like chocolate ice cream?", es: ["te gusta el helado de chocolate?", "a ti te gusta el helado de chocolate?"] },
    { en: "We like strawberries.", es: ["nos gustan las fresas"] },
    { en: "Maria likes to walk on the beach.", es: ["a maría le gusta caminar por la playa"] },
    { en: "I like your shoes a lot.", es: ["me gustan mucho tus zapatos"] },
    { en: "The children like to play outside.", es: ["a los niños les gusta jugar afuera"] },
    { en: "You like mathematics.", es: ["a ti te gustan las matemáticas", "te gustan las matemáticas"] },
    { en: "My boss likes order.", es: ["a mi jefe le gusta el orden"] },
    { en: "They (fem.) like black cats.", es: ["a ellas les gustan los gatos negros"] },
    { en: "I like the idea.", es: ["me gusta la idea"] },
    { en: "We like live concerts.", es: ["nos gustan los conciertos en vivo"] },
    { en: "He likes spicy food.", es: ["a él le gusta la comida picante", "le gusta la comida picante"] },
];
const ex1Vocab = [
    {en: "Pizza", es: "la pizza"}, {en: "Sports", es: "los deportes"}, {en: "To read", es: "leer"}, {en: "Movies", es: "las películas"}, {en: "Coffee", es: "el café"}, {en: "Spiders", es: "las arañas"}, {en: "To listen", es: "escuchar"}, {en: "Documentaries", es: "los documentales"}, {en: "Ice cream", es: "el helado"}, {en: "Shoes", es: "los zapatos"}, {en: "To play", es: "jugar"}, {en: "Idea", es: "la idea"}
];

const ex2Prompts = [
    { q: "A Juan ______ gusta el café.", a: "le" },
    { q: "A mis amigos y a mí ______ encanta viajar.", a: "nos" },
    { q: "¿A ti ______ molesta el ruido?", a: "te" },
    { q: "A mí ______ duelen los pies.", a: "me" },
    { q: "A ustedes ______ parece una buena idea.", a: "les" },
    { q: "A nosotros no ______ importa la hora.", a: "nos" },
    { q: "A ella ______ aburren las matemáticas.", a: "le" },
    { q: "A ellos ______ encantan los perros.", a: "les" },
    { q: "¿A usted ______ interesa la historia?", a: "le" },
    { q: "A mí ______ gusta mucho este libro.", a: "me" },
    { q: "A ti y a tu hermano ______ queda bien esa ropa.", a: "les" },
    { q: "A nosotros ______ duelen las manos.", a: "nos" },
    { q: "A los turistas ______ interesa la cultura local.", a: "les" },
    { q: "(A mí) ______ parece increíble.", a: "me" },
    { q: "¿(A ti) ______ apetece un helado?", a: "te" },
    { q: "A mi madre ______ preocupa la situación.", a: "le" },
    { q: "A mis abuelos ______ gusta recibir visitas.", a: "les" },
    { q: "(A nosotros) ______ encanta la playa.", a: "nos" },
    { q: "A ti ______ duele la cabeza, ¿verdad?", a: "te" },
    { q: "(A mí) no ______ gustan las despedidas.", a: "me" },
];

const ex3Prompts = [
    { en: "I love horror movies.", es: ["me encantan las películas de terror"] },
    { en: "She is not interested in politics.", es: ["a ella no le interesa la política", "no le interesa la política"] },
    { en: "Our feet hurt after walking.", es: ["a nosotros nos duelen los pies después de caminar", "nos duelen los pies después de caminar"] },
    { en: "Loud noise bothers you.", es: ["a ti te molesta el ruido fuerte", "te molesta el ruido fuerte"] },
    { en: "Video games bore them.", es: ["a ellos les aburren los videojuegos", "les aburren los videojuegos"] },
    { en: "Soccer is important to my father.", es: ["a mi padre le importa el fútbol"] },
    { en: "These pants fit me well.", es: ["a mí me quedan bien estos pantalones", "me quedan bien estos pantalones"] },
    { en: "You all are interested in exotic food.", es: ["a ustedes les interesa la comida exótica"] },
    { en: "We love cold mornings.", es: ["a nosotros nos encantan las mañanas frías"] },
    { en: "Thunder bothers my dog.", es: ["a mi perro le molestan los truenos"] },
    { en: "My back hurts.", es: ["me duele la espalda"] },
    { en: "Mystery novels interest us.", es: ["nos interesan las novelas de misterio"] },
    { en: "It seems strange to you that he doesn't call.", es: ["te parece raro que no llame", "a ti te parece raro que no llame"] },
    { en: "Lies bother them.", es: ["a ellos les molestan las mentiras", "les molestan las mentiras"] },
    { en: "I only have five euros left.", es: ["me quedan solo cinco euros"] },
    { en: "His family is very important to him.", es: ["a él le importa mucho su familia"] },
    { en: "Math bores us.", es: ["nos aburren las matemáticas"] },
    { en: "I love rainy days.", es: ["me encantan los días de lluvia"] },
    { en: "Your teeth hurt.", es: ["te duelen las muelas", "a ti te duelen las muelas"] },
    { en: "Your ideas seem great to them.", es: ["a ellos les parecen geniales tus ideas"] },
];
const ex3Vocab = [
    {en: "To love (things)", es: "encantar"}, {en: "To interest", es: "interesar"}, {en: "To hurt", es: "doler"}, {en: "To bother", es: "molestar"}, {en: "To bore", es: "aburrir"}, {en: "To matter", es: "importar"}, {en: "To fit (clothing)", es: "quedar"}, {en: "To seem", es: "parecer"}, {en: "Feet", es: "los pies"}, {en: "Noise", es: "el ruido"}, {en: "Back (body)", es: "la espalda"}, {en: "Lies", es: "las mentiras"}
];

const readingData = {
    title: "Cosas que nos gustan",
    content: "En mi familia, a todos nos gustan cosas diferentes. A mí me encanta leer libros de aventuras. A mi hermana le interesan mucho los animales; ella tiene dos perros y un gato. A mis padres les gusta escuchar música clásica. Los fines de semana, a nosotros nos gusta ver películas juntos, pero a mi hermana le aburren las películas de acción. A ella le gustan más las comedias. A mi abuelo le duele un poco la espalda, así que no le gusta caminar mucho, pero le encanta jugar ajedrez. A todos nos encanta la pizza que hace mi mamá los viernes. ¡Es la mejor!",
    questions: [
        { q: "¿Qué tipo de libros me encantan?", a: ["libros de aventuras"] },
        { q: "¿Qué le interesa a mi hermana?", a: ["los animales"] },
        { q: "¿Qué tipo de películas le aburren a la hermana?", a: ["las de acción", "las películas de acción"] },
        { q: "¿Qué le duele al abuelo?", a: ["la espalda"] },
        { q: "¿Qué le encanta a toda la familia los viernes?", a: ["la pizza", "la pizza que hace mi mamá"] }
    ]
};

const finalExPrompts = [
    { en: "I like the blue car.", es: ["me gusta el coche azul"] },
    { en: "They love to dance.", es: ["a ellos les encanta bailar", "les encanta bailar"] },
    { en: "My head hurts.", es: ["me duele la cabeza"] },
    { en: "History interests us.", es: ["a nosotros nos interesa la historia", "nos interesa la historia"] },
    { en: "The noise bothers her.", es: ["a ella le molesta el ruido", "le molesta el ruido"] },
    { en: "Do you like fruits?", es: ["a ti te gustan las frutas?", "te gustan las frutas?"] },
    { en: "We love dogs.", es: ["a nosotros nos encantan los perros", "nos encantan los perros"] },
    { en: "His feet hurt.", es: ["a él le duelen los pies", "le duelen los pies"] },
    { en: "The idea seems good to me.", es: ["a mí me parece buena la idea", "me parece buena la idea"] },
    { en: "The news doesn't matter to them.", es: ["a ellos no les importa la noticia", "no les importa la noticia"] },
    { en: "I like to travel.", es: ["me gusta viajar"] },
    { en: "You love chocolate.", es: ["a ti te encanta el chocolate", "te encanta el chocolate"] },
    { en: "His stomach hurts.", es: ["a él le duele el estómago", "le duele el estómago"] },
    { en: "Are you bothered by the smoke?", es: ["a ti te molesta el humo?", "te molesta el humo?"] },
    { en: "We are interested in art.", es: ["a nosotros nos interesa el arte", "nos interesa el arte"] },
    { en: "They like horror movies.", es: ["a ellos les gustan las películas de terror", "les gustan las películas de terror"] },
    { en: "My eyes hurt.", es: ["me duelen los ojos"] },
    { en: "She loves sunny days.", es: ["a ella le encantan los días soleados", "le encantan los días soleados"] },
    { en: "It seems strange to us.", es: ["a nosotros nos parece raro", "nos parece raro"] },
    { en: "I have two euros left.", es: ["me quedan dos euros"] },
];
const finalExVocab = [
    {en: "Car", es: "el coche"}, {en: "To dance", es: "bailar"}, {en: "Head", es: "la cabeza"}, {en: "History", es: "la historia"}, {en: "To travel", es: "viajar"}, {en: "Stomach", es: "el estómago"}, {en: "Smoke", es: "el humo"}, {en: "Art", es: "el arte"}, {en: "Eyes", es: "los ojos"}, {en: "Strange", es: "raro"}, {en: "To have left", es: "quedar"}
];

const translationTextData = {
    title: "Traduce este texto",
    paragraph: "I love Spanish classes because many things interest me. I like the grammar, but the new verbs bother me a little because they are difficult. My classmates and I love to practice conversation. My head hurts when I don't understand, but it doesn't matter. The important thing is to learn. It seems to me that Spanish is a very beautiful language.",
    vocabulary: [
        {en: "Classes", es: "las clases"}, {en: "To interest", es: "interesar"}, {en: "Grammar", es: "la gramática"}, {en: "To bother", es: "molestar"}, {en: "Difficult", es: "difícil"}, {en: "Classmates", es: "los compañeros"}, {en: "To practice", es: "practicar"}, {en: "Conversation", es: "la conversación"}, {en: "To hurt", es: "doler"}, {en: "To understand", es: "entender"}, {en: "To matter", es: "importar"}, {en: "To seem", es: "parecer"}
    ]
};


// --- Reusable Sentence Fill-in-the-blank component ---
const FillInTheBlankExercise = ({ title, prompts, onComplete, instruction }: { title: string, prompts: { q: string, a: string }[], onComplete: () => void, instruction: string }) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [statuses, setStatuses] = useState<('correct' | 'incorrect' | 'unchecked')[]>(() => Array(prompts.length).fill('unchecked'));

    useEffect(() => {
        if (statuses[currentIndex] !== 'correct') {
             setCurrentAnswer('');
        }
    }, [currentIndex, statuses]);

    const handleCheck = () => {
        const prompt = prompts[currentIndex];
        if (!prompt) return;

        const isCorrect = currentAnswer.trim().toLowerCase() === prompt.a.toLowerCase();

        const newStatuses = [...statuses];
        newStatuses[currentIndex] = isCorrect ? 'correct' : 'incorrect';
        setStatuses(newStatuses);

        if (isCorrect) {
            toast({ title: "¡Correcto!" });
            if (currentIndex < prompts.length - 1) {
                 setTimeout(() => setCurrentIndex(i => i + 1), 800);
            }
        } else {
            toast({ variant: 'destructive', title: "Incorrecto, intenta de nuevo." });
        }
    };

    const goToNext = () => {
        if (currentIndex < prompts.length - 1) {
            setCurrentIndex(i => i + 1);
        } else {
            checkCompletion();
        }
    };

    const checkCompletion = () => {
         if (statuses.every(s => s === 'correct')) {
             toast({ title: "¡Felicidades!", description: "Has completado el ejercicio.", className: "bg-green-500 text-white" });
             onComplete();
         } else {
             toast({ variant: 'destructive', title: "Aún hay errores", description: "Completa todas las frases correctamente para finalizar." });
             const firstIncorrect = statuses.findIndex(s => s !== 'correct');
             if (firstIncorrect !== -1) {
                 setCurrentIndex(firstIncorrect);
             }
         }
    };

    const isCurrentCorrect = statuses[currentIndex] === 'correct';
    const allDone = useMemo(() => statuses.every(s => s === 'correct'), [statuses]);

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <CardTitle className="text-primary uppercase tracking-tighter">{title}</CardTitle>
                <CardDescription className="font-bold text-foreground mt-1">Frase {currentIndex + 1} de {prompts.length}</CardDescription>
                <div className="flex gap-1.5 justify-center flex-wrap pt-4">
                    {prompts.map((_, i) => (
                        <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-3 flex-1 rounded-full cursor-pointer transition-all", "min-w-[20px]", currentIndex === i && "ring-2 ring-primary ring-offset-2 ring-offset-background", statuses[i] === 'correct' ? "bg-green-500" : statuses[i] === 'incorrect' ? "bg-red-500" : "bg-muted")} />
                    ))}
                </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6 pt-6 text-center">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">{instruction}</p>
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-2xl tracking-tighter text-foreground min-h-[8rem] flex items-center justify-center w-full">
                    {prompts[currentIndex]?.q}
                </div>
                <Input
                    value={currentAnswer}
                    onChange={e => setCurrentAnswer(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { isCurrentCorrect ? goToNext() : handleCheck(); } }}
                    className={cn("h-12 text-lg text-foreground text-center max-w-md border-2", isCurrentCorrect ? 'border-green-500' : statuses[currentIndex] === 'incorrect' ? 'border-red-500' : 'border-input')}
                    placeholder="Escribe aquí..."
                    autoComplete="off"
                    disabled={isCurrentCorrect}
                />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6 bg-muted/10">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    {!isCurrentCorrect && <Button onClick={handleCheck} variant="secondary">Verificar</Button>}
                    {allDone ? <Button onClick={onComplete} className="font-bold text-white bg-green-600 hover:bg-green-700 animate-pulse">Completar Ejercicio <Trophy className='ml-2 h-4 w-4'/></Button> : <Button onClick={goToNext} disabled={!isCurrentCorrect}>Siguiente <ArrowRight className='ml-2 h-4 w-4'/></Button>}
                </div>
            </CardFooter>
        </Card>
    );
};


// --- Reusable Translation Exercise Component (with Vocab button) ---
const SingleStepExercise = ({ title, prompts, onComplete, vocabulary }: { title: string, prompts: { en: string, es: string[] }[], onComplete: () => void, vocabulary?: {en: string, es: string}[] }) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [statuses, setStatuses] = useState<('correct' | 'incorrect' | 'unchecked')[]>(() => Array(prompts.length).fill('unchecked'));
    const [showVocab, setShowVocab] = useState(false);

    useEffect(() => {
        if (statuses[currentIndex] !== 'correct') {
             setCurrentAnswer('');
        }
    }, [currentIndex, statuses]);

    const handleCheck = () => {
        const prompt = prompts[currentIndex];
        if (!prompt) return;

        const userAnswer = currentAnswer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const isCorrect = prompt.es.some(correctAnswer =>
            correctAnswer.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userAnswer
        );

        const newStatuses = [...statuses];
        newStatuses[currentIndex] = isCorrect ? 'correct' : 'incorrect';
        setStatuses(newStatuses);

        if (isCorrect) {
            toast({ title: "¡Correcto!" });
            if (currentIndex < prompts.length - 1) {
                 setTimeout(() => setCurrentIndex(i => i + 1), 800);
            }
        } else {
            toast({ variant: 'destructive', title: "Incorrecto, intenta de nuevo." });
        }
    };

    const goToNext = () => {
        if (currentIndex < prompts.length - 1) {
            setCurrentIndex(i => i + 1);
        } else {
            checkCompletion();
        }
    };
    
    const checkCompletion = () => {
         if (statuses.every(s => s === 'correct')) {
             toast({ title: "¡Felicidades!", description: "Has completado el ejercicio.", className: "bg-green-500 text-white" });
             onComplete();
         } else {
             toast({ variant: 'destructive', title: "Aún hay errores", description: "Completa todas las frases correctamente para finalizar." });
             const firstIncorrect = statuses.findIndex(s => s !== 'correct');
             if (firstIncorrect !== -1) {
                 setCurrentIndex(firstIncorrect);
             }
         }
    };

    const isCurrentCorrect = statuses[currentIndex] === 'correct';
    const allDone = useMemo(() => statuses.every(s => s === 'correct'), [statuses]);

    return (
         <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <CardTitle className="text-primary uppercase tracking-tighter">{title}</CardTitle>
                        <CardDescription className="font-bold text-foreground mt-1">Frase {currentIndex + 1} de {prompts.length}</CardDescription>
                    </div>
                    {vocabulary && (
                        <Button variant="outline" size="sm" onClick={() => setShowVocab(!showVocab)}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            {showVocab ? 'Ocultar' : 'Mostrar'} Vocab.
                        </Button>
                    )}
                </div>
                {showVocab && vocabulary && (
                    <ScrollArea className="h-32 w-full mt-4"><div className="p-4 bg-muted rounded-lg border text-sm">
                        <h4 className="font-bold mb-2 text-primary">Vocabulario del Ejercicio</h4>
                        <ul className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">{
                            vocabulary.map(v => <li key={v.en}><strong>{v.en}:</strong> {v.es}</li>)
                        }</ul>
                    </div></ScrollArea>
                )}
                <div className="flex gap-1.5 justify-center flex-wrap pt-4">
                    {prompts.map((_, i) => (
                        <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-3 flex-1 rounded-full cursor-pointer transition-all", "min-w-[20px]", currentIndex === i && "ring-2 ring-primary ring-offset-2 ring-offset-background", statuses[i] === 'correct' ? "bg-green-500" : statuses[i] === 'incorrect' ? "bg-red-500" : "bg-muted")} />
                    ))}
                </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6 pt-6 text-center">
                 <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Traduce al español</p>
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-2xl uppercase tracking-tighter text-foreground min-h-[8rem] flex items-center justify-center w-full">
                    {prompts[currentIndex]?.en}
                </div>
                <Input
                    value={currentAnswer}
                    onChange={e => setCurrentAnswer(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { isCurrentCorrect ? goToNext() : handleCheck(); } }}
                    className={cn("h-12 text-lg text-foreground text-center max-w-md border-2", isCurrentCorrect ? 'border-green-500' : statuses[currentIndex] === 'incorrect' ? 'border-red-500' : 'border-input')}
                    placeholder="Escribe en español..."
                    autoComplete="off"
                    disabled={isCurrentCorrect}
                />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6 bg-muted/10">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    {!isCurrentCorrect && <Button onClick={handleCheck} variant="secondary">Verificar</Button>}
                    {allDone ? <Button onClick={onComplete} className="font-bold text-white bg-green-600 hover:bg-green-700 animate-pulse">Completar Ejercicio <Trophy className='ml-2 h-4 w-4'/></Button> : <Button onClick={goToNext} disabled={!isCurrentCorrect}>Siguiente <ArrowRight className='ml-2 h-4 w-4'/></Button>}
                </div>
            </CardFooter>
        </Card>
    );
};


// --- Main Page Component ---
interface Topic {
    key: string;
    name: string;
    icon: React.ElementType;
    status: 'locked' | 'active' | 'completed';
}

function VerbosPreferenciaContent() {
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
    
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(preferenceVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(preferenceVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);
    const [readingAns, setReadingAns] = useState<string[]>(Array(readingData.questions.length).fill(''));
    const [readingVal, setReadingVal] = useState<any[]>(Array(readingData.questions.length).fill('unchecked'));
    const [translationText, setTranslationText] = useState('');
    const [showTranslateVocab, setShowTranslateVocab] = useState(false);

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    
    const { data: authUserProfile } = useDoc<{ role?: string }>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string, lessonProgress?: any, progress?: any, name?: string }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar1', name: '2. Gramática: Estructura', icon: GraduationCap, status: 'locked' },
        { key: 'grammar2', name: '3. Gramática: Singular/Plural', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: '4. Ejercicio 1: Traducción', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: '5. Ejercicio 2: Pronombres', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'reading', name: '7. Lectura', icon: BookText, status: 'locked' },
        { key: 'ex3', name: '8. Ejercicio 3: Traducción', icon: PenSquare, status: 'locked' },
        { key: 'final_ex', name: '9. Ejercicio Final', icon: Trophy, status: 'locked' },
        { key: 'translate_text', name: '10. Traducir Texto', icon: MessageSquare, status: 'locked' },
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
        return Math.round((completedCount / (learningPath.length || 1)) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || targetStudentId) return;
        const s: Record<string, any> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => { s[item.key] = item.status; });
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, isInitialLoading, targetStudentId]);

    const handleTopicComplete = (completedKey: string) => setTopicToComplete(completedKey);

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
        if ((topicKey === 'grammar1' || topicKey === 'grammar2') && topic?.status !== 'completed') {
            handleTopicComplete(topicKey); 
        }
    };

    const handleVocabCheck = () => {
        let okCount = 0;
        const nv = preferenceVocab.map((item, idx) => {
            const isCorrect = item.es.toLowerCase().split(' ')[0] === (vocabAnswers[idx] || '').trim().toLowerCase().split(' ')[0];
            if (isCorrect) okCount++;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv as any);
        if (okCount >= 8) { setCanAdvanceVocab(true); toast({ title: "¡Buen avance!" }); }
        else toast({ variant: 'destructive', title: `Necesitas ${8 - okCount} más aciertos para avanzar.` });
    };

    const handleCheckReading = () => {
        let allOk = true;
        const nv = readingData.questions.map((q, i) => {
            const isOk = q.a.some(ans => (readingAns[i] || '').trim().toLowerCase().includes(ans.toLowerCase()));
            if (!isOk) allOk = false;
            return isOk ? 'correct' : 'incorrect';
        });
        setReadingVal(nv as any);
        if (allOk) { toast({ title: "¡Lectura superada!" }); handleTopicComplete('reading'); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas." });
    };


    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

        switch (selectedTopic) {
            case 'vocabulary': return <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm"><CardHeader><CardTitle>Vocabulario: Verbos de Preferencia</CardTitle><CardDescription>Escribe el verbo o sustantivo en español.</CardDescription></CardHeader><CardContent><div className="grid grid-cols-2 gap-4">{preferenceVocab.map((v, i) => (<Fragment key={i}><Label className='font-semibold'>{v.en}</Label><Input value={vocabAnswers[i]} onChange={e => { const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const newValidation = [...vocabValidation]; newValidation[i] = 'unchecked'; setVocabValidation(newValidation); setCanAdvanceVocab(false); }} className={cn("h-10 uppercase", vocabValidation[i] === 'correct' ? 'border-green-500' : vocabValidation[i] === 'incorrect' ? 'border-red-500' : '')} /></Fragment>))}</div></CardContent><CardFooter className="flex justify-between border-t pt-6"><Button onClick={handleVocabCheck} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar <ArrowRight className='ml-2 h-4 w-4' /></Button></CardFooter></Card>;
            case 'grammar1': return <Card className="shadow-soft border-2 border-brand-purple"><CardHeader><CardTitle>Gramática: La Estructura Especial</CardTitle></CardHeader><CardContent className="space-y-6"><div><h3 className='font-bold text-lg text-primary'>Estructura Inversa</h3><p>Con verbos como GUSTAR, la persona que siente la emoción (I, you, he) se convierte en un objeto indirecto en español (me, te, le). La cosa que provoca la emoción es el sujeto de la oración.</p><p className='mt-2 p-3 bg-muted rounded-lg font-mono'>I like music → <span className='text-blue-500'>Me</span> <span className='text-red-500'>gusta</span> <span className='text-green-500'>la música</span>.</p></div><div><h3 className='font-bold text-lg text-primary'>Pronombres de Objeto Indirecto</h3><p>Estos son los pronombres que SIEMPRE se usan con estos verbos:</p><ul className="list-none space-y-2 mt-2">{[ {p: "(A mí)", i: "me"}, {p: "(A ti)", i: "te"}, {p: "(A él/ella/usted)", i: "le"}, {p: "(A nosotros/as)", i: "nos"}, {p: "(A ellos/as/ustedes)", i: "les"}].map(item => <li key={item.i} className='flex items-center'><span className='w-1/3 text-muted-foreground'>{item.p}</span><span className='font-bold text-lg'>{item.i}</span></li>)}</ul><p className='text-sm text-muted-foreground mt-2'>La parte entre paréntesis (A mí, A ti...) es opcional y se usa para dar énfasis o aclarar.</p></div></CardContent><CardFooter className='justify-end'><Button onClick={() => handleTopicComplete('grammar1')}>Comprendido <CheckCircle className='ml-2 h-4 w-4' /></Button></CardFooter></Card>;
            case 'grammar2': return <Card className="shadow-soft border-2 border-brand-purple"><CardHeader><CardTitle>Gramática: Singular vs. Plural</CardTitle></CardHeader><CardContent className="space-y-6"><div><h3 className='font-bold text-lg text-primary'>Usando el Singular (gusta, encanta, duele)</h3><p>Usa la forma singular del verbo cuando la cosa que te gusta es:</p><ul className='list-disc pl-5 mt-2 space-y-1'><li>Un sustantivo singular: <span className='font-mono'>Me gusta <strong>el libro</strong>.</span></li><li>Un verbo en infinitivo: <span className='font-mono'>Nos encanta <strong>viajar</strong>.</span></li></ul></div><div><h3 className='font-bold text-lg text-primary'>Usando el Plural (gustan, encantan, duelen)</h3><p>Usa la forma plural del verbo cuando la cosa que te gusta es un sustantivo plural:</p><ul className='list-disc pl-5 mt-2 space-y-1'><li><span className='font-mono'>Te gustan <strong>los perros</strong>.</span></li><li><span className='font-mono'>Les duelen <strong>las muelas</strong>.</span></li></ul></div><div className='p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-800 dark:text-yellow-300'><p><strong>¡Recuerda!</strong> El verbo concuerda con la cosa (el sujeto), no con la persona (el objeto indirecto).</p></div></CardContent><CardFooter className='justify-end'><Button onClick={() => handleTopicComplete('grammar2')}>¡Listo! <CheckCircle className='ml-2 h-4 w-4' /></Button></CardFooter></Card>;
            case 'ex1': return <SingleStepExercise title="Ejercicio 1: Traducción (gusta/gustan)" prompts={ex1Prompts} onComplete={() => handleTopicComplete('ex1')} vocabulary={ex1Vocab} />;
            case 'ex2': return <FillInTheBlankExercise title="Ejercicio 2: Los Pronombres" prompts={ex2Prompts} onComplete={() => handleTopicComplete('ex2')} instruction="Completa la frase con el pronombre correcto (me, te, le, nos, les)." />;
            case 'vocab_game': return <Card className="shadow-soft border-2 border-brand-purple bg-card/95"><CardHeader><CardTitle>Juego de Vocabulario</CardTitle></CardHeader><CardContent><VocabularyMatchingGame data={preferenceVocab.slice(0, 8).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Encuentra las parejas" /></CardContent></Card>;
            case 'reading': return <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden"><CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tight'>{readingData.title}</CardTitle></CardHeader><CardContent className="space-y-6 pt-6"><div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-inner">{readingData.content}</div><Separator /><div className="space-y-4"><h3 className='font-black text-primary uppercase text-sm'>Preguntas de Comprensión:</h3>{readingData.questions.map((q, i) => (<div key={i} className="space-y-2 p-3 bg-muted/20 rounded-xl border"><Label className="font-bold">{q.q}</Label><Input value={readingAns[i]} onChange={e => { const na = [...readingAns]; na[i] = e.target.value; setReadingAns(na); setReadingVal(v => { const nv = [...v]; nv[i] = 'unchecked'; return nv as any; }); }} className={cn("h-10", readingVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : readingVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" /></div>))}</div></CardContent><CardFooter className="justify-center border-t p-6 bg-muted/10"><Button onClick={handleCheckReading} size="lg" className="px-16 font-black h-12 shadow-md">Verificar Lectura</Button></CardFooter></Card>;
            case 'ex3': return <SingleStepExercise title="Ejercicio 3: Traducción (Otros Verbos)" prompts={ex3Prompts} onComplete={() => handleTopicComplete('ex3')} vocabulary={ex3Vocab} />;
            case 'final_ex': return <SingleStepExercise title="Ejercicio Final: Traducción General" prompts={finalExPrompts} onComplete={() => handleTopicComplete('final_ex')} vocabulary={finalExVocab} />;
            case 'translate_text': return <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left"><CardHeader><div className="flex justify-between items-start"><div className="flex-1"><CardTitle className='text-primary uppercase'>{translationTextData.title}</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el siguiente párrafo al español.</CardDescription></div><Button variant="outline" size="sm" onClick={() => setShowTranslateVocab(!showTranslateVocab)}><BookOpen className="mr-2 h-4 w-4" />{showTranslateVocab ? 'Ocultar' : 'Mostrar'} Vocab.</Button></div>{showTranslateVocab && <ScrollArea className="h-32 w-full mt-4"><div className="p-4 bg-muted rounded-lg border text-sm"><h4 className="font-bold mb-2 text-primary">Vocabulario del Ejercicio</h4><ul className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">{translationTextData.vocabulary.map(v => <li key={v.en}><strong>{v.en}:</strong> {v.es}</li>)}</ul></div></ScrollArea>}</CardHeader><CardContent className="space-y-6 pt-6"><div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-sm">{translationTextData.paragraph}</div><Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={translationText} onChange={(e) => setTranslationText(e.target.value)} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg leading-relaxed" /></div></CardContent><CardFooter className="justify-center border-t pt-6 bg-muted/20"><Button onClick={() => handleTopicComplete('translate_text')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Misión Final <ArrowRight className='ml-3 h-8 w-8' /></Button></CardFooter></Card>;
            default: return <div className="text-center p-8">Selecciona una misión para comenzar.</div>;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {targetStudentId && isAdmin && (
                        <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md"><div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400"><Star className="h-6 w-6 fill-current animate-pulse" /><p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión: {studentProfile?.name || '...'}</p></div><Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10"><Link href="/admin">Cerrar</Link></Button></div>
                    )}
                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/a1" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver al Curso A1</Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3"><Activity className='h-10 w-10 text-primary' /> Verbos de Preferencia 🇪🇸</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm"><CardHeader className="pb-4 border-b bg-muted/30"><CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Ruta de Misión</CardTitle></CardHeader><CardContent className="p-4"><nav><ul className="space-y-1">{learningPath.map((item) => { const isLocked = item.status === 'locked' && !isAdmin; const isSelected = selectedTopic === item.key; const Icon = item.icon; return (<li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', isSelected && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm')}><div className="flex items-center gap-3">{item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}<span className="truncate max-w-[150px]">{item.name}</span></div>{isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}</li>);})}</ul></nav><div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 font-black uppercase tracking-widest text-muted-foreground"><span>Progreso Total</span><span className="text-primary">{progressValue}%</span></div><Progress value={progressValue} className="h-2 rounded-full" /></div></CardContent></Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function VerbosPreferenciaPage() {
    return (<Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}><VerbosPreferenciaContent /></Suspense>);
}