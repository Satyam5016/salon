import Offer from '../models/Offer.js';

const publicSelect = 'title value detail expires image sortOrder';
const editableFields = ['title', 'value', 'detail', 'expires', 'image', 'active', 'sortOrder'];

function offerPayload(body) {
  const payload = {};
  editableFields.forEach((field) => {
    if (body[field] !== undefined) payload[field] = field === 'sortOrder' ? Number(body[field]) : body[field];
  });
  return payload;
}

export async function listPublicOffers(_req, res, next) {
  try {
    const offers = await Offer.find({ active: true }).select(publicSelect).sort({ sortOrder: 1, createdAt: -1 });
    res.status(200).json({ success: true, count: offers.length, offers });
  } catch (error) {
    next(error);
  }
}

export async function listAdminOffers(_req, res, next) {
  try {
    const offers = await Offer.find().sort({ active: -1, sortOrder: 1, createdAt: -1 });
    res.status(200).json({ success: true, count: offers.length, offers });
  } catch (error) {
    next(error);
  }
}

export async function createOffer(req, res, next) {
  try {
    const offer = await Offer.create(offerPayload(req.body));
    res.status(201).json({ success: true, message: 'Offer created successfully', offer });
  } catch (error) {
    next(error);
  }
}

export async function updateOffer(req, res, next) {
  try {
    const offer = await Offer.findByIdAndUpdate(req.params.id, offerPayload(req.body), { new: true, runValidators: true });
    if (!offer) {
      res.status(404);
      throw new Error('Offer not found');
    }
    res.status(200).json({ success: true, message: 'Offer updated successfully', offer });
  } catch (error) {
    next(error);
  }
}

export async function deleteOffer(req, res, next) {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) {
      res.status(404);
      throw new Error('Offer not found');
    }
    res.status(200).json({ success: true, message: 'Offer deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function updateOfferStatus(req, res, next) {
  try {
    const offer = await Offer.findByIdAndUpdate(req.params.id, { active: Boolean(req.body.active) }, { new: true });
    if (!offer) {
      res.status(404);
      throw new Error('Offer not found');
    }
    res.status(200).json({ success: true, message: `Offer ${offer.active ? 'activated' : 'deactivated'} successfully`, offer });
  } catch (error) {
    next(error);
  }
}
