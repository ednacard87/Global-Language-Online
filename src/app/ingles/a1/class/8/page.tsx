'use client';

import React, { Suspense } from 'react';
import Class8Content from '@/components/clases/A1/Class8Content';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * RUTA ESPECÍFICA: CLASE 8 (A1)
 * ----------------------------
 * El diseño completo (Header y Fondo) ahora es manejado por el componente Class8Content.
 */

function Class8PageContent() {
    const searchParams = useSearchParams();
    const targetStudentId = searchParams.get('studentId');

    return (
        <Class8Content overrideStudentId={targetStudentId} />
    );
}

export default function EngA1Class8Page() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        }>
            <Class8PageContent />
        </Suspense>
    );
}
