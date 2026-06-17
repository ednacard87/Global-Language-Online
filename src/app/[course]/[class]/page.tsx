'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/header';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/**
 * ENRUTADOR DINÁMICO UNIVERSAL MAESTRO (SUPERVISIÓN ADMIN HABILITADA)
 * ------------------------------------------------------------------
 * Ahora permite pasar un 'targetStudentId' para que el admin pueda calificar remotamente.
 */

const courseFolderMap: Record<string, string> = {
  'a1': 'A1',
  'a2': 'A2',
  'b1': 'B1',
  'b2': 'B2',
  'espanol': 'Espanol',
  'espanol-a1': 'Espanol/A1',
  'espanol-a2': 'Espanol/A2',
  'espanol-b1': 'Espanol/B1',
  'espanol-b2': 'Espanol/B2',
  'kids': 'Kids',
  'kids-a1': 'Kids/A1',
  'kids-a2': 'Kids/A2',
  'kids-b1': 'Kids/B1',
};

export default function UniversalClassPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  // Capturamos el studentId si viene de la URL (solo para admins)
  const targetStudentId = searchParams.get('studentId');

  // Normalización de parámetros
  const courseParam = (params.course as string)?.toLowerCase() || '';
  const classId = (params.class as string) || '';
  const folderName = courseFolderMap[courseParam] || courseParam.toUpperCase();

  const [ContentComponent, setContentComponent] = useState<React.ComponentType<any> | null>(null);
  const [errorStatus, setErrorStatus] = useState<'none' | 'not_found' | 'loading'>('loading');

  // Verificación de perfil de administrador
  const studentDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'students', user.uid) : null),
    [firestore, user]
  );
  const { data: currentUserProfile } = useDoc<{role?: string}>(studentDocRef);
  const isAdmin = currentUserProfile?.role === 'admin' || user?.email === 'ednacard87@gmail.com';

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  useEffect(() => {
    if (!folderName || !classId || isUserLoading || !user) return;

    const loadClassContent = async () => {
      setErrorStatus('loading');
      try {
        const DynamicComponent = dynamic(
          () => import(`@/components/clases/${folderName}/Class${classId}Content`).catch((err) => {
            setErrorStatus('not_found');
            throw err;
          }),
          {
            loading: () => <LoadingSpinner />,
            ssr: false
          }
        );

        setContentComponent(() => DynamicComponent);
        setErrorStatus('none');
      } catch (err) {
        setErrorStatus('not_found');
      }
    };

    loadClassContent();
  }, [folderName, classId, isUserLoading, user]);

  const LoadingSpinner = () => (
    <div className="flex h-[60vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm font-bold text-primary uppercase tracking-widest animate-pulse">Sincronizando Misión...</p>
      </div>
    </div>
  );

  const ComingSoonScreen = () => (
    <Card className="max-w-2xl mx-auto mt-20 border-dashed border-2 border-brand-purple bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden shadow-soft animate-in fade-in zoom-in duration-500">
      <CardHeader className="text-center pt-10">
        <div className="flex justify-center mb-6">
          <div className="p-5 bg-primary/10 rounded-full animate-bounce">
            <AlertCircle className="h-16 w-16 text-primary" />
          </div>
        </div>
        <CardTitle className="text-4xl font-black uppercase tracking-tighter text-primary">
          ¡Misión en Preparación!
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-8 pb-10">
        <p className="text-xl text-muted-foreground leading-relaxed px-6 text-foreground">
          Estamos preparando el contenido de la <span className="font-bold text-foreground">Clase {classId}</span>.
          <br />
          ¡Estará disponible muy pronto en tu radar!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="default" size="lg" className="rounded-full px-10 font-bold h-14 shadow-lg">
                <Link href="/">Volver al Panel</Link>
            </Button>
            <Button onClick={() => router.back()} variant="outline" size="lg" className="rounded-full px-10 font-bold h-14">
                <ArrowLeft className="mr-2 h-5 w-5" /> Regresar
            </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex w-full flex-col min-h-screen bg-background">
      <DashboardHeader />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {targetStudentId && isAdmin && (
            <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between">
               <div className='flex items-center gap-3'>
                  <div className='p-2 bg-yellow-500 rounded-full text-black'><AlertCircle className='h-5 w-5'/></div>
                  <p className='font-bold text-yellow-700 dark:text-yellow-400'>MODO SUPERVISIÓN ACTIVO: Estás calificando al estudiante {targetStudentId}</p>
               </div>
               <Button variant="outline" onClick={() => router.push(`/${courseParam}/${classId}`)} className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10">Salir</Button>
            </div>
          )}
          {isUserLoading || errorStatus === 'loading' ? (
            <LoadingSpinner />
          ) : errorStatus === 'not_found' ? (
            <ComingSoonScreen />
          ) : ContentComponent ? (
            <ContentComponent overrideStudentId={isAdmin ? targetStudentId : null} />
          ) : null}
        </div>
      </main>
    </div>
  );
}
