import React, { useState, useEffect } from 'react';

interface DemoTourModalProps {
    onClose: () => void;
}

export default function DemoTourModal({ onClose }: DemoTourModalProps) {
    const [scene, setScene] = useState(0);

    useEffect(() => {
        // Master Timeline
        const t1 = setTimeout(() => setScene(1), 4000); // After Login
        const t2 = setTimeout(() => setScene(2), 10000); // After Data Entry
        const t3 = setTimeout(() => setScene(3), 14000); // After Sealing
        
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-brand-navy/95 backdrop-blur-xl animate-in fade-in duration-500">
            {/* Close Button */}
            <button onClick={onClose} className="absolute top-8 right-8 text-white/50 hover:text-white z-50 transition-colors bg-white/5 p-3 rounded-full shadow-sm hover:bg-white/10">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>

            <div className="w-full max-w-6xl h-full max-h-[800px] flex items-center justify-center relative">
                {scene === 0 && <SceneLogin />}
                {scene === 1 && <SceneDataEntry />}
                {scene === 2 && <SceneSealing />}
                {scene === 3 && <SceneCertificate />}
            </div>
        </div>
    );
}

// ---------------------------------------------------------
// SCENE 0: LOGIN
// ---------------------------------------------------------
function SceneLogin() {
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fullEmail = "demo@axisone.coffee";
        const fullPass = "********";
        
        // Typing email
        let i = 0;
        const emailInterval = setInterval(() => {
            if (i < fullEmail.length) {
                setEmail(prev => prev + fullEmail.charAt(i));
                i++;
            } else {
                clearInterval(emailInterval);
                
                // Typing password
                let j = 0;
                const passInterval = setInterval(() => {
                    if (j < fullPass.length) {
                        setPass(prev => prev + fullPass.charAt(j));
                        j++;
                    } else {
                        clearInterval(passInterval);
                        // Click submit
                        setTimeout(() => setIsSubmitting(true), 500);
                    }
                }, 50);
            }
        }, 50);

        return () => clearInterval(emailInterval);
    }, []);

    return (
        <div className="w-full max-w-md bg-white p-10 rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-500 flex flex-col items-center">
            <img src="/logo.png" alt="AxisOne" className="h-16 mb-8 invert" />
            
            <div className="w-full space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">User ID</label>
                    <div className="w-full bg-gray-50 border border-gray-200 text-brand-navy font-mono text-sm px-4 py-3 rounded-xl h-12 flex items-center">
                        {email}
                        {!isSubmitting && email.length < 19 && <span className="w-2 h-4 bg-brand-green animate-pulse ml-1"></span>}
                    </div>
                </div>
                
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Passkey</label>
                    <div className="w-full bg-gray-50 border border-gray-200 text-brand-navy font-mono text-lg tracking-[0.3em] px-4 py-3 rounded-xl h-12 flex items-center">
                        {pass}
                        {email.length === 19 && pass.length < 8 && !isSubmitting && <span className="w-2 h-4 bg-brand-green animate-pulse ml-1"></span>}
                    </div>
                </div>

                <button className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 mt-4 ${isSubmitting ? 'bg-brand-navy text-white scale-95' : 'bg-brand-green text-white hover:scale-105 shadow-xl shadow-brand-green/20'}`}>
                    {isSubmitting ? 'Authenticating...' : 'Enter System'}
                </button>
            </div>
        </div>
    );
}

// ---------------------------------------------------------
// SCENE 1: DATA ENTRY
// ---------------------------------------------------------
function SceneDataEntry() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const t1 = setTimeout(() => setStep(1), 1500); // Fill Farm
        const t2 = setTimeout(() => setStep(2), 3000); // Fill CVA
        const t3 = setTimeout(() => setStep(3), 4500); // Click Save
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, []);

    return (
        <div className="w-full max-w-5xl bg-[#0a0f1a] border border-brand-green/20 rounded-[2rem] shadow-[0_0_100px_-20px_rgba(37,211,102,0.15)] flex overflow-hidden animate-in zoom-in-95 duration-500 h-[600px]">
            {/* Sidebar Mock */}
            <div className="w-64 bg-white/5 border-r border-white/10 p-6 flex flex-col gap-4">
                <div className="h-8 bg-brand-green/20 rounded-md w-3/4 mb-8"></div>
                <div className="h-4 bg-white/10 rounded w-full"></div>
                <div className="h-4 bg-white/20 rounded w-5/6"></div>
                <div className="h-4 bg-white/10 rounded w-full"></div>
                <div className="h-4 bg-white/10 rounded w-4/5"></div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-12 flex flex-col relative">
                <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-8 border-b border-white/10 pb-4">Terminal: Lot Registration</h2>
                
                <div className="grid grid-cols-2 gap-8">
                    {/* Origin Form */}
                    <div className={`space-y-4 transition-all duration-500 ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <h3 className="text-brand-green font-bold text-xs uppercase tracking-widest mb-4">I. Origin Data</h3>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <label className="text-[9px] text-white/40 uppercase tracking-widest block mb-1">Farm ID</label>
                            <div className="text-white font-mono text-sm">F-PARAISO-01</div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <label className="text-[9px] text-white/40 uppercase tracking-widest block mb-1">Variety</label>
                            <div className="text-white font-mono text-sm">Pink Bourbon</div>
                        </div>
                    </div>

                    {/* CVA Form */}
                    <div className={`space-y-4 transition-all duration-500 delay-300 ${step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <h3 className="text-brand-green font-bold text-xs uppercase tracking-widest mb-4">V. CVA Protocol</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <label className="text-[9px] text-white/40 uppercase tracking-widest block mb-1">Score</label>
                                <div className="text-brand-green font-black text-2xl">89.5</div>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <label className="text-[9px] text-white/40 uppercase tracking-widest block mb-1">Notes</label>
                                <div className="text-white font-mono text-[10px]">Jasmine, Peach</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Action */}
                <div className={`absolute bottom-12 right-12 transition-all duration-500 ${step >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                    <div className="bg-brand-green text-brand-navy px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm flex items-center gap-3 shadow-[0_0_40px_rgba(37,211,102,0.4)]">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="30" className="opacity-50"></circle></svg>
                        Hashing to Ledger...
                    </div>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------
// SCENE 2: SEALING
// ---------------------------------------------------------
function SceneSealing() {
    const [hash, setHash] = useState('');

    useEffect(() => {
        const chars = '0123456789abcdef';
        const interval = setInterval(() => {
            let newHash = '0x';
            for(let i=0; i<32; i++) newHash += chars[Math.floor(Math.random() * chars.length)];
            setHash(newHash);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-90 duration-500">
            <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                <div className="absolute inset-0 border-4 border-brand-green/20 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                <div className="absolute inset-4 border-2 border-brand-green/40 rounded-full animate-[spin_3s_linear_infinite]"></div>
                <div className="absolute inset-8 border border-brand-green border-dashed rounded-full animate-[spin_4s_linear_infinite_reverse]"></div>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-green relative z-10"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-4">Cryptographic Seal</h2>
            <p className="text-brand-green font-mono text-sm tracking-widest break-all max-w-lg text-center opacity-70">
                {hash}
            </p>
        </div>
    );
}

// ---------------------------------------------------------
// SCENE 3: FINAL PASSPORT
// ---------------------------------------------------------
function SceneCertificate() {
    return (
        <div className="w-full max-w-6xl bg-[#F8FAFC] rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] flex flex-col md:flex-row overflow-hidden relative min-h-[700px] animate-in slide-in-from-bottom-12 duration-1000 ease-out">
            {/* Left Data View */}
            <div className="w-full md:w-3/4 flex flex-col p-12 lg:p-16 bg-[#F8FAFC]">
                <div className="mb-12">
                    <span className="inline-block px-4 py-1.5 bg-brand-green/10 text-brand-green text-[10px] font-black uppercase tracking-widest rounded-full mb-6 flex w-max items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
                        Immutable Record Verified
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black text-brand-navy uppercase tracking-tighter leading-none mb-4">Colombia Pink Bourbon</h1>
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest flex items-center gap-4">
                        AXIS-LOT-001
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        Finca El Paraíso
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-6 flex-1">
                    <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm flex flex-col justify-center">
                        <span className="block text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-2">CVA Sensory Score</span>
                        <span className="font-black text-7xl tracking-tighter text-brand-navy">89.5</span>
                        <span className="text-brand-green font-bold text-sm mt-4">Jasmine, Peach, Honey</span>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
                            <span className="block text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-2">Process</span>
                            <span className="font-black text-xl text-brand-navy">Thermal Shock Washed</span>
                        </div>
                        <div className="bg-brand-navy text-white p-6 rounded-3xl shadow-xl shadow-brand-navy/10">
                            <span className="block text-white/50 font-bold uppercase tracking-widest text-[10px] mb-2">Roast Profile</span>
                            <span className="font-black text-xl">Agtron 85 (Light)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-full md:w-1/4 bg-white p-12 flex flex-col items-center justify-center border-l border-gray-100 relative z-10 shadow-[-20px_0_40px_rgba(0,0,0,0.03)] text-center">
                <div className="w-32 h-32 bg-gray-50 border-2 border-brand-green p-2 rounded-2xl mb-8 relative group">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://axisone.coffee/verify/0x8f2a9b4c" alt="QR" className="w-full h-full mix-blend-multiply opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute -inset-2 border border-brand-green/30 rounded-3xl animate-[spin_10s_linear_infinite]"></div>
                </div>
                
                <h3 className="font-black text-brand-navy uppercase tracking-widest text-sm mb-2">Scan to Verify</h3>
                <p className="text-gray-400 text-[10px] leading-relaxed font-bold uppercase tracking-widest mb-12">Access the full technical DNA of this lot.</p>
                
                <button className="w-full py-4 bg-brand-green text-white rounded-xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform shadow-xl shadow-brand-green/20">
                    Schedule Your Demo
                </button>
            </div>
        </div>
    );
}
