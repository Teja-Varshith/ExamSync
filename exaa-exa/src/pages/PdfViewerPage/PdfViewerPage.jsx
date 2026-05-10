import { useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';

import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

import './PdfViewerPage.css';

// Served locally from public/ — no CDN latency
const PDFJS_WORKER_URL = '/pdf.worker.min.js';

/**
 * Wrap any external PDF URL through our Vercel serverless proxy.
 * This fetches the PDF server-side, bypassing all CORS restrictions.
 * Same-origin URLs are returned as-is.
 */
function getProxiedUrl(rawUrl) {
  if (!rawUrl) return '';
  try {
    const parsed = new URL(rawUrl, window.location.origin);
    // If same origin, no proxy needed
    if (parsed.origin === window.location.origin) return rawUrl;
  } catch {
    // Relative URL — no proxy needed
    return rawUrl;
  }
  return `/api/pdf-proxy?url=${encodeURIComponent(rawUrl)}`;
}

/**
 * Isolated native PDF viewer component.
 * Each instance creates its own fresh plugin — avoids stale plugin bugs
 * when React re-mounts the component on navigation.
 */
function NativePdfViewer({ fileUrl, onLoad, onError }) {
  // Called at top level — defaultLayoutPlugin() uses hooks internally
  // so it CANNOT be wrapped in useMemo. key={url} on this component handles re-creation.
  const pluginInstance = defaultLayoutPlugin();

  return (
    <Worker workerUrl={PDFJS_WORKER_URL}>
      <Viewer
        fileUrl={fileUrl}
        plugins={[pluginInstance]}
        onDocumentLoad={onLoad}
        renderError={() => {
          setTimeout(onError, 0);
          return <div className="pdf-viewer-empty">Switching to fallback viewer…</div>;
        }}
      />
    </Worker>
  );
}

export default function PdfViewerPage() {
  const { subjectId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const rawPdfUrl = useMemo(() => searchParams.get('url') || '', [searchParams]);
  const title = useMemo(() => searchParams.get('title') || 'PDF Preview', [searchParams]);
  const viewType = useMemo(() => searchParams.get('type') || 'notes', [searchParams]);
  const backLabel = viewType === 'pyqs' ? 'Back to PYQs' : 'Back to Notes';
  const backTab = viewType === 'pyqs' ? 'pyqs' : 'notes';

  // Route external PDFs through the Vercel proxy to avoid CORS
  const pdfUrl = useMemo(() => getProxiedUrl(rawPdfUrl), [rawPdfUrl]);

  const [viewerMode, setViewerMode] = useState('native');
  const [isLoading, setIsLoading] = useState(true);

  // Google Docs Viewer as a last-resort fallback (uses raw URL, not proxied)
  const googleViewerUrl = useMemo(() => {
    if (!rawPdfUrl) return '';
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(rawPdfUrl)}`;
  }, [rawPdfUrl]);

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(`/subject/${encodeURIComponent(subjectId)}`, { replace: true });
    }
  };

  // If the proxy + native viewer still fails, try Google Docs Viewer
  const switchToGoogleViewer = useCallback(() => {
    setViewerMode('google');
    setIsLoading(true);
  }, []);

  const handleDocumentLoadSuccess = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <div className="pdf-viewer-page">
      <div className="pdf-viewer-header">
        <button type="button" className="pdf-back-btn" onClick={handleBack}>
          <ChevronLeft size={16} /> {backLabel}
        </button>
        <div className="pdf-viewer-title">{title}</div>
      </div>

      {!rawPdfUrl ? (
        <div className="pdf-viewer-empty">No PDF link provided.</div>
      ) : (
        <div className="pdf-viewer-container">
          {isLoading && (
            <div className="pdf-viewer-loading">
              <Loader2 size={32} className="pdf-spinner" />
              <span>Loading PDF…</span>
            </div>
          )}

          {viewerMode === 'native' && (
            <NativePdfViewer
              key={rawPdfUrl}
              fileUrl={pdfUrl}
              onLoad={handleDocumentLoadSuccess}
              onError={switchToGoogleViewer}
            />
          )}

          {viewerMode === 'google' && (
            <iframe
              key={rawPdfUrl}
              className="pdf-viewer-google-frame"
              title={title}
              src={googleViewerUrl}
              onLoad={handleIframeLoad}
            />
          )}
        </div>
      )}
    </div>
  );
}
