'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/language-context';

export const numbersWithAudio: { number: string; name: string; audioSrc: string | null; }[] = [
    { number: '1', name: 'one', audioSrc: '/Audio/Numbers/Numbers0/one.mp3' },
    { number: '2', name: 'two', audioSrc: '/Audio/Numbers/Numbers0/two.mp3' },
    { number: '3', name: 'three', audioSrc: '/Audio/Numbers/Numbers0/three.mp3' },
    { number: '4', name: 'four', audioSrc: '/Audio/Numbers/Numbers0/four.mp3' },
    { number: '5', name: 'five', audioSrc: '/Audio/Numbers/Numbers0/five.mp3' },
    { number: '6', name: 'six', audioSrc: '/Audio/Numbers/Numbers0/six.mp3' },
    { number: '7', name: 'seven', audioSrc: '/Audio/Numbers/Numbers0/seven.mp3' },
    { number: '8', name: 'eight', audioSrc: '/Audio/Numbers/Numbers0/eight.mp3' },
    { number: '9', name: 'nine', audioSrc: '/Audio/Numbers/Numbers0/nine.mp3' },
    { number: '10', name: 'ten', audioSrc: '/Audio/Numbers/Numbers0/ten.mp3' },
    { number: '11', name: 'eleven', audioSrc: '/Audio/Numbers/Numbers0/eleven.mp3' },
    { number: '12', name: 'twelve', audioSrc: '/Audio/Numbers/Numbers0/twelve.mp3' },
    { number: '13', name: 'thirteen', audioSrc: '/Audio/Numbers/Numbers0/thirteen.mp3' },
    { number: '14', name: 'fourteen', audioSrc: '/Audio/Numbers/Numbers0/fourteen.mp3' },
    { number: '15', name: 'fifteen', audioSrc: '/Audio/Numbers/Numbers0/fifteen.mp3' },
    { number: '16', name: 'sixteen', audioSrc: '/Audio/Numbers/Numbers0/sixteen.mp3' },
    { number: '17', name: 'seventeen', audioSrc: '/Audio/Numbers/Numbers0/seventeen.mp3' },
    { number: '18', name: 'eighteen', audioSrc: '/Audio/Numbers/Numbers0/eighteen.mp3' },
    { number: '19', name: 'nineteen', audioSrc: '/Audio/Numbers/Numbers0/nineteen.mp3' },
    { number: '20', name: 'twenty', audioSrc: '/Audio/Numbers/Numbers0/twenty.mp3' },
    { number: '30', name: 'thirty', audioSrc: '/Audio/Numbers/Numbers0/thirty.mp3' },
    { number: '40', name: 'forty', audioSrc: '/Audio/Numbers/Numbers0/forty.mp3' },
    { number: '50', name: 'fifty', audioSrc: '/Audio/Numbers/Numbers0/fifty.mp3' },
    { number: '60', name: 'sixty', audioSrc: '/Audio/Numbers/Numbers0/sixty.mp3' },
    { number: '70', name: 'seventy', audioSrc: '/Audio/Numbers/Numbers0/seventy.mp3' },
    { number: '80', name: 'eighty', audioSrc: '/Audio/Numbers/Numbers0/eighty.mp3' },
    { number: '90', name: 'ninety', audioSrc: '/Audio/Numbers/Numbers0/ninety.mp3' },
    { number: '100', name: 'one hundred', audioSrc: '/Audio/Numbers/Numbers0/onehundred.mp3' },
    { number: '200', name: 'two hundred', audioSrc: null },
    { number: '300', name: 'three hundred', audioSrc: null },
    { number: '400', name: 'four hundred', audioSrc: null },
    { number: '500', name: 'five hundred', audioSrc: null },
    { number: '1,000', name: 'one thousand', audioSrc: null },
    { number: '1,000,000', name: 'one million', audioSrc: null }
];


export function NumbersGrid({ highlightedItem, onHighlight }: { highlightedItem: string | null; onHighlight: (number: string) => void; }) {
    const { toast } = useToast();
    const { t } = useTranslation();
    const [playingAudio, setPlayingAudio] = useState<string | null>(null);

    const playAudio = (audioSrc: string, number: string) => {
        if (playingAudio || !audioSrc) return;
        setPlayingAudio(audioSrc);
        onHighlight(number);
        const audio = new Audio(audioSrc);

        const onCanPlay = () => {
            audio.play().catch(e => {
                setPlayingAudio(null);
            });
            audio.removeEventListener('canplaythrough', onCanPlay);
            audio.removeEventListener('error', onError);
        };
        
        const onEnded = () => {
            setPlayingAudio(null);
            audio.removeEventListener('ended', onEnded);
        };

        const onError = () => {
            toast({
                variant: "destructive",
                title: t('audio.errorTitle'),
                description: t('audio.playbackError'),
            });
            setPlayingAudio(null);
            audio.removeEventListener('canplaythrough', onCanPlay);
            audio.removeEventListener('error', onError);
        };
        
        audio.addEventListener('canplaythrough', onCanPlay);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onError);

        audio.load();
    };

    return (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 text-center">
            {numbersWithAudio.map(({ number, name, audioSrc }) => (
                <Card key={number} className={cn(
                    "p-3 flex flex-col items-center justify-center gap-1.5 transition-colors",
                     highlightedItem === number && "bg-primary/20"
                )}>
                    <span className={cn("font-bold", number.length > 3 ? "text-2xl" : "text-3xl")}>{number}</span>
                    <div className="flex items-center gap-1">
                        <span className="text-base text-muted-foreground capitalize">{name}</span>
                        {audioSrc ? (
                            <Button variant="ghost" size="icon" onClick={() => playAudio(audioSrc!, number)} disabled={!!playingAudio} className="h-6 w-6">
                                {playingAudio === audioSrc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
                            </Button>
                        ) : null}
                    </div>
                </Card>
            ))}
        </div>
    );
}
