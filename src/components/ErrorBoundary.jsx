import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (this.state.error !== error.message) {
      console.error('Error caught by boundary:', error, errorInfo);
      this.setState(prevState => ({
        error,
        errorInfo,
        errorCount: prevState.errorCount + 1,
      }));
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  render() {
    if (this.state.hasError) {
      const isAuthContextError = this.state.error?.message?.includes('useAuth');

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-100 rounded-full p-3">
                <AlertCircle className="text-red-600" size={24} />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
              {isAuthContextError ? 'Loading...' : 'Oops! Something went wrong'}
            </h1>

            <p className="text-gray-600 text-center mb-6">
              {isAuthContextError
                ? 'The app is initializing. This should resolve in a moment.'
                : 'An unexpected error occurred. Please try refreshing the page.'}
            </p>

            {!isAuthContextError && this.state.error && (
              <div className="bg-gray-50 rounded p-3 mb-6 max-h-40 overflow-auto text-xs text-gray-700 font-mono">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw size={18} />
              {isAuthContextError ? 'Continue' : 'Refresh Page'}
            </button>

            {!isAuthContextError && (
              <p className="text-xs text-gray-500 text-center mt-4">
                Error ID: {this.state.errorCount}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
