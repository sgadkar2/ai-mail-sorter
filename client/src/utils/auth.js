// src/utils/auth.js
import { ErrorHandler } from './errorHandler';

export function getTokenFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('token');
}

export function handleOAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const message = urlParams.get('message');
  const error = urlParams.get('error');

  if (token) {
    localStorage.setItem('authToken', token);
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
    return { success: true, token };
  }

  if (message) {
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
    return { success: true, message };
  }

  if (error) {
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
    const errorInfo = ErrorHandler.handle({ message: error }, 'OAuth Callback');
    return { success: false, error: errorInfo };
  }

  return { success: false };
}

// Add new utility functions
export function isAuthenticated() {
  const token = localStorage.getItem('authToken');
  return !!token;
}

export function logout() {
  localStorage.removeItem('authToken');
  window.location.href = '/';
}

export function getAuthToken() {
  return localStorage.getItem('authToken');
}