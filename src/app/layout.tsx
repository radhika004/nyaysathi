
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from '@/context/language-context';
import { ChatProvider } from '@/context/chat-context';
import { AuthProvider } from '@/context/auth-context';

export const metadata: Metadata = {
  title: 'NyaySathi | AI-Powered Legal Assistant',
  description: 'Instant legal guidance on Indian laws (IPC, Family, Tax) in multiple languages.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground selection:bg-primary selection:text-white">
        <AuthProvider>
          <LanguageProvider>
            <ChatProvider>
              {children}
              <Toaster />
            </ChatProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
