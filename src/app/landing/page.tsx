'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { SiteLogo } from '@/components/icons';
import { useUser } from '@/firebase';

const HeroCard = ({
  title,
  description,
  buttonText,
  href,
  imageUrl,
  imageHint,
  cardClass,
}: {
  title: string;
  description: string;
  buttonText: string;
  href: string;
  imageUrl: string;
  imageHint: string;
  cardClass: string;
}) => (
  <Card
    className={`hero-card ${cardClass} relative flex flex-col justify-between overflow-hidden rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-300`}
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
      <div>
        <h2 className="text-5xl font-extrabold tracking-tight [text-shadow:_2px_2px_4px_rgba(0,0,0,0.7)]">
          {title}
        </h2>
        <p className="mt-2 text-lg max-w-xs">
          {description}
        </p>
      </div>
      <div className="mt-8">
        <Button asChild size="lg" className="w-full text-lg font-bold">
          <Link href={href}>{buttonText}</Link>
        </Button>
      </div>
    </div>
  </Card>
);

export default function LandingPage() {
    const { user } = useUser();
    const englishCardBg = PlaceHolderImages.find((p) => p.id === 'english-card-bg');
    const spanishCardBg = PlaceHolderImages.find((p) => p.id === 'spanish-card-bg');
    const kidsCardBg = PlaceHolderImages.find((p) => p.id === 'kids-card-bg');

  return (
    <div className="landing-page-container flex flex-col min-h-screen">
       <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold md:text-base">
            <SiteLogo className="h-8 w-8 text-white" />
            <span className="font-headline text-2xl font-bold text-white [text-shadow:_1px_1px_2px_rgba(0,0,0,0.5)]">Global English Online</span>
        </Link>
        {!user && (
             <div className="flex items-center gap-2">
                <Button asChild variant="outline" className="bg-white/10 text-white border-white/50 backdrop-blur-sm hover:bg-white/20">
                    <Link href="/login">LOGIN</Link>
                </Button>
                <Button asChild className="bg-blue-500 hover:bg-blue-600 text-white">
                    <Link href="/register">Registrarse</Link>
                </Button>
            </div>
        )}
      </header>

      <main className="flex-grow flex items-center justify-center">
        <div className="container px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <HeroCard
              title="INGLES (+16)"
              description="El idioma Global te espera. Domina el mundo y abre puertas."
              buttonText="¡COMENZAR AHORA!"
              href="/login"
              imageUrl={englishCardBg?.imageUrl || ''}
              imageHint={englishCardBg?.imageHint || 'woman headphones'}
              cardClass="english-card"
            />
            <HeroCard
              title="ESPAÑOL (+18)"
              description="Conecta con hispanohablantes y  Vive la Cultura Latina"
              buttonText="¡DESCUBRE MÁS!"
              href="/espanol"
              imageUrl={spanishCardBg?.imageUrl || ''}
              imageHint={spanishCardBg?.imageHint || 'person laptop'}
              cardClass="spanish-card"
            />
            <HeroCard
              title="Zona joven (niños +12)"
              description="Domina el idioma, Supera desafios y desbloquea niveles ."
              buttonText="¡ACEPTAR DESAFÍO!"
              href="/kids"
              imageUrl={kidsCardBg?.imageUrl || ''}
              imageHint={kidsCardBg?.imageHint || 'cartoon djs'}
              cardClass="kids-card"
            />
          </div>
          <p className="mt-12 text-center text-xl text-white [text-shadow:_1px_1px_2px_rgba(0,0,0,0.5)]">
            Una plataforma, tres mundos. Tu viaje de idiomas comienza aquí.
          </p>
        </div>
      </main>
    </div>
  );
}
