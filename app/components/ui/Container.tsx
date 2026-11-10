import type {ReactNode} from 'react';

type ContainerProps = {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'header' | 'footer' | 'main';
};

export function Container({as: Tag = 'div', children, className}: ContainerProps) {
  return (
    <Tag className={['mx-auto w-full max-w-container px-4 md:px-6', className].filter(Boolean).join(' ')}>
      {children}
    </Tag>
  );
}
