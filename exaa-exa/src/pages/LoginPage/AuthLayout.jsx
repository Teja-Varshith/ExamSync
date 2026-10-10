import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, PenLine } from 'lucide-react';
import { ElevatedCard } from '@cred/neopop-web/lib/components';
import Logo from '../../components/brand/Logo';
import AbstractArt from '../../components/brand/AbstractArt';
import Segmented from '../../components/ui/Segmented';
import { subjectTones } from '../../theme/neopop';
import './LoginPage.css';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin', icon: ShieldCheck },
  { value: 'author', label: 'Author', icon: PenLine },
];

/**
 * Shared shell for the Admin (/login) and Author (/author) sign-in screens.
 */
export default function AuthLayout({ role, title, subtitle, children }) {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      {/* Brand panel */}
      <aside className="auth-brand" aria-hidden="true">
        <div className="auth-brand__top">
          <Logo size={36} />
        </div>
        <div className="auth-brand__mosaic">
          {subjectTones.slice(0, 4).map((tone, i) => (
            <div key={tone.name} className={`auth-tile auth-tile--${i}`}>
              <AbstractArt tone={tone} variant={[2, 0, 3, 1][i]} size={160} />
            </div>
          ))}
        </div>
        <div className="auth-brand__copy">
          <h2 className="neo-display">
            Build the prep kit<br />your students <em>actually</em> use.
          </h2>
          <p>Syllabus, notes, PYQs and Pakka Pass questions — curated in one place.</p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="auth-main">
        <div className="auth-main__inner">
          <Link to="/" className="auth-back">
            <ArrowLeft size={16} /> Back to home
          </Link>

          <div className="auth-mobile-logo">
            <Logo size={32} />
          </div>

          <ElevatedCard
            fullWidth
            backgroundColor="#161616"
            edgeColors={{ right: '#3D3D3D', bottom: '#2A2A2A' }}
          >
            <div className="auth-card">
              <Segmented
                options={ROLE_OPTIONS}
                value={role}
                onChange={(v) => navigate(v === 'admin' ? '/login' : '/author', { replace: true })}
                ariaLabel="Sign in as"
              />

              <header className="auth-card__header">
                <h1 className="auth-card__title">{title}</h1>
                <p className="auth-card__subtitle">{subtitle}</p>
              </header>

              {children}
            </div>
          </ElevatedCard>
        </div>
      </main>
    </div>
  );
}
