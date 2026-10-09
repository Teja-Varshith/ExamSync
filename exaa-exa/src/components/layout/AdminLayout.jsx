import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutGrid, Users, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../ui/useConfirm';
import Logo from '../brand/Logo';

/**
 * Shell for every Admin / Author page: top bar + optional breadcrumb + page header.
 *
 * crumbs:  [{ label, to?, state? }]  — last item is the current page
 * actions: ReactNode rendered on the right of the page header
 */
export default function AdminLayout({ title, eyebrow, subtitle, crumbs, actions, wide = false, children }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();

  useEffect(() => {
    document.body.classList.add('admin-mode');
    return () => document.body.classList.remove('admin-mode');
  }, []);

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Sign out?',
      message: 'Any cheatsheet questions you have not saved to Firebase stay on this device as a local draft.',
      confirmLabel: 'Sign out',
      tone: 'danger',
    });
    if (ok) logout();
  };

  const initials = (user?.name || user?.username || '?').trim().slice(0, 2).toUpperCase();

  return (
    <div className="ad-app">
      <header className="ad-topbar">
        <div className="ad-topbar__inner">
          <button type="button" className="ad-topbar__brand" onClick={() => navigate('/admin')} aria-label="Dashboard">
            <Logo size={30} tagline={isAdmin ? 'Admin console' : 'Author studio'} />
          </button>

          <nav className="ad-nav" aria-label="Main">
            <NavLink to="/admin" end className={({ isActive }) => `ad-nav__link${isActive ? ' is-active' : ''}`}>
              <LayoutGrid size={16} /> <span>Dashboard</span>
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin/examites" className={({ isActive }) => `ad-nav__link${isActive ? ' is-active' : ''}`}>
                <Users size={16} /> <span>Examites</span>
              </NavLink>
            )}
          </nav>

          <div className="ad-user">
            <span className="ad-user__avatar" aria-hidden="true">{initials}</span>
            <span className="ad-user__text">
              <span className="ad-user__name">{user?.name || user?.username}</span>
              <span className="ad-user__role">
                {isAdmin ? user?.adminRole || 'Admin' : 'Author'} · {user?.collegeName || user?.collegeId}
              </span>
            </span>
            <button type="button" className="neo-icon-btn neo-icon-btn--danger" onClick={handleLogout} aria-label="Sign out" title="Sign out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className={`ad-container${wide ? ' ad-container--wide' : ''}`}>
        {crumbs?.length > 0 && (
          <nav className="ad-crumbs" aria-label="Breadcrumb">
            {crumbs.map((c, i) => {
              const last = i === crumbs.length - 1;
              return (
                <span key={i} className="ad-crumbs__item">
                  {last || !c.to ? (
                    <span className={last ? 'is-current' : ''}>{c.label}</span>
                  ) : (
                    <button type="button" onClick={() => navigate(c.to, { state: c.state })}>{c.label}</button>
                  )}
                  {!last && <ChevronRight size={12} />}
                </span>
              );
            })}
          </nav>
        )}

        {(title || actions) && (
          <div className="ad-pagehead">
            <div className="ad-pagehead__text">
              {eyebrow && <span className="neo-eyebrow">{eyebrow}</span>}
              {title && <h1 className="ad-pagehead__title">{title}</h1>}
              {subtitle && <div className="ad-pagehead__sub">{subtitle}</div>}
            </div>
            {actions && <div className="ad-pagehead__actions">{actions}</div>}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
