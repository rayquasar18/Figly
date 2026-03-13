export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
  };
  tokens: TokenPair;
}
