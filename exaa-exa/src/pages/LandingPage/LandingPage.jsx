import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Mail, ShieldCheck } from 'lucide-react';
import Logo from '../../components/brand/Logo';
import bannerImg from '../../assets/examsync-banner.jpg';
import './LandingPage.css';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.tejavarshith.UniSyncv1';
const INSTAGRAM_URL = 'https://www.instagram.com/unisyncofficial/';
const CONTACT_EMAIL = 'hello@unisyncapp.in';

function GooglePlayIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3.609 1.814L13.793 12 3.61 22.186a2.023 2.023 0 0 1-.61-.92V2.734c.148-.372.368-.696.609-.92zm11.3 11.3l2.365 2.365-12.06 6.945 9.695-9.31zm0-2.228L5.214 1.571l12.06 6.945-2.365 2.37zm1.118 1.114l3.642 2.099a1.503 1.503 0 0 1 0 2.602l-3.642 2.099-2.585-2.585 2.585-2.215z" />
    </svg>
  );
}

function InstagramIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export default function LandingPage() {
  useEffect(() => {
    document.body.classList.add('landing-mode');
    return () => {
      document.body.classList.remove('landing-mode');
    };
  }, []);

  return (
    <div className="page lp-page">
      {/* ── Navigation bar ── */}
      <header className="lp-header">
        <div className="lp-header__inner">
          <Link to="/" className="lp-brand" aria-label="ExamSync Home">
            <Logo size={26} />
          </Link>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="lp-main">
        <section className="lp-hero">
          {/* Main Title */}
          <h1 className="lp-title neo-display">
            Explore the <span className="lp-title__accent">ExamSync</span>
          </h1>

          {/* Action CTAs (placed before the banner image) */}
          <div className="lp-actions">
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="lp-cta lp-cta--play"
            >
              <div className="lp-cta__icon">
                <GooglePlayIcon size={24} />
              </div>
              <div className="lp-cta__content">
                <span className="lp-cta__eyebrow">Explore ExamSync on</span>
                <span className="lp-cta__main">Google Play Store</span>
              </div>
              <ExternalLink size={16} className="lp-cta__arrow" />
            </a>

            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="lp-cta lp-cta--insta"
            >
              <div className="lp-cta__icon">
                <InstagramIcon size={24} />
              </div>
              <div className="lp-cta__content">
                <span className="lp-cta__eyebrow">Follow our updates on</span>
                <span className="lp-cta__main">@unisyncofficial</span>
              </div>
              <ExternalLink size={16} className="lp-cta__arrow" />
            </a>

            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="lp-cta lp-cta--contact"
            >
              <div className="lp-cta__icon">
                <Mail size={24} />
              </div>
              <div className="lp-cta__content">
                <span className="lp-cta__eyebrow">For queries contact</span>
                <span className="lp-cta__main">{CONTACT_EMAIL}</span>
              </div>
              <ExternalLink size={16} className="lp-cta__arrow" />
            </a>
          </div>

          {/* Banner Showcase Card */}
          <div className="lp-banner-card neo-plunk">
            <div className="lp-banner-frame">
              <img
                src={bannerImg}
                alt="ExamSync is now live on UniSync"
                className="lp-banner-img"
                loading="eager"
              />
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer__inner">
          <div className="lp-footer__brand">
            <Logo size={24} />
            <p className="lp-footer__copy">
              For queries contact: <a href={`mailto:${CONTACT_EMAIL}`} className="lp-footer__email">{CONTACT_EMAIL}</a>
            </p>
          </div>

          <div className="lp-footer__links">
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="lp-footer__link"
            >
              Play Store
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="lp-footer__link"
            >
              Instagram
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="lp-footer__link"
            >
              Contact
            </a>
            
          </div>
        </div>
        <div className="lp-footer__bottom">
          <span>&copy; {new Date().getFullYear()} ExamSync · UniSync. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
