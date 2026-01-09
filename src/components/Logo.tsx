interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
  variant?: 'default' | 'white';
}

const sizes = {
  sm: {
    height: 'h-8',
    width: 'w-auto',
  },
  md: {
    height: 'h-10',
    width: 'w-auto',
  },
  lg: {
    height: 'h-12',
    width: 'w-auto',
  },
};

export default function Logo({ size = 'md', className = '', showText = true, variant = 'default' }: LogoProps) {
  const sizeConfig = sizes[size];
  const logoSrc = variant === 'white' ? '/logobranca.png' : '/logo.png';
  
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src={logoSrc} 
        alt="MedFlow - Sistema de Gestão para Clínicas" 
        className={`${sizeConfig.height} ${sizeConfig.width} object-contain`}
        loading="eager"
      />
    </div>
  );
}
