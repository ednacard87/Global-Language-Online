'use client';

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { doc, collection, query, where } from 'firebase/firestore';
import {
  BookOpen,
  Clock,
  Flame,
  Star,
  Lock,
  Mic,
  Music,
  Video,
  Newspaper,
  Pencil,
  Gamepad2,
  CheckCircle,
  Tv,
  CaseSensitive,
  FileText,
} from "lucide-react";
import { startOfWeek } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { DashboardHeader } from "@/components/dashboard/header";
import { StudyCalendar } from "@/components/dashboard/study-calendar";
import { A1Icon, A2Icon, B1Icon, B2Icon } from "@/components/icons";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { useTranslation } from "@/context/language-context";
import { useToast } from "@/hooks/use-toast";
import { introPathItemsData } from "@/lib/course-data";
import LandingPage from "./landing/page";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useRouter } from "next/navigation";

const NeonCard = ({ icon: Icon, title, href, children }: { icon: React.ElementType, title: string, href?: string, children?: React.ReactNode }) => {
    const isExternal = href && href.startsWith('http');
    const content = (
        <Card className="bg-card/80 border-2 border-primary/50 rounded-2xl text-center p-4 transition-all hover:bg-primary/10 hover:border-primary hover:shadow-lg hover:shadow-primary/20 aspect-square flex flex-col justify-center items-center">
            <Icon className="h-10 w-10 mx-auto text-primary" />
            <p className="mt-2 text-sm font-bold uppercase">{title}</p>
        </Card>
    );

    if (href) {
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
    return <>{children || content}</>;
};

const AdventureCard = ({ title, description, href, progress, locked, icon: Icon, animated }: { title: string, description: string, href: string, progress?: number, locked?: boolean, icon: React.ElementType, animated?: boolean }) => (
    <Link href={locked ? '#' : href} className={cn("block", locked && "cursor-not-allowed")}>
        <Card className={cn(
            "bg-card border-2 border-primary/50 p-4 transition-all",
            locked ? "opacity-50" : "hover:bg-primary/10 hover:border-primary hover:shadow-lg hover:shadow-primary/20",
            animated && "animate-pulse-glow"
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

interface Student {
  id: string;
  name: string;
  email: string;
  dateJoined: string;
  profileImageUrl?: string;
  lastLoginDate?: string;
  currentStreak?: number;
  role?: 'admin' | 'student';
  selectedCourse?: 'ingles' | 'espanol' | 'kids';
  unlockedCourses?: string[];
  progress?: Record<string, number>;
  lessonProgress?: any;
}

const initialActiveCourses = [
  {
    name: "dashboard.introductoryCourse",
    description: "Comienza tu aventura aprendiendo lo básico.",
    icon: Star,
    href: "/intro",
  },
  {
    name: "dashboard.courseA1",
    description: "Aprende Presente, entender y hablar un poco",
    icon: A1Icon,
    href: "/ingles/a1",
  },
  {
    name: "dashboard.courseA2",
    description: "Aprende hablar de experiencias en pasado",
    icon: A2Icon,
    href: "/ingles/a2",
  },
  {
    name: "dashboard.courseB1",
    description: "Domina Temas avanzado, Perfecciona tu fluidez y Comprension.",
    icon: B1Icon,
    href: "/ingles/b1",
  },
  {
    name: "dashboard.courseB2",
    description: "Alcanza un nivel avanzado y profesional.",
    icon: B2Icon,
    href: "/ingles/b2",
  },
];

const courseClassCounts = {
    a1: 15,
    a2: 20,
    b1: 20,
    b2: 20,
};

function calculateIntroCourseProgress(progress: Record<string, number> | undefined) {
    if (!progress) return 0;
    const courseItemsWithPoints = introPathItemsData.filter(item => item.points && item.points > 0);
    const totalPossiblePoints = courseItemsWithPoints.reduce((sum, item) => sum + (item.points || 0), 0);
    
    if (totalPossiblePoints === 0) return 0;

    const earnedPoints = courseItemsWithPoints.reduce((sum, item) => {
        if (item.storageKey && progress[item.storageKey]) {
            const itemProgress = progress[item.storageKey] || 0;
            return sum + (itemProgress / 100) * (item.points || 0);
        }
        return sum;
    }, 0);
    
    // The points are configured to sum up to 100, so earnedPoints is the percentage.
    return Math.round(earnedPoints);
};


function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  
  const [courses, setCourses] = useState<any[]>([]);
  const [isRedirecting, setIsRedirecting] = useState(true);


  const studentDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'students', user.uid) : null),
    [firestore, user]
  );
  const { data: studentProfile, isLoading: isProfileLoading } = useDoc<Student>(studentDocRef);

  const isAdmin = useMemo(() => {
    if (!user || !studentProfile) return false;
    return studentProfile.role === 'admin' || user.email === 'ednacard87@gmail.com';
  }, [user, studentProfile]);

  const [introProgress, setIntroProgress] = React.useState(0);

  const calculateIntroProgress = React.useCallback(() => {
    if (!user || !studentProfile) {
      setIntroProgress(0);
      return;
    }
    const courseItemsWithPoints = introPathItemsData.filter(item => item.points && item.points > 0);
    const totalPossiblePoints = courseItemsWithPoints.reduce((sum, item) => sum + (item.points || 0), 0);
    if (totalPossiblePoints > 0 && studentProfile?.progress) {
        const earnedPoints = courseItemsWithPoints.reduce((sum, item) => {
            if (item.storageKey && studentProfile.progress) {
                const itemProgress = studentProfile.progress[item.storageKey] || 0;
                return sum + (itemProgress / 100) * (item.points || 0);
            }
            return sum;
        }, 0);
        setIntroProgress(Math.round(earnedPoints));
    } else {
        setIntroProgress(0);
    }
  }, [user, studentProfile]);
  
  useEffect(() => {
    calculateIntroProgress();
    window.addEventListener('storage', calculateIntroProgress);
    window.addEventListener('progressUpdated', calculateIntroProgress);
    return () => {
      window.removeEventListener('storage', calculateIntroProgress);
      window.removeEventListener('progressUpdated', calculateIntroProgress);
    };
  }, [calculateIntroProgress]);
  
  useEffect(() => {
    if (isUserLoading || isProfileLoading) return;

    if (!studentProfile) {
      setIsRedirecting(false);
      return;
    }

    if (!isAdmin && !studentProfile.selectedCourse) {
      router.push('/select-course');
      return;
    }

    if (isAdmin) {
      setIsRedirecting(false);
      return;
    }

    if (studentProfile.selectedCourse && studentProfile.selectedCourse !== 'ingles') {
      router.push(`/${studentProfile.selectedCourse}`);
    } else {
      setIsRedirecting(false);
    }
  }, [studentProfile, isUserLoading, isProfileLoading, isAdmin, router]);

  const canPlayIntroGames = introProgress >= 30 || isAdmin;

  const handleLockedGamesClick = () => {
    toast({
        title: 'Juegos Bloqueados',
        description: t('dashboard.unlockGames'),
        variant: "default",
    });
  };

  const studySessionsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    return query(
        collection(firestore, 'students', user.uid, 'studySessions'),
        where('startTime', '>=', weekStart.toISOString())
    );
  }, [user, firestore]);

  const { data: studySessions } = useCollection<{ startTime: string; durationMinutes: number }>(studySessionsQuery);

  const totalStudyHoursThisWeek = useMemo(() => {
      if (!studySessions) return 0;
      const totalMinutes = studySessions.reduce((sum, session) => sum + session.durationMinutes, 0);
      return Math.round((totalMinutes / 60) * 10) / 10;
  }, [studySessions]);

  const vrGamerAvatar = PlaceHolderImages.find(p => p.id === 'vr-gamer-avatar');
  
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

  useEffect(() => {
    const updateCourseData = () => {
      if (user && studentProfile) {
        const translatedCourses = initialActiveCourses.map(course => {
            const courseCode = course.href.replace('/ingles/', '');
            let isLocked = false;
            
            if (course.href !== "/intro" && !isAdmin) {
                isLocked = !studentProfile.unlockedCourses?.includes(courseCode);
            }

            let finalProgress = 0;
            if (!isLocked && studentProfile.progress) {
                 if (course.href === "/intro") {
                    finalProgress = calculateIntroCourseProgress(studentProfile.progress);
                } else if (courseCode in courseClassCounts) {
                    const classCount = courseClassCounts[courseCode as keyof typeof courseClassCounts];
                    let totalClassProgress = 0;
                    for (let i = 1; i <= classCount; i++) {
                        totalClassProgress += studentProfile.progress[`progress_${courseCode}_${i}`] || 0;
                    }
                    finalProgress = classCount > 0 ? Math.round(totalClassProgress / classCount) : 0;
                }
            }

            return {
              ...course,
              title: course.href === "/intro" ? "INTRODUCTORY COURSE" : t(course.name),
              description: course.description,
              progress: finalProgress,
              locked: isLocked
            };
        });
        setCourses(translatedCourses);
      } else {
         setCourses(initialActiveCourses.map(c => ({...c, title: t(c.name), description: c.description, progress: 0, locked: c.href !== '/intro' })));
      }
    };
    
    updateCourseData();
    window.addEventListener('progressUpdated', updateCourseData);
    
    return () => {
      window.removeEventListener('progressUpdated', updateCourseData);
    };
  }, [user, t, isAdmin, studentProfile]);

  const introCourse = useMemo(() => courses.find(c => c.href === "/intro"), [courses]);
  const otherCourses = useMemo(() => courses.filter(c => c.href !== "/intro"), [courses]);


  if (isUserLoading || isRedirecting) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex w-full flex-col ingles-dashboard-bg min-h-screen">
      <DashboardHeader />
       <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="hidden lg:grid grid-cols-1">
              <div className="flex justify-between items-center rounded-lg bg-card/80 backdrop-blur-sm border-2 border-brand-purple p-4">
                  <div>
                      <h1 className="text-3xl font-bold text-primary">WELCOME, {studentProfile?.name?.split(' ')[0] || 'Student'}!</h1>
                      <p className="text-muted-foreground">Ready for your next challenge?</p>
                  </div>
                  <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border-4 border-primary">
                          <AvatarImage src={user?.photoURL || vrGamerAvatar?.imageUrl} alt={studentProfile?.name || 'Student'} />
                          <AvatarFallback>{studentProfile?.name?.[0] || 'S'}</AvatarFallback>
                      </Avatar>
                  </div>
              </div>
            </div>

            {/* --- DESKTOP VIEW --- */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-xl font-bold text-primary uppercase tracking-wider">Habilidades Rápidas</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <NeonCard icon={BookOpen} title="LECTURA" href="/reading-exercise" />
                        <NeonCard icon={Pencil} title="ESCRITURA" href="/writing-exercise"/>
                        <NeonCard icon={Mic} title="PODCAST" href="https://youtu.be/bdpyQm5l78o?si=CZz43xsGxDaF6k2S"/>
                        <NeonCard icon={Newspaper} title="NEWS" href="https://www.youtube.com/watch?v=Ap-UM1O9RBU"/>
                        <NeonCard icon={Music} title="SONG" href="https://es.lyricstraining.com/sign_up" />
                        <NeonCard icon={FileText} title="DOCUMENTARY" href="https://www.youtube.com/watch?v=KpuIyXzv0G4&t=15s" />
                        <NeonCard icon={Music} title="MUSIC" href="https://www.youtube.com/watch?v=57B3YNufv8o&list=RD57B3YNufv8o&start_radio=1" />
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
                        <NeonCard icon={CaseSensitive} title="VOCABULARY" href="https://quizlet.com/co" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Racha</CardTitle>
                                <Flame className={`h-5 w-5 text-brand-purple`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{studentProfile?.currentStreak || 0}</div>
                                <p className="text-xs text-muted-foreground">{t("dashboard.daysInARow")}</p>
                            </CardContent>
                        </Card>
                         <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.studyHours")}</CardTitle>
                                <Clock className={`h-5 w-5 text-brand-blue`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{totalStudyHoursThisWeek}</div>
                                <p className="text-xs text-muted-foreground">{t("dashboard.thisWeek", { hours: totalStudyHoursThisWeek })}</p>
                            </CardContent>
                        </Card>
                    </div>
                    <StudyCalendar />
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-primary uppercase tracking-wider">THE LEARNING ADVENTURE</h2>
                    <div className="space-y-3">
                        {courses.map((course, index) => (
                            <AdventureCard key={index} {...course} animated={course.href === '/intro'}/>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- MOBILE VIEW --- */}
            <div className="lg:hidden flex flex-col space-y-8">
              {/* 1. Saludo */}
              <div className="flex justify-between items-center rounded-lg bg-card/80 backdrop-blur-sm border-2 border-brand-purple p-4">
                  <div>
                      <h1 className="text-2xl font-bold text-primary">WELCOME, {studentProfile?.name?.split(' ')[0] || 'Student'}!</h1>
                      <p className="text-muted-foreground text-sm">Ready for your next challenge?</p>
                  </div>
                  <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-4 border-primary">
                          <AvatarImage src={user?.photoURL || vrGamerAvatar?.imageUrl} alt={studentProfile?.name || 'Student'} />
                          <AvatarFallback>{studentProfile?.name?.[0] || 'S'}</AvatarFallback>
                      </Avatar>
                  </div>
              </div>
              
              {/* 2. Intro Course */}
              {introCourse && (
                <div>
                  <h2 className="text-xl font-bold text-primary uppercase tracking-wider mb-4">THE LEARNING ADVENTURE</h2>
                  <AdventureCard {...introCourse} animated />
                </div>
              )}
              
              {/* 3. Quick Skills */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-primary uppercase tracking-wider">Habilidades Rápidas</h2>
                <div className="grid grid-cols-3 gap-4">
                    <NeonCard icon={BookOpen} title="LECTURA" href="/reading-exercise" />
                    <NeonCard icon={Pencil} title="ESCRITURA" href="/writing-exercise"/>
                    <NeonCard icon={Mic} title="PODCAST" href="https://www.youtube.com/watch?v=bdpyQm5l78o"/>
                    <NeonCard icon={Newspaper} title="NEWS" href="https://www.youtube.com/watch?v=Ap-UM1O9RBU"/>
                    <NeonCard icon={Music} title="SONG" href="https://es.lyricstraining.com/sign_up" />
                    <NeonCard icon={FileText} title="DOCUMENTARY" href="https://www.youtube.com/watch?v=KpuIyXzv0G4&t=15s" />
                    <NeonCard icon={Music} title="MUSIC" href="https://www.youtube.com/watch?v=57B3YNufv8o&list=RD57B3YNufv8o&start_radio=1" />
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
                    <NeonCard icon={CaseSensitive} title="VOCABULARY" href="https://quizlet.com/co" />
                </div>
              </div>
              
              {/* 4. Other Courses */}
              <div className="space-y-3">
                {otherCourses.map((course, index) => (
                  <AdventureCard key={index} {...course} />
                ))}
              </div>

              {/* 5. Streak and Hours */}
              <div className="grid grid-cols-2 gap-4">
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Racha</CardTitle>
                            <Flame className={`h-5 w-5 text-brand-purple`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{studentProfile?.currentStreak || 0}</div>
                            <p className="text-xs text-muted-foreground">{t("dashboard.daysInARow")}</p>
                        </CardContent>
                    </Card>
                     <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.studyHours")}</CardTitle>
                            <Clock className={`h-5 w-5 text-brand-blue`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{totalStudyHoursThisWeek}</div>
                            <p className="text-xs text-muted-foreground">{t("dashboard.thisWeek", { hours: totalStudyHoursThisWeek })}</p>
                        </CardContent>
                    </Card>
                </div>
              
              {/* 6. Study Calendar */}
              <StudyCalendar />

            </div>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
    const { user, isUserLoading } = useUser();

    if (isUserLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return <LandingPage />;
    }

    return <DashboardPage />;
}
