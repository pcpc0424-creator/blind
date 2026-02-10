import { prisma, Prisma } from '@blind/database';
import {
  ERROR_CODES,
  CreateCommentInput,
  UpdateCommentInput,
  CommentQueryInput,
  VoteInput,
  sanitizeHtml,
} from '@blind/shared';
import { AppError } from '../middleware/error.middleware';
import { settingsService } from './settings.service';

export const commentService = {
  /**
   * Get comments for a post
   */
  async getComments(query: CommentQueryInput, userId?: string) {
    const { postId, sort, page, limit } = query;
    const skip = (page - 1) * limit;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, status: true },
    });

    if (!post || post.status !== 'ACTIVE') {
      throw new AppError(404, ERROR_CODES.POST_NOT_FOUND, 'Post not found.');
    }

    const where: Prisma.CommentWhereInput = {
      postId,
      status: 'ACTIVE',
      parentId: null, // Top-level comments only
    };

    let orderBy: Prisma.CommentOrderByWithRelationInput[] = [];
    switch (sort) {
      case 'newest':
        orderBy = [{ createdAt: 'desc' }];
        break;
      case 'popular':
        orderBy = [{ voteCount: 'desc' }, { createdAt: 'asc' }];
        break;
      case 'oldest':
      default:
        orderBy = [{ createdAt: 'asc' }];
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              company: { select: { id: true, name: true, slug: true } },
            },
          },
          replies: {
            where: { status: 'ACTIVE' },
            include: {
              author: {
                select: {
                  id: true,
                  nickname: true,
                  company: { select: { id: true, name: true, slug: true } },
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.comment.count({ where }),
    ]);

    // Get user's votes
    let voteMap: Record<string, number> = {};
    if (userId) {
      const allCommentIds = [
        ...comments.map((c) => c.id),
        ...comments.flatMap((c) => c.replies.map((r) => r.id)),
      ];

      const votes = await prisma.vote.findMany({
        where: {
          userId,
          commentId: { in: allCommentIds },
        },
        select: { commentId: true, value: true },
      });

      voteMap = Object.fromEntries(votes.map((v) => [v.commentId!, v.value]));
    }

    const formatComment = (c: any) => ({
      id: c.id,
      content: c.content,
      contentHtml: c.contentHtml,
      isAnonymous: c.isAnonymous,
      isAuthor: c.authorId === post.authorId,
      isCommentAuthor: userId ? c.authorId === userId : false,
      voteCount: c.voteCount,
      replyCount: c.replyCount,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      author: {
        id: c.isAnonymous ? 'anonymous' : c.author.id,
        nickname: c.isAnonymous
          ? c.authorId === post.authorId
            ? 'Anonymous (Author)'
            : 'Anonymous'
          : c.author.nickname,
        isAnonymous: c.isAnonymous,
        company: c.author.company ? {
          id: c.author.company.id,
          name: c.author.company.name,
          slug: c.author.company.slug,
        } : null,
      },
      parentId: c.parentId,
      myVote: voteMap[c.id] ?? null,
    });

    return {
      comments: comments.map((c) => ({
        ...formatComment(c),
        replies: c.replies.map((r: any) => formatComment(r)),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  },

  /**
   * Create a comment
   */
  async createComment(input: CreateCommentInput, authorId: string) {
    // Check daily comment limit
    const limitSetting = await settingsService.getSetting('site.maxCommentsPerDay');
    const maxCommentsPerDay = limitSetting?.value ?? 50;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCommentCount = await prisma.comment.count({
      where: {
        authorId,
        createdAt: { gte: todayStart },
      },
    });

    if (todayCommentCount >= maxCommentsPerDay) {
      throw new AppError(
        429,
        ERROR_CODES.DAILY_COMMENT_LIMIT_EXCEEDED,
        `Daily comment limit (${maxCommentsPerDay}) exceeded. Please try again tomorrow.`
      );
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: input.postId },
      select: { id: true, authorId: true, status: true, isLocked: true },
    });

    if (!post || post.status !== 'ACTIVE') {
      throw new AppError(404, ERROR_CODES.POST_NOT_FOUND, 'Post not found.');
    }

    if (post.isLocked) {
      throw new AppError(403, ERROR_CODES.POST_LOCKED, 'Comments are locked on this post.');
    }

    // If replying, check parent comment exists
    if (input.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: input.parentId },
        select: { id: true, postId: true, status: true, parentId: true },
      });

      if (!parentComment || parentComment.status !== 'ACTIVE') {
        throw new AppError(404, ERROR_CODES.INVALID_PARENT_COMMENT, 'Parent comment not found.');
      }

      if (parentComment.postId !== input.postId) {
        throw new AppError(400, ERROR_CODES.INVALID_PARENT_COMMENT, 'Invalid parent comment.');
      }

      // Don't allow nested replies (only 1 level deep)
      if (parentComment.parentId) {
        throw new AppError(400, ERROR_CODES.INVALID_PARENT_COMMENT, 'Cannot reply to a reply.');
      }
    }

    const contentHtml = sanitizeHtml(input.content);
    const isAuthor = authorId === post.authorId;

    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          postId: input.postId,
          authorId,
          parentId: input.parentId,
          content: input.content,
          contentHtml,
          isAnonymous: input.isAnonymous ?? true,
          isAuthor,
        },
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              company: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      });

      // Update post comment count
      await tx.post.update({
        where: { id: input.postId },
        data: { commentCount: { increment: 1 } },
      });

      // Update parent comment reply count
      if (input.parentId) {
        await tx.comment.update({
          where: { id: input.parentId },
          data: { replyCount: { increment: 1 } },
        });
      }

      return newComment;
    });

    return {
      id: comment.id,
      content: comment.content,
      contentHtml: comment.contentHtml,
      isAnonymous: comment.isAnonymous,
      isAuthor: comment.isAuthor,
      voteCount: 0,
      replyCount: 0,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      author: {
        id: comment.isAnonymous ? 'anonymous' : comment.author.id,
        nickname: comment.isAnonymous
          ? comment.isAuthor
            ? 'Anonymous (Author)'
            : 'Anonymous'
          : comment.author.nickname,
        isAnonymous: comment.isAnonymous,
        company: comment.author.company ? {
          id: comment.author.company.id,
          name: comment.author.company.name,
          slug: comment.author.company.slug,
        } : null,
      },
      parentId: comment.parentId,
      myVote: null,
    };
  },

  /**
   * Update a comment
   */
  async updateComment(id: string, input: UpdateCommentInput, userId: string) {
    const comment = await prisma.comment.findUnique({ where: { id } });

    if (!comment || comment.status !== 'ACTIVE') {
      throw new AppError(404, ERROR_CODES.COMMENT_NOT_FOUND, 'Comment not found.');
    }

    if (comment.authorId !== userId) {
      throw new AppError(403, ERROR_CODES.NOT_COMMENT_AUTHOR, 'You can only edit your own comments.');
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        content: input.content,
        contentHtml: sanitizeHtml(input.content),
      },
    });

    return {
      id: updatedComment.id,
      content: updatedComment.content,
      updatedAt: updatedComment.updatedAt.toISOString(),
    };
  },

  /**
   * Delete a comment (soft delete)
   */
  async deleteComment(id: string, userId: string) {
    const comment = await prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      throw new AppError(404, ERROR_CODES.COMMENT_NOT_FOUND, 'Comment not found.');
    }

    if (comment.authorId !== userId) {
      throw new AppError(403, ERROR_CODES.NOT_COMMENT_AUTHOR, 'You can only delete your own comments.');
    }

    await prisma.$transaction(async (tx) => {
      await tx.comment.update({
        where: { id },
        data: { status: 'DELETED' },
      });

      await tx.post.update({
        where: { id: comment.postId },
        data: { commentCount: { decrement: 1 } },
      });

      if (comment.parentId) {
        await tx.comment.update({
          where: { id: comment.parentId },
          data: { replyCount: { decrement: 1 } },
        });
      }
    });

    return { message: 'Comment has been deleted.' };
  },

  /**
   * Vote on a comment
   */
  async voteComment(commentId: string, userId: string, input: VoteInput) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment || comment.status !== 'ACTIVE') {
      throw new AppError(404, ERROR_CODES.COMMENT_NOT_FOUND, 'Comment not found.');
    }

    const existingVote = await prisma.vote.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });

    await prisma.$transaction(async (tx) => {
      if (input.value === 0) {
        if (existingVote) {
          await tx.vote.delete({ where: { id: existingVote.id } });
          await tx.comment.update({
            where: { id: commentId },
            data: { voteCount: { decrement: existingVote.value } },
          });
        }
      } else if (existingVote) {
        if (existingVote.value !== input.value) {
          await tx.vote.update({
            where: { id: existingVote.id },
            data: { value: input.value },
          });
          await tx.comment.update({
            where: { id: commentId },
            data: { voteCount: { increment: input.value - existingVote.value } },
          });
        }
      } else {
        await tx.vote.create({
          data: { userId, commentId, value: input.value },
        });
        await tx.comment.update({
          where: { id: commentId },
          data: { voteCount: { increment: input.value } },
        });
      }
    });

    const updatedComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { voteCount: true },
    });

    return {
      voteCount: updatedComment?.voteCount ?? 0,
      myVote: input.value === 0 ? null : input.value,
    };
  },

  // ============================================
  // ADMIN FUNCTIONS
  // ============================================

  /**
   * Get all comments (admin)
   */
  async getAdminComments(query: {
    search?: string;
    status?: string;
    page: number;
    limit: number;
  }) {
    const { search, status, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CommentWhereInput = {};

    if (search) {
      where.content = { contains: search, mode: 'insensitive' };
    }

    if (status && status !== 'all') {
      where.status = status as 'ACTIVE' | 'HIDDEN' | 'DELETED';
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          author: { select: { id: true, nickname: true } },
          post: {
            select: {
              id: true,
              title: true,
              community: { select: { id: true, name: true, slug: true } }
            }
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.comment.count({ where }),
    ]);

    return {
      comments: comments.map((c) => ({
        id: c.id,
        content: c.content,
        isAnonymous: c.isAnonymous,
        status: c.status,
        voteCount: c.voteCount,
        replyCount: c.replyCount,
        createdAt: c.createdAt.toISOString(),
        author: {
          id: c.author.id,
          nickname: c.author.nickname,
        },
        post: c.post ? {
          id: c.post.id,
          title: c.post.title,
          community: c.post.community,
        } : null,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  },

  /**
   * Hide/Unhide a comment (admin)
   */
  async adminToggleHide(id: string) {
    const comment = await prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      throw new AppError(404, ERROR_CODES.COMMENT_NOT_FOUND, 'Comment not found.');
    }

    const newStatus = comment.status === 'HIDDEN' ? 'ACTIVE' : 'HIDDEN';

    const updated = await prisma.comment.update({
      where: { id },
      data: { status: newStatus },
    });

    return {
      id: updated.id,
      status: updated.status,
      message: newStatus === 'HIDDEN' ? 'Comment has been hidden.' : 'Comment is now visible.',
    };
  },

  /**
   * Delete a comment (admin - hard action, soft delete)
   */
  async adminDeleteComment(id: string) {
    const comment = await prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      throw new AppError(404, ERROR_CODES.COMMENT_NOT_FOUND, 'Comment not found.');
    }

    await prisma.$transaction(async (tx) => {
      await tx.comment.update({
        where: { id },
        data: { status: 'DELETED' },
      });

      // Update post comment count if comment was active
      if (comment.status === 'ACTIVE') {
        await tx.post.update({
          where: { id: comment.postId },
          data: { commentCount: { decrement: 1 } },
        });

        if (comment.parentId) {
          await tx.comment.update({
            where: { id: comment.parentId },
            data: { replyCount: { decrement: 1 } },
          });
        }
      }
    });

    return { message: 'Comment has been deleted.' };
  },
};
