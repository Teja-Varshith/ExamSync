import { Download } from 'lucide-react';

export default function PDFDownloadButton({ targetId, fileName }) {
  // A simple mockup as PDF processing depends on external libraries like html2pdf or jsPDF
  // In a real environment, you'd trigger rendering of targetId dom element here.
  const handleDownload = () => {
    alert(`This would dynamically fetch the element: #${targetId} and trigger a download mechanism for ${fileName}.pdf`);
  };

  return (
    <button 
      onClick={handleDownload}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 12px',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--color-primary)',
        fontWeight: 'var(--font-weight-medium)',
        fontSize: 'var(--font-size-xs)'
      }}
    >
      <Download size={14} />
      PDF
    </button>
  );
}
