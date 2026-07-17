import type { AuthError, Session, User } from "@supabase/supabase-js";

export type AuthUser = User;
export type AuthSession = Session;

export type AuthResult = {
  error: AuthError | null;
};

export type SignUpResult = AuthResult & {
  requiresEmailConfirmation: boolean;
};

export type SignUpInput = {
  email: string;
  password: string;
};

export type SignInInput = {
  email: string;
  password: string;
};

export type AuthContextValue = {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;

  signUp: (input: SignUpInput) => Promise<SignUpResult>;

  signIn: (input: SignInInput) => Promise<AuthResult>;

  signOut: () => Promise<AuthResult>;

  resetPassword: (email: string) => Promise<AuthResult>;

  updatePassword: (password: string) => Promise<AuthResult>;
};
