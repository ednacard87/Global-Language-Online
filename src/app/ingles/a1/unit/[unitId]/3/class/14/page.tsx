'use client';

import React from 'react';
import Class14Content from '@/components/clases/A1/Class14Content';
import { useSearchParams } from 'next/navigation';

export default function Class14Page() {
    const searchParams = useSearchParams();
    const studentId = searchParams.get('studentId');

    return (
        <Class14Content overrideStudentId={studentId} />
    );
}