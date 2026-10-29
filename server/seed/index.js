import mongoose from 'mongoose';
import { connectDatabase } from '../config/db.js';
import { Admin, GalleryImage, Offer, SalonSettings, Service, Staff } from '../models/index.js';

const serviceSeeds = [
  {
    name: 'Signature Haircut',
    slug: 'signature-haircut',
    description: 'Consultation, hair wash, precision haircut, and everyday finish.',
    category: 'Hair',
    price: 300,
    durationMinutes: 20,
    image: 'https://images.unsplash.com/photo-1560869713-da86a9ecf485?auto=format&fit=crop&w=900&q=80',
    active: true
  },
  {
    name: 'Blow Dry Styling',
    slug: 'blow-dry-styling',
    description: 'Smooth, voluminous, or softly waved styling for a polished finish.',
    category: 'Styling',
    price: 450,
    durationMinutes: 35,
    image: 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=900&q=80',
    active: true
  },
  {
    name: 'Global Hair Color',
    slug: 'global-hair-color',
    description: 'Full-head color application with professional consultation and finish.',
    category: 'Color',
    price: 1800,
    durationMinutes: 120,
    image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=900&q=80',
    active: true
  },
  {
    name: 'Radiance Facial',
    slug: 'radiance-facial',
    description: 'Cleanse, exfoliation, massage, mask, and hydration for fresh skin.',
    category: 'Skin',
    price: 1200,
    durationMinutes: 60,
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=80',
    active: true
  },
  {
    name: 'Bridal Makeup Trial',
    slug: 'bridal-makeup-trial',
    description: 'Personalized bridal makeup preview with skin prep and look planning.',
    category: 'Makeup',
    price: 2500,
    durationMinutes: 90,
    image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=900&q=80',
    active: true
  }
];

const adminSeed = {
  name: 'Bliss Admin',
  email: 'admin@blissbeautysalon.com',
  password: 'Admin@12345',
  role: 'admin'
};

const settingsSeed = {
  salonName: 'Bliss Beauty Salon',
  phone: '+91 98765 43210',
  whatsapp: '+91 98765 43210',
  email: 'hello@blissbeautysalon.com',
  address: '18 Rose Avenue, Bandra West, Mumbai, Maharashtra',
  openingTime: '09:00',
  closingTime: '20:00',
  bookingIntervalMinutes: 15,
  gracePeriodMinutes: 10,
  notificationThresholdMinutes: 15,
  selfCheckInWindowMinutes: 30,
  cancellationCutoffMinutes: 60,
  timezone: 'Asia/Kolkata',
  numberOfChairs: 4,
  maxAdvanceBookingDays: 30
};

const offerSeeds = [
  {
    title: 'New Guest Glow',
    value: '20% off',
    detail: 'First cut, color, or facial appointment with any senior stylist.',
    expires: 'Available this month',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80',
    sortOrder: 1,
    active: true
  },
  {
    title: 'Weekday Refresh',
    value: '₹500 off',
    detail: 'Any blowout and brow detail booked Monday through Thursday.',
    expires: 'Limited weekday slots',
    image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=900&q=80',
    sortOrder: 2,
    active: true
  },
  {
    title: 'Bridal Preview',
    value: 'Complimentary gloss',
    detail: 'With a bridal trial and event-day styling package.',
    expires: 'By consultation',
    image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=900&q=80',
    sortOrder: 3,
    active: true
  }
];

const gallerySeeds = [
  {
    title: 'Bright styling stations',
    src: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80',
    category: 'Salon',
    sortOrder: 1,
    active: true
  },
  {
    title: 'Dimensional color work',
    src: 'https://images.unsplash.com/photo-1560869713-da86a9ecf485?auto=format&fit=crop&w=1200&q=80',
    category: 'Hair',
    sortOrder: 2,
    active: true
  },
  {
    title: 'Calm skin treatments',
    src: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80',
    category: 'Skin',
    sortOrder: 3,
    active: true
  },
  {
    title: 'Polished finishes',
    src: 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=1200&q=80',
    category: 'Styling',
    sortOrder: 4,
    active: true
  },
  {
    title: 'Premium care products',
    src: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=80',
    category: 'Retail',
    sortOrder: 5,
    active: true
  },
  {
    title: 'Soft event beauty',
    src: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1200&q=80',
    category: 'Makeup',
    sortOrder: 6,
    active: true
  }
];

function serviceIdsBySlug(services) {
  return services.reduce((map, service) => {
    map[service.slug] = service._id;
    return map;
  }, {});
}

async function seedServices() {
  const services = [];

  for (const service of serviceSeeds) {
    const savedService = await Service.findOneAndUpdate({ slug: service.slug }, service, {
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
      upsert: true
    });

    services.push(savedService);
  }

  return services;
}

async function seedStaff(serviceMap) {
  const staffSeeds = [
    {
      name: 'Maya Sharma',
      phone: '+91 90000 10001',
      email: 'maya@blissbeautysalon.com',
      photo: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=900&q=80',
      specialization: 'Haircuts, color, and balayage',
      services: [serviceMap['signature-haircut'], serviceMap['global-hair-color'], serviceMap['blow-dry-styling']],
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      workingHours: { start: '09:00', end: '18:00' },
      active: true
    },
    {
      name: 'Nora Kapoor',
      phone: '+91 90000 10002',
      email: 'nora@blissbeautysalon.com',
      photo: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=900&q=80',
      specialization: 'Skin care, facials, and brows',
      services: [serviceMap['radiance-facial']],
      workingDays: ['monday', 'wednesday', 'thursday', 'friday', 'sunday'],
      workingHours: { start: '10:00', end: '19:00' },
      active: true
    },
    {
      name: 'Aisha Mehta',
      phone: '+91 90000 10003',
      email: 'aisha@blissbeautysalon.com',
      photo: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=900&q=80',
      specialization: 'Bridal makeup, event styling, and blowouts',
      services: [serviceMap['bridal-makeup-trial'], serviceMap['blow-dry-styling']],
      workingDays: ['tuesday', 'wednesday', 'friday', 'saturday', 'sunday'],
      workingHours: { start: '11:00', end: '20:00' },
      active: true
    }
  ];

  const staff = [];

  for (const member of staffSeeds) {
    const savedMember = await Staff.findOneAndUpdate({ email: member.email }, member, {
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
      upsert: true
    });

    staff.push(savedMember);
  }

  return staff;
}

async function linkServicesToStaff(staff) {
  const serviceStaffMap = new Map();

  for (const member of staff) {
    for (const serviceId of member.services) {
      const key = serviceId.toString();
      const staffIds = serviceStaffMap.get(key) || [];
      staffIds.push(member._id);
      serviceStaffMap.set(key, staffIds);
    }
  }

  for (const [serviceId, staffIds] of serviceStaffMap.entries()) {
    await Service.findByIdAndUpdate(serviceId, { availableStaff: staffIds }, { runValidators: true });
  }
}

async function seedAdmin() {
  const existingAdmin = await Admin.findOne({ email: adminSeed.email }).select('+password');

  if (existingAdmin) {
    existingAdmin.name = adminSeed.name;
    existingAdmin.role = adminSeed.role;
    existingAdmin.password = adminSeed.password;
    await existingAdmin.save();
    return existingAdmin;
  }

  return Admin.create(adminSeed);
}

async function seedSettings() {
  return SalonSettings.findOneAndUpdate({}, settingsSeed, {
    new: true,
    runValidators: true,
    setDefaultsOnInsert: true,
    upsert: true
  });
}

async function seedOffers() {
  return Promise.all(
    offerSeeds.map((offer) =>
      Offer.findOneAndUpdate({ title: offer.title }, offer, {
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
        upsert: true
      })
    )
  );
}

async function seedGallery() {
  return Promise.all(
    gallerySeeds.map((image) =>
      GalleryImage.findOneAndUpdate({ title: image.title }, image, {
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
        upsert: true
      })
    )
  );
}

async function seedDatabase() {
  await connectDatabase({ required: true });

  const services = await seedServices();
  const staff = await seedStaff(serviceIdsBySlug(services));
  await linkServicesToStaff(staff);
  await seedAdmin();
  await seedSettings();
  const offers = await seedOffers();
  const gallery = await seedGallery();

  console.log('Seed data created successfully');
  console.log(`Services: ${services.length}`);
  console.log(`Staff: ${staff.length}`);
  console.log(`Offers: ${offers.length}`);
  console.log(`Gallery images: ${gallery.length}`);
  console.log(`Admin: ${adminSeed.email}`);
  console.log('Default admin password: Admin@12345');
}

seedDatabase()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
