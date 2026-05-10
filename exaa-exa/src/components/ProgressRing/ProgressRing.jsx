import { useEffect, useState } from 'react';
import './ProgressRing.css';

export default function ProgressRing({ progress, size = 64, strokeWidth = 6, color = 'var(--color-primary)' }) {
  const [offset, setOffset] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    const progressOffset = circumference - (progress / 100) * circumference;
    // Small timeout to allow the transition to play
    setTimeout(() => setOffset(progressOffset), 50);
  }, [progress, circumference]);

  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg className="progress-ring__svg" width={size} height={size}>
        {/* Background ring */}
        <circle
          className="progress-ring__circle-bg"
          stroke="var(--color-border-light)"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress ring */}
        <circle
          className="progress-ring__circle-progress"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset: offset || circumference }}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeLinecap="round"
        />
      </svg>
      <div className="progress-ring__text">
        <span>{progress}%</span>
      </div>
    </div>
  );
}
