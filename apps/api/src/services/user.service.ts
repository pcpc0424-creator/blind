import { prisma } from '@blind/database';
import { UserRole, UserStatus, Prisma } from '@prisma/client';

export interface AdminUserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  companyVerified?: boolean;
}

export interface AdminUserListResult {
  data: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const userService = {
  // Admin user list
  async getAdminList(params: AdminUserListParams): Promise<AdminUserListResult> {
    const { page = 1, limit = 20, search, role, status, companyVerified } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.nickname = { contains: search, mode: 'insensitive' };
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (companyVerified !== undefined) {
      where.companyVerified = companyVerified;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          nickname: true,
          role: true,
          status: true,
          companyVerified: true,
          createdAt: true,
          lastActiveAt: true,
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              posts: true,
              comments: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users.map((user) => ({
        ...user,
        postCount: user._count.posts,
        commentCount: user._count.comments,
        _count: undefined,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // Get user by ID
  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nickname: true,
        role: true,
        status: true,
        companyVerified: true,
        createdAt: true,
        lastActiveAt: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            posts: true,
            comments: true,
            communityMemberships: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      ...user,
      postCount: user._count.posts,
      commentCount: user._count.comments,
      communityCount: user._count.communityMemberships,
      _count: undefined,
    };
  },

  // Update user role
  async updateRole(id: string, role: UserRole) {
    return prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        nickname: true,
        role: true,
      },
    });
  },

  // Update user status (suspend/activate)
  async updateStatus(id: string, status: UserStatus) {
    return prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        nickname: true,
        status: true,
      },
    });
  },

  // Suspend user
  async suspendUser(id: string) {
    return this.updateStatus(id, 'SUSPENDED');
  },

  // Activate user
  async activateUser(id: string) {
    return this.updateStatus(id, 'ACTIVE');
  },

  // Delete user (soft delete)
  async deleteUser(id: string) {
    return prisma.user.update({
      where: { id },
      data: { status: 'DELETED' },
    });
  },

  // Statistics
  async getStats() {
    const [total, active, suspended, admins, companyVerified] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { companyVerified: true } }),
    ]);

    return {
      total,
      active,
      suspended,
      admins,
      companyVerified,
    };
  },
};
