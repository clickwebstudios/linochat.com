import { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

function isChunkLoadError(error: Error): boolean {
  return (
    error.name === 'ChunkLoadError' ||
    error.message.includes('dynamically imported module') ||
    error.message.includes('Failed to fetch dynamically imported module') ||
    error.message.includes('Loading chunk')
  );
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack);
    // Auto-reload once on chunk load failures (stale deploy)
    if (isChunkLoadError(error) && !sessionStorage.getItem('chunk_reload')) {
      sessionStorage.setItem('chunk_reload', '1');
      window.location.reload();
    }
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center min-h-[300px]">
          <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
          <h2 className="text-lg font-semibold mb-1">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <Button variant="outline" onClick={this.reset}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
