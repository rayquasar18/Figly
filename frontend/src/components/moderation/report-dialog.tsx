'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useReport } from '@/hooks/queries/moderation-queries';
import { REPORT_REASONS } from '@figly/shared';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetId: string;
  targetType: 'POST' | 'USER';
}

export function ReportDialog({
  open,
  onOpenChange,
  targetId,
  targetType,
}: ReportDialogProps) {
  const [reason, setReason] = useState('');
  const report = useReport();

  const handleSubmit = () => {
    if (!reason) return;
    report.mutate(
      { targetId, targetType, reason },
      {
        onSuccess: () => {
          setReason('');
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Bao cao</DialogTitle>
        </DialogHeader>

        <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
          {REPORT_REASONS.map((r) => (
            <div key={r.value} className="flex items-center gap-3">
              <RadioGroupItem value={r.value} id={`reason-${r.value}`} />
              <Label htmlFor={`reason-${r.value}`} className="cursor-pointer">
                {r.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!reason || report.isPending}
            className="w-full"
          >
            {report.isPending ? 'Dang gui...' : 'Gui bao cao'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
