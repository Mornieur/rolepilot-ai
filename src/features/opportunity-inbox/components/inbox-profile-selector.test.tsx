import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

import { InboxProfileSelector } from './inbox-profile-selector';

describe('InboxProfileSelector', () => {
  beforeEach(() => push.mockReset());

  it('navigates to the selected profile using the Inbox query-string semantics', () => {
    render(
      <InboxProfileSelector
        profiles={[
          { id: 'profile-1', name: 'Maria' },
          { id: 'profile 2', name: 'Flavia' },
        ]}
        profileId="profile-1"
      />,
    );

    fireEvent.change(screen.getByLabelText('Perfil'), { target: { value: 'profile 2' } });

    expect(push).toHaveBeenCalledWith('/inbox?profileId=profile%202');
  });
});
