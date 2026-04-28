"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, Flag, Footprints, ArrowRight, Puzzle, Ear, Mic, Lock, Loader2, ArrowDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { A1Icon, A2Icon, B1Icon, B2Icon } from "@/components/icons";
import { useTranslation } from "@/context/language-context";


interface PathItem {
    type: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    href?: string;
    locked?: boolean;
    progress?: number;
    className?: string;
    storageKey?: string;
}

const defaultPathItems: PathItem[] = [
    {type: 'start', icon: Footprints, label: 'dashboard.start'},
    {type: 'class', icon: BookOpen, label: 'dashboard.introductoryCourse', href: '/intro'},
    {type: 'class', icon: A1Icon, label: 'dashboard.courseA1', locked: true},
    {type: 'class', icon: A2Icon, label: 'dashboard.courseA2', locked: true},
    {type: 'class', icon: B1Icon, label: 'dashboard.courseB1', locked: true},
    {type: 'class', icon: B2Icon, label: 'dashboard.courseB2', locked: true},
    {type: 'end', icon: Flag, label: 'dashboard.end'},
];

const itemColors: { [key: string]: string } = {
    start: "bg-chart-1/20 text-chart-1",
    class: "bg-chart-3/20 text-chart-3",
    practice: "bg-chart-2/20 text-chart-2",
    end: "bg-chart-4/20 text-chart-4",
};

interface MazeGameProps {
    pathItems?: PathItem[];
    title?: string;
    description?: string;
    isLoading?: boolean;
    children?: React.ReactNode;
    isIntro?: boolean;
}

const PathItemComponent = ({ item, isClient, t, isIntro }: { item: PathItem, isClient: boolean, t: (key: string) => string, isIntro: boolean }) => {
    const itemContent = (
        <div className="relative flex flex-col items-center gap-2">
            <div className={cn(
                "flex h-24 w-24 items-center justify-center rounded-full transition-transform hover:scale-110 border-4", 
                isIntro ? "bg-gray-800/80 border-gray-600/80 text-cyan-400" : itemColors[item.type], 
                item.locked && (isIntro ? 'opacity-50 border-gray-700/60' : 'opacity-50'), 
                item.className
            )}>
                <item.icon className="h-10 w-10" />
            </div>
            <div className={cn("flex items-center flex-col gap-1 text-center w-24", isIntro ? "text-white" : "text-muted-foreground")}>
                <span className="text-sm font-medium">{isClient ? t(item.label) : ''}</span>
                {item.progress !== undefined && <span className={cn("text-sm font-bold", isIntro ? "text-white" : "text-foreground")}>{item.progress}%</span>}
            </div>
            {item.locked && (
                <div className={cn("absolute top-0 right-0 p-1 rounded-full shadow-md", isIntro ? "bg-gray-900" : "bg-background")}>
                    <Lock className="h-4 w-4 text-yellow-500" />
                </div>
            )}
        </div>
    );

    return item.href && !item.locked ? (
        <Link href={item.href} className="p-2 -m-2 rounded-lg transition-colors hover:bg-white/10">{itemContent}</Link>
    ) : (
        <div className={cn("p-2 -m-2", item.locked && "cursor-not-allowed")}>{itemContent}</div>
    );
};

export function MazeGame({ pathItems = defaultPathItems, title, description, isLoading = false, children, isIntro = false }: MazeGameProps) {
  const { t } = useTranslation();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  const finalTitle = title !== undefined ? title : (isClient ? t('dashboard.learningPath') : '');
  const finalDescription = description !== undefined ? description : (isClient ? t('dashboard.learningPathDescription') : '');

  // Special layout for intro page
  if (isIntro) {
      const topRowItems = pathItems.slice(0, 5);
      const bottomRowItems = pathItems.slice(5, 7);
      const endItem = pathItems.length > 7 ? pathItems[7] : null;

      return (
        <div className="p-4 md:p-8 bg-gray-900/50 text-white rounded-2xl border border-gray-700/50 backdrop-blur-sm">
            <h2 className="text-2xl font-bold">{finalTitle}</h2>
            <p className="text-gray-400 mt-1">{finalDescription}</p>
            {isLoading ? (
                 <div className="flex flex-1 justify-center items-center p-8 min-h-[150px]">
                    <Loader2 className="h-10 w-10 animate-spin text-white" />
                </div>
            ) : (
                <div className="mt-8 flex flex-col items-center gap-8">
                    {/* Top Row */}
                    <div className="flex flex-wrap items-start justify-center gap-x-4 gap-y-8">
                        {topRowItems.map((item, index) => (
                            <React.Fragment key={item.label}>
                                <PathItemComponent item={item} isClient={isClient} t={t} isIntro={true} />
                                {index < topRowItems.length - 1 && (
                                    <ArrowRight className="h-8 w-8 text-gray-500 hidden md:block self-center" />
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Arrow Down */}
                    {bottomRowItems.length > 0 && <ArrowDown className="h-8 w-8 text-gray-500" />}
                    
                    {/* Bottom Row */}
                    <div className="flex flex-wrap items-start justify-center gap-x-4 gap-y-8">
                         {bottomRowItems.map((item, index) => (
                            <React.Fragment key={item.label}>
                                <PathItemComponent item={item} isClient={isClient} t={t} isIntro={true} />
                                {index < bottomRowItems.length - 1 && (
                                    <ArrowRight className="h-8 w-8 text-gray-500 hidden md:block self-center" />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                    {/* Arrow Down to End */}
                    {endItem && <ArrowDown className="h-8 w-8 text-gray-500" />}

                    {/* End Item */}
                    {endItem && (
                         <div className="flex flex-wrap items-start justify-center gap-x-4 gap-y-8">
                            <PathItemComponent item={endItem} isClient={isClient} t={t} isIntro={true} />
                         </div>
                    )}
                </div>
            )}
            {children}
        </div>
      );
  }

  // Default layout for all other pages
  return (
    <Card className="h-full shadow-soft rounded-lg border-2 border-brand-purple flex flex-col">
        <CardHeader className="p-8">
            <CardTitle>{finalTitle}</CardTitle>
            <CardDescription>{finalDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 justify-center items-center p-8 min-h-[160px]">
            {isLoading ? (
                <div className="flex items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            ) : (
                <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
                    {pathItems.map((item, index) => {
                        return (
                            <React.Fragment key={item.label}>
                                <PathItemComponent item={item} isClient={isClient} t={t} isIntro={false} />
                                {index < pathItems.length - 1 && (
                                    <ArrowRight className="h-6 w-6 text-muted-foreground shrink-0 hidden md:block" />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            )}
        </CardContent>
        {children}
    </Card>
  );
}
