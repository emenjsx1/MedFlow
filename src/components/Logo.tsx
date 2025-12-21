import { Calendar } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: {
    container: 'w-8 h-8',
    icon: 'w-5 h-5',
    text: 'text-lg',
  },
  md: {
    container: 'w-10 h-10',
    icon: 'w-6 h-6',
    text: 'text-xl',
  },
  lg: {
    container: 'w-12 h-12',
    icon: 'w-7 h-7',
    text: 'text-2xl',
  },
};

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeConfig = sizes[size];
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeConfig.container} rounded-lg bg-primary flex items-center justify-center`}>
        <Calendar className={`${sizeConfig.icon} text-primary-foreground`} />
      </div>
      <span className={`${sizeConfig.text} font-bold text-primary`}>AgendaClin</span>
    </div>
  );
}
