import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppShell } from './app-shell';

describe('AppShell', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    delete document.documentElement.dataset.theme;
  });
  it('provides accessible primary navigation and persists the selected theme', () => {
    render(
      <AppShell>
        <main>Page content</main>
      </AppShell>,
    );
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Insights' })).toHaveAttribute('href', '/insights');
    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('rolepilot-theme')).toBe('dark');
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
