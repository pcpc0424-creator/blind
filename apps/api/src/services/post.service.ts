import { prisma, Prisma, CommunityType } from '@blind/database';
import {
  ERROR_CODES,
  CreatePostInput,
  UpdatePostInput,
  PostQueryInput,
  VoteInput,
  sanitizeHtml,
} from '@blind/shared';
import { AppError } from '../middleware/error.middleware';
import { settingsService } from './settings.service';

export const postService = {
  /**
   * Get posts feed
   */
  async getPosts(query: PostQueryInput, userId?: string, userCompanyId?: string | null, isAdmin?: boolean) {
    const { communityId, sort, page, limit, search, tag } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = {
      status: 'ACTIVE',
    };

    if (communityId) {
      where.communityId = communityId;

      // Check if this is a company community the user can't access
      const community = await prisma.community.findUnique({
        where: { id: communityId },
        select: { type: true, companyId: true },
      });

      if (community?.type === 'COMPANY' && community.companyId && !isAdmin) {
        if (!userCompanyId || community.companyId !== userCompanyId) {
          throw new AppError(
            403,
            ERROR_CODES.COMPANY_VERIFICATION_REQUIRED,
            'Only verified employees can access this company community.'
          );
        }
      }
    } else if (!isAdmin) {
      // Exclude posts from company communities the user can't access (admin can see all)
      where.OR = [
        // Non-company communities
        { community: { type: { not: 'COMPANY' as CommunityType } } },
        // Company communities without companyId
        { community: { type: 'COMPANY' as CommunityType, companyId: null } },
        // User's own company community (if they have one)
        ...(userCompanyId ? [{ community: { type: 'COMPANY' as CommunityType, companyId: userCompanyId } }] : []),
      ];
    }

    if (search) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    if (tag) {
      where.tags = {
        some: {
          tag: { slug: tag },
        },
      };
    }

    // Determine sort order
    let orderBy: Prisma.PostOrderByWithRelationInput[] = [];
    switch (sort) {
      case 'popular':
        orderBy = [{ voteCount: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'trending':
        // Posts from last 24 hours sorted by engagement
        where.createdAt = { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) };
        orderBy = [{ voteCount: 'desc' }, { commentCount: 'desc' }];
        break;
      case 'latest':
      default:
        orderBy = [{ createdAt: 'desc' }];
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              company: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
          community: {
            select: {
              id: true,
              name: true,
              slug: true,
              type: true,
              iconUrl: true,
              isPrivate: true,
              memberCount: true,
              postCount: true,
            },
          },
          tags: {
            include: {
              tag: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
          _count: {
            select: { media: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.post.count({ where }),
    ]);

    // Get user's votes and bookmarks
    let voteMap: Record<string, number> = {};
    let bookmarkSet: Set<string> = new Set();

    if (userId) {
      const [votes, bookmarks] = await Promise.all([
        prisma.vote.findMany({
          where: {
            userId,
            postId: { in: posts.map((p) => p.id) },
          },
          select: { postId: true, value: true },
        }),
        prisma.bookmark.findMany({
          where: {
            userId,
            postId: { in: posts.map((p) => p.id) },
          },
          select: { postId: true },
        }),
      ]);

      voteMap = Object.fromEntries(votes.map((v) => [v.postId!, v.value]));
      bookmarkSet = new Set(bookmarks.map((b) => b.postId));
    }

    return {
      posts: posts.map((p) => ({
        id: p.id,
        title: p.title,
        content: p.content.substring(0, 300) + (p.content.length > 300 ? '...' : ''),
        contentHtml: null,
        isAnonymous: p.isAnonymous,
        viewCount: p.viewCount,
        voteCount: p.voteCount,
        commentCount: p.commentCount,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        author: {
          id: p.isAnonymous ? 'anonymous' : p.author.id,
          nickname: p.isAnonymous ? 'Anonymous' : p.author.nickname,
          isAnonymous: p.isAnonymous,
          company: p.author.company ? {
            id: p.author.company.id,
            name: p.author.company.name,
            slug: p.author.company.slug,
          } : null,
        },
        community: p.community,
        tags: p.tags.map((t) => t.tag),
        hasMedia: p._count.media > 0,
        myVote: voteMap[p.id] ?? null,
        isBookmarked: bookmarkSet.has(p.id),
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
   * Get trending posts
   */
  async getTrendingPosts(limit: number = 10, userId?: string, userCompanyId?: string | null) {
    const posts = await prisma.post.findMany({
      where: {
        status: 'ACTIVE',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        voteCount: { gte: 5 },
        // Exclude posts from company communities the user can't access
        OR: [
          { community: { type: { not: 'COMPANY' as CommunityType } } },
          { community: { type: 'COMPANY' as CommunityType, companyId: null } },
          ...(userCompanyId ? [{ community: { type: 'COMPANY' as CommunityType, companyId: userCompanyId } }] : []),
        ],
      },
      include: {
        author: { select: { id: true, nickname: true } },
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            iconUrl: true,
            isPrivate: true,
            memberCount: true,
            postCount: true,
          },
        },
      },
      orderBy: [{ voteCount: 'desc' }, { commentCount: 'desc' }],
      take: limit,
    });

    return posts.map((p) => ({
      id: p.id,
      title: p.title,
      voteCount: p.voteCount,
      commentCount: p.commentCount,
      createdAt: p.createdAt.toISOString(),
      community: p.community,
    }));
  },

  /**
   * Get post by ID
   */
  async getPostById(id: string, userId?: string, userCompanyId?: string | null, isAdmin?: boolean) {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            company: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            companyId: true,
            iconUrl: true,
            isPrivate: true,
            memberCount: true,
            postCount: true,
          },
        },
        tags: {
          include: {
            tag: { select: { id: true, name: true, slug: true } },
          },
        },
        media: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!post || post.status !== 'ACTIVE') {
      throw new AppError(404, ERROR_CODES.POST_NOT_FOUND, 'Post not found.');
    }

    // Check access for company community posts (admin can access all)
    if (post.community.type === 'COMPANY' && post.community.companyId && !isAdmin) {
      if (!userCompanyId || post.community.companyId !== userCompanyId) {
        throw new AppError(
          403,
          ERROR_CODES.COMPANY_VERIFICATION_REQUIRED,
          'Only verified employees can access this post.'
        );
      }
    }

    // Increment view count
    await prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // Get user's vote and bookmark status
    let myVote: number | null = null;
    let isBookmarked = false;

    if (userId) {
      const [vote, bookmark] = await Promise.all([
        prisma.vote.findUnique({
          where: { userId_postId: { userId, postId: id } },
        }),
        prisma.bookmark.findUnique({
          where: { userId_postId: { userId, postId: id } },
        }),
      ]);

      myVote = vote?.value ?? null;
      isBookmarked = !!bookmark;
    }

    // Check if current user is the author
    const isAuthor = userId ? post.author.id === userId : false;

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      contentHtml: post.contentHtml,
      isAnonymous: post.isAnonymous,
      isPinned: post.isPinned,
      isLocked: post.isLocked,
      viewCount: post.viewCount + 1,
      voteCount: post.voteCount,
      commentCount: post.commentCount,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      author: {
        id: post.isAnonymous ? 'anonymous' : post.author.id,
        nickname: post.isAnonymous ? 'Anonymous' : post.author.nickname,
        isAnonymous: post.isAnonymous,
        company: post.author.company ? {
          id: post.author.company.id,
          name: post.author.company.name,
          slug: post.author.company.slug,
        } : null,
      },
      community: post.community,
      tags: post.tags.map((t) => t.tag),
      media: post.media.map((m) => ({
        id: m.id,
        type: m.type,
        url: m.url,
        caption: m.caption,
        order: m.order,
      })),
      myVote,
      isBookmarked,
      isAuthor,
    };
  },

  /**
   * Create a post
   */
  async createPost(input: CreatePostInput, authorId: string) {
    // Check daily post limit
    const limitSetting = await settingsService.getSetting('site.maxPostsPerDay');
    const maxPostsPerDay = limitSetting?.value ?? 10;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayPostCount = await prisma.post.count({
      where: {
        authorId,
        createdAt: { gte: todayStart },
      },
    });

    if (todayPostCount >= maxPostsPerDay) {
      throw new AppError(
        429,
        ERROR_CODES.DAILY_POST_LIMIT_EXCEEDED,
        `Daily post limit (${maxPostsPerDay}) exceeded. Please try again tomorrow.`
      );
    }

    // Verify community exists and user is a member
    const community = await prisma.community.findUnique({
      where: { id: input.communityId },
    });

    if (!community) {
      throw new AppError(404, ERROR_CODES.COMMUNITY_NOT_FOUND, 'Community not found.');
    }

    // Check membership for private communities
    if (community.isPrivate) {
      const membership = await prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId: input.communityId,
            userId: authorId,
          },
        },
      });

      if (!membership) {
        throw new AppError(403, ERROR_CODES.NOT_COMMUNITY_MEMBER, 'Please join the community first.');
      }
    }

    // Sanitize content
    const contentHtml = sanitizeHtml(input.content);

    // Create post with tags
    const post = await prisma.$transaction(async (tx) => {
      // Create post
      const newPost = await tx.post.create({
        data: {
          communityId: input.communityId,
          authorId,
          title: input.title,
          content: input.content,
          contentHtml,
          isAnonymous: input.isAnonymous ?? true,
        },
        include: {
          author: { select: { id: true, nickname: true } },
          community: {
            select: {
              id: true,
              name: true,
              slug: true,
              type: true,
              iconUrl: true,
              isPrivate: true,
              memberCount: true,
              postCount: true,
            },
          },
        },
      });

      // Handle tags
      if (input.tags && input.tags.length > 0) {
        for (const tagName of input.tags) {
          const slug = tagName.toLowerCase().replace(/\s+/g, '-');

          // Upsert tag
          const tag = await tx.tag.upsert({
            where: { slug },
            update: { postCount: { increment: 1 } },
            create: { name: tagName, slug, postCount: 1 },
          });

          // Create post-tag relation
          await tx.postTag.create({
            data: { postId: newPost.id, tagId: tag.id },
          });
        }
      }

      // Handle media URLs (images)
      if (input.mediaUrls && input.mediaUrls.length > 0) {
        await tx.postMedia.createMany({
          data: input.mediaUrls.map((url, index) => ({
            postId: newPost.id,
            type: 'IMAGE',
            url,
            order: index,
          })),
        });
      }

      // Handle video URL (YouTube/Vimeo embed)
      if (input.videoUrl) {
        const mediaCount = input.mediaUrls?.length || 0;
        await tx.postMedia.create({
          data: {
            postId: newPost.id,
            type: 'LINK',
            url: input.videoUrl,
            order: mediaCount,
          },
        });
      }

      // Update community post count
      await tx.community.update({
        where: { id: input.communityId },
        data: { postCount: { increment: 1 } },
      });

      return newPost;
    });

    return {
      id: post.id,
      title: post.title,
      createdAt: post.createdAt.toISOString(),
    };
  },

  /**
   * Update a post
   */
  async updatePost(id: string, input: UpdatePostInput, userId: string) {
    const post = await prisma.post.findUnique({ where: { id } });

    if (!post || post.status !== 'ACTIVE') {
      throw new AppError(404, ERROR_CODES.POST_NOT_FOUND, 'Post not found.');
    }

    if (post.authorId !== userId) {
      throw new AppError(403, ERROR_CODES.NOT_POST_AUTHOR, 'You can only edit your own posts.');
    }

    const updateData: Prisma.PostUpdateInput = {};

    if (input.title) updateData.title = input.title;
    if (input.content) {
      updateData.content = input.content;
      updateData.contentHtml = sanitizeHtml(input.content);
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: updateData,
    });

    return {
      id: updatedPost.id,
      title: updatedPost.title,
      updatedAt: updatedPost.updatedAt.toISOString(),
    };
  },

  /**
   * Delete a post (soft delete)
   */
  async deletePost(id: string, userId: string) {
    const post = await prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new AppError(404, ERROR_CODES.POST_NOT_FOUND, 'Post not found.');
    }

    if (post.authorId !== userId) {
      throw new AppError(403, ERROR_CODES.NOT_POST_AUTHOR, 'You can only delete your own posts.');
    }

    await prisma.$transaction([
      prisma.post.update({
        where: { id },
        data: { status: 'DELETED' },
      }),
      prisma.community.update({
        where: { id: post.communityId },
        data: { postCount: { decrement: 1 } },
      }),
    ]);

    return { message: 'Post has been deleted.' };
  },

  /**
   * Vote on a post
   */
  async votePost(postId: string, userId: string, input: VoteInput) {
    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post || post.status !== 'ACTIVE') {
      throw new AppError(404, ERROR_CODES.POST_NOT_FOUND, 'Post not found.');
    }

    const existingVote = await prisma.vote.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    await prisma.$transaction(async (tx) => {
      if (input.value === 0) {
        // Remove vote
        if (existingVote) {
          await tx.vote.delete({
            where: { id: existingVote.id },
          });
          await tx.post.update({
            where: { id: postId },
            data: { voteCount: { decrement: existingVote.value } },
          });
        }
      } else if (existingVote) {
        // Update existing vote
        if (existingVote.value !== input.value) {
          await tx.vote.update({
            where: { id: existingVote.id },
            data: { value: input.value },
          });
          // Adjust vote count: remove old vote and add new vote
          await tx.post.update({
            where: { id: postId },
            data: { voteCount: { increment: input.value - existingVote.value } },
          });
        }
      } else {
        // Create new vote
        await tx.vote.create({
          data: { userId, postId, value: input.value },
        });
        await tx.post.update({
          where: { id: postId },
          data: { voteCount: { increment: input.value } },
        });
      }
    });

    const updatedPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { voteCount: true },
    });

    return {
      voteCount: updatedPost?.voteCount ?? 0,
      myVote: input.value === 0 ? null : input.value,
    };
  },

  /**
   * Bookmark a post
   */
  async bookmarkPost(postId: string, userId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post || post.status !== 'ACTIVE') {
      throw new AppError(404, ERROR_CODES.POST_NOT_FOUND, 'Post not found.');
    }

    const existingBookmark = await prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existingBookmark) {
      await prisma.bookmark.delete({ where: { id: existingBookmark.id } });
      return { isBookmarked: false };
    }

    await prisma.bookmark.create({
      data: { userId, postId },
    });

    return { isBookmarked: true };
  },

  /**
   * Get user's bookmarked posts
   */
  async getBookmarkedPosts(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where: { userId },
        include: {
          post: {
            include: {
              author: { select: { id: true, nickname: true } },
              community: { select: { id: true, name: true, slug: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bookmark.count({ where: { userId } }),
    ]);

    const posts = bookmarks
      .filter((b) => b.post.status === 'ACTIVE')
      .map((b) => ({
        id: b.post.id,
        title: b.post.title,
        content: b.post.content.substring(0, 200) + (b.post.content.length > 200 ? '...' : ''),
        isAnonymous: b.post.isAnonymous,
        viewCount: b.post.viewCount,
        voteCount: b.post.voteCount,
        commentCount: b.post.commentCount,
        createdAt: b.post.createdAt.toISOString(),
        bookmarkedAt: b.createdAt.toISOString(),
        author: {
          id: b.post.isAnonymous ? 'anonymous' : b.post.author.id,
          nickname: b.post.isAnonymous ? 'Anonymous' : b.post.author.nickname,
          isAnonymous: b.post.isAnonymous,
        },
        community: b.post.community,
        isBookmarked: true,
      }));

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // ============== Admin Functions ==============

  /**
   * Get posts for admin
   */
  async getAdminList(params: { search?: string; status?: string; page: number; limit: number }) {
    const { search, status, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status && status !== 'all') {
      if (status === 'active') {
        where.status = 'ACTIVE';
      } else if (status === 'hidden') {
        where.status = 'HIDDEN';
      } else if (status === 'deleted') {
        where.status = 'DELETED';
      }
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        select: {
          id: true,
          title: true,
          content: true,
          status: true,
          voteCount: true,
          commentCount: true,
          viewCount: true,
          isAnonymous: true,
          isPinned: true,
          isLocked: true,
          createdAt: true,
          author: {
            select: { id: true, nickname: true },
          },
          community: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.post.count({ where }),
    ]);

    return {
      data: posts.map((p) => ({
        ...p,
        content: p.content.substring(0, 100) + (p.content.length > 100 ? '...' : ''),
        createdAt: p.createdAt.toISOString(),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get post stats for admin
   */
  async getAdminStats() {
    const [total, active, hidden, deleted, today] = await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { status: 'ACTIVE' } }),
      prisma.post.count({ where: { status: 'HIDDEN' } }),
      prisma.post.count({ where: { status: 'DELETED' } }),
      prisma.post.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    return { total, active, hidden, deleted, today };
  },

  /**
   * Update post status (admin)
   */
  async adminUpdateStatus(id: string, status: string) {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new AppError(404, ERROR_CODES.POST_NOT_FOUND, 'Post not found.');
    }

    return prisma.post.update({
      where: { id },
      data: { status: status as any },
    });
  },

  /**
   * Toggle pin status (admin)
   */
  async adminTogglePin(id: string) {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new AppError(404, ERROR_CODES.POST_NOT_FOUND, 'Post not found.');
    }

    return prisma.post.update({
      where: { id },
      data: { isPinned: !post.isPinned },
    });
  },

  /**
   * Delete post permanently (admin)
   */
  async adminDelete(id: string) {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new AppError(404, ERROR_CODES.POST_NOT_FOUND, 'Post not found.');
    }

    await prisma.$transaction([
      prisma.postTag.deleteMany({ where: { postId: id } }),
      prisma.postMedia.deleteMany({ where: { postId: id } }),
      prisma.comment.deleteMany({ where: { postId: id } }),
      prisma.vote.deleteMany({ where: { postId: id } }),
      prisma.bookmark.deleteMany({ where: { postId: id } }),
      prisma.post.delete({ where: { id } }),
      prisma.community.update({
        where: { id: post.communityId },
        data: { postCount: { decrement: 1 } },
      }),
    ]);

    return { success: true };
  },
};
