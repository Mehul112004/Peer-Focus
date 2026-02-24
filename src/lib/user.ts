import { v4 as uuidv4 } from 'uuid';

export function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return '';
  
  let userId = localStorage.getItem('peer-focus-user-id');
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem('peer-focus-user-id', userId);
  }
  return userId;
}

export function getUserName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('peer-focus-user-name') || '';
}

export function setUserName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('peer-focus-user-name', name);
}
