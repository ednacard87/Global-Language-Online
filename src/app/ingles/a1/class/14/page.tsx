
'use client';

import React, { Suspense } from 'react';
import Class14Content from '@/components/clases/A1/Class14Content';
import { useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Footer } from '@/components/footer';
import Link from 'next/link';

/**
 * RUTA ESPECÍFICA: CLASE 14 (A1)
 * -------------------------
 * Restauración de diseño maestro (Header, Footer, Background).
 */

function Class14PageContent() {
    const searchParams = useSearchParams();
    const targetStudentId = searchParams.get('studentId');

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-left text-white">
                        <Link href="/ingles/a1/unit/3" className="hover:underline text-sm font-bold text-primary flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" /> Volver a la Unidad 3
                        </Link>
                        <h1 className="text-4xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">
                            Clase 14 (A1)
                        </h1>
                    </div>
                    <Class14Content overrideStudentId={targetStudentId} />
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default function EngA1Class14Page() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        }>
            <Class14PageContent />
        </Suspense>
    );
}
