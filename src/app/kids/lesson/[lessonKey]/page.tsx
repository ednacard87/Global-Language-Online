
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DashboardHeader } from '@/components/dashboard/header';
import { useUser, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

// Lesson-specific components and data
import { AlphabetGrid } from '@/components/kids/alphabet-grid';
import { AbcPronunciationExercise } from '@/components/kids/exercises/abc-pronunciation-exercise';
import { AbcMemoryGame } from '@/components/kids/exercises/abc-memory-game';
import { NumbersGrid } from '@/components/kids/numbers-grid';
import { NumbersMemoryGame } from '@/components/kids/exercises/numbers-memory-game';
import { SpellingExercise } from '@/components/dashboard/spelling-exercise';
import { getNumbersSpellingPathData } from '@/lib/course-data';
import { ToBeMemoryGame } from '@/components/kids/exercises/tobe-memory-game';
import { TranslationExercise } from '@/components/dashboard/translation-exercise';
import { PossessivesMemoryGame } from '@/components/kids/exercises/possessives-memory-game';

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

export default function KidsLessonPage() {
    const params = useParams();
    const router = useRouter();
    const lessonKey = params.lessonKey as string;

    const { user } = useUser();
    const firestore = useFirestore();
    const studentDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'students', user.uid) : null),
        [firestore, user]
    );
    
    const onComplete = () => {
        if (studentDocRef && lessonKey) {
            const progressKey = `progress_kids_lesson_${lessonKey}`;
            updateDocumentNonBlocking(studentDocRef, {
                [`progress.${progressKey}`]: 100,
            });
            window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
        // Instead of complex navigation, just let the user go back.
        router.push('/intro');
    };
    
    const [highlightedLetter, setHighlightedLetter] = React.useState<string | null>(null);
    const [highlightedNumber, setHighlightedNumber] = React.useState<string | null>(null);


    const renderContent = () => {
        switch(lessonKey) {
            // Intro 1 Content
            case 'abc':
                return <Card className="shadow-soft rounded-lg border-2 border-brand-purple"><CardHeader><CardTitle>ABC</CardTitle></CardHeader><CardContent><AlphabetGrid highlightedItem={highlightedLetter} onHighlight={setHighlightedLetter} /></CardContent></Card>;
            case 'abc-exercise':
                return <AbcPronunciationExercise onGameComplete={onComplete} />;
            case 'abc-memory':
                return <AbcMemoryGame onGameComplete={onComplete} />;
            case 'numbers':
                return <Card className="shadow-soft rounded-lg border-2 border-brand-purple"><CardHeader><CardTitle>Numeros</CardTitle></CardHeader><CardContent><NumbersGrid highlightedItem={highlightedNumber} onHighlight={setHighlightedNumber} /></CardContent></Card>;
            case 'memory1':
                 return <NumbersMemoryGame onGameComplete={onComplete} />;
            case 'numbers-exercise':
                return <SpellingExercise exerciseKey="numbers1" onComplete={() => onComplete()} />;
            case 'tobe':
                return <Card className="shadow-soft rounded-lg border-2 border-brand-purple"><CardHeader><CardTitle>Pronombres + To be</CardTitle></CardHeader><CardContent><div className="grid grid-cols-3 gap-x-4 gap-y-2 text-lg"><div className="font-bold p-3 bg-muted rounded-lg text-center">SER</div><div className="font-bold p-3 bg-muted rounded-lg text-center">TO BE</div><div className="font-bold p-3 bg-muted rounded-lg text-center">ESTAR</div>{verbToBeData.map((item, index) => (<React.Fragment key={index}><div className="p-3 bg-card border rounded-lg text-center">{item.ser}</div><div className="p-3 bg-card border rounded-lg font-medium text-center">{item.tobe}</div><div className="p-3 bg-card border rounded-lg text-center">{item.estar}</div></React.Fragment>))}</div></CardContent></Card>;
            case 'memory2':
                return <ToBeMemoryGame onGameComplete={onComplete} />;
            case 'tobe-exercise':
                return <TranslationExercise exerciseKey="exercises1" onComplete={onComplete} formType="full" />;
            case 'tobe-exercise-1':
                 return <TranslationExercise exerciseKey="exercises1" onComplete={onComplete} formType="full" />;
            case 'possessives':
                return <Card className="shadow-soft rounded-lg border-2 border-brand-purple"><CardHeader><CardTitle>Posesivos</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg"><div className="font-bold p-3 bg-muted rounded-lg text-center">Inglés</div><div className="font-bold p-3 bg-muted rounded-lg text-center">Español</div>{possessivesData.map((item, index) => (<React.Fragment key={index}><div className="p-3 bg-card border rounded-lg font-medium text-center">{item.english}</div><div className="p-3 bg-card border rounded-lg text-center">{item.spanish}</div></React.Fragment>))}</div></CardContent></Card>;
            case 'memory-possessives':
                return <PossessivesMemoryGame onGameComplete={onComplete} />;

            // Intro 2 Content
            case 'greetings':
                return <Card className="shadow-soft rounded-lg border-2 border-brand-purple"><CardHeader><CardTitle>Saludos</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">{greetingsData.map((item, index) => (<React.Fragment key={index}><div className="p-3 bg-card border rounded-lg text-center">{item.spanish}</div><div className="p-3 bg-card border rounded-lg font-medium text-center">{item.english}</div></React.Fragment>))}</div></CardContent></Card>;
            case 'greetings-memory':
                 return <div>Memory Game for Greetings (Not Implemented) <Button onClick={onComplete}>Mark Complete</Button></div>; // Placeholder
            case 'tobe2':
                return <TranslationExercise exerciseKey="exercises2" onComplete={onComplete} formType="full" />;
            case 'tobe2-exercise':
                return <TranslationExercise exerciseKey="exercises2" onComplete={onComplete} formType="full" />;
            case 'farewells':
                return <Card className="shadow-soft rounded-lg border-2 border-brand-purple"><CardHeader><CardTitle>Despedidas</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">{farewellsData.map((item, index) => (<React.Fragment key={index}><div className="p-3 bg-card border rounded-lg text-center">{item.spanish}</div><div className="p-3 bg-card border rounded-lg font-medium text-center">{item.english}</div></React.Fragment>))}</div></CardContent></Card>;
            case 'farewells-memory':
                return <div>Memory Game for Farewells (Not Implemented) <Button onClick={onComplete}>Mark Complete</Button></div>; // Placeholder
            case 'tobe3':
                return <TranslationExercise exerciseKey="exercises3" onComplete={onComplete} formType="full" />;
            case 'tobe3-exercise':
                return <TranslationExercise exerciseKey="exercises3" onComplete={onComplete} formType="full" />;
            case 'countries':
                return <CountriesExercise onComplete={onComplete} />;

            default:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Lección no encontrada</CardTitle>
                            <CardDescription>No se encontró el contenido para "{lessonKey}".</CardDescription>
                        </CardHeader>
                    </Card>
                );
        }
    }

    return (
        <div className="flex w-full flex-col min-h-screen">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8 flex flex-col items-center">
                <div className="w-full max-w-4xl">
                    <div className="mb-4">
                        <Button variant="ghost" asChild>
                            <Link href="/intro">
                                &larr; Volver a la Aventura
                            </Link>
                        </Button>
                    </div>
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}

// Minimal implementation for CountriesExercise since it's complex and imported
function CountriesExercise({ onComplete }: { onComplete: () => void }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Countries & Nationalities</CardTitle>
            </CardHeader>
            <CardContent>
                <p>This is a placeholder for the countries exercise.</p>
                <Button onClick={onComplete} className="mt-4">Mark as Complete</Button>
            </CardContent>
        </Card>
    );
}
