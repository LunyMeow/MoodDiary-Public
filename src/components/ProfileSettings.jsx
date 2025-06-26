import React, { useState, useEffect } from "react";
import { getFirebaseAuth, getFirebaseDB, getFirebaseStorage } from "../services/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Link } from "react-router-dom";
import { updateEmail } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore"; // ⬅️ eklenmeli en üste




export default function ProfileSettings() {

  const user = getFirebaseAuth().currentUser;
  const db = getFirebaseDB();
  const storage = getFirebaseStorage();
  const [newEmail, setNewEmail] = useState("");


  const [profile, setProfile] = useState({
    username: "",
    fullname: "",
    photoURL: "",
    profilePublic: false,
  });

  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) {
      setError("Lütfen giriş yapınız.");
      setLoading(false);
      return;
    }

    async function fetchProfile() {
      try {

        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile({
            username: data.username || "",
            fullname: data.fullname || "",
            photoURL: data.photoURL || "",
            email: user.email || "",
            profilePublic: data.profilePublic,
            interests: data.interests || [],
          });

        }
      } catch (err) {
        setError("Profil bilgileri alınamadı: " + err.message);
      }
      setLoading(false);
    }

    fetchProfile();
  }, [user]);

  const handleFileChange = async (e) => {
    if (!user) {
      setError("Giriş yapmanız gerekiyor.");
      return;
    }
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setMessage("");

    try {
      const storageRef = ref(storage, `profilePhotos/${user.uid}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      // Firestore güncelle
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { photoURL });

      // state güncelle
      setProfile((prev) => ({ ...prev, photoURL }));

      setMessage("Profil fotoğrafı başarıyla yüklendi!");
    } catch (err) {
      setError("Fotoğraf yükleme hatası: " + err.message);
    }

    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!user) {
      setError("Giriş yapmanız gerekiyor.");
      return;
    }

    try {

      // Kullanıcı adı başka biri tarafından kullanılıyor mu kontrol et
      const usernameQuery = await getDocs(
        query(
          collection(db, "users"),
          where("username", "==", profile.username)
        )
      );

      // Eğer kullanıcı adını başka biri kullanıyorsa ve bu kullanıcı **kendisi değilse** hata ver
      if (!usernameQuery.empty) {
        const docSnap = usernameQuery.docs[0];
        if (docSnap.id !== user.uid) {
          setError("Bu kullanıcı adı zaten alınmış.");
          return;
        }
      }



      // Firestore güncelle
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        username: profile.username,
        fullname: profile.fullname,
        profilePublic: Boolean(profile.profilePublic),
      });

      // Şifre değişikliği
      if (newPassword.trim() !== "") {
        await updatePassword(user, newPassword);
      }
      // E-posta değişikliği
      if (newEmail.trim() !== "" && newEmail !== user.email) {
        await updateEmail(user, newEmail);
      }


      setMessage("Profil başarıyla güncellendi!");
      window.scrollTo({ top: 0, behavior: "smooth" });

      setNewPassword("");
    } catch (err) {
      setError("Güncelleme hatası: " + err.message);
    }
  };

  if (loading) return <p>Yükleniyor...</p>;

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow-md dark:bg-gray-800">
      <h2 className="text-xl font-bold mb-4 text-center text-indigo-600 dark:text-indigo-400">
        Profil Ayarları
      </h2>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {message && <p className="text-green-600 mb-4">{message}</p>}

      <div className="flex flex-col items-center mb-6">
        <img
          src={profile.photoURL || "/default.png"}
          alt="Profil Fotoğrafı"
          className="w-24 h-24 rounded-full object-cover mb-2 border-2 border-indigo-600"
        />


        <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded text-sm">
          Fotoğraf Seç
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>

        {uploading && <p className="text-sm text-gray-500 mt-1">Yükleniyor...</p>}
      </div>


      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Kullanıcı Adı</label>
          <input
            type="text"
            value={profile.username}
            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">İsim Soyisim</label>
          <input
            type="text"
            value={profile.fullname}
            onChange={(e) => setProfile({ ...profile, fullname: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Mevcut E-posta</label>
          <input
            type="email"
            value={profile.email}
            disabled
            className="w-full p-2 border rounded bg-gray-200 dark:bg-gray-600 dark:text-gray-300"
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Profil Gizliliği</label>
          <select
            className="w-full p-2 border rounded bg-gray-200 dark:bg-gray-600 dark:text-gray-300"
            name="profilePublic"
            value={String(profile.profilePublic)}
            onChange={(e) =>
              setProfile({ ...profile, profilePublic: e.target.value === "true" })
            }
          >
            <option value="true">Açık</option>
            <option value="false">Kapalı</option>
          </select>
        </div>





        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Yeni E-posta</label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            placeholder="E-posta değiştirmek için yeni e-posta gir"
          />
        </div>


        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Yeni Şifre</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            placeholder="Şifre değiştirmek için yeni şifre gir"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded transition"
        >
          Güncelle
        </button>
      </form>

      {/* İlgi Alanlarım butonu */}
      <div className="relative flex justify-center mt-4">
        <Link to="/MyInterests" className="relative">
          <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded relative">
            İlgi Alanlarım
          </button>
          {profile.interests?.length === 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
          )}
        </Link>
      </div>


      <div className="flex justify-center mt-4">
        <Link to="/Dashboard">
          <button className="bg-green-600 hover:bg-green-900 text-white py-2 px-4 rounded">
            Ana Sayfa
          </button>
        </Link>
      </div>

    </div>
  );
}
