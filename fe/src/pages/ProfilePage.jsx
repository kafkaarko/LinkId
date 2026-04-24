import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function formatJoinDate(isoDate) {
  try {
    return new Date(isoDate).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

function MetaCard({ label, value }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.22em] text-white/38">{label}</p>
      <p className="mt-3 text-lg font-medium text-white">{value}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { isAuthenticated, updateProfile, user } = useAuth();
  const [form, setForm] = useState({
    name: '',
    bio: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) return;

    setForm({
      name: user.name ?? '',
      bio: user.bio ?? '',
    });
  }, [user]);

  const profileMeta = useMemo(
    () => [
      {
        label: 'Role',
        value: user?.role ?? '-',
      },
      {
        label: 'Plan',
        value: user?.plan ?? '-',
      },
      {
        label: 'Joined',
        value: formatJoinDate(user?.joinedAt),
      },
    ],
    [user],
  );

  if (!isAuthenticated) {
    return (
      <section className="grid min-h-[calc(100vh-8rem)] place-items-center">
        <div className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-white/[0.03] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <span className="badge badge-neutral border-white/10 bg-white/[0.06] px-3 py-3 text-[11px] uppercase tracking-[0.18em] text-white/65">
            Profile Locked
          </span>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-white">
            Belum ada user aktif.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-white/58">
            Klik login atau register dari sidebar dulu, lalu card user di bawah sidebar
            otomatis akan bisa ditekan dan mengarah ke halaman profile ini.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/login"
              className="btn btn-primary rounded-2xl border-0 bg-white text-black hover:bg-white/90"
            >
              Go to Login
            </Link>
            <Link
              to="/register"
              className="btn btn-ghost rounded-2xl border border-white/10 bg-white/[0.04] font-normal text-white hover:border-white/20 hover:bg-white/[0.08]"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    updateProfile(form);
    setMessage('Profil berhasil diperbarui.');
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="badge badge-neutral border-white/10 bg-white/[0.06] px-3 py-3 text-[11px] uppercase tracking-[0.18em] text-white/65">
              User Profile
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              {user?.name}
            </h2>
            <p className="mt-2 text-sm text-white/52">{user?.email}</p>
          </div>

          <div className="avatar placeholder">
            <div className="h-24 w-24 rounded-[32px] border border-white/10 bg-white/[0.06] text-3xl font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <span>{user?.name?.slice(0, 1)?.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-8">
          <div>
            <h3 className="text-xl font-semibold text-white">Edit profile</h3>
            <p className="mt-1 text-sm text-white/48">
              User card di sidebar mengambil data dari profil ini.
            </p>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="form-control w-full">
              <span className="mb-2 text-sm text-white/55">Display name</span>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="input h-14 w-full rounded-2xl border-white/10 bg-[#090909] text-white placeholder:text-white/25 focus:border-white/20 focus:outline-none"
              />
            </label>

            <label className="form-control w-full">
              <span className="mb-2 text-sm text-white/55">Bio</span>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                className="textarea min-h-36 w-full rounded-2xl border-white/10 bg-[#090909] text-white placeholder:text-white/25 focus:border-white/20 focus:outline-none"
                placeholder="Tulis bio singkat..."
              />
            </label>

            {message ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              className="btn btn-primary h-12 rounded-2xl border-0 bg-white px-6 text-black hover:bg-white/90"
            >
              Save Changes
            </button>
          </form>
        </div>

        <aside className="space-y-4">
          {profileMeta.map((item) => (
            <MetaCard key={item.label} label={item.label} value={item.value} />
          ))}
        </aside>
      </div>
    </section>
  );
}
