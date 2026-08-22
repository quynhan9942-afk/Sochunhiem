import { TeacherProfile } from '../types';
import { loadAuthorizedTeachers, saveAuthorizedTeachers } from './storage';

export const GOOGLE_CLIENT_ID = "334712078675-a68abg1khfv1c1e8ivp6rgg97qpauros.apps.googleusercontent.com";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: any) => void;
          prompt: (momentListener?: (notification: any) => void) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          revoke: (hint: string, callback: () => void) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

/**
 * Safely parse Google JWT credential token
 */
export function parseJwt(token: string): {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
} | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse Google JWT credential token:', e);
    return null;
  }
}

/**
 * Creates or updates an Admin TeacherProfile from Google account payload and persists to localStorage
 */
export function createTeacherProfileFromGooglePayload(payload: {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
}): TeacherProfile {
  const userEmail = (payload.email || 'quynhan9942@gmail.com').toLowerCase();
  const displayName = payload.name || (userEmail.includes('quynhan') ? 'ThS. Nguyễn Quỳnh An' : userEmail.split('@')[0]);
  const photoURL = payload.picture || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150';

  const existingList = loadAuthorizedTeachers();
  let matched = existingList.find((t) => t.email.toLowerCase() === userEmail);

  if (!matched) {
    matched = {
      uid: payload.sub || 'google_uid_' + Date.now(),
      email: userEmail,
      displayName: displayName,
      photoURL: photoURL,
      role: 'ADMIN',
      schoolId: 'THCS_NVC',
      assignedClasses: ['6a3', '6a4'],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      isAuthorized: true,
    };
  } else {
    matched = {
      ...matched,
      displayName: displayName || matched.displayName,
      photoURL: photoURL || matched.photoURL,
      role: 'ADMIN',
      isAuthorized: true,
      lastLoginAt: new Date().toISOString(),
    };
  }

  // Save/update authorized teachers list in localStorage
  const filtered = existingList.filter((t) => t.email.toLowerCase() !== userEmail);
  saveAuthorizedTeachers([matched, ...filtered]);

  // Save current active user session in localStorage
  try {
    localStorage.setItem('so_chu_nhiem_user', JSON.stringify(matched));
  } catch (e) {
    console.error('Error saving active user to localStorage:', e);
  }

  return matched;
}

/**
 * Loads current saved active Google Admin user session from localStorage
 */
export function loadSavedUserSession(): TeacherProfile | null {
  try {
    const raw = localStorage.getItem('so_chu_nhiem_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.email) {
        return parsed as TeacherProfile;
      }
    }
  } catch (e) {
    console.error('Error reading saved user session:', e);
  }
  return null;
}

/**
 * Clears current active user session from localStorage
 */
export function clearUserSession() {
  try {
    localStorage.removeItem('so_chu_nhiem_user');
  } catch (e) {
    console.error('Error clearing user session:', e);
  }
}
