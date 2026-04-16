'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useUser, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const SelectionCard = ({ title, description, imageUrl, imageHint, onSelect, cardClass }: { title: string; description: string; imageUrl: string; imageHint: string; onSelect: () => void; cardClass: string; }) => (
    <Card 
        onClick={onSelect}
        className={`hero-card ${cardClass} relative flex flex-col justify-between overflow-hidden rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-300 cursor-pointer text-white`}
    >
        <div className="absolute inset-0 z-0">
            <Image
                src={imageUrl}
                alt={description}
                fill
                className="object-cover"
                data-ai-hint={imageHint}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-end h-full p-8 text-white">
            <h2 className="text-5xl font-extrabold tracking-tight [text-shadow:_2px_2px_4px_rgba(0,0,0,0.7)]">
                {title}
            </h2>
            <p className="mt-2 text-lg max-w-xs">
                {description}
            </p>
        </div>
    </Card>
);

export default function SelectCoursePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);

    const studentDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'students', user.uid) : null),
        [firestore, user]
    );
    
    const englishCardBg = PlaceHolderImages.find((p) => p.id === 'english-card-bg');
    const spanishCardBg = PlaceHolderImages.find((p) => p.id === 'spanish-card-bg');
    const kidsCardBg = PlaceHolderImages.find((p) => p.id === 'kids-card-bg');

    const handleSelectCourse = async (course: 'ingles' | 'espanol' | 'kids') => {
        if (!studentDocRef || isUpdating) return;
        
        setIsUpdating(true);
        try {
            await updateDocumentNonBlocking(studentDocRef, { selectedCourse: course });
            toast({
                title: "Curso seleccionado",
                description: `¡Bienvenido al curso de ${course}!`,
            });
            // Redirect to the appropriate dashboard
            if (course === 'ingles') {
                router.push('/');
            } else {
                router.push(`/${course}`);
            }
        } catch (error) {
            console.error("Error updating course:", error);
            toast({
                variant: 'destructive',
                title: "Error",
                description: "No se pudo guardar tu selección. Inténtalo de nuevo."
            });
            setIsUpdating(false);
        }
    };
    
    if (isUserLoading || isUpdating) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="flex w-full flex-col landing-page-container min-h-screen">
            <DashboardHeader />
            <main className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="text-center mb-8 max-w-2xl">
                    <h1 className="text-4xl font-bold text-white [text-shadow:_1px_1px_2px_rgba(0,0,0,0.5)]">¡Bienvenido!</h1>
                    <p className="text-xl text-gray-200 mt-2">Para comenzar tu aventura, por favor selecciona el curso que deseas tomar.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
                    <SelectionCard
                      title="INGLÉS"
                      description="El idioma Global te espera. Domina el mundo y abre puertas."
                      onSelect={() => handleSelectCourse('ingles')}
                      imageUrl={englishCardBg?.imageUrl || ''}
                      imageHint={englishCardBg?.imageHint || 'woman headphones'}
                      cardClass="english-card"
                    />
                    <SelectionCard
                      title="ESPAÑOL"
                      description="Conecta con hispanohablantes y Vive la Cultura Latina"
                      onSelect={() => handleSelectCourse('espanol')}
                      imageUrl={spanishCardBg?.imageUrl || ''}
                      imageHint={spanishCardBg?.imageHint || 'person laptop'}
                      cardClass="spanish-card"
                    />
                    <SelectionCard
                      title="Zona Joven (niños +10)"
                      description="Domina el idioma, Supera desafios y desbloquea niveles ."
                      onSelect={() => handleSelectCourse('kids')}
                      imageUrl={kidsCardBg?.imageUrl || ''}
                      imageHint={kidsCardBg?.imageHint || 'cartoon djs'}
                      cardClass="kids-card"
                    />
                </div>
            </main>
        </div>
    );
}