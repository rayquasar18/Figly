import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  ChecklistResponse,
  ChecklistDetailResponse,
  ChecklistEntryResponse,
} from '@figly/shared';

@Injectable()
export class ChecklistService {
  constructor(private prisma: PrismaService) {}

  async createChecklist(
    userId: string,
    dto: { name: string; isPublic?: boolean },
  ): Promise<ChecklistResponse> {
    const checklist = await this.prisma.checklist.create({
      data: {
        userId,
        name: dto.name,
        isPublic: dto.isPublic ?? false,
      },
    });

    return {
      id: checklist.id,
      name: checklist.name,
      isPublic: checklist.isPublic,
      totalEntries: 0,
      checkedEntries: 0,
      createdAt: checklist.createdAt.toISOString(),
      updatedAt: checklist.updatedAt.toISOString(),
    };
  }

  async getMyChecklists(userId: string): Promise<ChecklistResponse[]> {
    const checklists = await this.prisma.checklist.findMany({
      where: { userId },
      include: {
        _count: { select: { entries: true } },
        entries: { select: { isChecked: true } },
      },
      orderBy: { createdAt: 'desc' as const },
    });

    return checklists.map((cl: any) => ({
      id: cl.id,
      name: cl.name,
      isPublic: cl.isPublic,
      totalEntries: cl._count.entries,
      checkedEntries: cl.entries.filter((e: any) => e.isChecked).length,
      createdAt: cl.createdAt.toISOString(),
      updatedAt: cl.updatedAt.toISOString(),
    }));
  }

  async getChecklistDetail(
    checklistId: string,
    viewerId: string,
  ): Promise<ChecklistDetailResponse> {
    const checklist = await this.prisma.checklist.findUnique({
      where: { id: checklistId },
      include: {
        entries: {
          orderBy: { position: 'asc' as const },
          include: {
            item: {
              select: {
                name: true,
                imageKey: true,
                series: {
                  select: {
                    name: true,
                    category: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!checklist) {
      throw new NotFoundException('Checklist khong ton tai');
    }

    if (checklist.userId !== viewerId && !checklist.isPublic) {
      throw new ForbiddenException('Ban khong co quyen xem checklist nay');
    }

    const entries: ChecklistEntryResponse[] = checklist.entries.map((entry: any) => ({
      id: entry.id,
      checklistId: entry.checklistId,
      itemId: entry.itemId,
      itemName: entry.item?.name ?? null,
      itemImageUrl: entry.item?.imageKey ?? null,
      freeformText: entry.freeformText,
      isChecked: entry.isChecked,
      position: entry.position,
    }));

    const totalEntries = entries.length;
    const checkedEntries = entries.filter((e) => e.isChecked).length;

    return {
      id: checklist.id,
      name: checklist.name,
      isPublic: checklist.isPublic,
      totalEntries,
      checkedEntries,
      createdAt: checklist.createdAt.toISOString(),
      updatedAt: checklist.updatedAt.toISOString(),
      entries,
    };
  }

  async getPublicChecklists(username: string): Promise<ChecklistResponse[]> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Nguoi dung khong ton tai');
    }

    const checklists = await this.prisma.checklist.findMany({
      where: { userId: user.id, isPublic: true },
      include: {
        _count: { select: { entries: true } },
        entries: { select: { isChecked: true } },
      },
      orderBy: { createdAt: 'desc' as const },
    });

    return checklists.map((cl: any) => ({
      id: cl.id,
      name: cl.name,
      isPublic: cl.isPublic,
      totalEntries: cl._count.entries,
      checkedEntries: cl.entries.filter((e: any) => e.isChecked).length,
      createdAt: cl.createdAt.toISOString(),
      updatedAt: cl.updatedAt.toISOString(),
    }));
  }

  async updateChecklist(
    checklistId: string,
    userId: string,
    dto: { name?: string; isPublic?: boolean },
  ): Promise<ChecklistResponse> {
    const checklist = await this.prisma.checklist.findFirst({
      where: { id: checklistId, userId },
    });

    if (!checklist) {
      throw new ForbiddenException('Ban khong co quyen chinh sua checklist nay');
    }

    const updated = await this.prisma.checklist.update({
      where: { id: checklistId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      isPublic: updated.isPublic,
      totalEntries: 0,
      checkedEntries: 0,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deleteChecklist(checklistId: string, userId: string): Promise<void> {
    const checklist = await this.prisma.checklist.findFirst({
      where: { id: checklistId, userId },
    });

    if (!checklist) {
      throw new ForbiddenException('Ban khong co quyen xoa checklist nay');
    }

    await this.prisma.checklist.delete({
      where: { id: checklistId },
    });
  }

  async addEntry(
    checklistId: string,
    userId: string,
    dto: { itemId?: string; freeformText?: string },
  ): Promise<ChecklistEntryResponse> {
    const checklist = await this.prisma.checklist.findFirst({
      where: { id: checklistId, userId },
    });

    if (!checklist) {
      throw new ForbiddenException('Ban khong co quyen them muc vao checklist nay');
    }

    // Validate item exists if itemId is provided
    if (dto.itemId) {
      const item = await this.prisma.item.findUnique({
        where: { id: dto.itemId },
      });
      if (!item) {
        throw new NotFoundException('Vat pham khong ton tai');
      }
    }

    // Find max position
    const agg = await this.prisma.checklistEntry.aggregate({
      where: { checklistId },
      _max: { position: true },
    });
    const nextPosition = (agg._max.position ?? -1) + 1;

    const entry = await this.prisma.checklistEntry.create({
      data: {
        checklistId,
        itemId: dto.itemId ?? null,
        freeformText: dto.freeformText ?? null,
        position: nextPosition,
      },
      include: {
        item: {
          select: {
            name: true,
            imageKey: true,
            series: {
              select: {
                name: true,
                category: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    return {
      id: entry.id,
      checklistId: entry.checklistId,
      itemId: entry.itemId,
      itemName: entry.item?.name ?? null,
      itemImageUrl: entry.item?.imageKey ?? null,
      freeformText: entry.freeformText,
      isChecked: entry.isChecked,
      position: entry.position,
    };
  }

  async toggleEntry(
    entryId: string,
    userId: string,
  ): Promise<{ id: string; isChecked: boolean }> {
    const entry = await this.prisma.checklistEntry.findUnique({
      where: { id: entryId },
      include: { checklist: { select: { id: true, userId: true } } },
    });

    if (!entry) {
      throw new NotFoundException('Muc khong ton tai');
    }

    if (entry.checklist.userId !== userId) {
      throw new ForbiddenException('Ban khong co quyen thay doi muc nay');
    }

    const updated = await this.prisma.checklistEntry.update({
      where: { id: entryId },
      data: { isChecked: !entry.isChecked },
    });

    return { id: updated.id, isChecked: updated.isChecked };
  }

  async removeEntry(entryId: string, userId: string): Promise<void> {
    const entry = await this.prisma.checklistEntry.findUnique({
      where: { id: entryId },
      include: { checklist: { select: { id: true, userId: true } } },
    });

    if (!entry) {
      throw new NotFoundException('Muc khong ton tai');
    }

    if (entry.checklist.userId !== userId) {
      throw new ForbiddenException('Ban khong co quyen xoa muc nay');
    }

    await this.prisma.checklistEntry.delete({
      where: { id: entryId },
    });
  }

  async reorderEntries(
    checklistId: string,
    userId: string,
    entryIds: string[],
  ): Promise<void> {
    const checklist = await this.prisma.checklist.findFirst({
      where: { id: checklistId, userId },
    });

    if (!checklist) {
      throw new ForbiddenException('Ban khong co quyen sap xep checklist nay');
    }

    await this.prisma.$transaction(async (tx: any) => {
      for (let i = 0; i < entryIds.length; i++) {
        await tx.checklistEntry.update({
          where: { id: entryIds[i] },
          data: { position: i },
        });
      }
    });
  }
}
