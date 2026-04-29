'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  PenSquare,
  Lock,
  GraduationCap,
  BrainCircuit,
  Hand,
  Clock,
  Globe,
  Trophy,
  CheckCircle,
  RefreshCw,
  Flame,
  Loader2,
  ArrowLeft,
  ArrowRight,
  X,
  MessageSquare,
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/language-context';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getEnglishIntro2PathData, type EnglishIntro2PathItem } from '@/lib/course-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// --- Constants & Data ---

const ICONS = {
  locked: Lock,
  active: BookOpen,
  completed: CheckCircle,
};

const progressStorageVersion = "english_intro2_path_v7";

const greetingsData = [
    { spanish: 'Hola', english: 'Hello' },
    { spanish: 'Hola (informal)', english: 'Hi' },
    { spanish: 'Buenos días', english: 'Good morning' },
    { spanish: 'Buenas tardes', english: 'Good afternoon' },
    { spanish: 'Buenas noches (al llegar)', english: 'Good evening' },
    { spanish: '¿Cómo estás?', english: 'How are you?' },
    { spanish: '¿Cómo te va?', english: "How's it going?" },
    { spanish: 'Mucho gusto', english: 'Nice to meet you' },
    { spanish: 'Es un placer conocerte', english: 'Pleased to meet you' },
    { spanish: '¿Qué tal?', english: "What's up?" },
];

const farewellsData = [
    { spanish: 'Adiós', english: 'Goodbye' },
    { spanish: 'Chao', english: 'Bye / Bye-bye' },
    { spanish: 'Hasta luego', english: 'See you later' },
    { spanish: 'Hasta pronto', english: 'See you soon' },
    { spanish: 'Buenas noches (al irse/dormir)', english: 'Good night' },
    { spanish: 'Cuídate', english: 'Take care' },
    { spanish: 'Que tengas un buen día', english: 'Have a nice day' },
    { spanish: 'Nos vemos mañana', english: 'See you tomorrow' },
    { spanish: 'Hablamos luego', english: 'Talk to you later' },
    { spanish: 'Te veo después', english: 'Catch you later' },
];

const timeExerciseData = [
  { time: '2:00', answers: ["it's two o'clock", "it is two o'clock"] },
  { time: '2:30', answers: ["it's half past two", "it is half past two"] },
  { time: '5:15', answers: ["it's a quarter past five", "it is a quarter past five"] },
  { time: '9:45', answers: ["it's a quarter to ten", "it is a quarter to ten"] },
  { time: '11:00', answers: ["it's eleven o'clock", "it is eleven o'clock"] },
  { time: '3:05', answers: ["it's five past three", "it is five past three"] },
  { time: '7:50', answers: ["it's ten to eight", "it is ten to eight"] },
  { time: '8:20', answers: ["it's twenty past eight", "it is twenty past eight"] },
  { time: '4:35', answers: ["it's twenty-five to five", "it is twenty five to five"] },
  { time: '1:55', answers: ["it's five to two", "it is five to two"] },
];

const countriesExerciseData = [
    { pais: 'Canadá', country: 'Canada', nationality: 'Canadian', language: 'English' },
    { pais: 'Estados Unidos', country: 'United States', nationality: 'American', language: 'English' },
    { pais: 'México', country: 'Mexico', nationality: 'Mexican', language: 'Spanish' },
    { pais: 'Colombia', country: 'Colombia', nationality: 'Colombian', language: 'Spanish' },
    { pais: 'Perú', country: 'Peru', nationality: 'Peruvian', language: 'Spanish' },
    { pais: 'Brasil', country: 'Brazil', nationality: 'Brazilian', language: 'Portuguese' },
    { pais: 'Portugal', country: 'Portugal', nationality: 'Portuguese', language: 'Portuguese' },
    { pais: 'España', country: 'Spain', nationality: 'Spanish', language: 'Spanish' },
    { pais: 'Francia', country: 'France', nationality: 'French', language: 'French' },
    { pais: 'Italia', country: 'Italy', nationality: 'Italian', language: 'Italian' },
    { pais: 'Rusia', country: 'Russia', nationality: 'Russian', language: 'Russian' },
    { pais: 'China', country: 'China', nationality: 'Chinese', language: 'Chinese' },
    { pais: 'Australia', country: 'Australia', nationality: 'Australian', language: 'English' },
    { pais: 'Holanda', country: 'Netherlands', nationality: 'Dutch', language: 'Dutch' },
    { pais: 'Venezuela', country: 'Venezuela', nationality: 'Venezuelan', language: 'Spanish' },
];

const mixedExercise1Data = [
    { spanish: 'ELLOS NO SON TUS PADRES', english: ['they are not your parents', "they aren't your parents", "they're not your parents"] },
    { spanish: 'ELLA NO ES ALTA (TALL)', english: ['she is not tall', "she isn't tall", "she's not tall"] },
    { spanish: 'ÉL ES JHON', english: ['he is john', "he's john", 'he is jhon', "he's jhon"] },
    { spanish: 'NOSOTROS NO ESTAMOS OCUPADOS (BUSY)', english: ['we are not busy', "we aren't busy", "we're not busy"] },
    { spanish: '¿ESTÁS LIBRE? (FREE)', english: ['are you free?'] },
    { spanish: 'ELLOS NO ESTÁN EN CASA (AT HOME)', english: ['they are not at home', "they aren't at home", "they're not at home"] },
    { spanish: '¿ELLA ES TU PRIMA? (COUSIN)', english: ['is she your cousin?'] },
    { spanish: '¿ELLOS ESTÁN CASADOS? (MARRIED)', english: ['are they married?'] },
    { spanish: 'ELLOS ESTÁN EN EL TRABAJO (AT WORK)', english: ['they are at work', "they're at work"] },
    { spanish: 'NOSOTROS NO SOMOS ESTUDIANTES: (STUDENTS)', english: ['we are not students', "we aren't students", "we're not students"] },
    { spanish: '¿ELLOS SON TUS PRIMOS? (COUSINS)', english: ['are they your cousins?'] },
    { spanish: '¿TU MAMA ES ENFERMERA? (NURSE)', english: ['is your mother a nurse?', 'is your mom a nurse?'] },
];

const mixedExercise2Data = [
    { spanish: '¿Cómo estás hoy?', english: ['how are you today?'] },
    { spanish: 'Hasta mañana, profesor', english: ['see you tomorrow, teacher'] },
    { spanish: 'Mi amigo es de Canadá', english: ['my friend is from canada'] },
    { spanish: 'Son las diez y cuarto', english: ["it's a quarter past ten", "it is a quarter past ten"] },
];

// --- Auxiliary Components ---

const TipContent = () => (
    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
        <CardHeader>
            <CardTitle>Tip Importante</CardTitle>
            <CardDescription>Conceptos clave de gramática.</CardDescription>
        </CardHeader>
        <CardContent>
             <Accordion type="multiple" className="w-full space-y-4" defaultValue={['sustantivo', 'adjetivo', 'verbo', 'pronombres']}>
                <AccordionItem value="sustantivo">
                    <AccordionTrigger className="text-xl font-bold">SUSTANTIVO (NOUN)</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <p className="font-semibold">PERSONA, ANIMAL O COSA (singular- plural)</p>
                        <div>
                            <h4 className="font-medium text-primary">REGULAR: noun+ s</h4>
                            <p className="font-mono text-sm bg-muted p-2 rounded-md mt-1">computer: computers // house: houses // car: cars</p>
                        </div>
                        <div>
                            <h4 className="font-medium text-primary">IRREGULAR: noun+es</h4>
                            <ul className="list-disc pl-5 mt-1 space-y-2 text-sm">
                                <li>For nouns ending {`=>`} s, z, sh, ch, x (bus) = “ES”<br/><span className="font-mono bg-muted px-2 py-1 rounded">Ex: address: Addresses // beach: beaches // bus: buses</span></li>
                                <li>For nouns ending {`=>`} “Y” cancelamos la “Y” agregamos “ies”<br/><span className="font-mono bg-muted px-2 py-1 rounded">Ex: country: countries // university: universities</span></li>
                                <li>Completamente irregular:<br/><span className="font-mono bg-muted px-2 py-1 rounded">Man: men // woman: women // child: children // person: people</span></li>
                            </ul>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="adjetivo">
                    <AccordionTrigger className="text-xl font-bold">ADJETIVO (ADJECTIVE)</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                         <p className="font-semibold">DESCRIBE EL SUSTANTIVO (COLOR, CUALIDAD, CARACTERISTICA.) –(los adjetivos siempre van en singular es decir en su forma original)</p>
                         <Card className="bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500">
                             <CardHeader>
                                 <CardTitle className="text-yellow-800 dark:text-yellow-300 text-lg">NOTAS IMPORTANTES</CardTitle>
                             </CardHeader>
                             <CardContent className="text-sm space-y-3">
                                 <p><strong className="text-foreground">En español:</strong> sustantivo + adjetivo.<br/><span className="font-mono text-muted-foreground">Ejemplo: El carro blanco, el lapicero azul, el computador gris</span></p>
                                 <p><strong className="text-foreground">En INGLÉS:</strong> adjetivo + sustantivo.<br/><span className="font-mono text-muted-foreground">Examples: El carro blanco : the white car, El lapicero rojo : The red pen, el computador gris : the grey computer</span></p>
                             </CardContent>
                         </Card>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="verbo">
                    <AccordionTrigger className="text-xl font-bold">VERBO (VERB)</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <p className="font-semibold">VERB: ACCIÓN.</p>
                        <div>
                            <h4 className="font-medium text-primary">VERBOS INFINITIVO = "TO"</h4>
                            <p className="text-sm text-muted-foreground">Un verbo en infinitivo es un verbo que no está conjugado.</p>
                            <p className="font-mono text-sm bg-muted p-2 rounded-md mt-1">
                                {'ESPAÑOL => ENGLISH'}<br/>
                                {'AR = Hablar = TO speak'}<br/>
                                {'ER = Comer = TO eat'}<br/>
                                {'IR = Vivir = TO Live'}
                            </p>
                        </div>
                         <div>
                            <h4 className="font-medium text-primary">CONJUGACIÓN</h4>
                            <p className="text-sm text-muted-foreground">Cuando estamos utilizando la conjugación el verbo pierde la palabra = "To"</p>
                            <p className="font-mono bg-muted p-2 rounded-md mt-1 text-sm">
                              pronombre + verbo (yo hablo) {'=>'} i + speak<br/>
                              i to speak = yo hablar
                            </p>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="pronombres">
                    <AccordionTrigger className="text-xl font-bold">PRONOMBRES (PRONOUNS)</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                         <p className="font-semibold">Muchas frases no tienen pronombres, entonces las frases pueden TENER:</p>
                         <ul className="list-disc pl-5 text-sm space-y-1">
                             <li><strong>Nombre propio:</strong> Viviana, Edna, Ana, Cristal</li>
                             <li><strong>Sustantivo:</strong> (persona, animal, cosa) {`=>`} carro, casa, finca</li>
                             <li><strong>Demostrativos:</strong> This – these – that – those</li>
                         </ul>
                         <p className="font-mono bg-muted p-2 rounded-md mt-1 text-sm">
                            {'he is at home => pronoun'}<br/>
                            {'Thomas is at home => Nombre propio'}<br/>
                            {'my father is at home => Sustantivo'}<br/>
                            esta es mi casa  = this is my house {'=>'} Demostrativo
                        </p>
                          <div className="flex items-start gap-2 p-2 bg-destructive/10 border-l-4 border-destructive text-foreground rounded-r-md">
                            <X className="h-5 w-5 mt-0.5 flex-shrink-0"/>
                            <div>
                                <h4 className="font-bold">¡NUNCA!</h4>
                                <p className="text-sm">Nunca se pueden utilizar un pronombre con un sustantivo o un pronombre con un nombre propio al mismo tiempo.</p>
                                <p className="font-mono text-xs mt-1">Incorrecto: Thomas he is at home (Thomas él está en la casa)<br/>Incorrecto: he my father is at home (él mi padre está en la casa)</p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </CardContent>
    </Card>
);

const SimpleExercise = ({ title, exerciseData, onComplete }: { title: string; exerciseData: { spanish: string, english: string[] }[], onComplete: () => void }) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<string[]>(Array(exerciseData.length).fill(''));
    const [validationStates, setValidationStates] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(exerciseData.length).fill('unchecked'));
    const [showCompletionMessage, setShowCompletionMessage] = useState(false);

    useEffect(() => {
        setUserAnswers(Array(exerciseData.length).fill(''));
        setValidationStates(Array(exerciseData.length).fill('unchecked'));
        setCurrentIndex(0);
        setShowCompletionMessage(false);
    }, [exerciseData]);

    const currentPrompt = exerciseData[currentIndex];

    const handleAnswerChange = (value: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentIndex] = value;
        setUserAnswers(newAnswers);

        if (validationStates[currentIndex] !== 'unchecked') {
            const newValidationStates = [...validationStates];
            newValidationStates[currentIndex] = 'unchecked';
            setValidationStates(newValidationStates);
        }
    };
    
    const handleCheck = () => {
        const userAnswer = userAnswers[currentIndex].trim().toLowerCase().replace(/[.?,]/g, '');
        const isCorrect = currentPrompt.english.some(ans => ans.toLowerCase().replace(/[.?,]/g, '') === userAnswer);

        const newValidationStates = [...validationStates];
        newValidationStates[currentIndex] = isCorrect ? 'correct' : 'incorrect';
        setValidationStates(newValidationStates);

        if (isCorrect) {
            toast({ title: '¡Correcto!' });
        } else {
            toast({ variant: 'destructive', title: 'Incorrecto' });
        }
    };
    
    const handleNext = () => {
        if (currentIndex < exerciseData.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            const allCorrect = validationStates.every(s => s === 'correct');
            if (allCorrect) {
                setShowCompletionMessage(true);
                onComplete();
            } else {
                toast({ variant: 'destructive', title: 'Revisa tus respuestas', description: 'Debes completar todos los ejercicios correctamente.' });
            }
        }
    };

    if (showCompletionMessage) {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
                    <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
                    <h2 className="text-3xl font-bold">¡Ejercicio Completado!</h2>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <div className="flex items-center justify-start flex-wrap gap-2 pt-4">
                    {exerciseData.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center font-bold border-2 transition-all",
                                currentIndex === index ? "border-primary ring-2 ring-primary" : "border-muted-foreground/50",
                                validationStates[index] === 'correct' && 'bg-green-500/20 border-green-500 text-green-700',
                                validationStates[index] === 'incorrect' && 'bg-red-500/20 border-destructive text-destructive',
                            )}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-lg font-medium">Traduce: "{currentPrompt?.spanish}"</p>
                <Input 
                    value={userAnswers[currentIndex]} 
                    onChange={e => handleAnswerChange(e.target.value)} 
                    className={cn(
                        validationStates[currentIndex] === 'correct' && 'border-green-500 focus-visible:ring-green-500', 
                        validationStates[currentIndex] === 'incorrect' && 'border-destructive focus-visible:ring-destructive'
                    )} 
                    autoComplete="off"
                />
            </CardContent>
            <CardFooter className="justify-between">
                <Button onClick={handleCheck}>Verificar</Button>
                <Button onClick={handleNext} disabled={validationStates[currentIndex] !== 'correct'}>
                    {currentIndex === exerciseData.length - 1 ? 'Finalizar' : 'Siguiente'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
};

const TimeExercise = ({ onComplete }: { onComplete: () => void }) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<string[]>(Array(timeExerciseData.length).fill(''));
    const [validationStates, setValidationStates] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(timeExerciseData.length).fill('unchecked'));
    const [showCompletionMessage, setShowCompletionMessage] = useState(false);

    const currentPrompt = timeExerciseData[currentIndex];

    const handleAnswerChange = (value: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentIndex] = value;
        setUserAnswers(newAnswers);

        if (validationStates[currentIndex] !== 'unchecked') {
            const newValidationStates = [...validationStates];
            newValidationStates[currentIndex] = 'unchecked';
            setValidationStates(newValidationStates);
        }
    };
    
    const handleCheck = () => {
        const userAnswer = userAnswers[currentIndex].trim().toLowerCase().replace(/[.?,]/g, '');
        const isCorrect = currentPrompt.answers.some(ans => ans.toLowerCase().replace(/[.?]/g, '') === userAnswer);

        const newValidationStates = [...validationStates];
        newValidationStates[currentIndex] = isCorrect ? 'correct' : 'incorrect';
        setValidationStates(newValidationStates);

        if (isCorrect) {
            toast({ title: '¡Correcto!', description: 'Puedes pasar al siguiente.' });
        } else {
            toast({ variant: 'destructive', title: 'Incorrecto', description: 'Inténtalo de nuevo.' });
        }
    };
    
    const handleNext = () => {
        if (currentIndex < timeExerciseData.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            const allCorrect = validationStates.every(s => s === 'correct');
            if (allCorrect) {
                setShowCompletionMessage(true);
                onComplete();
            } else {
                toast({ variant: 'destructive', title: 'Revisa tus respuestas', description: 'Debes completar todos los ejercicios correctamente.' });
            }
        }
    };

    if (showCompletionMessage) {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[400px]">
                    <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
                    <h2 className="text-3xl font-bold">¡Ejercicio Completado!</h2>
                    <p className="text-muted-foreground mt-2">Has dominado los ejercicios de la hora.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>Ejercicios: ¿Qué hora es?</CardTitle>
                <CardDescription>Escribe la hora en inglés.</CardDescription>
                <div className="flex items-center justify-start flex-wrap gap-2 pt-4">
                    {timeExerciseData.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center font-bold border-2 transition-all",
                                currentIndex === index ? "border-primary ring-2 ring-primary" : "border-muted-foreground/50",
                                validationStates[index] === 'correct' && 'bg-green-500/20 border-green-500 text-green-700',
                                validationStates[index] === 'incorrect' && 'bg-red-500/20 border-destructive text-destructive',
                            )}
                            aria-label={`Ir al ejercicio ${index + 1}`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="text-center py-8 bg-muted rounded-lg border">
                    <p className="text-sm text-muted-foreground mb-2">Escribe en inglés:</p>
                    <p className="text-5xl font-mono font-bold tracking-tighter">{currentPrompt.time}</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="answer">Tu traducción:</Label>
                    <Input
                        id="answer"
                        value={userAnswers[currentIndex]}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        placeholder="Ej: It's two o'clock"
                        className={cn(
                            "text-lg h-12",
                            validationStates[currentIndex] === 'correct' && "border-green-500 focus-visible:ring-green-500",
                            validationStates[currentIndex] === 'incorrect' && "border-destructive focus-visible:ring-destructive"
                        )}
                        autoComplete="off"
                    />
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck}>Verificar</Button>
                    <Button onClick={handleNext} disabled={validationStates[currentIndex] !== 'correct'}>
                        {currentIndex === timeExerciseData.length - 1 ? 'Finalizar' : 'Siguiente'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const CountriesExercise = ({ onComplete }: { onComplete: () => void }) => {
    const { toast } = useToast();
    type UserAnswerRow = { country: string; nationality: string; language: string };
    type ValidationRow = { country: 'correct' | 'incorrect' | 'unchecked'; nationality: 'correct' | 'incorrect' | 'unchecked'; language: 'correct' | 'incorrect' | 'unchecked' };

    const [userAnswers, setUserAnswers] = useState<UserAnswerRow[]>(
        Array(countriesExerciseData.length).fill({ country: '', nationality: '', language: '' })
    );
    const [validation, setValidation] = useState<ValidationRow[]>(
        Array(countriesExerciseData.length).fill({ country: 'unchecked', nationality: 'unchecked', language: 'unchecked' })
    );

    const handleInputChange = (index: number, field: keyof UserAnswerRow, value: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[index] = { ...newAnswers[index], [field]: value };
        setUserAnswers(newAnswers);

        if (validation[index][field] !== 'unchecked') {
            const newValidation = [...validation];
            newValidation[index] = { ...newValidation[index], [field]: 'unchecked' };
            setValidation(newValidation);
        }
    };

    const handleCheck = () => {
        let allCorrect = true;
        const newValidationStatus: ValidationRow[] = [];
        countriesExerciseData.forEach((correctAnswer, index) => {
            const userAnswer = userAnswers[index] || {};
            const isCountryCorrect = (userAnswer.country || '').trim().toLowerCase() === correctAnswer.country.toLowerCase();
            const isNationalityCorrect = (userAnswer.nationality || '').trim().toLowerCase() === correctAnswer.nationality.toLowerCase();
            const isLanguageCorrect = (userAnswer.language || '').trim().toLowerCase() === correctAnswer.language.toLowerCase();
            
            newValidationStatus[index] = {
                country: isCountryCorrect ? 'correct' : 'incorrect',
                nationality: isNationalityCorrect ? 'correct' : 'incorrect',
                language: isLanguageCorrect ? 'correct' : 'incorrect',
            };

            if (!isCountryCorrect || !isNationalityCorrect || !isLanguageCorrect) allCorrect = false;
        });

        setValidation(newValidationStatus);

        if (allCorrect) {
            toast({ title: "¡Excelente!", description: "Todas tus respuestas son correctas." });
        } else {
            toast({ variant: 'destructive', title: "Algunas respuestas son incorrectas" });
        }
    };
    
    const getInputClass = (status?: 'correct' | 'incorrect' | 'unchecked') => {
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive';
        return '';
    };

    const isTableFilled = useMemo(() => {
        return userAnswers.every(row => 
            row.country.trim() !== '' && 
            row.nationality.trim() !== '' && 
            row.language.trim() !== ''
        );
    }, [userAnswers]);

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>Países y Nacionalidades</CardTitle>
                <CardDescription>Completa la tabla traduciendo la información al inglés.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="font-bold">PAISES</TableHead>
                                <TableHead className="font-bold">COUNTRY</TableHead>
                                <TableHead className="font-bold">NATIONALITY</TableHead>
                                <TableHead className="font-bold">LANGUAGE</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {countriesExerciseData.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{item.pais}</TableCell>
                                    <TableCell>
                                        <Input 
                                            value={userAnswers[index].country} 
                                            onChange={e => handleInputChange(index, 'country', e.target.value)} 
                                            className={cn(getInputClass(validation[index].country))} 
                                            placeholder="..."
                                            autoComplete="off"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input 
                                            value={userAnswers[index].nationality} 
                                            onChange={e => handleInputChange(index, 'nationality', e.target.value)} 
                                            className={cn(getInputClass(validation[index].nationality))} 
                                            placeholder="..."
                                            autoComplete="off"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input 
                                            value={userAnswers[index].language} 
                                            onChange={e => handleInputChange(index, 'language', e.target.value)} 
                                            className={cn(getInputClass(validation[index].language))} 
                                            placeholder="..."
                                            autoComplete="off"
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center mt-4">
                <Button onClick={handleCheck}>Verificar Tabla</Button>
                {isTableFilled && (
                    <Button onClick={onComplete} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        Terminar Intro 2
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};

// --- Main Page Component ---

export default function EnglishIntro2Page() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [learningPath, setLearningPath] = useState<EnglishIntro2PathItem[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string; lessonProgress?: any; progress?: any }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);
    
    const initialLearningPath = useMemo(() => getEnglishIntro2PathData(t), [t]);
    const timeImage = PlaceHolderImages.find(p => p.id === 'telling-time');

    useEffect(() => {
        if (!isClient || isUserLoading || isProfileLoading) return;
        
        let path = initialLearningPath.map(item => ({...item}));

        if (isAdmin) {
            path.forEach(topic => { topic.status = 'completed' });
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedStatuses = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => {
                if (savedStatuses[item.key]) {
                    item.status = savedStatuses[item.key];
                }
            });
        }
        
        setLearningPath(path);
        if (!selectedTopic) {
            const firstActive = path.find(p => p.status === 'active');
            setSelectedTopic(firstActive?.key || path[0].key);
        }

    }, [isAdmin, initialLearningPath, studentProfile, isUserLoading, isProfileLoading, t, isClient, selectedTopic]);

    const progress = useMemo(() => {
        const completedTopics = learningPath.filter(t => t.status === 'completed').length;
        return learningPath.length > 0 ? Math.round((completedTopics / learningPath.length) * 100) : 0;
    }, [learningPath]);

    useEffect(() => {
        if (!isClient || isProfileLoading || !learningPath.length || isAdmin || !studentDocRef) return;

        const statuses = learningPath.reduce((acc, item) => ({ ...acc, [item.key]: item.status }), {});
        updateDocumentNonBlocking(studentDocRef, {
            [`lessonProgress.${progressStorageVersion}`]: statuses,
            'progress.intro2Progress': progress
        });
        window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, progress, isAdmin, isClient, studentDocRef, isProfileLoading]);

    useEffect(() => {
        if (!topicToComplete) return;

        setLearningPath(prevPath => {
            const newPath = [...prevPath];
            const currentIndex = newPath.findIndex((t) => t.key === topicToComplete);

            if (currentIndex !== -1 && newPath[currentIndex].status !== 'completed') {
                newPath[currentIndex].status = 'completed';

                if (currentIndex + 1 < newPath.length && newPath[currentIndex + 1].status === 'locked') {
                    newPath[currentIndex + 1].status = 'active';
                    setSelectedTopic(newPath[currentIndex + 1].key);
                }
            }
            return newPath;
        });
        
        setTopicToComplete(null);
    }, [topicToComplete]);

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find((t) => t.key === topicKey);
        if (topic?.status === 'locked' && !isAdmin) {
            toast({ variant: 'destructive', title: 'Contenido Bloqueado' });
            return;
        }
        setSelectedTopic(topicKey);

        const viewOnlyTopics = ['tip', 'greetings', 'farewells', 'time'];
        if (viewOnlyTopics.includes(topicKey)) {
            setTopicToComplete(topicKey);
        }
    };
    
    const renderContent = () => {
        switch (selectedTopic) {
          case 'tip': return <TipContent />;
          case 'mixed1': return <SimpleExercise title="Ejercicios Mixtos 1" exerciseData={mixedExercise1Data} onComplete={() => setTopicToComplete('mixed1')} />;
          case 'greetings':
            return (
              <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardHeader>
                  <CardTitle>{t('intro2Page.greetings')}</CardTitle>
                  <CardDescription>Los saludos más comunes para iniciar una conversación.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-bold">Español</TableHead>
                        <TableHead className="font-bold">English</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {greetingsData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.spanish}</TableCell>
                          <TableCell>{item.english}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          case 'farewells':
            return (
              <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardHeader>
                  <CardTitle>{t('intro2Page.farewells')}</CardTitle>
                  <CardDescription>Formas comunes de despedirse.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-bold">Español</TableHead>
                        <TableHead className="font-bold">English</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {farewellsData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.spanish}</TableCell>
                          <TableCell>{item.english}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          case 'mixed2': return <SimpleExercise title="Ejercicios Mixtos 2" exerciseData={mixedExercise2Data} onComplete={() => setTopicToComplete('mixed2')} />;
          case 'time':
            return (
              <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardHeader>
                  <CardTitle>{t('intro2Page.time')}</CardTitle>
                  <CardDescription>Estudia cómo decir la hora en inglés.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {timeImage && (
                    <div className="relative w-full max-w-2xl mx-auto aspect-video rounded-xl overflow-hidden border shadow-lg">
                      <Image 
                        src={timeImage.imageUrl} 
                        alt={timeImage.description} 
                        fill
                        className="object-contain bg-white"
                        data-ai-hint={timeImage.imageHint}
                      />
                    </div>
                  )}
                  <div className="space-y-4 pt-4 border-t text-left">
                      <h3 className="text-xl font-bold text-primary">Explicación del Sistema Horario:</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                          <div className="bg-muted p-4 rounded-lg">
                              <p className="font-bold text-foreground">Estructura Principal</p>
                              <p className="text-sm mt-1">Para decir la hora siempre empezamos con <strong>"It is"</strong> o <strong>"It's"</strong>.</p>
                              <p className="font-mono text-sm mt-2 p-1 bg-background rounded">Ej: It is 8:00 (Son las ocho).</p>
                          </div>
                          <div className="bg-muted p-4 rounded-lg">
                              <p className="font-bold text-foreground">Minutos y Preposiciones</p>
                              <ul className="text-sm list-disc pl-5 mt-1 space-y-1">
                                  <li><strong>PAST:</strong> Se usa para los minutos del 1 al 30. Significa "pasadas las". <br/><span className="text-xs italic">(Ej: Ten past two - 2:10)</span></li>
                                  <li><strong>TO:</strong> Se usa para los minutos del 31 al 59. Significa "para las". <br/><span className="text-xs italic">(Ej: Ten to three - 2:50)</span></li>
                              </ul>
                          </div>
                          <div className="bg-muted p-4 rounded-lg md:col-span-2">
                              <p className="font-bold text-foreground">Palabras Clave</p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                                  <div className="text-center p-2 border rounded bg-background">
                                      <p className="font-bold text-primary">O'clock</p>
                                      <p className="text-xs">En punto</p>
                                  </div>
                                  <div className="text-center p-2 border rounded bg-background">
                                      <p className="font-bold text-primary">Quarter past</p>
                                      <p className="text-xs">Y cuarto</p>
                                  </div>
                                  <div className="text-center p-2 border rounded bg-background">
                                      <p className="font-bold text-primary">Half past</p>
                                      <p className="text-xs">Y media</p>
                                  </div>
                                  <div className="text-center p-2 border rounded bg-background">
                                      <p className="font-bold text-primary">Quarter to</p>
                                      <p className="text-xs">Menos cuarto</p>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
                </CardContent>
              </Card>
            );
          case 'time-exercise': return <TimeExercise onComplete={() => setTopicToComplete('time-exercise')} />;
          case 'countries': return <CountriesExercise onComplete={() => setTopicToComplete('countries')} />;
          default:
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple min-h-[500px]">
                  <CardHeader>
                    <CardTitle>Cargando...</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="animate-spin h-10 w-10 text-primary" />
                    </div>
                  </CardContent>
                </Card>
            );
        }
    };

    if (!isClient) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
          <DashboardHeader />
          <main className="flex-1 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <Link href={`/intro`} className="hover:underline text-sm text-muted-foreground">
                    {t('englishIntro.title')}
                </Link>
                <h1 className="text-4xl font-bold dark:text-primary">{t('englishIntro.intro2')}</h1>
              </div>
               <div className="grid gap-8 md:grid-cols-12">
                <div className="md:col-span-9">{renderContent()}</div>
                <div className="md:col-span-3">
                  <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple">
                    <CardHeader><CardTitle>Ruta de Aprendizaje</CardTitle></CardHeader>
                    <CardContent>
                      <nav>
                        <ul className="space-y-1">
                          {learningPath.map((item) => {
                               const StatusIcon = ICONS[item.status as keyof typeof ICONS];
                               return (
                                <li
                                  key={item.key}
                                  onClick={() => handleTopicSelect(item.key)}
                                  className={cn(
                                    'flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                                    item.status === 'locked' && !isAdmin ? 'cursor-not-allowed text-muted-foreground/50' : 'cursor-pointer hover:bg-muted',
                                    selectedTopic === item.key && 'bg-muted text-primary font-semibold'
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <StatusIcon className={cn("h-5 w-5", item.status === 'completed' && "text-green-500", item.status === 'locked' && "text-yellow-500")} />
                                    <span>{item.name}</span>
                                  </div>
                                </li>
                              );
                          })}
                        </ul>
                      </nav>
                      <div className="mt-6 pt-6 border-t">
                          <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2">
                              <span>Progreso</span>
                              <span className="font-bold text-foreground">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
    );
}
