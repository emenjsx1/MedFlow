import { Calendar } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { container: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-base' },
  md: { container: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-lg' },
  lg: { container: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-xl' },
};

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizeConfig = sizes[size];
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeConfig.container} rounded-xl bg-primary flex items-center justify-center`}>
        <Calendar className={`${sizeConfig.icon} text-primary-foreground`} />
      </div>
      {showText && (
        <span className={`font-bold ${sizeConfig.text}`}>
          AgendaClin
        </span>
      )}
    </div>
  );
}
