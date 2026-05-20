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
            { spanish: '¿TU PRIMO ESTÁ EN CALI? – NO, EL EL ESTÁ EN MIAMI', english: ["Is your cousin in Cali? No, he is in Miami."] },
            { spanish: '¿TUS LIBROS ESTAN SOBRE EL ESTANTE? – NO, ESTAN SOBRE EL ESCRITORIO', english: ["Are your books on the shelf? No, they are on the desk."] },
            { spanish: '¿TU MAMA ESTA EN LA CASA? NO, ELLA ESTA EN LA IGLESIA', english: ["is your mother at home? No, she is in the church", "is your mother at home? No, she's in the church", "is your mom at home? No, she's in the church", "is your mom at home? No, she is in the church"] },
            { spanish: '¿TUS HERMANOS ESTÁN EN LA UNIVERSIDAD? – NO', english: ["are your siblings at university? No, they are not", "are your siblings at university? No, they aren't", "are your brothers at university? No, they are not", "are your brothers at university? No, they aren't"] },
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
            { spanish: 'ESTOS (THESE) NO SON NUESTROS CARROS', english: ["these are not our cars", "these aren't our cars"] }
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
            { spanish: 'NOSOTROS TENEMOS UNA FINCA – ESA ESA NUESTRA FINCA', english: ['we have a farm - that is our farm', 'we have a farm that is our farm', 'we have a country house - that is our country house'] },
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
            { spanish: 'YO TENGO UN EL RELOJ NUEVO- EL RELOJ ES MIO', english: ["i have a new watch - the watch is mine", "i have a new watch the watch is mine"] },
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
            { spanish: 'ESTE ES SU BOLSO Y EL OTRO ES MÍO (DE ELLA)', english: ["this is her window", "this is her bag and the other one is mine", "this is her bag and the other is mine"] },
            { spanish: 'TU ERES FRANCÉS, TU FAMILIA VIVE EN FRANCIA', english: ["you are french, your family lives in france", "you're french, your family lives in france"] },
            { spanish: '¿ESTA CAMISETA ES TUYA O MÍA?', english: ["is this t-shirt yours or mine?", "is this shirt yours or mine?"] },
            { spanish: '¿DONDE ESTÁ SU CELULAR? - (DE EL)', english: ["where is his cellphone?", "where is his phone?", "where's his cellphone?", "where's his phone?"] },
            { spanish: 'ESTA ES NUESTRA FAMILIA', english: ["this is our family"] },
        ]
    },
    c6_ex8: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'MI PERRO ES MAS INTELIGENTE QUE EL TUYO', english: ["my dog is smarter than yours", "my dog is more intelligent than yours"] },
            { spanish: 'ESTOS SON MIS LIBROS Y ESOS SON LOS TUYOS', english: ["these are my books and those are yours"] },
            { spanish: '¿EL PORTATIL ES TUYO O DE ELLA?', english: ["is the laptop yours or hers?"] },
            { spanish: 'NUESTRA CASA ES MAS GRANDE QUE LA DE ELLOS', english: ["our house is bigger than theirs"] },
            { spanish: 'SU PADRE ES UN DOCTOR FAMOSO (DE EL)', english: ["his father is a famous doctor", "his dad is a famous doctor"] },
            { spanish: 'ESTA CHAQUETA NO ES MIA, ES DE MI HERMANA', english: ["this jacket is not mine, it is my sister's", "this jacket isn't mine, it's my sister's"] },
            { spanish: '¿ESTE CELULAR ES EL TUYO?', english: ["is this cellphone yours?", "is this phone yours?"] },
            { spanish: 'LOS JUGUETES SON NUESTROS', english: ["the toys are ours"] },
            { spanish: 'SU CARRO ES RAPIDO PERO EL MIO ES MAS SEGURO (DE ELLOS)', english: ["their car is fast but mine is safer"] },
            { spanish: '¿DONDE ESTAN LAS MIAS? (LAS LLAVES)', english: ["where are mine?"] },
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
            { spanish: 'YO QUIERO COMER UN BANANO CON LECHE', english: ["i want to eat a banner with milk"] },
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
            { spanish: 'ESTE EL NOMBRE DEL RESTAURANTE CHINO', english: ["this is the name of the chinese restaurant"] },
            { spanish: 'A ELLA NO LE GUSTA EL TENNIS, A ELLA LE GUSTA EL FUTBOL', english: ["she doesn't like tennis, she likes football", "she doesn't like tennis, she likes soccer", "she does not like tennis, she likes football", "she does not like tennis, she likes football", "she does not like tennis, she likes soccer"] },
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
            { spanish: '¿DE QUIEN ES ESTE CELULAR? – ESTE ES EL CELULAR DE THOMAS', english: ["whose umbrella is this? this is thomas's cellphone", "whose phone is this? this is thomas's phone"] },
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
            { spanish: 'Este no es mío, es tuyo', english: ["this is not mine, it is yours", "this isn't mine, it's yours", "this is not mine it is yours", "this isn't mine it's yours"] },
            { spanish: '¿Te gusta el color de su casa- (de ella)', english: ["i like the color of her house"] },
            { spanish: 'Este es nuestro gato', english: ["this is our heart"] },
            { spanish: 'Esos cuadros son tuyos', english: ["those paintings are yours", "those pictures are yours"] },
            { spanish: '¿Este es suyo? - (de el)', english: ["is this his?"] },
            { spanish: '¿Estos son sens zapatos? -(de ella)', english: ["are these her shoes?"] },
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
            { spanish: 'A ELLA LE GUSTAN LOS GATOS', english: ["she does not like cats", "she doesn't like cats"] },
            { spanish: 'ELLA JUEGA BALONCESTO (BASKETBALL) LOS SÁBADOS', english: ["she plays basketball on saturdays"] },
            { spanish: '¿A DÓNDE VIAJA ÉL? ÉL VIAJA A BARCELONA', english: ["where does he travel? he travels to barcelona", "where does he travel to? he travels to barcelona"] },
            { spanish: 'ELLOS NO SOMOS NUESTROS TÍOS (UNCLES)', english: ["they are not our uncles", "they aren't our uncles", "they're not our uncles"] },
            { spanish: '¿ELLA BEBE AGUA? –NO, ELLA BEBE VODKA', english: ["does she drink water? no, she drinks vodka"] },
            { spanish: 'NO ME GUSTA EL COMPORTAMIENTO', english: ["i do not like your behavior", "i don't like your behavior"] },
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
            { spanish: '¿CUÁL ES TU CUMPLEAÑOS? (BIRTHDAY)', english: ["when is your birthday?", "when's your birthday?"] },
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
            { spanish: '¿TE GUSTA EL CARRO NEGRO - ME GUSTA EL NEGRO', english: ["i like the black car - i like the black one", "i like the black car i like the black one"] },
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
            { spanish: 'TE GUSTA ESTA CAMISETA? ', english: ['do you like this t-shirt?', 'do you like this shirt?'] },
            { spanish: 'ME GUSTA ESA CHAQUETA', english: ['i like that jacket'] },
            { spanish: 'ESA MUCHACHA ES DANNY', english: ['that girl is danny'] },
            { spanish: 'NOSOTROS CORREMOS IN ESOS LUGARES', english: ['we run in those places'] },
            { spanish: 'A ELLAS LES ENCANTA ESE CANTANTE', english: ['they love that singer'] },
        ]
    },
    c9_ex2: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: '¿TE GUSTA EL VESTIDO NEGRO - ME GUSTA EL NEGRO', english: ["i like the black dress - i like the black one", "i like the black dress i like the black one"] },
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
            { spanish: 'EL PERRO GRIS - EL GRIS', english: ["the gray dog - the gray one", "the grey dog - the gray one", "the gray dog the gray one", "the grey dog the gray one"] },
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
            { spanish: '¿TE GUSTAN ESTOS CUADROS (PICTURES)? - ¿TE GUSTAN ESTOS?', english: ['do you like these pictures? - do you like these ones?', 'do you like these pictures? do you like these ones?'] },
            { spanish: 'A ELLA LE GUSTA ESTA PELICULA (MOVIE) Y A EL LE GUSTA ESA', english: ['she likes this movie and he likes that one', "she likes this movie and he likes that"] },
            { spanish: 'LAS CASAS BLANCAS - LAS BLANCAS', english: ['the white houses - the white ones', 'the white houses the white ones'] },
            { spanish: 'LOS ZAPATOS NEGROS - LOS NEGROS', english: ['the black shoes - the black ones', 'the black shoes the black ones'] },
            { spanish: 'ME GUSTAN ESTAS MESAS - ¿A TI TE GUSTAN ESAS?', english: ['i like these tables - do you like those ones?', 'i like these tables do you like those ones?'] },
            { spanish: '¿TE GUSTA EL HELADO? - ¿TE GUSTA ESTE?', english: ['do you like this ice cream? - do you like this one?', 'do you like this ice cream? do you like this one?'] },
        ]
    },
    c9_ex5: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'ESE CARRO ES AZUL MIENTRAS QUE ESTE ES GRIS', english: ["that car is blue while this one is gray", "that car is blue while this one is grey"] },
            { spanish: 'ESTE ES EL REGALO QUE COMPRE PARA MARY', english: ["this is the gift that i bought for mary", "this is the present i bought for mary"] },
            { spanish: 'ESA CASA ES CARA MIENTRAS ESTA ES BARATA', english: ["that house is expensive while this one is cheap"] },
            { spanish: 'ESA MUJER ES SU MAMA Y LA OTRA ES SU TIA (DE EL)', english: ["that woman is his mother and the other one is his aunt", "that woman is his mom and the other one is his aunt"] },
            { spanish: 'ESTOS HOMBRES SON MIS AMIGOS', english: ["these men are my friends"] },
            { spanish: 'ESOS ANIMALES SON MUY GRANDES Y SALVAJES MIENTRAS QUE ESTOS SON PEQUEÑOS', english: ["those animals are very big and wild while these ones are small"] },
            { spanish: 'ESOS MUCHACHOS SON INTELIGENTES MIENTRAS QUE ESTOS SON PEREZOSOS', english: ["those boys are intelligent while these ones are lazy"] },
            { spanish: '¿DONDE ESTÁ ESE RESTAURANTE?', english: ["where is that restaurant?"] },
            { spanish: 'ESOS CABALLOS SON NEGROS', english: ["those horses are black"] },
            { spanish: 'ESTOS GATOS SON BLANCOS MIENTRAS QUE ESOS SON NEGROS', english: ["these cats are white while those ones are black"] },
        ]
    },
    c10_ex1: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'EL TIGRE GRANDE – EL GRANDE', english: ["the big tiger - the big one", "the big tiger the big one"] },
            { spanish: 'LOS PARQUES PEQUEÑOS- LOS PEQUEÑOS', english: ["the small parks - the small ones", "the small parks the small ones"] },
            { spanish: 'EL PORTATIL NUEEVO- EL NUEVO', english: ["the new laptop - the new one", "the new laptop the new one"] },
            { spanish: 'LA OTRA SOMBRILLA- LA OTRA', english: ["the other umbrella - the other one", "the other umbrella the other one"] },
            { spanish: 'LOS OTROS PORTATILES– LOS OTROS', english: ["the other laptops - the other ones", "the other laptops the other ones"] },
            { spanish: '¿CUALES VESTIDOS TE GUSTAN? – CUALES TE GUSTAN?', english: ["which dresses do you like? - which ones do you like?", "which dresses do you like? which ones do you like?"] },
            { spanish: '¿CUAL POSTRE QUIERES? – CUAL QUIERES?', english: ["which dessert do you want? - which one do you want?", "which dessert do you want? which one do you want?"] },
            { spanish: 'QUIERO EL POSTRE DE CHOCOLATE – QUIERO EL DE CHOCOLATE', english: ["i want the chocolate dessert - i want the chocolate one", "i want the chocolate dessert i want the chocolate one"] },
            { spanish: 'PREFIERO LOS CELULARES PEQUEÑOS – PREFIERO LOS PEQUEÑOS', english: ["i prefer small cellphones - i prefer the small ones", "i prefer small cellphones i prefer the small ones"] },
            { spanish: '¿CUALES GAFAS TE GUSTAN? – CUALES TE GUSTAN?', english: ["which glasses do you like? - which ones do you like?", "which glasses do you like? which ones do you like?"] },
            { spanish: '¿CUAL CHAQUETA TE GUSTA? – CUAL TE GUSTA? A MI ME GUSTA LA NEGRA', english: ["which jacket do you like? - which one do you like? i like the black one", "which jacket do you like? which one do you like? i like the black one"] },
            { spanish: '¿CUALES JUGOS TE GUSTAN? – CUAL TE GUSTA? – A MI ME GUSTA EL DE MARACUYA', english: ["which juices do you like? - which one do you like? - i like the peak passion fruit one", "which juices do you like? which one do you like? i like the peak passion fruit one"] },
            { spanish: '¿CUAL LIBRO LE GUSTA A ELLA? - CUAL LE GUSTA?', english: ["which book does she like? - which one does she like?", "which book does she like? which one does she like?"] },
            { spanish: '¿CUAL CELULAR ES TUYO? – CUAL ES EL TUYO?', english: ["which cellphone is yours? - which one is yours?", "which cellphone is yours? which one is yours?"] },
            { spanish: '¿CUALES BOTAS SON DE ELLA? – CUALES SON DE ELLA?', english: ["which boots are hers? - which ones are hers?", "which boots are hers? which ones are hers?"] },
        ]
    },
    c10_ex2: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'ME GUSTA EL JUEGO Y A TI TE GUSTA ESE.', english: ["i like this game and you like that one"] },
            { spanish: 'NO ME GUSTAN ESTAS GAFAS – NO ME GUSTAN ESAS.', english: ["i don't like these glasses - i don't like those ones", "i do not like these glasses - i do not like those ones"] },
            { spanish: 'ESTOS RELOJES SON VIEJOS- ESTOS SON VIEJOS', english: ["these watches are old - these ones are old"] },
            { spanish: 'ME GUSTA ESTA SERIE - ME GUSTA ESA:', english: ["i like this series - i like that one"] },
            { spanish: 'NO ME GUSTAN ESTAS GORRAS (CAPS)- A MI ME GUSTAN ESAS-', english: ["i don't like these caps - i like those ones", "i do not like these caps - i do not like those ones"] },
            { spanish: 'A ELLOS LES GUSTAN ESOS COMPUTADORES - A NOSOTROS NOS GUSTAN ESTOS-', english: ["they like those computers - we like these ones"] },
            { spanish: 'A MI ME GUSTA ESTA CASA MIENTRAS QUE A ELLA LE GUSTA ESA:', english: ["i like this house while she likes that one", "i like this house while she likes that"] },
            { spanish: 'EL PREFIERE EL ESTE CARRO A ESA MOTO:', english: ["he prefers this car to that motorcycle"] },
            { spanish: 'NO ME GUSTAN ESAS CAMISETAS – A MI NO ME GUSTAN ESAS:', english: ["i don't like those t-shirts - i don't like those ones", "i do not like those t-shirts - i do not like those ones", "i don't like those shirts - i don't like those ones"] },
            { spanish: 'A NOSOTROS NOS GUSTA ESA FINCA – A NOSOTROS NOS GUSTA ESA:', english: ["we like that farm - we like that one", "we like that country house - we like that one"] },
        ]
    },
    c10_ex3: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'EL HOMBRE VIEJO- EL VIEJO', english: ["the old man - the old one", "the old man the old one"] },
            { spanish: 'LA NIÑA ALTA- LA ALTA', english: ["the tall girl - the tall one", "the tall girl the tall one"] },
            { spanish: 'EL GATO NEGRO- EL NEGRO', english: ["the black cat - the black one", "the black cat the black one"] },
            { spanish: 'LOS JEANS BLANCOS- LOS BLANCOS', english: ["the white jeans - the white ones", "the white jeans the white ones"] },
            { spanish: 'LAS CAJAS (BOX) CARAS - LAS CARAS', english: ["the expensive boxes - the expensive ones", "the expensive boxes the expensive ones"] },
            { spanish: 'LAS CASAS BARATAS- LAS BARATAS', english: ["the cheap houses - the cheap ones", "the cheap houses the cheap ones"] },
        ]
    },
    c10_the1: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: '1- YO QUIERO IR A PARIS', english: ["i want to go to paris"] },
            { spanish: '2- TU ERES DEL REINO UNIDO Y ELLA ES DEL NORTE DE ALEMANIA', english: ["you are from the united kingdom and she is from the north of germany", "you're from the united kingdom and she's from the north of germany"] },
            { spanish: '3- ÉL VIAJA A LAS BAHAMAS MIENTRAS QUE ELLA VISITA A SU FAMILIA AL SUR DE CANADA', english: ["he travels to the bahamas while she visits her family in the south of canada", "he travels to the bahamas while she visits her family to the south of canada"] },
            { spanish: '4- NOSOTROS CAMINAMOS EN EL MONTE EVEREST', english: ["we walk on mount everest"] },
            { spanish: '5- ELLOS ESCALAN LOS ALPES', english: ["they climb the alps"] },
            { spanish: '6- ELLOS NADAN EN EL RIO MISSISSIPPI', english: ["they swim in the mississippi river"] },
            { spanish: '7- ELLA QUIERE IR A EUROPA PORQUE QUIERE VISITAR ESPAÑA, FRANCIA Y EL REINO UNIDO.', english: ["she wants to go to europe because she wants to visit spain, france and the united kingdom"] },
            { spanish: '8- NOSOTROS VAMOS AL LAGO MICHIGAN', english: ["we go to lake michigan"] },
            { spanish: '9- ELLOS ELIGEN REPUBLICA DOMINICANA PARA SU LUNA DE MIEL', english: ["they choose the dominican republic for their honeymoon"] },
            { spanish: '10- NOSOTROS VAMOS A LA ISLA SICILIA EL PROXIMO MES', english: ["we go to sicily island next month", "we go to sicily next month", "we are going to sicily next month"] },
        ]
    },
    c10_last: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: '1. YO FUI AL REINO UNIDO PARA MI LUNA DE MIEL', english: ["i went to the united kingdom for my honeymoon"] },
            { spanish: '2. ME GUSTARIA VISITAR LAS ISLAS MALDIVAS.', english: ["i would like to visit the maldives islands", "i'd like to visit the maldives islands", "i would like to visit the maldives", "i'd like to visit the maldives"] },
            { spanish: '3. ÉL FUE A LOS ALPES SUIZOS CON SU ESPOSA EL AÑO PASADO:', english: ["he went to the swiss alps with his wife last year"] },
            { spanish: '4. NOSOTROS QUEREMOS VIAJAR EN UN CRUCERO POR EL OCEANO ATLANTICO.', english: ["we want to travel on a cruise through the atlantic ocean", "we want to travel in a cruise through the atlantic ocean"] },
            { spanish: '5. YO VIAJÉ ARGENTINA EL AÑO PASADO.', english: ["i traveled to argentina last year", "i travelled to argentina last year"] },
            { spanish: '6. ¿TIENES QUE TRABAJAR EN LA OFICINA?', english: ["do you have to work in the office?", "do you have to work at the office?"] },
            { spanish: '7. ME GUSTARIA VISITAR TODOS LOS PAISES DE EUROPA.', english: ["i would like to visit all the countries in europe", "i'd like to visit all the countries in europe"] },
            { spanish: '8. ¿TE GUSTARIA VISITAR BARCELONA EN 2 MESES?', english: ["would you like to visit barcelona in 2 months?"] },
        ]
    },
    c11_ex1: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: "¿HABLAS CON ELLA HOY? NO, NO QUIERO HABLAR CON ELLA, QUIZAS LA PROXIMA SEMANA:", english: ["do you talk with her today? no, i do not want to talk with her, maybe next week", "do you talk to her today? no, i don't want to talk to her, maybe next week", "do you speak with her today? no, i do not want to speak with her, maybe next week", "do you speak to her today? no, i don't want to speak to her, maybe next week", "do you speak with her today? no, i'd like to talk with her, maybe next week"] },
            { spanish: "¿ESTAS CON ELLOS? NO, YO ESTOY EN CASA JUGANDO VIDEOJUEGOS", english: ["are you with them? no, i am at home playing videogames", "are you with them? no, i'm at home playing videogames", "are you with them? no, i am at home playing video games", "are you with them? i'm at home playing video games"] },
            { spanish: "¿ELLOS VIAJAN CON NOSOTROS? –NO, ELLOS VIAJAN EL DOMINGO", english: ["do they travel with us? no, they travel on sunday"] },
            { spanish: "YO LLEGO SIN ELLOS A LAS 9", english: ["i arrive without them at 9"] },
            { spanish: "¿VAMOS CON ELLAS? - SI", english: ["do we go with them? yes, we do", "are we going with them? yes, we are"] },
            { spanish: "NOSOTROS TOMAMOS UN CAFÉ CON ELLA DURANTE LA REUNIÓN", english: ["we drink a coffee with her during the meeting", "we have a coffee with her during the meeting", "we had a coffee with her during the meeting"] },
            { spanish: "TU CUÑADA NO HABLA CONMIGO", english: ["your sister in law does not talk with me", "your sister-in-law does not talk with me", "your sister in law doesn't talk to me", "your sister-in-law doesn't talk to me"] },
            { spanish: "¿JUEGAS CON NOSOTROS? – NO, PORQUE ESTOY JUGANDO CON ELLA:", english: ["do you play with us? no, because i am playing with her", "do you play with us? no, because i'm playing with her"] },
            { spanish: "TUS PRIMOS NO JUEGAN CON NOSOTROS JUEGOS DE MESA", english: ["your cousins do not play board games with us", "your cousins don't play board games with us"] },
            { spanish: "MI CUÑADO TOCA LA GUITARRA (THE GUITAR) CON EL", english: ["my brother in law plays the guitar with him", "my brother-in-law plays the guitar with him"] },
            { spanish: "¿A DONDE VAS WITH ELLOS? –NOSOTROS VAMOS A LA IGLESIA", english: ["where do you go with them? we go to the church", "where are you going with them? we are going to the church"] },
            { spanish: "NOSOTROS NO VIAJAMOS SIN ELLOS", english: ["we do not travel without them", "we don't travel without them"] },
            { spanish: "EL NOS LLAMA A LAS 10 DE LA NOCHE", english: ["he calls us at 10 at night", "he calls us at 10 in the night", "he calls us at 10 pm"] },
            { spanish: "¿ELLOS VIENEN CON NOSOTROS?", english: ["do they come with us?"] },
            { spanish: "¿ESTAS HABLANDO CON ELLA?", english: ["are you talking with her?", "are you talking to her?"] },
            { spanish: "¿ESTUDIAS CON EL?", english: ["do you study with him?"] },
        ]
    },
    c11_ex2: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'I HATE MY JOB, I WANT TO QUIT________________(ODIO MI TRABAJO, QUIERO RENUNCIAR)', english: ["i hate my job, i want to quit it"] },
            { spanish: 'MY PARENTS ARE REALLY SAD, I DON’T KNOW WHAT TO DO WITH ______________________ (MIS PADRES ESTAN MUY TRISTES, YO NO SE QUE HACER CON ELLOS)', english: ["my parents are really sad, i do not know what to do with them", "my parents are really sad, i don't know what to do with them"] },
            { spanish: 'SHE LIKES HER HOUSE, BUT SHE IS GOING TO SELL______________________(A ELLA LE GUSTA SU CASA PERO VA A VENDERLA)', english: ["she likes her house, but she is going to sell it"] },
            { spanish: 'I KNOW THEY’RE EXCITED, THEY HAVEN’T SEEN____________FOR YEARS (YO SE QUE ELLOS ESTÁN EMOCIONADOS, ELLOS NO LO HAN VISTO POR AÑOS)', english: ["i know they are excited, they have not seen him for years", "i know they're excited, they haven't seen him for years"] },
            { spanish: 'MY BROTHER IS TOO SMART, I NEVER HELP_________________WITH HOMEWORK (MI HERMANO ES DEMASIADO INTELIGENTE, YO NUNCA LO AYUDO CON SUS TAREAS)', english: ["my brother is too smart, i never help him with homework"] },
            { spanish: 'WE ARE GOOD STUDENTS, BECAUSE THE TEACHER ALWAYS MOTIVATES___________ (NOSOTROS SOMOS BUENOS ESTUDIANTES, PORQUE EL PROFESOR SIEMPRE NOS MOTIVA)', english: ["we are good students, because the teacher always motivates us"] },
            { spanish: 'SHE DOESN’T SEE HER FRIENDS AT THE PARTY, SO SHE CALLS________________(ELLA NO VE A SUS AMIGOS EN LA FIESTA, ENTONCES ELLA LOS LLAMA)', english: ["she does not see her friends at the party, so she calls them", "she doesn't see her friends at the party, so she calls them"] },
            { spanish: 'THEY INVITE _____________TO THEIR HOUSE. (ELLOS NOS INVITAN A SU CASA)', english: ["they invite us to their house"] },
            { spanish: 'ELLA LOS ESPERA EN LA ESCUELA. (a sus hijos)', english: ["she waits for them at school", "she is waiting for them at school"] },
            { spanish: 'LA HIJA LLAMA A SU PADRE – EL PAPÁ LA LLAMA TODOS LOS DIAS.', english: ["the daughter calls her father - the dad calls her every day", "the daughter calls her father - the father calls her every day", "the daughter calls her dad - the dad calls her every day"] },
            { spanish: 'EL BEBÉ BESA A SU MADRE – EL BEBE LA BESA', english: ["the baby kisses his mother - the baby kisses her", "the baby kisses his mom - the baby kisses her"] },
            { spanish: 'EL BAILA CON SU HERMANA EN SU CUMPLEAÑOS.', english: ["he dances with her on her birthday", "he dances with her on his birthday"] },
        ]
    },
    c11_ex3: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: "YO VOY A MEDELLIN CON CARLOS Y ANDRES- YO VOY CON ELLOS", english: ["i go to medellin with carlos and andres - i go with them", "i'm going to medellin with carlos and andres - i'm going with them"] },
            { spanish: "En Bilbao, los inviernos son frios, pero los veranos son calidos", english: ["in bilbao, the winters are cold, but the summers are warm"] },
            { spanish: "Manchester tiene dos rios y un canal", english: ["manchester has two rivers and a canal"] },
            { spanish: "Los tiquetes son demasiado caros asi que no puedo ir", english: ["the tickets are too expensive so i can't go", "the tickets are too expensive so i cannot go"] },
            { spanish: "YO QUIERO IR ALLÁ CON ELLA PERO NO TENGO TIEMPO", english: ["i want to go there with her but i don't have time", "i want to go there with her but i do not have time"] },
            { spanish: "¿ELLA QUIERE PIZZA O ENSALADA? – ELLA QUIERE UNA ENSALADA CON POLLO,TOCINETA Y LECHUGA", english: ["does she want pizza or salad? she wants a salad with chicken, bacon and lettuce"] },
            { spanish: "SI TU VAS ALLA, COMPRAME UNA CHAQUETA, POR FAVOR", english: ["if you go there, buy me a jacket please", "if you go there buy me a jacket please"] },
            { spanish: "MARK VE TELEVISON MIENTRAS YO HAGO EJERCICIO", english: ["mark watches television while i do exercise", "mark watches tv while i do exercise", "mark watches television while i exercise"] },
            { spanish: "ELLA LOS ESPERA EN LA ESCUELA. (a sus hijos)", english: ["she waits for them at school", "she is waiting for them at school"] },
            { spanish: "LA HIJA LLAMA A SU PADRE – EL PAPÁ LA LLAMA TODOS LOS DIAS.", english: ["the daughter calls her father - the dad calls her every day", "the daughter calls her father - the father calls her every day", "the daughter calls her dad - the dad calls her every day"] },
            { spanish: "EL BEBÉ BESA A SU MADRE – EL BEBE LA BESA", english: ["the baby kisses his mother - the baby kisses her", "the baby kisses his mom - the baby kisses her"] },
            { spanish: "EL BAILA CON SU HERMANA EN SU CUMPLEAÑOS.", english: ["he dances with his sister on his birthday", "he dances with his sister on her birthday"] },
        ]
    },
    c11_ex4: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: "¿DONDE HABLAS CON ELLOS? HABLO CON ELLOS EN EL TRABAJO", english: ["where do you speak with them? i speak with them at work", "where do you talk with them? i talk with them at work"] },
            { spanish: "ELLOS NO NADAN CONMIGO", english: ["they do not swim with me", "they don't swim with me"] },
            { spanish: "ELLA CANTA CON ELLOS", english: ["she sings with them"] },
            { spanish: "¿EL ES SU HERMANO? (DE ELLOS)", english: ["is he their brother?"] },
            { spanish: "¿A DONDE VAS CON ELLA?", english: ["where are you going with her?", "where do you go with her?"] },
            { spanish: "¿A EL LE GUSTA SU TRABAJO?", english: ["does he like his job?"] },
            { spanish: "A ELLA LE GUSTA SU CHAQUETA (JACKET) (DE EL)", english: ["she likes his jacket"] },
            { spanish: "¿TE GUSTA NUESTRA CASA?", english: ["do you like our house?"] },
            { spanish: "ESTA ES SU FINCA (DE ELLA)", english: ["this is her farm", "this is her country house"] },
            { spanish: "ESTE NO ES EL MIO, ES EL TUYO", english: ["this is not mine, it is yours", "this isn't mine, it's yours", "this is not mine, it's yours"] },
            { spanish: "ELLOS NO ESTAN CONMIGO", english: ["they are not with me", "they aren't with me"] },
            { spanish: "EL ES MY HERMANO, TIENE 33 AÑOS", english: ["he is my brother, he is 33 years old", "he's my brother, he is 33 years old", "he is my brother, he's 33 years old"] },
            { spanish: "YO VOY CON ELLA AL SUPERMERCADO", english: ["i go with her to the supermarket", "i'm going with her to the supermarket"] },
            { spanish: "¿ESTAS EN SU CASA? (DE ELLA)", english: ["are you in her house?", "are you at her house?"] },
            { spanish: "¿TU HIJO TOCA LA GUITARRA CON EL? –SI", english: ["does your son play the guitar with him? yes, he does", "does your son play the guitar with him? yes"] },
            { spanish: "¿ESOS SON LOS SUYOS (DE ELLOS) O LOS MIOS?", english: ["are those theirs or mine?"] },
            { spanish: "ELLOS NOS LLAMAN DESDE ESPAÑA:", english: ["they call us from spain", "they're calling us from spain"] },
        ]
    },
    c11_ex5: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: 'ELLA QUIERE VER A SU NOVIO – ELLA QUIERE VERLO', english: ["she wants to see her boyfriend - she wants to see him", "she wants to see her boyfriend she wants to see him"] },
            { spanish: 'NOSOTROS QUEREMOS ESA CASA- NOSOTROS QUEREMOS TENERLA, PERO ES MUY CARA', english: ["we want that house - we want to have it but it is very expensive", "we want that house we want to have it but it's very expensive"] },
            { spanish: 'YO QUIERO TENER ESE PERRO- YO QUIERO TENERLO, PERO ES MUY CARA', english: ["i want to have that dog - i want to have it but it is very expensive", "i want to have that dog i want to have it but it's very expensive"] },
            { spanish: 'A ELLOS NO LES GUSTAN MIS AMIGOS- A ELLOS NO LES GUSTAN', english: ["they do not like my friends - they do not like them", "they'n tlike my friends they don't like them"] },
            { spanish: 'A ELLA NO LE GUSTA EL PESCADO- A ELLA NO LE GUSTA, POR EL OLOR', english: ["she does not like fish - she does not like it because of the smell", "she doesn't like fish she doesn't like it because of the smell"] },
            { spanish: 'ÉL BESA SU ESPOSA ANTES DE SU VIAJE- ÉL LA BESA', english: ["he kisses his wife before his trip - he kisses her", "he kisses his wife before his trip he kisses her"] },
            { spanish: 'NOSOTROS ESTUDIAMOS CON PAUL- NOSOTROS ESTUDIAMOS CON ÉL EN LA BIBLIOTECA', english: ["we study with paul - we study with him in the library", "we study with paul we study with him in the library"] },
            { spanish: 'JACK VIAJA CON MARY Y JHON – JACK VIAJA CON ELLOS', english: ["jack travels with mary and john - jack travels with them", "jack travels with mary and jhon jack travels with them"] },
            { spanish: 'ÉL LLAMA A SU JEFE- ÉL LO LLAMA PORQUE TUVO UN RETRASO EN LA ENTREGA', english: ["he calls his boss - he calls him because he had a delay in the delivery", "he calls his boss he calls him because he had a delay in the delivery"] },
            { spanish: 'YO AYUDO A MARIA- YO LA AYUDO EN SU TIENDA DE ZAPATOS', english: ["i help maria - i help her in her shoe store", "i help maria i help her in her shoe shop"] },
            { spanish: 'YO NO SE TU NOMBRE - ¿PUEDES REPETIRLO?', english: ["i do not know your name - can you repeat it?", "i don't know your name can you repeat it?"] },
            { spanish: 'ELLA LLAMA A SU MAMÁ – ELLA LA LLAMA TODOS LOS DIAS', english: ["she calls her mom - she calls her every day", "she calls her mother she calls her every day"] },
            { spanish: 'EL NO VE SUS PADRES IN LA CASA, ENTONCES EL LOS LLAMA', english: ["he does not see his parents at home so he calls them", "he doesn't see his parents at home so he calls them", "he does not see his parents in the house so he calls them"] },
            { spanish: 'CAMILA QUIERE UNA HAMBURGUESA, PERO NO LA COMPRA PORQUE ELLA NO PUEDE COMERLA', english: ["camila wants a hamburger but she does not buy it because she cannot eat it", "camila wants a hamburger but she doesn't buy it because she can't eat it"] },
            { spanish: 'LINA VIAJA CON SU SOBRINA A EUROPA Y ELLAS LO DISFRUTAN', english: ["lina travels with her niece to europe and they enjoy it", "lina travels with her niece to europe and they're enjoying it"] },
            { spanish: 'A ELLOS NO LES GUSTA CORRER CON ELLOS, PORQUE SON PRINCIPIANTES', english: ["they do not like to run with them because they are beginners", "they don't like running with them because they're beginners"] },
        ]
    },
    c11_ex6: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: "ELLOS NO ESTAN ENOJADOS CON NOSOTROS, ELLOS ESTAN ENOJADOS CON EL", english: ["they are not angry with us, they are angry with him", "they aren't angry with us, they're angry with him"] },
            { spanish: "¿DONDE ESTÁ LA CAMARA? - ¿DONDE ESTA LA MIA? TU CAMARA ESTÁ EN EL SOTANO", english: ["where is the camera? where is mine? your camera is in the basement"] },
            { spanish: "¿ELLA ES SU HIJA? (DE EL)- ELLA ES MUY ALTA", english: ["is she his daughter? she is very tall", "is she his daughter? she's very tall"] },
            { spanish: "ELLOS NO ME AYUDAN BECAUSE ELLOS ESTÁN OCUPADOS EN SU PROYECTO", english: ["they do not help me because they are busy in their project", "they don't help me because they're busy in their project"] },
            { spanish: "¿ESTUDIAS CON NOSOTROS? – NO,YO TENGO QUE LAVAR LOS PLATOS AHORA MISMO, MI MAMÁ ESTÁ ENOJADA", english: ["do you study with us? no, i have to wash the dishes right now, my mom is angry", "do you study with us? no, i have to wash the dishes right now, my mother is angry"] },
            { spanish: "A ELLA LE GUSTA EL SUYO (DE ELLA)", english: ["she does not like her dress, she does not like hers", "she doesn't like her dress, she doesn't like hers"] },
            { spanish: "¿HABLAS CON EL? – NO, NOSOTROS NO HABLAMOS HACE UN AÑO", english: ["do you talk with him? no, we do not talk for a year", "do you talk to him? no, we don't talk for a year"] },
            { spanish: "¿ESTOS SON TUYOS O MIOS? - ESOS SON MIOS", english: ["are these yours or mine? those are mine"] },
            { spanish: "ELLOS SON MIS PRIMOS", english: ["they are my cousins", "they're my cousins"] },
            { spanish: "ESTA ES SU CANCION (SONG) (DE ELLOS)", english: ["this is their song"] },
            { spanish: "¿NOSOTROS VAMOS CON ELLOS? -NO", english: ["do we go with them? no", "are we going with them? no"] },
            { spanish: "EL NO VIVE CONMIGO- EL VIVE CON SU MADRE", english: ["he does not live with me, he lives with his mother", "he doesn't feel comfortable living with his mother", "he doesn't live with me, he lives with his mom"] },
            { spanish: "¿VIENES CON NOSOTROS? –POR SUPUESTO", english: ["do you come with us? of course", "are you coming with us? of course"] },
            { spanish: "ELLA NO COME CON EL- ELLA COME SOLA", english: ["she does not eat with him, she eats alone", "she doesn't eat with him, she alone"] },
        ]
    },
    c12_ex1: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: '¿QUE ESTAN HACIENDO ELLOS?', english: ["what are they doing?"] },
            { spanish: 'ELLA NO ESTA DURMIENDO, ELLA ESTA COCINANDO', english: ["she is not sleeping, she is cooking", "she isn't sleeping, she's cooking"] },
            { spanish: 'NOSOTROS ESTAMOS ESTUDIANDO PROGRAMACION', english: ["we are studying programming", "we're studying programming"] },
            { spanish: '¿A DONDE ESTA YENDO MARY?', english: ["where is mary going?", "where's mary going?"] },
            { spanish: '¿ESTAS ESCUCHANDO MUSICA? - NO', english: ["are you listening to music? - no", "are you listening to music? no"] },
            { spanish: 'EL NO LLEGA A LAS 10, EL ESTA LLEGANDO A LAS 8', english: ["he does not arrive at 10, he is arriving at 8", "he doesn't arrive at 10, he's arriving at 8"] },
            { spanish: '¿TU ABUELA ESTA LEYENDO UN LIBRO? – SI', english: ["is your grandmother reading a book? - yes", "is your grandma reading a book? - yes", "is your grandmother reading a book? yes", "is your grandma reading a book? yes"] },
        ]
    },
    c12_ex2: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: '1. ¿ELLA ESTA ESTUDIANDO? SI. (SHORT ANSWER)', english: ["is she studying? yes, she is"] },
            { spanish: '2. NOSOTROS NO ESTAMOS TRABAJANDO EN ESA EMPRESA', english: ["we are not working in that company", "we're not working in that company", "we aren't working in that company"] },
            { spanish: '3. ¿EL SE ESTA MURIENDO EN ESE HOSPITAL? NO, EL ESTA MEJOR DESPUES DE SU CIRUGIA.', english: ["is he dying in that hospital? no, he is better after his surgery", "is he dying in that hospital? no, he's better after his surgery"] },
            { spanish: '4. ¿ESTAS CORRIENDO TODOS LOS DIAS? SI.', english: ["are you running every day? yes, i am", "are you running every day? yes i am"] },
            { spanish: '5. ¿USTEDES ESTAN APRENDIENDO CON ESA PROFESORA? - SI', english: ["are you learning with that teacher? yes, we are", "are you learning with that teacher? yes we are"] },
            { spanish: '6. ELLA NO ESTÁ ENSEÑANDO (TEACH) ALEMAN', english: ["she is not teaching german", "she isn't teaching german", "she's not teaching german"] },
            { spanish: '7. ELLOS ESTAN COMENZANDO EL CURSO DE ITALIANO.', english: ["they are beginning the italian course", "they're beginning the italian course"] },
            { spanish: '8. ¿ELLOS ESTAN JUGANDO VIDEOJUEGOS? – NO.', english: ["are they playing video games? no, they are not", "are they playing video games? no, they aren't", "are they playing videogames? no, they are not"] },
            { spanish: '9. NOSOTROS ESTAMOS MANEJANDO (DRIVE) UN CAMION-', english: ["we are driving a truck", "we're driving a truck"] },
            { spanish: '10. ELLOS ESTAN GANANDO EL PARTIDO DE FUTBOL.', english: ["they are winning the soccer match", "they're winning the soccer match", "they are winning the football match", "they're winning the football match"] },
            { spanish: '11. ESTOY VIAJANDO PARA NUEVA YORK EN ESTE MOMENTO.', english: ["i am traveling to new york at this moment", "i'm traveling to new york at this moment", "i am travelling to new york at this moment"] },
            { spanish: '12. ¿QUE ESTAS HACIENDO? – YO ESTOY ESTUDIANDO INGLES.', english: ["what are you doing? i am studying english", "what are you doing? i'm studying english"] },
            { spanish: '13. ¿ESTA LLOVIENDO MUCHO? – SI, TODOS LOS DIAS.', english: ["is it raining a lot? yes, every day", "is it raining a lot? yes every day"] },
        ]
    },
    c12_ex5: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: '1. YO VOY A ITALIA---------- YO ESTOY YENDO A ITALIA.', english: ["i go to italy - i am going to italy", "i go to italy - i'm going to italy"] },
            { spanish: '2. ELLA VA A LA UNIVERSIDAD -- ELLA ESTA YENDO AL COLEGIO', english: ["she goes to the university - she is going to school", "she goes to the university - she's going to school"] },
            { spanish: '3. NOSOTROS NO VAMOS A LA BIBLIOTECA--NOSOTROS NO ESTAMOS YENDO A LA EMPRESA', english: ["we do not go to the library - we are not going to the company", "we don't go to the library - we aren't going to the company", "we don't go to the library - we're not going to the company"] },
            { spanish: '4. ¿ELLOS CORREN EN LA CALLE? -- ¿ELLOS ESTAN CORRIENDO EN EL PARQUE?', english: ["do they run in the street? - are they running in the park?"] },
            { spanish: '5. ¿ELLA BEBE VINO? –¿ELLA ESTA BEBIENDO AGUA? – NO, ELLA ESTA BEBIENDO VODKA CON JUGO DE NARANJA', english: ["does she drink wine? - is she drinking water? - no, she is drinking vodka with orange juice", "does she drink wine? - is she drinking water? - no, she's drinking vodka with orange juice"] },
            { spanish: '6. ¿TU CANTAS EN EL BAÑO? – ¿ELLA ESTA CANTANDO EN EL JARDIN?', english: ["do you sing in the bathroom? - is she singing in the garden?"] },
            { spanish: '7. ¿QUE HACES LOS VIERNES? - ¿QUE ESTAS HACIENDO LOS DOMINGOS?', english: ["what do you do on fridays? - what are you doing on sundays?"] },
            { spanish: '8. ELLA NO CORRE- ELLA NO ESTA CORRIENDO – ELLA ESTÁ CAMINANDO.', english: ["she does not run - she is not running - she is walking", "she doesn't run - she isn't running - she's walking"] },
        ]
    },
    c14_general: {
        title: 'a1class1.exercise',
        prompts: [
            { spanish: '1. ¿DONDE ESTA EL ARBOL MAS ALTO? (HIGH)', english: ["where is the highest tree?"] },
            { spanish: '2. EL PUEDE AYUDARNOS', english: ["he can help us"] },
            { spanish: '3. NOSOTROS NO ESTAMOS MANEJANDO UN CAMION', english: ["we are not driving a truck", "we're not driving a truck", "we aren't driving a truck"] },
            { spanish: '4. ¿ELLA JUEGA con el?', english: ["does she play with him?"] },
            { spanish: '5. ¿BARRANQUILLA ES MAS CALIENTE QUE CARTAGENA?', english: ["is barranquilla hotter than cartagena?"] },
            { spanish: '6. ELLOS NO DESAYUNAN A LAS 9', english: ["they do not have breakfast at 9", "they don't have breakfast at 9", "they do not eat breakfast at 9", "they don't eat breakfast at 9"] },
            { spanish: '7. ELLA ESTA JUGANDO CON SU HIJO', english: ["she is playing with her son", "she's playing with her son"] },
            { spanish: '8. ¿COLOMBIA ES MAS GRANDE QUE PANAMA?', english: ["is colombia bigger than panama?"] },
            { spanish: '9. ELLA NO LOS ESTA LLAMANDO', english: ["she is not calling them", "she's not calling them", "she isn't calling them"] },
            { spanish: '10. ¿QUE LE ENSEÑAS A ELLOS?', english: ["what do you teach them?"] },
        ]
    },
    custom_ex_some: {
        title: 'Exercise With Some',
        prompts: [
            { spanish: 'HAY UNAS ROSAS EN MI JARDIN', english: ["there are some roses in my garden", "there are some roses in my yard"] },
            { spanish: 'HAY UNOS PAJAROS ALLI', english: ["there are some birds there"] },
            { spanish: 'HAY ALGO DE LECHE EN LA BOTELLA', english: ["there is some milk in the bottle", "there's some milk in the bottle"] },
            { spanish: 'HAY UNAS CERVEZAS EN LA NEVERA', english: ["there are some beers in the fridge", "there are some beers in the refrigerator"] },
            { spanish: 'HAY ALGUNOS ARBOLES EN LA FINCA', english: ["there are some trees on the farm", "there are some trees in the country house", "there are some trees in the farm"] },
            { spanish: 'HAY ALGO DE DINERO EN LA MESA', english: ["there is some money on the table", "there's some money on the table"] },
        ]
    },
    custom_ex_any: {
        title: 'Exercise With Any',
        prompts: [
            { spanish: 'NO HAY NINGUNA PAPA EN LA NEVERA', english: ["there aren't any potatoes in the kitchen", "there are not any potatoes in the kitchen", "there aren't any potatoes in the fridge", "there are not any potatoes in the fridge"] },
            { spanish: '¿TIENES ALGUNAS MANZANAS PARA LA TORTA?', english: ["do you have any apples for the cake?"] },
            { spanish: 'NO TENGO PLATA -> NADA DE DINERO', english: ["i don't have any money", "i do not have any money", "i have no money"] },
            { spanish: '¿HAY (ALGO DE) AZUCAR?', english: ["is there any sugar?"] },
            { spanish: '¿HAY AGUA?', english: ["is there any water?"] },
            { spanish: '¿NO HAY CARROS AFUERA?', english: ["aren't there any cars outside?", "are there not any cars outside?"] },
        ]
    },
    custom_ex_mix: {
        title: 'Exercise Mix',
        prompts: [
            { spanish: '¿PUEDO BEBER (ALGO DE) AGUA?', english: ["can i have some water?", "can i drink some water?"] },
            { spanish: '¿QUISIERAS (ALGO DE) TE?', english: ["would you like some tea?"] },
            { spanish: '¿PUEDES DARME UN POCO DE VINO?', english: ["can you give me some wine?"] },
            { spanish: 'EL CASI NUNCA HACE NINGUNA TAREA.', english: ["he hardly ever does any homework", "he almost never does any homework"] },
            { spanish: '¿TE GUSTARIA COMER ALGO?', english: ["would you like to eat something?", "would you like some?", "would you like something to eat?"] },
            { spanish: '¿PUEDO COMER ALGO DE PAN?', english: ["can i have some bread?", "can i eat some bread?"] },
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
    vocabulary,
    highlightVocabulary = false,
}: { 
    exerciseKey: string,
    onComplete?: () => void,
    course?: string,
    title?: string,
    vocabulary?: Record<string, string>,
    highlightVocabulary?: boolean;
}) {
    const { t } = useTranslation();
    const { toast } = useToast();

    const imageToShow = course === 'a1' || course === 'b1' ? a1MascotImage : guideFishImage;

    const exerciseNumber = useMemo(() => exerciseKey.replace(/mixed|c\d+_ex|c\d+_the|c\d+_last|c\d+_general|custom_ex_/g, ''), [exerciseKey]);
    
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

    const currentPrompt = exerciseData.prompts[currentPromptIndex] || { spanish: '', english: [] };
    
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
                : [(prompt.english as string).toLowerCase().replace(/[.?,]/g, '')];
            return correctAnswers.includes(userAnswer) ? 'correct' : 'incorrect';
        });
        setValidationStates(newValidationStates);

        const allCorrect = newValidationStates.every(state => state === 'correct');
        if (allCorrect) {
            toast({ title: t('spellingExercise.correct') || "¡Todo correcto! Ejercicio completado." });
            setShowCompletionMessage(true);
            if (onComplete) {
                onComplete();
            }
        } else {
            toast({ 
                variant: 'destructive', 
                title: t('spellingExercise.incorrect') || "Algunas respuestas son incorrectas", 
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
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle>{title}</CardTitle>
                        <div className="text-sm font-medium text-muted-foreground">
                            {currentPromptIndex + 1} / {exerciseData.prompts.length}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className={cn("w-fit shrink-0", highlightVocabulary && "border-2 border-brand-blue animate-border-pulse")}>
                                    <BookText className="mr-2 h-4 w-4" />
                                    Vocabulario
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Vocabulario Clave</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Palabras importantes para este ejercicio.
                                        </p>
                                    </div>
                                    <div className="grid gap-2 text-sm">
                                        {Object.entries(vocabulary).map(([spanish, english]) => (
                                            <div key={spanish} className="grid grid-cols-2 items-center gap-4">
                                                <span className="text-muted-foreground capitalize">{spanish}</span>
                                                <span className="font-semibold text-right">{english}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
                <div className="flex items-center justify-start flex-wrap gap-2 mt-4">
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
                                <p className="text-lg font-medium">{currentPrompt?.spanish}</p>
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
                 <Button variant="outline" onClick={() => setCurrentPromptIndex(p => Math.max(0, p - 1))} disabled={currentPromptIndex === 0}>
                     <ArrowLeft className="mr-2 h-4 w-4" />
                     {t('translationExercise.previous') || 'Anterior'}
                 </Button>

                {currentPromptIndex === totalPrompts - 1 ? (
                     <Button onClick={handleFinalCheck}>
                         {t('translationExercise.checkAll') || 'Verificar Todo'}
                     </Button>
                ) : (
                     <Button variant="outline" onClick={() => setCurrentPromptIndex(p => Math.min(totalPrompts - 1, p + 1))} disabled={currentPromptIndex === totalPrompts - 1}>
                         {t('translationExercise.next') || 'Siguiente'}
                         <ArrowRight className="ml-2 h-4 w-4" />
                     </Button>
                )}
            </CardFooter>
        </Card>
    );
}
