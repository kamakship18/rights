import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/providers';
import { ChromeWrapper } from '@/components/layout/ChromeWrapper';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Actionable Justice OS — Rights exist. Access doesn\'t.',
    template: '%s | Justice OS',
  },
  description:
    'AI-powered platform that helps Indian citizens take action on their rights — from emergency SOS to autonomous legal follow-ups.',
  keywords: ['legal', 'justice', 'grievance', 'India', 'SOS', 'redressal'],
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbf7f2' },
    { media: '(prefers-color-scheme: dark)',  color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh antialiased bg-canvas text-ink">
        <Providers>
          <ChromeWrapper>{children}</ChromeWrapper>
        </Providers>
      </body>
    </html>
  );
}
