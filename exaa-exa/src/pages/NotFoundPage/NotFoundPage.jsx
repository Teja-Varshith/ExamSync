import { Link } from 'react-router-dom';
import Header from '../../components/Header/Header';
import HeroBanner from '../../components/HeroBanner/HeroBanner';

export default function NotFoundPage() {
  return (
    <div className="page not-found-page">
      <Header title="ExamSync" />
      
      <HeroBanner 
        title="404" 
        subtitle="Page Not Found" 
        gradient="linear-gradient(135deg, var(--color-error) 0%, #FCA5A5 100%)"
      />
      
      <div style={{ padding: 'var(--space-2xl) var(--space-md)', textAlign: 'center' }}>
        <h2 style={{ marginBottom: 'var(--space-md)' }}>Oops! We couldn't find that page.</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        
        <Link 
          to="/" 
          style={{
            display: 'inline-block',
            padding: 'var(--space-md) var(--space-xl)',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            borderRadius: 'var(--radius-full)',
            fontWeight: 'var(--font-weight-bold)'
          }}
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
}
