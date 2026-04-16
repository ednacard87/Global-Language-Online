'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import LandingPage from '@/app/landing/page';

interface Student {
    role?: 'admin' | 'student';
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const studentDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'students', user.uid) : null),
    [firestore, user]
  );
  const { data: studentProfile, isLoading: isProfileLoading } = useDoc<Student>(studentDocRef);

  const isLoading = isUserLoading || isProfileLoading;

  const isAdmin = useMemo(() => {
      if (isLoading || !user) return false;
      return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
  }, [isLoading, user, studentProfile]);

  useEffect(() => {
    // Only handle the redirect for logged-in but non-admin users.
    // The !user case is handled by the return statement.
    if (!isLoading && user && !isAdmin) {
      router.push('/');
    }
  }, [isLoading, user, isAdmin, router]);
  
  if (isLoading) {
      return (
          <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }
  
  if (!user) {
    return <LandingPage />;
  }

  if (!isAdmin) {
    // Show a loader while redirecting
    return (
        <div className="flex h-screen items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return <>{children}</>;
}
