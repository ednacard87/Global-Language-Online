import type {Metadata} from 'next';
import './globals.css';
import './landing/landing.css';
import { Toaster } from "@/components/ui/toaster";
import { Footer } from '@/components/footer';
import { ThemeProvider } from '@/components/theme-provider';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { LanguageProvider } from '@/context/language-context';

export const metadata: Metadata = {
  title: 'Global English Online',
  description: 'Your personalized learning dashboard.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen" suppressHydrationWarning>
          <ThemeProvider>
            <LanguageProvider>
              <FirebaseClientProvider>
                <div className='flex-1'>
                  {children}
                </div>
                <Footer />
                <Toaster />
              </FirebaseClientProvider>
            </LanguageProvider>
          </ThemeProvider>
      </body>
    </html>
  );
}
