
'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense, Fragment, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    GraduationCap, 
    CheckCircle, 
    Loader2, 
    ArrowRight,
    Gamepad2,
    Trophy,
    BookText,
    Pencil,
    Activity,
    Star,
    ArrowLeft,
    MessageSquare,
    MapPin,
    Navigation,
    Check,
    X,
    Info,
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
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { Textarea } from '@/components/ui/textarea';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_a1_ubicacion_v66_final_fix_vis';
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
        { id: 'q1', q: "¿Qué hay en la ciudad?", a: ["un parque", "un parque muy grande"] },
        { id: 'q2', q: "¿Dónde está el museo?", a: ["al lado del parque"] },
        { id: 'q3', q: "¿Cómo va el narrador a la escuela?", a: ["en bicicleta"] },
        { id: 'q4', q: "¿Dónde trabaja el padre?", a: ["en el hospital"] },
        { id: 'q5', q: "¿Qué hay hoy en la plaza?", a: ["un festival", "un festival de música"] },
    ]
};

const finalExPromptsMap = [
    { spanish: "AL LADO DEL PARQUE ESTÁ...", answer: ["el mercado"] },
    { spanish: "AL LADO DE LA BIBLIOTECA ESTÁ...", answer: ["el centro comercial"] },
    { spanish: "ENTRE EL TEATRO Y LA COMISARIA ESTA...", answer: ["el banco"] },
    { spanish: "AL FRENTE DE LA CAFETERIA ESTÁ...", answer: ["la plaza"] },
    { spanish: "DETRAS DE LA FARMACIA ESTÁ...", answer: ["la universidad"] },
];

const negativePrompts = [
    { en: "There is no hospital here.", es: ["no hay un hospital aquí", "no hay hospital aquí"] },
    { en: "The car is not in the garage.", es: ["el carro no está en el garaje", "el carro no esta en el garaje"] },
    { en: "We are not at the airport.", es: ["no estamos en el aeropuerto"] },
    { en: "The bus is not at the station.", es: ["el bus no está en la estación", "el bus no esta en la estacion"] },
    { en: "There are no taxis in the street.", es: ["no hay taxis en la calle"] },
    { en: "The school is not far.", es: ["la escuela no está lejos", "la escuela no esta lejos"] },
    { en: "The restaurant is not open.", es: ["el restaurante no está abierto", "el restaurante no esta abierto"] },
    { en: "There is no supermarket near here.", es: ["no hay un supermercado cerca de aquí", "no hay supermercado cerca de aqui"] },
    { en: "The motorcycle is not in the park.", es: ["la moto no está en el parque", "la motocicleta no esta en el parque"] },
    { en: "The bank is not behind the museum.", es: ["el banco no está detrás del museo", "el banco no esta detras del museo"] },
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

// --- HELPER COMPONENTS ---

const BlockValidationExercise = ({ title, prompts, onComplete, vocabulary, initialAns, onAnsChange, isAdmin, isSupervisionMode }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [valStatus, setValStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setCurrentIndex(0); setValStatus({}); }, [title]);

    const handleCheck = () => {
        const newVal: Record<number, 'correct' | 'incorrect'> = {};
        let allOk = true;
        prompts.forEach((p: any, i: number) => {
            const userVal = (initialAns[i] || '').trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
            const corrects = p.es || p.answer || [];
            const correctsNormalized = (Array.isArray(corrects) ? corrects : [corrects]).map((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' '));
            const isOk = correctsNormalized.includes(userVal);
            newVal[i] = isOk ? 'correct' : 'incorrect';
            if (!isOk) allOk = false;
        });
        setValStatus(newVal);
        if (allOk) toast({ title: "¡Excelente!", description: "Todo está correcto." });
        else toast({ variant: 'destructive', title: "Hay errores", description: "Revisa las marcas rojas en las bolitas." });
    };

    const isFinished = Object.values(valStatus).length === prompts.length && Object.values(valStatus).every(v => v === 'correct');

    if (!prompts || !prompts[currentIndex]) return null;

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start text-left">
                    <div className="w-full text-foreground">
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
                            <PopoverContent className="w-64"><ScrollArea className="h-48 pr-4 text-left text-foreground"><div className="grid grid-cols-2 gap-2 text-sm text-foreground">{Object.entries(vocabulary).map(([es, en]: any) => (<Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-semibold text-right text-primary">{en.toUpperCase()}</span></Fragment>))}</div></ScrollArea></PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">
                    {prompts[currentIndex].en || prompts[currentIndex].spanish}
                </div>
                <Input value={initialAns[currentIndex] || ''} onChange={e => { if (isSupervisionMode) return; onAnsChange(currentIndex, e.target.value); setValStatus({...valStatus, [currentIndex]: 'unchecked'}); }} className={cn("h-12 text-lg text-foreground", valStatus[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/10' : valStatus[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="Tu respuesta..." autoComplete="off" readOnly={isSupervisionMode} />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    {currentIndex === prompts.length - 1 && (
                        <>
                            {!isFinished && !isSupervisionMode && <Button onClick={handleCheck} variant="secondary">Verificar</Button>}
                            <Button onClick={onComplete} disabled={!isFinished && !isAdmin} className="text-white font-bold bg-primary hover:bg-primary/90">{title.includes('Final') || title.includes('Negativos') ? 'TERMINAR' : 'Continuar'}</Button>
                        </>
                    )}
                    {currentIndex < prompts.length - 1 && <Button onClick={() => setCurrentIndex(i => i + 1)}>Siguiente</Button>}
                </div>
            </CardFooter>
        </Card>
    );
};

// --- MAIN PAGE ---

function UbicacionContent() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const targetStudentId = searchParams.get('studentId');
    const currentUID = targetStudentId || user?.uid;

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [learningPath, setLearningPath] = useState<any[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    
    // States for content
    const [vocabAns, setVocabAns] = useState<string[]>(Array(cityVocab.length).fill(''));
    const [vocabVal, setVocabVal] = useState<any[]>(Array(cityVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);
    const [ex1Ans, setEx1Ans] = useState<string[]>(Array(ex1Prompts.length).fill(''));
    const [ex2Ans, setEx2Ans] = useState<string[]>(Array(ex2Prompts.length).fill(''));
    const [ex3Ans, setEx3Ans] = useState<string[]>(Array(ex3Prompts.length).fill(''));
    const [finalExAns, setFinalExAns] = useState<string[]>(Array(finalExPromptsMap.length).fill(''));
    const [negAns, setNegAns] = useState<string[]>(Array(negativePrompts.length).fill(''));
    const [readAns, setReadAns] = useState<Record<string, string>>({});
    const [readVal, setReadVal] = useState<Record<string, any>>({});
    const [transText, setTransText] = useState('');
    const [isFinished, setIsFinished] = useState(false);

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: authUserProfile } = useDoc<{ role?: string }>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string, lessonProgress?: any, progress?: any, name?: string }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialLearningPath = useMemo(() => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: '2. Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'exercise_1', name: '3. Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'exercise_2', name: '4. Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'exercise_3', name: '5. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'reading', name: '7. Lectura', icon: BookText, status: 'locked' },
        { key: 'final_ex', name: '8. Mapa de La Ciudad', icon: Navigation, status: 'locked' },
        { key: 'translate_text', name: '9. Traducir Texto', icon: Pencil, status: 'locked' },
        { key: 'final', name: '10. Final (Negativos)', icon: CheckCircle, status: 'locked' },
    ], []);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    const handleTopicComplete = useCallback((completedKey: string) => { setTopicToComplete(completedKey); }, []);

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (topicKey === 'grammar') handleTopicComplete(topicKey);
    };

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
        let path = initialLearningPath.map(topic => ({ ...topic }));
        const d = studentProfile.lessonProgress?.[progressStorageVersion] || {};
        if (isAdmin && !targetStudentId) path.forEach(item => { item.status = 'completed'; });
        else {
            path.forEach(item => { if (d[item.key]) (item as any).status = d[item.key]; });
            let lastDone = true;
            for (let i = 0; i < path.length; i++) {
                if (lastDone && path[i].status === 'locked') (path[i] as any).status = 'active';
                lastDone = (path[i] as any).status === 'completed';
            }
        }
        setLearningPath(path as any[]);
        setSelectedTopic(d.lastSelectedTopic || path.find(p => (p as any).status === 'active')?.key || path[0].key);
        if (d.ex1Ans) setEx1Ans(d.ex1Ans);
        if (d.ex2Ans) setEx2Ans(d.ex2Ans);
        if (d.ex3Ans) setEx3Ans(d.ex3Ans);
        if (d.finalExAns) setFinalExAns(d.finalExAns);
        if (d.negAns) setNegAns(d.negAns);
        if (d.readAns) setReadAns(d.readAns);
        if (d.transText) setTransText(d.transText);
        if (d.vocabAns) setVocabAns(d.vocabAns);
        setInitialLoadComplete(true); setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete, targetStudentId]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || targetStudentId) return;
        const saveTimer = setTimeout(() => {
            const s: any = { lastSelectedTopic: selectedTopic, ex1Ans, ex2Ans, ex3Ans, finalExAns, negAns, readAns, transText, vocabAns };
            learningPath.forEach(item => { s[item.key] = item.status; });
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        }, 1500);
        return () => clearTimeout(saveTimer);
    }, [learningPath, progressValue, studentDocRef, initialLoadComplete, selectedTopic, isInitialLoading, ex1Ans, ex2Ans, ex3Ans, finalExAns, negAns, readAns, transText, targetStudentId, vocabAns]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(curr => {
            let next: string | null = null; const np = [...curr];
            const i = np.findIndex(t => t.key === topicToComplete);
            if (i !== -1 && np[i].status !== 'completed') {
                np[i].status = 'completed';
                if (i + 1 < np.length && np[i + 1].status === 'locked') { (np[i + 1] as any).status = 'active'; next = np[i + 1].key; }
            }
            if (next) { const n = next; setTimeout(() => { toast({ title: "¡Misión desbloqueada!" }); setSelectedTopic(n); }, 0); }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                const vocabOk = vocabVal.length > 0 && vocabVal.every(v => v === 'correct');
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className="text-foreground">Vocabulario: Ciudad y Transporte</CardTitle></CardHeader>
                        <CardContent><ScrollArea className="h-[500px] pr-4 text-foreground"><div className="grid grid-cols-2 gap-4">
                            <div className="font-black text-primary border-b pb-2 uppercase text-xs">Inglés</div><div className="font-black text-primary border-b pb-2 uppercase text-xs">Español</div>
                            {cityVocab.map((v, i) => (
                                <Fragment key={i}>
                                    <div className="p-3 border rounded bg-white/5 font-bold flex items-center text-sm">{v.en}</div>
                                    <Input value={vocabAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...vocabAns]; na[i] = e.target.value; setVocabAns(na); const nv = [...vocabVal]; nv[i] = 'unchecked'; setVocabVal(nv); setCanAdvanceVocab(false); }} className={cn("h-10 uppercase", vocabVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} />
                                </Fragment>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-between border-t pt-6 bg-muted/20">
                            <Button onClick={() => {
                                let ok = true; const nv = cityVocab.map((v, i) => { const res = v.es.toLowerCase() === (vocabAns[i] || '').trim().toLowerCase(); if (!res) ok = false; return res ? 'correct' : 'incorrect'; });
                                setVocabVal(nv); setCanAdvanceVocab(ok); if (ok) toast({ title: "¡Perfecto!" }); else toast({ variant: 'destructive', title: "Revisa el vocabulario" });
                            }} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Continuar</Button>
                        </CardFooter>
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
            case 'exercise_1': return <BlockValidationExercise key="exercise_1" title="Ejercicio 1" prompts={ex1Prompts} onComplete={() => handleTopicComplete('exercise_1')} initialAns={ex1Ans} onAnsChange={(i: number, v: string) => { const na = [...ex1Ans]; na[i] = v; setEx1Ans(na); }} vocabulary={{"hospital": "hospital", "cerca": "near", "calle": "street"}} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} />;
            case 'exercise_2': return <BlockValidationExercise key="exercise_2" title="Ejercicio 2" prompts={ex2Prompts} onComplete={() => handleTopicComplete('exercise_2')} initialAns={ex2Ans} onAnsChange={(i: number, v: string) => { const na = [...ex2Ans]; na[i] = v; setEx2Ans(na); }} vocabulary={{"farmacia": "pharmacy", "al lado de": "next to", "detrás de": "behind"}} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} />;
            case 'exercise_3': return <BlockValidationExercise key="exercise_3" title="Ejercicio 3" prompts={ex3Prompts} onComplete={() => handleTopicComplete('exercise_3')} initialAns={ex3Ans} onAnsChange={(i: number, v: string) => { const na = [...ex3Ans]; na[i] = v; setEx3Ans(na); }} vocabulary={{"gimnasio": "gym", "delante de": "in front of", "entre": "between", "camión": "truck"}} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} />;
            case 'vocab_game': return <VocabularyMatchingGame data={cityVocab.slice(0, 10).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Memory Game: Ciudad" />;
            case 'reading':
                const readOk = Object.values(readVal).length === readingData.questions.length && Object.values(readVal).every(v => v === 'correct');
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>{readingData.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner">{readingData.content}</div>
                            <Separator /><div className="space-y-4">{readingData.questions.map(q => (
                                <div key={q.id} className="space-y-2 text-foreground"><Label className='font-bold'>{q.q}</Label><Input value={readAns[q.id] || ''} onChange={e => { if (targetStudentId) return; setReadAns({...readAns, [q.id]: e.target.value}); setReadVal({...readVal, [q.id]: 'unchecked'}); }} className={cn('h-12', readVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[q.id] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                            ))}</div>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6">
                            <Button onClick={() => {
                                let ok = true; const nv: any = {};
                                readingData.questions.forEach(q => { const user = (readAns[q.id] || '').trim().toLowerCase(); const isOk = q.a.some(a => user.includes(a.toLowerCase())); nv[q.id] = isOk ? 'correct' : 'incorrect'; if (!isOk) ok = false; });
                                setReadVal(nv); if (ok) toast({ title: "¡Lectura superada!" }); else toast({ variant: 'destructive', title: "Revisa las respuestas" });
                            }} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('reading')} disabled={!readOk && !isAdmin} className="font-bold text-white bg-primary">Continuar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'final_ex':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b"><CardTitle className="uppercase tracking-tighter text-foreground">Mapa de La Ciudad</CardTitle><CardDescription className="font-bold text-foreground">Identifica los lugares según su posición en el mapa.</CardDescription></CardHeader>
                        <CardContent className="p-6 space-y-8">
                            <div className="relative aspect-video w-full overflow-hidden rounded-3xl border-4 border-muted shadow-2xl bg-white flex items-center justify-center">
                                <Image 
                                    src="https://letsspeakspanish.com/wp-content/uploads/2021/11/WhatsApp-Image-2021-11-16-at-13.41.071.jpeg" 
                                    alt="City Map" 
                                    fill 
                                    className="object-contain" 
                                    data-ai-hint="city map directions"
                                    unoptimized
                                />
                            </div>
                            <BlockValidationExercise key="final_ex_map" title="Identifica el Lugar" prompts={finalExPromptsMap} onComplete={() => handleTopicComplete('final_ex')} initialAns={finalExAns} onAnsChange={(i: number, v: string) => { const na = [...finalExAns]; na[i] = v; setFinalExAns(na); }} vocabulary={{"al lado de": "next to", "entre": "between", "en frente de": "across from"}} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} />
                        </CardContent>
                    </Card>
                );
            case 'translate_text':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader>
                            <div className='flex justify-between items-center w-full text-foreground'>
                                <div><CardTitle className="text-foreground">Traducción de Texto</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el párrafo al español.</CardDescription></div>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                                    <PopoverContent className="w-64"><ScrollArea className="h-48 pr-4 text-left"><div className="grid grid-cols-2 gap-2 text-sm text-foreground">{Object.entries({"go straight": "ve derecho", "blocks": "cuadras", "turn left": "gira a la izquierda", "corner": "esquina", "next to": "al lado de", "across from": "en frente de"}).map(([en, es]) => (<Fragment key={en}><span className="text-muted-foreground capitalize font-bold">{en}:</span><span className="font-semibold text-right text-primary">{es.toUpperCase()}</span></Fragment>))}</div></ScrollArea></PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed shadow-sm text-foreground">"Go straight for three blocks. Turn left on the corner at the supermarket. The bank is next to the pharmacy. Cross the street carefully. The hospital is in front of the park."</div>
                            <Separator /><div className="space-y-2 text-foreground"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={transText} onChange={(e) => { if (!targetStudentId) setTransText(e.target.value); }} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg text-foreground" readOnly={!!targetStudentId} /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20">
                            <Button onClick={() => handleTopicComplete('translate_text')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Siguiente Misión <ArrowRight className='ml-3 h-8 w-8' /></Button>
                        </CardFooter>
                    </Card>
                );
            case 'final':
                if (isFinished) {
                    return (
                        <Card className="shadow-soft border-2 border-green-500 bg-green-50/10 p-12 text-center flex flex-col items-center">
                            <Trophy className="h-24 w-24 text-yellow-400 mb-6 animate-bounce" />
                            <h2 className="text-4xl font-black uppercase text-green-600 tracking-tighter">¡FELICITACIONES!</h2>
                            <p className="text-2xl mt-4 font-bold text-foreground">Tu completaste esta clase Ubicacion</p>
                            <p className='text-muted-foreground mt-2 text-lg'>Misión completada al 100%.</p>
                            <Button asChild className="mt-8 px-12 h-12 font-bold" variant="outline"><Link href="/espanol/a1">Regresar a Ruta A1</Link></Button>
                        </Card>
                    );
                }
                return <BlockValidationExercise key="final_neg_block" title="Reto Final: Negativos" prompts={negativePrompts} onComplete={() => { setIsFinished(true); handleTopicComplete('final'); }} initialAns={negAns} onAnsChange={(i: number, v: string) => { const na = [...negAns]; na[i] = v; setNegAns(na); }} vocabulary={{"no hay": "there is no", "abierta": "open", "garaje": "garage"}} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} />;
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
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors"><Link href="/admin">Cerrar</Link></Button>
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
                                                        <span className="truncate max-w-[150px] text-[10px] uppercase font-bold">{item.name}</span>
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

export default function UbicacionPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}>
            <UbicacionContent />
        </Suspense>
    );
}