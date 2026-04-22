
'use client';

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { DashboardHeader } from "@/components/dashboard/header";
import { MazeGame } from "@/components/dashboard/maze-game";
import { getKidsA1MainPath, PathItem } from "@/lib/course-data";
import { useTranslation } from "@/context/language-context";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Progress } from "@/components/ui/progress";
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";


export default function KidsA1CoursePage() {
  const { t } = useTranslation();
  const [pathItems, setPathItems] = useState<PathItem[]>([]);
  const [isClient, setIsClient] = useState(false);

  const { user } = useUser();
  const firestore = useFirestore();

  const studentDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'students', user.uid) : null),
    [firestore, user]
  );
  const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: 'admin' | 'student', progress?: Record<string, number>, unlockedClasses?: string[]}>(studentDocRef);

  const adventureMascotImage = PlaceHolderImages.find(p => p.id === 'kids-adventure-mascot');

  const isAdmin = useMemo(() => {
      if (!user) return false;
      return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
  }, [user, studentProfile]);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (isProfileLoading) return;
    
    const updatePath = () => {
        const initialPath = getKidsA1MainPath(t);
        
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
            
            const classId = `kids-a1-${item.href?.split('/').pop()}`;
            if (studentProfile?.unlockedClasses?.includes(classId)) {
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
    }
    
    if (isClient) {
        updatePath();
    }
    
    window.addEventListener('progressUpdated', updatePath);
    
    return () => {
      window.removeEventListener('progressUpdated', updatePath);
    };
  }, [t, isAdmin, isClient, studentProfile, isProfileLoading]);

  const overallProgress = useMemo(() => {
    const progressItems = pathItems.filter(item => item.storageKey);
    if (progressItems.length === 0) return 0;
    
    const totalProgress = progressItems.reduce((sum, item) => sum + (item.progress ?? 0), 0);
    
    return Math.round(totalProgress / progressItems.length);
  }, [pathItems]);

  return (
    <div className="a1-kids-bg flex w-full flex-col min-h-screen">
      <DashboardHeader />
      <main className="flex flex-1 flex-col items-center gap-8 p-4 md:py-12">
        <div className="text-center">
            <h1 className="text-4xl font-bold text-white [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">
                CURSO A1
            </h1>
        </div>
        <div className="container grid grid-cols-1 lg:grid-cols-5 lg:gap-8 items-center">
            <div className="w-full lg:col-span-4">
                <MazeGame 
                    pathItems={pathItems} 
                    title="Curso A1 - Niños"
                    description={""}
                    isLoading={!isClient || isProfileLoading}
                >
                    <CardContent className="p-8 pt-4 border-t">
                        <CardHeader className="p-0">
                            <CardTitle>{isClient ? t('kidsA1.overallProgress') : 'Overall Progress'}</CardTitle>
                            <CardDescription>{isClient ? t('kidsA1.overallProgressDescription') : 'Your total progress in the A1 kids course.'}</CardDescription>
                        </CardHeader>
                        <div className="pt-4">
                            <Progress value={overallProgress} className="h-4" />
                            <div className="mt-2 flex justify-end text-sm font-medium text-muted-foreground">
                                <span>{overallProgress}%</span>
                            </div>
                        </div>
                    </CardContent>
                </MazeGame>
            </div>
            <div className="flex justify-center lg:col-span-1 mt-16 lg:mt-0">
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-max max-w-[200px] bg-card p-3 rounded-lg shadow-soft text-center transition-transform hover:scale-105 border-2 border-brand-purple">
                    <p className="font-semibold text-base bg-gradient-to-r from-brand-purple to-brand-teal text-transparent bg-clip-text">{isClient ? t('kidsPage.adventureTime') : ''}</p>
                    <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-card" />
                </div>
                {adventureMascotImage && <Image
                    src={adventureMascotImage.imageUrl}
                    alt={adventureMascotImage.description}
                    width={200}
                    height={200}
                    className="rounded-lg object-cover"
                    data-ai-hint={adventureMascotImage.imageHint}
                />}
              </div>
            </div>
        </div>
      </main>
    </div>
  );
}
