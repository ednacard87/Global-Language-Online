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
import { ArrowLeft, ArrowRight, Trophy } from 'lucide-react';

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
            { spanish: 'MI CAFÉ ESTÁ MUY CALIENTE, NO PUEDO TOMARLO', english: ["my coffee is very hot, i cannot drink it", "my coffee is very hot, i can't drink it"] },
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
            { spanish: 'NOSOTROS TENEMOS UN EMPLEO NUEVO- EL EMPLEO ES NUESTRO', english: ["we have a new job - the job is ours", "we have a new job the job is ours"] },
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
            { spanish: 'LA MAMA DE TOM COMPRA VERDURAS EN ESE SUPERMERCADO', english: ["tom's mom buys vegetables in that supermarket", "tom's mother buys vegetables in that supermarket"] },
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
            { spanish: 'ESTOS SON GATOS NEGROS- ESTE ES UN GATO GRIS', english: ["these are black cats - this is a gray cat", "these are black cats - this is a grey cat"] },
            { spanish: 'ESTE NO ES TU CELULAR-ESE ES MI CELULAR', english: ["this is not your cellphone - that is my cellphone", "this isn't your phone - that's my phone"] },
            { spanish: 'ESTAS SON TUS GAFAS- ESAS NO SON LAS TUYAS', english: ["these are your glasses - those are not yours", "these are your glasses - those aren't yours"] },
            { spanish: 'ELLOS SON HERMANOS- EL ES SU HERMANO (DE ELLA)', english: ["they are brothers - he is her brother", "they're brothers - he's her brother"] },
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
