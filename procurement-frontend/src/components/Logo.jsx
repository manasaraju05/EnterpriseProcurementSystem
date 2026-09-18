import React from 'react';

export default function Logo({ size = 40, textColor = '#0F172A' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      {/* ProcureFlow Minimalist Node Icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="80" height="80" rx="20" fill="#0284C7" />
        <path
          d="M 25 55 L 40 30 L 55 55"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="40" cy="30" r="5" fill="#38BDF8" />
        <circle cx="25" cy="55" r="5" fill="#FFFFFF" />
        <circle cx="55" cy="55" r="5" fill="#FFFFFF" />
      </svg>

      {/* Brand Text */}
      <span style={{ fontSize: `${size * 0.45}px`, fontWeight: '800', color: textColor, fontFamily: 'sans-serif' }}>
        Procure<span style={{ color: '#0284C7' }}>Flow</span>
      </span>
    </div>
  );
}