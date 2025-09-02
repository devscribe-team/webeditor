import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, RefreshCw, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area"


// Loading skeleton component for dashboard
export function DashboardSkeleton() {
  return (
    <div className="flex-1 overflow-auto min-w-0 w-full container">
      <div className="flex h-full flex-col min-w-0 w-full">
        {/* Header */}
        <header className="backdrop-blur-sm shadow-sm flex-shrink-0">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-7 w-56 sm:h-8 sm:w-72" />
                <Skeleton className="h-4 w-64 sm:w-80" />
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Skeleton className="h-9 w-40 sm:w-44" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6 lg:space-y-8 min-w-0 w-full overflow-hidden">
          {/* Documentation Preview Card */}
          <div className="bg-gradient-to-br from-card to-background/50 border border-border/60 rounded-xl overflow-hidden shadow-lg min-w-0">
            <div className="px-4 sm:px-6 py-4 border-b border-border/60 bg-gradient-to-r from-muted/80 to-card/80">
              <Skeleton className="h-5 w-44" />
            </div>

            <div className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 min-w-0">
                {/* Preview thumbnail */}
                <div className="w-full lg:w-1/3 flex-shrink-0">
                  <Skeleton className="aspect-video w-full rounded-lg" />
                </div>

                {/* Right details */}
                <div className="w-full lg:w-2/3 space-y-4 lg:space-y-5 min-w-0">
                  {/* Status pill */}
                  <Skeleton className="h-6 w-24 rounded-full" />

                  {/* Last updated */}
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-40" />
                  </div>

                  {/* Deployment URL */}
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="h-4 w-4 rounded-md" />
                    <Skeleton className="h-4 w-64" />
                  </div>

                  {/* Repo / Branch */}
                  <div className="flex flex-col gap-3 pt-2">
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="h-4 w-4 rounded-md" />
                      <Skeleton className="h-4 w-56" />
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="h-4 w-4 rounded-md" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity section header */}
          <div className="min-w-0">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>

          {/* Activity table */}
          <div className="bg-gradient-to-br from-card to-background/30 border border-border/60 rounded-xl overflow-hidden shadow-lg min-w-0">
            {/* Table header */}
            <div className="overflow-x-auto min-w-0">
              <div className="grid grid-cols-5 gap-0 bg-gradient-to-r from-muted/80 to-card/80 border-b border-border/60">
                <div className="px-3 sm:px-6 py-4">
                  <Skeleton className="h-3.5 w-16" />
                </div>
                <div className="px-3 sm:px-6 py-4 hidden lg:block">
                  <Skeleton className="h-3.5 w-28" />
                </div>
                <div className="px-3 sm:px-6 py-4">
                  <Skeleton className="h-3.5 w-16" />
                </div>
                <div className="px-3 sm:px-6 py-4 hidden md:block">
                  <Skeleton className="h-3.5 w-24" />
                </div>
                <div className="px-3 sm:px-6 py-4 hidden md:block">
                  <Skeleton className="h-3.5 w-16" />
                </div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-border/60 bg-card/50">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-5 gap-0 items-center hover:bg-muted/80 transition-colors duration-200"
                  >
                    {/* Author */}
                    <div className="px-3 sm:px-6 py-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-24 sm:w-28" />
                      </div>
                    </div>

                    {/* Commit Message */}
                    <div className="px-3 sm:px-6 py-4 hidden lg:block">
                      <Skeleton className="h-4 w-64" />
                    </div>

                    {/* Status */}
                    <div className="px-3 sm:px-6 py-4">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>

                    {/* Branch/Commit */}
                    <div className="px-3 sm:px-6 py-4 hidden md:block">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-14" />
                      </div>
                    </div>

                    {/* Date */}
                    <div className="px-3 sm:px-6 py-4 hidden md:block">
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// Error state component
export function ErrorState({ error }: { error: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-destructive">Error Loading Content</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading skeleton component for editor (matches current EditorPage layout)
export function EditorSkeleton() {
  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background border-t overflow-hidden">
      <div className="flex-1 flex min-h-0 min-w-0">
        {/* Sidebar */}
        <div className="w-64 border-r flex flex-col overflow-hidden min-h-0">
          {/* File Actions */}
          <div className="px-4 pb-4 border-b space-y-4 flex-none">
            <div className="h-5" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>

            <div className="flex gap-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-8" />
            </div>

            {/* inline create input (placeholder) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-9 w-full" />
            </div>
          </div>

          {/* Status */}
          <div className="p-4 border-b flex-none">
            <Skeleton className="h-4 w-20 mb-3" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>

          {/* File Tree */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <div className="p-4 h-full overflow-auto">
              <div className="space-y-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2" style={{ paddingLeft: `${(i % 3) * 12}px` }}>
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main content row */}
        <div className="h-full flex-1 flex min-h-0 min-w-0">
          {/* Editor Panel */}
          <div className="flex-1 flex flex-col border-r min-w-0">
            <div className="border-b px-4 py-3 flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <div className="p-6 h-full overflow-auto">
                {/* mimic textarea block */}
                <Skeleton className="w-full h-[calc(100vh-12rem)] rounded-md" />
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="h-full flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
            <div className="border-b px-4 py-3 flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <div className="p-6 min-w-0 h-full overflow-auto">
                <div className="space-y-3 max-w-none">
                  {/* mimic prose content */}
                  <Skeleton className="h-5 w-56" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <Skeleton className="h-64 w-full mt-4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-3/5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>      
    </div>
  )
}

export function UpdatesEditorSkeleton() {
  return (
    <div className="h-screen flex bg-background w-full overflow-hidden border-t border-border">
      {/* Sidebar */}
      <div className="w-80 border-r border-border flex flex-col min-h-0">
        {/* Search header */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            {/* search icon bubble */}
            <Skeleton className="h-4 w-4 rounded absolute left-3 top-1/2 -translate-y-1/2" />
            <Skeleton className="h-9 w-full rounded-md pl-10" />
          </div>
        </div>

        {/* Cards list */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-md border border-border bg-card p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-24 mb-2" />
                <div className="flex items-center gap-2 mb-1">
                  <Skeleton className="h-3 w-3 rounded" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded" />
                  <Skeleton className="h-3 w-44" />
                </div>
                <div className="mt-3">
                  <Skeleton className="h-8 w-24 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 flex flex-col bg-background">
        {/* Header */}
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* pager */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-9 rounded-md" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-9 rounded-md" />
              </div>
              <div className="hidden sm:block w-px h-6 bg-border" />
              {/* title + category */}
              <div className="space-y-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-20 rounded-full" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>

          {/* loading line */}
          <div className="mt-3">
            <Skeleton className="h-3 w-24" />
          </div>
        </div>

        {/* Content area */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-8 max-w-4xl">
            {/* prose-like placeholder */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
              <Skeleton className="h-64 w-full mt-4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>

            {/* diff-like block */}
            <div className="mt-8 border border-border rounded-md overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
              <div className="p-4 space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-start">
                    <Skeleton className="h-4 w-8 mr-2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer nav */}
        <div className="bg-card border-t border-border p-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-9 w-28 rounded-md" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading skeleton component for generate-docs
export function GenerateDocsSkeleton() {
  return (
    <div className="h-screen flex flex-col bg-background w-full">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-9 w-24" />
      </header>
      
      <div className="flex-1 min-h-0 flex">
        <div className="p-6 flex flex-col flex-1 min-h-0">
          {/* Back to dashboard link skeleton */}
          <Skeleton className="h-4 w-32 mb-3" />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <Skeleton className="h-8 w-40 mb-2" />
            
            {/* Two-panel selection layout skeleton */}
            <div className="flex flex-row gap-15 flex-1 min-h-0">
              {/* Left selection panel */}
              <div className="flex flex-1 min-w-0">
                <div className="w-full border border-border rounded-lg p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-10 w-full" />
                    
                    {/* List items */}
                    <div className="space-y-3">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded border border-border">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-32 mb-1" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Arrow between panels */}
              <div className="flex flex-col justify-center">
                <Skeleton className="w-15 h-15 rounded" />
              </div>
              
              {/* Right selection panel */}
              <div className="flex flex-1 min-w-0">
                <div className="w-full border border-border rounded-lg p-6 opacity-30">
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-36" />
                    <Skeleton className="h-10 w-full" />
                    
                    {/* List items */}
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded border border-border">
                          <Skeleton className="h-6 w-6 rounded" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Final arrow */}
              <div className="flex flex-col justify-center pl-4">
                <Skeleton className="w-16 h-16 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Login required component
export function LoginRequired() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <User className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            Please log in to access your documentation portal and editor.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild>
            <a href="/login">Go to Login</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}