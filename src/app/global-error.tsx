"use client";

import { useEffect } from "react";
import localFont from "next/font/local";
import "./globals.css";
import ErrorScreen from "@/components/ErrorScreen";

// global-error replaces the root layout when it renders, so it has to bring
// its own <html>/<body>, stylesheet and font.
const montserrat = localFont({
  src: "./fonts/montserrat-latin-variable.woff2",
  weight: "400 700",
  style: "normal",
  variable: "--font-montserrat",
  display: "swap",
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className={`${montserrat.variable} antialiased`}>
        <ErrorScreen
          title="Something went wrong"
          message="An unexpected error occurred. Please try again, or head back home."
          onRetry={reset}
        />
      </body>
    </html>
  );
}
