'use client';

import React from 'react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardHeader } from '@/components/dashboard/header';

export default function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
        <div className="flex w-full flex-col min-h-screen">
            <DashboardHeader />
            <main className="flex-1 flex items-center justify-center p-4">
                 <Card className="w-full max-w-md text-center shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>Acceso Denegado</CardTitle>
                        <CardDescription>
                            Necesitas iniciar sesión para ver esta página.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link href="/login">Ir a Iniciar Sesión</Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
  }

  return <>{children}</>;
}
