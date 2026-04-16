'use client';

import React, { useState, useEffect, useMemo } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { MazeGame } from "@/components/dashboard/maze-game";
import { getB1UnitPath, PathItem } from "@/lib/course-data";
import { useTranslation } from "@/context/language-context";
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Puzzle } from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function B1UnitPage() {
  const { t } = useTranslation();
  const params = useParams();
  const unitId = params.unitId as string;

  const { user } = useUser();
  const firestore = useFirestore();
  const studentDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'students', user.uid) : null),
    [firestore, user]
  );
  const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: 'admin' | 'student', progress?: Record<string, number>}>(studentDocRef);

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
        const initialPath = getB1UnitPath(unitId, t);
        
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
    if (isProfileLoading) return;
    if (studentDocRef && unitId) {
        updateDocumentNonBlocking(studentDocRef, {
            [`progress.progress_b1_unit_${unitId}`]: unitProgress
        });
        window.dispatchEvent(new CustomEvent('progressUpdated'));
    }
  }, [unitProgress, unitId, studentDocRef, isProfileLoading]);

  return (
    <div className="flex w-full flex-col">
      <DashboardHeader />
      <main className="flex flex-1 flex-col items-center gap-8 p-4 md:py-12">
        <div className="text-center">
            <h1 className="text-4xl font-bold text-brand-purple dark:text-primary [text-shadow:1px_1px_1.5px_hsl(var(--accent)/0.8)]">{isClient ? t('b1course.unitTitle', { unit: unitId }) : ''}</h1>
            <Link href="/ingles/b1" className="text-sm text-muted-foreground hover:underline mt-2 inline-block">
                &larr; {isClient ? t('b1course.backToB1') : ''}
            </Link>
        </div>
        <div className="w-full max-w-7xl">
            <MazeGame 
                pathItems={pathItems} 
                title={isClient ? t('b1course.unitPath') : ''} 
                description={isClient ? t('b1course.unitPathDescription') : ''}
                isLoading={!isClient || isProfileLoading}
            />
        </div>
         <Card className="w-full max-w-7xl shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Puzzle />
                    {isClient ? t('b1course.practiceTitle') : ''}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-center mb-6">{isClient ? t('b1course.practiceDescription') : ''}</p>
                <div className="flex items-center justify-center gap-4 md:gap-8 p-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 font-bold text-xl cursor-pointer hover:bg-muted/50 transition-colors">1</div>
                    <div className="flex-1 border-t-2 border-dashed border-border"></div>
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 font-bold text-xl cursor-pointer hover:bg-muted/50 transition-colors">2</div>
                    <div className="flex-1 border-t-2 border-dashed border-border"></div>
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 font-bold text-xl cursor-pointer hover:bg-muted/50 transition-colors">3</div>
                    <div className="flex-1 border-t-2 border-dashed border-border"></div>
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 font-bold text-xl cursor-pointer hover:bg-muted/50 transition-colors">4</div>
                    <div className="flex-1 border-t-2 border-dashed border-border"></div>
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 font-bold text-xl cursor-pointer hover:bg-muted/50 transition-colors">5</div>
                </div>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
