import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-content">
        {/* Brand */}
        <Link to="/sync" className="brand-logo">
          <div className="brand-icon">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14l6.16-3.422A12.083 12.083 0 0121 12.76V17.5l-9 5-9-5v-4.74c.94-.46 1.89-.87 2.84-1.238L12 14z" />
            </svg>
          </div>
          ExamSync
        </Link>

        {/* Desktop Links */}
        <div className="nav-links">
          <Link to="/sync" className={`nav-link ${isActive('/sync') ? 'active' : ''}`}>
            Subjects
          </Link>
          <Link to="/sync/my-sheets" className={`nav-link ${isActive('/sync/my-sheets') ? 'active' : ''}`}>
            My Sheets
          </Link>

          {/* Mobile menu toggle (visible only on small screens via CSS later if needed, but for now we keep it simple) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="btn btn-ghost"
            style={{ display: 'none' /* Will manage via CSS media query if needed but keeping it fully flex for now */ }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}
