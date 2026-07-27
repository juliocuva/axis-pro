'use client';

import HeroSection from '../HeroSection';

export default function PitchHeroPage() {
    return <HeroSection onLoginClick={() => window.location.href = '/login'} />;
}
