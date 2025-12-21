import logoImage from '@/assets/logo-agendaclin.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { image: 'w-8 h-8', text: 'text-base' },
  md: { image: 'w-10 h-10', text: 'text-lg' },
  lg: { image: 'w-12 h-12', text: 'text-xl' },
};

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizeConfig = sizes[size];
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img 
        src={logoImage} 
        alt="AgendaClin Logo" 
        className={`${sizeConfig.image} object-contain`}
      />
      {showText && (
        <span className={`font-bold ${sizeConfig.text}`}>
          AgendaClin
        </span>
      )}
    </div>
  );
}
