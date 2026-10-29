process.env.TZ = 'Asia/Kolkata';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

import http from 'http';
import { Server } from 'socket.io';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { io as createSocketClient } from '../../client/node_modules/socket.io-client/build/esm/index.js';
import app from '../app.js';
import { env } from '../config/env.js';
import Admin from '../models/Admin.js';
import Appointment from '../models/Appointment.js';
import GalleryImage from '../models/GalleryImage.js';
import Notification from '../models/Notification.js';
import Offer from '../models/Offer.js';
import SalonSettings from '../models/SalonSettings.js';
import Service from '../models/Service.js';
import Staff from '../models/Staff.js';
import { configureSocket } from '../socket/index.js';

const tag = 'SMOKE-FEATURES';
const adminEmail = 'smoke-features-admin@bliss.local';
const adminPassword = 'Admin@12345';
let originalSettings = null;
const created = {};
const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isoDate(daysFromNow = 3) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

function dayName(dateText) {
  return dayNames[new Date(`${dateText}T00:00:00`).getDay()];
}

function setClock(dateText, time = '10:00') {
  process.env.BLISS_TEST_NOW = `${dateText}T${time}:00+05:30`;
}

function clearClock() {
  delete process.env.BLISS_TEST_NOW;
}

async function cleanup() {
  await Notification.deleteMany({ bookingReference: new RegExp(`^${tag}-`) });
  await Appointment.deleteMany({
    $or: [{ bookingReference: new RegExp(`^${tag}-`) }, { customerPhone: /^\+91970000/ }]
  });
  await GalleryImage.deleteMany({ title: new RegExp(`^${tag}`) });
  await Offer.deleteMany({ title: new RegExp(`^${tag}`) });
  await Service.deleteMany({ slug: new RegExp(`^${tag.toLowerCase()}`) });
  await Staff.deleteMany({ email: new RegExp(`^${tag.toLowerCase()}`) });
  await Admin.deleteOne({ email: adminEmail });

  if (originalSettings) {
    const { _id, __v, createdAt, updatedAt, ...settings } = originalSettings;
    await SalonSettings.findOneAndUpdate({}, settings, { upsert: true, runValidators: true });
  }

  clearClock();
}

async function seedBase() {
  originalSettings = await SalonSettings.findOne().lean();
  await cleanup();

  created.date = isoDate(3);
  created.today = isoDate(0);
  const workingDay = dayName(created.date);
  const todayWorkingDay = dayName(created.today);

  const admin = await Admin.create({
    name: 'Smoke Admin',
    email: adminEmail,
    password: adminPassword,
    role: 'admin'
  });
  await Admin.updateOne({ _id: admin._id }, { $set: { password: await bcrypt.hash(adminPassword, 12) } });

  const haircut = await Service.create({
    name: `${tag} Haircut`,
    slug: `${tag.toLowerCase()}-haircut`,
    description: 'Smoke test haircut service.',
    category: 'Hair',
    price: 300,
    durationMinutes: 20,
    image: '',
    active: true
  });

  const color = await Service.create({
    name: `${tag} Color`,
    slug: `${tag.toLowerCase()}-color`,
    description: 'Smoke test color service.',
    category: 'Hair Color',
    price: 900,
    durationMinutes: 40,
    image: '',
    active: true
  });

  const staff = await Staff.insertMany([
    {
      name: `${tag} Rahul`,
      phone: '+919700000001',
      email: `${tag.toLowerCase()}-rahul@bliss.local`,
      specialization: 'Haircuts',
      services: [haircut._id],
      workingDays: [...new Set([workingDay, todayWorkingDay])],
      workingHours: { start: '09:00', end: '18:00' },
      active: true
    },
    {
      name: `${tag} Aman`,
      phone: '+919700000002',
      email: `${tag.toLowerCase()}-aman@bliss.local`,
      specialization: 'Haircuts and color',
      services: [haircut._id, color._id],
      workingDays: [...new Set([workingDay, todayWorkingDay])],
      workingHours: { start: '09:00', end: '18:00' },
      active: true
    }
  ]);

  haircut.availableStaff = staff.map((member) => member._id);
  color.availableStaff = [staff[1]._id];
  await haircut.save();
  await color.save();

  await SalonSettings.findOneAndUpdate(
    {},
    {
      salonName: 'Bliss Beauty Salon',
      phone: '+91 98765 43210',
      whatsapp: '+91 98765 43210',
      email: 'hello@blissbeautysalon.com',
      address: 'Smoke Test Lane',
      openingTime: '09:00',
      closingTime: '18:00',
      bookingIntervalMinutes: 20,
      gracePeriodMinutes: 5,
      notificationThresholdMinutes: 15,
      selfCheckInWindowMinutes: 30,
      cancellationCutoffMinutes: 60,
      timezone: 'Asia/Kolkata',
      numberOfChairs: 2,
      maxAdvanceBookingDays: 30
    },
    { upsert: true, runValidators: true }
  );

  created.admin = admin;
  created.haircut = haircut;
  created.color = color;
  created.rahul = staff[0];
  created.aman = staff[1];
}

async function startServer() {
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: env.allowedOrigins,
      methods: ['GET', 'POST', 'PATCH'],
      credentials: true
    }
  });
  configureSocket(io);

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve) => {
        io.close(() => server.close(resolve));
      })
  };
}

async function request(baseUrl, path, { method = 'GET', body, cookie, expect = 200 } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  assert(response.status === expect, `${method} ${path} expected ${expect}, got ${response.status}: ${json.message || text}`);
  return {
    json,
    cookie: response.headers.get('set-cookie')?.split(';')[0]
  };
}

async function login(baseUrl) {
  const { cookie, json } = await request(baseUrl, '/api/admin/auth/login', {
    method: 'POST',
    body: { email: adminEmail, password: adminPassword }
  });
  assert(cookie, 'Admin login did not set cookie');
  assert(json.admin.email === adminEmail, 'Admin login returned wrong admin');
  return cookie;
}

async function connectAdminSocket(baseUrl, events) {
  const socket = createSocketClient(baseUrl, { transports: ['websocket'], forceNew: true });
  ['queue:updated', 'appointment:updated', 'staff:availability', 'notification'].forEach((eventName) => {
    socket.on(eventName, (payload) => events.push({ eventName, payload }));
  });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Admin socket did not connect')), 4000);
    socket.on('connect', () => {
      clearTimeout(timeout);
      socket.emit('join:admin');
      setTimeout(resolve, 100);
    });
  });

  return socket;
}

async function publicSmoke(baseUrl) {
  await request(baseUrl, '/api/health');
  const settings = (await request(baseUrl, '/api/settings')).json.settings;
  assert(settings.salonName && !('numberOfChairs' in settings), 'Public settings payload is not safe');

  const services = (await request(baseUrl, '/api/services')).json.services;
  assert(services.some((service) => service.slug === created.haircut.slug), 'Public services missing active smoke service');
  assert(!JSON.stringify(services.flatMap((service) => service.availableStaff || [])).includes('phone'), 'Public service leaked staff phone');

  const staff = (await request(baseUrl, '/api/staff')).json.staff;
  assert(staff.some((member) => member.email === undefined), 'Public staff response should hide email');

  await request(baseUrl, '/api/offers');
  await request(baseUrl, '/api/gallery');
}

async function adminCrudSmoke(baseUrl, cookie) {
  await request(baseUrl, '/api/admin/services', { expect: 401 });
  await request(baseUrl, '/api/admin/auth/me', { cookie });

  const service = (
    await request(baseUrl, '/api/admin/services', {
      method: 'POST',
      cookie,
      body: {
        name: `${tag} Nails`,
        description: 'Smoke nails service.',
        category: 'Nails',
        price: 500,
        durationMinutes: 30,
        availableStaff: [created.aman._id.toString()],
        active: true
      },
      expect: 201
    })
  ).json.service;
  await request(baseUrl, `/api/admin/services/${service._id}`, {
    method: 'PUT',
    cookie,
    body: { price: 550, availableStaff: [created.aman._id.toString()] }
  });
  await request(baseUrl, `/api/admin/services/${service._id}/status`, { method: 'PATCH', cookie, body: { active: false } });
  await request(baseUrl, `/api/admin/services/${service._id}`, { method: 'DELETE', cookie });

  const staff = (
    await request(baseUrl, '/api/admin/staff', {
      method: 'POST',
      cookie,
      body: {
        name: `${tag} Meera`,
        phone: '+919700000003',
        email: `${tag.toLowerCase()}-meera@bliss.local`,
        specialization: 'Styling',
        services: [created.haircut._id.toString()],
        workingDays: [dayName(created.date)],
        workingHours: { start: '10:00', end: '18:00' },
        active: true
      },
      expect: 201
    })
  ).json.staff;
  await request(baseUrl, `/api/admin/staff/${staff._id}`, { method: 'PUT', cookie, body: { specialization: 'Senior styling' } });
  await request(baseUrl, `/api/admin/staff/${staff._id}/status`, { method: 'PATCH', cookie, body: { active: false } });
  await request(baseUrl, `/api/admin/staff/${staff._id}`, { method: 'DELETE', cookie });

  const offer = (
    await request(baseUrl, '/api/admin/offers', {
      method: 'POST',
      cookie,
      body: { title: `${tag} Offer`, value: '10% OFF', detail: 'Smoke offer.', expires: 'This week', active: true },
      expect: 201
    })
  ).json.offer;
  await request(baseUrl, `/api/admin/offers/${offer._id}`, { method: 'PUT', cookie, body: { value: '15% OFF' } });
  await request(baseUrl, `/api/admin/offers/${offer._id}/status`, { method: 'PATCH', cookie, body: { active: false } });
  await request(baseUrl, `/api/admin/offers/${offer._id}`, { method: 'DELETE', cookie });

  const image = (
    await request(baseUrl, '/api/admin/gallery', {
      method: 'POST',
      cookie,
      body: { title: `${tag} Gallery`, src: 'https://example.com/image.jpg', alt: 'Smoke image', category: 'Salon', active: true },
      expect: 201
    })
  ).json.image;
  await request(baseUrl, `/api/admin/gallery/${image._id}`, { method: 'PUT', cookie, body: { category: 'Hair' } });
  await request(baseUrl, `/api/admin/gallery/${image._id}/status`, { method: 'PATCH', cookie, body: { active: false } });
  await request(baseUrl, `/api/admin/gallery/${image._id}`, { method: 'DELETE', cookie });

  const settings = (await request(baseUrl, '/api/admin/settings', { cookie })).json.settings;
  await request(baseUrl, '/api/admin/settings', {
    method: 'PUT',
    cookie,
    body: { salonName: settings.salonName, bookingIntervalMinutes: settings.bookingIntervalMinutes }
  });
}

async function bookingSmoke(baseUrl, cookie) {
  const availability = (
    await request(
      baseUrl,
      `/api/booking/availability?serviceId=${created.haircut._id}&staffId=any&date=${created.date}`
    )
  ).json;
  assert(availability.slots.length > 2, 'Availability did not return enough slots');
  const firstSlot = availability.slots[0].time;
  const secondSlot = availability.slots[1].time;
  const thirdSlot = availability.slots[2].time;

  await request(baseUrl, `/api/booking/availability?serviceId=${created.color._id}&staffId=${created.rahul._id}&date=${created.date}`, {
    expect: 400
  });

  const appointment = (
    await request(baseUrl, '/api/appointments', {
      method: 'POST',
      body: {
        customerName: `${tag} Customer`,
        customerPhone: '+919700001001',
        customerEmail: 'customer@smoke.local',
        serviceId: created.haircut._id.toString(),
        staffId: created.rahul._id.toString(),
        bookingDate: created.date,
        slotTime: firstSlot
      },
      expect: 201
    })
  ).json.appointment;
  assert(appointment.bookingReference?.startsWith('BLISS-'), 'Customer booking reference was not generated');

  const tracking = (
    await request(baseUrl, '/api/appointments/track', {
      method: 'POST',
      body: { bookingReference: appointment.bookingReference, phone: '+919700001001' }
    })
  ).json.tracking;
  assert(tracking.bookingReference === appointment.bookingReference, 'Tracking returned wrong booking');
  assert(!JSON.stringify(tracking).includes('+919700001001'), 'Tracking response exposed customer phone');

  await request(baseUrl, `/api/appointments/${appointment.id}/queue-status`);
  await request(baseUrl, `/api/appointments/${appointment.id}/reschedule`, {
    method: 'PATCH',
    body: {
      phone: '+919700001001',
      serviceId: created.haircut._id.toString(),
      staffId: created.rahul._id.toString(),
      bookingDate: created.date,
      slotTime: secondSlot
    }
  });
  await request(baseUrl, `/api/appointments/${appointment.id}/cancel`, {
    method: 'PATCH',
    body: { phone: '+919700001001' }
  });

  const adminBooking = (
    await request(baseUrl, '/api/admin/appointments', {
      method: 'POST',
      cookie,
      body: {
        customerName: `${tag} Admin Booking`,
        customerPhone: '+919700001002',
        serviceId: created.haircut._id.toString(),
        staffId: created.aman._id.toString(),
        bookingDate: created.date,
        slotTime: thirdSlot,
        notes: 'Created by smoke test'
      },
      expect: 201
    })
  ).json.appointment;
  assert(adminBooking.source === 'admin', 'Admin booking did not use admin source');

  await request(baseUrl, `/api/admin/appointments/${adminBooking.id}`, { cookie });
  await request(baseUrl, '/api/admin/appointments?filter=upcoming&search=SMOKE', { cookie });
  await request(baseUrl, '/api/admin/customers?search=9700001002', { cookie });
}

async function liveQueueSmoke(baseUrl, cookie, events) {
  setClock(created.today, '10:00');
  const current = await Appointment.create({
    bookingReference: `${tag}-ACTIVE`,
    customerName: `${tag} Active`,
    customerPhone: '+919700001003',
    service: created.haircut._id,
    staff: created.rahul._id,
    bookingDate: new Date(`${created.today}T00:00:00`),
    slotTime: '09:45',
    estimatedStartTime: new Date(`${created.today}T09:45:00`),
    estimatedDuration: 20,
    source: 'walk-in',
    status: 'in_service',
    arrivalTime: new Date(`${created.today}T09:40:00`),
    serviceStartTime: new Date(`${created.today}T09:45:00`)
  });

  const waiting = await Appointment.create({
    bookingReference: `${tag}-WAITING`,
    customerName: `${tag} Waiting`,
    customerPhone: '+919700001004',
    service: created.haircut._id,
    staff: created.rahul._id,
    preferredStaff: created.rahul._id,
    bookingDate: new Date(`${created.today}T00:00:00`),
    slotTime: '10:00',
    estimatedStartTime: new Date(`${created.today}T10:00:00`),
    estimatedDuration: 20,
    source: 'online',
    status: 'booked'
  });

  const lateCandidate = await Appointment.create({
    bookingReference: `${tag}-LATE`,
    customerName: `${tag} Late`,
    customerPhone: '+919700001005',
    service: created.haircut._id,
    staff: created.aman._id,
    preferredStaff: created.aman._id,
    bookingDate: new Date(`${created.today}T00:00:00`),
    slotTime: '09:30',
    estimatedStartTime: new Date(`${created.today}T09:30:00`),
    estimatedDuration: 20,
    source: 'online',
    status: 'booked'
  });

  await request(baseUrl, '/api/admin/queue/live', { cookie });
  await request(baseUrl, `/api/admin/appointments/${current._id}/complete`, { method: 'PATCH', cookie });
  await request(baseUrl, `/api/admin/appointments/${waiting._id}/check-in`, { method: 'PATCH', cookie });
  await request(baseUrl, `/api/admin/appointments/${waiting._id}/start`, {
    method: 'PATCH',
    cookie,
    body: { staffId: created.rahul._id.toString() }
  });
  await request(baseUrl, `/api/admin/appointments/${waiting._id}/complete`, { method: 'PATCH', cookie });

  await request(baseUrl, `/api/admin/appointments/${lateCandidate._id}/late`, { method: 'PATCH', cookie });
  await request(baseUrl, `/api/admin/appointments/${lateCandidate._id}/skip`, { method: 'PATCH', cookie });
  await request(baseUrl, `/api/admin/appointments/${lateCandidate._id}/no-show`, { method: 'PATCH', cookie });

  setClock(created.today, '10:10');
  const self = await Appointment.create({
    bookingReference: `${tag}-SELFCHECK`,
    customerName: `${tag} Self Check`,
    customerPhone: '+919700001006',
    service: created.haircut._id,
    staff: created.aman._id,
    preferredStaff: created.aman._id,
    bookingDate: new Date(`${created.today}T00:00:00`),
    slotTime: '10:15',
    estimatedStartTime: new Date(`${created.today}T10:15:00`),
    estimatedDuration: 20,
    source: 'online',
    status: 'booked'
  });
  await request(baseUrl, '/api/appointments/self-check-in', {
    method: 'POST',
    body: { bookingReference: self.bookingReference, phone: '+919700001006' }
  });

  await new Promise((resolve) => setTimeout(resolve, 200));
  assert(events.some((event) => event.eventName === 'queue:updated'), 'Socket queue update event was not emitted');
  assert(events.some((event) => event.eventName === 'appointment:updated'), 'Socket appointment update event was not emitted');
}

async function run() {
  await mongoose.connect(env.mongoUri);
  await Appointment.syncIndexes();
  await Notification.syncIndexes();
  await seedBase();

  const server = await startServer();
  const events = [];
  const socket = await connectAdminSocket(server.baseUrl, events);

  try {
    const cookie = await login(server.baseUrl);
    await publicSmoke(server.baseUrl);
    await adminCrudSmoke(server.baseUrl, cookie);
    await bookingSmoke(server.baseUrl, cookie);
    await liveQueueSmoke(server.baseUrl, cookie, events);
    await request(server.baseUrl, '/api/admin/auth/logout', { method: 'POST', cookie });

    console.log('All feature smoke checks passed.');
    console.log(
      JSON.stringify(
        {
          publicWebsite: true,
          adminAuth: true,
          adminCrud: true,
          booking: true,
          tracking: true,
          cancellationRescheduling: true,
          queueActions: true,
          sockets: [...new Set(events.map((event) => event.eventName))]
        },
        null,
        2
      )
    );
  } finally {
    socket.close();
    await server.close();
    await cleanup();
    await mongoose.disconnect();
  }
}

run().catch(async (error) => {
  try {
    await cleanup();
    await mongoose.disconnect();
  } catch {
    // Ignore cleanup failures while reporting the original issue.
  }

  console.error('All feature smoke checks failed.');
  console.error(error.message);
  process.exit(1);
});
