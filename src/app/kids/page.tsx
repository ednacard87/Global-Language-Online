
'use client';

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { Loader2, Check, Flame, Gamepad2, Ear, BookOpen, Swords, CaseSensitive, Lock, Star, Rocket, Music } from 'lucide-react';
import { DashboardHeader } from "@/components/dashboard/header";
import { useTranslation } from "@/context/language-context";
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { calculateIntroCourseProgress } from "@/lib/course-data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const NeonCard = ({ icon: Icon, title, href, children, disabled }: { icon: React.ElementType, title: string, href?: string, children?: React.ReactNode, disabled?: boolean }) => {
    const content = (
        <Card className={cn("bg-gray-800/50 border-2 border-purple-500/50 rounded-2xl text-center p-4 transition-all", disabled ? "cursor-not-allowed opacity-50" : "hover:bg-purple-500/20 hover:border-purple-400 hover:shadow-[0_0_15px_theme(colors.purple.500)]")}>
            <Icon className="h-12 w-12 mx-auto text-cyan-400" />
            <p className="mt-2 font-bold text-white">{title}</p>
        </Card>
    );

    if (href && !disabled) {
        const isExternal = href.startsWith('http');
        return (
            <Link 
                href={href} 
                className="block"
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
            >
                {content}
            </Link>
        );
    }
    
    return <div className={cn(disabled && "cursor-not-allowed")}>{children || content}</div>;
};

const AdventureCard = ({ title, description, href, progress, locked, icon: Icon }: { title: string, description: string, href: string, progress?: number, locked?: boolean, icon: React.ElementType }) => (
    <Link href={locked ? '#' : href} className={cn("block", locked && "cursor-not-allowed")}>
        <Card className={cn(
            "bg-gray-800/50 border-2 border-purple-500/50 p-4 transition-all",
            locked ? "opacity-50" : "hover:bg-purple-500/20 hover:border-purple-400 hover:shadow-[0_0_15px_theme(colors.purple.500)]"
        )}>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
                        <Icon className="h-8 w-8 text-cyan-400" />
                        {title}
                    </CardTitle>
                    <CardDescription className="text-gray-400 mt-1">{description}</CardDescription>
                </div>
                <div className="text-right">
                    {locked ? (
                        <Lock className="h-8 w-8 text-yellow-500"/>
                    ) : progress !== undefined && progress >= 100 ? (
                        <Check className="h-10 w-10 text-green-400"/>
                    ) : progress !== undefined ? (
                        <span className="text-sm font-bold text-white/80">{progress}%</span>
                    ) : null}
                </div>
            </div>
            {progress !== undefined && !locked && (
                <div className="mt-2">
                    <Progress value={progress} className="h-3 bg-gray-700" indicatorClassName="!bg-cyan-400"/>
                </div>
            )}
        </Card>
    </Link>
);


export default function KidsCoursePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isRedirecting, setIsRedirecting] = useState(true);

  const studentDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'students', user.uid) : null),
    [firestore, user]
  );
  const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: 'admin' | 'student', progress?: Record<string, number>, name?: string, photoURL?: string, selectedCourse?: string, currentStreak?: number, lastLoginDate?: string }>(studentDocRef);

  const vrGamerAvatar = PlaceHolderImages.find(p => p.id === 'vr-gamer-avatar');

  const isAdmin = useMemo(() => {
      if (!user) return false;
      return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
  }, [user, studentProfile]);
  
  const introProgress = useMemo(() => calculateIntroCourseProgress(studentProfile?.progress), [studentProfile]);
  const canPlayIntroGames = introProgress >= 30 || isAdmin;

  const handleLockedGamesClick = () => {
    toast({
        title: 'Juegos Bloqueados',
        description: t('dashboard.unlockGames'),
        variant: "default",
    });
  };

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

    if (studentProfile && !isAdmin && studentProfile.selectedCourse !== 'kids') {
        router.push('/');
    } else {
        setIsRedirecting(false);
    }
  }, [user, studentProfile, isUserLoading, isProfileLoading, isAdmin, router]);

  useEffect(() => {
    if (!user || !studentProfile || !firestore) return;

    const today = new Date();
    const todayStr = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().split('T')[0];
    const lastLoginStr = studentProfile.lastLoginDate;

    if (lastLoginStr !== todayStr) {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const yesterdayStr = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).toISOString().split('T')[0];

        let newStreak = (lastLoginStr === yesterdayStr) ? (studentProfile.currentStreak || 0) + 1 : 1;
        
        updateDocumentNonBlocking(doc(firestore, 'students', user.uid), {
            currentStreak: newStreak,
            lastLoginDate: todayStr
        });
    }
  }, [user, studentProfile, firestore]);

  const courses = useMemo(() => {
    if (!studentProfile && !isAdmin) return [];
    
    const a1Progress = studentProfile?.progress?.['progress_kids_a1'] || 0;
    const a2Progress = studentProfile?.progress?.['progress_kids_a2'] || 0;
    const b1Progress = studentProfile?.progress?.['progress_kids_b1'] || 0;
    
    return [
      { 
          title: "Curso Intro Niños", 
          description: "Comienza tu aventura aprendiendo lo básico.",
          href: "/kids/intro", 
          progress: introProgress, 
          locked: false,
          icon: Star 
      },
      { 
          title: "Curso A1 - Niños", 
          description: "Aprende presente, pasado y futuro.",
          href: "/kids/a1", 
          progress: a1Progress,
          locked: isAdmin ? false : (introProgress < 100),
          icon: BookOpen 
      },
      { 
          title: "Curso A2 - Niños", 
          description: "Domina temas más avanzados.",
          href: "/kids/a2", 
          progress: a2Progress,
          locked: isAdmin ? false : (a1Progress < 100),
          icon: Gamepad2
      },
      { 
        title: "Curso B1 - Niños", 
        description: "Nuevas aventuras y desafíos te esperan.",
        href: "/kids/b1", 
        progress: b1Progress,
        locked: false,
        icon: Rocket
    },
    ];
  }, [t, studentProfile, isAdmin, introProgress]);

  const introCourse = useMemo(() => courses.find(c => c.href === "/kids/intro"), [courses]);
  const otherCourses = useMemo(() => courses.filter(c => c.href !== "/kids/intro"), [courses]);

  if (isUserLoading || isProfileLoading || isRedirecting) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="kids-page-container flex w-full flex-col min-h-screen">
      <DashboardHeader />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center rounded-lg bg-gray-800/50 backdrop-blur-sm p-4">
                <div>
                    <h1 className="text-3xl font-bold text-cyan-400">WELCOME TO THE ZONE, {studentProfile?.name?.split(' ')[0] || 'Player'}!</h1>
                    <p className="text-gray-400">Ready for your next challenge?</p>
                </div>
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-4 border-purple-500">
                        <AvatarImage src={user?.photoURL || vrGamerAvatar?.imageUrl} alt={studentProfile?.name || 'Player'} />
                        <AvatarFallback>{studentProfile?.name?.[0] || 'P'}</AvatarFallback>
                    </Avatar>
                </div>
            </div>

            {/* --- DESKTOP VIEW --- */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-8">
                {/* Quick Missions */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-xl font-bold text-cyan-400/90 uppercase tracking-wider">Quick Missions</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <NeonCard icon={CaseSensitive} title="VOCABULARY" href="https://www.youtube.com/watch?v=tmORJDin_10" />
                        <div onClick={canPlayIntroGames ? undefined : handleLockedGamesClick}>
                           <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <div className={cn(!canPlayIntroGames && "cursor-not-allowed")}>
                                       <NeonCard icon={Gamepad2} title="Juegos" href={canPlayIntroGames ? undefined : '#'} />
                                    </div>
                                </DropdownMenuTrigger>
                                {canPlayIntroGames && (
                                    <DropdownMenuContent>
                                        <DropdownMenuItem asChild>
                                            <Link href="/memory-game">Memoria</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/tetris">Tetris</Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                )}
                            </DropdownMenu>
                        </div>
                        <NeonCard icon={Ear} title="LISTENING" href="/listening-practice" />
                        <NeonCard icon={BookOpen} title="READING" href="/reading-exercise" />
                        <NeonCard icon={Music} title="Music" href="https://www.youtube.com/watch?v=rFSVwmKzCAQ&list=RDrFSVwmKzCAQ&start_radio=1&t=17s" />
                        <Card className="bg-gray-800/50 border-2 border-purple-500/50 rounded-2xl text-center p-4 transition-all hover:bg-purple-500/20 hover:border-purple-400 hover:shadow-[0_0_15px_theme(colors.purple.500)] aspect-square flex flex-col justify-center items-center">
                            {(studentProfile?.currentStreak || 0) > 1 ? (
                                <div className="h-12 w-12 mx-auto flex items-center justify-center">
                                    <span className="text-4xl font-bold text-cyan-400">{studentProfile?.currentStreak}</span>
                                </div>
                            ) : (
                                <Flame className="h-12 w-12 mx-auto text-cyan-400" />
                            )}
                            <p className="mt-2 font-bold text-white">DAILY STREAK</p>
                        </Card>
                    </div>
                </div>

                {/* Learning Adventure */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-cyan-400/90 uppercase tracking-wider">The Learning Adventure</h2>
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
                  <h2 className="text-xl font-bold text-cyan-400/90 uppercase tracking-wider mb-4">The Learning Adventure</h2>
                  <AdventureCard {...introCourse} />
                </div>
              )}
              
              {/* 2. Quick Missions */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-cyan-400/90 uppercase tracking-wider">Quick Missions</h2>
                <div className="grid grid-cols-3 gap-4">
                    <NeonCard icon={CaseSensitive} title="VOCABULARY" href="https://www.youtube.com/watch?v=tmORJDin_10" />
                    <div onClick={canPlayIntroGames ? undefined : handleLockedGamesClick}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className={cn(!canPlayIntroGames && "cursor-not-allowed")}>
                                    <NeonCard icon={Gamepad2} title="Juegos" href={canPlayIntroGames ? undefined : '#'} />
                                </div>
                            </DropdownMenuTrigger>
                            {canPlayIntroGames && (
                                <DropdownMenuContent>
                                    <DropdownMenuItem asChild>
                                        <Link href="/memory-game">Memoria</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/tetris">Tetris</Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            )}
                        </DropdownMenu>
                    </div>
                    <NeonCard icon={Ear} title="LISTENING" href="/listening-practice" />
                    <NeonCard icon={BookOpen} title="READING" href="/reading-exercise" />
                    <NeonCard icon={Music} title="Music" href="https://www.youtube.com/watch?v=rFSVwmKzCAQ&list=RDrFSVwmKzCAQ&start_radio=1&t=17s" />
                     <Card className="bg-gray-800/50 border-2 border-purple-500/50 rounded-2xl text-center p-4 transition-all hover:bg-purple-500/20 hover:border-purple-400 hover:shadow-[0_0_15px_theme(colors.purple.500)] aspect-square flex flex-col justify-center items-center">
                        {(studentProfile?.currentStreak || 0) > 1 ? (
                            <div className="h-12 w-12 mx-auto flex items-center justify-center">
                                <span className="text-4xl font-bold text-cyan-400">{studentProfile?.currentStreak}</span>
                            </div>
                        ) : (
                            <Flame className="h-12 w-12 mx-auto text-cyan-400" />
                        )}
                        <p className="mt-2 font-bold text-white">DAILY STREAK</p>
                    </Card>
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
