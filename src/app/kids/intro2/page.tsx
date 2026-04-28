'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, CheckCircle, Lock, ArrowRight, Swords, Hand, MessageSquare, BrainCircuit, PenSquare, Lightbulb, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/language-context';
import { getIntro2PathData, type Intro2PathItem } from '@/lib/course-data';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { TimeExercise } from '@/components/kids/exercises/time-exercise';

const ICONS = { locked: Lock, active: BookOpen, completed: CheckCircle };

// By changing this version, we can force a progress reset for all users
// if there's a breaking change in the path structure.
const progressStorageVersion = "_v1_sequential_intro2";
interface Student {
    role?: 'admin' | 'student';
    lessonProgress?: any;
    progress?: Record<string, number>;
}
export default function KidsIntro2Page() {
    const { t } = useTranslation();
    const [intro2Path, setIntro2Path] = useState<Intro2PathItem[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [selectedTopicKey, setSelectedTopicKey] = useState<string | null>(null);

    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const studentDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'students', user.uid) : null),
        [firestore, user]
    );
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<Student>(studentDocRef);
    const guideFishImage = PlaceHolderImages.find(p => p.id === 'guide-fish');
    const timeImage = PlaceHolderImages.find(p => p.id === 'telling-time');

    const isAdmin = useMemo(() => {
        if (!user) return false;
        return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
    }, [user, studentProfile]);

    const initialLearningPath = useMemo(() => getIntro2PathData(t), [t]);

    useEffect(() => {
        if (isProfileLoading) return;
        const loadPath = (storageKey: string, defaultPath: any[]) => {
            if (isAdmin) {
                return defaultPath.map(item => ({ ...item, status: 'active' }));
            }
            const versionedKey = storageKey + progressStorageVersion;
            
            if (studentProfile?.lessonProgress?.[versionedKey]) {
                const savedStatuses = studentProfile.lessonProgress[versionedKey];
                return defaultPath.map(item => ({
                    ...item,
                    status: savedStatuses[item.key] || item.status
                }));
            }

            try {
                const savedStatusJSON = localStorage.getItem(versionedKey);
                if (savedStatusJSON) {
                    const savedStatuses = JSON.parse(savedStatusJSON);
                    return defaultPath.map(item => ({
                        ...item,
                        status: savedStatuses[item.key] || item.status
                    }));
                }
            } catch (e) {
                console.error(`Failed to load path from ${versionedKey}`, e);
            }
            return defaultPath;
        };
    
        setIntro2Path(loadPath('intro2Path', initialLearningPath));

    }, [t, isAdmin, isProfileLoading, studentProfile, initialLearningPath]);

    const completeTopic = (topicKey: string) => {
        setIntro2Path(currentPath => {
            const newPath = [...currentPath];
            const currentItemIndex = newPath.findIndex(item => item.key === topicKey);
            
            if (currentItemIndex !== -1 && newPath[currentItemIndex].status !== 'completed') {
                newPath[currentItemIndex] = { ...newPath[currentItemIndex], status: 'completed' };

                const nextItemIndex = currentItemIndex + 1;
                if (nextItemIndex < newPath.length && newPath[nextItemIndex].status === 'locked') {
                    newPath[nextItemIndex] = { ...newPath[nextItemIndex], status: 'active' };
                }
            }

            // Save progress
            if (!isAdmin && studentDocRef) {
                const versionedKey = 'intro2Path' + progressStorageVersion;
                const statusOnly = newPath.reduce((acc, item) => ({...acc, [item.key]: item.status}), {});
                const completedItems = newPath.filter(item => item.status === 'completed').length;
                const newProgress = Math.round((completedItems / newPath.length) * 100);
                 updateDocumentNonBlocking(studentDocRef, {
                    [`lessonProgress.${versionedKey}`]: statusOnly,
                    'progress.kidsIntro2Progress': newProgress,
                });
                window.dispatchEvent(new CustomEvent('progressUpdated'));
            }

            return newPath;
        });
    };

    const handleTopicSelect = (topicName: string) => {
        const currentItem = intro2Path.find(item => item.name === topicName);
        if (!isAdmin && (!currentItem || currentItem.status === 'locked')) return;

        setSelectedTopic(topicName);
        setSelectedTopicKey(currentItem!.key);
        
        const viewOnlyTopics = ['tip', 'greetings', 'farewells', 'time'];
        if (viewOnlyTopics.includes(currentItem!.key)) {
            completeTopic(currentItem!.key);
        }
    };

    const handleExerciseComplete = () => {
        if(selectedTopicKey) {
            completeTopic(selectedTopicKey);
        }
    }

    const completedItems = useMemo(() => intro2Path.filter(item => item.status === 'completed').length, [intro2Path]);
    const progress = useMemo(() => intro2Path.length > 0 ? Math.round((completedItems / intro2Path.length) * 100) : 0, [completedItems, intro2Path.length]);
    
  const renderContent = () => {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{selectedTopic}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Contenido para {selectedTopic} vendrá aquí.</p>
                </CardContent>
            </Card>
        )
    };
    
    return (
        <div className="flex w-full flex-col ingles-dashboard-bg min-h-screen">
          <DashboardHeader />
          <main className="flex-1 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="grid gap-8 md:grid-cols-12">
                <div className="md:col-span-9">
                    <Link href="/kids/intro" className="hover:underline">
                        <h1 className="text-4xl font-bold mb-8 dark:text-primary">{t('introCoursePage.intro2')}</h1>
                    </Link>
                    {renderContent()}
                </div>
                <div className="md:col-span-3">
                    <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>{t('intro1Page.learningPath')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <nav>
                            <ul className="space-y-1">
                            {intro2Path.map((item, index) => {
                                const Icon = ICONS[item.status as keyof typeof ICONS];
                                const isLocked = item.status === 'locked';
                                const isSelected = selectedTopic === item.name;
                                const isActive = item.status === 'active';
                                
                                const itemContent = (
                                    <div className={cn(
                                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                        !isLocked && "hover:bg-muted",
                                        isSelected ? "bg-muted text-primary font-semibold" : (isActive ? "text-foreground" : "text-muted-foreground")
                                    )}>
                                        <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500" : (item.status === 'completed' || isSelected || isActive) ? "text-primary" : "text-muted-foreground")} />
                                        <span>{item.name}</span>
                                    </div>
                                );

                                return (
                                    <li key={index} onClick={() => handleTopicSelect(item.name)} className={cn(!isLocked ? "cursor-pointer" : "cursor-not-allowed")}>
                                        {itemContent}
                                    </li>
                                );
                            })}
                            </ul>
                        </nav>
                        <div className="mt-6">
                            <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2">
                                <span>{t('intro1Page.progress')}</span>
                                <span className="font-bold text-foreground">{progress}%</span>
                            </div>
                            <div className="relative">
                                <Progress value={progress} className="h-2" style={{'--indicator-color': 'hsl(var(--primary))'} as React.CSSProperties} />
                                <div className="absolute inset-0 flex w-full">
                                    {[...Array(7)].map((_, i) => (
                                        <div key={i} className="flex-1 h-full border-r-2 border-background last:border-r-0"></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    </Card>
                </div>
                </div>
            </div>
          </main>
        </div>
      );
}
