'use client';

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { DashboardHeader } from "@/components/dashboard/header";
import { MazeGame } from "@/components/dashboard/maze-game";
import { kidsIntroPathData, PathItem } from "@/lib/course-data";
import { useTranslation } from "@/context/language-context";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

interface StudentProfile {
    role?: 'admin' | 'student';
    progress?: Record<string, number>;
}

export default function KidsIntroductoryCoursePage() {
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
    document.title = t('introCoursePage.mazeTitle');

    const updatePath = () => {
      if (!studentProfile && !isAdmin) return;

      const initialPath = kidsIntroPathData.map(i => ({...i}));

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
          } else {
              if (index === 0) {
                  finalItem.locked = false; // Start is always unlocked
              } else {
                  const previousItem = arr[index - 1];
                  if (previousItem.type === 'start') {
                    finalItem.locked = false;
                  } else {
                    finalItem.locked = (previousItem.progress ?? 0) < 100;
                  }
              }
          }
          return finalItem;
      });
      
      itemsWithLockState.forEach(item => item.className = ''); 
      const nextActiveItem = itemsWithLockState.find(item => !item.locked && (item.progress ?? 0) < 100 && (item.type === 'practice' || item.type === 'class'));
      if(nextActiveItem) {
        nextActiveItem.className = 'animate-pulse-glow';
      }

      setPathItems(itemsWithLockState);
    };
    
    if (!isProfileLoading) {
      updatePath();
    }
    
    const eventListener = () => updatePath();
    window.addEventListener('focus', eventListener);
    window.addEventListener('progressUpdated', eventListener);

    return () => {
      window.removeEventListener('focus', eventListener);
      window.removeEventListener('progressUpdated', eventListener);
    };
  }, [t, isAdmin, studentProfile, isProfileLoading]);

  return (
    <div className="intro-adventure-container flex w-full flex-col min-h-screen">
      <DashboardHeader />
      <main className="flex flex-1 flex-col items-center gap-8 p-4 md:py-12">
        <div className="text-center">
            <h1 className="text-4xl font-bold text-white [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">{t('kidsPage.intro1AdventureTitle')}</h1>
        </div>
        <div className="container grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
            <div className="w-full lg:col-span-4">
                <MazeGame 
                    pathItems={pathItems} 
                    title={t('introCoursePage.mazeTitle')} 
                    description={t('introCoursePage.mazeDescription')}
                    isLoading={isUserLoading || isProfileLoading}
                />
            </div>
            <div className="flex justify-center lg:col-span-1">
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-max max-w-[200px] bg-card p-3 rounded-lg shadow-soft text-center text-sm transition-transform hover:scale-105 border-2 border-brand-purple">
                    <p className="font-semibold bg-gradient-to-r from-brand-purple to-brand-teal text-transparent bg-clip-text">{t('introCoursePage.penguinHint')}</p>
                    <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-card" />
                </div>
                {guideFishImage && <Image
                    src={guideFishImage.imageUrl}
                    alt={guideFishImage.description}
                    width={166}
                    height={166}
                    className="rounded-lg object-cover"
                    data-ai-hint={guideFishImage.imageHint}
                />}
              </div>
            </div>
        </div>
      </main>
    </div>
  );
}
