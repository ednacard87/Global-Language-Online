
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, CheckCircle, Hand, GraduationCap, Type, Activity } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
};

const progressStorageKey = 'progress_espanol_intro_1_v2'; // Bumped version for new topics
const mainProgressKey = 'progress_espanol_intro_1';

const saludosData = [
    { spanish: 'Hola', english: 'Hello' },
    { spanish: 'Buenos días', english: 'Good morning' },
    { spanish: 'Buenas tardes', english: 'Good afternoon' },
    { spanish: 'Buenas noches', english: 'Good evening / Good night' },
    { spanish: '¿Cómo estás?', english: 'How are you?' },
];

const despedidasData = [
    { spanish: 'Adiós', english: 'Goodbye' },
    { spanish: 'Hasta luego', english: 'See you later' },
    { spanish: 'Hasta mañana', english: 'See you tomorrow' },
    { spanish: 'Nos vemos', english: 'See you' },
];

const vocabularioBasico = {
    dias: [
        { spanish: 'Lunes', english: 'Monday' },
        { spanish: 'Martes', english: 'Tuesday' },
        { spanish: 'Miércoles', english: 'Wednesday' },
        { spanish: 'Jueves', english: 'Thursday' },
        { spanish: 'Viernes', english: 'Friday' },
        { spanish: 'Sábado', english: 'Saturday' },
        { spanish: 'Domingo', english: 'Sunday' },
    ],
    colores: [
        { spanish: 'Rojo', english: 'Red' },
        { spanish: 'Azul', english: 'Blue' },
        { spanish: 'Verde', english: 'Green' },
        { spanish: 'Amarillo', english: 'Yellow' },
        { spanish: 'Negro', english: 'Black' },
        { spanish: 'Blanco', english: 'White' },
    ],
};

const lecturaData = {
    title: 'Un Día en el Parque',
    content: "Hola, me llamo Ana. Hoy es lunes y el cielo está azul. Voy al parque. En el parque, veo un árbol grande y verde. También veo flores de color rojo y amarillo. Me gusta el parque. Mañana es martes. ¡Adiós!",
    questions: [
        { id: 'q1', question: '¿Cómo se llama la persona?', answer: 'ana' },
        { id: 'q2', question: '¿Qué día es hoy?', answer: 'lunes' },
        { id: 'q3', question: '¿De qué color es el cielo?', answer: 'azul' },
        { id: 'q4', question: '¿Qué colores de flores ve Ana?', answer: 'rojo y amarillo' },
    ]
};

export default function EspanolIntro1Page() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState('saludos');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);

    const [vocabAnswers, setVocabAnswers] = useState<Record<string, string[]>>({});
    const [vocabValidation, setVocabValidation] = useState<Record<string, ('correct' | 'incorrect' | 'unchecked')[]>>({});

    const [readingAnswers, setReadingAnswers] = useState<Record<string, string>>({});
    const [readingValidation, setReadingValidation] = useState<Record<string, 'correct' | 'incorrect' | 'unchecked'>>({});

    const studentDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'students', user.uid) : null),
        [firestore, user]
    );

    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string; lessonProgress?: any; progress?: any }>(studentDocRef);

    const isAdmin = useMemo(() => {
        if (!user) return false;
        return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
    }, [user, studentProfile]);
    
    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'saludos', name: 'Greetings and Farewells', icon: Hand, status: 'active' },
        { key: 'sustantivos', name: 'Nouns (Sustantivos)', icon: Type, status: 'locked' },
        { key: 'adjetivos', name: 'Adjectives (Adjetivos)', icon: GraduationCap, status: 'locked' },
        { key: 'verbos', name: 'Verbs (Verbos)', icon: Activity, status: 'locked' },
        { key: 'vocabulario', name: 'Basic Vocabulary', icon: BookOpen, status: 'locked' },
        { key: 'lectura', name: 'Reading Comprehension', icon: BookOpen, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isUserLoading || isProfileLoading) return;

        const newPath = initialLearningPath.map(item => ({...item}));
        
        if (isAdmin) {
            newPath.forEach(item => item.status = 'completed');
        } else if (studentProfile?.lessonProgress?.[progressStorageKey]) {
            const savedStatuses = studentProfile.lessonProgress[progressStorageKey];
            newPath.forEach(item => {
                if (savedStatuses[item.key]) {
                    item.status = savedStatuses[item.key];
                }
            });
        }
        
        setLearningPath(newPath);

        const firstActive = newPath.find(p => p.status === 'active');
        setSelectedTopic(firstActive?.key || 'saludos');
        
        // Init vocabulary state
        const initialAnswers: Record<string, string[]> = {};
        const initialValidation: Record<string, ('correct' | 'incorrect' | 'unchecked')[]> = {};
        Object.keys(vocabularioBasico).forEach(category => {
            const items = vocabularioBasico[category as keyof typeof vocabularioBasico];
            initialAnswers[category] = Array(items.length).fill('');
            initialValidation[category] = Array(items.length).fill('unchecked');
        });
        setVocabAnswers(initialAnswers);
        setVocabValidation(initialValidation);

    }, [isAdmin, initialLearningPath, studentProfile, isUserLoading, isProfileLoading]);
    
    const progress = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (isProfileLoading || isUserLoading) return;
        if (!isAdmin && studentDocRef && learningPath.length > 0) {
            const statusesToSave: Record<string, string> = {};
            learningPath.forEach(item => {
                statusesToSave[item.key] = item.status;
            });
            updateDocumentNonBlocking(studentDocRef, { 
                [`lessonProgress.${progressStorageKey}`]: statusesToSave,
                [`progress.${mainProgressKey}`]: progress
            });
            window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
    }, [learningPath, progress, isAdmin, studentDocRef, isProfileLoading, isUserLoading]);

    useEffect(() => {
        if (!topicToComplete) return;

        setLearningPath(currentPath => {
            const newPath = [...currentPath];
            const currentIndex = newPath.findIndex(item => item.key === topicToComplete);
            
            if (currentIndex !== -1 && newPath[currentIndex].status !== 'completed') {
                newPath[currentIndex].status = 'completed';

                const nextIndex = currentIndex + 1;
                if (nextIndex < newPath.length && newPath[nextIndex].status === 'locked') {
                    newPath[nextIndex].status = 'active';
                    setSelectedTopic(newPath[nextIndex].key);
                     toast({ title: "¡Topic unlocked!", description: `Now you can continue with ${newPath[nextIndex].name}` });
                } else if (newPath.every(item => item.status === 'completed')) {
                    toast({ title: "Congratulations!", description: "You have completed all topics in this lesson." });
                }
            }
            return newPath;
        });

        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicComplete = (key: string) => {
        setTopicToComplete(key);
    };

    const handleTopicSelect = (key: string) => {
        const topic = learningPath.find(t => t.key === key);
        if (topic?.status === 'locked' && !isAdmin) {
            toast({ variant: 'destructive', title: 'Locked Topic' });
            return;
        }
        setSelectedTopic(key);
        const autoFinish = ['saludos', 'sustantivos', 'adjetivos', 'verbos'];
        if (autoFinish.includes(key)) {
            handleTopicComplete(key);
        }
    };

    const handleVocabInputChange = (category: string, index: number, value: string) => {
        setVocabAnswers(prev => ({
            ...prev,
            [category]: prev[category].map((ans, i) => i === index ? value : ans)
        }));
    };
    
    const handleCheckVocab = () => {
        const newValidation: Record<string, ('correct' | 'incorrect' | 'unchecked')[]> = {};
        let allCorrect = true;
        Object.keys(vocabularioBasico).forEach(category => {
            const items = vocabularioBasico[category as keyof typeof vocabularioBasico];
            newValidation[category] = items.map((item, index) => {
                const isCorrect = vocabAnswers[category][index].trim().toLowerCase() === item.english.toLowerCase();
                if (!isCorrect) allCorrect = false;
                return isCorrect ? 'correct' : 'incorrect';
            });
        });
        setVocabValidation(newValidation);
        if (allCorrect) {
            toast({ title: 'Excellent!', description: 'All basic vocabulary is correct.' });
            handleTopicComplete('vocabulario');
        } else {
            toast({ variant: 'destructive', title: 'Review your answers.' });
        }
    };
    
    const handleReadingInputChange = (id: string, value: string) => {
        setReadingAnswers(prev => ({...prev, [id]: value}));
    };
    
    const handleCheckReading = () => {
        const newValidation: Record<string, 'correct' | 'incorrect' | 'unchecked'> = {};
        let allCorrect = true;
        lecturaData.questions.forEach(q => {
            const isCorrect = readingAnswers[q.id]?.trim().toLowerCase() === q.answer.toLowerCase();
            if(!isCorrect) allCorrect = false;
            newValidation[q.id] = isCorrect ? 'correct' : 'incorrect';
        });
        setReadingValidation(newValidation);
        if(allCorrect) {
            toast({ title: 'Very well!', description: 'You answered everything correctly.' });
            handleTopicComplete('lectura');
        } else {
            toast({ variant: 'destructive', title: 'Some answers are incorrect.' });
        }
    };

    const renderContent = () => {
        switch(selectedTopic) {
            case 'saludos': return (
                <Card>
                    <CardHeader>
                        <CardTitle>Greetings and Farewells</CardTitle>
                        <CardDescription>Essential phrases to start and end a conversation.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Greetings (Saludos)</h3>
                            <div className="space-y-1">
                                {saludosData.map(item => <p key={item.spanish}><span className="font-medium">{item.spanish}:</span> <span className="text-muted-foreground">{item.english}</span></p>)}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Farewells (Despedidas)</h3>
                            <div className="space-y-1">
                                {despedidasData.map(item => <p key={item.spanish}><span className="font-medium">{item.spanish}:</span> <span className="text-muted-foreground">{item.english}</span></p>)}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={() => handleTopicComplete('saludos')}>Continue</Button>
                    </CardFooter>
                </Card>
            );
            case 'sustantivos': return (
                <Card>
                    <CardHeader>
                        <CardTitle>Nouns (Sustantivos)</CardTitle>
                        <CardDescription>Understanding gender and number in Spanish.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">1. Gender (Género)</h3>
                            <p className="text-muted-foreground">Unlike English, every noun in Spanish has a gender: <strong>Masculine</strong> or <strong>Feminine</strong>.</p>
                            <div className="grid sm:grid-cols-2 gap-4 mt-4">
                                <div className="p-4 bg-muted rounded-lg border-l-4 border-blue-500">
                                    <h4 className="font-bold">Masculine</h4>
                                    <p className="text-sm">Usually end in <strong>-o</strong></p>
                                    <p className="font-mono mt-1 italic">Example: El libr<strong>o</strong> (The book)</p>
                                </div>
                                <div className="p-4 bg-muted rounded-lg border-l-4 border-pink-500">
                                    <h4 className="font-bold">Feminine</h4>
                                    <p className="text-sm">Usually end in <strong>-a</strong></p>
                                    <p className="font-mono mt-1 italic">Example: La mes<strong>a</strong> (The table)</p>
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">2. Number (Número)</h3>
                            <p className="text-muted-foreground">To make nouns plural, we follow these simple rules:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>If it ends in a vowel, add <strong>-s</strong>: <span className="italic">Libro {"=>"} Libros</span></li>
                                <li>If it ends in a consonant, add <strong>-es</strong>: <span className="italic">Papel {"=>"} Papeles</span></li>
                            </ul>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button onClick={() => handleTopicComplete('sustantivos')}>Continue</Button>
                    </CardFooter>
                </Card>
            );
            case 'adjetivos': return (
                <Card>
                    <CardHeader>
                        <CardTitle>Adjectives (Adjetivos)</CardTitle>
                        <CardDescription>How to describe things in Spanish.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">1. Agreement (Concordancia)</h3>
                            <p className="text-muted-foreground">Adjectives must match the noun they describe in both <strong>gender</strong> and <strong>number</strong>.</p>
                            <div className="mt-4 p-4 bg-muted rounded-lg font-mono">
                                <p>A red book: El libro roj<strong>o</strong></p>
                                <p>A red table: La mesa roj<strong>a</strong></p>
                                <p>Red books: Los libros roj<strong>os</strong></p>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">2. Placement</h3>
                            <p className="text-muted-foreground">In Spanish, adjectives usually come <strong>after</strong> the noun.</p>
                            <div className="mt-2 p-3 bg-muted rounded-lg border flex items-center justify-between">
                                <span className="text-sm font-semibold">Spanish: Noun + Adjective</span>
                                <span className="text-xs text-muted-foreground italic">"Carro azul"</span>
                            </div>
                            <div className="mt-2 p-3 bg-muted rounded-lg border flex items-center justify-between">
                                <span className="text-sm font-semibold">English: Adjective + Noun</span>
                                <span className="text-xs text-muted-foreground italic">"Blue car"</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button onClick={() => handleTopicComplete('adjetivos')}>Continue</Button>
                    </CardFooter>
                </Card>
            );
            case 'verbos': return (
                <Card>
                    <CardHeader>
                        <CardTitle>Verbs (Verbos)</CardTitle>
                        <CardDescription>The engine of the sentence.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">1. The Infinitive</h3>
                            <p className="text-muted-foreground">All Spanish verbs in their original form end in one of three ways:</p>
                            <div className="flex gap-4 mt-4">
                                <div className="flex-1 p-3 bg-primary/10 rounded text-center font-bold">-AR</div>
                                <div className="flex-1 p-3 bg-primary/10 rounded text-center font-bold">-ER</div>
                                <div className="flex-1 p-3 bg-primary/10 rounded text-center font-bold">-IR</div>
                            </div>
                            <p className="text-sm mt-2 text-center text-muted-foreground italic">Examples: Habl<strong>ar</strong>, Com<strong>er</strong>, Viv<strong>ir</strong></p>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">2. The "Ser" vs "Estar" Mystery</h3>
                            <p className="text-muted-foreground">Spanish has two ways to say "to be":</p>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div className="p-3 bg-muted rounded border-l-4 border-primary">
                                    <strong>SER:</strong> Permanent things (traits, identity).
                                </div>
                                <div className="p-3 bg-muted rounded border-l-4 border-secondary">
                                    <strong>ESTAR:</strong> Temporary things (feelings, location).
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button onClick={() => handleTopicComplete('verbos')}>Continue</Button>
                    </CardFooter>
                </Card>
            );
            case 'vocabulario': return (
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Vocabulary</CardTitle>
                        <CardDescription>Colors and days of the week.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="multiple" defaultValue={['dias', 'colores']}>
                            {Object.entries(vocabularioBasico).map(([key, items]) => (
                                <AccordionItem key={key} value={key}>
                                    <AccordionTrigger>{key === 'dias' ? 'Days of the Week' : 'Colors'}</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="font-bold">Spanish</div>
                                            <div className="font-bold">English</div>
                                            {items.map((item, index) => (
                                                <React.Fragment key={item.spanish}>
                                                    <div className="p-2 bg-muted rounded-md">{item.spanish}</div>
                                                    <Input 
                                                        value={vocabAnswers[key]?.[index] || ''}
                                                        onChange={(e) => handleVocabInputChange(key, index, e.target.value)}
                                                        className={cn(vocabValidation[key]?.[index] === 'correct' && 'border-green-500', vocabValidation[key]?.[index] === 'incorrect' && 'border-destructive')}
                                                    />
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                    <CardFooter><Button onClick={handleCheckVocab}>Verify</Button></CardFooter>
                </Card>
            );
            case 'lectura': return (
                 <Card>
                    <CardHeader>
                        <CardTitle>{lecturaData.title}</CardTitle>
                        <CardDescription>Practice your reading comprehension.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg leading-relaxed mb-6 border-b pb-6 italic">{lecturaData.content}</p>
                        <h3 className="text-xl font-semibold mb-4">Questions</h3>
                        <div className="space-y-4">
                            {lecturaData.questions.map(q => (
                                <div key={q.id}>
                                    <Label htmlFor={q.id} className="text-base">{q.question}</Label>
                                    <Input 
                                        id={q.id} 
                                        value={readingAnswers[q.id] || ''}
                                        onChange={e => handleReadingInputChange(q.id, e.target.value)}
                                        className={cn('mt-1', readingValidation[q.id] === 'correct' && 'border-green-500', readingValidation[q.id] === 'incorrect' && 'border-destructive')}
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter><Button onClick={handleCheckReading}>Verify</Button></CardFooter>
                 </Card>
            );
            default: return <p>Select a topic to start.</p>;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <Link href="/espanol/intro" className="hover:underline text-sm text-muted-foreground">Back to Intro Adventure</Link>
                        <h1 className="text-4xl font-bold dark:text-primary">Intro 1 Spanish</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-4">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple">
                                <CardHeader><CardTitle>Learning Path</CardTitle></CardHeader>
                                <CardContent>
                                    <nav>
                                        <ul className="space-y-1">
                                            {learningPath.map(item => {
                                                const Icon = item.icon;
                                                return (
                                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                                        className={cn('flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer',
                                                            item.status === 'locked' && !isAdmin ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted',
                                                            selectedTopic === item.key && 'bg-muted text-primary font-semibold'
                                                        )}
                                                    >
                                                        {item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500"/> : <Icon className="h-5 w-5" />}
                                                        <span>{item.name}</span>
                                                        {item.status === 'locked' && !isAdmin && <Lock className="h-4 w-4 text-yellow-500 ml-auto" />}
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    </nav>
                                     <div className="mt-6 pt-6 border-t">
                                        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2">
                                            <span>Progress</span><span className="font-bold text-foreground">{progress}%</span>
                                        </div>
                                        <Progress value={progress} className="h-2" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="md:col-span-8">
                           {renderContent()}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
