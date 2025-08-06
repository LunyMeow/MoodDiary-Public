import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Link } from "react-router-dom";
import { getFirebaseAuth, getFirebaseFunctions, signInWithGoogle } from "../services/firebase";

import { signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";


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
        const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;

        // E-posta doğrulama gönder
        await sendEmailVerification(user);
        // Yönlendirme
        setError("Kayıt başarılı. Lütfen size gönderilen e-posta ile hesabınızı adresinizi onaylayınız.");

        setTimeout(() => {
          navigate(result.redirectUrl);
        }, 4000); // 4 saniye
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















        <button
          type="button"
          onClick={async () => {
            setError("");
            setLoading(true);

            // Formdan username ve fullname'i al
            const username = document.querySelector('input[name="username"]')?.value.trim();
            const fullname = document.querySelector('input[name="fullname"]')?.value.trim();



            try {
              // Google ile giriş
              const { user } = await signInWithGoogle();

              // Backend'e POST isteği gönder
              const response = await fetch("https://registeruser-skz3ms2laq-uc.a.run.app", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: user.email,
                  fullname,
                  username,
                  provider: "google",
                }),
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Kayıt başarısız.");
              }

              const result = await response.json();
              navigate(result.redirectUrl); // Örn: /Profile

            } catch (err) {
              console.error("Google ile kayıt hatası:", err);
              setError(err.message || "Google ile kayıt sırasında hata oluştu.");
            } finally {
              setLoading(false);
            }
          }}
          className=" bg-red-500 hover:bg-red-600 text-white w-full py-2 mt-4 rounded transition"
        >

          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className="w-5 h-5 inline-block align-middle mr-2"
          >
            <path
              fill="#FFC107"
              d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.5-5.8 7.5-11.3 7.5-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.3 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.5-.4-3.5z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.2 16.2 18.7 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.3 29.3 4 24 4c-7.6 0-14.1 4.1-17.7 10.2z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.8 35.5 27 36.5 24 36.5c-5.4 0-9.9-3-11.5-7.5l-6.5 5C9.9 39.7 16.5 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.5H42V20H24v8h11.3c-.9 2.5-2.6 4.6-4.7 6.1l6.3 5.3c-1.8 1.7-4 3.1-6.5 4.1 2.4-.8 4.7-2.1 6.5-4.1l6.3-5.3c2.4-2.6 3.9-6.1 3.9-10.1 0-1.2-.1-2.5-.4-3.5z"
            />
          </svg>
           Google ile Kayıt Ol
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