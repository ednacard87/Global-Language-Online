'use client';

import React, { useState } from "react";
import Link from "next/link";
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
import { Banknote, User, Landmark, Hash, Upload, Paperclip } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/context/language-context";

export default function PaymentPage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const { toast } = useToast();
    const { t } = useTranslation();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = () => {
        if (selectedFile) {
            // Placeholder for actual upload logic
            console.log("Uploading file:", selectedFile.name);
            toast({
                title: t('paymentPage.uploadSuccessTitle'),
                description: t('paymentPage.uploadSuccessDescription', { fileName: selectedFile.name }),
            });
            setSelectedFile(null); // Reset after upload
        }
    };

  return (
    <div className="flex w-full flex-col bg-background min-h-screen">
      <DashboardHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 p-4 md:p-8">
        <Card className="w-full max-w-lg shadow-soft rounded-lg border-2 border-brand-purple">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">{t('paymentPage.title')}</CardTitle>
            <CardDescription>
              {t('paymentPage.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 text-lg px-8 pb-8">
            <div className="flex items-center gap-4">
              <Landmark className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('paymentPage.bank')}</p>
                <p className="font-semibold">{t('paymentPage.bankName')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <User className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('paymentPage.accountHolder')}</p>
                <p className="font-semibold">{t('paymentPage.accountHolderName')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Banknote className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('paymentPage.accountType')}</p>
                <p className="font-semibold">{t('paymentPage.accountTypeName')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Hash className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('paymentPage.accountNumber')}</p>
                <p className="font-semibold">{t('paymentPage.accountNumberValue')}</p>
              </div>
            </div>
          </CardContent>
          <CardContent className="border-t pt-6 px-8">
            <div className="grid gap-4">
              <div className="text-center">
                <p className="font-semibold text-lg">{t('paymentPage.uploadProofTitle')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('paymentPage.uploadProofDescription')}
                </p>
              </div>
              <div className="grid w-full max-w-sm items-center gap-2 mx-auto">
                <Label htmlFor="payment-proof" className="cursor-pointer border-2 border-dashed border-muted-foreground/50 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <span className="mt-2 text-sm text-muted-foreground">
                    {selectedFile ? t('paymentPage.changeFile') : t('paymentPage.clickToUpload')}
                    </span>
                </Label>
                <Input id="payment-proof" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
              </div>
              {selectedFile && (
                <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  <span className="truncate">{selectedFile.name}</span>
                </div>
              )}
              <Button onClick={handleUpload} disabled={!selectedFile} className="w-full max-w-sm mx-auto">
                {t('paymentPage.confirmUpload')}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center gap-2 pt-6">
             <Button asChild variant="link">
                <Link href="/pricing">{t('paymentPage.backToPricing')}</Link>
            </Button>
            <p className="text-xs text-muted-foreground text-center">{t('paymentPage.paymentVerification')}</p>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
