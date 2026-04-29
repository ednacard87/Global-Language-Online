
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
  X
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/language-context';
import { getIntro2PathData, type Intro2PathItem } from '@/lib/course-data';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { TimeExercise } from '@/components/kids/exercises/time-exercise';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const ICONS: { [key: string]: React.ElementType } = { locked: Lock, active: BookOpen, completed: CheckCircle };

// By changing this version, we can force a progress reset for all users
// if there's a breaking change in the path structure.
const progressStorageVersion = "_v1_sequential_intro2";
interface Student {
    role?: 'admin' | 'student';
    lessonProgress?: any;
    progress?: Record<string, number>;
}

const CountriesExercise = ({ onComplete }: { onComplete: () => void }) => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const countriesData = [
        { country: "ESTADOS UNIDOS", nationality: "ESTADOUNIDENSE", language: "INGLÉS", englishCountry: "UNITED STATES" },
        { country: "CANADA", nationality: "CANADIENSE", language: "INGLÉS / FRANCÉS", englishCountry: "CANADA" },
        { country: "MÉXICO", nationality: "MEXICANO", language: "ESPAÑOL", englishCountry: "MEXICO" },
        { country: "BRASIL", nationality: "BRASILERO", language: "PORTUGUÉS", englishCountry: "BRAZIL" },
        { country: "INGLATERRA", nationality: "INGLÉS", language: "INGLÉS", englishCountry: "ENGLAND" },
        { country: "FRANCIA", nationality: "FRANCÉS", language: "FRANCÉS", englishCountry: "FRANCE" },
        { country: "ALEMANIA", nationality: "ALEMÁN", language: "ALEMÁN", englishCountry: "GERMANY" },
        { country: "ITALIA", nationality: "ITALIANO", language: "ITALIANO", englishCountry: "ITALY" },
        { country: "JAPÓN", nationality: "JAPONÉS", language: "JAPONÉS", englishCountry: "JAPAN" },
        { country: "CHINA", nationality: "CHINO", language: "CHINO", englishCountry: "CHINA" },
        { country: "AUSTRALIA", nationality: "AUSTRALIANO", language: "INGLÉS", englishCountry: "AUSTRALIA" },
        { country: "COLOMBIA", nationality: "COLOMBIANO", language: "ESPAÑOL", englishCountry: "COLOMBIA" },
    ];
    
    const [userAnswers, setUserAnswers] = useState<string[]>(Array(countriesData.length).fill(''));

    const handleInputChange = (index: number, value: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[index] = value;
        setUserAnswers(newAnswers);
    };

    const handleCheckAnswers = () => {
        const allCorrect = userAnswers.every((answer, index) => answer.toLowerCase() === countriesData[index].englishCountry.toLowerCase());
        if (allCorrect) {
            toast({ title: t('countries.allCorrect') });
            onComplete();
        } else {
            toast({ variant: 'destructive', title: t('countries.someIncorrect') });
        }
    };

    return (
        <Card>
            <CardHeader><CardTitle>{t('intro2Page.countries')}</CardTitle><CardDescription>{t('intro2Page.countriesDescription')}</CardDescription></CardHeader>
            <CardContent>
                <div className="grid grid-cols-4 gap-2 text-center text-sm font-semibold text-muted-foreground p-2 bg-muted rounded-t-lg">
                    <span>{t('intro2Page.tableCountry')}</span><span>{t('intro2Page.tableNationalities')}</span><span>{t('intro2Page.tableLanguage')}</span><span>{t('intro2Page.tableCountries')} (inglés)</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center border rounded-b-lg p-2">
                    {countriesData.map((c, i) => (
                        <React.Fragment key={i}>
                            <span>{c.country}</span>
                            <span>{c.nationality}</span>
                            <span>{c.language}</span>
                            <Input value={userAnswers[i] || ''} onChange={e => handleInputChange(i, e.target.value)} />
                        </React.Fragment>
                    ))}
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleCheckAnswers}>{t('countries.checkAnswers')}</Button>
            </CardFooter>
        </Card>
    );
};

const greetingsData = [
    { spanish: 'Hola', english: 'Hello' }, { spanish: 'Buenos días', english: 'Good morning' },
    { spanish: 'Buenas tardes', english: 'Good afternoon' }, { spanish: 'Buenas noches (saludo)', english: 'Good evening' },
    { spanish: '¿Cómo estás?', english: 'How are you?' }, { spanish: '¿Qué tal?', english: "What's up?" }, { spanish: '¿Cómo vas?', english: 'How is it going?' },
];

const farewellsData = [
    { spanish: 'Adiós', english: 'Goodbye' }, { spanish: 'Chao', english: 'Bye' },
    { spanish: 'Hasta luego', english: 'See you later' }, { spanish: 'Hasta pronto', english: 'See you soon' },
    { spanish: 'Buenas noches (despedida)', english: 'Good night' }, { spanish: 'Cuídate', english: 'Take care' },
    { spanish: 'Nos vemos mañana', english: 'See you tomorrow' }, { spanish: 'Que tengas un buen día', english: 'Have a nice day' },
];

export default function Intro2Page() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const router = useRouter();
    
    const [initialLearningPath, setInitialLearningPath] = useState<Intro2PathItem[]>([]);
    const [intro2Path, setIntro2Path] = useState<Intro2PathItem[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [selectedTopicKey, setSelectedTopicKey] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [previousPath, setPreviousPath] = useState<Intro2PathItem[] | null>(null);

    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const studentDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'students', user.uid) : null),
        [firestore, user]
    );
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<Student>(studentDocRef);
    const guideFishImage = PlaceHolderImages.find(p => p.id === 'guide-fish');
    const timeImage = PlaceHolderImages.find(p => p.id === 'telling-time');

    const isAdmin = useMemo(() => {
        if (!user) return false;
        return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
    }, [user, studentProfile]);

    useEffect(() => {
        setIsClient(true);
        setInitialLearningPath(getIntro2PathData(t));
    }, [t]);
    
    useEffect(() => {
        if (isProfileLoading || !isClient || initialLearningPath.length === 0) return;
    
        let path = initialLearningPath.map(item => ({...item, status: 'locked'}));
        path[0].status = 'active';
    
        if (isAdmin) {
            path.forEach(item => (item.status = 'active'));
        } else {
            const versionedKey = 'intro2Path' + progressStorageVersion;
            if (studentProfile?.lessonProgress?.[versionedKey]) {
                const savedStatuses = studentProfile.lessonProgress[versionedKey];
                path = path.map(item => ({
                    ...item,
                    status: savedStatuses[item.key] || item.status,
                }));
            }
        }
        
        setIntro2Path(path);
        
        if (!selectedTopicKey) {
            const firstActive = path.find(p => p.status === 'active');
            if (firstActive) {
                setSelectedTopic(firstActive.name);
                setSelectedTopicKey(firstActive.key);
            } else if (path.length > 0) {
                setSelectedTopic(path[0].name);
                setSelectedTopicKey(path[0].key);
            }
        }
    }, [isClient, isProfileLoading, isAdmin, studentProfile, initialLearningPath, selectedTopicKey]);

    const completedItems = useMemo(() => intro2Path.filter(item => item.status === 'completed').length, [intro2Path]);
    const progress = useMemo(() => intro2Path.length > 0 ? Math.round((completedItems / intro2Path.length) * 100) : 0, [completedItems, intro2Path.length]);

    useEffect(() => {
        if (!isClient || isProfileLoading || isAdmin) return;
    
        const newPathString = JSON.stringify(intro2Path.map(p => ({ key: p.key, status: p.status })));
        const prevPathString = JSON.stringify(previousPath?.map(p => ({ key: p.key, status: p.status })));
    
        if (newPathString !== prevPathString && studentDocRef) {
            const statuses = intro2Path.reduce((acc, item) => ({ ...acc, [item.key]: item.status }), {});
            updateDocumentNonBlocking(studentDocRef, {
                [`lessonProgress.${'intro2Path' + progressStorageVersion}`]: statuses,
                'progress.kidsIntro2Progress': progress,
            });
            window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
        setPreviousPath(intro2Path);
    }, [intro2Path, progress, isAdmin, isClient, studentDocRef, isProfileLoading, previousPath]);


    useEffect(() => {
        if (!topicToComplete) return;

        setIntro2Path(currentPath => {
            const newPath = [...currentPath];
            const currentItemIndex = newPath.findIndex(item => item.key === topicToComplete);
            
            if (currentItemIndex !== -1 && newPath[currentItemIndex].status !== 'completed') {
                newPath[currentItemIndex] = { ...newPath[currentItemIndex], status: 'completed' };

                const nextItemIndex = currentItemIndex + 1;
                if (nextItemIndex < newPath.length && newPath[nextItemIndex].status === 'locked') {
                    newPath[nextItemIndex] = { ...newPath[nextItemIndex], status: 'active' };
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

    const handleExerciseComplete = () => {
        if(selectedTopicKey) {
            setTopicToComplete(selectedTopicKey);
        }
    }

    
  const renderContent = () => {
    switch (selectedTopicKey) {
        case 'tip':
            return (
                <div className="space-y-4">
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader><CardTitle>SUSTANTIVO: NOUN</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">PERSONA, ANIMAL O COSA (singular- plural)</p>
                            <Accordion type="multiple" className="w-full">
                                <AccordionItem value="regular">
                                    <AccordionTrigger>REGULAR: noun+ s</AccordionTrigger>
                                    <AccordionContent>
                                        <code className="block bg-muted p-2 rounded-md font-mono">computer: computers // house: houses // car: cars</code>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="irregular">
                                    <AccordionTrigger>IRREGULAR: noun+es</AccordionTrigger>
                                    <AccordionContent className="space-y-2">
                                        <p>Para sustantivos que terminan en: s, z, sh, ch, x (bus) se agrega “ES”</p>
                                        <code className="block bg-muted p-2 rounded-md font-mono">address: Addresses // beach: beaches // bus: buses</code>
                                        <p>Para sustantivos que terminan en “Y” se cancela la “Y” y se agrega “ies”</p>
                                        <code className="block bg-muted p-2 rounded-md font-mono">country: countries // university: universities</code>
                                        <p>Completamente irregular:</p>
                                        <code className="block bg-muted p-2 rounded-md font-mono">Man: men // woman: women // child: children // person: people</code>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                         <CardHeader><CardTitle>ADJETIVO: ADJECTIVE</CardTitle></CardHeader>
                         <CardContent className="space-y-2">
                             <p>DESCRIBE EL SUSTANTIVO (COLOR, CUALIDAD, CARACTERISTICA.) – (los adjetivos siempre van en singular es decir en su forma original)</p>
                            <Card className="bg-yellow-100 dark:bg-yellow-900/20 border-yellow-500">
                                <CardHeader><CardTitle className="text-yellow-800 dark:text-yellow-300">NOTICAS IMPORTANTES</CardTitle></CardHeader>
                                <CardContent>
                                    <p>En español primero se habla del sustantivo y luego del adjetivo:</p>
                                    <code className="block bg-background p-2 rounded-md font-mono my-2 text-sm">El carro blanco<br/>el lapicero azul<br/>el computador gris</code>
                                    <p>Pero en INGLES primero se habla del adjetivo y luego del sustantivo:</p>
                                    <code className="block bg-background p-2 rounded-md font-mono mt-2 text-sm">the white car<br/>The red pen<br/>the grey computer</code>
                                </CardContent>
                            </Card>
                         </CardContent>
                    </Card>
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader><CardTitle>VERBO: VERB</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <p>ACCIÓN. VERBOS INFINITIVO = " TO ". Un verbo en infinitivo es un verbo que no está conjugado.</p>
                            <div className="grid grid-cols-2 gap-4">
                                <code className="block bg-muted p-2 rounded-md font-mono text-center">ESPAÑOL<br/>AR = Hablar<br/>ER = Comer<br/>IR = Vivir<br/>SER<br/>ESTAR</code>
                                <code className="block bg-muted p-2 rounded-md font-mono text-center">ENGLISH<br/>= TO speak<br/>= TO eat<br/>= TO Live<br/>= To Be<br/>= To be</code>
                            </div>
                            <h4 className="font-semibold pt-4">CONJUGACION</h4>
                            <p>Cuando estamos utilizando la conjugación el verbo pierde la palabra = To</p>
                            <code className="block bg-muted p-2 rounded-md font-mono">pronombre + verbo<br/>i speak<br/><span className="text-destructive">i to speak (yo hablar)</span></code>
                        </CardContent>
                    </Card>
                     <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader><CardTitle>PRONOUNS</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <p>Muchas frases no tienen pronombres, entonces las frases pueden TENER:</p>
                            <ul className="list-disc list-inside pl-4">
                                <li>Nombre propio: Viviana, Edna, Ana, Cristal</li>
                                <li>Sustantivo: (persona, animal, cosa) - carro, casa, finca</li>
                                <li>Demostrativos: This – these – that – those</li>
                            </ul>
                            <code className="block bg-muted p-2 rounded-md font-mono">he is at home = pronoun<br/>Thomas is at home = Nombre propio<br/>my father is at home = Sustantivo<br/>this is my house = Demostrativo</code>
                             <Card className="bg-destructive/10 border-destructive">
                                <CardHeader><CardTitle className="text-destructive">NOTA:</CardTitle></CardHeader>
                                <CardContent>
                                    <p>Nunca se pueden utilizar un pronombre con un sustantivo o un pronombre con un nombre propio al mismo tiempo.</p>
                                    <code className="block bg-background p-2 rounded-md font-mono mt-2 text-sm flex items-center gap-2"><X className="text-destructive h-4 w-4"/> Thomas he is at home (Thomas él está en la casa)</code>
                                    <code className="block bg-background p-2 rounded-md font-mono mt-2 text-sm flex items-center gap-2"><X className="text-destructive h-4 w-4"/> he my father is at home (él mi padre está en la casa)</code>
                                </CardContent>
                            </Card>
                        </CardContent>
                    </Card>
                </div>
            )
        case 'mixed1':
            return <SimpleTranslationExercise course="intro" exerciseKey="mixed1" onComplete={handleExerciseComplete} />;
        case 'mixed2':
            return <SimpleTranslationExercise course="intro" exerciseKey="mixed2" onComplete={handleExerciseComplete} />;
        case 'greetings':
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader><CardTitle>{t('intro2Page.greetings')}</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                            <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.spanish')}</div>
                            <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.english')}</div>
                            {greetingsData.map((item, index) => (
                                <React.Fragment key={index}>
                                    <div className="p-3 bg-card border rounded-lg text-center">{item.spanish}</div>
                                    <div className="p-3 bg-card border rounded-lg font-medium text-center">{item.english}</div>
                                </React.Fragment>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            );
        case 'farewells':
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader><CardTitle>{t('intro2Page.farewells')}</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                            <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.spanish')}</div>
                            <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.english')}</div>
                            {farewellsData.map((item, index) => (
                                <React.Fragment key={index}>
                                    <div className="p-3 bg-card border rounded-lg text-center">{item.spanish}</div>
                                    <div className="p-3 bg-card border rounded-lg font-medium text-center">{item.english}</div>
                                </React.Fragment>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            );
        case 'time':
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>{t('intro2Page.time')}</CardTitle>
                        <CardDescription>{t('intro2Page.timeDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        {timeImage && <Image
                            src={timeImage.imageUrl}
                            alt={timeImage.description}
                            width={600 * 1.2}
                            height={848 * 1.2}
                            className="rounded-lg object-contain"
                            data-ai-hint={timeImage.imageHint}
                        />}
                    </CardContent>
                </Card>
            );
        case 'time-exercise':
            return <TimeExercise onComplete={() => setTopicToComplete('time-exercise')} />;
        case 'countries':
            return <CountriesExercise onComplete={handleExerciseComplete} />;
        default:
            if (selectedTopic) {
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>{selectedTopic}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>{t('intro1Page.mainContentPlaceholder', { topic: selectedTopic })}</p>
                        </CardContent>
                    </Card>
                );
            }
            return (
                <div className="flex flex-col items-center scale-110">
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader className="text-center">
                            <CardTitle className="text-3xl">{t('intro2Page.welcomeTitle')}</CardTitle>
                            <CardDescription className="text-base">{t('intro1Page.welcomeDescription')}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center px-6 pb-6">
                            <p className="pt-4 text-lg">{t('intro2Page.welcomeHint')}</p>
                        </CardContent>
                    </Card>
                    <div className="flex items-center justify-center pt-8 gap-2">
                        <div className="relative bg-card p-4 rounded-lg shadow-soft text-center text-base max-w-[220px] border-2 border-brand-purple">
                            <p className="font-bold text-lg bg-gradient-to-r from-brand-purple to-brand-teal text-transparent bg-clip-text">{t('introCoursePage.penguinHint')}</p>
                            <div className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-card" />
                        </div>
                        {guideFishImage && <Image
                            src={guideFishImage.imageUrl}
                            alt={guideFishImage.description}
                            width={191}
                            height={191}
                            className="rounded-lg object-cover"
                            data-ai-hint={guideFishImage.imageHint}
                        />}
                    </div>
                </div>
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
                    {renderContent()}
                </div>
                <div className="md:col-span-3">
                    <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>{t('intro1Page.learningPath')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <nav>
                            <ul className="space-y-1">
                            {intro2Path.map((item, index) => {
                                const Icon = item.icon || BookOpen;
                                const isLocked = item.status === 'locked';
                                const isSelected = selectedTopic === item.name;
                                const isActive = item.status === 'active';
                                
                                const itemContent = (
                                    <div className={cn(
                                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                        !isLocked && "hover:bg-muted",
                                        isSelected ? "bg-muted text-primary font-semibold" : (isActive ? "text-foreground" : "text-muted-foreground")
                                    )}>
                                        <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500" : (item.status === 'completed' || isSelected || isActive) ? "text-primary" : "text-muted-foreground")} />
                                        <span>{item.name}</span>
                                    </div>
                                );

                                return (
                                    <li key={index} onClick={() => handleTopicSelect(item.name)} className={cn(!isLocked || isAdmin ? "cursor-pointer" : "cursor-not-allowed")}>
                                        {itemContent}
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
                            <div className="relative">
                                <Progress value={progress} className="h-2" style={{'--indicator-color': 'hsl(var(--primary))'} as React.CSSProperties} />
                                <div className="absolute inset-0 flex w-full">
                                    {[...Array(7)].map((_, i) => (
                                        <div key={i} className="flex-1 h-full border-r-2 border-background last:border-r-0"></div>
                                    ))}
                                </div>
                            </div>
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
