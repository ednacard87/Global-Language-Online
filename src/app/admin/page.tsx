
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
import { ShieldOff, Shield, Lock, Unlock, Loader2, ChevronDown, Eye, Info, Star } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';

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

const classCountsMap = {
    a1: 16,
    a2: 20,
    b1: 20,
    b2: 20,
};

const unitCountsMap: Record<string, number> = {
    a1: 3,
    a2: 4,
    b1: 4,
    b2: 4,
};

const repasosCountMap = {
    a1: 3,
    a2: 4,
    b1: 4,
    b2: 4,
    kids: 3,
    espanol: 3,
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
  
  const { data: displayedStudents, isLoading, error } = useCollection<Omit<Student, 'id'>>(studentsCollectionRef);

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

  const handleToggleRepasoAccess = async (studentId: string, repasoKey: string, currentStatus: boolean) => {
    if (!firestore) return;
    setUpdatingStudentId(studentId);
    const studentRef = doc(firestore, 'students', studentId);
    const student = displayedStudents?.find(s => s.id === studentId);
    try {
        await setDoc(studentRef, { unlockedQuizzes: { ...student?.unlockedQuizzes, [repasoKey]: !currentStatus } }, { merge: true });
        toast({ title: "Acceso Actualizado" });
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
        toast({ title: "Acceso Actualizado" });
    } catch(error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
        setUpdatingStudentId(null);
    }
  };

  const handleToggleClassAccess = async (studentId: string, classId: string) => {
    if (!firestore) return;
    setUpdatingStudentId(studentId);
    const student = displayedStudents?.find(s => s.id === studentId);
    if (!student) return;
    const currentlyUnlocked = student.unlockedClasses || [];
    const updatedClasses = currentlyUnlocked.includes(classId)
        ? currentlyUnlocked.filter(c => c !== classId)
        : [...currentlyUnlocked, classId];
    try {
        await setDoc(doc(firestore, 'students', studentId), { unlockedClasses: updatedClasses }, { merge: true });
        toast({ title: "Acceso Actualizado" });
    } catch(error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
        setUpdatingStudentId(null);
    }
  };

  const handleToggleUnitAccess = async (studentId: string, unitKey: string) => {
    if (!firestore) return;
    setUpdatingStudentId(studentId);
    const student = displayedStudents?.find(s => s.id === studentId);
    if (!student) return;
    const currentlyUnlocked = student.unlockedUnits || [];
    const updatedUnits = currentlyUnlocked.includes(unitKey)
        ? currentlyUnlocked.filter(u => u !== unitKey)
        : [...currentlyUnlocked, unitKey];
    try {
        await setDoc(doc(firestore, 'students', studentId), { unlockedUnits: updatedUnits }, { merge: true });
        toast({ title: "Acceso a Unidad Actualizado" });
    } catch(error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
        setUpdatingStudentId(null);
    }
  };

  const getReadableProgress = (student: Student): React.ReactNode => {
    const { progress, selectedCourse } = student;
    if (!progress || Object.keys(progress).length === 0) return <span className="text-xs text-muted-foreground italic">Sin progreso</span>;

    const courseProgressKeys = Object.keys(progress).filter(key => {
        const lowerKey = key.toLowerCase();
        if (selectedCourse === 'ingles') return !lowerKey.includes('kids') && !lowerKey.includes('espanol') && !lowerKey.startsWith('progress_es_');
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
            if (key.startsWith('progress_a1_eng_unit')) {
                const classNum = parts[6];
                return `/a1/${classNum}?studentId=${student.id}`;
            }
            if (key.startsWith('progress_a2_eng_unit')) {
                const classNum = parts[6];
                return `/a2/${classNum}?studentId=${student.id}`;
            }
            if (key.startsWith('progress_es')) {
                const level = parts[2];
                const slug = parts.slice(3).join('-');
                return `/espanol/${level}/${slug}?studentId=${student.id}`;
            }
            if (key.startsWith('progress_kids')) {
                const level = parts[2];
                const slug = parts.slice(3).join('-');
                return `/kids/${level}/${slug}?studentId=${student.id}`;
            }
            return '#';
        };

        return (
            <div className="flex flex-col gap-2 p-2 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
                <div className='flex items-center justify-between gap-2'>
                    <span className="font-black text-[11px] truncate max-w-[120px] text-blue-700 dark:text-blue-300 uppercase tracking-tight">{name}</span>
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

  const visibleStudents = useMemo(() => (displayedStudents || []).filter(s => s.email !== 'ednacard87@gmail.com'), [displayedStudents]);

  return (
    <div className="flex w-full flex-col min-h-screen bg-background">
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-8">
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple overflow-hidden">
                <CardHeader className='bg-muted/30 border-b'>
                    <CardTitle>Panel de Administración</CardTitle>
                    <CardDescription>Gestión de estudiantes y monitoreo de misiones en tiempo real.</CardDescription>
                </CardHeader>
                <CardContent className='p-0'>
                    {isLoading ? <div className="flex items-center justify-center p-12"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div> : (
                        <Table>
                            <TableHeader><TableRow className='bg-muted/50'><TableHead>Estudiante</TableHead><TableHead>Email</TableHead><TableHead>Estado</TableHead><TableHead>Programa</TableHead><TableHead className='min-w-[180px]'>Misión Actual</TableHead><TableHead>Cursos</TableHead><TableHead>Acciones</TableHead></TableRow></TableHeader>
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
                                            <div className="flex flex-wrap gap-2 max-w-xs">
                                                {(student.selectedCourse === 'espanol' ? espanolCourseIds : student.selectedCourse === 'kids' ? kidsCourseIds : inglesCourseIds).map(c => (
                                                    <Button key={c} size="sm" variant={(student.unlockedCourses || []).includes(c) ? 'secondary' : 'outline'} onClick={() => handleToggleCourseAccess(student.id, c, student.unlockedCourses || [])} className="h-7 text-[10px] px-2 font-bold">
                                                        {(student.unlockedCourses || []).includes(c) ? <Unlock className="mr-1 h-3 w-3 text-green-600" /> : <Lock className="mr-1 h-3 w-3 text-muted-foreground" />} {c.toUpperCase()}
                                                    </Button>
                                                ))}
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
