import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name || !form.email || !form.password) {
      setError('Nama, email, dan password wajib diisi.');
      return;
    }

    register(form);
    navigate('/profile');
  };

  return (
    <section className="grid min-h-[calc(100vh-8rem)] place-items-center">
      <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-8">
        <span className="badge badge-neutral border-white/10 bg-white/[0.06] px-3 py-3 text-[11px] uppercase tracking-[0.18em] text-white/65">
          Register Page
        </span>

        <div className="mt-6 space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Create an account.
          </h2>
          <p className="text-sm leading-7 text-white/58">
            Tampilan register dibuat senada dengan login: border halus, background
            gelap, dan tombol kontras putih.
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="form-control w-full">
            <span className="mb-2 text-sm text-white/55">Full name</span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="masukan nama anda"
              className="input h-14 w-full rounded-2xl border-white/10 bg-[#090909] text-white placeholder:text-white/25 focus:border-white/20 focus:outline-none"
            />
          </label>

          <label className="form-control w-full">
            <span className="mb-2 text-sm text-white/55">Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="...@gmail.com"
              className="input h-14 w-full rounded-2xl border-white/10 bg-[#090909] text-white placeholder:text-white/25 focus:border-white/20 focus:outline-none"
            />
          </label>

          <label className="form-control w-full">
            <span className="mb-2 text-sm text-white/55">Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Masukan password"
              className="input h-14 w-full rounded-2xl border-white/10 bg-[#090909] text-white placeholder:text-white/25 focus:border-white/20 focus:outline-none"
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            className="btn btn-primary mt-2 h-12 w-full rounded-2xl border-0 bg-white text-black hover:bg-white/90"
          >
            Register
          </button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-white/48">
          <span>Sudah punya akun?</span>
          <Link to="/login" className="font-medium text-white underline underline-offset-4">
            Login di sini
          </Link>
        </div>
      </div>
    </section>
  );
}
