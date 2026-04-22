'use client';

import React, { useState, useEffect, useMemo } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { MazeGame } from "@/components/dashboard/maze-game";
import { getA1EngUnitPath, PathItem } from "@/lib/course-data";
import { useTranslation } from "@/context/language-context";
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Puzzle, Lock as LockIcon } from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function A1EngUnitPage() {
  const { t } = useTranslation();
  const params = useParams();
  const unitId = params.unitId as string;
  const { toast } = useToast();

  const { user } = useUser();
  const firestore = useFirestore();
  const studentDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'students', user.uid) : null),
    [firestore, user]
  );
  const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: 'admin' | 'student', progress?: Record<string, number>, unlockedClasses?: string[]}>(studentDocRef);

  const isAdmin = useMemo(() => {
      if (!user) return false;
      return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
  }, [user, studentProfile]);

  const [pathItems, setPathItems] = useState<PathItem[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !unitId || isProfileLoading) return;

    const updatePath = () => {
        const initialPath = getA1EngUnitPath(unitId, t);
        
        const updatedItems = initialPath.map(item => {
          if (item.storageKey && studentProfile?.progress) {
            const itemProgress = studentProfile.progress[item.storageKey] || 0;
            return { ...item, progress: itemProgress };
          }
          return item;
        });
  
        const itemsWithLockState = updatedItems.reduce((acc, item, index) => {
            if (isAdmin) {
                acc.push({ ...item, locked: false });
                return acc;
            }
            
            if (item.href && item.href !== '#') {
                const classId = `a1-${item.href.split('/').pop()}`;
                if (studentProfile?.unlockedClasses?.includes(classId)) {
                    acc.push({ ...item, locked: false });
                    return acc;
                }
            }
            
            if (index === 0) {
                acc.push({ ...item, locked: false });
                return acc;
            }

            const prevItem = acc[index - 1];
            let isLocked = true;

            if (prevItem.locked) {
                isLocked = true;
            } else {
                if (prevItem.storageKey) {
                    isLocked = (prevItem.progress ?? 0) < 100;
                } else {
                    isLocked = false;
                }
            }

            acc.push({ ...item, locked: isLocked });
            return acc;
        }, [] as PathItem[]);


        itemsWithLockState.forEach(item => item.className = '');
        const nextActiveItem = itemsWithLockState.find(item => !item.locked && (item.progress ?? 0) < 100 && (item.type === 'class' || item.type === 'practice'));
        if(nextActiveItem) {
          nextActiveItem.className = 'animate-pulse-glow';
        }

        setPathItems(itemsWithLockState);
    }
    
    updatePath();

    window.addEventListener('progressUpdated', updatePath);
    
    return () => {
      window.removeEventListener('progressUpdated', updatePath);
    };
  }, [t, unitId, isClient, isAdmin, studentProfile, isProfileLoading]);

  const unitProgress = useMemo(() => {
    const classItems = pathItems.filter(item => item.type === 'class');
    if (!classItems.length) return 100;
    const totalProgress = classItems.reduce((sum, item) => sum + (item.progress ?? 0), 0);
    return Math.round(totalProgress / classItems.length);
  }, [pathItems]);

  useEffect(() => {
    if (studentDocRef && unitId) {
        updateDocumentNonBlocking(studentDocRef, {
            [`progress.progress_a1_eng_unit_${unitId}`]: unitProgress
        });
        window.dispatchEvent(new CustomEvent('progressUpdated'));
    }
  }, [unitProgress, unitId, studentDocRef]);

  const practiceLocks = useMemo(() => {
    if (isAdmin) {
      return { 1: false, 2: false, 3: false, 4: false };
    }
    const progress = studentProfile?.progress || {};
    return {
      1: (progress['progress_a1_eng_unit_1_class_1'] ?? 0) < 100,
      2: (progress['progress_a1_eng_unit_1_class_3'] ?? 0) < 100,
      3: (progress['progress_a1_eng_unit_1_class_4'] ?? 0) < 100,
      4: (progress['progress_a1_eng_unit_1_class_5'] ?? 0) < 100,
    };
  }, [isAdmin, studentProfile?.progress]);

  const handlePracticeClick = (practiceNumber: number) => {
    const isLocked = practiceLocks[practiceNumber as keyof typeof practiceLocks];
    if (isLocked) {
      let message = '';
      switch (practiceNumber) {
        case 1: message = 'Debes completar la clase 1'; break;
        case 2: message = 'Debes completar la clase 3'; break;
        case 3: message = 'Debes completar la clase 4'; break;
        case 4: message = 'Debes completar la clase 5'; break;
        default: return;
      }
      toast({
        title: 'Práctica Bloqueada',
        description: message,
        variant: 'destructive',
      });
    } else {
      toast({
          title: `Práctica ${practiceNumber} Desbloqueada`,
          description: '¡Buen trabajo! Puedes comenzar la práctica.',
      });
    }
  };

  const PracticeBox = ({ number, isLocked }: { number: number, isLocked: boolean }) => (
    <div 
        onClick={() => handlePracticeClick(number)}
        className={cn(
            "relative flex h-16 w-16 items-center justify-center rounded-lg border-2 font-bold text-xl transition-colors",
            isLocked 
                ? "bg-muted/30 border-dashed text-muted-foreground/50 cursor-not-allowed" 
                : "cursor-pointer hover:bg-muted/50"
        )}
    >
        {isLocked && <LockIcon className="absolute h-6 w-6 text-yellow-500/80" />}
        <span className={cn(isLocked && "opacity-30")}>{number}</span>
    </div>
  );

  return (
    <div className="flex w-full flex-col ingles-dashboard-bg min-h-screen">
      <DashboardHeader />
      <main className="flex flex-1 flex-col items-center gap-8 p-4 md:py-12">
        <div className="text-center">
            <h1 className="text-4xl font-bold text-brand-purple dark:text-primary [text-shadow:1px_1px_1.5px_hsl(var(--accent)/0.8)]">{isClient ? t('b1course.unitTitle', { unit: unitId }) : ''}</h1>
            <Link href="/ingles/a1" className="text-sm text-muted-foreground hover:underline mt-2 inline-block">
                &larr; {isClient ? t('dashboard.courseA1') : ''}
            </Link>
        </div>
        <div className="w-full max-w-7xl">
            <MazeGame 
                pathItems={pathItems} 
                title={isClient ? t('a1course.unitPath') : ''} 
                description={isClient ? t('a1course.unitPathDescription') : ''}
                isLoading={!isClient || isProfileLoading}
            />
        </div>
        {unitId === '1' ? (
             <Card className="w-full max-w-7xl shadow-soft rounded-lg border-2 border-brand-purple">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Puzzle />
                        {isClient ? t('a1course.practiceTitle') : ''}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center mb-6">{isClient ? t('a1course.practiceDescription') : ''}</p>
                    <div className="flex items-center justify-center gap-4 md:gap-8 p-4">
                        <PracticeBox number={1} isLocked={practiceLocks[1]} />
                        <div className="flex-1 border-t-2 border-dashed border-border"></div>
                        <PracticeBox number={2} isLocked={practiceLocks[2]} />
                        <div className="flex-1 border-t-2 border-dashed border-border"></div>
                        <PracticeBox number={3} isLocked={practiceLocks[3]} />
                        <div className="flex-1 border-t-2 border-dashed border-border"></div>
                        <PracticeBox number={4} isLocked={practiceLocks[4]} />
                    </div>
                </CardContent>
            </Card>
        ) : (
             <Card className="w-full max-w-7xl shadow-soft rounded-lg border-2 border-brand-purple">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Puzzle />
                        {isClient ? t('a1course.practiceTitle') : ''}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center mb-6">{isClient ? t('a1course.practiceDescription') : ''}</p>
                    <div className="flex items-center justify-center gap-4 md:gap-8 p-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 font-bold text-xl cursor-pointer hover:bg-muted/50 transition-colors">1</div>
                        <div className="flex-1 border-t-2 border-dashed border-border"></div>
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 font-bold text-xl cursor-pointer hover:bg-muted/50 transition-colors">2</div>
                        <div className="flex-1 border-t-2 border-dashed border-border"></div>
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 font-bold text-xl cursor-pointer hover:bg-muted/50 transition-colors">3</div>
                        <div className="flex-1 border-t-2 border-dashed border-border"></div>
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 font-bold text-xl cursor-pointer hover:bg-muted/50 transition-colors">4</div>
                    </div>
                </CardContent>
            </Card>
        )}
      </main>
    </div>
  );
}
