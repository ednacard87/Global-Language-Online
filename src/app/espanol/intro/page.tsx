
'use client';

import React, { useState, useEffect, useMemo } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { MazeGame } from "@/components/dashboard/maze-game";
import { espanolIntroPathData, PathItem } from "@/lib/course-data";
import { useTranslation } from "@/context/language-context";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import Link from 'next/link';

export default function EspanolIntroPage() {
  const { t } = useTranslation();
  const [pathItems, setPathItems] = useState<PathItem[]>([]);

  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const studentDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'students', user.uid) : null),
    [firestore, user]
  );
  const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: 'admin' | 'student', progress?: Record<string, number>, unlockedQuizzes?: { quiz1?: boolean, quiz2?: boolean, finalQuiz?: boolean} }>(studentDocRef);

  const isAdmin = useMemo(() => {
      if (!user) return false;
      return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
  }, [user, studentProfile]);
  
  useEffect(() => {
    if (isProfileLoading || isUserLoading) return;

    const updatePath = () => {
        const initialPath = espanolIntroPathData.map(i => ({...i}));

        const itemsWithProgress = initialPath.map(item => {
            const newItem = { ...item };
            if (item.storageKey && studentProfile?.progress) {
                newItem.progress = studentProfile.progress[item.storageKey] || 0;
            } else {
                newItem.progress = 0;
            }
            return newItem;
        });

        const itemsWithLockState = itemsWithProgress.map((item, index, arr) => {
            if (isAdmin) {
                return { ...item, locked: false };
            }

            // Inicio siempre desbloqueado
            if (item.type === 'start') {
                return { ...item, locked: false };
            }

            // Intro 1E (primer item después de start) siempre desbloqueado
            if (index === 1) {
                return { ...item, locked: false };
            }

            const previousItem = arr[index - 1];
            let isLocked = true;

            // Lógica secuencial
            if (previousItem.type === 'start') {
                isLocked = false;
            } else if (previousItem.label.includes('quiz') || previousItem.label.includes('Quiz')) {
                // Si el anterior es un Quiz, desbloquea el siguiente si sacó >= 70
                isLocked = (previousItem.progress ?? 0) < 70;
            } else {
                // Si el anterior es una clase, desbloquea el siguiente si terminó (100%)
                isLocked = (previousItem.progress ?? 0) < 100;
            }

            // Desbloqueos manuales por admin
            if (item.label === 'espanolIntroCourse.quiz1' && studentProfile?.unlockedQuizzes?.quiz1) isLocked = false;
            if (item.label === 'espanolIntroCourse.quiz2' && studentProfile?.unlockedQuizzes?.quiz2) isLocked = false;
            if (item.label === 'espanolIntroCourse.finalTest' && studentProfile?.unlockedQuizzes?.finalQuiz) isLocked = false;

            return { ...item, locked: isLocked };
        });

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
  }, [t, isAdmin, studentProfile, isProfileLoading, isUserLoading]);


  return (
    <div className="flex w-full flex-col espanol-dashboard-bg min-h-screen">
      <DashboardHeader />
      <main className="flex flex-1 flex-col items-center gap-8 p-4 md:py-12">
        <div className="text-center">
            <h1 className="text-4xl font-bold text-brand-purple dark:text-primary [text-shadow:1px_1px_1.5px_hsl(var(--accent)/0.8)]">Curso Intro Español</h1>
            <Link href="/espanol" className="text-sm text-muted-foreground hover:underline mt-2 inline-block">
                &larr; Volver a Español
            </Link>
        </div>
        <div className="w-full max-w-3xl">
            <MazeGame 
                pathItems={pathItems} 
                title={t('espanolIntroCourse.mazeTitle')} 
                description={t('dashboard.learningPathDescription')}
                isLoading={isProfileLoading}
            />
        </div>
      </main>
    </div>
  );
}
