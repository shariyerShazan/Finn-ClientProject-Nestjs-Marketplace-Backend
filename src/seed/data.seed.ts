/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedAdmin();
    await this.seedCategories();
  }

  async seedAdmin() {
    const adminEmail = 'admin@gmail.com';
    try {
      const existingAdmin = await this.prisma.auth.findUnique({
        where: { email: adminEmail },
      });

      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await this.prisma.auth.create({
          data: {
            firstName: 'Super',
            lastName: 'Admin',
            nickName: 'admin',
            email: adminEmail,
            phone: '01700000000',
            password: hashedPassword,
            role: 'ADMIN',
            isVerified: true,
          },
        });
        this.logger.log('✅ Admin user seeded successfully!');
      }
    } catch (error) {
      this.logger.error('❌ Error seeding admin:', error.message);
    }
  }

  async seedCategories() {
    const categories = [
      {
        name: 'Vehicle',
        slug: 'vehicle',
        subCategories: [
          'Cars',
          'Motorcycles',
          'Heavy Duty',
          'Spare Parts',
          'Boats',
        ],
      },
      {
        name: 'Rel-Estate',
        slug: 'rel-estate',
        subCategories: ['Apartment', 'Land', 'Commercial', 'Rent', 'Villa'],
      },
      {
        name: 'Jobs',
        slug: 'jobs',
        subCategories: [
          'IT & Software',
          'Sales',
          'Accounting',
          'Delivery',
          'Marketing',
        ],
      },
      {
        name: 'Electronics',
        slug: 'electronics',
        subCategories: [
          'Mobiles',
          'Laptops',
          'Cameras',
          'Home Appliances',
          'TV',
        ],
      },
      {
        name: 'For Sale',
        slug: 'for-sale',
        subCategories: [
          'Furniture',
          'Clothing',
          'Books',
          'Sports',
          'Instruments',
        ],
      },
      {
        name: 'Services',
        slug: 'services',
        subCategories: [
          'Cleaning',
          'Web Design',
          'Education',
          'Health',
          'Legal',
        ],
      },
      {
        name: 'Pets',
        slug: 'pets',
        subCategories: ['Dogs', 'Cats', 'Birds', 'Fish', 'Accessories'],
      },
      {
        name: 'Events',
        slug: 'events',
        subCategories: [
          'Weddings',
          'Parties',
          'Concerts',
          'Workshops',
          'Conferences',
        ],
      },
    ];

    try {
      for (const cat of categories) {
        // Category create ba update
        await this.prisma.category.upsert({
          where: { slug: cat.slug },
          update: {},
          create: {
            name: cat.name,
            slug: cat.slug,
            subCategories: {
              create: cat.subCategories.map((sub) => ({
                name: sub,
                slug: `${cat.slug}-${sub.toLowerCase().replace(/\s+/g, '-')}`,
              })),
            },
          },
        });
      }
      this.logger.log('✅ Categories and Sub-categories seeded!');
    } catch (error) {
      this.logger.error('❌ Error seeding categories:', error.message);
    }
  }
}
