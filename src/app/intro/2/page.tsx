'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, CheckCircle, Lock, ArrowRight, Swords, Hand, MessageSquare, BrainCircuit, PenSquare, Lightbulb, Clock } from 'lucide-react';
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

const ICONS = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const countriesExerciseData = [
    { pais: 'Estados Unidos', country: 'United States', nationality: 'American', language: 'English' },
    { pais: 'Canadá', country: 'Canada', nationality: 'Canadian', language: ['English', 'French'] },
    { pais: 'México', country: 'Mexico', nationality: 'Mexican', language: 'Spanish' },
    { pais: 'Brasil', country: 'Brazil', nationality: 'Brazilian', language: 'Portuguese' },
    { pais: 'Inglaterra', country: 'England', nationality: 'English', language: 'English' },
    { pais: 'Reino Unido', country: 'United Kingdom', nationality: 'British', language: 'English' },
    { pais: 'Francia', country: 'France', nationality: 'French', language: 'French' },
    { pais: 'Alemania', country: 'Germany', nationality: 'German', language: 'German' },
    { pais: 'Italia', country: 'Italy', nationality: 'Italian', language: 'Italian' },
    { pais: 'España', country: 'Spain', nationality: 'Spanish', language: 'Spanish' },
    { pais: 'Portugal', country: 'Portugal', nationality: 'Portuguese', language: 'Portuguese' },
    { pais: 'China', country: 'China', nationality: 'Chinese', language: 'Mandarin' },
    { pais: 'Japón', country: 'Japan', nationality: 'Japanese', language: 'Japanese' },
    { pais: 'Corea del Sur', country: 'South Korea', nationality: 'South Korean', language: 'Korean' },
    { pais: 'India', country: 'India', nationality: 'Indian', language: ['Hindi', 'English'] },
    { pais: 'Rusia', country: 'Russia', nationality: 'Russian', language: 'Russian' },
    { pais: 'Australia', country: 'Australia', nationality: 'Australian', language: 'English' },
    { pais: 'Colombia', country: 'Colombia', nationality: 'Colombian', language: 'Spanish' },
];

type CountryAnswers = { country: string; nationality: string; language: string; };
type UserAnswers = Record<number, Partial<CountryAnswers>>;
type ValidationStatus = 'correct' | 'incorrect' | 'unchecked';
type ValidationState = Record<number, Record<keyof Omit<CountryAnswers, 'pais'>, ValidationStatus>>;


const CountriesExercise = ({ onComplete }: { onComplete: () => void }) => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
    const [validationStatus, setValidationStatus] = useState<ValidationState>({});
    const [isCompleted, setIsCompleted] = useState(false);

    const handleInputChange = (index: number, field: keyof Omit<CountryAnswers, 'pais'>, value: string) => {
        setUserAnswers(prev => ({
            ...prev,
            [index]: {
                ...prev[index],
                [field]: value
            }
        }));
         // Reset validation on change
        setValidationStatus(prev => {
            const newStatus = { ...prev };
            if (newStatus[index]) {
                delete newStatus[index][field];
            }
            return newStatus;
        });
        setIsCompleted(false);
    };

    const handleCheckAnswers = () => {
        let allCorrect = true;
        const newValidationStatus: ValidationState = {};

        countriesExerciseData.forEach((correctAnswer, index) => {
            const userAnswer = userAnswers[index] || {};
            newValidationStatus[index] = { country: 'unchecked', nationality: 'unchecked', language: 'unchecked' };

            const checkField = (field: keyof Omit<CountryAnswers, 'pais'>) => {
                const correctValue = correctAnswer[field];
                const userValue = (userAnswer[field] || '').trim().toLowerCase();

                let isCorrect = false;
                if (Array.isArray(correctValue)) {
                    isCorrect = correctValue.some(val => val.toLowerCase() === userValue) || 
                                correctValue.join(' / ').toLowerCase() === userValue;
                } else {
                    isCorrect = correctValue.toLowerCase() === userValue;
                }

                if (isCorrect) {
                    newValidationStatus[index][field] = 'correct';
                } else {
                    newValidationStatus[index][field] = 'incorrect';
                    allCorrect = false;
                }
            };

            checkField('country');
            checkField('nationality');
            checkField('language');
        });

        setValidationStatus(newValidationStatus);

        if (allCorrect) {
            toast({ title: t('countries.allCorrect') });
            setIsCompleted(true);
        } else {
            toast({ variant: 'destructive', title: t('countries.someIncorrect') });
            setIsCompleted(false);
        }
    };

    const getInputClass = (index: number, field: keyof Omit<CountryAnswers, 'pais'>) => {
        const status = validationStatus[index]?.[field];
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive';
        return '';
    };

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>{t('intro2Page.countries')}</CardTitle>
                <CardDescription>{t('intro2Page.countriesDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('intro2Page.tableCountry')}</TableHead>
                            <TableHead>{t('intro2Page.tableCountries')}</TableHead>
                            <TableHead>{t('intro2Page.tableNationalities')}</TableHead>
                            <TableHead>{t('intro2Page.tableLanguage')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {countriesExerciseData.map((data, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{data.pais}</TableCell>
                                <TableCell>
                                    <Input
                                        value={userAnswers[index]?.country || ''}
                                        onChange={(e) => handleInputChange(index, 'country', e.target.value)}
                                        className={cn(getInputClass(index, 'country'))}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        value={userAnswers[index]?.nationality || ''}
                                        onChange={(e) => handleInputChange(index, 'nationality', e.target.value)}
                                        className={cn(getInputClass(index, 'nationality'))}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        value={userAnswers[index]?.language || ''}
                                        onChange={(e) => handleInputChange(index, 'language', e.target.value)}
                                        className={cn(getInputClass(index, 'language'))}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter>
                 {isCompleted ? (
                    <Button onClick={onComplete}>Terminar Intro 2</Button>
                ) : (
                    <Button onClick={handleCheckAnswers}>{t('countries.checkAnswers')}</Button>
                )}
            </CardFooter>
        </Card>
    );
};


// By changing this version, we can force a progress reset for all users
// if there's a breaking change in the path structure.
const progressStorageVersion = "_v1_sequential_intro2";
interface Student {
    role?: 'admin' | 'student';
    lessonProgress?: any;
    progress?: Record<string, number>;
}
export default function Intro2Page() {
    const { t } = useTranslation();
    const [intro2Path, setIntro2Path] = useState<Intro2PathItem[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [selectedTopicKey, setSelectedTopicKey] = useState<string | null>(null);

    const { user } = useUser();
    const firestore = useFirestore();
    const studentDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'students', user.uid) : null),
        [firestore, user]
    );
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<Student>(studentDocRef);
    const guideFishImage = PlaceHolderImages.find(p => p.id === 'guide-fish');
    const timeImage = PlaceHolderImages.find(p => p.id === 'telling-time');

    const greetingsData = [
        { spanish: 'Hola', english: 'Hello' },
        { spanish: 'Buenos días', english: 'Good morning' },
        { spanish: 'Buenas tardes', english: 'Good afternoon' },
        { spanish: 'Buenas noches (saludo)', english: 'Good evening' },
        { spanish: '¿Cómo estás?', english: 'How are you?' },
        { spanish: '¿Qué tal?', english: "What's up?" },
        { spanish: '¿Cómo vas?', english: 'How is it going?' },
    ];
    
    const farewellsData = [
        { spanish: 'Adiós', english: 'Goodbye' },
        { spanish: 'Chao', english: 'Bye' },
        { spanish: 'Hasta luego', english: 'See you later' },
        { spanish: 'Hasta pronto', english: 'See you soon' },
        { spanish: 'Buenas noches (despedida)', english: 'Good night' },
        { spanish: 'Cuídate', english: 'Take care' },
        { spanish: 'Nos vemos mañana', english: 'See you tomorrow' },
        { spanish: 'Que tengas un buen día', english: 'Have a nice day' },
    ];

    const isAdmin = useMemo(() => {
        if (!user) return false;
        return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
    }, [user, studentProfile]);


    useEffect(() => {
        if (isProfileLoading) return;
        const initialIntroPath = getIntro2PathData(t);
    
        const loadPath = (storageKey: string, defaultPath: any[]) => {
            if (isAdmin) {
                return defaultPath.map(item => ({ ...item, status: 'active' }));
            }
            const versionedKey = storageKey + progressStorageVersion;
            
            if (studentProfile?.lessonProgress?.[versionedKey]) {
                const savedStatuses = studentProfile.lessonProgress[versionedKey];
                return defaultPath.map(item => ({
                    ...item,
                    status: savedStatuses[item.key] || item.status
                }));
            }

            try {
                const savedStatusJSON = localStorage.getItem(versionedKey);
                if (savedStatusJSON) {
                    const savedStatuses = JSON.parse(savedStatusJSON);
                    return defaultPath.map(item => ({
                        ...item,
                        status: savedStatuses[item.key] || item.status
                    }));
                }
            } catch (e) {
                console.error(`Failed to load path from ${versionedKey}`, e);
            }
            return defaultPath;
        };
    
        setIntro2Path(loadPath('intro2Path', initialIntroPath));

    }, [t, isAdmin, isProfileLoading, studentProfile]);

    const completeTopic = (topicKey: string) => {
        setIntro2Path(currentPath => {
            const newPath = [...currentPath];
            const currentItemIndex = newPath.findIndex(item => item.key === topicKey);
            
            if (currentItemIndex !== -1 && newPath[currentItemIndex].status !== 'completed') {
                newPath[currentItemIndex] = { ...newPath[currentItemIndex], status: 'completed' };

                const nextItemIndex = currentItemIndex + 1;
                if (nextItemIndex < newPath.length && newPath[nextItemIndex].status === 'locked') {
                    newPath[nextItemIndex] = { ...newPath[nextItemIndex], status: 'active' };
                }
            }
            return newPath;
        });
    };

    const handleTopicSelect = (topicName: string) => {
        const currentItem = intro2Path.find(item => item.name === topicName);
        if (!isAdmin && (!currentItem || currentItem.status === 'locked')) return;

        setSelectedTopic(topicName);
        setSelectedTopicKey(currentItem!.key);
        
        const viewOnlyTopics = ['tip', 'greetings', 'farewells'];
        if (viewOnlyTopics.includes(currentItem!.key)) {
            completeTopic(currentItem!.key);
        }
    };

    const handleExerciseComplete = () => {
        if(selectedTopicKey) {
            completeTopic(selectedTopicKey);
        }
    }

    const completedItems = useMemo(() => intro2Path.filter(item => item.status === 'completed').length, [intro2Path]);
    const progress = useMemo(() => intro2Path.length > 0 ? Math.round((completedItems / intro2Path.length) * 100) : 0, [completedItems, intro2Path.length]);

    useEffect(() => {
        if (isProfileLoading) return;
        if (!isAdmin && studentDocRef) {
            if (intro2Path.length > 0) {
                const versionedKey = 'intro2Path' + progressStorageVersion;
                const statusOnly = intro2Path.reduce((acc, item) => ({...acc, [item.key]: item.status}), {});
                 updateDocumentNonBlocking(studentDocRef, {
                    [`lessonProgress.${versionedKey}`]: statusOnly,
                    'progress.intro2Progress': progress,
                });
            }
        }
    }, [intro2Path, progress, isAdmin, isProfileLoading, studentDocRef]);
    
  const renderContent = () => {
        if (selectedTopicKey === 'tip') {
            return (
                <div>
                <div className="mb-6">
                    <h2 className="text-3xl font-bold">{t('intro2Page.tip')}</h2>
                    <p className="text-muted-foreground">INTRODUCTORY COURSE</p>
                </div>
                <div className="space-y-6">
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle className="text-2xl text-primary">Sustantivo : Noun</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-base md:text-lg">
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li>personas</li>
                                <li>animales</li>
                                <li>cosas</li>
                            </ul>
                            <p className="pt-4 font-medium">singular y plural (s)</p>
                            <div className="mt-2 p-4 bg-muted rounded-lg font-mono text-base">
                                <p>car <span className="mx-4">→</span> cars</p>
                                <p>house <span className="mx-4">→</span> houses</p>
                            </div>
                        </CardContent>
                    </Card>
        
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle className="text-2xl text-primary">Adjetivo : Adjective</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-base md:text-lg">
                            <p>Describe el sustantivo</p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li>Color</li>
                                <li>cualidad</li>
                                <li>caracteristica fisica</li>
                            </ul>
                            <p className="pt-4 font-semibold">los adjetivos siempre son singular.</p>
                            <p className="text-sm text-muted-foreground">example :</p>
                            <div className="mt-2 p-4 bg-muted rounded-lg font-mono text-base space-y-2">
                                <p>él es inteligente <span className="mx-4">→</span> he is intelligent</p>
                                <p>ellos son inteligentes <span className="mx-4">→</span> they are intelligent</p>
                            </div>
                        </CardContent>
                    </Card>
        
                    <Card className="shadow-soft rounded-lg border-2 border-destructive">
                        <CardHeader>
                            <CardTitle className="text-2xl text-destructive">NOTA IMPORTANTE</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-base md:text-lg">
                            <div>
                                <p className="mb-2">en español primero se habla del sustantivo y luego del adjetivo.</p>
                                <p className="text-sm text-muted-foreground">Ejemplos :</p>
                                <div className="p-4 bg-muted rounded-lg font-mono text-base space-y-1 mt-2">
                                    <p>el carro blanco</p>
                                    <p>el celular morado</p>
                                    <p>el computador gris</p>
                                </div>
                            </div>
                            <p className="my-2 font-bold text-center">PERO</p>
                            <div>
                                <p className="mb-2">en ingles primero se habla del adjetivo y luego del sustantivo.</p>
                                <p className="text-sm text-muted-foreground">Example:</p>
                                <div className="p-4 bg-muted rounded-lg font-mono text-base space-y-1 mt-2">
                                    <p>the white car</p>
                                    <p>the purple cellphone</p>
                                    <p>the grey computer</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
        
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle className="text-2xl text-primary">Verbo = VERB</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-base md:text-lg">
                            <div>
                                <p>Acción.</p>
                            </div>
                            <div>
                                <p className="font-semibold">INFINITIVO.</p>
                                <p>Verbos en infinitivo. = "TO"</p>
                                <p>es un verbo que NO esta conjugado.</p>
                                <div className="mt-2 p-4 bg-muted rounded-lg font-mono text-base space-y-2">
                                    <div>
                                        <p className="font-semibold">ESPAÑOL <span className="mx-4">→</span> ENGLISH</p>
                                        <p>AR = Hablar = TO speak</p>
                                        <p>ER = Comer = TO eat</p>
                                        <p>IR = Vivir = TO live</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p className="mt-4 font-semibold">CONJUGACION.</p>
                                <p>cuando tenemos un pronombre al lado de un verbo.</p>
                                <p>cuando estamos utilizando la conjungacion el verbo pierde la palabra = "TO"</p>
                                <div className="mt-2 p-4 bg-muted rounded-lg font-mono text-base space-y-2">
                                    <p>Pronombre + verbo</p>
                                    <p>yo hablo <span className="mx-4">→</span> i speak</p>
                                    <p className="text-destructive">i to speak = yo hablar</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end">
                            <Button onClick={() => completeTopic('tip')}>Avanzar</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
            );
        }

        if (selectedTopicKey === 'mixed1' || selectedTopicKey === 'mixed2') {
            return <SimpleTranslationExercise course="intro" exerciseKey={selectedTopicKey} onComplete={handleExerciseComplete} />;
        }

        if (selectedTopicKey === 'greetings') {
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
                    <CardFooter className="justify-end">
                        <Button onClick={() => completeTopic('greetings')}>Avanzar</Button>
                    </CardFooter>
                </Card>
            );
        }

        if (selectedTopicKey === 'farewells') {
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
                    <CardFooter className="justify-end">
                        <Button onClick={() => completeTopic('farewells')}>Avanzar</Button>
                    </CardFooter>
                </Card>
            );
        }

        if (selectedTopicKey === 'time') {
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
                    <CardFooter className="justify-end">
                        <Button onClick={() => completeTopic('time')}>Avanzar</Button>
                    </CardFooter>
                </Card>
            );
        }

        if (selectedTopicKey === 'time-exercise') {
            return <TimeExercise onComplete={() => completeTopic('time-exercise')} />;
        }

        if (selectedTopicKey === 'countries') {
            return <CountriesExercise onComplete={handleExerciseComplete} />;
        }


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
    };
    
    return (
        <div className="flex w-full flex-col ingles-dashboard-bg min-h-screen">
          <DashboardHeader />
          <main className="flex-1 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="grid gap-8 md:grid-cols-12">
                <div className="md:col-span-9">
                    <Link href="/intro" className="hover:underline">
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
                                const Icon = ICONS[item.status as keyof typeof ICONS];
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
                                    <li key={index} onClick={() => handleTopicSelect(item.name)} className={cn(!isLocked ? "cursor-pointer" : "cursor-not-allowed")}>
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
