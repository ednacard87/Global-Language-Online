'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/header';
import { Footer } from '@/components/footer';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, AlertCircle, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * ENRUTADOR DINÁMICO UNIVERSAL MAESTRO (SOLVED)
 * ------------------------------------------------------------------
 * Resuelve el error "Element type is invalid" mediante el patrón de 
 * función factoría para almacenar componentes en el estado.
 */

const courseFolderMap: Record<string, string> = {
  'ingles': 'A1',
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

const courseBgMap: Record<string, string> = {
    'a1': 'ingles-dashboard-bg',
    'a2': 'ingles-dashboard-bg',
    'b1': 'ingles-dashboard-bg',
    'b2': 'ingles-dashboard-bg',
    'ingles': 'ingles-dashboard-bg',
    'espanol': 'espanol-dashboard-bg',
    'espanol-a1': 'espanol-dashboard-bg',
    'espanol-a2': 'espanol-dashboard-bg',
    'espanol-b1': 'espanol-dashboard-bg',
    'espanol-b2': 'espanol-dashboard-bg',
    'kids': 'kids-page-container',
    'kids-a1': 'a1-kids-bg',
    'kids-a2': 'a2-kids-bg',
    'kids-b1': 'intro-adventure-container',
};

const LoadingSpinner = () => (
  <div className="flex h-[60vh] w-full items-center justify-center">
    <div className="flex flex-col items-center gap-4 text-primary">
      <Loader2 className="h-12 w-12 animate-spin" />
      <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Sincronizando Misión...</p>
    </div>
  </div>
);

const ComingSoonScreen = ({ folder, classId }: { folder: string, classId: string }) => (
  <Card className="max-w-2xl mx-auto mt-20 border-dashed border-2 border-brand-purple bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden shadow-soft animate-in fade-in zoom-in duration-500 text-foreground">
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
      <p className="text-xl text-muted-foreground leading-relaxed px-6">
        Estamos preparando el contenido de la <span className="font-bold text-foreground">Clase {classId}</span> en el sector <span className="font-bold text-foreground">{folder}</span>.
        <br />
        ¡Estará disponible muy pronto en tu radar!
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="default" size="lg" className="rounded-full px-10 font-bold h-14 shadow-lg">
              <Link href="/">Volver al Panel</Link>
          </Button>
      </div>
    </CardContent>
  </Card>
);

function ClassContentLoader() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const targetStudentId = searchParams.get('studentId');
  const courseParam = (params.course as string)?.toLowerCase() || '';
  const classId = (params.class as string) || '';
  const folderName = courseFolderMap[courseParam] || courseParam.toUpperCase();
  const bgClass = courseBgMap[courseParam] || 'bg-background';

  // PATRÓN SEGURO: Almacenamos el componente en una función para evitar ejecuciones prematuras del estado de React
  const [ContentComponent, setContentComponent] = useState<React.ComponentType<any> | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isLoadingComponent, setIsLoadingComponent] = useState(true);

  const studentDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'students', user.uid) : null),
    [firestore, user]
  );
  const { data: currentUserProfile } = useDoc<{role?: string}>(studentDocRef);
  const isAdmin = currentUserProfile?.role === 'admin' || user?.email === 'ednacard87@gmail.com';

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
      return;
    }

    if (!folderName || !classId || isUserLoading || !user) return;

    const loadClassContent = async () => {
      try {
        setIsLoadingComponent(true);
        setNotFound(false);
        // Carga dinámica robusta
        const mod = await import(`@/components/clases/${folderName}/Class${classId}Content`);
        if (mod && mod.default) {
          // Usamos el patrón de factoría para guardar la referencia a la función del componente
          setContentComponent(() => mod.default);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Error loading class content:", err);
        setNotFound(true);
      } finally {
        setIsLoadingComponent(false);
      }
    };

    loadClassContent();
  }, [folderName, classId, isUserLoading, user, router]);

  return (
    <div className={cn("flex w-full flex-col min-h-screen", bgClass)}>
      <DashboardHeader />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto text-foreground">
          {targetStudentId && isAdmin && (
            <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-sm">
               <div className='flex items-center gap-3'>
                  <div className='p-2 bg-yellow-500 rounded-full text-black'><Star className='h-5 w-5 fill-current'/></div>
                  <p className='font-black uppercase tracking-tighter text-sm text-yellow-700 dark:text-yellow-400'>MODO SUPERVISIÓN ACTIVO: {targetStudentId}</p>
               </div>
               <Button variant="outline" onClick={() => router.back()} className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10">Cerrar</Button>
            </div>
          )}
          
          {(isUserLoading || isLoadingComponent) ? (
              <LoadingSpinner />
          ) : notFound ? (
              <ComingSoonScreen folder={folderName} classId={classId} />
          ) : ContentComponent ? (
              <ContentComponent overrideStudentId={isAdmin ? targetStudentId : null} />
          ) : (
              <LoadingSpinner />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function UniversalClassPage() {
    return (
      <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
        <ClassContentLoader />
      </Suspense>
    );
}

