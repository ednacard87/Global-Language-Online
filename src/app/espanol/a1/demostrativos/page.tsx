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
const progressStorageVersion = 'progress_es_a1_demostrativos_v3_40vocab';
const mainProgressKey = 'progress_a1_es_demostrativos';

// --- Data ---
const demonstrativesVocab = [
    { en: "Book", es: "El libro" },
    { en: "House", es: "La casa" },
    { en: "Cars", es: "Los coches" },
    { en: "Chairs", es: "Las sillas" },
    { en: "Pen", es: "El bolígrafo" },
    { en: "Tables", es: "Las mesas" },
    { en: "Boy", es: "El chico" },
    { en: "Girls", es: "Las chicas" },
    { en: "Mountain", es: "La montaña" },
    { en: "Trees", es: "Los árboles" },
    { en: "Apple", es: "La manzana" },
    { en: "Dogs", es: "Los perros" },
    { en: "Shoe", es: "El zapato" },
    { en: "Keys", es: "Las llaves" },
    { en: "Flower", es: "La flor" },
    { en: "Cities", es: "Las ciudades" },
    { en: "Computer", es: "La computadora" },
    { en: "Phones", es: "Los teléfonos" },
    { en: "Backpack", es: "La mochila" },
    { en: "Windows", es: "Las ventanas" },
    { en: "Man", es: "El hombre" },
    { en: "Woman", es: "La mujer" },
    { en: "Children", es: "Los niños" },
    { en: "Friends (f)", es: "Las amigas" },
    { en: "Cat", es: "El gato" },
    { en: "Bicycle", es: "La bicicleta" },
    { en: "Watches", es: "Los relojes" },
    { en: "Shirts", es: "Las camisas" },
    { en: "Glass", es: "El vaso" },
    { en: "Door", es: "La puerta" },
    { en: "Paintings", es: "Los cuadros" },
    { en: "Lamps", es: "Las lámparas" },
    { en: "Food", es: "La comida" },
    { en: "Restaurant", es: "El restaurante" },
    { en: "Parks", es: "Los parques" },
    { en: "Beaches", es: "Las playas" },
    { en: "Day", es: "El día" },
    { en: "Night", es: "La noche" },
    { en: "Months", es: "Los meses" },
    { en: "Years", es: "Los años" },
];

const ex1Prompts = [
    { q: "Me gusta ______ libro. (aquí)", a: "este" },
    { q: "Prefiero ______ silla. (ahí)", a: "esa" },
    { q: "Mira ______ pájaros. (allá)", a: "aquellos" },
    { q: "______ casa es nueva. (aquí)", a: "esta" },
    { q: "¿De quién son ______ llaves? (ahí)", a: "esas" },
    { q: "______ montañas son altas. (allá)", a: "aquellas" },
    { q: "Toma ______ bolígrafo. (aquí)", a: "este" },
    { q: "______ problema es difícil. (ahí)", a: "ese" },
    { q: "Recuerdo ______ día con claridad. (allá)", a: "aquel" },
    { q: "______ galletas están deliciosas. (aquí)", a: "estas" },
    { q: "No conozco a ______ chicos. (ahí)", a: "esos" },
    { q: "______ nubes parecen de algodón. (allá)", a: "aquellas" },
    { q: "Voy a comprar ______ coche. (aquí)", a: "este" },
    { q: "¿Qué es ______ ruido? (ahí)", a: "ese" },
    { q: "______ tiempos eran más simples. (allá)", a: "aquellos" },
    { q: "______ tarde vamos al cine. (aquí)", a: "esta" },
    { q: "Pásame ______ plato, por favor. (ahí)", a: "ese" },
    { q: "______ señores son muy amables. (allá)", a: "aquellos" },
    { q: "Necesito ______ papeles para la reunión. (aquí)", a: "estos" },
    { q: "Me encantan ______ zapatos. (ahí)", a: "esos" },
];

const ex2Prompts = [
    { en: "This book is interesting.", es: ["este libro es interesante"] },
    { en: "These houses are new.", es: ["estas casas son nuevas"] },
    { en: "That boy is my friend.", es: ["ese chico es mi amigo"] },
    { en: "Those girls are students.", es: ["esas chicas son estudiantes"] },
    { en: "This apple is for you.", es: ["esta manzana es para ti"] },
    { en: "These cars are fast.", es: ["estos coches son rápidos"] },
    { en: "That table is reserved.", es: ["esa mesa está reservada"] },
    { en: "Those pens are mine.", es: ["esos bolígrafos son míos"] },
    { en: "This dog is very playful.", es: ["este perro es muy juguetón"] },
    { en: "These flowers smell good.", es: ["estas flores huelen bien"] },
    { en: "That school is big.", es: ["esa escuela es grande", "ese colegio es grande"] },
    { en: "Those windows are dirty.", es: ["esas ventanas están sucias"] },
    { en: "This key opens the door.", es: ["esta llave abre la puerta"] },
    { en: "These shoes are comfortable.", es: ["estos zapatos son cómodos"] },
    { en: "That computer is old.", es: ["esa computadora es vieja", "ese ordenador es viejo"] },
    { en: "Those trees are very tall.", es: ["esos árboles son muy altos"] },
    { en: "This shirt is clean.", es: ["esta camisa está limpia"] },
    { en: "These pants are blue.", es: ["estes pantalones son azules"] },
    { en: "That backpack is heavy.", es: ["esa mochila es pesada"] },
    { en: "Those clouds are white.", es: ["esas nubes son blancas"] },
];
const ex2Vocab = [
    {en: "Book", es: "el libro"}, {en: "Houses", es: "las casas"}, {en: "Boy", es: "el chico"}, {en: "Girls", es: "las chicas"}, {en: "Apple", es: "la manzana"}, {en: "Cars", es: "los coches"}, {en: "Table", es: "la mesa"}, {en: "Pens", es: "los bolígrafos"}, {en: "Windows", es: "las ventanas"}, {en: "Shoes", es: "los zapatos"}, {en: "Shirt", es: "la camisa"}, {en: "Clouds", es: "las nubes"}
];


const readingData = {
    title: "Un día en el mercado",
    content: "Hoy estoy en el mercado con mi madre. ¡Hay tantas cosas! Aquí, en este puesto, venden frutas. Estas manzanas rojas se ven deliciosas. Voy a comprar algunas. Ahí, en ese puesto, un señor vende quesos. Mi madre dice que ese queso manchego es el mejor. Más lejos, allá, en aquella tienda, venden artesanías. Aquellas cerámicas son muy bonitas y parecen antiguas. Mi madre me pregunta: '¿Prefieres este bolso de aquí o ese de ahí?'. Yo le respondo: 'Me gusta más aquel que está en la pared, allá lejos'. Es un día divertido.",
    questions: [
        { q: "¿Dónde están las manzanas rojas?", a: ["aquí", "en este puesto"] },
        { q: "¿Qué vende el señor en el puesto de ahí?", a: ["quesos"] },
        { q: "¿Cómo son las cerámicas de la tienda de allá?", a: ["bonitas y antiguas"] },
        { q: "¿Qué bolso me gusta más?", a: ["aquel que está en la pared"] },
        { q: "Al final, ¿qué dice el narrador sobre el día?", a: ["es un día divertido"] }
    ]
};

const finalExPrompts = [
    { en: "I like this song.", es: ["me gusta esta canción"] },
    { en: "What is that? (medium distance)", es: ["qué es eso?"] },
    { en: "Those mountains (far away) are beautiful.", es: ["aquellas montañas son hermosas"] },
    { en: "These books are mine.", es: ["estos libros son míos"] },
    { en: "I prefer that car (medium distance).", es: ["prefiero ese coche"] },
    { en: "Those children (far away) are playing.", es: ["aquellos niños están jugando"] },
    { en: "Give me this pen, please.", es: ["dame este bolígrafo por favor"] },
    { en: "That house (medium distance) has a pool.", es: ["esa casa tiene una piscina"] },
    { en: "That (far away) was a long time ago.", es: ["aquello fue hace mucho tiempo"] },
    { en: "Do you want these flowers?", es: ["quieres estas flores?"] },
    { en: "Those shoes (medium distance) are expensive.", es: ["esos zapatos son caros"] },
    { en: "That girl (far away) is my sister.", es: ["aquella chica es mi hermana"] },
    { en: "This is not what I expected.", es: ["esto no es lo que esperaba"] },
    { en: "These chairs are very comfortable.", es: ["estas sillas son muy cómodas"] },
    { en: "I don't know those people (medium distance).", es: ["no conozco a esa gente"] },
    { en: "Remember that day? (far away)", es: ["recuerdas aquel día?"] },
    { en: "This computer is new.", es: ["esta computadora es nueva", "este ordenador es nuevo"] },
    { en: "We live in that building (medium distance).", es: ["vivimos en ese edificio"] },
    { en: "Those trees (far away) are very old.", es: ["aquellos árboles son muy viejos"] },
    { en: "I'll take these apples.", es: ["me llevo estas manzanas"] },
];
const finalExVocab = [
    {en: "Song", es: "la canción"}, {en: "Mountains", es: "las montañas"}, {en: "Children", es: "los niños"}, {en: "House", es: "la casa"}, {en: "Pool", es: "la piscina"}, {en: "Shoes", es: "los zapatos"}, {en: "Chairs", es: "las sillas"}, {en: "Day", es: "el día"}, {en: "Building", es: "el edificio"}, {en: "Trees", es: "los árboles"}, {en: "To take (carry)", es: "llevar"}
];

const translationTextData = {
    title: "Traduce este texto",
    paragraph: "I am in a large park. This bench right here is perfect for reading. I see a dog over there; that dog is playing with a ball. These flowers next to me smell very good. In the distance, those mountains look majestic. I think I prefer this park to that one we visited last week. That one was smaller. Those days were fun, but this is more peaceful.",
    vocabulary: [
        {en: "Park", es: "el parque"}, {en: "Bench", es: "el banco"}, {en: "To read", es: "leer"}, {en: "Dog", es: "el perro"}, {en: "Ball", es: "la pelota"}, {en: "Flowers", es: "las flores"}, {en: "To smell", es: "oler"}, {en: "Mountains", es: "las montañas"}, {en: "To look (seem)", es: "parecer"}, {en: "To visit", es: "visitar"}, {en: "Peaceful", es: "tranquilo"}
    ]
};


// --- Reusable Components (Copied from previous lesson) ---
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
        if (currentIndex < prompts.length - 1) setCurrentIndex(i => i + 1);
        else checkCompletion();
    };
    
    const checkCompletion = () => {
         if (statuses.every(s => s === 'correct')) {
             toast({ title: "¡Felicidades!", description: "Has completado el ejercicio.", className: "bg-green-500 text-white" });
             onComplete();
         } else {
             toast({ variant: 'destructive', title: "Aún hay errores", description: "Completa todas las frases correctamente para finalizar." });
             const firstIncorrect = statuses.findIndex(s => s !== 'correct');
             if (firstIncorrect !== -1) setCurrentIndex(firstIncorrect);
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
        const isCorrect = prompt.es.some(correctAnswer => correctAnswer.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userAnswer);
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
        if (currentIndex < prompts.length - 1) setCurrentIndex(i => i + 1);
        else checkCompletion();
    };
    
    const checkCompletion = () => {
         if (statuses.every(s => s === 'correct')) {
             toast({ title: "¡Felicidades!", description: "Has completado el ejercicio.", className: "bg-green-500 text-white" });
             onComplete();
         } else {
             toast({ variant: 'destructive', title: "Aún hay errores", description: "Completa todas las frases correctamente para finalizar." });
             const firstIncorrect = statuses.findIndex(s => s !== 'correct');
             if (firstIncorrect !== -1) setCurrentIndex(firstIncorrect);
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
                    <ScrollArea className="h-32 w-full mt-4"><div className="p-4 bg-muted rounded-lg border text-sm"><h4 className="font-bold mb-2 text-primary">Vocabulario del Ejercicio</h4><ul className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">{vocabulary.map(v => <li key={v.en}><strong>{v.en}:</strong> {v.es}</li>)}</ul></div></ScrollArea>
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

const GrammarCard = ({ title, children, onComplete }: { title: string, children: React.ReactNode, onComplete: () => void }) => (
    <Card className="shadow-soft border-2 border-brand-purple text-left"><CardHeader><CardTitle className="text-primary uppercase tracking-tighter">{title}</CardTitle></CardHeader><CardContent className="space-y-6">{children}</CardContent><CardFooter className='justify-end'><Button onClick={onComplete}>Comprendido <CheckCircle className='ml-2 h-4 w-4' /></Button></CardFooter></Card>
);

const DemonstrativeTable = ({ data }: { data: { mascSing: string, femSing: string, mascPlur: string, femPlur: string } }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-sm text-left table-auto"> 
            <thead className="bg-muted/50"><tr><th className="p-3"></th><th className="p-3">Masculino</th><th className="p-3">Femenino</th></tr></thead>
            <tbody>
                <tr className="border-b"> 
                    <td className="p-3 font-bold">Singular</td><td className="p-3 font-mono">{data.mascSing}</td><td className="p-3 font-mono">{data.femSing}</td>
                </tr>
                <tr> 
                    <td className="p-3 font-bold">Plural</td><td className="p-3 font-mono">{data.mascPlur}</td><td className="p-3 font-mono">{data.femPlur}</td>
                </tr>
            </tbody>
        </table>
    </div>
);

// --- Main Page Component ---
interface Topic {
    key: string;
    name: string;
    icon: React.ElementType;
    status: 'locked' | 'active' | 'completed';
}

function DemostrativosContent() {
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
    
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(demonstrativesVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(demonstrativesVocab.length).fill('unchecked'));
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
        { key: 'grammar1', name: '2. Gramática: Cercanía', icon: GraduationCap, status: 'locked' },
        { key: 'grammar2', name: '3. Gramática: Distancia Media', icon: GraduationCap, status: 'locked' },
        { key: 'grammar3', name: '4. Gramática: Lejanía', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: '5. Ejercicio 1: Distancia', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: '6. Ejercicio 2: Traducción', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '7. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'reading', name: '8. Lectura', icon: BookText, status: 'locked' },
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
        if ((topicKey.startsWith('grammar')) && topic?.status !== 'completed') {
            handleTopicComplete(topicKey); 
        }
    };

    const handleVocabCheck = () => {
        let okCount = 0;
        const nv = demonstrativesVocab.map((item, idx) => {
            const userAnswer = (vocabAnswers[idx] || '').trim().toLowerCase();
            const correctAnswer = item.es.toLowerCase().replace(/^(el|la|los|las) /, '');
            const isCorrect = userAnswer === correctAnswer;
            if (isCorrect) okCount++;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv as any);
        if (okCount >= 20) { setCanAdvanceVocab(true); toast({ title: "¡Excelente! Vocabulario dominado." }); }
        else toast({ variant: 'destructive', title: `Necesitas ${20 - okCount} más aciertos para avanzar.` });
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
            case 'vocabulary': return <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm"><CardHeader><CardTitle>Vocabulario: Demostrativos</CardTitle><CardDescription>Escribe el sustantivo en español (sin el artículo, ej: libro, casa).</CardDescription></CardHeader><CardContent><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{demonstrativesVocab.map((v, i) => (<div key={i} className="space-y-1"><Label className='font-semibold'>{v.en}</Label><Input value={vocabAnswers[i]} onChange={e => { const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const newValidation = [...vocabValidation]; newValidation[i] = 'unchecked'; setVocabValidation(newValidation); setCanAdvanceVocab(false); }} className={cn("h-10", vocabValidation[i] === 'correct' ? 'border-green-500' : vocabValidation[i] === 'incorrect' ? 'border-red-500' : '')} /></div>))}</div></CardContent><CardFooter className="flex justify-between border-t pt-6"><Button onClick={handleVocabCheck} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar <ArrowRight className='ml-2 h-4 w-4' /></Button></CardFooter></Card>;
            case 'grammar1': return <GrammarCard title="Gramática: Cercanía (This/These)" onComplete={() => handleTopicComplete('grammar1')}><p>Usamos <strong className="text-primary">este, esta, estos, estas</strong> para señalar algo o alguien que está cerca del hablante.</p><p className="text-muted-foreground">Corresponde a "this" y "these" en inglés y se asocia con la palabra <strong className="text-primary">"aquí"</strong> o <strong className="text-primary">"acá"</strong>.</p><DemonstrativeTable data={{ mascSing: "este", femSing: "esta", mascPlur: "estos", femPlur: "estas" }} /><p className='mt-4'>Ejemplo: <span className='font-mono bg-muted p-1 rounded'>Me gusta <strong>este</strong> libro (aquí).</span></p></GrammarCard>;
            case 'grammar2': return <GrammarCard title="Gramática: Distancia Media (That/Those)" onComplete={() => handleTopicComplete('grammar2')}><p>Usamos <strong className="text-primary">ese, esa, esos, esas</strong> para señalar algo o alguien que está a una distancia media, o cerca de la persona con la que hablamos.</p><p className="text-muted-foreground">Corresponde a "that" y "those" en inglés y se asocia con la palabra <strong className="text-primary">"ahí"</strong>.</p><DemonstrativeTable data={{ mascSing: "ese", femSing: "esa", mascPlur: "esos", femPlur: "esas" }} /><p className='mt-4'>Ejemplo: <span className='font-mono bg-muted p-1 rounded'>Pásame <strong>esa</strong> silla (ahí).</span></p></GrammarCard>;
            case 'grammar3': return <GrammarCard title="Gramática: Lejanía (That/Those over there)" onComplete={() => handleTopicComplete('grammar3')}><p>Usamos <strong className="text-primary">aquel, aquella, aquellos, aquellas</strong> para señalar algo o alguien que está lejos tanto del hablante como del oyente.</p><p className="text-muted-foreground">Corresponde a "that/those over there" en inglés y se asocia con la palabra <strong className="text-primary">"allí"</strong> o <strong className="text-primary">"allá"</strong>.</p><DemonstrativeTable data={{ mascSing: "aquel", femSing: "aquella", mascPlur: "aquellos", femPlur: "aquellas" }} /><div className="mt-4"><p>Ejemplo: <span className='font-mono bg-muted p-1 rounded'>Mira <strong>aquellas</strong> montañas (allá).</span></p><p className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-800 dark:text-yellow-300"><strong>Nota:</strong> También existen las formas neutras <strong className="font-bold">esto, eso, aquello</strong>. Se usan para referirse a ideas, situaciones o cosas no identificadas. Ej: <span className="font-mono">¿Qué es eso?</span></p></div></GrammarCard>;
            case 'ex1': return <FillInTheBlankExercise title="Ejercicio 1: Elige la distancia" prompts={ex1Prompts} onComplete={() => handleTopicComplete('ex1')} instruction="Completa con este, ese, aquel (y sus formas) según la pista." />;
            case 'ex2': return <SingleStepExercise title="Ejercicio 2: Género y Número" prompts={ex2Prompts} onComplete={() => handleTopicComplete('ex2')} vocabulary={ex2Vocab} />;
            case 'vocab_game': return <Card className="shadow-soft border-2 border-brand-purple bg-card/95"><CardHeader><CardTitle>Juego de Vocabulario</CardTitle></CardHeader><CardContent><VocabularyMatchingGame data={demonstrativesVocab.slice(0, 10).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Encuentra las parejas" /></CardContent></Card>;
            case 'reading': return <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden"><CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tight'>{readingData.title}</CardTitle></CardHeader><CardContent className="space-y-6 pt-6"><div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-inner">{readingData.content}</div><Separator /><div className="space-y-4"><h3 className='font-black text-primary uppercase text-sm'>Preguntas de Comprensión:</h3>{readingData.questions.map((q, i) => (<div key={i} className="space-y-2 p-3 bg-muted/20 rounded-xl border"><Label className="font-bold">{q.q}</Label><Input value={readingAns[i]} onChange={e => { const na = [...readingAns]; na[i] = e.target.value; setReadingAns(na); setReadingVal(v => { const nv = [...v]; nv[i] = 'unchecked'; return nv as any; }); }} className={cn("h-10", readingVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : readingVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" /></div>))}</div></CardContent><CardFooter className="justify-center border-t p-6 bg-muted/10"><Button onClick={handleCheckReading} size="lg" className="px-16 font-black h-12 shadow-md">Verificar Lectura</Button></CardFooter></Card>;
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
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3"><Activity className='h-10 w-10 text-primary' /> Demostrativos 🇪🇸</h1>
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

export default function DemostrativosPage() {
    return (<Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}><DemostrativosContent /></Suspense>);
}