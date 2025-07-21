import React from 'react';
import { Icons } from './Icons';

export function LoadingSpinner({ message = 'Loading...', size = 'medium' }) {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]} mb-4`}></div>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}

export function ErrorState({ 
  error, 
  onRetry, 
  title = 'Something went wrong',
  showRetry = true 
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Icons.Warning className="w-16 h-16 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4 max-w-md">{error?.message || 'An unexpected error occurred'}</p>
      
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Icons.Refresh className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ 
  title, 
  message, 
  icon = <Icons.Inbox className="w-12 h-12 text-gray-400" />,
  action = null 
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4 max-w-md">{message}</p>
      {action}
    </div>
  );
} 