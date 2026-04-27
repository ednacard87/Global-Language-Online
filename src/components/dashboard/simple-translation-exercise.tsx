'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/context/language-context';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight } from 'lucide-react';

// Data for the exercises
const exercises = {
    mixed1: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'EL ES ESTUDIANTE?', english: ['is he a student?'] },
            { spanish: 'ELLOS NO SON AMIGOS (FRIENDS)', english: ['they are not friends', "they aren't friends"] },
            { spanish: 'ELLOS SON TUS (YOUR) PADRES (PARENTS)?', english: ['are they your parents?'] },
            { spanish: 'ELLA NO ES MI HERMANA (SISTER)', english: ['she is not my sister', "she isn't my sister"] },
            { spanish: 'NOSOTROS SOMOS ABOGADOS (LAWYERS)', english: ['we are lawyers', "we're lawyers"] },
            { spanish: 'ERES DE (FROM) INGLATERRA?', english: ['are you from england?'] },
            { spanish: 'ELLA ES SU HERMANA (DE ELLOS)', english: ['she is their sister', "she's their sister"] },
            { spanish: 'ELLOS SON SUS AMIGOS? (DE ÉL)', english: ['are they his friends?'] },
        ],
    },
    mixed2: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: '¿ellos son tus profesores?', english: ['are they your teachers?'] },
            { spanish: '¿él está en su carro? (de él)', english: ['is he in his car?'] },
            { spanish: '¿eres su amiga? (de ella)', english: ["are you her friend?"] },
            { spanish: 'esta (this) no es su universidad (de ellos)', english: ['this is not their university', "this isn't their university"] },
            { spanish: '¿estás con su tio? (de él) (uncle)', english: ['are you with his uncle?'] },
            { spanish: '¿ella es tu novia? (girlfriend)', english: ['is she your girlfriend?'] },
            { spanish: 'nosotros somos tus amigos', english: ['we are your friends', "we're your friends"] },
            { spanish: 'mi madre es vendedora (seller)', english: ['my mother is a seller', 'my mom is a seller', "my mother's a seller", "my mom's a seller"] },
            { spanish: 'los hombres están en el restaurante', english: ['the men are in the restaurant', "the men're in the restaurant"] },
            { spanish: 'mi hermana es profesora de alemán', english: ['my sister is a German teacher', "my sister's a German teacher"] },
            { spanish: 'su novio no está en el trabajo (su: de ella)', english: ["her boyfriend is not at work", "her boyfriend isn't at work"] },
            { spanish: 'nuestros padres son amables (kind)', english: ['our parents are kind', 'our parents are nice'] },
            { spanish: 'tu hijo es un hombre de negocios (businessman)', english: ['your son is a businessman', "your son's a businessman"] },
        ],
    },
    mixed3: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'ELLOS SON MIS ESTUDIANTES', english: ['they are my students', "they're my students"] },
            { spanish: '¿ELLOS SON SUS AMIGOS? (de ella)', english: ['are they her friends?'] },
            { spanish: '¿ELLA ES SU MAMÁ? – (DE EL)', english: ['is she his mother?', 'is she his mom?'] },
            { spanish: 'ELLOS SON NUESTROS PADRES', english: ['they are our parents', "they're our parents"] },
            { spanish: '¿ELLOS SON VIEJOS (OLD)?', english: ['are they old?'] },
            { spanish: 'ELLA NO ES MI PRIMA (COUSIN)', english: ['she is not my cousin', "she isn't my cousin"] },
            { spanish: '¿ELLA ES TU ABUELA?', english: ['is she your grandmother?', 'is she your grandma?'] },
            { spanish: 'NOSOTRAS NO SOMOS HERMANAS (SISTERS)', english: ['we are not sisters', "we aren't sisters"] },
            { spanish: '¿EL ESTA CANSADO (TIRED)?', english: ['is he tired?'] },
            { spanish: 'MIS PADRES NO ESTAN ABURRIDOS (BORED)', english: ['my parents are not bored', "my parents aren't bored"] },
            { spanish: '¿ELLOS SON TUS PROFESORES (TEACHERS)?', english: ['are they your teachers?'] },
            { spanish: 'ELLOS NO ESTAN ENOJADOS (ANGRY)', english: ['they are not angry', "they aren't angry"] },
            { spanish: 'ELLA ES MUY (SO) ALTA (TALL)', english: ['she is so tall', "she's so tall"] },
            { spanish: 'NOSOTROS ESTAMOS PREOCUPADOS (WORRIED)', english: ['we are worried', "we're worried"] },
        ]
    },
    mixed4: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: '¿JACK ES UN PROFESOR? – NO, ÉL ES UN INGENIERO', english: ["is jack a teacher? no, he is an engineer", "is jack a teacher? no, he's an engineer"] },
            { spanish: '¿TU ERES AMERICANO? NO, YO SOY AUSTRALIANO', english: ["are you american? no, i am australian", "are you american? no, i'm not australian"] },
            { spanish: '¿JON Y PAUL ESTÁN EN CASA? NO, ELLOS ESTÁN EN SU UNIVERSIDAD.', english: ["are jon and paul at home? no, they are at their university", "are jon and paul at home? no, they're at their university"] },
            { spanish: '¿EL LIBRO ESTA SOBRE LA MESA? NO, ESTÁ SOBRE LA SILLA.', english: ["is the book on the table? no, it is on the chair", "is the book on the table? no, it's on the chair"] },
            { spanish: '¿TU PADRE ESTÁ EN MADRID? NO, ÉL ESTÁ EN BARCELONA.', english: ["is your father in madrid? no, he is in barcelona", "is your dad in madrid? no, he's in barcelona"] },
            { spanish: 'MI NOMBRE ES SHARON Y YO SOY DE ALEMANIA.', english: ["my name is sharon and i am from germany", "my name's sharon and i'm from germany"] },
            { spanish: 'MIS HOBBIES SON EL TENNIS Y BALONCESTO.', english: ["my hobbies are tennis and basketball"] },
            { spanish: 'YO NO ESTOY INTERESADO EN LAS PELICULAS ROMANTICAS.', english: ["i am not interested in romantic movies", "i'm not interested in romantic movies"] },
            { spanish: '¿ELLOS ESTÁN EN EL ESTADIO? - SI', english: ["are they at the stadium? yes, they are"] },
            { spanish: '¿DE DONDE SON TUS PRIMOS? - MIS PRIMOS SON DE BOGOTÁ', english: ["where are your cousins from? my cousins are from bogota"] },
            { spanish: '¿TU AMIGA ES DE ITALIA? - SI', english: ["is your friend from italy? yes, she is"] },
            { spanish: '¿ELLOS SON DE FRANCIA? – NO, ELLOS SON DE ESPAÑA', english: ["are they from france? no, they are from spain", "are they from france? no, they're from spain"] },
            { spanish: '¿CUÁL ES SU NOMBRE? (DE ÉL) – SU NOMBRE ES JOSÉ', english: ["what is his name? his name is jose", "what's his name? his name's jose"] }
        ]
    },
    mixed6: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: '¿ELLA ES NUESTRA PROFESORA? - SI', english: ["Is she our teacher? Yes, she is."] },
            { spanish: '¿ELLOS ESTÁN EN EL TRABAJO? (AT WORK)- NO', english: ["Are they at work? No, they are not.", "Are they at work? No, they aren't."] },
            { spanish: '¿ELLOS SON TUS HIJOS? (SONS)- SI', english: ["Are they your sons? Yes, they are."] },
            { spanish: '¿ERES DE COLOMBIA? - SI', english: ["Are you from Colombia? Yes, I am."] },
            { spanish: '¿ÉL ES TU PAPÁ? –NO, EL ES MI PADRASTRO', english: ["Is he your dad? No, he is my stepfather.", "Is he your father? No, he is my stepfather."] },
            { spanish: '¿TU PRIMO ESTÁ EN CALI? – NO, EL ESTÁ EN MIAMI', english: ["Is your cousin in Cali? No, he is in Miami."] },
            { spanish: '¿TUS LIBROS ESTAN SOBRE EL ESTANTE? – NO, ESTAN SOBRE EL ESCRITORIO', english: ["Are your books on the shelf? No, they are on the desk."] },
            { spanish: '¿TU MAMA ESTA EN LA CASA? NO, ELLA ESTA EN LA IGLESIA', english: ["Is your mom at home? No, she is at the church.", "Is your mother at home? No, she is at the church."] },
            { spanish: '¿TUS HERMANOS ESTÁN EN LA UNIVERSIDAD? – NO', english: ["Are your brothers at the university? No, they are not.", "Are your brothers at the university? No, they aren't."] },
            { spanish: '¿TU HERMANA ESTÁ EN EL PARQUE? – NO, ELLA ESTÁ EN EL SUPERMERCADO', english: ["Is your sister at the park? No, she is at the supermarket."] },
        ]
    },
    c2_mixed1: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'ÉL BEBE CERVEZA LOS SABADOS', english: ['he drinks beer on saturdays'] },
            { spanish: 'STEVE VA A LA ESCUELA TODOS LOS DIAS', english: ['steve goes to school every day'] },
            { spanish: 'ÉL VISITA A SU TIO DOS VECES POR SEMANA', english: ['he visits his uncle twice a week'] },
            { spanish: 'ELLA HACE EJERCICIO EN LA TARDE', english: ['she exercises in the afternoon', 'she does exercise in the afternoon'] },
            { spanish: 'YO HABLO INGLES Y ESPAÑOL', english: ['i speak english and spanish'] },
            { spanish: 'ÉL NO BEBE COCA-COLA', english: ["he does not drink coca-cola", "he doesn't drink coca-cola"] },
            { spanish: 'MARCO TRABAJA EN MIAMI', english: ['marco works in miami'] },
            { spanish: 'EL TREN SALE A LAS 7 P.M', english: ['the train leaves at 7 p.m.'] },
        ],
    },
    c2_mixed2: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'Placeholder 1 para Clase 2 - Ej 2', english: ['...'] },
            { spanish: 'Placeholder 2 para Clase 2 - Ej 2', english: ['...'] },
        ],
    },
    c5_mixed3: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: '¿ELLOS SON SUS PARIENTES? (RELATIVES) (DE ELLA)', english: ["are they her relatives?"] },
            { spanish: 'ESTA (THIS) NO ES MI CASA', english: ["this is not my house", "this isn't my house"] },
            { spanish: 'EL GATO ESTA EN SU CASA PEQUEÑA', english: ["the cat is in its small house"] },
            { spanish: '¿ESTE ES TU CARRO?', english: ["is this your car?"] },
            { spanish: '¿ERES SU TÍO (UNCLE)? (DE EL)', english: ["are you his uncle?"] },
            { spanish: 'ELLOS NO SON NUESTROS ABUELOS (GRANDPARENTS)', english: ["they are not our grandparents", "they aren't our grandparents"] },
        ]
    }
};

const guideFishImage = PlaceHolderImages.find(p => p.id === 'guide-fish');
const a1MascotImage = PlaceHolderImages.find(p => p.id === 'a1-mascot');

type ValidationStatus = 'correct' | 'incorrect' | 'unchecked';

export type ExerciseKey = keyof typeof exercises;

export function SimpleTranslationExercise({ 
    exerciseKey,
    onComplete,
    course,
    title: titleProp,
}: { 
    exerciseKey: string,
    onComplete?: () => void,
    course?: string,
    title?: string,
}) {
    const { t } = useTranslation();
    const { toast } = useToast();

    const imageToShow = course === 'a1' ? a1MascotImage : guideFishImage;

    const exerciseNumber = useMemo(() => exerciseKey.replace(/mixed/g, ''), [exerciseKey]);
    
    const exerciseData = useMemo(() => {
        if (exercises[exerciseKey as ExerciseKey]) {
            return exercises[exerciseKey as ExerciseKey];
        }
        return {
            title: 'a1class1.exercise',
            prompts: [
                { spanish: `Frase de ejemplo para ejercicio ${exerciseNumber} #1`, english: ['...'] },
                { spanish: `Frase de ejemplo para ejercicio ${exerciseNumber} #2`, english: ['...'] },
                { spanish: `Frase de ejemplo para ejercicio ${exerciseNumber} #3`, english: ['...'] },
            ],
        };
    }, [exerciseKey, exerciseNumber]);

    const totalPrompts = exerciseData.prompts.length;

    const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<string[]>(Array(totalPrompts).fill(''));
    const [validationStates, setValidationStates] = useState<ValidationStatus[]>(Array(totalPrompts).fill('unchecked'));
    const [showCompletionMessage, setShowCompletionMessage] = useState(false);

    const currentPrompt = exerciseData.prompts[currentPromptIndex];
    
    const defaultTitle = t(exerciseData.title, { number: exerciseNumber });
    const title = titleProp || defaultTitle;

    useEffect(() => {
        setCurrentPromptIndex(0);
        setUserAnswers(Array(totalPrompts).fill(''));
        setValidationStates(Array(totalPrompts).fill('unchecked'));
        setShowCompletionMessage(false);
    }, [exerciseKey, totalPrompts]);

    const handleAnswerChange = (value: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentPromptIndex] = value;
        setUserAnswers(newAnswers);

        // If the current field was already validated, reset it to unchecked as the user is editing it.
        if (validationStates[currentPromptIndex] !== 'unchecked') {
            const newValidationStates = [...validationStates];
            newValidationStates[currentPromptIndex] = 'unchecked';
            setValidationStates(newValidationStates);
        }
    };
    
    const handleFinalCheck = () => {
        const newValidationStates = exerciseData.prompts.map((prompt, index) => {
            const userAnswer = userAnswers[index]?.trim().toLowerCase().replace(/[.?,]/g, '') || '';
            const correctAnswers = Array.isArray(prompt.english)
                ? prompt.english.map(a => a.toLowerCase().replace(/[.?,]/g, ''))
                : [prompt.english.toLowerCase().replace(/[.?,]/g, '')];
            return correctAnswers.includes(userAnswer) ? 'correct' : 'incorrect';
        });
        setValidationStates(newValidationStates);

        const allCorrect = newValidationStates.every(state => state === 'correct');
        if (allCorrect) {
            toast({ title: t('translationExercise.allCorrect') || "¡Todo correcto! Ejercicio completado." });
            setShowCompletionMessage(true);
            if (onComplete) {
                onComplete();
            }
        } else {
            toast({ 
                variant: 'destructive', 
                title: t('translationExercise.someIncorrect') || "Algunas respuestas son incorrectas", 
                description: t('translationExercise.reviewRed') || "Revisa las bolitas rojas y corrige tus respuestas." 
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (currentPromptIndex < totalPrompts - 1) {
                setCurrentPromptIndex(currentPromptIndex + 1);
            } else {
                handleFinalCheck();
            }
        }
    };
    
    if (showCompletionMessage) {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardContent className="p-6">
                    <div className="text-center py-8">
                        <h2 className="text-5xl font-bold bg-gradient-to-r from-brand-purple to-brand-teal text-transparent bg-clip-text animate-pulse">
                            {t('intro1Page.congratulations')}
                        </h2>
                        <p className="text-xl mt-4 text-muted-foreground">{t('intro1Page.exerciseComplete')}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <div className="flex items-center justify-start flex-wrap gap-2 pt-4">
                    {exerciseData.prompts.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentPromptIndex(index)}
                            className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center font-bold border-2 transition-all",
                                currentPromptIndex === index ? "border-primary ring-2 ring-primary" : "border-muted-foreground/50",
                                validationStates[index] === 'correct' && 'bg-green-500/20 border-green-500 text-green-700',
                                validationStates[index] === 'incorrect' && 'bg-red-500/20 border-destructive text-destructive',
                            )}
                            aria-label={`Ir al ejercicio ${index + 1}`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                
                <div>
                    <h3 className="text-lg font-semibold mb-4">{t('translationExercise.translate')}</h3>
                    <div className="flex items-start gap-4">
                         {imageToShow && <Image
                            src={imageToShow.imageUrl}
                            alt={imageToShow.description}
                            width={60}
                            height={60}
                            className="rounded-lg hidden sm:block"
                            data-ai-hint={imageToShow.imageHint}
                        />}
                        <div className="relative w-full">
                             <div className="bg-muted p-4 rounded-lg border">
                                <p className="text-lg font-medium">{currentPrompt.spanish}</p>
                             </div>
                        </div>
                    </div>
                </div>
                <div>
                    <Textarea 
                        value={userAnswers[currentPromptIndex]}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="min-h-[100px]"
                    />
                </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                 <Button onClick={() => setCurrentPromptIndex(p => Math.max(0, p - 1))} disabled={currentPromptIndex === 0}>
                     <ArrowLeft className="mr-2 h-4 w-4" />
                     {t('translationExercise.previous') || 'Anterior'}
                 </Button>

                {currentPromptIndex === totalPrompts - 1 ? (
                     <Button onClick={handleFinalCheck}>
                         {t('translationExercise.checkAll') || 'Verificar Todo'}
                     </Button>
                ) : (
                     <Button onClick={() => setCurrentPromptIndex(p => Math.min(totalPrompts - 1, p + 1))} disabled={currentPromptIndex === totalPrompts - 1}>
                         {t('translationExercise.next') || 'Siguiente'}
                         <ArrowRight className="ml-2 h-4 w-4" />
                     </Button>
                )}
            </CardFooter>
        </Card>
    );
}
