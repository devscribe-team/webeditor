'use client';

import * as React from 'react';
import { Tabs as TabsPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

export type TabsElement = React.ComponentRef<typeof TabsPrimitive.Root>;
export type TabsProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Root
>;
function Tabs({ className, ...props }: TabsProps): React.JSX.Element {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  );
}

export type TabsListElement = React.ComponentRef<typeof TabsPrimitive.List>;
export type TabsListProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.List
>;
function TabsList({ className, ...props }: TabsListProps): React.JSX.Element {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]',
        className
      )}
      {...props}
    />
  );
}

export type TabsTriggerElement = React.ComponentRef<
  typeof TabsPrimitive.Trigger
>;
export type TabsTriggerProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Trigger
>;
function TabsTrigger({
  className,
  ...props
}: TabsTriggerProps): React.JSX.Element {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "cursor-pointer data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  );
}

export type TabsContentElement = React.ComponentRef<
  typeof TabsPrimitive.Content
>;
export type TabsContentProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Content
>;
function TabsContent({
  className,
  ...props
}: TabsContentProps): React.JSX.Element {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  );
}

export type UnderlinedTabsElement = React.ComponentRef<
  typeof TabsPrimitive.Root
>;
export type UnderlinedTabsProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Root
>;
function UnderlinedTabs({
  className,
  ...props
}: UnderlinedTabsProps): React.JSX.Element {
  return (
    <TabsPrimitive.Root
      data-slot="underlined-tabs"
      className={cn('flex flex-col', className)}
      {...props}
    />
  );
}

export type UnderlinedTabsListElement = React.ComponentRef<
  typeof TabsPrimitive.List
>;
export type UnderlinedTabsListProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.List
>;
function UnderlinedTabsList({
  className,
  ...props
}: UnderlinedTabsListProps): React.JSX.Element {
  return (
    <TabsPrimitive.List
      data-slot="underlined-tabs-list"
      className={cn(
        'inline-flex h-12 items-center justify-start text-muted-foreground',
        className
      )}
      {...props}
    />
  );
}

export type UnderlinedTabsTriggerElement = React.ComponentRef<
  typeof TabsPrimitive.Trigger
>;
export type UnderlinedTabsTriggerProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Trigger
>;
function UnderlinedTabsTrigger({
  className,
  ...props
}: UnderlinedTabsTriggerProps): React.JSX.Element {
  return (
    <TabsPrimitive.Trigger
      data-slot="underlined-tabs-trigger"
      className={cn(
        'group relative cursor-pointer mx-4 inline-flex h-12 items-center justify-center whitespace-nowrap rounded-none border-b border-b-transparent bg-transparent py-1 pb-3 pt-2 text-sm text-muted-foreground shadow-none ring-offset-background transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-primary data-[state=active]:font-medium data-[state=active]:text-foreground data-[state=active]:shadow-none',
        className
      )}
      {...props}
    />
  );
}

export type UnderlinedTabsContentElement = React.ComponentRef<
  typeof TabsPrimitive.Content
>;
export type UnderlinedTabsContentProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Content
>;
function UnderlinedTabsContent({
  className,
  ...props
}: UnderlinedTabsContentProps): React.JSX.Element {
  return (
    <TabsPrimitive.Content
      data-slot="underlined-tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  );
}

export {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  UnderlinedTabs,
  UnderlinedTabsContent,
  UnderlinedTabsList,
  UnderlinedTabsTrigger
};
