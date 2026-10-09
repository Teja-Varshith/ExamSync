import { EmptyArt } from '../brand/Illustrations';
import './ui.css';

export default function EmptyState({ title, message, art, action, compact = false }) {
  return (
    <div className={`neo-empty${compact ? ' neo-empty--compact' : ''}`}>
      {art ?? <EmptyArt size={compact ? 96 : 128} />}
      {title && <h3 className="neo-empty__title">{title}</h3>}
      {message && <p className="neo-empty__message">{message}</p>}
      {action && <div className="neo-empty__action">{action}</div>}
    </div>
  );
}
