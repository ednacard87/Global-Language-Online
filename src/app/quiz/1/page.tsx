'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/language-context';
import { Loader2 } from 'lucide-react';
import { useUser, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';


export default function KidsQuiz1Page() {
    const { t } = useTranslation();
    const router = useRouter();
    const { user } = useUser();
    const firestore = useFirestore();

    const studentDocRef = useMemoFirebase(
      () => (user ? doc(firestore, 'students', user.uid) : null),
      [firestore, user]
    );

    const [isLoading, setIsLoading] = useState(false);

    const handleUnlockNext = async () => {
        if (!studentDocRef) return;
        setIsLoading(true);
        const progressKey = `quiz1Progress`;
        await updateDocumentNonBlocking(studentDocRef, { [`progress.${progressKey}`]: 100 });
        window.dispatchEvent(new CustomEvent('progressUpdated'));
        router.push('/intro/2');
        setIsLoading(false);
    };

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8 flex flex-col items-center justify-center">
                <Card className="w-full max-w-lg shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl font-bold">Wayground</CardTitle>
                        <CardDescription className='pt-2'>Preparado para tu quiz</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
                        <p>Haz clic en el enlace para realizar tu quiz.</p>
                        <Button asChild>
                            <Link href="https://wayground.com/admin" target="_blank" rel="noopener noreferrer">
                                Ir a Wayground
                            </Link>
                        </Button>
                    </CardContent>
                    <CardFooter className="flex flex-col items-center justify-center gap-4 pt-6 border-t">
                        <Button onClick={handleUnlockNext} disabled={isLoading} className="w-full max-w-sm mx-auto">
                            {isLoading ? <Loader2 className="animate-spin" /> : "Desbloquear Intro 2"}
                        </Button>
                        <Button variant="ghost" onClick={() => router.push('/intro')}>Volver al Laberinto</Button>
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
}
