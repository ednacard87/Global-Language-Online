'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/language-context';

export const alphabetWithPronunciation = [
    { letter: 'A', pronunciation: 'ei', audioSrc: '/Audio/Alphabet/A.mp3' }, { letter: 'B', pronunciation: 'bi', audioSrc: '/Audio/Alphabet/B.mp3' }, { letter: 'C', pronunciation: 'si', audioSrc: '/Audio/Alphabet/C.mp3' },
    { letter: 'D', pronunciation: 'di', audioSrc: '/Audio/Alphabet/D.mp3' }, { letter: 'E', pronunciation: 'i', audioSrc: '/Audio/Alphabet/E.mp3' }, { letter: 'F', pronunciation: 'ef', audioSrc: '/Audio/Alphabet/F.mp3' },
    { letter: 'G', pronunciation: 'yi', audioSrc: '/Audio/Alphabet/G.mp3' }, { letter: 'H', pronunciation: 'eich', audioSrc: '/Audio/Alphabet/H.mp3' }, { letter: 'I', pronunciation: 'ai', audioSrc: '/Audio/Alphabet/I.mp3' },
    { letter: 'J', pronunciation: 'yei', audioSrc: '/Audio/Alphabet/J.mp3' }, { letter: 'K', pronunciation: 'kei', audioSrc: '/Audio/Alphabet/K.mp3' }, { letter: 'L', pronunciation: 'el', audioSrc: '/Audio/Alphabet/L.mp3' },
    { letter: 'M', pronunciation: 'em', audioSrc: '/Audio/Alphabet/M.mp3' }, { letter: 'N', pronunciation: 'en', audioSrc: '/Audio/Alphabet/N.mp3' }, { letter: 'O', pronunciation: 'ou', audioSrc: '/Audio/Alphabet/O.mp3' },
    { letter: 'P', pronunciation: 'pi', audioSrc: '/Audio/Alphabet/P.mp3' }, { letter: 'Q', pronunciation: 'kiu', audioSrc: '/Audio/Alphabet/Q.mp3' }, { letter: 'R', pronunciation: 'ar', audioSrc: '/Audio/Alphabet/R.mp3' },
    { letter: 'S', pronunciation: 'es', audioSrc: '/Audio/Alphabet/S.mp3' }, { letter: 'T', pronunciation: 'ti', audioSrc: '/Audio/Alphabet/T.mp3' },
    { letter: 'U', pronunciation: 'iu', audioSrc: '/Audio/Alphabet/U.mp3' },
    { letter: 'V', pronunciation: 'vi', audioSrc: '/Audio/Alphabet/V.mp3' }, { letter: 'W', pronunciation: 'da-bliú', audioSrc: '/Audio/Alphabet/W.mp3' }, { letter: 'X', pronunciation: 'ex', audioSrc: '/Audio/Alphabet/X.mp3' },
    { letter: 'Y', pronunciation: 'guai', audioSrc: '/Audio/Alphabet/Y.mp3' }, { letter: 'Z', pronunciation: 'si', audioSrc: '/Audio/Alphabet/Z.mp3' }
];

export function AlphabetGrid({ highlightedItem, onHighlight }: { highlightedItem: string | null; onHighlight: (letter: string) => void; }) {
    const { toast } = useToast();
    const { t } = useTranslation();
    const [playingAudio, setPlayingAudio] = useState<string | null>(null);

    const playAudio = (audioSrc: string, letter: string) => {
        if (playingAudio) return;
        setPlayingAudio(audioSrc);
        onHighlight(letter);
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
                description: t('audio.loadError'),
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
        <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-8 gap-2 text-center">
            {alphabetWithPronunciation.map(({ letter, pronunciation, audioSrc }) => (
                <Card key={letter} className={cn(
                    "p-3 flex flex-col items-center justify-center gap-2 transition-colors",
                    highlightedItem === letter && "bg-primary/20"
                )}>
                    <span className="text-5xl font-bold">{letter}</span>
                    <div className="flex items-center gap-2">
                        <span className="text-lg text-muted-foreground">/{pronunciation}/</span>
                        <Button variant="ghost" size="icon" onClick={() => playAudio(audioSrc, letter)} disabled={!!playingAudio} className="h-8 w-8">
                            {playingAudio === audioSrc ? <Loader2 className="h-7 w-7 animate-spin" /> : <Volume2 className="h-7 w-7" />}
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    );
}
