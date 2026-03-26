---
phase: 18-frontend-regression-restore
plan: 02
subsystem: ui
tags: [react-19, forwardRef, ref-as-prop, shadcn-ui, radix-ui]

# Dependency graph
requires:
  - phase: 12-framework-upgrades
    provides: React 19 upgrade that introduced ref-as-prop pattern
provides:
  - All 19 shadcn/ui components using React 19 function declarations with ref-as-prop
  - Zero forwardRef wrappers in UI component directory
affects: [any phase using shadcn/ui components]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "React 19 ref-as-prop: function Component({ ref, ...props }: Props & { ref?: React.Ref<El> })"
    - "No displayName assignments needed with function declarations"

key-files:
  modified:
    - frontend/src/components/ui/button.tsx
    - frontend/src/components/ui/input.tsx
    - frontend/src/components/ui/textarea.tsx
    - frontend/src/components/ui/label.tsx
    - frontend/src/components/ui/checkbox.tsx
    - frontend/src/components/ui/switch.tsx
    - frontend/src/components/ui/separator.tsx
    - frontend/src/components/ui/progress.tsx
    - frontend/src/components/ui/card.tsx
    - frontend/src/components/ui/avatar.tsx
    - frontend/src/components/ui/dialog.tsx
    - frontend/src/components/ui/alert-dialog.tsx
    - frontend/src/components/ui/dropdown-menu.tsx
    - frontend/src/components/ui/popover.tsx
    - frontend/src/components/ui/form.tsx
    - frontend/src/components/ui/tabs.tsx
    - frontend/src/components/ui/scroll-area.tsx
    - frontend/src/components/ui/carousel.tsx
    - frontend/src/components/ui/toast.tsx

key-decisions:
  - "React 19 ref-as-prop uses intersection type (Props & { ref?: React.Ref<El> }) for inline ref typing"
  - "DialogHeader/DialogFooter/AlertDialogHeader/AlertDialogFooter converted from const arrow to function declaration (no forwardRef to remove, but consistent pattern)"
  - "DropdownMenuShortcut converted from const arrow to function declaration for consistency"

patterns-established:
  - "React 19 ref-as-prop: All UI components use function declarations with ref destructured from props"
  - "No forwardRef or displayName in any shadcn/ui component"

requirements-completed: [FRMW-01]

# Metrics
duration: 4min
completed: 2026-03-27
---

# Phase 18 Plan 02: Remove forwardRef from shadcn/ui Components Summary

**All 19 shadcn/ui component files converted from React.forwardRef to React 19 function declarations with ref-as-prop pattern, eliminating all forwardRef wrappers and displayName assignments**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-26T21:32:02Z
- **Completed:** 2026-03-26T21:36:02Z
- **Tasks:** 2
- **Files modified:** 19

## Accomplishments
- Converted 10 simple UI components (button, input, textarea, label, checkbox, switch, separator, progress, card, avatar) from forwardRef to function declarations
- Converted 9 complex multi-forwardRef UI components (dialog, alert-dialog, dropdown-menu, popover, form, tabs, scroll-area, carousel, toast) to function declarations
- Zero forwardRef and zero displayName remaining in entire frontend/src/components/ui/ directory

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove forwardRef from 10 simple UI components** - `524b38f` (refactor)
2. **Task 2: Remove forwardRef from 9 complex UI components** - `efcf2b0` (refactor)

## Files Created/Modified
- `frontend/src/components/ui/button.tsx` - Button with ref-as-prop, keeps Slot/asChild pattern
- `frontend/src/components/ui/input.tsx` - Input with ref-as-prop
- `frontend/src/components/ui/textarea.tsx` - Textarea with ref-as-prop
- `frontend/src/components/ui/label.tsx` - Label wrapping Radix LabelPrimitive with ref-as-prop
- `frontend/src/components/ui/checkbox.tsx` - Checkbox wrapping Radix CheckboxPrimitive with ref-as-prop
- `frontend/src/components/ui/switch.tsx` - Switch wrapping Radix SwitchPrimitive with ref-as-prop
- `frontend/src/components/ui/separator.tsx` - Separator wrapping Radix SeparatorPrimitive with ref-as-prop
- `frontend/src/components/ui/progress.tsx` - Progress wrapping Radix ProgressPrimitive with ref-as-prop
- `frontend/src/components/ui/card.tsx` - Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter all converted
- `frontend/src/components/ui/avatar.tsx` - Avatar, AvatarImage, AvatarFallback all converted
- `frontend/src/components/ui/dialog.tsx` - DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription all converted
- `frontend/src/components/ui/alert-dialog.tsx` - AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel all converted
- `frontend/src/components/ui/dropdown-menu.tsx` - 8 sub-components converted (SubTrigger, SubContent, Content, Item, CheckboxItem, RadioItem, Label, Separator)
- `frontend/src/components/ui/popover.tsx` - PopoverContent converted
- `frontend/src/components/ui/form.tsx` - FormItem, FormLabel, FormControl, FormDescription, FormMessage all converted
- `frontend/src/components/ui/tabs.tsx` - TabsList, TabsTrigger, TabsContent all converted
- `frontend/src/components/ui/scroll-area.tsx` - ScrollArea, ScrollBar all converted
- `frontend/src/components/ui/carousel.tsx` - Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext all converted
- `frontend/src/components/ui/toast.tsx` - ToastViewport, Toast, ToastAction, ToastClose, ToastTitle, ToastDescription all converted

## Decisions Made
- Used intersection type pattern (`Props & { ref?: React.Ref<El> }`) for adding ref to props type inline
- Components that were already plain functions without forwardRef (DialogHeader, DialogFooter, etc.) were converted from const arrow functions to function declarations for consistency
- All ref forwarding to Radix primitives preserved identically (ref={ref} on JSX elements)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 19 shadcn/ui components now use React 19 patterns
- Ready for Plan 03 (page component restoration) and Plan 04 (TypeScript build verification)

## Self-Check: PASSED

- All 19 modified files exist on disk
- Both task commits (524b38f, efcf2b0) verified in git log
- grep confirms 0 forwardRef and 0 displayName in frontend/src/components/ui/

---
*Phase: 18-frontend-regression-restore*
*Completed: 2026-03-27*
