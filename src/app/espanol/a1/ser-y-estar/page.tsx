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
    Check,
    X,
    Info,
    Search,
    Sparkles,
    Activity,
    Smile
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_a1_ser_estar_mix_v10_full_content';
const mainProgressKey = 'progress_a1_es_ser_y_estar';

// --- DATA ---

const mixedVocab = [
    // Adjetivos / Apariencia (12)
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
    // Profesiones (10)
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
    // Lugares (10)
    { en: "SCHOOL", es: "ESCUELA", cat: "Lugares Comunes" },
    { en: "PARK", es: "PARQUE", cat: "Lugares Comunes" },
    { en: "RESTAURANT", es: "RESTAURANTE", cat: "Lugares Comunes" },
    { en: "HOSPITAL", es: "HOSPITAL", cat: "Lugares Comunes" },
    { en: "CHURCH", es: "IGLESIA", cat: "Lugares Comunes" },
    { en: "LIBRARY", es: "BIBLIOTECA", cat: "Lugares Comunes" },
    { en: "BANK", es: "BANCO", cat: "Lugares Comunes" },
    { en: "HOUSE", es: "CASA", cat: "Lugares Comunes" },
    { en: "SUPERMARKET", es: "SUPERMERCADO", cat: "Lugares Comunes" },
    { en: "STREET", es: "CALLE", cat: "Lugares Comunes" },
    // Emociones y Estados (10)
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

const readingData = {
    title: "Un día con mi familia",
    content: "Hoy es domingo. Mi familia y yo estamos en la finca. La finca es muy grande y hermosa. El clima está soleado y hace calor. Mi padre es médico, pero hoy está relajado. Mi madre es muy alegre. Mis hermanos están en la piscina porque el agua está fresca. Yo soy un estudiante de español y estoy muy emocionado por mi viaje a Madrid el próximo mes.",
    questions: [
        { q: "¿Dónde está la familia?", a: ["en la finca"] },
        { q: "¿Cómo es la finca?", a: ["grande y hermosa"] },
        { q: "¿Cuál es la profesión del padre?", a: ["médico", "medico"] },
        { q: "¿Cómo está el clima?", a: ["soleado"] },
        { q: "¿Por qué están los hermanos en la piscina?", a: ["el agua está fresca", "el agua esta fresca"] },
    ]
};

const finalExPrompts = [
    { s: "1. Yo _______ de Colombia.", a: "soy" },
    { s: "2. Tú _______ muy cansado hoy.", a: "estás" },
    { s: "3. Ella _______ una excelente profesora.", a: "es" },
    { s: "4. Nosotros _______ en el restaurante.", a: "estamos" },
    { s: "5. El café _______ caliente.", a: "está" },
    { s: "6. Madrid _______ en España.", a: "está" },
    { s: "7. Mis padres _______ médicos.", a: "son" },
    { s: "8. ¿Tú _______ feliz?", a: "estás" },
    { s: "9. La mesa _______ de madera.", a: "es" },
    { s: "10. Ellos _______ enojados contigo.", a: "están" },
    { s: "11. Yo _______ en la oficina ahora.", a: "estoy" },
    { s: "12. La película _______ muy aburrida.", a: "es" },
    { s: "13. Nosotros _______ hermanos.", a: "somos" },
    { s: "14. El gato _______ sobre el sofá.", a: "está" },
    { s: "15. ¿Dónde _______ mis llaves?", a: "están" },
    { s: "16. Ella _______ inteligente y bonita.", a: "es" },
    { s: "17. El cielo _______ azul.", a: "es" },
    { s: "18. Los niños _______ en la escuela.", a: "están" },
    { s: "19. Yo _______ muy ocupado.", a: "estoy" },
    { s: "20. Ustedes _______ de Estados Unidos.", a: "son" },
    { s: "21. El agua _______ fría.", a: "está" },
    { s: "22. Mi hermano _______ ingeniero.", a: "es" },
    { s: "23. ¿Cómo _______ tu abuela hoy?", a: "está" },
    { s: "24. La casa _______ blanca.", a: "es" },
    { s: "25. Nosotros _______ perdidos.", a: "estamos" },
    { s: "26. Tú _______ un buen amigo.", a: "eres" },
    { s: "27. Hoy _______ martes.", a: "es" },
    { s: "28. Las flores _______ marchitas.", a: "están" },
    { s: "29. Yo _______ alto y moreno.", a: "soy" },
    { s: "30. El hospital _______ lejos de aquí.", a: "está" },
];

const negativeMissionPrompts = [
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

const translationVocabHelp = {
    "tall": "alto", "friendly": "amigable", "engineer": "ingeniero", "serious": "serio",
    "nurse": "enfermera", "hospital": "hospital", "young": "joven", "park": "parque",
    "dog": "perro", "sunny": "soleado", "sky": "cielo", "family": "familia"
};

const globalVocabMap: Record<string, string> = mixedVocab.reduce((acc, curr) => {
    acc[curr.es.toLowerCase()] = curr.en.toLowerCase();
    return acc;
}, {} as Record<string, string>);

// --- HELPER COMPONENTS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary }: any) => {
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
                        <CardTitle>{title}</CardTitle>
                        <CardDescription className="font-bold text-foreground mt-1">Traduce la frase al español.</CardDescription>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse">
                                <BookText className="mr-2 h-4 w-4" /> Vocabulario
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64">
                            <ScrollArea className="h-64 pr-4">
                                <div className="space-y-2 text-foreground text-left">
                                    <h4 className='font-black text-primary text-xs uppercase mb-2 border-b'>Ayuda de Misión</h4>
                                    {Object.entries(vocabulary || globalVocabMap).map(([es, en]: any, i) => (
                                        <div key={i} className="flex justify-between text-[10px] border-b border-muted pb-1">
                                            <span className="text-muted-foreground text-left uppercase">{en}:</span>
                                            <span className="font-bold text-right text-primary">{es.toUpperCase()}</span>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </PopoverContent>
                    </Popover>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">
                    {prompts[currentIndex].en}
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

function SerYEstarContent() {
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

    const [finalExAns, setFinalExAns] = useState<string[]>(Array(finalExPrompts.length).fill(''));
    const [finalExVal, setFinalExVal] = useState<any[]>(Array(finalExPrompts.length).fill('unchecked'));

    const [translationText, setTranslationText] = useState('');

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    
    const { data: authUserProfile } = useDoc<{ role?: string }>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string, lessonProgress?: any, progress?: any, name?: string }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: '2. Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'exercise1', name: '3. Ejercicio 1 (SER)', icon: PenSquare, status: 'locked' },
        { key: 'exercise2', name: '4. Ejercicio 2 (ESTAR)', icon: PenSquare, status: 'locked' },
        { key: 'exercise3', name: '5. Ejercicio 3 (Mix)', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'reading', name: '7. Lectura', icon: BookText, status: 'locked' },
        { key: 'final_ex', name: '8. Ejercicio Final', icon: Trophy, status: 'locked' },
        { key: 'exercise4', name: '9. Traducir Texto', icon: MessageSquare, status: 'locked' },
        { key: 'final', name: '10. Final (Negativos)', icon: CheckCircle, status: 'locked' },
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
        
        const initAns: any = {}; const initVal: any = {};
        const categories = ["Apariencia y Adjetivos", "Profesiones", "Lugares Comunes", "Emociones y Estados"];
        categories.forEach(cat => {
            initAns[cat] = Array(mixedVocab.filter(v => v.cat === cat).length).fill('');
            initVal[cat] = Array(mixedVocab.filter(v => v.cat === cat).length).fill('unchecked');
        });
        setVocabAnswers(initAns); setVocabValidation(initVal);
        
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

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (topicKey === 'grammar') handleTopicComplete(topicKey);
    };

    const handleVocabCheck = () => {
        let totalCorrect = 0;
        const newVal: Record<string, any[]> = {};
        const categories = ["Apariencia y Adjetivos", "Profesiones", "Lugares Comunes", "Emociones y Estados"];
        
        categories.forEach(cat => {
            const catItems = mixedVocab.filter(v => v.cat === cat);
            newVal[cat] = catItems.map((v, i) => {
                const isCorrect = v.es.toLowerCase() === (vocabAnswers[cat]?.[i] || '').trim().toLowerCase();
                if (isCorrect) totalCorrect++;
                return isCorrect ? 'correct' : 'incorrect';
            });
        });

        setVocabValidation(newVal);
        if (totalCorrect >= 15) { setCanAdvanceVocab(true); toast({ title: "¡Buen avance!", description: `Llevas ${totalCorrect} aciertos.` }); }
        else toast({ variant: 'destructive', title: "Necesitas al menos 15 aciertos para avanzar." });
    };

    const handleCheckReading = () => {
        let allOk = true;
        const nv = readingData.questions.map((q, i) => {
            const ok = q.a.some(ans => (readingAns[i] || '').trim().toLowerCase().includes(ans.toLowerCase()));
            if (!ok) allOk = false;
            return ok ? 'correct' : 'incorrect';
        });
        setReadingVal(nv as any);
        if (allOk) { toast({ title: "¡Lectura superada!" }); handleTopicComplete('reading'); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const handleCheckFinalEx = () => {
        let okCount = 0;
        const nv = finalExPrompts.map((q, i) => {
            const isOk = q.a.toLowerCase() === (finalExAns[i] || '').trim().toLowerCase();
            if (isOk) okCount++;
            return isOk ? 'correct' : 'incorrect';
        });
        setFinalExVal(nv as any);
        if (okCount === finalExPrompts.length) { toast({ title: "¡Dominio Total!" }); handleTopicComplete('final_ex'); }
        else toast({ variant: 'destructive', title: "Hay errores en la lista." });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;

        switch (selectedTopic) {
            case 'vocabulary':
                const categories = ["Apariencia y Adjetivos", "Profesiones", "Lugares Comunes", "Emociones y Estados"];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'>
                            <CardTitle className="text-primary uppercase tracking-tighter">Vocabulario Mixto A1</CardTitle>
                            <CardDescription className='font-bold text-foreground'>Traduce los términos al español para desbloquear la misión.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <Accordion type="multiple" defaultValue={['Apariencia y Adjetivos']} className="w-full">
                                {categories.map(cat => (
                                    <AccordionItem key={cat} value={cat}>
                                        <AccordionTrigger className="capitalize font-black text-primary text-sm tracking-widest">{cat}</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="font-black text-muted-foreground uppercase tracking-widest text-[10px] border-b pb-1">English</div>
                                                <div className="font-black text-muted-foreground uppercase tracking-widest text-[10px] border-b pb-1">Español</div>
                                                {mixedVocab.filter(v => v.cat === cat).map((v, i) => (
                                                    <Fragment key={i}>
                                                        <div className="flex items-center font-bold py-1 text-sm">{v.en}</div>
                                                        <Input value={vocabAnswers[cat]?.[i] || ''} onChange={e => { const na = {...vocabAnswers}; na[cat][i] = e.target.value; setVocabAnswers(na); setVocabValidation(vv => ({...vv, [cat]: vv[cat].map((val: any, idx: number) => idx === i ? 'unchecked' : val)})); setCanAdvanceVocab(false); }} className={cn("h-10 uppercase", vocabValidation[cat]?.[i] === 'correct' ? 'border-green-500 bg-green-50/5' : vocabValidation[cat]?.[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" />
                                                    </Fragment>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 bg-muted/20">
                            <Button onClick={handleVocabCheck} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar <ArrowRight className='ml-2'/></Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-foreground text-left overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">SER vs ESTAR</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                    <h3 className="text-xl font-black text-primary uppercase mb-4 flex items-center gap-2"><Star className="h-5 w-5" /> Verbo SER</h3>
                                    <p className="mb-4 text-sm font-medium">Se usa para cualidades <strong>permanentes</strong> o esenciales:</p>
                                    <ul className="space-y-2 text-sm italic">
                                        <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" /> Identidad (Soy Juan)</li>
                                        <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" /> Profesión (Es médica)</li>
                                        <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" /> Origen (Son de México)</li>
                                        <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" /> Características físicas</li>
                                    </ul>
                                </div>
                                <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                    <h3 className="text-xl font-black text-brand-purple uppercase mb-4 flex items-center gap-2"><Activity className="h-5 w-5" /> Verbo ESTAR</h3>
                                    <p className="mb-4 text-sm font-medium">Se usa para estados <strong>temporales</strong> o ubicación:</p>
                                    <ul className="space-y-2 text-sm italic">
                                        <li className="flex items-center gap-2"><Check className="h-3 w-3 text-brand-purple" /> Ubicación (Está en el parque)</li>
                                        <li className="flex items-center gap-2"><Check className="h-3 w-3 text-brand-purple" /> Salud (Estoy enfermo)</li>
                                        <li className="flex items-center gap-2"><Check className="h-3 w-3 text-brand-purple" /> Emociones (Están felices)</li>
                                        <li className="flex items-center gap-2"><Check className="h-3 w-3 text-brand-purple" /> Clima (Está lloviendo)</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">He comprendido la diferencia</Button></CardFooter>
                    </Card>
                );
            case 'exercise1': return <BallsExercise title="Ejercicio 1: Verbo SER" prompts={ex1SerPrompts} onComplete={() => handleTopicComplete('exercise1')} vocabulary={globalVocabMap} />;
            case 'exercise2': return <BallsExercise title="Ejercicio 2: Verbo ESTAR" prompts={ex2EstarPrompts} onComplete={() => handleTopicComplete('exercise2')} vocabulary={globalVocabMap} />;
            case 'exercise3': return <BallsExercise title="Ejercicio 3: Mix SER y ESTAR" prompts={ex3MixPrompts} onComplete={() => handleTopicComplete('exercise3')} vocabulary={globalVocabMap} />;
            case 'vocab_game': return <VocabularyMatchingGame data={mixedVocab.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Memory Game: Ser y Estar" />;
            case 'reading':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tight'>{readingData.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6 pt-6 text-foreground">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner">{readingData.content}</div>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className='font-black text-primary uppercase text-sm'>Comprensión:</h3>
                                {readingData.questions.map((q, i) => (
                                    <div key={i} className="space-y-2 p-3 bg-muted/20 rounded-xl border">
                                        <Label className="font-bold text-foreground">{q.q}</Label>
                                        <Input value={readingAns[i]} onChange={e => { const na = [...readingAns]; na[i] = e.target.value; setReadingAns(na); setReadingVal(v => { const nv = [...v]; nv[i] = 'unchecked'; return nv as any; }); }} className={cn("h-10", readingVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : readingVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/10"><Button onClick={handleCheckReading} size="lg" className="px-16 font-black h-12 shadow-md">Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'final_ex':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tight'>Ejercicio Final: SER o ESTAR (30 frases)</CardTitle></CardHeader>
                        <CardContent className="p-0"><ScrollArea className="h-[450px] p-6"><div className="space-y-4">
                            {finalExPrompts.map((q, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm"><p className="font-bold text-lg text-foreground">{q.s}</p><Input value={finalExAns[i]} onChange={e => { const na = [...finalExAns]; na[i] = e.target.value; setFinalExAns(na); setFinalExVal(v => { const nv = [...v]; nv[i] = 'unchecked'; return nv as any; }); }} className={cn("h-10 max-w-[150px] text-lg font-mono", finalExVal[i] === 'correct' ? 'border-green-500' : finalExVal[i] === 'incorrect' ? 'border-red-500' : '')} placeholder="Respuesta..." autoComplete="off" /></div>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/20"><Button onClick={handleCheckFinalEx} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">Verificar Todo</Button></CardFooter>
                    </Card>
                );
            case 'exercise4':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div><CardTitle className='text-primary uppercase'>Traducción de Texto</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el siguiente párrafo usando Ser y Estar.</CardDescription></div>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger>
                                    <PopoverContent className="w-64"><ScrollArea className="h-48 pr-4"><div className="space-y-2">{Object.entries(translationVocabHelp).map(([en, es], i) => (<div key={i} className="flex justify-between text-xs border-b pb-1"><span className="text-muted-foreground">{en}:</span><span className="font-bold text-primary">{es}</span></div>))}</div></ScrollArea></PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-sm">"My name is John. I am a tall and friendly student. Today I am at home with my family. My father is an engineer and he is very serious at work, but today he is happy. My mother is a nurse and she is at the hospital now. My sister is young and she is in the park with her dog. The weather is sunny and the sky is blue. We are a happy family."</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={translationText} onChange={(e) => setTranslationText(e.target.value)} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg leading-relaxed" /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20"><Button onClick={() => handleTopicComplete('exercise4')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Terminar Misión <Trophy className='ml-3 h-8 w-8' /></Button></CardFooter>
                    </Card>
                );
            case 'final': return <BallsExercise title="Final: Frases Negativas" prompts={negativeMissionPrompts} onComplete={() => handleTopicComplete('final')} vocabulary={globalVocabMap} />;
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
                           <Sparkles className='h-10 w-10 text-primary' /> Ser y Estar 🇪🇸
                        </h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30"><CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2"><Smile className="h-5 w-5 text-primary" /> Misión A1</CardTitle></CardHeader>
                                <CardContent className="p-4">
                                    <nav><ul className="space-y-1">
                                        {learningPath.map((item) => {
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            const isSelected = selectedTopic === item.key;
                                            const Icon = item.icon;
                                            return (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', isSelected && 'bg-muted text-primary font-black border-l-4 border-primary')}>
                                                    <div className="flex items-center gap-3 text-foreground">{item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}<span className="truncate max-w-[150px]">{item.name}</span></div>
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
        </div>
    );
}

export default function SerYEstarPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
        }>
            <SerYEstarContent />
        </Suspense>
    );
}
