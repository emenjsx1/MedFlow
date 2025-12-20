import logo from '@/assets/logo-agendaclin.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

const textSizes = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
};

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img 
        src={logo} 
        alt="AgendaClin" 
        className={`${sizes[size]} object-contain`}
      />
      {showText && (
        <span className={`font-bold ${textSizes[size]}`}>
          AgendaClin
        </span>
      )}
    </div>
  );
}
