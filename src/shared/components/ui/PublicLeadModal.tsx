import React, { useState } from 'react';

export interface PublicLeadData {
    name: string;
    company: string;
    email: string;
    phone: string;
}

interface PublicLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: PublicLeadData) => void;
    isSubmitting: boolean;
    title?: string;
    description?: string;
    buttonText?: string;
}

export default function PublicLeadModal({
    isOpen,
    onClose,
    onSubmit,
    isSubmitting,
    title = 'Get Certificate',
    description = 'To generate your report and secure this data, please register below. This will connect you with the Axis One Coffee ecosystem.',
    buttonText = 'REGISTER & CONTINUE'
}: PublicLeadModalProps) {
    const [leadName, setLeadName] = useState('');
    const [leadCompany, setLeadCompany] = useState('');
    const [leadEmail, setLeadEmail] = useState('');
    const [countryCode, setCountryCode] = useState('+57');
    const [leadPhone, setLeadPhone] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            name: leadName,
            company: leadCompany,
            email: leadEmail,
            phone: `${countryCode} ${leadPhone.trim()}`
        });
    };

    return (
        <div className="fixed inset-0 z-[100] bg-brand-navy/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 md:p-10 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-300">
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 text-gray-400 hover:text-brand-navy transition-colors"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                
                <h3 className="text-2xl font-black text-brand-navy mb-2 uppercase tracking-tight">{title}</h3>
                <p className="text-sm text-gray-500 mb-8 font-medium">
                    {description}
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Full Name</label>
                        <input 
                            type="text" 
                            required
                            value={leadName}
                            onChange={e => setLeadName(e.target.value)}
                            className="w-full border-b-2 border-gray-200 py-2 focus:border-brand-green outline-none transition-colors font-bold text-brand-navy text-sm"
                            placeholder="e.g., Julio César"
                            disabled={isSubmitting}
                        />
                    </div>
                    
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Company / Farm</label>
                        <input 
                            type="text" 
                            required
                            value={leadCompany}
                            onChange={e => setLeadCompany(e.target.value)}
                            className="w-full border-b-2 border-gray-200 py-2 focus:border-brand-green outline-none transition-colors font-bold text-brand-navy text-sm"
                            placeholder="e.g., Finca El Paraíso"
                            disabled={isSubmitting}
                        />
                    </div>
                    
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Email Address</label>
                        <input 
                            type="email" 
                            required
                            value={leadEmail}
                            onChange={e => setLeadEmail(e.target.value)}
                            className="w-full border-b-2 border-gray-200 py-2 focus:border-brand-green outline-none transition-colors font-bold text-brand-navy text-sm"
                            placeholder="email@example.com"
                            disabled={isSubmitting}
                        />
                    </div>
                    
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">WhatsApp / Phone</label>
                        <div className="flex items-end gap-0 w-full border-b-2 border-gray-200 focus-within:border-brand-green transition-colors">
                            <select
                                value={countryCode}
                                onChange={e => setCountryCode(e.target.value)}
                                className="w-[80px] py-2 outline-none font-bold text-brand-navy text-sm bg-transparent cursor-pointer"
                                disabled={isSubmitting}
                            >
                                <option value="+57">🇨🇴 +57</option>
                                <option value="+1">🇺🇸 +1</option>
                                <option value="+51">🇵🇪 +51</option>
                                <option value="+52">🇲🇽 +52</option>
                                <option value="+55">🇧🇷 +55</option>
                                <option value="+504">🇭🇳 +504</option>
                                <option value="+502">🇬🇹 +502</option>
                                <option value="+503">🇸🇻 +503</option>
                                <option value="+505">🇳🇮 +505</option>
                                <option value="+506">🇨🇷 +506</option>
                                <option value="+593">🇪🇨 +593</option>
                                <option value="+58">🇻🇪 +58</option>
                            </select>
                            <input 
                                type="tel" 
                                required
                                value={leadPhone}
                                onChange={e => setLeadPhone(e.target.value)}
                                className="flex-1 py-2 outline-none font-bold text-brand-navy text-sm bg-transparent"
                                placeholder="300 000 0000"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-brand-green text-white font-black uppercase tracking-widest text-sm py-4 rounded-xl mt-6 hover:bg-brand-navy transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                GENERATING...
                            </>
                        ) : (
                            buttonText
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
