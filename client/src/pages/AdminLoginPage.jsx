import { Eye, EyeOff, LoaderCircle, LockKeyhole, Scissors } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { adminAuthApi } from '../services/adminAuthApi.js';
import { useAdminAuthStore } from '../store/useAdminAuthStore.js';

const initialForm = {
  email: '',
  password: ''
};

function validateForm(form) {
  const errors = {};

  if (!form.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
    errors.email = 'Enter a valid email';
  }

  if (!form.password) {
    errors.password = 'Password is required';
  }

  return errors;
}

function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, setAdmin } = useAdminAuthStore();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/admin/dashboard';

  if (isAuthenticated) {
    return <Navigate replace to="/admin/dashboard" />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setServerError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    setServerError('');

    try {
      const { admin } = await adminAuthApi.login({
        email: form.email.trim(),
        password: form.password
      });

      setAdmin(admin);
      navigate(from, { replace: true });
    } catch (error) {
      setServerError(error.response?.data?.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-ivory lg:grid-cols-[0.95fr_1.05fr]">
      <section className="relative hidden overflow-hidden bg-ink text-white lg:block">
        <img
          className="absolute inset-0 h-full w-full object-cover opacity-55"
          src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1600&q=85"
          alt="Bliss Beauty Salon interior"
        />
        <div className="absolute inset-0 bg-ink/55" aria-hidden="true" />
        <div className="relative flex min-h-screen flex-col justify-between p-12">
          <Link className="flex items-center gap-3" to="/">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-blush">
              <Scissors className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-bold">Bliss Beauty Salon</span>
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-champagne">Admin portal</p>
            <h1 className="mt-4 max-w-xl text-5xl font-bold tracking-normal">Manage the salon day with confidence.</h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-white/80">
              Secure access for bookings, queue visibility, staff availability, and salon operations.
            </p>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <Link className="mx-auto mb-6 flex w-fit items-center gap-3 lg:mx-0" to="/">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-ink text-white">
                <Scissors className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="font-bold text-ink">Bliss Beauty</span>
            </Link>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-mist text-blush lg:mx-0">
              <LockKeyhole className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="mt-5 text-3xl font-bold tracking-normal text-ink">Admin login</h1>
            <p className="mt-2 text-sm leading-6 text-neutral-600">Sign in with your salon admin credentials.</p>
          </div>

          <form className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6" onSubmit={handleSubmit}>
            {serverError ? (
              <div className="mb-5 rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-100">
                {serverError}
              </div>
            ) : null}

            <label className="grid gap-2 text-sm font-semibold text-ink">
              Email
              <input
                className={`min-h-12 rounded-md border px-4 font-normal outline-none transition focus:border-blush focus:ring-2 focus:ring-blush/20 ${
                  errors.email ? 'border-red-400' : 'border-neutral-300'
                }`}
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@blissbeautysalon.com"
              />
              {errors.email ? <span className="text-xs font-semibold text-red-600">{errors.email}</span> : null}
            </label>

            <label className="mt-5 grid gap-2 text-sm font-semibold text-ink">
              Password
              <span className="relative">
                <input
                  className={`min-h-12 w-full rounded-md border px-4 pr-12 font-normal outline-none transition focus:border-blush focus:ring-2 focus:ring-blush/20 ${
                    errors.password ? 'border-red-400' : 'border-neutral-300'
                  }`}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                />
                <button
                  className="absolute right-1 top-1 inline-flex h-10 w-10 items-center justify-center rounded-md text-neutral-500 transition hover:bg-mist hover:text-ink"
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                </button>
              </span>
              {errors.password ? <span className="text-xs font-semibold text-red-600">{errors.password}</span> : null}
            </label>

            <button
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-blush px-5 py-3 text-sm font-semibold text-white transition hover:bg-rosewood disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={loading}
            >
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LockKeyhole className="h-4 w-4" aria-hidden="true" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default AdminLoginPage;
