// ErrorUtils.ts

import { Subject } from 'rxjs';

interface ErrorNotification {
  message: string;
  severity: 'error' | 'warning' | 'info';
  duration?: number;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private errorSubject = new Subject<ErrorNotification>();

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  subscribe(callback: (error: ErrorNotification) => void) {
    return this.errorSubject.subscribe(callback);
  }

  handleError(error: unknown, context: string) {
    let message: string;
    
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else {
      message = 'An unexpected error occurred';
    }

    const fullMessage = `${context}: ${message}`;
    console.error(fullMessage, error);
    
    this.errorSubject.next({
      message: fullMessage,
      severity: 'error',
      duration: 3000
    });
  }

  showWarning(message: string) {
    console.warn(message);
    this.errorSubject.next({
      message,
      severity: 'warning',
      duration: 3000
    });
  }

  showInfo(message: string) {
    console.info(message);
    this.errorSubject.next({
      message,
      severity: 'info',
      duration: 2000
    });
  }
}

export const errorHandler = ErrorHandler.getInstance();
