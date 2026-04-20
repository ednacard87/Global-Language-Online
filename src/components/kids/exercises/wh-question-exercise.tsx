'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Trophy } from 'lucide-react';

const whExercisesData = {
    'Who': {
        title: "Who : Quién/ Quienes?",
        prompts: [
            { spanish: '¿QUIEN ES ESE HOMBRE?', english: ["who is that man?"] },
            { spanish: '¿QUIENES SON TEDDY Y APOLO?', english: ["who are teddy and apolo?"] },
            { spanish: '¿QUIEN ES LUIS?', english: ["who is luis?"] },
            { spanish: '¿QUIEN ES TU TIA?', english: ["who is your aunt?"] },
            { spanish: '¿QUIEN ESTA EN LA PUERTA?', english: ["who is at the door?"] }
        ]
    },
    'what1': {
        title: "What: Qué?",
        prompts: [
            { spanish: 'QUE HACES?', english: ["what do you do?"] },
            { spanish: 'QUE COME ELLA?', english: ["what does she eat?"] },
            { spanish: 'QUE LEES EN EL METRO?', english: ["what do you read on the subway?"] },
            { spanish: 'QUE BEBE EL NIÑO?', english: ["what does the child drink?"] },
            { spanish: 'QUE COMEN ELLOS EN LA NOCHE?', english: ["what do they eat at night?"] }
        ]
    },
    'what2': {
        title: "What: Cual?",
        prompts: [
            { spanish: '¿CUAL ES TU CARRO FAVORITO?', english: ["what is your favorite car?"] },
            { spanish: '¿CUAL ES TU MÚSICA FAVORITA?', english: ["what is your favorite music?"] },
            { spanish: '¿CUAL ES TU DEPORTE FAVORITO?', english: ["what is your favorite sport?"] },
            { spanish: '¿CUAL ES TU COMIDA FAVORITA?', english: ["what is your favorite food?"] },
            { spanish: '¿CUALES SON TUS ANIMALES FAVORITOS?', english: ["what are your favorite animals?"] }
        ]
    },
    'what-kind-of': {
        title: "WHAT KIND OF?  QUE TIPO/CLASE DE ________? –",
        prompts: [
            { spanish: '¿QUE TIPO DE ZAPATOS TE GUSTAN?', english: ["what kind of shoes do you like?"] },
            { spanish: '¿QUE TIPO DE PORTATIL LE GUSTA A ELLA?', english: ["what kind of laptop does she like?"] },
            { spanish: '¿QUE TIPO DE DEPORTE PRACTICAS?', english: ["what kind of sport do you practice?"] },
            { spanish: '¿QUE TIPO DE CELULAR ES ESE?', english: ["what kind of cellphone is that?"] },
            { spanish: '¿QUE TIPO DE ROPA TE GUSTA?', english: ["what kind of clothes do you like?"] }
        ]
    },
    'how': {
        title: "HOW? - COMO? -",
        prompts: [
            { spanish: 'COMO ESTAS?', english: ["how are you?"] },
            { spanish: 'COMO ESTÁN ELLOS?', english: ["how are they?"] },
            { spanish: 'COMO ESTAN TUS HERMANOS?', english: ["how are your brothers?"] },
            { spanish: 'COMO VAS A LA UNIVERSIDAD?', english: ["how do you go to the university?"] },
            { spanish: 'COMO ESTA TU ESPOSO?', english: ["how is your husband?"] }
        ]
    },
    'how-adjective': {
        title: "HOW + ADJECTIVE =QUE TAN + ADJETIVO...?",
        prompts: [
            { spanish: '¿QUE TAN ALTO ERES?', english: ["how tall are you?"] },
            { spanish: '¿QUE TAN PICANTE ESTA LA SOPA?', english: ["how spicy is the soup?"] },
            { spanish: '¿QUE TAN PEQUEÑO ES SU CARRO? (DE ÉL)', english: ["how small is his car?"] },
            { spanish: '¿QUE TAN GRANDE ES SU APARTAMENTO? (DE ELLA)', english: ["how big is her apartment?"] },
            { spanish: '¿QUE TAN GRANDE ES MEDELLIN?', english: ["how big is medellin?"] }
        ]
    },
    'how-often': {
        title: "HOW + OFTEN: ¿QUE TAN SEGUIDO?",
        prompts: [
            { spanish: '¿QUE TAN SEGUIDO VAS AL GIMNASIO?', english: ["how often do you go to the gym?"] },
            { spanish: '¿QUE TAN SEGUIDO ESTUDIAS INGLES?', english: ["how often do you study english?"] },
            { spanish: '¿QUÉ TAN SEGUIDO COMES_____________?', english: ["how often do you eat?"] },
            { spanish: '¿QUE TAN SEGUIDO HABLAS CON TU HERMANA?', english: ["how often do you talk to your sister?"] },
            { spanish: '¿QUE TAN SEGUIDO ESTUDIAS QUIZLET?', english: ["how often do you study quizlet?"] }
        ]
    },
    'whose': {
        title: "WHOSE? - DE QUIEN – DE QUIENES? -",
        prompts: [
            { spanish: '¿DE QUIEN ES ESTA SOMBRILLA?', english: ["whose umbrella is this?"] },
            { spanish: '¿DE QUIEN ES ESTE CARRO?', english: ["whose car is this?"] },
            { spanish: '¿DE QUIENES SON ESTOS LIBROS?', english: ["whose books are these?"] },
            { spanish: 'DE QUIEN ES ESE PORTATIL?', english: ["whose laptop is that?"] },
            { spanish: 'DE QUIEN SON ESTAS LLAVES?', english: ["whose keys are these?"] }
        ]
    },
    'where': {
        title: "WHERE? ¿DONDE?",
        prompts: [
            { spanish: '¿DONDE ESTA WILLIAM?', english: ["where is william?"] },
            { spanish: '¿A DONDE VAS?', english: ["where are you going?"] },
            { spanish: '¿DONDE ESTÁN LOS LIBROS?', english: ["where are the books?"] },
            { spanish: '¿DONDE COMPRAS LAS VERDURAS?', english: ["where do you buy the vegetables?"] },
            { spanish: '¿DONDE COMPRA ELLA LA CARNE?', english: ["where does she buy the meat?"] }
        ]
    },
    'which': {
        title: "WHICH? -CUAL? (en un grupo definido- ya conozco las opciones a elegir)",
        prompts: [
            { spanish: '¿CUAL MOTO LE GUSTA A EL?  (DE ESTOS QUE TE MUESTRO)', english: ["which motorcycle does he like?"] },
            { spanish: '¿CUAL HELADO QUIERES?  (en una heladería)', english: ["which ice cream do you want?"] },
            { spanish: '¿CUAL CELULAR TE GUSTA?  (en una tienda de celulares)', english: ["which cellphone do you like?"] },
            { spanish: '¿CUAL COMPUTADOR NECESITAS?', english: ["which computer do you need?"] },
            { spanish: '¿CUAL CARRO QUIERES COMPRAR?', english: ["which car do you want to buy?"] }
        ]
    },
    'when': {
        title: "WHEN? ¿CUÁNDO?",
        prompts: [
            { spanish: '¿CUÁNDO ES TU CUMPLEAÑOS?', english: ["when is your birthday?"] },
            { spanish: '¿CUÁNDO ES LA CLASE DE INGLÉS?', english: ["when is the english class?"] },
            { spanish: 'CUANDO ES LA FIESTA?', english: ["when is the party?"] },
            { spanish: 'CUANDO ES EL VIAJE A EUROPA?', english: ["when is the trip to europe?"] },
            { spanish: 'CUANDO ES LA CLASE DE YOGA?', english: ["when is the yoga class?"] }
        ]
    },
    'why': {
        title: "WHY? –POR QUÉ (SE USA PARA PREGUNTAS) - BECAUSE…- PORQUE……(SE USA PARA RESPUESTAS)",
        prompts: [
            { spanish: '¿POR QUÉ VAS ALLÁ? – PORQUE YO VOY A LA FINCA DE MIS PADRES.', english: ["why do you go there? because i go to my parents' farm."] },
            { spanish: '¿POR QUÉ ESTAS TRISTE? ------- PORQUE NO PUEDO VISITAR A MI ABUELA.', english: ["why are you sad? because i can't visit my grandmother."] },
            { spanish: '¿POR QUÉ ELLA ESTA FELIZ? – PORQUE ELLA TIENE UN VIAJE A BARCELONA.', english: ["why is she happy? because she has a trip to barcelona."] },
            { spanish: '¿POR QUÉ ESTUDIAS EN NOCHE? – PORQUE YO NO TENGO TIEMPO DURANTE EL DIA.', english: ["why do you study at night? because i don't have time during the day."] },
            { spanish: '¿POR QUE VIVES LEJOS? – POR QUE A MI ME GUSTA VIVIR EN LA NATURALEZA.', english: ["why do you live far away? because i like to live in nature."] }
        ]
    },
    'default': {
        title: 'Ejercicio',
        prompts: [
            { spanish: "Frase de ejemplo 1...", english: ["Example sentence 1..."] },
            { spanish: "Frase de ejemplo 2...", english: ["Example sentence 2..."] },
            { spanish: "Frase de ejemplo 3...", english: ["Example sentence 3..."] },
        ]
    }
};

type ValidationStatus = 'correct' | 'incorrect' | 'unchecked';

export function WhQuestionExercise({ exerciseName, onComplete }: { exerciseName: string, onComplete: () => void }) {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);

    const { title, prompts: exercisePrompts } = whExercisesData[exerciseName as keyof typeof whExercisesData] || {
        title: `Ejercicio: ${exerciseName}`,
        prompts: whExercisesData.default.prompts
    };

    const [userAnswers, setUserAnswers] = useState<string[]>(Array(exercisePrompts.length).fill(''));
    const [validationStates, setValidationStates] = useState<ValidationStatus[]>(Array(exercisePrompts.length).fill('unchecked'));
    const [showCompletionMessage, setShowCompletionMessage] = useState(false);

    useEffect(() => {
        setUserAnswers(Array(exercisePrompts.length).fill(''));
        setValidationStates(Array(exercisePrompts.length).fill('unchecked'));
        setCurrentIndex(0);
        setShowCompletionMessage(false);
    }, [exerciseName, exercisePrompts.length]);

    const handleAnswerChange = (value: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentIndex] = value;
        setUserAnswers(newAnswers);

        if (validationStates[currentIndex] !== 'unchecked') {
            const newValidationStates = [...validationStates];
            newValidationStates[currentIndex] = 'unchecked';
            setValidationStates(newValidationStates);
        }
    };
    
    const handleFinalCheck = () => {
        let allCorrect = true;
        const newValidationStates = exercisePrompts.map((prompt, index) => {
            const userAnswer = userAnswers[index]?.trim().toLowerCase().replace(/[.?,]/g, '') || '';
            const correctAnswers = prompt.english.map(a => a.toLowerCase().replace(/[.?]/g, ''));
            const isCorrect = correctAnswers.includes(userAnswer);
            if (!isCorrect) {
                allCorrect = false;
            }
            return isCorrect ? 'correct' : 'incorrect';
        });
        setValidationStates(newValidationStates);

        if (allCorrect) {
            toast({ title: "¡Excelente!", description: "Todas tus respuestas son correctas." });
            setShowCompletionMessage(true);
            onComplete();
        } else {
            toast({ 
                variant: 'destructive', 
                title: "Algunas respuestas son incorrectas", 
                description: "Revisa las bolitas rojas y corrige tus respuestas." 
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (currentIndex < exercisePrompts.length - 1) {
                setCurrentIndex(currentIndex + 1);
            } else {
                handleFinalCheck();
            }
        }
    };
    
    if (showCompletionMessage) {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
                    <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
                    <h2 className="text-3xl font-bold">¡Ejercicio Completado!</h2>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                 <CardDescription>Traduce las frases.</CardDescription>
                <div className="flex items-center justify-start flex-wrap gap-2 pt-4">
                    {exercisePrompts.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center font-bold border-2 transition-all",
                                currentIndex === index ? "border-primary ring-2 ring-primary" : "border-muted-foreground/50",
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
                    <h3 className="text-lg font-semibold mb-2">Frase a traducir:</h3>
                     <div className="bg-muted p-4 rounded-lg border">
                        <p className="text-lg font-medium">{exercisePrompts[currentIndex]?.spanish}</p>
                     </div>
                </div>
                <div>
                    <Input 
                        value={userAnswers[currentIndex] || ''}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className={cn(
                            'text-lg',
                            validationStates[currentIndex] === 'correct' ? 'border-green-500' : 
                            validationStates[currentIndex] === 'incorrect' ? 'border-destructive' : ''
                        )}
                        placeholder="Escribe la traducción aquí..."
                    />
                </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                 <Button onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>
                     <ArrowLeft className="mr-2 h-4 w-4" />
                     Anterior
                 </Button>

                {currentIndex === exercisePrompts.length - 1 ? (
                     <Button onClick={handleFinalCheck}>
                         Verificar Todo
                     </Button>
                ) : (
                     <Button onClick={() => setCurrentIndex(p => Math.min(exercisePrompts.length - 1, p + 1))}>
                         Siguiente
                         <ArrowRight className="ml-2 h-4 w-4" />
                     </Button>
                )}
            </CardFooter>
        </Card>
    );
}
