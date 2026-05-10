import './HeroBanner.css';

export default function HeroBanner({ title, subtitle, imageNode = null, gradient = 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)', align = 'center', compact = false }) {
  return (
    <div 
      className={`hero-banner ${compact ? 'hero-banner--compact' : ''} ${align === 'left' ? 'hero-banner--left' : ''}`}
      style={{ background: gradient }}
    >
      <div className="hero-banner__content">
        <h1 className="hero-banner__title">{title}</h1>
        {subtitle && <p className="hero-banner__subtitle">{subtitle}</p>}
      </div>
      {imageNode && (
        <div className="hero-banner__graphic">
          {imageNode}
        </div>
      )}
    </div>
  );
}
