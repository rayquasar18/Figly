import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function fetchApi<T>(
  path: string,
  options?: RequestInit,
): Promise<T | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    if (accessToken) {
      (headers as Record<string, string>)['Cookie'] = `access_token=${accessToken}`;
    }

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}
