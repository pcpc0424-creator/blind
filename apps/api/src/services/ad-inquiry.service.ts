import { prisma, Prisma } from '@blind/database';
import { AppError } from '../middleware/error.middleware';

interface CreateAdInquiryInput {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  adType: 'BANNER' | 'SPONSORED' | 'NEWSLETTER' | 'PARTNERSHIP' | 'OTHER';
  budget?: string;
  duration?: string;
  message: string;
}

interface AdminUpdateInput {
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  adminNote?: string;
}

export const adInquiryService = {
  /**
   * Create a new ad inquiry
   */
  async createInquiry(input: CreateAdInquiryInput) {
    const inquiry = await prisma.adInquiry.create({
      data: {
        companyName: input.companyName,
        contactName: input.contactName,
        email: input.email,
        phone: input.phone,
        adType: input.adType,
        budget: input.budget,
        duration: input.duration,
        message: input.message,
      },
    });

    return {
      id: inquiry.id,
      message: 'Your inquiry has been submitted successfully. We will contact you soon.',
    };
  },

  /**
   * Get all inquiries (admin)
   */
  async getInquiries(query: {
    status?: string;
    page: number;
    limit: number;
  }) {
    const { status, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AdInquiryWhereInput = {};

    if (status && status !== 'all') {
      where.status = status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
    }

    const [inquiries, total] = await Promise.all([
      prisma.adInquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.adInquiry.count({ where }),
    ]);

    return {
      inquiries: inquiries.map((i) => ({
        id: i.id,
        companyName: i.companyName,
        contactName: i.contactName,
        email: i.email,
        phone: i.phone,
        adType: i.adType,
        budget: i.budget,
        duration: i.duration,
        message: i.message,
        status: i.status,
        adminNote: i.adminNote,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
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
   * Get inquiry by ID (admin)
   */
  async getInquiryById(id: string) {
    const inquiry = await prisma.adInquiry.findUnique({
      where: { id },
    });

    if (!inquiry) {
      throw new AppError(404, 'AD_INQUIRY_NOT_FOUND', 'Ad inquiry not found.');
    }

    return {
      id: inquiry.id,
      companyName: inquiry.companyName,
      contactName: inquiry.contactName,
      email: inquiry.email,
      phone: inquiry.phone,
      adType: inquiry.adType,
      budget: inquiry.budget,
      duration: inquiry.duration,
      message: inquiry.message,
      status: inquiry.status,
      adminNote: inquiry.adminNote,
      createdAt: inquiry.createdAt.toISOString(),
      updatedAt: inquiry.updatedAt.toISOString(),
    };
  },

  /**
   * Update inquiry status (admin)
   */
  async updateInquiry(id: string, input: AdminUpdateInput) {
    const inquiry = await prisma.adInquiry.findUnique({
      where: { id },
    });

    if (!inquiry) {
      throw new AppError(404, 'AD_INQUIRY_NOT_FOUND', 'Ad inquiry not found.');
    }

    const updated = await prisma.adInquiry.update({
      where: { id },
      data: {
        status: input.status,
        adminNote: input.adminNote,
      },
    });

    return {
      id: updated.id,
      status: updated.status,
      adminNote: updated.adminNote,
      message: 'Inquiry has been updated.',
    };
  },

  /**
   * Delete inquiry (admin)
   */
  async deleteInquiry(id: string) {
    const inquiry = await prisma.adInquiry.findUnique({
      where: { id },
    });

    if (!inquiry) {
      throw new AppError(404, 'AD_INQUIRY_NOT_FOUND', 'Ad inquiry not found.');
    }

    await prisma.adInquiry.delete({
      where: { id },
    });

    return { message: 'Inquiry has been deleted.' };
  },
};
