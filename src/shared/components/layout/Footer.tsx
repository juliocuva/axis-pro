'use client';

import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  if (pathname === '/signup' || pathname === '/login') {
    return null;
  }

  return (
    <footer className="w-full bg-brand-dark-navy border-t border-white/10 py-10 mt-auto z-50 text-white font-sans">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-8">
        
        {/* Logos Section */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="flex flex-col items-center gap-2">
            <Image 
              src="/mouselab.png" 
              alt="Mouselab Logo" 
              width={140} 
              height={45} 
              priority
              className="object-contain filter brightness-0 invert opacity-90 hover:opacity-100 transition-opacity duration-300 ease-in-out" 
            />
          </div>
          
          <div className="h-10 w-px bg-white/20 hidden sm:block"></div>
          
          <div className="flex flex-col items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="axisONE COFFEE Logo" 
              width={120} 
              height={40}
              priority 
              className="object-contain filter brightness-0 invert opacity-90 hover:opacity-100 transition-opacity duration-300 ease-in-out" 
            />
          </div>
        </div>

        {/* Text Section */}
        <div className="flex-1 text-[11px] sm:text-xs text-white/70 lg:text-right space-y-2 leading-relaxed max-w-4xl text-justify lg:text-right font-medium">
          <p className="font-bold text-white text-sm">
            Intellectual Property Notice © {new Date().getFullYear()} Mouselab. All rights reserved.
          </p>
          <p className="text-white/70">
            Mouselab is the sole owner of all intellectual property rights, trade secrets, and copyrights covering the software architecture, Artificial Intelligence algorithms, and visual designs presented herein.
          </p>
          <p className="text-white/60">
            <span className="inline-block">
              <span className="font-azonix text-white text-[0.92em]">AXIS</span>
              <span className="font-montserrat-black text-white">one</span>
            </span>{' '}
            COFFEE is a registered trademark of Mouselab. Access to this material, demonstration, or links does not constitute a license of use, transfer of rights, or authorization for reverse engineering, total, or partial reproduction. Any unauthorized use will be prosecuted under global intellectual property laws and WIPO international treaties.
          </p>
        </div>

      </div>
    </footer>
  );
}
