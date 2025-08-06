// src/pages/Login.jsx
import { useForm } from "react-hook-form";

import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { signInWithGoogle, getFirebaseAuth, initializeFirebase } from "../services/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";




export default function Login() {


    const { register, handleSubmit } = useForm();
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    initializeFirebase();
    const onSubmit = async (data) => {
        setLoading(true); // işlem başladı
        try {
            const auth = getFirebaseAuth();
            const email = data.email;
            const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;

            const response = await fetch('https://securelogin-skz3ms2laq-uc.a.run.app', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
                },
                body: JSON.stringify({ email: email }),
            });

            const datares = await response.json();

            if (datares.success) {
                const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
                const user = userCredential.user;

                if (!user.emailVerified) {
                    setError("Lütfen e-posta adresinizi doğrulayın.");
                    setLoading(false);
                    return;
                }
                navigate("/Dashboard");
                //navigate("/Profile");
            } else {
                setError("Giriş başarısız.");
            }
        } catch (err) {
            setError("Hata:" + err.message || "Giriş başarısız.");
        } finally {
            setLoading(false); // işlem bitti
        }
    };



    return (

        <div className="min-h-screen p-2 flex items-center justify-center bg-gradient-to-br from-teal-400 to-indigo-600 dark:from-indigo-900 dark:to-teal-700">
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
                className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm dark:bg-gray-800"
            >
                <h2 className="text-2xl font-bold mb-6 text-center text-indigo-600 dark:text-indigo-300">
                    Giriş Yap
                </h2>

                {error && (
                    <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
                )}

                <div className="mb-4">
                    <label className="block text-gray-700 dark:text-gray-300">E-posta</label>
                    <input
                        type="email"
                        {...register("email")}
                        className="w-full p-2 border border-gray-300 rounded dark:border-gray-800 text-black"
                        required
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700 dark:text-gray-300 ">Şifre</label>
                    <input
                        type="password"
                        {...register("password")}
                        className="w-full p-2 border border-gray-300 rounded dark:border-gray-800 text-black"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white w-full py-2 rounded transition disabled:opacity-50"
                    name="submit"
                    disabled={loading}
                >
                    {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
                </button>
                <button
                    type="button"
                    onClick={async () => {
                        setLoading(true);
                        try {
                            const { user } = await signInWithGoogle();
                            if (!user.emailVerified) {
                                setError("Google hesabı ile giriş yaptınız.");
                            }
                            navigate("/Dashboard");
                        } catch (err) {
                            setError("Google ile giriş başarısız.");
                        } finally {
                            setLoading(false);
                        }
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white w-full py-2 mt-4 rounded transition flex items-center justify-center gap-2"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                        className="w-5 h-5"
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
                    Google ile Giriş Yap
                </button>

                <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                    Hesabınız yok mu?{" "}
                    <Link
                        to="/register"
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-600 font-semibold"
                    >
                        Kayıt Ol
                    </Link>
                </p>

            </form>



        </div>
    );
}
