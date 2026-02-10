import { prisma, Prisma } from '@blind/database';
import { ERROR_CODES, CompanyQueryInput } from '@blind/shared';
import { AppError } from '../middleware/error.middleware';

export const companyService = {
  /**
   * Get list of companies with admin-controlled sorting
   */
  async getCompanies(query: CompanyQueryInput) {
    const { search, industry, size, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CompanyWhereInput = {
      isActive: true, // Only show active companies
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (industry) {
      where.industry = { contains: industry, mode: 'insensitive' };
    }

    if (size) {
      where.size = size;
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          industry: true,
          size: true,
          isVerified: true,
          avgRating: true,
          totalReviews: true,
          isPinned: true,
          isSponsored: true,
        },
        // Sort order: pinned first, then sponsored, then by displayOrder, then by reviews
        orderBy: [
          { isPinned: 'desc' },
          { isSponsored: 'desc' },
          { displayOrder: 'asc' },
          { totalReviews: 'desc' },
          { name: 'asc' },
        ],
        skip,
        take: limit,
      }),
      prisma.company.count({ where }),
    ]);

    return {
      companies,
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
   * Get featured companies (pinned + sponsored) for homepage
   */
  async getFeaturedCompanies(limit: number = 6) {
    const companies = await prisma.company.findMany({
      where: {
        isActive: true,
        OR: [{ isPinned: true }, { isSponsored: true }],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        industry: true,
        isVerified: true,
        avgRating: true,
        totalReviews: true,
        isPinned: true,
        isSponsored: true,
      },
      orderBy: [
        { isPinned: 'desc' },
        { isSponsored: 'desc' },
        { displayOrder: 'asc' },
      ],
      take: limit,
    });

    return companies;
  },

  /**
   * Get company by slug
   */
  async getCompanyBySlug(slug: string) {
    const company = await prisma.company.findUnique({
      where: { slug },
      include: {
        domains: {
          select: { domain: true, isPrimary: true },
        },
        communities: {
          select: {
            id: true,
            name: true,
            slug: true,
            memberCount: true,
            postCount: true,
          },
        },
        reviews: {
          where: { status: 'APPROVED' },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            overallRating: true,
            pros: true,
            cons: true,
            jobTitle: true,
            createdAt: true,
          },
        },
        _count: {
          select: { reviews: true, users: true },
        },
      },
    });

    if (!company) {
      throw new AppError(404, ERROR_CODES.COMPANY_NOT_FOUND, 'Company not found.');
    }

    return {
      id: company.id,
      name: company.name,
      slug: company.slug,
      logoUrl: company.logoUrl,
      industry: company.industry,
      size: company.size,
      description: company.description,
      website: company.website,
      isVerified: company.isVerified,
      avgRating: company.avgRating,
      totalReviews: company.totalReviews,
      avgSalary: company.avgSalary,
      avgWorkLife: company.avgWorkLife,
      avgCulture: company.avgCulture,
      avgManagement: company.avgManagement,
      employeeCount: company._count.users,
      communities: company.communities,
      recentReviews: company.reviews,
    };
  },

  /**
   * Search companies for autocomplete
   */
  async searchCompanies(query: string, limit: number = 10) {
    const companies = await prisma.company.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { domains: { some: { domain: { contains: query, mode: 'insensitive' } } } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        isVerified: true,
      },
      orderBy: { totalReviews: 'desc' },
      take: limit,
    });

    return companies;
  },

  /**
   * Bulk import companies from CSV/Excel data
   */
  async bulkImportCompanies(
    data: Array<{
      name: string;
      industry?: string;
      size?: string;
      description?: string;
      website?: string;
      domains?: string[]; // Email domains
    }>
  ) {
    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as Array<{ name: string; error: string }>,
    };

    for (const item of data) {
      try {
        // Generate slug from name
        const slug = item.name
          .toLowerCase()
          .replace(/[^a-z0-9가-힣]+/g, '-')
          .replace(/^-|-$/g, '');

        // Map size string to enum
        let companySize: 'STARTUP' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE' | undefined;
        if (item.size) {
          const sizeMap: Record<string, typeof companySize> = {
            'startup': 'STARTUP',
            '1-50': 'STARTUP',
            'small': 'SMALL',
            '51-200': 'SMALL',
            'medium': 'MEDIUM',
            '201-1000': 'MEDIUM',
            'large': 'LARGE',
            '1001-5000': 'LARGE',
            'enterprise': 'ENTERPRISE',
            '5000+': 'ENTERPRISE',
          };
          companySize = sizeMap[item.size.toLowerCase()];
        }

        // Upsert company
        const company = await prisma.company.upsert({
          where: { slug },
          update: {
            name: item.name,
            industry: item.industry,
            size: companySize,
            description: item.description,
            website: item.website,
          },
          create: {
            name: item.name,
            slug,
            industry: item.industry,
            size: companySize,
            description: item.description,
            website: item.website,
          },
        });

        // Add domains if provided
        if (item.domains && item.domains.length > 0) {
          for (const domain of item.domains) {
            await prisma.companyDomain.upsert({
              where: { domain: domain.toLowerCase() },
              update: { companyId: company.id },
              create: {
                companyId: company.id,
                domain: domain.toLowerCase(),
                isPrimary: item.domains.indexOf(domain) === 0,
              },
            });
          }
        }

        results.created++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          name: item.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  },

  /**
   * Update company display settings (admin only)
   */
  async updateCompanyDisplaySettings(
    companyId: string,
    settings: {
      displayOrder?: number;
      isPinned?: boolean;
      isSponsored?: boolean;
      isActive?: boolean;
    }
  ) {
    const company = await prisma.company.update({
      where: { id: companyId },
      data: settings,
      select: {
        id: true,
        name: true,
        slug: true,
        displayOrder: true,
        isPinned: true,
        isSponsored: true,
        isActive: true,
      },
    });

    return company;
  },

  /**
   * Bulk update display order for multiple companies
   */
  async bulkUpdateDisplayOrder(
    updates: Array<{ id: string; displayOrder: number }>
  ) {
    const results = await prisma.$transaction(
      updates.map((update) =>
        prisma.company.update({
          where: { id: update.id },
          data: { displayOrder: update.displayOrder },
          select: { id: true, name: true, displayOrder: true },
        })
      )
    );

    return results;
  },

  /**
   * Get all companies for admin management
   */
  async getCompaniesForAdmin(query: { search?: string; page: number; limit: number }) {
    const { search, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CompanyWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          industry: true,
          size: true,
          isVerified: true,
          isActive: true,
          isPinned: true,
          isSponsored: true,
          displayOrder: true,
          totalReviews: true,
          createdAt: true,
          _count: {
            select: {
              users: true,
              communities: true,
            },
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.company.count({ where }),
    ]);

    return {
      companies: companies.map((c) => ({
        ...c,
        userCount: c._count.users,
        communityCount: c._count.communities,
        _count: undefined,
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
   * Get company stats for admin
   */
  async getAdminStats() {
    const [total, active, verified, pinned, sponsored] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { isActive: true } }),
      prisma.company.count({ where: { isVerified: true } }),
      prisma.company.count({ where: { isPinned: true } }),
      prisma.company.count({ where: { isSponsored: true } }),
    ]);

    return { total, active, verified, pinned, sponsored };
  },

  /**
   * Create company (admin)
   */
  async createCompany(data: {
    name: string;
    industry?: string;
    size?: 'STARTUP' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';
    description?: string;
    website?: string;
    domains?: string[];
  }) {
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, '-')
      .replace(/^-|-$/g, '');

    const company = await prisma.company.create({
      data: {
        name: data.name,
        slug,
        industry: data.industry,
        size: data.size,
        description: data.description,
        website: data.website,
      },
    });

    if (data.domains && data.domains.length > 0) {
      for (let i = 0; i < data.domains.length; i++) {
        await prisma.companyDomain.create({
          data: {
            companyId: company.id,
            domain: data.domains[i].toLowerCase(),
            isPrimary: i === 0,
          },
        });
      }
    }

    return company;
  },

  /**
   * Update company (admin)
   */
  async updateCompany(
    id: string,
    data: {
      name?: string;
      industry?: string;
      size?: 'STARTUP' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';
      description?: string;
      website?: string;
      isVerified?: boolean;
      isActive?: boolean;
      isPinned?: boolean;
      isSponsored?: boolean;
    }
  ) {
    return prisma.company.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete company (admin)
   */
  async deleteCompany(id: string) {
    // First delete related domains
    await prisma.companyDomain.deleteMany({ where: { companyId: id } });
    // Then delete company
    return prisma.company.delete({ where: { id } });
  },

  /**
   * Get company domains
   */
  async getCompanyDomains(companyId: string) {
    const domains = await prisma.companyDomain.findMany({
      where: { companyId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
    return domains;
  },

  /**
   * Add domain to company
   */
  async addCompanyDomain(companyId: string, domain: string, isPrimary: boolean = false) {
    // Check if domain already exists
    const existing = await prisma.companyDomain.findUnique({
      where: { domain: domain.toLowerCase() },
    });

    if (existing) {
      throw new AppError(400, 'DOMAIN_EXISTS', 'This domain is already registered.');
    }

    // If setting as primary, unset other primary domains
    if (isPrimary) {
      await prisma.companyDomain.updateMany({
        where: { companyId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const newDomain = await prisma.companyDomain.create({
      data: {
        companyId,
        domain: domain.toLowerCase(),
        isPrimary,
      },
    });

    return newDomain;
  },

  /**
   * Update domain (set primary)
   */
  async updateCompanyDomain(domainId: string, isPrimary: boolean) {
    const domain = await prisma.companyDomain.findUnique({
      where: { id: domainId },
    });

    if (!domain) {
      throw new AppError(404, 'DOMAIN_NOT_FOUND', 'Domain not found.');
    }

    // If setting as primary, unset other primary domains
    if (isPrimary) {
      await prisma.companyDomain.updateMany({
        where: { companyId: domain.companyId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return prisma.companyDomain.update({
      where: { id: domainId },
      data: { isPrimary },
    });
  },

  /**
   * Delete domain
   */
  async deleteCompanyDomain(domainId: string) {
    return prisma.companyDomain.delete({
      where: { id: domainId },
    });
  },
};
