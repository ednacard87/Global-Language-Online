"use client";

import * as React from "react";
import Image from "next/image";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { eachDayOfInterval, startOfWeek, endOfWeek, format, parseISO, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useIsMobile } from "@/hooks/use-mobile";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useTranslation } from "@/context/language-context";

export function WeeklyChart() {
  const { user } = useUser();
  const firestore = useFirestore();
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const chartConfig = {
    minutes: {
      label: t('weeklyChart.minutes'),
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  const studySessionsQuery = useMemoFirebase(() => {
      if (!user || !firestore || !isClient) return null;
  
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  
      return query(
          collection(firestore, 'students', user.uid, 'studySessions'),
          where('startTime', '>=', weekStart.toISOString())
      );
  }, [user, firestore, isClient]);
  
  const { data: studySessions, isLoading } = useCollection<{ startTime: string; durationMinutes: number }>(studySessionsQuery);
  
  const chartData = React.useMemo(() => {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
      const dayFormat = isMobile ? 'EEEEE' : 'eee';

      if (isLoading || !studySessions) {
          return weekDays.map(day => ({
              day: format(day, dayFormat, { locale: es }),
              minutes: 0,
          }));
      }
  
      const dailyTotals = weekDays.map(day => {
          const minutesForDay = studySessions
              .filter(session => isSameDay(parseISO(session.startTime), day))
              .reduce((total, session) => total + session.durationMinutes, 0);
  
          return {
              day: format(day, dayFormat, { locale: es }),
              minutes: minutesForDay,
          };
      });
  
      return dailyTotals;
  }, [studySessions, isLoading, isMobile]);
  
  const maxMinutes = 60;


  return (
    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
      <CardHeader>
        <CardTitle>{t('dashboard.weeklyPerformance')}</CardTitle>
        <CardDescription>{t('dashboard.weeklyPerformanceDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="md:col-span-2">
                <ChartContainer config={chartConfig} className="h-[250px]">
                <BarChart 
                    data={chartData}
                    margin={isMobile ? { top: 5, right: 10, left: -25, bottom: 0 } : { top: 5, right: 5, left: -15, bottom: 0 }}
                >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    />
                    <YAxis
                        domain={[0, maxMinutes]}
                        ticks={[0, 15, 30, 45, 60]}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                    />
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar dataKey="minutes" fill="var(--color-minutes)" radius={8} />
                </BarChart>
                </ChartContainer>
            </div>
            <div className="flex justify-center items-center">
                <Image
                    src="https://img.freepik.com/premium-vector/person-studies-laptop-neat-desk-surrounded-by-books-plants-warm-lighting-someone-is-studying-online_538213-143340.jpg"
                    alt="Persona estudiando"
                    width={250}
                    height={250}
                    className="rounded-lg object-cover"
                    data-ai-hint="illustration study"
                />
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
