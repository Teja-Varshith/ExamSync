import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Sidebar component — optional side navigation for wider screens.
 * Provides quick access to main sections and displays stats.
 */
export default function Sidebar({ questionCount = 0 }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;
  const startsWith = (prefix) => location.pathname.startsWith(prefix);

  const linkClass = (active) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-blue-50 text-blue-600 border border-blue-100'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`;

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 p-4 gap-2 min-h-[calc(100vh-4rem)]">
      {/* Main Navigation */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mb-2">
          Main
        </p>
        <Link to="/dashboard" className={linkClass(isActive('/dashboard'))}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
          </svg>
          Subjects
        </Link>
        <Link to="/my-sheets" className={linkClass(isActive('/my-sheets'))}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          My Sheets
        </Link>
      </div>

      {/* Author Tools */}
      <div className="space-y-1 mt-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mb-2">
          Author Tools
        </p>
        <Link to="/create" className={linkClass(isActive('/create'))}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Question
        </Link>
        <Link to="/questions" className={linkClass(isActive('/questions'))}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          View Questions
        </Link>
      </div>

      {/* Stats Card */}
      <div className="mt-auto">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <p className="text-2xl font-bold text-blue-600">{questionCount}</p>
          <p className="text-sm text-slate-500">Total Questions</p>
        </div>
      </div>
    </aside>
  );
}
