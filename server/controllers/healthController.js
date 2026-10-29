export function getHealth(_req, res) {
  res.status(200).json({
    success: true,
    message: 'Bliss Beauty Salon API is running'
  });
}
