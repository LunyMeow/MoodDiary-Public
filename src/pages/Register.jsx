import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Link } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { getFirebaseAuth, getFirebaseFunctions } from "../services/firebase";

import { getAuth, signInWithEmailAndPassword } from "firebase/auth";


export default function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const functions = getFirebaseFunctions();
  const auth = getFirebaseAuth();


  const onSubmit = async (data) => {
    setLoading(true);
    setError("");

    try {
      // Firebase kullanıcı token'ını alma (gerekirse)
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;

      // HTTP POST isteği gönder (onRequest fonksiyonuna)
      const response = await fetch('https://registeruser-skz3ms2laq-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Eğer fonksiyon auth gerektiriyorsa, token ekle
          ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kayıt başarısız.');
      }

      const result = await response.json();

      if (result.success) {
        // Kayıt başarılıysa, otomatik giriş yap
        await signInWithEmailAndPassword(auth, data.email, data.password);

        // Yönlendirme
        navigate(result.redirectUrl);
      } else {
        throw new Error('Kayıt sırasında hata oluştu.');
      }
    } catch (err) {
      console.error("Register error:", err);
      setError(err.message || "Kayıt sırasında hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-600 dark:from-gray-900 dark:to-black">
      <Link
        to="/"
        className="absolute top-4 left-4 w-12 h-12 md:h-full md:top-0 md:left-0 flex items-center justify-center
    dark:bg-gray-800 dark:hover:bg-gray-900 bg-blue-500 hover:bg-blue-600
    text-white font-bold text-xl rounded-full md:rounded-r transition-all"
        aria-label="Ana sayfa"
      >
        {"<"}
      </Link>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-indigo-600 dark:text-indigo-400">
          Kayıt Ol
        </h2>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center dark:text-red-400">{error}</p>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300">Kullanıcı Adı</label>
          <input
            type="text"
            {...register("username", {
              required: "Kullanıcı adı zorunludur",
              minLength: {
                value: 3,
                message: "En az 3 karakter olmalı"
              },
              maxLength: {
                value: 15,
                message: "En fazla 15 karakter olabilir"
              },
              pattern: {
                value: /^[a-zA-Z0-9_]+$/,
                message: "Sadece harf, sayı ve alt çizgi kullanabilirsiniz"
              }
            })}
            className="w-full p-2 border border-gray-300 rounded text-black dark:text-white dark:bg-gray-700 dark:border-gray-600"
          />
          {errors.username && (
            <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300">İsim Soyisim</label>
          <input
            type="text"
            {...register("fullname", {
              required: "İsim zorunludur",
              minLength: {
                value: 2,
                message: "En az 2 karakter olmalı"
              }
            })}
            className="w-full p-2 border border-gray-300 rounded text-black dark:text-white dark:bg-gray-700 dark:border-gray-600"
          />
          {errors.fullname && (
            <p className="text-red-500 text-xs mt-1">{errors.fullname.message}</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300">E-posta</label>
          <input
            type="email"
            {...register("email", {
              required: "E-posta zorunludur",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Geçersiz e-posta adresi"
              }
            })}
            className="w-full p-2 border border-gray-300 rounded text-black dark:text-white dark:bg-gray-700 dark:border-gray-600"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300">Şifre</label>
          <input
            type="password"
            {...register("password", {
              required: "Şifre zorunludur",
              minLength: {
                value: 6,
                message: "En az 6 karakter olmalı"
              }
            })}
            className="w-full p-2 border border-gray-300 rounded text-black dark:text-white dark:bg-gray-700 dark:border-gray-600"
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white w-full py-2 rounded transition disabled:opacity-70"
        >
          {loading ? "Oluşturuluyor..." : "Hesap Oluştur"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Zaten bir hesabınız var mı?{" "}
          <Link
            to="/login"
            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-600 font-semibold"
          >
            Giriş Yap
          </Link>
        </p>
      </form>
    </div>
  );
}