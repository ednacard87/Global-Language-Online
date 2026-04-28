'use client';

import React, { useState, useEffect, useMemo } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { MazeGame } from "@/components/dashboard/maze-game";
import { introPathItemsData, PathItem, calculateIntroCourseProgress } from "@/lib/course-data";
import { useTranslation } from "@/context/language-context";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Loader2 } from 'lucide-react';

interface StudentProfile {
    role?: 'admin' | 'student';
    progress?: Record<string, number>;
    unlockedQuizzes?: {
        quiz1?: boolean;
        quiz2?: boolean;
        finalQuiz?: boolean;
    };
}

export default function EnglishIntroPage() {
  const { t } = useTranslation();
  const [pathItems, setPathItems] = useState<PathItem[]>([]);
  const guideFishImage = PlaceHolderImages.find(p => p.id === 'guide-fish');

  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const studentDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'students', user.uid) : null),
    [firestore, user]
  );
  const { data: studentProfile, isLoading: isProfileLoading } = useDoc<StudentProfile>(studentDocRef);

  const isAdmin = useMemo(() => {
      if (!user) return false;
      return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
  }, [user, studentProfile]);
  
  useEffect(() => {
    // This effect will run when the studentProfile data is loaded or changes.
    const updatePath = () => {
      if (!studentProfile && !isAdmin) return;

      const initialPath = introPathItemsData.map(i => ({...i}));

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
          const finalItem = { ...item };

          if (isAdmin) {
              finalItem.locked = false;
              return finalItem;
          }

          // Special unlocking for quizzes via admin panel
          if (item.label === 'introCoursePage.quiz1' && studentProfile?.unlockedQuizzes?.quiz1) {
              finalItem.locked = false;
              return finalItem;
          }
          if (item.label === 'introCoursePage.quiz2' && studentProfile?.unlockedQuizzes?.quiz2) {
              finalItem.locked = false;
              return finalItem;
          }
           if (item.label === 'kidsPage.finalTest' && studentProfile?.unlockedQuizzes?.finalQuiz) {
              finalItem.locked = false;
              return finalItem;
          }

          if (index === 0) {
              finalItem.locked = false; // Start is always unlocked
          } else {
              const previousItem = arr[index - 1];
              if (previousItem.type === 'start') {
                finalItem.locked = false;
              } else {
                let isLocked = (previousItem.progress ?? 0) < 100;
                
                if (item.label === 'introCoursePage.quiz1' && (previousItem.progress ?? 0) >= 90) {
                    isLocked = false;
                }
                
                if (item.label === 'introCoursePage.quiz2' && (previousItem.progress ?? 0) >= 90) {
                    isLocked = false;
                }

                finalItem.locked = isLocked;
              }
          }
          return finalItem;
      });
      
      itemsWithLockState.forEach(item => item.className = ''); // Clear previous animations
      // Find the next active, uncompleted item to animate
      const nextActiveItem = itemsWithLockState.find(item => !item.locked && (item.progress ?? 0) < 100 && (item.type === 'practice' || item.type === 'class'));
      if(nextActiveItem) {
        nextActiveItem.className = 'animate-pulse-glow';
      }

      setPathItems(itemsWithLockState);
    };
    
    if (!isProfileLoading) {
      updatePath();
    }
    
    // Add event listeners to re-run the logic when data might have changed
    const eventListener = () => updatePath();
    window.addEventListener('focus', eventListener);
    window.addEventListener('progressUpdated', eventListener);

    return () => {
      window.removeEventListener('focus', eventListener);
      window.removeEventListener('progressUpdated', eventListener);
    };
  }, [t, isAdmin, studentProfile, isProfileLoading, isUserLoading]);

  return (
    <div className="ingles-dashboard-bg flex w-full flex-col min-h-screen">
      <DashboardHeader />
      <main className="flex flex-1 flex-col items-center gap-8 p-4 md:py-12">
        <div className="text-center">
            <h1 className="text-4xl font-bold text-white [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">
              {t('dashboard.introductoryCourse')}
            </h1>
        </div>
        <div className="w-full max-w-4xl">
            <MazeGame 
                pathItems={pathItems} 
                title={t('introCoursePage.mazeTitle')} 
                description={t('introCoursePage.mazeDescription')}
                isLoading={isUserLoading || isProfileLoading}
                isIntro={true}
            />
        </div>
      </main>
    </div>
  );
}
