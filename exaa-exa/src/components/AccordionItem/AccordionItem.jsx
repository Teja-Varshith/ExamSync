import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './AccordionItem.css';

export default function AccordionItem({ title, subTitle, content, index }) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef(null);
  const [height, setHeight] = useState('0px');

  const delay = Math.min(index, 8) * 50;

  useEffect(() => {
    if (isOpen) {
      setHeight(`${contentRef.current.scrollHeight}px`);
    } else {
      setHeight('0px');
    }
  }, [isOpen, content]); // Recalculate if content changes while open

  return (
    <div 
      className={`accordion-item ${isOpen ? 'accordion-item--open' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <button 
        className="accordion-item__header" 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="accordion-item__title-group">
          {subTitle && <span className="accordion-item__subtitle">{subTitle}</span>}
          <h3 className="accordion-item__title">{title}</h3>
        </div>
        <ChevronDown 
          className={`accordion-item__icon ${isOpen ? 'accordion-item__icon--rotated' : ''}`} 
          size={20} 
        />
      </button>
      
      <div 
        className="accordion-item__content-wrapper"
        style={{ height }}
      >
        <div className="accordion-item__content" ref={contentRef}>
          {typeof content === 'string' ? (
            <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
          ) : (
            content
          )}
        </div>
      </div>
    </div>
  );
}
