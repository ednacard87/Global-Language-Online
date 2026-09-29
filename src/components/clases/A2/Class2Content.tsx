'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
    Info,
    Check,
    X,
    ArrowLeft,
    Clock,
    Scale,
    Split
} from 'lucide-react';
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

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_a2_eng_u1_c2_v10_full_content';
const mainProgressKey = 'progress_a2_eng_unit_1_class_2';

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

type Topic = {
    key: string;
    name: string;
    icon: any;
    status: 'completed' | 'active' | 'locked';
};

// --- DATA ---

const basicVerbsVocab = [
    { en: "TO GIVE", es: "DAR" }, { en: "TO GO", es: "IR" }, { en: "TO HAVE", es: "HABER-TENER" },
    { en: "TO HEAR", es: "OIR" }, { en: "TO KNOW", es: "SABER-CONOCER" }, { en: "TO LEARN", es: "APRENDER" },
    { en: "TO LEAVE", es: "PARTIR-IRSE" }, { en: "TO LOSE", es: "PERDER" }, { en: "TO MAKE", es: "HACER" },
    { en: "TO MEET", es: "ENCONTRAR" }, { en: "TO PUT", es: "PONER" }, { en: "TO READ", es: "LEER" },
    { en: "TO RUN", es: "CORRER" }, { en: "TO SAY", es: "DECIR" }, { en: "TO SEE", es: "VER" },
    { en: "TO SELL", es: "VENDER" }, { en: "TO SEND", es: "ENVIAR" }, { en: "TO SLEEP", es: "DORMIR" },
    { en: "TO SPELL", es: "DELETREAR" }, { en: "TO SPEND", es: "GASTAR" }, { en: "TO SWIM", es: "NADAR" },
    { en: "TO TAKE", es: "TOMAR-AGARAR" },
];

const ex1Nouns = [
    { word: "COINS", cat: "countable" }, { word: "POLLUTION", cat: "uncountable" },
    { word: "CHAIR", cat: "countable" }, { word: "JUICE", cat: "uncountable" },
    { word: "COMPUTERS", cat: "countable" }, { word: "CAT", cat: "countable" },
    { word: "DOCUMENT", cat: "countable" }, { word: "PRIDE", cat: "uncountable" },
    { word: "TRAFFIC", cat: "uncountable" }, { word: "CARS", cat: "countable" },
    { word: "MILK", cat: "uncountable" }, { word: "SALT", cat: "uncountable" },
];

const ex2Prompts = [
    { spanish: "HAY MUCHAS MANZANAS EN ESE ARBOL", answer: ["there are many apples in that tree", "there are a lot of apples in that tree"] },
    { spanish: "YO VIVO CON EL HACE MUCHOS AÑOS", answer: ["i live with him many years ago", "i have lived with him for many years", "i lived with him many years ago"] },
    { spanish: "ESA SEÑORA TIENE DEMASIADOS GATOS", answer: ["that lady has too many cats", "that woman has too many cats"] },
    { spanish: "ESE LIBRO NO TIENE VARIAS PAGINAS, ESTA INCOMPLETO", answer: ["that book does not have many pages, it is incomplete", "that book does not have a lot of pages, it is incomplete", "that book doesn't have many pages, it's incomplete", "that book doesn't have a lot of pages, it's incomplete"] },
    { spanish: "YO ESTUDIO INGLES UN PAR DE VECES A LA SEMANA", answer: ["i study english a couple of times a week"] },
    { spanish: "HAY UNOS ARBOLES DE NARANJA EN ESA FINCA", answer: ["there are some orange trees in that farm", "there are some orange trees on that farm", "there are a few orange trees in that farm", "there are a few orange trees on that farm"] },
    { spanish: "EL DOMINGO HAY MENOS CARROS EN LA CIUDAD QUE EN SEMANA", answer: ["on sunday there are fewer cars in the city than during the week", "there are fewer cars in the city on sunday than during the week", "on sunday there are less cars in the city than during the week", "there are less cars in the city on sunday than during the week"] },
    { spanish: "UN GRAN NUMERO DE PERSONAS TIENE GRIPA PORQUE ESTAMOS EN LA TEMPORADA DE LLUVIA", answer: ["a great number of people have the flu because we are in the rainy season", "a large number of people have the flu because we are in the rainy season", "a great number of people have the flu because it is the rainy season", "a large number of people have the flu because it is the rainy season", "many people have the flu because we are in the rainy season", "many people have the flu because it is the rainy season"] },
    { spanish: "HAY MUCHAS MOTOS EN TAILANDIA", answer: ["there are many motorcycles in thailand", "there's many motorcycles in thailand"] },
    { spanish: "UN GRAN NUMERO DE PERROS VIVE EN LA FINCA DE DANIEL", answer: ["a great number of dogs live on daniel's farm", "a large number of dogs live on daniel's farm", "many dogs live on daniel's farm"] },
];

const ex3Prompts = [
    {
        spanish: "HAY MUCHO TRAFICO EN BOGOTA Y MEDELLIN PORQUE SON CIUDADES GRANDES", answer: [
            "there is much traffic in bogota and medellin because they are big cities",
            "there is a lot of traffic in bogota and medellin because they are big cities",
            "there's much traffic in bogota and medellin because they are big cities",
            "there's a lot of traffic in bogota and medellin because they are big cities"
        ]
    },
    {
        spanish: "HAY MUCHA CONTAMINACION EN ESE BARRIO PORQUE HAY MUCHAS EMPRESAS", answer: [
            "there is much pollution in that neighborhood because there are many companies",
            "there is a lot of pollution in that neighborhood because there are many companies",
            "there's much pollution in that neighborhood because there are many companies",
            "there's a lot of pollution in that neighborhood because there are many companies"
        ]
    },
    {
        spanish: "HAY DEMASIADA INFORMACION EN INTERNET, YO NO SE QUE ESTUDIAR", answer: [
            "there is too much information on the internet, i do not know what to study",
            "there's too much information on the internet, i don't know what to study",
            "there is too much information on the internet i do not know what to study",
            "there's too much information on the internet i don't know what to study"
        ]
    },
    { spanish: "HAY UN POQUITO DE AGUA EN ESA BOTELLA, ESTO NO ES SUFICIENTE, YO NECESITO MAS", answer: ["there is a little water in that bottle, this is not enough, i need more", "there's a little water in that bottle, this isn't enough, i need more"] },
    { spanish: "HAY UN POCO DE VINO EN LA COCINA, TRAELO", answer: ["there is a little wine in the kitchen, bring it", "there's a little wine in the kitchen, bring it"] },
    { spanish: "HAY MENOS RUIDO EN ESE BARRIO PORQUE ESTA LEJOS DE LA CIUDAD", answer: ["there is less noise in that neighborhood because it is far from the city", "there's less noise in that neighborhood because it's far from the city"] },
    { spanish: "HAY UNA GRAN CANTIDAD DE ARENA EN TUS ZAPATOS, SACALA", answer: ["there is a great amount of sand in your shoes, take it out", "there's a great amount of sand in your shoes, take it out", "there is a lot of sand in your shoes, take it out", "there's a lot of sand in your shoes, take it out"] },
    { spanish: "ELLA TIENE TANTO TRABAJO Y POR ESO NO NOS PODEMOS REUNIR", answer: ["she has so much work and that's why we can't meet", "she has so much work and that's why we can't get together"] },
    { spanish: "¿CUANTO TRAFICO HAY EN TU CIUDAD?", answer: ["how much traffic is there in your city?", "how much traffic is there in your city?", "how much traffic is there in your city?", "how much traffic is there in your city?"] },
    { spanish: "¿CUANTOS CELULARES HAY SOBRE LA MESA?", answer: ["how many cell phones are there on the table?", "how many cell phones are there on the table?", "how many cell phones are there on the table?", "how many cell phones are there on the table?"] },
    { spanish: "ELLA TIENE MUCHOS ANIMALES", answer: ["she has many animals", "she has a lot of animals"] },
    { spanish: "EN ESTA CIUDAD HAY MUCHA CONTAMINACION", answer: ["there is much pollution in this city", "there is a lot of pollution in this city", "there's much pollution in this city", "there's a lot of pollution in this city"] },
    { spanish: "YO TENGO MUCHOS AMIGOS EN MEDELLIN", answer: ["i have many friends in medellin", "i have a lot of friends in medellin"] },
    { spanish: "ELLA TIENE VARIAS COSAS POR HACER HOY", answer: ["she has several things to do today"] },
    { spanish: "HAY MUCHOS LUGARES POR CONOCER", answer: ["there are many places to visit", "there's many places to visit"] },
    { spanish: "EL TIENE POCOS EJERCICIOS PARA HACER ESTE FINDE", answer: ["he has few exercises to do this weekend", "he has a few exercises to do this weekend"] },
];

const ex4Prompts = [
    {
        spanish: "ELLOS TIENEN MUCHOS AMIGOS EN HOLANDA", answer: [
            "they have many friends in the netherlands",
            "they have a lot of friends in the netherlands",
            "they have many friends in holland",
            "they have a lot of friends in holland"
        ]
    },
    {
        spanish: "EN ESTE PARQUE HAY ALGUNOS ARBOLES DE NARANJAS", answer: [
            "in this park there are some orange trees",
            "there are some orange trees in this park"
        ]
    },
    {
        spanish: "EN ESA FINCA HAY MUCHAS FLORES DE VARIOS COLORES", answer: [
            "in that farm there are many flowers of various colors",
            "in that farm there are many flowers of different colors",
            "there are many flowers of various colors in that farm",
            "there are a lot of flowers of various colors in that farm"
        ]
    },
    { spanish: "EN ESTA CIUDAD HAY MUCHAS MOTOS", answer: ["there are many motorcycles in this city", "there's many motorcycles in this city", "there are a lot of motorcycles in this city", "there's a lot of motorcycles in this city"] },
    { spanish: "TODA EL AGUA DE ESE RIO ESTA LIMPIA, YA QUIERO NADAR ALLÁ Y VER PECES", answer: ["all the water in that river is clean, i already want to swim there and see fish"] },
    { spanish: "TODOS LOS PECES DE ESE ACUARIO SON DORADOS", answer: ["all the fish in that aquarium are golden"] },
    { spanish: "LA MAYORIA DE LOS FAMOSOS VIVEN EN ESTADOS UNIDOS", answer: ["most celebrities live in the united states"] },
    { spanish: "HAY MUCHOS PUNTOS DE ENCUENTRO EN ESTA CIUDAD", answer: ["there are many meeting points in this city", "there's many meeting points in this city", "there are a lot of meeting points in this city", "there's a lot of meeting points in this city"] },
    { spanish: "NO HAY SUFICIENTES LIBROS EN ESE ESTANTE", answer: ["there aren't enough books on that shelf", "there aren't enough books on that shelf"] },
    { spanish: "HAY POCAS SILLAS Y MUCHOS ESTUDIANTES", answer: ["there are few chairs and many students", "there are a few chairs and many students"] },
];

const someAnyPrompts = [
    {
        spanish: "TENEMOS MUCHOS AMIGOS EN ESTADOS UNIDOS", answer: [
            "we have many friends in the united states",
            "we have a lot of friends in the united states",
            "we have many friends in the us",
            "we have a lot of friends in the usa"
        ]
    },
    {
        spanish: "NO HAY NINGUN TURISTA EN LA CIUDAD", answer: [
            "there are not any tourists in the city",
            "there aren't any tourists in the city",
            "there is no tourist in the city",
            "there is not any tourist in the city"
        ]
    },
    { spanish: "¿CUANTOS GATOS TIENES?", answer: ["how many cats do you have?", "how many cats do you have"] },
    { spanish: "HAY DEMASIADOS PROBLEMAS EN ESA EMPRESA", answer: ["there are too many problems in that company", "there's too many problems in that company"] },
    { spanish: "TENGO DEMASIADAS COSAS POR HACER EL FIN DE SEMANA", answer: ["I have too many things to do this weekend", "i have too many things to do this weekend"] },
    { spanish: "NO HAY MUCHO TIEMPO, LLAMALO", answer: ["there is not much time, call him", "there's not much time, call him"] },
    { spanish: "¿CUANTA PLATA TIENES? –YO TENGO UN POQUITO EN EFECTIVO, EL RESTO DE DINERO ESTA EN EL BANCO", answer: ["how much money do you have? - i have a little bit in cash, the rest of the money is in the bank", "how much money do you have? i have a little bit in cash, the rest of the money is in the bank", "how much money do you have? - i have a little cash, the rest of the money is in the bank", "how much money do you have? - i have a little cash, the rest of the money is in the bank"] },
    { spanish: "¡HAY DEMASIADO TRABAJO POR HACER, APURATE!", answer: ["there is too much work to do, hurry up!", "there's too much work to do, hurry up!", "there is too much work to do hurry up", "there's too much work to do hurry up"] },
    { spanish: "HAY MUCHA CONTAMINACION EN EL CENTRO", answer: ["there is too much pollution in the center", "there's too much pollution in the center", "there is a lot of pollution in the center", "there's a lot of pollution in the center"] },
    { spanish: "¿QUIERES UNAS GALLETAS Y CAFÉ?", answer: ["do you want some cookies and coffee?", "do you want some cookies and coffee", "do you want cookies and coffee?", "do you want cookies and coffee"] },
    { spanish: "TENGO ALGUNOS DOLARES EN MI BILLETERA", answer: ["i have some dollars in my wallet", "i have some dollars in my wallet", "i have some dollars in my wallet", "i have some dollars in my wallet", "i have some dollars in my wallet", "i have some dollars in my wallet", "i have some dollars in my wallet", "i have some dollars in my wallet"] },
    { spanish: "HAY UN POCO DE LECHE EN LA NEVERA, ME LA PUEDES DAR, PORFAVOR", answer: ["there is a little milk in the fridge, can you give it to me, please?", "there is a little milk in the fridge can you give it to me please?", "there's a little milk in the fridge, can you give it to me, please?", "there's a little milk in the fridge can you give it to me please?"] },
    { spanish: "¿PUEDES DARME UN POCO DE AGUA?, ESTOY CANSADO Y SEDIENTO", answer: ["can you give me some water? i'm tired and thirsty", "can you give me some water i'm tired and thirsty", "can you give me some water? i am tired and thirsty", "can you give me some water i am tired and thirsty"] },
    { spanish: "NO TENGO NINGUN GATO, YO TENGO UN PERRO, SU NOMBRE ES TOBY", answer: ["i don't have any cats, i have a dog, his name is toby", "i don't have any cats i have a dog his name is toby", "i don't have any cats, i have a dog, his name is Toby", "i don't have any cats i have a dog his name is Toby"] },
    { spanish: "ÉL NO TIENE DINERO, ENTONCES NO PUEDE IR A LA FINCA", answer: ["he doesn't have any money, so he can't go to the farm", "he doesn't have any money so he can't go to the farm", "he doesn't have money, so he can't go to the farm", "he doesn't have money so he can't go to the farm"] },
    { spanish: "¿HAY ALGUNOS CAMBIOS EN LA EMPRESA?", answer: ["are there any changes in the company?", "are there any changes in the company?", "are there any changes in the company?", "are there any changes in the company?"] },
    { spanish: "NO HAY MUCHOS ESTUDIANTES HOY", answer: ["there are not many students today", "there are not many students today", "there aren't many students today", "there aren't many students today"] },
    { spanish: "¿HAY JUGO DE NARANJA EN ESA TIENDA?", answer: ["is there any orange juice in that store?", "is there any orange juice in that store?", "is there any orange juice in that store?", "is there any orange juice in that store?"] },
    { spanish: "¿CUANTAS CASAS TIENES?", answer: ["how many houses do you have?", "how many houses do you have?", "how many houses do you have?", "how many houses do you have?"] },
    { spanish: "NO HAY ARBOLES EN ESA MONTAÑA", answer: ["there are not any trees on that mountain", "there are not any trees on that mountain", "there aren't any trees on that mountain", "there aren't any trees on that mountain"] },
    { spanish: "¿CUANTA PLATA TIENE ÉL? EL TIENE MUCHAS DEUDAS", answer: ["how much money does he have? he has many debts", "how much money does he have? he has many debts", "how much money does he have? he has many debts", "how much money does he have? he has many debts"] },
    { spanish: "ELLA NO TIENE PLATA, ENTONCES NO PUEDE IR A LA COSTA", answer: ["she doesn't have any money, so she can't go to the coast", "she doesn't have any money so she can't go to the coast", "she doesn't have money, so she can't go to the coast", "she doesn't have money so she can't go to the coast"] },
    { spanish: "EL TIENE MUCHOS LIBROS EN SU ESCRITORIO, ESO ES UN DESORDEN", answer: ["he has many books on his desk, that's a mess", "he has many books on his desk that's a mess", "he has many books on his desk, that is a mess", "he has many books on his desk that is a mess"] },
    { spanish: "ELLA NO TIENE MUCHOS TACONES, A ELLA LE GUSTAN LOS TENIS", answer: ["she doesn't have many high heels, she likes sneakers", "she doesn't have many high heels she likes sneakers", "she doesn't have many heels, she likes sneakers", "she doesn't have many heels she likes sneakers"] },
    { spanish: "TENGO MUCHOS AMIGOS EN HOLANDA", answer: ["i have many friends in holland", "i have many friends in holland", "i have many friends in holland", "i have many friends in holland"] },
    { spanish: "¿TIENES UN POCO DE AZUCAR? -EL CAFÉ ESTA AMARGO", answer: ["do you have some sugar? - the coffee is bitter", "do you have some sugar? the coffee is bitter", "do you have some sugar, the coffee is bitter", "do you have sugar? - the coffee is bitter", "do you have sugar? the coffee is bitter", "do you have sugar, the coffee is bitter"] },
    { spanish: "TENEMOS POCO TIEMPO PARA EL PROYECTO, ENTONCES DEBEMOS TRABAJAR EL FIN DE SEMANA", answer: ["we have little time for the project, so we must work on the weekend", "we have little time for the project so we must work on the weekend", "we have little time for the project, so we have to work on the weekend", "we have little time for the project so we have to work on the weekend", "we have little time for the project, so we need to work on the weekend", "we have little time for the project so we need to work on the weekend", "we have little time for the project, so we should work on the weekend", "we have little time for the project so we should work on the weekend"] },
    { spanish: "¿TIENES UNOS DOLARES?", answer: ["do you have some dollars?", "do you have some dollars?", "do you have some dollars?", "do you have some dollars?"] },
    { spanish: "HAY POCOS TURISTAS AQUÍ HOY", answer: ["there are few tourists here today", "there are few tourists here today", "there are few tourists here today", "there are few tourists here today", "there are few tourists here today", "there are few tourists here today", "there are few tourists here today", "there are few tourists here today"] },
    { spanish: "¿QUIERES JUGO? NO GRACIAS, YO ESTOY TOMANDO CAFÉ", answer: ["do you want juice? no thanks, i'm drinking coffee", "do you want juice? no thanks, i am drinking coffee", "do you want some juice? no thanks, i'm drinking coffee", "do you want some juice? no thanks, i am drinking coffee", "do you want juice, no thanks i'm drinking coffee", "do you want juice no thanks i am drinking coffee", "do you want some juice, no thanks i'm drinking coffee", "do you want some juice no thanks i am drinking coffee"] },
    { spanish: "HAY POCOS PROYECTOS EN LA EMPRESA ACTUALMENTE ", answer: ["there are few projects in the company currently", "there are few projects in the company currently", "there are few projects in the company currently", "there are few projects in the company currently", "there are few projects in the company currently", "there are few projects in the company currently", "there are few projects in the company currently", "there are few projects in the company currently"] },
];

const ex5Prompts = [
    {
        spanish: "¿CUANTA LECHE HAY EN LA NEVERA? - HAY TRES LITROS", answer: [
            "how much milk is there in the fridge? - there are three liters",
            "how much milk is there in the fridge? there are three liters",
            "how much milk is in the fridge? - there are three liters",
            "how much milk is there in the refrigerator? - there are three liters",
            "how much milk is there in the fridge? - there are 3 liters",
            "how much milk is in the fridge? there are three liters",
        ]
    },
    {
        spanish: "¿CUANTO VINO HAY EN LA CAJA? - HAY DOS BOTELLAS", answer: [
            "how much wine is there in the box? - there are two bottles",
            "how much wine is there in the box? there are two bottles",
            "how much wine is in the box? - there are two bottles",
            "how much wine is there in the box? - there are 2 bottles",
            "how much wine is in the box? there are two bottles"
        ]
    },
    {
        spanish: "¿CUANTOS ANIMALES HAY EN LA FINCA? – HAY 6 PERROS", answer: [
            "how many animals are there on the farm? - there are 6 dogs",
            "how many animals are there on the farm? there are 6 dogs",
            "how many animals are there on the farm? - there are six dogs",
            "how many animals are there in the farm? - there are 6 dogs",
            "how many animals are there in the farm? - there are six dogs"
        ]
    },
    {
        spanish: "¿CUANTOS CARROS HAY AFUERA DE LA IGLESIA? – HAY 10 CARROS", answer: [
            "how many cars are there outside the church? there are 10 cars",
            "how many cars are there outside the church? - there are 10 cars",
            "how many cars are there outside the church? - there are ten cars",
            "how many cars are there outside the church? there are 10 cars"
        ]
    },
    {
        spanish: "¿CUANTAS ESTRELLAS HAY EN EL CIELO? – HAY MUCHAS ESTRELLAS", answer: [
            "how many stars are there in the sky? there are many stars",
            "how many stars are there in the sky? - there are many stars",
            "how many stars are there in the sky? - there are many stars",
            "how many stars are there in the sky? there are many stars"
        ]
    },
    {
        spanish: "¿CUANTA GENTE VIVE EN ESA ISLA? EN ESA ISLA VIVE MUCHA GENTE, YO NO SE", answer: [
            "how many people live on that island? many people live on that island, I don't know",
            "how many people live on that island? - many people live on that island, I don't know",
            "how many people live on that island? - many people live on that island, I don't know",
            "how many people live on that island? many people live on that island, I don't know"
        ]
    },
    {
        spanish: "¿CUANTOS PAJAROS HAY EN ESE ARBOL? - HAY 8 PAJAROS", answer: [
            "how many birds are there in that tree? there are 8 birds",
            "how many birds are there in that tree? - there are 8 birds",
            "how many birds are there in that tree? - there are eight birds",
            "how many birds are there in that tree? there are 8 birds"
        ]
    },
    {
        spanish: "¿CUANTA AGUA HAY EN EL OCEANO? – EN EL OCEANO HAY DEMASIADA AGUA", answer: [
            "how much water is there in the ocean? there is too much water in the ocean",
            "how much water is there in the ocean? - there is too much water in the ocean",
            "how much water is there in the ocean? - there is too much water in the ocean",
            "how much water is there in the ocean? there is too much water in the ocean"
        ]
    },
    {
        spanish: "¿CUANTA INFORMACION HAY EN INTERNET? – EN INTERNET HAY MUCHA INFO", answer: [
            "how much information is there on the internet? there is a lot of information on the internet",
            "how much information is there on the internet? - there is a lot of information on the internet",
            "how much information is there on the internet? - there is a lot of information on the internet",
            "how much information is there on the internet? there is a lot of information on the internet"
        ]
    },
    {
        spanish: "¿CUANTA ARENA HAY EN EL DESIERTO? – YO NO TENGO NI IDEA", answer: [
            "how much sand is there in the desert? I don't have any idea",
            "how much sand is there in the desert? - I don't have any idea",
            "how much sand is there in the desert? - I don't have any idea",
            "how much sand is there in the desert? I don't have any idea"
        ]
    },
    {
        spanish: "¿CUANTOS HUESOS HAY EN EL CUERPO HUMANO? – HAY 206", answer: [
            "how many bones are there in the human body? there are 206 bones",
            "how many bones are there in the human body? - there are 206 bones",
            "how many bones are there in the human body? - there are two hundred six bones",
            "how many bones are there in the human body? there are 206 bones"
        ]
    },
    {
        spanish: "12-	¿CUANTO PAN HAY EN EL CAJON? - HAY UNA BOLSA PAN ", answer: [
            "how much bread is there in the drawer? there is a bag of bread",
            "how much bread is there in the drawer? - there is a bag of bread",
            "how much bread is there in the drawer? - there is a bag of bread",
            "how much bread is there in the drawer? there is a bag of bread"
        ]
    },
    {
        spanish: "¿CUANTOS PAISES HAY EN EL MUNDO?: EN EL MUNDO HAY ", answer: [
            "how many countries are there in the world? there are many countries in the world",
            "how many countries are there in the world? - there are many countries in the world",
            "how many countries are there in the world? - there are many countries in the world",
            "how many countries are there in the world? there are many countries in the world"
        ]
    },
    {
        spanish: "¿CUANTO DINERO HAY EN ESE BANCO? – EN ESE BANCO HAY MUCHA PLATA: ", answer: [
            "how much money is there in that bank? there is a lot of money in that bank",
            "how much money is there in that bank? - there is a lot of money in that bank",
            "how much money is there in that bank? - there is a lot of money in that bank",
            "how much money is there in that bank? there is a lot of money in that bank"
        ]
    },
];

const ex6Prompts = [
    {
        spanish: "NOSOTROS NO TENEMOS MUCHO TIEMPO PARA ESCUCHAR TUS PROBLEMAS, NECESITAMOS UNA SOLUCION", answer: [
            "we do not have much time to listen to your problems, we need a solution",
            "we don't have much time to listen to your problems, we need a solution",
            "we do not have much time to listen to your problems we need a solution",
            "we don't have much time to listen to your problems we need a solution"
        ]
    },
    {
        spanish: "ELLA TIENE ALGUNAS MANZANAS EN LA CAJA", answer: [
            "she has some apples in the box",
            "she's got some apples in the box"
        ]
    },
    {
        spanish: "¿HAY MUCHOS CINES EN ESA CIUDAD?", answer: [
            "are there many cinemas in that city?",
            "are there a lot of cinemas in that city?",
            "are there many movie theaters in that city?",
            "are there many cinemas in that city",
            "are there a lot of cinemas in that city"
        ]
    },
    {
        spanish: "¿TIENES HERMANOS O HERMANAS? ", answer: [
            "do you have any brothers or sisters?",
            "do you have any sisters?",
            "do you have any brothers?",
            "do you have brothers or sisters?"
        ]
    },
    {
        spanish: "¿QUIERES CAFÉ?: ", answer: [
            "do you want any coffee?",
            "do you want coffee?",
            "do you want some coffee?"
        ]
    },
    {
        spanish: "¿CUANTO TIEMPO NECESITAS PARA TERMINAR EL PROYECTO?  ", answer: [
            "how much time do you need to finish the project?",
            "how much time do you need to finish the project"
        ]
    },
    {
        spanish: "¿HAS VISITADO OTROS PAISES? ", answer: [
            "have you visited other countries?",
            "have you ever visited other countries?"
        ]
    },
    {
        spanish: "YO GASTE MUCHO TIEMPO VIENDO TELENOVELAS ", answer: [
            "I spent a lot of time watching soap operas",
            "I spent much time watching soap operas"
        ]
    },
    {
        spanish: "¿CUANTO DINERO TIENES PARA COMPRAR EL CARRO? ", answer: [
            "how much money do you have to buy the car?"
        ]
    },
    {
        spanish: "¿CUANTO QUESO HAY EN LA NEVERA? ", answer: [
            "how much cheese is there in the fridge?"
        ]
    },
];

const finalExPrompts = [
    {
        spanish: "¿HAY POCA CONTAMINACION EN TU CIUDAD?", answer: [
            "is there little pollution in your city?",
            "is there little pollution in your city"
        ]
    },
    {
        spanish: "¿HAY MUCHO RUIDO EN TU BARRIO?", answer: [
            "is there much noise in your neighborhood?",
            "is there a lot of noise in your neighborhood?",
            "is there much noise in your neighborhood",
            "is there a lot of noise in your neighborhood"
        ]
    },
    {
        spanish: "¿CUANTOS HERMANOS TIENE ELLA?", answer: [
            "how many brothers does she have?",
            "how many siblings does she have?",
            "how many brothers does she have",
            "how many siblings does she have"
        ]
    },
    { spanish: "HAY POCA GENTE EN EL CINE", answer: ["there are few people in the cinema"] },
    { spanish: "¿TE GUSTARIA ALGO DE AZUCAR EN TU CAFÉ?: ", answer: ["do you like sugar in your coffee?", "would you like some sugar in your coffee?"] },
    { spanish: "HAY MUCHISIMO TRAFICO EN EL CENTRO", answer: ["there is too much traffic in the center"] },
    { spanish: "¿EL TIENE POCO DINERO?: ", answer: ["does he have little money?"] },
    { spanish: "¿HAY MUCHOS TURISTAS EN CARTAGENA?: ", answer: ["are there many tourists in Cartagena?"] },
    { spanish: "¿TIENES ALGUNOS DOLARES EN LA BILLETERA?: ", answer: ["do you have any dollars in your wallet?"] },
    { spanish: "HAY POCOS LIBROS EN EL ESCRITORIO", answer: ["there are few books on the desk"] },
    { spanish: "HAY MENOS CARROS EN ESTE BARRIO QUE EN EL MIO", answer: ["there are fewer cars in this neighborhood than in mine"] },
    { spanish: "¿DONDE TRABAJAS?", answer: ["where do you work?"] },
    { spanish: "YO NO TENGO MUCHA PLATA", answer: ["i don't have much money", "i do not have much money"] },
    { spanish: "HAY MUCHO RUIDO EN LA CALLE, YO NO PUEDO DORMIR", answer: ["there is too much noise in the street, I can't sleep", "there is a lot of noise in the street, I can't sleep", "there is too much noise in the street I can't sleep", "there is a lot of noise in the street I can't sleep"] },
    { spanish: "¿CUANTOS GATOS HAY EN ESA CASA?", answer: ["how many cats are there in that house?"] },
    { spanish: "YO TENGO UNAS MONEDAS (COINS) EN MI BOLSILLO (POCKET), NO ME GUSTAN LAS MONEDAS ENTONCES YO NECESITO GASTARLAS", answer: ["i have some coins in my pocket, i don't like coins so i need to spend them", "i have some coins in my pocket I don't like coins so I need to spend them", "i don't like coins so i need to spend them", "i don't like coins so i need to spend them"] },
    { spanish: "ELLOS TIENEN MUCHO TIEMPO PARA DISFRUTAR EN VACACIONES", answer: ["they have a lot of time to enjoy their vacation", "they have much time to enjoy their vacation"] },
    { spanish: "YO NO TENGO MUCHAS BOTELLAS (BOTTLES) DE VINO", answer: ["i don't have many bottles of wine", "i do not have many bottles of wine"] },
    { spanish: "ELLA NO TIENE NINGUN HERMANO, ELLA ES HIJA UNICA", answer: ["she doesn't have any brothers, she's an only child", "she doesn't have any brothers, she is an only child", "she does not have any brothers, she's an only child", "she does not have any brothers, she is an only child", "she doesn't have any siblings, she's an only child", "she doesn't have any siblings, she is an only child"] },
    { spanish: "¿TUVISTE MUCHOS PROBLEMAS EN ESA EMPRESA?", answer: ["did you have many problems in that company?", "did you have a lot of problems in that company?"] },
];

const readingContent = {
    title: "Our Life in the City",
    text: `I live in a very big city. There is a lot of traffic every morning, so I always leave my house early. 

In my neighborhood, there are many tall buildings and some small parks. Most of the people here work in offices. 

We have some problems with pollution because there are many cars, but the government is trying to use more renewable energy. 

How many parks are there? Not many, but there is enough space for children to play. I love my city, but sometimes there is too much noise!`,
    questions: [
        { id: 'q1', question: "Why does the narrator leave the house early?", answers: ["there is a lot of traffic", "lot of traffic", "traffic"] },
        { id: 'q2', question: "Are there many parks in the neighborhood?", answers: ["no, not many", "some small parks", "no", "not many"] },
        { id: 'q3', question: "Why is there pollution in the city?", answers: ["there are many cars", "many cars", "because there are many cars"] }
    ]
};

// --- HELPERS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary, isSupervisionMode, isAdmin, isFinalExercise }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<string[]>(Array(prompts.length).fill(''));
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});
    const [verified, setVerified] = useState(false);

    useEffect(() => {
        setCurrentIndex(0);
        setAnswers(Array(prompts.length).fill(''));
        setStatus({});
        setVerified(false);
    }, [prompts]);

    const currentPrompt = prompts[currentIndex];
    if (!currentPrompt) return null;

    const handleVerifyAll = () => {
        if (isSupervisionMode) return;
        let allOk = true;
        const newStatus: any = {};
        prompts.forEach((p: any, i: number) => {
            const userVal = (answers[i] || '').trim().toLowerCase().replace(/[.?,¿!¡\-–]/g, '').replace(/\s+/g, ' ');
            const isOk = p.answer.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡\-–]/g, '').replace(/\s+/g, ' ') === userVal);
            newStatus[i] = isOk ? 'correct' : 'incorrect';
            if (!isOk) allOk = false;
        });
        setStatus(newStatus);
        setVerified(true);
        if (allOk) {
            toast({ title: "¡Buen trabajo! Todas correctas." });
        } else {
            toast({ variant: 'destructive', title: "Sigue intentando, revisa las incorrectas." });
        }
    };

    const allCorrect = verified && prompts.every((_: any, i: number) => status[i] === 'correct');

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start text-left">
                    <div className="w-full">
                        <CardTitle>{title}</CardTitle>
                        <CardDescription className='font-bold text-foreground mt-1'>Traduce la frase correctamente.</CardDescription>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div
                                    key={i}
                                    onClick={() => setCurrentIndex(i)}
                                    className={cn(
                                        "h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all",
                                        currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted",
                                        verified && status[i] === 'correct' ? "bg-green-500 text-white border-green-500" :
                                            verified && status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" :
                                                answers[i] ? "bg-blue-100 text-blue-600 border-blue-400" : "bg-card text-foreground"
                                    )}
                                >
                                    {i + 1}
                                </div>
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
                                <div className="space-y-2 text-foreground text-left">
                                    <h4 className="font-bold border-b pb-1 text-primary">Vocabulario Útil</h4>
                                    <ScrollArea className="h-48 pr-4">
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                            {Object.entries(vocabulary).map(([es, en]: any) => (
                                                <Fragment key={es}>
                                                    <span className="text-muted-foreground capitalize">{es}:</span>
                                                    <span className="font-semibold text-right">{en}</span>
                                                </Fragment>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">
                    {currentPrompt.spanish}
                </div>
                <Input
                    value={answers[currentIndex] || ''}
                    onChange={e => {
                        const newAns = [...answers];
                        newAns[currentIndex] = e.target.value;
                        setAnswers(newAns);
                        if (verified) {
                            const newStatus = { ...status };
                            newStatus[currentIndex] = 'unchecked';
                            setStatus(newStatus);
                        }
                    }}
                    onKeyDown={e => e.key === 'Enter' && currentIndex < prompts.length - 1 && setCurrentIndex(i => i + 1)}
                    className={cn(
                        "h-12 text-lg text-foreground",
                        verified && status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/5' :
                            verified && status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/5' : ''
                    )}
                    placeholder="Tu traducción..."
                    autoComplete="off"
                    readOnly={isSupervisionMode}
                />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setCurrentIndex(p => Math.min(prompts.length - 1, p + 1))} disabled={currentIndex === prompts.length - 1}>Siguiente</Button>
                </div>
                <div className="flex gap-2">
                    {currentIndex === prompts.length - 1 && !isSupervisionMode && (
                        <Button onClick={handleVerifyAll} variant="secondary">Verificar</Button>
                    )}
                    {(allCorrect || isAdmin) && (
                        <Button
                            onClick={onComplete}
                            className={cn(
                                "text-white font-bold",
                                isFinalExercise ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-600 hover:bg-green-700"
                            )}
                        >
                            {isFinalExercise ? 'Finalizar' : 'Continuar'} {isFinalExercise ? <Trophy className="ml-2 h-4 w-4" /> : <ArrowRight className="ml-2 h-4 w-4" />}
                        </Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
};

const Congratulations = () => (
    <Card className="border-2 border-green-500 bg-green-500/10 text-center p-12 flex flex-col items-center animate-in fade-in zoom-in duration-500">
        <Trophy className="h-24 w-24 text-yellow-400 mb-6 animate-bounce" />
        <h2 className="text-4xl font-black text-green-600 dark:text-green-400 uppercase tracking-tighter">
            Congratulations
        </h2>
        <p className="text-2xl mt-4 font-bold text-foreground">you finish this class 2 (A2)</p>
        <Button asChild variant="outline" className="mt-8 px-10 h-12 font-bold">
            <Link href="/ingles/a2">Regresar a la unidad 1 A2</Link>
        </Button>
    </Card>
);

// --- MAIN CLASS COMPONENT ---

export default function Class2Content({ overrideStudentId }: { overrideStudentId?: string | null }) {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const searchParams = useSearchParams();

    const targetStudentId = overrideStudentId || searchParams?.get('studentId');
    const currentUID = targetStudentId || user?.uid;
    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);

    const { data: authUserProfile } = useDoc<{ role?: string }>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string, lessonProgress?: any, progress?: any, name?: string }>(studentDocRef);

    const isAdmin = useMemo(() => Boolean(user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [isFinished, setIsFinished] = useState(false);
    const hasInitialized = useRef(false);

    // States for content
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(basicVerbsVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(basicVerbsVocab.length).fill('unchecked'));
    const [ex1Answers, setEx1Answers] = useState<Record<number, string>>({});
    const [ex1Validation, setEx1Validation] = useState<Record<number, any>>({});
    const [readAns, setReadAns] = useState<Record<string, string>>({});
    const [readVal, setReadVal] = useState<Record<string, any>>({});

    const initialPathData: Topic[] = useMemo(() => [
        { key: 'vocabulary_basic', name: '1. Vocabulary (Verbos Basicos)', icon: BookOpen, status: 'locked' },
        { key: 'grammar_1', name: '2. Grammar 1', icon: GraduationCap, status: 'locked' },
        { key: 'exercise_1', name: '3. Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'grammar_2_quantifiers', name: '4. Grammar 2 (Quantifiers)', icon: GraduationCap, status: 'locked' },
        { key: 'exercise_2', name: '5. Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'exercise_3', name: '6. Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'grammar_3_base', name: '7. Grammar 3', icon: GraduationCap, status: 'locked' },
        { key: 'exercise_4', name: '8. Exercise 4', icon: PenSquare, status: 'locked' },
        { key: 'vocabulary_game', name: '9. Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
        { key: 'grammar_3_some_any', name: '10. Grammar 3 (Some & Any)', icon: GraduationCap, status: 'locked' },
        { key: 'ex_some_any', name: '11. Exercise with some & any', icon: PenSquare, status: 'locked' },
        { key: 'grammar_4', name: '12. Grammar 4', icon: GraduationCap, status: 'locked' },
        { key: 'exercise_5', name: '13. Exercise 5', icon: PenSquare, status: 'locked' },
        { key: 'exercise_6', name: '14. Exercise 6', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: '15. Reading', icon: BookText, status: 'locked' },
        { key: 'final_exercise', name: '16. Final Exercise', icon: Trophy, status: 'locked' },
    ], []);

    useEffect(() => {
        if (!isUserLoading && !isProfileLoading) setIsInitialLoading(false);
    }, [isUserLoading, isProfileLoading]);

    useEffect(() => {
        if (isInitialLoading || hasInitialized.current) return;
        let path = initialPathData.map((topic, index) => ({
            ...topic,
            status: index === 0 ? 'active' : 'locked' as 'completed' | 'active' | 'locked'
        }));
        const d = studentProfile?.lessonProgress?.[progressStorageVersion] || {};
        if (isAdmin && !targetStudentId) {
            path.forEach(t => t.status = 'completed');
        } else {
            path.forEach(t => { if (d[t.key]) t.status = d[t.key]; });
            let last = true;
            for (let i = 0; i < path.length; i++) {
                if (last && path[i].status === 'locked') path[i].status = 'active';
                last = path[i].status === 'completed';
            }
        }
        setLearningPath(path);
        setSelectedTopic(d.lastSelectedTopic || path.find(it => it.status === 'active')?.key || path[0].key);
        setInitialLoadComplete(true);
        hasInitialized.current = true;
    }, [isInitialLoading, studentProfile, isAdmin, initialPathData, targetStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || targetStudentId || !hasInitialized.current || !user) return;

        const saveTimer = setTimeout(() => {
            const s: any = { lastSelectedTopic: selectedTopic, vocabAnswers, readAns };
            learningPath.forEach(t => s[t.key] = t.status);

            const currentSavedData = studentProfile?.lessonProgress?.[progressStorageVersion];
            const currentOverallProgress = studentProfile?.progress?.[mainProgressKey];

            if (JSON.stringify(s) !== JSON.stringify(currentSavedData) || progressValue !== currentOverallProgress) {
                updateDocumentNonBlocking(studentDocRef, {
                    [`lessonProgress.${progressStorageVersion}`]: s,
                    [`progress.${mainProgressKey}`]: progressValue
                });
            }
            if (progressValue >= 100) {
                window.dispatchEvent(new CustomEvent('progressUpdated'));
            }
        }, 1500);

        return () => clearTimeout(saveTimer);
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, targetStudentId, initialLoadComplete, vocabAnswers, readAns, user, studentProfile]);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setLearningPath(curr => {
            const np = curr.map(t => ({ ...t }));
            const idx = np.findIndex(t => t.key === completedKey);
            if (idx !== -1) {
                np[idx].status = 'completed';
                if (idx + 1 < np.length) {
                    if (np[idx + 1].status === 'locked') {
                        np[idx + 1].status = 'active';
                        setTimeout(() => toast({ title: "¡Misión desbloqueada!" }), 0);
                    }
                    setSelectedTopic(np[idx + 1].key);
                }
            }
            return np;
        });
    }, [toast]);

    const handleTopicSelect = (key: string) => {
        const t = learningPath.find(it => it.key === key);
        if (!isAdmin && t?.status === 'locked') {
            toast({ variant: "destructive", title: "Contenido Bloqueado" });
            return;
        }
        setSelectedTopic(key);
    };

    const handleCheckVocab = () => {
        let ok = true;
        const nv = basicVerbsVocab.map((v, i) => {
            const res = v.en === (vocabAnswers[i] || '').trim().toUpperCase();
            if (!res) ok = false;
            return res ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv);
        if (ok) {
            toast({ title: "¡Vocabulario Completo! Pulsa Continuar." });
        } else {
            toast({ variant: 'destructive', title: "Revisa tus respuestas" });
        }
    };

    const handleCheckEx1 = () => {
        let ok = true;
        const nv: any = {};
        ex1Nouns.forEach((item, i) => {
            const res = ex1Answers[i] === item.cat;
            nv[i] = res ? 'correct' : 'incorrect';
            if (!res) ok = false;
        });
        setEx1Validation(nv);
        if (ok) {
            toast({ title: "¡Excelente! Todas correctas. Pulsa Continuar." });
        } else {
            toast({ variant: 'destructive', title: "Revisa las respuestas incorrectas." });
        }
    };

    const handleCheckReading = () => {
        let allOk = true;
        const nv: any = {};
        readingContent.questions.forEach(q => {
            const userAns = (readAns[q.id] || '').trim().toLowerCase().replace(/[.?,¿!¡\-–]/g, '').replace(/\s+/g, ' ');
            const res = q.answers.some(a => {
                const cleanA = a.toLowerCase().replace(/[.?,¿!¡\-–]/g, '').replace(/\s+/g, ' ');
                return userAns.includes(cleanA);
            });
            nv[q.id] = res ? 'correct' : 'incorrect';
            if (!res) allOk = false;
        });
        setReadVal(nv);
        if (allOk) {
            toast({ title: "¡Lectura Superada! Pulsa Continuar." });
        } else {
            toast({ variant: 'destructive', title: "Revisa tus respuestas" });
        }
    };

    const isVocabComplete = vocabValidation.length > 0 && vocabValidation.every(v => v === 'correct');
    const isEx1AllCorrect = ex1Nouns.length > 0 && ex1Nouns.every((_, i) => ex1Validation[i] === 'correct');

    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic);
        if (!topic) return null;

        switch (selectedTopic) {
            case 'vocabulary_basic':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><CardTitle>Vocabulary: Basic Verbs</CardTitle></CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[500px] pr-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="font-black text-primary border-b pb-2 uppercase text-xs">Español</div><div className="font-black text-primary border-b pb-2 uppercase text-xs">Inglés</div>
                                    {basicVerbsVocab.map((v, i) => (
                                        <Fragment key={i}>
                                            <div className="p-3 border rounded bg-white/5 font-bold flex items-center text-sm">{v.es}</div>
                                            <Input
                                                value={vocabAnswers[i] || ''}
                                                onChange={e => {
                                                    const na = [...vocabAnswers];
                                                    na[i] = e.target.value;
                                                    setVocabAnswers(na);
                                                    const nv = [...vocabValidation];
                                                    nv[i] = 'unchecked';
                                                    setVocabValidation(nv);
                                                }}
                                                className={cn("h-12 uppercase font-mono", vocabValidation[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')}
                                                autoComplete="off"
                                                readOnly={Boolean(isAdmin && targetStudentId)}
                                            />
                                        </Fragment>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 mt-4">
                            <Button onClick={handleCheckVocab} variant="secondary">Verificar</Button>
                            {(isVocabComplete || isAdmin) && (
                                <Button onClick={() => handleTopicComplete('vocabulary_basic')} className='bg-green-600 hover:bg-green-700 text-white font-bold'>
                                    Continuar <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                );
            case 'grammar_1':
                return (
                    <div className="space-y-6 text-left text-foreground">
                        <Card className="shadow-soft border-2 border-brand-purple bg-card/40 backdrop-blur-md p-6">
                            <CardHeader><CardTitle className="text-3xl font-black text-primary uppercase">GRAMMAR: COUNTABLE vs UNCOUNTABLE</CardTitle></CardHeader>
                            <CardContent className="space-y-8 font-bold">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="p-6 bg-white/40 dark:bg-slate-800/40 rounded-3xl border border-primary/20 shadow-lg">
                                        <h3 className="text-2xl font-black text-primary uppercase mb-4 flex items-center gap-2"><Scale className='h-6 w-6' /> Countable Nouns</h3>
                                        <p className="mb-4">Son cosas que podemos contar usando números. Tienen forma singular y plural.</p>
                                        <ul className="space-y-2 text-sm italic list-disc pl-5">
                                            <li>One apple, two apples</li>
                                            <li>A chair, three chairs</li>
                                            <li>One cat, ten cats</li>
                                        </ul>
                                    </div>
                                    <div className="p-6 bg-white/40 dark:bg-slate-800/40 rounded-3xl border border-brand-purple/20 shadow-lg">
                                        <h3 className="text-2xl font-black text-brand-purple uppercase mb-4 flex items-center gap-2"><Clock className='h-6 w-6' /> Uncountable Nouns</h3>
                                        <p className="mb-4">Son cosas que no podemos contar con números. Generalmente son líquidos, polvos o conceptos abstractos.</p>
                                        <ul className="space-y-2 text-sm italic list-disc pl-5">
                                            <li>Water, milk, juice (Líquidos)</li>
                                            <li>Salt, sugar, sand (Polvos)</li>
                                            <li>Traffic, pollution, information (Abstractos)</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center pt-6 border-t">
                                <Button onClick={() => handleTopicComplete('grammar_1')} size="lg" className="px-16 font-black h-14 text-xl uppercase shadow-xl">Entendido</Button>
                            </CardFooter>
                        </Card>
                    </div>
                );
            case 'exercise_1':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>Exercise 1: Classification</CardTitle><CardDescription>Clasifica cada palabra como Contable (C) o Incontable (U).</CardDescription></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {ex1Nouns.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
                                        <span className="font-bold text-lg">{item.word}</span>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant={ex1Answers[i] === 'countable' ? 'default' : 'outline'}
                                                onClick={() => {
                                                    setEx1Answers({ ...ex1Answers, [i]: 'countable' });
                                                    setEx1Validation({ ...ex1Validation, [i]: null });
                                                }}
                                                className={cn(ex1Validation[i] === 'correct' && item.cat === 'countable' && "bg-green-500", ex1Validation[i] === 'incorrect' && ex1Answers[i] === 'countable' && "bg-red-500")}
                                            >
                                                C
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={ex1Answers[i] === 'uncountable' ? 'default' : 'outline'}
                                                onClick={() => {
                                                    setEx1Answers({ ...ex1Answers, [i]: 'uncountable' });
                                                    setEx1Validation({ ...ex1Validation, [i]: null });
                                                }}
                                                className={cn(ex1Validation[i] === 'correct' && item.cat === 'uncountable' && "bg-green-500", ex1Validation[i] === 'incorrect' && ex1Answers[i] === 'uncountable' && "bg-red-500")}
                                            >
                                                U
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6">
                            <Button onClick={handleCheckEx1} variant="secondary" size="lg" className="px-8 font-bold">Verificar</Button>
                            {(isEx1AllCorrect || isAdmin) && (
                                <Button onClick={() => handleTopicComplete('exercise_1')} className="bg-green-600 hover:bg-green-700 text-white font-bold" size="lg">
                                    Continuar <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                );
            case 'grammar_2_quantifiers':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left text-foreground">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">GRAMMAR 2: QUANTIFIERS</CardTitle></CardHeader>
                        <CardContent className="space-y-8 font-bold">
                            <div className="p-4 bg-white/50 dark:bg-background/20 rounded-xl border">
                                <h4 className="text-primary font-black uppercase text-sm mb-2">With Countables:</h4>
                                <ul className="space-y-1">
                                    <li>MANY (Muchos/as)</li>
                                    <li>TOO MANY (Demasiados/as)</li>
                                    <li>A FEW (Pocos/as)</li>
                                </ul>
                            </div>
                            <div className="p-4 bg-white/50 dark:bg-background/20 rounded-xl border">
                                <h4 className="text-brand-purple font-black uppercase text-sm mb-2">With Uncountables:</h4>
                                <ul className="space-y-1">
                                    <li>MUCH (Mucho/a)</li>
                                    <li>TOO MUCH (Demasiado/a)</li>
                                    <li>A LITTLE (Poco/a)</li>
                                </ul>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t">
                            <Button onClick={() => handleTopicComplete('grammar_2_quantifiers')} size="lg" className="px-12 font-bold">Entendido</Button>
                        </CardFooter>
                    </Card>
                );
            case 'exercise_2':
                return (
                    <BallsExercise
                        title="Exercise 2: Countable Quantifiers"
                        prompts={ex2Prompts}
                        onComplete={() => handleTopicComplete('exercise_2')}
                        vocabulary={{ "manzanas": "apples", "arbol": "tree", "muchos años": "many years", "demasiados": "too many" }}
                        isSupervisionMode={!!targetStudentId}
                        isAdmin={isAdmin}
                    />
                );
            case 'exercise_3':
                return (
                    <BallsExercise
                        title="Exercise 3: Uncountable Quantifiers"
                        prompts={ex3Prompts}
                        onComplete={() => handleTopicComplete('exercise_3')}
                        vocabulary={{ "tráfico": "traffic", "contaminación": "pollution", "empresas": "companies", "demasiada": "too much", "información": "information" }}
                        isSupervisionMode={!!targetStudentId}
                        isAdmin={isAdmin}
                    />
                );
            case 'grammar_3_base':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 p-6 text-left text-foreground">
                        <CardHeader><CardTitle className="text-xl font-bold text-primary uppercase">GRAMMAR 3: QUANTIFIERS FOR BOTH</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm font-bold">
                            {[
                                "ALL OF THE TREES – WATER: todos los árboles, toda el agua.",
                                "SOME CANDIES: algunos caramelos",
                                "ANY: ninguno - algunos-as",
                                "NO- NONE: NINGUNO-A, NADA DE.",
                                "MOST OF THE TREES-WATER: la mayoría de los árboles/ de agua",
                                "ENOUGH TRAFFIC- BOOKS: suficiente tráfico, suficientes libros",
                                "A LOT OF -LOTS OF CATS- POLLUTION: muchos gatos, mucha contaminacion",
                                "PLENTY OF CARS- TRAFFIC: bastante / tantos arboles- trafico",
                                "A LACK OF ANIMALS- WATER: una falta de animales-agua"
                            ].map((rule, idx) => (
                                <div key={idx} className="p-3 bg-muted/30 rounded-lg border flex items-center gap-3">
                                    <div className="h-2 w-2 bg-primary rounded-full shrink-0" />
                                    <p>{rule}</p>
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-4">
                            <Button onClick={() => handleTopicComplete('grammar_3_base')} size="lg">Entendido</Button>
                        </CardFooter>
                    </Card>
                );
            case 'exercise_4':
                return (
                    <BallsExercise
                        title="Exercise 4: General Translation"
                        prompts={ex4Prompts}
                        onComplete={() => handleTopicComplete('exercise_4')}
                        vocabulary={{ "Holanda": "The Netherlands", "algunos": "some", "varios": "various" }}
                        isSupervisionMode={!!targetStudentId}
                        isAdmin={isAdmin}
                    />
                );
            case 'vocabulary_game':
                return (
                    <VocabularyMatchingGame
                        data={basicVerbsVocab.map(v => ({ spanish: v.es, english: [v.en] }))}
                        onComplete={() => handleTopicComplete('vocabulary_game')}
                        title="Basic Verbs Memory"
                    />
                );
            case 'grammar_3_some_any':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left text-foreground">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">GRAMMAR 3: SOME & ANY</CardTitle></CardHeader>
                        <CardContent className="space-y-6 font-bold">
                            <div className="space-y-4">
                                <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                                    <h4 className="text-green-600 font-black mb-2 uppercase">SOME</h4>
                                    <p>(+) Frases Afirmativas: Algunos / Unos / Algo de.</p>
                                    <p>(?) Interrogativas: Cuando se PIDE o se OFRECE algo.</p>
                                    <div className="mt-2 text-xs italic text-muted-foreground">Ej: Would you like some coffee? / Can I have some water?</div>
                                </div>
                                <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                                    <h4 className="text-red-600 font-black mb-2 uppercase">ANY</h4>
                                    <p>(-): En las Negativas: Ninguno / Nada de.</p>
                                    <p>(?): En las Interrogativas: ¿Algo de? / ¿Algunos?.</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6">
                            <Button onClick={() => handleTopicComplete('grammar_3_some_any')} size="lg" className="px-12 font-bold h-12 uppercase">Continuar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'ex_some_any':
                return (
                    <BallsExercise
                        title="Exercise: Some & Any"
                        prompts={someAnyPrompts}
                        onComplete={() => handleTopicComplete('ex_some_any')}
                        vocabulary={{ "turista": "tourist", "ningún": "any (neg)", "cuántos": "how many" }}
                        isSupervisionMode={!!targetStudentId}
                        isAdmin={isAdmin}
                    />
                );
            case 'grammar_4':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left text-foreground">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">GRAMMAR 4: HOW MUCH & HOW MANY</CardTitle></CardHeader>
                        <CardContent className="space-y-6 font-bold">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 bg-card rounded-2xl border">
                                    <h4 className="text-primary font-black uppercase mb-1">HOW MANY?</h4>
                                    <p className="text-xs mb-2">Sustantivos Contables (Plural)</p>
                                    <p className="text-base">¿Cuántos / Cuántas?</p>
                                </div>
                                <div className="p-4 bg-card rounded-2xl border">
                                    <h4 className="text-brand-purple font-black uppercase mb-1">HOW MUCH?</h4>
                                    <p className="text-xs mb-2">Sustantivos No Contables</p>
                                    <p className="text-base">¿Cuánto / Cuánta?</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 bg-card rounded-2xl border">
                                    <h4 className="text-primary font-black uppercase mb-1">THERE ARE</h4>
                                    <p className="text-xs mb-2">Contables (Plural)</p>
                                    <p className="text-base">HAY</p>
                                </div>
                                <div className="p-4 bg-card rounded-2xl border">
                                    <h4 className="text-brand-purple font-black uppercase mb-1">THERE IS</h4>
                                    <p className="text-xs mb-2">No Contables / Singular</p>
                                    <p className="text-base">HAY</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6">
                            <Button onClick={() => handleTopicComplete('grammar_4')} size="lg" className="px-12 font-bold h-12">Entendido</Button>
                        </CardFooter>
                    </Card>
                );
            case 'exercise_5':
                return (
                    <BallsExercise
                        title="Exercise 5: Quantities"
                        prompts={ex5Prompts}
                        onComplete={() => handleTopicComplete('exercise_5')}
                        vocabulary={{ "leche": "milk", "litros": "liters", "vino": "wine", "botellas": "bottles", "finca": "farm" }}
                        isSupervisionMode={!!targetStudentId}
                        isAdmin={isAdmin}
                    />
                );
            case 'exercise_6':
                return (
                    <BallsExercise
                        title="Exercise 6: Mix"
                        prompts={ex6Prompts}
                        onComplete={() => handleTopicComplete('exercise_6')}
                        vocabulary={{ "mucho tiempo": "much time", "escuchar": "listen to", "problemas": "problems", "solución": "solution", "algunas": "some", "cines": "cinemas" }}
                        isSupervisionMode={!!targetStudentId}
                        isAdmin={isAdmin}
                    />
                );
            case 'reading': {
                const isReadingAllCorrect = readingContent.questions.length > 0 && readingContent.questions.every(q => readVal[q.id] === 'correct');
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className="uppercase tracking-tighter">Reading: {readingContent.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner whitespace-pre-wrap">{readingContent.text}</div>
                            <Separator />
                            <div className="space-y-4">
                                {readingContent.questions.map(q => (
                                    <div key={q.id} className="space-y-2">
                                        <Label className='font-bold text-foreground'>{q.question}</Label>
                                        <Input
                                            value={readAns[q.id] || ''}
                                            onChange={e => {
                                                setReadAns({ ...readAns, [q.id]: e.target.value });
                                                if (readVal[q.id]) {
                                                    setReadVal({ ...readVal, [q.id]: 'unchecked' });
                                                }
                                            }}
                                            className={cn(
                                                "h-12 text-lg text-foreground",
                                                readVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' :
                                                    readVal[q.id] === 'incorrect' ? 'border-red-500 bg-red-50/10' : ''
                                            )}
                                            autoComplete="off"
                                            readOnly={Boolean(isAdmin && targetStudentId)}
                                            placeholder="Tu respuesta..."
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center border-t pt-6">
                            <Button
                                onClick={handleCheckReading}
                                variant="secondary"
                                size="lg"
                                className="px-8 font-bold"
                                disabled={Boolean(isAdmin && targetStudentId)}
                            >
                                Verificar
                            </Button>
                            {(isReadingAllCorrect || isAdmin) && (
                                <Button
                                    onClick={() => handleTopicComplete('reading')}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold"
                                    size="lg"
                                >
                                    Continuar <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                );
            }
            case 'final_exercise':
                if (isFinished) return <Congratulations />;
                return (
                    <BallsExercise
                        title="Final Exercise"
                        prompts={finalExPrompts}
                        onComplete={() => {
                            handleTopicComplete('final_exercise');
                            setIsFinished(true);
                            toast({ title: 'Congratulations', description: 'you finish this class 2 (A2)' });
                        }}
                        vocabulary={{ "poca": "little", "ruido": "noise", "barrio": "neighborhood", "hermanos": "brothers" }}
                        isSupervisionMode={!!targetStudentId}
                        isAdmin={isAdmin}
                        isFinalExercise
                    />
                );
            default: return null;
        }
    };

    if (isInitialLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-white font-bold tracking-widest animate-pulse uppercase">Sincronizando Misión A2...</p>
            </div>
        );
    }

    return (
        <div className="grid gap-8 md:grid-cols-12 text-foreground animate-in fade-in duration-500">
            {/* Contenido Principal */}
            <div className="md:col-span-9 md:order-1 order-2">
                {renderContent()}
            </div>

            {/* Sidebar de Navegación Lateral */}
            <div className="md:col-span-3 md:order-2 order-1 text-left">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader className="pb-4 border-b bg-muted/30">
                        <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-primary" /> Misión 2A
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <nav>
                            <ul className="space-y-1">
                                {learningPath.map((item) => {
                                    const isLocked = item.status === 'locked' && !isAdmin;
                                    const Icon = ICONS_CONFIG[item.status as keyof typeof ICONS_CONFIG] || BookOpen;
                                    return (
                                        <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                            className={cn(
                                                'flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground',
                                                isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted',
                                                selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm'
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                {item.status === 'completed' ? (
                                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                                ) : (
                                                    <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />
                                                )}
                                                <span className="truncate max-w-[150px] text-[10px] uppercase font-bold">{item.name}</span>
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
    );
}
