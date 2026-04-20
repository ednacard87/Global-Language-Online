'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
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
import { ShieldOff, Shield, Lock, Unlock, Loader2 } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';

interface Student {
  id: string;
  name: string;
  email: string;
  dateJoined: string;
  isBlocked?: boolean;
  profileImageUrl?: string;
  progress?: Record<string, number>;
  unlockedQuizzes?: {
    quiz1?: boolean;
    quiz2?: boolean;
    finalQuiz?: boolean;
  };
  unlockedCourses?: string[];
  unlockedClasses?: string[];
  selectedCourse?: 'ingles' | 'espanol' | 'kids';
}

const inglesCourseIds = ['a1', 'a2', 'b1', 'b2'];
const espanolCourseIds = ['a1', 'a2'];
const kidsCourseIds = ['a1', 'a2', 'b1'];

export default function AdminDashboardPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [displayedStudents, setDisplayedStudents] = useState<Student[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingStudentId, setUpdatingStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (!firestore) return;

    const fetchStudents = async () => {
        setIsLoading(true);
        try {
            const studentsCollectionRef = collection(firestore, 'students');
            const querySnapshot = await getDocs(studentsCollectionRef);
            const studentsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Student[];
            setDisplayedStudents(studentsList);
        } catch (error: any) {
            console.error("Error fetching students: ", error);
            toast({
                variant: "destructive",
                title: "Error al Cargar",
                description: `No se pudieron cargar los estudiantes: ${error.message}`,
            });
        } finally {
            setIsLoading(false);
        }
    };

    fetchStudents();
  }, [firestore, toast]);


  const handleToggleBlockStudent = async (studentId: string, isBlocked: boolean) => {
    if (!firestore) return;
    setUpdatingStudentId(studentId);
    const studentRef = doc(firestore, 'students', studentId);
    const data = { isBlocked: !isBlocked };
    try {
      await setDoc(studentRef, data, { merge: true });
      // Update local state for immediate feedback
      setDisplayedStudents(prev => prev!.map(s => s.id === studentId ? {...s, isBlocked: !isBlocked} : s));
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

  const handleToggleQuizAccess = async (studentId: string, quiz: 'quiz1' | 'quiz2' | 'finalQuiz', currentStatus: boolean) => {
    if (!firestore) return;
    setUpdatingStudentId(studentId);
    const studentRef = doc(firestore, 'students', studentId);
    const data = { unlockedQuizzes: { ...displayedStudents?.find(s => s.id === studentId)?.unlockedQuizzes, [quiz]: !currentStatus } };
    try {
        await setDoc(studentRef, data, { merge: true });
        setDisplayedStudents(prev => prev!.map(s => s.id === studentId ? {...s, unlockedQuizzes: { ...s.unlockedQuizzes, [quiz]: !currentStatus } } : s));
        toast({
          title: "Acceso Actualizado",
          description: `El acceso para el ${quiz} ha sido ${!currentStatus ? 'concedido' : 'revocado'}.`,
        });
    } catch (error: any) {
        console.error("Error updating quiz access:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `No se pudo actualizar el acceso al quiz: ${error.message}`,
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
        setDisplayedStudents(prev => prev!.map(s => s.id === studentId ? {...s, unlockedCourses: updatedCourses } : s));
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
        setDisplayedStudents(prev => prev!.map(s => s.id === studentId ? {...s, unlockedClasses: updatedClasses } : s));
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

  const getReadableProgress = (student: Student): React.ReactNode => {
    const progress = student.progress;
    if (!progress || Object.keys(progress).length === 0) {
      return <span className="text-xs text-muted-foreground">Sin progreso</span>;
    }

    // Find the lesson with the highest progress that is less than 100
    const activeLesson = Object.entries(progress)
      .filter(([, value]) => value < 100)
      .sort((a, b) => b[1] - a[1])[0]; // Get the one with highest progress

    if (activeLesson) {
      const [key, value] = activeLesson;
      const name = key
        .replace('progress_', '')
        .replace(/_/g, ' ')
        .replace('a1 eng unit', 'Ing A1 U')
        .replace('class', 'Clase')
        .replace('kids', 'Niños')
        .replace('intro', 'Intro ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      return (
        <div className="flex flex-col">
          <span className="font-medium truncate max-w-[150px]">{name}</span>
          <span className="text-xs text-muted-foreground">{Math.round(value)}%</span>
        </div>
      );
    }

    const hasCompletedSomething = Object.values(progress).some(v => v >= 100);
    if (hasCompletedSomething) {
      return <span className="text-xs text-green-600 font-medium">Completado</span>;
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
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardHeader>
                    <CardTitle>Admin Dashboard</CardTitle>
                    <CardDescription>Manage students and their progress.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && !displayedStudents ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Curso</TableHead>
                                    <TableHead>Curso Actual</TableHead>
                                    <TableHead>Acceso a Cursos</TableHead>
                                    <TableHead>Acceso a Clases</TableHead>
                                    <TableHead>Acceso a Quizzes</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visibleStudents.map((student) => {
                                    const courseIdsToShow = 
                                        student.selectedCourse === 'espanol' ? espanolCourseIds :
                                        student.selectedCourse === 'kids' ? kidsCourseIds :
                                        inglesCourseIds;
                                    return (
                                        <TableRow key={student.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={student.profileImageUrl} alt={student.name} />
                                                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span>{student.name}</span>
                                                        <span className="text-xs text-muted-foreground">{new Date(student.dateJoined).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{student.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={student.isBlocked ? 'destructive' : 'secondary'}>
                                                    {student.isBlocked ? 'Blocked' : 'Active'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">{student.selectedCourse}</Badge>
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
                                                            className="h-8"
                                                        >
                                                            {(student.unlockedCourses || []).includes(courseId) ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                                                            {courseId.toUpperCase()}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1 max-w-xs">
                                                    {courseIdsToShow.map(course => (
                                                        <DropdownMenu key={`${student.id}-${course}`}>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="outline" size="sm" className="h-8">{course.toUpperCase()}</Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent>
                                                                {Array.from({ length: 14 }, (_, i) => i + 2).map(classNum => { // Classes 2-15
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
                                                                })}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-2 items-start">
                                                    <Button
                                                        size="sm"
                                                        variant={student.unlockedQuizzes?.quiz1 ? 'secondary' : 'outline'}
                                                        onClick={() => handleToggleQuizAccess(student.id, 'quiz1', !!student.unlockedQuizzes?.quiz1)}
                                                        disabled={updatingStudentId === student.id}
                                                    >
                                                        {student.unlockedQuizzes?.quiz1 ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                                                        Quiz 1
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant={student.unlockedQuizzes?.quiz2 ? 'secondary' : 'outline'}
                                                        onClick={() => handleToggleQuizAccess(student.id, 'quiz2', !!student.unlockedQuizzes?.quiz2)}
                                                        disabled={updatingStudentId === student.id}
                                                    >
                                                        {student.unlockedQuizzes?.quiz2 ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                                                        Quiz 2
                                                    </Button>
                                                    {student.selectedCourse === 'kids' && (
                                                        <Button
                                                            size="sm"
                                                            variant={student.unlockedQuizzes?.finalQuiz ? 'secondary' : 'outline'}
                                                            onClick={() => handleToggleQuizAccess(student.id, 'finalQuiz', !!student.unlockedQuizzes?.finalQuiz)}
                                                            disabled={updatingStudentId === student.id}
                                                        >
                                                            {student.unlockedQuizzes?.finalQuiz ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                                                            Quiz Final
                                                        </Button>
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
    