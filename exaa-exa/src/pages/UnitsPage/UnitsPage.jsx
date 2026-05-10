import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../../components/Header/Header';
import HeroBanner from '../../components/HeroBanner/HeroBanner';
import ProgressRing from '../../components/ProgressRing/ProgressRing';
import UnitCard from '../../components/UnitCard/UnitCard';
import Loader from '../../components/Loader/Loader';
import api from '../../services/api';
import './UnitsPage.css';

export default function UnitsPage() {
  const { subjectId } = useParams();
  const normalizedSubjectId = subjectId ? decodeURIComponent(subjectId) : '';
  
  const [subject, setSubject] = useState(null);
  const [subjectUnits, setSubjectUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchSubjectDetails = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await api.getSubjectById(normalizedSubjectId);
        if (res.data) {
          setSubject(res.data);
          
          // Generate units array from the detailed syllabus object
          // Syllabus looks like: { "1": { name: "Unit Name", topics: "topics..." }, "2": ... }
          const syllabusData = res.data.syllabus || {};
          const unitsArray = Object.entries(syllabusData).map(([unitNum, unitData]) => {
            // Handle backwards compatibility (in case old data is just a string)
            const isDetailed = typeof unitData === 'object';
            const unitName = isDetailed ? unitData.name : `Unit ${unitNum}`;
            const unitTopics = isDetailed ? unitData.topics : unitData;

            return {
              id: `unit-${unitNum}`,
              unitNumber: unitNum,
              title: unitName || `Unit ${unitNum}`,
              topics: unitTopics,
              subjectId: normalizedSubjectId
            };
          });
          
          setSubjectUnits(unitsArray);
        } else {
          setSubject(null);
        }
      } catch (err) {
        console.error('Failed to load subject details:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    
    if (normalizedSubjectId) fetchSubjectDetails();
  }, [normalizedSubjectId]);
  
  if (loading) return <Loader text="Loading units from Firebase..." />;
  
  if (error || !subject) {
    return (
      <div className="page units-page">
        <Header showBack title="Not Found" />
        <div className="empty-state">
          <p>{error ? 'Failed to fetch subject.' : 'Subject not found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page units-page">
      <Header showBack title="ExamSync" />
      
      {/* Decorative hero image area */}
      <div 
        className="units-page__hero-img"
        style={{ 
          background: subject.gradient || 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
          opacity: 0.15
        }}
      >
        <div className="units-page__hero-abstract"></div>
      </div>

      <main className="units-page__main">
        <div className="subject-info">
          <h1 className="subject-info__title">{subject.name}</h1>
          <p className="subject-info__subtitle">{subject.code} • {subject.category}</p>
          <p className="subject-info__desc">
            Semester {subject.semester} • {subject.units} Units
          </p>
          
          <div className="subject-info__progress-row">
            <div className="subject-info__progress-bar-container">
              <div 
                className="subject-info__progress-bar"
                style={{ 
                  width: `${subject.progress || 0}%`,
                  background: subject.color || 'var(--color-primary)'
                }}
              />
            </div>
            <span className="subject-info__progress-text">{subject.progress || 0}% completed</span>
          </div>
        </div>

        <div className="units-list-section">
          <h2 className="units-list__heading">Units ({subjectUnits.length})</h2>
          <div className="units-list">
            {subjectUnits.length > 0 ? (
              subjectUnits.map((unit, index) => (
                <UnitCard 
                  key={unit.id} 
                  unit={unit} 
                  subjectId={subjectId} 
                  index={index} 
                />
              ))
            ) : (
              <div className="empty-state">No syllabus topics added yet.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
