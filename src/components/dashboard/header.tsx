'use client';

import * as React from "react";
import Link from "next/link";
import {
  BookOpen,
  LogIn,
  LogOut,
  Star,
  User as UserIcon,
  Lock,
  MessageCircle,
  UserPlus,
  Tv,
  Pencil,
  FileText,
  Globe,
  LayoutDashboard,
  Smile,
  Gamepad2,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { doc } from 'firebase/firestore';
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { SiteLogo } from "../icons";
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "../ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/context/language-context";

function UserNav() {
  const auth = useAuth();
  const { user } = useUser();
  const { t } = useTranslation();
  const firestore = useFirestore();

  const studentDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'students', user.uid) : null),
    [firestore, user]
  );
  const { data: studentProfile } = useDoc<{role?: string}>(studentDocRef);


  const handleLogout = () => {
    signOut(auth);
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
            <AvatarFallback>
                <UserIcon />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 rounded-xl" align="end" forceMount>
        <DropdownMenuItem disabled>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.displayName || 'Estudiante'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {studentProfile?.role === 'admin' && (
            <DropdownMenuItem asChild>
                <Link href="/admin" className="flex items-center">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Admin Dashboard
                </Link>
            </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('header.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


export function DashboardHeader() {
  const { user, isUserLoading } = useUser();
  const { t, setLanguage } = useTranslation();
  const router = useRouter();
  const firestore = useFirestore();

  const studentDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'students', user.uid) : null),
    [firestore, user]
  );
  const { data: studentProfile } = useDoc<{role?: string, selectedCourse?: 'ingles' | 'espanol' | 'kids'}>(studentDocRef);
  
  const isAdmin = studentProfile?.role === 'admin' || user?.email === 'ednacard87@gmail.com';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b bg-brand-lilac px-4 md:px-6">
      {/* Left */}
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <SiteLogo className="h-6 w-6" />
          <span className="hidden font-headline text-xl font-bold sm:inline-block">Global English Online</span>
        </Link>
      </div>
      
      {/* Center */}
      <div className="flex items-center justify-center gap-2">
          {user ? (
            (isAdmin || studentProfile?.selectedCourse === 'kids') && (
                <Button asChild className="bg-brand-blue text-blue-900 hover:bg-brand-blue/90 font-semibold">
                    <Link href="/kids">
                        <Smile/>
                        <span className="hidden sm:inline-block">{t('header.kids')}</span>
                    </Link>
                </Button>
            )
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <Button className="bg-brand-blue text-blue-900 hover:bg-brand-blue/90 font-semibold">
                  <Smile/>
                  <span className="hidden sm:inline-block">{t('header.kids')}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto border-brand-purple bg-background p-3">
                  <p className="text-center font-semibold" style={{ color: "hsl(var(--brand-purple))" }}>
                      {t('header.loginRequired')}
                  </p>
              </PopoverContent>
            </Popover>
          )}
          {user ? (
            (isAdmin || studentProfile?.selectedCourse === 'espanol') && (
                <Button asChild className="bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-semibold">
                    <Link href="/espanol">
                        <BookOpen/>
                        <span className="hidden sm:inline-block">{t('header.courses')}</span>
                    </Link>
                </Button>
            )
          ) : (
             <Popover>
              <PopoverTrigger asChild>
                <Button className="bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-semibold">
                    <BookOpen/>
                    <span className="hidden sm:inline-block">{t('header.courses')}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto border-brand-purple bg-background p-3">
                  <p className="text-center font-semibold" style={{ color: "hsl(var(--brand-purple))" }}>
                      {t('header.loginRequired')}
                  </p>
              </PopoverContent>
            </Popover>
          )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Globe className="h-5 w-5" />
                    <span className="sr-only">{t('header.language')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage('en')}>
                    {t('header.english')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('es')}>
                    {t('header.spanish')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
          <ThemeToggle />
          {isUserLoading ? (
            <Skeleton className="h-8 w-8 rounded-full" />
          ) : user ? (
            <UserNav />
          ) : (
            <>
              <Button asChild variant="ghost">
                  <Link href="/register" className="flex items-center gap-2">
                      <UserPlus />
                      <span className="hidden sm:inline-block">{t('header.register')}</span>
                  </Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-brand-teal to-brand-blue text-primary-foreground hover:from-brand-teal/90 hover:to-brand-blue/90">
                  <Link href="/login" className="flex items-center gap-2">
                      <LogIn />
                      <span className="hidden sm:inline-block">{t('header.login')}</span>
                  </Link>
              </Button>
            </>
          )}
      </div>
    </header>
  );
}
