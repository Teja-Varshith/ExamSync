import React from 'react';
import PDFDownloadButton from '../PDFDownloadButton/PDFDownloadButton';
import './NotesViewer.css';

export default function NotesViewer({ notes, onSave }) {
  if (!notes) return null;

  return (
    <div className="notes-viewer animate-fadeInUp" id="notes-viewer">
      <div className="notes-viewer-header">
        <div>
          <h1 className="notes-viewer-title">{notes.title}</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
            {notes.subject} • {notes.type === 'ai' ? '✨ AI Generated' : '📄 College Notes'}
          </p>
        </div>
        <div className="notes-viewer-actions">
          <PDFDownloadButton targetId="notes-content" fileName={notes.title} />
          {onSave && (
            <button className="btn-save" onClick={onSave} id="save-note-btn">
              💾 Save
            </button>
          )}
        </div>
      </div>

      <div className="notes-viewer-body" id="notes-content">
        
        {/* Definition */}
        <div className="notes-section">
          <h2 className="notes-section-title">Definition</h2>
          <p>{notes.definition}</p>
        </div>

        {/* Detailed Explanation */}
        <div className="notes-section">
          <h2 className="notes-section-title">Detailed Explanation</h2>
          {notes.explanation.split('\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {/* Key Points */}
        <div className="notes-section">
          <h2 className="notes-section-title">Key Points</h2>
          <ul>
            {notes.keyPoints.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>

        {/* Examples */}
        <div className="notes-section">
          <h2 className="notes-section-title">Examples</h2>
          <ul>
            {notes.examples.map((ex, i) => (
              <li key={i}>{ex}</li>
            ))}
          </ul>
        </div>

        {/* Important Exam Questions */}
        <div className="notes-section">
          <h2 className="notes-section-title">Important Exam Questions</h2>
          <div className="notes-exam-box">
            <ul>
              {notes.examQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* 2-Minute Revision Summary */}
        <div className="notes-section">
          <h2 className="notes-section-title">⚡ 2-Minute Revision Summary</h2>
          <div className="notes-revision-box">
            <p>{notes.revisionSummary}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
