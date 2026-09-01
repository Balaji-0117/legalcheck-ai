// Central API configuration supporting local development and cloud production deployments
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export const apiUrl = (path) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
};
