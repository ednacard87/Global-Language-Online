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
    MapPin,
    Navigation,
    Check,
    X,
    Info,
    Search
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Footer } from '@/components/footer';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_a1_ubicacion_v10_vocab_fix';
const mainProgressKey = 'progress_a1_es_ubicacion';

const ICONS_MAP = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const cityVocab = [
    // Lugares (22)
    { en: "HOSPITAL", es: "HOSPITAL" },
    { en: "MUSEUM", es: "MUSEO" },
    { en: "PARK", es: "PARQUE" },
    { en: "SUPERMARKET", es: "SUPERMERCADO" },
    { en: "BANK", es: "BANCO" },
    { en: "SCHOOL", es: "ESCUELA" },
    { en: "LIBRARY", es: "BIBLIOTECA" },
    { en: "CHURCH", es: "IGLESIA" },
    { en: "RESTAURANT", es: "RESTAURANTE" },
    { en: "PHARMACY", es: "FARMACIA" },
    { en: "POST OFFICE", es: "OFICINA DE CORREO" },
    { en: "GYM", es: "GIMNASIO" },
    { en: "CINEMA", es: "CINE" },
    { en: "STADIUM", es: "ESTADIO" },
    { en: "AIRPORT", es: "AEROPUERTO" },
    { en: "BUS STATION", es: "ESTACIÓN DE BUS" },
    { en: "SUBWAY STATION", es: "ESTACIÓN DE METRO" },
    { en: "SQUARE", es: "PLAZA" },
    { en: "BOOKSTORE", es: "LIBRERÍA" },
    { en: "BAKERY", es: "PANADERÍA" },
    { en: "BUTCHERY", es: "CARNICERÍA" },
    { en: "DRUGSTORE", es: "DROGUERÍA" },
    // Transportes (10)
    { en: "CAR", es: "CARRO" },
    { en: "BUS", es: "BUS" },
    { en: "TRAIN", es: "TREN" },
    { en: "SUBWAY", es: "METRO" },
    { en: "BICYCLE", es: "BICICLETA" },
    { en: "MOTORCYCLE", es: "MOTO" },
    { en: "AIRPLANE", es: "AVIÓN" },
    { en: "BOAT", es: "BARCO" },
    { en: "TRUCK", es: "CAMIÓN" },
    { en: "TAXI", es: "TAXI" },
];

const ex1Prompts = [
    { en: "The hospital is near.", es: ["el hospital está cerca", "el hospital esta cerca"] },
    { en: "There is a park here.", es: ["hay un parque aquí", "hay un parque aqui"] },
    { en: "The taxi is in the street.", es: ["el taxi está en la calle", "el taxi esta en la calle"] },
    { en: "There is a supermarket.", es: ["hay un supermercado"] },
    { en: "The car is at the bank.", es: ["el carro está en el banco", "el carro esta en el banco"] },
    { en: "There are two buses.", es: ["hay dos buses"] },
    { en: "The museum is open.", es: ["el museo está abierto", "el museo esta abierto"] },
];

const ex2Prompts = [
    { en: "The pharmacy is next to the bank.", es: ["la farmacia está al lado del banco", "la farmacia esta al lado del banco"] },
    { en: "There is a big library.", es: ["hay una biblioteca grande"] },
    { en: "The bus is at the station.", es: ["el bus está en la estación", "el bus esta en la estacion"] },
    { en: "The restaurant is behind the church.", es: ["el restaurante está detrás de la iglesia", "el restaurante esta detras de la iglesia"] },
    { en: "There are many motorcycles.", es: ["hay muchas motos", "hay muchas motocicletas"] },
    { en: "The stadium is far.", es: ["el estadio está lejos", "el estadio esta lejos"] },
    { en: "The bicycle is in the garden.", es: ["la bicicleta está en el jardín", "la bicicleta esta en el jardin"] },
    { en: "There is a post office here.", es: ["hay una oficina de correo aquí", "hay una oficina de correo aqui"] },
];

const ex3Prompts = [
    { en: "The gym is in front of the school.", es: ["el gimnasio está delante de la escuela", "el gimnasio esta en frente de la escuela"] },
    { en: "There is a subway station near the square.", es: ["hay una estación de metro cerca de la plaza", "hay una estacion de metro cerca de la plaza"] },
    { en: "The airplane is at the airport.", es: ["el avión está en el aeropuerto", "el avion esta en el aeropuerto"] },
    { en: "The bakery is between the butchery and the bank.", es: ["la panadería está entre la carnicería y el banco", "la panaderia esta entre la carniceria y el banco"] },
    { en: "There is a truck in the street.", es: ["hay un camión en la calle", "hay un camion en la calle"] },
    { en: "The cinema is inside the mall.", es: ["el cine está dentro del centro comercial", "el cine esta en el centro comercial"] },
    { en: "There are three cars in the square.", es: ["hay tres carros en la plaza"] },
    { en: "The bookstore is next to the cafe.", es: ["la librería está al lado del café", "la libreria esta al lado del cafe"] },
    { en: "The boat is in the water.", es: ["el barco está en el agua", "el barco esta en el agua"] },
    { en: "There is a person in the taxi.", es: ["hay una persona en el taxi"] },
];

const readingData = {
    title: "Un paseo por la ciudad",
    content: "En mi ciudad hay un parque muy grande. Al lado del parque está el museo de arte. El supermercado está en frente del banco. Yo voy a la escuela en bicicleta todos los días. Mi padre trabaja en el hospital y él va en carro. Hoy, nosotros estamos en la plaza principal porque hay un festival de música. La oficina de correo está detrás de la iglesia.",
    questions: [
        { q: "¿Qué hay en la ciudad?", a: ["un parque", "un parque muy grande"] },
        { q: "¿Dónde está el museo?", a: ["al lado del parque"] },
        { q: "¿Cómo va el narrador a la escuela?", a: ["en bicicleta"] },
        { q: "¿Dónde trabaja el padre?", a: ["en el hospital"] },
        { q: "¿Qué hay hoy en la plaza?", a: ["un festival", "un festival de música"] },
    ]
};

const finalExPrompts = [
    { s: "1. Ve derecho por dos cuadras.", a: "go straight for two blocks" },
    { s: "2. Gira a la derecha en la esquina.", a: "turn right on the corner" },
    { s: "3. La farmacia está a la izquierda.", a: "the pharmacy is on the left" },
    { s: "4. Cruza la calle con cuidado.", a: "cross the street carefully" },
    { s: "5. El banco está entre el cine y la tienda.", a: "the bank is between the cinema and the store" },
    { s: "6. Camina hasta el semáforo.", a: "walk to the traffic light" },
    { s: "7. Mi casa está detrás del parque.", a: "my house is behind the park" },
    { s: "8. Hay un museo en este mapa.", a: "there is a museum on this map" },
    { s: "9. Gira a la izquierda en el hospital.", a: "turn left at the hospital" },
    { s: "10. El restaurante está al lado del hotel.", a: "the restaurant is next to the hotel" },
];

const negativePrompts = [
    { en: "There is no hospital here.", es: ["no hay un hospital aquí", "no hay hospital aquí"] },
    { en: "The bus is not at the station.", es: ["el bus no está en la estación", "el bus no esta en la estacion"] },
    { en: "There isn't a bank in this street.", es: ["no hay un banco en esta calle", "no hay banco en esta calle"] },
    { en: "She is not at the library.", es: ["ella no está en la biblioteca", "no está en la biblioteca"] },
    { en: "We are not in the museum.", es: ["nosotros no estamos en el museo", "no estamos en el museo"] },
    { en: "There aren't any cars in the square.", es: ["no hay ningún carro en la plaza", "no hay carros en la plaza"] },
    { en: "The airplane is not at the airport.", es: ["el avión no está en el aeropuerto", "el avion no esta en el aeropuerto"] },
    { en: "There is no pharmacy near the school.", es: ["no hay una farmacia cerca de la escuela", "no hay farmacia cerca de la escuela"] },
    { en: "The train is not coming today.", es: ["el tren no viene hoy"] },
    { en: "There isn't a map on the wall.", es: ["no hay un mapa en la pared", "no hay mapa en la pared"] },
    { en: "They are not at the bus stop.", es: ["ellos no están en la parada de bus", "no estan en la parada de bus"] },
    { en: "The bicycle is not in the house.", es: ["la bicicleta no está en la casa", "la bicicleta no esta en la casa"] },
    { en: "There is no boat in the river.", es: ["no hay un barco en el río", "no hay barco en el rio"] },
    { en: "We don't have a car.", es: ["no tenemos un carro", "nosotros no tenemos un carro"] },
    { en: "The supermarket is not open now.", es: ["el supermercado no está abierto ahora", "el supermercado no esta abierto ahora"] },
];

const translationVocabHelp = {
    "straight": "derecho", "blocks": "cuadras", "corner": "esquina", "turn right": "girar a la derecha",
    "turn left": "girar a la izquierda", "cross": "cruzar", "carefully": "con cuidado", "between": "entre",
    "next to": "al lado de", "behind": "detrás de", "in front of": "delante de", "traffic light": "semáforo"
};

const ex1Vocab = {
    "hospital": "hospital", "cerca": "near", "hay": "there is / there are", "parque": "park",
    "aquí": "here", "taxi": "taxi", "calle": "street", "supermercado": "supermarket",
    "carro": "car", "banco": "bank", "buses": "buses", "abierto": "open"
};

const ex2Vocab = {
    "farmacia": "pharmacy", "al lado de": "next to", "banco": "bank", "biblioteca": "library",
    "grande": "big", "estación": "station", "detrás de": "behind", "iglesia": "church",
    "motos": "motorcycles", "estadio": "stadium", "lejos": "far", "jardín": "garden", "oficina de correo": "post office"
};

const readingVocab = {
    "ciudad": "city", "museo de arte": "art museum", "en frente de": "in front of",
    "bicicleta": "bicycle", "todos los días": "every day", "padre": "father",
    "plaza principal": "main square", "festival de música": "music festival"
};

const globalVocabMap: Record<string, string> = cityVocab.reduce((acc, curr) => {
    acc[curr.es.toLowerCase()] = curr.en.toLowerCase();
    return acc;
}, {} as Record<string, string>);

// --- HELPER COMPONENTS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary, type = 'translate' }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setAnswer(''); }, [currentIndex]);

    const handleCheck = () => {
        const userVal = answer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        let isCorrect = false;
        
        if (type === 'translate') {
            isCorrect = prompts[currentIndex].es.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
        } else {
            isCorrect = userVal === prompts[currentIndex].answer.toLowerCase();
        }
        
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Buen trabajo!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const vocabList = useMemo(() => {
        if (!vocabulary) return [];
        if (Array.isArray(vocabulary)) return vocabulary;
        return Object.entries(vocabulary).map(([es, en]) => ({ es, en: en as string }));
    }, [vocabulary]);

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="text-left text-foreground">
                        <CardTitle>{title}</CardTitle>
                        <CardDescription className="font-bold text-foreground mt-1">Traduce la frase al español.</CardDescription>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabList.length > 0 && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse">
                                    <BookText className="mr-2 h-4 w-4" />
                                    Vocabulary
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-64 pr-4 text-left text-foreground">
                                    <div className="space-y-2">
                                        <h4 className='font-black text-primary text-xs uppercase mb-2 border-b'>Ayuda de Misión</h4>
                                        {vocabList.map((v: any, i: number) => (
                                            <div key={i} className="flex justify-between text-[10px] border-b border-muted pb-1">
                                                <span className="text-muted-foreground uppercase">{v.en}:</span>
                                                <span className="font-bold text-primary">{v.es.toUpperCase()}</span>
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
                    {type === 'translate' ? prompts[currentIndex].en : prompts[currentIndex].word}
                </div>
                <Input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-12 text-lg text-foreground", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/5' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder="Escribe en español..." autoComplete="off" />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck} variant="secondary">Verificar</Button>
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={status[currentIndex] !== 'correct'} className="font-bold text-white">Siguiente</Button>
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

function UbicacionContent() {
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
    const [vocabAnswers, setVocabAnswers] = useState<Record<string, string[]>>({});
    const [vocabValidation, setVocabValidation] = useState<Record<string, any[]>>({});
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const [readingAns, setReadingAns] = useState<string[]>(Array(readingData.questions.length).fill(''));
    const [readingVal, setReadingVal] = useState<any[]>(Array(readingData.questions.length).fill('unchecked'));

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
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'reading', name: '7. Lectura', icon: BookText, status: 'locked' },
        { key: 'final_ex', name: '8. Ejercicio Final', icon: Navigation, status: 'locked' },
        { key: 'translate_text', name: '9. Traducir Texto', icon: MessageSquare, status: 'locked' },
        { key: 'final', name: '10. Final (Negativos)', icon: CheckCircle, status: 'locked' },
    ], []);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (topicKey === 'grammar') handleTopicComplete('grammar');
    };

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
        
        const initAns: Record<string, string[]> = {};
        const initVal: Record<string, any[]> = {};
        Object.keys({ "lugares": cityVocab.slice(0, 22), "transporte": cityVocab.slice(22) }).forEach(cat => {
            initAns[cat] = Array(cat === "lugares" ? 22 : 10).fill('');
            initVal[cat] = Array(cat === "lugares" ? 22 : 10).fill('unchecked');
        });
        setVocabAnswers(initAns);
        setVocabValidation(initVal);

        setInitialLoadComplete(true);
        setTimeout(() => setIsInitialLoading(false), 800);
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

    const handleVocabCheck = () => {
        let okCount = 0;
        const nv: any = {};
        const categories = { "lugares": cityVocab.slice(0, 22), "transporte": cityVocab.slice(22) };
        Object.keys(categories).forEach(cat => {
            nv[cat] = categories[cat as keyof typeof categories].map((v: any, i: number) => {
                const isOk = v.es.toLowerCase() === (vocabAnswers[cat][i] || '').trim().toLowerCase();
                if (isOk) okCount++;
                return isOk ? 'correct' : 'incorrect';
            });
        });
        setVocabValidation(nv);
        if (okCount >= 10) { setCanAdvanceVocab(true); toast({ title: "¡Buen trabajo!" }); }
        else toast({ variant: 'destructive', title: "Necesitas 10 aciertos para avanzar." });
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
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><CardTitle className="text-primary uppercase tracking-tighter">Vocabulario: Ciudad y Transporte</CardTitle><CardDescription className='font-bold text-foreground'>Escribe el significado en español para cada término.</CardDescription></CardHeader>
                        <CardContent className="pt-6">
                            <Accordion type="multiple" defaultValue={['lugares', 'transporte']} className="w-full">
                                {["lugares", "transporte"].map(cat => (
                                    <AccordionItem key={cat} value={cat}>
                                        <AccordionTrigger className="capitalize font-black text-primary text-sm tracking-widest">{cat === 'lugares' ? 'Lugares de la Ciudad' : 'Transportes'}</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">English</div><div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Español</div>
                                                {(cat === 'lugares' ? cityVocab.slice(0, 22) : cityVocab.slice(22)).map((v: any, i: number) => (
                                                    <Fragment key={i}>
                                                        <div className="flex items-center font-bold py-1 text-sm">{v.en}</div>
                                                        <Input value={vocabAnswers[cat][i]} onChange={e => { const na = {...vocabAnswers}; na[cat][i] = e.target.value; setVocabAnswers(na); setVocabValidation(vv => ({...vv, [cat]: vv[cat].map((val: any, idx: number) => idx === i ? 'unchecked' : val)})); setCanAdvanceVocab(false); }} className={cn("h-10 uppercase", vocabValidation[cat]?.[i] === 'correct' ? 'border-green-500' : vocabValidation[cat]?.[i] === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" />
                                                    </Fragment>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 bg-muted/20"><Button onClick={handleVocabCheck} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar <ArrowRight className='ml-2'/></Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-foreground text-left overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Ubicación y Existencia</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-primary uppercase mb-4">1. Hay vs. Está / Están</h3>
                                <div className='grid gap-4 md:grid-cols-2'>
                                    <div className='p-4 bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 rounded-r-xl'>
                                        <h4 className='font-bold text-blue-800 dark:text-blue-400'>HAY (There is / There are):</h4>
                                        <p className="text-sm italic">Se usa para expresar <strong>existencia</strong> de objetos o personas.</p>
                                        <p className="text-sm text-muted-foreground mt-1">Used to express the <strong>existence</strong> of objects or people.</p>
                                        <p className='text-xs font-mono mt-1'>Ej: Hay un banco cerca. / There is a bank nearby.</p>
                                    </div>
                                    <div className='p-4 bg-green-50 dark:bg-green-900/10 border-l-4 border-green-500 rounded-r-xl'>
                                        <h4 className='font-bold text-green-800 dark:text-green-400'>ESTÁ / ESTÁN (Location):</h4>
                                        <p className="text-sm italic">Se usa para indicar la <strong>ubicación específica</strong> de algo conocido.</p>
                                        <p className="text-sm text-muted-foreground mt-1">Used to indicate the <strong>specific location</strong> of something known.</p>
                                        <p className='text-xs font-mono mt-1'>Ej: El hospital está lejos. / The hospital is far.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4">
                                <h3 className="text-xl font-black text-primary uppercase mb-2">2. Expresiones de Ubicación / Location Expressions</h3>
                                <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
                                    {[
                                        { es: "Al lado de", en: "Next to" },
                                        { es: "En frente de", en: "In front of" },
                                        { es: "Detrás de", en: "Behind" },
                                        { es: "Entre", en: "Between" },
                                        { es: "A la izquierda", en: "On the left" },
                                        { es: "A la derecha", en: "On the right" },
                                        { es: "Derecho / Recto", en: "Straight ahead" },
                                        { es: "En la esquina", en: "On the corner" }
                                    ].map((exp, idx) => (
                                        <div key={idx} className='p-3 bg-background border rounded-xl text-center font-bold text-sm text-primary flex flex-col'>
                                            <span>{exp.es}</span>
                                            <span className="text-[10px] text-muted-foreground italic">{exp.en}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">He comprendido la gramática</Button></CardFooter>
                    </Card>
                );
            case 'ex1': return <BallsExercise title="Ejercicio 1" prompts={ex1Prompts} onComplete={() => handleTopicComplete('ex1')} vocabulary={ex1Vocab} />;
            case 'ex2': return <BallsExercise title="Ejercicio 2" prompts={ex2Prompts} onComplete={() => handleTopicComplete('ex2')} vocabulary={ex2Vocab} />;
            case 'ex3': return <BallsExercise title="Ejercicio 3: Ubicar Objetos" prompts={ex3Prompts} onComplete={() => handleTopicComplete('ex3')} vocabulary={{"estante": "shelf", "baño": "bathroom", "bolsillo": "pocket", "edificio": "building", "cuarto": "room"}} />;
            case 'vocab_game': return <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm"><CardHeader><CardTitle>Juego de Memoria: Ciudad</CardTitle></CardHeader><CardContent><VocabularyMatchingGame data={cityVocab.slice(0, 12).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Encuentra las parejas" /></CardContent></Card>;
            case 'reading':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'>
                            <div className='flex justify-between items-center w-full'>
                                <CardTitle className='text-primary uppercase tracking-tight'>{readingData.title}</CardTitle>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse">
                                            <BookText className="mr-2 h-4 w-4" />
                                            Vocabulario
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64">
                                        <div className="space-y-2 text-foreground text-left">
                                            <h4 className="font-bold border-b pb-1 text-primary">Vocabulario Lectura</h4>
                                            <ScrollArea className="h-48 pr-4">
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                                    {Object.entries(readingVocab).map(([es, en]: any) => (
                                                        <React.Fragment key={es}>
                                                            <span className="text-muted-foreground capitalize">{es}:</span>
                                                            <span className="font-semibold text-right">{en}</span>
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-inner">{readingData.content}</div>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className='font-black text-primary uppercase text-sm'>Preguntas de Comprensión:</h3>
                                {readingData.questions.map((q, i) => (
                                    <div key={i} className="space-y-2 p-3 bg-muted/20 rounded-xl border"><Label className="font-bold">{q.q}</Label><Input value={readingAns[i]} onChange={e => { const na = [...readingAns]; na[i] = e.target.value; setReadingAns(na); setReadingVal(v => { const nv = [...v]; nv[i] = 'unchecked'; return nv as any; }); }} className={cn("h-10", readingVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : readingVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" /></div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/10"><Button onClick={handleCheckReading} size="lg" className="px-16 font-black h-12 shadow-md">Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'final_ex':
                return <BallsExercise title="Ejercicio Final: Direcciones y Mapas" prompts={finalExPrompts.map(p => ({ en: p.a, es: [p.s] }))} onComplete={() => handleTopicComplete('final_ex')} vocabulary={translationVocabHelp} />;
            case 'translate_text':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><div className="flex justify-between items-center"><div><CardTitle className='text-primary uppercase'>Traducción: Direcciones</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el siguiente párrafo al español.</CardDescription></div><Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger><PopoverContent className="w-64"><ScrollArea className="h-48 pr-4"><div className="space-y-2">{Object.entries(translationVocabHelp).map(([en, es], i) => (<div key={i} className="flex justify-between text-xs border-b pb-1"><span className="text-muted-foreground">{en}:</span><span className="font-bold text-primary">{es}</span></div>))}</div></ScrollArea></PopoverContent></Popover></div></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-sm">"Go straight for three blocks. Turn left on the corner at the supermarket. The bank is next to the pharmacy. Cross the street carefully. The hospital is in front of the park and behind the square. Turn right at the traffic light to find the museum."</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={translationText} onChange={(e) => setTranslationText(e.target.value)} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg leading-relaxed" /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20"><Button onClick={() => handleTopicComplete('translate_text')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Siguiente Misión <ArrowRight className='ml-3 h-8 w-8' /></Button></CardFooter>
                    </Card>
                );
            case 'final': return <BallsExercise title="Final (Frases Negativas)" prompts={negativePrompts} onComplete={() => handleTopicComplete('final')} vocabulary={{ "hospital": "hospital", "banco": "bank", "biblioteca": "library", "museo": "museum", "carro": "car", "avión": "airplane", "moto": "motorcycle", "estación": "station" }} />;
            default: return null;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {targetStudentId && isAdmin && (
                        <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md">
                            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400"><Star className="h-6 w-6 fill-current animate-pulse" /><p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión Activo: {studentProfile?.name || targetStudentId}</p></div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors"><Link href="/admin">Cerrar Supervisión</Link></Button>
                        </div>
                    )}
                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/a1" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver al Curso A1</Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3">
                           <MapPin className='h-10 w-10 text-primary' /> Ubicación 🇪🇸
                        </h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30 text-foreground"><CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Misión A1</CardTitle></CardHeader>
                                <CardContent className="p-4 text-foreground">
                                    <nav><ul className="space-y-1">
                                        {learningPath.map((item) => {
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            const isSelected = selectedTopic === item.key;
                                            const Icon = ICONS_MAP[item.status as keyof typeof ICONS_MAP] || BookOpen;
                                            return (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', isSelected && 'bg-muted text-primary font-black border-l-4 border-primary')}>
                                                    <div className="flex items-center gap-3">{item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}<span className="truncate max-w-[150px]">{item.name}</span></div>
                                                    {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                                </li>
                                            );
                                        })}
                                    </ul></nav>
                                    <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 font-black uppercase tracking-widest text-muted-foreground"><span>Progreso Clase</span><span className="text-primary">{progressValue}%</span></div><Progress value={progressValue} className="h-2 rounded-full" /></div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default function UbicacionPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
        }>
            <UbicacionContent />
        </Suspense>
    );
}