import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';

// Create a mock for useAuth
const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('ProtectedRoute Component', () => {
  it('redirects unauthenticated users to the login page', () => {
    // Simulate user not being logged in
    mockUseAuth.mockReturnValue({ user: null });
    
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route 
            path="/protected" 
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );
    
    // Expect the login page to be rendered
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    // Protected content should NOT be in the document
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('allows authenticated users with correct role to view content', () => {
    // Simulate a student user
    mockUseAuth.mockReturnValue({ user: { role: 'student' } });
    
    render(
      <MemoryRouter initialEntries={['/student']}>
        <Routes>
          <Route 
            path="/student" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <div>Student Dashboard</div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );
    
    // Expect the protected content to be rendered
    expect(screen.getByText('Student Dashboard')).toBeInTheDocument();
  });
});
