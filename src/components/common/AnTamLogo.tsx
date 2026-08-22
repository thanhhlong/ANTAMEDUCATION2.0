import React from 'react';
import logoImage from '../../assets/images/antam_education_logo_1787304782954.jpg';

interface AnTamLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'full' | 'icon' | 'badge' | 'image';
  showText?: boolean;
}

export const AnTamLogo: React.FC<AnTamLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'icon',
  showText = true,
}) => {
  // If variant is image, return the high-res generated asset
  if (variant === 'image') {
    const sizeClasses = {
      xs: 'w-6 h-6',
      sm: 'w-8 h-8',
      md: 'w-12 h-12',
      lg: 'w-16 h-16',
      xl: 'w-24 h-24',
      '2xl': 'w-32 h-32',
    };
    return (
      <img
        src={logoImage}
        alt="AN TÂM EDUCATION"
        referrerPolicy="no-referrer"
        className={`object-contain rounded-lg ${sizeClasses[size] || 'w-12 h-12'} ${className}`}
      />
    );
  }

  // Dimension scaling
  const dimensions = {
    xs: { width: 24, height: 24, textTitle: 'text-[11px]', textSub: 'text-[7px]' },
    sm: { width: 32, height: 32, textTitle: 'text-xs', textSub: 'text-[8px]' },
    md: { width: 44, height: 44, textTitle: 'text-sm', textSub: 'text-[10px]' },
    lg: { width: 64, height: 64, textTitle: 'text-lg', textSub: 'text-xs' },
    xl: { width: 96, height: 96, textTitle: 'text-2xl', textSub: 'text-sm' },
    '2xl': { width: 128, height: 128, textTitle: 'text-3xl', textSub: 'text-base' },
  };

  const dim = dimensions[size] || dimensions.md;

  const IconSvg = (
    <svg
      viewBox="0 0 200 180"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Center Star (Large) */}
      <polygon
        points="100,8 104.5,21.5 119,21.5 107.5,30 112,43.5 100,35 88,43.5 92.5,30 81,21.5 95.5,21.5"
        fill="#D97706"
      />
      {/* Left Star */}
      <polygon
        points="68,18 71,27 80,27 73,32.5 75.5,41 68,36 60.5,41 63,32.5 56,27 65,27"
        fill="#D97706"
      />
      {/* Right Star */}
      <polygon
        points="132,18 135,27 144,27 137,32.5 139.5,41 132,36 124.5,41 127,32.5 120,27 129,27"
        fill="#D97706"
      />

      {/* Person Figure: Head */}
      <circle cx="100" cy="56" r="14" fill="#064E3B" />

      {/* Person Figure: Dynamic Open Arms & Body */}
      <path
        d="M100 74 L138 52 L124 82 L100 120 L76 82 L62 52 Z"
        fill="#064E3B"
      />

      {/* Inner Book Pages (Gold / Orange Wings) */}
      {/* Left Inner Wing */}
      <path
        d="M48 42 L58 42 L58 86 Q76 98 90 120 Q72 104 48 98 Z"
        fill="#D97706"
      />
      {/* Right Inner Wing */}
      <path
        d="M152 42 L142 42 L142 86 Q124 98 110 120 Q128 104 152 98 Z"
        fill="#D97706"
      />

      {/* Outer Book Frame & Foundation (Forest Dark Green) */}
      {/* Left Outer Frame */}
      <path
        d="M32 52 L42 52 L42 94 Q65 110 84 132 Q56 116 32 108 Z"
        fill="#064E3B"
      />
      {/* Right Outer Frame */}
      <path
        d="M168 52 L158 52 L158 94 Q135 110 116 132 Q144 116 168 108 Z"
        fill="#064E3B"
      />

      {/* Swoosh Underline Accents */}
      <path
        d="M84 136 Q92 141 100 144 Q94 139 88 132 Z"
        fill="#064E3B"
      />
      <path
        d="M116 136 Q108 141 100 144 Q106 139 112 132 Z"
        fill="#064E3B"
      />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div
        style={{ width: dim.width, height: dim.height }}
        className={`inline-flex items-center justify-center shrink-0 ${className}`}
      >
        {IconSvg}
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center justify-center p-2 rounded-xl bg-white border border-slate-200 shadow-2xs ${className}`}
        style={{ width: dim.width + 12, height: dim.height + 12 }}
      >
        {IconSvg}
      </div>
    );
  }

  // Full Logo with Vector Emblem + Brand Typography
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <div
        style={{ width: dim.width, height: dim.height }}
        className="shrink-0 flex items-center justify-center"
      >
        {IconSvg}
      </div>

      {showText && (
        <div className="mt-2 flex flex-col items-center">
          <span
            style={{ color: '#064E3B', letterSpacing: '0.06em' }}
            className={`font-black uppercase leading-tight tracking-tight ${dim.textTitle}`}
          >
            AN TÂM
          </span>
          <span
            style={{ color: '#D97706', letterSpacing: '0.22em' }}
            className={`font-extrabold uppercase leading-none mt-0.5 ${dim.textSub}`}
          >
            EDUCATION
          </span>
          <div
            style={{ backgroundColor: '#064E3B' }}
            className="w-8 h-0.5 rounded-full mt-1.5"
          />
        </div>
      )}
    </div>
  );
};

