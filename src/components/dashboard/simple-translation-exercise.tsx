'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/context/language-context';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Trophy, BookText } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
    },
    c5_mixed4: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: '¿DÓNDE ESTAN TUS PADRES?', english: ["where are your parents?"] },
            { spanish: '¿ESTAS CON WILLIAM?', english: ["are you with william?"] },
            { spanish: 'ELLOS NO SON NUESTROS HERMANOS', english: ["they are not our brothers", "they aren't our brothers"] },
            { spanish: 'YO ESTOY CON (WITH) MI HERMANA', english: ["i am with my sister", "i'm with my sister"] },
            { spanish: '¿QUIENES SON ELLOS?', english: ["who are they?"] },
            { spanish: 'ELLA NO ESTA CANSADA', english: ["she is not tired", "she isn't tired"] },
            { spanish: 'ESTOS (THESE)NO SON NUESTROS CARROS', english: ["these are not our cars", "these aren't our cars"] }
        ]
    },
    c6_ex1: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'YO TENGO UNA MASCOTA – ESTA ES MI MASCOTA', english: ['i have a pet - this is my pet', 'i have a pet this is my pet'] },
            { spanish: 'TU TIENES UN CARRO – ESTE ES TU CARRO', english: ['you have a car - this is your car', 'you have a car this is your car'] },
            { spanish: 'ÉL TIENE UNA HERMANA – ESTA ES SU HERMANA', english: ['he has a sister - this is his sister', 'he has a sister this is his sister'] },
            { spanish: 'ELLA TIENE UN CABALLO – ESE ES SU CABALLO', english: ['she has a horse - that is her horse', 'she has a horse that is her horse'] },
            { spanish: 'EL GATO TIENE UN JUGUETE – ESE ES SU JUGUETE', english: ['the cat has a toy - that is its toy', 'the cat has a toy that is its toy'] },
            { spanish: 'NOSOTROS TENEMOS UNA FINCA – ESA ES NUESTRA FINCA', english: ['we have a farm - that is our farm', 'we have a farm that is our farm', 'we have a country house - that is our country house'] },
            { spanish: 'ELLOS TIENEN UNA CASA- ESA ES SU CASA', english: ['they have a house - that is their house', 'they have a house that is their house'] },
            { spanish: 'YO TENGO UN LIBRO- ESTE ES MI LIBRO', english: ['i have a book - this is my book', 'i have a book this is my book'] },
        ]
    },
    c6_ex2: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'TU TIENES LIBROS - ESTOS SON TUS LIBROS', english: ["you have books - these are your books", "you have books these are your books"] },
            { spanish: 'MIS HERMANOS VIENEN DE ESPAÑA', english: ["my brothers come from spain"] },
            { spanish: 'AL GATO LE GUSTA SU COMIDA', english: ["the cat likes its food"] },
            { spanish: 'RICHARD ES MI HIJO - EL ES NUESTRO HIJO', english: ["richard is my son - he is our son", "richard is my son he is our son"] },
            { spanish: '¿DÓNDE ESTÁN TUS ZAPATOS?', english: ["where are your shoes?"] },
            { spanish: '¿DÓNDE ESTÁ SU CASA? - (DE ELLA)', english: ["where is her house?"] },
            { spanish: '¿ELLOS SON SUS PADRES? (DE ELLOS)', english: ["are they their parents?"] },
            { spanish: 'ESTA ES MI CASA - ESA NO ES SU CASA- (DE EL)', english: ["this is my house - that is not his house", "this is my house - that isn't his house"] },
            { spanish: '¿ELLA ES SU NOVIA? (DE EL)', english: ["is she his girlfriend?"] },
            { spanish: '¿ELLOS SON TUS AMIGOS?', english: ["are they your friends?"] },
        ]
    },
    c6_ex3: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'ESTE ES MI CARRO – ESTE ES MIO', english: ["this is my car - this is mine", "this is my car this is mine"] },
            { spanish: 'ESTA ES TU FINCA – ESA ES LA TUYA', english: ["this is your farm - that is yours", "this is your farm that is yours", "this is your country house - that is yours"] },
            { spanish: 'ESTE ES SU LIBRO (de ella) - ESTE ES SUYO', english: ["this is her book - this is hers", "this is her book this is hers"] },
            { spanish: 'ESTA ES SU CASA (de ellos)– ESTA ES SUYA', english: ["this is their house - this is theirs", "this is their house this is theirs"] },
            { spanish: 'ESAS SON MIS GAFAS – ESAS SON LAS MIAS', english: ["those are my glasses - those are mine", "those are my glasses those are mine"] },
            { spanish: 'ESE ES SU CELULAR (de él) – ESE ES EL SUYO', english: ["that is his cellphone - that is his", "that is his cellphone that is his"] },
        ]
    },
    c6_ex4: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'ESE COMPUTADOR ES MIO', english: ["that computer is mine"] },
            { spanish: 'ESA CASA ES NUESTRA', english: ["that house is ours"] },
            { spanish: 'ESTOS SON NUESTROS LIBROS', english: ["these are our books"] },
            { spanish: 'ESE CARRO NEGRO ES MÍO', english: ["that black car is mine"] },
            { spanish: '¿ESTE PERRO ES TUYO? - SI', english: ["is this dog yours? yes, it is", "is this dog yours? yes it is"] },
            { spanish: 'ESAS SON TUS GAFAS', english: ["those are your glasses"] },
            { spanish: '¿ESTA MI HERMANO AQUÍ?', english: ["is my brother here?"] },
            { spanish: 'EL LIBRO ES NUESTRO', english: ["the book is ours"] },
            { spanish: '¿SU CARRO ESTÁ AHÍ? (DE ELLOS)', english: ["is their car there?"] },
            { spanish: 'ESTA ES SU FINCA- (DE ELLA)', english: ["this is her farm", "this is her country house"] },
            { spanish: 'TU AMIGO ESTÁ ESPERANDOTE EN LA PUERTA', english: ["your friend is waiting for you at the door"] },
            { spanish: 'SUS ZAPATOS SON NEGROS (DE EL)', english: ["his shoes are black"] },
            { spanish: 'MIS PADRES ESTAN EN SU CASA', english: ["my parents are at home", "my parents are in their house"] },
            { spanish: 'A LOS PERROS LES GUSTA SU COMIDA', english: ["dogs like their food", "the dogs like their food"] },
            { spanish: '¿DÓNDE ESTÁN TUS ZAPATOS DE CUERO?', english: ["where are your leather shoes?"] },
            { spanish: 'EL RESTAURANTE ES DE ELLOS', english: ["the restaurant is theirs"] },
            { spanish: 'MI NÚMERO DE TELÉFONO ES…', english: ["my telephone number is", "my phone number is"] },
            { spanish: 'SU JUGUETE ESTÁ EN MI CARRO (DEL GATO)', english: ["its toy is in my car"] },
            { spanish: '¿ESTE CARRO ES DE ELLOS?', english: ["is this car theirs?"] },
            { spanish: '¿ESTE ES SU SANDUCHE? (DE ELLA)', english: ["is this her sandwich?"] },
            { spanish: 'MI CAFÉ ESTÁ MUY CALIENTE, NO PUEDO TOMARLO', english: ["my coffee is very heart, i cannot drink it", "my coffee is very hot, i can't drink it"] },
            { spanish: '¿ESTE ES SUYO? (DE ELLA)', english: ["is this hers?"] },
        ]
    },
    c6_ex5: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'YO TENGO UN RELOJ NUEVO- EL RELOJ ES MIO', english: ["i have a new watch - the watch is mine", "i have a new watch the watch is mine"] },
            { spanish: 'JANE TIENE UNA CASA VIEJA- LA CASA ES DE ELLA', english: ["jane has an old house - the house is hers", "jane has an old house the house is hers"] },
            { spanish: 'MARY TIENE UNA MASCOTA- LA MASCOTA ES DE ELLA', english: ["mary has a pet - the pet is hers", "mary has a pet the pet is hers"] },
            { spanish: 'TÚ TIENES ALGUNAS CAMISETAS NUEVAS- LAS CAMISETAS SON TUYAS', english: ["you have some new t-shirts - the t-shirts are yours", "you have some new t-shirts the t-shirts are yours"] },
            { spanish: 'TIM Y LOUIS TIENEN UNA NUEVA PAGINA WEB- LA PAGINA WEB ES DE ELLOS', english: ["tim and louis have a new website - the website is theirs", "tim and louis have a new website the website is theirs"] },
            { spanish: 'NOSOTROS SOMOS ESTUDIANTES- YO SOY UN ESTUDIANTE', english: ["we are students - i am a student", "we're students - i'm a student"] },
            { spanish: 'YO TENGO UN PERRO PEQUEÑO– EL PERRO ES MIO', english: ["i have a small dog - the dog is mine", "i have a small dog the dog is mine"] },
            { spanish: 'ELLOS TIENEN UNA CAJA- LA CAJA ES DE ELLOS', english: ["they have a box - the box is theirs", "they have a box the box is theirs"] },
            { spanish: 'ELLA TIENE UN PORTATIL BLANCO- EL PORTATIL ES DE ELLA', english: ["she has a white laptop - the laptop is hers", "she has a white laptop the laptop is hers"] },
            { spanish: 'NOSOTROS TENEMOS UNA FINCA- LA FINCA ES NUESTRA', english: ["we have a farm - the farm is ours", "we have a farm the farm is ours", "we have a country house - the country house is ours"] },
        ]
    },
    c6_ex6: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'PERDI MIS LLAVES', english: ["i lost my keys"] },
            { spanish: '¿ESTE ES MÍO Ó ES TUYO?', english: ["is this mine or is it yours?", "is this mine or is yours?"] },
            { spanish: 'YO CONOZCO SU HERMANO (DE ELLA)', english: ["i know her brother"] },
            { spanish: 'ELLOS SON NUESTROS PARIENTES', english: ["they are our relatives"] },
            { spanish: 'TU NO ERES SU AMIGO- (DE EL)', english: ["you are not his friend", "you aren't his friend", "you're not his friend"] },
            { spanish: '¿ELLOS SON TUS AMIGOS?', english: ["are they your friends?"] },
            { spanish: '¿ESTAS SON SUS ARETAS? - (DE ELLA)', english: ["are these her earrings?"] },
            { spanish: '¿ESTA ES SU CHAQUETA? (DE ÉL)', english: ["is this his jacket?"] },
        ]
    },
    c6_ex7: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'ESTE ES SU BOLSO Y EL OTRO ES MÍO (DE ELLA)', english: ["this is her bag and the other one is mine", "this is her bag and the other is mine"] },
            { spanish: 'TU ERES FRANCÉS, TU FAMILIA VIVE EN FRANCIA', english: ["you are french, your family lives in france", "you're french, your family lives in france"] },
            { spanish: '¿ESTA CAMISETA ES TUYA O MÍA?', english: ["is this t-shirt yours or mine?", "is this shirt yours or mine?"] },
            { spanish: '¿DONDE ESTÁ SU CELULAR? - (DE EL)', english: ["where is his cellphone?", "where is his phone?", "where's his cellphone?", "where's his phone?"] },
            { spanish: 'ESTA ES NUESTRA FAMILIA', english: ["this is our family"] },
        ]
    },
    c7_ex1: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'LOS PARQUES SON TRANQUILOS (QUIET) DURANTE LA NOCHE', english: ['parks are quiet at night', 'parks are quiet during the night'] },
            { spanish: 'ELLA ES LA MÁS JOVEN DE LA FAMILIA', english: ['she is the youngest in the family', "she's the youngest in the family"] },
            { spanish: 'ME GUSTAN LOS JUGOS PORQUE SON SALUDABLES', english: ['i like juices because they are healthy', "i like juice because it is healthy"] },
            { spanish: '¿TE GUSTO LA PELÍCULA QUE VISTE AYER?', english: ['did you like the movie you saw yesterday?', 'did you like the movie that you saw yesterday?'] },
            { spanish: 'LA CIUDAD MÁS GRANDE DE COLOMBIA ES BOGOTA', english: ['the biggest city in colombia is bogota'] },
            { spanish: 'ME GUSTAN LOS ANIMALES, ESPECIALMENTE LOS PERROS/GATOS', english: ['i like animals, especially dogs and cats', 'i like animals, especially dogs/cats'] },
            { spanish: 'A ELLA NO LE GUSTAN LAS ARAÑAS', english: ["she does not like spiders", "she doesn't like spiders"] },
            { spanish: '¿TE GUSTAN LAS FRUTAS? - SI', english: ['do you like fruits? yes, i do', 'do you like fruit? yes, i do'] },
            { spanish: 'EL HERMANO DE ANTONIO ES MUY ALTO', english: ["antonio's brother is very tall"] },
            { spanish: 'ME GUSTAN MUCHO LAS MARIPOSAS', english: ['i like butterflies very much', 'i really like butterflies'] },
            { spanish: 'A ELLA LE GUSTAN MUCHO LOS CARROS', english: ['she likes cars very much', 'she really likes cars'] },
            { spanish: 'CUANDO ESCUCHO MUSICA, ME GUSTA ESCUCHARLA CON AUDIFONOS PORQUE NO ME GUSTA MOLESTAR A LAS PERSONAS', english: ["when i listen to music, i like to listen to it with headphones because i don't like to disturb people", "when i listen to music i like to listen to it with headphones because i do not like to disturb people"] },
        ]
    },
    c7_ex2: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'AYER, KATY ENCONTRÓ UN GATO PERDIDO', english: ["yesterday katy found a lost cat"] },
            { spanish: 'LA MAMA DE TOM COMPRA VERDURAS IN ESE SUPERMERCADO', english: ["tom's mom buys vegetables in that supermarket", "tom's mother buys vegetables in that supermarket"] },
            { spanish: 'CHARLY VIO UN ACCIDENTE EN LA CALLE', english: ["charly saw an accident on the street"] },
            { spanish: 'SARA QUIERE IR A UN CONCIERTO EL VIERNES EN LA NOCHE', english: ["sara wants to go to a concert on friday night", "sara wants to go to a concert on fridays at night"] },
            { spanish: 'EL ES UN INGENIERO Y SU ESPOSA ES UNA DOCTORA', english: ["he is an engineer and his wife is a doctor", "he's an engineer and his wife's a doctor"] },
        ]
    },
    c7_ex3: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'ELLOS SON DOCTORES- EL ES UN DOCTOR', english: ["they are doctors - he is a doctor", "they're doctors - he's a doctor"] },
            { spanish: 'YO NO TENGO UNA MANZANA- YO TENGO UNA SANDIA', english: ["i do not have an apple - i have a watermelon", "i don't have an apple - i have a watermelon"] },
            { spanish: 'NOSOTROS SOMOS ESTUDIANTES- YO SOY UN ESTUDIANTE', english: ["we are students - i am a student", "we're students - i'm a student"] },
            { spanish: 'ELLOS SON PRIMOS- EL ES PRIMO DE CHRISTIAN', english: ["they are cousins - he is christian's cousin", "they're cousins - he's christian's cousin"] },
            { spanish: 'ESTOS (THESE) SON GATOS NEGROS- ESTE ES UN GATO GRIS', english: ["these are black cats - this is a gray cat", "these are black cats - this is a grey cat"] },
            { spanish: 'ESTE NO ES TU CELULAR-ESE ES MI CELULAR', english: ["this is not your cellphone - that is my cellphone", "this isn't your phone - that's my phone"] },
            { spanish: 'ESTAS (THESE) SON TUS GAFAS- ESAS NO SON LAS TUYAS', english: ["these are your glasses - those are not yours", "these are your glasses - those aren't yours"] },
            { spanish: 'ELLOS SON HERMANAS- EL ES SU HERMANO (DE ELLA)', english: ["they are brothers - he is her brother", "they're brothers - he's her brother"] },
            { spanish: 'ESTOS SON PERROS- ESTE ES SU PERRO (DE ÉL)', english: ["these are dogs - this is his dog", "these are dogs - this is his dog"] },
            { spanish: 'ELLOS SON PROFESORES- ELLA ES UNA PROFESORA', english: ["they are teachers - she is a teacher", "they're teachers - she's a teacher"] },
        ]
    },
    c7_ex4: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'ME ENCANTAN LOS CARROS', english: ["i love cars", "i love the cars"] },
            { spanish: 'A ÉL GUSTA JUGAR FUTBOL CON MIS PRIMOS', english: ["he likes playing football with my cousins", "he likes to play football with my cousins", "he likes playing soccer with my cousins", "he likes to play soccer with my cousins"] },
            { spanish: 'PREFIERO EL CALOR AL FRIO', english: ["i prefer heat to cold weather", "i prefer heat to the cold"] },
            { spanish: 'A MI ME GUSTAN LAS PELÍCULAS DE TERROR', english: ["i like horror movies"] },
            { spanish: 'A ÉL NO LE GUSTA COMER VERDURAS/VEGETALES', english: ["he doesn't like eating vegetables", "he does not like eating vegetables", "he doesn't like to eat vegetables", "he does not like to eat vegetables"] },
            { spanish: 'PREFIERO EL VERANO QUE EL INVIERNO', english: ["i prefer summer to winter"] },
            { spanish: 'NO NOS GUSTA LA MÚSICA METAL', english: ["we don't like metal music", "we do not like metal music"] },
            { spanish: 'A ÉL NO LE GUSTA COMER AJO', english: ["he doesn't like eating garlic", "he does not like eating garlic", "he doesn't like to eat vegetables", "he does not like to eat vegetables"] },
            { spanish: 'A MI ABUELA LE ENCANTA LAS NOVELAS DE TELEVISION (soap operas)', english: ["my grandmother loves soap operas", "my grandma loves soap operas"] },
            { spanish: '¿PREFIERES LAS FRESAS O LOS BANANOS?', english: ["do you prefer strawberries or bananas?"] },
            { spanish: 'NO NOS GUSTA CAMINAR EN LA NOCHE EN ESE BARRIO PORQUE ES PELIGROSO', english: ["we don't like walking at night in that neighborhood because it is dangerous", "we do not like walking at night in that neighborhood because it is dangerous"] },
            { spanish: 'REALMENTE ME GUSTA PINTAR (to paint)', english: ["i really like to paint", "i really like painting"] },
            { spanish: 'ME ENCANTA EL CHOCOLATE', english: ["i love chocolate"] },
            { spanish: 'NO ME GUSTA EL BILLAR (billiard)', english: ["i don't like billiard", "i do not like billiard"] },
            { spanish: 'NOSOTROS ODIAMOS LAS MENTIRAS', english: ["we hate lies"] },
            { spanish: 'A MI PAPA LE ENCANTA LA CARPINTERIA (carpentry)', english: ["my dad loves carpentry", "my father loves carpentry"] },
            { spanish: 'ÉL DISFRUTA COMER ESPINACA Y REMOLACHA', english: ["he enjoys eating spinach and beetroots", "he enjoys eating spinach and beetroot"] },
            { spanish: 'YO PREFIERO VIVIR EN UNA CASA QUE EN UN APARTAMENTO', english: ["i prefer living in a house to an apartment", "i prefer living in a house to living in an apartment"] },
            { spanish: 'ME ENCANTA ESCUCHAR MÚSICA ROMANTICA MIENTRAS HAGO UN ROMPECABEZAS', english: ["i love listening to romantic music while i do a puzzle", "i love to listen to romantic music while i do a puzzle"] },
            { spanish: 'ELLA PREFIERE NO TENER REDES SOCIALES', english: ["she prefers not to have social media"] },
            { spanish: 'PREFIERO VIVIR EN UN PUEBLO QUE VIVIR EN UNA GRAN CIUDAD', english: ["i prefer living in a town to living in a big city", "i prefer living in a village to living in a big city"] },
            { spanish: 'EL PREFIERE EL PESCADO A LA CARNE', english: ["he prefers fish to meat"] },
        ]
    },
    c7_ex6: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: '_________CAR THAT I BOUGHT IS FAST.', english: ["the car that i bought is fast"] },
            { spanish: '_________ENGLISH IS SPOKEN IN MANY COUNTRIES.', english: ["english is spoken in many countries"] },
            { spanish: '_________HOUSES ARE BIG ON THAT FARM.', english: ["the houses are big on that farm"] },
            { spanish: '_________BLUE CAR IS BETTER THAN THE RED ONE.', english: ["the blue car is better than the red one"] },
            { spanish: 'DOGS ARE________ BEST PETS.', english: ["dogs are the best pets"] },
            { spanish: '__________SPORTS ARE IMPORTANT IN MY LIFE.', english: ["sports are important in my life"] },
            { spanish: '__________LIONS ARE THE MOST BEAUTIFUL ANIMALS.', english: ["lions are the most beautiful animals"] },
            { spanish: 'I HATE _________ BASKETBALL.', english: ["i hate basketball"] },
            { spanish: 'I LIKE _________ WEATHER IN THAT CITY.', english: ["i like the weather in that city"] },
            { spanish: '__________ HORSES ARE PRETTY.', english: ["horses are pretty"] },
            { spanish: 'I LIKE_______ WHITE SHIRTS.', english: ["i like white shirts"] },
            { spanish: 'WHERE IS _______DOG? __________ DOG IS UNDER THE BED.', english: ["where is the dog? the dog is under the bed"] },
            { spanish: '________ SUN IS SHINING.', english: ["the sun is shining"] },
        ]
    },
    c7_ex7: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'YO QUIERO COMER UN BANANO CON LECHE', english: ["i want to eat a banana with milk"] },
            { spanish: 'ELLA ES UNA INGENIERA', english: ["she is an engineer", "she's an engineer"] },
            { spanish: 'NOSOTROS TRABAJAMOS WITH UN PROFESOR EN LA UNIVERSIDAD', english: ["we work with a teacher at the university", "we work with a professor at the university"] },
            { spanish: 'ÉL ES UN ADOLESCENTE', english: ["he is a teenager", "he's a teenager"] },
            { spanish: 'HOY ES UN DIA SOLEADO', english: ["today is a sunny day"] },
            { spanish: 'TRAEME UNA SOMBRILLA, ESTA LLOVIENDO', english: ["bring me an umbrella, it is raining", "bring me an umbrella, it's raining"] },
            { spanish: 'ELLA ES UNA PERSONA HONESTA', english: ["she is an honest person", "she's an honest person"] },
            { spanish: 'SU PRIMO TIENE UN BUEN TRABAJO (DE ÉL)', english: ["his cousin has a good job"] },
            { spanish: '“CONTRATIEMPO” ES UNA PELICULA INTERESANTE', english: ["contratiempo is an interesting movie"] },
            { spanish: 'NOSOTROS COMEMOS 3 VECES AL DIA', english: ["we eat three times a day", "we eat 3 times a day"] },
            { spanish: 'CAMERON DIAZ ES UNA ACTRIZ', english: ["cameron diaz is an actress"] },
            { spanish: 'ESTE ES UN SILLON', english: ["this is an armchair"] },
            { spanish: '¿PUEDES DARME UN JUGO DE NARANJA? POR FAVOR', english: ["can you give me an orange juice? please"] },
            { spanish: 'ÉL ES UN BUEN POLICIA', english: ["he is a good policeman", "he's a good policeman", "he is a good police officer", "he's a good police officer"] },
            { spanish: 'EL SE FRACTURÓ SU BRAZO EN UN ACCIDENTE DE CARRO', english: ["he broke his arm in a car accident", "he fractured his arm in a car accident"] },
            { spanish: 'MI MAMA ES UNA DOCTORA Y MI PAPÁ ES UN HOMBRE DE NEGOCIOS', english: ["my mom is a doctor and my dad is a businessman", "my mother is a doctor and my father is a businessman"] },
        ]
    },
    c7_ex9: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'A LOS GATOS LES GUSTA LA CARNE', english: ["cats like meat"] },
            { spanish: 'ESTE ES EL NOMBRE DEL RESTAURANTE CHINO', english: ["this is the name of the chinese restaurant"] },
            { spanish: 'A ELLA NO LE GUSTA EL TENNIS, A ELLA LE GUSTA EL FUTBOL', english: ["she doesn't like tennis, she likes football", "she doesn't like tennis, she likes soccer", "she does not like tennis, she likes football", "she does not like tennis, she likes soccer"] },
            { spanish: 'EL VASO ESTÁ LLENO (FULL) DE AGUA', english: ["the glass is full of water"] },
            { spanish: 'ME GUSTA EL ARTE', english: ["i like art"] },
            { spanish: 'ELLAS SON HERMANAS –ELLA ES MI HERMANA', english: ["they are sisters - she is my sister", "they're sisters - she's my sister"] },
            { spanish: 'NOSOTROS SOMOS INGENIEROS –EL ES UN INGENIERO', english: ["we are engineers - he is an engineer", "we're engineers - he's an engineer"] },
            { spanish: 'ELLOS SON AMIGOS – ELLA ES SU AMIGA (DE ELLOS)', english: ["they are friends - she is their friend", "they're friends - she's their friend"] },
            { spanish: 'ESTOS (THESE) SON PERROS – ESE ES NUESTRO PERRO', english: ["these are dogs - that is our dog", "these are dogs - that's our dog"] },
            { spanish: 'NO ME GUSTA COMER AJO, SOLAMENTE CUANDO ESTÁ EN LA CARNE', english: ["i don't like eating garlic, only when it is in the meat", "i don't like to eat garlic, only when it's in the meat", "i do not like eating garlic, only when it is in the meat"] },
        ]
    },
    c8_ex1: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: '¿ELLOS VAN A LA ESCUELA?', english: ["do they go to school?"] },
            { spanish: '¿ESTAS ENOJADO (ANGRY)?', english: ["are you angry?"] },
            { spanish: 'ELLA NO ESTUDIA ALEMAN (GERMAN)- POR EL CONTRARIO, ELLA ESTUDIA INGLES', english: ["she does not study german - on the contrary, she studies english", "she doesn't study german - on the contrary, she studies english"] },
            { spanish: 'A ELLA LE GUSTA LA CARNE (MEAT)- POR OTRO LADO, SU ESPOSO ES VEGETARIANO', english: ["she likes meat - on the other hand, her husband is a vegetarian", "she likes meat - on the other hand, her husband is vegetarian"] },
            { spanish: '¿ELLA ES TU HERMANA?', english: ["is she your sister?"] },
            { spanish: '¿A DONDE VA TU HERMANO?', english: ["where does your brother go?"] },
            { spanish: 'ESTAS (THESE) NO SON MIS GAFAS', english: ["these are not my glasses", "these aren't my glasses"] },
            { spanish: '¿DONDE ESTAN TUS PADRES? ESTAN EN CASA', english: ["where are your parents? they are at home", "where are your parents? they're at home"] },
            { spanish: '¿QUE HACEN TU HERMANO? EL JUEGA TENNIS', english: ["what does your brother do? he plays tennis"] },
            { spanish: '¿CUÁNDO VA SUSAN AL CINE? ELLA VA AL CINE LOS MIERCOLES', english: ["when does susan go to the cinema? she goes to the cinema on wednesdays"] },
            { spanish: '¿QUIEN ES EL? EL ES EL HERMANO DE SARA', english: ["who is he? he is sara's brother", "who is he? he's sara's brother"] },
            { spanish: '¿A DONDE VAS? A JUGAR FUTBOL? – YO VOY AL ESTADIO', english: ["where do you go to play football? i go to the stadium", "where do you go to play soccer? i go to the stadium"] },
            { spanish: '¿DE QUIEN ES ESTE CELULAR? – ESTE ES EL CELULAR DE THOMAS', english: ["whose cellphone is this? this is thomas's cellphone", "whose phone is this? this is thomas's phone"] },
            { spanish: '¿A ELLOS LES GUSTA EL PESCADO? –SI', english: ["do they like fish? yes, they do"] },
            { spanish: 'POR QUE EL ESTA TRISTE? EL ESTA TRISTE PORQUE NO TIENE INTERNET', english: ["why is he sad? he is sad because he does not have internet", "why is he sad? he's sad because he doesn't have internet"] },
            { spanish: 'QUE TIPO DE COMPUTADOR TE GUSTA? – ME GUSTAN LOS COMPUTADORES HP', english: ["what kind of computer do you like? i like hp computers"] },
            { spanish: '¿ESTOS SON TUS LIBROS?', english: ["are these your books?"] },
            { spanish: 'ESA ES LA CASA DE MICHAEL', english: ["that is michael's house", "that's michael's house"] },
        ]
    },
    c8_ex2: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'ESTE NO ES MIO, ES TUYO', english: ["this is not mine, it is yours", "this isn't mine, it's yours", "this is not mine it is yours", "this isn't mine it's yours"] },
            { spanish: '¿TE GUSTA SU CASA? - (DE ELLOS)', english: ["do you like their house?"] },
            { spanish: 'ESTE CELULAR ES DE ELLA', english: ["this cellphone is hers", "this phone is hers"] },
            { spanish: 'ME GUSTA EL COLOR DE SU CASA- (DE ELLA)', english: ["i like the color of her house"] },
            { spanish: 'ESTE ES NUESTRO GATO', english: ["this is our heart"] },
            { spanish: 'ESOS CUADROS SON TUYOS', english: ["those paintings are yours", "those pictures are yours"] },
            { spanish: '¿ESTE ES SUYO? - (DE EL)', english: ["is this his?"] },
            { spanish: '¿ESTOS SON SENS ZAPATOS? -(DE ELLA)', english: ["are these her shoes?"] },
        ]
    },
    c8_ex3: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'ELLA NO NADA LOS DOMINGOS', english: ["she does not swim on sundays", "she doesn't swim on sundays"] },
            { spanish: 'TU NO TRABAJAS EN LA MAÑANA', english: ["you do not work in the morning", "you don't work in the morning"] },
            { spanish: '¿ELLOS CORREN MUY VELOZ (FAST)?', english: ["do they run very fast?"] },
            { spanish: 'NOSOTROS NO VAMOS A BOGOTÁ', english: ["we do not go to bogota", "we don't go to bogota"] },
            { spanish: '¿ELLA ESTÁ TRISTE? NO, ELLA ESTA FELIZ', english: ["is she sad? no, she is happy", "is she sad? no, she's happy"] },
            { spanish: 'A ELLA NO LE GUSTAN LOS GATOS', english: ["she does not like cats", "she doesn't like cats"] },
            { spanish: 'ELLA JUEGA BALONCESTO (BASKETBALL) LOS SÁBADOS', english: ["she plays basketball on saturdays"] },
            { spanish: '¿A DÓNDE VIAJA ÉL? ÉL VIAJA A BARCELONA', english: ["where does he travel? he travels to barcelona", "where does he travel to? he travels to barcelona"] },
            { spanish: 'ELLOS NO SON NUESTROS TÍOS (UNCLES)', english: ["they are not our uncles", "they aren't our uncles", "they're not our uncles"] },
            { spanish: '¿ELLA BEBE AGUA? –NO, ELLA BEBE VODKA', english: ["does she drink water? no, she drinks vodka"] },
            { spanish: 'NO ME GUSTA TU COMPORTAMIENTO', english: ["i do not like your behavior", "i don't like your behavior"] },
            { spanish: 'ELLA VA CON ÉL A LA IGLESIA', english: ["she goes with him to the church", "she goes to the church with him", "she goes to church with him"] },
        ]
    },
    c8_ex4: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: '¿ELLOS SON NUESTROS AMIGOS?', english: ["are they our friends?"] },
            { spanish: '¿ESTE (THIS) ES TU VASO (GLASS)?', english: ["is this your glass?"] },
            { spanish: 'ESTE NO ES SU CARRO (DE ELLOS)', english: ["this is not their car", "this isn't their car"] },
            { spanish: 'ELLA ES MI HERMANA', english: ["she is my sister", "she's my sister"] },
            { spanish: '¿DÓNDE ESTÁ TU CHAQUETA? (JACKET)', english: ["where is your jacket?", "where's your jacket?"] },
            { spanish: '¿CUÁNDO ES TU CUMPLEAÑOS? (BIRTHDAY)', english: ["when is your birthday?", "when's your birthday?"] },
            { spanish: 'ELLA NO VA ALLÁ (THERE)', english: ["she does not go there", "she doesn't go there"] },
            { spanish: 'ELLOS SON SUS AMIGOS (DE ÉL)', english: ["they are his friends", "they're his friends"] },
            { spanish: '¿DÓNDE CORREN ELLOS?', english: ["where do they run?"] },
            { spanish: 'ELLA NO SABE (KNOW) A DONDE IR (TO GO)', english: ["she does not know where to go", "she doesn't know where to go"] },
        ]
    },
    c8_ex5: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'TODAVÍA ESTOY EN EL TRABAJO', english: ["i am still at work", "i'm still at work"] },
            { spanish: '¿VAS AL GIMNASIO A VECES?', english: ["do you go to the gym sometimes?", "do you sometimes go to the gym?"] },
            { spanish: 'ELLOS NUNCA BEBEN CAFÉ', english: ["they never drink coffee"] },
            { spanish: 'ELLA TAMBIÉN ES UNA DOCTORA', english: ["she is also a doctor", "she is a doctor too", "she's also a doctor"] },
        ]
    },
    c9_ex1: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'ELLOS NO CONOCEN ESE HOMBRE', english: ['they do not know that man', "they don't know that man"] },
            { spanish: '¿TE GUSTA ESTA GUITARRA?', english: ['do you like this guitar?'] },
            { spanish: 'ME GUSTA MUCHO ESTE RESTAURANTE', english: ['i like this restaurant very much', 'i really like this restaurant'] },
            { spanish: 'ESOS HOMBRES SON MUY ALTOS', english: ['those men are very tall'] },
            { spanish: '¿ESE CARRO ES VELOZ?', english: ['is that car fast?'] },
            { spanish: 'ESOS CABALLOS SON HERMOSOS', english: ['those horses are beautiful'] },
            { spanish: 'ESTOS HOMBRES SON INTELIGENTES', english: ['these men are intelligent'] },
            { spanish: '¿A ELLA LE GUSTAN ESOS VESTIDOS?', english: ['does she like those dresses?'] },
            { spanish: 'ESAS SILLAS SON GRANDES', english: ['those chairs are big'] },
            { spanish: 'ESTE SOFA ES COMODO', english: ['this sofa is comfortable', "this couch is comfortable"] },
            { spanish: 'ESTE CUESTA MAS QUE ESE', english: ['this costs more than that one', 'this costs more than that'] },
            { spanish: 'A ELLA LE GUSTAN ESTOS ZAPATOS', english: ['she likes these shoes'] },
            { spanish: 'TE GUSTA ESTA CAMISETA?', english: ['do you like this t-shirt?', 'do you like this shirt?'] },
            { spanish: 'ME GUSTA ESA CHAQUETA', english: ['i like that jacket'] },
            { spanish: 'ESA MUCHACHA ES DANNY', english: ['that girl is danny'] },
            { spanish: 'NOSOTROS CORREMOS EN ESOS LUGARES', english: ['we run in those places'] },
            { spanish: 'A ELLAS LES ENCANTA ESE CANTANTE', english: ['they love that singer'] },
        ]
    },
    c9_ex2: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: '¿TE GUSTA ESTE VESTIDO?', english: ['do you like this dress?'] },
            { spanish: '¿TE GUSTA ESTE?', english: ['do you like this one?'] },
            { spanish: '¿TE GUSTA ESE CARRO?', english: ['do you like that car?'] },
            { spanish: '¿TE GUSTA ESE?', english: ['do you like that one?'] },
            { spanish: '¿TE GUSTAN ESTAS BOTAS?', english: ['do you like these boots?'] },
            { spanish: '¿TE GUSTAN ESTAS?', english: ['do you like these ones?'] },
            { spanish: '¿TE GUSTAN ESOS CABALLOS?', english: ['do you like those horses?'] },
            { spanish: '¿TE GUSTAN ESOS?', english: ['do you like those ones?'] },
        ]
    },
    c9_ex3: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'ME GUSTAN LOS ANIMALES GRANDES - ME GUSTAN LOS GRANDES', english: ["i like big animals - i like the big ones", "i like big animals i like the big ones"] },
            { spanish: 'ME GUSTA EL VESTIDO NEGRO - ME GUSTA EL NEGRO', english: ["i like the black dress - i like the black one", "i like the black dress i like the black one"] },
            { spanish: 'EL LIBRO AZUL - EL AZUL', english: ["the blue book - the blue one", "the blue book the blue one"] },
            { spanish: 'EL PERRO GRIS - EL GRIS', english: ["the gray dog - the gray one", "the grey dog - the grey one", "the gray dog the gray one", "the grey dog the grey one"] },
            { spanish: 'EL CARRO PEQUEÑO - EL PEQUEÑO', english: ["the small car - the small one", "the small car the small one"] },
            { spanish: 'EL EDIFICIO (BUILDING) ALTO - EL ALTO', english: ["the tall building - the tall one", "the tall building the tall one"] },
            { spanish: 'LOS HOMBRES FUERTES - LOS FUERTES', english: ["the strong men - the strong ones", "the strong men the strong ones"] },
            { spanish: 'LOS COMPUTADORES BARATOS - LOS BARATOS', english: ["the cheap computers - the cheap ones", "the cheap computers the cheap ones"] },
            { spanish: 'LAS CASAS GRANDES - LAS GRANDES', english: ["the big houses - the big ones", "the big houses the big ones"] },
            { spanish: 'EL COLLAR (NECKLACE) CARO - EL CARO', english: ["the expensive necklace - the expensive one", "the expensive necklace the expensive one"] },
        ]
    },
    c9_ex4: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'Frase de ejemplo 1...', english: ['...'] },
            { spanish: 'Frase de ejemplo 2...', english: ['...'] },
        ]
    },
    c9_ex5: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'Frase de ejemplo 1...', english: ['...'] },
            { spanish: 'Frase de ejemplo 2...', english: ['...'] },
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
    vocabulary
}: { 
    exerciseKey: string,
    onComplete?: () => void,
    course?: string,
    title?: string,
    vocabulary?: Record<string, string>
}) {
    const { t } = useTranslation();
    const { toast } = useToast();

    const imageToShow = course === 'a1' ? a1MascotImage : guideFishImage;

    const exerciseNumber = useMemo(() => exerciseKey.replace(/mixed|c\d+_ex/g, ''), [exerciseKey]);
    
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
                <div className="flex justify-between items-center">
                    <CardTitle>{title}</CardTitle>
                    <span className="text-sm font-medium text-muted-foreground">
                        {currentPromptIndex + 1} / {exerciseData.prompts.length}
                    </span>
                </div>
                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center justify-start flex-wrap gap-2">
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
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse">
                                    <BookText className="mr-2 h-4 w-4" />
                                    Vocabulario
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <div className="space-y-2">
                                    <h4 className="font-bold border-b pb-1">Vocabulario útil</h4>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                        {Object.entries(vocabulary).map(([es, en]) => (
                                            <React.Fragment key={es}>
                                                <span className="text-muted-foreground capitalize">{es}:</span>
                                                <span className="font-semibold text-right">{en}</span>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
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
                        className="text-lg min-h-[100px]"
                        placeholder="Escribe la traducción en inglés..."
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
