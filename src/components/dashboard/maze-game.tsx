"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, Flag, Footprints, ArrowRight, Puzzle, Ear, Mic, Lock, Loader2 } from "lucide-react";
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

export function MazeGame({ pathItems = defaultPathItems, title, description, isLoading = false, children }: MazeGameProps) {
  const { t } = useTranslation();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  const finalTitle = title !== undefined ? title : (isClient ? t('dashboard.learningPath') : '');
  const finalDescription = description !== undefined ? description : (isClient ? t('dashboard.learningPathDescription') : '');

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
                    const itemContent = (
                        <div className="relative flex flex-col items-center gap-2">
                            <div className={cn("flex h-20 w-20 items-center justify-center rounded-full transition-transform scale-105 border-2 border-brand-purple", itemColors[item.type], item.locked && 'opacity-50', item.className)}>
                                <item.icon className="h-10 w-10" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground">{isClient ? t(item.label) : ''}</span>
                                {item.progress !== undefined && <span className="text-sm font-bold text-foreground">{item.progress}%</span>}
                            </div>
                            {item.locked && (
                                <div className="absolute -top-1 -right-1 bg-background p-0.5 rounded-full">
                                    <Lock className="h-4 w-4 text-yellow-500" />
                                </div>
                            )}
                        </div>
                    );
                    
                    return (
                        <React.Fragment key={item.label}>
                            {item.href && !item.locked ? (
                                <Link href={item.href} className="p-2 -m-2 rounded-lg transition-colors hover:bg-muted/50">{itemContent}</Link>
                            ) : (
                                <div className={cn("p-2 -m-2", item.locked && "cursor-not-allowed")}>{itemContent}</div>
                            )}
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
