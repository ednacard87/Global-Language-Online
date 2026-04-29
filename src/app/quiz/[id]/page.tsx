'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/language-context';
import { Upload, Paperclip, Loader2 } from 'lucide-react';
import { extractQuizResult, ExtractQuizResultInput } from '@/ai/flows/extract-quiz-result-flow';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUser, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

function fileToDataUri(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
}

export default function QuizPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [extractedPercentage, setExtractedPercentage] = useState(0);

  const { toast } = useToast();
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const quizId = params.id;

  const { user } = useUser();
  const firestore = useFirestore();
  const studentDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'students', user.uid) : null),
    [firestore, user]
  );


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        toast({
            variant: "destructive",
            title: "Archivo no válido",
            description: "Por favor, sube solo archivos de imagen.",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSend = async () => {
    if (!selectedFile) {
        toast({
            variant: "destructive",
            title: "No hay archivo",
            description: "Por favor, selecciona una imagen para subir.",
        });
        return;
    }
    if (!studentDocRef) {
        toast({
            variant: "destructive",
            title: "Error de autenticación",
            description: "No se pudo guardar el progreso. Asegúrate de haber iniciado sesión.",
        });
        return;
    }

    setIsLoading(true);
    try {
        const imageDataUri = await fileToDataUri(selectedFile);
        const input: ExtractQuizResultInput = { imageDataUri };
        const result = await extractQuizResult(input);
        
        const percentage = result.percentage;
        setExtractedPercentage(percentage);

        const progressKey = `quiz${quizId}Progress`;
        updateDocumentNonBlocking(studentDocRef, {
            [`progress.${progressKey}`]: percentage,
        });
        
        window.dispatchEvent(new CustomEvent('progressUpdated'));
        
        setShowSuccessDialog(true);

    } catch (error) {
      console.error("Error extracting quiz result:", error);
      toast({
        variant: "destructive",
        title: "Error al analizar",
        description: "No se pudo leer el resultado del quiz. Por favor, intenta con otra imagen.",
      });
    } finally {
      setIsLoading(false);
      setSelectedFile(null);
    }
  };

  const handleUnlockNext = async () => {
    if (!studentDocRef) return;
    setIsLoading(true);
    const progressKey = `quiz1Progress`;
    await updateDocumentNonBlocking(studentDocRef, { [`progress.${progressKey}`]: 100 });
    window.dispatchEvent(new CustomEvent('progressUpdated'));
    router.push('/intro/2');
    setIsLoading(false);
  };

  const handleUnlockListeningPractice = async () => {
    if (!studentDocRef) {
      toast({
        variant: "destructive",
        title: "Error de autenticación",
        description: "No se pudo guardar el progreso. Asegúrate de haber iniciado sesión.",
      });
      return;
    }

    setIsLoading(true);
    try {
        const progressKey = `quiz2Progress`;
        updateDocumentNonBlocking(studentDocRef, {
            [`progress.${progressKey}`]: 100,
        });
        
        window.dispatchEvent(new CustomEvent('progressUpdated'));
        
        toast({
            title: "¡Éxito!",
            description: "Has desbloqueado la Práctica de Escucha y Escritura.",
        });

        router.push('/intro');

    } catch (error) {
        console.error("Error unlocking listening practice:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo desbloquear la siguiente lección.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (quizId === '1' || quizId === '2') {
      return (
        <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
            <p>Haz clic en el enlace para realizar tu quiz.</p>
            <Button asChild>
                <Link href="https://wayground.com/admin" target="_blank" rel="noopener noreferrer">
                    Ir a Wayground
                </Link>
            </Button>
        </CardContent>
      );
    }
    // Default content is the upload form
    return (
      <CardContent className="border-t pt-6 px-8">
          <div className="grid gap-4">
            <div className="text-center">
              <p className="font-semibold text-lg">Sube tus resultados</p>
              <p className="text-sm text-muted-foreground">
                Toma una captura de pantalla de tu resultado y súbela aquí.
              </p>
            </div>
            <div className="grid w-full max-w-sm items-center gap-2 mx-auto">
              <Label htmlFor="quiz-result" className="cursor-pointer border-2 border-dashed border-muted-foreground/50 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors">
                <Upload className="h-10 w-10 text-muted-foreground" />
                <span className="mt-2 text-sm text-muted-foreground">
                  {selectedFile ? "Cambiar imagen" : "Haz clic para subir imagen"}
                </span>
              </Label>
              <Input id="quiz-result" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
            </div>
            {selectedFile && (
              <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Paperclip className="h-4 w-4" />
                <span className="truncate">{selectedFile.name}</span>
              </div>
            )}
          </div>
        </CardContent>
    );
  };

  const renderFooter = () => {
    if (quizId === '1') {
      return (
        <CardFooter className="flex flex-col items-center justify-center gap-4 pt-6 border-t">
          <Button onClick={handleUnlockNext} disabled={isLoading} className="w-full max-w-sm mx-auto">
            {isLoading ? <Loader2 className="animate-spin" /> : "Desbloquear Intro 2"}
          </Button>
          <Button variant="ghost" onClick={() => router.push('/intro')}>Volver al Laberinto</Button>
        </CardFooter>
      );
    }
    if (quizId === '2') {
      return (
        <CardFooter className="flex flex-col items-center justify-center gap-4 pt-6 border-t">
          <Button onClick={handleUnlockListeningPractice} disabled={isLoading} className="w-full max-w-sm mx-auto">
            {isLoading ? <Loader2 className="animate-spin" /> : "Desbloquear Practica de Escucha y Escritura"}
          </Button>
          <Button variant="ghost" onClick={() => router.push('/intro')}>Volver al Laberinto</Button>
        </CardFooter>
      );
    }
    return (
      <CardFooter className="flex flex-col items-center justify-center gap-2 pt-6">
         <Button onClick={handleSend} disabled={!selectedFile || isLoading} className="w-full max-w-sm mx-auto">
            {isLoading ? <Loader2 className="animate-spin" /> : "Enviar"}
          </Button>
      </CardFooter>
    );
  };

  return (
    <>
      <div className="flex w-full flex-col ingles-dashboard-bg min-h-screen">
        <DashboardHeader />
        <main className="flex flex-1 flex-col items-center justify-center gap-6 p-4 md:p-8">
          <Card className="w-full max-w-lg shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">Wayground</CardTitle>
              <CardDescription className='pt-2'>Preparado para tu quiz</CardDescription>
            </CardHeader>
            {renderContent()}
            {renderFooter()}
          </Card>
        </main>
      </div>
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¡Resultados enviados!</AlertDialogTitle>
            <AlertDialogDescription>
              Hemos detectado una puntuación de {extractedPercentage}%. Tu progreso ha sido actualizado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => router.push('/intro')}>Volver al laberinto</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
