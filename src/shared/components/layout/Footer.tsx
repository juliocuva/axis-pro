import Image from "next/image";

export default function Footer() {
  return (
    <footer className="w-full bg-bg-card border-t border-border-main py-8 mt-auto z-50">
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
              className="object-contain filter grayscale invert opacity-80 hover:opacity-100 transition-opacity duration-300 ease-in-out" 
            />
          </div>
          
          <div className="h-10 w-px bg-white/10 hidden sm:block"></div>
          
          <div className="flex flex-col items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="AXISONE COFFEE Logo" 
              width={120} 
              height={40}
              priority 
              className="object-contain opacity-80 hover:opacity-100 transition-opacity duration-300 ease-in-out" 
            />
          </div>
        </div>

        {/* Text Section */}
        <div className="flex-1 text-[10px] sm:text-xs text-zinc-500 lg:text-right space-y-2 leading-relaxed max-w-4xl text-justify lg:text-right">
          <p className="font-semibold text-zinc-400 text-sm">
            Aviso de Propiedad Intelectual &copy; 2026 Mouselab. Todos los derechos reservados.
          </p>
          <p>
            Mouselab es la entidad titular de todos los derechos de propiedad intelectual, secretos industriales y derechos de autor sobre la arquitectura de software, algoritmos de Inteligencia Artificial y diseños visuales presentados.
          </p>
          <p>
            AXISONE COFFEE es una marca comercial propiedad de Mouselab. El acceso a este material, demostración o enlaces no constituye una licencia de uso, transferencia de derechos ni permiso para la ingeniería inversa o reproducción total o parcial. Cualquier uso no autorizado será perseguido bajo las leyes de propiedad intelectual de la República de Colombia y los tratados internacionales de la OMPI (WIPO).

          </p>
        </div>

      </div>
    </footer>
  );
}
