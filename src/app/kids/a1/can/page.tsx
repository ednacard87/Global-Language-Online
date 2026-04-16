'use client';
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useTranslation } from "@/context/language-context";

export default function CanPage() {
    const { t } = useTranslation();
    return (
        <div className="flex w-full flex-col min-h-screen a1-kids-bg">
          <DashboardHeader />
          <main className="flex-1 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <Link href={`/kids/a1`} className="hover:underline text-sm text-muted-foreground">
                    {t('kidsA1.backToA1')}
                </Link>
                <h1 className="text-4xl font-bold dark:text-primary">{t('kidsA1.can')}</h1>
              </div>
              <Card>
                <CardHeader><CardTitle>Contenido Próximamente</CardTitle></CardHeader>
                <CardContent><p>El contenido para esta lección estará disponible pronto.</p></CardContent>
              </Card>
            </div>
          </main>
        </div>
    );
}
