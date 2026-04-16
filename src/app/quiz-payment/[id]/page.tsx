'use client';

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Landmark, Hash, Sparkles } from "lucide-react";
import { useTranslation } from "@/context/language-context";
import { Separator } from "@/components/ui/separator";

export default function QuizPaymentPage() {
    const { t } = useTranslation();
    const params = useParams();
    const quizId = params.id;

  return (
    <div className="flex w-full flex-col ingles-dashboard-bg min-h-screen">
      <DashboardHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 p-4 md:p-8">
        <Card className="w-full max-w-lg shadow-soft rounded-lg border-2 border-brand-purple">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">{t('quizPaymentPage.title', { quizId: quizId as string })}</CardTitle>
            <CardDescription>
              {t('quizPaymentPage.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 px-8 pb-8">
            
            <div className="grid gap-6 text-lg">
                <div className="flex items-center justify-center text-center">
                    <div>
                        <p className="text-sm text-muted-foreground">{t('quizPaymentPage.price')}</p>
                        <p className="text-4xl font-bold">$30.000 <span className="text-lg font-normal text-muted-foreground">COP</span></p>
                    </div>
                </div>

                {quizId === '1' && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">{t('quizPaymentPage.or')}</span>
                      </div>
                    </div>

                    <div className="rounded-lg border-2 border-primary/50 bg-primary/10 p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                            <Sparkles className="h-6 w-6 text-primary" />
                            <h3 className="text-xl font-bold text-primary">{t('quizPaymentPage.promoTitle')}</h3>
                        </div>
                        <p className="mt-2 text-muted-foreground">{t('quizPaymentPage.promoDescription')}</p>
                        <p className="mt-2 text-3xl font-bold">$50.000 <span className="text-lg font-normal text-muted-foreground">COP</span></p>
                    </div>
                  </>
                )}
            </div>

            <Separator />
            
            <div className="grid gap-6 text-lg">
                <div className="flex items-center gap-4">
                  <Landmark className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('paymentPage.bank')}</p>
                    <p className="font-semibold">{t('paymentPage.bankName')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Hash className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('paymentPage.accountNumber')}</p>
                    <p className="font-semibold">{t('paymentPage.accountNumberValue')}</p>
                  </div>
                </div>
            </div>

          </CardContent>
           <CardFooter className="flex flex-col items-center justify-center gap-4 pt-6 border-t">
             <p className="text-sm text-muted-foreground text-center">{t('quizPaymentPage.howToUnlock')}</p>
             <Button asChild>
                <Link href={`/quiz/${quizId}`}>{t('quizPaymentPage.continueToQuiz')}</Link>
            </Button>
             <Button asChild variant="link">
                <Link href="/intro">{t('quizPaymentPage.backToIntro')}</Link>
            </Button>
           </CardFooter>
        </Card>
      </main>
    </div>
  );
}
