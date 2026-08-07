import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StyledComponentsRegistry } from './styled-components-registry';
describe('StyledComponentsRegistry', () => {
  it('renders children in the test environment', () => {
    render(
      <StyledComponentsRegistry>
        <p>Registry child</p>
      </StyledComponentsRegistry>,
    );
    expect(screen.getByText('Registry child')).toBeInTheDocument();
  });
});
