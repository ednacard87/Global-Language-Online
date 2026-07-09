'use client';

import React, { Suspense } from 'react';
import Class14Content from '@/components/clases/A1/Class14Content';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * RUTA PUENTE: CLASE 14 (A1)
 * -------------------------
 * Captura parámetros de búsqueda para permitir la supervisión remota del administrador.
 */

function Class14PageContent() {
    const searchParams = useSearchParams();
    const targetStudentId = searchParams.get('studentId');

    return (
        <Class14Content overrideStudentId={targetStudentId} />
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
