import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, hover = false, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${hover ? 'hover:shadow-xl hover:-translate-y-1 transition-all duration-300' : ''} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = ({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`px-6 py-4 border-b border-gray-100 ${className}`} {...props}>
    {children}
  </div>
);

export const CardBody = ({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`px-6 py-5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`px-6 py-4 border-t border-gray-100 ${className}`} {...props}>
    {children}
  </div>
);
