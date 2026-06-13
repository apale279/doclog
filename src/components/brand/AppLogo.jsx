const LOGO_SRC = '/logo.svg';

export function AppLogo({ className = 'h-8 w-auto object-contain', alt = 'DOCLOG' }) {
  return <img src={LOGO_SRC} alt={alt} className={className} decoding="async" />;
}
