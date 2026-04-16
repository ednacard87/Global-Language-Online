'use client';

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/header";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Link from "next/link";
import { useTranslation } from "@/context/language-context";

const moneyImage = PlaceHolderImages.find(p => p.id === 'money-related');

export default function PricingPage() {
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const pricingTiers = React.useMemo(() => [
    {
      name: t("pricingPage.tier1Name"),
      price: t("pricingPage.tier1Price"),
      priceSuffix: t("pricingPage.tier1Suffix"),
      description: t("pricingPage.tier1Desc"),
      features: [
        t("pricingPage.tier1Feature1"),
        t("pricingPage.tier1Feature2"),
        t("pricingPage.tier1Feature3"),
      ],
      isPopular: false,
    },
    {
      name: t("pricingPage.tier2Name"),
      price: t("pricingPage.tier2Price"),
      priceSuffix: t("pricingPage.tier2Suffix"),
      description: t("pricingPage.tier2Desc"),
      features: [
          t("pricingPage.tier2Feature1"),
          t("pricingPage.tier2Feature2"),
          t("pricingPage.tier2Feature3"),
      ],
      isPopular: true,
    },
    {
      name: t("pricingPage.tier3Name"),
      price: t("pricingPage.tier3Price"),
      priceSuffix: t("pricingPage.tier3Suffix"),
      description: t("pricingPage.tier3Desc"),
      features: [
          t("pricingPage.tier3Feature1"),
          t("pricingPage.tier3Feature2"),
          t("pricingPage.tier3Feature3"),
      ],
      isPopular: false,
    },
  ], [t]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex w-full flex-col bg-background">
      <DashboardHeader />
      <main className="flex flex-1 flex-col items-center gap-6 p-4 md:p-8">
        <div className="text-center max-w-2xl mx-auto my-8">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl dark:text-primary">{t('pricingPage.title')}</h1>
            <p className="text-muted-foreground mt-4 text-lg">{t('pricingPage.description')}</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 w-full max-w-6xl">
          {pricingTiers.map((tier) => (
            <Card key={tier.name} className={`shadow-soft rounded-lg flex flex-col border-2 border-brand-purple ${tier.isPopular ? 'ring-2 ring-brand-purple' : ''}`}>
              <CardHeader className="relative">
                {tier.isPopular && <div className="absolute top-0 right-6 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 text-sm font-bold rounded-full">{t('pricingPage.popular')}</div>}
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <div className="text-4xl font-bold pt-4">{tier.price}<span className="text-lg font-normal text-muted-foreground">{tier.priceSuffix}</span></div>
                <CardDescription className="pt-1 !-mb-4">{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pt-0">
                <ul className="space-y-3 pt-6 border-t">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full" size="lg">
                    <Link href="/payment">{t('pricingPage.getStarted')}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="w-full max-w-6xl mt-12">
            <Card className="shadow-soft rounded-lg overflow-hidden border-2 border-brand-purple">
                <div className="grid md:grid-cols-2 items-center">
                    <div className="p-8 order-2 md:order-1">
                        <h3 className="text-3xl font-bold dark:text-primary">{t('pricingPage.investTitle')}</h3>
                        <p className="text-muted-foreground mt-4">{t('pricingPage.investDescription')}</p>
                        <Button asChild className="mt-6">
                            <Link href="/">{t('pricingPage.backToDashboard')}</Link>
                        </Button>
                    </div>
                     <div className="order-1 md:order-2 h-64 md:h-full w-full relative">
                        {moneyImage && <Image
                            src={moneyImage.imageUrl}
                            alt={moneyImage.description}
                            fill
                            className="object-cover"
                            data-ai-hint={moneyImage.imageHint}
                        />}
                    </div>
                </div>
            </Card>
        </div>
      </main>
    </div>
  );
}
