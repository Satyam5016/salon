import Staff from '../models/Staff.js';
import Service from '../models/Service.js';
import { assertValidObjectId } from '../utils/objectId.js';

const staffPopulate = {
  path: 'services',
  select: 'name slug category price durationMinutes active'
};

function normalizeServiceIds(services = []) {
  if (!Array.isArray(services)) return [];
  return [
    ...new Set(
      services.filter(Boolean).map((id) => {
        assertValidObjectId(id, 'service id');
        return id.toString();
      })
    )
  ];
}

function staffPayload(body) {
  const payload = {
    name: body.name,
    phone: body.phone,
    email: body.email,
    photo: body.photo,
    specialization: body.specialization,
    services: normalizeServiceIds(body.services),
    workingDays: body.workingDays,
    workingHours: body.workingHours,
    active: body.active
  };

  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);
  return payload;
}

async function syncServiceStaffAssignments(staffId, serviceIds) {
  await Service.updateMany({ availableStaff: staffId }, { $pull: { availableStaff: staffId } });

  if (serviceIds.length > 0) {
    await Service.updateMany({ _id: { $in: serviceIds } }, { $addToSet: { availableStaff: staffId } });
  }
}

export async function listPublicStaff(_req, res, next) {
  try {
    const staff = await Staff.find({ active: true })
      .populate(staffPopulate)
      .select('name photo specialization services workingDays workingHours active')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: staff.length,
      staff
    });
  } catch (error) {
    next(error);
  }
}

export async function listAdminStaff(_req, res, next) {
  try {
    const staff = await Staff.find().populate(staffPopulate).sort({ active: -1, name: 1 });

    res.status(200).json({
      success: true,
      count: staff.length,
      staff
    });
  } catch (error) {
    next(error);
  }
}

export async function createStaff(req, res, next) {
  try {
    const payload = staffPayload(req.body);
    const staff = await Staff.create(payload);
    await syncServiceStaffAssignments(staff._id, payload.services || []);

    const populatedStaff = await Staff.findById(staff._id).populate(staffPopulate);

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      staff: populatedStaff
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(409);
      return next(new Error('A staff member with this email already exists'));
    }

    return next(error);
  }
}

export async function updateStaff(req, res, next) {
  try {
    const payload = staffPayload(req.body);
    const staff = await Staff.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    }).populate(staffPopulate);

    if (!staff) {
      res.status(404);
      throw new Error('Staff member not found');
    }

    if (payload.services) {
      await syncServiceStaffAssignments(staff._id, payload.services);
    }

    const populatedStaff = await Staff.findById(staff._id).populate(staffPopulate);

    res.status(200).json({
      success: true,
      message: 'Staff member updated successfully',
      staff: populatedStaff
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(409);
      return next(new Error('A staff member with this email already exists'));
    }

    return next(error);
  }
}

export async function deleteStaff(req, res, next) {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);

    if (!staff) {
      res.status(404);
      throw new Error('Staff member not found');
    }

    await Service.updateMany({ availableStaff: staff._id }, { $pull: { availableStaff: staff._id } });

    res.status(200).json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

export async function updateStaffStatus(req, res, next) {
  try {
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { active: Boolean(req.body.active) },
      { new: true, runValidators: true }
    ).populate(staffPopulate);

    if (!staff) {
      res.status(404);
      throw new Error('Staff member not found');
    }

    res.status(200).json({
      success: true,
      message: `Staff member ${staff.active ? 'activated' : 'deactivated'} successfully`,
      staff
    });
  } catch (error) {
    next(error);
  }
}
