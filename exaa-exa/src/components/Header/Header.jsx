import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, BookOpen } from 'lucide-react';
import './Header.css';

export default function Header({ title, showBack = false, backTo = '' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="header" id="app-header">
      <div className="header__inner">
        {showBack && !isHome ? (
          <button
            className="header__back-btn"
            onClick={() => {
              if (backTo) {
                navigate(backTo, { replace: true });
              } else if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/', { replace: true });
              }
            }}
            aria-label="Go back"
            id="back-button"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
        ) : (
          <div className="header__spacer" />
        )}

        <div className="header__brand">
          <BookOpen size={20} className="header__logo-icon" />
          <span className="header__title">
            {title || 'ExamSync'}
          </span>
        </div>

        <div className="header__spacer" />
      </div>
    </header>
  );
}
