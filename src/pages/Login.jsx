// src/pages/Login.jsx
import { useForm } from "react-hook-form";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAuth, isFirebaseReady } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";


export default function Login() {


    const { register, handleSubmit } = useForm();
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [ready, setReady] = useState(false);




    const onSubmit = async (data) => {
        try {
            if (!isFirebaseReady()) {
                setError("Firebase henüz hazır değil, lütfen tekrar deneyin.");
                return;
            }
            const auth = getFirebaseAuth();
            await signInWithEmailAndPassword(auth, data.email, data.password);
            navigate("/Dashboard"); // giriş başarılıysa anasayfaya yönlendir
        } catch (err) {
            setError("E-posta veya şifre hatalı!" + err + isFirebaseReady());
        }
    };


    return (

        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-400 to-indigo-600 dark:from-indigo-900 dark:to-teal-700">
            <Link
                to="/"
                className="absolute left-0 top-0 h-full w-12 flex items-center justify-center  dark:bg-gray-800 dark:hover:bg-gray-900 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xl rounded-r"
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
                    className="bg-indigo-600 hover:bg-indigo-700 text-white w-full py-2 rounded transition"
                    name="submit"
                >
                    Giriş Yap
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
