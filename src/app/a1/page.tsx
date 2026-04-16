'use client';

import React, { useState, useEffect, useMemo } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { MazeGame } from "@/components/dashboard/maze-game";
import { getA1MainPath, PathItem } from "@/lib/course-data";
import { useTranslation } from "@/context/language-context";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function A1CoursePage() {
  const { t } = useTranslation();
  const [pathItems, setPathItems] = useState<PathItem[]>([]);
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

  useEffect(() => {
    if (isProfileLoading) return;

    const initialPath = getA1MainPath(t);

    const itemsWithProgress = initialPath.map(item => {
        const newItem = { ...item };
        if (item.storageKey && studentProfile?.progress) {
            newItem.progress = studentProfile.progress[item.storageKey] || 0;
        }
        return newItem;
    });

    const itemsWithLockState = itemsWithProgress.map((item, index, arr) => {
        if (isAdmin) {
            return { ...item, locked: false };
        }
        if (index === 0) { // Start is always unlocked
            return { ...item, locked: false };
        }
        const previousItem = arr[index - 1];
        
        // A simple sequential unlock based on 100% progress of the previous item.
        const isLocked = (previousItem.progress ?? 0) < 100;
        return { ...item, locked: isLocked };
    });

    itemsWithLockState.forEach(item => item.className = '');

    const nextActiveItem = itemsWithLockState.find(item => !item.locked && (item.progress ?? 0) < 100 && (item.type === 'class' || item.type === 'practice'));
    if(nextActiveItem) {
      nextActiveItem.className = 'animate-pulse-glow';
    }

    setPathItems(itemsWithLockState);
    
  }, [t, isAdmin, studentProfile, isProfileLoading]);

  return (
    <div className="flex w-full flex-col espanol-dashboard-bg min-h-screen">
      <DashboardHeader />
      <main className="flex flex-1 flex-col items-center gap-8 p-4 md:py-12">
        <div className="text-center">
            <h1 className="text-4xl font-bold text-brand-purple dark:text-primary [text-shadow:1px_1px_1.5px_hsl(var(--accent)/0.8)]">{t('a1course.title')}</h1>
        </div>
        <div className="w-full max-w-7xl">
            <MazeGame 
                pathItems={pathItems} 
                title={t('dashboard.learningPath')} 
                description={t('dashboard.learningPathDescription')}
                isLoading={isProfileLoading}
            />
        </div>
      </main>
    </div>
  );
}
