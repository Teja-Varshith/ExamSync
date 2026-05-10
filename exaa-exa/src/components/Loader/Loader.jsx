import './Loader.css';

export default function Loader({ text = 'Loading...' }) {
  return (
    <div className="loader" id="page-loader">
      <div className="loader__spinner">
        <div className="loader__ring"></div>
        <div className="loader__ring"></div>
        <div className="loader__ring"></div>
      </div>
      <p className="loader__text">{text}</p>
    </div>
  );
}

export function CardSkeleton({ count = 3 }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton-card__icon skeleton-pulse" />
          <div className="skeleton-card__content">
            <div className="skeleton-card__title skeleton-pulse" />
            <div className="skeleton-card__subtitle skeleton-pulse" />
            <div className="skeleton-card__bar skeleton-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
