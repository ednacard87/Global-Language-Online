'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Video, CheckCircle, ArrowLeft } from 'lucide-react';

export default function TedTalks0Page() {
    const router = useRouter();
    const { user } = useUser();
    const firestore = useFirestore();
    const [isCompleting, setIsCompleting] = useState(false);

    const studentDocRef = useMemoFirebase(
      () => (user ? doc(firestore, 'students', user.uid) : null),
      [firestore, user]
    );

    const handleComplete = async () => {
        if (!studentDocRef) return;
        setIsCompleting(true);
        updateDocumentNonBlocking(studentDocRef, {
            'progress.progress_b1_ted_talks_0': 100
        });
        window.dispatchEvent(new CustomEvent('progressUpdated'));
        // We use the relative path to go back to the course page
        router.push('/ingles/b1');
    };

    return (
        <div className="flex w-full flex-col min-h-screen will-lesson-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8 flex flex-col items-center">
                <div className="w-full max-w-4xl space-y-6">
                    <div className="flex items-center gap-2">
                         <Button variant="ghost" asChild size="sm" className="text-white hover:bg-white/20">
                            <Link href="/ingles/b1">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver al curso
                            </Link>
                        </Button>
                    </div>
                    
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple overflow-hidden">
                        <CardHeader className="bg-muted/50 border-b">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-lg">
                                    <Video className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl">Ted x Talks 0</CardTitle>
                                    <CardDescription>Mira el video y completa la actividad para desbloquear la Unidad 1.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 aspect-video bg-black">
                            <iframe 
                                width="100%" 
                                height="100%" 
                                src="https://www.youtube.com/embed/wbftlDzIALA" 
                                title="Ted Talk Video" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                allowFullScreen
                            ></iframe>
                        </CardContent>
                        <CardFooter className="p-6 bg-muted/30 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                            <p className="text-sm text-muted-foreground text-center sm:text-left">
                                Una vez que hayas terminado de ver el video, haz clic en el botón para marcar como completado.
                            </p>
                            <Button onClick={handleComplete} disabled={isCompleting} className="w-full sm:w-auto">
                                {isCompleting ? "Guardando..." : "Marcar como Completado"}
                                <CheckCircle className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </main>
        </div>
    );
}
