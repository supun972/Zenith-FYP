import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ErrorBoundary from '../ErrorBoundary';

// A component that intentionally throws an error
const ProblematicChild = () => {
  throw new Error("Test Error: This is intentional");
};

describe('ErrorBoundary Component', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="safe-child">I am safe</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByTestId('safe-child')).toBeInTheDocument();
  });

  it('catches errors and displays fallback UI', () => {
    // Suppress console.error for this specific test so it doesn't clutter the test output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <ProblematicChild />
      </ErrorBoundary>
    );
    
    // Check if the fallback UI is rendered
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });
});
