import React from 'react';
import logoImg from '../../assets/images/antam_education_logo_1787304782954.jpg';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  className?: string;
  variant?: 'image' | 'vector';
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  variant = 'image',
}) => {
  const sizeMap = {
    sm: { img: 'h-8 w-8', textTitle: 'text-sm', textSub: 'text-[9px]' },
    md: { img: 'h-11 w-11', textTitle: 'text-base', textSub: 'text-[10px]' },
    lg: { img: 'h-16 w-16', textTitle: 'text-xl', textSub: 'text-xs' },
    xl: { img: 'h-24 w-24', textTitle: 'text-2xl', textSub: 'text-sm' },
    '2xl': { img: 'h-32 w-32', textTitle: 'text-3xl', textSub: 'text-base' },
  };

  const currentSize = sizeMap[size];

  if (variant === 'image') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="bg-white rounded-xl p-1 shadow-xs border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden">
          <img
            src={logoImg}
            alt="An Tâm Education Logo"
            className={`${currentSize.img} object-contain rounded-lg`}
          />
        </div>
        {showText && (
          <div className="flex flex-col">
            <span className={`font-black tracking-tight text-emerald-950 uppercase ${currentSize.textTitle} font-sans leading-none`}>
              AN TÂM
            </span>
            <span className={`font-extrabold tracking-[0.2em] text-amber-600 uppercase ${currentSize.textSub} font-sans mt-0.5 leading-none`}>
              EDUCATION
            </span>
          </div>
        )}
      </div>
    );
  }

  // Vector SVG representation for ultra-crisp scaling
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`bg-white rounded-xl p-1 shadow-xs border border-slate-200/80 flex items-center justify-center shrink-0 ${currentSize.img}`}>
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top 3 Stars */}
          {/* Center Main Star */}
          <polygon
            points="200,45 208,68 232,68 213,83 220,106 200,92 180,106 187,83 168,68 192,68"
            fill="#e08a00"
          />
          {/* Left Star */}
          <polygon
            points="145,75 151,91 168,91 154,102 159,118 145,108 131,118 136,102 122,91 139,91"
            fill="#e08a00"
          />
          {/* Right Star */}
          <polygon
            points="255,75 261,91 278,91 264,102 269,118 255,108 241,118 246,102 232,91 249,91"
            fill="#e08a00"
          />

          {/* Student Head (Circle) */}
          <circle cx="200" cy="120" r="17" fill="#0e4b2d" />

          {/* Student Body (V-shape arms / person) */}
          <path
            d="M200 215 L140 120 C155 125 180 135 200 135 C220 135 245 125 260 120 Z"
            fill="#0e4b2d"
          />
          <path
            d="M170 160 L200 215 L230 160 C215 168 185 168 170 160 Z"
            fill="#0e4b2d"
          />

          {/* Book Inner Page - Orange/Gold Wings */}
          {/* Left Inner Page */}
          <path
            d="M108 98 H123 V160 C123 172 135 180 152 182 L108 172 Z"
            fill="#e08a00"
          />
          <path
            d="M123 160 C150 178 185 205 200 220 C180 195 140 180 123 160 Z"
            fill="#e08a00"
          />
          {/* Right Inner Page */}
          <path
            d="M292 98 H277 V160 C277 172 265 180 248 182 L292 172 Z"
            fill="#e08a00"
          />
          <path
            d="M277 160 C250 178 215 205 200 220 C220 195 260 180 277 160 Z"
            fill="#e08a00"
          />

          {/* Book Outer Frame - Dark Green */}
          {/* Left Outer Frame */}
          <path
            d="M84 115 H98 V180 C98 195 115 205 135 210 L84 190 Z"
            fill="#0e4b2d"
          />
          <path
            d="M98 180 C125 205 165 230 185 240 C155 220 115 200 98 180 Z"
            fill="#0e4b2d"
          />

          {/* Right Outer Frame */}
          <path
            d="M316 115 H302 V180 C302 195 285 205 265 210 L316 190 Z"
            fill="#0e4b2d"
          />
          <path
            d="M302 180 C275 205 235 230 215 240 C245 220 285 200 302 180 Z"
            fill="#0e4b2d"
          />

          {/* Bottom Underline */}
          <rect x="160" y="325" width="80" height="6" rx="3" fill="#0e4b2d" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-black tracking-tight text-emerald-950 uppercase ${currentSize.textTitle} font-sans leading-none`}>
            AN TÂM
          </span>
          <span className={`font-extrabold tracking-[0.2em] text-amber-600 uppercase ${currentSize.textSub} font-sans mt-0.5 leading-none`}>
            EDUCATION
          </span>
        </div>
      )}
    </div>
  );
};
