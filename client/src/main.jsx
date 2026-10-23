import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('GameDash Uncaught Render Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 text-on-surface">
          <div className="max-w-md w-full p-6 rounded-2xl bg-surface-container border border-error/40 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h1 className="title-large font-bold text-on-surface">Something went wrong</h1>
            <p className="body-medium text-on-surface-variant">
              An unexpected error occurred while rendering the console terminal.
            </p>
            {this.state.error && (
              <pre className="text-left p-3 rounded-lg bg-surface-container-lowest text-error text-xs overflow-auto max-h-36 font-mono border border-outline-variant/20">
                {this.state.error.toString()}
              </pre>
            )}
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold transition-colors"
              >
                Clear Cache & Reset
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold transition-colors shadow-md"
              >
                Reload GameDash
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
