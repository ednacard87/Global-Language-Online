
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/language-context';

// Importación de componentes modularizados y blindados en el búnker global (Nivel A2)
import Class1Content from '@/components/clases/A2/Class1Content';
import Class2Content from '@/components/clases/A2/Class2Content';
import Class3Content from '@/components/clases/A2/Class3Content';
import Class4Content from '@/components/clases/A2/Class4Content';
import Class5Content from '@/components/clases/A2/Class5Content';

export default function EngA2DynamicClassPage() {
    const params = useParams();
    const router = useRouter();
    const { t } = useTranslation();
    const classId = params.classId as string;
    
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    
    const studentDocRef = useMemoFirebase(
      () => (user ? doc(firestore, 'students', user.uid) : null),
      [firestore, user]
    );
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string}>(studentDocRef);

    if (isUserLoading || isProfileLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    const renderClassContent = () => {
        switch (classId) {
            case '1': return <Class1Content />;
            case '2': return <Class2Content />;
            case '3': return <Class3Content />;
            case '4': return <Class4Content />;
            case '5': return <Class5Content />;
            default:
                return (
                    <div className="max-w-7xl mx-auto text-white text-center py-20">
                        <h1 className="text-4xl font-bold">Clase {classId} en desarrollo...</h1>
                        <Button asChild className="mt-8">
                            <Link href="/ingles/a2">Volver al curso</Link>
                        </Button>
                    </div>
                );
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen will-lesson-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-left">
                        <Link href="/ingles/a2" className="hover:underline text-sm font-bold text-white flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" /> Volver al Curso A2
                        </Link>
                        <h1 className="text-4xl font-bold text-white [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">
                            Clase {classId} (A2)
                        </h1>
                    </div>
                    {renderClassContent()}
                </div>
            </main>
        </div>
    );
}
