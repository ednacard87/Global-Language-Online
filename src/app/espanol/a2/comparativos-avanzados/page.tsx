'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense, Fragment } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    GraduationCap, 
    CheckCircle, 
    Loader2, 
    ArrowRight,
    Gamepad2,
    Trophy,
    BookText,
    Pencil,
    Activity,
    ListChecks,
    Scale,
    ShoppingCart,
    Check,
    X,
    Info,
    Split,
    Search,
    MessageSquare,
    Star,
    ArrowLeft
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
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { Textarea } from '@/components/ui/textarea';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_a2_comp_avanzados_v28_stable';
const mainProgressKey = 'progress_a2_es_comparativos_avanzados';

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const shoppingVocab = [
    { en: "SHIRT", es: "CAMISA" }, { en: "DRESS", es: "VESTIDO" }, { en: "SKIRT", es: "FALDA" },
    { en: "SHOES", es: "ZAPATOS" }, { en: "CELLPHONE", es: "CELULAR" }, { en: "SCREEN", es: "PANTALLA" },
    { en: "BATTERY", es: "BATERÍA" }, { en: "SUPERMARKET", es: "SUPERMERCADO" }, { en: "AISLE", es: "PASILLO" },
    { en: "CART", es: "CARRITO" }, { en: "CASHIER", es: "CAJERO" }, { en: "PRICE", es: "PRECIO" },
    { en: "DISCOUNT", es: "DESCUENTO" }, { en: "OFFER", es: "OFERTA" }, { en: "BRAND", es: "MARCA" },
    { en: "QUALITY", es: "CALIDAD" }, { en: "STYLE", es: "ESTILO" }, { en: "EXPENSIVE", es: "CARO" },
    { en: "CHEAP", es: "BARATO" }, { en: "RECEIPT", es: "RECIBO" },
];

const conjugationVerbs = [
    { v: "SPEAK (HABLAR)", forms: ["hablaba", "hablabas", "hablaba", "hablábamos", "hablaban"] },
    { v: "EAT (COMER)", forms: ["comía", "comías", "comía", "comíamos", "comían"] },
    { v: "LIVE (VIVIR)", forms: ["vivía", "vivías", "vivía", "vivíamos", "vivían"] },
    { v: "WORK (TRABAJAR)", forms: ["trabajaba", "trabajabas", "trabajaba", "trabajábamos", "trabajaban"] },
    { v: "STUDY (ESTUDIAR)", forms: ["estudiaba", "estudiabas", "estudiaba", "estudiábamos", "estudiaban"] },
    { v: "RUN (CORRER)", forms: ["corría", "corrías", "corría", "corríamos", "corrían"] },
    { v: "WRITE (ESCRIBIR)", forms: ["escribía", "escribías", "escribía", "escribíamos", "escribían"] },
    { v: "SLEEP (DORMIR)", forms: ["dormía", "dormías", "dormía", "dormíamos", "dormían"] },
    { v: "READ (LEER)", forms: ["leía", "leías", "leía", "leíamos", "leían"] },
    { v: "DO (HACER)", forms: ["hacía", "hacías", "hacía", "hacíamos", "hacían"] },
    { v: "SAY (DECIR)", forms: ["decía", "decías", "decía", "decíamos", "decían"] },
    { v: "GO (IR)", forms: ["iba", "ibas", "iba", "íbamos", "iban"] },
    { v: "SEE (VER)", forms: ["veía", "veías", "veía", "veíamos", "veían"] },
    { v: "HEAR (OIR)", forms: ["oía", "oías", "oía", "oíamos", "oían"] },
    { v: "COME (VENIR)", forms: ["venía", "venías", "venía", "veníamos", "venían"] },
    { v: "THINK (PENSAR)", forms: ["pensaba", "pensabas", "pensaba", "pensábamos", "pensaban"] },
    { v: "PLAY (JUGAR)", forms: ["jugaba", "jugabas", "jugaba", "jugábamos", "jugaban"] },
    { v: "COOK (COCINAR)", forms: ["cocinaba", "cocinabas", "cocinaba", "cocinábamos", "cocinaban"] },
    { v: "SING (CANTAR)", forms: ["cantaba", "cantabas", "cantaba", "cantábamos", "cantaban"] },
    { v: "DANCE (BAILAR)", forms: ["bailaba", "bailabas", "bailaba", "bailábamos", "bailaban"] },
    { v: "DRINK (BEBER)", forms: ["bebía", "bebías", "bebía", "bebíamos", "bebían"] },
    { v: "LEARN (APRENDER)", forms: ["aprendía", "aprendías", "aprendía", "aprendíamos", "aprendían"] },
    { v: "OPEN (ABRIR)", forms: ["abría", "abrías", "abría", "abríamos", "abrían"] },
    { v: "CLOSE (CERRAR)", forms: ["cerraba", "cerrabas", "cerraba", "cerrábamos", "cerraban"] },
    { v: "BRING (TRAER)", forms: ["traía", "traías", "traía", "traíamos", "traían"] },
    { v: "FEEL (SENTIR)", forms: ["sentía", "sentías", "sentía", "sentíamos", "sentían"] },
    { v: "SERVE (SERVIR)", forms: ["servía", "servías", "servía", "servíamos", "servían"] },
    { v: "FOLLOW (SEGUIR)", forms: ["seguía", "seguías", "seguía", "seguíamos", "seguían"] },
    { v: "BUILD (CONSTRUIR)", forms: ["construía", "construías", "construía", "construíamos", "construían"] },
    { v: "DRIVE (CONDUCIR)", forms: ["conducía", "conducías", "conducía", "conducíamos", "conducían"] },
];

const ex1Prompts = [
    { en: "THIS CAR IS BETTER THAN MINE", answer: ["este carro es mejor que el mío", "este coche es mejor que el mío"] },
    { en: "THE NEW CELLPHONE IS MORE EXPENSIVE", answer: ["el celular nuevo es más caro", "el teléfono nuevo es más caro"] },
    { en: "SHE IS TALLER THAN HER SISTER", answer: ["ella es más alta que su hermana"] },
    { en: "THIS SHIRT IS WORSE THAN THE OTHER ONE", answer: ["esta camisa es peor que la otra"] },
    { en: "HE IS OLDER THAN ME", answer: ["él es mayor que yo"] },
    { en: "THE QUALITY IS AS GOOD AS THE BRAND", answer: ["la calidad es tan buena como la marca"] },
    { en: "THIS SUPERMARKET IS BETTER", answer: ["este supermercado es mejor"] },
    { en: "THE DRESS IS LONGER THAN THE SKIRT", answer: ["el vestido es más largo que la falda"] },
    { en: "MY BROTHER IS YOUNGER THAN YOURS", answer: ["mi hermano es menor que el tuyo"] },
    { en: "THAT PRICE IS WORSE", answer: ["ese precio es peor"] },
    { en: "THE APPLE IS AS DELICIOUS AS THE PEAR", answer: ["la manzana es tan deliciosa como la pera"] },
    { en: "THE SHOES ARE AS COMFORTABLE AS THE BOOTS", answer: ["los zapatos son tan cómodos como las botas"] },
];

const ex2Prompts = [
    { en: "THE PRICES ARE HIGHER HERE", answer: ["los precios son más altos aquí"] },
    { en: "I AM BETTER THAN YESTERDAY", answer: ["estoy mejor que ayer", "yo estoy mejor que ayer"] },
    { en: "THE WEATHER IS WORSE TODAY", answer: ["el clima es peor hoy", "el tiempo es peor hoy"] },
    { en: "MY FATHER IS OLDER THAN MY MOTHER", answer: ["mi padre es mayor que mi madre"] },
    { en: "THE STORE IS AS BIG AS THE MALL", answer: ["la tienda es tan grande como el centro comercial"] },
    { en: "THESE CELLPHONES ARE BETTER", answer: ["estos celulares son mejores"] },
    { en: "THE BRAND IS AS FAMOUS AS NIKE", answer: ["la marca es tan famosa como nike"] },
    { en: "SHE IS YOUNGER THAN HER COUSIN", answer: ["ella es menor que su prima"] },
    { en: "THIS RECEIPT IS AS IMPORTANT AS THE CONTRACT", answer: ["este recibo es tan importante como el contrato"] },
    { en: "THE AISLE IS NARROWER THAN THE HALL", answer: ["el pasillo es más estrecho que el pasillo"] },
    { en: "THAT OFFER IS BETTER", answer: ["esa oferta es mejor"] },
    { en: "THE BATTERY IS AS STRONG AS THE NEW ONE", answer: ["la batería es tan fuerte como la nueva"] },
];

const ex3Prompts = [
    { en: "THIS BRAND IS WORSE THAN ADIDAS", answer: ["esta marca es peor que adidas"] },
    { en: "THE SCREEN IS BETTER NOW", answer: ["la pantalla está mejor ahora"] },
    { en: "HE IS AS SMART AS HIS BROTHER", answer: ["él es tan inteligente como su hermano"] },
    { en: "THE DISCOUNTS ARE AS GOOD AS LAST YEAR", answer: ["los descuentos son tan buenos como el año pasado"] },
    { en: "SHE IS THE BEST TEACHER", answer: ["ella es la mejor profesora"] },
    { en: "THIS IS THE WORST MOVIE", answer: ["esta es la peor película"] },
    { en: "MY SON IS AS TALL AS ME", answer: ["mi hijo es tan alto como yo"] },
    { en: "THE SERVICE IS BETTER HERE", answer: ["el servicio es mejor aquí"] },
    { en: "THE COFFEE IS AS HOT AS THE TEA", answer: ["el café está tan caliente como el té"] },
    { en: "THEY ARE AS HAPPY AS US", answer: ["ellos son tan felices como nosotros"] },
    { en: "THIS SHIRT IS CHEAPER", answer: ["esta camisa es más barata"] },
    { en: "THE FRUITS ARE AS FRESH AS THE VEGETABLES", answer: ["las frutas están tan frescas como las verduras"] },
    { en: "THAT CASHIER IS FASTER", answer: ["ese cajero es más rápido"] },
    { en: "THE SHOES FIT AS WELL AS THE BOOTS", answer: ["los zapatos quedan tan bien como las botas"] },
    { en: "THIS IS BETTER THAN NOTHING", answer: ["esto es mejor que nada"] },
];

const readingData = {
    title: "Misión de Lectura: Comparando Tiendas",
    content: "Ayer fui al supermercado nuevo. Es mucho más grande que el supermercado de mi barrio. Los precios son mejores, pero hay demasiada gente. Mi esposa piensa que la calidad de las frutas es tan buena como la de la feria, pero para mí es peor. Yo prefiero comprar en tiendas más pequeñas porque son más tranquilas. Sin embargo, en el supermercado grande la oferta de celulares es mayor y la tecnología es más moderna.",
    questions: [
        { question: "¿Cómo es el supermercado nuevo comparado con el del barrio?", a: ["más grande", "mucho más grande"] },
        { question: "¿Qué piensa la esposa sobre la calidad de las frutas?", a: ["tan buena como la de la feria", "tan buena"] },
        { question: "¿Por qué el narrador prefiere las tiendas pequeñas?", a: ["porque son más tranquilas", "más tranquilas"] },
        { question: "¿Dónde es mayor la oferta de celulares?", a: ["en el supermercado grande", "el supermercado grande"] },
    ]
};

const ex4Options = [
    { text: "ESTE CELULAR ES _______ QUE EL TUYO.", options: ["MEJOR", "MÁS BUENO", "BIEN"], answer: "MEJOR" },
    { text: "MI HERMANA ES _______ QUE YO.", options: ["MAYOR", "MÁS VIEJA", "MÁS GRANDE"], answer: "MAYOR" },
    { text: "EL SERVICIO ES _______ QUE ANTES.", options: ["PEOR", "MÁS MALO", "MALO"], answer: "PEOR" },
    { text: "ESTA MARCA ES _______ CARA COMO LA OTRA.", options: ["TAN", "COMO", "MÁS"], answer: "TAN" },
    { text: "EL PRECIO ES _______ BAJO EN ESTA TIENDA.", options: ["MÁS", "TAN", "MUY"], answer: "MÁS" },
    { text: "LA CALIDAD ES _______ IMPORTANTE QUE EL PRECIO.", options: ["MÁS", "TAN", "COMO"], answer: "MÁS" },
    { text: "SU CASA ES _______ GRANDE COMO LA MÍA.", options: ["TAN", "COMO", "MÁS"], answer: "TAN" },
    { text: "ESTE VESTIDO ES _______ QUE LA FALDA.", options: ["PEOR", "MÁS LARGO", "LARGO"], answer: "MÁS LARGO" },
    { text: "MI HIJO ES _______ QUE TU HIJA.", options: ["MENOR", "MÁS PEQUEÑO", "PEQUEÑO"], answer: "MENOR" },
    { text: "EL CLIMA ESTÁ _______ QUE AYER.", options: ["MEJOR", "BIEN", "MÁS BIEN"], answer: "MEJOR" },
    { text: "ESTA TIENDA ES _______ QUE LA OTRA.", options: ["MEJOR", "MÁS BUENA", "BIEN"], answer: "MEJOR" },
    { text: "MI HERMANO ES _______ QUE YO.", options: ["MAYOR", "MÁS VIEJO", "MÁS GRANDE"], answer: "MAYOR" },
    { text: "EL CLIMA ESTÁ _______ QUE AYER.", options: ["PEOR", "MÁS MALO", "MALO"], answer: "PEOR" },
    { text: "EL CELULAR ES _______ CARO COMO LA TABLET.", options: ["TAN", "COMO", "MÁS"], answer: "TAN" },
    { text: "ESTA FALDA ES _______ QUE EL VESTIDO.", options: ["MENOR", "PEOR", "MÁS CORTA"], answer: "MÁS CORTA" },
    { text: "EL PRECIO ES _______ BAJO DE LO QUE PENSÉ.", options: ["MÁS", "TAN", "MUY"], answer: "MÁS" },
    { text: "EL RESTAURANTE ES _______ CARO COMO EL HOTEL.", options: ["TAN", "COMO", "MÁS"], answer: "TAN" },
    { text: "LA FRUTA ES _______ SALUDABLE QUE EL DULCE.", options: ["MÁS", "TAN", "COMO"], answer: "MÁS" },
    { text: "ESTE CARRITO ES _______ QUE EL OTRO.", options: ["MEJOR", "MÁS BIEN", "BUENO"], answer: "MEJOR" },
    { text: "LA BATERÍA DURA _______ QUE ANTES.", options: ["MÁS", "TAN", "COMO"], answer: "MÁS" },
];

const completarPrompts = [
    { s: "1. Yo (comprar) _______ ropa todos los meses.", a: "compraba" },
    { s: "2. Tú (tener) _______ un celular viejo.", a: "tenías" },
    { s: "3. Él (vivir) _______ cerca del supermercado.", a: "vivía" },
    { s: "4. Nosotros (ser) _______ clientes frecuentes.", a: "éramos" },
    { s: "5. Ellos (ir) _______ de compras los sábados.", a: "iban" },
    { s: "6. Ella (ver) _______ los precios antes de comprar.", a: "veía" },
    { s: "7. Yo (querer) _______ esa marca de zapatos.", a: "quería" },
    { s: "8. Tú (hacer) _______ la lista del mercado.", a: "hacías" },
    { s: "9. Él (pagar) _______ siempre en efectivo.", a: "pagaba" },
    { s: "10. Nosotros (poder) _______ comprar más barato.", a: "podíamos" },
    { s: "11. Yo (saber) _______ dónde estaban las ofertas.", a: "sabía" },
    { s: "12. Ellos (poner) _______ todo en el carrito.", a: "ponían" },
    { s: "13. Ella (salir) _______ temprano para el centro comercial.", a: "salía" },
    { s: "14. Nosotros (venir) _______ a esta tienda a menudo.", a: "veníamos" },
    { s: "15. Tú (decir) _______ que la calidad era mejor.", a: "decías" },
    { s: "16. Yo (dar) _______ propina al cajero.", a: "daba" },
    { s: "17. Ellos (trabajar) _______ en el pasillo 5.", a: "trabajaban" },
    { s: "18. Ella (estudiar) _______ diseño de modas.", a: "estudiaba" },
    { s: "19. Nosotros (llegar) _______ antes de cerrar.", a: "llegábamos" },
    { s: "20. Tú (esperar) _______ el descuento.", a: "esperabas" },
    { s: "21. Yo (correr) _______ para alcanzar la oferta.", a: "corría" },
    { s: "22. Él (beber) _______ jugo en el pasillo.", a: "bebía" },
    { s: "23. Ellos (escribir) _______ los precios en un cuaderno.", a: "escribían" },
    { s: "24. Nosotros (abrir) _______ la tienda a las 8.", a: "abríamos" },
    { s: "25. Tú (cerrar) _______ el trato.", a: "cerrabas" },
    { s: "26. Yo (volver) _______ a casa con muchas bolsas.", a: "volvía" },
    { s: "27. Ella (pedir) _______ rebaja.", a: "pedía" },
    { s: "28. Nosotros (dormir) _______ después de comprar.", a: "dormíamos" },
    { s: "29. Ellos (pensar) _______ en el gasto.", a: "pensaban" },
    { s: "30. Tú (jugar) _______ con los carritos.", a: "jugabas" },
];

const finalExPrompts = [
    { en: "THIS IS NOT BETTER", answer: ["esto no es mejor"] },
    { en: "SHE IS NOT TALLER THAN HIM", answer: ["ella no es más alta que él"] },
    { en: "THE CELLPHONE IS NOT AS EXPENSIVE AS THE LAPTOP", answer: ["el celular no es tan caro como el portátil", "el celular no es tan caro como la computadora"] },
    { en: "WE ARE NOT OLDER THAN THEM", answer: ["nosotros no somos mayores que ellos", "nosotras no somos mayores que ellas"] },
    { en: "THE PRICES ARE NOT BETTER TODAY", answer: ["los precios no son mejores hoy"] },
    { en: "IT IS NOT AS FAR AS YOU THINK", answer: ["no está tan lejos como piensas"] },
    { en: "THE QUALITY IS NOT AS GOOD AS THE STYLE", answer: ["la calidad no es tan buena como el estilo"] },
    { en: "THEY ARE NOT YOUNGER THAN US", answer: ["ellos no son menores que nosotros", "ellas no son menores que nosotras"] },
    { en: "THIS DRESS IS NOT LONGER", answer: ["este vestido no es más largo"] },
    { en: "THAT BRAND IS NOT FAMOUS", answer: ["esa marca no es famosa"] },
    { en: "THE SHOES ARE NOT AS COMFORTABLE", answer: ["los zapatos no son tan cómodos"] },
    { en: "THE OFFER IS NOT BETTER NOW", answer: ["la oferta no es mejor ahora"] },
    { en: "THE SCREEN IS NOT AS BIG", answer: ["la pantalla no es tan grande"] },
    { en: "THE BATTERY IS NOT AS STRONG", answer: ["la batería no es tan fuerte"] },
    { en: "THIS IS NOT THE WORST CHOICE", answer: ["esta no es la peor opción"] },
];

const genericVocab = { "mejor": "better", "peor": "worse", "mayor": "older", "menor": "younger", "tan como": "as... as", "caro": "expensive", "barato": "cheap", "calidad": "quality", "marca": "brand" };

// --- HELPERS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { 
        setCurrentIndex(0);
        setAnswer('');
        setStatus({});
    }, [prompts]);

    useEffect(() => { setAnswer(''); }, [currentIndex]);

    const handleCheck = () => {
        const userVal = answer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const corrects = prompts[currentIndex].answer;
        const isOk = corrects.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
        setStatus(prev => ({ ...prev, [currentIndex]: isOk ? 'correct' : 'incorrect' }));
        if (isOk) toast({ title: "¡Buen trabajo!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start text-left">
                    <div className="w-full">
                        <CardTitle className="text-foreground dark:text-primary uppercase tracking-tight">{title}</CardTitle>
                        <CardDescription className='font-bold text-foreground mt-1'>Traduce la frase al español correctamente.</CardDescription>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0">
                                    <BookText className="mr-2 h-4 w-4" />
                                    Vocabulary
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-foreground text-left">
                                        {Object.entries(vocabulary).map(([en, es]: any) => (
                                            <Fragment key={en}><span className="text-muted-foreground capitalize">{en}:</span><span className="font-semibold text-right">{es}</span></Fragment>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">{prompts[currentIndex].en}</div>
                <Input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-12 text-lg text-foreground", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/10' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="Tu traducción al español..." autoComplete="off" />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck} variant="secondary">Verificar</Button>
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={status[currentIndex] !== 'correct'} className="text-white font-bold">{currentIndex === prompts.length - 1 ? 'Finalizar' : 'Siguiente'}</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const ChoiceExercise = ({ prompts, onComplete, title }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    const handleSelect = (option: string) => {
        const isCorrect = option.toUpperCase() === prompts[currentIndex].answer.toUpperCase();
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Correcto!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const handleNext = () => {
        if (currentIndex < prompts.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription className='font-bold text-foreground mt-1'>Elige la opción correcta.</CardDescription>
                    <div className="flex gap-2 justify-start flex-wrap pt-4">
                        {prompts.map((_: any, i: number) => (
                            <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>
                                {i + 1}
                            </div>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-8 py-10">
                <div className="text-2xl font-bold text-center leading-relaxed">
                    {prompts[currentIndex].text.split('_______').map((part: string, i: number) => (
                        <React.Fragment key={i}>
                            {part}
                            {i < prompts[currentIndex].text.split('_______').length - 1 && (
                                <span className="text-primary border-b-2 border-dashed border-primary px-4 mx-2">
                                    {status[currentIndex] === 'correct' ? prompts[currentIndex].answer : '...'}
                                </span>
                            )}
                        </React.Fragment>
                    ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    {prompts[currentIndex].options.map((opt: string) => (
                        <Button 
                            key={opt} 
                            onClick={() => handleSelect(opt)} 
                            variant="outline" 
                            className={cn(
                                "h-16 text-xl font-black uppercase",
                                status[currentIndex] === 'correct' && opt === prompts[currentIndex].answer && "border-green-500 bg-green-50 text-green-700 shadow-md scale-105",
                                status[currentIndex] === 'incorrect' && opt !== prompts[currentIndex].answer && "border-red-500 bg-red-50 text-red-700"
                            )}
                        >
                            {opt}
                        </Button>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <Button onClick={handleNext} disabled={status[currentIndex] !== 'correct'} className="px-12 font-bold h-12">Siguiente</Button>
            </CardFooter>
        </Card>
    );
};

// --- MAIN CLASS COMPONENT ---

function ComparativosAvanzadosContentInternal({ overrideStudentId }: { overrideStudentId?: string | null }) {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const searchParams = useSearchParams();

    const targetStudentId = overrideStudentId || searchParams.get('studentId');
    const currentUID = targetStudentId || user?.uid;

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    
    const hasInitialized = useRef(false);
    const lastSerializedRef = useRef<string>('');

    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(shoppingVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(shoppingVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const [conjIdx, setConjIdx] = useState(0);
    const [conjAnswers, setConjAnswers] = useState<string[]>(Array(5).fill(''));
    const [conjValidation, setConjValidation] = useState<any[]>(Array(5).fill('unchecked'));

    const [compAns, setCompAns] = useState<string[]>(Array(completarPrompts.length).fill(''));
    const [compVal, setCompVal] = useState<any[]>(Array(completarPrompts.length).fill('unchecked'));

    const [readAns, setReadAns] = useState<Record<number, string>>({});
    const [readVal, setReadVal] = useState<Record<number, any>>({});
    const [transText, setTransText] = useState('');

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any, name?: string}>(studentDocRef);
    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialPathData = useMemo((): Topic[] => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: ShoppingCart, status: 'active' },
        { key: 'grammar', name: '2. Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'conjugation', name: '3. Conjugación', icon: Pencil, status: 'locked' },
        { key: 'exercise_1', name: '4. Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'exercise_2', name: '5. Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'exercise_3', name: '7. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: '8. Lectura', icon: BookText, status: 'locked' },
        { key: 'exercise_4', name: '9. Ejercicio 4', icon: ListChecks, status: 'locked' },
        { key: 'completar', name: '10. Completar', icon: Trophy, status: 'locked' },
        { key: 'translate_text', name: '11. Traducir Texto', icon: MessageSquare, status: 'locked' },
        { key: 'final', name: '12. Final', icon: CheckCircle, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
        let path = initialPathData.map((topic, i) => ({ ...topic, status: i === 0 ? 'active' : 'locked' as any }));
        const d = studentProfile.lessonProgress?.[progressStorageVersion] || {};
        if (isAdmin && !targetStudentId) path.forEach(t => t.status = 'completed');
        else {
            path.forEach(t => { if (d[t.key]) t.status = d[t.key]; });
            let last = true;
            for (let i = 0; i < path.length; i++) { if (last && path[i].status === 'locked') path[i].status = 'active'; last = path[i].status === 'completed'; }
        }
        setLearningPath(path); setSelectedTopic(d.lastSelectedTopic || path.find(it => it.status === 'active')?.key || path[0].key);
        if (d.vocabAnswers) setVocabAnswers(d.vocabAnswers);
        if (d.compAns) setCompAns(d.compAns);
        if (d.transText) setTransText(d.transText);
        setInitialLoadComplete(true); setIsInitialLoading(false);
    }, [isAdmin, initialPathData, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete, targetStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    const handleTopicComplete = useCallback((completedKey: string) => { setTopicToComplete(completedKey); }, []);

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') { 
            toast({ variant: "destructive", title: "Contenido Bloqueado" }); 
            return; 
        }
        setSelectedTopic(topicKey);
        if (['grammar'].includes(topicKey)) handleTopicComplete(topicKey);
    };

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || targetStudentId) return;
        const s: any = { lastSelectedTopic: selectedTopic, vocabAnswers, compAns, transText };
        learningPath.forEach(t => s[t.key] = t.status);
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, initialLoadComplete, targetStudentId, vocabAnswers, compAns, transText]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(curr => {
            let next: string | null = null; const np = [...curr];
            const i = np.findIndex(t => t.key === topicToComplete);
            if (i !== -1 && np[i].status !== 'completed') {
                np[i].status = 'completed';
                if (i + 1 < np.length && np[i + 1].status === 'locked') { np[i + 1].status = 'active'; next = np[i + 1].key; }
            }
            if (next) { const n = next; setTimeout(() => { toast({ title: "¡Misión completada!" }); setSelectedTopic(n); }, 0); }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleCheckVocab = () => {
        let allOk = true;
        const nv = shoppingVocab.map((v, i) => {
            const res = v.es.toUpperCase() === (vocabAnswers[i] || '').trim().toUpperCase();
            if (!res) allOk = false;
            return res ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv);
        if (allOk) { setCanAdvanceVocab(true); toast({ title: "¡Excelente!", description: "Has desbloqueado la gramática." }); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const handleConjCheck = () => {
        const verb = conjugationVerbs[conjIdx];
        const nv = conjAnswers.map((a, i) => a.trim().toLowerCase() === verb.forms[i] ? 'correct' : 'incorrect');
        setConjValidation(nv);
        if (nv.every(st => st === 'correct')) { 
            toast({ title: "¡Perfecto!" }); 
            if (conjIdx < conjugationVerbs.length - 1) { 
                setTimeout(() => { setConjIdx(p => p+1); setConjAnswers(Array(5).fill('')); setConjValidation(Array(5).fill('unchecked')); }, 800); 
            } else handleTopicComplete('conjugation'); 
        }
        else toast({ variant: 'destructive', title: "Revisa la conjugación" });
    };

    const handleCheckReading = () => {
        let allOk = true; const nv: any = {};
        readingData.questions.forEach((q, i) => { 
            const ok = q.a.some(a => (readAns[i] || '').trim().toLowerCase().includes(a.toLowerCase())); 
            nv[i] = ok ? 'correct' : 'incorrect'; if (!ok) allOk = false; 
        });
        setReadVal(nv); if (allOk) { toast({ title: "¡Lectura superada!" }); handleTopicComplete('reading'); } else toast({ variant: 'destructive', title: "Revisa las respuestas" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-foreground dark:text-primary uppercase tracking-tighter'>Vocabulary: Shopping & Brands (20)</CardTitle></CardHeader>
                        <CardContent><ScrollArea className="h-[500px] pr-4"><div className="grid grid-cols-2 gap-4">
                            <div className="font-black text-primary border-b pb-2 uppercase text-xs">Inglés</div><div className="font-black text-primary border-b pb-2 uppercase text-xs">Español</div>
                            {shoppingVocab.map((v, i) => (
                                <Fragment key={i}>
                                    <div className="p-3 border rounded bg-white/5 font-bold text-sm uppercase text-foreground">{v.en}</div>
                                    <Input value={vocabAnswers[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const nv = [...vocabValidation]; nv[i] = 'unchecked'; setVocabValidation(nv); setCanAdvanceVocab(false); }} className={cn("uppercase text-foreground", vocabValidation[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} readOnly={!!targetStudentId} autoComplete="off" />
                                </Fragment>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-between border-t pt-6">
                            <Button onClick={handleCheckVocab} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-8 text-left text-foreground overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Comparativos Avanzados</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0 font-bold text-foreground">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4 text-foreground">
                                <h3 className="text-xl font-black text-primary uppercase mb-2">Comparativos Irregulares</h3>
                                <p className='text-lg'>Hay adjetivos que no usan "más" o "menos", sino formas únicas.</p>
                                <div className='grid grid-cols-2 gap-4 text-center'>
                                    <div className='p-4 bg-muted rounded-xl'><p className='text-xs text-muted-foreground'>Bueno &rarr;</p><p className='text-xl font-black text-green-600'>MEJOR</p></div>
                                    <div className='p-4 bg-muted rounded-xl'><p className='text-xs text-muted-foreground'>Malo &rarr;</p><p className='text-xl font-black text-red-600'>PEOR</p></div>
                                    <div className='p-4 bg-muted rounded-xl'><p className='text-xs text-muted-foreground'>Grande &rarr;</p><p className='text-xl font-black text-blue-600'>MAYOR (Edad/Importancia)</p></div>
                                    <div className='p-4 bg-muted rounded-xl'><p className='text-xs text-muted-foreground'>Pequeño &rarr;</p><p className='text-xl font-black text-orange-600'>MENOR (Edad/Importancia)</p></div>
                                </div>
                            </div>
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4 text-foreground">
                                <h3 className="text-xl font-black text-primary uppercase mb-2">Comparación de Igualdad</h3>
                                <div className='bg-primary/10 p-4 rounded-xl border-2 border-primary text-center font-mono text-xl text-primary'>TAN + ADJETIVO + COMO</div>
                                <p className="italic text-muted-foreground text-center">"Él es tan alto como su padre"</p>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'conjugation':
                const v = conjugationVerbs[conjIdx];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tighter'>Misión: Pasado Imperfecto ({conjIdx+1}/30)</CardTitle><CardDescription className='text-foreground font-bold'>Conjuga el verbo en la forma Imperfecto en pasado.</CardDescription></CardHeader>
                        <CardContent className="space-y-8 pt-8 flex flex-col items-center">
                            <div className="p-8 bg-gradient-to-br from-primary/5 to-brand-purple/5 rounded-[2.5rem] border-2 border-dashed border-primary/20 text-center text-foreground"><h3 className="text-5xl font-black text-primary uppercase tracking-tighter">{v.v}</h3></div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl text-foreground'>
                                {["YO", "TÚ", "ÉL/ELLA", "NOSOTROS", "ELLOS"].map((p, i) => (
                                    <div key={i} className='space-y-1'><Label className='text-[10px] font-black uppercase text-muted-foreground'>{p}</Label><Input value={conjAnswers[i]} onChange={e => { if (targetStudentId) return; const na = [...conjAnswers]; na[i] = e.target.value; setConjAnswers(na); const nv = [...conjValidation]; nv[i] = 'unchecked'; setConjValidation(nv); }} className={cn("h-10 text-lg uppercase transition-all text-foreground", conjValidation[i] === 'correct' ? 'border-green-500 bg-green-50/10' : conjValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-8 bg-muted/5"><Button onClick={handleConjCheck} size="lg" className="px-20 font-black h-14 text-xl shadow-xl uppercase">Verificar Verbo</Button></CardFooter>
                    </Card>
                );
            case 'exercise_1': return <BallsExercise key="ex1" title="Ejercicio 1" prompts={ex1Prompts} onComplete={() => handleTopicComplete('exercise_1')} vocabulary={genericVocab} />;
            case 'exercise_2': return <BallsExercise key="ex2" title="Ejercicio 2" prompts={ex2Prompts} onComplete={() => handleTopicComplete('exercise_2')} vocabulary={genericVocab} />;
            case 'vocab_game': return <VocabularyMatchingGame data={shoppingVocab.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Memory Game: Shopping" />;
            case 'exercise_3': return <BallsExercise key="ex3" title="Ejercicio 3" prompts={ex3Prompts} onComplete={() => handleTopicComplete('exercise_3')} vocabulary={genericVocab} />;
            case 'reading':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='uppercase text-primary font-black'>{readingData.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-inner">{readingData.content}</div>
                            <Separator /><div className="space-y-4 text-foreground">{readingData.questions.map((q, i) => (
                                <div key={i} className="space-y-2"><Label className='font-bold text-foreground'>{i+1}. {q.question}</Label><Input value={readAns[i] || ''} onChange={e => { if (targetStudentId) return; setReadAns({...readAns, [i]: e.target.value}); setReadVal({...readVal, [i]: 'unchecked'}); }} className={cn('mt-1 text-lg h-12 text-foreground', readVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                            ))}</div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={handleCheckReading} size="lg" className="px-16 font-bold" disabled={!!targetStudentId}>Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'exercise_4': return <ChoiceExercise key="ex4" prompts={ex4Options} onComplete={() => handleTopicComplete('exercise_4')} title="Ejercicio 4: Opciones" />;
            case 'completar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary uppercase tracking-tighter'>Completar: Pasado Imperfecto (30)</CardTitle></CardHeader>
                        <CardContent className="p-0"><ScrollArea className="h-[500px] p-6"><div className="space-y-4">
                            {completarPrompts.map((q, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm">
                                    <p className="font-bold text-lg text-foreground">{q.s}</p>
                                    <Input value={compAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...compAns]; na[i] = e.target.value; setCompAns(na); const nv = [...compVal]; nv[i] = 'unchecked'; setCompVal(nv); }} className={cn("h-10 max-w-sm text-lg font-mono uppercase text-foreground", compVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : compVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="Respuesta..." autoComplete="off" readOnly={!!targetStudentId} />
                                </div>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/20"><Button onClick={() => {
                            let all = true; const nv = completarPrompts.map((q, i) => { const res = q.a.toLowerCase() === (compAns[i] || '').trim().toLowerCase(); if (!res) all = false; return res ? 'correct' : 'incorrect'; });
                            setCompVal(nv); if (all) { toast({ title: "¡Dominio Total!" }); handleTopicComplete('completar'); } else toast({ variant: 'destructive', title: "Hay errores en la lista" });
                        }} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Verificar Todo</Button></CardFooter>
                    </Card>
                );
            case 'translate_text':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><div className="flex justify-between items-start"><div><CardTitle className='text-primary uppercase'>Traducción de Texto</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el párrafo al español.</CardDescription></div><Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger><PopoverContent className="w-64"><ScrollArea className="h-48 pr-4 text-foreground"><div className="grid grid-cols-2 gap-2 text-sm">{Object.entries({"better": "mejor", "worse": "peor", "brand": "marca", "quality": "calidad", "cheaper": "más barato", "as as": "tan... como"}).map(([en, es], i) => (<div key={i} className="flex justify-between text-xs border-b pb-1"><span className="text-muted-foreground">{en}:</span><span className="font-bold text-primary">{es}</span></div>))}</div></ScrollArea></PopoverContent></Popover></div></CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-sm">"I love shopping at the mall. Some people think that the new brand is better than the old one, but the quality is actually worse. I prefer the cheaper stores because they are as interesting as the luxury ones. Yesterday, I bought a new dress that was better than the one I saw last week."</div>
                            <Separator />
                            <div className="space-y-2">
                                <Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label>
                                <Textarea 
                                    value={transText} 
                                    onChange={(e) => { if (targetStudentId) return; setTransText(e.target.value); }} 
                                    placeholder="Escribe el texto en español aquí..." 
                                    className="min-h-[250px] text-lg text-foreground leading-relaxed p-4" 
                                    readOnly={!!targetStudentId} 
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20"><Button onClick={() => handleTopicComplete('translate_text')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Continuar <ArrowRight className='ml-3 h-8 w-8' /></Button></CardFooter>
                    </Card>
                );
            case 'final': return <BallsExercise key="final" title="Reto Final: Traducción Negativa" prompts={finalExPrompts} onComplete={() => handleTopicComplete('final')} vocabulary={{"portátil": "laptop", "computadora": "computer", "precio": "price"}} />;
            default: return null;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {targetStudentId && isAdmin && (
                        <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md">
                            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400"><Star className="h-6 w-6 fill-current animate-pulse" /><p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión: {studentProfile?.name || targetStudentId}</p></div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors"><Link href="/admin">Cerrar</Link></Button>
                        </div>
                    )}
                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/a2" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver al Curso A2</Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3"><Scale className='h-10 w-10 text-primary' /> Comparativos Avanzados 🇪🇸</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        <div className="md:col-span-9 md:order-1 order-2">
                            <Suspense fallback={<div className="flex items-center justify-center p-20"><Loader2 className="animate-spin h-10 w-10" /></div>}>
                                {renderContent()}
                            </Suspense>
                        </div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30 text-left"><CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Misión 12A</CardTitle></CardHeader>
                                <CardContent className="p-4">
                                    <nav><ul className="space-y-1">
                                        {learningPath.map((item) => {
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            const isSelected = selectedTopic === item.key;
                                            const Icon = ICONS_CONFIG[item.status as keyof typeof ICONS_CONFIG] || BookOpen;
                                            return (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', isSelected && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm')}>
                                                    <div className="flex items-center gap-3">{item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}<span className="truncate max-w-[150px] uppercase font-bold text-[10px]">{item.name}</span></div>
                                                    {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                                </li>
                                            );
                                        })}
                                    </ul></nav>
                                    <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 font-black uppercase text-muted-foreground"><span>Avance Total</span><span className="text-primary">{progressValue}%</span></div><Progress value={progressValue} className="h-2" /></div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function ComparativosAvanzadosPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}>
            <ComparativosAvanzadosContentInternal />
        </Suspense>
    );
}