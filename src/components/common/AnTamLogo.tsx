import React from 'react';
import logoImage from '../../assets/images/antam_education_logo_1787304782954.jpg';

interface AnTamLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'badge' | 'image';
  showText?: boolean;
}

export const AnTamLogo: React.FC<AnTamLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  showText = true,
}) => {
  // If variant is image, return the high-res generated asset
  if (variant === 'image') {
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-12 h-12',
      lg: 'w-16 h-16',
      xl: 'w-24 h-24',
    };
    return (
      <img
        src={logoImage}
        alt="AN TÂM EDUCATION"
        referrerPolicy="no-referrer"
        className={`object-contain rounded-lg ${sizeClasses[size]} ${className}`}
      />
    );
  }

  // Dimension scaling
  const dimensions = {
    sm: { width: 32, height: 32, textScale: 'text-xs' },
    md: { width: 44, height: 44, textScale: 'text-sm' },
    lg: { width: 64, height: 64, textScale: 'text-base' },
    xl: { width: 96, height: 96, textScale: 'text-xl' },
  };

  const dim = dimensions[size];

  const IconSvg = (
    <svg
      viewBox="0 0 200 160"
      className="w-full h-full drop-shadow-xs"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Center Star (Large) */}
      <polygon
        points="100,6 104,18 116,18 106,26 110,38 100,30 90,38 94,26 84,18 96,18"
        fill="#E59A19"
      />
      {/* Left Star */}
      <polygon
        points="68,16 71,24 79,24 73,29 75,37 68,32 61,37 63,29 57,24 65,24"
        fill="#E59A19"
      />
      {/* Right Star */}
      <polygon
        points="132,16 135,24 143,24 137,29 139,37 132,32 125,37 127,29 121,24 129,24"
        fill="#E59A19"
      />

      {/* Person Figure: Head */}
      <circle cx="100" cy="54" r="13" fill="#0A5C36" />

      {/* Person Figure: Dynamic Arms & Torso */}
      <path
        d="M100 70 L134 50 L120 78 L100 115 L80 78 L66 50 Z"
        fill="#0A5C36"
      />

      {/* Inner Book Wings (Golden Amber) */}
      {/* Left Inner Wing */}
      <path
        d="M48 40 L58 40 L58 84 Q76 96 90 116 Q72 100 48 95 Z"
        fill="#E59A19"
      />
      {/* Right Inner Wing */}
      <path
        d="M152 40 L142 40 L142 84 Q124 96 110 116 Q128 100 152 95 Z"
        fill="#E59A19"
      />

      {/* Outer Book Frame & Foundation (Forest Green) */}
      {/* Left Outer Frame */}
      <path
        d="M32 50 L42 50 L42 90 Q65 106 84 128 Q56 112 32 104 Z"
        fill="#0A5C36"
      />
      {/* Right Outer Frame */}
      <path
        d="M168 50 L158 50 L158 90 Q135 106 116 128 Q144 112 168 104 Z"
        fill="#0A5C36"
      />

      {/* Bottom Swoosh Accents */}
      <path
        d="M84 132 Q92 137 100 140 Q94 135 88 128 Z"
        fill="#0A5C36"
      />
      <path
        d="M116 132 Q108 137 100 140 Q106 135 112 128 Z"
        fill="#0A5C36"
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
        className={`inline-flex items-center justify-center p-2 rounded-xl bg-white border border-slate-200 shadow-xs ${className}`}
        style={{ width: dim.width + 12, height: dim.height + 12 }}
      >
        {IconSvg}
      </div>
    );
  }

  // Full Logo with Vector Emblem + Brand Typo
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <div
        style={{ width: dim.width, height: dim.height }}
        className="shrink-0 flex items-center justify-center"
      >
        {IconSvg}
      </div>

      {showText && (
        <div className="mt-1.5 flex flex-col items-center">
          <span
            style={{ color: '#0A5C36', letterSpacing: '0.05em' }}
            className="font-black text-sm sm:text-base leading-tight tracking-tight uppercase"
          >
            AN TÂM
          </span>
          <span
            style={{ color: '#E59A19', letterSpacing: '0.18em' }}
            className="font-extrabold text-[10px] sm:text-xs leading-none uppercase mt-0.5"
          >
            EDUCATION
          </span>
          <div
            style={{ backgroundColor: '#0A5C36' }}
            className="w-8 h-0.5 rounded-full mt-1"
          />
        </div>
      )}
    </div>
  );
};
