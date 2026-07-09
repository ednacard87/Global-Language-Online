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
    Scale,
    HelpCircle,
    Pencil,
    Zap,
    Info,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';

const progressStorageVersion = 'progress_es_a1_comp_sup_v42_final_fix_all';
const mainProgressKey = 'progress_a1_es_comparativos_y_superlativos';

// --- DATA ---

const vocabularyList = [
    { en: "Tall", es: "Alto" }, { en: "Short", es: "Bajo" }, { en: "Big", es: "Grande" },
    { en: "Small", es: "Pequeño" }, { en: "Fast", es: "Rápido" }, { en: "Slow", es: "Lento" },
    { en: "Expensive", es: "Caro" }, { en: "Cheap", es: "Barato" }, { en: "Interesting", es: "Interesante" },
    { en: "Boring", es: "Aburrido" }, { en: "Good", es: "Bueno" }, { en: "Bad", es: "Malo" },
    { en: "Better", es: "Mejor" }, { en: "Worse", es: "Peor" }, { en: "More", es: "Más" },
    { en: "Less", es: "Menos" }, { en: "Than", es: "Que" }, { en: "As... as", es: "Tan... como" },
    { en: "Young", es: "Joven" }, { en: "Old", es: "Viejo" }, { en: "Beautiful", es: "Bonito" },
    { en: "Difficult", es: "Difícil" }, { en: "Easy", es: "Fácil" }, { en: "Strong", es: "Fuerte" },
    { en: "Weak", es: "Débil" }, { en: "Clean", es: "Limpio" }, { en: "Dirty", es: "Sucio" },
    { en: "Safe", es: "Seguro" }, { en: "Dangerous", es: "Peligroso" }, { en: "Friendly", es: "Amistoso" },
    { en: "Selfish", es: "Egoísta" }, { en: "Intelligent", es: "Inteligente" }, { en: "Funny", es: "Divertido" },
    { en: "Serious", es: "Serio" }, { en: "Wide", es: "Ancho" }, { en: "Narrow", es: "Estrecho" },
    { en: "Heavy", es: "Pesado" }, { en: "Light", es: "Ligero" }, { en: "Happy", es: "Feliz" },
    { en: "Sad", es: "Triste" }
];

const irregularTable = [
    { adjective: "BUENO (Good)", comparative: "MEJOR (Better)", superlative: "EL MEJOR (The best)" },
    { adjective: "MALO (Bad)", comparative: "PEOR (Worse)", superlative: "EL PEOR (The worst)" },
    { adjective: "VIEJO (Old - Age)", comparative: "MAYOR (Older)", superlative: "EL MAYOR (The oldest)" },
    { adjective: "JOVEN (Young)", comparative: "MENOR (Younger)", superlative: "EL MENOR (The youngest)" },
    { adjective: "GRANDE (Big - Size)", comparative: "MAYOR (Greater)", superlative: "EL MAYOR (The greatest)" },
    { adjective: "PEQUEÑO (Small - Size)", comparative: "MENOR (Smaller)", superlative: "EL MENOR (The smallest)" },
];

const ex1Prompts = [
    { en: "The cat is small.", es: ["el gato es pequeño"] },
    { en: "The house is big.", es: ["la casa es grande"] },
    { en: "She is tall.", es: ["ella es alta"] },
    { en: "He is short.", es: ["él es bajo", "el es bajo"] },
    { en: "The car is fast.", es: ["el carro es rápido", "el coche es rápido"] },
    { en: "The book is interesting.", es: ["el libro es interesante"] },
    { en: "The phone is expensive.", es: ["el teléfono es caro", "el celular es caro"] },
];

const ex2Prompts = [
    { en: "He is taller than me.", es: ["él es más alto que yo", "el es mas alto que yo"] },
    { en: "This is cheaper than that.", es: ["esto es más barato que eso", "esto es mas barato que eso"] },
    { en: "My dog is faster than your cat.", es: ["mi perro es más rápido que tu gato", "mi perro es mas rapido que tu gato"] },
    { en: "Spanish is easier than Chinese.", es: ["el español es más fácil que el chino", "el espanol es mas facil que el chino"] },
    { en: "A car is more expensive than a bike.", es: ["un carro es más caro que una bicicleta", "un coche es mas caro que una bicicleta"] },
    { en: "She is older than her sister.", es: ["ella es mayor que su hermana", "ella es mas vieja que su hermana"] },
    { en: "My car is faster than yours.", es: ["mi coche es mas rapido que el tuyo", "mi carro es mas rapido que el tuyo"] },
    { en: "She is taller than her brother.", es: ["ella es mas alta que su hermano"] },
    { en: "This book is more interesting than the last one.", es: ["este libro es mas interesante que el ultimo"] },
    { en: "The weather today is better than yesterday.", es: ["el clima hoy es mejor que ayer"] },
    { en: "An elephant is bigger than a mouse.", es: ["un elefante es mas grande que un raton"] },
    { en: "This house is more expensive than the apartment.", es: ["esta casa es mas cara que el apartamento"] },
    { en: "The new phone is worse than the old one.", es: ["el nuevo telefono es peor que el viejo"] },
    { en: "He is younger than his sister.", es: ["el es mas joven que su hermana"] },
    { en: "The park is more beautiful than the street.", es: ["el parque es mas bonito que la calle"] },
    { en: "The test was easier than I expected.", es: ["el examen fue mas facil de lo que esperaba"] },
    { en: "A book is cheaper than a computer.", es: ["un libro es mas barato que una computadora"] },
    { en: "She is more intelligent than him.", es: ["ella es mas inteligente que el"] },
    { en: "Summer is hotter than winter.", es: ["el verano es mas caluroso que el invierno"] },
    { en: "This exam is more difficult than the last one.", es: ["este examen es mas dificil que el anterior"] },
    { en: "He is stronger than his opponent.", es: ["el es mas fuerte que su oponente"] },
];
const ex3Prompts = [
    { en: "This is the tallest building in the city.", es: ["este es el edificio mas alto de la ciudad"] },
    { en: "She is the smartest student in the class.", es: ["ella es la estudiante mas inteligente de la clase"] },
    { en:"It was the best day of my life.", es: ["fue el mejor dia de mi vida"] },
    { en: "This is the most expensive car in the world.", es: ["este es el coche mas caro del mundo", "este es el carro mas caro del mundo"] },
    { en: "He is the fastest runner on the team.", es: ["el es el corredor mas rapido del equipo"] },
    { en: "That was the worst movie I have ever seen.", es: ["esa fue la peor pelicula que he visto"] },
    { en: "The cheetah is the fastest animal.", es: ["el guepardo es el animal mas rapido"] },
    { en: "This is the easiest exercise in the book.", es: ["este es el ejercicio mas facil del libro"] },
    { en: "My grandmother is the oldest person in my family.", es: ["mi abuela es la persona mas vieja de mi familia", "mi abuela es la persona mayor de mi familia"] },
    { en: "This is the most beautiful place I've visited.", es: ["este es el lugar mas bonito que he visitado"] },
    { en: "This is the coldest winter.", es: ["este es el invierno mas frio"] },
    { en: "This is the most dangerous animal in the jungle.", es: ["este es el animal mas peligroso de la selva"] },
    { en: "He is the most famous actor.", es: ["el es el actor mas famoso"] },
    { en: "This is the highest mountain in the country.", es: ["esta es la montaña mas alta del pais"] },
    { en: "It's the cheapest restaurant in town.", es: ["es el restaurante mas barato del pueblo"] },
];

const ex4Prompts = [
    { en: "This is better.", es: ["esto es mejor"] },
    { en: "That is worse.", es: ["eso es peor"] },
    { en: "I am better than you.", es: ["soy mejor que tú", "soy mejor que tu"] },
    { en: "He is worse than me.", es: ["él es peor que yo", "el es peor que yo"] },
    { en: "This is the best.", es: ["esto es lo mejor"] },
    { en: "That is the worst.", es: ["eso es lo peor"] },
    { en: "I am older than her.", es: ["soy mayor que ella", "soy mas viejo que ella"] },
];

const ex5ChoiceData = [
    { spanish: "Ella es la más bonita", options: ["She is prettier", "She is the most beautiful", "She is beautiful", "She is as beautiful"], answer: "She is the most beautiful" },
    { spanish: "Mi carro es más rápido que el tuyo", options: ["My car is fast", "My car is as fast as yours", "My car is faster than yours", "My car is the fastest"], answer: "My car is faster than yours" },
    { spanish: "Este libro es mejor", options: ["This book is good", "This book is better", "This book is the best", "This book is bad"], answer: "This book is better" },
    { spanish: "Soy el más alto de la clase", options: ["I am taller", "I am tall", "I am the tallest of the class", "I am more tall"], answer: "I am the tallest of the class" },
    { spanish: "Esa película es la peor", options: ["That movie is bad", "That movie is worse", "That movie is the worst", "That movie is not good"], answer: "That movie is the worst" },
    { spanish: "Tú eres más joven que yo", options: ["You are younger than me", "You are the youngest", "You are young", "You are less young"], answer: "You are younger than me" },
    { spanish: "Esto es más barato", options: ["This is cheap", "This is cheaper", "This is the cheapest", "This is more cheap"], answer: "This is cheaper" },
];

const finalCompletionData = [
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

const negativePrompts = [
    { en: "I am not taller than my father.", es: ["no soy más alto que mi padre", "yo no soy mas alto que mi padre"] },
    { en: "This is not the most expensive car.", es: ["este no es el carro más caro", "este no es el coche mas caro"] },
    { en: "She is not older than me.", es: ["ella no es mayor que yo"] },
    { en: "The cat is not faster than the dog.", es: ["el gato no es más rápido que el perro"] },
    { en: "We are not the best in the class.", es: ["no somos los mejores de la clase"] },
    { en: "The city is not cleaner than the town.", es: ["la ciudad no es más limpia que el pueblo"] },
    { en: "This book is not more interesting than that one.", es: ["este libro no es más interesante que ese"] },
    { en: "He is not the tallest student.", es: ["él no es el estudiante más alto"] },
    { en: "The food is not better here.", es: ["la comida no es mejor aquí"] },
    { en: "I am not the most intelligent.", es: ["no soy el más inteligente"] },
    { en: "This movie is not better than the other.", es: ["esta película no es mejor que la otra"] },
    { en: "You are not the youngest in the group.", es: ["no eres el más joven del grupo"] },
    { en: "The hotel is not as expensive as yours.", es: ["el hotel no es tan caro como el tuyo"] },
    { en: "They are not the best players.", es: ["ellos no son los mejores jugadores"] },
    { en: "It is not the worst day.", es: ["no es el peor día"] }
];

const readingData = {
    title: "Una competencia en la ciudad",
    text: "En mi ciudad hay dos restaurantes: 'La Cuchara Rápida' y 'El Tenedor Elegante'. La Cuchara Rápida es más barato que El Tenedor Elegante, pero la comida en El Tenedor Elegante es mejor. El parque de la ciudad es el lugar más bonito de todos, y es más grande que mi casa. La biblioteca es el edificio más viejo de la ciudad. Mi amigo Juan es más alto que yo, pero yo soy más rápido. En la escuela, la clase de matemáticas es la más difícil, pero la clase de español es la más fácil para mí.",
    questions: [
        { q: "¿Qué restaurante es más barato?", a: ["la cuchara rapida", "la cuchara rápida"] },
        { q: "¿Cuál es el lugar más bonito de la ciudad?", a: ["el parque", "el parque de la ciudad"] },
        { q: "¿Cuál es el edificio más viejo?", a: ["la biblioteca"] },
        { q: "¿Quién es más alto, Juan o el narrador?", a: ["juan"] },
        { q: "¿Cuál es la clase más difícil para el narrador?", a: ["matematicas", "matemáticas", "clase de matematicas"] }
    ]
};

// --- HELPER COMPONENTS ---

const BallsExercise = ({ title, description, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

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
                <div className="flex justify-between items-start">
                    <div className="text-left">
                        <CardTitle className="text-primary uppercase tracking-tighter">{title}</CardTitle>
                        <CardDescription className="font-bold text-foreground mt-1">{description || "Traduce la frase al español."}</CardDescription>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary scale-110 shadow-md" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger>
                            <PopoverContent className="w-64"><ScrollArea className="h-64 pr-4"><div className="space-y-2 text-foreground text-left">
                                <h4 className='font-black text-primary text-xs uppercase mb-2 border-b'>Ayuda de Misión</h4>
                                {Object.entries(vocabulary).map(([en, es]: any, i) => (<div key={i} className="flex justify-between text-[10px] border-b border-muted pb-1"><span className="text-muted-foreground uppercase">{en}:</span><span className="font-bold text-primary">{es.toUpperCase()}</span></div>))}
                            </div></ScrollArea></PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="p-10 bg-muted rounded-[2.5rem] border-2 border-dashed border-primary/20 flex flex-col items-center justify-center min-h-[12rem]">
                    <span className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Translate to Spanish</span>
                    <h3 className="text-3xl md:text-4xl font-black text-primary text-center uppercase tracking-tighter leading-tight">{prompts[currentIndex]?.en}</h3>
                </div>
                <Input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-14 text-xl font-bold text-center border-2", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/5' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder="Escribe en español..." autoComplete="off" />
            </CardContent>
            <CardFooter className="justify-between border-t p-6 bg-muted/5">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-3">
                    <Button onClick={handleCheck} variant="secondary" className="font-bold">Verificar</Button>
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={status[currentIndex] !== 'correct'} className="font-black px-10 text-white shadow-xl">
                        {currentIndex === prompts.length - 1 ? 'Finalizar Paso' : 'Siguiente'} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const ChoiceExercise = ({ title, description, prompts, onComplete }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    const handleSelect = (option: string) => {
        const isCorrect = option.toUpperCase() === prompts[currentIndex].answer.toUpperCase();
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Correcto!" });
        else toast({ variant: 'destructive', title: "Incorrecto" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="text-left">
                    <CardTitle className='text-primary uppercase'>{title}</CardTitle>
                    <CardDescription className='font-bold text-foreground'>{description}</CardDescription>
                    <div className="flex gap-2 justify-start flex-wrap pt-4">
                        {prompts.map((_: any, i: number) => (
                            <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary scale-110 shadow-md" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-8 py-10">
                <div className="p-8 bg-muted rounded-2xl border-2 border-dashed text-center">
                    <p className="text-sm text-muted-foreground uppercase font-black mb-2">Frase en Español:</p>
                    <h3 className="text-2xl font-black text-primary uppercase">{prompts[currentIndex].spanish}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    {prompts[currentIndex].options.map((opt: string) => (
                        <Button key={opt} onClick={() => handleSelect(opt)} variant="outline" className={cn("h-16 text-lg font-bold transition-all", status[currentIndex] === 'correct' && opt === prompts[currentIndex].answer && "border-green-500 bg-green-50 text-green-700 shadow-md scale-105")}>{opt}</Button>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={status[currentIndex] !== 'correct'} className="px-12 font-black shadow-lg">
                    {currentIndex === prompts.length - 1 ? 'Finalizar' : 'Siguiente'} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
};

const CompletionExercise = ({ title, description, prompts, onComplete }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setAnswer(''); }, [currentIndex]);

    const handleCheck = () => {
        const isCorrect = prompts[currentIndex].answer.toLowerCase() === answer.trim().toLowerCase();
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Correcto!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
            <CardHeader>
                <CardTitle className='text-primary uppercase'>{title}</CardTitle>
                <CardDescription className='font-bold text-foreground'>{description}</CardDescription>
                <div className="flex gap-2 justify-start flex-wrap pt-4">
                    {prompts.map((_: any, i: number) => (
                        <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary scale-110 shadow-md" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="p-6 bg-muted rounded-2xl border italic text-xl text-center shadow-inner">
                    <p className='text-sm text-muted-foreground uppercase font-black mb-2'>Completa la frase en español:</p>
                    <p className='mb-4 font-bold text-primary'>"{prompts[currentIndex].en}"</p>
                    <div className='font-mono bg-background p-4 rounded-xl border-2 border-dashed'>
                        {prompts[currentIndex].text.split('_______').map((part: string, i: number) => (
                            <Fragment key={i}>
                                {part}
                                {i < prompts[currentIndex].text.split('_______').length - 1 && (
                                    <span className={cn("border-b-2 border-primary px-4 mx-2", status[currentIndex] === 'correct' ? "text-green-500 font-bold" : "text-muted-foreground")}>
                                        {status[currentIndex] === 'correct' ? prompts[currentIndex].answer : '_______'}
                                    </span>
                                )}
                            </Fragment>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className='font-black uppercase text-xs'>Escribe la palabra o frase faltante en ESPAÑOL:</Label>
                    <Input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-14 text-xl text-center", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/5' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" />
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t p-6 bg-muted/10">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className='flex gap-2'>
                    <Button onClick={handleCheck} variant="secondary">Verificar</Button>
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={status[currentIndex] !== 'correct'} className='font-bold shadow-md'>
                        {currentIndex === prompts.length - 1 ? 'Finalizar Paso' : 'Siguiente'} <ArrowRight className='ml-2 h-4 w-4'/>
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};

// --- MAIN CONTENT ---

interface Topic {
    key: string;
    name: string;
    icon: React.ElementType;
    status: 'locked' | 'active' | 'completed';
}

function ComparativosSuperlativosContent({ overrideStudentId }: { overrideStudentId?: string | null }) {
    const { toast } = useToast();
    const { user, isUserLoading: isAuthLoading } = useUser();
    const firestore = useFirestore();

    const currentUID = overrideStudentId || user?.uid;

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);

    // Reading specific states
    const [readingAnswers, setReadingAnswers] = useState<string[]>(Array(readingData.questions.length).fill(''));
    const [readingVal, setReadingVal] = useState<any[]>(Array(readingData.questions.length).fill('unchecked'));

    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(vocabularyList.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(vocabularyList.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);
    const [translationText, setTranslationText] = useState('');

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    
    const { data: authUserProfile } = useDoc<{ role?: string }>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string, lessonProgress?: any, progress?: any, name?: string }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: '2. Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: '3. Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: '4. Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'ex3', name: '5. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'grammar2', name: '6. Gramática 2 (Irregulares)', icon: GraduationCap, status: 'locked' },
        { key: 'vocab_game', name: '7. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'ex4', name: '8. Ejercicio 4 (Irregulares)', icon: PenSquare, status: 'locked' },
        { key: 'ex5', name: '9. Ejercicio 5 (Selección)', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: '10. Lectura', icon: BookText, status: 'locked' },
        { key: 'final_ex', name: '11. Ejercicio Final', icon: Trophy, status: 'locked' },
        { key: 'translate_text', name: '12. Traducir Texto', icon: MessageSquare, status: 'locked' },
        { key: 'final', name: '13. Final (Negativos)', icon: CheckCircle, status: 'locked' },
    ], []);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    useEffect(() => {
        if (isProfileLoading || isAuthLoading || !studentProfile) return;

        let path = initialLearningPath.map(topic => ({ ...topic }));
        let savedST = '';

        if (isAdmin && !overrideStudentId) {
            path.forEach(item => { item.status = 'completed'; });
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const d = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => { if (d[item.key]) item.status = d[item.key]; });
            savedST = d.lastSelectedTopic || '';
        }

        let lastDone = true;
        for (let i = 0; i < path.length; i++) {
            if (lastDone && path[i].status === 'locked') path[i].status = 'active';
            lastDone = path[i].status === 'completed';
        }

        setLearningPath(path as Topic[]);
        setSelectedTopic(savedST || path.find(p => p.status === 'active')?.key || path[0].key);
        setIsInitialLoading(false);
    }, [studentProfile, isProfileLoading, isAuthLoading, isAdmin, initialLearningPath, overrideStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || overrideStudentId) return;
        const s: Record<string, any> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => { s[item.key] = item.status; });
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, isAdmin, progressValue, studentDocRef, selectedTopic, isInitialLoading, overrideStudentId]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(curr => {
            let win = false; let next: string | null = null;
            const np = curr.map(t => ({ ...t }));
            const idx = np.findIndex(t => t.key === topicToComplete);
            if (idx !== -1 && np[idx].status !== 'completed') {
                np[idx].status = 'completed';
                if (idx + 1 < np.length && np[idx + 1].status === 'locked') {
                    np[idx + 1].status = 'active'; win = true; next = np[idx + 1].key;
                }
            }
            if (win) setTimeout(() => toast({ title: "¡Siguiente misión desbloqueada!" }), 0);
            if (next) { const n = next; setTimeout(() => setSelectedTopic(n), 0); }
            return np as Topic[];
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const t = learningPath.find(it => it.key === topicKey);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (['grammar', 'grammar2'].includes(topicKey)) handleTopicComplete(topicKey);
    };

    const handleVocabCheck = () => {
        let okCount = 0;
        const nv = vocabularyList.map((v, i) => {
            const res = v.es.toLowerCase() === (vocabAnswers[i] || '').trim().toLowerCase();
            if (res) okCount++; return res ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv);
        if (okCount >= 10) { setCanAdvanceVocab(true); toast({ title: "¡Buen avance!" }); }
        else toast({ variant: 'destructive', title: "Necesitas 10 aciertos para avanzar." });
    };

    const handleCheckReading = () => {
        let allOk = true;
        const newVal = readingData.questions.map((q, i) => {
            const isOk = q.a.some(ans => (readingAnswers[i] || '').trim().toLowerCase().includes(ans.toLowerCase()));
            if (!isOk) allOk = false;
            return isOk ? 'correct' : 'incorrect';
        });
        setReadingVal(newVal);
        if (allOk) { toast({ title: "¡Lectura superada!" }); handleTopicComplete('reading'); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas." });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className="text-primary uppercase tracking-tighter">Vocabulario: Comparación (40)</CardTitle><CardDescription className='font-bold text-foreground'>Escribe el significado en español para desbloquear la misión (Mín. 10).</CardDescription></CardHeader>
                        <CardContent className="pt-6"><ScrollArea className="h-[450px] pr-4"><div className="grid grid-cols-2 gap-4">
                            <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">English</div><div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Español</div>
                            {vocabularyList.map((v, i) => (<Fragment key={i}><div className="flex items-center font-bold py-1 text-sm">{v.en}</div><Input value={vocabAnswers[i]} onChange={e => { const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); setVocabValidation(vv => { const nv = [...vv]; nv[i] = 'unchecked'; return nv; }); setCanAdvanceVocab(false); }} className={cn("h-10 uppercase", vocabValidation[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" /></Fragment>))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 bg-muted/20"><Button onClick={handleVocabCheck} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar <ArrowRight className='ml-2 h-4 w-4'/></Button></CardFooter>
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
            case 'ex1': return <BallsExercise title="Misión 1: Traducción Básica" prompts={ex1Prompts} onComplete={() => handleTopicComplete('ex1')} vocabulary={{"cat": "gato", "house": "casa", "fast": "rápido", "interesting": "interesante"}} />;
            case 'ex2': return <BallsExercise title="Misión 2: Comparativos" prompts={ex2Prompts} onComplete={() => handleTopicComplete('ex2')} vocabulary={{"taller": "más alto", "cheaper": "más barato", "easier": "más fácil", "than": "que"}} />;
            case 'ex3': return <BallsExercise title="Misión 3: Superlativos" prompts={ex3Prompts} onComplete={() => handleTopicComplete('ex3')} vocabulary={{"tallest": "el más alto", "best": "el mejor", "worst": "el peor", "longest": "el más largo"}} />;
            case 'vocab_game': return <VocabularyMatchingGame data={vocabularyList.slice(0, 10).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Memoria de Comparación" />;
            case 'ex4': return <BallsExercise title="Misión 4: Irregulares" prompts={ex4Prompts} onComplete={() => handleTopicComplete('ex4')} vocabulary={{"better": "mejor", "worse": "peor", "best": "lo mejor", "worst": "lo peor"}} />;
            case 'ex5': return <ChoiceExercise title="Misión 5: Selección de Traducción" description="Escoge la opción que traduzca correctamente la frase al inglés." prompts={ex5ChoiceData} onComplete={() => handleTopicComplete('ex5')} />;
            case 'reading':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'>
                            <div className="flex justify-between items-center">
                                <CardTitle className='text-primary uppercase tracking-tight'>Lectura: Una competencia en la ciudad</CardTitle>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" size="sm" className='border-brand-blue border-2'><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger>
                                    <PopoverContent className="w-64"><ScrollArea className="h-40">{Object.entries({ "spoon": "cuchara", "fork": "tenedor", "neighborhood": "barrio", "building": "edificio", "fast": "rápido" }).map(([en, es], i) => (<div key={i} className="flex justify-between text-xs border-b pb-1"><span>{en}:</span><span className="font-bold text-primary">{es}</span></div>))}</ScrollArea></PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner">"{readingData.text}"</div>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className='font-black text-primary uppercase text-sm'>Preguntas de Comprensión:</h3>
                                {readingData.questions.map((q, i) => (
                                    <div key={i} className="space-y-2 p-3 bg-muted/20 rounded-xl border">
                                        <Label className="font-bold">{q.q}</Label>
                                        <Input value={readingAnswers[i]} onChange={e => { const na = [...readingAnswers]; na[i] = e.target.value; setReadingAnswers(na); setReadingVal(v => { const nv = [...v]; nv[i] = 'unchecked'; return nv; }); }} className={cn("h-10", readingVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : readingVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/10"><Button onClick={handleCheckReading} size="lg" className="px-16 font-black h-12 shadow-md">Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'final_ex': return <CompletionExercise title="Ejercicio Final: Completación" description="Completa la frase en español basada en el prompt en inglés." prompts={finalCompletionData} onComplete={() => handleTopicComplete('final_ex')} />;
            case 'translate_text':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div><CardTitle className='text-primary uppercase'>Traducción de Texto</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el párrafo comparativo para desbloquear el reto final.</CardDescription></div>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" size="sm" className='border-brand-blue border-2'><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger>
                                    <PopoverContent className="w-64"><ScrollArea className="h-40">{Object.entries({ "city": "ciudad", "school": "escuela", "expensive": "caro", "better": "mejor", "smarter": "más inteligente" }).map(([en, es], i) => (<div key={i} className="flex justify-between text-xs border-b pb-1"><span>{en}:</span><span className="font-bold text-primary">{es}</span></div>))}</ScrollArea></PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-sm">"My city is a very interesting place. The central park is the most beautiful area and it's bigger than my school. There's a new restaurant that is more expensive than the old one, but the food is better. I think learning Spanish is easier than learning German. My dog is faster than my cat, but my cat is smarter."</div>
                            <Separator />
                            <div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={translationText} onChange={(e) => setTranslationText(e.target.value)} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg leading-relaxed" /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20">
                            <Button onClick={() => handleTopicComplete('translate_text')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Siguiente Misión <ArrowRight className='ml-3 h-8 w-8' /></Button>
                        </CardFooter>
                    </Card>
                );
            case 'final': return <BallsExercise title="Reto Final: Negativos" description="Traduce las frases negativas de comparación." prompts={negativePrompts} onComplete={() => handleTopicComplete('final')} vocabulary={{"not": "no", "taller": "más alto", "expensive": "caro", "better": "mejor"}} />;
            default: return null;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {overrideStudentId && isAdmin && (
                        <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md">
                            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400">
                                <Star className="h-6 w-6 fill-current animate-pulse" />
                                <p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión: {studentProfile?.name || overrideStudentId}</p>
                            </div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors"><Link href="/admin">Cerrar Supervisión</Link></Button>
                        </div>
                    )}
                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/a1" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver al Curso A1</Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3"><Scale className='h-10 w-10 text-primary' /> Comparativos y Superlativos 🇪🇸</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30"><CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Misión A1</CardTitle></CardHeader>
                                <CardContent className="p-4">
                                    <nav><ul className="space-y-1">
                                        {learningPath.map((item) => {
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            const isSelected = selectedTopic === item.key;
                                            const Icon = item.icon;
                                            return (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', isSelected && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm')}>
                                                    <div className="flex items-center gap-3">
                                                        {item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}
                                                        <span className="truncate max-w-[150px]">{item.name}</span>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul></nav>
                                    <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 font-black uppercase tracking-widest text-muted-foreground"><span>Progreso</span><span className="text-primary">{progressValue}%</span></div><Progress value={progressValue} className="h-2 rounded-full" /></div>
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
    return (<Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}><ComparativosSuperlativosContent /></Suspense>);
}