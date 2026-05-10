import { useState } from 'react';
import './TopicItem.css';

export default function TopicItem({ topic, index }) {
  const delay = Math.min(index, 8) * 50;
  // Local state just for visual feedback, usually you'd sync this with backend
  const [completed, setCompleted] = useState(topic.completed);

  return (
    <div 
      className={`topic-item ${completed ? 'topic-item--completed' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => setCompleted(!completed)}
    >
      <div className="topic-item__number-col">
        <span className="topic-item__number">{topic.number}</span>
      </div>
      <div className="topic-item__content-col">
        <span className="topic-item__title">{topic.title}</span>
      </div>
    </div>
  );
}
