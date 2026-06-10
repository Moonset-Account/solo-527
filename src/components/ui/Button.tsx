import { ButtonHTMLAttributes, forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', size = 'md', icon: Icon, iconPosition = 'left', className = '', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 hover:shadow-lg hover:-translate-y-0.5',
      secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500 hover:shadow-lg hover:-translate-y-0.5',
      outline: 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
      ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
      danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 hover:shadow-lg',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-base',
      lg: 'px-7 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 mr-2" />}
        {children}
        {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 ml-2" />}
      </button>
    );
  }
);

Button.displayName = 'Button';
