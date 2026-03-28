'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { AdminActions } from './admin-actions';
import { REPORT_REASONS } from '@figly/shared';
import type { ReportQueueItem } from '@figly/shared';

interface ReportCardProps {
  report: ReportQueueItem;
}

function getReasonLabel(reason: string): string {
  const found = REPORT_REASONS.find((r) => r.value === reason);
  return found ? found.label : reason;
}

function getStatusBadge(status: 'PENDING' | 'DISMISSED' | 'ACTIONED') {
  switch (status) {
    case 'PENDING':
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Cho xu ly</Badge>;
    case 'DISMISSED':
      return <Badge variant="secondary">Da bo qua</Badge>;
    case 'ACTIONED':
      return <Badge variant="default" className="bg-green-600">Da xu ly</Badge>;
  }
}

export function ReportCard({ report }: ReportCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {report.targetType === 'POST' ? 'Bai viet' : 'Nguoi dung'}
            </Badge>
            {getStatusBadge(report.status)}
          </div>
          {report.reportCount > 1 && (
            <span className="text-sm font-medium text-destructive">
              {report.reportCount} bao cao
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Report reason */}
        <div>
          <p className="text-sm text-muted-foreground">Ly do</p>
          <p className="text-sm font-medium">{getReasonLabel(report.reason)}</p>
        </div>

        {/* Reporter info */}
        <div className="flex items-center gap-2">
          <Avatar className="size-6">
            <AvatarFallback className="text-xs">
              {report.reporterUsername?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            Bao cao boi @{report.reporterUsername || 'unknown'}
          </span>
        </div>

        {/* Date */}
        <p className="text-xs text-muted-foreground">
          {new Date(report.createdAt).toLocaleDateString('vi-VN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </CardContent>

      {report.status === 'PENDING' && (
        <CardFooter>
          <AdminActions
            reportId={report.id}
            targetUserId={report.targetType === 'USER' ? report.targetId : report.targetId}
            targetType={report.targetType}
          />
        </CardFooter>
      )}
    </Card>
  );
}
