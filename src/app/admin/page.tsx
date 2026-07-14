'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ShieldOff, Shield, Lock, Unlock, Loader2, Eye, Star, ListChecks, Layers } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Student {
  id: string;
  name: string;
  email: string;
  dateJoined: string;
  isBlocked?: boolean;
  profileImageUrl?: string;
  progress?: Record<string, number>;
  lessonProgress?: Record<string, any>;
  unlockedQuizzes?: Record<string, boolean>;
  unlockedCourses?: string[];
  unlockedClasses?: string[];
  unlockedUnits?: string[];
  selectedCourse?: 'ingles' | 'espanol' | 'kids';
}

const inglesCourseIds = ['a1', 'a2', 'b1', 'b2'];
const espanolCourseIds = ['a1', 'a2', 'b1'];
const kidsCourseIds = ['a1', 'a2', 'b1'];

const unitCounts: Record<string, number> = { a1: 3, a2: 4, b1: 4, b2: 4 };
const classCounts: Record<string, number> = { a1: 16, a2: 20, b1: 20, b2: 20 };

// Mapeo de slugs para cursos no numéricos
const courseSlugs: Record<string, string[]> = {
  'es-a1': ['articulos-y-genero', 'posesivos-y-tener', 'ser', 'estar', 'ser-y-estar', 'preposiciones-de-lugar', 'ubicacion', 'preguntas', 'comida-y-restaurante', 'presente-simple-regulares', 'comparativos-y-superlativos', 'demostrativos', 'verbos-de-preferencia', 'presente-continuo', 'presente-simple-irregulares'],
  'es-a2': ['reflexivos-regulares', 'reflexivos-irregulares', 'reflexivos-mix', 'pasado-regulares', 'pasado-irregulares', 'reflexivos-pasado', 'imperfecto', 'pasado-vs-imperfecto', 'preterito-perfecto'],
  'es-b1': ['pronombres', 'doble-pronombre', 'por-para', 'futuro', 'imperativo', 'presente-subjuntivo'],
  'kids-a1': ['to-be', 'present-simple', 'can', 'genitivo-sajon', 'wh-questions', 'posesivos', 'verbos-preferencia', 'demostrativos', 'one-ones', 'present-continuous', 'pronombres-objeto', 'comparativos-y-superlativos', 'adverbios-de-frecuencia'],
  'kids-a2': ['at-on-in-1', 'at-on-in-2', 'pasado-simple', 'pasado-continuo', 'contables-y-no-contables', 'presente-perfecto', 'used-to'],
  'kids-b1': ['will', 'may', 'be-going-to', 'zero-conditional', 'first-conditional', 'would-like-to', 'should', 'must-have-to', 'second-conditional', '1-2-conditional', 'connectors']
};

export default function AdminDashboardPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const [updatingStudentId, setUpdatingStudentId] = useState<string | null>(null);

  const studentsCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'students') : null),
    [firestore]
  );
  
  const { data: displayedStudents, isLoading } = useCollection<Omit<Student, 'id'>>(studentsCollectionRef);

  const handleToggleBlockStudent = async (studentId: string, isBlocked: boolean) => {
    if (!firestore) return;
    setUpdatingStudentId(studentId);
    const studentRef = doc(firestore, 'students', studentId);
    try {
      await setDoc(studentRef, { isBlocked: !isBlocked }, { merge: true });
      toast({ title: "Estado Actualizado" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setUpdatingStudentId(null);
    }
  };

  const handleToggleCourseAccess = async (studentId: string, courseId: string, currentlyUnlocked: string[]) => {
    if (!firestore) return;
    setUpdatingStudentId(studentId);
    const studentRef = doc(firestore, 'students', studentId);
    const updatedCourses = currentlyUnlocked.includes(courseId)
        ? currentlyUnlocked.filter(c => c !== courseId)
        : [...currentlyUnlocked, courseId];
    try {
        await setDoc(studentRef, { unlockedCourses: updatedCourses }, { merge: true });
        toast({ title: "Nivel Actualizado" });
    } catch(error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
        setUpdatingStudentId(null);
    }
  };

  const handleToggleUnitAccess = async (studentId: string, unitId: string, currentlyUnlocked: string[]) => {
    if (!firestore) return;
    const studentRef = doc(firestore, 'students', studentId);
    const updatedUnits = currentlyUnlocked.includes(unitId)
        ? currentlyUnlocked.filter(u => u !== unitId)
        : [...currentlyUnlocked, unitId];
    try {
        await setDoc(studentRef, { unlockedUnits: updatedUnits }, { merge: true });
        toast({ title: currentlyUnlocked.includes(unitId) ? "Unidad Bloqueada" : "Unidad Desbloqueada" });
    } catch(error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleToggleClassAccess = async (studentId: string, classId: string, currentlyUnlocked: string[]) => {
    if (!firestore) return;
    const studentRef = doc(firestore, 'students', studentId);
    const updatedClasses = currentlyUnlocked.includes(classId)
        ? currentlyUnlocked.filter(c => c !== classId)
        : [...currentlyUnlocked, classId];
    try {
        await setDoc(studentRef, { unlockedClasses: updatedClasses }, { merge: true });
        toast({ title: currentlyUnlocked.includes(classId) ? "Clase Bloqueada" : "Clase Desbloqueada" });
    } catch(error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const getReadableProgress = (student: Student): React.ReactNode => {
    const { progress, selectedCourse } = student;
    if (!progress || Object.keys(progress).length === 0) return <span className="text-xs text-muted-foreground italic">Sin progreso</span>;

    const courseProgressKeys = Object.keys(progress).filter(key => {
        const lowerKey = key.toLowerCase();
        if (selectedCourse === 'ingles') return !lowerKey.includes('kids') && !lowerKey.includes('espanol');
        if (selectedCourse === 'kids') return lowerKey.includes('kids');
        if (selectedCourse === 'espanol') return lowerKey.includes('espanol') || lowerKey.startsWith('progress_es_');
        return true;
    });

    if (courseProgressKeys.length === 0) return <span className="text-xs text-muted-foreground">Sin progreso</span>;

    const sorted = courseProgressKeys.map(key => ({ key, value: progress[key] })).sort((a, b) => b.key.localeCompare(a.key));
    const sessionToShow = sorted.find(item => item.value > 0 && item.value < 100) || sorted[0];

    if (sessionToShow) {
        const { key, value } = sessionToShow;
        const name = key.replace('progress_', '').replace(/_/g, ' ').toUpperCase();

        const getPathForSupervision = () => {
            const parts = key.split('_');
            if (key.includes('a1_eng')) return `/a1/${parts[parts.length-1]}?studentId=${student.id}`;
            if (key.includes('a2_eng')) return `/a2/${parts[parts.length-1]}?studentId=${student.id}`;
            if (key.includes('b1_eng')) return `/b1/${parts[parts.length-1]}?studentId=${student.id}`;
            if (key.startsWith('progress_es_')) return `/espanol-a1/${parts[parts.length-1]}?studentId=${student.id}`;
            return '#';
        };

        return (
            <div className="flex flex-col gap-2 p-2 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
                <div className='flex items-center justify-between gap-2'>
                    <span className="font-black text-[11px] text-blue-700 dark:text-blue-300 uppercase tracking-tight leading-tight block w-full">{name}</span>
                    <span className="text-xs font-black text-blue-600">{Math.round(value)}%</span>
                </div>
                <button 
                    className='h-8 w-full text-[10px] font-black bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center justify-center rounded-md' 
                    onClick={() => router.push(getPathForSupervision())}
                >
                    <Eye className='h-3.5 w-3.5 mr-1'/> SUPERVISAR
                </button>
            </div>
        );
    }
    return <span className="text-xs text-muted-foreground">Sin Empezar</span>;
  };

  const renderGranularAuthorizations = (student: Student) => {
    if (!student.selectedCourse) return null;

    const isEnglish = student.selectedCourse === 'ingles';
    const isSpanish = student.selectedCourse === 'espanol';
    const isKids = student.selectedCourse === 'kids';

    const coursePrefix = isSpanish ? 'es-' : (isKids ? 'kids-' : '');

    return (
        <div className="flex flex-col gap-3 mt-3 pt-3 border-t">
            {/* Gestión de Unidades (Visual mejorada con estados claros) */}
            {isEnglish && (
                <div className="space-y-1">
                    <p className="text-[9px] font-black text-primary uppercase flex items-center gap-1">
                        <Layers className="h-2 w-2" /> UNIDADES
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {(student.unlockedCourses || []).map(courseId => {
                            const count = unitCounts[courseId] || 0;
                            if (count === 0) return null;
                            return Array.from({ length: count }, (_, i) => {
                                const uId = `${courseId}-unit-${i + 1}`;
                                const isUnlocked = (student.unlockedUnits || []).includes(uId);
                                return (
                                    <Button 
                                        key={uId} 
                                        size="sm" 
                                        variant={isUnlocked ? 'secondary' : 'outline'} 
                                        onClick={() => handleToggleUnitAccess(student.id, uId, student.unlockedUnits || [])}
                                        className={cn(
                                            "h-6 text-[9px] px-1.5 font-black transition-all",
                                            isUnlocked ? "bg-green-100 border-green-500 text-green-700 hover:bg-green-200" : "text-muted-foreground"
                                        )}
                                    >
                                        {isUnlocked ? <Unlock className="mr-1 h-2 w-2 text-green-600" /> : <Lock className="mr-1 h-2 w-2 text-muted-foreground" />}
                                        {courseId.toUpperCase()} U{i + 1}
                                    </Button>
                                );
                            });
                        })}
                    </div>
                </div>
            )}

            {/* Gestión de Clases mediante Popover */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold w-full">
                        <ListChecks className="mr-1 h-3 w-3" /> GESTIONAR CLASES
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 shadow-2xl border-2 border-primary/20">
                    <div className="space-y-4">
                        <div className='border-b pb-2 text-foreground'>
                            <h4 className="font-black text-sm text-primary uppercase">Autorización de Clases</h4>
                            <p className='text-[10px] text-muted-foreground'>Habilita o deshabilita clases individuales para {student.name}.</p>
                        </div>
                        <ScrollArea className="h-[300px] pr-2">
                            <div className='space-y-6'>
                                {(student.unlockedCourses || []).map(courseId => {
                                    const listKey = `${coursePrefix}${courseId}`;
                                    const slugs = courseSlugs[listKey];
                                    
                                    // Si es inglés o no tiene slugs definidos, usamos números
                                    if (isEnglish || !slugs) {
                                        const count = classCounts[courseId] || 0;
                                        if (count === 0) return null;
                                        return (
                                            <div key={`classes-${courseId}`} className="space-y-3">
                                                <Badge variant="outline" className="text-[10px] font-black bg-primary/5 text-primary border-primary/20 uppercase">
                                                    {courseId.toUpperCase()} Missions
                                                </Badge>
                                                <div className="grid grid-cols-5 gap-1.5">
                                                    {Array.from({ length: count }, (_, i) => {
                                                        const cId = `${courseId}-${i + 1}`;
                                                        const isUnlocked = (student.unlockedClasses || []).includes(cId);
                                                        return (
                                                            <Button 
                                                                key={cId} 
                                                                size="sm" 
                                                                variant={isUnlocked ? 'secondary' : 'outline'} 
                                                                onClick={() => handleToggleClassAccess(student.id, cId, student.unlockedClasses || [])}
                                                                className={cn(
                                                                    "h-9 text-[11px] p-0 font-black transition-all",
                                                                    isUnlocked && "bg-green-100 border-green-500 text-green-700 hover:bg-green-200"
                                                                )}
                                                            >
                                                                {i + 1}
                                                            </Button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    }

                                    // Para Español y Niños usamos los slugs
                                    return (
                                        <div key={`classes-${courseId}`} className="space-y-3">
                                            <Badge variant="outline" className="text-[10px] font-black bg-primary/5 text-primary border-primary/20 uppercase">
                                                {listKey.toUpperCase()} Missions
                                            </Badge>
                                            <div className="grid grid-cols-5 gap-1.5">
                                                {slugs.map((slug, i) => {
                                                    const cId = `${listKey}-${slug}`;
                                                    const isUnlocked = (student.unlockedClasses || []).includes(cId);
                                                    return (
                                                        <Button 
                                                            key={cId} 
                                                            size="sm" 
                                                            variant={isUnlocked ? 'secondary' : 'outline'} 
                                                            onClick={() => handleToggleClassAccess(student.id, cId, student.unlockedClasses || [])}
                                                            className={cn(
                                                                "h-9 text-[11px] p-0 font-black transition-all",
                                                                isUnlocked && "bg-green-100 border-green-500 text-green-700 hover:bg-green-200"
                                                            )}
                                                            title={slug.replace(/-/g, ' ')}
                                                        >
                                                            {i + 1}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
  };

  const visibleStudents = useMemo(() => (displayedStudents || []).filter(s => s.email !== 'ednacard87@gmail.com'), [displayedStudents]);

  return (
    <div className="flex w-full flex-col min-h-screen bg-background">
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-8">
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple overflow-hidden">
                <CardHeader className='bg-muted/30 border-b'>
                    <CardTitle>Panel de Administración</CardTitle>
                    <CardDescription>Gestión de estudiantes y autorización de misiones granulares.</CardDescription>
                </CardHeader>
                <CardContent className='p-0'>
                    {isLoading ? <div className="flex items-center justify-center p-12"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div> : (
                        <Table>
                            <TableHeader><TableRow className='bg-muted/50'><TableHead>Estudiante</TableHead><TableHead>Email</TableHead><TableHead>Estado</TableHead><TableHead>Programa</TableHead><TableHead className='min-w-[180px]'>Misión Actual</TableHead><TableHead className='min-w-[200px]'>Autorizaciones</TableHead><TableHead>Acciones</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {visibleStudents.map((student) => (
                                    <TableRow key={student.id} className='hover:bg-muted/10 transition-colors'>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border-2 border-primary/20"><AvatarImage src={student.profileImageUrl}/><AvatarFallback>{student.name[0]}</AvatarFallback></Avatar>
                                                <div className="flex flex-col"><span className='font-bold'>{student.name}</span><span className="text-[10px] text-muted-foreground">{new Date(student.dateJoined).toLocaleDateString()}</span></div>
                                            </div>
                                        </TableCell>
                                        <TableCell className='text-xs font-mono'>{student.email}</TableCell>
                                        <TableCell><Badge variant={student.isBlocked ? 'destructive' : 'secondary'} className='text-[10px] font-bold'>{student.isBlocked ? 'BLOQUEADO' : 'ACTIVO'}</Badge></TableCell>
                                        <TableCell><Badge variant="outline" className="capitalize text-[10px] font-bold border-primary/30">{student.selectedCourse || 'Pendiente'}</Badge></TableCell>
                                        <TableCell>{getReadableProgress(student)}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-2">
                                                <div className="flex flex-wrap gap-2 max-w-xs">
                                                    {(student.selectedCourse === 'espanol' ? espanolCourseIds : student.selectedCourse === 'kids' ? kidsCourseIds : inglesCourseIds).map(c => (
                                                        <Button key={c} size="sm" variant={(student.unlockedCourses || []).includes(c) ? 'secondary' : 'outline'} onClick={() => handleToggleCourseAccess(student.id, c, student.unlockedCourses || [])} className="h-7 text-[10px] px-2 font-bold">
                                                            {(student.unlockedCourses || []).includes(c) ? <Unlock className="mr-1 h-3 w-3 text-green-600" /> : <Lock className="mr-1 h-3 w-3 text-muted-foreground" />} {c.toUpperCase()}
                                                        </Button>
                                                    ))}
                                                </div>
                                                {renderGranularAuthorizations(student)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => handleToggleBlockStudent(student.id, !!student.isBlocked)}>{student.isBlocked ? <Shield className="h-4 w-4 text-green-500" /> : <ShieldOff className="h-4 w-4" />}</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </main>
    </div>
  );
}
