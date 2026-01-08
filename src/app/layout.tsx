"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import "./globals.css";
import { AnalyticsTracker } from "./analytics/track";
import { CartProvider } from "../context/CartContext";
import { ClientLayoutShell } from "../components/ClientLayoutShell";
import { Footer } from "../components/Footer";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [pixelId, setPixelId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch pixel ID from API
    fetch("/api/settings/pixel")
      .then((res) => res.json())
      .then((data) => {
        if (data.pixelId) {
          setPixelId(data.pixelId);
          // Initialize Facebook Pixel
          const script = document.createElement("script");
          script.innerHTML = `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${data.pixelId}');
            fbq('track', 'PageView');
          `;
          document.head.appendChild(script);

          const noscript = document.createElement("noscript");
          noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${data.pixelId}&ev=PageView&noscript=1" />`;
          document.body.appendChild(noscript);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <html lang="en">
      <body>
        <CartProvider>
          <AnalyticsTracker />
          <ClientLayoutShell>
            {children}
          </ClientLayoutShell>
        </CartProvider>
      </body>
    </html>
  );
}
