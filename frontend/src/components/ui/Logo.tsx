import Image from 'next/image';
import Link from 'next/link';
import { classNames } from '@/lib/format';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  asLink?: boolean;
  className?: string;
  variant?: 'full' | 'icon-text' | 'icon-only';
}

export function Logo({
  size = 'md',
  showTagline = false,
  asLink = true,
  className,
  variant = 'icon-text',
}: LogoProps) {
  const iconSizeMap = {
    sm: { width: 32, height: 32, class: 'h-8 w-8' },
    md: { width: 40, height: 40, class: 'h-10 w-10' },
    lg: { width: 48, height: 48, class: 'h-12 w-12' },
  };

  const titleSizeMap = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  const currentIcon = iconSizeMap[size];

  const content = (
    <div className={classNames('inline-flex items-center gap-2.5', className)}>
      {variant === 'full' ? (
        <Image
          src="/logo.png"
          alt="Fast Buy BD Logo"
          width={180}
          height={50}
          priority
          className={classNames(
            'object-contain transition-transform duration-200 group-hover:scale-105',
            size === 'sm' && 'h-8 w-auto',
            size === 'md' && 'h-10 w-auto',
            size === 'lg' && 'h-12 w-auto',
          )}
        />
      ) : (
        <>
          <div className="relative shrink-0">
            <Image
              src="/logo-icon.png"
              alt="Fast Buy BD Emblem"
              width={currentIcon.width}
              height={currentIcon.height}
              priority
              className={classNames(
                'object-contain transition-transform duration-200 group-hover:scale-105',
                currentIcon.class,
              )}
            />
          </div>
          {variant !== 'icon-only' && (
            <div className="flex flex-col leading-none">
              <span
                className={classNames(
                  'font-black tracking-tight text-current',
                  titleSizeMap[size],
                )}
              >
                FAST BUY<span className="text-current opacity-90"> BD</span>
              </span>
              {showTagline && (
                <span className="hidden text-[10.5px] font-medium text-current/80 sm:block mt-0.5">
                  Your daily needs in discounted price
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  if (!asLink) {
    return content;
  }

  return (
    <Link
      href="/"
      className="group flex shrink-0 items-center rounded-lg py-1 focus-ring"
      aria-label="Fast Buy BD - Home"
    >
      {content}
    </Link>
  );
}
