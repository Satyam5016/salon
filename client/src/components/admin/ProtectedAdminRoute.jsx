import { LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { adminAuthApi } from '../../services/adminAuthApi.js';
import { useAdminAuthStore } from '../../store/useAdminAuthStore.js';

function ProtectedAdminRoute() {
  const location = useLocation();
  const { isAuthenticated, setAdmin, clearAdmin } = useAdminAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    adminAuthApi
      .me()
      .then(({ admin }) => {
        if (active) setAdmin(admin);
      })
      .catch(() => {
        if (active) clearAdmin();
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [clearAdmin, setAdmin]);

  if (checking) {
    return (
      <main className="grid min-h-screen place-items-center bg-ivory px-4">
        <div className="flex items-center gap-3 rounded-lg bg-white px-5 py-4 text-sm font-semibold text-ink shadow-sm ring-1 ring-neutral-200">
          <LoaderCircle className="h-5 w-5 animate-spin text-blush" aria-hidden="true" />
          Checking admin session
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/admin/login" />;
  }

  return <Outlet />;
}

export default ProtectedAdminRoute;
