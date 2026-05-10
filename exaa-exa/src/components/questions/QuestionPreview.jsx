import React from 'react';

/**
 * QuestionPreview — Displays a saved question as a card.
 *
 * Renders:
 * - Question title
 * - Answer HTML content (rendered safely)
 * - Created date
 * - Delete button
 *
 * Images in the answer HTML are rendered using standard <img> tags.
 *
 * @param {Object} question - { id, question, answerHtml, createdAt }
 * @param {Function} onDelete - Callback when delete button is clicked
 */
export default function QuestionPreview({ question, onDelete }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
      {/* Card Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
            {question.question}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Created: {question.createdAt}
          </p>
        </div>

        {/* Delete Button */}
        {onDelete && (
          <button
            onClick={() => onDelete(question.id)}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 cursor-pointer"
            title="Delete question"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Answer Content — rendered as HTML */}
      <div className="px-6 py-4">
        <div
          className="answer-preview text-slate-700 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: question.answerHtml }}
        />
      </div>
    </div>
  );
}
