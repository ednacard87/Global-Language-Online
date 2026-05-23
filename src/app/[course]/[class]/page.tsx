'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/header';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';

/**
 * ENRUTADOR DINÁMICO UNIVERSAL DE CLASES
 * --------------------------------------
 * Este archivo actúa como un shell limpio e indestructible que detecta 
 * el curso y la clase desde la URL para renderizar el componente 
 * correspondiente ubicado en 'src/components/clases/'.
 */

export default function UniversalClassPage() {
    const params = useParams();
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    
    const course = (params.course as string) || '';
    const classId = (params.class as string) || '';

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [isUserLoading, user, router]);

    if (isUserLoading || !user) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    const renderClassContent = () => {
        /**
         * LÓGICA DE RENDERIZADO MODULAR:
         * A medida que movamos el contenido, aquí se implementará el switch:
         * 
         * if (course === 'a1' && classId === '1') return <Class1Content />;
         * if (course === 'a1' && classId === '2') return <Class2Content />;
         * ...
         */
        
        return (
            <div className="max-w-3xl mx-auto text-center py-20 bg-card/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-brand-purple p-8 shadow-soft">
                <h1 className="text-4xl font-black text-primary uppercase tracking-tighter mb-4">
                    {course} - Clase {classId}
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                    El contenido de esta clase está siendo migrado a componentes independientes en:
                    <br />
                    <code className="mt-4 inline-block bg-muted px-4 py-2 rounded-full text-primary font-mono text-sm border">
                        src/components/clases/
                    </code>
                </p>
                <div className="mt-8 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-purple/30" />
                </div>
            </div>
        );
    };

    return (
        <div className="flex w-full flex-col min-h-screen">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {renderClassContent()}
                </div>
            </main>
        </div>
    );
}
