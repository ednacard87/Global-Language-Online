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
import { ShieldOff, Shield, Lock, Unlock, Loader2, ChevronDown, Eye, Info } from 'lucide-react';
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
  lessonProgress?: Record<string, any>; // Add lessonProgress for more detailed info
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
    es: 15,
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

const kidsClassesMap = {
    a1: [
        { id: 'kids-a1-to-be', name: 'To be' },
        { id: 'kids-a1-present-simple', name: 'Presente Simple' },
        { id: 'kids-a1-can', name: 'Can' },
        { id: 'kids-a1-genitivo-sajon', name: 'Genitivo Sajón' },
        { id: 'kids-a1-wh-questions', name: 'Wh Questions' },
        { id: 'kids-a1-posesivos', name: 'Posesivos' },
        { id: 'kids-a1-verbos-preferencia', name: 'Verbos de Preferencia' },
        { id: 'kids-a1-demostrativos', name: 'Demostrativos' },
        { id: 'kids-a1-one-ones', name: 'One/Ones' },
        { id: 'kids-a1-present-continuous', name: 'Presente Continuo' },
        { id: 'kids-a1-pronombres-objeto', name: 'Pronombres Objeto' },
        { id: 'kids-a1-comparativos-y-superlativos', name: 'Comparativos y Superlativos' },
        { id: 'kids-a1-adverbios-de-frecuencia', name: 'Adverbios de Frecuencia' },
    ],
    a2: [
        { id: 'kids-a2-at-on-in-1', name: 'AT - ON - IN 1' },
        { id: 'kids-a2-at-on-in-2', name: 'AT - ON - IN 2' },
        { id: 'kids-a2-pasado-simple', name: 'Pasado Simple' },
        { id: 'kids-a2-pasado-continuo', name: 'Pasado Continuo' },
        { id: 'kids-a2-contables-y-no-contables', name: 'Contables y No Contables' },
        { id: 'kids-a2-presente-perfecto', name: 'Presente Perfecto' },
        { id: 'kids-a2-used-to', name: 'Used to' },
    ],
    b1: [
        { id: 'kids-b1-will', name: 'Will' },
        { id: 'kids-b1-may', name: 'May' },
        { id: 'kids-b1-be-going-to', name: 'Be Going To' },
        { id: 'kids-b1-zero-conditional', name: 'Zero Conditional' },
        { id: 'kids-b1-first-conditional', name: 'First Conditional' },
        { id: 'kids-b1-would-like-to', name: 'Would like to' },
        { id: 'kids-b1-should', name: 'Should' },
        { id: 'kids-b1-must-have-to', name: 'Must, Have to' },
        { id: 'kids-b1-second-conditional', name: 'Second Conditional' },
        { id: 'kids-b1-1-2-conditional', name: '1 & 2 Conditional' },
        { id: 'kids-b1-connectors', name: 'Connectors' },
    ]
};

const espanolClassesMap = {
    a1: [
        { id: 'es-a1-articulos-y-genero', name: 'Articulos y Genero' },
        { id: 'es-a1-posesivos-y-tener', name: 'Posesivos y Tener' },
        { id: 'es-a1-ser', name: 'Ser' },
        { id: 'es-a1-estar', name: 'Estar' },
        { id: 'es-a1-ser-y-estar', name: 'Ser y Estar' },
        { id: 'es-a1-preposiciones-de-lugar', name: 'Preposiciones de lugar' },
        { id: 'es-a1-ubicacion', name: 'ubicacion' },
        { id: 'es-a1-preguntas', name: 'Preguntas' },
        { id: 'es-a1-comida-y-restaurante', name: 'Comida y restaurante' },
        { id: 'es-a1-presente-simple-regulares', name: 'Presente simple Regulares' },
        { id: 'es-a1-comparativos-y-superlativos', name: 'Comparativos y Superlativos' },
        { id: 'es-a1-demostrativos', name: 'Demostrativos' },
        { id: 'es-a1-verbos-de-preferencia', name: 'Verbos de Preferencia' },
        { id: 'es-a1-presente-continuo', name: 'Presente Continuo' },
        { id: 'es-a1-presente-simple-irregulares', name: 'Presente simple irregulares' },
    ],
    a2: [
        { id: 'es-a2-reflexivos-regulares', name: 'reflexivos regulares' },
        { id: 'es-a2-reflexivos-irregulares', name: 'reflexivos irregulares' },
        { id: 'es-a2-reflexivos-mix', name: 'reflexivos mixtos' },
        { id: 'es-a2-pasado-regulares', name: 'pasado regulares' },
        { id: 'es-a2-pasado-irregulares', name: 'pasado irregulares' },
        { id: 'es-a2-reflexivos-pasado', name: 'reflexivos pasado' },
        { id: 'es-a2-imperfecto', name: 'imperfecto' },
        { id: 'es-a2-pasado-vs-imperfecto', name: 'Pasado simple vs imperfecto' },
        { id: 'es-a2-preterito-perfecto', name: 'preterito perfecto' },
    ],
    b1: [
        { id: 'es-b1-pronombres', name: 'Pronombres' },
        { id: 'es-b1-doble-pronombre', name: 'Doble Pronombre' },
        { id: 'es-b1-por-para', name: 'Por/Para' },
        { id: 'es-b1-futuro', name: 'Futuro' },
        { id: 'es-b1-imperativo', name: 'Imperativo' },
        { id: 'es-b1-presente-subjuntivo', name: 'Presente Subjuntivo' },
    ]
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

  useEffect(() => {
    if(error) {
      console.error("Error fetching students: ", error);
      toast({
          variant: "destructive",
          title: "Error al Cargar",
          description: `No se pudieron cargar los estudiantes: ${error.message}`,
      });
    }
  }, [error, toast]);


  const handleToggleBlockStudent = async (studentId: string, isBlocked: boolean) => {
    if (!firestore) return;
    setUpdatingStudentId(studentId);
    const studentRef = doc(firestore, 'students', studentId);
    const data = { isBlocked: !isBlocked };
    try {
      await setDoc(studentRef, data, { merge: true });
      toast({
        title: "Estado Actualizado",
        description: `El estudiante ha sido ${!isBlocked ? 'bloqueado' : 'desbloqueado'}.`,
      });
    } catch (error: any) {
      console.error("Error updating student block status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `No se pudo actualizar el estado del estudiante: ${error.message}`,
      });
    } finally {
      setUpdatingStudentId(null);
    }
  };

  const handleToggleRepasoAccess = async (studentId: string, repasoKey: string, currentStatus: boolean) => {
    if (!firestore) return;
    setUpdatingStudentId(studentId);
    const studentRef = doc(firestore, 'students', studentId);
    const student = displayedStudents?.find(s => s.id === studentId);
    const data = { unlockedQuizzes: { ...student?.unlockedQuizzes, [repasoKey]: !currentStatus } };
    try {
        await setDoc(studentRef, data, { merge: true });
        toast({
          title: "Acceso Actualizado",
          description: `El acceso al repaso ha sido ${!currentStatus ? 'concedido' : 'revocado'}.`,
        });
    } catch (error: any) {
        console.error("Error updating repaso access:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `No se pudo actualizar el acceso al repaso: ${error.message}`,
        });
    } finally {
        setUpdatingStudentId(null);
    }
  };

  const handleToggleCourseAccess = async (studentId: string, courseId: string, currentlyUnlocked: string[]) => {
    if (!firestore) return;
    setUpdatingStudentId(studentId);
    const studentRef = doc(firestore, 'students', studentId);
    const isUnlocked = currentlyUnlocked.includes(courseId);

    const updatedCourses = isUnlocked
        ? currentlyUnlocked.filter(c => c !== courseId)
        : [...currentlyUnlocked, courseId];
    
    const data = { unlockedCourses: updatedCourses };
    try {
        await setDoc(studentRef, data, { merge: true });
        toast({
          title: "Acceso Actualizado",
          description: `El acceso para el curso ${courseId.toUpperCase()} ha sido ${!isUnlocked ? 'concedido' : 'revocado'}.`,
        });
    } catch(error: any) {
        console.error("Error updating course access:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `No se pudo actualizar el acceso al curso: ${error.message}`,
        });
    } finally {
        setUpdatingStudentId(null);
    }
  };

  const handleToggleClassAccess = async (studentId: string, classId: string) => {
    if (!firestore) return;
    setUpdatingStudentId(studentId);
    
    const student = displayedStudents?.find(s => s.id === studentId);
    if (!student) {
        setUpdatingStudentId(null);
        return;
    }

    const currentlyUnlocked = student.unlockedClasses || [];
    const isUnlocked = currentlyUnlocked.includes(classId);

    const updatedClasses = isUnlocked
        ? currentlyUnlocked.filter(c => c !== classId)
        : [...currentlyUnlocked, classId];
    
    const studentRef = doc(firestore, 'students', studentId);
    const data = { unlockedClasses: updatedClasses };

    try {
        await setDoc(studentRef, data, { merge: true });
        toast({
          title: "Acceso Actualizado",
          description: `El acceso para la clase ${classId.toUpperCase()} ha sido ${!isUnlocked ? 'concedido' : 'revocado'}.`,
        });
    } catch(error: any) {
        console.error("Error updating class access:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `No se pudo actualizar el acceso a la clase: ${error.message}`,
        });
    } finally {
        setUpdatingStudentId(null);
    }
  };

  const handleToggleUnitAccess = async (studentId: string, unitKey: string) => {
    if (!firestore) return;
    setUpdatingStudentId(studentId);
    
    const student = displayedStudents?.find(s => s.id === studentId);
    if (!student) {
        setUpdatingStudentId(null);
        return;
    }

    const currentlyUnlocked = student.unlockedUnits || [];
    const isUnlocked = currentlyUnlocked.includes(unitKey);

    const updatedUnits = isUnlocked
        ? currentlyUnlocked.filter(u => u !== unitKey)
        : [...currentlyUnlocked, unitKey];
    
    const studentRef = doc(firestore, 'students', studentId);
    const data = { unlockedUnits: updatedUnits };

    try {
        await setDoc(studentRef, data, { merge: true });
        toast({
          title: "Acceso a Unidad Actualizado",
          description: `La unidad ha sido ${!isUnlocked ? 'desbloqueada' : 'bloqueada'}.`,
        });
    } catch(error: any) {
        console.error("Error updating unit access:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `No se pudo actualizar el acceso a la unidad: ${error.message}`,
        });
    } finally {
        setUpdatingStudentId(null);
    }
  };

  const getReadableProgress = (student: Student): React.ReactNode => {
    const { progress, selectedCourse, lessonProgress } = student;

    if (!progress || Object.keys(progress).length === 0) {
        return <span className="text-xs text-muted-foreground italic">Sin progreso</span>;
    }

    const courseProgressKeys = Object.keys(progress).filter(key => {
        const lowerKey = key.toLowerCase();
        if (selectedCourse === 'ingles') return !lowerKey.includes('kids') && !lowerKey.includes('espanol') && !lowerKey.startsWith('progress_es_');
        if (selectedCourse === 'kids') return lowerKey.includes('kids');
        if (selectedCourse === 'espanol') return lowerKey.includes('espanol') || lowerKey.startsWith('progress_es_');
        return true;
    });

    if (courseProgressKeys.length === 0) {
        return <span className="text-xs text-muted-foreground">Sin progreso</span>;
    }

    // Find active lessons (progress > 0 and < 100)
    const activeLessons = courseProgressKeys
        .map(key => ({ key, value: progress[key] }))
        .filter(item => item.value > 0 && item.value < 100);

    let sessionToShow: { key: string; value: number; } | null = null;

    if (activeLessons.length > 0) {
        // If there are active lessons, find the one with the highest key (most advanced)
        activeLessons.sort((a, b) => b.key.localeCompare(a.key));
        sessionToShow = activeLessons[0];
    } else {
        // If no active lessons, find the latest completed lesson
        const completedLessons = courseProgressKeys
            .map(key => ({ key, value: progress[key] }))
            .filter(item => item.value >= 100);
        
        if (completedLessons.length > 0) {
            // Find the one with the highest key (most recently completed in terms of order)
            completedLessons.sort((a, b) => b.key.localeCompare(a.key));
            sessionToShow = completedLessons[0];
        }
    }
    
    // Fallback to the original logic if no specific session is found
    if (!sessionToShow && courseProgressKeys.length > 0) {
         const allLessons = courseProgressKeys.map(key => ({ key, value: progress[key] }));
         allLessons.sort((a, b) => b.key.localeCompare(a.key));
         sessionToShow = allLessons[0];
    }

    if (sessionToShow) {
        const { key, value } = sessionToShow;
        const name = key
            .replace('progress_', '')
            .replace(/_/g, ' ')
            .replace('a1 eng unit', 'Ing A1 U')
            .replace('class', 'Clase')
            .replace('kids', 'Niños')
            .replace('espanol', 'Español')
            .replace('intro', 'Intro')
            .replace('Progress', '')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        const getPathForSupervision = () => {
            const parts = key.split('_');
            
            if (key.startsWith('progress_a1_eng_unit')) { // e.g., progress_a1_eng_unit_3_class_14
                const course = parts[1];
                const unit = parts[4];
                const classNum = parts[6];
                return `/ingles/${course}/unit/${unit}/class/${classNum}?studentId=${student.id}`;
            }
            if (key.startsWith('progress_es')) { // e.g., progress_es_a1_comparativos_y_superlativos
                const level = parts[2];
                const slug = parts.slice(3).join('-');
                return `/espanol/${level}/${slug}?studentId=${student.id}`;
            }
             if (key.startsWith('progress_kids')) { // e.g., progress_kids_a1_to-be
                const level = parts[2];
                const slug = parts.slice(3).join('-');
                return `/kids/${level}/${slug}?studentId=${student.id}`;
            }
            return '#'; // Fallback
        }

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

  const visibleStudents = useMemo(() => {
    return (displayedStudents || []).filter(student => 
        student.email !== 'ednacard87@gmail.com'
    );
  }, [displayedStudents]);

  return (
    <div className="flex w-full flex-col min-h-screen">
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-8">
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple overflow-hidden">
                <CardHeader className='bg-muted/30 border-b'>
                    <CardTitle>Panel de Administración</CardTitle>
                    <CardDescription>Gestión de estudiantes y monitoreo de misiones en tiempo real.</CardDescription>
                </CardHeader>
                <CardContent className='p-0'>
                    {isLoading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className='bg-muted/50'>
                                    <TableHead>Estudiante</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Programa</TableHead>
                                    <TableHead className='min-w-[180px]'>Misión Actual</TableHead>
                                    <TableHead>Cursos</TableHead>
                                    <TableHead>Unidades</TableHead>
                                    <TableHead>Clases</TableHead>
                                    <TableHead>Repasos</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visibleStudents.map((student) => {
                                    const courseIdsToShow = 
                                        student.selectedCourse === 'espanol' ? espanolCourseIds :
                                        student.selectedCourse === 'kids' ? kidsCourseIds :
                                        inglesCourseIds;

                                    return (
                                        <TableRow key={student.id} className='hover:bg-muted/10 transition-colors'>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 border-2 border-primary/20">
                                                        <AvatarImage src={student.profileImageUrl} alt={student.name} />
                                                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className='font-bold'>{student.name}</span>
                                                        <span className="text-[10px] text-muted-foreground">{new Date(student.dateJoined).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className='text-xs font-mono'>{student.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={student.isBlocked ? 'destructive' : 'secondary'} className='text-[10px] font-bold'>
                                                    {student.isBlocked ? 'BLOQUEADO' : 'ACTIVO'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize text-[10px] font-bold border-primary/30">{student.selectedCourse || 'Pendiente'}</Badge>
                                            </TableCell>
                                            <TableCell>
                                              {getReadableProgress(student)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-2 max-w-xs">
                                                    {courseIdsToShow.map(courseId => (
                                                        <Button
                                                            key={courseId}
                                                            size="sm"
                                                            variant={(student.unlockedCourses || []).includes(courseId) ? 'secondary' : 'outline'}
                                                            onClick={() => handleToggleCourseAccess(student.id, courseId, student.unlockedCourses || [])}
                                                            disabled={updatingStudentId === student.id}
                                                            className="h-7 text-[10px] px-2 font-bold"
                                                        >
                                                            {(student.unlockedCourses || []).includes(courseId) ? <Unlock className="mr-1 h-3 w-3 text-green-600" /> : <Lock className="mr-1 h-3 w-3 text-muted-foreground" />}
                                                            {courseId.toUpperCase()}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1 max-w-xs">
                                                    {student.selectedCourse === 'ingles' && courseIdsToShow.map(course => (
                                                        <DropdownMenu key={`${student.id}-unit-${course}`}>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="outline" size="sm" className="h-7 text-[10px] px-2">{course.toUpperCase()} U</Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent>
                                                                {Array.from({ length: unitCountsMap[course] || 0 }, (_, i) => i + 1).map(unitNum => {
                                                                    const unitKey = `${course}-unit-${unitNum}`;
                                                                    return (
                                                                        <DropdownMenuCheckboxItem
                                                                            key={unitKey}
                                                                            checked={(student.unlockedUnits || []).includes(unitKey)}
                                                                            onCheckedChange={() => handleToggleUnitAccess(student.id, unitKey)}
                                                                            disabled={updatingStudentId === student.id}
                                                                        >
                                                                            Unidad {unitNum}
                                                                        </DropdownMenuCheckboxItem>
                                                                    );
                                                                })}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1 max-w-xs">
                                                    {courseIdsToShow.map(course => (
                                                        <DropdownMenu key={`${student.id}-class-${course}`}>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="outline" size="sm" className="h-7 text-[10px] px-2">{course.toUpperCase()} C</Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent>
                                                                {student.selectedCourse === 'kids' ? (
                                                                    (kidsClassesMap[course as keyof typeof kidsClassesMap] || []).map(classInfo => (
                                                                        <DropdownMenuCheckboxItem
                                                                            key={classInfo.id}
                                                                            checked={(student.unlockedClasses || []).includes(classInfo.id)}
                                                                            onCheckedChange={() => handleToggleClassAccess(student.id, classInfo.id)}
                                                                            disabled={updatingStudentId === student.id}
                                                                        >
                                                                            {classInfo.name}
                                                                        </DropdownMenuCheckboxItem>
                                                                    ))
                                                                ) : student.selectedCourse === 'espanol' ? (
                                                                    (espanolClassesMap[course as keyof typeof espanolClassesMap] || []).map(classInfo => (
                                                                        <DropdownMenuCheckboxItem
                                                                            key={classInfo.id}
                                                                            checked={(student.unlockedClasses || []).includes(classInfo.id)}
                                                                            onCheckedChange={() => handleToggleClassAccess(student.id, classInfo.id)}
                                                                            disabled={updatingStudentId === student.id}
                                                                        >
                                                                            {classInfo.name}
                                                                        </DropdownMenuCheckboxItem>
                                                                    ))
                                                                ) : (
                                                                    Array.from({ length: ((classCountsMap as any)[course] || 15) - 1 }, (_, i) => i + 2).map(classNum => {
                                                                        const classId = `${course}-${classNum}`;
                                                                        return (
                                                                            <DropdownMenuCheckboxItem
                                                                                key={classId}
                                                                                checked={(student.unlockedClasses || []).includes(classId)}
                                                                                onCheckedChange={() => handleToggleClassAccess(student.id, classId)}
                                                                                disabled={updatingStudentId === student.id}
                                                                            >
                                                                                Clase {classNum}
                                                                            </DropdownMenuCheckboxItem>
                                                                        );
                                                                    })
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-2 items-start">
                                                    {student.selectedCourse === 'kids' ? (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="outline" size="sm" className="h-7 w-full text-[10px] px-2">KIDS <ChevronDown className="ml-1 h-3 w-3"/></Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent>
                                                                {Array.from({ length: repasosCountMap.kids }, (_, i) => {
                                                                    const key = `kids_r${i + 1}`;
                                                                    const isUnlocked = student.unlockedQuizzes?.[key] || false;
                                                                    return (
                                                                        <DropdownMenuCheckboxItem
                                                                            key={key}
                                                                            checked={isUnlocked}
                                                                            onCheckedChange={() => handleToggleRepasoAccess(student.id, key, isUnlocked)}
                                                                            disabled={updatingStudentId === student.id}
                                                                        >
                                                                            Repaso {i + 1}
                                                                        </DropdownMenuCheckboxItem>
                                                                    );
                                                                })}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    ) : student.selectedCourse === 'espanol' ? (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="outline" size="sm" className="h-7 w-full text-[10px] px-2">ESPAÑOL <ChevronDown className="ml-1 h-3 w-3"/></Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent>
                                                                {Array.from({ length: repasosCountMap.espanol }, (_, i) => {
                                                                    const key = `es_r${i + 1}`;
                                                                    const isUnlocked = student.unlockedQuizzes?.[key] || false;
                                                                    return (
                                                                        <DropdownMenuCheckboxItem
                                                                            key={key}
                                                                            checked={isUnlocked}
                                                                            onCheckedChange={() => handleToggleRepasoAccess(student.id, key, isUnlocked)}
                                                                            disabled={updatingStudentId === student.id}
                                                                        >
                                                                            Repaso {i + 1}
                                                                        </DropdownMenuCheckboxItem>
                                                                    );
                                                                })}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-1 max-w-[120px]">
                                                            {(student.unlockedCourses || []).map(courseId => {
                                                                const count = (repasosCountMap as any)[courseId] || 3;
                                                                return (
                                                                    <DropdownMenu key={`${student.id}-repaso-${courseId}`}>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="outline" size="sm" className="h-7 text-[10px] px-2">{courseId.toUpperCase()} R</Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent>
                                                                            <DropdownMenuLabel>Repasos {courseId.toUpperCase()}</DropdownMenuLabel>
                                                                            <DropdownMenuSeparator />
                                                                            {Array.from({ length: count }, (_, i) => {
                                                                                const key = `${courseId}_r${i + 1}`;
                                                                                const isUnlocked = student.unlockedQuizzes?.[key] || false;
                                                                                return (
                                                                                    <DropdownMenuCheckboxItem
                                                                                        key={key}
                                                                                        checked={isUnlocked}
                                                                                        onCheckedChange={() => handleToggleRepasoAccess(student.id, key, isUnlocked)}
                                                                                        disabled={updatingStudentId === student.id}
                                                                                    >
                                                                                        Repaso {i + 1}
                                                                                    </DropdownMenuCheckboxItem>
                                                                                );
                                                                            })}
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {updatingStudentId === student.id ? (
                                                    <Button variant="ghost" size="icon" disabled>
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    </Button>
                                                ) : (
                                                    <>
                                                        <Button variant="ghost" size="icon" onClick={() => handleToggleBlockStudent(student.id, !!student.isBlocked)}>
                                                            {student.isBlocked ? <Shield className="h-4 w-4 text-green-500" /> : <ShieldOff className="h-4 w-4" />}
                                                        </Button>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </main>
    </div>
  );
}
