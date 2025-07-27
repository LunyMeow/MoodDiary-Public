// src/pages/Login.jsx
import { useForm } from "react-hook-form";

import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { httpsCallable } from "firebase/functions";

import { getFirebaseFunctions, getFirebaseAuth, initializeFirebase } from "../services/firebase";
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
                await signInWithEmailAndPassword(auth, data.email, data.password);
                navigate("/Dashboard");
            } else {
                setError("Giriş başarısız.");
            }
        } catch (err) {
            setError(err.message || "Giriş başarısız.");
        } finally {
            setLoading(false); // işlem bitti
        }
    };



    return (

        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-400 to-indigo-600 dark:from-indigo-900 dark:to-teal-700">
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
