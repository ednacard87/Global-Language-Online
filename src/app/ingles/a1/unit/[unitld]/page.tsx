'use client';

import React, { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { MazeGame } from "@/components/dashboard/maze-game";
import { useParams } from 'next/navigation';
import Link from "next/link";
import { BookOpen, Flag, Footprints } from 'lucide-react';

export interface PathItem {
    type: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    href?: string;
}

export default function A1EngUnitPage() {
  const params = useParams();
  const unitId = params.unitId as string;
  const [pathItems, setPathItems] = useState<PathItem[]>([]);

  useEffect(() => {
    // Este código ignora el "mapa" y crea una lista de clases de prueba
    const hardcodedPath: PathItem[] = [
      { type: 'start', icon: Footprints, label: 'Inicio de Prueba' },
      { type: 'class', icon: BookOpen, label: `Clase de Prueba 1 (Unidad ${unitId})`, href: '#' },
      { type: 'class', icon: BookOpen, label: `Clase de Prueba 2 (Unidad ${unitId})`, href: '#' },
      { type: 'class', icon: BookOpen, label: `Clase de Prueba 3 (Unidad ${unitId})`, href: '#' },
      { type: 'end', icon: Flag, label: 'Final de Prueba' },
    ];
    setPathItems(hardcodedPath);
  }, [unitId]);

  return (
    <div className="flex w-full flex-col ingles-dashboard-bg min-h-screen">
      <DashboardHeader />
      <main className="flex flex-1 flex-col items-center gap-8 p-4 md:py-12">
        <div className="text-center">
            <h1 className="text-4xl font-bold text-brand-purple dark:text-primary">
              Unidad de Prueba {unitId}
            </h1>
            <Link href="/ingles/a1" className="text-sm font-bold text-primary hover:underline mt-2 inline-block">
                &larr; Volver al Curso A1
            </Link>
        </div>
        <div className="w-full max-w-4xl">
            <MazeGame 
                pathItems={pathItems} 
                title="Ruta de Prueba"
                description="Si ves esto, la página funciona. El problema es el archivo course-data.ts."
                isLoading={false}
            />
        </div>
      </main>
    </div>
  );
}
