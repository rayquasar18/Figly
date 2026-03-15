import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MODERATION_LIMITS } from '@figly/shared';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getReportQueue(options: {
    sort?: 'newest' | 'most_reported';
    cursor?: string;
    take?: number;
  }) {
    const take = options.take || MODERATION_LIMITS.reportQueuePageSize;
    const sort = options.sort || 'newest';

    if (sort === 'most_reported') {
      // Group by targetId and sort by count
      const grouped = await this.prisma.report.groupBy({
        by: ['targetId'],
        where: { status: 'PENDING' },
        _count: { targetId: true },
        orderBy: { _count: { targetId: 'desc' } },
        take: take + 1,
      });

      const targetIds = grouped.slice(0, take).map((g: any) => g.targetId);

      const reports = await this.prisma.report.findMany({
        where: {
          targetId: { in: targetIds },
          status: 'PENDING',
        },
        include: {
          reporter: { select: { username: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Deduplicate by targetId -- show most recent report per target
      const seen = new Set<string>();
      const dedupedReports: any[] = [];
      for (const r of reports) {
        if (!seen.has(r.targetId)) {
          seen.add(r.targetId);
          const group = grouped.find((g: any) => g.targetId === r.targetId);
          dedupedReports.push({
            ...r,
            reportCount: group?._count?.targetId || 1,
          });
        }
      }

      return {
        items: dedupedReports.map((r: any) => ({
          id: r.id,
          reporterId: r.reporterId,
          reporterUsername: r.reporter?.username || null,
          targetId: r.targetId,
          targetType: r.targetType,
          reason: r.reason,
          status: r.status,
          reportCount: r.reportCount,
          createdAt: r.createdAt.toISOString(),
        })),
        nextCursor: null,
        hasMore: grouped.length > take,
      };
    }

    // Default: newest sort
    const reports = await this.prisma.report.findMany({
      where: { status: 'PENDING' },
      include: {
        reporter: { select: { username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(options.cursor && {
        cursor: { id: options.cursor },
        skip: 1,
      }),
    });

    const hasMore = reports.length > take;
    const items = reports.slice(0, take);
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      items: items.map((r: any) => ({
        id: r.id,
        reporterId: r.reporterId,
        reporterUsername: r.reporter?.username || null,
        targetId: r.targetId,
        targetType: r.targetType,
        reason: r.reason,
        status: r.status,
        reportCount: 1,
        createdAt: r.createdAt.toISOString(),
      })),
      nextCursor,
      hasMore,
    };
  }

  async dismissReport(reportId: string, adminId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Bao cao khong ton tai');
    }

    if (report.status !== 'PENDING') {
      throw new BadRequestException('Bao cao da duoc xu ly');
    }

    await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'DISMISSED',
        resolvedById: adminId,
        resolvedAt: new Date(),
      },
    });

    return { success: true, message: 'Bao cao da duoc bo qua' };
  }

  async removeContent(reportId: string, adminId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Bao cao khong ton tai');
    }

    if (report.status !== 'PENDING') {
      throw new BadRequestException('Bao cao da duoc xu ly');
    }

    if (report.targetType === 'USER') {
      throw new BadRequestException('Khong the xoa nguoi dung, hay su dung cam tai khoan');
    }

    // Delete the reported post
    await this.prisma.post.delete({
      where: { id: report.targetId },
    });

    // Update report status
    await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'ACTIONED',
        resolvedById: adminId,
        resolvedAt: new Date(),
      },
    });

    return { success: true, message: 'Noi dung da duoc xoa' };
  }

  async warnUser(userId: string, adminId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { warningCount: { increment: 1 } },
    });

    return { success: true, message: 'Nguoi dung da duoc canh bao' };
  }

  async banUser(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isBanned: true },
    });

    if (!user) {
      throw new NotFoundException('Nguoi dung khong ton tai');
    }

    if (user.isBanned) {
      throw new BadRequestException('Nguoi dung da bi cam');
    }

    // Ban user and delete all refresh tokens
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        bannedAt: new Date(),
      },
    });

    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return { success: true, message: 'Nguoi dung da bi cam' };
  }
}
