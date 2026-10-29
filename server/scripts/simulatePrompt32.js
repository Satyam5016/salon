process.env.TZ = 'Asia/Kolkata';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const RealDate = Date;
process.env.BLISS_TEST_NOW = '2026-08-28T11:45:00+05:30';

function setClock(isoString) {
  process.env.BLISS_TEST_NOW = isoString;
}

function restoreClock() {
  delete process.env.BLISS_TEST_NOW;
}

const { default: http } = await import('http');
const { Server } = await import('socket.io');
const mongoose = (await import('mongoose')).default;
const bcrypt = (await import('bcryptjs')).default;
const { io: createSocketClient } = await import('../../client/node_modules/socket.io-client/build/esm/index.js');

const app = (await import('../app.js')).default;
const { env } = await import('../config/env.js');
const { configureSocket } = await import('../socket/index.js');
const Admin = (await import('../models/Admin.js')).default;
const Appointment = (await import('../models/Appointment.js')).default;
const Notification = (await import('../models/Notification.js')).default;
const SalonSettings = (await import('../models/SalonSettings.js')).default;
const Service = (await import('../models/Service.js')).default;
const Staff = (await import('../models/Staff.js')).default;

const scenarioDate = '2026-08-28';
const tag = 'SIM-P32';
const adminEmail = 'sim-p32-admin@bliss.local';
const adminPassword = 'Admin@12345';
const people = {};
let originalSettings = null;

function at(time) {
  return new RealDate(`${scenarioDate}T${time}:00+05:30`);
}

function dayStart() {
  return at('00:00');
}

function formatTime(date) {
  if (!date) return '-';
  return new RealDate(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata'
  });
}

function compactQueue(queue) {
  return {
    currentServices: queue.currentServices.map((item) => ({
      customer: item.customerName,
      status: item.status,
      staff: item.staff?.name,
      remaining: item.expectedRemainingMinutes
    })),
    waitingQueue: queue.waitingQueue.map((item) => ({
      pos: item.queuePosition,
      customer: item.customerName,
      status: item.status,
      ahead: item.customersAhead,
      wait: item.estimatedWaitMinutes,
      eta: formatTime(item.estimatedStartTime)
    }))
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function findByCustomer(queue, customerName) {
  return [...queue.currentServices, ...queue.waitingQueue].find((item) => item.customerName === customerName);
}

function expectStatus(queue, customerName, status) {
  const item = findByCustomer(queue, customerName);
  assert(item, `${customerName} missing from queue`);
  assert(item.status === status, `${customerName} expected ${status}, got ${item.status}`);
  return item;
}

function expectWaitingOrder(queue, expectedNames) {
  const actual = queue.waitingQueue.map((item) => item.customerName);
  assert(
    expectedNames.every((name, index) => actual[index] === name),
    `Expected waiting order ${expectedNames.join(' > ')}, got ${actual.join(' > ')}`
  );
}

async function describeScenarioAppointments() {
  return Appointment.find({ bookingReference: new RegExp(`^${tag}-`) })
    .select('customerName bookingReference status bookingDate slotTime queuePosition arrivalTime staff')
    .sort({ bookingReference: 1 })
    .lean();
}

async function cleanupScenario() {
  await Notification.deleteMany({ bookingReference: new RegExp(`^${tag}-`) });
  await Appointment.deleteMany({ bookingReference: new RegExp(`^${tag}-`) });
  await Appointment.deleteMany({
    customerPhone: '+919877777777',
    notes: 'Prompt 32 fair re-entry customer'
  });
  await Staff.deleteMany({ email: new RegExp(`^${tag.toLowerCase()}-`) });
  await Service.deleteOne({ slug: `${tag.toLowerCase()}-haircut` });
  await Admin.deleteOne({ email: adminEmail });

  if (originalSettings) {
    const { _id, __v, createdAt, updatedAt, ...settings } = originalSettings;
    await SalonSettings.findOneAndUpdate({}, settings, { upsert: true, runValidators: true });
  }
}

async function seedScenario() {
  originalSettings = await SalonSettings.findOne().lean();
  await cleanupScenario();

  const admin = await Admin.create({
    name: 'Prompt 32 Admin',
    email: adminEmail,
    password: adminPassword,
    role: 'admin'
  });

  const service = await Service.create({
    name: `${tag} Haircut`,
    slug: `${tag.toLowerCase()}-haircut`,
    description: 'Controlled haircut service for prompt 32 live queue simulation.',
    category: 'Hair',
    price: 300,
    durationMinutes: 20,
    image: '',
    active: true
  });

  const staff = await Staff.insertMany([
    {
      name: 'Rahul',
      phone: '+919800000001',
      email: `${tag.toLowerCase()}-rahul@bliss.local`,
      specialization: 'Hair stylist',
      services: [service._id],
      workingDays: ['friday'],
      workingHours: { start: '09:00', end: '20:00' },
      active: true
    },
    {
      name: 'Aman',
      phone: '+919800000002',
      email: `${tag.toLowerCase()}-aman@bliss.local`,
      specialization: 'Hair stylist',
      services: [service._id],
      workingDays: ['friday'],
      workingHours: { start: '09:00', end: '20:00' },
      active: true
    },
    {
      name: 'Meera',
      phone: '+919800000003',
      email: `${tag.toLowerCase()}-meera@bliss.local`,
      specialization: 'Hair stylist',
      services: [service._id],
      workingDays: ['friday'],
      workingHours: { start: '09:00', end: '20:00' },
      active: true
    }
  ]);

  service.availableStaff = staff.map((member) => member._id);
  await service.save();

  await SalonSettings.findOneAndUpdate(
    {},
    {
      salonName: 'Bliss Beauty Salon',
      phone: '+91 98000 00000',
      whatsapp: '+91 98000 00000',
      email: 'hello@bliss.local',
      address: 'Prompt 32 Test Lane',
      openingTime: '09:00',
      closingTime: '20:00',
      bookingIntervalMinutes: 20,
      gracePeriodMinutes: 5,
      notificationThresholdMinutes: 15,
      selfCheckInWindowMinutes: 30,
      cancellationCutoffMinutes: 60,
      timezone: 'Asia/Kolkata',
      numberOfChairs: 3,
      maxAdvanceBookingDays: 60
    },
    { upsert: true, new: true, runValidators: true }
  );

  const hashed = await bcrypt.hash(adminPassword, 12);
  await Admin.updateOne({ _id: admin._id }, { $set: { password: hashed } });

  const appointments = await Appointment.insertMany([
    {
      bookingReference: `${tag}-ANUJ`,
      customerName: 'Anuj',
      customerPhone: '+919811111111',
      service: service._id,
      staff: staff[0]._id,
      bookingDate: dayStart(),
      slotTime: '11:25',
      estimatedStartTime: at('11:25'),
      estimatedDuration: 20,
      source: 'walk-in',
      status: 'in_service',
      arrivalTime: at('11:20'),
      serviceStartTime: at('11:25')
    },
    {
      bookingReference: `${tag}-RAHUL-CUSTOMER`,
      customerName: 'Rahul',
      customerPhone: '+919822222222',
      service: service._id,
      staff: staff[1]._id,
      bookingDate: dayStart(),
      slotTime: '11:30',
      estimatedStartTime: at('11:30'),
      estimatedDuration: 20,
      source: 'walk-in',
      status: 'in_service',
      arrivalTime: at('11:20'),
      serviceStartTime: at('11:30')
    },
    {
      bookingReference: `${tag}-AMAN-CUSTOMER`,
      customerName: 'Aman',
      customerPhone: '+919833333333',
      service: service._id,
      staff: staff[2]._id,
      bookingDate: dayStart(),
      slotTime: '11:35',
      estimatedStartTime: at('11:35'),
      estimatedDuration: 20,
      source: 'walk-in',
      status: 'in_service',
      arrivalTime: at('11:25'),
      serviceStartTime: at('11:35')
    },
    {
      bookingReference: `${tag}-SHIVAM`,
      customerName: 'Shivam',
      customerPhone: '+919844444444',
      service: service._id,
      staff: staff[0]._id,
      preferredStaff: staff[0]._id,
      bookingDate: dayStart(),
      slotTime: '11:45',
      estimatedStartTime: at('11:45'),
      estimatedDuration: 20,
      source: 'walk-in',
      status: 'arrived',
      queuePosition: 1,
      arrivalTime: at('11:45')
    },
    {
      bookingReference: `${tag}-SATYAM`,
      customerName: 'Satyam',
      customerPhone: '+919855555555',
      service: service._id,
      staff: staff[0]._id,
      preferredStaff: staff[0]._id,
      bookingDate: dayStart(),
      slotTime: '12:00',
      estimatedStartTime: at('12:00'),
      estimatedDuration: 20,
      source: 'online',
      status: 'booked'
    },
    {
      bookingReference: `${tag}-ROHAN`,
      customerName: 'Rohan',
      customerPhone: '+919866666666',
      service: service._id,
      staff: staff[0]._id,
      preferredStaff: staff[0]._id,
      bookingDate: dayStart(),
      slotTime: '12:20',
      estimatedStartTime: at('12:20'),
      estimatedDuration: 20,
      source: 'online',
      status: 'booked'
    }
  ]);

  people.admin = admin;
  people.service = service;
  people.staffRahul = staff[0];
  people.anuj = appointments[0];
  people.shivam = appointments[3];
  people.satyam = appointments[4];
  people.rohan = appointments[5];
}

async function startTestServer() {
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: env.clientUrl,
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

async function request(baseUrl, path, { method = 'GET', body, cookie } = {}) {
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
  if (!response.ok) {
    throw new Error(`${method} ${path} failed ${response.status}: ${json.message || text}`);
  }
  return {
    json,
    cookie: response.headers.get('set-cookie')?.split(';')[0]
  };
}

async function liveQueue(baseUrl, cookie) {
  const { json } = await request(baseUrl, `/api/admin/queue/live?date=${scenarioDate}`, { cookie });
  return json.queue;
}

async function action(baseUrl, cookie, appointment, endpoint, body) {
  const { json } = await request(baseUrl, `/api/admin/appointments/${appointment._id}/${endpoint}`, {
    method: 'PATCH',
    cookie,
    body
  });
  return json;
}

function connectSockets(baseUrl, events) {
  const adminSocket = createSocketClient(baseUrl, { transports: ['websocket'], forceNew: true });
  const satyamSocket = createSocketClient(baseUrl, { transports: ['websocket'], forceNew: true });

  for (const eventName of ['queue:updated', 'appointment:updated', 'staff:availability', 'notification']) {
    adminSocket.on(eventName, (payload) => events.push({ room: 'admin', eventName, payload }));
  }

  for (const eventName of ['appointment:updated', 'appointment:your-turn', 'appointment:next', 'notification']) {
    satyamSocket.on(eventName, (payload) => events.push({ room: 'satyam', eventName, payload }));
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Socket clients did not connect in time')), 4000);
    let connected = 0;
    function onConnect() {
      connected += 1;
      if (connected === 2) {
        clearTimeout(timeout);
        adminSocket.emit('join:admin');
        satyamSocket.emit('join:appointment', `${tag}-SATYAM`);
        setTimeout(() => resolve([adminSocket, satyamSocket]), 100);
      }
    }
    adminSocket.on('connect', onConnect);
    satyamSocket.on('connect', onConnect);
  });
}

async function createKiranWalkIn(baseUrl, cookie) {
  const { json } = await request(baseUrl, '/api/admin/walk-ins', {
    method: 'POST',
    cookie,
    body: {
      customerName: 'Kiran',
      customerPhone: '+919877777777',
      serviceId: people.service._id.toString(),
      staffId: people.staffRahul._id.toString(),
      notes: 'Prompt 32 fair re-entry customer'
    }
  });

  people.kiran = await Appointment.findById(json.appointment.id);
  assert(people.kiran, 'Kiran walk-in was not persisted');
  assert(people.kiran.status === 'arrived', `Kiran expected arrived, got ${people.kiran.status}`);
  return json;
}

async function run() {
  await mongoose.connect(env.mongoUri);
  await Appointment.syncIndexes();
  await Notification.syncIndexes();
  await seedScenario();

  const server = await startTestServer();
  const events = [];
  const sockets = await connectSockets(server.baseUrl, events);

  try {
    const login = await request(server.baseUrl, '/api/admin/auth/login', {
      method: 'POST',
      body: { email: adminEmail, password: adminPassword }
    });
    const cookie = login.cookie;
    assert(cookie, 'Admin login did not return auth cookie');

    const stages = [];
    let queue = await liveQueue(server.baseUrl, cookie);
    expectStatus(queue, 'Anuj', 'in_service');
    expectStatus(queue, 'Rahul', 'in_service');
    expectStatus(queue, 'Aman', 'in_service');
    expectStatus(queue, 'Shivam', 'arrived');
    expectWaitingOrder(queue, ['Shivam', 'Satyam', 'Rohan']);
    stages.push(['11:45 seeded', compactQueue(queue)]);

    await action(server.baseUrl, cookie, people.anuj, 'complete');
    queue = await liveQueue(server.baseUrl, cookie);
    expectStatus(queue, 'Shivam', 'arrived');
    stages.push(['Anuj completes', compactQueue(queue)]);

    await action(server.baseUrl, cookie, people.shivam, 'start', { staffId: people.staffRahul._id.toString() });
    queue = await liveQueue(server.baseUrl, cookie);
    const satyamNext = expectStatus(queue, 'Satyam', 'booked');
    assert(satyamNext.queuePosition === 1, `Satyam should be first waiting, got ${satyamNext.queuePosition}`);
    assert(satyamNext.estimatedWaitMinutes > 0, 'Satyam should be next but still waiting while Shivam is in service');
    stages.push(['Shivam starts; Satyam next', compactQueue(queue)]);

    await new Promise((resolve) => setTimeout(resolve, 200));
    assert(
      events.some((event) => event.room === 'satyam' && event.eventName === 'appointment:next'),
      'Satyam did not receive appointment:next start-coming socket event'
    );

    setClock('2026-08-28T12:05:00+05:30');
    await action(server.baseUrl, cookie, people.shivam, 'complete');
    queue = await liveQueue(server.baseUrl, cookie);
    const satyamTurn = expectStatus(queue, 'Satyam', 'notified');
    assert(satyamTurn.estimatedWaitMinutes === 0, `Satyam should be immediately callable, got wait ${satyamTurn.estimatedWaitMinutes}`);
    stages.push(['Shivam completes; Satyam turn available', compactQueue(queue)]);

    await new Promise((resolve) => setTimeout(resolve, 200));
    assert(
      events.some((event) => event.room === 'satyam' && event.eventName === 'appointment:your-turn'),
      'Satyam did not receive appointment:your-turn socket event'
    );

    await action(server.baseUrl, cookie, people.satyam, 'skip');
    queue = await liveQueue(server.baseUrl, cookie);
    expectStatus(queue, 'Satyam', 'skipped');
    stages.push(['Satyam skipped', compactQueue(queue)]);

    setClock('2026-08-28T12:06:00+05:30');
    await createKiranWalkIn(server.baseUrl, cookie);
    queue = await liveQueue(server.baseUrl, cookie);
    if (!queue.waitingQueue.some((item) => item.customerName === 'Kiran')) {
      console.log('Persisted scenario appointments when Kiran was missing from queue:');
      console.table(await describeScenarioAppointments());
      console.log('Queue snapshot:', compactQueue(queue));
    }
    expectWaitingOrder(queue, ['Kiran', 'Satyam', 'Rohan']);
    stages.push(['Kiran arrives after skip', compactQueue(queue)]);

    await action(server.baseUrl, cookie, people.kiran, 'start', { staffId: people.staffRahul._id.toString() });
    queue = await liveQueue(server.baseUrl, cookie);
    const satyamSkippedBehind = expectStatus(queue, 'Satyam', 'skipped');
    assert(satyamSkippedBehind.estimatedWaitMinutes > 0, 'Satyam should wait behind Kiran after being skipped');
    stages.push(['Kiran starts; Satyam still skipped', compactQueue(queue)]);

    setClock('2026-08-28T12:08:00+05:30');
    await action(server.baseUrl, cookie, people.satyam, 'check-in');
    queue = await liveQueue(server.baseUrl, cookie);
    const satyamArrived = expectStatus(queue, 'Satyam', 'arrived');
    assert(satyamArrived.estimatedWaitMinutes > 0, 'Checked-in Satyam should still wait for Rahul to be free');
    stages.push(['Satyam arrives late and is checked in fairly', compactQueue(queue)]);

    setClock('2026-08-28T12:26:00+05:30');
    await action(server.baseUrl, cookie, people.kiran, 'complete');
    queue = await liveQueue(server.baseUrl, cookie);
    const satyamReady = expectStatus(queue, 'Satyam', 'arrived');
    assert(satyamReady.estimatedWaitMinutes === 0, `Satyam should be ready after Kiran completes, got ${satyamReady.estimatedWaitMinutes}`);
    stages.push(['Kiran completes; Satyam ready', compactQueue(queue)]);

    await action(server.baseUrl, cookie, people.satyam, 'start', { staffId: people.staffRahul._id.toString() });
    queue = await liveQueue(server.baseUrl, cookie);
    expectStatus(queue, 'Satyam', 'in_service');
    stages.push(['Satyam starts haircut', compactQueue(queue)]);

    setClock('2026-08-28T12:46:00+05:30');
    await action(server.baseUrl, cookie, people.satyam, 'complete');
    const satyamDone = await Appointment.findById(people.satyam._id);
    assert(satyamDone.status === 'completed', `Satyam expected completed, got ${satyamDone.status}`);
    queue = await liveQueue(server.baseUrl, cookie);
    stages.push(['Satyam completes haircut', compactQueue(queue)]);

    const notifications = await Notification.find({ bookingReference: `${tag}-SATYAM` }).sort({ createdAt: 1 });
    const notificationTypes = notifications.map((notification) => notification.type);
    for (const type of ['one_customer_ahead', 'turn_available', 'customer_skipped']) {
      assert(notificationTypes.includes(type), `Missing Satyam notification ${type}`);
    }

    console.log('\nPrompt 32 live queue simulation passed.\n');
    for (const [label, snapshot] of stages) {
      console.log(label);
      console.table(snapshot.currentServices);
      console.table(snapshot.waitingQueue);
    }
    console.log('Satyam notifications:', notificationTypes.join(', '));
    console.log(
      'Socket events:',
      events.reduce((summary, event) => {
        const key = `${event.room}:${event.eventName}`;
        summary[key] = (summary[key] || 0) + 1;
        return summary;
      }, {})
    );
  } finally {
    sockets.forEach((socket) => socket.close());
    await server.close();
    await cleanupScenario();
    await mongoose.disconnect();
    restoreClock();
  }
}

run().catch(async (error) => {
  restoreClock();
  try {
    await mongoose.disconnect();
  } catch {
    // Ignore disconnect failures during a failed simulation startup.
  }
  console.error('\nPrompt 32 live queue simulation failed.');
  console.error(error.message);
  process.exit(1);
});
