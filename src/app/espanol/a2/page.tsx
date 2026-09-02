'use client';

import React, { useState, useEffect, useMemo } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { MazeGame } from "@/components/dashboard/maze-game";
import { getA2EspanolMainPath, PathItem } from "@/lib/course-data";
import { useTranslation } from "@/context/language-context";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import Link from 'next/link';
import { Progress } from "@/components/ui/progress";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function A2SpanishDashboardPage() {
  const { t } = useTranslation();
  const [pathItems, setPathItems] = useState<PathItem[]>([]);
  const { user, isUserLoading } = useUser();
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
    if (isProfileLoading || isUserLoading) return;

    const updatePath = () => {
        const initialPath = getA2EspanolMainPath();

        const itemsWithProgress = initialPath.map(item => {
            const newItem = { ...item };
            if (item.storageKey && studentProfile?.progress) {
                newItem.progress = studentProfile.progress[item.storageKey] || 0;
            }
            return newItem;
        });

        // Robust sequential unlock logic using reduce
        const itemsWithLockState = itemsWithProgress.reduce((acc, item, index) => {
            if (isAdmin) {
                acc.push({ ...item, locked: false });
                return acc;
            }
            
            // Manual admin unlock
            if (item.href?.includes('/unit/')) {
                const unitNum = item.href.split('/').pop();
                const unitKey = `a2-es-unit-${unitNum}`;
                if (studentProfile?.unlockedUnits?.includes(unitKey)) {
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

            // Sequential logic based on previous item status or progress
            if (!prevItem.locked && (prevItem.progress ?? 0) >= 100) {
                isLocked = false;
            } else if (!prevItem.locked && !prevItem.storageKey) {
                isLocked = false;
            }

            acc.push({ ...item, locked: isLocked });
            return acc;
        }, [] as PathItem[]);

        itemsWithLockState.forEach(item => item.className = '');
        const nextActiveItem = itemsWithLockState.find(item => !item.locked && (item.progress ?? 0) < 100);
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

  const overallA2Progress = useMemo(() => {
    if (!studentProfile?.progress) return 0;
    const unitKeys = ['progress_a2_es_unit_1', 'progress_a2_es_unit_2', 'progress_a2_es_unit_3', 'progress_a2_es_unit_4'];
    const total = unitKeys.reduce((acc, key) => acc + (studentProfile.progress![key] || 0), 0);
    return Math.round(total / unitKeys.length);
  }, [studentProfile]);

  return (
    <div className="flex w-full flex-col espanol-dashboard-bg min-h-screen">
      <DashboardHeader />
      <main className="flex flex-1 flex-col items-center gap-8 p-4 md:py-12">
        <div className="text-center">
            <h1 className="text-4xl font-bold text-white [text-shadow:1px_1px_2px_black] uppercase">RUTA DE APRENDIZAJE A2 (ESPAÑOL)</h1>
            <Link href="/espanol" className="text-sm text-white/80 hover:underline mt-2 inline-block">
                &larr; Volver al Panel de Español
            </Link>
        </div>
        <div className="w-full max-w-5xl">
            <MazeGame 
                pathItems={pathItems} 
                title="THE LEARNING ADVENTURE A2" 
                description="Continúa tu viaje dominando el pasado y las perífrasis."
                isLoading={isProfileLoading}
            >
                <CardContent className="p-8 pt-4 border-t bg-card/80 backdrop-blur-sm rounded-b-lg text-foreground">
                    <CardHeader className="p-0">
                        <CardTitle className="text-primary uppercase tracking-tighter">PROGRESO GLOBAL A2</CardTitle>
                        <CardDescription className="text-foreground font-medium">Completa las unidades para alcanzar el nivel pre-intermedio.</CardDescription>
                    </CardHeader>
                    <div className="pt-4">
                        <Progress value={overallA2Progress} className="h-4" />
                        <div className="mt-2 flex justify-end text-sm font-black text-primary">
                            <span>{overallA2Progress}%</span>
                        </div>
                    </div>
                </CardContent>
            </MazeGame>
        </div>
      </main>
    </div>
  );
}
