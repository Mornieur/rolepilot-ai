export type ProfileActionState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialProfileActionState: ProfileActionState = { status: 'idle' };
