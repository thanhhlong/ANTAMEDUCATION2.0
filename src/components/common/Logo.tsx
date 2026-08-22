import React from 'react';
import logoImg from '../../assets/images/antam_education_logo_1787304782954.jpg';
import { AnTamLogo } from './AnTamLogo';

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
        <div className="bg-white rounded-xl p-1 shadow-2xs border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden">
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
            <span className={`font-extrabold tracking-[0.2em] text-amber-600 uppercase ${currentSize.textSub} font-sans mt-1 leading-none`}>
              EDUCATION
            </span>
          </div>
        )}
      </div>
    );
  }

  // Vector variant delegation to AnTamLogo
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <AnTamLogo size={size} variant="icon" showText={false} className={currentSize.img} />
      {showText && (
        <div className="flex flex-col">
          <span className={`font-black tracking-tight text-emerald-950 uppercase ${currentSize.textTitle} font-sans leading-none`}>
            AN TÂM
          </span>
          <span className={`font-extrabold tracking-[0.2em] text-amber-600 uppercase ${currentSize.textSub} font-sans mt-1 leading-none`}>
            EDUCATION
          </span>
        </div>
      )}
    </div>
  );
};

