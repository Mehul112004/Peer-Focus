import { v4 as uuidv4 } from 'uuid';

interface SessionUser {
  id: string;
  display_name: string;
}

function getSessionUser(): SessionUser | null {
  try {
    const stored = localStorage.getItem('peer-focus-session');
    if (stored) {
      return JSON.parse(stored) as SessionUser;
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

export function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return '';

  // First check for authenticated session
  const session = getSessionUser();
  if (session?.id) return session.id;

  // Fallback to anonymous UUID
  let userId = localStorage.getItem('peer-focus-user-id');
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem('peer-focus-user-id', userId);
  }
  return userId;
}

export function getUserName(): string {
  if (typeof window === 'undefined') return '';

  // First check for authenticated session
  const session = getSessionUser();
  if (session?.display_name) return session.display_name;

  return localStorage.getItem('peer-focus-user-name') || '';
}

export function setUserName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('peer-focus-user-name', name);
}
