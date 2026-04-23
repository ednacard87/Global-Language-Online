'use client';

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CheckCircle, Lock, Lightbulb, Volume2, Loader2, Bomb, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { SpellingExercise, type SpellingExerciseKey } from "@/components/dashboard/spelling-exercise";
import { TranslationExercise } from "@/components/dashboard/translation-exercise";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, useDoc, useMemoFirebase } from "@/firebase";
import { collection, doc } from 'firebase/firestore';
import { useTranslation } from "@/context/language-context";
import { getIntro1PathData, getAbcSpellingPathData, getNumbersSpellingPathData } from "@/lib/course-data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Input } from "@/components/ui/input";

const ICONS = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const AbcPronunciationExercise = ({ onGameComplete }: { onGameComplete: () => void }) => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const abcExercises = [
        { pronunciation: '(em) (ou) (ti) (eich) (i) (ar)', answer: 'mother' },
        { pronunciation: '(ef) (ei) (ti) (eich) (i) (ar)', answer: 'father' },
        { pronunciation: '(es) (ai) (es) (ti) (i) (ar)', answer: 'sister' },
        { pronunciation: '(bi) (ar) (ou) (ti) (eich) (i) (ar)', answer: 'brother' },
        { pronunciation: '(guai) (i) (el) (el) (ou) (dabliu)', answer: 'yellow' },
        { pronunciation: '(bi) (el) (iu) (i)', answer: 'blue' },
        { pronunciation: '(ar) (i) (di)', answer: 'red' },
        { pronunciation: '(es) (iu) (en)', answer: 'sun' },
        { pronunciation: '(em) (ou) (ou) (en)', answer: 'moon' },
        { pronunciation: '(es) (ti) (iu) (di) (i) (en) (ti)', answer: 'student' }
    ];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [showCongratulations, setShowCongratulations] = useState(false);

    const currentExercise = abcExercises[currentIndex];

    const handleCheck = () => {
        if (answer.trim().toLowerCase() === currentExercise.answer.toLowerCase()) {
            if (currentIndex === abcExercises.length - 1) {
                setShowCongratulations(true);
                onGameComplete();
            } else {
                toast({ title: t('spellingExercise.correct'), description: t('spellingExercise.nextWord') });
                setCurrentIndex(prev => prev + 1);
                setAnswer('');
            }
        } else {
            toast({ variant: 'destructive', title: t('spellingExercise.incorrect'), description: t('spellingExercise.incorrectDescription') });
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleCheck();
        }
    };
    
    if (showCongratulations) {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
                    <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
                    <h2 className="text-3xl font-bold">{t('intro1Page.congratulations')}</h2>
                    <p className="text-muted-foreground mt-2">{t('spellingExercise.allExercisesComplete')}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>{t('intro1Page.abcExercise')} ({currentIndex + 1}/{abcExercises.length})</CardTitle>
                <CardDescription>{t('spellingExercise.writeWordForPronunciation')}</CardDescription>
                <div className="text-muted-foreground pt-2">
                    <span className="font-semibold">Ejemplo:</span> (es) (iu) (en) = SUN
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg text-center font-mono text-lg tracking-widest">
                    {currentExercise.pronunciation}
                </div>
                <div>
                    <Input
                        placeholder={t('spellingExercise.writeTheWord')}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleCheck}>{t('spellingExercise.check')}</Button>
            </CardFooter>
        </Card>
    );
};

const alphabetWithPronunciation = [
    { letter: 'A', pronunciation: 'ei', audioSrc: '/Audio/Alphabet/A.mp3' }, { letter: 'B', pronunciation: 'bi', audioSrc: '/Audio/Alphabet/B.mp3' }, { letter: 'C', pronunciation: 'si', audioSrc: '/Audio/Alphabet/C.mp3' },
    { letter: 'D', pronunciation: 'di', audioSrc: '/Audio/Alphabet/D.mp3' }, { letter: 'E', pronunciation: 'i', audioSrc: '/Audio/Alphabet/E.mp3' }, { letter: 'F', pronunciation: 'ef', audioSrc: '/Audio/Alphabet/F.mp3' },
    { letter: 'G', pronunciation: 'yi', audioSrc: '/Audio/Alphabet/G.mp3' }, { letter: 'H', pronunciation: 'eich', audioSrc: '/Audio/Alphabet/H.mp3' }, { letter: 'I', pronunciation: 'ai', audioSrc: '/Audio/Alphabet/I.mp3' },
    { letter: 'J', pronunciation: 'yei', audioSrc: '/Audio/Alphabet/J.mp3' }, { letter: 'K', pronunciation: 'kei', audioSrc: '/Audio/Alphabet/K.mp3' }, { letter: 'L', pronunciation: 'el', audioSrc: '/Audio/Alphabet/L.mp3' },
    { letter: 'M', pronunciation: 'em', audioSrc: '/Audio/Alphabet/M.mp3' }, { letter: 'N', pronunciation: 'en', audioSrc: '/Audio/Alphabet/N.mp3' }, { letter: 'O', pronunciation: 'ou', audioSrc: '/Audio/Alphabet/O.mp3' },
    { letter: 'P', pronunciation: 'pi', audioSrc: '/Audio/Alphabet/P.mp3' }, { letter: 'Q', pronunciation: 'kiu', audioSrc: '/Audio/Alphabet/Q.mp3' }, { letter: 'R', pronunciation: 'ar', audioSrc: '/Audio/Alphabet/R.mp3' },
    { letter: 'S', pronunciation: 'es', audioSrc: '/Audio/Alphabet/S.mp3' }, { letter: 'T', pronunciation: 'ti', audioSrc: '/Audio/Alphabet/T.mp3' },
    { letter: 'U', pronunciation: 'iu', audioSrc: '/Audio/Alphabet/U.mp3' },
    { letter: 'V', pronunciation: 'vi', audioSrc: '/Audio/Alphabet/V.mp3' }, { letter: 'W', pronunciation: 'da-bliú', audioSrc: '/Audio/Alphabet/W.mp3' }, { letter: 'X', pronunciation: 'ex', audioSrc: '/Audio/Alphabet/X.mp3' },
    { letter: 'Y', pronunciation: 'guai', audioSrc: '/Audio/Alphabet/Y.mp3' }, { letter: 'Z', pronunciation: 'si', audioSrc: '/Audio/Alphabet/Z.mp3' }
];

const numbersWithAudio: { number: string; name: string; audioSrc: string | null; }[] = [
    { number: '1', name: 'one', audioSrc: '/Audio/Numbers/Numbers0/one.mp3' },
    { number: '2', name: 'two', audioSrc: '/Audio/Numbers/Numbers0/two.mp3' },
    { number: '3', name: 'three', audioSrc: '/Audio/Numbers/Numbers0/three.mp3' },
    { number: '4', name: 'four', audioSrc: '/Audio/Numbers/Numbers0/four.mp3' },
    { number: '5', name: 'five', audioSrc: '/Audio/Numbers/Numbers0/five.mp3' },
    { number: '6', name: 'six', audioSrc: '/Audio/Numbers/Numbers0/six.mp3' },
    { number: '7', name: 'seven', audioSrc: '/Audio/Numbers/Numbers0/seven.mp3' },
    { number: '8', name: 'eight', audioSrc: '/Audio/Numbers/Numbers0/eight.mp3' },
    { number: '9', name: 'nine', audioSrc: '/Audio/Numbers/Numbers0/nine.mp3' },
    { number: '10', name: 'ten', audioSrc: '/Audio/Numbers/Numbers0/ten.mp3' },
    { number: '11', name: 'eleven', audioSrc: '/Audio/Numbers/Numbers0/eleven.mp3' },
    { number: '12', name: 'twelve', audioSrc: '/Audio/Numbers/Numbers0/twelve.mp3' },
    { number: '13', name: 'thirteen', audioSrc: '/Audio/Numbers/Numbers0/thirteen.mp3' },
    { number: '14', name: 'fourteen', audioSrc: '/Audio/Numbers/Numbers0/fourteen.mp3' },
    { number: '15', name: 'fifteen', audioSrc: '/Audio/Numbers/Numbers0/fifteen.mp3' },
    { number: '16', name: 'sixteen', audioSrc: '/Audio/Numbers/Numbers0/sixteen.mp3' },
    { number: '17', name: 'seventeen', audioSrc: '/Audio/Numbers/Numbers0/seventeen.mp3' },
    { number: '18', name: 'eighteen', audioSrc: '/Audio/Numbers/Numbers0/eighteen.mp3' },
    { number: '19', name: 'nineteen', audioSrc: '/Audio/Numbers/Numbers0/nineteen.mp3' },
    { number: '20', name: 'twenty', audioSrc: '/Audio/Numbers/Numbers0/twenty.mp3' },
    { number: '30', name: 'thirty', audioSrc: '/Audio/Numbers/Numbers0/thirty.mp3' },
    { number: '40', name: 'forty', audioSrc: '/Audio/Numbers/Numbers0/forty.mp3' },
    { number: '50', name: 'fifty', audioSrc: '/Audio/Numbers/Numbers0/fifty.mp3' },
    { number: '60', name: 'sixty', audioSrc: '/Audio/Numbers/Numbers0/sixty.mp3' },
    { number: '70', name: 'seventy', audioSrc: '/Audio/Numbers/Numbers0/seventy.mp3' },
    { number: '80', name: 'eighty', audioSrc: '/Audio/Numbers/Numbers0/eighty.mp3' },
    { number: '90', name: 'ninety', audioSrc: '/Audio/Numbers/Numbers0/ninety.mp3' },
    { number: '100', name: 'one hundred', audioSrc: '/Audio/Numbers/Numbers0/onehundred.mp3' },
    { number: '200', name: 'two hundred', audioSrc: null },
    { number: '300', name: 'three hundred', audioSrc: null },
    { number: '400', name: 'four hundred', audioSrc: null },
    { number: '500', name: 'five hundred', audioSrc: null },
    { number: '1,000', name: 'one thousand', audioSrc: null },
    { number: '1,000,000', name: 'one million', audioSrc: null }
];


function AlphabetGrid({ highlightedItem, onHighlight }: { highlightedItem: string | null; onHighlight: (letter: string) => void; }) {
    const { toast } = useToast();
    const { t } = useTranslation();
    const [playingAudio, setPlayingAudio] = useState<string | null>(null);

    const playAudio = (audioSrc: string, letter: string) => {
        if (playingAudio) return;
        setPlayingAudio(audioSrc);
        onHighlight(letter);
        const audio = new Audio(audioSrc);

        const onCanPlay = () => {
            audio.play().catch(e => {
                setPlayingAudio(null);
            });
            audio.removeEventListener('canplaythrough', onCanPlay);
            audio.removeEventListener('error', onError);
        };
        
        const onEnded = () => {
            setPlayingAudio(null);
            audio.removeEventListener('ended', onEnded);
        };

        const onError = () => {
            toast({
                variant: "destructive",
                title: t('audio.errorTitle'),
                description: t('audio.loadError'),
            });
            setPlayingAudio(null);
            audio.removeEventListener('canplaythrough', onCanPlay);
            audio.removeEventListener('error', onError);
        };
        
        audio.addEventListener('canplaythrough', onCanPlay);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onError);

        audio.load();
    };

    return (
        <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-8 gap-2 text-center">
            {alphabetWithPronunciation.map(({ letter, pronunciation, audioSrc }) => (
                <Card key={letter} className={cn(
                    "p-3 flex flex-col items-center justify-center gap-2 transition-colors",
                    highlightedItem === letter && "bg-primary/20"
                )}>
                    <span className="text-5xl font-bold">{letter}</span>
                    <div className="flex items-center gap-2">
                        <span className="text-lg text-muted-foreground">/{pronunciation}/</span>
                        <Button variant="ghost" size="icon" onClick={() => playAudio(audioSrc, letter)} disabled={!!playingAudio} className="h-8 w-8">
                            {playingAudio === audioSrc ? <Loader2 className="h-7 w-7 animate-spin" /> : <Volume2 className="h-7 w-7" />}
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    );
}

function NumbersGrid({ highlightedItem, onHighlight }: { highlightedItem: string | null; onHighlight: (number: string) => void; }) {
    const { toast } = useToast();
    const { t } = useTranslation();
    const [playingAudio, setPlayingAudio] = useState<string | null>(null);

    const playAudio = (audioSrc: string, number: string) => {
        if (playingAudio || !audioSrc) return;
        setPlayingAudio(audioSrc);
        onHighlight(number);
        const audio = new Audio(audioSrc);

        const onCanPlay = () => {
            audio.play().catch(e => {
                setPlayingAudio(null);
            });
            audio.removeEventListener('canplaythrough', onCanPlay);
            audio.removeEventListener('error', onError);
        };
        
        const onEnded = () => {
            setPlayingAudio(null);
            audio.removeEventListener('ended', onEnded);
        };

        const onError = () => {
            toast({
                variant: "destructive",
                title: t('audio.errorTitle'),
                description: t('audio.playbackError'),
            });
            setPlayingAudio(null);
            audio.removeEventListener('canplaythrough', onCanPlay);
            audio.removeEventListener('error', onError);
        };
        
        audio.addEventListener('canplaythrough', onCanPlay);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onError);

        audio.load();
    };

    return (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 text-center">
            {numbersWithAudio.map(({ number, name, audioSrc }) => (
                <Card key={number} className={cn(
                    "p-3 flex flex-col items-center justify-center gap-1.5 transition-colors",
                     highlightedItem === number && "bg-primary/20"
                )}>
                    <span className={cn("font-bold", number.length > 3 ? "text-2xl" : "text-3xl")}>{number}</span>
                    <div className="flex items-center gap-1">
                        <span className="text-base text-muted-foreground capitalize">{name}</span>
                        {audioSrc ? (
                            <Button variant="ghost" size="icon" onClick={() => playAudio(audioSrc!, number)} disabled={!!playingAudio} className="h-6 w-6">
                                {playingAudio === audioSrc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
                            </Button>
                        ) : null}
                    </div>
                </Card>
            ))}
        </div>
    );
}

type PathItem = {
    key: string;
    name: string;
    href?: string;
    status: 'completed' | 'active' | 'locked';
};

type SpellingPathItem = {
    key: SpellingExerciseKey;
    name: string;
    status: 'completed' | 'active' | 'locked';
};

interface Student {
    role?: 'admin' | 'student';
    lessonProgress?: any;
    progress?: Record<string, number>;
}

// By changing this version, we can force a progress reset for all users
// if there's a breaking change in the path structure.
const progressStorageVersion = "_v1_sequential_admin";

export default function Intro1Page() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [intro1Path, setIntro1Path] = useState<PathItem[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [selectedTopicKey, setSelectedTopicKey] = useState<string | null>(null);
    
    const [abcSpellingPath, setAbcSpellingPath] = useState<SpellingPathItem[]>([]);
    const [numbersSpellingPath, setNumbersSpellingPath] = useState<SpellingPathItem[]>([]);
    const [selectedSpellingTopic, setSelectedSpellingTopic] = useState<SpellingExerciseKey | null>(null);
    const [showCongratulations, setShowCongratulations] = useState(false);
    
    const [highlightedLetter, setHighlightedLetter] = useState<string | null>(null);
    const [highlightedNumber, setHighlightedNumber] = useState<string | null>(null);
    const { user } = useUser();
    const firestore = useFirestore();
    const guideFishImage = PlaceHolderImages.find(p => p.id === 'guide-fish');
    
    const studentDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'students', user.uid) : null),
        [firestore, user]
    );
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<Student>(studentDocRef);

    const isAdmin = useMemo(() => {
        if (!user) return false;
        return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
    }, [user, studentProfile]);

    const possessivesData = [
        { english: 'My', spanish: 'Mi / Mis' },
        { english: 'Your', spanish: 'Tu / Tus (de ti)' },
        { english: 'His', spanish: 'Su / Sus (de él)' },
        { english: 'Her', spanish: 'Su / Sus (de ella)' },
        { english: 'Its', spanish: 'Su / Sus (de eso)' },
        { english: 'Our', spanish: 'Nuestro / Nuestra / Nuestros / Nuestras' },
        { english: 'Your', spanish: 'Su / Sus (de ustedes)' },
        { english: 'Their', spanish: 'Su / Sus (de ellos/as)' },
    ];

    const verbToBeData = [
        { ser: 'Yo soy', tobe: 'I am', estar: 'Yo estoy' },
        { ser: 'Tú eres / usted es', tobe: 'You are', estar: 'Tú estás / usted está' },
        { ser: 'Él es', tobe: 'He is', estar: 'Él está' },
        { ser: 'Ella es', tobe: 'She is', estar: 'Ella está' },
        { ser: 'Esto es', tobe: 'It is', estar: 'Esto está' },
        { ser: 'Nosotros somos', tobe: 'We are', estar: 'Nosotros estamos' },
        { ser: 'Ustedes son', tobe: 'You are', estar: 'Ustedes están' },
        { ser: 'Ellos son', tobe: 'They are', estar: 'Ellos están' },
    ];

    const demonstrativesData = [
        { english: 'This', spanish: 'Este / Esta / Esto', usage: 'Singular, cerca' },
        { english: 'That', spanish: 'Ese / Esa / Eso / Aquel / Aquella', usage: 'Singular, lejos' },
        { english: 'These', spanish: 'Estos / Estas', usage: 'Plural, cerca' },
        { english: 'Those', spanish: 'Esos / Esas / Aquellos / Aquellas', usage: 'Plural, lejos' },
    ];

    useEffect(() => {
        if (isProfileLoading) return;

        const initialIntroPath = getIntro1PathData(t);
        const initialAbcPath = getAbcSpellingPathData(t);
        const initialNumbersPath = getNumbersSpellingPathData(t);

        const loadPath = (storageKey: string, defaultPath: any[]) => {
            if (isAdmin) {
                return defaultPath.map(item => ({ ...item, status: 'active' }));
            }
            const versionedKey = storageKey + progressStorageVersion;

            if (studentProfile?.lessonProgress?.[versionedKey]) {
                const savedStatuses = studentProfile.lessonProgress[versionedKey];
                return defaultPath.map(item => ({ ...item, status: savedStatuses[item.key] || item.status }));
            }

            try {
                const savedStatusJSON = localStorage.getItem(versionedKey);
                if (savedStatusJSON) {
                    const savedStatuses = JSON.parse(savedStatusJSON);
                    return defaultPath.map(item => ({ ...item, status: savedStatuses[item.key] || item.status }));
                }
            } catch (e) {
                console.error(`Failed to load path from ${versionedKey}`, e);
            }
            return defaultPath;
        };

        setIntro1Path(loadPath('intro1Path', initialIntroPath).map(item => ({ ...item, href: '#' } as PathItem)));
        setAbcSpellingPath(loadPath('abcSpellingPath', initialAbcPath) as SpellingPathItem[]);
        setNumbersSpellingPath(loadPath('numbersSpellingPath', initialNumbersPath) as SpellingPathItem[]);

        if (isAdmin) {
            setSelectedSpellingTopic('femaleNames');
            return;
        }

    }, [t, isAdmin, studentProfile, isProfileLoading]);

    useEffect(() => {
        setHighlightedLetter(null);
        setHighlightedNumber(null);
    }, [selectedTopicKey]);

    useEffect(() => {
        if (!user || !firestore || !selectedTopicKey) return;
        if (['abcspelling', 'numbersspelling'].includes(selectedTopicKey) && !selectedSpellingTopic) return;
        
        const startTime = Date.now();
        const studySessionCollection = collection(firestore, 'students', user.uid, 'studySessions');
    
        const saveSession = () => {
          const endTime = Date.now();
          const durationMinutes = Math.round((endTime - startTime) / 60000);
    
          if (durationMinutes >= 1) {
            const newSession = {
              studentId: user.uid,
              startTime: new Date(startTime).toISOString(),
              endTime: new Date(endTime).toISOString(),
              durationMinutes: durationMinutes,
              courseId: 'intro-1',
              lessonId: selectedSpellingTopic || selectedTopicKey,
            };
            addDocumentNonBlocking(studySessionCollection, newSession);
          }
        };
    
        window.addEventListener('beforeunload', saveSession);
    
        return () => {
          window.removeEventListener('beforeunload', saveSession);
          saveSession();
        };
      }, [user, firestore, selectedTopicKey, selectedSpellingTopic]);
    
    const handleTopicSelect = (topicName: string) => {
        const currentItem = intro1Path.find(item => item.name === topicName);
        if (!isAdmin && (!currentItem || currentItem.status === 'locked')) return;
    
        setSelectedTopic(topicName);
        setSelectedTopicKey(currentItem!.key);
        setShowCongratulations(false);
    
        if (currentItem!.key === 'abcspelling' && !selectedSpellingTopic) {
            setSelectedSpellingTopic('femaleNames');
        } else if (currentItem!.key === 'numbersspelling' && !selectedSpellingTopic) {
            setSelectedSpellingTopic('numbers1');
        }
    
        const viewOnlyTopics = ['abc', 'numbers', 'pronouns', 'possessives', 'verbtobe1', 'verbtobe2', 'verbtobe3', 'demonstratives'];
        const key = currentItem!.key;
    
        if (viewOnlyTopics.includes(key)) {
            const currentItemIndex = intro1Path.findIndex(item => item.key === key);
            if (currentItemIndex !== -1) {
                const nextItemIndex = currentItemIndex + 1;
                if (nextItemIndex < intro1Path.length && intro1Path[nextItemIndex].status === 'locked') {
                    const newPath = [...intro1Path];
                    newPath[nextItemIndex] = { ...newPath[nextItemIndex], status: 'active' };
                    setIntro1Path(newPath);
                    toast({
                        title: '¡Tema desbloqueado!',
                        description: `Has desbloqueado ${newPath[nextItemIndex].name}`,
                    });
                }
            }
        }
    };
    
    const handleTopicComplete = (completedTopicKey: string) => {
        setIntro1Path(currentPath => {
            const newPath = [...currentPath];
            const completedIndex = newPath.findIndex(item => item.key === completedTopicKey);
            
            if (completedIndex === -1 || newPath[completedIndex].status === 'completed') {
                return currentPath;
            }
    
            newPath[completedIndex].status = 'completed';
    
            const exerciseToViewTopicMap: Record<string, string[]> = {
                'abcExercise': ['abc'],
                'abcspelling': ['abc', 'abcExercise'],
                'numbersspelling': ['numbers'],
                'exercises1': ['pronouns', 'verbtobe1'],
                'exercises2': ['possessives', 'verbtobe2'],
                'exercises3': ['verbtobe3'],
            };
    
            (exerciseToViewTopicMap[completedTopicKey] || []).forEach(key => {
                const index = newPath.findIndex(item => item.key === key);
                if (index !== -1) newPath[index].status = 'completed';
            });
    
            const nextIndex = completedIndex + 1;
            if (nextIndex < newPath.length && newPath[nextIndex].status === 'locked') {
                newPath[nextIndex].status = 'active';
                toast({
                    title: '¡Siguiente tema desbloqueado!',
                    description: `Ahora puedes continuar con ${newPath[nextIndex].name}`,
                });
            }
    
            return newPath;
        });
    };

    const handleAbcExerciseComplete = () => {
        handleTopicComplete('abcExercise');
    };
    
    const handleSpellingTopicComplete = (completedTopicKey: SpellingExerciseKey) => {
        setShowCongratulations(true);
    
        const isAbcTopic = abcSpellingPath.some(t => t.key === completedTopicKey);
        const [currentSubPath, setSubPath, mainTopicKey] = isAbcTopic
            ? [abcSpellingPath, setAbcSpellingPath, 'abcspelling']
            : [numbersSpellingPath, setNumbersSpellingPath, 'numbersspelling'];
    
        const newSubPath = [...currentSubPath];
        const currentItemIndex = newSubPath.findIndex(item => item.key === completedTopicKey);
        
        if (currentItemIndex !== -1 && newSubPath[currentItemIndex].status !== 'completed') {
            newSubPath[currentItemIndex].status = 'completed';
    
            const nextSubItemIndex = currentItemIndex + 1;
            if (nextSubItemIndex < newSubPath.length && newSubPath[nextSubItemIndex].status === 'locked') {
                newSubPath[nextSubItemIndex].status = 'active';
            }
            setSubPath(newSubPath);
    
            const allSubTopicsCompleted = newSubPath.every(item => item.status === 'completed');
            if (allSubTopicsCompleted) {
                handleTopicComplete(mainTopicKey);
            }
        }
    };

    const handleSpellingTopicSelect = (topicKey: SpellingExerciseKey) => {
        const isNumbersExercise = selectedTopicKey === 'numbersspelling';
        const path = isNumbersExercise ? numbersSpellingPath : abcSpellingPath;
        const currentItem = path.find(item => item.key === topicKey);

        if (isAdmin || (currentItem && currentItem.status !== 'locked')) {
            setShowCongratulations(false);
            setSelectedSpellingTopic(topicKey);
        }
    };

    const completedItems = useMemo(() => intro1Path.filter(item => item.status === 'completed').length, [intro1Path]);
    const progress = useMemo(() => intro1Path.length > 0 ? Math.round((completedItems / intro1Path.length) * 100) : 0, [completedItems, intro1Path.length]);

    useEffect(() => {
        if (isProfileLoading || isAdmin || !studentDocRef) return;

        const dataToSave: Record<string, any> = {
            'progress.intro1Progress': progress
        };

        if (intro1Path.length > 0) {
            const statusOnly = intro1Path.reduce((acc, item) => ({ ...acc, [item.key]: item.status }), {});
            dataToSave[`lessonProgress.${'intro1Path' + progressStorageVersion}`] = statusOnly;
        }
        if (abcSpellingPath.length > 0) {
            const statusOnly = abcSpellingPath.reduce((acc, item) => ({ ...acc, [item.key]: item.status }), {});
            dataToSave[`lessonProgress.${'abcSpellingPath' + progressStorageVersion}`] = statusOnly;
        }
        if (numbersSpellingPath.length > 0) {
            const statusOnly = numbersSpellingPath.reduce((acc, item) => ({ ...acc, [item.key]: item.status }), {});
            dataToSave[`lessonProgress.${'numbersSpellingPath' + progressStorageVersion}`] = statusOnly;
        }
        
        updateDocumentNonBlocking(studentDocRef, dataToSave);
        
    }, [intro1Path, abcSpellingPath, numbersSpellingPath, progress, isAdmin, studentDocRef, isProfileLoading]);

  return (
    <div className="flex w-full flex-col ingles-dashboard-bg min-h-screen">
      <DashboardHeader />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
            <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-9">
                <Link href="/intro" className="hover:underline">
                    <h1 className="text-4xl font-bold mb-8 dark:text-primary">{t('intro1Page.title')}</h1>
                </Link>

                {(() => {
                    if (selectedTopicKey === 'abc') {
                        return (
                            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                                <CardHeader>
                                    <CardTitle>{t('intro1Page.abc')}</CardTitle>
                                    <CardDescription className="pt-2 text-lg font-semibold flex items-center gap-2">
                                        <Lightbulb className="h-5 w-5 text-yellow-400 animate-pulse" />
                                        <span className="bg-gradient-to-r from-brand-purple to-brand-teal text-transparent bg-clip-text">
                                            {t('intro1Page.abcStudyHint')}
                                        </span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <AlphabetGrid 
                                        highlightedItem={highlightedLetter}
                                        onHighlight={setHighlightedLetter}
                                    />
                                </CardContent>
                            </Card>
                        );
                    }
                    if (selectedTopicKey === 'abcExercise') {
                        return <AbcPronunciationExercise onGameComplete={handleAbcExerciseComplete} />;
                    }
                    if (selectedTopicKey === 'numbers') {
                        return (
                            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                                <CardHeader>
                                    <CardTitle>{t('intro1Page.numbers')}</CardTitle>
                                    <CardDescription className="pt-2 text-lg font-semibold flex items-center gap-2">
                                        <Lightbulb className="h-5 w-5 text-yellow-400 animate-pulse" />
                                        <span className="bg-gradient-to-r from-brand-purple to-brand-teal text-transparent bg-clip-text">
                                            {t('intro1Page.numbersStudyHint')}
                                        </span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <NumbersGrid 
                                        highlightedItem={highlightedNumber}
                                        onHighlight={setHighlightedNumber}
                                    />
                                </CardContent>
                            </Card>
                        );
                    }
                    if (selectedTopicKey === 'pronouns') {
                        return (
                            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                                <CardHeader>
                                    <CardTitle>{t('intro1Page.pronouns')}</CardTitle>
                                    <CardDescription className="pt-2 text-lg font-semibold flex items-center gap-2">
                                        <Lightbulb className="h-5 w-5 text-yellow-400 animate-pulse" />
                                        <span className="bg-gradient-to-r from-brand-purple to-brand-teal text-transparent bg-clip-text">
                                            {t('intro1Page.pronounsStudyHint')}
                                        </span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-lg">
                                        <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.ser')}</div>
                                        <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.tobe')}</div>
                                        <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.estar')}</div>
                                        {verbToBeData.map((item, index) => (
                                            <React.Fragment key={index}>
                                                <div className="p-3 bg-card border rounded-lg text-center">{item.ser}</div>
                                                <div className="p-3 bg-card border rounded-lg font-medium text-center">{item.tobe}</div>
                                                <div className="p-3 bg-card border rounded-lg text-center">{item.estar}</div>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    }
                    if (selectedTopicKey === 'possessives') {
                        return (
                            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                                <CardHeader>
                                    <CardTitle>{t('intro1Page.possessives')}</CardTitle>
                                    <CardDescription className="pt-2 text-lg font-semibold flex items-center gap-2">
                                        <Lightbulb className="h-5 w-5 text-yellow-400 animate-pulse" />
                                        <span className="bg-gradient-to-r from-brand-purple to-brand-teal text-transparent bg-clip-text">
                                            {t('intro1Page.possessivesStudyHint')}
                                        </span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                        <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.english')}</div>
                                        <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.spanish')}</div>
                                        {possessivesData.map((item, index) => (
                                            <React.Fragment key={index}>
                                                <div className="p-3 bg-card border rounded-lg font-medium text-center">{item.english}</div>
                                                <div className="p-3 bg-card border rounded-lg text-center">{item.spanish}</div>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    }
                    if (selectedTopicKey === 'verbtobe1') {
                        return (
                            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                                <CardHeader>
                                    <CardTitle>{t('intro1Page.verbtobe1')}</CardTitle>
                                    <CardDescription className="pt-2 text-lg font-semibold flex items-center gap-2">
                                        <Lightbulb className="h-5 w-5 text-yellow-400 animate-pulse" />
                                        <span className="bg-gradient-to-r from-brand-purple to-brand-teal text-transparent bg-clip-text">
                                            {t('intro1Page.verbtobeStructureHint')}
                                        </span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2">{t('intro1Page.verbtobeStructureTitle')}</h3>
                                        <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                            <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> pronoun + to be + complement</p>
                                            <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> pronoun + to be + not + complement</p>
                                            <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> to be + pronoun + complement ?</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2">{t('intro1Page.shortAnswersTitle')}</h3>
                                        <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                            <p><span className="font-bold text-lg text-green-500 mr-2">(+A)</span> Yes, pronoun + to be</p>
                                            <p><span className="font-bold text-lg text-red-500 mr-2">(-A)</span> No, pronoun + to be + not</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2">{t('intro1Page.exampleTitle')}</h3>
                                        <p className="text-lg italic text-muted-foreground mb-2">"ellos son estudiantes"</p>
                                        <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                            <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> They are students</p>
                                            <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> They are not students</p>
                                            <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> are they students?</p>
                                            <div className="border-t my-2 border-border/50" />
                                            <p><span className="font-bold text-lg text-green-500 mr-2">(+A)</span> Yes, they are</p>
                                            <p><span className="font-bold text-lg text-red-500 mr-2">(-A)</span> No, they are not</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    }
                    if (selectedTopicKey === 'verbtobe2') {
                        return (
                            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                                <CardHeader>
                                    <CardTitle>{t('intro1Page.verbtobe2')}</CardTitle>
                                    <CardDescription className="pt-2 text-lg font-semibold flex items-center gap-2">
                                        <Lightbulb className="h-5 w-5 text-yellow-400 animate-pulse" />
                                        <span className="bg-gradient-to-r from-brand-purple to-brand-teal text-transparent bg-clip-text">
                                            {t('intro1Page.verbtobeStructureHint')}
                                        </span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2">{t('intro1Page.verbtobeStructureTitle')}</h3>
                                        <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                            <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> pronoun + To be + possessive + noun + complement</p>
                                            <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> pronoun + To be + Not + possessive + noun + complement</p>
                                            <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> To be + pronoun + possessive + noun + complement ?</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2">{t('intro1Page.shortAnswersTitle')}</h3>
                                        <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                            <p><span className="font-bold text-lg text-green-500 mr-2">(+A)</span> Yes, pronoun + to be</p>
                                            <p><span className="font-bold text-lg text-red-500 mr-2">(-A)</span> No, pronoun + to be + not</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2">{t('intro1Page.exampleTitle')}</h3>
                                        <p className="text-lg italic text-muted-foreground mb-2">"{t('intro1Page.exampleSentence')}"</p>
                                        <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                            <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> They are my friends</p>
                                            <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> They are not my friends</p>
                                            <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> are they my friends?</p>
                                            <div className="border-t my-2 border-border/50" />
                                            <p><span className="font-bold text-lg text-green-500 mr-2">(+A)</span> Yes, they are</p>
                                            <p><span className="font-bold text-lg text-red-500 mr-2">(-A)</span> No, they are not</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    }
                    if (selectedTopicKey === 'verbtobe3') {
                        return (
                            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                                <CardHeader>
                                    <CardTitle>{t('intro1Page.verbtobe3')}</CardTitle>
                                    <CardDescription className="pt-2 text-lg font-semibold flex items-center gap-2">
                                        <Lightbulb className="h-5 w-5 text-yellow-400 animate-pulse" />
                                        <span className="bg-gradient-to-r from-brand-purple to-brand-teal text-transparent bg-clip-text">
                                            {t('intro1Page.verbtobeStructureHint')}
                                        </span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2">{t('intro1Page.verbtobeStructureTitle')}</h3>
                                        <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                            <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> possessive + noun + to be + complement</p>
                                            <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> possessive + noun + to be + Not + complement</p>
                                            <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> To be + possessive + noun + complement ?</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2">{t('intro1Page.shortAnswersTitle')}</h3>
                                        <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                            <p><span className="font-bold text-lg text-green-500 mr-2">(+A)</span> Yes, pronoun + to be</p>
                                            <p><span className="font-bold text-lg text-red-500 mr-2">(-A)</span> No, pronoun + to be + not</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2">{t('intro1Page.exampleTitle')}</h3>
                                        <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                            <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> My mother is a nurse</p>
                                            <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> My mother is not a nurse</p>
                                            <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> is my mother a nurse?</p>
                                            <div className="border-t my-2 border-border/50" />
                                            <p><span className="font-bold text-lg text-green-500 mr-2">(+A)</span> yes, she is</p>
                                            <p><span className="font-bold text-lg text-red-500 mr-2">(-A)</span> no, she is not</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    }
                    if (selectedTopicKey === 'demonstratives') {
                        return (
                            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                                <CardHeader>
                                    <CardTitle>{t('intro1Page.demonstratives')}</CardTitle>
                                    <CardDescription className="pt-2 text-lg font-semibold flex items-center gap-2">
                                        <Lightbulb className="h-5 w-5 text-yellow-400 animate-pulse" />
                                        <span className="bg-gradient-to-r from-brand-purple to-brand-teal text-transparent bg-clip-text">
                                            {t('intro1Page.demonstrativesStudyHint')}
                                        </span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-lg">
                                        <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.english')}</div>
                                        <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.spanish')}</div>
                                        <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('intro1Page.usage')}</div>
                                        {demonstrativesData.map((item, index) => (
                                            <React.Fragment key={index}>
                                                <div className="p-3 bg-card border rounded-lg font-medium text-center">{item.english}</div>
                                                <div className="p-3 bg-card border rounded-lg text-center">{item.spanish}</div>
                                                <div className="p-3 bg-card border rounded-lg text-center">{item.usage}</div>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    }
                     if (selectedTopicKey === 'exercises1' || selectedTopicKey === 'exercises2' || selectedTopicKey === 'exercises3') {
                        return <TranslationExercise exerciseKey={selectedTopicKey as 'exercises1' | 'exercises2' | 'exercises3'} onComplete={() => handleTopicComplete(selectedTopicKey)} />;
                    }
                    if (selectedTopicKey === 'abcspelling' || selectedTopicKey === 'numbersspelling') {
                        const isNumbersExercise = selectedTopicKey === 'numbersspelling';
                        const currentSpellingSubPath = isNumbersExercise ? numbersSpellingPath : abcSpellingPath;
                        return (
                            <div className="grid gap-8 md:grid-cols-12">
                                <div className="md:col-span-4">
                                    <div className="sticky top-24 space-y-4">
                                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                                            <CardHeader>
                                                <CardTitle>{isNumbersExercise ? t('spellingExercise.numbersspelling') : t('spellingExercise.abcspelling')}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <nav>
                                                    <ul className="space-y-1">
                                                        {currentSpellingSubPath.map((item, index) => {
                                                            const Icon = ICONS[item.status as keyof typeof ICONS];
                                                            const isLocked = item.status === 'locked';
                                                            const isSelected = selectedSpellingTopic === item.key;
                                                            const isActive = item.status === 'active';
                                                            
                                                            const itemContent = (
                                                                <div className={cn(
                                                                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                                                    !isLocked && "hover:bg-muted",
                                                                    isSelected ? "bg-muted text-primary font-semibold" : (isActive ? "text-foreground" : "text-muted-foreground"),
                                                                )}>
                                                                    <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500" : (item.status === 'completed' || isSelected || isActive) ? "text-primary" : "text-muted-foreground")} />
                                                                    <span>{item.name}</span>
                                                                </div>
                                                            );

                                                            return (
                                                                <li key={index} onClick={() => handleSpellingTopicSelect(item.key as SpellingExerciseKey)} className={cn(!isLocked ? "cursor-pointer" : "cursor-not-allowed")}>
                                                                    {itemContent}
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </nav>
                                            </CardContent>
                                        </Card>
                                        <Card 
                                            onClick={() => handleTopicSelect(isNumbersExercise ? t('intro1Page.numbers') : t('intro1Page.abc'))}
                                            className="shadow-soft rounded-lg flex items-center gap-2 cursor-pointer hover:opacity-80 animate-pulse-glow border-2 border-brand-purple p-4"
                                        >
                                            <Lightbulb className="h-5 w-5 text-yellow-400 animate-pulse flex-shrink-0" />
                                            <p className="text-base font-semibold bg-gradient-to-r from-brand-purple to-brand-teal text-transparent bg-clip-text">
                                                {isNumbersExercise ? t('intro1Page.backToNumbersHint') : t('intro1Page.backToAbcHint')}
                                            </p>
                                        </Card>
                                    </div>
                                </div>
                                <div className="md:col-span-8">
                                    {showCongratulations && (
                                        <div className="text-center py-8 mt-4">
                                            <h2 className="text-5xl font-bold bg-gradient-to-r from-brand-purple to-brand-teal text-transparent bg-clip-text animate-pulse">
                                                {t('intro1Page.congratulations')}
                                            </h2>
                                            <p className="text-xl mt-4 text-muted-foreground">{t('intro1Page.exerciseComplete')}</p>
                                        </div>
                                    )}
                                    {selectedSpellingTopic && !showCongratulations ? (<SpellingExercise 
                                        exerciseKey={selectedSpellingTopic}
                                        onComplete={handleSpellingTopicComplete}
                                    />) : null}
                                </div>
                            </div>
                        );
                    }
                    if (selectedTopic && !['abc', 'abcExercise', 'abcspelling', 'numbersspelling', 'numbers', 'pronouns', 'possessives', 'verbtobe1', 'verbtobe2', 'verbtobe3', 'demonstratives', 'exercises1', 'exercises2', 'exercises3'].includes(selectedTopicKey || '')) {
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
                                    <CardTitle className="text-3xl">{t('intro1Page.welcomeTitle')}</CardTitle>
                                    <CardDescription className="text-base">{t('intro1Page.welcomeDescription')}</CardDescription>
                                </CardHeader>
                                <CardContent className="text-center px-6 pb-6">
                                    <p className="pt-4 text-lg">{t('intro1Page.welcomeHint')}</p>
                                </CardContent>
                            </Card>
                            <div className="flex items-center justify-center pt-8 gap-2">
                                <div className="relative bg-card p-4 rounded-lg shadow-soft text-center text-base max-w-[220px] border-2 border-brand-purple">
                                    <p className="font-bold text-lg bg-gradient-to-r from-brand-purple to-brand-teal text-transparent bg-clip-text">{t('intro1Page.penguinHint')}</p>
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
                })()}
            </div>
            <div className="md:col-span-3">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple">
                <CardHeader>
                    <CardTitle>{t('intro1Page.learningPath')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <nav>
                        <ul className="space-y-1">
                        {intro1Path.map((item) => {
                            const Icon = ICONS[item.status as keyof typeof ICONS];
                            const isLocked = item.status === 'locked';
                            const isSelected = selectedTopic === item.name;
                            const isActive = item.status === 'active';
                            
                            const itemContent = (
                                <div className={cn(
                                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                    !isLocked && "hover:bg-muted",
                                    isSelected ? "bg-muted text-primary font-semibold" : (isActive ? "text-foreground" : "text-muted-foreground"),
                                    isActive && item.key === 'abc' && 'animate-pulse-glow'
                                )}>
                                    <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500" : (item.status === 'completed' || isSelected || isActive) ? "text-primary" : "text-muted-foreground")} />
                                    <span>{item.name}</span>
                                </div>
                            );

                            return (
                                <li key={item.key} onClick={() => handleTopicSelect(item.name)} className={cn(!isLocked ? "cursor-pointer" : "cursor-not-allowed")}>
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
                                <div className="flex-1 h-full border-r-2 border-background"></div>
                                <div className="flex-1 h-full border-r-2 border-background"></div>
                                <div className="flex-1 h-full border-r-2 border-background"></div>
                                <div className="flex-1 h-full border-r-2 border-background"></div>
                                <div className="flex-1 h-full border-r-2 border-background"></div>
                                <div className="flex-1 h-full border-r-2 border-background"></div>
                                <div className="flex-1 h-full border-r-2 border-background"></div>
                                <div className="flex-1 h-full border-r-2 border-background"></div>
                                <div className="flex-1 h-full border-r-2 border-background"></div>
                                <div className="flex-1 h-full border-r-2 border-background"></div>
                                <div className="flex-1 h-full border-r-2 border-background"></div>
                                <div className="flex-1 h-full"></div>
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
