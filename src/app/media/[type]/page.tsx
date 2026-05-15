'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Video, CheckCircle, ArrowLeft, Mic, Newspaper, FileText, Music, CaseSensitive, PlayCircle, Smile, Ear, Tv } from 'lucide-react';

const mediaContent = {
  podcast: { 
    title: "Podcast Practice", 
    description: "Listen carefully to the discussion and try to identify the main points.",
    url: "https://www.youtube.com/embed/bdpyQm5l78o",
    icon: Mic,
    progressKey: 'progress_quick_podcast'
  },
  news: { 
    title: "News Update", 
    description: "Watch the latest news in English to stay informed and improve your vocabulary.",
    url: "https://www.youtube.com/embed/Ap-UM1O9RBU",
    icon: Newspaper,
    progressKey: 'progress_quick_news'
  },
  documentary: { 
    title: "Documentary Zone", 
    description: "Learn about the world while practicing your listening skills with high-quality content.",
    url: "https://www.youtube.com/embed/KpuIyXzv0G4",
    icon: FileText,
    progressKey: 'progress_quick_documentary'
  },
  music: { 
    title: "Music Experience", 
    description: "Music is a great way to learn rhythm and common expressions.",
    url: "https://www.youtube.com/embed/c0GmkFsS5pA?start=143",
    icon: Music,
    progressKey: 'progress_quick_music'
  },
  vocabulary: {
    title: "Vocabulary Mission",
    description: "Improve your vocabulary with this interactive session.",
    url: "https://www.youtube.com/embed/tmORJDin_10",
    icon: CaseSensitive,
    progressKey: 'progress_quick_vocabulary'
  },
  movie: { 
    title: "Movie Time", 
    description: "Watch this movie segment to improve your immersion and listening comprehension.",
    url: "https://www.youtube.com/embed/X_cqOEU-wUc?start=3593",
    icon: Tv,
    progressKey: 'progress_quick_movie'
  },
  // Kids Content
  kids_music: {
    title: "Kids Music Adventure",
    description: "Fun songs to help you learn English while you sing and dance!",
    url: "https://www.youtube.com/embed/3hiLTqaIG-g",
    icon: Music,
    progressKey: 'progress_kids_quick_music'
  },
  kids_vocabulary: {
    title: "Kids Vocabulary Mission",
    description: "Boost your English words with this fun session!",
    url: "https://www.youtube.com/embed/tmORJDin_10",
    icon: CaseSensitive,
    progressKey: 'progress_kids_quick_vocabulary'
  },
  // Spanish Content
  es_podcast: {
    title: "Podcast en Español",
    description: "Escucha atentamente este podcast para mejorar tu comprensión auditiva.",
    url: "https://www.youtube.com/embed/WRJnVyqVGpc",
    icon: Mic,
    progressKey: 'progress_es_quick_podcast'
  },
  es_video: {
    title: "Video de Práctica",
    description: "Mira este video y presta atención a las expresiones utilizadas.",
    url: "https://www.youtube.com/embed/7J-PYxCP1_Y",
    icon: PlayCircle,
    progressKey: 'progress_es_quick_video'
  },
  es_music: {
    title: "Música en Español",
    description: "Aprende ritmo y vocabulario a través de la música.",
    url: "https://www.youtube.com/embed/Zo_pyChNLpo",
    icon: Music,
    progressKey: 'progress_es_quick_music'
  },
  es_practica_verbal: {
    title: "Escucha",
    description: "Mejora tu fluidez y pronunciación con esta sesión interactiva.",
    url: "https://www.youtube.com/embed/Zg6IFi5J9Wc",
    icon: Ear,
    progressKey: 'progress_es_practica_verbal'
  }
};

export default function MediaViewerPage() {
    const params = useParams();
    const router = useRouter();
    const type = params.type as keyof typeof mediaContent;
    const content = mediaContent[type];
    
    const { user } = useUser();
    const firestore = useFirestore();
    const [isCompleting, setIsCompleting] = useState(false);

    const studentDocRef = useMemoFirebase(
      () => (user ? doc(firestore, 'students', user.uid) : null),
      [firestore, user]
    );

    if (!content) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Card className="p-8 text-center">
                    <CardTitle>Content Not Found</CardTitle>
                    <Button onClick={() => router.back()} className="mt-4">
                        Back
                    </Button>
                </Card>
            </div>
        );
    }

    const Icon = content.icon;
    const isKids = type.startsWith('kids_');
    const isSpanish = type.startsWith('es_');
    const bgClass = isSpanish ? 'espanol-dashboard-bg' : (isKids ? 'kids-page-container' : 'ingles-dashboard-bg');

    const handleComplete = async () => {
        if (!studentDocRef) return;
        setIsCompleting(true);
        updateDocumentNonBlocking(studentDocRef, {
            [`progress.${content.progressKey}`]: 100
        });
        window.dispatchEvent(new CustomEvent('progressUpdated'));
        router.back();
    };

    return (
        <div className={cn("flex w-full flex-col min-h-screen", bgClass)}>
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8 flex flex-col items-center">
                <div className="w-full max-w-4xl space-y-6">
                    <div className="flex items-center gap-2">
                         <Button variant="ghost" onClick={() => router.back()} size="sm" className="text-white hover:bg-white/20">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Button>
                    </div>
                    
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple overflow-hidden bg-card/90 backdrop-blur-sm">
                        <CardHeader className="bg-muted/50 border-b">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-lg text-primary">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl">{content.title}</CardTitle>
                                    <CardDescription>{content.description}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 aspect-video bg-black">
                            <iframe 
                                width="100%" 
                                height="100%" 
                                src={content.url} 
                                title={content.title}
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                allowFullScreen
                            ></iframe>
                        </CardContent>
                        <CardFooter className="p-6 bg-muted/30 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                            <p className="text-sm text-muted-foreground text-center sm:text-left">
                                Una vez que hayas terminado, haz clic en el botón para marcar como completado y volver.
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