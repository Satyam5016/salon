export function now() {
  return process.env.BLISS_TEST_NOW ? new Date(process.env.BLISS_TEST_NOW) : new Date();
}
