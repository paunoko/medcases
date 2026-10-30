import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
          <div className="max-w-md w-full bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <h2 className="text-xl font-bold text-red-400">Jokin meni pieleen</h2>
            <p className="text-sm text-gray-300">
              Näkymän renderöinnissä tapahtui odottamaton virhe.
            </p>
            {this.state.error && (
              <pre className="text-xs bg-gray-950 p-3 rounded-lg text-red-300 font-mono text-left overflow-x-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
              >
                Päivitä sivu
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
              >
                Etusivulle
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
