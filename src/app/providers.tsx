'use client';

import React from 'react';
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from '../contexts/ThemeContext';
import { Toaster } from 'sonner';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        {children}
        <Toaster />
      </SessionProvider>
    </ThemeProvider>
  );
} 