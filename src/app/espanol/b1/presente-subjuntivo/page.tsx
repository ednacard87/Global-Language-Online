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
    Star,
    ArrowLeft,
    Check,
    X,
    Heart,
    MessageSquare,
    ListChecks,
    Sparkles,
    Info,
    Activity,
    BrainCircuit,
    Eye
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
const progressStorageVersion = 'progress_es_b1_pres_subj_v18_vocab_fix';
const mainProgressKey = 'progress_b1_es_presente_subjuntivo';

interface Topic {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'completed' | 'active' | 'locked';
}

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const subjVocab = [
    { en: "desire", es: "deseo" }, { en: "hope", es: "esperanza" }, { en: "fear", es: "miedo" },
    { en: "happiness", es: "felicidad" }, { en: "sadness", es: "tristeza" }, { en: "worry", es: "preocupación" },
    { en: "advice", es: "consejo" }, { en: "recommendation", es: "recomendación" }, { en: "necessity", es: "necesidad" },
    { en: "wish", es: "deseo" }, { en: "dream", es: "sueño" }, { en: "importance", es: "importancia" },
    { en: "possibility", es: "posibilidad" }, { en: "health", es: "salud" }, { en: "rest", es: "descanso" },
    { en: "exercise", es: "ejercicio" }, { en: "study", es: "estudio" }, { en: "work", es: "trabajo" },
    { en: "help", es: "ayuda" }, { en: "change", es: "cambio" }, { en: "joy", es: "alegría" }, { en: "mood", es: "estado de ánimo" }
];

const conjugationVerbs = [
    { en: "TO SPEAK", es: "hablar", forms: ["hable", "hables", "hable", "hablemos", "hablen"] },
    { en: "TO EAT", es: "comer", forms: ["coma", "comas", "coma", "comamos", "coman"] },
    { en: "TO LIVE", es: "vivir", forms: ["viva", "vivas", "viva", "vivamos", "vivan"] },
    { en: "TO HAVE", es: "tener", forms: ["tenga", "tengas", "tenga", "tengamos", "tengan"] },
    { en: "TO BE (Permanent)", es: "ser", forms: ["sea", "seas", "sea", "seamos", "sean"] },
    { en: "TO GO", es: "ir", forms: ["vaya", "vayas", "vaya", "vayamos", "vayan"] },
    { en: "TO DO / MAKE", es: "hacer", forms: ["haga", "hagas", "haga", "hagamos", "hagan"] },
    { en: "TO BE (State)", es: "estar", forms: ["esté", "estés", "esté", "estemos", "estén"] },
    { en: "TO COME", es: "venir", forms: ["venga", "vengas", "venga", "vengamos", "vengan"] },
    { en: "TO SAY / TELL", es: "decir", forms: ["diga", "digas", "diga", "digamos", "digan"] },
    { en: "TO SING", es: "cantar", forms: ["cante", "cantes", "cante", "cantemos", "canten"] },
    { en: "TO DRINK", es: "beber", forms: ["beba", "bebas", "beba", "bebamos", "beban"] },
    { en: "TO OPEN", es: "abrir", forms: ["abra", "abras", "abra", "abramos", "abran"] },
    { en: "TO WALK", es: "caminar", forms: ["camine", "camines", "camine", "caminemos", "caminen"] },
    { en: "TO LEARN", es: "aprender", forms: ["aprenda", "aprendas", "aprenda", "aprendamos", "aprendan"] },
    { en: "TO WRITE", es: "escribir", forms: ["escriba", "escribas", "escriba", "escribamos", "escriban"] },
    { en: "TO STUDY", es: "estudiar", forms: ["estudie", "estudies", "estudie", "estudiemos", "estudien"] },
    { en: "TO WORK", es: "trabajar", forms: ["trabaje", "trabajes", "trabaje", "trabajemos", "trabajen"] },
    { en: "TO HELP", es: "ayudar", forms: ["ayude", "ayudes", "ayude", "ayudemos", "ayuden"] },
    { en: "TO CHANGE", es: "cambiar", forms: ["cambie", "cambies", "cambie", "cambiemos", "cambien"] },
    { en: "TO SLEEP", es: "dormir", forms: ["duerma", "duermas", "duerma", "durmamos", "duerman"] },
    { en: "TO ASK FOR", es: "pedir", forms: ["pida", "pidas", "pida", "pidamos", "pidan"] },
    { en: "TO POWER / CAN", es: "poder", forms: ["pueda", "puedas", "pueda", "podamos", "puedan"] },
    { en: "TO KNOW (Fact)", es: "saber", forms: ["sepa", "sepas", "sepa", "sepamos", "sepan"] },
    { en: "TO WANT", es: "querer", forms: ["quiera", "quieras", "quiera", "queramos", "quieran"] },
    { en: "TO PLAY", es: "jugar", forms: ["juegue", "juegues", "juegue", "juguemos", "jueguen"] },
    { en: "TO FEEL", es: "sentir", forms: ["sienta", "sientas", "sienta", "sintamos", "sientan"] },
    { en: "TO BRING", es: "traer", forms: ["traiga", "traigas", "traiga", "traigamos", "traigan"] },
    { en: "TO SEE", es: "ver", forms: ["vea", "veas", "vea", "veamos", "vean"] },
    { en: "TO GIVE", es: "dar", forms: ["dé", "des", "dé", "demos", "den"] }
];

const ex1Prompts = [
    { en: "I want you to study.", answer: ["yo quiero que estudies"] },
    { en: "I hope you arrive soon.", answer: ["yo espero que llegues pronto"] },
    { en: "I recommend that you eat well.", answer: ["yo te recomiendo que comas bien"] },
    { en: "It is important that you work.", answer: ["es importante que tu trabajes"] },
    { en: "I need you to help me.", answer: ["yo necesito que me ayudes"] },
    { en: "She wants me to go.", answer: ["ella quiere que yo vaya"] },
    { en: "We hope they stay.", answer: ["nosotros esperamos que ellos se queden", "esperamos que tú te quedes"] },
    { en: "It is necessary that we study.", answer: ["es necesario que nosotros estudiemos" , "es necesario que estudiemos"] },
    { en: "I recommend that he sleeps.", answer: ["yo le recomiendo que el duerma" , "yo le recomiendo que duerma"] },
    { en: "I want them to learn.", answer: ["yoquiero que ellos aprendan", "quiero que aprendan"] },
    { en: "I need you to tell me the truth.", answer: ["necesito que tu me digas la verdad"] },
    { en: "We hope it doesn't rain.", answer: ["esperamos que no llueva"] }
];

const ex2Prompts = [
    { en: "I want you to study more.", answer: ["quiero que estudies más", "yo quiero que estudies mas"] },
    { en: "I hope you have a good day.", answer: ["espero que tengas un buen día", "yo espero que tengas un buen dia"] },
    { en: "I recommend that you rest.", answer: ["yo te recomiendo que descanses"] },
    { en: "It is important that you exercise.", answer: ["es importante que hagas ejercicio"] },
    { en: "She wants us to be happy.", answer: ["ella quiere que seamos felices"] },
    { en: "He needs me to arrive on time.", answer: ["el necesita que yo llegue a tiempo", "el necesita que llegue a tiempo"] },
    { en: "I hope they find the way.", answer: ["yo espero que ellos encuentren el camino", "yo espero que encuentren el camino"] },
    { en: "We recommend you visit the city.", answer: ["nosotros te recomendamos que visites la ciudad"] },
    { en: "It's necessary that she speaks to him.", answer: ["es necesario que ella hable con el", "es necesario que hable con el"] },
    { en: "I want them to buy the house.", answer: ["yo quiero que ellos compren la casa", "yo quiero que compren la casa"] },
    { en: "You hope I come to the party.", answer: ["tu esperas que yo venga a la fiesta", "tu esperas que venga a la fiesta"] },
    { en: "It's important that we save money.", answer: ["es importante que ahorremos dinero"] }
];

const ex3Prompts = [
    { en: "I am happy that you are here.", answer: ["me alegra que estés aquí", "estoy feliz que estes aqui"] },
    { en: "She worries that he is sick.", answer: ["le preocupa que él esté enfermo", "a ella le preocupa que el este enfermo"] },
    { en: "We need you to bring the documents.", answer: ["nosotros necesitamos que traigas los documentos"] },
    { en: "They want me to tell them a story.", answer: ["ellos quieren que les cuente una historia"] },
    { en: "I recommend that she goes to the doctor.", answer: ["yo le recomiendo que ella vaya al médico", "yo le recomiendo que ella vaya al medico"] },
    { en: "It is important that they know the truth.", answer: ["es importante que ellos sepan la verdad", "es importante que sepan la verdad"] },
    { en: "He is glad that we are friends.", answer: ["a el le alegra que seamos amigos" , "a el le alegra que seamos amigos"] },
    { en: "I hope you can help me tomorrow.", answer: ["yo espero que puedas ayudarme mañana", "yo espero que me puedas ayudar mañana"] },
    { en: "They want us to work together.", answer: ["ellos quieren que trabajemos juntos"] },
    { en: "It is possible that it happens.", answer: ["es posible que pase", "es posible que ocurra"] },
    { en: "We want her to change her mind.", answer: ["nosotros queremos que ella cambie de opinión", "nosotros queremos que ella cambie de idea"] },
    { en: "I worry that they are lost.", answer: ["yo me preocupo que ellos estén perdidos", "yo me preocupo que esten perdidos"] },
    { en: "She hopes you feel better.", answer: ["ella espera que te sientas mejor"] },
    { en: "It is necessary that he does it now.", answer: ["es necesario que él lo haga ahora", "es necesario que el lo haga ahora"] },
    { en: "We are glad you are learning Spanish.", answer: ["nos alegra que estes aprendiendo español" , "a nosotrosnos alegra que estes aprendiendo español"] }
];

const readingData = {
    title: "Consejos para tener una vida saludable",
    content: "Para vivir muchos años y tener energía, es fundamental cuidar nuestro cuerpo. El doctor Martínez siempre nos dice: 'Es importante que ustedes coman frutas y verduras cada día'. También es recomendable que nosotros bebamos mucha agua y evitemos el azúcar. \n\nNo es suficiente con la alimentación. Es necesario que las personas hagan ejercicio al menos tres veces por semana. Yo espero que mis pacientes entiendan que el descanso también es vital. Te recomiendo que duermas ocho horas diarias para que tu cerebro funcione correctamente. Me alegra que cada vez más personas estén interesadas en su salud.",
    questions: [
        { q: "¿Qué es fundamental para vivir muchos años?", a: ["cuidar nuestro cuerpo"] },
        { q: "¿Qué recomienda el doctor Martínez sobre la alimentación?", a: ["comer frutas y verduras", "beber mucha agua"] },
        { q: "¿Qué actividad es necesaria tres veces por semana?", a: ["hacer ejercicio"] },
        { q: "¿Cuántas horas se recomienda dormir?", a: ["ocho horas", "8 horas"] },
        { q: "Menciona tres verbos en subjuntivo usados en el texto.", a: ["coman", "bebamos", "hagan", "entiendan", "duermas", "funcione", "estén"] }
    ],
    vocabulary: {
        "energía": "energy",
        "fundamental": "fundamental / essential",
        "alimentación": "diet / nourishment",
        "vital": "vital",
        "cerebro": "brain",
        "correctamente": "correctly",
        "salud": "health",
        "pacientes": "patients"
    }
};

const choiceExercisesData = [
    { text: "Espero que tú _______ (estar) bien.", options: ["ESTÁS", "ESTÉS", "ESTARÁS"], answer: "ESTÉS" },
    { text: "Es importante que nosotros _______ (estudiar) más.", options: ["ESTUDIAMOS", "ESTUDIEMOS", "ESTUDIAREMOS"], answer: "ESTUDIEMOS" },
    { text: "Quiero que ella _______ (venir) a mi casa.", options: ["VENGA", "VENGAN", "VENDRÁ"], answer: "VENGA" },
    { text: "Deseo que ellos _______ (tener) suerte.", options: ["TENGAN", "TIENEN", "TENDRÁN"], answer: "TENGAN" },
    { text: "Te recomiendo que _______ (hacer) deporte.", options: ["HARAS", "HAGAN", "HAGAS"], answer: "HAGAS" },
    { text: "Es necesario que yo _______ (ir) al banco.", options: ["VOYA", "VAYA", "IRÉ"], answer: "VAYA" },
    { text: "Me alegra que ustedes _______ (ser) amigos.", options: ["SEAN", "SEA", "SERÁN"], answer: "SEAN" },
    { text: "Necesito que él _______ (saber) la noticia.", options: ["SABE", "SEPA", "SABRÁ"], answer: "SEPA" },
    { text: "Es posible que nosotros _______ (llegar) tarde.", options: ["LLEGARAN", "LLEGUEMOS", "LLEGUEMOS"], answer: "LLEGUEMOS" },
    { text: "Espero que no _______ (llover) hoy.", options: ["LLUEVE", "LLUEVA", "LLOVERÁ"], answer: "LLUEVA" },
    { text: "Quiero que tú _______ (hablar) conmigo.", options: ["HABLAS", "HABLE", "HABLES"], answer: "HABLES" },
    { text: "Es importante que ella _______ (comer) sano.", options: ["COMA", "COME", "COMERÁ"], answer: "COMA" },
    { text: "Me preocupa que ellos _______ (perder) el vuelo.", options: ["PIERDEN", "PIERDAN", "PERDERÁN"], answer: "PIERDAN" },
    { text: "Te sugiero que _______ (leer) este libro.", options: ["LEES", "LEERAS", "LEAS"], answer: "LEAS" },
    { text: "Deseo que nosotros _______ (poder) viajar.", options: ["PODAMOS", "PODEMOS", "PODREMOS"], answer: "PODAMOS" },
    { text: "Es necesario que ellos _______ (traer) el mapa.", options: ["TRAEN", "TRAEMOS", "TRAIGAN"], answer: "TRAIGAN" },
    { text: "Quiero que tú _______ (decir) la verdad.", options: ["DICES", "DIGAS", "DIRÁS"], answer: "DIGAS" },
    { text: "Me alegra que ella _______ (estar) mejor.", options: ["ESTÉ", "ESTÁ", "ESTARÁ"], answer: "ESTÉ" },
    { text: "Espero que nosotros _______ (encontrar) la llave.", options: ["ENCONTRAMOS", "ENCONTRAMOS", "ENCONTREMOS"], answer: "ENCONTREMOS" },
    { text: "Te pido que _______ (limpiar) tu cuarto.", options: ["LIMPIAS", "LIMPIES", "LIMPIARÁS"], answer: "LIMPIES" },
];

const completionPrompts = [
    { s: "1. Quiero que tú (estudiar) _______ para el examen.", a: "estudies" },
    { s: "2. Espero que ellos (llegar) _______ pronto.", a: "lleguen" },
    { s: "3. Recomiendo que ella (comer) _______ más sano.", a: "coma" },
    { s: "4. Necesito que nosotros (terminar) _______ el trabajo.", a: "terminemos" },
    { s: "5. Es importante que tú (saber) _______ la verdad.", a: "sepas" },
    { s: "6. Es necesario que él (ir) _______ al médico.", a: "vaya" },
    { s: "7. Me alegra que ustedes (estar) _______ aquí.", a: "estén" },
    { s: "8. Me preocupa que ellos no (tener) _______ dinero.", a: "tengan" },
    { s: "9. Es posible que (llover) _______ esta tarde.", a: "llueva" },
    { s: "10. Quiero que nosotros (hacer) _______ un viaje.", a: "hagamos" },
    { s: "11. Espero que ella (encontrar) _______ sus llaves.", a: "encuentre" },
    { s: "12. Recomiendo que tú (beber) _______ más agua.", a: "bebas" },
    { s: "13. Necesito que ellos (ayudar) _______ en casa.", a: "ayuden" },
    { s: "14. Es importante que yo (hablar) _______ con mi jefe.", a: "hable" },
    { s: "15. Es necesario que nosotros (aprendamos) _______ el subjuntivo.", a: "aprendamos" },
    { s: "16. Me alegra que tú (ser) _______ mi amigo.", a: "seas" },
    { s: "17. Me preocupa que ella (sentirse) _______ mal.", a: "se sienta" },
    { s: "18. Es posible que ellos (venir) _______ mañana.", a: "vengan" },
    { s: "19. Quiero que él (decir) _______ qué pasó.", a: "diga" },
    { s: "20. Espero que ustedes (disfrutar) _______ la fiesta.", a: "disfruten" },
    { s: "21. Recomiendo que nosotros (ver) _______ esa película.", a: "veamos" },
    { s: "22. Necesito que tú (poner) _______ la mesa.", a: "pongas" },
    { s: "23. Es importante que ellos (salir) _______ temprano.", a: "salgan" },
    { s: "24. Es necesario que ella (traer) _______ su pasaporte.", a: "traiga" },
    { s: "25. Me alegra que nosotros (vivir) _______ cerca.", a: "vivamos" },
    { s: "26. Me preocupa que tú (conducir) _______ rápido.", a: "conduzcas" },
    { s: "27. Es posible que yo (perder) _______ el tren.", a: "pierda" },
    { s: "28. Quiero que ellos (escuchar) _______ mi consejo.", a: "escuchen" },
    { s: "29. Espero que tú (querer) _______ venir conmigo.", a: "quieras" },
    { s: "30. Es necesario que ustedes (dormir) _______ bien.", a: "duerman" },
];

const translationTextParagraph = {
    english: "Dear friend, I hope you have a great week. I know you are very busy, but it is important that you take some time for yourself. I want you to rest during the weekend because you work too much. I recommend that you visit a new place or go to the mountains. I need you to be happy and healthy. It is necessary that you change your routine a little. Me and my family wish you the best!",
    vocab: { "rest": "descansar", "busy": "ocupado", "take time": "tomarse tiempo", "weekend": "fin de semana", "mountains": "montañas", "healthy": "saludable", "routine": "rutina", "wish": "desear" }
};

const finalExercises = [
    { en: "I want you to study more.", answer: ["quiero que estudies más", "yo quiero que estudies mas"] },
    { en: "I hope you have a good weekend.", answer: ["espero que tengas un buen fin de semana"] },
    { en: "It is important that you take care of yourself.", answer: ["es importante que te cuides", "es importante que te cuides a ti mismo"] },
    { en: "I recommend that you exercise every day.", answer: ["te recomiendo que hagas ejercicio todos los días", "te recomiendo que hagas ejercicio todos los dias"] },
    { en: "I am happy that you are here.", answer: ["me alegra que estés aquí", "me alegra que estes aqui", "yo estoy feliz de que estés aquí"] },
    { en: "She needs me to call her tonight.", answer: ["ella necesita que yo la llame esta noche", "necesita que la llame esta noche"] },
    { en: "It is necessary that we speak the truth.", answer: ["es necesario que digamos la verdad", "es necesario que hablemos la verdad"] },
    { en: "I hope they arrive on time.", answer: ["espero que ellos lleguen a tiempo", "espero que lleguen a tiempo"] },
    { en: "We want her to bring the cake.", answer: ["queremos que ella traiga el pastel", "queremos que traiga la torta"] },
    { en: "He suggests that we stay at home.", answer: ["él sugiere que nos quedemos en casa", "sugiere que nos quedemos en casa"] },
    { en: "I worry that it is too late.", answer: ["me preocupa que sea demasiado tarde", "me preocupa que sea muy tarde"] },
    { en: "It is possible that they come later.", answer: ["es posible que ellos vengan más tarde", "es posible que vengan mas tarde"] },
    { en: "I wish you find your path.", answer: ["deseo que encuentres tu camino"] },
    { en: "She wants me to be her friend.", answer: ["ella quiere que yo sea su amigo", "quiere que sea su amigo"] },
    { en: "It is important that he knows the rules.", answer: ["es importante que él sepa las reglas", "es importante que sepa las normas"] }
];

// --- HELPER COMPONENTS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary, isSupervisionMode, isAdmin }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setCurrentIndex(0); setUserAnswers({}); setStatus({}); }, [prompts]);

    const handleCheck = () => {
        if (isSupervisionMode) return;
        const currentAnswer = userAnswers[currentIndex] || '';
        const userVal = currentAnswer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const corrects = prompts[currentIndex]?.answer || [];
        const isCorrect = corrects.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
        
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Buen trabajo!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const currentStatus = status[currentIndex] || 'unchecked';

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start text-left">
                    <div className="w-full">
                        <CardTitle className="uppercase font-black text-primary">{title}</CardTitle>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary scale-110" : "border-muted", status[i] === 'correct' ? "!bg-green-600 !text-white !border-green-600" : status[i] === 'incorrect' ? "!bg-red-600 !text-white !border-red-600" : "bg-card")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4">
                                    <div className="flex flex-col gap-2 text-sm text-left text-foreground">
                                        {Object.entries(vocabulary).map(([en, es]: any) => (<div key={en} className="flex justify-between border-b border-muted pb-1"><span className="text-muted-foreground capitalize">{en}:</span><span className="font-semibold text-right text-primary">{(es || '').toUpperCase()}</span></div>))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">{prompts[currentIndex]?.en}</div>
                <Input value={userAnswers[currentIndex] || ''} onChange={e => { if (isSupervisionMode) return; setUserAnswers({...userAnswers, [currentIndex]: e.target.value}); setStatus({...status, [currentIndex]: 'unchecked'}); }} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-12 text-lg", currentStatus === 'correct' ? 'border-green-500 bg-green-50/10' : currentStatus === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="Escribe en español..." autoComplete="off" readOnly={isSupervisionMode} />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    {!isSupervisionMode && <Button onClick={handleCheck} variant="secondary">Verificar</Button>}
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={currentStatus !== 'correct' && !isAdmin} className="text-white font-bold">{currentIndex === prompts.length - 1 ? 'Finalizar' : 'Siguiente'}</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

// --- MAIN PAGE ---

function PresenteSubjuntivoContentInternal() {
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
    
    const hasInitialized = useRef(false);

    // Form states
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(subjVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(subjVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const [conjIdx, setConjIdx] = useState(0);
    const [conjAns, setConjAns] = useState<string[]>(Array(5).fill(''));
    const [conjVal, setConjVal] = useState<any[]>(Array(5).fill('unchecked'));

    const [optIdx, setOptIdx] = useState(0);
    const [optSolved, setOptSolved] = useState<Record<number, boolean>>({});

    const [compAns, setCompAns] = useState<string[]>(Array(completionPrompts.length).fill(''));
    const [compVal, setCompVal] = useState<any[]>(Array(completionPrompts.length).fill('unchecked'));

    const [readAns, setReadAns] = useState<Record<number, string>>({});
    const [readVal, setReadVal] = useState<Record<number, any>>({});

    const [transText, setTransText] = useState('');

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    
    const { data: authUserProfile } = useDoc<{ role?: string }>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string, lessonProgress?: any, progress?: any, name?: string }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: '2. Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'conjugation', name: '3. Conjugación', icon: Pencil, status: 'locked' },
        { key: 'exercise_1', name: '4. Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'exercise_2', name: '5. Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'exercise_3', name: '7. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: '8. Lectura', icon: BookText, status: 'locked' },
        { key: 'exercise_4', name: '9. Ejercicio 4', icon: ListChecks, status: 'locked' },
        { key: 'complete', name: '10. Completar', icon: Pencil, status: 'locked' },
        { key: 'translate_text', name: '11. Traducir Texto', icon: MessageSquare, status: 'locked' },
        { key: 'final', name: '12. Final', icon: CheckCircle, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || hasInitialized.current) return;
        let path = initialLearningPath.map((topic, i) => ({ ...topic, status: i === 0 ? 'active' : 'locked' as any }));
        const d = studentProfile.lessonProgress?.[progressStorageVersion] || {};
        if (isAdmin && !targetStudentId) path.forEach(t => t.status = 'completed');
        else {
            path.forEach(t => { if (d[t.key]) t.status = d[t.key]; });
            let lastDone = true;
            for (let i = 0; i < path.length; i++) { if (lastDone && path[i].status === 'locked') path[i].status = 'active'; lastDone = path[i].status === 'completed'; }
        }
        setLearningPath(path); setSelectedTopic(d.lastSelectedTopic || path.find(p => p.status === 'active')?.key || path[0].key);
        if (d.vocabAnswers) setVocabAnswers(d.vocabAnswers);
        if (d.transText) setTransText(d.transText);
        setInitialLoadComplete(true); hasInitialized.current = true;
        setTimeout(() => setIsInitialLoading(false), 800);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, targetStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || targetStudentId) return;
        const saveTimer = setTimeout(() => {
            const s: any = { lastSelectedTopic: selectedTopic, vocabAnswers, transText };
            learningPath.forEach(t => s[t.key] = t.status);
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        }, 2000);
        return () => clearTimeout(saveTimer);
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, initialLoadComplete, targetStudentId, vocabAnswers, transText]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(current => {
            const np = current.map(t => ({ ...t }));
            const i = np.findIndex(t => t.key === topicToComplete);
            if (i !== -1 && np[i].status !== 'completed') {
                np[i].status = 'completed';
                if (i + 1 < np.length && np[i + 1].status === 'locked') {
                    np[i + 1].status = 'active';
                    setSelectedTopic(np[i + 1].key);
                    setTimeout(() => toast({ title: "¡Misión desbloqueada!" }), 0);
                }
            }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (key: string) => {
        const t = learningPath.find(it => it.key === key);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(key);
        if (key === 'grammar') handleTopicComplete('grammar');
    };

    const handleTopicComplete = (completedKey: string) => { setTopicToComplete(completedKey); };

    const handleCheckVocab = () => {
        let okCount = 0;
        const nv = subjVocab.map((v, i) => {
            const isOk = v.es.toLowerCase() === (vocabAnswers[i] || '').trim().toLowerCase();
            if (isOk) okCount++;
            return isOk ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv);
        if (okCount === subjVocab.length) { setCanAdvanceVocab(true); toast({ title: "¡Vocabulario Completo!" }); }
        else toast({ variant: 'destructive', title: "Revisa los campos marcados" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className="text-primary uppercase tracking-tighter">Vocabulario: Deseos y Necesidades</CardTitle><CardDescription className='font-bold text-foreground'>Escribe el significado en español para cada palabra.</CardDescription></CardHeader>
                        <CardContent><ScrollArea className="h-[500px] pr-4"><div className="grid grid-cols-2 gap-4">
                            <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs text-left">Inglés</div><div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs text-left">Español</div>
                            {subjVocab.map((v, i) => (
                                <Fragment key={i}>
                                    <div className="p-3 border rounded bg-white/5 font-bold flex items-center text-sm">{v.en}</div>
                                    <Input value={vocabAnswers[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const nv = [...vocabValidation]; nv[i] = 'unchecked'; setVocabValidation(nv); setCanAdvanceVocab(false); }} className={cn("uppercase", vocabValidation[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} />
                                </Fragment>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-between border-t pt-6"><Button onClick={handleCheckVocab} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar <ArrowRight className='ml-2 h-4 w-4'/></Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-8 text-left text-foreground overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">GRAMÁTICA: PRESENTE DE SUBJUNTIVO</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0 font-bold">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4">
                                <h3 className="text-xl font-black text-primary uppercase">1. ¿Qué es el Subjuntivo?</h3>
                                <p>Se usa para expresar deseos, emociones, recomendaciones, necesidades, dudas y posibilidades.</p>
                                <div className="grid grid-cols-2 gap-2 text-xs uppercase text-primary">
                                    {["Deseos", "Emociones", "Recomendaciones", "Necesidades"].map(it => <div key={it} className="p-2 border rounded bg-primary/10 text-center">{it}</div>)}
                                </div>
                            </div>
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4">
                                <h3 className="text-xl font-black text-primary uppercase">2. Formación</h3>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="p-4 border rounded bg-primary/5">
                                        <h4 className="font-black text-primary">-AR (Hablar)</h4>
                                        <p className="text-xl font-black text-foreground">habl-E</p>
                                        <ul className="text-xs mt-2 text-muted-foreground"><li>Yo: -e</li><li>Tú: -es</li><li>Él: -e</li><li>Nos: -emos</li><li>Ellos: -en</li></ul>
                                    </div>
                                    <div className="p-4 border rounded bg-brand-purple/5">
                                        <h4 className="font-black text-brand-purple">-ER (Comer)</h4>
                                        <p className="text-xl font-black text-foreground">com-A</p>
                                        <ul className="text-xs mt-2 text-muted-foreground"><li>Yo: -a</li><li>Tú: -as</li><li>Él: -a</li><li>Nos: -amos</li><li>Ellos: -an</li></ul>
                                    </div>
                                    <div className="p-4 border rounded bg-blue-500/5">
                                        <h4 className="font-black text-blue-500">-IR (Vivir)</h4>
                                        <p className="text-xl font-black text-foreground">viv-A</p>
                                        <ul className="text-xs mt-2 text-muted-foreground"><li>Yo: -a</li><li>Tú: -as</li><li>Él: -a</li><li>Nos: -amos</li><li>Ellos: -an</li></ul>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-yellow-100 dark:bg-yellow-900/20 rounded-[2rem] border-2 border-dashed border-yellow-500/50 text-foreground">
                                <h3 className="text-xl font-black text-yellow-800 dark:text-yellow-200 uppercase mb-4 flex items-center gap-2"><Info /> Verbos Irregulares</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                    {["SER -> sea", "ESTAR -> esté", "IR -> vaya", "TENER -> tenga", "HACER -> haga", "PODER -> pueda", "SABER -> sepa", "VENIR -> venga", "DECIR -> diga"].map(it => <div key={it} className="p-2 border rounded bg-white/50">{it}</div>)}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">¡Listo!</Button></CardFooter>
                    </Card>
                );
            case 'conjugation':
                const v = conjugationVerbs[conjIdx];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tighter'>Misión: Conjugación Subjuntiva ({conjIdx+1}/30)</CardTitle><CardDescription>Escribe la conjugación en Presente de Subjuntivo.</CardDescription></CardHeader>
                        <CardContent className="space-y-8 pt-8 flex flex-col items-center">
                            <div className="p-8 bg-gradient-to-br from-primary/5 to-brand-purple/5 rounded-[2.5rem] border-2 border-dashed border-primary/20 text-center"><h3 className="text-5xl font-black text-primary uppercase tracking-tighter">{v.es} ({v.en})</h3></div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl'>
                                {["YO", "TÚ", "ÉL/ELLA", "NOSOTROS", "ELLOS"].map((p, i) => (
                                    <div key={i} className='space-y-1'><Label className='text-[10px] font-black uppercase text-muted-foreground'>{p}</Label><Input value={conjAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...conjAns]; na[i] = e.target.value; setConjAns(na); const nv = [...conjVal]; nv[i] = 'unchecked'; setConjVal(nv); }} className={cn("h-10 text-lg uppercase transition-all", conjVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : conjVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-8 bg-muted/5"><Button onClick={() => {
                            const nv = conjAns.map((a, i) => a.trim().toLowerCase() === v.forms[i] ? 'correct' : 'incorrect');
                            setConjVal(nv);
                            if (nv.every(st => st === 'correct')) { toast({ title: "¡Perfecto!" }); if (conjIdx < conjugationVerbs.length - 1) { setTimeout(() => { setConjIdx(p => p+1); setConjAns(Array(5).fill('')); setConjVal(Array(5).fill('unchecked')); }, 800); } else handleTopicComplete('conjugation'); }
                            else toast({ variant: 'destructive', title: "Revisa la conjugación" });
                        }} size="lg" className="px-20 font-black h-14 text-xl shadow-xl uppercase">Verificar Verbo</Button></CardFooter>
                    </Card>
                );
            case 'exercise_1': return <BallsExercise title="Ejercicio 1: Formación" prompts={ex1Prompts} onComplete={() => handleTopicComplete('exercise_1')} vocabulary={{"estudiar": "study", "llegar": "arrive", "pronto": "soon", "comer": "eat", "dormir": "sleep"}} />;
            case 'exercise_2': return <BallsExercise title="Ejercicio 2: Deseos y Recomendaciones" prompts={ex2Prompts} onComplete={() => handleTopicComplete('exercise_2')} vocabulary={{"descansar": "rest", "ejercicio": "exercise", "camino": "way", "ahorrar": "save money"}} />;
            case 'vocab_game': return <VocabularyMatchingGame data={subjVocab.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Moods & Emotions Memory" />;
            case 'exercise_3': return <BallsExercise title="Ejercicio 3: Traducción Mixta" prompts={ex3Prompts} onComplete={() => handleTopicComplete('exercise_3')} vocabulary={{"alegrarse": "be glad", "preocuparse": "worry", "mañana": "tomorrow", "juntos": "together", "opinión": "mind / opinion"}} />;
            case 'reading':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader className='flex flex-row items-center justify-between bg-primary/5 border-b'>
                            <CardTitle className='text-primary uppercase font-black'>{readingData.title}</CardTitle>
                            <Popover>
                                <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger>
                                <PopoverContent className="w-64">
                                    <ScrollArea className="h-48 pr-4">
                                        <div className="space-y-2 text-sm text-left text-foreground">
                                            <h4 className="font-bold border-b pb-1 text-primary uppercase">Ayuda de Lectura</h4>
                                            {Object.entries(readingData.vocabulary).map(([es, en]) => (
                                                <div key={es} className="flex justify-between border-b border-muted pb-1"><span className="font-bold uppercase text-[10px]">{es}:</span><span className="text-muted-foreground italic text-[10px]">{en}</span></div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </PopoverContent>
                            </Popover>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner whitespace-pre-wrap">{readingData.content}</div>
                            <Separator />
                            <div className="space-y-4">{readingData.questions.map((q, i) => (
                                <div key={i} className="space-y-2"><Label className='font-bold'>{i+1}. {q.q}</Label><Input value={readAns[i] || ''} onChange={e => { if (targetStudentId) return; setReadAns({...readAns, [i]: e.target.value}); setReadVal({...readVal, [i]: 'unchecked'}); }} className={cn('mt-1 text-lg h-12', readVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                            ))}</div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => {
                            let ok = true; const nv: any = {};
                            readingData.questions.forEach((q, i) => { const res = q.a.some(a => (readAns[i] || '').trim().toLowerCase().includes(a.toLowerCase())); nv[i] = res ? 'correct' : 'incorrect'; if (!res) ok = false; });
                            setReadVal(nv); if (ok) { toast({ title: "¡Lectura superada!" }); handleTopicComplete('reading'); } else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
                        }} size="lg" className="px-12 font-bold" disabled={!!targetStudentId}>Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'exercise_4':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground">
                        <CardHeader><CardTitle className='text-foreground dark:text-primary uppercase'>Ejercicio 4: Opción Múltiple</CardTitle><div className="flex gap-2 pt-4 flex-wrap">{choiceExercisesData.map((_, i) => (<div key={i} onClick={() => setOptIdx(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", optIdx === i ? "border-primary ring-2 ring-primary" : "border-muted", optSolved[i] ? "bg-green-500 text-white border-green-500" : "bg-card")}>{i + 1}</div>))}</div></CardHeader>
                        <CardContent className="space-y-8 py-10">
                            <div className="text-3xl font-black text-center leading-relaxed">
                                {choiceExercisesData[optIdx].text.split('_______').map((part: string, i: number) => (<Fragment key={i}>{part}{i < 1 && <span className={cn("border-b-4 border-dashed px-4 mx-2", optSolved[optIdx] ? "text-primary border-primary" : "text-muted-foreground")}>{optSolved[optIdx] ? choiceExercisesData[optIdx].answer : '...'}</span>}</Fragment>))}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                                {choiceExercisesData[optIdx].options.map((opt: string) => (
                                    <Button key={opt} onClick={() => { if (opt.toUpperCase() === choiceExercisesData[optIdx].answer.toUpperCase()) { setOptSolved({...optSolved, [optIdx]: true}); toast({ title: "¡Correcto!" }); } else toast({ variant: 'destructive', title: "Incorrecto" }); }} variant="outline" className={cn("h-16 text-xl font-black uppercase transition-all", optSolved[optIdx] && opt.toUpperCase() === choiceExercisesData[optIdx].answer.toUpperCase() && "border-green-500 bg-green-50 text-green-700 shadow-lg scale-105")}>{opt}</Button>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6"><Button variant="outline" onClick={() => setOptIdx(p => Math.max(0, p - 1))} disabled={optIdx === 0}>Anterior</Button><Button onClick={() => { if (optIdx < choiceExercisesData.length - 1) setOptIdx(p => p + 1); else handleTopicComplete('exercise_4'); }} disabled={!optSolved[optIdx]} className="px-12 font-black h-12 shadow-xl">Siguiente</Button></CardFooter>
                    </Card>
                );
            case 'complete':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary uppercase tracking-tighter'>Completar: Misión Subjuntiva</CardTitle></CardHeader>
                        <CardContent className="p-0"><ScrollArea className="h-[500px] p-6"><div className="space-y-4">
                            {completionPrompts.map((q, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm">
                                    <p className="font-bold text-lg">{q.s}</p>
                                    <Input value={compAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...compAns]; na[i] = e.target.value; setCompAns(na); const nv = [...compVal]; nv[i] = 'unchecked'; setCompVal(nv); }} className={cn("h-10 max-w-sm text-lg font-mono uppercase", compVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : compVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="Respuesta..." autoComplete="off" readOnly={!!targetStudentId} />
                                </div>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/20"><Button onClick={() => {
                            let all = true; const nv = completionPrompts.map((q, i) => { const res = q.a.toLowerCase() === (compAns[i] || '').trim().toLowerCase(); if (!res) all = false; return res ? 'correct' : 'incorrect'; });
                            setCompVal(nv); if (all) { toast({ title: "¡Dominio Total!" }); handleTopicComplete('complete'); } else toast({ variant: 'destructive', title: "Hay errores en la lista" });
                        }} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Verificar Todo</Button></CardFooter>
                    </Card>
                );
            case 'translate_text':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className='text-primary uppercase'>Traducción de Texto: Advice for a friend</CardTitle>
                                    <CardDescription className='font-bold text-foreground'>Traduce el párrafo al español.</CardDescription>
                                </div>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger>
                                    <PopoverContent className="w-64">
                                        <ScrollArea className="h-64 pr-4">
                                            <div className="flex flex-col gap-4 text-sm text-left text-foreground">
                                                <h4 className="font-bold border-b pb-1 text-primary uppercase">Lista de Vocabulario</h4>
                                                {Object.entries(translationTextParagraph.vocab).map(([en, es], i) => (
                                                    <div key={i} className="flex flex-col border-b border-muted pb-1">
                                                        <span className="text-muted-foreground text-[10px] uppercase font-bold">{en}:</span>
                                                        <span className="font-bold text-primary text-xs uppercase">{es}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed shadow-sm">"{translationTextParagraph.english}"</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={transText} onChange={(e) => { if (targetStudentId) return; setTransText(e.target.value); }} placeholder="Escribe el texto en español aquí..." className="min-h-[250px] text-lg" readOnly={!!targetStudentId} /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20"><Button onClick={() => handleTopicComplete('translate_text')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Continuar <ArrowRight className='ml-3 h-8 w-8' /></Button></CardFooter>
                    </Card>
                );
            case 'final': return <BallsExercise title="Reto Final: Subjuntivo Avanzado" prompts={finalExercises} onComplete={() => handleTopicComplete('final')} vocabulary={{"take care": "cuidarse", "truth": "verdad", "rules": "reglas", "lost": "perdido"}} />;
            default: return null;
        }
    };

    if (isInitialLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-bold tracking-widest animate-pulse uppercase">Sincronizando Misión B1...</p>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* OJO ADMIN: Banner de Supervisión */}
                    {isAdmin && targetStudentId && (
                        <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md">
                            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400">
                                <Eye className="h-6 w-6 fill-current animate-pulse" />
                                <p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión: {studentProfile?.name || targetStudentId}</p>
                            </div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors">
                                <Link href="/admin">Cerrar Supervisión</Link>
                            </Button>
                        </div>
                    )}
                    
                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/b1" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2">
                            <ArrowLeft className="h-4 w-4" /> Volver al Curso B1
                        </Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3">
                           <Sparkles className='h-10 w-10 text-primary' /> Presente de Subjuntivo 🇪🇸
                        </h1>
                    </div>

                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9 md:order-1 order-2">
                            {renderContent()}
                        </div>

                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30">
                                    <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-primary" /> Misión Subjuntiva
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <nav><ul className="space-y-1">
                                        {learningPath.map((item) => {
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            const Icon = ICONS_CONFIG[item.status] || BookOpen;
                                            return (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                                    className={cn(
                                                        'flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground',
                                                        isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted',
                                                        selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm'
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}
                                                        <span className="truncate max-w-[150px] uppercase font-bold text-[10px]">{item.name}</span>
                                                    </div>
                                                    {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                                </li>
                                            );
                                        })}
                                    </ul></nav>
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

export default function PresenteSubjuntivoB1Page() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
        }>
            <PresenteSubjuntivoContentInternal />
        </Suspense>
    );
}