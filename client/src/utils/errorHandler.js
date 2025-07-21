// Error types for better categorization
export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  VALIDATION: 'VALIDATION',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN'
};

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

// Centralized error handler
export class ErrorHandler {
  static handle(error, context = '') {
    const errorInfo = this.parseError(error);
    
    // Log error for debugging
    console.error(`[${context}] Error:`, errorInfo);
    
    // Return structured error object
    return {
      type: errorInfo.type,
      severity: errorInfo.severity,
      message: errorInfo.userMessage,
      details: errorInfo.details,
      timestamp: new Date().toISOString(),
      context
    };
  }

  static parseError(error) {
    // Handle axios errors
    if (error.response) {
      return this.parseAxiosError(error);
    }
    
    // Handle network errors
    if (error.request) {
      return {
        type: ERROR_TYPES.NETWORK,
        severity: ERROR_SEVERITY.HIGH,
        userMessage: 'Network connection failed. Please check your internet connection.',
        details: error.message
      };
    }
    
    // Handle JWT/authentication errors
    if (error.message?.includes('token') || error.message?.includes('unauthorized')) {
      return {
        type: ERROR_TYPES.AUTHENTICATION,
        severity: ERROR_SEVERITY.HIGH,
        userMessage: 'Authentication failed. Please sign in again.',
        details: error.message
      };
    }
    
    // Handle validation errors
    if (error.message?.includes('validation') || error.message?.includes('required')) {
      return {
        type: ERROR_TYPES.VALIDATION,
        severity: ERROR_SEVERITY.MEDIUM,
        userMessage: 'Please check your input and try again.',
        details: error.message
      };
    }
    
    // Default unknown error
    return {
      type: ERROR_TYPES.UNKNOWN,
      severity: ERROR_SEVERITY.MEDIUM,
      userMessage: 'An unexpected error occurred. Please try again.',
      details: error.message
    };
  }

  static parseAxiosError(error) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return {
          type: ERROR_TYPES.VALIDATION,
          severity: ERROR_SEVERITY.MEDIUM,
          userMessage: data?.error || 'Invalid request. Please check your input.',
          details: data?.details || error.message
        };
      
      case 401:
        return {
          type: ERROR_TYPES.AUTHENTICATION,
          severity: ERROR_SEVERITY.HIGH,
          userMessage: 'Your session has expired. Please sign in again.',
          details: data?.error || error.message
        };
      
      case 403:
        return {
          type: ERROR_TYPES.AUTHORIZATION,
          severity: ERROR_SEVERITY.HIGH,
          userMessage: 'You don\'t have permission to perform this action.',
          details: data?.error || error.message
        };
      
      case 404:
        return {
          type: ERROR_TYPES.VALIDATION,
          severity: ERROR_SEVERITY.MEDIUM,
          userMessage: 'The requested resource was not found.',
          details: data?.error || error.message
        };
      
      case 429:
        return {
          type: ERROR_TYPES.SERVER,
          severity: ERROR_SEVERITY.MEDIUM,
          userMessage: 'Too many requests. Please wait a moment and try again.',
          details: data?.error || error.message
        };
      
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: ERROR_TYPES.SERVER,
          severity: ERROR_SEVERITY.HIGH,
          userMessage: 'Server error. Please try again later.',
          details: data?.error || error.message
        };
      
      default:
        return {
          type: ERROR_TYPES.UNKNOWN,
          severity: ERROR_SEVERITY.MEDIUM,
          userMessage: 'An error occurred. Please try again.',
          details: data?.error || error.message
        };
    }
  }

  // Handle authentication errors specifically
  static handleAuthError(error) {
    const errorInfo = this.parseError(error);
    
    if (errorInfo.type === ERROR_TYPES.AUTHENTICATION) {
      // Clear auth token and redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/';
    }
    
    return errorInfo;
  }

  // Get user-friendly error message
  static getUserMessage(error) {
    const errorInfo = this.parseError(error);
    return errorInfo.userMessage;
  }

  // Check if error is retryable
  static isRetryable(error) {
    const errorInfo = this.parseError(error);
    return errorInfo.type === ERROR_TYPES.NETWORK || 
           errorInfo.type === ERROR_TYPES.SERVER;
  }
} 