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

// Importación de componentes modularizados y blindados en el búnker global (Nivel B2)
import Class1Content from '@/components/clases/B2/Class1Content';
import Class2Content from '@/components/clases/B2/Class2Content';
import Class3Content from '@/components/clases/B2/Class3Content';
import Class4Content from '@/components/clases/B2/Class4Content';
import Class5Content from '@/components/clases/B2/Class5Content';
import Class6Content from '@/components/clases/B2/Class6Content';
import Class7Content from '@/components/clases/B2/Class7Content';
import Class8Content from '@/components/clases/B2/Class8Content';
import Class9Content from '@/components/clases/B2/Class9Content';
import Class10Content from '@/components/clases/B2/Class10Content';
import Class11Content from '@/components/clases/B2/Class11Content';
import Class12Content from '@/components/clases/B2/Class12Content';
import Class13Content from '@/components/clases/B2/Class13Content';
import Class14Content from '@/components/clases/B2/Class14Content';
import Class15Content from '@/components/clases/B2/Class15Content';
import Class16Content from '@/components/clases/B2/Class16Content';
import Class17Content from '@/components/clases/B2/Class17Content';
import Class18Content from '@/components/clases/B2/Class18Content';
import Class19Content from '@/components/clases/B2/Class19Content';
import Class20Content from '@/components/clases/B2/Class20Content';

export default function EngB2DynamicClassPage() {
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
                            <Link href="/ingles/b2">Volver al curso B2</Link>
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
                    <div className="mb-8 text-left">
                        <Link href="/ingles/b2" className="hover:underline text-sm font-bold text-primary flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" /> Volver al Curso B2
                        </Link>
                        <h1 className="text-4xl font-bold text-white [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">
                            Clase {classId} (B2)
                        </h1>
                    </div>
                    {renderClassContent()}
                </div>
            </main>
        </div>
    );
}
