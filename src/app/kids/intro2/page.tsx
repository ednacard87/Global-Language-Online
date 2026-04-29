
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  PenSquare,
  Lock,
  GraduationCap,
  BrainCircuit,
  Hand,
  MessageSquare,
  RefreshCw,
  Flame,
  Trophy,
  CheckCircle,
  Lightbulb,
  Clock,
  X,
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
import { getIntro2PathData, type Intro2PathItem } from '@/lib/course-data';
import { useRouter } from 'next/navigation';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import Image from 'next/image';

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
                            <h4 className="font-medium text-primary">REGULAR: noun + s</h4>
                            <p className="font-mono text-sm bg-muted p-2 rounded-md mt-1">computer: computers // house: houses // car: cars</p>
                        </div>
                        <div>
                            <h4 className="font-medium text-primary">IRREGULAR: noun + es</h4>
                            <ul className="list-disc pl-5 mt-1 space-y-2 text-sm">
                                <li>For nouns ending {'=>'} s, z, sh, ch, x (bus) = “ES”<br/><span className="font-mono bg-muted px-2 py-1 rounded">Ex: address: Addresses // beach: beaches // bus: buses</span></li>
                                <li>For nouns ending {'=>'} “Y” cancelamos la “Y” agregamos “ies”<br/><span className="font-mono bg-muted px-2 py-1 rounded">Ex: country: countries // university: universities</span></li>
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
                                 <p><strong className="text-foreground">En INGLÉS:</strong> adjetivo + sustantivo.<br/><span className="font-mono text-muted-foreground">Examples: The white car, The red pen, the grey computer</span></p>
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
                            <p className="font-mono bg-muted p-2 rounded-md mt-1 text-sm">ESPAÑOL {'=>'} ENGLISH<br/>AR = Hablar = TO speak<br/>ER = Comer = TO eat<br/>IR = Vivir = TO Live</p>
                        </div>
                         <div>
                            <h4 className="font-medium text-primary">CONJUGACIÓN</h4>
                            <p className="text-sm text-muted-foreground">Cuando estamos utilizando la conjugación el verbo pierde la palabra = "To".</p>
                            <p className="font-mono bg-muted p-2 rounded-md mt-1 text-sm">pronombre + verbo (yo hablo) {'=>'} i + speak<br/>i to speak = yo hablar</p>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="pronombres">
                    <AccordionTrigger className="text-xl font-bold">PRONOMBRES (PRONOUNS)</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                         <p className="font-semibold">Muchas frases no tienen pronombres, entonces las frases pueden TENER:</p>
                         <ul className="list-disc pl-5 text-sm space-y-1">
                             <li><strong>Nombre propio:</strong> Viviana, Edna, Ana, Cristal</li>
                             <li><strong>Sustantivo:</strong> (persona, animal, cosa) {'=>'} carro, casa, finca</li>
                             <li><strong>Demostrativos:</strong> This – these – that – those</li>
                         </ul>
                         <p className="font-mono bg-muted p-2 rounded-md mt-1 text-sm">
                            he is at home {'=>'} pronoun<br/>
                            Thomas is at home {'=>'} Nombre propio<br/>
                            my father is at home {'=>'} Sustantivo<br/>
                            esta es mi casa = this is my house {'=>'} Demostrativo
                        </p>
                          <div className="flex items-start gap-2 p-2 bg-destructive/10 border-l-4 border-destructive text-destructive-foreground/80 rounded-r-md">
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

const greetingsAndFarewellsData = [
    { spanish: 'Hola', english: 'Hello' },
    { spanish: 'Buenos días', english: 'Good morning' },
    { spanish: 'Buenas tardes', english: 'Good afternoon' },
    { spanish: 'Buenas noches (saludo)', english: 'Good evening' },
    { spanish: '¿Cómo estás?', english: 'How are you?' },
    { spanish: '¿Qué tal?', english: "What's up?" },
    { spanish: '¿Cómo vas?', english: 'How is it going?' },
];

const farewellsData = [
    { spanish: 'Adiós', english: 'Goodbye' }, { spanish: 'Chao', english: 'Bye' },
    { spanish: 'Hasta luego', english: 'See you later' }, { spanish: 'Hasta pronto', english: 'See you soon' },
    { spanish: 'Buenas noches (despedida)', english: 'Good night' }, { spanish: 'Cuídate', english: 'Take care' },
    { spanish: 'Nos vemos mañana', english: 'See you tomorrow' }, { spanish: 'Que tengas un buen día', english: 'Have a nice day' },
];

const mixedExercise1Data = [
    { spanish: "Este (This) es un buen libro", answer: ["this is a good book"] },
    { spanish: "Esa (That) es mi casa", answer: ["that is my house"] },
    { spanish: "Estos (These) son tus zapatos", answer: ["these are your shoes"] },
    { spanish: "Esos (Those) son nuestros amigos", answer: ["those are our friends"] },
];

const mixedExercise2Data = [
    { spanish: "¿Cómo estás hoy?", answer: ["how are you today?"] },
    { spanish: "Hasta mañana, profesor", answer: ["see you tomorrow, teacher"] },
    { spanish: "Mi amigo es de Canada", answer: ["my friend is from canada"] },
    { spanish: "Son las diez y cuarto", answer: ["it's a quarter past ten", "it is a quarter past ten"] },
];

const countriesExerciseData = [
    { pais: 'Estados Unidos', country: 'United States', nationality: 'American' },
    { pais: 'Canadá', country: 'Canada', nationality: 'Canadian' },
    { pais: 'México', country: 'Mexico', nationality: 'Mexican' },
    { pais: 'Brasil', country: 'Brazil', nationality: 'Brazilian' },
    { pais: 'Inglaterra', country: 'England', nationality: 'English' },
    { pais: 'Francia', country: 'France', nationality: 'French' },
];

const GreetingsFarewellsContent = ({ title, data }: { title: string; data: { spanish: string, english: string }[] }) => (
    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent>
            <Table>
                <TableHeader><TableRow><TableHead>Español</TableHead><TableHead>Inglés</TableHead></TableRow></TableHeader>
                <TableBody>
                    {data.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell>{item.spanish}</TableCell>
                            <TableCell>{item.english}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);

const TimeContent = () => {
    const timeImage = PlaceHolderImages.find(p => p.id === 'telling-time');
    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader><CardTitle>La Hora</CardTitle></CardHeader>
            <CardContent className="flex justify-center">
                {timeImage && <Image src={timeImage.imageUrl} alt={timeImage.description} width={400} height={400} className="rounded-lg" data-ai-hint={timeImage.imageHint} />}
            </CardContent>
        </Card>
    );
};

const SimpleExercise = ({ title, onComplete, exerciseData }: { title: string; onComplete: () => void, exerciseData: { spanish: string, answer: string[] }[] }) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [validation, setValidation] = useState<'correct' | 'incorrect' | 'unchecked'>('unchecked');
    const [completedCount, setCompletedCount] = useState(0);

    const currentPrompt = exerciseData[currentIndex];

    const handleCheck = () => {
        const isCorrect = currentPrompt.answer.includes(userAnswer.trim().toLowerCase());
        setValidation(isCorrect ? 'correct' : 'incorrect');
        if (isCorrect) {
            toast({ title: '¡Correcto!' });
            if(validation !== 'correct') {
                setCompletedCount(c => c + 1);
            }
        } else {
            toast({ variant: 'destructive', title: 'Incorrecto' });
        }
    };
    
    const handleNext = () => {
        if(currentIndex < exerciseData.length - 1) {
            setCurrentIndex(i => i + 1);
            setUserAnswer('');
            setValidation('unchecked');
        } else {
            onComplete();
        }
    };

    return (
         <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <Progress value={(completedCount / exerciseData.length) * 100} className="mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-muted-foreground">Traduce: "{currentPrompt.spanish}"</p>
                <Input value={userAnswer} onChange={e => setUserAnswer(e.target.value)} className={cn(validation === 'correct' && 'border-green-500', validation === 'incorrect' && 'border-destructive')} />
            </CardContent>
            <CardFooter className="justify-between">
                <Button onClick={handleCheck}>Verificar</Button>
                <Button onClick={handleNext} disabled={validation !== 'correct'}>Siguiente</Button>
            </CardFooter>
        </Card>
    );
};

const ICONS = { locked: Lock, active: BookOpen, completed: CheckCircle };
const progressStorageVersion = "_v1_sequential_intro2_kids";

interface Student {
    role?: 'admin' | 'student';
    lessonProgress?: any;
    progress?: Record<string, number>;
}

export default function Intro2Page() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const router = useRouter();

    const [isClient, setIsClient] = useState(false);
    const [intro2Path, setIntro2Path] = useState<Intro2PathItem[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [selectedTopicKey, setSelectedTopicKey] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [previousPath, setPreviousPath] = useState<Intro2PathItem[] | null>(null);
    
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<Student>(studentDocRef);
    const guideFishImage = PlaceHolderImages.find(p => p.id === 'guide-fish');
    
    const isAdmin = useMemo(() => {
        if (!user) return false;
        return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
    }, [user, studentProfile]);
    
    const initialLearningPath = useMemo(() => getIntro2PathData(t), [t]);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient || isProfileLoading || !initialLearningPath.length) return;

        let path: Intro2PathItem[] = initialLearningPath.map((item, index) => ({
            ...item,
            status: index === 0 ? 'active' : 'locked',
        }));

        if (isAdmin) {
            path.forEach(topic => { topic.status = 'completed'; });
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedStatuses = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => {
                if (savedStatuses[item.key]) {
                    item.status = savedStatuses[item.key];
                }
            });
        }
        
        setIntro2Path(path);
        
        if (!initialLoadComplete) {
            const firstActive = path.find(p => p.status === 'active');
            if(firstActive) {
                setSelectedTopic(firstActive.name);
                setSelectedTopicKey(firstActive.key);
            } else if(path.length > 0) {
                setSelectedTopic(path[0].name);
                setSelectedTopicKey(path[0].key);
            }
            setInitialLoadComplete(true);
        }
    }, [t, isAdmin, isClient, isProfileLoading, studentProfile, initialLearningPath, initialLoadComplete]);

    const progress = useMemo(() => {
        const completedItems = intro2Path.filter(item => item.status === 'completed').length;
        return intro2Path.length > 0 ? Math.round((completedItems / intro2Path.length) * 100) : 0;
    }, [intro2Path]);
    
    useEffect(() => {
        if (!isClient || isProfileLoading || !initialLoadComplete || intro2Path.length === 0) return;

        if (!isAdmin && studentDocRef) {
            const statusOnly = intro2Path.reduce((acc, item) => ({...acc, [item.key]: item.status}), {});
            updateDocumentNonBlocking(studentDocRef, {
                [`lessonProgress.${progressStorageVersion}`]: statusOnly,
                'progress.kidsIntro2Progress': progress,
            });
            window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
    }, [intro2Path, progress, isAdmin, isClient, studentDocRef, isProfileLoading, initialLoadComplete]);

    useEffect(() => {
        if (previousPath && !isAdmin) {
            const newlyUnlocked = intro2Path.find((newItem, index) => {
                const oldItem = previousPath?.[index];
                return oldItem && oldItem.status === 'locked' && newItem.status === 'active';
            });
        
            if (newlyUnlocked) {
                toast({
                    title: '¡Siguiente tema desbloqueado!',
                    description: `Ahora puedes continuar con ${newlyUnlocked.name}`,
                });
            }
        }
        setPreviousPath(intro2Path);
    }, [intro2Path, previousPath, toast, isAdmin]);
    
    useEffect(() => {
        if (!topicToComplete) return;

        setIntro2Path(currentPath => {
            const newPath = currentPath.map(item => ({ ...item }));
            const currentIndex = newPath.findIndex(item => item.key === topicToComplete);
            
            if (currentIndex !== -1 && newPath[currentIndex].status !== 'completed') {
                newPath[currentIndex].status = 'completed';

                const nextIndex = currentIndex + 1;
                if (nextIndex < newPath.length && newPath[nextIndex].status === 'locked') {
                    newPath[nextIndex].status = 'active';
                }
            }
            return newPath;
        });

        setTopicToComplete(null);
    }, [topicToComplete]);

    const handleTopicSelect = (topicName: string) => {
        const currentItem = intro2Path.find(item => item.name === topicName);
        if (!isAdmin && (!currentItem || currentItem.status === 'locked')) return;
        
        setSelectedTopic(topicName);
        setSelectedTopicKey(currentItem!.key);
        
        const viewOnlyTopics = ['tip', 'greetings', 'farewells', 'time'];
        if (viewOnlyTopics.includes(currentItem!.key)) {
            setTopicToComplete(currentItem!.key);
        }
    };
  
    const renderContent = () => {
        switch(selectedTopicKey) {
            case 'tip': return <TipContent />;
            case 'mixed1': return <SimpleExercise title="Ejercicios Mixtos 1" exerciseData={mixedExercise1Data} onComplete={() => setTopicToComplete('mixed1')} />;
            case 'greetings': return <GreetingsFarewellsContent title="Saludos" data={greetingsData} />;
            case 'farewells': return <GreetingsFarewellsContent title="Despedidas" data={farewellsData} />;
            case 'mixed2': return <SimpleExercise title="Ejercicios Mixtos 2" exerciseData={mixedExercise2Data} onComplete={() => setTopicToComplete('mixed2')} />;
            case 'time': return <TimeContent />;
            case 'time-exercise': return <div><p>Time exercise placeholder.</p><Button onClick={() => setTopicToComplete('time-exercise')}>Complete</Button></div>;
            case 'countries': return <div><p>Countries exercise placeholder.</p><Button onClick={() => setTopicToComplete('countries')}>Complete</Button></div>;
            default:
                return (
                    <Card className="h-full">
                        <CardHeader className="text-center">
                            <CardTitle className="text-3xl">¡Bienvenido a la Aventura Intro 2!</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center px-6 pb-6">
                            <p className="pt-4 text-lg">Selecciona un tema de la ruta de aprendizaje para comenzar.</p>
                            <div className="flex items-center justify-center pt-8 gap-2">
                                {guideFishImage && <Image src={guideFishImage.imageUrl} alt={guideFishImage.description} width={191} height={191} className="rounded-lg object-cover" data-ai-hint={guideFishImage.imageHint} />}
                            </div>
                        </CardContent>
                    </Card>
                );
        }
    };
    
    return (
        <div className="flex w-full flex-col ingles-dashboard-bg min-h-screen">
          <DashboardHeader />
          <main className="flex-1 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="grid gap-8 md:grid-cols-12">
                <div className="md:col-span-9">
                    <Link href="/kids/intro" className="hover:underline">
                        <h1 className="text-4xl font-bold mb-8 dark:text-primary">{t('introCoursePage.intro2')}</h1>
                    </Link>
                    {isClient ? renderContent() : <div className="flex h-[500px] w-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin"/></div>}
                </div>
                <div className="md:col-span-3">
                    <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple">
                        <CardHeader><CardTitle>{t('intro1Page.learningPath')}</CardTitle></CardHeader>
                        <CardContent>
                            <nav>
                                <ul className="space-y-1">
                                {intro2Path.map((item, index) => {
                                    const Icon = ICONS[item.status];
                                    const isLocked = item.status === 'locked';
                                    const isSelected = selectedTopic === item.name;
                                    const isActive = item.status === 'active';
                                    
                                    return(
                                        <li key={item.key} onClick={() => handleTopicSelect(item.name)} className={cn(!isLocked || isAdmin ? "cursor-pointer" : "cursor-not-allowed")}>
                                            <div className={cn(
                                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                                (!isLocked || isAdmin) && "hover:bg-muted",
                                                isSelected ? "bg-muted text-primary font-semibold" : (isActive ? "text-foreground" : "text-muted-foreground")
                                            )}>
                                                <item.icon className={cn("h-5 w-5", isLocked && !isAdmin ? "text-yellow-500" : (item.status === 'completed' || isSelected || isActive) ? "text-primary" : "text-muted-foreground")} />
                                                <span>{item.name}</span>
                                            </div>
                                        </li>
                                    );
                                })}
                                </ul>
                            </nav>
                            <div className="mt-6">
                                <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2">
                                    <span>{t('intro1Page.progress')}</span>
                                    <span className="font-bold text-foreground">{progress}%</span>
                                </div>
                                <div className="relative"><Progress value={progress} className="h-2" /></div>
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
