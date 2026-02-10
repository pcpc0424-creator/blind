import { prisma, ReviewStatus } from '@blind/database';
import { ERROR_CODES } from '@blind/shared';
import { AppError } from '../middleware/error.middleware';

interface CreateCompanyReviewInput {
  companyId: string;
  overallRating: number;
  salaryRating?: number;
  workLifeRating?: number;
  cultureRating?: number;
  managementRating?: number;
  title: string;
  pros: string;
  cons: string;
  advice?: string;
  jobTitle?: string;
  department?: string;
  isCurrentEmployee?: boolean;
  yearsAtCompany?: number;
}

interface CreatePublicServantReviewInput {
  categoryId: string;
  overallRating: number;
  workLifeRating?: number;
  salaryRating?: number;
  stabilityRating?: number;
  growthRating?: number;
  title: string;
  pros: string;
  cons: string;
  advice?: string;
  position?: string;
  yearsWorked?: number;
  isCurrentEmployee?: boolean;
}

export const reviewService = {
  // ============== Company Reviews ==============

  async getCompanyReviews(companyId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.companyReview.findMany({
        where: {
          companyId,
          status: 'APPROVED',
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.companyReview.count({
        where: {
          companyId,
          status: 'APPROVED',
        },
      }),
    ]);

    return {
      reviews: reviews.map((review) => ({
        id: review.id,
        overallRating: review.overallRating,
        salaryRating: review.salaryRating,
        workLifeRating: review.workLifeRating,
        cultureRating: review.cultureRating,
        managementRating: review.managementRating,
        title: review.title,
        pros: review.pros,
        cons: review.cons,
        advice: review.advice,
        jobTitle: review.jobTitle,
        department: review.department,
        isCurrentEmployee: review.isCurrentEmployee,
        yearsAtCompany: review.yearsAtCompany,
        isAnonymous: review.isAnonymous,
        author: review.isAnonymous ? null : { nickname: review.user.nickname },
        createdAt: review.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async createCompanyReview(userId: string, input: CreateCompanyReviewInput) {
    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: input.companyId },
    });

    if (!company) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Company not found.');
    }

    // Check if user already reviewed this company
    const existingReview = await prisma.companyReview.findUnique({
      where: {
        companyId_userId: {
          companyId: input.companyId,
          userId,
        },
      },
    });

    if (existingReview) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'You have already reviewed this company.');
    }

    // Validate ratings
    const ratings = [
      input.overallRating,
      input.salaryRating,
      input.workLifeRating,
      input.cultureRating,
      input.managementRating,
    ].filter((r) => r !== undefined);

    for (const rating of ratings) {
      if (rating < 1 || rating > 5) {
        throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Ratings must be between 1 and 5.');
      }
    }

    // Create review
    const review = await prisma.companyReview.create({
      data: {
        companyId: input.companyId,
        userId,
        overallRating: input.overallRating,
        salaryRating: input.salaryRating,
        workLifeRating: input.workLifeRating,
        cultureRating: input.cultureRating,
        managementRating: input.managementRating,
        title: input.title,
        pros: input.pros,
        cons: input.cons,
        advice: input.advice,
        jobTitle: input.jobTitle,
        department: input.department,
        isCurrentEmployee: input.isCurrentEmployee ?? true,
        yearsAtCompany: input.yearsAtCompany,
        status: 'APPROVED', // Auto-approve for now
      },
    });

    // Update company aggregate ratings
    await this.updateCompanyRatings(input.companyId);

    return review;
  },

  async updateCompanyRatings(companyId: string) {
    const reviews = await prisma.companyReview.findMany({
      where: {
        companyId,
        status: 'APPROVED',
      },
      select: {
        overallRating: true,
        salaryRating: true,
        workLifeRating: true,
        cultureRating: true,
        managementRating: true,
      },
    });

    if (reviews.length === 0) return;

    const avg = (arr: (number | null)[]) => {
      const valid = arr.filter((n): n is number => n !== null);
      return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
    };

    await prisma.company.update({
      where: { id: companyId },
      data: {
        avgRating: avg(reviews.map((r) => r.overallRating)),
        totalReviews: reviews.length,
        avgSalary: avg(reviews.map((r) => r.salaryRating)),
        avgWorkLife: avg(reviews.map((r) => r.workLifeRating)),
        avgCulture: avg(reviews.map((r) => r.cultureRating)),
        avgManagement: avg(reviews.map((r) => r.managementRating)),
      },
    });
  },

  async deleteCompanyReview(reviewId: string, userId: string, isAdmin: boolean) {
    const review = await prisma.companyReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Review not found.');
    }

    if (review.userId !== userId && !isAdmin) {
      throw new AppError(403, ERROR_CODES.FORBIDDEN, 'You can only delete your own reviews.');
    }

    await prisma.companyReview.delete({
      where: { id: reviewId },
    });

    // Update company aggregate ratings
    await this.updateCompanyRatings(review.companyId);

    return { message: 'Review deleted successfully.' };
  },

  // ============== Public Servant Reviews ==============

  async getPublicServantReviews(categoryId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.publicServantReview.findMany({
        where: {
          categoryId,
          status: 'APPROVED',
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.publicServantReview.count({
        where: {
          categoryId,
          status: 'APPROVED',
        },
      }),
    ]);

    return {
      reviews: reviews.map((review) => ({
        id: review.id,
        overallRating: review.overallRating,
        workLifeRating: review.workLifeRating,
        salaryRating: review.salaryRating,
        stabilityRating: review.stabilityRating,
        growthRating: review.growthRating,
        title: review.title,
        pros: review.pros,
        cons: review.cons,
        advice: review.advice,
        position: review.position,
        yearsWorked: review.yearsWorked,
        isCurrentEmployee: review.isCurrentEmployee,
        isAnonymous: review.isAnonymous,
        author: review.isAnonymous ? null : { nickname: review.user.nickname },
        createdAt: review.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async createPublicServantReview(userId: string, input: CreatePublicServantReviewInput) {
    // Check if category exists
    const category = await prisma.publicServantCategory.findUnique({
      where: { id: input.categoryId },
    });

    if (!category) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Category not found.');
    }

    // Check if user already reviewed this category
    const existingReview = await prisma.publicServantReview.findUnique({
      where: {
        categoryId_userId: {
          categoryId: input.categoryId,
          userId,
        },
      },
    });

    if (existingReview) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'You have already reviewed this category.');
    }

    // Create review
    const review = await prisma.publicServantReview.create({
      data: {
        categoryId: input.categoryId,
        userId,
        overallRating: input.overallRating,
        workLifeRating: input.workLifeRating,
        salaryRating: input.salaryRating,
        stabilityRating: input.stabilityRating,
        growthRating: input.growthRating,
        title: input.title,
        pros: input.pros,
        cons: input.cons,
        advice: input.advice,
        position: input.position,
        yearsWorked: input.yearsWorked,
        isCurrentEmployee: input.isCurrentEmployee ?? true,
        status: 'APPROVED', // Auto-approve for now
      },
    });

    // Update category aggregate ratings
    await this.updatePublicServantRatings(input.categoryId);

    return review;
  },

  async updatePublicServantRatings(categoryId: string) {
    const reviews = await prisma.publicServantReview.findMany({
      where: {
        categoryId,
        status: 'APPROVED',
      },
      select: {
        overallRating: true,
        workLifeRating: true,
        salaryRating: true,
        stabilityRating: true,
        growthRating: true,
      },
    });

    if (reviews.length === 0) return;

    const avg = (arr: (number | null)[]) => {
      const valid = arr.filter((n): n is number => n !== null);
      return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
    };

    await prisma.publicServantCategory.update({
      where: { id: categoryId },
      data: {
        avgRating: avg(reviews.map((r) => r.overallRating)),
        totalReviews: reviews.length,
        avgWorkLife: avg(reviews.map((r) => r.workLifeRating)),
        avgSalary: avg(reviews.map((r) => r.salaryRating)),
        avgStability: avg(reviews.map((r) => r.stabilityRating)),
        avgGrowth: avg(reviews.map((r) => r.growthRating)),
      },
    });
  },

  async deletePublicServantReview(reviewId: string, userId: string, isAdmin: boolean) {
    const review = await prisma.publicServantReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Review not found.');
    }

    if (review.userId !== userId && !isAdmin) {
      throw new AppError(403, ERROR_CODES.FORBIDDEN, 'You can only delete your own reviews.');
    }

    await prisma.publicServantReview.delete({
      where: { id: reviewId },
    });

    // Update category aggregate ratings
    await this.updatePublicServantRatings(review.categoryId);

    return { message: 'Review deleted successfully.' };
  },

  // ============== Admin Functions ==============

  async adminGetReviews(type: 'company' | 'public-servant', page = 1, limit = 20, status?: ReviewStatus) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    if (type === 'company') {
      const [reviews, total] = await Promise.all([
        prisma.companyReview.findMany({
          where,
          include: {
            company: { select: { id: true, name: true, slug: true } },
            user: { select: { id: true, nickname: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.companyReview.count({ where }),
      ]);

      return { reviews, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    } else {
      const [reviews, total] = await Promise.all([
        prisma.publicServantReview.findMany({
          where,
          include: {
            category: { select: { id: true, name: true, slug: true } },
            user: { select: { id: true, nickname: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.publicServantReview.count({ where }),
      ]);

      return { reviews, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }
  },

  async adminUpdateReviewStatus(type: 'company' | 'public-servant', reviewId: string, status: ReviewStatus) {
    if (type === 'company') {
      const review = await prisma.companyReview.update({
        where: { id: reviewId },
        data: { status },
      });
      await this.updateCompanyRatings(review.companyId);
      return review;
    } else {
      const review = await prisma.publicServantReview.update({
        where: { id: reviewId },
        data: { status },
      });
      await this.updatePublicServantRatings(review.categoryId);
      return review;
    }
  },
};
