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
    Star,
    ArrowLeft,
    Check,
    X,
    Info,
    ListChecks,
    Factory,
    MessageSquare
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
const progressStorageVersion = 'progress_es_b1_voz_pasiva_v20_final_participio';
const mainProgressKey = 'progress_b1_es_voz_pasiva';

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const passiveVocabData = [
    { en: "NEWS", es: "NOTICIA" }, { en: "NEWSPAPER", es: "PERIÓDICO" }, { en: "ARTICLE", es: "ARTÍCULO" },
    { en: "TELEVISION", es: "TELEVISIÓN" }, { en: "INFORMATION", es: "INFORMACIÓN" }, { en: "DISCOVERY", es: "DESCUBRIMIENTO" },
    { en: "INVENTION", es: "INVENTO" }, { en: "PRODUCT", es: "PRODUCTO" }, { en: "BUILDING", es: "EDIFICIO" },
    { en: "BRIDGE", es: "PUENTE" }, { en: "MUSEUM", es: "MUSEO" }, { en: "COMPANY", es: "EMPRESA" },
    { en: "GOVERNMENT", es: "GOBIERNO" }, { en: "SCIENTIST", es: "CIENTÍFICO" }, { en: "WRITER", es: "ESCRITOR" },
    { en: "ARTIST", es: "ARTISTA" }, { en: "TO BUILD", es: "CONSTRUIR" }, { en: "TO DISCOVER", es: "DESCUBRIR" },
    { en: "TO INVENT", es: "INVENTAR" }, { en: "TO PUBLISH", es: "PUBLICAR" }, { en: "TO PRODUCE", es: "PRODUCIR" },
    { en: "TO MANUFACTURE", es: "FABRICAR" }, { en: "TO CREATE", es: "CREAR" }, { en: "TO INAUGURAR", es: "INAUGURAR" },
    { en: "TO ORGANIZE", es: "ORGANIZAR" }, { en: "TO WRITE", es: "ESCRIBIR" }, { en: "TO PRESENT", es: "PRESENTAR" },
    { en: "TO DEVELOP", es: "DESARROLLAR" }, { en: "TO DESIGN", es: "DISEÑAR" }
];

const participleVerbs = [
    { v: "CONSTRUIR", en: "BUILD", participle: "construido" },
    { v: "CREAR", en: "CREATE", participle: "creado" },
    { v: "INVENTAR", en: "INVENT", participle: "inventado" },
    { v: "DESCUBRIR", en: "DISCOVER", participle: "descubierto" },
    { v: "PRODUCIR", en: "PRODUCE", participle: "producido" },
    { v: "PUBLICAR", en: "PUBLISH", participle: "publicado" },
    { v: "ESCRIBIR", en: "WRITE", participle: "escrito" },
    { v: "FABRICAR", en: "MANUFACTURE", participle: "fabricado" },
    { v: "ORGANIZAR", en: "ORGANIZE", participle: "organizado" },
    { v: "PRESENTAR", en: "PRESENT", participle: "presentado" },
    { v: "INAUGURAR", en: "INAUGURATE", participle: "inaugurado" },
    { v: "DESARROLLAR", en: "DEVELOP", participle: "desarrollado" },
    { v: "DISEÑAR", en: "DESIGN", participle: "diseñado" },
    { v: "LEER", en: "READ", participle: "leído" },
    { v: "VER", en: "SEE", participle: "visto" },
    { v: "HACER", en: "DO", participle: "hecho" },
    { v: "ABRIR", en: "OPEN", participle: "abierto" },
    { v: "CERRAR", en: "CLOSE", participle: "cerrado" },
    { v: "ROMPER", en: "BREAK", participle: "roto" },
    { v: "DECIR", en: "SAY", participle: "dicho" },
    { v: "PONER", en: "PUT", participle: "puesto" },
    { v: "TRAER", en: "BRING", participle: "traído" },
    { v: "LLEVAR", en: "TAKE", participle: "llevado" },
    { v: "COMPRAR", en: "BUY", participle: "comprado" },
    { v: "VENDER", en: "SELL", participle: "vendido" },
    { v: "CANTAR", en: "SING", participle: "cantado" },
    { v: "PINTAR", en: "PAINT", participle: "pintado" },
    { v: "REPARAR", en: "REPAIR", participle: "reparado" },
    { v: "ENTREGAR", en: "DELIVER", participle: "entregado" },
    { v: "LIMPIAR", en: "CLEAN", participle: "limpiado" },
];

const ex1Prompts = [
    { spanish: "Los científicos descubrieron una nueva especie.", answer: ["una nueva especie fue descubierta por los científicos"] },
    { spanish: "Edison inventó la bombilla.", answer: ["la bombilla fue inventada por edison"] },
    { spanish: "El gobierno construyó el puente.", answer: ["el puente fue construido por el gobierno"] },
    { spanish: "La empresa fabrica los productos.", answer: ["los productos son fabricados por la empresa"] },
    { spanish: "El artista creó la escultura.", answer: ["la escultura fue creada por el artista"] },
    { spanish: "Cervantes escribió El Quijote.", answer: ["el quijote fue escrito por cervantes"] },
    { spanish: "La editorial publicó el libro.", answer: ["el libro fue publicado por la editorial"] },
    { spanish: "Los obreros reparan la calle.", answer: ["la calle es reparada por los obreros"] },
    { spanish: "El panadero fabrica el pan.", answer: ["el pan es fabricado por el panadero"] },
    { spanish: "El arquitecto diseñó el hotel.", answer: ["el hotel fue diseñado por el arquitecto"] },
    { spanish: "El gobierno inauguró el museo.", answer: ["el museo fue inaugurado por el gobierno"] },
    { spanish: "La tecnología mejora la vida.", answer: ["la vida es mejorada por la tecnología"] },
    { spanish: "Los niños rompen el juguete.", answer: ["el juguete es roto por los niños"] },
    { spanish: "El fuego destruyó el bosque.", answer: ["el bosque fue destruido por el fuego"] },
    { spanish: "Ella prepara la cena.", answer: ["la cena es preparada por ella"] },
];

const ex1Vocab = { "científicos": "scientists", "especie": "species", "descubrir": "discover", "bombilla": "light bulb", "puente": "bridge", "obreros": "workers", "editorial": "publisher", "mejorar": "improve" };

const ex2Prompts = [
    { spanish: "El libro fue escrito por Gabriel García Márquez.", answer: ["gabriel garcía márquez escribió el libro"] },
    { spanish: "La vacuna fue desarrollada por los científicos.", answer: ["los científicos desarrollaron la vacuna"] },
    { spanish: "El edificio fue construido en 1980.", answer: ["construyeron el edificio en 1980", "alguien construyó el edificio en 1980"] },
    { spanish: "La noticia es publicada por el periódico.", answer: ["el periódico publica la noticia"] },
    { spanish: "El pastel fue hecho por mi abuela.", answer: ["mi abuela hizo el pastel"] },
    { spanish: "Las canciones son cantadas por el coro.", answer: ["el coro canta las canciones"] },
    { spanish: "El puente será inaugurado por el presidente.", answer: ["el presidente inaugurará el puente"] },
    { spanish: "Los exámenes fueron corregidos por el profesor.", answer: ["el profesor corrigió los exámenes"] },
    { spanish: "La puerta fue abierta por el viento.", answer: ["el viento abrió la puerta"] },
    { spanish: "Las flores son vendidas por la mujer.", answer: ["la mujer vende las flores"] },
    { spanish: "El carro fue reparado por el mecánico.", answer: ["el mecánico reparó el carro"] },
    { spanish: "La película fue filmada en Colombia.", answer: ["filmaron la película en colombia"] },
    { spanish: "El secreto fue descubierto por nosotros.", answer: ["nosotros descubrimos el secreto"] },
    { spanish: "La casa fue diseñada por un arquitecto famoso.", answer: ["un arquitecto famoso diseñó la casa"] },
    { spanish: "El informe fue escrito por el administrador.", answer: ["el administrador escribió el informe"] },
];

const ex2Vocab = { "vacuna": "vaccine", "desarrollar": "develop", "coro": "choir", "viento": "wind", "secreto": "secret", "informe": "report" };

const ex3Options = [
    { q: "La película fue _______ en Colombia.", options: ["FILMADO", "FILMADA", "FILMARON"], answer: "FILMADA" },
    { q: "Los puentes fueron _______ por ingenieros.", options: ["CONSTRUIDO", "CONSTRUIDOS", "CONSTRUIDA"], answer: "CONSTRUIDOS" },
    { q: "La noticia fue _______ esta mañana.", options: ["PUBLICADO", "PUBLICADOS", "PUBLICADA"], answer: "PUBLICADA" },
    { q: "Las casas serán _______ el próximo mes.", options: ["VENDIDAS", "VENDIDOS", "VENDIDA"], answer: "VENDIDAS" },
    { q: "El invento fue _______ por un joven.", options: ["CREADA", "CREADO", "CREADOS"], answer: "CREADO" },
    { q: "La novela fue _______ por un gran escritor.", options: ["ESCRIBIDO", "ESCRITA", "ESCRITO"], answer: "ESCRITA" },
    { q: "Las galletas fueron _______ por los niños.", options: ["COMIDO", "COMIDA", "COMIDAS"], answer: "COMIDAS" },
    { q: "El edificio fue _______ en 1990.", options: ["CONSTRUIDA", "CONSTRUIDO", "CONSTRUIDOS"], answer: "CONSTRUIDO" },
    { q: "Las cartas fueron _______ ayer.", options: ["ENVIADAS", "ENVIADO", "ENVIADOS"], answer: "ENVIADAS" },
    { q: "El puente fue _______ por el gobierno.", options: ["INAUGURADO", "INAUGURADA", "INAUGURADAS"], answer: "INAUGURADO" },
    { q: "Los productos son _______ en esta fábrica.", options: ["FABRICADO", "FABRICADOS", "FABRICADA"], answer: "FABRICADOS" },
    { q: "La especie fue _______ por científicos.", options: ["DESCUBIERTO", "DESCUBIERTA", "DESCUBIERTOS"], answer: "DESCUBIERTA" },
    { q: "El arte es _______ por personas creativas.", options: ["CREADO", "CREADOS", "CREADA"], answer: "CREADO" },
    { q: "Las vacunas son _______ en laboratorios.", options: ["PRODUCIDO", "PRODUCIDAS", "PRODUCIDAS"], answer: "PRODUCIDAS" },
    { q: "La calle fue _______ por los obreros.", options: ["REPARADO", "REPARADA", "REPARADAS"], answer: "REPARADA" },
    { q: "Los libros son _______ cada año.", options: ["PUBLICADO", "PUBLICADOS", "PUBLICADA"], answer: "PUBLICADOS" },
    { q: "La medalla fue _______ por el atleta.", options: ["GANADA", "GANADO", "GANADOS"], answer: "GANADA" },
    { q: "El café es _______ caliente.", options: ["SERVIDO", "SERVIDA", "SERVIDA"], answer: "SERVIDO" },
    { q: "Las llaves fueron _______ en la mesa.", options: ["ENCONTRADA", "ENCONTRADAS", "ENCONTRADOS"], answer: "ENCONTRADAS" },
    { q: "El secreto fue _______ finalmente.", options: ["REVELADO", "REVELADA", "REVELADOS"], answer: "REVELADO" },
];

const ex4Prompts = [
    { s: "Las casas fueron (construir) _______.", a: "construidas" },
    { s: "El edificio fue (construir) _______.", a: "construido" },
    { s: "La carta fue (escribir) _______.", a: "escrita" },
    { s: "Los libros fueron (escribir) _______.", a: "escritos" },
    { s: "La zona fue (limpiar) _______.", a: "limpiada" },
    { s: "Los platos fueron (lavar) _______.", a: "lavados" },
    { s: "La noticia fue (publicar) _______.", a: "publicada" },
    { s: "Los resultados fueron (publicar) _______.", a: "publicados" },
    { s: "La ventana fue (abrir) _______.", a: "abierta" },
    { s: "Las puertas fueron (abrir) _______.", a: "abiertas" },
    { s: "El puente fue (diseñar) _______.", a: "diseñado" },
    { s: "Las casas fueron (diseñar) _______.", a: "diseñadas" },
    { s: "La canción fue (cantar) _______.", a: "cantada" },
    { s: "Los himnos fueron (cantar) _______.", a: "cantados" },
    { s: "La verdad fue (decir) _______.", a: "dicha" },
];

const completarPrompts = [
    { s: "1. El poema (escribir) _______ por Neruda.", a: "fue escrito" },
    { s: "2. Las galletas (comer) _______ por los niños.", a: "fueron comidas" },
    { s: "3. La tienda (abrir) _______ a las 8 a.m.", a: "es abierta" },
    { s: "4. Los criminales (capturar) _______ ayer.", a: "fueron capturados" },
    { s: "5. La canción (cantar) _______ por el coro.", a: "fue cantada" },
    { s: "6. El puente (construir) _______ el año pasado.", a: "fue construido" },
    { s: "7. Los libros (publicar) _______ hoy.", a: "son publicados" },
    { s: "8. La especie (descubrir) _______ recientemente.", a: "fue descubierta" },
    { s: "9. Los productos (fabricar) _______ en China.", a: "son fabricados" },
    { s: "10. La calle (limpiar) _______ anoche.", a: "fue limpiada" },
    { s: "11. El regalo (comprar) _______ por mi padre.", a: "fue comprado" },
    { s: "12. Las fotos (tomar) _______ por un profesional.", a: "fueron tomadas" },
    { s: "13. El secreto (guardar) _______ por años.", a: "fue guardado" },
    { s: "14. La noticia (conocer) _______ por todos.", a: "fue conocida" },
    { s: "15. Los árboles (plantar) _______ en el parque.", a: "fueron plantados" },
    { s: "16. El tesoro (encontrar) _______ en la selva.", a: "fue encontrado" },
    { s: "17. La medalla (ganar) _______ por el equipo.", a: "fue ganada" },
    { s: "18. El café (servir) _______ ahora.", a: "es servido" },
    { s: "19. Los platos (lavar) _______ después de cenar.", a: "son lavados" },
    { s: "20. La casa (diseñar) _______ por él.", a: "fue diseñada" },
    { s: "21. Los edificios (destruir) _______ por el terremoto.", a: "fueron destruidos" },
    { s: "22. La carta (enviar) _______ ayer.", a: "fue enviada" },
    { s: "23. El hotel (inaugurar) _______ el próximo mes.", a: "será inaugurado" },
    { s: "24. El curso (organizar) _______ por la empresa.", a: "fue organizado" },
    { s: "25. La ley (aprobar) _______ por el congreso.", a: "fue aprobada" },
    { s: "26. Los niños (educar) _______ en casa.", a: "son educados" },
    { s: "27. El auto (reparar) _______ rápidamente.", a: "fue reparado" },
    { s: "28. La cena (cocinar) _______ por el chef.", a: "fue cocinada" },
    { s: "29. Las flores (regalar) _______ a la madre.", a: "fueron regaladas" },
    { s: "30. El problema (resolver) _______ finalmente.", a: "fue resuelto" },
];

const readingContent = {
    title: "El Gran Museo de Inventos",
    content: "El nuevo museo de la ciudad fue inaugurado ayer por el alcalde. El edificio fue diseñado por un arquitecto famoso. En el interior, muchos inventos históricos son exhibidos. La bombilla fue inventada por Edison y los primeros aviones fueron construidos por los hermanos Wright. Los boletos son vendidos en la entrada y cada visita es organizada por guías expertos. La historia no será olvidada gracias a este lugar.",
    questions: [
        { id: 'q1', q: "¿Cuándo fue inaugurado el museo?", a: ["ayer"] },
        { id: 'q2', q: "¿Por quién fue diseñado el edificio?", a: ["un arquitecto famoso"] },
        { id: 'q3', q: "¿Qué fue inventado por Edison?", a: ["la bombilla"] },
        { id: 'q4', q: "¿Quiénes construyeron los primeros aviones?", a: ["los hermanos wright"] },
        { id: 'q5', q: "¿Dónde son vendidos los boletos?", a: ["en la entrada"] }
    ]
};

const readingVocab = { "museo": "museum", "inaugurado": "inaugurated", "alcalde": "mayor", "diseñado": "designed", "exhibidos": "exhibited", "boletos": "tickets", "olvidada": "forgotten" };

const finalExPrompts = [
    { info: "1995 / construir / puente / gobierno", answer: ["el puente fue construido por el gobierno en 1995"] },
    { info: "2020 / descubrir / vacuna / científicos", answer: ["la vacuna fue descubierta por los científicos en 2020"] },
    { info: "mañana / inaugurar / hospital / presidente", answer: ["el hospital será inaugurado por el presidente mañana"] },
    { info: "ayer / publicar / artículo / periodista", answer: ["el artículo fue publicado por el periodista ayer"] },
    { info: "siempre / fabricar / coches / empresa", answer: ["los coches son fabricados por la empresa siempre"] },
    { info: "2010 / crear / escultura / artista", answer: ["la escultura fue creada por el artista en 2010"] },
    { info: "lunes / organizar / evento / equipo", answer: ["el evento será organizado por el equipo el lunes"] },
    { info: "hace un año / publicar / libro / editorial", answer: ["el libro fue publicado por la editorial hace un año"] },
    { info: "anoche / reparar / calle / obreros", answer: ["la calle fue reparada por los obreros anoche"] },
    { info: "hoy / limpiar / casa / nosotros", answer: ["la casa es limpiada por nosotros hoy"] },
    { info: "mañana / enviar / carta / correo", answer: ["la carta será enviada por el correo mañana"] },
    { info: "2023 / desarrollar / sistema / ingenieros", answer: ["el sistema fue desarrollado por los ingenieros en 2023"] },
    { info: "siempre / proteger / naturaleza / gobierno", answer: ["la naturaleza es protegida por el gobierno siempre"] },
    { info: "ayer / cerrar / tienda / gerente", answer: ["la tienda fue cerrada por el gerente ayer"] },
    { info: "pronto / abrir / restaurante / chef", answer: ["el restaurante será abierto por el chef pronto"] },
    { info: "1800 / descubrir / elemento / químico", answer: ["el elemento fue descubierto por el químico en 1800"] },
    { info: "ahora / servir / comida / mesero", answer: ["la comida es servida por el mesero ahora"] },
    { info: "ayer / diseñar / logo / diseñador", answer: ["el logo fue diseñado por el diseñador ayer"] },
    { info: "2000 / construir / estadio / constructora", answer: ["el estadio fue construido por la constructora en 2000"] },
    { info: "mañana / presentar / informe / secretario", answer: ["el informe será presentado por el secretario mañana"] },
];

const translationTextData = {
    content: "Penicillin was discovered by Alexander Fleming in 1928. This important discovery was published in a medical journal. Later, the medicine was produced by big companies. Today, millions of lives are saved by antibiotics every year.",
    vocab: { "penicillin": "penicilina", "discovery": "descubrimiento", "journal": "revista", "produced": "producido", "saved": "salvadas", "later": "luego" }
};

// --- HELPERS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary, isSupervisionMode, isAdmin }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setCurrentIndex(0); setAnswer(''); setStatus({}); }, [prompts]);
    useEffect(() => { setAnswer(''); }, [currentIndex]);

    const handleCheck = () => {
        if (isSupervisionMode) return;
        const userVal = answer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const corrects = prompts[currentIndex].answer;
        const isCorrect = corrects.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Buen trabajo!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start text-left">
                    <div className="w-full">
                        <CardTitle>{title}</CardTitle>
                        <CardDescription className='font-bold text-foreground mt-1'>Transforma la frase correctamente.</CardDescription>
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
                                    <BookText className="mr-2 h-4 w-4" /> Vocabulary
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4">
                                    <div className="grid grid-cols-1 gap-2 text-sm text-foreground text-left">
                                        {Object.entries(vocabulary).map(([es, en]: any) => (
                                            <div key={es} className="flex justify-between border-b border-muted pb-1">
                                                <span className="text-muted-foreground capitalize">{es}:</span>
                                                <span className="font-semibold text-right">{en}</span>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">
                    {prompts[currentIndex].spanish || prompts[currentIndex].info}
                </div>
                <Input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-12 text-lg text-foreground", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/10' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="Tu respuesta..." autoComplete="off" readOnly={isSupervisionMode} />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    {!isSupervisionMode && <Button onClick={handleCheck} variant="secondary">Verificar</Button>}
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={status[currentIndex] !== 'correct' && !isAdmin} className="text-white font-bold">Siguiente</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const ChoiceExercise = ({ prompts, onComplete, title, isSupervisionMode, isAdmin }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    const handleSelect = (option: string) => {
        if (isSupervisionMode) return;
        const isCorrect = option.toUpperCase() === prompts[currentIndex].answer.toUpperCase();
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Correcto!" });
        else toast({ variant: 'destructive', title: "Incorrecto" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="text-left">
                    <CardTitle className="uppercase font-black text-primary">{title}</CardTitle>
                    <div className="flex gap-2 justify-start flex-wrap pt-4">
                        {prompts.map((_: any, i: number) => (
                            <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-8 py-10">
                <div className="text-2xl font-black text-center leading-relaxed">
                    {prompts[currentIndex].q.split('_______').map((part: string, i: number) => (
                        <Fragment key={i}>
                            {part}
                            {i < 1 && <span className={cn("border-b-4 border-dashed px-4 mx-2", status[currentIndex] === 'correct' ? "text-primary border-primary" : "text-muted-foreground")}>{status[currentIndex] === 'correct' ? prompts[currentIndex].answer : '...'}</span>}
                        </Fragment>
                    ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    {prompts[currentIndex].options.map((opt: string) => (
                        <Button key={opt} onClick={() => handleSelect(opt)} variant="outline" className={cn("h-16 text-xl font-black uppercase transition-all", status[currentIndex] === 'correct' && opt.toUpperCase() === prompts[currentIndex].answer.toUpperCase() && "border-green-500 bg-green-50 text-green-700 shadow-lg scale-105")} disabled={isSupervisionMode}>{opt}</Button>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={status[currentIndex] !== 'correct' && !isAdmin} className="px-12 font-black h-12 shadow-xl">Siguiente</Button>
            </CardFooter>
        </Card>
    );
};

// --- MAIN CLASS COMPONENT ---

function VozPasivaContentInternal() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const searchParams = useSearchParams();

    const targetStudentId = searchParams.get('studentId');
    const currentUID = targetStudentId || user?.uid;

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    
    const [vocabAns, setVocabAns] = useState<string[]>(Array(passiveVocabData.length).fill(''));
    const [vocabVal, setVocabVal] = useState<any[]>(Array(passiveVocabData.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);
    const [conjIdx, setConjIdx] = useState(0);
    const [conjAns, setConjAns] = useState('');
    const [conjVal, setConjVal] = useState<'correct' | 'incorrect' | 'unchecked'>('unchecked');
    const [readAns, setReadAns] = useState<Record<string, string>>({});
    const [readVal, setReadVal] = useState<Record<string, any>>({});
    const [compAns, setCompAns] = useState<string[]>(Array(30).fill(''));
    const [compVal, setCompVal] = useState<any[]>(Array(30).fill('unchecked'));
    const [concordAns, setConcordAns] = useState<string[]>(Array(15).fill(''));
    const [concordVal, setConcordVal] = useState<any[]>(Array(15).fill('unchecked'));
    const [transText, setTransText] = useState('');

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any, name?: string}>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialPathData = useMemo(() => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: '2. Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'conjugation', name: '3. Conjugación (Participio)', icon: Pencil, status: 'locked' },
        { key: 'exercise_1', name: '4. Ejercicio 1 (Activa -> Pasiva)', icon: PenSquare, status: 'locked' },
        { key: 'exercise_2', name: '5. Ejercicio 2 (Pasiva -> Activa)', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'exercise_3', name: '7. Ejercicio 3 (Opciones)', icon: ListChecks, status: 'locked' },
        { key: 'reading', name: '8. Lectura', icon: BookText, status: 'locked' },
        { key: 'exercise_4', name: '9. Ejercicio 4 (Concordancia)', icon: PenSquare, status: 'locked' },
        { key: 'completar', name: '10. Completar', icon: Pencil, status: 'locked' },
        { key: 'translate_text', name: '11. Traducir Texto', icon: MessageSquare, status: 'locked' },
        { key: 'final', name: '12. Final (Escritura)', icon: Trophy, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
        let p = initialPathData.map((topic, i) => ({ ...topic, status: i === 0 ? 'active' : 'locked' as any }));
        const d = studentProfile.lessonProgress?.[progressStorageVersion] || {};
        if (isAdmin && !targetStudentId) p.forEach(t => t.status = 'completed');
        else {
            p.forEach(t => { if (d[t.key]) (t as any).status = d[t.key]; });
            let last = true;
            for (let i = 0; i < p.length; i++) { if (last && (p[i] as any).status === 'locked') (p[i] as any).status = 'active'; last = (p[i] as any).status === 'completed'; }
        }
        setLearningPath(p as Topic[]); 
        setSelectedTopic(d.lastSelectedTopic || p.find(it => it.status === 'active')?.key || p[0].key);
        if (d.vocabAns) setVocabAns(d.vocabAns);
        if (d.readAns) setReadAns(d.readAns);
        if (d.transText) setTransText(d.transText);
        setInitialLoadComplete(true); setIsInitialLoading(false);
    }, [isAdmin, initialPathData, studentProfile, isProfileLoading, isUserLoading, targetStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    const handleTopicComplete = useCallback((completedKey: string) => { setTopicToComplete(completedKey); }, []);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || targetStudentId) return;
        const s: any = { lastSelectedTopic: selectedTopic, vocabAns, readAns, transText };
        learningPath.forEach(t => s[t.key] = t.status);
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, vocabAns, readAns, transText, targetStudentId, initialLoadComplete]);

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

    const handleTopicSelect = (topicKey: string) => {
        const t = learningPath.find(it => it.key === topicKey);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (topicKey === 'grammar') handleTopicComplete(topicKey);
    };

    const handleCheckVocab = () => {
        let allOk = true;
        const nv = passiveVocabData.map((v, i) => {
            const ok = v.es.toUpperCase() === (vocabAns[i] || '').trim().toUpperCase();
            if (!ok) allOk = false; return ok ? 'correct' : 'incorrect';
        });
        setVocabVal(nv);
        if (allOk) { setCanAdvanceVocab(true); toast({ title: "¡Excelente!" }); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const handleCheckConj = () => {
        const v = participleVerbs[conjIdx];
        if (conjAns.trim().toLowerCase() === v.participle.toLowerCase()) {
            setConjVal('correct'); toast({ title: "¡Correcto!" });
            if (conjIdx < participleVerbs.length - 1) {
                setTimeout(() => { setConjIdx(p => p+1); setConjAns(''); setConjVal('unchecked'); }, 800);
            } else handleTopicComplete('conjugation');
        } else { setConjVal('incorrect'); toast({ variant: 'destructive', title: "Revisa el participio" }); }
    };

    const handleCheckReading = () => {
        let allOk = true; const nv: any = {};
        readingContent.questions.forEach((q) => { const res = q.a.some(a => (readAns[q.id] || '').trim().toLowerCase().includes(a.toLowerCase())); nv[q.id] = res ? 'correct' : 'incorrect'; if (!res) allOk = false; });
        setReadVal(nv); if (allOk) handleTopicComplete('reading');
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>Vocabulary: Inventions & News</CardTitle></CardHeader>
                        <CardContent><ScrollArea className="h-[500px] pr-4"><div className="grid grid-cols-2 gap-4">
                            <div className="font-black text-primary border-b pb-2 uppercase text-xs">Inglés</div><div className="font-black text-primary border-b pb-2 uppercase text-xs">Español</div>
                            {passiveVocabData.map((v, i) => (
                                <Fragment key={i}>
                                    <div className="p-3 border rounded bg-white/5 font-bold flex items-center text-sm">{v.en}</div>
                                    <Input value={vocabAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...vocabAns]; na[i] = e.target.value; setVocabAns(na); const nv = [...vocabVal]; nv[i] = 'unchecked'; setVocabVal(nv); }} className={cn("uppercase", vocabVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} />
                                </Fragment>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-between border-t pt-6"><Button onClick={handleCheckVocab} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-8 text-left text-foreground overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">GRAMMAR: LA VOZ PASIVA</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0 font-bold">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                    <h3 className="text-xl font-black text-primary uppercase mb-4">1. Voz Activa</h3>
                                    <p className="mb-2">El foco está en <strong>quién</strong> hace la acción.</p>
                                    <div className='p-3 bg-muted rounded-lg font-mono text-sm'>Sujeto + Verbo + Objeto</div>
                                    <p className='mt-2 italic text-muted-foreground'>Los científicos descubrieron una nueva especie.</p>
                                </div>
                                <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                    <h3 className="text-xl font-black text-brand-purple uppercase mb-4">2. Voz Pasiva</h3>
                                    <p className="mb-2">El objeto pasa a ser el elemento <strong>principal</strong>.</p>
                                    <div className='p-3 bg-brand-purple/10 rounded-lg font-mono text-sm border border-brand-purple/20 text-brand-purple'>Sujeto Pasivo + SER + Participio</div>
                                    <p className='mt-2 italic text-muted-foreground'>Una nueva especie fue descubierta por los científicos.</p>
                                </div>
                            </div>
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm text-foreground">
                                <h3 className="text-xl font-black text-primary uppercase mb-4">Regla de Oro: La Concordancia</h3>
                                <p className="mb-4">El participio debe coincidir en <strong>género</strong> (o/a) y <strong>número</strong> (s) con el sujeto.</p>
                                <div className='grid grid-cols-2 gap-2 text-sm'>
                                    <div className='p-2 border rounded'>El libro fue publicad<strong>o</strong>.</div>
                                    <div className='p-2 border rounded'>La novela fue publicad<strong>a</strong>.</div>
                                    <div className='p-2 border rounded'>Los libros fueron publicad<strong>os</strong>.</div>
                                    <div className='p-2 border rounded'>Las novelas fueron publicad<strong>as</strong>.</div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'conjugation':
                const v = participleVerbs[conjIdx];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tighter'>Misión: Pasado Participio ({conjIdx+1}/30)</CardTitle><CardDescription>Escribe el participio pasado del verbo en español.</CardDescription></CardHeader>
                        <CardContent className="space-y-8 pt-8 flex flex-col items-center">
                            <div className="p-8 bg-gradient-to-br from-primary/5 to-brand-purple/5 rounded-[2.5rem] border-2 border-dashed border-primary/20 text-center"><h3 className="text-5xl font-black text-primary uppercase tracking-tighter">{v.v} ({v.en})</h3></div>
                            <div className='w-full max-w-sm space-y-2'>
                                <Label className='text-xs font-black uppercase text-muted-foreground'>Participio Pasado:</Label>
                                <Input value={conjAns} onChange={e => { if (targetStudentId) return; setConjAns(e.target.value); setConjVal('unchecked'); }} onKeyDown={e => e.key === 'Enter' && handleCheckConj()} className={cn("h-14 text-2xl text-center uppercase", conjVal === 'correct' ? 'border-green-500 bg-green-50/10' : conjVal === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="..." readOnly={!!targetStudentId} />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-8 bg-muted/5"><Button onClick={handleCheckConj} size="lg" className="px-20 font-black h-14 text-xl shadow-xl uppercase">Verificar Participio</Button></CardFooter>
                    </Card>
                );
            case 'exercise_1': return <BallsExercise title="Ejercicio 1: Activa -> Pasiva" prompts={ex1Prompts} onComplete={() => handleTopicComplete('exercise_1')} vocabulary={ex1Vocab} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'exercise_2': return <BallsExercise title="Ejercicio 2: Pasiva -> Activa" prompts={ex2Prompts} onComplete={() => handleTopicComplete('exercise_2')} vocabulary={ex2Vocab} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'vocab_game': return <VocabularyMatchingGame data={passiveVocabData.slice(0, 10).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Noticias e Inventos Memory" />;
            case 'exercise_3': return <ChoiceExercise title="Ejercicio 3: Elegir la forma correcta" prompts={ex3Options} onComplete={() => handleTopicComplete('exercise_3')} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'reading':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div><CardTitle>{readingContent.title}</CardTitle></div>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                                    <PopoverContent className="w-64">
                                        <ScrollArea className="h-64 pr-4">
                                            <div className="grid grid-cols-1 gap-2 text-sm text-foreground text-left">
                                                {Object.entries(readingVocab).map(([es, en]: any) => (
                                                    <div key={es} className="flex justify-between border-b border-muted pb-1">
                                                        <span className="text-muted-foreground capitalize">{es}:</span>
                                                        <span className="font-semibold text-right">{en}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner">{readingContent.content}</div>
                            <Separator /><div className="space-y-4">{readingContent.questions.map((q, i) => (
                                <div key={i} className="space-y-2"><Label className='font-bold'>{i+1}. {q.q}</Label><Input value={readAns[q.id] || ''} onChange={e => { if (targetStudentId) return; setReadAns({...readAns, [q.id]: e.target.value}); setReadVal({...readVal, [q.id]: 'unchecked'}); }} className={cn('mt-1 text-lg h-12', readVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[q.id] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                            ))}</div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={handleCheckReading} size="lg" className="px-12 font-bold" disabled={!!targetStudentId}>Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'exercise_4':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary uppercase tracking-tighter'>Ejercicio 4: Concordancia</CardTitle></CardHeader>
                        <CardContent className="p-0"><ScrollArea className="h-[500px] p-6"><div className="space-y-4">
                            {ex4Prompts.map((q, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm">
                                    <p className="font-bold text-lg">{q.s}</p>
                                    <Input value={concordAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...concordAns]; na[i] = e.target.value; setConcordAns(na); const nv = [...concordVal]; nv[i] = 'unchecked'; setConcordVal(nv); }} className={cn("h-10 max-w-sm text-lg font-mono uppercase", concordVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : concordVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="..." autoComplete="off" readOnly={!!targetStudentId} />
                                </div>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/20"><Button onClick={() => {
                            let all = true; const nv = ex4Prompts.map((q, i) => { const res = q.a.toLowerCase() === (concordAns[i] || '').trim().toLowerCase(); if (!res) all = false; return res ? 'correct' : 'incorrect'; });
                            setConcordVal(nv); if (all) handleTopicComplete('exercise_4'); else toast({ variant: 'destructive', title: "Hay errores en la concordancia" });
                        }} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Verificar Misión</Button></CardFooter>
                    </Card>
                );
            case 'completar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary uppercase tracking-tighter'>Completar: Voz Pasiva Adecuada</CardTitle></CardHeader>
                        <CardContent className="p-0"><ScrollArea className="h-[500px] p-6"><div className="space-y-4">
                            {completarPrompts.map((q, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm">
                                    <p className="font-bold text-lg">{q.s}</p>
                                    <Input value={compAns[i]} onChange={e => { if (targetStudentId) return; const na = [...compAns]; na[i] = e.target.value; setCompAns(na); const nv = [...compVal]; nv[i] = 'unchecked'; setCompVal(nv); }} className={cn("h-10 max-w-sm text-lg font-mono uppercase", compVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : compVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="..." autoComplete="off" readOnly={!!targetStudentId} />
                                </div>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/20"><Button onClick={() => {
                            let all = true; const nv = completarPrompts.map((q, i) => { const res = q.a.toLowerCase() === (compAns[i] || '').trim().toLowerCase(); if (!res) all = false; return res ? 'correct' : 'incorrect'; });
                            setCompVal(nv); if (all) handleTopicComplete('completar'); else toast({ variant: 'destructive', title: "Hay errores en la lista" });
                        }} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Verificar Todo</Button></CardFooter>
                    </Card>
                );
            case 'translate_text':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><div className="flex justify-between items-start"><div><CardTitle className='text-primary uppercase'>Traducción de Texto: Inventions</CardTitle></div><Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger><PopoverContent className="w-64"><ScrollArea className="h-48 pr-4 text-foreground"><div className="grid grid-cols-1 gap-2 text-sm">{Object.entries(translationTextData.vocab).map(([en, es], i) => (<div key={i} className="flex justify-between border-b pb-1"><span className="text-muted-foreground capitalize">{en}:</span><span className="font-bold text-right text-primary">{es.toUpperCase()}</span></div>))}</div></ScrollArea></PopoverContent></Popover></div></CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed shadow-sm text-black dark:text-white">"{translationTextData.content}"</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={transText} onChange={(e) => { if (targetStudentId) return; setTransText(e.target.value); }} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg" readOnly={!!targetStudentId} /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20"><Button onClick={() => handleTopicComplete('translate_text')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Continuar <ArrowRight className='ml-3 h-8 w-8' /></Button></CardFooter>
                    </Card>
                );
            case 'final': return <BallsExercise title="Reto Final: Producción Escrita" prompts={finalExPrompts} onComplete={() => handleTopicComplete('final')} vocabulary={{"puente": "bridge", "vacuna": "vaccine", "inaugurado": "inaugurated", "artículo": "article", "gobierno": "government", "empresa": "company", "atleta": "athlete", "químico": "chemist", "secretario": "secretary"}} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            default: return null;
        }
    };

    if (isUserLoading || isProfileLoading) return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {isAdmin && targetStudentId && (
                        <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md">
                            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400">
                                <Star className="h-6 w-6 fill-current animate-pulse" />
                                <p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión Activo: {studentProfile?.name || targetStudentId}</p>
                            </div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors">
                                <Link href="/admin">Cerrar Supervisión</Link>
                            </Button>
                        </div>
                    )}
                    
                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/b1" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver al Curso B1</Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3">
                           <Factory className='h-10 w-10 text-primary' /> Voz Pasiva Básica 🇪🇸
                        </h1>
                    </div>

                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        <div className="md:col-span-9 md:order-1 order-2">
                            {renderContent()}
                        </div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30">
                                    <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-primary" /> Misión B1
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <nav>
                                        <ul className="space-y-1">
                                            {learningPath.map((item) => {
                                                const isLocked = item.status === 'locked' && !isAdmin;
                                                const Icon = ICONS_CONFIG[item.status as keyof typeof ICONS_CONFIG] || BookOpen;
                                                const isActive = item.status === 'active';
                                                return (
                                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                                        className={cn(
                                                            'flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground',
                                                            isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted',
                                                            selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm',
                                                            isActive && !isAdmin && "animate-pulse-glow"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {item.status === 'completed' ? (
                                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                                            ) : (
                                                                <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />
                                                            )}
                                                            <span className="truncate max-w-[150px] text-[10px] uppercase font-bold text-current">{item.name}</span>
                                                        </div>
                                                        {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </nav>
                                    <div className="mt-6 pt-6 border-t">
                                        <div className="flex justify-between items-center text-xs mb-2 font-black uppercase text-muted-foreground">
                                            <span>Avance Clase</span>
                                            <span className="text-primary">{progressValue}%</span>
                                        </div>
                                        <Progress value={progressValue} className="h-2 rounded-full" />
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

export default function VozPasivaPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}>
            <VozPasivaContentInternal />
        </Suspense>
    );
}