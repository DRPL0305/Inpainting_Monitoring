import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...propsRef }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={twMerge(
          clsx(
            'flex w-full rounded-lg bg-slate-900/60 border border-slate-700/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 caret-blue-500 outline-none transition-all duration-200 focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50'
          ),
          className
        )}
        {...propsRef}
      />
    );
  }
);

Input.displayName = 'Input';
