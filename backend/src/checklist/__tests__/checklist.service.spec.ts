import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ChecklistService } from '../checklist.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ChecklistService', () => {
  let service: ChecklistService;

  const mockPrisma: Record<string, any> = {
    checklist: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    checklistEntry: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
    item: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((fn: any) => fn(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChecklistService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ChecklistService>(ChecklistService);

    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockPrisma));
  });

  describe('createChecklist', () => {
    it('should create a checklist and return with 0/0 counts', async () => {
      const created = {
        id: 'cl-1',
        userId: 'user-1',
        name: 'My Gundam List',
        isPublic: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };
      mockPrisma.checklist.create.mockResolvedValue(created);

      const result = await service.createChecklist('user-1', {
        name: 'My Gundam List',
        isPublic: false,
      });

      expect(result).toEqual(expect.objectContaining({
        id: 'cl-1',
        name: 'My Gundam List',
        isPublic: false,
        totalEntries: 0,
        checkedEntries: 0,
      }));
      expect(mockPrisma.checklist.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          name: 'My Gundam List',
          isPublic: false,
        },
      });
    });
  });

  describe('getMyChecklists', () => {
    it('should return only the user\'s checklists with entry counts', async () => {
      mockPrisma.checklist.findMany.mockResolvedValue([
        {
          id: 'cl-1',
          userId: 'user-1',
          name: 'Gundam List',
          isPublic: false,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
          _count: { entries: 3 },
          entries: [{ isChecked: true }, { isChecked: false }, { isChecked: true }],
        },
        {
          id: 'cl-2',
          userId: 'user-1',
          name: 'Sneaker List',
          isPublic: true,
          createdAt: new Date('2026-01-02'),
          updatedAt: new Date('2026-01-02'),
          _count: { entries: 0 },
          entries: [],
        },
      ]);

      const result = await service.getMyChecklists('user-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'cl-1',
        totalEntries: 3,
        checkedEntries: 2,
      }));
      expect(result[1]).toEqual(expect.objectContaining({
        id: 'cl-2',
        totalEntries: 0,
        checkedEntries: 0,
      }));
      expect(mockPrisma.checklist.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
        }),
      );
    });
  });

  describe('getChecklistDetail', () => {
    it('should return checklist with entries ordered by position for owner', async () => {
      mockPrisma.checklist.findUnique.mockResolvedValue({
        id: 'cl-1',
        userId: 'user-1',
        name: 'Gundam List',
        isPublic: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        entries: [
          {
            id: 'entry-1',
            checklistId: 'cl-1',
            itemId: 'item-1',
            item: { name: 'RX-78-2', imageKey: null, series: { name: 'MG', category: { name: 'Gundam' } } },
            freeformText: null,
            isChecked: true,
            position: 0,
          },
          {
            id: 'entry-2',
            checklistId: 'cl-1',
            itemId: null,
            item: null,
            freeformText: 'Buy display case',
            isChecked: false,
            position: 1,
          },
        ],
      });

      const result = await service.getChecklistDetail('cl-1', 'user-1');

      expect(result.id).toBe('cl-1');
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]).toEqual(expect.objectContaining({
        id: 'entry-1',
        itemName: 'RX-78-2',
        isChecked: true,
        position: 0,
      }));
      expect(result.entries[1]).toEqual(expect.objectContaining({
        id: 'entry-2',
        freeformText: 'Buy display case',
        isChecked: false,
      }));
    });

    it('should throw ForbiddenException for non-owner on private checklist', async () => {
      mockPrisma.checklist.findUnique.mockResolvedValue({
        id: 'cl-1',
        userId: 'user-1',
        name: 'Private List',
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        entries: [],
      });

      await expect(
        service.getChecklistDetail('cl-1', 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow non-owner to view public checklist', async () => {
      mockPrisma.checklist.findUnique.mockResolvedValue({
        id: 'cl-1',
        userId: 'user-1',
        name: 'Public List',
        isPublic: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        entries: [],
      });

      const result = await service.getChecklistDetail('cl-1', 'other-user');
      expect(result.id).toBe('cl-1');
    });

    it('should throw NotFoundException when checklist does not exist', async () => {
      mockPrisma.checklist.findUnique.mockResolvedValue(null);

      await expect(
        service.getChecklistDetail('nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPublicChecklists', () => {
    it('should return public checklists for a username', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrisma.checklist.findMany.mockResolvedValue([
        {
          id: 'cl-1',
          userId: 'user-1',
          name: 'Public List',
          isPublic: true,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
          _count: { entries: 5 },
          entries: [
            { isChecked: true },
            { isChecked: true },
            { isChecked: false },
            { isChecked: false },
            { isChecked: true },
          ],
        },
      ]);

      const result = await service.getPublicChecklists('collector');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'cl-1',
        totalEntries: 5,
        checkedEntries: 3,
      }));
    });

    it('should throw NotFoundException for non-existent username', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.getPublicChecklists('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateChecklist', () => {
    it('should update name and isPublic', async () => {
      mockPrisma.checklist.findFirst.mockResolvedValue({
        id: 'cl-1',
        userId: 'user-1',
      });
      mockPrisma.checklist.update.mockResolvedValue({
        id: 'cl-1',
        userId: 'user-1',
        name: 'Updated Name',
        isPublic: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
      });

      const result = await service.updateChecklist('cl-1', 'user-1', {
        name: 'Updated Name',
        isPublic: true,
      });

      expect(result.name).toBe('Updated Name');
      expect(mockPrisma.checklist.update).toHaveBeenCalledWith({
        where: { id: 'cl-1' },
        data: { name: 'Updated Name', isPublic: true },
      });
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockPrisma.checklist.findFirst.mockResolvedValue(null);

      await expect(
        service.updateChecklist('cl-1', 'other-user', { name: 'Hacked' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteChecklist', () => {
    it('should delete checklist with ownership check', async () => {
      mockPrisma.checklist.findFirst.mockResolvedValue({
        id: 'cl-1',
        userId: 'user-1',
      });
      mockPrisma.checklist.delete.mockResolvedValue({ id: 'cl-1' });

      await service.deleteChecklist('cl-1', 'user-1');

      expect(mockPrisma.checklist.delete).toHaveBeenCalledWith({
        where: { id: 'cl-1' },
      });
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockPrisma.checklist.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteChecklist('cl-1', 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('addEntry', () => {
    it('should add entry at correct position (max + 1)', async () => {
      mockPrisma.checklist.findFirst.mockResolvedValue({
        id: 'cl-1',
        userId: 'user-1',
      });
      mockPrisma.checklistEntry.aggregate.mockResolvedValue({
        _max: { position: 2 },
      });
      mockPrisma.checklistEntry.create.mockResolvedValue({
        id: 'entry-3',
        checklistId: 'cl-1',
        itemId: null,
        item: null,
        freeformText: 'New freeform entry',
        isChecked: false,
        position: 3,
      });

      const result = await service.addEntry('cl-1', 'user-1', {
        freeformText: 'New freeform entry',
      });

      expect(result.position).toBe(3);
      expect(mockPrisma.checklistEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            checklistId: 'cl-1',
            freeformText: 'New freeform entry',
            position: 3,
          }),
        }),
      );
    });

    it('should validate item exists when itemId is provided', async () => {
      mockPrisma.checklist.findFirst.mockResolvedValue({
        id: 'cl-1',
        userId: 'user-1',
      });
      mockPrisma.item.findUnique.mockResolvedValue(null);

      await expect(
        service.addEntry('cl-1', 'user-1', { itemId: 'nonexistent-item' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should add entry with itemId when item exists', async () => {
      mockPrisma.checklist.findFirst.mockResolvedValue({
        id: 'cl-1',
        userId: 'user-1',
      });
      mockPrisma.item.findUnique.mockResolvedValue({
        id: 'item-1',
        name: 'RX-78-2',
      });
      mockPrisma.checklistEntry.aggregate.mockResolvedValue({
        _max: { position: null },
      });
      mockPrisma.checklistEntry.create.mockResolvedValue({
        id: 'entry-1',
        checklistId: 'cl-1',
        itemId: 'item-1',
        item: { name: 'RX-78-2', imageKey: null, series: { name: 'MG', category: { name: 'Gundam' } } },
        freeformText: null,
        isChecked: false,
        position: 0,
      });

      const result = await service.addEntry('cl-1', 'user-1', {
        itemId: 'item-1',
      });

      expect(result.position).toBe(0);
      expect(result.itemId).toBe('item-1');
    });
  });

  describe('toggleEntry', () => {
    it('should flip isChecked from false to true', async () => {
      mockPrisma.checklistEntry.findUnique.mockResolvedValue({
        id: 'entry-1',
        isChecked: false,
        checklist: { id: 'cl-1', userId: 'user-1' },
      });
      mockPrisma.checklistEntry.update.mockResolvedValue({
        id: 'entry-1',
        isChecked: true,
      });

      const result = await service.toggleEntry('entry-1', 'user-1');

      expect(result.isChecked).toBe(true);
      expect(mockPrisma.checklistEntry.update).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
        data: { isChecked: true },
      });
    });

    it('should flip isChecked from true to false', async () => {
      mockPrisma.checklistEntry.findUnique.mockResolvedValue({
        id: 'entry-1',
        isChecked: true,
        checklist: { id: 'cl-1', userId: 'user-1' },
      });
      mockPrisma.checklistEntry.update.mockResolvedValue({
        id: 'entry-1',
        isChecked: false,
      });

      const result = await service.toggleEntry('entry-1', 'user-1');

      expect(result.isChecked).toBe(false);
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockPrisma.checklistEntry.findUnique.mockResolvedValue({
        id: 'entry-1',
        isChecked: false,
        checklist: { id: 'cl-1', userId: 'other-user' },
      });

      await expect(
        service.toggleEntry('entry-1', 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when entry does not exist', async () => {
      mockPrisma.checklistEntry.findUnique.mockResolvedValue(null);

      await expect(
        service.toggleEntry('nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeEntry', () => {
    it('should delete entry with ownership verification', async () => {
      mockPrisma.checklistEntry.findUnique.mockResolvedValue({
        id: 'entry-1',
        checklist: { id: 'cl-1', userId: 'user-1' },
      });
      mockPrisma.checklistEntry.delete.mockResolvedValue({ id: 'entry-1' });

      await service.removeEntry('entry-1', 'user-1');

      expect(mockPrisma.checklistEntry.delete).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
      });
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockPrisma.checklistEntry.findUnique.mockResolvedValue({
        id: 'entry-1',
        checklist: { id: 'cl-1', userId: 'other-user' },
      });

      await expect(
        service.removeEntry('entry-1', 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('reorderEntries', () => {
    it('should set correct positions based on array index order', async () => {
      mockPrisma.checklist.findFirst.mockResolvedValue({
        id: 'cl-1',
        userId: 'user-1',
      });

      await service.reorderEntries('cl-1', 'user-1', ['entry-3', 'entry-1', 'entry-2']);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.checklistEntry.update).toHaveBeenCalledTimes(3);
      expect(mockPrisma.checklistEntry.update).toHaveBeenCalledWith({
        where: { id: 'entry-3' },
        data: { position: 0 },
      });
      expect(mockPrisma.checklistEntry.update).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
        data: { position: 1 },
      });
      expect(mockPrisma.checklistEntry.update).toHaveBeenCalledWith({
        where: { id: 'entry-2' },
        data: { position: 2 },
      });
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockPrisma.checklist.findFirst.mockResolvedValue(null);

      await expect(
        service.reorderEntries('cl-1', 'other-user', ['entry-1']),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
