import type {ButtonHTMLAttributes, ReactNode} from 'react';
import {Link, type LinkProps} from 'react-router';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'on-dark' | 'text-link';
export type ButtonSize = 'md' | 'lg';

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-bhe-green text-bhe-on-green hover:bg-bhe-green-2 border-transparent',
  accent: 'bg-bhe-gold text-bhe-green hover:brightness-95 border-transparent',
  secondary: 'bg-transparent text-bhe-green border-2 border-bhe-green hover:bg-bhe-tint-green',
  'on-dark': 'bg-transparent text-bhe-on-green border-2 border-bhe-on-green hover:bg-white/10',
  'text-link':
    'bg-transparent text-bhe-green border-transparent underline-offset-4 hover:underline px-0 rounded-none min-h-0',
};

const sizeClass: Record<ButtonSize, string> = {
  md: 'px-6 py-3 text-base',
  lg: 'px-7 py-4 text-lg',
};

type CommonProps = {
  children: ReactNode;
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> & {
    to?: undefined;
  };

type ButtonAsLink = CommonProps &
  Omit<LinkProps, 'children' | 'className'> & {
    to: LinkProps['to'];
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

function classes(variant: ButtonVariant, size: ButtonSize, className?: string) {
  const base =
    variant === 'text-link'
      ? 'inline-flex items-center gap-1 font-bold transition-colors'
      : 'inline-flex min-h-11 items-center justify-center rounded-full border font-bold transition-colors';
  return [base, variantClass[variant], sizeClass[size], className].filter(Boolean).join(' ');
}

export function Button(props: ButtonProps) {
  const {children, className, size = 'md', variant = 'primary'} = props;
  const classNames = classes(variant, size, className);

  if ('to' in props && props.to !== undefined) {
    const {to, children: _c, className: _cl, size: _s, variant: _v, ...linkRest} = props;
    return (
      <Link className={classNames} to={to} {...linkRest}>
        {children}
      </Link>
    );
  }

  const {
    children: _c,
    className: _cl,
    size: _s,
    variant: _v,
    type = 'button',
    ...buttonRest
  } = props as ButtonAsButton;
  return (
    <button className={classNames} type={type} {...buttonRest}>
      {children}
    </button>
  );
}
