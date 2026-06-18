'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, Fragment } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    GraduationCap, 
    CheckCircle, 
    Loader2, 
    ArrowRight, 
    BookText, 
    Check, 
    X, 
    Info, 
    Zap,
    ArrowLeft,
    Mic,
    Scale
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DashboardHeader } from '@/components/dashboard/header';
import { Footer } from '@/components/footer';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';

// --- CONSTANTS & DATA ---

const progressStorageVersion = 'progress_a1_eng_u3_c13_v600_tables_stable';
const mainProgressKey = 'progress_a1_eng_unit_3_class_13';

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const vocabularyData = [
    { spanish: 'BONITO/A', english: ['pretty', 'beautiful'] },
    { spanish: 'ANCHO', english: ['wide'] },
    { spanish: 'DESPIERTO', english: ['awake'] },
    { spanish: 'DIFERENTE', english: ['different'] },
    { spanish: 'LARGO', english: ['long'] },
    { spanish: 'SECO', english: ['dry'] },
    { spanish: 'ENOJADO', english: ['angry'] },
    { spanish: 'CANSADO', english: ['tired'] },
    { spanish: 'BRILLANTE', english: ['bright'] },
    { spanish: 'SUCIO', english: ['dirty'] },
    { spanish: 'LIMPIO', english: ['clean'] },
    { spanish: 'MOJADO', english: ['wet'] },
];

// --- ADJECTIVE TABLES DATA ---
const monosyllabicTableData = [
    { spanish: 'pequeño', answers: { pos: 'small', comp: 'smaller', sup: 'the smallest' } },
    { spanish: 'alto', answers: { pos: 'tall', comp: 'taller', sup: 'the tallest' } },
    { spanish: 'joven', answers: { pos: 'young', comp: 'younger', sup: 'the youngest' } },
    { spanish: 'viejo', answers: { pos: 'old', comp: 'older', sup: 'the oldest' } },
    { spanish: 'nuevo', answers: { pos: 'new', comp: 'newer', sup: 'the newest' } },
    { spanish: 'largo', answers: { pos: 'long', comp: 'longer', sup: 'the longest' } },
    { spanish: 'corto', answers: { pos: 'short', comp: 'shorter', sup: 'the shortest' } },
    { spanish: 'gordo', answers: { pos: 'fat', comp: 'fatterer', sup: 'the fattest' } },
    { spanish: 'grande', answers: { pos: 'big', comp: 'bigger', sup: 'the biggest' } },
    { spanish: 'caliente', answers: { pos: 'hot', comp: 'hotter', sup: 'the hotest' } },
    { spanish: 'alto', answers: { pos: 'tall', comp: 'taller', sup: 'the tallest' } },
    { spanish: 'rapido', answers: { pos: 'fast', comp: 'faster', sup: 'the fastest' } },
    { spanish: 'delgado', answers: { pos: 'thin', comp: 'thinner', sup: 'the thinnest' } },
    { spanish: 'mojado', answers: { pos: 'wet', comp: 'wetter', sup: 'the wettest' } },
    { spanish: 'seco', answers: { pos: 'dry', comp: 'drier', sup: 'the driest' } },
    { spanish: 'triste', answers: { pos: 'sad', comp: 'sadder', sup: 'the saddest' } },
    { spanish: 'calido', answers: { pos: 'warm', comp: 'warmer', sup: 'the warmest' } },
];

const bisyllabicTableData = [
    { spanish: 'fácil', answers: { pos: 'easy', comp: 'easier', sup: 'the easiest' } },
    { spanish: 'feliz', answers: { pos: 'happy', comp: 'happier', sup: 'the happiest' } },
    { spanish: 'loco', answers: { pos: 'crazy', comp: 'crazier', sup: 'the craziest' } },
    { spanish: 'pesado', answers: { pos: 'heavy', comp: 'heavier', sup: 'the heaviest' } },
    { spanish: 'tierno', answers: { pos: 'tender', comp: 'tenderer', sup: 'the tenderest' } },
    { spanish: 'estrecho', answers: { pos: 'narrow', comp: 'narrower', sup: 'the narrowest' } },
];

const longTableData = [
    { spanish: 'Caro', answers: { pos: 'expensive', comp: 'more expensive', sup: 'the most expensive' } },
    { spanish: 'moderno', answers: { pos: 'modern', comp: 'more modern', sup: 'the most modern' } },
    { spanish: 'hermoso', answers: { pos: 'beautiful', comp: 'more beautiful', sup: 'the most beautiful' } },
    { spanish: 'inteligente', answers: { pos: 'intelligent', comp: 'more intelligent', sup: 'the most intelligent' } },
    { spanish: 'elegante', answers: { pos: 'elegant', comp: 'more elegant', sup: 'the most elegant' } },
    { spanish: 'interesante', answers: { pos: 'interesting', comp: 'more interesting', sup: 'the most interesting' } },
    { spanish: 'peligroso', answers: { pos: 'dangerous', comp: 'more dangerous', sup: 'the most dangerous' } },
    { spanish: 'famoso', answers: { pos: 'famous', comp: 'more famous', sup: 'the most famous' } },
    { spanish: 'dificil', answers: { pos: 'difficult', comp: 'more difficult', sup: 'the most difficult' } },
    { spanish: 'honesto', answers: { pos: 'honest', comp: 'more honest', sup: 'the most honest' } },
    { spanish: 'humilde', answers: { pos: 'humble', comp: 'more humble', sup: 'the most humble' } },
    { spanish: 'educado', answers: { pos: 'polite', comp: 'more polite', sup: 'the most polite' } },
    { spanish: 'aburrido', answers: { pos: 'bored', comp: 'more bored', sup: 'the most bored' } },
];

const ex_comp = [
    { spanish: "MI CASA ES MAS GRANDE QUE LA TUYA", answer: ["my house is bigger than yours"] },
    { spanish: "ESTE ESCRITORIO ES MAS PEQUEÑO QUE EL OTRO", answer: ["this desk is smaller than the another one"] },
    { spanish: "MI PERRO ES MAS RAPIDO QUE EL PERRO DE JIMMY", answer: ["my dog is faster than jimmy's dog"] },
    { spanish: "JIMMY ES MAS ALTO QUE JACK", answer: ["jimmy is taller than jack"] },
    { spanish: "SU CASA ES MAS LIMPIA QUE LA DE ELLA (DE EL)", answer: ["his house is cleaner than hers"] },
    { spanish: "ESTA CALLE ES MAS ANCHA QUE LA AVENIDA", answer: ["this street is wider than the avenue"] },
];

const ex_sup = [
    { spanish: "MI CASA ES LA MAS GRANDE DE MI BARRIO", answer: ["my house is the biggest in my neighborhood"] },
    { spanish: "ESTA CASA ES LA MAS PEQUEÑA DE SU BARRIO (DE ELLA)", answer: ["this house is the smallest in her neighborhood"] },
    { spanish: "SOY EL MAS ALTO DEL SALON DE CLASE", answer: ["i am the tallest in the classroom"] },
    { spanish: "PETER ES EL ACTOR MAS VIEJO DE LA PELICULA", answer: ["peter is the oldest actor in the movie"] },
];

const monoPrompts = [
    { spanish: "EL INVIERNO ES MAS LARGO QUE EL VERANO", answer: ["winter is longer than summer"] },
    { spanish: "SANTA MARTA ES MAS PEQUEÑA QUE BARRANQUILLA", answer: ["santa marta is smaller than barranquilla"] },
    { spanish: "ESTE ES EL PERRO MAS VIEJO DE ESE BARRIO", answer: ["this is the oldest dog in that neighborhood"] },
    { spanish: "¿JUAN ES MAS ALTO QUE SARA?", answer: ["is juan taller than sara?"] },
    { spanish: "MI CARRRO ES MAS RAPIDO QUE EL DE MICHAEL", answer: ["my car is faster than michael's"] },
    { spanish: "MI CIUDAD ES MAS CALIDA QUE LA TUYA", answer: ["this house is the biggest on this street"] },
    { spanish: "YO SOY MAS DELGADA QUE RACHEL", answer: ["i am thinner than rachel"] },
    { spanish: "COLOMBIA ES MAS CALIENTE QUE CHILE", answer: ["Colombia es hotter than Chile"] },
    { spanish: "CHILE ES MAS FRIO QUE COLOMBIA", answer: ["Chile is colder than Colombia"] },
    { spanish: "MI RELOJ ES MAS GRANDE QUE EL TUYO", answer: ["my watch is bigger than yours"] },
    { spanish: "TU CARRO ES MAS NUEVO QUE EL MIO", answer: ["your car is newer than mine"] },
    { spanish: "ESTA CASA ES LA MAS GRANDE DE ESTA CALLE", answer: ["this house is the biggest on this street"] },
];

const bisPrompts = [
    { spanish: "ESTE EJERCICIO ES MAS FACIL QUE EL OTRO", answer: ["this exercise is easier than the other one"] },
    { spanish: "ESA CAJA ES MAS PESADA QUE ESTA", answer: ["that box is heavier than this one"] },
    { spanish: "ESTA CALLE ES LA MAS ANGOSTA", answer: ["this street is the narrowest", "this road is the narrowest"] },   
    { spanish: "EL SABADO ES EL DIA MAS CHEVERE DE LA SEMANA", answer: ["saturday is the nicest day of the week"] },
    { spanish: "MI PRIMA LILY ES LA MUJER MAS FELIZ", answer: ["my cousin lily is the happiest woman"] },
    { spanish: "ESA CALLE ES MAS ANGOSTA QUE LA AVENIDA", answer: ["that street is narrower than the avenue"] },
];

const longPrompts = [
    { spanish: "EL TE ES MAS CARO QUE EL AGUA", answer: ["tea is more expensive than water"] },
    { spanish: "IRAK ES EL PAIS MAS PELIGROSO DEL MUNDO", answer: ["iraq is the most dangerous country in the world"] },
    { spanish: "EL ES MAS ELEGANTE QUE ELLA", answer: ["he is more elegant than her"] },
    { spanish: "UN TIGRE ES MAS PELIGROSO QUE UN GATO", answer: ["a tiger is more dangerous than a cat"] },
    { spanish: "DANI ES MAS INTELIGENTE QUE SU PRIMO", answer: ["dani is more intelligent than his cousin"] },
    { spanish: "PETER ES EL ESTUDIANTE MAS EDUCADO", answer: ["peter is the most polite student"] },
    { spanish: "MARIO ES MAS HUMILDE QUE MARTIN", answer: ["mario is more humble than martin"] },
    { spanish: "EL ESPAÑOL ES MAS DIFICIL QUE EL INGLES", answer: ["spanish is more difficult than english"] },
    { spanish: "ESA CASA ES MAS CARA QUE ESTA", answer: ["that house is more expensive than this one"] },
    { spanish: "SHAKIRA ES MAS FAMOSA QUE JUANES ", answer: ["shakira es more famous than juanes "] },
    { spanish: "LA PROFESORA DE INGLES ES MAS EDUCADA QUE LA DE QUIMICA", answer: ["The english teacher is more polite than the chemistry teacher."] },
];

const irregularPrompts = [
    { spanish: "CRISTIANO RONALDO ES EL MEJOR JUGADOR DE FUTBOL", answer: ["cristiano ronaldo is the best soccer player", "cristiano ronaldo is the best football player"] },
    { spanish: "CHINA ES MAS LEJOS QUE JAPON", answer: ["china is farther than japan", "china is further than japan"] },
    { spanish: "ESE HOMBRE ES EL PEOR ACTOR DE LA PELICULA", answer: ["that man is the worst actor in the movie"] },
    { spanish: "ME SIENTO MEJOR QUE AYER", answer: ["i feel better than yesterday"] },
    { spanish: "EL SABADO ES EL MEJOR DIA DE LA SEMANA", answer: ["saturday is the best day of the week"] },
    { spanish: "TUNJA ES MAS LEJOS QUE CHIA", answer: ["tunja is farther than chia"] },
    { spanish: "INGLATERRA ES MAS LEJOS QUE LOS ESTADOS UNIDOS", answer: ["Inglaterra is farther than the United states"] },
    { spanish: "HITLER FUE EL PEOR HOMBRE DEL MUNDO", answer: ["hitler was the worst man in the world"] },
    { spanish: "MERYL STREET ES LA MEJOR ACTRIZ", answer: ["meryl street is the best actress"] },
    { spanish: "ROGER FEDERER ES EL MEJOR JUGADOR DE TENIS", answer: ["roger federer is the best tennis player"] },
];

const equalityPrompts = [
    { spanish: "YO SOY TAN ALTO COMO MI HERMANO", answer: ["i am as tall as my brother"] },
    { spanish: "ESTE PORTATIL ES TAN CARO COMO ESE", answer: ["this laptop is as expensive as that one"] },
    { spanish: "ELLA ES TAN INTELIGENTE COMO SU HERMANA", answer: ["she is as intelligent as her sister"] },
];

const inferiorityPrompts = [
    { spanish: "ESTE CARRO ES MENOS CARO QUE EL AZUL", answer: ["this car is less expensive than the blue one"] },
    { spanish: "LA MATEMATICA ES MENOS INTERESANTE QUE LA HISTORIA", answer: ["math is less interesting than history", "maths is less interesting than history"] },
    { spanish: "ELLA ES MENOS TIMIDA QUE SU HERMANA", answer: ["she is less shy than her brother"] },
];

const mixed2Prompts = [
    { spanish: "COLOMBIA", answer: ["colombia"] },
    { spanish: "EL LUNES ES EL DIA MAS ABURRIDOR DE LA SEMANA", answer: ["monday is the most boring day of the week"] },
    { spanish: "EL VINO ES MAS DELICIOSO QUE LA CERVEZA", answer: ["wine is more delicious than the beer"] },
    { spanish: "ALASKA", answer: ["alaska"] },
    { spanish: "VENEZUELA", answer: ["Venezuela"] },
    { spanish: "REINO UNIDO", answer: ["Reino unido"] },
];

const mixed3Prompts = [
    { spanish: "SHAKIRA ES LA CANTANTE MAS FAMOSA DE COLOMBIA", answer: ["shakira is the most famous singer in colombia"] },
    { spanish: "ALASKA ES MAS FRIA QUE COLOMBIA", answer: ["alaska is colder than colombia"] },
    { spanish: "ELLOS SON MAS AMABLES QUE MIS PARIENTES", answer: ["they are kinder than my relatives"] },
    { spanish: "TU ERES MAS FLACO QUE LUCAS", answer: ["you are thinner than lucas"] },
];

// --- VOCABULARIES ---
const exCompVocab = { "escritorio " : "desk", "limpio": "clean", "ancho": "wide", "avenida": "avenue"};
const exSupVocab = { "barrio": "neighborhood", "pequeño": "small" , "salon de clase" : "classroom" , "pelicula" : "movie" };
const exMonoVocab = { "cálida": "warmer", "delgada": "thinner", "caliente": "hot", "frío": "cold" };
const exBisVocab = { "chévere": "cool/nice", "tierno": "tender" };
const exLongVocab = { "caro": "expensive", "peligroso": "dangerous", "artículo": "article", "revista": "magazine", "elegante": "elegant", "famoso": "famous", "difícil": "difficult", "moderna": "modern" };
const exIrregVocab = { "mejor": "best/better", "lejos": "farther/further", "peor": "worst/worse", "delicioso": "delicious", "aburridor": "boring" };
const exEqualityVocab = { "tan ... como": "as ... as", "alto": "tall", "caro": "expensive", "inteligente": "intelligent" };
const exInferiorityVocab = { "menos ... que": "less ... than", "interesante": "interesting", "tímida": "shy" };
const exMixed2Vocab = { "edna ": "edna" };
const exMixed3Vocab = { "cantante": "singer", "famosa": "famous", "fría": "colder", "amables": "kinder", "flaco": "thinner", "mejor": "best" };

// --- HELPERS ---

const AdjectiveTableExercise = ({ data, onComplete, title }: { data: any[], onComplete: () => void, title: string }) => {
    const { toast } = useToast();
    const [answers, setAnswers] = useState<Record<number, Record<string, string>>>(
        data.reduce((acc, _, i) => ({ ...acc, [i]: { pos: '', comp: '', sup: '' } }), {})
    );
    const [validation, setValidation] = useState<Record<number, Record<string, 'correct' | 'incorrect' | 'unchecked'>>>(
        data.reduce((acc, _, i) => ({ ...acc, [i]: { pos: 'unchecked', comp: 'unchecked', sup: 'unchecked' } }), {})
    );

    const handleCheck = () => {
        let allOk = true;
        const newVal: any = {};
        data.forEach((item, i) => {
            newVal[i] = {};
            ['pos', 'comp', 'sup'].forEach(field => {
                const user = (answers[i][field] || '').trim().toLowerCase().replace(/\s+/g, ' ');
                const correct = item.answers[field].toLowerCase();
                if (user === correct) {
                    newVal[i][field] = 'correct';
                } else {
                    newVal[i][field] = 'incorrect';
                    allOk = false;
                }
            });
        });
        setValidation(newVal);
        if (allOk) {
            toast({ title: "¡Excelente!", description: "Has completado la tabla correctamente." });
            onComplete();
        } else {
            toast({ variant: 'destructive', title: "Sigue intentando", description: "Revisa las celdas en rojo." });
        }
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
            <CardHeader><CardTitle>{title}</CardTitle><CardDescription>Completa las tres formas del adjetivo en inglés.</CardDescription></CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="font-bold">ADJETIVO (ES)</TableHead>
                                <TableHead className="font-bold">POSITIVO (EN)</TableHead>
                                <TableHead className="font-bold">COMPARATIVOS</TableHead>
                                <TableHead className="font-bold">SUPERLATIVOS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item, i) => (
                                <TableRow key={i}>
                                    <TableCell className="font-bold uppercase text-xs">{item.spanish}</TableCell>
                                    <TableCell><Input value={answers[i].pos} onChange={e => setAnswers(p => ({...p, [i]: {...p[i], pos: e.target.value}}))} className={cn("h-10 text-sm", validation[i].pos === 'correct' ? 'border-green-500 bg-green-50/5' : validation[i].pos === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" /></TableCell>
                                    <TableCell><Input value={answers[i].comp} onChange={e => setAnswers(p => ({...p, [i]: {...p[i], comp: e.target.value}}))} className={cn("h-10 text-sm", validation[i].comp === 'correct' ? 'border-green-500 bg-green-50/5' : validation[i].comp === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" /></TableCell>
                                    <TableCell><Input value={answers[i].sup} onChange={e => setAnswers(p => ({...p, [i]: {...p[i], sup: e.target.value}}))} className={cn("h-10 text-sm", validation[i].sup === 'correct' ? 'border-green-500 bg-green-50/5' : validation[i].sup === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter className="justify-center border-t pt-4">
                <Button onClick={handleCheck} size="lg" className="px-12">Verificar Misión</Button>
            </CardFooter>
        </Card>
    );
};

const BallsExercise = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => {
        setCurrentIndex(0); setAnswer(''); setStatus({});
    }, [prompts]);

    useEffect(() => {
        setAnswer('');
    }, [currentIndex]);

    const currentPrompt = prompts[currentIndex];
    if (!currentPrompt) return null;

    const handleCheck = () => {
        const userVal = answer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const corrects = currentPrompt.answer || currentPrompt.english;
        const isCorrect = corrects.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Buen trabajo!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="w-full text-left">
                        <CardTitle>{title}</CardTitle>
                        <CardDescription className='font-bold text-foreground mt-1'>Traduce la frase correctamente.</CardDescription>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-foreground text-left">
                                        {Object.entries(vocabulary).map(([es, en]: any) => (<React.Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-semibold text-right">{en}</span></React.Fragment>))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">{currentPrompt.spanish}</div>
                <Input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-12 text-lg text-foreground", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/5' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder="Tu traducción..." autoComplete="off" />
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

const ManualGradingExercise = ({ 
    title,
    description,
    onComplete, 
    studentDocRef, 
    initialData, 
    initialGrades,
    savePath, 
    savePathGrades,
    isAdmin,
    lineCount = 21,
}: any) => {
    const [lines, setLines] = useState<string[]>(Array(lineCount).fill(''));
    const [grades, setGrades] = useState<Record<number, 'correct' | 'incorrect' | null>>(initialGrades || {});
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!initializedRef.current && initialData && Array.isArray(initialData)) {
            const newLines = [...Array(lineCount).fill('')];
            initialData.forEach((val, i) => { if (i < lineCount) newLines[i] = val || ''; });
            setLines(newLines);
            if (initialData.length > 0) initializedRef.current = true;
        }
    }, [initialData, lineCount]);

    const handleLineChange = (index: number, value: string) => {
        const newLines = [...lines];
        newLines[index] = value;
        setLines(newLines);
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [savePath]: newLines });
    };

    const handleToggleGrade = (index: number, type: 'correct' | 'incorrect') => {
        if (!isAdmin) return;
        const newGrades = { ...grades };
        newGrades[index] = newGrades[index] === type ? null : type;
        setGrades(newGrades);
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [savePathGrades]: newGrades });
    };

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg text-primary">
                        {title.includes('DICTATION') ? <Mic className="h-6 w-6" /> : <Pencil className="h-6 w-6" />}
                    </div>
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                    {lines.map((line, idx) => {
                        const status = grades[idx];
                        const isTitleLine = idx === 0 && title.includes('DICTATION');
                        return (
                            <div key={idx} className="flex items-center gap-3">
                                <span className={cn("font-bold w-8 text-right", isTitleLine ? "text-primary" : "text-muted-foreground")}>
                                    {idx + 1}.
                                </span>
                                <Input 
                                    value={line} 
                                    onChange={e => handleLineChange(idx, e.target.value)} 
                                    className={cn(
                                        "flex-1 text-lg h-10 transition-all",
                                        isTitleLine && "font-bold border-primary/50",
                                        status === 'correct' ? 'border-green-500 bg-green-50/5' : 
                                        status === 'incorrect' ? 'border-red-500 bg-red-50/5' : ''
                                    )} 
                                    placeholder={isTitleLine ? "Escribe el título aquí..." : "Escribe aquí..."}
                                    autoComplete="off" 
                                />
                                <div className="flex gap-1 shrink-0">
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        onClick={() => handleToggleGrade(idx, 'correct')} 
                                        className={cn(
                                            "h-8 w-8 rounded-full transition-colors", 
                                            status === 'correct' ? "bg-green-500 text-white hover:bg-green-600" : "bg-muted text-muted-foreground opacity-50"
                                        )} 
                                        disabled={!isAdmin}
                                    >
                                        <Check className="h-4 w-4"/>
                                    </Button>
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        onClick={() => handleToggleGrade(idx, 'incorrect')} 
                                        className={cn(
                                            "h-8 w-8 rounded-full transition-colors", 
                                            status === 'incorrect' ? "bg-red-500 text-white hover:bg-red-600" : "bg-muted text-muted-foreground opacity-50"
                                        )} 
                                        disabled={!isAdmin}
                                    >
                                        <X className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
            <CardFooter className="pt-6 border-t flex justify-center">
                <Button onClick={onComplete} size="lg" className="px-16 font-bold h-14 text-xl">
                    Avanzar <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
            </CardFooter>
        </Card>
    );
};

// --- MAIN CONTENT COMPONENT ---

export default function Class13Content({ overrideStudentId }: { overrideStudentId?: string | null }) {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const currentUID = overrideStudentId || user?.uid;
    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const [learningPath, setLearningPath] = useState<any[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(vocabularyData.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(vocabularyData.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const initialLearningPath = useMemo(() => [
        { key: 'vocabulario', name: 'Vocabulario (Adjetivos)', icon: BookOpen, status: 'active' },
        { key: 'grados', name: 'Grados de los Adjetivos', icon: Scale, status: 'locked' },
        { key: 'grammar_comp', name: 'Gramática: Comparativos', icon: GraduationCap, status: 'locked' },
        { key: 'ex_comp', name: 'Ejercicios Comparativos', icon: PenSquare, status: 'locked' },
        { key: 'grammar_sup', name: 'Gramática: Superlativos', icon: GraduationCap, status: 'locked' },
        { key: 'ex_sup', name: 'Ejercicios Superlativos', icon: PenSquare, status: 'locked' },
        { key: 'formacion', name: 'Formación', icon: Info, status: 'locked' },
        { key: 'monosilabos', name: 'Monosílabos', icon: Info, status: 'locked' },
        { key: 'ex_mono', name: 'Ejercicios Monosílabos', icon: PenSquare, status: 'locked' },
        { key: 'bisilabos', name: 'Bisílabos', icon: Info, status: 'locked' },
        { key: 'ex_bis', name: 'Ejercicios Bisílabos', icon: PenSquare, status: 'locked' },
        { key: 'largos', name: 'Largos', icon: Info, status: 'locked' },
        { key: 'ex_largos', name: 'Ejercicios largos', icon: PenSquare, status: 'locked' },
        { key: 'irregulares', name: 'Irregulares', icon: Zap, status: 'locked' },
        { key: 'ex_irreg', name: 'Ejercicios Irregulares', icon: PenSquare, status: 'locked' },
        { key: 'ex_mixto_1', name: 'Ejercicios Mixto 1', icon: PenSquare, status: 'locked' },
        { key: 'igualdad', name: 'Comparativo Igualdad', icon: Scale, status: 'locked' },
        { key: 'ex_igual', name: 'Ejercicio Igualdad', icon: PenSquare, status: 'locked' },
        { key: 'inferioridad', name: 'Comparativo de Inferioridad', icon: Scale, status: 'locked' },
        { key: 'ex_inf', name: 'Ejercicio Inferioridad', icon: PenSquare, status: 'locked' },
        { key: 'ex_mixto_2', name: 'Ejercicio Mixto 2', icon: PenSquare, status: 'locked' },
        { key: 'ex_mixto_3', name: 'Ejercicio Mixto 3', icon: PenSquare, status: 'locked' },
        { key: 'dictation', name: 'Dictation', icon: Mic, status: 'locked' },
    ], []);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
        let path = initialLearningPath.map(t => ({ ...t }));
        let savedST = '';
        
        const d = studentProfile.lessonProgress?.[progressStorageVersion] || {};
        path.forEach(t => { if (d[t.key]) (t as any).status = d[t.key]; });
        savedST = d.lastSelectedTopic || '';

        if (isAdmin) path.forEach(t => (t as any).status = (t as any).status === 'locked' ? 'active' : (t as any).status);

        let lastDone = true;
        for(let i=0; i < path.length; i++) { if (lastDone && (path[i] as any).status === 'locked') (path[i] as any).status = 'active'; lastDone = (path[i] as any).status === 'completed'; }
        
        setLearningPath(path);
        setSelectedTopic(savedST || path.find(p => p.status === 'active')?.key || path[0].key);
        setInitialLoadComplete(true); setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || !studentDocRef || learningPath.length === 0) return;
        const s: any = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(t => s[t.key] = t.status);
        
        if (JSON.stringify(s) !== JSON.stringify(studentProfile?.lessonProgress?.[progressStorageVersion])) {
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        }
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, progressValue, studentDocRef, initialLoadComplete, selectedTopic, studentProfile, isInitialLoading]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(curr => {
            let win = false; let next: string | null = null;
            const np = curr.map(t => ({ ...t }));
            const idx = np.findIndex(t => t.key === topicToComplete);
            if (idx !== -1 && np[idx].status !== 'completed') {
                np[idx].status = 'completed';
                if (idx + 1 < np.length && np[idx + 1].status === 'locked') {
                    np[idx + 1].status = 'active';
                    win = true;
                    next = np[idx + 1].key;
                }
            }
            if (win) setTimeout(() => toast({ title: "¡Misión completada!" }), 0);
            if (next) { const n = next; setTimeout(() => setSelectedTopic(n), 0); }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const t = learningPath.find(it => it.key === topicKey);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        const auto = ['grados', 'grammar_comp', 'grammar_sup', 'formacion', 'irregulares', 'igualdad', 'inferioridad'];
        if (auto.includes(topicKey)) handleTopicComplete(topicKey);
    };

    const handleCheckVocab = () => {
        let count = 0;
        const nv = vocabularyData.map((v, i) => {
            const ok = v.english.some(e => e.toLowerCase() === vocabAnswers[i].trim().toLowerCase());
            if (ok) count++; return ok ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv);
        if (count >= 1) { setCanAdvanceVocab(true); toast({ title: "¡Buen trabajo!" }); }
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulario':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Vocabulario (Adjetivos)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto text-foreground">
                                {vocabularyData.map((v, i) => (
                                    <React.Fragment key={i}>
                                        <div className="p-2 border rounded bg-white/5 font-medium">{v.spanish}</div>
                                        <Input value={vocabAnswers[i]} onChange={e => { const n = [...vocabAnswers]; n[i] = e.target.value; setVocabAnswers(n); setVocabValidation(vv => { const vvv = [...vv]; vvv[i] = 'unchecked'; return vvv; }); setCanAdvanceVocab(false); }} autoComplete="off" className={cn(vocabValidation[i] === 'correct' ? 'border-green-500' : vocabValidation[i] === 'incorrect' ? 'border-red-500' : '')} />
                                    </React.Fragment>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className='flex justify-between border-t pt-6 mt-4'><Button onClick={handleCheckVocab} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulario')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grados':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 p-6 text-left">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">GRADOS DE LOS ADJETIVOS</CardTitle></CardHeader>
                        <CardContent className="space-y-4 text-foreground font-bold">
                            <p>Existen tres grados de comparación para los adjetivos:</p>
                            <ul className="space-y-2 list-disc pl-5">
                                <li><span className="text-primary">GRADO POSITIVO:</span> El adjetivo en su forma base (Tall, Big). <br/>  ------------------- Susan es alta = Susan is tall.</li> <br/>   
                                <li><span className="text-primary">GRADO COMPARATIVO:</span> Se usa para comparar dos cosas (Taller, Bigger). <br/>  ------------------------- Susan es mas alta que Nick = Susan is taller than Nick </li> <br/>                          
                                <li><span className="text-primary">GRADO SUPERLATIVO:</span> Indica el extremo superior (The tallest, The biggest). <br/>  ------------------------ Susan es la mas alta = Susan is the tallest.</li> <br/>                        
                            </ul>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grados')} size="lg" className="px-12 font-bold">Entendido</Button></CardFooter>
                    </Card>
                );
                case 'grammar_comp':
                    return (
                        <div className="space-y-6 text-left">
                            <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6">
                                <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">GRAMÁTICA: COMPARATIVOS (+ER)</CardTitle></CardHeader>
                                <CardContent className="space-y-6 text-foreground font-bold">
                                    <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                        <h4 className="text-primary font-black uppercase text-sm mb-2">USO:</h4>
                                        <p className="text-lg uppercase">Se usa en inglés para comparar diferencias entre los dos sustantivos a los que modifica.</p>
                                    </div>
    
                                    <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                        <h4 className="text-primary font-black uppercase text-sm mb-2">MODIFICACIÓN DEL ADJETIVO (ADJECTIVE+ ER):</h4>
                                        <div className="font-mono text-xl space-y-1">
                                            <p>small &rarr; <span className="text-primary font-black">SMALLER</span> (más pequeño que)</p>
                                            <p>high &rarr; <span className="text-primary font-black">HIGHER</span> (más alto que)</p>
                                        </div>
                                    </div>
    
                                    <div className="p-6 bg-primary/10 rounded-2xl border-2 border-primary text-center">
                                        <h4 className="text-primary font-black uppercase text-sm mb-2">ESTRUCTURA:</h4>
                                        <p className="font-mono text-lg uppercase">sustantivo + verbo + adjetivo comparativo + than + sustantivo</p>
                                    </div>
    
                                    <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                        <h4 className="text-primary font-black uppercase text-sm mb-4">TOPICS:</h4>
                                        <ul className="space-y-3 text-base font-bold">
                                            <li className="flex gap-2"><span>1-</span> <p>Monosílabos = Adjetivos Cortos <span className="text-primary">(Adjective + ER)</span></p></li>
                                            <li className="flex gap-2"><span>2-</span> <p>Bisílabos = Adjetivos con 2 sílabas <span className="text-primary">(Adjective + ER)</span></p></li>
                                            <li className="flex gap-2"><span>3-</span> <p>Adjetivos Largos = Tienen mas de 2 sílabas <span className="text-primary">(more + adjetivo largo + than)</span></p></li>
                                            <li className="flex gap-2"><span>4-</span> <p>Adjetivos Irregulares = Cambian en todas sus formas</p></li>
                                        </ul>
                                    </div>
                                </CardContent>
                                <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('grammar_comp')} size="lg" className="px-12 font-bold">Continuar</Button></CardFooter>
                            </Card>
                        </div>
                    );
            case 'ex_comp': return <BallsExercise title="Ejercicios Comparativos" prompts={ex_comp} onComplete={() => handleTopicComplete('ex_comp')} vocabulary={exCompVocab} />;
            case 'grammar_sup':
                return (
                    <div className="space-y-6 text-left">
                        <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-foreground">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">GRAMÁTICA: SUPERLATIVOS (+EST)</CardTitle></CardHeader>
                            <CardContent className="space-y-6 font-bold">
                                <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                    <h4 className="text-primary font-black uppercase text-sm mb-2">USO:</h4>
                                    <p className="text-lg uppercase">SE EMPLEA PARA DESCRIBIR UN SUSTANTIVO QUE SE ENCUENTRA EN EL EXTREMO SUPERIOR (EL MAS) Ó EL INFERIOR (EL MENOS).</p>
                                </div>

                                <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                    <h4 className="text-primary font-black uppercase text-sm mb-2">MODIFICACIÓN DEL ADJETIVO (ADJECTIVE+ EST):</h4>
                                    <div className="font-mono text-xl space-y-1">
                                        <p>Tall &rarr; <span className="text-primary font-black">The TALLEST</span> (el más alto)</p>
                                        <p>Fast &rarr; <span className="text-primary font-black">The FASTEST</span> (el más rápido)</p>
                                    </div>
                                </div>

                                <div className="p-6 bg-primary/10 rounded-2xl border-2 border-primary text-center">
                                    <h4 className="text-primary font-black uppercase text-sm mb-2">ESTRUCTURA:</h4>
                                    <p className="font-mono text-lg uppercase">sustantivo + verbo + THE + Adjetivo superlativo + Sustantivos ó complemento</p>
                                </div>

                                <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                    <h4 className="text-primary font-black uppercase text-sm mb-4">TOPICS:</h4>
                                    <ul className="space-y-3 text-base font-bold">
                                        <li className="flex gap-2"><span>1-</span> <p>Monosílabos = Adjetivos Cortos <span className="text-primary">(Adjective + EST)</span></p></li>
                                        <li className="flex gap-2"><span>2-</span> <p>Bisílabos = Adjetivos con 2 sílabas <span className="text-primary">(Adjective + EST)</span></p></li>
                                        <li className="flex gap-2"><span>3-</span> <p>Adjetivos Largos = Tienen mas de 2 sílabas <span className="text-primary">(The Most + adjetivos largos)</span></p></li>
                                        <li className="flex gap-2"><span>4-</span> <p>Adjetivos Irregulares = Cambian en todas sus formas</p></li>
                                    </ul>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('grammar_sup')} size="lg" className="px-12 font-bold">Continuar</Button></CardFooter>
                        </Card>
                    </div>
                );
            case 'ex_sup': return <BallsExercise title="Ejercicios Superlativos" prompts={ex_sup} onComplete={() => handleTopicComplete('ex_sup')} vocabulary={exSupVocab} />;
            case 'formacion':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple p-6 text-left text-foreground">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">FORMACIÓN Y REGLAS</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-4 bg-muted rounded-xl border-l-4 border-primary">
                                <h4 className="font-bold mb-2 uppercase font-black">1. Regla del doblado (CVC)</h4>
                                <p className='font-bold'>Si un adjetivo corto termina en Consonante + Vocal + Consonante, se dobla la última letra.</p>
                                <p className="font-mono mt-2 italic">BIG &rarr; BIGGER / HOT &rarr; HOTTER</p>
                            </div>
                            <div className="p-4 bg-muted rounded-xl border-l-4 border-primary">
                                <h4 className="font-bold mb-2 uppercase font-black">2. Terminados en "Y"</h4>
                                <p className='font-bold'>Cambiamos la "y" por "i" y agregamos ER o EST.</p>
                                <p className="font-mono mt-2 italic">HAPPY &rarr; HAPPIER / THE HAPPIEST</p>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center"><Button onClick={() => handleTopicComplete('formacion')} size="lg" className='px-12 font-bold'>Entendido</Button></CardFooter>
                    </Card>
                );
            case 'monosilabos':
                return (
                    <div className="space-y-6">
                        <Card className="shadow-soft border-2 border-brand-purple p-6 text-left text-foreground">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">MONOSÍLABOS</CardTitle></CardHeader>
                            <CardContent><p className="text-lg font-bold">Adjetivos de una sola sílaba siguen las reglas básicas de (+ER) y (+EST).</p></CardContent>
                        </Card>
                        <AdjectiveTableExercise 
                            title="Misión Monosílabos" 
                            data={monosyllabicTableData} 
                            onComplete={() => handleTopicComplete('monosilabos')} 
                        />
                    </div>
                );
            case 'ex_mono': return <BallsExercise title="Ejercicios Monosílabos" prompts={monoPrompts} onComplete={() => handleTopicComplete('ex_mono')} vocabulary={exMonoVocab} />;
            case 'bisilabos':
                return (
                    <div className="space-y-6">
                        <Card className="shadow-soft border-2 border-brand-purple p-6 text-left text-foreground">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">BISÍLABOS</CardTitle></CardHeader>
                            <CardContent><p className="text-lg font-bold">Adjetivos de dos sílabas que terminan en "y", "le", "er", "ow" suelen comportarse como cortos.</p></CardContent>
                        </Card>
                        <AdjectiveTableExercise 
                            title="Misión Bisílabos" 
                            data={bisyllabicTableData} 
                            onComplete={() => handleTopicComplete('bisilabos')} 
                        />
                    </div>
                );
            case 'ex_bis': return <BallsExercise title="Ejercicios Bisílabos" prompts={bisPrompts} onComplete={() => handleTopicComplete('ex_bis')} vocabulary={exBisVocab} />;
            case 'largos':
                return (
                    <div className="space-y-6">
                        <Card className="shadow-soft border-2 border-brand-purple p-6 text-left text-foreground">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">ADJETIVOS LARGOS</CardTitle></CardHeader>
                            <CardContent className="space-y-4 font-bold">
                                <p>Adjetivos de 3 o más sílabas no usan sufijos.</p>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="p-4 bg-muted rounded-xl text-foreground">
                                        <p className="text-primary font-black">COMPARATIVO</p>
                                        <p className="font-mono">MORE + ADJETIVO</p>
                                    </div>
                                    <div className="p-4 bg-muted rounded-xl text-foreground">
                                        <p className="text-primary font-black">SUPERLATIVO</p>
                                        <p className="font-mono">THE MOST + ADJETIVO</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <AdjectiveTableExercise 
                            title="Misión Adjetivos Largos" 
                            data={longTableData} 
                            onComplete={() => handleTopicComplete('largos')} 
                        />
                    </div>
                );
            case 'ex_largos': return <BallsExercise title="Ejercicios Largos" prompts={longPrompts} onComplete={() => handleTopicComplete('ex_largos')} vocabulary={exLongVocab} />;
            case 'irregulares':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple p-6 text-left text-foreground">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">ADJETIVOS IRREGULARES</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader className="bg-muted"><TableRow><TableHead className='font-black'>Positive</TableHead><TableHead className='font-black'>Comparative</TableHead><TableHead className='font-black'>Superlative</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    <TableRow><TableCell className="font-bold uppercase">GOOD (Bueno)</TableCell><TableCell className="text-primary">Better (Mejor que otro)</TableCell><TableCell className="text-blue-500">The best (El mejor)</TableCell></TableRow>
                                    <TableRow><TableCell className="font-bold uppercase">BAD (Malo)</TableCell><TableCell className="text-red-500">Worse (Peor que otro)</TableCell><TableCell className="text-red-500">The worst (El peor)</TableCell></TableRow>
                                    <TableRow><TableCell className="font-bold uppercase">FAR (Lejos)</TableCell><TableCell className="text-primary">Farther / Further</TableCell><TableCell className="text-blue-500">The farthest / furthest</TableCell></TableRow>
                                    <TableRow><TableCell className="font-bold uppercase">MUCH (Mucho)</TableCell><TableCell className="text-primary">More (mas)</TableCell><TableCell className="text-blue-500">The Most (La mayoria)</TableCell></TableRow>
                                    <TableRow><TableCell className="font-bold uppercase">LITTLE (Poco)</TableCell><TableCell className="text-primary">Less (menos)</TableCell><TableCell className="text-blue-500">The Least (el menos)t</TableCell></TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('irregulares')} size="lg" className='px-12 font-bold'>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'ex_irreg': return <BallsExercise title="Ejercicios Irregulares" prompts={irregularPrompts} onComplete={() => handleTopicComplete('ex_irreg')} vocabulary={exIrregVocab} />;
            case 'ex_mixto_1': return <BallsExercise title="Ejercicio Mixto 1" prompts={[...monoPrompts.slice(0, 3), ...longPrompts.slice(0, 3)]} onComplete={() => handleTopicComplete('ex_mixto_1')} vocabulary={{...exMonoVocab, ...exLongVocab}} />;
           
           
            case 'igualdad':
                return (
                    <div className="space-y-6 text-left">
                        <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">COMPARATIVO DE IGUALDAD</CardTitle></CardHeader>
                            <CardContent className="space-y-6 text-foreground font-bold">
                                <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                    <h4 className="text-primary font-black uppercase text-sm mb-2">USO:</h4>
                                    <p className="text-lg uppercase">Se usa para decir que dos cosas son iguales en una cualidad.</p>
                                </div>

                                <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                    <h4 className="text-primary font-black uppercase text-sm mb-2">AS + ADJETIVO + AS</h4>
                                    <div className="font-mono text-xl space-y-1">
                                        <p>Tall &rarr; <span className="text-primary font-black">Ej: He is As tall as Richard</span> (El es tan alto como Richard)</p>
                                    </div>
                                </div>
                                </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('igualdad')} size="lg" className="px-12 font-bold">Entendido</Button></CardFooter>
                    </Card>
                    </div>
                );

            case 'ex_igual': return <BallsExercise title="Ejercicio de Igualdad" prompts={equalityPrompts} onComplete={() => handleTopicComplete('ex_igual')} vocabulary={exEqualityVocab} />;
            case 'inferioridad':
                return (
                    <div className="space-y-6 text-left">
                        <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">COMPARATIVO DE INFERIORIDAD</CardTitle></CardHeader>
                            <CardContent className="space-y-6 text-foreground font-bold">
                                <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                    <h4 className="text-primary font-black uppercase text-sm mb-2">USO:</h4>
                                    <p className="text-lg uppercase">Se usa para decir que algo es "menos" que otra cosa..</p>
                                </div>

                                <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                    <h4 className="text-primary font-black uppercase text-sm mb-2">LESS + ADJETIVO + THAN</h4>
                                    <div className="font-mono text-xl space-y-1">
                                        <p> &rarr; <span className="text-primary font-black">Ej: Motorola is Less expensive than Iphone</span> <br/> (Motorola es menos caro que el Iphone)</p>
                                    </div>
                                </div>
                                </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('igualdad')} size="lg" className="px-12 font-bold">Entendido</Button></CardFooter>
                    </Card>
                    </div>
                );
            case 'ex_inf': return <BallsExercise title="Ejercicio de Inferioridad" prompts={inferiorityPrompts} onComplete={() => handleTopicComplete('ex_inf')} vocabulary={exInferiorityVocab} />;
            case 'ex_mixto_2': return <BallsExercise title="Ejercicio Mixto 2" prompts={mixed2Prompts} onComplete={() => handleTopicComplete('ex_mixto_2')} vocabulary={exMixed2Vocab} />;
            case 'ex_mixto_3': return <BallsExercise title="Misión Final: Mixto 3" prompts={mixed3Prompts} onComplete={() => handleTopicComplete('ex_mixto_3')} vocabulary={exMixed3Vocab} />;
            case 'dictation':
                return (
                    <ManualGradingExercise 
                        title="DICTATION"
                        description="Escucha y escribe las frases dictadas por tu profesor."
                        onComplete={() => handleTopicComplete('dictation')} 
                        studentDocRef={studentDocRef}
                        initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictationData}
                        initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictationGrades}
                        savePath={`lessonProgress.${progressStorageVersion}.dictationData`}
                        savePathGrades={`lessonProgress.${progressStorageVersion}.dictationGrades`}
                        isAdmin={isAdmin}
                        lineCount={21}
                    />
                );
            default: return null;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-left text-white">
                        <Link href="/ingles/a1/unit/3" className="hover:underline text-sm font-bold text-primary flex items-center gap-2">
                            <ArrowLeft className='h-4 w-4'/> Volver a la Unidad 3
                        </Link>
                        <h1 className="text-4xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase 13 (A1)</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader><CardTitle className='text-primary font-black uppercase text-sm'>Tu Aventura</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="max-h-[60vh] overflow-y-auto pr-2 text-foreground">
                                        <nav><ul className="space-y-1">
                                            {learningPath.map(item => {
                                                const isLocked = item.status === 'locked' && !isAdmin;
                                                const isActive = item.status === 'active';
                                                const Icon = ICONS_CONFIG[item.status as keyof typeof ICONS_CONFIG] || BookOpen;
                                                return (
                                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-bold', isActive && !isAdmin && "animate-pulse-glow")}>
                                                        <div className="flex items-center gap-3">{(item.status === 'completed') ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className="h-5 w-5" />}<span className='truncate max-w-[150px]'>{item.name}</span></div>
                                                        {isLocked && <Lock className="h-4 w-4 text-yellow-500/50" />}
                                                    </li>
                                                );
                                            })}
                                        </ul></nav>
                                    </div>
                                    <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 text-muted-foreground"><span>Progreso</span><span className="font-bold text-foreground">{progressValue}%</span></div><Progress value={progressValue} className="h-1.5" /></div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                    </div>
                </div>
            </main>
        </div>
    );
}