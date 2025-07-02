/**
 * ⏳ مكون تحميل
 * تم إنشاؤه تلقائياً بواسطة Remaining Issues Fixer
 */

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md',
  message = 'جاري التحميل...',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`} role="status" aria-label={message}>
      <div className={`animate-spin rounded-full border-b-2 border-primary ${sizeClasses[size]}`}></div>
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
      <span className="sr-only">{message}</span>
    </div>
  );
};

export default LoadingSpinner;