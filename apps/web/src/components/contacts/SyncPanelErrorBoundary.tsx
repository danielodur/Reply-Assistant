import { Component, type ErrorInfo, type ReactNode } from 'react';

type SyncPanelErrorBoundaryProps = {
  fallbackTitle: string;
  fallbackBody: string;
  children: ReactNode;
};

type SyncPanelErrorBoundaryState = {
  hasError: boolean;
};

export default class SyncPanelErrorBoundary extends Component<
  SyncPanelErrorBoundaryProps,
  SyncPanelErrorBoundaryState
> {
  state: SyncPanelErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): SyncPanelErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo): void {
    // Keep diagnostics in dev/prod console for quick triage without crashing the whole renderer.
    console.error('[sync-panel] render crash', error, errorInfo);
  }

  componentDidUpdate(prevProps: SyncPanelErrorBoundaryProps): void {
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="rounded-[10px] border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
          <p className="font-semibold">{this.props.fallbackTitle}</p>
          <p className="mt-1 leading-5">{this.props.fallbackBody}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
