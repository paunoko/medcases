import React from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
}

export const SlideContainer: React.FC<Props> = ({ children, className = '' }) => {
  return (
    <div className={`flex flex-col h-full w-full bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 text-left text-gray-900 p-8 gap-6 ${className}`}>
      {children}
    </div>
  );
};
