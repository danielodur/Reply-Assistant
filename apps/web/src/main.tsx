import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Crash caught by ErrorBoundary:', error, errorInfo);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ background: '#fff', color: 'red', padding: '20px', height: '100vh', width: '100vw', overflow: 'auto' }}>
          <h1 style={{ fontSize: '16px', fontWeight: 'bold' }}>App Crashed</h1>
          <pre style={{ fontSize: '10px', marginTop: '10px', whiteSpace: 'pre-wrap' }}>{this.state.error.message}</pre>
          <pre style={{ fontSize: '10px', marginTop: '10px', whiteSpace: 'pre-wrap' }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
