import type { Metadata } from 'next';
import './globals.css';
import { StyledComponentsRegistry } from '@/lib/styled-components-registry';
import { AppShell } from '@/components/app-shell';

export const metadata: Metadata = {
  title: 'RolePilot AI | Job intelligence',
  description: 'A focused view of job opportunities for each candidate profile.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        <StyledComponentsRegistry>
          <AppShell>{children}</AppShell>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
