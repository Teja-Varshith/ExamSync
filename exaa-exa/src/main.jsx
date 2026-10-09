import { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './styles/neopop.css';
import './styles/admin-neopop.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="crash-screen">
          <span className="neo-eyebrow">Something broke</span>
          <h1 className="neo-display">We hit a snag.</h1>
          <p>Reloading usually fixes it. If it keeps happening, share the details below with the team.</p>
          <button type="button" className="crash-screen__btn" onClick={() => window.location.reload()}>
            Reload ExamSync
          </button>
          <details>
            <summary>Technical details</summary>
            <pre>
              {this.state.error?.toString()}
              {'\n'}
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
