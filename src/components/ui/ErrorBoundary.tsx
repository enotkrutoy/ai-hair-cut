
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Explicitly extend React.Component to ensure props and state generics are correctly applied
export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-2xl font-display font-bold text-white mb-4">Упс! Что-то пошло не так.</h2>
          <p className="text-gray-400 mb-6 max-w-md">
            Произошла непредвиденная ошибка в интерфейсе. Попробуйте перезагрузить страницу.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-neon-purple text-white rounded-full font-bold hover:scale-105 transition-transform"
          >
            Обновить студию
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-8 p-4 bg-black/50 text-red-400 text-xs text-left overflow-auto max-w-full">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    // Correctly accessing children from this.props which is defined in the Props interface
    return this.props.children;
  }
}
