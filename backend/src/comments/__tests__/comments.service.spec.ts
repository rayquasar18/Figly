import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CommentsService } from '../comments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../media/storage.service';

describe('CommentsService', () => {
  let service: CommentsService;

  const mockPrisma = {
    post: {
      findUnique: jest.fn(),
    },
    comment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockStorageService = {
    getPresignedUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);

    jest.clearAllMocks();
  });

  describe('createComment', () => {
    it('should create a top-level comment (parentId null)', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'post-1' });
      const createdComment = {
        id: 'comment-1',
        userId: 'user-1',
        postId: 'post-1',
        parentId: null,
        content: 'Great post!',
        createdAt: new Date('2026-01-01'),
        user: {
          id: 'user-1',
          username: 'testuser',
          name: 'Test User',
          avatar: null,
        },
      };
      mockPrisma.comment.create.mockResolvedValue(createdComment);

      const result = await service.createComment('user-1', 'post-1', {
        content: 'Great post!',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('comment-1');
      expect(result.parentId).toBeNull();
      expect(mockPrisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            postId: 'post-1',
            content: 'Great post!',
            parentId: null,
          }),
        }),
      );
    });

    it('should create a reply to a top-level comment', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'post-1' });
      mockPrisma.comment.findUnique.mockResolvedValue({
        id: 'parent-1',
        parentId: null, // Top-level comment
      });
      const createdReply = {
        id: 'reply-1',
        userId: 'user-2',
        postId: 'post-1',
        parentId: 'parent-1',
        content: 'Thanks!',
        createdAt: new Date('2026-01-01'),
        user: {
          id: 'user-2',
          username: 'replier',
          name: 'Replier',
          avatar: null,
        },
      };
      mockPrisma.comment.create.mockResolvedValue(createdReply);

      const result = await service.createComment('user-2', 'post-1', {
        content: 'Thanks!',
        parentId: 'parent-1',
      });

      expect(result.parentId).toBe('parent-1');
    });

    it('should flatten reply-to-reply to 1 level (use parent\'s parentId)', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'post-1' });
      mockPrisma.comment.findUnique.mockResolvedValue({
        id: 'reply-1',
        parentId: 'top-level-1', // This is already a reply, not a top-level comment
      });
      const createdReply = {
        id: 'flattened-reply',
        userId: 'user-3',
        postId: 'post-1',
        parentId: 'top-level-1', // Flattened to top-level parent
        content: 'Nested reply flattened',
        createdAt: new Date('2026-01-01'),
        user: {
          id: 'user-3',
          username: 'nesteduser',
          name: 'Nested User',
          avatar: null,
        },
      };
      mockPrisma.comment.create.mockResolvedValue(createdReply);

      const result = await service.createComment('user-3', 'post-1', {
        content: 'Nested reply flattened',
        parentId: 'reply-1', // Reply to a reply
      });

      // Should be flattened -- parentId becomes the top-level comment's ID
      expect(mockPrisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            parentId: 'top-level-1', // Flattened
          }),
        }),
      );
    });

    it('should throw NotFoundException if post does not exist', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);

      await expect(
        service.createComment('user-1', 'nonexistent', { content: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if parent comment does not exist', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'post-1' });
      mockPrisma.comment.findUnique.mockResolvedValue(null);

      await expect(
        service.createComment('user-1', 'post-1', {
          content: 'Test',
          parentId: 'nonexistent-comment',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getComments', () => {
    it('should return top-level comments with eager-loaded replies', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          userId: 'user-1',
          postId: 'post-1',
          parentId: null,
          content: 'Top-level comment',
          createdAt: new Date('2026-01-01'),
          user: {
            id: 'user-1',
            username: 'commenter',
            name: 'Commenter',
            avatar: null,
          },
          replies: [
            {
              id: 'reply-1',
              userId: 'user-2',
              postId: 'post-1',
              parentId: 'comment-1',
              content: 'A reply',
              createdAt: new Date('2026-01-02'),
              user: {
                id: 'user-2',
                username: 'replier',
                name: 'Replier',
                avatar: null,
              },
            },
          ],
        },
      ];

      mockPrisma.comment.findMany.mockResolvedValue(mockComments);
      mockStorageService.getPresignedUrl.mockResolvedValue('https://url.com/signed');

      const result = await service.getComments('post-1');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].replies).toHaveLength(1);
      expect(result.hasMore).toBe(false);
    });

    it('should return hasMore=true when more comments exist', async () => {
      // Create 21 comments (take+1 = 20+1)
      const mockComments = Array.from({ length: 21 }, (_, i) => ({
        id: `comment-${i}`,
        userId: 'user-1',
        postId: 'post-1',
        parentId: null,
        content: `Comment ${i}`,
        createdAt: new Date('2026-01-01'),
        user: {
          id: 'user-1',
          username: 'commenter',
          name: 'Commenter',
          avatar: null,
        },
        replies: [],
      }));

      mockPrisma.comment.findMany.mockResolvedValue(mockComments);

      const result = await service.getComments('post-1');

      expect(result.items).toHaveLength(20);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('comment-19');
    });
  });

  describe('deleteComment', () => {
    it('should delete comment when user is owner', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue({
        id: 'comment-1',
        userId: 'user-1',
      });
      mockPrisma.comment.delete.mockResolvedValue({ id: 'comment-1' });

      await service.deleteComment('comment-1', 'user-1');

      expect(mockPrisma.comment.delete).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
      });
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue({
        id: 'comment-1',
        userId: 'other-user',
      });

      await expect(
        service.deleteComment('comment-1', 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if comment does not exist', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteComment('nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
