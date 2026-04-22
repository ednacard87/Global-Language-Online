'use client';

import React, { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { BookOpen, Mic, Video, Music, Lock, CheckCircle, Flame, Gamepad2, Star } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useTranslation } from '@/context/language-context';
import { calculateEspanolIntroProgress, getA1MainPath, getA2EspanolPath } from '@/lib/course-data';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';


const NeonCard = ({ icon: Icon, title, href }: { icon: React.ElementType, title: string, href?: string }) => (
    <Link href={href || '#'} className="block" target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}>
        <Card className="bg-card border-2 border-primary/50 rounded-2xl text-center p-4 transition-all hover:bg-primary/10 hover:border-primary hover:shadow-lg hover:shadow-primary/20 aspect-square flex flex-col justify-center items-center">
            <Icon className="h-12 w-12 mx-auto text-primary" />
            <p className="mt-2 font-bold uppercase">{title}</p>
        </Card>
    </Link>
);

const AdventureCard = ({ title, description, href, progress, locked, icon: Icon }: { title: string, description: string, href: string, progress?: number, locked?: boolean, icon: React.ElementType }) => (
    <Link href={locked ? '#' : href} className={cn("block", locked && "cursor-not-allowed")}>
        <Card className={cn(
            "bg-card border-2 border-primary/50 p-4 transition-all",
            locked ? "opacity-50" : "hover:bg-primary/10 hover:border-primary hover:shadow-lg hover:shadow-primary/20"
        )}>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-2xl font-bold mt-1 flex items-center gap-2">
                        <Icon className="h-8 w-8 text-primary" />
                        {title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground mt-1">{description}</CardDescription>
                </div>
                <div className="text-right">
                    {locked ? (
                        <Lock className="h-8 w-8 text-yellow-500"/>
                    ) : progress !== undefined && progress >= 100 ? (
                        <CheckCircle className="h-10 w-10 text-green-400"/>
                    ) : progress !== undefined ? (
                        <span className="text-sm font-bold">{progress}%</span>
                    ) : null}
                </div>
            </div>
            {progress !== undefined && !locked && (
                <div className="mt-2">
                    <Progress value={progress} className="h-3 bg-muted" indicatorClassName="!bg-primary"/>
                </div>
            )}
        </Card>
    </Link>
);


export default function EspanolDashboardPage() {
    const { t } = useTranslation();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = useState(true);

    const studentDocRef = useMemoFirebase(
      () => (user ? doc(firestore, 'students', user.uid) : null),
      [firestore, user]
    );
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{progress?: Record<string, number>, name?: string, photoURL?: string, role?: string, selectedCourse?: string}>(studentDocRef);

    const isAdmin = useMemo(() => {
        if (!user) return false;
        return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
    }, [user, studentProfile]);

    useEffect(() => {
        if (isUserLoading || isProfileLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        if (studentProfile && !isAdmin && !studentProfile.selectedCourse) {
            router.push('/select-course');
            return;
        }

        if (studentProfile && !isAdmin && studentProfile.selectedCourse !== 'espanol') {
            router.push('/');
        } else {
            setIsRedirecting(false);
        }
    }, [user, studentProfile, isUserLoading, isProfileLoading, isAdmin, router]);

    const vrGamerAvatar = PlaceHolderImages.find(p => p.id === 'vr-gamer-avatar');

    const introProgress = useMemo(() => calculateEspanolIntroProgress(studentProfile?.progress), [studentProfile]);

    const a1Progress = useMemo(() => {
        if (!studentProfile?.progress) return 0;
        const a1Items = getA1MainPath(t);
        const totalItems = a1Items.length - 2; // exclude start and end
        if (totalItems <= 0) return 0;
        const completedItems = a1Items.reduce((acc, item) => {
            if (item.storageKey && (studentProfile.progress?.[item.storageKey] ?? 0) >= 100) {
                return acc + 1;
            }
            return acc;
        }, 0);
        return Math.round((completedItems / totalItems) * 100);
    }, [studentProfile, t]);

    const a2Progress = useMemo(() => {
        if (!studentProfile?.progress) return 0;
        const a2Items = getA2EspanolPath(t);
        const totalItems = a2Items.length - 2; // exclude start and end
        if (totalItems <= 0) return 0;
        const completedItems = a2Items.reduce((acc, item) => {
            if (item.storageKey && (studentProfile.progress?.[item.storageKey] ?? 0) >= 100) {
                return acc + 1;
            }
            return acc;
        }, 0);
        return Math.round((completedItems / totalItems) * 100);
    }, [studentProfile, t]);
    
    const courses = useMemo(() => {
        if (!studentProfile && !isAdmin) return [];
        return [
          { 
              title: "Curso Intro Español", 
              description: "Comienza tu aventura aprendiendo lo básico.",
              href: "/espanol/intro", 
              progress: introProgress, 
              locked: false,
              icon: Star 
          },
          { 
              title: "Curso A1 - Español", 
              description: "Aprende los fundamentos del español.",
              href: "/a1", 
              progress: a1Progress,
              locked: isAdmin ? false : introProgress < 100,
              icon: BookOpen 
          },
          { 
              title: "Curso A2 - Español", 
              description: "Avanza a un nivel pre-intermedio.",
              href: "/a2", 
              progress: a2Progress,
              locked: isAdmin ? false : a1Progress < 100,
              icon: Gamepad2
          },
        ];
    }, [t, studentProfile, user, introProgress, a1Progress, a2Progress, isAdmin]);

    const introCourse = useMemo(() => courses.find(c => c.href === "/espanol/intro"), [courses]);
    const otherCourses = useMemo(() => courses.filter(c => c.href !== "/espanol/intro"), [courses]);


    if (isUserLoading || isProfileLoading || isRedirecting) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

  return (
    <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg">
      <DashboardHeader />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center rounded-lg bg-card/80 backdrop-blur-sm border-2 border-brand-purple p-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary">BIENVENIDO, {studentProfile?.name?.split(' ')[0] || 'Estudiante'}!</h1>
                    <p className="text-muted-foreground">¿Listo para tu proximo reto?</p>
                </div>
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-4 border-primary">
                        <AvatarImage src={user?.photoURL || vrGamerAvatar?.imageUrl} alt={studentProfile?.name || 'Estudiante'} />
                        <AvatarFallback>{studentProfile?.name?.[0] || 'E'}</AvatarFallback>
                    </Avatar>
                </div>
            </div>

            {/* --- DESKTOP VIEW --- */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-xl font-bold text-primary uppercase tracking-wider">Habilidades Rápidas</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Card className="bg-card border-2 border-primary/50 rounded-2xl text-center p-4 transition-all hover:bg-primary/10 hover:border-primary hover:shadow-lg hover:shadow-primary/20 aspect-square flex flex-col justify-center items-center cursor-pointer">
                                <BookOpen className="h-12 w-12 mx-auto text-primary" />
                                <p className="mt-2 font-bold uppercase">LECTURA</p>
                            </Card>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                              <DialogTitle className="text-2xl">Polo y la Mariposa</DialogTitle>
                              <DialogDescription>
                                Una pequeña historia para practicar tu lectura en español.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="text-base text-muted-foreground space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                              <p>
                                Había una vez un gato muy curioso llamado Polo. Polo tenía el pelaje suave y gris, y unos grandes ojos verdes que siempre buscaban algo nuevo que explorar.
                              </p>
                              <p>
                                Un día soleado, mientras descansaba en el jardín, Polo vio una mariposa de colores brillantes. Era azul y amarilla, y volaba con mucha gracia entre las flores. La curiosidad de Polo se despertó de inmediato.
                              </p>
                              <p>
                                Se levantó lentamente y comenzó a seguir a la mariposa. Primero, caminó despacio para no asustarla. La mariposa voló hacia un rosal, y Polo la siguió. Luego, voló sobre un pequeño estanque, y Polo saltó con cuidado para no mojarse.
                              </p>
                              <p>
                                La mariposa lo llevó más allá del jardín que conocía, hasta un rincón secreto detrás de unos viejos árboles. Allí, Polo descubrió un jardín escondido, lleno de flores silvestres que nunca había visto y con un aroma dulce y fresco.
                              </p>
                              <p>
                                La mariposa se posó sobre una flor roja y pareció sonreírle. Polo se sentó, feliz por su nueva aventura, y se quedó allí, disfrutando de la paz del jardín secreto hasta que el sol comenzó a bajar.
                              </p>
                              
                              <Separator className="my-6" />

                              <div className="space-y-4">
                                  <h3 className="text-xl font-semibold text-foreground">Preguntas de Comprensión</h3>
                                  <div className="space-y-2">
                                      <p className="font-medium">1. ¿De qué color era el pelaje de Polo?</p>
                                      <p className="text-sm ml-4">a) Blanco y negro</p>
                                      <p className="text-sm ml-4">b) Suave y gris</p>
                                      <p className="text-sm ml-4">c) Naranja</p>
                                  </div>
                                  <div className="space-y-2">
                                      <p className="font-medium">2. ¿Qué vio Polo que despertó su curiosidad?</p>
                                      <p className="text-sm ml-4">a) Un pájaro</p>
                                      <p className="text-sm ml-4">b) Otro gato</p>
                                      <p className="text-sm ml-4">c) Una mariposa de colores</p>
                                  </div>
                                  <div className="space-y-2">
                                      <p className="font-medium">3. ¿A dónde lo llevó la mariposa?</p>
                                      <p className="text-sm ml-4">a) A un jardín secreto</p>
                                      <p className="text-sm ml-4">b) A su casa</p>
                                      <p className="text-sm ml-4">c) A un parque</p>
                                  </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <NeonCard icon={Mic} title="PODCAST" href="https://www.youtube.com/watch?v=WRJnVyqVGpc" />
                        <NeonCard icon={Video} title="VIDEO" href="https://www.youtube.com/watch?v=7J-PYxCP1_Y" />
                        <NeonCard icon={Music} title="MÚSICA" href="https://www.youtube.com/playlist?list=PL-R52P_o02vF-n-l0g_9gS6dQLo1a_Fp" />
                        <NeonCard icon={Music} title="CANCIÓN" href="https://es.lyricstraining.com/sign_up" />
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-primary uppercase tracking-wider">La Aventura de Aprendizaje</h2>
                    <div className="space-y-3">
                        {courses.map((course, index) => (
                            <AdventureCard key={index} {...course} />
                        ))}
                    </div>
                </div>
            </div>

            {/* --- MOBILE VIEW --- */}
            <div className="lg:hidden flex flex-col space-y-8">
              {/* 1. Intro Course */}
              {introCourse && (
                <div>
                  <h2 className="text-xl font-bold text-primary uppercase tracking-wider mb-4">La Aventura de Aprendizaje</h2>
                  <AdventureCard {...introCourse} />
                </div>
              )}
              
              {/* 2. Quick Skills */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-primary uppercase tracking-wider">Habilidades Rápidas</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <Dialog>
                      <DialogTrigger asChild>
                         <Card className="bg-card border-2 border-primary/50 rounded-2xl text-center p-4 transition-all hover:bg-primary/10 hover:border-primary hover:shadow-lg hover:shadow-primary/20 aspect-square flex flex-col justify-center items-center cursor-pointer">
                            <BookOpen className="h-12 w-12 mx-auto text-primary" />
                            <p className="mt-2 font-bold uppercase">LECTURA</p>
                        </Card>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle className="text-2xl">Polo y la Mariposa</DialogTitle>
                          <DialogDescription>
                            Una pequeña historia para practicar tu lectura en español.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="text-base text-muted-foreground space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                          <p>
                            Había una vez un gato muy curioso llamado Polo. Polo tenía el pelaje suave y gris, y unos grandes ojos verdes que siempre buscaban algo nuevo que explorar.
                          </p>
                          <p>
                            Un día soleado, mientras descansaba en el jardín, Polo vio una mariposa de colores brillantes. Era azul y amarilla, y volaba con mucha gracia entre las flores. La curiosidad de Polo se despertó de inmediato.
                          </p>
                          <p>
                            Se levantó lentamente y comenzó a seguir a la mariposa. Primero, caminó despacio para no asustarla. La mariposa voló hacia un rosal, y Polo la siguió. Luego, voló sobre un pequeño estanque, y Polo saltó con cuidado para no mojarse.
                          </p>
                          <p>
                            La mariposa lo llevó más allá del jardín que conocía, hasta un rincón secreto detrás de unos viejos árboles. Allí, Polo descubrió un jardín escondido, lleno de flores silvestres que nunca había visto y con un aroma dulce y fresco.
                          </p>
                          <p>
                            La mariposa se posó sobre una flor roja y pareció sonreírle. Polo se sentó, feliz por su nueva aventura, y se quedó allí, disfrutando de la paz del jardín secreto hasta que el sol comenzó a bajar.
                          </p>
                          <Separator className="my-6" />

                          <div className="space-y-4">
                              <h3 className="text-xl font-semibold text-foreground">Preguntas de Comprensión</h3>
                              <div className="space-y-2">
                                  <p className="font-medium">1. ¿De qué color era el pelaje de Polo?</p>
                                  <p className="text-sm ml-4">a) Blanco y negro</p>
                                  <p className="text-sm ml-4">b) Suave y gris</p>
                                  <p className="text-sm ml-4">c) Naranja</p>
                              </div>
                              <div className="space-y-2">
                                  <p className="font-medium">2. ¿Qué vio Polo que despertó su curiosidad?</p>
                                  <p className="text-sm ml-4">a) Un pájaro</p>
                                  <p className="text-sm ml-4">b) Otro gato</p>
                                  <p className="text-sm ml-4">c) Una mariposa de colores</p>
                              </div>
                              <div className="space-y-2">
                                  <p className="font-medium">3. ¿A dónde lo llevó la mariposa?</p>
                                  <p className="text-sm ml-4">a) A un jardín secreto</p>
                                  <p className="text-sm ml-4">b) A su casa</p>
                                  <p className="text-sm ml-4">c) A un parque</p>
                              </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <NeonCard icon={Mic} title="PODCAST" href="https://www.youtube.com/watch?v=WRJnVyqVGpc" />
                    <NeonCard icon={Video} title="VIDEO" href="https://www.youtube.com/watch?v=7J-PYxCP1_Y" />
                    <NeonCard icon={Music} title="MÚSICA" href="https://www.youtube.com/playlist?list=PL-R52P_o02vF-n-l0g_9gS6dQLo1a_Fp" />
                    <NeonCard icon={Music} title="CANCIÓN" href="https://es.lyricstraining.com/sign_up" />
                </div>
              </div>
              
              {/* 3. Rest of Courses */}
              <div className="space-y-3">
                {otherCourses.map((course, index) => (
                  <AdventureCard key={index} {...course} />
                ))}
              </div>
            </div>
        </div>
      </main>
    </div>
  );
}
