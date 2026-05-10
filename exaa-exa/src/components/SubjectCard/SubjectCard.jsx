import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProgressRing from '../ProgressRing/ProgressRing';
import './SubjectCard.css';

export default function SubjectCard({ subject, index }) {
  const delay = Math.min(index, 8) * 100;
  const subjectKey = subject.code || subject.id;
  const subjectPath = subjectKey ? `/subject/${encodeURIComponent(subjectKey)}` : '#';
  
  return (
    <Link 
      to={subjectPath} 
      className="subject-card"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="subject-card__icon" style={{ background: subject.gradient }}>
        {/* We can map icon strings to actual Lucide icons later, for now we just use a generic representation or the first letter */}
        <span className="subject-card__icon-text">{subject.name.charAt(0)}</span>
      </div>
      
      <div className="subject-card__content">
        <h3 className="subject-card__title">{subject.name}</h3>
        <p className="subject-card__subtitle">Course Code : {subject.code}</p>
        
      </div>
      
      <div className="subject-card__action">
        <ChevronRight size={20} color="var(--color-text-muted)" />
      </div>
    </Link>
  );
}
