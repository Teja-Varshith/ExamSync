import React, { useState } from 'react';
import Editor from '../editor/Editor';

/**
 * QuestionForm — Form for creating a new question with a rich text answer.
 *
 * Contains:
 * 1. Question title input field
 * 2. TipTap rich text editor for the answer
 * 3. Save button
 *
 * @param {Function} onSave - Callback with { question, answerHtml } when saved
 */
export default function QuestionForm({ onSave }) {
  const [question, setQuestion] = useState('');
  const [answerHtml, setAnswerHtml] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  /**
   * Handle form submission.
   * Validates inputs, calls the save callback, and shows success feedback.
   */
  const handleSave = async () => {
    // Basic validation
    if (!question.trim()) {
      alert('Please enter a question title.');
      return;
    }
    if (!answerHtml || answerHtml === '<p></p>') {
      alert('Please write an answer before saving.');
      return;
    }

    setSaving(true);

    // Simulate a small delay for realistic UX
    await new Promise((resolve) => setTimeout(resolve, 400));

    onSave({ question: question.trim(), answerHtml });

    setSaving(false);
    setSaved(true);

    // Reset form after short delay
    setTimeout(() => {
      setQuestion('');
      setAnswerHtml('');
      setSaved(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Question Title Input */}
      <div>
        <label
          htmlFor="question-input"
          className="block text-sm font-semibold text-slate-700 mb-2"
        >
          Question Title
        </label>
        <input
          id="question-input"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g., What is Newton's Second Law?"
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
      </div>

      {/* Rich Text Editor for Answer */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Answer
        </label>
        <Editor onContentChange={setAnswerHtml} />
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl shadow-sm hover:bg-blue-600 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </span>
          ) : (
            'Save Question'
          )}
        </button>

        {/* Success feedback */}
        {saved && (
          <span className="text-green-600 font-medium flex items-center gap-1 animate-fade-in">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Question saved successfully!
          </span>
        )}
      </div>
    </div>
  );
}
