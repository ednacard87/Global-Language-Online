'use client';

import React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { DashboardHeader } from "@/components/dashboard/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore } from "@/firebase";
import { useTranslation } from "@/context/language-context";

const formSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce una dirección de correo electrónico válida." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }),
});

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const studentRef = doc(firestore, 'students', user.uid);
      const studentSnap = await getDoc(studentRef);

      if (studentSnap.exists() && studentSnap.data().isBlocked) {
        await auth.signOut(); // Sign out the blocked user
        toast({
          variant: "destructive",
          title: 'Account Blocked',
          description: 'Your account has been blocked. Please contact support.',
        });
        setIsSubmitting(false);
        return;
      }

      router.push("/");
    } catch (error: any) {
      let description = error.message;
      if (error.code === 'auth/invalid-credential') {
        description = t('loginPage.invalidCredentials');
      }
      toast({
        variant: "destructive",
        title: t('loginPage.errorTitle'),
        description: description,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex w-full flex-col landing-page-container min-h-screen">
      <DashboardHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 p-4 md:p-8">
        <Card className="w-full max-w-md shadow-soft rounded-lg border-2 border-brand-purple">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('loginPage.welcomeBack')}</CardTitle>
            <CardDescription>
              {t('loginPage.description')}
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="grid gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('loginPage.emailLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('loginPage.emailPlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('loginPage.passwordLabel')}</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? t('loginPage.submittingButton') : t('loginPage.submitButton')}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  {t('loginPage.noAccount')}{" "}
                  <Link href="/register" className="underline">
                    {t('loginPage.registerLink')}
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </main>
    </div>
  );
}
