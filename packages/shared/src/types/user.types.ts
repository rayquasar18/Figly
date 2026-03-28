export interface PublicUser {
  id: string;
  email: string;
  name: string;
  username: string | null;
  emailVerified: boolean;
  role?: 'USER' | 'ADMIN';
}
