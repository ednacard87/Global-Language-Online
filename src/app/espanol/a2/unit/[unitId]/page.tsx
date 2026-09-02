'use client';

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from 'next/navigation';
import Link from "next/link";
import { doc } from 'firebase/firestore';
import { DashboardHeader } from "@/components/dashboard/header";
import { MazeGame } from "@/components/dashboard/maze-game";
import { getA2EspanolUnitPath, PathItem } from "@/lib/course-data";
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { Loader2, ArrowLeft } from "lucide-react";

export default function EspanolA2UnitPage() {
  const params = useParams();
  const unitId = params.unitId as string;

  const { user, isUserLoading } = useUser();
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
  const lastSavedProgressRef = useRef<number | null>(null);

  useEffect(() => {
    if (!unitId || isProfileLoading) return;

    const initialPath = getA2EspanolUnitPath(unitId);
    
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

        // Soporte para desbloqueo manual del administrador por clase
        if (item.href && item.href !== '#') {
            const classKey = `es-a2-${item.href.split('/').pop()}`;
            if (studentProfile?.unlockedClasses?.includes(classKey)) {
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
  }, [unitId, isAdmin, studentProfile?.progress, studentProfile?.unlockedClasses, isProfileLoading]);

  const unitProgress = useMemo(() => {
    const classItems = pathItems.filter(item => item.type === 'class');
    if (!classItems.length) return 100;
    const totalProgress = classItems.reduce((sum, item) => sum + (item.progress ?? 0), 0);
    return Math.round(totalProgress / classItems.length);
  }, [pathItems]);

  // PERSISTENCIA BLINDADA
  useEffect(() => {
    if (isProfileLoading || !studentDocRef || !unitId || isAdmin) return;
    
    const progressKey = `progress_a2_es_unit_${unitId}`;
    const currentSavedProgress = studentProfile?.progress?.[progressKey] || 0;
    
    if (unitProgress !== currentSavedProgress && unitProgress !== lastSavedProgressRef.current) {
        const timer = setTimeout(() => {
            lastSavedProgressRef.current = unitProgress;
            updateDocumentNonBlocking(studentDocRef, {
                [`progress.${progressKey}`]: unitProgress
            });
            window.dispatchEvent(new CustomEvent('progressUpdated'));
        }, 2000);
        return () => clearTimeout(timer);
    }
  }, [unitProgress, unitId, studentDocRef, isProfileLoading, isAdmin]);

  if (isUserLoading || isProfileLoading || !unitId) {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex w-full flex-col espanol-dashboard-bg min-h-screen">
      <DashboardHeader />
      <main className="flex flex-1 flex-col items-center gap-8 p-4 md:py-12">
        <div className="text-center">
            <h1 className="text-4xl font-bold text-white [text-shadow:1px_1px_2px_black] uppercase">
                UNIDAD {unitId} (A2)
            </h1>
            <Link href="/espanol/a2" className="text-sm font-bold text-white/80 hover:underline mt-2 inline-block">
                &larr; Volver a Ruta A2
            </Link>
        </div>
        <div className="w-full max-w-4xl">
            <MazeGame 
                pathItems={pathItems} 
                title={`Misiones de la Unidad ${unitId}`}
                description="Supera cada reto para dominar los temas de este bloque."
                isLoading={isProfileLoading}
            />
        </div>
      </main>
    </div>
  );
}