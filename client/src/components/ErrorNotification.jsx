import React, { useState, useEffect } from 'react';
import { ERROR_SEVERITY } from '../utils/errorHandler';
import { Icons } from './Icons';

export default function ErrorNotification({ error, onClose, autoClose = true }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose && error?.severity !== ERROR_SEVERITY.CRITICAL) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, autoClose, onClose]);

  if (!error || !isVisible) return null;

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case ERROR_SEVERITY.LOW:
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case ERROR_SEVERITY.MEDIUM:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case ERROR_SEVERITY.HIGH:
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case ERROR_SEVERITY.CRITICAL:
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIcon = (severity, type) => {
    if (type === 'SUCCESS') return <Icons.Success className="w-5 h-5" />;
    
    switch (severity) {
      case ERROR_SEVERITY.LOW:
        return <Icons.Info className="w-5 h-5" />;
      case ERROR_SEVERITY.MEDIUM:
        return <Icons.Warning className="w-5 h-5" />;
      case ERROR_SEVERITY.HIGH:
        return <Icons.Warning className="w-5 h-5" />;
      case ERROR_SEVERITY.CRITICAL:
        return <Icons.Warning className="w-5 h-5" />;
      default:
        return <Icons.Warning className="w-5 h-5" />;
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md w-full animate-slide-in`}>
      <div className={`p-4 border rounded-lg shadow-lg ${getSeverityStyles(error.severity)}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <span className="text-lg">{getIcon(error.severity, error.type)}</span>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">
                {error.type === 'AUTHENTICATION' ? 'Authentication Error' :
                 error.type === 'NETWORK' ? 'Connection Error' :
                 error.type === 'VALIDATION' ? 'Input Error' :
                 error.type === 'SERVER' ? 'Server Error' :
                 error.type === 'SUCCESS' ? 'Success' :
                 'Error'}
              </h4>
              <p className="text-sm">{error.message}</p>
              {error.details && (
                <details className="mt-2">
                  <summary className="text-xs cursor-pointer hover:underline">
                    Show details
                  </summary>
                  <pre className="text-xs mt-1 whitespace-pre-wrap opacity-75">
                    {error.details}
                  </pre>
                </details>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              onClose?.();
            }}
            className="ml-4 text-gray-400 hover:text-gray-600"
          >
            <Icons.Close className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 