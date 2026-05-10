import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './UnitCard.css';

export default function UnitCard({ unit, subjectId, index }) {
  const delay = Math.min(index, 8) * 50;
  const encodedSubjectId = subjectId ? encodeURIComponent(subjectId) : '';
  
  return (
    <Link 
      to={`/subject/${encodedSubjectId}/unit/${unit.id}`} 
      className="unit-card"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="unit-card__content" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="unit-card__number">{unit.unitNumber}.</span>
          <h3 className="unit-card__title">{unit.title}</h3>
        </div>
        {unit.topics && (
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {unit.topics}
          </p>
        )}
      </div>
      <div className="unit-card__action">
        <ChevronRight size={20} color="var(--color-text-muted)" />
      </div>
    </Link>
  );
}
