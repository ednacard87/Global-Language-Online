'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
    Loader2, 
    ArrowLeft, 
    Clock,
    Lock
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * COMPONENTE DE CLASE 16 (A1) - MÓDULO INDEPENDIENTE
 * -----------------------------------------------
 * Plantilla blindada para lecciones en desarrollo.
 */

export default function Class16Content() {
    const { t } = useTranslation();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const studentDocRef = useMemoFirebase(
      () => (user ? doc(firestore, 'students', user.uid) : null),
      [firestore, user]
    );
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string}>(studentDocRef);

    // BLINDAJE LIGHT: Control de flujo de carga inicial
    useEffect(() => {
        if (!isUserLoading && !isProfileLoading) {
            const timer = setTimeout(() => {
                setIsInitialLoading(false);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [isUserLoading, isProfileLoading]);

    if (isInitialLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-white font-bold tracking-widest animate-pulse uppercase">Sincronizando Misión...</p>
            </div>
        );
    }

    return (
        <div className="grid gap-8 md:grid-cols-12 animate-in fade-in duration-700">
            {/* Main Content Area: Mensaje en Desarrollo */}
            <div className="md:col-span-9 md:order-1 order-2 flex flex-col justify-center min-h-[500px]">
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/90 backdrop-blur-sm overflow-hidden py-10">
                    <CardHeader className="text-center pt-10">
                        <div className="flex justify-center mb-6">
                            <div className="p-5 bg-primary/10 rounded-full animate-bounce">
                                <Clock className="h-16 w-16 text-primary" />
                            </div>
                        </div>
                        <CardTitle className="text-4xl font-black uppercase tracking-tighter text-primary">
                            ¡Clase 16 en desarrollo!
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-8 pb-10">
                        <p className="text-xl text-muted-foreground leading-relaxed px-6">
                            Estamos preparando el contenido final de esta unidad para ti.
                            <br />
                            ¡Pronto completarás este gran nivel!
                        </p>
                        <div className="flex justify-center">
                            <Button asChild variant="default" size="lg" className="rounded-full px-10 font-bold h-14 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all active:scale-95">
                                <Link href="/ingles/a1/unit/3">
                                    <ArrowLeft className="mr-2 h-5 w-5" /> Volver al curso
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-center border-t pt-4 bg-muted/20">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Global English Online - Contenedor Blindado</p>
                    </CardFooter>
                </Card>
            </div>

            {/* Side Navigation Placeholder (Locked) */}
            <div className="md:col-span-3 md:order-2 order-1 text-left">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Misión Próximamente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <nav>
                            <ul className="space-y-1">
                                <li className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground/50 cursor-not-allowed">
                                    <Lock className="h-5 w-5 text-yellow-500" />
                                    <span>Contenido bloqueado</span>
                                </li>
                                <li className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground/50 cursor-not-allowed">
                                    <Lock className="h-5 w-5 text-yellow-500" />
                                    <span>Finalizar unidad</span>
                                </li>
                            </ul>
                        </nav>
                        <div className="mt-6 pt-6 border-t">
                            <div className="flex justify-between items-center text-xs mb-2 text-muted-foreground">
                                <span>Progreso</span>
                                <span className="font-bold text-foreground">0%</span>
                            </div>
                            <Progress value={0} className="h-1.5" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
