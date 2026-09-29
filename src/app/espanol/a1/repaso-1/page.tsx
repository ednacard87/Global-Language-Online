'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
    BookOpen,
    Lock,
    CheckCircle,
    Trophy,
    ArrowLeft,
    ArrowRight,
    Loader2,
    Check,
    X,
    Lightbulb,
    Star,
    BookText,
    ChevronRight,
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
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

// ─────────────────────────────────────────────────────────────────────────────
// ENGINEERING CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'progress_es_a1_repaso1_v2';
const MAIN_PROGRESS_KEY = 'progress_a1_es_review_1';

const ICONS = { locked: Lock, active: BookOpen, completed: CheckCircle };

interface LearningStep {
    key: string;
    name: string;
    description: string;
    status: 'locked' | 'active' | 'completed';
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA – Vocabulario (30 palabras para flashcards de escritura)
// ─────────────────────────────────────────────────────────────────────────────
const vocabTypingCards = [
    // Artículos y Género
    { en: 'LAPTOP', es: 'PORTÁTIL', topic: 'Artículos y Género' },
    { en: 'PENCIL', es: 'LÁPIZ', topic: 'Artículos y Género' },
    { en: 'DESK', es: 'ESCRITORIO', topic: 'Artículos y Género' },
    { en: 'CHAIR', es: 'SILLA', topic: 'Artículos y Género' },
    { en: 'NOTEBOOK', es: 'CUADERNO', topic: 'Artículos y Género' },
    { en: 'BLACKBOARD', es: 'TABLERO', topic: 'Artículos y Género' },
    { en: 'BACKPACK', es: 'MOCHILA', topic: 'Artículos y Género' },
    { en: 'ERASER', es: 'BORRADOR', topic: 'Artículos y Género' },
    // Posesivos y Tener – familia
    { en: 'FATHER', es: 'PADRE', topic: 'Posesivos y Tener' },
    { en: 'MOTHER', es: 'MADRE', topic: 'Posesivos y Tener' },
    { en: 'BROTHER', es: 'HERMANO', topic: 'Posesivos y Tener' },
    { en: 'SISTER', es: 'HERMANA', topic: 'Posesivos y Tener' },
    { en: 'SON', es: 'HIJO', topic: 'Posesivos y Tener' },
    { en: 'DAUGHTER', es: 'HIJA', topic: 'Posesivos y Tener' },
    { en: 'UNCLE', es: 'TÍO', topic: 'Posesivos y Tener' },
    { en: 'COUSIN', es: 'PRIMO', topic: 'Posesivos y Tener' },
    { en: 'GRANDMOTHER', es: 'ABUELA', topic: 'Posesivos y Tener' },
    { en: 'HUSBAND', es: 'ESPOSO', topic: 'Posesivos y Tener' },
    // Ser – apariencia y profesiones
    { en: 'TALL', es: 'ALTO', topic: 'Ser' },
    { en: 'INTELLIGENT', es: 'INTELIGENTE', topic: 'Ser' },
    { en: 'DOCTOR', es: 'MÉDICO', topic: 'Ser' },
    { en: 'TEACHER', es: 'PROFESOR', topic: 'Ser' },
    { en: 'ENGINEER', es: 'INGENIERO', topic: 'Ser' },
    { en: 'LAWYER', es: 'ABOGADO', topic: 'Ser' },
    { en: 'KIND', es: 'AMABLE', topic: 'Ser' },
    { en: 'YOUNG', es: 'JOVEN', topic: 'Ser' },
    // Estar – emociones y lugares
    { en: 'HAPPY', es: 'FELIZ', topic: 'Estar' },
    { en: 'NERVOUS', es: 'NERVIOSO', topic: 'Estar' },
    { en: 'HOSPITAL', es: 'HOSPITAL', topic: 'Estar' },
    { en: 'LIBRARY', es: 'BIBLIOTECA', topic: 'Estar' },
];

// ─────────────────────────────────────────────────────────────────────────────
// DATA – Ejercicio 2: Artículos (15 prompts)
// ─────────────────────────────────────────────────────────────────────────────
const articulosPrompts = [
    { s: '_______ PORTÁTIL', a: 'EL' },
    { s: '_______ SILLA', a: 'LA' },
    { s: '_______ CUADERNOS', a: 'LOS' },
    { s: '_______ REGLAS', a: 'LAS' },
    { s: '_______ ESCRITORIO', a: 'EL' },
    { s: '_______ MOCHILA', a: 'LA' },
    { s: '_______ TABLEROS', a: 'LOS' },
    { s: '_______ LLAVES', a: 'LAS' },
    { s: '_______ BORRADOR', a: 'EL' },
    { s: '_______ VENTANA', a: 'LA' },
    { s: '_______ LÁPICES', a: 'LOS' },
    { s: '_______ PUERTA', a: 'LA' },
    { s: '_______ PISO', a: 'EL' },
    { s: '_______ TIJERAS', a: 'LAS' },
    { s: '_______ SACAPUNTAS', a: 'EL' },
];

// ─────────────────────────────────────────────────────────────────────────────
// DATA – Ejercicio 3: SER Conjugación (15 prompts)
// ─────────────────────────────────────────────────────────────────────────────
const serConjugaPrompts = [
    { s: 'Yo _______ estudiante.', a: 'soy' },
    { s: 'Tú _______ muy inteligente.', a: 'eres' },
    { s: 'Él _______ médico.', a: 'es' },
    { s: 'Ella _______ alta y bonita.', a: 'es' },
    { s: 'Nosotros _______ amigos.', a: 'somos' },
    { s: 'Ellos _______ profesores.', a: 'son' },
    { s: 'Ustedes _______ de Colombia.', a: 'son' },
    { s: 'El perro _______ grande.', a: 'es' },
    { s: 'Las flores _______ rojas.', a: 'son' },
    { s: 'Usted _______ muy amable.', a: 'es' },
    { s: 'Yo _______ de México.', a: 'soy' },
    { s: 'Tú _______ muy valiente.', a: 'eres' },
    { s: 'Mi padre _______ ingeniero.', a: 'es' },
    { s: 'Nosotras _______ enfermeras.', a: 'somos' },
    { s: 'Los libros _______ interesantes.', a: 'son' },
];

// ─────────────────────────────────────────────────────────────────────────────
// DATA – Ejercicio 4: ESTAR Conjugación (15 prompts)
// ─────────────────────────────────────────────────────────────────────────────
const estarConjugaPrompts = [
    { s: 'Yo _______ en la escuela.', a: 'estoy' },
    { s: 'Tú _______ muy feliz hoy.', a: 'estás' },
    { s: 'Él _______ en el hospital.', a: 'está' },
    { s: 'Ella _______ cansada.', a: 'está' },
    { s: 'Nosotros _______ en el parque.', a: 'estamos' },
    { s: 'Ellos _______ en la biblioteca.', a: 'están' },
    { s: 'Ustedes _______ preocupados.', a: 'están' },
    { s: 'El supermercado _______ cerrado.', a: 'está' },
    { s: 'Las calles _______ limpias.', a: 'están' },
    { s: 'Usted _______ nervioso.', a: 'está' },
    { s: 'Yo _______ muy ocupado.', a: 'estoy' },
    { s: 'Tú _______ en el banco.', a: 'estás' },
    { s: 'Mi madre _______ en casa.', a: 'está' },
    { s: 'Nosotras _______ emocionadas.', a: 'estamos' },
    { s: 'Los niños _______ aburridos.', a: 'están' },
];

// ─────────────────────────────────────────────────────────────────────────────
// DATA – Ejercicio 5: SER o ESTAR (15 prompts)
// ─────────────────────────────────────────────────────────────────────────────
const serOEstarPrompts = [
    { s: 'Mi madre _______ enfermera.', a: 'es', hint: 'profesión → SER' },
    { s: 'Yo _______ en casa ahora.', a: 'estoy', hint: 'ubicación → ESTAR' },
    { s: 'Ellos _______ muy amables.', a: 'son', hint: 'característica permanente → SER' },
    { s: 'El café _______ caliente.', a: 'está', hint: 'estado temporal → ESTAR' },
    { s: 'Tú _______ de México.', a: 'eres', hint: 'origen → SER' },
    { s: 'Nosotros _______ cansados.', a: 'estamos', hint: 'estado temporal → ESTAR' },
    { s: 'La puerta _______ azul.', a: 'es', hint: 'característica → SER' },
    { s: 'Ella _______ triste hoy.', a: 'está', hint: 'emoción temporal → ESTAR' },
    { s: 'Los libros _______ en la mesa.', a: 'están', hint: 'ubicación → ESTAR' },
    { s: 'Usted _______ muy joven.', a: 'es', hint: 'característica → SER' },
    { s: 'El agua _______ fría.', a: 'está', hint: 'estado temporal → ESTAR' },
    { s: 'Nosotros _______ colombianos.', a: 'somos', hint: 'nacionalidad → SER' },
    { s: 'Tu hermana _______ en la biblioteca.', a: 'está', hint: 'ubicación → ESTAR' },
    { s: 'Los mangos _______ dulces.', a: 'son', hint: 'característica → SER' },
    { s: 'Yo _______ preocupado por el examen.', a: 'estoy', hint: 'emoción temporal → ESTAR' },
];

// ─────────────────────────────────────────────────────────────────────────────
// DATA – Ejercicio 6: Posesivos y Tener (15 prompts)
// ─────────────────────────────────────────────────────────────────────────────
const posesivosPrompts = [
    { en: 'My brother has a cellphone.', es: ['mi hermano tiene un celular'] },
    { en: 'Your aunt has a bicycle.', es: ['tu tía tiene una bicicleta', 'tu tia tiene una bicicleta'] },
    { en: 'His dog has a ball.', es: ['su perro tiene una pelota'] },
    { en: 'Her sister has a backpack.', es: ['su hermana tiene una maleta', 'su hermana tiene una mochila'] },
    { en: 'Our family has a house.', es: ['nuestra familia tiene una casa'] },
    { en: 'Their parents have a car.', es: ['sus padres tienen un carro'] },
    { en: 'My cat has a fish.', es: ['mi gato tiene un pez'] },
    { en: 'Your cousin has glasses.', es: ['tu primo tiene gafas', 'tu prima tiene gafas'] },
    { en: 'I have my keys.', es: ['yo tengo mis llaves', 'tengo mis llaves'] },
    { en: 'She has her backpack.', es: ['ella tiene su maleta', 'ella tiene su mochila'] },
    { en: 'We have our house.', es: ['nosotros tenemos nuestra casa', 'tenemos nuestra casa'] },
    { en: 'He has his watch.', es: ['él tiene su reloj', 'el tiene su reloj'] },
    { en: 'My grandmother has a parrot.', es: ['mi abuela tiene un loro'] },
    { en: 'Their son has a dog.', es: ['su hijo tiene un perro'] },
    { en: 'Your husband has a car.', es: ['tu esposo tiene un carro'] },
];

// ─────────────────────────────────────────────────────────────────────────────
// DATA – Ejercicio 7: SER Traducción (15 prompts)
// ─────────────────────────────────────────────────────────────────────────────
const serTraduccionPrompts = [
    { en: 'I am a student.', es: ['yo soy estudiante', 'soy estudiante'] },
    { en: 'You are kind.', es: ['tú eres amable', 'usted es amable'] },
    { en: 'He is a doctor.', es: ['él es médico', 'él es un médico'] },
    { en: 'She is pretty.', es: ['ella es bonita'] },
    { en: 'We are friends.', es: ['nosotros somos amigos', 'nosotras somos amigas'] },
    { en: 'They are tall.', es: ['ellos son altos', 'ellas son altas'] },
    { en: 'The dog is big.', es: ['el perro es grande'] },
    { en: 'I am not lazy.', es: ['yo no soy perezoso', 'no soy perezoso'] },
    { en: 'She is not a doctor.', es: ['ella no es médica', 'ella no es un médico'] },
    { en: 'They are not serious.', es: ['ellos no son serios', 'ellas no son serias', 'no son serios'] },
    { en: 'My father is an engineer.', es: ['mi padre es ingeniero', 'mi papá es ingeniero'] },
    { en: 'The students are creative.', es: ['los estudiantes son creativos'] },
    { en: 'You are not short.', es: ['tú no eres bajo', 'usted no es bajo'] },
    { en: 'We are not lazy.', es: ['nosotros no somos perezosos', 'no somos perezosos'] },
    { en: 'The cat is black.', es: ['el gato es negro'] },
];

// ─────────────────────────────────────────────────────────────────────────────
// DATA – Ejercicio 8: ESTAR Traducción (15 prompts)
// ─────────────────────────────────────────────────────────────────────────────
const estarTraduccionPrompts = [
    { en: 'I am at the bank.', es: ['yo estoy en el banco', 'estoy en el banco'] },
    { en: 'She is very busy.', es: ['ella está muy ocupada', 'está muy ocupada'] },
    { en: 'We are in the park.', es: ['nosotros estamos en el parque', 'estamos en el parque'] },
    { en: 'They are hungry.', es: ['ellos están hambrientos', 'están hambrientos'] },
    { en: 'You are at home.', es: ['tú estás en casa', 'usted está en casa'] },
    { en: 'He is sick.', es: ['él está enfermo', 'está enfermo'] },
    { en: 'I am not at the park.', es: ['no estoy en el parque', 'yo no estoy en el parque'] },
    { en: 'You are not sad.', es: ['no estás triste', 'tú no estás triste', 'tu no estas triste'] },
    { en: 'We are not at the library.', es: ['no estamos en la biblioteca', 'nosotros no estamos en la biblioteca'] },
    { en: 'They are not hungry.', es: ['ellos no están hambrientos', 'ellas no están hambrientas', 'no están hambrientos'] },
    { en: 'The restaurant is clean.', es: ['el restaurante está limpio'] },
    { en: 'My brother is at school.', es: ['mi hermano está en la escuela'] },
    { en: 'She is not worried.', es: ['ella no está preocupada', 'no está preocupada'] },
    { en: 'We are excited.', es: ['nosotros estamos emocionados', 'estamos emocionados'] },
    { en: 'The street is dirty.', es: ['la calle está sucia'] },
];

// ─────────────────────────────────────────────────────────────────────────────
// DATA – Ejercicio 9: Artículos + Adjetivos (15 prompts)
// ─────────────────────────────────────────────────────────────────────────────
const articulosAdjetivosPrompts = [
    { en: 'The red pencil', es: ['el lápiz rojo', 'el lapiz rojo'] },
    { en: 'A blue chair', es: ['una silla azul'] },
    { en: 'The green tables', es: ['las mesas verdes'] },
    { en: 'Some yellow notebooks', es: ['unos cuadernos amarillos'] },
    { en: 'The white door', es: ['la puerta blanca'] },
    { en: 'The black board', es: ['el tablero negro'] },
    { en: 'Some gray rulers', es: ['unas reglas grises'] },
    { en: 'A small eraser', es: ['un borrador pequeño', 'un borrador pequeno'] },
    { en: 'The gray laptop', es: ['el portátil gris'] },
    { en: 'The white watch', es: ['el reloj blanco'] },
    { en: 'A big backpack', es: ['una mochila grande'] },
    { en: 'The brown desk', es: ['el escritorio marrón', 'el escritorio marron'] },
    { en: 'Some blue pens', es: ['unos lapiceros azules'] },
    { en: 'The orange book', es: ['el libro naranja'] },
    { en: 'A small notebook', es: ['un cuaderno pequeño', 'un cuaderno pequeno'] },
];

// ─────────────────────────────────────────────────────────────────────────────
// DATA – Ejercicio 10: Repaso Final Mixto (20 prompts)
// ─────────────────────────────────────────────────────────────────────────────
const repasoFinalPrompts = [
    { en: 'The book is on the desk.', es: ['el libro está en el escritorio'] },
    { en: 'My sister is a teacher.', es: ['mi hermana es profesora', 'mi hermana es una profesora'] },
    { en: 'We are happy today.', es: ['nosotros estamos felices hoy', 'estamos felices hoy'] },
    { en: 'Your father has a car.', es: ['tu padre tiene un carro'] },
    { en: 'The students are intelligent.', es: ['los estudiantes son inteligentes'] },
    { en: 'She is at the hospital.', es: ['ella está en el hospital', 'está en el hospital'] },
    { en: 'I have my backpack.', es: ['yo tengo mi maleta', 'tengo mi maleta', 'yo tengo mi mochila', 'tengo mi mochila'] },
    { en: 'The chairs are in the classroom.', es: ['las sillas están en el salón', 'las sillas están en el aula'] },
    { en: 'He is a young lawyer.', es: ['él es un abogado joven', 'es un abogado joven'] },
    { en: 'Their grandmother is calm.', es: ['su abuela está tranquila', 'su abuela es tranquila'] },
    { en: 'My uncle has a motorcycle.', es: ['mi tío tiene una moto', 'mi tio tiene una moto'] },
    { en: 'The red pencils are on the table.', es: ['los lápices rojos están en la mesa', 'los lapices rojos están en la mesa'] },
    { en: 'Her son is not at school.', es: ['su hijo no está en la escuela'] },
    { en: 'We are Colombian students.', es: ['nosotros somos estudiantes colombianos', 'somos estudiantes colombianos'] },
    { en: 'His daughter has a blue notebook.', es: ['su hija tiene un cuaderno azul'] },
    { en: 'The tall teacher is at the library.', es: ['el profesor alto está en la biblioteca', 'la profesora alta está en la biblioteca'] },
    { en: 'My parents have a big house.', es: ['mis padres tienen una casa grande'] },
    { en: 'She is not sad today.', es: ['ella no está triste hoy', 'no está triste hoy'] },
    { en: 'Our dog has a small ball.', es: ['nuestro perro tiene una pelota pequeña', 'nuestro perro tiene una pelota pequena'] },
    { en: 'The young lawyer is intelligent.', es: ['el abogado joven es inteligente', 'la abogada joven es inteligente'] },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────────────────────────────────────
const buildInitialSteps = (): LearningStep[] => [
    { key: 'vocab-typing', name: 'Vocabulario Desafío', description: 'Escribe la traducción al español', status: 'active' },
    { key: 'articulos', name: 'Artículos', description: 'EL / LA / LOS / LAS', status: 'locked' },
    { key: 'ser-conjuga', name: 'Ser – Conjugación', description: 'Forma correcta de SER', status: 'locked' },
    { key: 'estar-conjuga', name: 'Estar – Conjugación', description: 'Forma correcta de ESTAR', status: 'locked' },
    { key: 'ser-o-estar', name: 'Ser o Estar', description: 'Elige entre SER y ESTAR', status: 'locked' },
    { key: 'posesivos', name: 'Posesivos y Tener', description: 'Traduce usando posesivos', status: 'locked' },
    { key: 'ser-traduccion', name: 'Ser – Traducción', description: 'Traduce oraciones con SER', status: 'locked' },
    { key: 'estar-traduccion', name: 'Estar – Traducción', description: 'Traduce oraciones con ESTAR', status: 'locked' },
    { key: 'articulos-adj', name: 'Artículos + Adjetivos', description: 'Artículo + sustantivo + color', status: 'locked' },
    { key: 'repaso-final', name: 'Repaso Final 🏆', description: 'Mixto de toda la Unidad 1', status: 'locked' },
];

// ─────────────────────────────────────────────────────────────────────────────
// TOPIC COLORS
// ─────────────────────────────────────────────────────────────────────────────
const topicColors: Record<string, string> = {
    'Artículos y Género': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'Posesivos y Tener': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    'Ser': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    'Estar': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB: VocabTypingChallenge (30 palabras, escribe la traducción)
// ─────────────────────────────────────────────────────────────────────────────
const VocabTypingChallenge = ({ onComplete }: { onComplete: () => void }) => {
    const { toast } = useToast();
    const [answers, setAnswers] = useState<string[]>(Array(vocabTypingCards.length).fill(''));
    const [results, setResults] = useState<('unchecked' | 'correct' | 'incorrect')[]>(
        Array(vocabTypingCards.length).fill('unchecked')
    );
    const [verified, setVerified] = useState(false);
    const [score, setScore] = useState(0);

    const handleVerify = () => {
        const newResults = vocabTypingCards.map((card, i) => {
            const norm = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            return norm(answers[i]) === norm(card.es) ? 'correct' : 'incorrect';
        }) as ('correct' | 'incorrect')[];
        const correctCount = newResults.filter(r => r === 'correct').length;
        setResults(newResults);
        setVerified(true);
        setScore(correctCount);
        if (correctCount === vocabTypingCards.length) {
            toast({ title: '🎉 ¡Perfecto! 30/30' });
        } else {
            toast({ title: `✅ ${correctCount}/${vocabTypingCards.length} correctas` });
        }
    };

    const correctCount = results.filter(r => r === 'correct').length;
    const pct = verified ? Math.round((correctCount / vocabTypingCards.length) * 100) : 0;

    return (
        <Card className="shadow-soft border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>Vocabulario Desafío – Unidad 1</CardTitle>
                <CardDescription>
                    Ve la palabra en inglés y escribe su traducción en español. <span className="font-bold text-primary">30 palabras</span> de las 4 clases.
                </CardDescription>
                {verified && (
                    <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-sm font-bold">
                            <span>Resultado: {correctCount} / {vocabTypingCards.length}</span>
                            <span className={pct >= 70 ? 'text-green-600' : 'text-destructive'}>{pct}%</span>
                        </div>
                        <Progress value={pct} className="h-3" />
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className="grid gap-2">
                    {vocabTypingCards.map((card, i) => (
                        <div key={i} className={cn(
                            'grid grid-cols-[1fr_1fr_auto] items-center gap-3 p-3 rounded-lg border transition-colors',
                            verified && results[i] === 'correct' && 'border-green-500 bg-green-500/5',
                            verified && results[i] === 'incorrect' && 'border-destructive bg-destructive/5',
                            !verified && 'border-border'
                        )}>
                            <div className="flex items-center gap-2">
                                <Badge className={cn('text-xs font-semibold shrink-0', topicColors[card.topic])}>
                                    {card.topic.split(' ')[0]}
                                </Badge>
                                <span className="font-bold text-sm">{card.en}</span>
                            </div>
                            <Input
                                value={answers[i]}
                                onChange={e => {
                                    const copy = [...answers];
                                    copy[i] = e.target.value;
                                    setAnswers(copy);
                                    if (verified) setVerified(false);
                                }}
                                placeholder="Español..."
                                className={cn(
                                    'h-8 text-sm',
                                    verified && results[i] === 'correct' && 'border-green-500 focus-visible:ring-green-500',
                                    verified && results[i] === 'incorrect' && 'border-destructive focus-visible:ring-destructive'
                                )}
                                autoComplete="off"
                            />
                            {verified && (
                                results[i] === 'correct'
                                    ? <Check className="h-5 w-5 text-green-500 shrink-0" />
                                    : <div className="text-xs text-destructive font-bold shrink-0 max-w-[80px] truncate">{card.es}</div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Verificar button — after last sentence */}
                <div className="flex justify-between mt-6 pt-4 border-t">
                    <Button variant="outline" onClick={handleVerify} disabled={answers.every(a => !a.trim())}>
                        Verificar todo
                    </Button>
                    {verified && (
                        <Button onClick={onComplete} className="font-bold">
                            {pct >= 60 ? 'Continuar' : 'Continuar de todos modos'}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB: DotNavExercise — frase a frase, bolitas coloreadas, Continuar solo si todo correcto
// ─────────────────────────────────────────────────────────────────────────────
const DotNavExercise = ({
    title,
    description,
    prompts,        // { question, answers[], hint? }
    onComplete,
    vocabulary,
    showHint = false,
}: {
    title: string;
    description: string;
    prompts: { question: string; answers: string[]; hint?: string }[];
    onComplete: () => void;
    vocabulary?: Record<string, string>;
    showHint?: boolean;
}) => {
    const { toast } = useToast();
    const inputRef = useRef<HTMLInputElement>(null);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<string[]>(Array(prompts.length).fill(''));
    const [results, setResults] = useState<('correct' | 'incorrect' | null)[]>(
        Array(prompts.length).fill(null)
    );
    const [verified, setVerified] = useState(false);

    const norm = (s: string) =>
        s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[.!?]/g, '').replace(/\s+/g, ' ');

    const answeredCount = answers.filter(a => a.trim()).length;
    const allCorrect = verified && results.every(r => r === 'correct');

    useEffect(() => { inputRef.current?.focus(); }, [currentIdx]);

    const handleVerify = () => {
        const newResults = prompts.map((p, i) =>
            answers[i].trim()
                ? (p.answers.some(a => norm(a) === norm(answers[i])) ? 'correct' : 'incorrect')
                : null
        ) as ('correct' | 'incorrect' | null)[];
        setResults(newResults);
        setVerified(true);
        const correct = newResults.filter(r => r === 'correct').length;
        const incorrect = newResults.filter(r => r === 'incorrect').length;
        const unanswered = newResults.filter(r => r === null).length;
        if (correct === prompts.length) {
            toast({ title: '🎉 ¡Perfecto! Todas correctas.' });
        } else {
            toast({
                title: `🔍 ${correct} correctas • ${incorrect} incorrectas${unanswered ? ` • ${unanswered} sin responder` : ''}`,
                description: 'Las bolitas rojas indican respuestas incorrectas. Corrígelas y vuelve a verificar.',
            });
        }
    };

    const getDotClass = (i: number) => {
        if (verified && results[i] === 'correct')
            return i === currentIdx
                ? 'border-green-500 bg-green-500 text-white scale-110 shadow-md'
                : 'border-green-500 bg-green-400 text-white';
        if (verified && results[i] === 'incorrect')
            return i === currentIdx
                ? 'border-red-500 bg-red-500 text-white scale-110 shadow-md'
                : 'border-red-400 bg-red-400 text-white';
        if (i === currentIdx)
            return 'border-primary bg-primary text-primary-foreground scale-110 shadow-md';
        if (answers[i].trim())
            return 'border-blue-400 bg-blue-100 dark:bg-blue-900/40 text-blue-600';
        return 'border-muted-foreground/30 bg-muted text-muted-foreground';
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple">
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    {vocabulary && <VocabPopover vocabulary={vocabulary} />}
                </div>

                {/* Bolitas de progreso */}
                <div className="flex gap-1.5 flex-wrap mt-4">
                    {prompts.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentIdx(i)}
                            title={`Frase ${i + 1}`}
                            className={cn(
                                'w-7 h-7 rounded-full border-2 text-[10px] font-bold flex items-center justify-center transition-all duration-300 hover:scale-110',
                                getDotClass(i)
                            )}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                        Frase <span className="font-bold text-primary">{currentIdx + 1}</span> de {prompts.length}
                        &nbsp;•&nbsp;
                        <span className="font-bold">{answeredCount}</span> respondidas
                    </p>
                    {verified && (
                        <div className="flex gap-3 text-xs font-semibold">
                            <span className="flex items-center gap-1 text-green-600">
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                                {results.filter(r => r === 'correct').length} correctas
                            </span>
                            <span className="flex items-center gap-1 text-red-500">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
                                {results.filter(r => r === 'incorrect').length} incorrectas
                            </span>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-5">
                {/* Cuadro de la frase actual */}
                <div className={cn(
                    'rounded-xl p-6 text-center border min-h-[110px] flex flex-col items-center justify-center transition-colors duration-300',
                    verified && results[currentIdx] === 'correct' && 'border-green-400 bg-green-500/5',
                    verified && results[currentIdx] === 'incorrect' && 'border-red-400 bg-red-400/5',
                    (!verified || results[currentIdx] === null) && 'bg-muted border-border',
                )}>
                    <p className="text-xl font-bold text-foreground">{prompts[currentIdx].question}</p>
                    {showHint && prompts[currentIdx].hint && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Lightbulb className="h-3 w-3 text-yellow-400 shrink-0" />
                            {prompts[currentIdx].hint}
                        </p>
                    )}
                    {verified && results[currentIdx] === 'correct' && (
                        <span className="mt-3 text-green-500 font-bold text-sm flex items-center gap-1">
                            <Check className="h-4 w-4" /> ¡Correcto!
                        </span>
                    )}
                    {verified && results[currentIdx] === 'incorrect' && (
                        <span className="mt-3 text-red-500 font-bold text-sm flex items-center gap-1">
                            <X className="h-4 w-4" /> Incorrecto — intenta de nuevo
                        </span>
                    )}
                </div>

                {/* Input */}
                <Input
                    ref={inputRef}
                    value={answers[currentIdx]}
                    onChange={e => {
                        const copy = [...answers];
                        copy[currentIdx] = e.target.value;
                        setAnswers(copy);
                        // Resetear solo este resultado al editar
                        if (verified) {
                            const rCopy = [...results];
                            rCopy[currentIdx] = null;
                            setResults(rCopy);
                        }
                    }}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && currentIdx < prompts.length - 1)
                            setCurrentIdx(i => i + 1);
                    }}
                    placeholder="Escribe tu respuesta..."
                    className={cn(
                        'text-lg h-12',
                        verified && results[currentIdx] === 'correct' && 'border-green-500 bg-green-500/10 focus-visible:ring-green-500',
                        verified && results[currentIdx] === 'incorrect' && 'border-red-400 bg-red-400/10 focus-visible:ring-red-400',
                    )}
                    autoComplete="off"
                />
            </CardContent>

            <CardFooter className="flex flex-wrap justify-between gap-3">
                {/* Navegación */}
                <div className="flex gap-2">
                    <Button
                        variant="outline" size="sm"
                        onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                        disabled={currentIdx === 0}
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" /> Anterior
                    </Button>
                    <Button
                        variant="outline" size="sm"
                        onClick={() => setCurrentIdx(i => Math.min(prompts.length - 1, i + 1))}
                        disabled={currentIdx === prompts.length - 1}
                    >
                        Siguiente <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                </div>

                {/* Verificar + Continuar */}
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary/10 font-bold"
                        onClick={handleVerify}
                        disabled={answeredCount === 0}
                    >
                        <Check className="mr-2 h-4 w-4" /> Verificar
                    </Button>
                    {allCorrect && (
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white font-bold px-6"
                            onClick={onComplete}
                        >
                            Continuar <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB: VocabPopover — botón de vocabulario en la esquina superior derecha
// ─────────────────────────────────────────────────────────────────────────────
const VocabPopover = ({ vocabulary }: { vocabulary: Record<string, string> }) => (
    <Popover>
        <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 px-3 gap-1.5 text-xs font-semibold">
                <BookText className="h-3.5 w-3.5" /> Vocabulario
            </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72">
            <div className="space-y-2">
                <p className="text-sm font-bold flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-400" /> Palabras clave
                </p>
                <ScrollArea className="max-h-60">
                    <div className="grid gap-1.5 pr-2">
                        {Object.entries(vocabulary).map(([en, es]) => (
                            <div key={en} className="flex justify-between items-center text-sm py-1 border-b border-border/50 last:border-0">
                                <span className="font-medium text-foreground">{en}</span>
                                <span className="text-muted-foreground text-xs">{es}</span>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </PopoverContent>
    </Popover>
);

// ─────────────────────────────────────────────────────────────────────────────
// SUB: RepasoFinalExercise — frase por frase, bolitas coloreadas al verificar
// ─────────────────────────────────────────────────────────────────────────────
const RepasoFinalExercise = ({ onComplete }: { onComplete: () => void }) => {
    const { toast } = useToast();
    const prompts = repasoFinalPrompts;
    const inputRef = useRef<HTMLInputElement>(null);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<string[]>(Array(prompts.length).fill(''));
    const [results, setResults] = useState<('correct' | 'incorrect' | null)[]>(
        Array(prompts.length).fill(null)
    );
    const [verified, setVerified] = useState(false);

    const answeredCount = answers.filter(a => a.trim()).length;

    const norm = (s: string) =>
        s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[.!?]/g, '').replace(/\s+/g, ' ');

    useEffect(() => { inputRef.current?.focus(); }, [currentIdx]);

    const handleVerify = () => {
        const newResults = prompts.map((p, i) =>
            answers[i].trim()
                ? (p.es.some(a => norm(a) === norm(answers[i])) ? 'correct' : 'incorrect')
                : null
        ) as ('correct' | 'incorrect' | null)[];
        setResults(newResults);
        setVerified(true);
        const correct = newResults.filter(r => r === 'correct').length;
        const incorrect = newResults.filter(r => r === 'incorrect').length;
        toast({
            title: '🔍 Verificación completa',
            description: `${correct} correctas • ${incorrect} incorrectas`,
        });
    };

    const vocab: Record<string, string> = {
        'on / in': 'en / sobre', 'classroom': 'salón / aula',
        'calm': 'tranquila', 'young': 'joven',
        'motorcycle': 'moto', 'Colombian': 'colombiano/a',
        'tall': 'alto/a', 'big': 'grande', 'small': 'pequeña',
    };

    const getDotClass = (i: number) => {
        if (verified && results[i] === 'correct')
            return i === currentIdx
                ? 'border-green-500 bg-green-500 text-white scale-110 shadow-md'
                : 'border-green-500 bg-green-400 text-white';
        if (verified && results[i] === 'incorrect')
            return i === currentIdx
                ? 'border-red-500 bg-red-500 text-white scale-110 shadow-md'
                : 'border-red-400 bg-red-400 text-white';
        if (i === currentIdx)
            return 'border-primary bg-primary text-primary-foreground scale-110 shadow-md';
        if (answers[i].trim())
            return 'border-blue-400 bg-blue-100 dark:bg-blue-900/40 text-blue-600';
        return 'border-muted-foreground/30 bg-muted text-muted-foreground';
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple">
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                        <CardTitle>🏆 Repaso Final – Unidad 1</CardTitle>
                        <CardDescription>
                            Traduce cada frase. Navega con las bolitas o los botones.
                            Cuando termines haz clic en{' '}
                            <span className="font-bold text-primary">Verificar</span>.
                        </CardDescription>
                    </div>
                    <VocabPopover vocabulary={vocab} />
                </div>

                {/* Bolitas de progreso */}
                <div className="flex gap-1.5 flex-wrap mt-4">
                    {prompts.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentIdx(i)}
                            title={`Frase ${i + 1}`}
                            className={cn(
                                'w-7 h-7 rounded-full border-2 text-[10px] font-bold flex items-center justify-center transition-all duration-300 hover:scale-110',
                                getDotClass(i)
                            )}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                        Frase <span className="font-bold text-primary">{currentIdx + 1}</span> de {prompts.length}
                        &nbsp;•&nbsp;
                        <span className="font-bold">{answeredCount}</span> respondidas
                    </p>
                    {verified && (
                        <div className="flex gap-3 text-xs font-semibold">
                            <span className="flex items-center gap-1 text-green-600">
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                                {results.filter(r => r === 'correct').length} correctas
                            </span>
                            <span className="flex items-center gap-1 text-red-500">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
                                {results.filter(r => r === 'incorrect').length} incorrectas
                            </span>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-5">
                {/* Cuadro de frase actual */}
                <div className={cn(
                    'rounded-xl p-6 text-center border min-h-[100px] flex flex-col items-center justify-center transition-colors duration-300',
                    verified && results[currentIdx] === 'correct' && 'border-green-400 bg-green-500/5',
                    verified && results[currentIdx] === 'incorrect' && 'border-red-400 bg-red-400/5',
                    (!verified || results[currentIdx] === null) && 'bg-muted border-border',
                )}>
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Traduce al español:</p>
                    <p className="text-2xl font-bold text-foreground">{prompts[currentIdx].en}</p>
                    {verified && results[currentIdx] === 'correct' && (
                        <span className="mt-3 text-green-500 font-bold text-sm flex items-center gap-1">
                            <Check className="h-4 w-4" /> ¡Correcto!
                        </span>
                    )}
                    {verified && results[currentIdx] === 'incorrect' && (
                        <span className="mt-3 text-red-500 font-bold text-sm flex items-center gap-1">
                            <X className="h-4 w-4" /> Incorrecto
                        </span>
                    )}
                </div>

                {/* Input */}
                <Input
                    ref={inputRef}
                    value={answers[currentIdx]}
                    onChange={e => {
                        const copy = [...answers];
                        copy[currentIdx] = e.target.value;
                        setAnswers(copy);
                        if (verified) {
                            const rCopy = [...results];
                            rCopy[currentIdx] = null;
                            setResults(rCopy);
                        }
                    }}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && currentIdx < prompts.length - 1)
                            setCurrentIdx(i => i + 1);
                    }}
                    placeholder="Escribe la traducción en español..."
                    className={cn(
                        'text-lg h-12',
                        verified && results[currentIdx] === 'correct' && 'border-green-500 bg-green-500/10 focus-visible:ring-green-500',
                        verified && results[currentIdx] === 'incorrect' && 'border-red-400 bg-red-400/10 focus-visible:ring-red-400',
                    )}
                    autoComplete="off"
                />
            </CardContent>

            <CardFooter className="flex flex-wrap justify-between gap-3">
                {/* Navegación */}
                <div className="flex gap-2">
                    <Button
                        variant="outline" size="sm"
                        onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                        disabled={currentIdx === 0}
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" /> Anterior
                    </Button>
                    <Button
                        variant="outline" size="sm"
                        onClick={() => setCurrentIdx(i => Math.min(prompts.length - 1, i + 1))}
                        disabled={currentIdx === prompts.length - 1}
                    >
                        Siguiente <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                </div>

                {/* Verificar + Terminar */}
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary/10 font-bold"
                        onClick={handleVerify}
                        disabled={answeredCount === 0}
                    >
                        <Check className="mr-2 h-4 w-4" /> Verificar
                    </Button>
                    {verified && (
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white font-bold px-6"
                            onClick={onComplete}
                        >
                            <Trophy className="mr-2 h-4 w-4" /> Terminar
                        </Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
};






// ─────────────────────────────────────────────────────────────────────────────
// SUB: Congratulations
// ─────────────────────────────────────────────────────────────────────────────
const Congratulations = () => (
    <Card className="border-2 border-green-500 bg-green-500/10 text-center p-12 flex flex-col items-center animate-in fade-in zoom-in duration-500">
        <Trophy className="h-24 w-24 text-yellow-400 mb-6 animate-bounce" />
        <h2 className="text-4xl font-black text-green-600 dark:text-green-400 uppercase tracking-tighter">
            ¡Repaso Completado!
        </h2>
        <p className="text-2xl mt-4 font-bold text-foreground">Has terminado el Repaso 1</p>
        <p className="text-muted-foreground mt-2 text-lg">Unidad 1 dominada al 100% 🎉</p>
        <Button asChild variant="outline" className="mt-8 px-10 h-12">
            <Link href="/espanol/a1">← Volver a Ruta A1</Link>
        </Button>
    </Card>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Repaso1Page() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const studentDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'students', user.uid) : null),
        [firestore, user]
    );
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{
        role?: string;
        lessonProgress?: Record<string, any>;
        progress?: Record<string, number>;
    }>(studentDocRef);

    const isAdmin = useMemo(() => {
        if (!user) return false;
        return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
    }, [user, studentProfile]);

    const [steps, setSteps] = useState<LearningStep[]>(buildInitialSteps());
    const [selectedStep, setSelectedStep] = useState<string>('vocab-typing');
    const [isFinished, setIsFinished] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // Ref to always read the latest steps without capturing stale closure
    const stepsRef = React.useRef(steps);
    stepsRef.current = steps;

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile) return;

        const savedData: Record<string, any> = studentProfile?.lessonProgress?.[STORAGE_KEY] || {};
        let newSteps = buildInitialSteps();

        if (isAdmin) {
            newSteps = newSteps.map(s => ({ ...s, status: 'completed' as const }));
        } else if (Object.keys(savedData).length > 0) {
            newSteps = newSteps.map(s => ({
                ...s,
                status: (savedData[s.key] || s.status) as LearningStep['status'],
            }));
        }

        let lastDone = true;
        for (let i = 0; i < newSteps.length; i++) {
            if (lastDone && newSteps[i].status === 'locked') {
                newSteps[i] = { ...newSteps[i], status: 'active' };
            }
            lastDone = newSteps[i].status === 'completed';
        }

        // isFinished is intentionally NOT restored from Firebase;
        // Congratulations only appears when the user clicks Terminar in Repaso Final.
        setSteps(newSteps);
        const active = newSteps.find(s => s.status === 'active');
        setSelectedStep(savedData.lastSelected || active?.key || 'vocab-typing');
        setIsInitialLoading(false);
    }, [isAdmin, studentProfile, isProfileLoading, isUserLoading]);

    const handleStepComplete = useCallback((stepKey: string) => {
        // Read latest steps from ref — avoids calling setState inside a setState updater
        const prev = stepsRef.current;
        const idx = prev.findIndex(s => s.key === stepKey);
        if (idx === -1) return;

        const next = prev.map((s, i) => {
            if (i === idx) return { ...s, status: 'completed' as const };
            if (i === idx + 1 && s.status === 'locked') return { ...s, status: 'active' as const };
            return s;
        });

        const toSave: Record<string, string | boolean> = {};
        next.forEach(s => { toSave[s.key] = s.status; });

        setSteps(next);

        // Congratulations only triggers when the FINAL exercise is the one completed
        if (stepKey === 'repaso-final') {
            toSave.isFinished = true;
            setIsFinished(true);
            if (studentDocRef) {
                updateDocumentNonBlocking(studentDocRef, { [`progress.${MAIN_PROGRESS_KEY}`]: 100 });
                window.dispatchEvent(new CustomEvent('progressUpdated'));
            }
            toast({ title: '🏆 ¡Repaso 1 Completado!', description: 'Unidad 1 al 100%.' });
        } else {
            const nextActive = next.find((s, i) => i > idx && s.status === 'active');
            if (nextActive) setSelectedStep(nextActive.key);
            toast({ title: '✅ ¡Siguiente paso desbloqueado!' });
        }

        if (studentDocRef) {
            updateDocumentNonBlocking(studentDocRef, {
                [`lessonProgress.${STORAGE_KEY}`]: toSave,
            });
        }
    }, [studentDocRef, toast]);

    const progressValue = useMemo(() => {
        const done = steps.filter(s => s.status === 'completed').length;
        return Math.round((done / steps.length) * 100);
    }, [steps]);

    const handleStepSelect = (key: string) => {
        const step = steps.find(s => s.key === key);
        if (!step || (!isAdmin && step.status === 'locked')) return;
        setSelectedStep(key);
    };

    const renderExercise = () => {
        switch (selectedStep) {
            case 'vocab-typing':
                return <VocabTypingChallenge onComplete={() => handleStepComplete('vocab-typing')} />;

            case 'articulos':
                return (
                    <DotNavExercise
                        title="Artículos – EL / LA / LOS / LAS"
                        description="Escribe el artículo correcto para cada sustantivo. Responde todas las frases para verificar."
                        prompts={articulosPrompts.map(p => ({ question: p.s, answers: [p.a], hint: p.hint }))}
                        onComplete={() => handleStepComplete('articulos')}
                    />
                );

            case 'ser-conjuga':
                return (
                    <DotNavExercise
                        title="SER – Conjugación"
                        description="Completa con la forma correcta del verbo SER (soy, eres, es, somos, son)."
                        prompts={serConjugaPrompts.map(p => ({ question: p.s, answers: [p.a], hint: p.hint }))}
                        onComplete={() => handleStepComplete('ser-conjuga')}
                    />
                );

            case 'estar-conjuga':
                return (
                    <DotNavExercise
                        title="ESTAR – Conjugación"
                        description="Completa con la forma correcta del verbo ESTAR (estoy, estás, está, estamos, están)."
                        prompts={estarConjugaPrompts.map(p => ({ question: p.s, answers: [p.a], hint: p.hint }))}
                        onComplete={() => handleStepComplete('estar-conjuga')}
                    />
                );

            case 'ser-o-estar':
                return (
                    <DotNavExercise
                        title="¿SER o ESTAR?"
                        description="Conjuga correctamente. SER = permanente. ESTAR = temporal."
                        prompts={serOEstarPrompts.map(p => ({ question: p.s, answers: [p.a], hint: p.hint }))}
                        onComplete={() => handleStepComplete('ser-o-estar')}
                        showHint
                    />
                );

            case 'posesivos':
                return (
                    <DotNavExercise
                        title="Posesivos y Tener"
                        description="Traduce al español. Usa el posesivo correcto."
                        prompts={posesivosPrompts.map(p => ({ question: p.en, answers: p.es }))}
                        onComplete={() => handleStepComplete('posesivos')}
                        vocabulary={{
                            'my': 'mi / mis',
                            'your': 'tu / tus',
                            'his / her': 'su / sus',
                            'our': 'nuestro/a',
                            'their': 'su / sus (de ellos)',
                            'has': 'tiene',
                            'have': 'tienen / tengo',
                        }}
                    />
                );

            case 'ser-traduccion':
                return (
                    <DotNavExercise
                        title="SER – Traducción"
                        description="Traduce al español. Usa SER para características, origen y profesión."
                        prompts={serTraduccionPrompts.map(p => ({ question: p.en, answers: p.es }))}
                        onComplete={() => handleStepComplete('ser-traduccion')}
                        vocabulary={{
                            'kind': 'amable',
                            'lazy': 'perezoso',
                            'tall': 'alto',
                            'pretty': 'bonita',
                            'engineer': 'ingeniero',
                            'creative': 'creativo',
                            'serious': 'serio',
                            'brave': 'valiente',
                        }}
                    />
                );

            case 'estar-traduccion':
                return (
                    <DotNavExercise
                        title="ESTAR – Traducción"
                        description="Traduce al español. Usa ESTAR para emociones, estados temporales y ubicación."
                        prompts={estarTraduccionPrompts.map(p => ({ question: p.en, answers: p.es }))}
                        onComplete={() => handleStepComplete('estar-traduccion')}
                        vocabulary={{
                            'busy': 'ocupada',
                            'hungry': 'hambrientos',
                            'sick': 'enfermo',
                            'excited': 'emocionados',
                            'worried': 'preocupada',
                            'dirty': 'sucia',
                            'clean': 'limpio',
                        }}
                    />
                );

            case 'articulos-adj':
                return (
                    <DotNavExercise
                        title="Artículos + Adjetivos + Sustantivos"
                        description="Traduce al español. En español el adjetivo va DESPUÉS del sustantivo. Ej: 'the red pencil' → 'el lápiz rojo'."
                        prompts={articulosAdjetivosPrompts.map(p => ({ question: p.en, answers: p.es }))}
                        onComplete={() => handleStepComplete('articulos-adj')}
                        vocabulary={{
                            'the': 'el / la / los / las',
                            'a / an': 'un / una',
                            'some': 'unos / unas',
                            'big': 'grande',
                            'small': 'pequeño/a',
                            'brown': 'marrón',
                            'orange': 'naranja',
                        }}
                    />
                );

            case 'repaso-final':
                if (isFinished) return <Congratulations />;
                return <RepasoFinalExercise onComplete={() => handleStepComplete('repaso-final')} />;


            default:
                return <div className="flex items-center justify-center h-48"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
        }
    };

    if (isInitialLoading || isUserLoading || isProfileLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col espanol-dashboard-bg min-h-screen text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <Link href="/espanol/a1" className="text-sm font-bold text-white/80 hover:underline flex items-center gap-2 mb-3">
                            <ArrowLeft className="h-4 w-4" /> Volver a Ruta A1
                        </Link>
                        <h1 className="text-4xl font-bold text-white [text-shadow:1px_1px_3px_rgba(0,0,0,0.5)] uppercase">
                            Repaso 1 – Unidad 1
                        </h1>
                        <p className="text-white/70 mt-1 text-sm">
                            Artículos y Género • Posesivos y Tener • Ser • Estar
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-12">
                        {/* Exercise area */}
                        <div key={selectedStep} className="md:col-span-9 order-2 md:order-1">
                            {renderExercise()}
                        </div>

                        {/* Sidebar */}
                        <div className="md:col-span-3 order-1 md:order-2">
                            <Card className="sticky top-24 shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-3 border-b bg-muted/30">
                                    <CardTitle className="text-base font-black text-primary uppercase flex items-center gap-2">
                                        <Star className="h-4 w-4 text-yellow-400" /> Repaso 1
                                    </CardTitle>
                                    <CardDescription className="text-xs">10 ejercicios • Unidad 1 A1</CardDescription>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <nav>
                                        <ul className="space-y-1">
                                            {steps.map((step, idx) => {
                                                const Icon = ICONS[step.status];
                                                const isSelected = selectedStep === step.key;
                                                const isLocked = step.status === 'locked';
                                                return (
                                                    <li
                                                        key={step.key}
                                                        onClick={() => handleStepSelect(step.key)}
                                                        className={cn(
                                                            'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                                                            (!isLocked || isAdmin)
                                                                ? 'cursor-pointer hover:bg-muted'
                                                                : 'cursor-not-allowed opacity-40',
                                                            isSelected && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm'
                                                        )}
                                                    >
                                                        <Icon className={cn(
                                                            'h-4 w-4 flex-shrink-0',
                                                            step.status === 'completed' && 'text-green-500',
                                                            step.status === 'locked' && 'text-yellow-500',
                                                            step.status === 'active' && 'text-primary',
                                                        )} />
                                                        <span className="truncate">{idx + 1}. {step.name}</span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </nav>
                                    <div className="mt-5 pt-4 border-t">
                                        <div className="flex justify-between items-center text-xs mb-1 text-muted-foreground font-bold uppercase">
                                            <span>Progreso</span>
                                            <span className="text-primary font-black">{progressValue}%</span>
                                        </div>
                                        <Progress value={progressValue} className="h-3 rounded-full" />
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {steps.filter(s => s.status === 'completed').length} / {steps.length} completados
                                        </p>
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