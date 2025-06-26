import { useForm } from "react-hook-form";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAuth, getFirebaseDB } from "../services/firebase"; // ⬅️ değiştirildi
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { doc, setDoc, getDocs, query, collection, where } from "firebase/firestore";
import { Link } from "react-router-dom";


function generateAESKey(length = 32) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
  let key = '';
  for (let i = 0; i < length; i++) {
    key += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return key;
}



export default function Register() {

  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const onSubmit = async (data) => {
    try {
      const auth = getFirebaseAuth();
      const db = getFirebaseDB();

      // Kullanıcı adı benzersiz mi kontrol et
      const usernameQuery = await getDocs(
        query(collection(db, "users"), where("username", "==", data.username))

      );
      if (!usernameQuery.empty) {
        setError("Bu kullanıcı adı zaten alınmış.");
        return;
      }

      // Firebase Auth ile kullanıcı oluştur
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // Firestore'a kaydet
      await setDoc(doc(db, "users", user.uid), {
        username: data.username,
        fullname: data.fullname,
        email: data.email,
        following: [],
        followers: [],
        blocked: [],
        notifications: [],
        profilePublic: true,
        followRequests: [],
        interests:[],
      });

      navigate("/MyInterests");

    } catch (err) {
      console.error("Register Hata:", err.code, err.message);

      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-600 dark:from-gray-900 dark:to-black">
      <Link
        to="/"
        className="absolute left-0 top-0 h-full w-12 flex items-center justify-center dark:bg-blue-900 dark:hover:bg-blue-950 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xl rounded-r"
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
            {...register("username", { required: true })}
            className="w-full p-2 border border-gray-300 rounded text-black dark:text-white dark:bg-gray-700 dark:border-gray-600"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300">İsim Soyisim</label>
          <input
            type="text"
            {...register("fullname", { required: true })}
            className="w-full p-2 border border-gray-300 rounded text-black dark:text-white dark:bg-gray-700 dark:border-gray-600"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300">E-posta</label>
          <input
            type="email"
            {...register("email", { required: true })}
            className="w-full p-2 border border-gray-300 rounded text-black dark:text-white dark:bg-gray-700 dark:border-gray-600"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300">Şifre</label>
          <input
            type="password"
            {...register("password", { required: true })}
            className="w-full p-2 border border-gray-300 rounded text-black dark:text-white dark:bg-gray-700 dark:border-gray-600"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white w-full py-2 rounded transition"
        >
          Hesap Oluştur
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
