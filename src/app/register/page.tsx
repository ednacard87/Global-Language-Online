'use client';

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc } from "firebase/firestore";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/context/language-context";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";

const avatarImages = PlaceHolderImages.filter(p => 
  p.id.startsWith('avatar-') || p.id === 'guide-fish' || p.id === 'clown-fish-guide'
);

const guideFishImage = avatarImages.find(p => p.id === 'guide-fish');

const formSchema = z
  .object({
    name: z.string().min(1, { message: "El nombre es requerido." }),
    email: z.string().email({ message: "Por favor, introduce una dirección de correo electrónico válida." }),
    avatarUrl: z.string().url({ message: "Por favor, selecciona un avatar." }),
    course: z.enum(['ingles', 'espanol', 'kids'], {
      required_error: "Debes seleccionar un curso.",
    }),
    password: z
      .string()
      .min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
    repeatPassword: z.string(),
  })
  .refine((data) => data.password === data.repeatPassword, {
    message: "Las contraseñas no coinciden",
    path: ["repeatPassword"],
  });

export default function RegisterPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      repeatPassword: "",
      avatarUrl: guideFishImage?.imageUrl || avatarImages[0]?.imageUrl || "",
      course: undefined,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    createUserWithEmailAndPassword(auth, values.email, values.password)
      .then((userCredential) => {
        const user = userCredential.user;
        // Update Firebase Auth user profile
        return updateProfile(user, {
          displayName: values.name,
          photoURL: values.avatarUrl
        }).then(() => {
          const studentRef = doc(firestore, "students", user.uid);
          const studentData = {
            id: user.uid,
            name: values.name,
            email: user.email,
            dateJoined: new Date().toISOString(),
            profileImageUrl: values.avatarUrl,
            role: user.email === 'ednacard87@gmail.com' ? 'admin' : 'student',
            selectedCourse: values.course,
            isBlocked: false,
            isDeleted: false,
          };
          setDocumentNonBlocking(studentRef, studentData, {});
          router.push("/");
        });
      })
      .catch((error) => {
        toast({
          variant: "destructive",
          title: t('registerPage.errorTitle'),
          description: error.message,
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  return (
    <div className="flex w-full flex-col landing-page-container min-h-screen">
      <DashboardHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 p-4 md:p-8">
        <Card className="w-full max-w-md shadow-soft rounded-lg border-2 border-brand-purple">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('registerPage.createAccount')}</CardTitle>
            <CardDescription>
              {t('registerPage.description')}
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="grid gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('registerPage.nameLabel')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('registerPage.namePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('registerPage.emailLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('registerPage.emailPlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="grid gap-2">
                    <Label htmlFor="cellphone">{t('registerPage.cellphoneLabel')}</Label>
                    <Input id="cellphone" type="tel" placeholder={t('registerPage.cellphonePlaceholder')} />
                </div>
                 <FormField
                  control={form.control}
                  name="course"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>¿Qué curso deseas tomar?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="ingles" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Inglés
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="espanol" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Español
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="kids" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Niños (+10)
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>{t('registerPage.avatarLabel')}</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-3 gap-4"
                        >
                          {avatarImages.map((image) => (
                            <FormItem key={image.id} className="flex items-center justify-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value={image.imageUrl} id={image.id} className="sr-only" />
                              </FormControl>
                              <Label htmlFor={image.id} className={cn(
                                  "rounded-full border-4 border-transparent cursor-pointer transition-all hover:opacity-80",
                                  field.value === image.imageUrl && "border-primary ring-2 ring-primary"
                              )}>
                                <Image
                                  src={image.imageUrl}
                                  alt={image.description}
                                  width={80}
                                  height={80}
                                  className="rounded-full object-cover aspect-square"
                                  data-ai-hint={image.imageHint}
                                />
                              </Label>
                            </FormItem>
                          ))}
                        </RadioGroup>
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
                      <FormLabel>{t('registerPage.passwordLabel')}</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="repeatPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('registerPage.repeatPasswordLabel')}</FormLabel>
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
                  {isSubmitting ? t('registerPage.submittingButton') : t('registerPage.submitButton')}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  {t('registerPage.hasAccount')}{" "}
                  <Link href="/login" className="underline">
                    {t('registerPage.loginLink')}
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
