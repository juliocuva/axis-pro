import os

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\modules\supply\components\PurchaseForm.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    txt = f.read()

# State
if 'currentStep' not in txt:
    txt = txt.replace(
        "const [smartLinkText, setSmartLinkText] = useState('');",
        "const [smartLinkText, setSmartLinkText] = useState('');\n    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);\n    const nextStep = () => setCurrentStep(p => (min(p + 1, 3) as 1|2|3));\n    const prevStep = () => setCurrentStep(p => (max(p - 1, 1) as 1|2|3));".replace("min", "Math.min").replace("max", "Math.max")
    )

fs_start = txt.find('<fieldset')
fs_end = txt.find('</fieldset>') + 11

s1_start = txt.find('<section', fs_start)
p1_c_start = txt.find('<div className="flex flex-col', s1_start)
p1_end = txt.find('</section>', p1_c_start)
p1_html = txt[p1_c_start:p1_end]

s2_start = txt.find('<section', p1_end)
p2_dest_start = txt.find('<div className="grid grid-cols-1 gap-6">', s2_start)
p2_vp_start = txt.find('<div className="grid grid-cols-2 gap-4">', p2_dest_start)
p2_dest_html = txt[p2_dest_start:p2_vp_start]

p2_peso_start = txt.find('<NumericInput\n                                label="Cantidad Pack', p2_vp_start)
if p2_peso_start == -1: 
    # Try different line endings
    import re
    match = re.search(r'<NumericInput[\s\S]*?label="Cantidad Pack', txt[p2_vp_start:])
    if match: p2_peso_start = p2_vp_start + match.start()

p2_vp_html = txt[p2_vp_start:p2_peso_start]

p2_ai_start = txt.find('<AIPatternBox', p2_peso_start)
p2_peso_html = txt[p2_peso_start:p2_ai_start]

p2_ai_end = txt.find('</section>', p2_ai_start)
p2_ai_html = txt[p2_ai_start:p2_ai_end]

import re
submit_match = re.search(r'<button[\s\S]*?disabled={isSubmitting \|\| isAlreadyRegistered}[\s\S]*?REGISTRAR INGRESO Y PREPARAR PARA TRILLA[\s\S]*?</button>', txt)
submit_btn_html = submit_match.group(0) if submit_match else ''
submit_start = submit_match.start() if submit_match else -1
submit_end = submit_match.end() if submit_match else -1


new_fs = f'''            {{/* Stepper Wizard Header */}}
            <div className="flex justify-between items-center mb-8 relative px-4">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[calc(100%-2rem)] h-0.5 bg-white/5 z-0 mx-4">
                    <div className="h-full bg-brand-green/50 transition-all duration-500" style={{{{ width: `${{(currentStep - 1) * 50}}%` }}}}></div>
                </div>
                
                <button type="button" onClick={{() => setCurrentStep(1)}} className="relative z-10 flex flex-col items-center gap-2 group">
                    <div className={{`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-bg-main border-2 transition-all duration-500 ${{currentStep >= 1 ? 'border-brand-green shadow-[0_0_20px_rgba(0,255,136,0.5)] text-brand-green' : 'border-white/20 text-gray-600'}}`}}>1</div>
                    <span className={{`text-[10px] font-bold uppercase tracking-widest bg-bg-main px-3 transition-colors ${{currentStep === 1 ? 'text-brand-green-bright' : (currentStep > 1 ? 'text-brand-green/70' : 'text-gray-500')}}`}}>Origen y Productor</span>
                </button>
                <button type="button" onClick={{() => setCurrentStep(2)}} className="relative z-10 flex flex-col items-center gap-2 group">
                    <div className={{`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-bg-main border-2 transition-all duration-500 ${{currentStep >= 2 ? 'border-brand-green shadow-[0_0_20px_rgba(0,255,136,0.5)] text-brand-green' : 'border-white/20 text-gray-600'}}`}}>2</div>
                    <span className={{`text-[10px] font-bold uppercase tracking-widest bg-bg-main px-3 transition-colors ${{currentStep === 2 ? 'text-brand-green-bright' : (currentStep > 2 ? 'text-brand-green/70' : 'text-gray-500')}}`}}>Comercialización</span>
                </button>
                <button type="button" onClick={{() => setCurrentStep(3)}} className="relative z-10 flex flex-col items-center gap-2 group">
                    <div className={{`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-bg-main border-2 transition-all duration-500 ${{currentStep >= 3 ? 'border-brand-green shadow-[0_0_20px_rgba(0,255,136,0.5)] text-brand-green' : 'border-white/20 text-gray-600'}}`}}>3</div>
                    <span className={{`text-[10px] font-bold uppercase tracking-widest bg-bg-main px-3 transition-colors ${{currentStep === 3 ? 'text-brand-green-bright' : 'text-gray-500'}}`}}>Beneficio y Proceso</span>
                </button>
            </div>

            <fieldset disabled={{isSubmitting || isAlreadyRegistered}} className={{`border-none p-0 m-0 min-h-[450px] relative transition-all ${{isAlreadyRegistered ? 'opacity-80 pointer-events-none' : ''}}`}}>
                {{currentStep === 1 && (
                    <section className="bg-bg-card border border-white/5 p-8 rounded-industrial space-y-6 animate-in slide-in-from-right-4 duration-500">
                        <h3 className="text-brand-green-bright font-bold flex items-center gap-2 mb-6">
                            <span className="w-1.5 h-6 bg-brand-green rounded-full"></span>
                            Datos Principales de Origen
                        </h3>
                        {p1_html}
                    </section>
                )}}

                {{currentStep === 2 && (
                    <section className="bg-bg-card border border-white/5 p-8 rounded-industrial space-y-6 animate-in slide-in-from-right-4 duration-500">
                        <h3 className="text-brand-green-bright font-bold flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-brand-green rounded-full"></span>
                            Negocio, Destino y Tipo de Grano
                        </h3>
                        {p2_dest_html}
                        {p2_peso_html}
                    </section>
                )}}

                {{currentStep === 3 && (
                    <section className="bg-bg-card border border-white/5 p-8 rounded-industrial space-y-6 animate-in slide-in-from-right-4 duration-500">
                        <h3 className="text-brand-green-bright font-bold flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-brand-green rounded-full"></span>
                            Perfiles Biológicos y Procesamiento
                        </h3>
                        {p2_vp_html}
                        {p2_ai_html}
                    </section>
                )}}
            </fieldset>
            
            {{/* Navigational Buttons */}}
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/5 relative z-20">
                {{currentStep > 1 ? (
                    <button type="button" onClick={{prevStep}} disabled={{isAlreadyRegistered}} className="px-6 py-3 border border-white/10 text-white rounded-industrial-sm font-bold uppercase tracking-widest text-[10px] hover:bg-white/5 transition-colors disabled:opacity-50">
                        &larr; Volver Atrás
                    </button>
                ) : <div></div>}}

                {{currentStep < 3 ? (
                    <button type="button" onClick={{nextStep}} className="px-10 py-4 bg-brand-green/10 text-brand-green-bright border border-brand-green/30 rounded-industrial-sm font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-brand-green hover:text-black transition-colors shadow-[0_0_15px_rgba(0,255,136,0.1)]">
                        Siguiente Paso &rarr;
                    </button>
                ) : (
                    <div className="flex-1 ml-4 animate-in fade-in zoom-in-95 duration-500">
                        {submit_btn_html}
                    </div>
                )}}
            </div>
'''

if submit_start != -1:
    txt = txt[:fs_start] + new_fs + txt[submit_end:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(txt)

print("Great Success!")
