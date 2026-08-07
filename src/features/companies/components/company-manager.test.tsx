import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/companies/actions', () => ({
  initialCompanyActionState: { status: 'idle' },
  createTargetCompanyAction: vi.fn(),
  updateTargetCompanyAction: vi.fn(),
  deleteTargetCompanyAction: vi.fn(),
  setTargetCompanyEnabledAction: vi.fn(),
}));

import { CompanyManager } from './company-manager';
import type { TargetCompany } from '@/types/domain';

const companies: TargetCompany[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Example Platform',
    provider: 'greenhouse',
    boardIdentifier: 'example-platform',
    careersUrl: 'https://careers.example.test',
    enabled: true,
    priority: 'high',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Sample Studio',
    provider: 'lever',
    boardIdentifier: 'sample-studio',
    enabled: false,
    priority: 'normal',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

describe('CompanyManager', () => {
  it('renders the company form and empty state', () => {
    render(<CompanyManager companies={[]} />);
    expect(screen.getByLabelText('Company name')).toBeInTheDocument();
    expect(
      screen.getByText(
        'No companies are configured. Add a company before automatic job collection can begin.',
      ),
    ).toBeInTheDocument();
  });
  it('shows enabled and disabled status plus priority', () => {
    render(<CompanyManager companies={companies} />);
    expect(screen.getByText('Monitoring enabled')).toBeInTheDocument();
    expect(screen.getByText('Monitoring disabled')).toBeInTheDocument();
    expect(screen.getByText('high priority')).toBeInTheDocument();
  });
});
