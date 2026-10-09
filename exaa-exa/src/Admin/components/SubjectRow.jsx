import { PencilLine, FileStack, BookOpenText } from 'lucide-react';
import AbstractArt from '../../components/brand/AbstractArt';
import NeoButton from '../../components/ui/NeoButton';
import { normalizeBranches } from '../../constants/branches';

/**
 * One subject in the Admin / Author dashboards.
 * onDetails (admin only) → edit metadata · onContent → syllabus/notes/PYQs · onSheets → cheat sheets
 */
export default function SubjectRow({ subject, index = 0, showSemester = false, onDetails, onContent, onSheets }) {
  const code = subject.courseCode || subject.code || '';
  const branches = normalizeBranches(subject.branches);
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
        <div className="ad-subject__branches" aria-label="Branches">
          {branches.map((b) => <span key={b} className="ad-branch">{b}</span>)}
        </div>
      </div>
      <div className="ad-subject__actions">
        {onDetails && (
          <NeoButton size="small" variant="secondary" kind="flat" icon={PencilLine} onClick={() => onDetails(subject)} aria-label={`Edit details of ${subject.name}`}>
            Edit
          </NeoButton>
        )}
        <NeoButton size="small" variant="secondary" kind="flat" icon={BookOpenText} onClick={() => onContent(subject)} aria-label={`Edit syllabus, notes and PYQs of ${subject.name}`}>
          Content
        </NeoButton>
        <NeoButton size="small" icon={FileStack} onClick={() => onSheets(subject)} aria-label={`Cheat sheets for ${subject.name}`}>
          Cheat sheets
        </NeoButton>
      </div>
    </article>
  );
}
