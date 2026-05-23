'use client';

import React, { useState, useEffect, useMemo } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { MazeGame } from "@/components/dashboard/maze-game";
import { getB1MainPath, PathItem } from "@/lib/course-data";
import { useTranslation } from "@/context/language-context";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function B1CoursePage() {
  const { t } = useTranslation();
  const [pathItems, setPathItems] = useState<PathItem[]>([]);

  const { user } = useUser();
  const firestore = useFirestore();
  const studentDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'students', user.uid) : null),
    [firestore, user]
  );
  const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: 'admin' | 'student', progress?: Record<string, number>, unlockedUnits?: string[]}>(studentDocRef);

  const isAdmin = useMemo(() => {
      if (!user) return false;
      return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
  }, [user, studentProfile]);
  
  useEffect(() => {
    if (isProfileLoading) return;
    
    const updatePath = () => {
        const initialPath = getB1MainPath(t);

        const progressTed = studentProfile?.progress?.['progress_b1_ted_talks_0'] || 0;
        const progressU1 = studentProfile?.progress?.['progress_b1_unit_1'] || 0;
        const progressU2 = studentProfile?.progress?.['progress_b1_unit_2'] || 0;
        const progressU3 = studentProfile?.progress?.['progress_b1_unit_3'] || 0;
        const progressU4 = studentProfile?.progress?.['progress_b1_unit_4'] || 0;

        const itemsWithLockState = initialPath.map((item, index) => {
            const newItem: PathItem = {...item, locked: true};
            if (item.storageKey && studentProfile?.progress) {
                newItem.progress = studentProfile.progress[item.storageKey] || 0;
            }

            if (isAdmin) {
              newItem.locked = false;
              return newItem;
            }

            // Check manual unit unlock from admin
            if (item.href?.includes('/unit/')) {
                const unitNum = item.href.split('/').pop();
                const unitKey = `b1-unit-${unitNum}`;
                if (studentProfile?.unlockedUnits?.includes(unitKey)) {
                    newItem.locked = false;
                    return newItem;
                }
            }

            if (index === 0) {
                newItem.locked = false; // Start
            } else if (index === 1) {
                newItem.locked = false; // Ted Talks 0
            } else if (index === 2) {
                if (progressTed >= 100) newItem.locked = false; // Unit 1
            } else if (index === 3) {
                if (progressU1 >= 100) newItem.locked = false; // Review 1
            } else if (index === 4) {
                if (progressU1 >= 100) newItem.locked = false; // Test 1
            } else if (index === 5) {
                if (progressU1 >= 100) newItem.locked = false; // Unit 2
            } else if (index === 6) {
                if (progressU2 >= 100) newItem.locked = false; // Review 2
            } else if (index === 7) {
                if (progressU2 >= 100) newItem.locked = false; // Test 2
            } else if (index === 8) {
                if (progressU2 >= 100) newItem.locked = false; // Unit 3
            } else if (index === 9) {
                if (progressU3 >= 100) newItem.locked = false; // Review 3
            } else if (index === 10) {
                if (progressU3 >= 100) newItem.locked = false; // Test 3
            } else if (index === 11) {
                if (progressU3 >= 100) newItem.locked = false; // Unit 4
            } else if (index === 12) {
                if (progressU4 >= 100) newItem.locked = false; // Review 4
            } else if (index === 13) {
                if (progressU4 >= 100) newItem.locked = false; // Final Test
            } else if (index === 14) {
                if (progressU4 >= 100) newItem.locked = false; // Final
            }

            return newItem;
        });
        
        itemsWithLockState.forEach(item => item.className = '');
        const nextActiveItem = itemsWithLockState.find(item => !item.locked && (item.progress ?? 0) < 100 && (item.type === 'class' || item.type === 'practice'));
        if(nextActiveItem) {
          nextActiveItem.className = 'animate-pulse-glow';
        }

        setPathItems(itemsWithLockState);
    }
    
    updatePath();
    
    window.addEventListener('focus', updatePath);
    window.addEventListener('progressUpdated', updatePath);
    
    return () => {
      window.removeEventListener('focus', updatePath);
      window.removeEventListener('progressUpdated', updatePath);
    };
  }, [t, isAdmin, studentProfile, isProfileLoading]);

  return (
    <div className="flex w-full flex-col ingles-dashboard-bg min-h-screen">
      <DashboardHeader />
      <main className="flex flex-1 flex-col items-center gap-8 p-4 md:py-12">
        <div className="text-center">
            <h1 className="text-4xl font-bold text-brand-purple dark:text-primary [text-shadow:1px_1px_1.5px_hsl(var(--accent)/0.8)]">{t('dashboard.courseB1')}</h1>
        </div>
        <div className="w-full max-w-5xl">
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