import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {

   const navigate = useNavigate();

   const {
      login,
      isAuthenticated,
      authLoading
   } = useAuth();

   const [form, setForm] = useState({
      email: "",
      password: ""
   });

   const [error, setError] = useState("");
   const [loading, setLoading] = useState(false);

   useEffect(() => {
      if (!authLoading && isAuthenticated) {
         navigate("/profile");
      }
   }, [authLoading, isAuthenticated, navigate]);

   const handleChange = (e) => {
      setForm(prev => ({
         ...prev,
         [e.target.name]: e.target.value
      }));
   };

   const handleSubmit = async (e) => {
      e.preventDefault();

      if (!form.email || !form.password) {
         setError("Email dan password wajib diisi");
         return;
      }

      try {
         setLoading(true);
         setError("");

         await login(form);

         navigate("/profile");

      } catch {
         setError("Login gagal");
      } finally {
         setLoading(false);
      }
   }

   return (
      <section className="grid min-h-screen place-items-center">

         <div className="w-full max-w-xl rounded-3xl p-8 border border-white/10">

            <h2 className="text-3xl mb-6">
               Login
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">

               <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="email"
                  className="input input-bordered w-full"
               />

               <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="password"
                  className="input input-bordered w-full"
               />

               {error && (
                  <div className="alert">
                     {error}
                  </div>
               )}

               <button
                  disabled={loading}
                  className="btn btn-primary w-full"
               >
                  {loading ? "Loading..." : "Login"}
               </button>

            </form>

            <div className="mt-5">
               Belum punya akun?
               <Link to="/register" className="underline ml-2">
                  Register
               </Link>
            </div>

         </div>

      </section>
   )
}