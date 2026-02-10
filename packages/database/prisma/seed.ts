import { PrismaClient, CommunityType, CompanySize, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ============================================
  // TEST USERS (3 types for demo)
  // ============================================
  const hashedPassword = await bcrypt.hash('test1234', 10);

  // 1. Admin user
  const adminUser = await prisma.user.upsert({
    where: { nickname: 'admin_demo' },
    update: {},
    create: {
      nickname: 'admin_demo',
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
      companyVerified: false,
    },
  });

  // 2. General user (no company)
  const generalUser = await prisma.user.upsert({
    where: { nickname: 'general_user' },
    update: {},
    create: {
      nickname: 'general_user',
      passwordHash: hashedPassword,
      role: UserRole.USER,
      companyVerified: false,
    },
  });

  console.log(`✅ Created test users: admin_demo, general_user`);

  // ============================================
  // COMPANIES
  // ============================================
  const companies = await Promise.all([
    prisma.company.upsert({
      where: { slug: 'samsung-electronics' },
      update: { isPinned: true, displayOrder: 1 },
      create: {
        name: '삼성전자',
        slug: 'samsung-electronics',
        industry: 'IT/전자',
        size: CompanySize.ENTERPRISE,
        description: '대한민국 대표 전자기업',
        website: 'https://www.samsung.com',
        isVerified: true,
        isPinned: true,
        displayOrder: 1,
        avgRating: 4.2,
        totalReviews: 156,
        domains: {
          create: [
            { domain: 'samsung.com', isPrimary: true },
          ],
        },
      },
    }),
    prisma.company.upsert({
      where: { slug: 'naver' },
      update: { isSponsored: true, displayOrder: 2 },
      create: {
        name: '네이버',
        slug: 'naver',
        industry: 'IT/인터넷',
        size: CompanySize.LARGE,
        description: '대한민국 대표 인터넷 기업',
        website: 'https://www.navercorp.com',
        isVerified: true,
        isSponsored: true,
        displayOrder: 2,
        avgRating: 4.5,
        totalReviews: 203,
        domains: {
          create: [{ domain: 'navercorp.com', isPrimary: true }],
        },
      },
    }),
    prisma.company.upsert({
      where: { slug: 'kakao' },
      update: { displayOrder: 3 },
      create: {
        name: '카카오',
        slug: 'kakao',
        industry: 'IT/인터넷',
        size: CompanySize.LARGE,
        description: '대한민국 대표 플랫폼 기업',
        website: 'https://www.kakaocorp.com',
        isVerified: true,
        displayOrder: 3,
        avgRating: 4.3,
        totalReviews: 178,
        domains: {
          create: [{ domain: 'kakaocorp.com', isPrimary: true }],
        },
      },
    }),
    prisma.company.upsert({
      where: { slug: 'lg-electronics' },
      update: { displayOrder: 4 },
      create: {
        name: 'LG전자',
        slug: 'lg-electronics',
        industry: 'IT/전자',
        size: CompanySize.ENTERPRISE,
        description: '대한민국 대표 전자기업',
        website: 'https://www.lg.com',
        isVerified: true,
        displayOrder: 4,
        avgRating: 3.9,
        totalReviews: 134,
        domains: {
          create: [{ domain: 'lge.com', isPrimary: true }],
        },
      },
    }),
    prisma.company.upsert({
      where: { slug: 'coupang' },
      update: { displayOrder: 5 },
      create: {
        name: '쿠팡',
        slug: 'coupang',
        industry: '커머스',
        size: CompanySize.LARGE,
        description: '대한민국 대표 이커머스 기업',
        website: 'https://www.coupang.com',
        isVerified: true,
        displayOrder: 5,
        avgRating: 3.5,
        totalReviews: 245,
        domains: {
          create: [{ domain: 'coupang.com', isPrimary: true }],
        },
      },
    }),
    prisma.company.upsert({
      where: { slug: 'hyundai-motor' },
      update: { displayOrder: 6 },
      create: {
        name: '현대자동차',
        slug: 'hyundai-motor',
        industry: '자동차',
        size: CompanySize.ENTERPRISE,
        description: '글로벌 자동차 제조사',
        website: 'https://www.hyundai.com',
        isVerified: true,
        displayOrder: 6,
        avgRating: 4.0,
        totalReviews: 112,
      },
    }),
    prisma.company.upsert({
      where: { slug: 'sk-hynix' },
      update: { displayOrder: 7 },
      create: {
        name: 'SK하이닉스',
        slug: 'sk-hynix',
        industry: 'IT/반도체',
        size: CompanySize.ENTERPRISE,
        description: '글로벌 반도체 기업',
        website: 'https://www.skhynix.com',
        isVerified: true,
        displayOrder: 7,
        avgRating: 4.1,
        totalReviews: 89,
      },
    }),
    prisma.company.upsert({
      where: { slug: 'toss' },
      update: { displayOrder: 8 },
      create: {
        name: '토스',
        slug: 'toss',
        industry: '핀테크',
        size: CompanySize.MEDIUM,
        description: '금융의 모든 것, 토스에서',
        website: 'https://toss.im',
        isVerified: true,
        displayOrder: 8,
        avgRating: 4.6,
        totalReviews: 67,
      },
    }),
  ]);

  // 3. Company user (Samsung employee)
  const companyUser = await prisma.user.upsert({
    where: { nickname: 'samsung_user' },
    update: {},
    create: {
      nickname: 'samsung_user',
      passwordHash: hashedPassword,
      role: UserRole.USER,
      companyId: companies[0].id, // Samsung
      companyVerified: true,
    },
  });

  console.log(`✅ Created company user: samsung_user`);
  console.log(`✅ Created ${companies.length} companies`);

  // ============================================
  // GENERAL COMMUNITIES
  // ============================================
  const generalCommunities = await Promise.all([
    prisma.community.upsert({
      where: { slug: 'tech-talk' },
      update: { memberCount: 1523, postCount: 342 },
      create: {
        name: '개발자 라운지',
        slug: 'tech-talk',
        description: '개발자들의 자유로운 이야기',
        type: CommunityType.JOB,
        isPrivate: false,
        memberCount: 1523,
        postCount: 342,
      },
    }),
    prisma.community.upsert({
      where: { slug: 'career' },
      update: { memberCount: 2341, postCount: 567 },
      create: {
        name: '커리어',
        slug: 'career',
        description: '이직, 연봉 협상, 커리어 고민',
        type: CommunityType.GENERAL,
        isPrivate: false,
        memberCount: 2341,
        postCount: 567,
      },
    }),
    prisma.community.upsert({
      where: { slug: 'free-talk' },
      update: { memberCount: 5678, postCount: 1234 },
      create: {
        name: '자유게시판',
        slug: 'free-talk',
        description: '자유롭게 이야기하세요',
        type: CommunityType.GENERAL,
        isPrivate: false,
        memberCount: 5678,
        postCount: 1234,
      },
    }),
    prisma.community.upsert({
      where: { slug: 'stock' },
      update: { memberCount: 3456, postCount: 789 },
      create: {
        name: '주식/투자',
        slug: 'stock',
        description: '투자 정보 공유',
        type: CommunityType.GENERAL,
        isPrivate: false,
        memberCount: 3456,
        postCount: 789,
      },
    }),
    prisma.community.upsert({
      where: { slug: 'it-industry' },
      update: { memberCount: 4521, postCount: 923 },
      create: {
        name: 'IT 업계',
        slug: 'it-industry',
        description: 'IT 업계 소식과 이야기',
        type: CommunityType.INDUSTRY,
        isPrivate: false,
        memberCount: 4521,
        postCount: 923,
      },
    }),
  ]);

  console.log(`✅ Created ${generalCommunities.length} general communities`);

  // ============================================
  // COMPANY COMMUNITIES
  // ============================================
  for (const company of companies) {
    await prisma.community.upsert({
      where: { slug: `company-${company.slug}` },
      update: { memberCount: Math.floor(Math.random() * 500) + 100, postCount: Math.floor(Math.random() * 200) + 50 },
      create: {
        name: company.name,
        slug: `company-${company.slug}`,
        description: `${company.name} 직원 전용 커뮤니티`,
        type: CommunityType.COMPANY,
        companyId: company.id,
        isPrivate: true,
        memberCount: Math.floor(Math.random() * 500) + 100,
        postCount: Math.floor(Math.random() * 200) + 50,
      },
    });
  }

  console.log(`✅ Created ${companies.length} company communities`);

  // ============================================
  // PUBLIC SERVANT CATEGORIES (with hierarchy)
  // ============================================
  const publicServantCategories = await Promise.all([
    prisma.publicServantCategory.upsert({
      where: { slug: 'police' },
      update: { avgRating: 3.8, totalReviews: 45 },
      create: {
        name: '경찰',
        slug: 'police',
        description: '경찰공무원 커뮤니티',
        avgRating: 3.8,
        totalReviews: 45,
      },
    }),
    prisma.publicServantCategory.upsert({
      where: { slug: 'firefighter' },
      update: { avgRating: 4.2, totalReviews: 32 },
      create: {
        name: '소방관',
        slug: 'firefighter',
        description: '소방공무원 커뮤니티',
        avgRating: 4.2,
        totalReviews: 32,
      },
    }),
    prisma.publicServantCategory.upsert({
      where: { slug: 'teacher' },
      update: { avgRating: 3.5, totalReviews: 78 },
      create: {
        name: '교사',
        slug: 'teacher',
        description: '교육공무원 커뮤니티',
        avgRating: 3.5,
        totalReviews: 78,
      },
    }),
    prisma.publicServantCategory.upsert({
      where: { slug: 'military' },
      update: { avgRating: 3.2, totalReviews: 56 },
      create: {
        name: '군인',
        slug: 'military',
        description: '군무원/직업군인 커뮤니티',
        avgRating: 3.2,
        totalReviews: 56,
      },
    }),
    prisma.publicServantCategory.upsert({
      where: { slug: 'government-admin' },
      update: { avgRating: 3.9, totalReviews: 123 },
      create: {
        name: '행정직',
        slug: 'government-admin',
        description: '행정공무원 커뮤니티',
        avgRating: 3.9,
        totalReviews: 123,
      },
    }),
    prisma.publicServantCategory.upsert({
      where: { slug: 'healthcare' },
      update: { avgRating: 3.7, totalReviews: 67 },
      create: {
        name: '보건의료',
        slug: 'healthcare',
        description: '보건의료직 공무원 커뮤니티',
        avgRating: 3.7,
        totalReviews: 67,
      },
    }),
  ]);

  console.log(`✅ Created ${publicServantCategories.length} public servant categories`);

  // Create public servant communities
  for (const category of publicServantCategories) {
    await prisma.community.upsert({
      where: { slug: `public-servant-${category.slug}` },
      update: { memberCount: Math.floor(Math.random() * 300) + 50, postCount: Math.floor(Math.random() * 100) + 20 },
      create: {
        name: `${category.name} 커뮤니티`,
        slug: `public-servant-${category.slug}`,
        description: `${category.name} 공무원을 위한 커뮤니티`,
        type: CommunityType.PUBLIC_SERVANT,
        publicServantCategoryId: category.id,
        isPrivate: false,
        memberCount: Math.floor(Math.random() * 300) + 50,
        postCount: Math.floor(Math.random() * 100) + 20,
      },
    });
  }

  // ============================================
  // INTEREST CATEGORIES (with hierarchy)
  // ============================================
  // Parent categories
  const gamingCategory = await prisma.interestCategory.upsert({
    where: { slug: 'gaming' },
    update: { displayOrder: 1 },
    create: {
      name: '게이밍',
      slug: 'gaming',
      description: '게임, e스포츠, 게임문화',
      color: '#6366f1',
      displayOrder: 1,
    },
  });

  // Gaming subcategories
  await Promise.all([
    prisma.interestCategory.upsert({
      where: { slug: 'gaming-pubg' },
      update: { parentId: gamingCategory.id },
      create: {
        name: '배틀그라운드',
        slug: 'gaming-pubg',
        description: 'PUBG 게이머 모임',
        color: '#f59e0b',
        parentId: gamingCategory.id,
        displayOrder: 1,
      },
    }),
    prisma.interestCategory.upsert({
      where: { slug: 'gaming-lol' },
      update: { parentId: gamingCategory.id },
      create: {
        name: '리그오브레전드',
        slug: 'gaming-lol',
        description: 'LoL 게이머 모임',
        color: '#0ea5e9',
        parentId: gamingCategory.id,
        displayOrder: 2,
      },
    }),
    prisma.interestCategory.upsert({
      where: { slug: 'gaming-valorant' },
      update: { parentId: gamingCategory.id },
      create: {
        name: '발로란트',
        slug: 'gaming-valorant',
        description: 'Valorant 게이머 모임',
        color: '#ef4444',
        parentId: gamingCategory.id,
        displayOrder: 3,
      },
    }),
  ]);

  const investmentCategory = await prisma.interestCategory.upsert({
    where: { slug: 'investment' },
    update: { displayOrder: 2 },
    create: {
      name: '투자',
      slug: 'investment',
      description: '주식, 코인, 부동산 투자 정보',
      color: '#10b981',
      displayOrder: 2,
    },
  });

  // Investment subcategories
  await Promise.all([
    prisma.interestCategory.upsert({
      where: { slug: 'investment-stock' },
      update: { parentId: investmentCategory.id },
      create: {
        name: '주식',
        slug: 'investment-stock',
        description: '국내외 주식 투자',
        color: '#22c55e',
        parentId: investmentCategory.id,
        displayOrder: 1,
      },
    }),
    prisma.interestCategory.upsert({
      where: { slug: 'investment-crypto' },
      update: { parentId: investmentCategory.id },
      create: {
        name: '코인',
        slug: 'investment-crypto',
        description: '암호화폐 투자',
        color: '#f59e0b',
        parentId: investmentCategory.id,
        displayOrder: 2,
      },
    }),
    prisma.interestCategory.upsert({
      where: { slug: 'investment-realestate' },
      update: { parentId: investmentCategory.id },
      create: {
        name: '부동산',
        slug: 'investment-realestate',
        description: '부동산 투자',
        color: '#8b5cf6',
        parentId: investmentCategory.id,
        displayOrder: 3,
      },
    }),
  ]);

  const techCategory = await prisma.interestCategory.upsert({
    where: { slug: 'tech' },
    update: { displayOrder: 3 },
    create: {
      name: 'Tech & 개발',
      slug: 'tech',
      description: '기술 트렌드, 프로그래밍, 개발 이야기',
      color: '#8b5cf6',
      displayOrder: 3,
    },
  });

  const lifestyleCategory = await prisma.interestCategory.upsert({
    where: { slug: 'lifestyle' },
    update: { displayOrder: 4 },
    create: {
      name: '라이프스타일',
      slug: 'lifestyle',
      description: '건강, 취미, 일상 이야기',
      color: '#ec4899',
      displayOrder: 4,
    },
  });

  console.log(`✅ Created interest categories with subcategories`);

  // Create interest communities
  const interestCategories = [gamingCategory, investmentCategory, techCategory, lifestyleCategory];
  for (const category of interestCategories) {
    await prisma.community.upsert({
      where: { slug: `interest-${category.slug}` },
      update: { memberCount: Math.floor(Math.random() * 1000) + 200, postCount: Math.floor(Math.random() * 300) + 50 },
      create: {
        name: category.name,
        slug: `interest-${category.slug}`,
        description: category.description || '',
        type: CommunityType.INTEREST,
        interestCategoryId: category.id,
        isPrivate: false,
        memberCount: Math.floor(Math.random() * 1000) + 200,
        postCount: Math.floor(Math.random() * 300) + 50,
      },
    });
  }

  // ============================================
  // DEMO POSTS (50-100개 for presentation)
  // ============================================
  const freeTalkCommunity = await prisma.community.findUnique({ where: { slug: 'free-talk' } });
  const careerCommunity = await prisma.community.findUnique({ where: { slug: 'career' } });
  const techTalkCommunity = await prisma.community.findUnique({ where: { slug: 'tech-talk' } });
  const stockCommunity = await prisma.community.findUnique({ where: { slug: 'stock' } });
  const itIndustryCommunity = await prisma.community.findUnique({ where: { slug: 'it-industry' } });
  const samsungCommunity = await prisma.community.findFirst({ where: { slug: 'company-samsung-electronics' } });

  // 삼성전자 추가 사용자들 생성
  const samsungUser2 = await prisma.user.upsert({
    where: { nickname: 'samsung_dev' },
    update: {},
    create: {
      nickname: 'samsung_dev',
      passwordHash: hashedPassword,
      role: UserRole.USER,
      companyId: companies[0].id,
      companyVerified: true,
    },
  });

  const naverUser = await prisma.user.upsert({
    where: { nickname: 'naver_user' },
    update: {},
    create: {
      nickname: 'naver_user',
      passwordHash: hashedPassword,
      role: UserRole.USER,
      companyId: companies[1].id, // Naver
      companyVerified: true,
    },
  });

  const kakaoUser = await prisma.user.upsert({
    where: { nickname: 'kakao_user' },
    update: {},
    create: {
      nickname: 'kakao_user',
      passwordHash: hashedPassword,
      role: UserRole.USER,
      companyId: companies[2].id, // Kakao
      companyVerified: true,
    },
  });

  console.log(`✅ Created additional company users: samsung_dev, naver_user, kakao_user`);

  const allUsers = [generalUser, companyUser, samsungUser2, naverUser, kakaoUser];

  // 다양한 게시글 템플릿
  const freeTalkPosts = [
    { title: '오늘 회식인데 빠지고 싶은 마음', content: '다들 회식 어떻게 생각하세요? 요즘은 MZ세대라 회식 참여율이 많이 낮아졌다던데... 저희 팀은 아직도 거의 필참 분위기네요.' },
    { title: '재택근무 복장 어디까지 괜찮을까요', content: '화상회의 할 때 상의만 입는 분들 많으신가요? ㅋㅋ 저는 편하게 있다가 급하게 회의 들어갈 때 당황한 적이 있어서...' },
    { title: '점심 뭐 먹을지 고민되네요', content: '오늘 회사 근처에서 뭐 먹을지 고민입니다. 추천 부탁드려요!' },
    { title: '퇴근 후 뭐하세요?', content: '다들 퇴근하고 뭐하시나요? 저는 요즘 넷플릭스 정주행 중인데 추천작 있으면 알려주세요.' },
    { title: '회사 근처 맛집 추천', content: '강남역 근처 점심 맛집 추천해주세요. 가격대는 만원 내외로요.' },
    { title: '주말에 뭐하세요?', content: '이번 주말 날씨 좋다던데 다들 어디 가세요? 저는 한강 갈까 고민 중.' },
    { title: '커피 vs 차', content: '사무실에서 커피파 vs 차파 뭐가 더 많으신가요? 저는 오후에는 차 마시는 편인데...' },
    { title: '야근 수당 어떻게 되나요?', content: '다들 야근 수당 제대로 받으시나요? 저희는 포괄임금제라...' },
    { title: '회사 복지 어떤 게 좋으세요?', content: '이직 고려 중인데 복지 중에 제일 중요하게 보시는 게 뭔가요?' },
    { title: '사내 동호회 활동하시나요?', content: '사내 동호회 있으신 분들 뭐하세요? 저희 회사는 등산, 축구, 독서 동호회 있는데...' },
    { title: '출퇴근 시간 얼마나 걸리세요?', content: '저는 편도 1시간 30분인데... 이사를 해야하나 고민이네요.' },
    { title: '점심시간 1시간 어떻게 쓰세요?', content: '밥 먹고 남은 시간에 뭐하세요? 저는 산책하거나 낮잠 자요.' },
    { title: '연차 소진 어떻게 하세요?', content: '연말인데 연차가 10개나 남았어요... 다들 어떻게 소진하시나요?' },
  ];

  const careerPosts = [
    { title: '대기업 3년차, 스타트업 이직 고민', content: '안정적인 대기업 생활 중인데 성장이 멈춘 느낌입니다. 스타트업으로 이직하신 분들 경험담 공유해주세요.' },
    { title: '연봉 협상 팁 공유합니다', content: '이번에 이직하면서 연봉 협상에 성공한 경험을 공유합니다. 1. 시장 조사를 철저히 2. 자신의 성과를 수치화 3. 협상 타이밍이 중요' },
    { title: '면접에서 자주 받는 질문 정리', content: '최근 면접 경험을 바탕으로 자주 받는 질문들을 정리해봤습니다. 도움이 되셨으면 좋겠네요.' },
    { title: '이직할 때 레퍼런스 체크', content: '이직 시 레퍼런스 체크 경험 있으신 분? 전 직장 상사한테 연락 가나요?' },
    { title: '연봉 1억 넘기신 분들 직군이 뭔가요?', content: '30대에 연봉 1억 넘기신 분들 어떤 직군이신가요? 개발자? PM? 영업?' },
    { title: '대리 3년차 연봉 어느 정도가 적당할까요?', content: 'IT 업계 대리 3년차인데 연봉 수준이 궁금합니다.' },
    { title: '해외 취업 경험담 공유', content: '싱가포르에서 3년 일하다가 돌아왔습니다. 궁금한 점 있으시면 물어보세요.' },
    { title: '퇴사 통보 언제 하시나요?', content: '이직 확정되면 퇴사 통보 언제 하시나요? 한 달 전? 2주 전?' },
    { title: '경력직 자기소개서 어떻게 쓰나요?', content: '신입 때랑 다르게 뭘 강조해야 할지 모르겠어요.' },
    { title: '이직 시 연봉 인상률 어느 정도?', content: '보통 이직하면 연봉 몇 % 올려 받으시나요?' },
    { title: '스카우트 제의 받으면 어떻게 하세요?', content: '링크드인으로 연락 왔는데 어떻게 대응해야 할지...' },
    { title: '퇴직금 중간정산 하셨나요?', content: '집 사려고 퇴직금 중간정산 고민 중인데 경험담 공유 부탁드려요.' },
  ];

  const techPosts = [
    { title: 'ChatGPT 업무에 어떻게 활용하세요?', content: 'AI 툴을 업무에 활용하는 분들 어떤 식으로 쓰시나요? 저는 코드 리뷰랑 문서 작성에 주로 활용하고 있습니다.' },
    { title: '주니어 개발자 포트폴리오 조언 부탁드립니다', content: '이직 준비 중인 2년차 개발자입니다. 포트폴리오에 어떤 프로젝트를 넣으면 좋을까요?' },
    { title: '요즘 핫한 기술 스택 뭔가요?', content: 'Next.js, Rust, Go 등등 요즘 뜨는 기술들이 많은데 어떤 걸 공부하면 좋을지 조언 부탁드립니다.' },
    { title: 'React vs Vue 뭐가 좋나요?', content: '신규 프로젝트 시작하는데 프레임워크 선택 고민입니다.' },
    { title: '코드 리뷰 문화 있으신가요?', content: '저희 팀은 PR마다 리뷰 필수인데 다들 어떠세요?' },
    { title: '개발자 번아웃 어떻게 극복하세요?', content: '요즘 코딩이 너무 하기 싫어요... 번아웃인 것 같은데 조언 부탁드려요.' },
    { title: 'TypeScript 도입 후기', content: 'JS에서 TS로 마이그레이션 했는데 처음엔 힘들었지만 지금은 만족합니다.' },
    { title: '클라우드 자격증 추천', content: 'AWS, Azure, GCP 중에 어떤 자격증부터 따는 게 좋을까요?' },
    { title: '사이드 프로젝트 뭐하세요?', content: '개인 프로젝트 하시는 분들 뭐 만드시나요? 아이디어 공유해요!' },
    { title: 'Mac vs Windows 개발 환경', content: '회사에서 맥북 지급해주는데 윈도우가 더 편한 건 저뿐인가요?' },
    { title: '개발자 영어 공부 어떻게 하세요?', content: '기술 문서 읽을 때 영어가 부족해서... 추천 방법 있나요?' },
    { title: '깃허브 프로필 꾸미기', content: '이직용으로 깃허브 프로필 정리 중인데 팁 있으신가요?' },
  ];

  const stockPosts = [
    { title: '삼성전자 지금 사도 되나요?', content: '5만원대인데 물타기 해도 될까요? 의견 부탁드려요.' },
    { title: '요즘 미국 주식 뭐 사세요?', content: 'NVDA, TSLA 계속 오르는데 지금 들어가도 될까요?' },
    { title: '배당주 추천해주세요', content: '매월 배당받고 싶은데 어떤 종목이 좋을까요?' },
    { title: 'ETF vs 개별주', content: '초보자는 ETF로 시작하는 게 나을까요?' },
    { title: '주식 손절 타이밍', content: '-20% 찍었는데 손절해야 할까요 버텨야 할까요?' },
    { title: '연금저축 어디서 하세요?', content: 'IRP랑 연금저축 둘 다 해야 하나요?' },
    { title: '부동산 vs 주식', content: '목돈 1억 생겼는데 어디에 투자할지 고민이에요.' },
    { title: '코인 아직도 하시나요?', content: '비트코인 다시 오르던데... 다시 시작해볼까요?' },
  ];

  const itIndustryPosts = [
    { title: 'IT 업계 정리해고 소식', content: '요즘 빅테크 정리해고 많다던데 국내는 어떤가요?' },
    { title: '네카라쿠배 연봉 순위', content: '2024년 기준 연봉 순위가 어떻게 되나요?' },
    { title: 'AI가 개발자 대체할까요?', content: 'ChatGPT 보면서 걱정되네요... 어떻게 생각하세요?' },
    { title: '스타트업 시리즈A 투자 소식', content: '요즘 투자 혹한기라던데 투자받은 곳 있나요?' },
    { title: 'IT 업계 복지 트렌드', content: '요즘 핫한 복지가 뭔가요? 저희는 점심 지원이 빠졌어요...' },
    { title: '개발자 채용 공고 줄었나요?', content: '작년 대비 채용 공고가 확 줄은 것 같은데...' },
    { title: '재택근무 종료하는 회사들', content: 'RTO 정책 시행하는 곳 많아지는 것 같아요.' },
    { title: 'IT 업계 나이 제한', content: '40대 개발자 분들 어떻게 커리어 이어가시나요?' },
  ];

  // 삼성전자 사내 게시판 게시글 (회사 인증된 사용자만 접근 가능)
  const samsungPosts = [
    { title: '삼성전자 연봉 협상 시즌', content: '올해 연봉 협상 어떻게 되셨나요? 작년보다 인상률 어떤가요?' },
    { title: 'DS부문 vs DX부문', content: '부서 이동 고민 중인데 어느 쪽이 나을까요?' },
    { title: '삼성 사내 복지 꿀팁', content: '입사 5년차인데 모르고 있던 복지가 있더라구요. 공유해요!' },
    { title: '수원 vs 화성 출퇴근', content: '수원에서 화성 캠퍼스 출퇴근하시는 분들 어떻게 하세요?' },
    { title: '삼성 해외 파견 경험담', content: '베트남 법인 파견 갔다왔는데 궁금한 점 있으시면 질문해주세요.' },
    { title: '사내 어학 프로그램', content: '토익스피킹 학원 지원 어떻게 신청하나요?' },
    { title: '연말 성과 평가', content: '이번 연말 평가 기준이 바뀌었다던데 아시는 분?' },
    { title: '삼성 주니어보드', content: '주니어보드 신청 경험 있으신 분 계신가요?' },
  ];

  if (freeTalkCommunity && careerCommunity && techTalkCommunity && stockCommunity && itIndustryCommunity) {
    let postCount = 0;

    // 자유게시판 게시글
    for (const post of freeTalkPosts) {
      const user = allUsers[Math.floor(Math.random() * allUsers.length)];
      await prisma.post.create({
        data: {
          communityId: freeTalkCommunity.id,
          authorId: user.id,
          title: post.title,
          content: post.content,
          viewCount: Math.floor(Math.random() * 2000) + 100,
          voteCount: Math.floor(Math.random() * 200) + 10,
          commentCount: Math.floor(Math.random() * 50) + 5,
          isAnonymous: true,
          status: 'ACTIVE',
        },
      });
      postCount++;
    }

    // 커리어 게시판 게시글
    for (const post of careerPosts) {
      const user = allUsers[Math.floor(Math.random() * allUsers.length)];
      await prisma.post.create({
        data: {
          communityId: careerCommunity.id,
          authorId: user.id,
          title: post.title,
          content: post.content,
          viewCount: Math.floor(Math.random() * 3000) + 200,
          voteCount: Math.floor(Math.random() * 300) + 20,
          commentCount: Math.floor(Math.random() * 80) + 10,
          isAnonymous: true,
          status: 'ACTIVE',
        },
      });
      postCount++;
    }

    // 개발자 라운지 게시글
    for (const post of techPosts) {
      const user = allUsers[Math.floor(Math.random() * allUsers.length)];
      await prisma.post.create({
        data: {
          communityId: techTalkCommunity.id,
          authorId: user.id,
          title: post.title,
          content: post.content,
          viewCount: Math.floor(Math.random() * 4000) + 300,
          voteCount: Math.floor(Math.random() * 400) + 30,
          commentCount: Math.floor(Math.random() * 100) + 15,
          isAnonymous: true,
          status: 'ACTIVE',
        },
      });
      postCount++;
    }

    // 주식/투자 게시글
    for (const post of stockPosts) {
      const user = allUsers[Math.floor(Math.random() * allUsers.length)];
      await prisma.post.create({
        data: {
          communityId: stockCommunity.id,
          authorId: user.id,
          title: post.title,
          content: post.content,
          viewCount: Math.floor(Math.random() * 2500) + 150,
          voteCount: Math.floor(Math.random() * 250) + 15,
          commentCount: Math.floor(Math.random() * 60) + 8,
          isAnonymous: true,
          status: 'ACTIVE',
        },
      });
      postCount++;
    }

    // IT 업계 게시글
    for (const post of itIndustryPosts) {
      const user = allUsers[Math.floor(Math.random() * allUsers.length)];
      await prisma.post.create({
        data: {
          communityId: itIndustryCommunity.id,
          authorId: user.id,
          title: post.title,
          content: post.content,
          viewCount: Math.floor(Math.random() * 3500) + 250,
          voteCount: Math.floor(Math.random() * 350) + 25,
          commentCount: Math.floor(Math.random() * 90) + 12,
          isAnonymous: true,
          status: 'ACTIVE',
        },
      });
      postCount++;
    }

    // 삼성전자 사내 게시판 게시글 (회사 인증 사용자만)
    if (samsungCommunity) {
      const samsungUsers = [companyUser, samsungUser2];
      for (const post of samsungPosts) {
        const user = samsungUsers[Math.floor(Math.random() * samsungUsers.length)];
        await prisma.post.create({
          data: {
            communityId: samsungCommunity.id,
            authorId: user.id,
            title: post.title,
            content: post.content,
            viewCount: Math.floor(Math.random() * 1000) + 50,
            voteCount: Math.floor(Math.random() * 100) + 5,
            commentCount: Math.floor(Math.random() * 30) + 3,
            isAnonymous: true,
            status: 'ACTIVE',
          },
        });
        postCount++;
      }
    }

    console.log(`✅ Created ${postCount} demo posts`);
  }

  // ============================================
  // TAGS
  // ============================================
  const tags = await Promise.all([
    prisma.tag.upsert({ where: { slug: 'salary' }, update: {}, create: { name: '연봉', slug: 'salary', postCount: 234 } }),
    prisma.tag.upsert({ where: { slug: 'interview' }, update: {}, create: { name: '면접', slug: 'interview', postCount: 156 } }),
    prisma.tag.upsert({ where: { slug: 'job-change' }, update: {}, create: { name: '이직', slug: 'job-change', postCount: 345 } }),
    prisma.tag.upsert({ where: { slug: 'work-life-balance' }, update: {}, create: { name: '워라밸', slug: 'work-life-balance', postCount: 123 } }),
    prisma.tag.upsert({ where: { slug: 'company-culture' }, update: {}, create: { name: '회사문화', slug: 'company-culture', postCount: 89 } }),
    prisma.tag.upsert({ where: { slug: 'tips' }, update: {}, create: { name: '꿀팁', slug: 'tips', postCount: 456 } }),
  ]);

  console.log(`✅ Created ${tags.length} tags`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n🎉 Seeding completed!');
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📋 데모 계정 정보 (Demo Accounts)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('1️⃣  관리자 계정 (Admin)');
  console.log('    - 아이디: admin_demo');
  console.log('    - 비밀번호: test1234');
  console.log('    - 권한: 모든 기능 접근, 관리자 페이지 접근');
  console.log('');
  console.log('2️⃣  일반 사용자 계정 (General User)');
  console.log('    - 아이디: general_user');
  console.log('    - 비밀번호: test1234');
  console.log('    - 권한: 일반 커뮤니티만 접근 가능, 회사 커뮤니티 접근 불가');
  console.log('');
  console.log('3️⃣  삼성전자 직원 계정 (Samsung Employee)');
  console.log('    - 아이디: samsung_user / samsung_dev');
  console.log('    - 비밀번호: test1234');
  console.log('    - 권한: 삼성전자 사내 커뮤니티 접근 가능');
  console.log('');
  console.log('4️⃣  네이버 직원 계정 (Naver Employee)');
  console.log('    - 아이디: naver_user');
  console.log('    - 비밀번호: test1234');
  console.log('    - 권한: 네이버 사내 커뮤니티 접근 가능');
  console.log('');
  console.log('5️⃣  카카오 직원 계정 (Kakao Employee)');
  console.log('    - 아이디: kakao_user');
  console.log('    - 비밀번호: test1234');
  console.log('    - 권한: 카카오 사내 커뮤니티 접근 가능');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔐 권한별 접근 범위 시연 시나리오');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('✅ 관리자 (admin_demo):');
  console.log('   - /admin 페이지 접근 가능');
  console.log('   - 사용자 관리, 게시글 관리, 신고 처리');
  console.log('   - 커뮤니티 요청 승인/거부');
  console.log('   - 광고 관리');
  console.log('');
  console.log('✅ 일반 사용자 (general_user):');
  console.log('   - 자유게시판, 커리어, 개발자라운지 등 일반 커뮤니티 접근');
  console.log('   - 삼성전자 커뮤니티 접근 시 → "회사 인증 필요" 메시지');
  console.log('   - /admin 페이지 접근 시 → 접근 거부');
  console.log('');
  console.log('✅ 회사 계정 (samsung_user):');
  console.log('   - 삼성전자 사내 게시판 접근 가능');
  console.log('   - 다른 회사(네이버, 카카오) 사내 게시판 접근 불가');
  console.log('   - 일반 커뮤니티는 모두 접근 가능');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
