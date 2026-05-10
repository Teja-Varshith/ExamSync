import './TabBar.css';

export default function TabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div className="tab-bar">
      <div className="tab-bar__scroll-container">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-bar__item ${activeTab === tab.id ? 'tab-bar__item--active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
