'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Check if it's a Chrome translation DOM error
    if (
      error.name === 'NotFoundError' &&
      error.message.includes('insertBefore')
    ) {
      // Silently recover by reloading
      console.warn('Chrome translation caused DOM error, recovering...');
      window.location.reload();
      return;
    }

    // Log other errors
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null; // Will reload anyway
    }

    return this.props.children;
  }
}
