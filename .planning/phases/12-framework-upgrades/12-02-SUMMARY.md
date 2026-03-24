---
phase: 12-framework-upgrades
plan: 02
subsystem: ui
tags: [react-19, forwardRef, shadcn-ui, radix, ref-as-prop]

# Dependency graph
requires:
  - phase: 12-01
    provides: "React 19 + Next.js 15 runtime (forwardRef still works but deprecated)"
provides:
  - "All 20 shadcn/ui components use React 19 ref-as-prop pattern"
  - "Zero forwardRef deprecation warnings from UI layer"
  - "Function declaration pattern for all UI components (auto displayName)"
affects: [12-framework-upgrades, 14-frontend-restructure]

# Tech tracking
tech-stack:
  added: []
  patterns: ["React 19 ref-as-prop: function Component({ ref, ...props }: Props & { ref?: React.Ref<Element> })"]

key-files:
  created: []
  modified:
    - frontend/src/components/ui/button.tsx
    - frontend/src/components/ui/input.tsx
    - frontend/src/components/ui/textarea.tsx
    - frontend/src/components/ui/label.tsx
    - frontend/src/components/ui/separator.tsx
    - frontend/src/components/ui/progress.tsx
    - frontend/src/components/ui/switch.tsx
    - frontend/src/components/ui/checkbox.tsx
    - frontend/src/components/ui/popover.tsx
    - frontend/src/components/ui/scroll-area.tsx
    - frontend/src/components/ui/card.tsx
    - frontend/src/components/ui/dialog.tsx
    - frontend/src/components/ui/alert-dialog.tsx
    - frontend/src/components/ui/sheet.tsx
    - frontend/src/components/ui/dropdown-menu.tsx
    - frontend/src/components/ui/toast.tsx
    - frontend/src/components/ui/tabs.tsx
    - frontend/src/components/ui/avatar.tsx
    - frontend/src/components/ui/carousel.tsx
    - frontend/src/components/ui/form.tsx

key-decisions:
  - "Used & { ref?: React.Ref<T> } union for custom prop types; React.ComponentProps<\"element\"> already includes ref in React 19"
  - "Converted all const arrow + forwardRef to function declarations for automatic displayName"
  - "Removed all .displayName assignments (function declarations provide name automatically)"

patterns-established:
  - "React 19 ref-as-prop: destructure ref from props instead of forwardRef second argument"
  - "Radix wrapper pattern: function Component({ ref, ...props }: ComponentPropsWithoutRef<typeof Primitive.X> & { ref?: React.Ref<ComponentRef<typeof Primitive.X>> })"
  - "HTML element pattern: function Component({ ref, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> })"

requirements-completed: [FRMW-01]

# Metrics
duration: 8min
completed: 2026-03-24
---

# Phase 12 Plan 02: Remove forwardRef Summary

**Migrated all 20 shadcn/ui components from React.forwardRef to React 19 ref-as-prop pattern with zero build errors**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-24T06:21:06Z
- **Completed:** 2026-03-24T06:29:24Z
- **Tasks:** 2
- **Files modified:** 20

## Accomplishments
- Removed all React.forwardRef calls from 20 UI component files (50+ individual forwardRef instances)
- Converted all components to function declarations with ref as a regular destructured prop
- Removed all .displayName assignments (function declarations provide name automatically)
- Frontend builds successfully with zero errors or deprecation warnings

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate simple UI components (10 files)** - `747d07a` (refactor)
2. **Task 2: Migrate complex UI components (10 files)** - `7b02756` (refactor)

## Files Created/Modified
- `frontend/src/components/ui/button.tsx` - Button with ref-as-prop + Slot for asChild
- `frontend/src/components/ui/input.tsx` - Input with ComponentProps<"input">
- `frontend/src/components/ui/textarea.tsx` - Textarea with ComponentProps<"textarea">
- `frontend/src/components/ui/label.tsx` - Label wrapping Radix Label primitive
- `frontend/src/components/ui/separator.tsx` - Separator wrapping Radix Separator
- `frontend/src/components/ui/progress.tsx` - Progress wrapping Radix Progress
- `frontend/src/components/ui/switch.tsx` - Switch wrapping Radix Switch
- `frontend/src/components/ui/checkbox.tsx` - Checkbox wrapping Radix Checkbox
- `frontend/src/components/ui/popover.tsx` - PopoverContent wrapping Radix Popover
- `frontend/src/components/ui/scroll-area.tsx` - ScrollArea + ScrollBar (2 components)
- `frontend/src/components/ui/card.tsx` - Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter (6 components)
- `frontend/src/components/ui/dialog.tsx` - DialogOverlay, DialogContent, DialogTitle, DialogDescription (4 components)
- `frontend/src/components/ui/alert-dialog.tsx` - AlertDialogOverlay, Content, Title, Description, Action, Cancel (6 components)
- `frontend/src/components/ui/sheet.tsx` - SheetOverlay, SheetContent, SheetTitle, SheetDescription (4 components)
- `frontend/src/components/ui/dropdown-menu.tsx` - 8 dropdown sub-components
- `frontend/src/components/ui/toast.tsx` - ToastViewport, Toast, ToastAction, ToastClose, ToastTitle, ToastDescription (6 components)
- `frontend/src/components/ui/tabs.tsx` - TabsList, TabsTrigger, TabsContent (3 components)
- `frontend/src/components/ui/avatar.tsx` - Avatar, AvatarImage, AvatarFallback (3 components)
- `frontend/src/components/ui/carousel.tsx` - Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext (5 components)
- `frontend/src/components/ui/form.tsx` - FormItem, FormLabel, FormControl, FormDescription, FormMessage (5 components)

## Decisions Made
- Used `& { ref?: React.Ref<T> }` union type for components with custom prop interfaces (Button, Label, Toast, etc.) since their prop types don't include ref
- For components using `React.ComponentProps<"element">`, no ref union needed since React 19's ComponentProps already includes ref
- Removed all `.displayName` assignments -- function declarations provide automatic displayName via the function name

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 20 shadcn/ui components are React 19 compatible with ref-as-prop pattern
- Ready for Plan 12-03 (Next.js 15 async API migration) or any future component work
- Pattern established for any new shadcn/ui components added in the future

## Self-Check: PASSED

- All 20 modified files exist on disk
- Both task commits found (747d07a, 7b02756)
- SUMMARY.md created successfully
- Zero `React.forwardRef` in `frontend/src/components/ui/`
- Zero `.displayName` in `frontend/src/components/ui/`
- `pnpm build` exits 0

---
*Phase: 12-framework-upgrades*
*Completed: 2026-03-24*
