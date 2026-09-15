const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

async function main() {
  console.log('Starting seed...');

  // First, fix the database schema by dropping and recreating tables with correct column types
  try {
    console.log('Fixing database schema (converting TIME to VARCHAR)...');
    
    // Drop views first
    await prisma.$queryRawUnsafe(`DROP VIEW IF EXISTS field_availability CASCADE;`);
    await prisma.$queryRawUnsafe(`DROP VIEW IF EXISTS daily_revenue CASCADE;`);
    await prisma.$queryRawUnsafe(`DROP VIEW IF EXISTS guest_booking_history CASCADE;`);
    
    // Drop tables in reverse dependency order
    await prisma.$queryRawUnsafe(`DROP TABLE IF EXISTS invoice CASCADE;`);
    await prisma.$queryRawUnsafe(`DROP TABLE IF EXISTS review CASCADE;`);
    await prisma.$queryRawUnsafe(`DROP TABLE IF EXISTS payment CASCADE;`);
    await prisma.$queryRawUnsafe(`DROP TABLE IF EXISTS booking CASCADE;`);
    await prisma.$queryRawUnsafe(`DROP TABLE IF EXISTS field_schedule CASCADE;`);
    await prisma.$queryRawUnsafe(`DROP TABLE IF EXISTS admin_setting CASCADE;`);
    await prisma.$queryRawUnsafe(`DROP TABLE IF EXISTS audit_log CASCADE;`);
    await prisma.$queryRawUnsafe(`DROP TABLE IF EXISTS field CASCADE;`);
    await prisma.$queryRawUnsafe(`DROP TABLE IF EXISTS venue_feature CASCADE;`);
    
    console.log('✅ Tables dropped successfully');
  } catch (error) {
    console.log('Note: Schema reset skipped (tables may not exist)');
  }

  // Recreate tables with proper VARCHAR columns for time fields
  try {
    console.log('Creating tables with correct schema...');
    
    // Field and field_schedule are intentionally omitted for single-venue setup.
    await prisma.$queryRawUnsafe(`
      CREATE TABLE booking (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_date DATE NOT NULL,
        start_time VARCHAR(10) NOT NULL,
        end_time VARCHAR(10) NOT NULL,
        duration_hours INTEGER NOT NULL,
        total_price INTEGER NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_email VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (booking_date, start_time)
      );
    `);
    
    await prisma.$queryRawUnsafe(`
      CREATE TABLE schedule_slot (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        start_time VARCHAR(10) NOT NULL,
        end_time VARCHAR(10) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await prisma.$queryRawUnsafe(`
      CREATE TABLE payment (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID NOT NULL REFERENCES booking(id) ON DELETE CASCADE,
        transaction_id VARCHAR(255) UNIQUE NOT NULL,
        amount INTEGER NOT NULL,
        payment_method VARCHAR(100) DEFAULT 'Midtrans',
        provider VARCHAR(100) DEFAULT 'Midtrans',
        status VARCHAR(50) DEFAULT 'pending',
        paid_at TIMESTAMP,
        expired_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await prisma.$queryRawUnsafe(`
      CREATE TABLE invoice (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        booking_id UUID UNIQUE NOT NULL REFERENCES booking(id) ON DELETE CASCADE,
        payment_id UUID UNIQUE NOT NULL REFERENCES payment(id) ON DELETE CASCADE,
        subtotal INTEGER NOT NULL,
        tax INTEGER DEFAULT 0,
        discount INTEGER DEFAULT 0,
        total INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'issued',
        issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await prisma.$queryRawUnsafe(`
      CREATE TABLE review (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID REFERENCES booking(id) ON DELETE CASCADE,
        customer_name VARCHAR(255) NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await prisma.$queryRawUnsafe(`
      CREATE TABLE admin_setting (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$queryRawUnsafe(`
      CREATE TABLE admin_user (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$queryRawUnsafe(`
      CREATE TABLE admin_session (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_user_id UUID NOT NULL REFERENCES admin_user(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$queryRawUnsafe(`
      CREATE TABLE audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        action VARCHAR(100) NOT NULL,
        entity VARCHAR(100) NOT NULL,
        entity_id VARCHAR(255) NOT NULL,
        changes TEXT,
        ip_address VARCHAR(45),
        reference_email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$queryRawUnsafe(`
      CREATE TABLE venue_feature (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT NOT NULL,
        image_public_id VARCHAR(255),
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error.message);
    throw error;
  }

  // Create indexes
  try {
    console.log('Creating indexes...');
    
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_booking_customer_email ON booking(customer_email);`);
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_booking_customer_phone ON booking(customer_phone);`);
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_booking_booking_date ON booking(booking_date);`);
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_booking_status ON booking(status);`);
    // field-related indexes removed (no field table)
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_review_booking_id ON review(booking_id);`);
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_admin_setting_key ON admin_setting(key);`);
    
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_payment_booking_id ON payment(booking_id);`);
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_payment_transaction_id ON payment(transaction_id);`);
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_payment_status ON payment(status);`);
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_payment_created_at ON payment(created_at);`);
    
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_invoice_booking_id ON invoice(booking_id);`);
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_invoice_payment_id ON invoice(payment_id);`);
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_invoice_status ON invoice(status);`);
    
    // removed field-specific indexes
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);`);
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_audit_log_entity_id ON audit_log(entity_id);`);
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);`);
    
    console.log('✅ Indexes created successfully');
  } catch (error) {
    console.log('Note: Some indexes may already exist');
  }

  const existingScheduleSlots = await prisma.scheduleSlot.findMany();
  if (existingScheduleSlots.length === 0) {
    console.log('Creating default schedule slots...');
    await prisma.scheduleSlot.createMany({
      data: [
        { startTime: '06:00', endTime: '07:00', isActive: true, sortOrder: 0, price: 90000 },
        { startTime: '07:00', endTime: '07:30', isActive: true, sortOrder: 1, price: 90000 },
        { startTime: '07:30', endTime: '08:30', isActive: true, sortOrder: 2, price: 100000 },
        { startTime: '08:30', endTime: '09:30', isActive: true, sortOrder: 3, price: 100000 },
        { startTime: '09:30', endTime: '10:30', isActive: true, sortOrder: 4, price: 100000 },
        { startTime: '10:30', endTime: '11:30', isActive: true, sortOrder: 5, price: 100000 },
        { startTime: '11:30', endTime: '12:30', isActive: true, sortOrder: 6, price: 110000 },
        { startTime: '12:30', endTime: '13:30', isActive: true, sortOrder: 7, price: 110000 },
        { startTime: '13:30', endTime: '14:30', isActive: true, sortOrder: 8, price: 110000 },
        { startTime: '14:30', endTime: '15:30', isActive: true, sortOrder: 9, price: 110000 },
        { startTime: '15:30', endTime: '16:30', isActive: true, sortOrder: 10, price: 120000 },
        { startTime: '16:30', endTime: '17:30', isActive: true, sortOrder: 11, price: 120000 },
        { startTime: '17:30', endTime: '18:30', isActive: true, sortOrder: 12, price: 140000 },
        { startTime: '18:30', endTime: '19:30', isActive: true, sortOrder: 13, price: 150000 },
        { startTime: '19:30', endTime: '20:30', isActive: true, sortOrder: 14, price: 150000 },
        { startTime: '20:30', endTime: '21:30', isActive: true, sortOrder: 15, price: 120000 },
      ],
    });
  }

  // Seed bookings/payments/reviews for single-venue setup
  const existingBookings = await prisma.booking.findMany();
  if (existingBookings.length === 0) {
    console.log('Creating sample bookings...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    const b1 = await prisma.booking.create({
      data: {
        bookingDate: tomorrow,
        startTime: '18:00',
        endTime: '20:00',
        durationHours: 2,
        totalPrice: 220000,
        customerName: 'Ahmad Rahman',
        customerPhone: '08123456789',
        customerEmail: 'ahmad@email.com',
        status: 'confirmed',
      },
    });

    const b2 = await prisma.booking.create({
      data: {
        bookingDate: dayAfter,
        startTime: '19:00',
        endTime: '21:00',
        durationHours: 2,
        totalPrice: 220000,
        customerName: 'Budi Santoso',
        customerPhone: '08987654321',
        customerEmail: 'budi@email.com',
        status: 'pending',
      },
    });

    // create payments for these bookings
    await prisma.payment.create({
      data: {
        bookingId: b1.id,
        transactionId: `${b1.id}-${Date.now()}`,
        amount: b1.totalPrice,
        paymentMethod: 'Midtrans',
        provider: 'Midtrans',
        status: 'success',
        paidAt: new Date(),
        expiredAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    await prisma.payment.create({
      data: {
        bookingId: b2.id,
        transactionId: `${b2.id}-${Date.now()}`,
        amount: b2.totalPrice,
        paymentMethod: 'Midtrans',
        provider: 'Midtrans',
        status: 'pending',
        paidAt: null,
        expiredAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    // reviews
    await prisma.review.createMany({
      data: [
        {
          bookingId: b1.id,
          customerName: 'Ari Putra',
          rating: 5,
          comment: 'Lapangan bersih, proses booking cepat, dan pelayanan ramah.',
        },
        {
          bookingId: b2.id,
          customerName: 'Nina Sari',
          rating: 4,
          comment: 'Fasilitas bagus dan suasana nyaman. Parkir bisa ditingkatkan.',
        },
      ],
    });
  }

  // Create admin settings
  const existingSettings = await prisma.adminSetting.findMany();
  if (existingSettings.length === 0) {
    console.log('Creating admin settings...');
    await prisma.adminSetting.createMany({
      data: [
        { key: 'site_title', value: 'Klaten International Minisoccer', description: 'Nama utama situs web' },
        { key: 'contact_email', value: 'info@klatenminisoccer.id', description: 'Email kontak utama' },
        { key: 'contact_phone', value: '+62 821-1234-5678', description: 'Nomor telepon kontak utama' },
        { key: 'locationLabel', value: 'KLATEN, JAWA TENGAH', description: 'Label lokasi pada hero website' },
        { key: 'heroTitle', value: 'Klaten International Minisoccer', description: 'Judul utama website' },
        { key: 'heroSubtitle', value: 'Satu lapangan premium dengan jadwal per jam, booking mudah, dan suasana lapangan terbaik untuk komunitas futsal dan mini soccer.', description: 'Deskripsi utama website' },
        { key: 'ctaPrimary', value: 'Pesan sekarang', description: 'Teks tombol booking utama' },
        { key: 'ctaSecondary', value: 'Lihat riwayat booking', description: 'Teks tombol riwayat booking' },
        { key: 'backgroundImageUrl', value: '', description: 'Background utama hero website' },
      ],
    });
  }

  const existingFeatures = await prisma.venueFeature.findMany();
  if (existingFeatures.length === 0) {
    await prisma.venueFeature.createMany({
      data: [
        { name: 'Lapangan premium', description: 'Surface terbaik untuk 5v5 dan mini soccer.', imageUrl: '', imagePublicId: 'lapangan_premium_aqejyy', sortOrder: 0 },
        { name: 'Lampu malam', description: 'Jadwal per jam hingga malam hari.', imageUrl: '', imagePublicId: 'lampu_malam_xntenr', sortOrder: 1 },
        { name: 'Fasilitas sewa', description: 'Loker, sepatu, bola, dan ruang ganti yang tertata rapi.', imageUrl: '', imagePublicId: 'fasilitas_sewa_o0uptk', sortOrder: 2 },
        { name: 'Citarasa komunitas', description: 'Tempat berkumpul dan pertandingan seru.', imageUrl: '', imagePublicId: 'citarasa_komunitas_ey2pmm', sortOrder: 3 },
      ],
    });
  }

  const existingAdmins = await prisma.adminUser.findMany();
  if (existingAdmins.length === 0) {
    console.log('Creating seeded admin users...');
    await prisma.adminUser.createMany({
      data: [
        {
          name: 'System Administrator',
          email: 'admin@klatenminisoccer.id',
          passwordHash: crypto.createHash('sha256').update('admin123').digest('hex'),
          role: 'super_admin',
          isActive: true,
        },
        {
          name: 'Primary Super Admin',
          email: 'superadmin1@klatenminisoccer.id',
          passwordHash: crypto.createHash('sha256').update('superadmin123').digest('hex'),
          role: 'super_admin',
          isActive: true,
        },
        {
          name: 'Booking Manager',
          email: 'manager1@klatenminisoccer.id',
          passwordHash: crypto.createHash('sha256').update('manager123').digest('hex'),
          role: 'manager',
          isActive: true,
        },
        {
          name: 'Support Staff',
          email: 'staff@klatenminisoccer.id',
          passwordHash: crypto.createHash('sha256').update('staff123').digest('hex'),
          role: 'staff',
          isActive: true,
        },
      ],
    });
  }

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
