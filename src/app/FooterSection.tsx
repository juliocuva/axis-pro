import React from 'react';

export default function FooterSection() {
    return (
        <footer className="bg-[#020814] border-t border-white/5 py-12 px-6 md:px-12 relative z-20">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center lg:items-start justify-between gap-10 lg:gap-16">
                
                {/* Left Side: Logos */}
                <div className="flex items-center gap-6 lg:gap-8 opacity-80 hover:opacity-100 transition-opacity">
                    <img 
                        src="/mouselab.webp" 
                        alt="MouseLab" 
                        className="h-10 md:h-12 object-contain brightness-0 invert" 
                        onError={(e) => {
                            // Fallback to png if webp fails
                            (e.target as HTMLImageElement).src = "/mouselab.png";
                        }}
                    />
                    <div className="w-px h-12 bg-white/10"></div>
                    <img 
                        src="/logo.png" 
                        alt="AXISone COFFEE" 
                        className="h-8 md:h-10 object-contain brightness-0 invert" 
                    />
                </div>

                {/* Right Side: Legal Text */}
                <div className="flex-1 max-w-3xl text-center lg:text-right space-y-4">
                    <h4 className="text-white font-bold text-sm md:text-base">
                        Intellectual Property Notice © {new Date().getFullYear()} Mouselab. All rights reserved.
                    </h4>
                    
                    <p className="text-white/40 text-[10px] md:text-xs leading-relaxed font-medium">
                        Mouselab is the sole owner of all intellectual property rights, trade secrets, and copyrights covering the software architecture, Artificial Intelligence algorithms, and visual designs presented herein.
                    </p>
                    
                    <p className="text-white/40 text-[10px] md:text-xs leading-relaxed font-medium">
                        <span className="font-bold text-white/60">AXISone COFFEE</span> is a registered trademark of Mouselab. Access to this material, demonstration, or links does not constitute a license of use, transfer of rights, or authorization for reverse engineering, total, or partial reproduction. Any unauthorized use will be prosecuted under global intellectual property laws and WIPO international treaties.
                    </p>
                </div>

            </div>
        </footer>
    );
}
