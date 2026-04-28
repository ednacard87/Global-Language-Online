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

export function MazeGame({ pathItems = defaultPathItems, title, description, isLoading = false, children }: MazeGameProps) {
  const { t } = useTranslation();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  const finalTitle = title !== undefined ? title : (isClient ? t('dashboard.learningPath') : '');
  const finalDescription = description !== undefined ? description : (isClient ? t('dashboard.learningPathDescription') : '');

  // Special layout for intro page
  if (pathItems.length === 8 && finalTitle === t('introCoursePage.mazeTitle')) {
      const row1 = pathItems.slice(0, 4); // Items 0, 1, 2, 3
      const row2 = pathItems.slice(4, 6).reverse(); // Items 5, 4 (reversed)
      const row3 = pathItems.slice(6, 8); // Items 6, 7

      return (
        <div className="p-4 md:p-8 bg-gray-900/50 text-white rounded-2xl border border-gray-700/50 backdrop-blur-sm">
            <h2 className="text-2xl font-bold">{finalTitle}</h2>
            <p className="text-gray-400 mt-1">{finalDescription}</p>
            {isLoading ? (
                 <div className="flex flex-1 justify-center items-center p-8 min-h-[450px]">
                    <Loader2 className="h-10 w-10 animate-spin text-white" />
                </div>
            ) : (
                <>
                <div className="mt-8 relative hidden md:block">
                    {/* Row 1 */}
                    <div className="flex items-start justify-between">
                        {row1.map((item, index) => (
                            <React.Fragment key={`${item.label}-1`}>
                                <PathItemComponent item={item} isClient={isClient} t={t} isIntro={true} />
                                {index < row1.length - 1 && (
                                    <ArrowRight className="h-8 w-8 text-gray-500 mt-10" />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                    {/* Arrow to Row 2 */}
                    <ArrowDown className="h-8 w-8 text-gray-500 absolute top-[120px] right-[50px]"/>
                    {/* Row 2 */}
                    <div className="flex items-start justify-end mt-4">
                        <div className="flex items-center gap-8 mr-[120px]">
                            {row2.map((item, index) => (
                                <React.Fragment key={`${item.label}-2`}>
                                    {index > 0 && (
                                        <ArrowRight className="h-8 w-8 text-gray-500 rotate-180" />
                                    )}
                                    <PathItemComponent item={item} isClient={isClient} t={t} isIntro={true}/>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                     {/* Arrow to Row 3 */}
                    <ArrowDown className="h-8 w-8 text-gray-500 absolute top-[260px] right-1/2 -translate-x-[20px]"/>
                     {/* Row 3 */}
                    <div className="flex items-start justify-center mt-4 ml-[-15%]">
                        <div className="flex items-center gap-8">
                             {row3.map((item, index) => (
                                <React.Fragment key={`${item.label}-3`}>
                                    <PathItemComponent item={item} isClient={isClient} t={t} isIntro={true} />
                                    {index < row3.length - 1 && (
                                        <ArrowRight className="h-8 w-8 text-gray-500 mt-10" />
                                    )}
                                </React.Fragment>
                             ))}
                        </div>
                    </div>
                </div>

                {/* Mobile View - Fallback to simple wrap */}
                <div className="mt-8 md:hidden flex flex-wrap items-center justify-center gap-4">
                    {pathItems.map((item, index) => (
                        <React.Fragment key={item.label}>
                            <PathItemComponent item={item} isClient={isClient} t={t} isIntro={true} />
                            {index < pathItems.length - 1 && (
                                <ArrowDown className="h-6 w-6 text-gray-500 shrink-0" />
                            )}
                        </React.Fragment>
                    ))}
                </div>
                </>
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
