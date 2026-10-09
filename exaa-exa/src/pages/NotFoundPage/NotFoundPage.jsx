import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import Logo from '../../components/brand/Logo';
import { NotFoundArt } from '../../components/brand/Illustrations';
import NeoButton from '../../components/ui/NeoButton';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="page not-found">
      <header className="not-found__bar">
        <Logo size={30} />
      </header>
      <main className="not-found__main">
        <NotFoundArt size={240} />
        <h1 className="neo-display not-found__title">This page skipped class.</h1>
        <p className="not-found__text">
          The link may be broken or the page was moved. Let&apos;s get you back to your subjects.
        </p>
        <NeoButton size="big" icon={Home} onClick={() => navigate('/', { replace: true })}>
          Back to subjects
        </NeoButton>
      </main>
    </div>
  );
}
