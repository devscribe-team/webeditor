import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';

const avatarGroupVariants = cva('flex flex-row items-center *:rounded-full', {
  variants: {
    spacing: {
      tight: '-space-x-6',
      normal: '-space-x-4',
      loose: '-space-x-2'
    },
    size: {
      xs: '*:w-6 *:h-6 *:text-xs',
      sm: '*:w-8 *:h-8 *:text-sm',
      md: '*:w-10 *:h-10 *:text-base',
      lg: '*:w-12 *:h-12 *:text-lg',
      xl: '*:w-14 *:h-14 *:text-xl'
    }
  },
  defaultVariants: {
    spacing: 'normal',
    size: 'md'
  }
});

export type AvatarData = {
  id: string;
  name: string;
  image?: string;
};

export type AvatarGroupProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof avatarGroupVariants> & {
    avatars: AvatarData[];
    max?: number;
    showOverflowCount?: boolean;
    overflowClassName?: React.HTMLAttributes<HTMLDivElement>['className'];
    renderAvatar?: (avatar: AvatarData, index: number) => React.ReactNode;
  };

const AvatarGroup = ({
  className,
  avatars,
  spacing,
  size,
  max = 4,
  showOverflowCount = true,
  overflowClassName,
  renderAvatar,
  ...props
}: AvatarGroupProps) => {
  const { shownAvatars, hiddenAvatars } = React.useMemo(() => {
    const shown = avatars.slice(0, max);
    const hidden = avatars.slice(max);
    return { shownAvatars: shown, hiddenAvatars: hidden };
  }, [avatars, max]);

  const defaultRenderAvatar = (avatar: AvatarData) => {
    const content = (
      <Avatar
        title={avatar.name}
        className="ring-2 ring-background transition-all duration-200 ease-in-out hover:z-10 hover:-translate-x-1"
      >
        {avatar.image && (
          <AvatarImage
            src={avatar.image}
            alt={avatar.name}
          />
        )}
        <AvatarFallback>
          {avatar.name
            .split(' ')
            .map((word) => word[0])
            .join('')
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>
    );

    return <React.Fragment key={avatar.id}>{content}</React.Fragment>;
  };

  const renderAvatarWithKey = (avatar: AvatarData, index: number) => (
    <React.Fragment key={avatar.id}>
      {renderAvatar ? renderAvatar(avatar, index) : defaultRenderAvatar(avatar)}
    </React.Fragment>
  );

  return (
    <div
      className={cn(avatarGroupVariants({ spacing, size }), className)}
      {...props}
    >
      {shownAvatars.map(renderAvatarWithKey)}
      {hiddenAvatars.length > 0 && showOverflowCount && (
        <Avatar
          className={cn('bg-muted text-muted-foreground', overflowClassName)}
        >
          <AvatarFallback>+{hiddenAvatars.length}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export { AvatarGroup, avatarGroupVariants };
