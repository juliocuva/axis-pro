'use client';

import React, { useState, useEffect } from 'react';

const DEFAULT_MESSAGES = [
  {
    title: 'Reduce Uncertainty',
    description: 'Every purchase order is backed by verified evidence collected throughout the coffee supply chain. Instead of relying on assumptions, buyers can validate origin, processing, quality, compliance and shipment from one trusted workspace.'
  },
  {
    title: 'Buy With Confidence',
    description: 'Every evidence layer answers a critical purchasing question before coffee reaches its destination. Review each stage independently and make purchasing decisions supported by verified information.'
  },
  {
    title: 'Coffee Quality Is Proven',
    description: 'Quality is not declared. It is demonstrated through technical, logistical and regulatory evidence. Axis One consolidates every critical verification into one intelligent evidence workspace.'
  }
];

interface ValueMissionPanelProps {
  selectedLayerId?: string;
}

export default function ValueMissionPanel({ selectedLayerId }: ValueMissionPanelProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [fade, setFade] = useState(false);

  // Dynamic context based on selected layer
  const getContextMessage = () => {
    switch (selectedLayerId) {
      case 'origin':
        return { title: 'Origin Evidence', description: 'Review the geographical source of the coffee. Validated producers, farms, and exact locations mapped for absolute origin traceability.' };
      case 'processing':
        return { title: 'Processing Evidence', description: 'Review milling performance and laboratory validation to verify the physical condition of the coffee before export.' };
      case 'quality':
        return { title: 'Quality Evidence', description: 'Validate roast profile and CVA sensory evaluation before approving the lot.' };
      case 'compliance':
        return { title: 'Compliance Evidence', description: 'Confirm regulatory requirements, deforestation status and digital verification before shipment.' };
      case 'shipment':
        return { title: 'Shipment Evidence', description: 'Review export documentation, container information and sealing verification before dispatch.' };
      default:
        return null;
    }
  };

  const dynamicContext = getContextMessage();
  const showCarousel = !dynamicContext;
  
  // Auto-rotate logic
  useEffect(() => {
    if (!showCarousel || isHovered) return;

    const interval = setInterval(() => {
      setFade(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % DEFAULT_MESSAGES.length);
        setFade(false);
      }, 300); // 300ms fade transition
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [showCarousel, isHovered]);

  // Handle manual navigation
  const handleNav = (idx: number) => {
    setFade(true);
    setTimeout(() => {
      setCurrentIndex(idx);
      setFade(false);
    }, 300);
  };

  const currentMessage = dynamicContext || DEFAULT_MESSAGES[currentIndex];

  return (
    <div 
      className="bg-transparent h-full flex flex-col justify-center px-2 py-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ minHeight: '160px' }}
    >
      <div className={`flex-1 flex flex-col justify-center transition-opacity duration-300 ease-in-out ${fade ? 'opacity-0' : 'opacity-100'}`}>
        <h2 className="text-4xl font-light text-slate-900 mb-3 tracking-tight">
          {currentMessage.title}
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-500 font-medium max-w-lg">
          {currentMessage.description}
        </p>
      </div>

      {showCarousel && (
        <div className="flex items-center gap-2 mt-8">
          {DEFAULT_MESSAGES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleNav(idx)}
              className={`rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-4 h-1.5 bg-slate-800' : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
