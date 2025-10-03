'use client';

import React from 'react';
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from '../contexts/ThemeContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        {children}
      </SessionProvider>
    </ThemeProvider>
  );
} 