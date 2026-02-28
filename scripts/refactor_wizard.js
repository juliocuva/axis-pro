const fs = require('fs');
const file = 'c:\\FullStackDeveloper\\axis-oil\\axis_pro\\src\\modules\\supply\\components\\PurchaseForm.tsx';
let txt = fs.readFileSync(file, 'utf8');

// Insert State
if (!txt.includes('currentStep')) {
    txt = txt.replace(
        "const [smartLinkText, setSmartLinkText] = useState('');",
        "const [smartLinkText, setSmartLinkText] = useState('');\n    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);\n    const nextStep = () => setCurrentStep(p => (Math.min(p + 1, 3) as 1|2|3));\n    const prevStep = () => setCurrentStep(p => (Math.max(p - 1, 1) as 1|2|3));"
    );
}

// Extract portions of the form
const formFieldsetStart = txt.indexOf('<fieldset');
const formFieldsetEnd = txt.indexOf('</fieldset>') + 11;

const section1Start = txt.indexOf('<section', formFieldsetStart);
const p1ContentStart = txt.indexOf('<div className="flex flex-col', section1Start);
const p1End = txt.indexOf('</section>', p1ContentStart);
const p1HTML = txt.substring(p1ContentStart, p1End);

const section2Start = txt.indexOf('<section', p1End);
const p2DestinoStart = txt.indexOf('<div className="grid grid-cols-1 gap-6">', section2Start);
const p2VarProcStart = txt.indexOf('<div className="grid grid-cols-2 gap-4">', p2DestinoStart);
const p2DestinoHTML = txt.substring(p2DestinoStart, p2VarProcStart);

const p2PesoPagoStart = txt.indexOf('<NumericInput\\n                                label="Cantidad Pack', p2VarProcStart);
// some systems differ on line endings, so regex is better:
const regexPesoPago = /<NumericInput[\s\S]*?label="Cantidad Pack/g;
regexPesoPago.lastIndex = p2VarProcStart;
const match = regexPesoPago.exec(txt);
const p2PesoPagoStartSafe = match ? match.index : p2VarProcStart;

const p2VarProcHTML = txt.substring(p2VarProcStart, p2PesoPagoStartSafe);

const p2AIPatternStart = txt.indexOf('<AIPatternBox', p2PesoPagoStartSafe);
const p2PesoPagoHTML = txt.substring(p2PesoPagoStartSafe, p2AIPatternStart);

const p2AIPatternEnd = txt.indexOf('</section>', p2AIPatternStart);
const p2AIPatternHTML = txt.substring(p2AIPatternStart, p2AIPatternEnd);

const submitButtonStart = txt.indexOf('<button\\n                type={isAlreadyRegistered ? "button" : "submit"}');
const submitButtonRegex = /<button[\s\S]*?disabled={isSubmitting \|\| isAlreadyRegistered}[\s\S]*?REGISTRAR INGRESO Y PREPARAR PARA TRILLA[\s\S]*?<\/button>/;
const submitMatch = txt.match(submitButtonRegex);
const submitButtonHTML = submitMatch ? submitMatch[0] : '';
const fullSubmitString = submitMatch ? submitMatch[0] : '';

const newFieldset = \`
            {/* Stepper Wizard Header */}
            <div className="flex justify-between items-center mb-8 relative px-4">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[calc(100%-2rem)] h-0.5 bg-white/5 z-0 mx-4">
                    <div className="h-full bg-brand-green/50 transition-all duration-500" style={{ width: \\\`\\\${(currentStep - 1) * 50}%\\\` }}></div>
                </div>
                
                <button type="button" onClick={() => setCurrentStep(1)} className="relative z-10 flex flex-col items-center gap-2 group">
                    <div className={\\\`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-bg-main border-2 transition-all duration-500 \\\${currentStep >= 1 ? 'border-brand-green shadow-[0_0_20px_rgba(0,255,136,0.5)] text-brand-green' : 'border-white/20 text-gray-600'}\\\`}>1</div>
                    <span className={\\\`text-[10px] font-bold uppercase tracking-widest bg-bg-main px-3 transition-colors \\\${currentStep === 1 ? 'text-brand-green-bright' : (currentStep > 1 ? 'text-brand-green/70' : 'text-gray-500')}\\\`}>Origen y Creador</span>
                </button>
                <button type="button" onClick={() => setCurrentStep(2)} className="relative z-10 flex flex-col items-center gap-2 group">
                    <div className={\\\`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-bg-main border-2 transition-all duration-500 \\\${currentStep >= 2 ? 'border-brand-green shadow-[0_0_20px_rgba(0,255,136,0.5)] text-brand-green' : 'border-white/20 text-gray-600'}\\\`}>2</div>
                    <span className={\\\`text-[10px] font-bold uppercase tracking-widest bg-bg-main px-3 transition-colors \\\${currentStep === 2 ? 'text-brand-green-bright' : (currentStep > 2 ? 'text-brand-green/70' : 'text-gray-500')}\\\`}>Comercialización</span>
                </button>
                <button type="button" onClick={() => setCurrentStep(3)} className="relative z-10 flex flex-col items-center gap-2 group">
                    <div className={\\\`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-bg-main border-2 transition-all duration-500 \\\${currentStep >= 3 ? 'border-brand-green shadow-[0_0_20px_rgba(0,255,136,0.5)] text-brand-green' : 'border-white/20 text-gray-600'}\\\`}>3</div>
                    <span className={\\\`text-[10px] font-bold uppercase tracking-widest bg-bg-main px-3 transition-colors \\\${currentStep === 3 ? 'text-brand-green-bright' : 'text-gray-500'}\\\`}>Beneficio Químico</span>
                </button>
            </div>

            <fieldset disabled={isSubmitting || isAlreadyRegistered} className={\\\`border-none p-0 m-0 min-h-[450px] relative transition-all \\\${isAlreadyRegistered ? 'opacity-80 pointer-events-none' : ''}\\\`}>
                {currentStep === 1 && (
                    <section className="bg-bg-card border border-white/5 p-8 rounded-industrial space-y-6 animate-in slide-in-from-right-4 duration-500">
                        <h3 className="text-brand-green-bright font-bold flex items-center gap-2 mb-6">
                            <span className="w-1.5 h-6 bg-brand-green rounded-full"></span>
                            Datos Principales de Origen
                        </h3>
                        \${p1HTML}
                    </section>
                )}

                {currentStep === 2 && (
                    <section className="bg-bg-card border border-white/5 p-8 rounded-industrial space-y-6 animate-in slide-in-from-right-4 duration-500">
                        <h3 className="text-brand-green-bright font-bold flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-brand-green rounded-full"></span>
                            Negocio, Destino y Tipo de Grano
                        </h3>
                        \${p2DestinoHTML}
                        \${p2PesoPagoHTML}
                    </section>
                )}

                {currentStep === 3 && (
                    <section className="bg-bg-card border border-white/5 p-8 rounded-industrial space-y-6 animate-in slide-in-from-right-4 duration-500">
                        <h3 className="text-brand-green-bright font-bold flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-brand-green rounded-full"></span>
                            Perfiles Biológicos y Procesamiento
                        </h3>
                        \${p2VarProcHTML}
                        \${p2AIPatternHTML}
                    </section>
                )}
            </fieldset>
            
            {/* Navigational Buttons */}
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/5 relative z-20">
                {currentStep > 1 ? (
                    <button type="button" onClick={prevStep} disabled={isAlreadyRegistered} className="px-6 py-3 border border-white/10 text-white rounded-industrial-sm font-bold uppercase tracking-widest text-[10px] hover:bg-white/5 transition-colors disabled:opacity-50">
                        &larr; Volver Atrás
                    </button>
                ) : <div></div>}

                {currentStep < 3 ? (
                    <button type="button" onClick={nextStep} className="px-10 py-4 bg-brand-green/10 text-brand-green-bright border border-brand-green/30 rounded-industrial-sm font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-brand-green hover:text-black transition-colors shadow-[0_0_15px_rgba(0,255,136,0.1)]">
                        Siguiente Paso &rarr;
                    </button>
                ) : (
                    <div className="flex-1 ml-4 animate-in fade-in zoom-in-95 duration-500">
                        \${submitButtonHTML}
                    </div>
                )}
            </div>
\`

if (submitMatch) {
    txt = txt.replace(txt.substring(formFieldsetStart, submitMatch.index + submitMatch[0].length), newFieldset);
}

fs.writeFileSync(file, txt, 'utf8');
console.log('Successfully refactored Form to Wizard');
