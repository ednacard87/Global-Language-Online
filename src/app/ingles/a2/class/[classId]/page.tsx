'use client';

import React, { Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, ArrowLeft, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/language-context';

// Importación de componentes modularizados (Nivel A2)
import Class1Content from '@/components/clases/A2/Class1Content';
import Class2Content from '@/components/clases/A2/Class2Content';
import Class3Content from '@/components/clases/A2/Class3Content';
import Class4Content from '@/components/clases/A2/Class4Content';
import Class5Content from '@/components/clases/A2/Class5Content';
import Class6Content from '@/components/clases/A2/Class6Content';
import Class7Content from '@/components/clases/A2/Class7Content';
import Class8Content from '@/components/clases/A2/Class8Content';
import Class9Content from '@/components/clases/A2/Class9Content';
import Class10Content from '@/components/clases/A2/Class10Content';
import Class11Content from '@/components/clases/A2/Class11Content';
import Class12Content from '@/components/clases/A2/Class12Content';
import Class13Content from '@/components/clases/A2/Class13Content';
import Class14Content from '@/components/clases/A2/Class14Content';
import Class15Content from '@/components/clases/A2/Class15Content';
import Class16Content from '@/components/clases/A2/Class16Content';
import Class17Content from '@/components/clases/A2/Class17Content';
import Class18Content from '@/components/clases/A2/Class18Content';
import Class19Content from '@/components/clases/A2/Class19Content';
import Class20Content from '@/components/clases/A2/Class20Content';

function A2ClassPageContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useTranslation();
    
    const classId = params.classId as string;
    const targetStudentId = searchParams.get('studentId');
    
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    
    const studentDocRef = useMemoFirebase(
      () => (user ? doc(firestore, 'students', user.uid) : null),
      [firestore, user]
    );
    const { data: profile, isLoading: isProfileLoading } = useDoc<{role?: string}>(studentDocRef);

    if (isUserLoading || isProfileLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    // Si es la Clase 1, renderizamos el componente completo (que ya incluye el fondo y header)
    if (classId === '1') {
        return <Class1Content overrideStudentId={targetStudentId} />;
    }

    const isAdmin = profile?.role === 'admin' || user.email === 'ednacard87@gmail.com';

    const renderClassContent = () => {
        switch (classId) {
            case '2': return <Class2Content />;
            case '3': return <Class3Content />;
            case '4': return <Class4Content />;
            case '5': return <Class5Content />;
            case '6': return <Class6Content />;
            case '7': return <Class7Content />;
            case '8': return <Class8Content />;
            case '9': return <Class9Content />;
            case '10': return <Class10Content />;
            case '11': return <Class11Content />;
            case '12': return <Class12Content />;
            case '13': return <Class13Content />;
            case '14': return <Class14Content />;
            case '15': return <Class15Content />;
            case '16': return <Class16Content />;
            case '17': return <Class17Content />;
            case '18': return <Class18Content />;
            case '19': return <Class19Content />;
            case '20': return <Class20Content />;
            default:
                return (
                    <div className="max-w-7xl mx-auto text-white text-center py-20">
                        <h1 className="text-4xl font-bold">Clase {classId} en desarrollo...</h1>
                        <Button asChild className="mt-8">
                            <Link href="/ingles/a2">Volver al curso A2</Link>
                        </Button>
                    </div>
                );
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Banner de Supervisión */}
                    {targetStudentId && isAdmin && (
                        <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md">
                            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400">
                                <Star className="h-6 w-6 fill-current animate-pulse" />
                                <p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión: {targetStudentId}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => router.push('/admin')} className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10">
                                Volver al Panel
                            </Button>
                        </div>
                    )}

                    <div className="mb-8 text-left">
                        <Link href="/ingles/a2" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2">
                            <ArrowLeft className="h-4 w-4" /> Volver al Curso A2
                        </Link>
                        <h1 className="text-4xl font-black text-white [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)] uppercase tracking-tight">
                            Misión: Clase {classId} (A2) 🇬🇧
                        </h1>
                    </div>
                    {renderClassContent()}
                </div>
            </main>
        </div>
    );
}

export default function A2DynamicClassPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <A2ClassPageContent />
        </Suspense>
    );
}
