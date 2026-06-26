import { BookOpen, Flag, Footprints, Puzzle, Mic, Ear, Smile, GraduationCap, Star, Hand, MessageSquare, BrainCircuit, PenSquare, Lightbulb, Clock, Languages, Video } from 'lucide-react';
import type { ComponentType } from 'react';

export interface PathItem {
    type: string;
    icon: ComponentType<{ className?: string }>;
    label: string;
    href?: string;
    locked?: boolean;
    progress?: number;
    points?: number;
    className?: string;
    storageKey?: string;
}

export const englishIntroPathData: PathItem[] = [
    { type: 'start', icon: Footprints, label: 'dashboard.start', points: 0 },
    { type: 'class', icon: BookOpen, label: 'englishIntro.intro1', href: '/intro/1', progress: 0, points: 20, storageKey: 'intro1Progress' },
    { type: 'practice', icon: Puzzle, label: 'englishIntro.quiz1', href: '/quiz/1', progress: 0, points: 10, className: 'animate-pulse-glow', storageKey: 'quiz1Progress' },
    { type: 'practice', icon: Mic, label: 'englishIntro.speaking1', href: '/intro/speaking/1', progress: 0, points: 10, storageKey: 'speaking1Progress' },
    { type: 'class', icon: BookOpen, label: 'englishIntro.intro2', href: '/intro/2', storageKey: 'intro2Progress' },
    { type: 'practice', icon: Puzzle, label: 'englishIntro.quiz2', href: '/quiz/2', progress: 0, points: 10, storageKey: 'quiz2Progress' },
    { type: 'practice', icon: Ear, label: 'englishIntro.listening', href: '/listening-practice', progress: 0, points: 20, storageKey: 'listeningProgress'},
    { type: 'practice', icon: Mic, label: 'englishIntro.speaking', href: '/intro/speaking/final', progress: 0, points: 20, storageKey: 'speakingProgress'},
    { type: 'end', icon: Flag, label: 'dashboard.end', href: '/pricing', points: 0 },
];

export const kidsIntroPathData: PathItem[] = [
    { type: 'start', icon: Footprints, label: 'dashboard.start' },
    { type: 'class', icon: Smile, label: 'kidsPage.intro1', href: '/kids/intro1', storageKey: 'kidsIntro1Progress' },
    { type: 'practice', icon: Puzzle, label: 'kidsPage.quiz1', href: '/kids/quiz/1', storageKey: 'kidsQuiz1Progress' },
    { type: 'class', icon: Smile, label: 'kidsPage.intro2', href: '/kids/intro2', storageKey: 'kidsIntro2Progress' },
    { type: 'practice', icon: Puzzle, label: 'kidsPage.quiz2', href: '/kids/quiz/2', storageKey: 'kidsQuiz2Progress' },
    { type: 'practice', icon: Puzzle, label: 'kidsPage.finalTest', href: '/kids/quiz/final', storageKey: 'kidsFinalTestProgress' },
    { type: 'end', icon: Flag, label: 'dashboard.finish' }
];

export const espanolIntroPathData: PathItem[] = [
    { type: 'start', icon: Footprints, label: 'dashboard.start' },
    { type: 'class', icon: BookOpen, label: 'espanolIntroCourse.intro1', href: '/espanol/intro/1', storageKey: 'progress_espanol_intro_1' },
    { type: 'practice', icon: Puzzle, label: 'espanolIntroCourse.quiz1', href: '/espanol/quiz/1', storageKey: 'progress_es_quiz_1' },
    { type: 'class', icon: BookOpen, label: 'espanolIntroCourse.intro2', href: '/espanol/intro/2', storageKey: 'progress_espanol_intro_2' },
    { type: 'practice', icon: Puzzle, label: 'espanolIntroCourse.quiz2', href: '/espanol/quiz/2', storageKey: 'progress_es_quiz_2' },
    { type: 'practice', icon: Puzzle, label: 'espanolIntroCourse.finalTest', href: '#', storageKey: 'progress_espanol_quiz_final' },
    { type: 'end', icon: Flag, label: 'dashboard.finish' }
];

export const calculateKidsIntroCourseProgress = (progress: Record<string, number> | undefined) => {
    if (!progress) return 0;
    const courseItemsWithPoints = kidsIntroPathData.filter(item => item.storageKey);
    const totalItems = courseItemsWithPoints.length;

    if (totalItems === 0) {
        return 0;
    }

    const completedItems = courseItemsWithPoints.reduce((sum, item) => {
        const itemProgress = progress[item.storageKey!] || 0;
        return sum + (itemProgress >= 100 ? 1 : 0);
    }, 0);
    
    return Math.round((completedItems / totalItems) * 100);
};

export const calculateEspanolIntroProgress = (progress: Record<string, number> | undefined) => {
    if (!progress) return 0;
    const courseItemsWithPoints = espanolIntroPathData.filter(item => item.storageKey);
    const totalItems = courseItemsWithPoints.length;

    if (totalItems === 0) {
        return 0;
    }

    const completedItems = courseItemsWithPoints.reduce((sum, item) => {
        const itemProgress = progress[item.storageKey!] || 0;
        return sum + (itemProgress > 0 ? 1 : 0);
    }, 0);
    
    return Math.round((completedItems / totalItems) * 100);
};

export const calculateEnglishIntroCourseProgress = (progress: Record<string, number> | undefined) => {
    if (!progress) return 0;
    const courseItemsWithPoints = englishIntroPathData.filter(item => item.points && item.points > 0);
    const totalPossiblePoints = courseItemsWithPoints.reduce((sum, item) => sum + (item.points || 0), 0);
    
    if (totalPossiblePoints === 0) return 0;

    const earnedPoints = courseItemsWithPoints.reduce((sum, item) => {
        if (item.storageKey && progress[item.storageKey]) {
            const itemProgress = progress[item.storageKey] || 0;
            return sum + (itemProgress / 100) * (item.points || 0);
        }
        return sum;
    }, 0);
    
    return Math.round(earnedPoints);
};

export const getKidsIntro1PathData = (t: (key: string) => string): Topic[] => [
    { key: "abc", name: t('intro1Page.abc'), icon: Languages, status: 'active' },
    { key: "abc-memory", name: "Memory (ABC)", icon: BrainCircuit, status: 'locked' },
    { key: "numbers", name: t('intro1Page.numbers'), icon: BookOpen, status: 'locked' },
    { key: "numbers-memory", name: "Memory (Numbers)", icon: BrainCircuit, status: 'locked' },
    { key: "tobe", name: "To Be", icon: GraduationCap, status: 'locked' },
    { key: "tobe-memory", name: "Memory (To be)", icon: BrainCircuit, status: 'locked' },
    { key: "tobe-1-grammar", name: t('kidsA1.toBe1Grammar'), icon: GraduationCap, status: 'locked' },
    { key: "tobe-1-exercise", name: t('kidsA1.toBe1Exercise'), icon: PenSquare, status: 'locked' },
    { key: "possessives", name: t('intro1Page.possessives'), icon: GraduationCap, status: 'locked' },
    { key: "possessives-memory", name: "Memory (Possessives)", icon: BrainCircuit, status: 'locked' },
    { key: "tobe-2-grammar", name: t('kidsA1.toBe2Grammar'), icon: GraduationCap, status: 'locked' },
    { key: "tobe-2-exercise", name: t('kidsA1.toBe2Exercise'), icon: PenSquare, status: 'locked' },
    { key: "tobe-3-grammar", name: t('kidsA1.toBe3Grammar'), icon: GraduationCap, status: 'locked' },
    { key: "tobe-3-exercise", name: t('kidsA1.toBe3Exercise'), icon: PenSquare, status: 'locked' },
];

export type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
};
  
export const getIntro1PathData = (t: (key: string, values?: { [key: string]: string | number }) => string): Omit<Topic, 'icon'>[] => [
    { key: "abc", name: t('intro1Page.abc'), status: "active" },
    { key: "abcExercise", name: t('intro1Page.abcExercise'), status: "locked" },
    { key: "abcspelling", name: t('spellingExercise.abcspelling'), status: "locked" },
    { key: "numbers", name: t('intro1Page.numbers'), status: "locked" },
    { key: "numbersspelling", name: t('spellingExercise.numbersspelling'), status: "locked" },
    { key: "pronouns", name: t('intro1Page.pronouns'), status: "locked" },
    { key: "verbtobe1", name: t('intro1Page.verbtobe1'), status: "locked" },
    { key: "exercises1", name: t('intro1Page.exercises1'), status: "locked" },
    { key: "possessives", name: t('intro1Page.possessives'), status: "locked" },
    { key: "verbtobe2", name: t('intro1Page.verbtobe2'), status: "locked" },
    { key: "exercises2", name: t('intro1Page.exercises2'), status: "locked" },
    { key: "verbtobe3", name: t('intro1Page.verbtobe3'), status: "locked" },
    { key: "exercises3", name: t('intro1Page.exercises3'), status: "locked" },
    { key: "demonstratives", name: t('intro1Page.demonstratives'), status: "locked" },
];

export type SpellingExerciseKey =
  | 'femaleNames'
  | 'maleNames'
  | 'animalNames'
  | 'numbers1'
  | 'numbers2'
  | 'numbers3'
  | 'numbers4'
  | 'phoneNumbers';

export interface SpellingPathItem {
    key: SpellingExerciseKey;
    name: string;
    status: 'completed' | 'active' | 'locked';
}

export const getAbcSpellingPathData = (t: (key: string) => string): SpellingPathItem[] => [
    { key: "femaleNames", name: t('spellingExercise.femaleNames'), status: "active" },
    { key: "maleNames", name: t('spellingExercise.maleNames'), status: "locked" },
    { key: "animalNames", name: t('spellingExercise.animalNames'), status: "locked" },
];

export const getNumbersSpellingPathData = (t: (key: string) => string): SpellingPathItem[] => [
    { key: "numbers1", name: t('spellingExercise.numbers1'), status: "active" },
    { key: "numbers2", name: t('spellingExercise.numbers2'), status: "locked" },
    { key: "numbers3", name: t('spellingExercise.numbers3'), status: "locked" },
    { key: "numbers4", name: t('spellingExercise.numbers4'), status: "locked" },
    { key: "phoneNumbers", name: t('spellingExercise.phoneNumbers'), status: "locked" },
];

export type KidsIntro2PathKey =
  | 'tip'
  | 'mixed1'
  | 'greetings'
  | 'farewells'
  | 'memory'
  | 'mixed2'
  | 'time'
  | 'time-exercise'
  | 'countries';

export interface KidsIntro2PathItem {
    key: KidsIntro2PathKey;
    name: string;
    icon: React.ElementType,
    status: 'completed' | 'active' | 'locked';
}

export const getKidsIntro2PathData = (): KidsIntro2PathItem[] => [
    { key: 'tip', name: 'Tip Importante', icon: Lightbulb, status: 'active' },
    { key: 'mixed1', name: 'Ejercicios Mixtos 1', icon: PenSquare, status: 'locked' },
    { key: 'greetings', name: 'Saludos', icon: Hand, status: 'locked' },
    { key: 'farewells', name: 'Despedidas', icon: MessageSquare, status: 'locked' },
    { key: 'memory', name: 'Memory', icon: BrainCircuit, status: 'locked' },
    { key: 'mixed2', name: 'Ejercicios Mixtos 2', icon: PenSquare, status: 'locked' },
    { key: 'time', name: 'La Hora', icon: Clock, status: 'locked' },
    { key: 'time-exercise', name: 'Ejercicios Hora', icon: PenSquare, status: 'locked' },
    { key: 'countries', name: 'Paises y Nacionalidades', icon: BookOpen, status: 'locked' },
];

export type EnglishIntro2PathKey =
  | 'tip'
  | 'mixed1'
  | 'greetings'
  | 'farewells'
  | 'memory'
  | 'mixed2'
  | 'time'
  | 'time-exercise'
  | 'countries';

export interface EnglishIntro2PathItem {
    key: EnglishIntro2PathKey;
    name: string;
    icon: React.ElementType,
    status: 'completed' | 'active' | 'locked';
}

export const getEnglishIntro2PathData = (t: (key: string) => string): EnglishIntro2PathItem[] => [
    { key: 'tip', name: t('intro2Page.tip'), icon: Lightbulb, status: 'active' },
    { key: 'mixed1', name: t('intro2Page.mixed1'), icon: PenSquare, status: 'locked' },
    { key: 'greetings', name: t('intro2Page.greetings'), icon: Hand, status: 'locked' },
    { key: 'farewells', name: t('intro2Page.farewells'), icon: MessageSquare, status: 'locked' },
    { key: 'memory', name: 'Memory', icon: BrainCircuit, status: 'locked' },
    { key: 'mixed2', name: t('intro2Page.mixed2'), icon: PenSquare, status: 'locked' },
    { key: 'time', name: t('intro2Page.time'), icon: Clock, status: 'locked' },
    { key: 'time-exercise', name: t('intro2Page.timeExercise'), icon: PenSquare, status: 'locked' },
    { key: 'countries', name: t('intro2Page.countries'), icon: BookOpen, status: 'locked' },
];

export interface Exercise {
    id: number;
    transcript: string;
    audioSrc: string;
}

export interface SpellingExerciseData {
    title: string;
    exercises: Exercise[];
}

export const spellingExercisesData: Record<SpellingExerciseKey, SpellingExerciseData> = {
    'femaleNames': {
        title: 'spellingExercise.femaleNames',
        exercises: [
            { id: 1, transcript: 'mary', audioSrc: '/Audio/Female/Female1.mp3' },
            { id: 2, transcript: 'anna', audioSrc: '/Audio/Female/Female2.mp3' },
            { id: 3, transcript: 'patricia', audioSrc: '/Audio/Female/Female3.mp3' },
            { id: 4, transcript: 'sophia', audioSrc: '/Audio/Female/Female4.mp3' },
            { id: 5, transcript: 'linda', audioSrc: '/Audio/Female/Female2.mp3' }, // Fix repeated path
            { id: 6, transcript: 'amelia', audioSrc: '/Audio/Female/Female3.mp3' },
            { id: 7, transcript: 'barbara', audioSrc: '/Audio/Female/Female1.mp3' },
            { id: 8, transcript: 'lily', audioSrc: '/Audio/Female/Female4.mp3' },
            { id: 9, transcript: 'elizabeth', audioSrc: '/Audio/Female/Female2.mp3' },
            { id: 10, transcript: 'emily', audioSrc: '/Audio/Female/Female3.mp3' },
        ]
    },
    'maleNames': {
        title: 'spellingExercise.maleNames',
        exercises: [
            { id: 1, transcript: 'james', audioSrc: '/Audio/Male/Male1.mp3' },
            { id: 2, transcript: 'oliver', audioSrc: '/Audio/Male/Male2.mp3' },
            { id: 3, transcript: 'john', audioSrc: '/Audio/Male/Male3.mp3' },
            { id: 4, transcript: 'harry', audioSrc: '/Audio/Male/Male1.mp3' },
            { id: 5, transcript: 'robert', audioSrc: '/Audio/Male/Male2.mp3' },
            { id: 6, transcript: 'jack', audioSrc: '/Audio/Male/Male3.mp3' },
            { id: 7, transcript: 'michael', audioSrc: '/Audio/Male/Male1.mp3' },
            { id: 8, transcript: 'george', audioSrc: '/Audio/Male/Male2.mp3' },
            { id: 9, transcript: 'william', audioSrc: '/Audio/Male/Male3.mp3' },
            { id: 10, transcript: 'noah', audioSrc: '/Audio/Male/Male1.mp3' },
        ]
    },
    'animalNames': {
        title: 'spellingExercise.animalNames',
        exercises: [
            { id: 1, transcript: 'giraffe', audioSrc: '/Audio/Animals/Animal1.mp3' },
            { id: 2, transcript: 'koala', audioSrc: '/Audio/Animals/Animal2.mp3' },
            { id: 3, transcript: 'butterfly', audioSrc: '/Audio/Animals/Animal3.mp3' },
            { id: 4, transcript: 'owl', audioSrc: '/Audio/Animals/Animal4.mp3' },
            { id: 5, transcript: 'Zebra', audioSrc: '/Audio/Animals/Animal5.mp3' },
            { id: 6, transcript: 'wasp', audioSrc: '/Audio/Animals/Animal1.mp3' },
            { id: 7, transcript: 'fox', audioSrc: '/Audio/Animals/Animal2.mp3' },
            { id: 8, transcript: 'chimpanzee', audioSrc: '/Audio/Animals/Animal3.mp3' },
            { id: 9, transcript: 'squid', audioSrc: '/Audio/Animals/Animal4.mp3' },
            { id: 10, transcript: 'snake', audioSrc: '/Audio/Animals/Animal5.mp3' },
            { id: 11, transcript: 'frog', audioSrc: '/Audio/Animals/Animal1.mp3' },
            { id: 12, transcript: 'wolf', audioSrc: '/Audio/Animals/Animal2.mp3' },
            { id: 13, transcript: 'shark', audioSrc: '/Audio/Animals/Animal3.mp3' },
            { id: 14, transcript: 'mosquitoes', audioSrc: '/Audio/Animals/Animal4.mp3' },
            { id: 15, transcript: 'clownfish', audioSrc: '/Audio/Animals/Animal5.mp3' },
            { id: 16, transcript: 'buffalo', audioSrc: '/Audio/Animals/Animal1.mp3' },
            { id: 17, transcript: 'kangaroo', audioSrc: '/Audio/Animals/Animal2.mp3' },
            { id: 18, transcript: 'whale', audioSrc: '/Audio/Animals/Animal3.mp3' },
        ]
    },
    'numbers1': {
        title: 'spellingExercise.numbers1',
        exercises: [
            { id: 1, transcript: '53', audioSrc: '/Audio/Numbers/Numbers1/1.mp3' },
            { id: 2, transcript: '68', audioSrc: '/Audio/Numbers/Numbers1/2.mp3' },
            { id: 3, transcript: '4', audioSrc: '/Audio/Numbers/Numbers1/3.mp3' },
            { id: 4, transcript: '95', audioSrc: '/Audio/Numbers/Numbers1/4.mp3' },
            { id: 5, transcript: '90', audioSrc: '/Audio/Numbers/Numbers1/5.mp3' },
            { id: 6, transcript: '60', audioSrc: '/Audio/Numbers/Numbers1/6.mp3' },
            { id: 7, transcript: '5', audioSrc: '/Audio/Numbers/Numbers1/7.mp3' },
            { id: 8, transcript: '80', audioSrc: '/Audio/Numbers/Numbers1/8.mp3' },
            { id: 9, transcript: '64', audioSrc: '/Audio/Numbers/Numbers1/9.mp3' },
            { id: 10, transcript: '10', audioSrc: '/Audio/Numbers/Numbers1/10.mp3' },
        ]
    },
    'numbers2': {
        title: 'spellingExercise.numbers2',
        exercises: [
            { id: 1, transcript: '83', audioSrc: '/Audio/Numbers/Numbers2/2.1.mp3' },
            { id: 2, transcript: '481', audioSrc: '/Audio/Numbers/Numbers2/2.2.mp3' },
            { id: 3, transcript: '948', audioSrc: '/Audio/Numbers/Numbers2/2.3.mp3' },
            { id: 4, transcript: '540', audioSrc: '/Audio/Numbers/Numbers2/2.4.mp3' },
            { id: 5, transcript: '38', audioSrc: '/Audio/Numbers/Numbers2/2.5.mp3' },
            { id: 6, transcript: '90', audioSrc: '/Audio/Numbers/Numbers2/2.6.mp3' },
            { id: 7, transcript: '6', audioSrc: '/Audio/Numbers/Numbers2/2.7.mp3' },
            { id: 8, transcript: '63', audioSrc: '/Audio/Numbers/Numbers2/2.8.mp3' },
            { id: 9, transcript: '45', audioSrc: '/Audio/Numbers/Numbers2/2.9.mp3' },
            { id: 10, transcript: '415', audioSrc: '/Audio/Numbers/Numbers2/2.10.mp3' },
        ]
    },
    'numbers3': {
        title: 'spellingExercise.numbers3',
        exercises: [
            { id: 1, transcript: '9803', audioSrc: '/Audio/Numbers/Numbers3/3.1.mp3' },
            { id: 2, transcript: '38', audioSrc: '/Audio/Numbers/Numbers3/3.2.mp3' },
            { id: 3, transcript: '732', audioSrc: '/Audio/Numbers/Numbers3/3.3.mp3' },
            { id: 4, transcript: '61', audioSrc: '/Audio/Numbers/Numbers3/3.4.mp3' },
            { id: 5, transcript: '3', audioSrc: '/Audio/Numbers/Numbers3/3.5.mp3' },
            { id: 6, transcript: '310', audioSrc: '/Audio/Numbers/Numbers3/3.6.mp3' },
            { id: 7, transcript: '69', audioSrc: '/Audio/Numbers/Numbers3/3.7.mp3' },
            { id: 8, transcript: '52', audioSrc: '/Audio/Numbers/Numbers3/3.8.mp3' },
            { id: 9, transcript: '106', audioSrc: '/Audio/Numbers/Numbers3/3.9.mp3' },
            { id: 10, transcript: '98', audioSrc: '/Audio/Numbers/Numbers3/3.10.mp3' },
        ]
    },
    'numbers4': {
        title: 'spellingExercise.numbers4',
        exercises: [
            { id: 1, transcript: '32734', audioSrc: '/Audio/Numbers/Numbers4/4.1.mp3' },
            { id: 2, transcript: '8599', audioSrc: '/Audio/Numbers/Numbers4/4.2.mp3' },
            { id: 3, transcript: '50203', audioSrc: '/Audio/Numbers/Numbers4/4.3.mp3' },
            { id: 4, transcript: '983', audioSrc: '/Audio/Numbers/Numbers4/4.4.mp3' },
            { id: 5, transcript: '119', audioSrc: '/Audio/Numbers/Numbers4/4.5.mp3' },
            { id: 6, transcript: '3182', audioSrc: '/Audio/Numbers/Numbers4/4.6.mp3' },
            { id: 7, transcript: '38529', audioSrc: '/Audio/Numbers/Numbers4/4.7.mp3' },
            { id: 8, transcript: '1362', audioSrc: '/Audio/Numbers/Numbers4/4.8.mp3' },
            { id: 9, transcript: '913', audioSrc: '/Audio/Numbers/Numbers4/4.9.mp3' },
            { id: 10, transcript: '5395', audioSrc: '/Audio/Numbers/Numbers4/4.10.mp3' },
        ]
    },
    'phoneNumbers': {
        title: 'spellingExercise.phoneNumbers',
        exercises: [
            { id: 1, transcript: '7972856959', audioSrc: '/Audio/Numbers/PhoneNumbers/P.1.mp3' },
            { id: 2, transcript: '7632980228', audioSrc: '/Audio/Numbers/PhoneNumbers/P.2.mp3' },
            { id: 3, transcript: '7848380179', audioSrc: '/Audio/Numbers/PhoneNumbers/P.3.mp3' },
            { id: 4, transcript: '5592717081', audioSrc: '/Audio/Numbers/PhoneNumbers/P.4.mp3' },
            { id: 5, transcript: '3585554176', audioSrc: '/Audio/Numbers/PhoneNumbers/P.5.mp3' },
            { id: 6, transcript: '2144742572', audioSrc: '/Audio/Numbers/PhoneNumbers/P.6.mp3' },
            { id: 7, transcript: '8939138143', audioSrc: '/Audio/Numbers/PhoneNumbers/P.7.mp3' },
            { id: 8, transcript: '4622050026', audioSrc: '/Audio/Numbers/PhoneNumbers/P.8.mp3' },
            { id: 9, transcript: '8119726619', audioSrc: '/Audio/Numbers/PhoneNumbers/P.9.mp3' },
            { id: 10, transcript: '3142380808', audioSrc: '/Audio/Numbers/PhoneNumbers/P.10.mp3' },
        ]
    },
};

export const getA1MainPath = (t: (key: string) => string): PathItem[] => [
    { type: 'start', icon: Footprints, label: 'dashboard.start' },
    { type: 'class', icon: BookOpen, label: 'Articulos y Genero', href: '/espanol/a1/articulos-y-genero', storageKey: 'progress_a1_es_articulos_y_genero' },
    { type: 'class', icon: BookOpen, label: 'Posesivos y Tener', href: '/espanol/a1/posesivos-y-tener', storageKey: 'progress_a1_es_posesivos_y_tener' },
    { type: 'class', icon: BookOpen, label: 'Ser', href: '/espanol/a1/ser', storageKey: 'progress_a1_es_ser' },
    { type: 'class', icon: BookOpen, label: 'Estar', href: '/espanol/a1/estar', storageKey: 'progress_a1_es_estar' },
    { type: 'class', icon: BookOpen, label: 'Preposiciones de lugar', href: '/espanol/a1/preposiciones-de-lugar', storageKey: 'progress_a1_es_preposiciones_de_lugar' },
    { type: 'class', icon: BookOpen, label: 'ubicacion', href: '/espanol/a1/ubicacion', storageKey: 'progress_a1_es_ubicacion' },
    { type: 'class', icon: BookOpen, label: 'Preguntas', href: '/espanol/a1/preguntas', storageKey: 'progress_a1_es_preguntas' },
    { type: 'class', icon: BookOpen, label: 'Comida y restaurante', href: '/espanol/a1/comida-y-restaurante', storageKey: 'progress_a1_es_comida_y_restaurante' },
    { type: 'class', icon: BookOpen, label: 'Presente simple Regulares', href: '/espanol/a1/presente-simple-regulares', storageKey: 'progress_a1_es_presente_simple_regulares' },
    { type: 'class', icon: BookOpen, label: 'Comparativos y Superlativos', href: '/espanol/a1/comparativos-y-superlativos', storageKey: 'progress_a1_es_comparativos_y_superlativos' },
    { type: 'class', icon: BookOpen, label: 'Demostrativos', href: '/espanol/a1/demostrativos', storageKey: 'progress_a1_es_demostrativos' },
    { type: 'class', icon: BookOpen, label: 'Verbos de Preferencia', href: '/espanol/a1/verbos-de-preferencia', storageKey: 'progress_a1_es_verbos_de_preferencia' },
    { type: 'class', icon: BookOpen, label: 'Presente Continuo', href: '/espanol/a1/presente-continuo', storageKey: 'progress_a1_es_presente_continuo' },
    { type: 'class', icon: BookOpen, label: 'Presente simple irregulares', href: '/espanol/a1/presente-simple-irregulares', storageKey: 'progress_a1_es_presente_simple_irregulares' },
    { type: 'end', icon: Flag, label: 'dashboard.finish' },
];

export const getA1EngMainPath = (t: (key: string) => string): PathItem[] => [
    { type: 'start', icon: Footprints, label: 'dashboard.start' },
    { type: 'class', icon: BookOpen, label: 'a1Eng.unit1', href: '/ingles/a1/unit/1', storageKey: 'progress_a1_eng_unit_1' },
    { type: 'practice', icon: Puzzle, label: 'a1Eng.review1', href: '/ingles/a1/review/1', storageKey: 'progress_a1_eng_review_1' },
    { type: 'practice', icon: Puzzle, label: 'a1Eng.test1', href: '#', storageKey: 'progress_a1_eng_test_1' },
    { type: 'class', icon: BookOpen, label: 'a1Eng.unit2', href: '/ingles/a1/unit/2', storageKey: 'progress_a1_eng_unit_2' },
    { type: 'practice', icon: Puzzle, label: 'a1Eng.review2', href: '/ingles/a1/review/2', storageKey: 'progress_a1_eng_review_2' },
    { type: 'practice', icon: Puzzle, label: 'a1Eng.test2', href: '#', storageKey: 'progress_a1_eng_test_2' },
    { type: 'class', icon: BookOpen, label: 'a1Eng.unit3', href: '/ingles/a1/unit/3', storageKey: 'progress_a1_eng_unit_3' },
    { type: 'practice', icon: Puzzle, label: 'a1Eng.review3', href: '/ingles/a1/review/3', storageKey: 'progress_a1_eng_review_3' },
    { type: 'practice', icon: Puzzle, label: 'a1Eng.test3', href: '#', storageKey: 'progress_a1_eng_test_3' },
    { type: 'end', icon: Flag, label: 'dashboard.finish' },
];

export const getA1UnitPath = (unitId: string | number, t: (key: string) => string): PathItem[] => {
    const unitPaths: {[key: string]: PathItem[]} = {
        '1': [
            { type: 'start', icon: Footprints, label: 'dashboard.start' },
            ...Array.from({ length: 4 }, (_, i) => ({
                type: 'class' as const,
                icon: BookOpen,
                label: `Class ${i + 1} (A1)`,
                href: `/a1/${i + 1}`,
                storageKey: `progress_a1_${i + 1}`
            })),
            { type: 'practice', icon: Puzzle, label: 'a1course.review1-4', href: '#' },
            { type: 'practice', icon: Puzzle, label: 'a1course.test1-4', href: '#' },
            { type: 'end', icon: Flag, label: 'dashboard.finish' },
        ],
        '2': [
            { type: 'start', icon: Footprints, label: 'dashboard.start' },
             ...Array.from({ length: 5 }, (_, i) => ({
                type: 'class' as const,
                icon: BookOpen,
                label: `Class ${i + 5} (A1)`,
                href: `/a1/${i + 5}`,
                storageKey: `progress_a1_${i + 5}`
            })),
            { type: 'practice', icon: Puzzle, label: 'a1course.review5-9', href: '#' },
            { type: 'practice', icon: Puzzle, label: 'a1course.test5-9', href: '#' },
            { type: 'end', icon: Flag, label: 'dashboard.finish' },
        ],
        '3': [
            { type: 'start', icon: Footprints, label: 'dashboard.start' },
             ...Array.from({ length: 6 }, (_, i) => ({
                type: 'class' as const,
                icon: BookOpen,
                label: `Class ${i + 10} (A1)`,
                href: `/a1/${i + 10}`,
                storageKey: `progress_a1_${i + 10}`
            })),
            { type: 'practice', icon: Puzzle, label: 'a1course.review10-15', href: '#' },
            { type: 'practice', icon: Puzzle, label: 'a1course.finalTest', href: '#' },
            { type: 'end', icon: Flag, label: 'dashboard.finish' },
        ]
    };
    return unitPaths[String(unitId)] || [];
}

export const getA1EngUnitPath = (unitId: string | number, t: (key: string) => string): PathItem[] => {
    const unitPaths: {[key: string]: PathItem[]} = {
        '1': [
            { type: 'start', icon: Footprints, label: 'dashboard.start' },
            ...Array.from({ length: 5 }, (_, i) => ({ type: 'class' as const, icon: BookOpen, label: `Class ${i + 1} (A1)`, href: `/ingles/a1/class/${i + 1}`, storageKey: `progress_a1_eng_unit_1_class_${i + 1}` })),
            { type: 'end', icon: Flag, label: 'dashboard.finish' },
        ],
        '2': [
            { type: 'start', icon: Footprints, label: 'dashboard.start' },
             ...Array.from({ length: 5 }, (_, i) => ({ type: 'class' as const, icon: BookOpen, label: `Class ${i + 6} (A1)`, href: `/ingles/a1/class/${i + 6}`, storageKey: `progress_a1_eng_unit_2_class_${i + 6}` })),
            { type: 'end', icon: Flag, label: 'dashboard.finish' },
        ],
        '3': [
            { type: 'start', icon: Footprints, label: 'dashboard.start' },
            { type: 'class', icon: BookOpen, label: 'Class 11 (A1)', href: '/ingles/a1/class/11', storageKey: 'progress_a1_eng_unit_3_class_11' },
            { type: 'class', icon: BookOpen, label: 'Class 12 (A1)', href: '/ingles/a1/class/12', storageKey: 'progress_a1_eng_unit_3_class_12' },
            { type: 'class', icon: BookOpen, label: 'Class 13 (A1)', href: '/ingles/a1/class/13', storageKey: 'progress_a1_eng_unit_3_class_13' },
            { type: 'class', icon: BookOpen, label: 'Class 14 (A1)', href: '/ingles/a1/class/14', storageKey: 'progress_a1_eng_unit_3_class_14' },
            { type: 'class', icon: BookOpen, label: 'Class 15 (A1)', href: '/ingles/a1/class/15', storageKey: 'progress_a1_eng_unit_3_class_15' },
            { type: 'class', icon: BookOpen, label: 'Class 16 (A1)', href: '/ingles/a1/class/16', storageKey: 'progress_a1_eng_unit_3_class_16' },
            { type: 'end', icon: Flag, label: 'dashboard.finish' },
        ]
    };
    return unitPaths[String(unitId)] || [];
}

export const getA2EngMainPath = (t: (key: string) => string): PathItem[] => [
    { type: 'start', icon: Footprints, label: 'dashboard.start' },
    { type: 'class', icon: BookOpen, label: 'a2Eng.unit1', href: '/ingles/a2/unit/1', storageKey: 'progress_a2_eng_unit_1' },
    { type: 'practice', icon: Puzzle, label: 'a2Eng.review1', href: '#', storageKey: 'progress_a2_eng_review_1' },
    { type: 'practice', icon: Puzzle, label: 'a2Eng.test1', href: '#', storageKey: 'progress_a2_eng_test_1' },
    { type: 'class', icon: BookOpen, label: 'a2Eng.unit2', href: '/ingles/a2/unit/2', storageKey: 'progress_a2_eng_unit_2' },
    { type: 'practice', icon: Puzzle, label: 'a2Eng.review2', href: '#', storageKey: 'progress_a2_eng_review_2' },
    { type: 'practice', icon: Puzzle, label: 'a2Eng.test2', href: '#', storageKey: 'progress_a2_eng_test_2' },
    { type: 'class', icon: BookOpen, label: 'a2Eng.unit3', href: '/ingles/a2/unit/3', storageKey: 'progress_a2_eng_unit_3' },
    { type: 'practice', icon: Puzzle, label: 'a2Eng.review3', href: '#', storageKey: 'progress_a2_eng_review_3' },
    { type: 'practice', icon: Puzzle, label: 'a2Eng.test3', href: '#', storageKey: 'progress_a2_eng_test_3' },
    { type: 'class', icon: BookOpen, label: 'a2Eng.unit4', href: '/ingles/a2/unit/4', storageKey: 'progress_a2_eng_unit_4' },
    { type: 'practice', icon: Puzzle, label: 'a2Eng.review4', href: '#', storageKey: 'progress_a2_eng_review_4' },
    { type: 'practice', icon: Puzzle, label: 'a2Eng.finalTest', href: '#', storageKey: 'progress_a2_eng_test_final' },
    { type: 'end', icon: Flag, label: 'dashboard.finish' },
];

export const getA2EngUnitPath = (unitId: string | number, t: (key: string) => string): PathItem[] => {
    const unitPaths: {[key: string]: PathItem[]} = {
        '1': [
            { type: 'start', icon: Footprints, label: 'dashboard.start' },
            ...Array.from({ length: 5 }, (_, i) => ({ type: 'class' as const, icon: BookOpen, label: `Class ${i + 1} (A2)`, href: `/ingles/a2/class/${i + 1}`, storageKey: `progress_a2_eng_unit_1_class_${i + 1}` })),
            { type: 'end', icon: Flag, label: 'dashboard.finish' },
        ],
        '2': [
            { type: 'start', icon: Footprints, label: 'dashboard.start' },
             ...Array.from({ length: 5 }, (_, i) => ({ type: 'class' as const, icon: BookOpen, label: `Class ${i + 6} (A2)`, href: `/ingles/a2/class/${i + 6}`, storageKey: `progress_a2_eng_unit_2_class_${i + 6}` })),
            { type: 'end', icon: Flag, label: 'dashboard.finish' },
        ],
        '3': [
            { type: 'start', icon: Footprints, label: 'dashboard.start' },
             ...Array.from({ length: 5 }, (_, i) => ({ type: 'class' as const, icon: BookOpen, label: `Class ${i + 11} (A2)`, href: `/ingles/a2/class/${i + 11}`, storageKey: `progress_a2_eng_unit_3_class_${i + 11}` })),
            { type: 'end', icon: Flag, label: 'dashboard.finish' },
        ],
        '4': [
            { type: 'start', icon: Footprints, label: 'dashboard.start' },
             ...Array.from({ length: 5 }, (_, i) => ({ type: 'class' as const, icon: BookOpen, label: `Class ${i + 16} (A2)`, href: `/ingles/a2/class/${i + 16}`, storageKey: `progress_a2_eng_unit_4_class_${i + 16}` })),
            { type: 'end', icon: Flag, label: 'dashboard.finish' },
        ]
    };
    return unitPaths[String(unitId)] || [];
}

export const getA2EspanolPath = (t: (key: string) => string): PathItem[] => [
    { type: 'start', icon: Footprints, label: 'dashboard.start' },
    { type: 'class', icon: BookOpen, label: 'reflexivos regulares', href: '/espanol/a2/reflexivos-regulares', storageKey: 'progress_a2_es_reflexivos_regulares' },
    { type: 'class', icon: BookOpen, label: 'reflexivos irregulares', href: '/espanol/a2/reflexivos-irregulares', storageKey: 'progress_a2_es_reflexivos_irregulares' },
    { type: 'class', icon: BookOpen, label: 'reflexivos mixtos', href: '/espanol/a2/reflexivos-mix', storageKey: 'progress_a2_es_reflexivos_mix' },
    { type: 'class', icon: BookOpen, label: 'pasado regulares', href: '/espanol/a2/pasado-regulares', storageKey: 'progress_a2_es_pasado_regulares' },
    { type: 'class', icon: BookOpen, label: 'pasado irregulares', href: '/espanol/a2/pasado-irregulares', storageKey: 'progress_a2_es_pasado_irregulares' },
    { type: 'class', icon: BookOpen, label: 'reflexivos pasado', href: '/espanol/a2/reflexivos-pasado', storageKey: 'progress_a2_es_reflexivos_pasado' },
    { type: 'class', icon: BookOpen, label: 'imperfecto', href: '/espanol/a2/imperfecto', storageKey: 'progress_a2_es_imperfecto' },
    { type: 'class', icon: BookOpen, label: 'Pasado simple vs imperfecto', href: '/espanol/a2/pasado-vs-imperfecto', storageKey: 'progress_a2_es_pasado_vs_imperfecto' },
    { type: 'class', icon: BookOpen, label: 'preterito perfecto', href: '/espanol/a2/preterito-perfecto', storageKey: 'progress_a2_es_preterito_perfecto' },
    { type: 'end', icon: Flag, label: 'dashboard.finish' },
];

export const getB1EspanolPath = (): PathItem[] => [
    { type: 'start', icon: Footprints, label: 'dashboard.start' },
    { type: 'class', icon: BookOpen, label: 'b1Espanol.pronombres', href: '#', storageKey: 'progress_b1_es_1' },
    { type: 'class', icon: BookOpen, label: 'b1Espanol.doblePronombre', href: '#', storageKey: 'progress_b1_es_2' },
    { type: 'class', icon: BookOpen, label: 'b1Espanol.porPara', href: '#', storageKey: 'progress_b1_es_3' },
    { type: 'class', icon: BookOpen, label: 'b1Espanol.futuro', href: '#', storageKey: 'progress_b1_es_4' },
    { type: 'class', icon: BookOpen, label: 'b1Espanol.imperativo', href: '#', storageKey: 'progress_b1_es_5' },
    { type: 'class', icon: BookOpen, label: 'b1Espanol.presenteSubjuntivo', href: '#', storageKey: 'progress_b1_es_6' },
    { type: 'end', icon: Flag, label: 'dashboard.finish' }
];

export const getA2UnitPath = (unitId: string | number, t: (key: string) => string): PathItem[] => {
    const unitPaths: {[key: string]: PathItem[]} = {
        '1': [
            { type: 'start', icon: Footprints, label: 'dashboard.start' },
            ...Array.from({ length: 5 }, (_, i) => ({ type: 'class' as const, icon: BookOpen, label: `Clase ${i + 1}`, href: `#`, storageKey: `progress_a2_es_unit_1_class_${i + 1}` })),
            { type: 'end', icon: Flag, label: 'dashboard.finish' },
        ],
    };
    return unitPaths[String(unitId)] || [];
}

export const getB1MainPath = (t: (key: string) => string): PathItem[] => [
    { type: 'start', icon: Footprints, label: 'dashboard.start' },
    { type: 'practice', icon: Video, label: 'Ted x Talks 0', href: '/ingles/b1/ted-talks-0', storageKey: 'progress_b1_ted_talks_0' },
    { type: 'class', icon: BookOpen, label: 'b1course.unit1', href: '/ingles/b1/unit/1', storageKey: 'progress_b1_unit_1' },
    { type: 'practice', icon: Puzzle, label: 'b1course.review1', href: '#', storageKey: 'progress_b1_eng_review_1' },
    { type: 'practice', icon: Puzzle, label: 'b1course.test1', href: '#', storageKey: 'progress_b1_eng_test_1' },
    { type: 'class', icon: BookOpen, label: 'b1course.unit2', href: '/ingles/b1/unit/2', storageKey: 'progress_b1_unit_2' },
    { type: 'practice', icon: Puzzle, label: 'b1course.review2', href: '#', storageKey: 'progress_b1_eng_review_2' },
    { type: 'practice', icon: Puzzle, label: 'b1course.test2', href: '#', storageKey: 'progress_b1_eng_test_2' },
    { type: 'class', icon: BookOpen, label: 'b1course.unit3', href: '/ingles/b1/unit/3', storageKey: 'progress_b1_unit_3' },
    { type: 'practice', icon: Puzzle, label: 'b1course.review3', href: '#', storageKey: 'progress_b1_eng_review_3' },
    { type: 'practice', icon: Puzzle, label: 'b1course.test3', href: '#', storageKey: 'progress_b1_eng_test_3' },
    { type: 'class', icon: BookOpen, label: 'b1course.unit4', href: '/ingles/b1/unit/4', storageKey: 'progress_b1_unit_4' },
    { type: 'practice', icon: Puzzle, label: 'b1course.review4', href: '#', storageKey: 'progress_b1_eng_review_4' },
    { type: 'practice', icon: Puzzle, label: 'b1course.finalTest', href: '#', storageKey: 'progress_b1_eng_test_final' },
    { type: 'end', icon: Flag, label: 'dashboard.finish', href: '/ingles/b2' },
];

export const getB1UnitPath = (unitId: string | number, t: (key: string) => string): PathItem[] => {
    const unitPaths: {[key: string]: PathItem[]} = {
        '1': [
            { type: 'start', icon: Footprints, label: 'dashboard.start' },
            ...Array.from({ length: 5 }, (_, i) => ({ type: 'class' as const, icon: BookOpen, label: `Class ${i + 1} (B1)`, href: `/ingles/b1/class/${i + 1}`, storageKey: `progress_b1_eng_unit_1_class_${i + 1}` })),
            { type: 'end', icon: Flag, label: 'dashboard.finish' },
        ],
        '2': [
            { type: 'start', icon: Footprints, label: 'dashboard.start' },
             ...Array.from({ length: 5 }, (_, i) => ({ type: 'class' as const, icon: BookOpen, label: `Class ${i + 6} (B1)`, href: `/ingles/b1/class/${i + 6}`, storageKey: `progress_b1_eng_unit_2_class_${i + 6}` })),
            { type: 'end', icon: Flag, label: 'dashboard.finish' },
        ],
        '3': [
            { type: 'start', icon: Footprints, label: 'dashboard.start' },
             ...Array.from({ length: 5 }, (_, i) => ({ type: 'class' as const, icon: BookOpen, label: `Class ${i + 11} (B1)`, href: `/ingles/b1/class/${i + 11}`, storageKey: `progress_b1_eng_unit_3_class_${i + 11}` })),
            { type: 'end', icon: Flag, label: 'dashboard.finish' },
        ],
        '4': [
            { type: 'start', icon: Footprints, label: 'dashboard.start' },
             ...Array.from({ length: 5 }, (_, i) => ({ type: 'class' as const, icon: BookOpen, label: `Class ${i + 16} (B1)`, href: `/ingles/b1/class/${i + 16}`, storageKey: `progress_b1_eng_unit_4_class_${i + 16}` })),
            { type: 'end', icon: Flag, label: 'dashboard.finish' },
        ]
    };
    return unitPaths[String(unitId)] || [];
}

export const getB2MainPath = (t: (key: string) => string): PathItem[] => [
    { type: 'start', icon: Footprints, label: 'dashboard.start' },
    { type: 'class', icon: BookOpen, label: 'b2course.unit1', href: '/ingles/b2/unit/1', storageKey: 'progress_b2_unit_1' },
    { type: 'practice', icon: Puzzle, label: 'b2course.review1', href: '#', storageKey: 'progress_b2_eng_review_1' },
    { type: 'practice', icon: Puzzle, label: 'b2course.test1', href: '#', storageKey: 'progress_b2_eng_test_1' },
    { type: 'class', icon: BookOpen, label: 'b2course.unit2', href: '/ingles/b2/unit/2', storageKey: 'progress_b2_unit_2' },
    { type: 'practice', icon: Puzzle, label: 'b2course.review2', href: '#', storageKey: 'progress_b2_eng_review_2' },
    { type: 'practice', icon: Puzzle, label: 'b2course.test2', href: '#', storageKey: 'progress_b2_eng_test_2' },
    { type: 'class', icon: BookOpen, label: 'b2course.unit3', href: '/ingles/b2/unit/3', storageKey: 'progress_b2_unit_3' },
    { type: 'practice', icon: Puzzle, label: 'b2course.review3', href: '#', storageKey: 'progress_b2_eng_review_3' },
    { type: 'practice', icon: Puzzle, label: 'b2course.test3', href: '#', storageKey: 'progress_b2_eng_test_3' },
    { type: 'class', icon: BookOpen, label: 'b2course.unit4', href: '/ingles/b2/unit/4', storageKey: 'progress_b2_unit_4' },
    { type: 'practice', icon: Puzzle, label: 'b2course.review4', href: '#', storageKey: 'progress_b2_eng_review_4' },
    { type: 'practice', icon: Puzzle, label: 'b2course.finalTest', href: '#', storageKey: 'progress_b2_eng_test_final' },
    { type: 'end', icon: Flag, label: 'dashboard.finish' },
];

export const getB2UnitPath = (unitId: string | number, t: (key: string) => string): PathItem[] => {
    const unitPaths: {[key: string]: PathItem[]} = {
        '1': [
            { type: 'start', icon: Footprints, label: 'dashboard.start' },
            ...Array.from({ length: 5 }, (_, i) => ({ type: 'class' as const, icon: BookOpen, label: `Class ${i + 1} (B2)`, href: `/ingles/b2/class/${i + 1}`, storageKey: `progress_b2_eng_unit_1_class_${i + 1}` })),
            { type: 'practice', icon: Puzzle, label: 'b2course.review1-5', href: '#' },
            { type: 'practice', icon: Puzzle, label: 'b2course.test1-5', href: '#' },
            { type: 'end', icon: Flag, label: 'dashboard.finish' },
        ],
        '2': [
            { type: 'start', icon: Footprints, label: 'dashboard.start' },
             ...Array.from({ length: 5 }, (_, i) => ({ type: 'class' as const, icon: BookOpen, label: `Class ${i + 6} (B2)`, href: `/ingles/b2/class/${i + 6}`, storageKey: `progress_b2_eng_unit_2_class_${i + 6}` })),
            { type: 'practice', icon: Puzzle, label: 'b2course.review6-10', href: '#' },
            { type: 'practice', icon: Puzzle, label: 'b2course.test6-10', href: '#' },
            { type: 'end', icon: Flag, label: 'dashboard.finish' },
        ],
        '3': [
            { type: 'start', icon: Footprints, label: 'dashboard.start' },
             ...Array.from({ length: 5 }, (_, i) => ({ type: 'class' as const, icon: BookOpen, label: `Class ${i + 11} (B2)`, href: `/ingles/b2/class/${i + 11}`, storageKey: `progress_b2_eng_unit_3_class_${i + 11}` })),
            { type: 'practice', icon: Puzzle, label: 'b2course.review11-15', href: '#' },
            { type: 'practice', icon: Puzzle, label: 'b2course.test11-15', href: '#' },
            { type: 'end', icon: Flag, label: 'dashboard.finish' },
        ],
        '4': [
            { type: 'start', icon: Footprints, label: 'dashboard.start' },
             ...Array.from({ length: 5 }, (_, i) => ({ type: 'class' as const, icon: BookOpen, label: `Class ${i + 16} (B2)`, href: `/ingles/b2/class/${i + 16}`, storageKey: `progress_b2_eng_unit_4_class_${i + 16}` })),
            { type: 'practice', icon: Puzzle, label: 'b2course.review16-20', href: '#' },
            { type: 'practice', icon: Puzzle, label: 'b2course.test16-20', href: '#' },
            { type: 'end', icon: Flag, label: 'dashboard.finish' },
        ]
    };
    return unitPaths[String(unitId)] || [];
}

export const getKidsA1MainPath = (t: (key: string) => string): PathItem[] => [
    { type: 'start', icon: Footprints, label: 'dashboard.start' },
    { type: 'class', icon: GraduationCap, label: 'kidsA1.toBe', href: '/kids/a1/to-be', storageKey: 'progress_kids_a1_tobe' },
    { type: 'class', icon: GraduationCap, label: 'kidsA1.presentSimple', href: '/kids/a1/present-simple', storageKey: 'progress_kids_a1_presentsimple' },
    { type: 'class', icon: GraduationCap, label: 'kidsA1.can', href: '/kids/a1/can', storageKey: 'progress_kids_a1_can' },
    { type: 'class', icon: GraduationCap, label: 'kidsA1.saxonGenitive', href: '/kids/a1/genitivo-sajon', storageKey: 'progress_kids_a1_saxongenitive' },
    { type: 'class', icon: GraduationCap, label: 'kidsA1.whQuestions', href: '/kids/a1/wh-questions', storageKey: 'progress_kids_a1_whquestions' },
    { type: 'class', icon: GraduationCap, label: 'kidsA1.posesivos', href: '/kids/a1/posesivos', storageKey: 'progress_kids_a1_possessives' },
    { type: 'class', icon: GraduationCap, label: 'kidsA1.preferenceVerbs', href: '/kids/a1/verbos-preferencia', storageKey: 'progress_kids_a1_preferenceverbs' },
    { type: 'class', icon: GraduationCap, label: 'kidsA1.demonstratives', href: '/kids/a1/demostrativos', storageKey: 'progress_kids_a1_demonstratives' },
    { type: 'class', icon: GraduationCap, label: 'kidsA1.oneOnes', href: '/kids/a1/one-ones', storageKey: 'progress_kids_a1_oneones' },
    { type: 'class', icon: GraduationCap, label: 'kidsA1.presentContinuous', href: '/kids/a1/present-continuous', storageKey: 'progress_kids_a1_presentcontinuous' },
    { type: 'class', icon: GraduationCap, label: 'kidsA1.objectPronouns', href: '/kids/a1/pronombres-objeto', storageKey: 'progress_kids_a1_objectpronouns' },
    { type: 'class', icon: GraduationCap, label: 'kidsA1.comparativesSuperlatives', href: '/kids/a1/comparativos-y-superlativos', storageKey: 'progress_kids_a1_comparatives' },
    { type: 'class', icon: GraduationCap, label: 'kidsA1.frequencyAdverbs', href: '/kids/a1/adverbios-de-frecuencia', storageKey: 'progress_kids_a1_frequencyadverbs' },
    { type: 'end', icon: Flag, label: 'dashboard.finish', href: '/kids' },
];

export const getKidsA2MainPath = (t: (key: string) => string): PathItem[] => [
    { type: 'start', icon: Footprints, label: 'dashboard.start' },
    { type: 'class', icon: GraduationCap, label: 'kidsA2.atOnIn1', href: '/kids/a2/at-on-in-1', storageKey: 'progress_kids_a2_at_on_in_1' },
    { type: 'class', icon: GraduationCap, label: 'kidsA2.atOnIn2', href: '/kids/a2/at-on-in-2', storageKey: 'progress_kids_a2_at_on_in_2' },
    { type: 'class', icon: GraduationCap, label: 'kidsA2.pastSimple', href: '/kids/a2/pasado-simple', storageKey: 'progress_kids_a2_past_simple' },
    { type: 'class', icon: GraduationCap, label: 'kidsA2.pastContinuous', href: '/kids/a2/pasado-continuo', storageKey: 'progress_kids_a2_past_continuous' },
    { type: 'class', icon: GraduationCap, label: 'kidsA2.countables', href: '/kids/a2/contables-y-no-contables', storageKey: 'progress_kids_a2_countables' },
    { type: 'class', icon: GraduationCap, label: 'kidsA2.presentPerfect', href: '/kids/a2/presente-perfecto', storageKey: 'progress_kids_a2_present_perfect' },
    { type: 'class', icon: GraduationCap, label: 'kidsA2.usedTo', href: '/kids/a2/used-to', storageKey: 'progress_kids_a2_used_to' },
    { type: 'end', icon: Flag, label: 'dashboard.finish', href: '/kids' },
];

export const getKidsB1MainPath = (t: (key: string) => string): PathItem[] => [
    { type: 'start', icon: Footprints, label: 'dashboard.start' },
    { type: 'class', icon: GraduationCap, label: 'kidsB1.will', href: '/kids/b1/will', storageKey: 'progress_kids_b1_will' },
    { type: 'class', icon: GraduationCap, label: 'kidsB1.may', href: '/kids/b1/may', storageKey: 'progress_kids_b1_may' },
    { type: 'class', icon: GraduationCap, label: 'kidsB1.beGoingTo', href: '/kids/b1/be-going-to', storageKey: 'progress_kids_b1_be_going_to' },
    { type: 'class', icon: GraduationCap, label: 'kidsB1.zeroConditional', href: '/kids/b1/zero-conditional', storageKey: 'progress_kids_b1_zero_conditional' },
    { type: 'class', icon: GraduationCap, label: 'kidsB1.firstConditional', href: '/kids/b1/first-conditional', storageKey: 'progress_kids_b1_first_conditional' },
    { type: 'class', icon: GraduationCap, label: 'kidsB1.wouldLikeTo', href: '/kids/b1/would-like-to', storageKey: 'progress_kids_b1_would_like_to' },
    { type: 'class', icon: GraduationCap, label: 'kidsB1.should', href: '/kids/b1/should', storageKey: 'progress_kids_b1_should' },
    { type: 'class', icon: GraduationCap, label: 'kidsB1.mustHaveTo', href: '/kids/b1/must-have-to', storageKey: 'progress_kids_b1_must_have_to' },
    { type: 'class', icon: GraduationCap, label: 'kidsB1.secondConditional', href: '/kids/b1/second-conditional', storageKey: 'progress_kids_b1_second_conditional' },
    { type: 'class', icon: GraduationCap, label: 'kidsB1.oneTwoConditional', href: '/kids/b1/1-2-conditional', storageKey: 'progress_kids_b1_1_2_conditional' },
    { type: 'class', icon: GraduationCap, label: 'kidsB1.connectors', href: '/kids/b1/connectors', storageKey: 'progress_kids_b1_connectors' },
    { type: 'end', icon: Flag, label: 'dashboard.finish' }
];

export const getA1SpanishClasses = () => [
    { id: 'es-a1-articulos-y-genero', name: 'Articulos y Genero' },
    { id: 'es-a1-posesivos-y-tener', name: 'Posesivos y Tener' },
    { id: 'es-a1-ser', name: 'Ser' },
    { id: 'es-a1-estar', name: 'Estar' },
    { id: 'es-a1-preposiciones-de-lugar', name: 'Preposiciones de lugar' },
    { id: 'es-a1-ubicacion', name: 'ubicacion' },
    { id: 'es-a1-preguntas', name: 'Preguntas' },
    { id: 'es-a1-comida-y-restaurante', name: 'Comida y restaurante' },
    { id: 'es-a1-presente-simple-regulares', name: 'Presente simple Regulares' },
    { id: 'es-a1-comparativos-y-superlativos', name: 'Comparativos y Superlativos' },
    { id: 'es-a1-demostrativos', name: 'Demostrativos' },
    { id: 'es-a1-verbos-de-preferencia', name: 'Verbos de Preferencia' },
    { id: 'es-a1-presente-continuo', name: 'Presente Continuo' },
    { id: 'es-a1-presente-simple-irregulares', name: 'Presente simple irregulares' },
];

export const getA2SpanishClasses = () => [
    { id: 'es-a2-reflexivos-regulares', name: 'reflexivos regulares' },
    { id: 'es-a2-reflexivos-irregulares', name: 'reflexivos irregulares' },
    { id: 'es-a2-reflexivos-mix', name: 'reflexivos mixtos' },
    { id: 'es-a2-pasado-regulares', name: 'pasado regulares' },
    { id: 'es-a2-pasado-irregulares', name: 'pasado irregulares' },
    { id: 'es-a2-reflexivos-pasado', name: 'reflexivos pasado' },
    { id: 'es-a2-imperfecto', name: 'imperfecto' },
    { id: 'es-a2-pasado-vs-imperfecto', name: 'Pasado simple vs imperfecto' },
    { id: 'es-a2-preterito-perfecto', name: 'preterito perfecto' },
];