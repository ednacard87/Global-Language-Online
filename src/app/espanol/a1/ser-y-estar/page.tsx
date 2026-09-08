
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, Fragment, Suspense } from 'react';
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
    Check,
    X,
    Info,
    Search,
    Sparkles,
    Activity,
    Smile,
    Pencil
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_a1_ser_estar_mix_v46_negatives_final';
const mainProgressKey = 'progress_a1_es_ser_y_estar';

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const mixedVocab = [
    { en: "TALL", es: "ALTO", cat: "Apariencia y Adjetivos" },
    { en: "SHORT", es: "BAJO", cat: "Apariencia y Adjetivos" },
    { en: "BIG", es: "GRANDE", cat: "Apariencia y Adjetivos" },
    { en: "SMALL", es: "PEQUEÑO", cat: "Apariencia y Adjetivos" },
    { en: "PRETTY", es: "BONITO", cat: "Apariencia y Adjetivos" },
    { en: "UGLY", es: "FEO", cat: "Apariencia y Adjetivos" },
    { en: "THIN", es: "FLACO", cat: "Apariencia y Adjetivos" },
    { en: "FAT", es: "GORDO", cat: "Apariencia y Adjetivos" },
    { en: "YOUNG", es: "JOVEN", cat: "Apariencia y Adjetivos" },
    { en: "OLD", es: "VIEJO", cat: "Apariencia y Adjetivos" },
    { en: "NEW", es: "NUEVO", cat: "Apariencia y Adjetivos" },
    { en: "CHEAP", es: "BARATO", cat: "Apariencia y Adjetivos" },
    { en: "TEACHER", es: "PROFESOR", cat: "Profesiones" },
    { en: "DOCTOR", es: "MÉDICO", cat: "Profesiones" },
    { en: "STUDENT", es: "ESTUDIANTE", cat: "Profesiones" },
    { en: "ENGINEER", es: "INGENIERO", cat: "Profesiones" },
    { en: "NURSE", es: "ENFERMERO", cat: "Profesiones" },
    { en: "LAWYER", es: "ABOGADO", cat: "Profesiones" },
    { en: "CHEF", es: "COCINERO", cat: "Profesiones" },
    { en: "ARTIST", es: "ARTISTA", cat: "Profesiones" },
    { en: "WAITER", es: "MESERO", cat: "Profesiones" },
    { en: "POLICE OFFICER", es: "POLICÍA", cat: "Profesiones" },
    { en: "SCHOOL", es: "ESCUELA", cat: "Lugares Comunes" },
    { en: "PARK", es: "PARQUE", cat: "Lugares Comunes" },
    { en: "RESTAURANTE", es: "RESTAURANTE", cat: "Lugares Comunes" },
    { en: "HOSPITAL", es: "HOSPITAL", cat: "Lugares Comunes" },
    { en: "CHURCH", es: "IGLESIA", cat: "Lugares Comunes" },
    { en: "LIBRARY", es: "BIBLIOTECA", cat: "Lugares Comunes" },
    { en: "BANK", es: "BANCO", cat: "Lugares Comunes" },
    { en: "HOUSE", es: "CASA", cat: "Lugares Comunes" },
    { en: "SUPERMARKET", es: "SUPERMERCADO", cat: "Lugares Comunes" },
    { en: "STREET", es: "CALLE", cat: "Lugares Comunes" },
    { en: "HAPPY", es: "FELIZ", cat: "Emociones y Estados" },
    { en: "SAD", es: "TRISTE", cat: "Emociones y Estados" },
    { en: "ANGRY", es: "ENOJADO", cat: "Emociones y Estados" },
    { en: "BORED", es: "ABURRIDO", cat: "Emociones y Estados" },
    { en: "NERVOUS", es: "NERVIOSO", cat: "Emociones y Estados" },
    { en: "CALM", es: "TRANQUILO", cat: "Emociones y Estados" },
    { en: "TIRED", es: "CANSADO", cat: "Emociones y Estados" },
    { en: "BUSY", es: "OCUPADO", cat: "Emociones y Estados" },
    { en: "SICK", es: "ENFERMO", cat: "Emociones y Estados" },
    { en: "COLD (FEELING)", es: "FRÍO", cat: "Emociones y Estados" },
];

const ex1SerPrompts = [
    { en: "I am a student.", es: ["yo soy estudiante", "soy estudiante"] },
    { en: "She is my sister.", es: ["ella es mi hermana"] },
    { en: "They are from Spain.", es: ["ellos son de españa", "ellas son de españa", "son de españa"] },
    { en: "We are intelligent.", es: ["nosotros somos inteligentes", "nosotras somos inteligentes", "somos inteligentes"] },
    { en: "He is a doctor.", es: ["él es médico", "el es medico", "el es un médico"] },
    { en: "The house is big.", es: ["la casa es grande"] },
    { en: "You are kind.", es: ["tú eres amable", "usted es amable", "eres amable"] },
    { en: "It is Monday.", es: ["hoy es lunes", "es lunes"] },
    { en: "My father is tall.", es: ["mi padre es alto", "mi papá es alto"] },
    { en: "The tables are wooden.", es: ["las mesas son de madera"] },
];

const ex2EstarPrompts = [
    { en: "I am in the park.", es: ["yo estoy en el parque", "estoy en el parque"] },
    { en: "She is tired.", es: ["ella está cansada", "está cansada"] },
    { en: "We are happy today.", es: ["nosotros estamos felices hoy", "estamos felices hoy"] },
    { en: "They are at the restaurant.", es: ["ellos están en el restaurante", "están en el restaurante"] },
    { en: "He is sick.", es: ["él está enfermo", "está enfermo"] },
    { en: "The cats are on the table.", es: ["los gatos están en la mesa", "los gatos están sobre la mesa"] },
    { en: "You are at school.", es: ["tú estás en la escuela", "usted está en la escuela", "estás en la escuela"] },
    { en: "It is raining.", es: ["está lloviendo"] },
    { en: "My mother is at work.", es: ["mi madre está en el trabajo", "mi mamá está en el trabajo"] },
    { en: "We are in the city.", es: ["nosotros estamos en la ciudad", "estamos en la ciudad"] },
];

const ex3MixPrompts = [
    { en: "I am tall and I am in the garden.", es: ["yo soy alto y estoy en el jardín", "soy alto y estoy en el jardin"] },
    { en: "She is a doctor and she is at the hospital.", es: ["ella es médica y está en el hospital", "ella es medico y esta en el hospital"] },
    { en: "We are happy because we are on vacation.", es: ["estamos felices porque estamos de vacaciones"] },
    { en: "The car is blue and it is in the street.", es: ["el carro es azul y está en la calle"] },
    { en: "Are you serious? No, I am funny.", es: ["¿eres serio? no, soy divertido", "¿es usted serio? no, soy divertido"] },
    { en: "They are my parents and they are in the house.", es: ["ellos son mis padres y están en la casa"] },
    { en: "Is he sick? Yes, he is at home.", es: ["¿está enfermo? sí, está en casa", "¿el esta enfermo? si, esta en casa"] },
    { en: "The soup is hot.", es: ["la sopa está caliente"] },
    { en: "We are from Mexico but we are in Colombia.", es: ["somos de méxico pero estamos en colombia", "somos de mexico pero estamos en colombia"] },
    { en: "The teacher is intelligent.", es: ["el profesor es inteligente", "la profesora es inteligente"] },
    { en: "My brother is at the bank.", es: ["mi hermano está en el banco"] },
    { en: "The park is big and it is clean.", es: ["el parque es grande y está limpio"] },
    { en: "Are the keys on the table?", es: ["¿están las llaves en la mesa?", "¿las llaves estan en la mesa?"] },
    { en: "She is my friend and she is very kind.", es: ["ella es mi amiga y es muy amable"] },
    { en: "The sky is grey and it is cloudy.", es: ["el cielo es gris y está nublado"] },
    { en: "I am busy right now.", es: ["estoy ocupado ahora mismo", "estoy ocupada ahora mismo"] },
    { en: "He is an engineer and he is young.", es: ["él es ingeniero y es joven"] },
    { en: "The coffee is without sugar.", es: ["el café es sin azúcar", "el café no tiene azúcar"] },
    { en: "They are at the supermarket.", es: ["ellos están en el supermercado"] },
    { en: "I am a student and I am at the library.", es: ["soy estudiante y estoy en la biblioteca"] },
];

const finalNegativePrompts = [
    { en: "I am not a student.", es: ["yo no soy estudiante", "no soy estudiante"] },
    { en: "She is not my sister.", es: ["ella no es mi hermana", "no es mi hermana"] },
    { en: "We are not in Paris.", es: ["nosotros no estamos en parís", "no estamos en paris"] },
    { en: "They are not tired.", es: ["ellos no están cansados", "no estan cansados"] },
    { en: "He is not an engineer.", es: ["él no es ingeniero", "no es ingeniero"] },
    { en: "The coffee is not hot.", es: ["el café no está caliente", "el cafe no esta caliente"] },
    { en: "You are not busy.", es: ["tú no estás ocupado", "no estás ocupado"] },
    { en: "The cats are not white.", es: ["los gatos no son blancos", "no son blancos"] },
    { en: "My father is not here.", es: ["mi padre no está aquí", "mi papá no está aquí"] },
    { en: "We are not doctors.", es: ["no somos médicos", "no somos medicos"] },
    { en: "I am not a teacher.", es: ["yo no soy profesor", "yo no soy profesora", "no soy profesor"] },
    { en: "She is not in the kitchen.", es: ["ella no está en la cocina", "no está en la cocina"] },
    { en: "We are not tired.", es: ["nosotros no estamos cansados", "no estamos cansados"] },
    { en: "They are not from Italy.", es: ["ellos no son de italia", "ellas no son de italia"] },
    { en: "He is not at the office.", es: ["él no está en la oficina", "no está en la oficina"] },
    { en: "The book is not on the desk.", es: ["el libro no está en el escritorio"] },
    { en: "You are not sad.", es: ["tú no estás triste", "usted no está triste", "no estás triste"] },
    { en: "It is not cold today.", es: ["no hace frío hoy", "no está frío hoy"] },
    { en: "My friends are not here.", es: ["mis amigos no están aquí"] },
    { en: "The restaurant is not open.", es: ["el restaurante no está abierto"] },
    { en: "I am not hungry.", es: ["yo no tengo hambre", "no tengo hambre"] },
    { en: "She is not my cousin.", es: ["ella no es mi prima"] },
    { en: "We are not at the library.", es: ["nosotros no estamos en la biblioteca", "no estamos en la biblioteca"] },
    { en: "The car is not new.", es: ["el carro no es nuevo"] },
    { en: "You are not at the bank.", es: ["tú no estás en el banco", "usted no está en el banco"] },
];

const finalExPrompts = [
    { en: "1. Yo _______ de Colombia.", answer: ["soy"] },
    { en: "2. Tú _______ muy cansado hoy.", answer: ["estás"] },
    { en: "3. Ella _______ una excelente profesora.", answer: ["es"] },
    { en: "4. Nosotros _______ en el restaurante.", answer: ["estamos"] },
    { en: "5. El café _______ caliente.", answer: ["está"] },
    { en: "6. Madrid _______ en España.", answer: ["está"] },
    { en: "7. Mis padres _______ médicos.", answer: ["son"] },
    { en: "8. ¿Tú _______ feliz?", answer: ["estás"] },
    { en: "9. La mesa _______ de madera.", answer: ["es"] },
    { en: "10. Ellos _______ enojados contigo.", answer: ["están"] },
    { en: "11. Yo _______ en la oficina ahora.", answer: ["estoy"] },
    { en: "12. La película _______ muy aburrida.", answer: ["es"] },
    { en: "13. Nosotros _______ hermanos.", answer: ["somos"] },
    { en: "14. El gato _______ sobre el sofá.", answer: ["está"] },
    { en: "15. ¿Dónde _______ mis llaves?", answer: ["están"] },
    { en: "16. Ella _______ inteligente y bonita.", answer: ["es"] },
    { en: "17. El cielo _______ azul.", answer: ["es"] },
    { en: "18. Los niños _______ en la escuela.", answer: ["están"] },
    { en: "19. Yo _______ muy ocupado.", answer: ["estoy"] },
    { en: "20. Ustedes _______ de Estados Unidos.", answer: ["son"] },
    { en: "21. El agua _______ fría.", answer: ["está"] },
    { en: "22. Mi hermano _______ ingeniero.", answer: ["es"] },
    { en: "23. ¿Cómo _______ tu abuela hoy?", answer: ["está"] },
    { en: "24. La casa _______ blanca.", answer: ["es"] },
    { en: "25. Nosotros _______ perdidos.", answer: ["estamos"] },
    { en: "26. Tú _______ un buen amigo.", answer: ["eres"] },
    { en: "27. Hoy _______ martes.", answer: ["es"] },
    { en: "28. Las flores _______ marchitas.", answer: ["están"] },
    { en: "29. Yo _______ alto y moreno.", answer: ["soy"] },
    { en: "30. El hospital _______ lejos de aquí.", answer: ["está"] },
];

const readingData = {
    title: "Un día con mi familia",
    content: "Hoy es domingo. Mi familia y yo estamos en la finca. La finca es muy grande y hermosa. El clima está soleado y hace calor. Mi padre es médico, pero hoy está relajado. Mi madre es muy alegre. Mis hermanos están en la piscina porque el agua está fresca. Yo soy un estudiante de español y estoy muy emocionado por mi viaje a Madrid el próximo mes.",
    questions: [
        { id: 'q1', q: "¿Dónde está la familia?", a: ["en la finca"] },
        { id: 'q2', q: "¿Cómo es la finca?", a: ["grande y hermosa"] },
        { id: 'q3', q: "¿Cuál es la profesión del padre?", a: ["médico", "medico"] },
        { id: 'q4', q: "¿Cómo está el clima?", a: ["soleado"] },
        { id: 'q5', q: "¿Por qué están los hermanos en la piscina?", a: ["el agua está fresca", "el agua esta fresca"] },
    ]
};

const globalVocabMap: Record<string, string> = mixedVocab.reduce((acc, curr) => {
    acc[curr.es.toLowerCase()] = curr.en.toLowerCase();
    return acc;
}, {} as Record<string, string>);

// --- HELPER COMPONENTS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary, userAnswers, setUserAnswers, validationStatus, setValidationStatus, isAdmin, isSupervisionMode, isFinal = false }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [localAnswer, setLocalAnswer] = useState(userAnswers[currentIndex] || '');

    useEffect(() => {
        setLocalAnswer(userAnswers[currentIndex] || '');
    }, [currentIndex, userAnswers]);

    const handleAnswerChange = (val: string) => {
        if (isSupervisionMode) return;
        setLocalAnswer(val);
        const newAnswers = { ...userAnswers, [currentIndex]: val };
        setUserAnswers(newAnswers);
    };

    const handleCheck = () => {
        const newVal: Record<number, 'correct' | 'incorrect'> = {};
        let allOk = true;
        prompts.forEach((p: any, i: number) => {
            const user = (userAnswers[i] || '').trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
            const rawCorrects = p.es || p.answer;
            const corrects = (Array.isArray(rawCorrects) ? rawCorrects : [rawCorrects])
                .filter(a => typeof a === 'string')
                .map((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' '));
            
            const isOk = corrects.includes(user);
            newVal[i] = isOk ? 'correct' : 'incorrect';
            if (!isOk) allOk = false;
        });
        setValidationStatus(newVal);
        if (allOk) toast({ title: "¡Excelente!", description: "Todas tus respuestas son correctas." });
        else toast({ variant: 'destructive', title: "Hay errores", description: "Revisa las marcas rojas en las burbujas." });
    };

    const allCorrect = Object.keys(validationStatus).length === prompts.length && Object.values(validationStatus).every(v => v === 'correct');

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="text-left">
                        <CardTitle className='text-primary uppercase font-black'>{title}</CardTitle>
                        <CardDescription className='font-bold text-foreground mt-1'>Traduce la frase correctamente.</CardDescription>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", validationStatus[i] === 'correct' ? "bg-green-500 text-white border-green-500" : validationStatus[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4 text-left">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-foreground">
                                        {Object.entries(vocabulary).map(([es, en]: any) => (<Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-semibold text-right text-primary">{(en || '').toUpperCase()}</span></Fragment>))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">
                    {prompts[currentIndex]?.en || prompts[currentIndex]?.spanish}
                </div>
                <Input value={localAnswer} onChange={e => handleAnswerChange(e.target.value)} className={cn("h-12 text-lg text-foreground")} placeholder="Tu traducción..." autoComplete="off" readOnly={isSupervisionMode} />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    {currentIndex === prompts.length - 1 && !isSupervisionMode && (
                        <Button onClick={handleCheck} variant="secondary">Verificar</Button>
                    )}
                    {isFinal && allCorrect ? (
                        <Button onClick={onComplete} className="bg-green-600 hover:bg-green-700 text-white font-bold px-8">TERMINAR</Button>
                    ) : (
                        <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : (!isFinal && (allCorrect || isAdmin) ? onComplete() : null)} disabled={currentIndex === prompts.length - 1 && !allCorrect && !isAdmin} className="text-white font-bold">
                            {currentIndex === prompts.length - 1 ? (isFinal ? 'Terminar' : 'Continuar') : 'Siguiente'}
                        </Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
};

// --- MAIN PAGE ---

function SerYEstarContent() {
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
    const [vocabAns, setVocabAns] = useState<string[]>(Array(mixedVocab.length).fill(''));
    const [vocabVal, setVocabVal] = useState<any[]>(Array(mixedVocab.length).fill('unchecked'));
    const [ex1Ans, setEx1Ans] = useState<Record<number, string>>({});
    const [ex1Val, setEx1Val] = useState<Record<number, any>>({});
    const [ex2Ans, setEx2Ans] = useState<Record<number, string>>({});
    const [ex2Val, setEx2Val] = useState<Record<number, any>>({});
    const [ex3Ans, setEx3Ans] = useState<Record<number, string>>({});
    const [ex3Val, setEx3Val] = useState<Record<number, any>>({});
    const [readAns, setReadAns] = useState<Record<string, string>>({});
    const [readVal, setReadVal] = useState<Record<string, any>>({});
    const [negAns, setNegAns] = useState<Record<number, string>>({});
    const [negVal, setNegVal] = useState<Record<number, any>>({});
    const [finalAns, setFinalAns] = useState<Record<number, string>>({});
    const [finalVal, setFinalVal] = useState<Record<number, any>>({});
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
        { key: 'exercise1', name: '3. Ejercicio 1 (SER)', icon: PenSquare, status: 'locked' },
        { key: 'exercise2', name: '4. Ejercicio 2 (ESTAR)', icon: PenSquare, status: 'locked' },
        { key: 'exercise3', name: '5. Ejercicio 3 (Mix)', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'reading', name: '7. Lectura', icon: BookText, status: 'locked' },
        { key: 'negative_final', name: '8. Negativos', icon: Pencil, status: 'locked' },
        { key: 'translate', name: '9. Traducir Texto', icon: Pencil, status: 'locked' },
        { key: 'final', name: '10. Ejercicio Final', icon: Trophy, status: 'locked' },
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
        if (d.negAns) setNegAns(d.negAns);
        if (d.transText) setTransText(d.transText);
        if (d.finalAns) setFinalAns(d.finalAns);
        if (d.isFinished) setIsFinished(d.isFinished);
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
        const s: any = { lastSelectedTopic: selectedTopic, vocabAns, ex1Ans, ex2Ans, ex3Ans, readAns, negAns, transText, finalAns, isFinished };
        learningPath.forEach(t => s[t.key] = t.status);
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, targetStudentId, initialLoadComplete, vocabAns, ex1Ans, ex2Ans, ex3Ans, readAns, negAns, transText, finalAns, isFinished]);

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
        let allOk = true; 
        const nv = mixedVocab.map((v, i) => {
            const user = (vocabAns[i] || '').trim().toLowerCase();
            const res = v.es.toLowerCase() === user;
            if (!res) allOk = false;
            return res ? 'correct' : 'incorrect';
        });
        setVocabVal(nv);
        if (allOk) toast({ title: "¡Vocabulario correcto!" });
        else toast({ variant: 'destructive', title: "Sigue intentando", description: "Revisa las palabras en rojo." });
    };

    const handleReadingCheck = () => {
        let allOk = true; const nv: any = {};
        readingData.questions.forEach(q => {
            const userAns = (readAns[q.id] || '').trim().toLowerCase();
            const isOk = q.a.some(a => userAns.includes(a.toLowerCase()));
            nv[q.id] = isOk ? 'correct' : 'incorrect'; if (!isOk) allOk = false;
        });
        setReadVal(nv); if (allOk) toast({ title: "¡Lectura correcta!" }); else toast({ variant: 'destructive', title: "Revisa las respuestas" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                const vocabAllOk = vocabVal.length > 0 && vocabVal.every((v: any) => v === 'correct');
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><CardTitle>Vocabulario Mixto A1</CardTitle><CardDescription className='font-bold text-foreground'>Escribe la definición en español para cada palabra.</CardDescription></CardHeader>
                        <CardContent>
                            <Accordion type="multiple" defaultValue={['Apariencia y Adjetivos']} className="w-full">
                                {["Apariencia y Adjetivos", "Profesiones", "Lugares Comunes", "Emociones y Estados"].map(cat => (
                                    <AccordionItem key={cat} value={cat}>
                                        <AccordionTrigger className="capitalize font-black text-primary text-sm tracking-widest">{cat}</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="font-black text-muted-foreground uppercase tracking-widest text-[10px] border-b pb-1">English</div><div className="font-black text-muted-foreground uppercase tracking-widest text-[10px] border-b pb-1">Español</div>
                                                {mixedVocab.filter(v => v.cat === cat).map((v, i) => {
                                                    const globalIdx = mixedVocab.findIndex(orig => orig.en === v.en);
                                                    return (
                                                        <Fragment key={i}>
                                                            <div className="flex items-center font-bold py-1 text-sm">{v.en}</div>
                                                            <Input 
                                                                value={vocabAns[globalIdx] || ''} 
                                                                onChange={e => { if (targetStudentId) return; const na = [...vocabAns]; na[globalIdx] = e.target.value; setVocabAns(na); const nv = [...vocabVal]; nv[globalIdx] = 'unchecked'; setVocabVal(nv); }} 
                                                                className={cn("uppercase transition-all", vocabVal[globalIdx] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabVal[globalIdx] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} 
                                                                autoComplete="off" 
                                                                readOnly={!!targetStudentId} 
                                                            />
                                                        </Fragment>
                                                    );
                                                })}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6">
                            <Button onClick={handleCheckVocab} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary')} disabled={!vocabAllOk && !isAdmin} className='text-white font-bold'>Continuar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-8 text-left text-foreground overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">SER vs ESTAR</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0">
                            <div className="grid md:grid-cols-2 gap-8 font-bold text-black dark:text-white">
                                <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                    <h3 className="text-xl font-black text-primary uppercase mb-4 flex items-center gap-2"><Star className="h-5 w-5" /> Verbo SER</h3>
                                    <p className="mb-4 text-sm font-medium">Se usa para cualidades <strong>permanentes</strong> o esenciales.</p>
                                    <ul className="space-y-2 text-sm italic">
                                        <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" /> Identidad (Soy Juan)</li>
                                        <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" /> Profesión (Es médica)</li>
                                        <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" /> Origen (Son de México)</li>
                                    </ul>
                                </div>
                                <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                    <h3 className="text-xl font-black text-brand-purple uppercase mb-4 flex items-center gap-2"><Activity className="h-5 w-5" /> Verbo ESTAR</h3>
                                    <p className="mb-4 text-sm font-medium">Se usa para estados <strong>temporales</strong> o ubicación.</p>
                                    <ul className="space-y-2 text-sm italic">
                                        <li className="flex items-center gap-2"><Check className="h-3 w-3 text-brand-purple" /> Ubicación (Está en el parque)</li>
                                        <li className="flex items-center gap-2"><Check className="h-3 w-3 text-brand-purple" /> Salud (Estoy enfermo)</li>
                                        <li className="flex items-center gap-2"><Check className="h-3 w-3 text-brand-purple" /> Emociones (Están felices)</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'exercise1': return <BallsExercise title="Ejercicio 1: Verbo SER" prompts={ex1SerPrompts} onComplete={() => handleTopicComplete('exercise1')} userAnswers={ex1Ans} setUserAnswers={setEx1Ans} validationStatus={ex1Val} setValidationStatus={setEx1Val} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={globalVocabMap} />;
            case 'exercise2': return <BallsExercise title="Ejercicio 2: Verbo ESTAR" prompts={ex2EstarPrompts} onComplete={() => handleTopicComplete('exercise2')} userAnswers={ex2Ans} setUserAnswers={setEx2Ans} validationStatus={ex2Val} setValidationStatus={setEx2Val} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={globalVocabMap} />;
            case 'exercise3': return <BallsExercise title="Ejercicio 3: Mix SER y ESTAR" prompts={ex3MixPrompts} onComplete={() => handleTopicComplete('exercise3')} userAnswers={ex3Ans} setUserAnswers={setEx3Ans} validationStatus={ex3Val} setValidationStatus={setEx3Val} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={globalVocabMap} />;
            case 'vocab_game': return <VocabularyMatchingGame data={mixedVocab.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Memory Game: Ser y Estar" />;
            case 'reading':
                const readingOk = Object.values(readVal).length === readingData.questions.length && Object.values(readVal).every(v => v === 'correct');
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='uppercase font-black text-primary'>{readingData.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner text-foreground">{readingData.content}</div>
                            <Separator /><div className="space-y-4">{readingData.questions.map((q, i) => (
                                <div key={i} className="space-y-2"><Label className='font-bold text-foreground'>{q.q}</Label><Input value={readAns[q.id] || ''} onChange={e => { if (targetStudentId) return; setReadAns({...readAns, [q.id]: e.target.value}); setReadVal({...readVal, [q.id]: 'unchecked'}); }} className={cn('h-12', readVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[q.id] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                            ))}</div>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6">
                            <Button onClick={handleReadingCheck} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('reading')} disabled={!readingOk && !isAdmin} className="font-bold text-white bg-primary">Continuar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'negative_final': return <BallsExercise title="Final (Negativos)" prompts={finalNegativePrompts} onComplete={() => handleTopicComplete('negative_final')} userAnswers={negAns} setUserAnswers={setNegAns} validationStatus={negVal} setValidationStatus={setNegVal} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={globalVocabMap} />;
            case 'translate':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader>
                            <div className='flex justify-between items-center w-full'>
                                <div><CardTitle className='text-primary uppercase'>Traducción de Texto</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el párrafo al español.</CardDescription></div>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                                    <PopoverContent className="w-64">
                                        <ScrollArea className="h-48 pr-4 text-left">
                                            <div className="grid grid-cols-2 gap-2 text-sm text-foreground">
                                                {Object.entries(globalVocabMap).map(([es, en]: any) => (<Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-semibold text-right text-primary">{(en || '').toUpperCase()}</span></Fragment>))}
                                            </div>
                                        </ScrollArea>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed shadow-sm text-foreground">"My name is John. I am a tall and friendly student. Today I am at home with my family. My father is an engineer and he is very serious at work, but today he is happy. My mother is a nurse and she is at the hospital now. My sister is young and she is in the park with her dog. The weather is sunny and the sky is blue. We are a happy family."</div>
                            <Separator />
                            <div className="space-y-2">
                                <Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label>
                                <Textarea 
                                    value={transText} 
                                    onChange={(e) => { if (targetStudentId) return; setTransText(e.target.value); }} 
                                    placeholder="Escribe el texto en español aquí..." 
                                    className="min-h-[200px] text-lg text-foreground"
                                    readOnly={!!targetStudentId}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20">
                            <Button onClick={() => handleTopicComplete('translate')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Siguiente Misión <ArrowRight className='ml-3 h-8 w-8' /></Button>
                        </CardFooter>
                    </Card>
                );
            case 'final':
                if (isFinished) {
                    return (
                        <Card className="shadow-soft border-2 border-green-500 bg-green-50/10 p-12 text-center flex flex-col items-center text-foreground">
                            <Trophy className="h-24 w-24 text-yellow-400 mb-6 animate-bounce" />
                            <h2 className="text-4xl font-black uppercase text-green-600 tracking-tighter">¡FELICITACIONES!</h2>
                            <p className="text-2xl mt-4 font-bold">¡Has terminado la clase Ser y Estar!</p>
                            <p className='text-muted-foreground mt-2 text-lg'>Misión completada al 100%.</p>
                            <Button asChild className="mt-8 px-12 h-12 font-bold" variant="outline"><Link href="/espanol/a1">Regresar a la Unidad 2</Link></Button>
                        </Card>
                    );
                }
                return <BallsExercise title="Ejercicio Final" prompts={finalExPrompts} onComplete={() => { setIsFinished(true); handleTopicComplete('final'); }} userAnswers={finalAns} setUserAnswers={setFinalAns} validationStatus={finalVal} setValidationStatus={setFinalVal} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={globalVocabMap} isFinal />;
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
                                <p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión: {studentProfile?.name || targetStudentId}</p>
                            </div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors">
                                <Link href="/admin">Cerrar</Link>
                            </Button>
                        </div>
                    )}
                    
                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/a1" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver al Curso A1</Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3">
                           <Activity className='h-10 w-10 text-primary' /> Ser y Estar 🇪🇸
                        </h1>
                    </div>

                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30">
                                    <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Misión A1</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <nav>
                                        <ul className="space-y-1">
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
                                        </ul>
                                    </nav>
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

export default function SerYEstarPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}>
            <SerYEstarContent />
        </Suspense>
    );
}