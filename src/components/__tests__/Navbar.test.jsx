import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Navbar from '../Navbar';

// Mock the AuthContext
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: null, // Simulate an unauthenticated user
  }),
}));

// Mock the react-i18next translation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: vi.fn(),
      language: 'en',
    },
  }),
}));

describe('Navbar Component', () => {
  it('renders the logo correctly', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
    
    // Check if the logo text "ZENITH" is present
    const logoElement = screen.getByText(/ZENITH/i);
    expect(logoElement).toBeInTheDocument();
  });

  it('renders login and register buttons for unauthenticated users', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
    
    // Using the translation keys since we mocked t() to return the key
    expect(screen.getByText('nav.login')).toBeInTheDocument();
    expect(screen.getByText('nav.register')).toBeInTheDocument();
  });
});
