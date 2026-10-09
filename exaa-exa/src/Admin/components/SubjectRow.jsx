import { PencilLine, FileStack } from 'lucide-react';
import AbstractArt from '../../components/brand/AbstractArt';
import NeoButton from '../../components/ui/NeoButton';

/** One subject in the Admin / Author dashboards. */
export default function SubjectRow({ subject, index = 0, showSemester = false, onEdit, onSheets }) {
  const code = subject.courseCode || subject.code || '';
  return (
    <article className="ad-subject" style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}>
      <div className="ad-subject__art">
        <AbstractArt seed={code || subject.id} size={64} />
      </div>
      <div className="ad-subject__info">
        <h3 className="ad-subject__name">{subject.name}</h3>
        <div className="ad-subject__meta">
          {code && <span className="ad-code">{code}</span>}
          {subject.courseType && <span>{subject.courseType.replace('Professional ', '')}</span>}
          {showSemester && subject.semester && <span>Sem {subject.semester}</span>}
          <span>{subject.units} unit{subject.units !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <div className="ad-subject__actions">
        <NeoButton size="small" variant="secondary" kind="flat" icon={PencilLine} onClick={() => onEdit(subject)} aria-label={`Edit ${subject.name}`}>
          Edit
        </NeoButton>
        <NeoButton size="small" icon={FileStack} onClick={() => onSheets(subject)} aria-label={`Cheat sheets for ${subject.name}`}>
          Cheat sheets
        </NeoButton>
      </div>
    </article>
  );
}
