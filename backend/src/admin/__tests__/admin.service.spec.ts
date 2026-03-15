import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  ExecutionContext,
} from '@nestjs/common';
import { AdminService } from '../admin.service';
import { AdminGuard } from '../guards/admin.guard';
import { PrismaService } from '../../prisma/prisma.service';

describe('AdminService', () => {
  let service: AdminService;

  const mockPrisma = {
    report: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      groupBy: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    post: {
      delete: jest.fn(),
    },
    refreshToken: {
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);

    jest.clearAllMocks();
  });

  describe('getReportQueue', () => {
    it('should return pending reports sorted by newest', async () => {
      mockPrisma.report.findMany.mockResolvedValue([
        {
          id: 'report-1',
          reporterId: 'user-1',
          reporter: { username: 'reporter1' },
          targetId: 'post-1',
          targetType: 'POST',
          reason: 'SPAM',
          status: 'PENDING',
          createdAt: new Date('2026-03-15'),
        },
      ]);

      const result = await service.getReportQueue({ sort: 'newest' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe('PENDING');
      expect(mockPrisma.report.findMany).toHaveBeenCalled();
    });

    it('should return reports sorted by most_reported', async () => {
      mockPrisma.report.groupBy.mockResolvedValue([
        { targetId: 'post-1', _count: { targetId: 3 } },
      ]);
      mockPrisma.report.findMany.mockResolvedValue([
        {
          id: 'report-1',
          reporterId: 'user-1',
          reporter: { username: 'reporter1' },
          targetId: 'post-1',
          targetType: 'POST',
          reason: 'SPAM',
          status: 'PENDING',
          createdAt: new Date('2026-03-15'),
        },
      ]);

      const result = await service.getReportQueue({ sort: 'most_reported' });

      expect(result.items).toBeDefined();
    });
  });

  describe('dismissReport', () => {
    it('should set status to DISMISSED with resolvedById and resolvedAt', async () => {
      mockPrisma.report.findUnique.mockResolvedValue({
        id: 'report-1',
        status: 'PENDING',
      });
      mockPrisma.report.update.mockResolvedValue({
        id: 'report-1',
        status: 'DISMISSED',
        resolvedById: 'admin-1',
        resolvedAt: new Date(),
      });

      const result = await service.dismissReport('report-1', 'admin-1');

      expect(result.success).toBe(true);
      expect(mockPrisma.report.update).toHaveBeenCalledWith({
        where: { id: 'report-1' },
        data: {
          status: 'DISMISSED',
          resolvedById: 'admin-1',
          resolvedAt: expect.any(Date),
        },
      });
    });

    it('should throw BadRequestException on non-PENDING report', async () => {
      mockPrisma.report.findUnique.mockResolvedValue({
        id: 'report-1',
        status: 'DISMISSED',
      });

      await expect(service.dismissReport('report-1', 'admin-1'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('removeContent', () => {
    it('should delete the reported post and set report status to ACTIONED', async () => {
      mockPrisma.report.findUnique.mockResolvedValue({
        id: 'report-1',
        targetId: 'post-1',
        targetType: 'POST',
        status: 'PENDING',
      });
      mockPrisma.post.delete.mockResolvedValue({ id: 'post-1' });
      mockPrisma.report.update.mockResolvedValue({
        id: 'report-1',
        status: 'ACTIONED',
      });

      const result = await service.removeContent('report-1', 'admin-1');

      expect(result.success).toBe(true);
      expect(mockPrisma.post.delete).toHaveBeenCalledWith({
        where: { id: 'post-1' },
      });
    });

    it('should throw BadRequestException for USER target type', async () => {
      mockPrisma.report.findUnique.mockResolvedValue({
        id: 'report-1',
        targetId: 'user-1',
        targetType: 'USER',
        status: 'PENDING',
      });

      await expect(service.removeContent('report-1', 'admin-1'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('warnUser', () => {
    it('should increment warningCount on target user', async () => {
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        warningCount: 1,
      });

      const result = await service.warnUser('user-1', 'admin-1');

      expect(result.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { warningCount: { increment: 1 } },
      });
    });
  });

  describe('banUser', () => {
    it('should set isBanned=true, bannedAt, and delete all refresh tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        isBanned: false,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        isBanned: true,
        bannedAt: new Date(),
      });
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

      const result = await service.banUser('user-1', 'admin-1');

      expect(result.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          isBanned: true,
          bannedAt: expect.any(Date),
        },
      });
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('should throw BadRequestException on already-banned user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        isBanned: true,
      });

      await expect(service.banUser('user-1', 'admin-1'))
        .rejects.toThrow(BadRequestException);
    });
  });
});

describe('AdminGuard', () => {
  let guard: AdminGuard;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminGuard,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    guard = module.get<AdminGuard>(AdminGuard);

    jest.clearAllMocks();
  });

  const createMockContext = (userId: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          user: { userId },
        }),
      }),
    }) as any;

  it('should allow ADMIN role', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

    const result = await guard.canActivate(createMockContext('admin-1'));

    expect(result).toBe(true);
  });

  it('should reject USER role with ForbiddenException', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'USER' });

    await expect(guard.canActivate(createMockContext('user-1')))
      .rejects.toThrow(ForbiddenException);
  });
});
