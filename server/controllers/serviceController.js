import Service from '../models/Service.js';
import Staff from '../models/Staff.js';
import { assertValidObjectId } from '../utils/objectId.js';
import { slugify } from '../utils/slugify.js';

const servicePopulate = {
  path: 'availableStaff',
  select: 'name specialization photo active'
};

const publicServicePopulate = {
  path: 'availableStaff',
  select: 'name specialization photo'
};

function normalizeStaffIds(availableStaff = []) {
  if (!Array.isArray(availableStaff)) return [];
  return [
    ...new Set(
      availableStaff.filter(Boolean).map((id) => {
        assertValidObjectId(id, 'staff id');
        return id.toString();
      })
    )
  ];
}

function servicePayload(body) {
  const payload = {
    name: body.name,
    slug: body.slug || (body.name ? slugify(body.name) : undefined),
    description: body.description,
    category: body.category,
    price: body.price,
    durationMinutes: body.durationMinutes,
    image: body.image,
    active: body.active,
    availableStaff: normalizeStaffIds(body.availableStaff)
  };

  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);
  return payload;
}

async function syncStaffServiceAssignments(serviceId, staffIds) {
  await Staff.updateMany({ services: serviceId }, { $pull: { services: serviceId } });

  if (staffIds.length > 0) {
    await Staff.updateMany({ _id: { $in: staffIds } }, { $addToSet: { services: serviceId } });
  }
}

export async function listPublicServices(_req, res, next) {
  try {
    const services = await Service.find({ active: true })
      .populate(publicServicePopulate)
      .select('name slug description category price durationMinutes image active availableStaff')
      .sort({ category: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: services.length,
      services
    });
  } catch (error) {
    next(error);
  }
}

export async function listAdminServices(_req, res, next) {
  try {
    const services = await Service.find().populate(servicePopulate).sort({ active: -1, category: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: services.length,
      services
    });
  } catch (error) {
    next(error);
  }
}

export async function getServiceById(req, res, next) {
  try {
    const service = await Service.findOne({ _id: req.params.id, active: true })
      .populate(publicServicePopulate)
      .select('name slug description category price durationMinutes image active availableStaff');

    if (!service) {
      res.status(404);
      throw new Error('Service not found');
    }

    res.status(200).json({
      success: true,
      service
    });
  } catch (error) {
    next(error);
  }
}

export async function createService(req, res, next) {
  try {
    const payload = servicePayload(req.body);
    const service = await Service.create(payload);
    await syncStaffServiceAssignments(service._id, payload.availableStaff || []);

    const populatedService = await Service.findById(service._id).populate(servicePopulate);

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service: populatedService
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(409);
      return next(new Error('A service with this slug already exists'));
    }

    return next(error);
  }
}

export async function updateService(req, res, next) {
  try {
    const payload = servicePayload(req.body);

    const service = await Service.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    }).populate(servicePopulate);

    if (!service) {
      res.status(404);
      throw new Error('Service not found');
    }

    if (payload.availableStaff) {
      await syncStaffServiceAssignments(service._id, payload.availableStaff);
    }

    const populatedService = await Service.findById(service._id).populate(servicePopulate);

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      service: populatedService
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(409);
      return next(new Error('A service with this slug already exists'));
    }

    return next(error);
  }
}

export async function deleteService(req, res, next) {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);

    if (!service) {
      res.status(404);
      throw new Error('Service not found');
    }

    await Staff.updateMany({ services: service._id }, { $pull: { services: service._id } });

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

export async function updateServiceStatus(req, res, next) {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { active: Boolean(req.body.active) },
      { new: true, runValidators: true }
    ).populate(servicePopulate);

    if (!service) {
      res.status(404);
      throw new Error('Service not found');
    }

    res.status(200).json({
      success: true,
      message: `Service ${service.active ? 'activated' : 'deactivated'} successfully`,
      service
    });
  } catch (error) {
    next(error);
  }
}
