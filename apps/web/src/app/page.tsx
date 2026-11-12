'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function HomePage() {
  useEffect(() => {
    if (typeof (window as any).initPrototype === 'function') {
      (window as any).initPrototype();
    }
  }, []);

  return (
    <>
      <header>
        <div className="w nb">
          <a className="logo" href="#home">
            <span className="mk" id="lm" />
            Perfect
          </a>
          <nav className="nl" id="nl" aria-label="Main" />
          <a className="tl" href="#help">
            Sign in
          </a>
          <a className="btn k" href="#download">
            Get started
          </a>
          <button className="ib" id="th" aria-label="Toggle theme" />
          <button className="ib menu" id="mn" aria-label="Menu" />
        </div>
        <div className="mg" id="mg" />
      </header>
      <main id="app" suppressHydrationWarning />
      <div className="toast" id="toast" role="status" />
      <Script src="/prototype.js" strategy="afterInteractive" />
    </>
  );
}
