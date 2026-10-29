import { listCustomerHistory } from '../services/customerService.js';

export async function listCustomers(req, res, next) {
  try {
    const customers = await listCustomerHistory(req.query);

    res.status(200).json({
      success: true,
      count: customers.length,
      customers
    });
  } catch (error) {
    next(error);
  }
}
