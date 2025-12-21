import logoImage from '@/assets/logo-agendaclin.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-10',
  md: 'h-14',
  lg: 'h-20',
};

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  return (
    <img 
      src={logoImage} 
      alt="AgendaClin" 
      className={`${sizes[size]} w-auto object-contain ${className}`}
    />
  );
}
