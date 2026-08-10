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
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Insights' })).toHaveAttribute('href', '/insights');
    expect(screen.getByRole('link', { name: 'Avaliar vagas' })).toHaveAttribute(
      'href',
      '/jobs/evaluate',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Mudar para tema escuro' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('rolepilot-theme')).toBe('dark');
    expect(screen.getByRole('button', { name: 'Mudar para tema claro' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
