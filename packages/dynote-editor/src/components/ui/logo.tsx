'use client';

import * as React from 'react';
import Image from 'next/image';

import { cn } from '@/lib/utils';

export type LogoElement = React.ComponentRef<'div'>;
export type LogoProps = React.ComponentPropsWithoutRef<'div'> & {
  hideSymbol?: boolean;
  hideWordmark?: boolean;
};

const APP_NAME = 'devscribe';

export function Logo({
  // hideSymbol,
  // hideWordmark,
  className,
  ...other
}: LogoProps): React.JSX.Element {
  return (

    <div className={cn('flex items-center', className)} {...other}>
      {/* Render actual brand logo from public directory. */}
      <Image
        src="/Newdevscribelogo.png"
        alt={`${APP_NAME} logo`}
        width={256}
        height={256}
        className="h-8 w-auto sm:h-8"
        priority={false}
      />
      {/* {!hideWordmark && (
        <span className="text-lg ml-2 font-semibold font-logo">
          {APP_NAME}
        </span>
      )} */}
    </div>
  );
}
