import React, { useEffect, useState } from "react";
import { getFirebaseAuth, getFirebaseDB } from "../services/firebase";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import RedirectMessage from "../components/RedirectMessage";


export default function ProfileSettings() {
  const user = getFirebaseAuth().currentUser;
  const db = getFirebaseDB();
  const auth = getFirebaseAuth();
  const navigate = useNavigate();

  const [availablePhotos, setAvailablePhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState("");

  const [isPhotoOpen, setIsPhotoOpen] = useState(false); // İstersen başlangıçta açık bırakabilirsin
  const contentRef = React.useRef(null);
  const [maxHeight, setMaxHeight] = useState("0px");

  useEffect(() => {
    if (isPhotoOpen && contentRef.current) {
      setMaxHeight(`${contentRef.current.scrollHeight}px`);
    } else {
      setMaxHeight("0px");
    }
  }, [isPhotoOpen, availablePhotos, selectedPhoto]);


  //const functions = getFirebaseFunctions()

  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm({
    defaultValues: {
      username: "",
      fullname: "",
      profilePublic: true,
      newEmail: "",
      newPassword: ""
    }
  });

  const [profile, setProfile] = useState({
    photoUrl: "",
    email: "",
    interests: [],
    username: "",
    fullname: "",
    profilePublic: true
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);






  if (!auth.currentUser) {
    return <RedirectMessage />;
  }
  // ✅ Mesajları otomatik temizleme
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage("");
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  useEffect(() => {
    if (!user) {
      setError("Lütfen giriş yapınız.");
      setLoading(false);
      return;
    }

    async function fetchProfile() {
      try {
        const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;

        // 🔹 Kullanıcı profili al
        const response = await fetch('https://getuserprofile-skz3ms2laq-uc.a.run.app', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
          }
        });

        const data = await response.json();
        const profileData = {
          photoUrl: data.photoUrl || "",
          email: user.email || "",
          interests: data.interests || [],
          username: data.username || "",
          fullname: data.fullname || "",
          profilePublic: Boolean(data.profilePublic)
        };

        setProfile(profileData);
        setSelectedPhoto(data.photoUrl || ""); // ilk seçili görsel

        // Formu doldur
        setValue("username", data.username || "");
        setValue("fullname", data.fullname || "");
        setValue("profilePublic", Boolean(data.profilePublic));

        // 🔹 Fotoğraf listesini çek
        const avatarRes = await fetch("https://getprofilephotos-skz3ms2laq-uc.a.run.app");
        const avatarList = await avatarRes.json();
        setAvailablePhotos(avatarList);

      } catch (err) {
        setError("Profil bilgileri alınamadı: " + err.message);
      }
      setLoading(false);
    }

    fetchProfile();
  }, [user, db, setValue]);
















  const onSubmit = async (data) => {
    if (submitting) return; // ✅ Çoklu submit önlemi

    setMessage("");
    setError("");
    setSubmitting(true);


    try {
      if (!user) {
        throw new Error("Kullanıcı oturumu bulunamadı.");
      }

      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const response = await fetch('https://updateprofile-skz3ms2laq-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
        },
        body: JSON.stringify({
          username: data.username.trim(),
          fullname: data.fullname.trim(),
          profilePublic: true ? data.profilePublic == 'true' : false,
          newEmail: data.newEmail ? data.newEmail.trim() : "",
          newPassword: data.newPassword || ""
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Update failed (${response.status}): ${errorText}`);
      }

      const data2 = await response.json();

      // Profil state'ini güncelle
      setProfile(prev => ({
        ...prev,
        username: data.username.trim(),
        fullname: data.fullname.trim(),
        profilePublic: data.profilePublic,
        email: data.newEmail ? data.newEmail.trim() : prev.email
      }));

      setMessage(data2.message || "Profil başarıyla güncellendi!");

      // Şifre ve email alanlarını temizle
      setValue("newEmail", "");
      setValue("newPassword", "");

    } catch (err) {
      console.error("Profil güncelleme hatası:", err);
      setError(err.message || "Profil güncellenirken bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded shadow-md dark:bg-gray-800">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-300">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow-md dark:bg-gray-800">
      
      <h2 className="text-xl font-bold mb-4 text-center text-indigo-600 dark:text-indigo-400">
        Profil Ayarları
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}


      <div className="flex justify-center mb-4">
        <img
          src={selectedPhoto || "/default.png"}
          alt="Seçili Profil"
          className="w-24 h-24 rounded-full object-cover border-2 border-indigo-600"
        />
      </div>


      <div className="mb-6 border rounded shadow-sm bg-gray-50 dark:bg-gray-700">
        <button
          type="button"
          className="w-full px-4 py-2 flex justify-between items-center text-indigo-600 dark:text-indigo-400 font-semibold focus:outline-none"
          onClick={() => setIsPhotoOpen(!isPhotoOpen)}
        >
          <span>Profil Fotoğrafı Seç</span>
          <svg
            className={`w-5 h-5 transform transition-transform duration-300 ${isPhotoOpen ? "rotate-180" : "rotate-0"}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>

        <div
          ref={contentRef}
          style={{ maxHeight: maxHeight, transition: "max-height 0.4s ease" }}
          className="overflow-hidden px-4"
        >
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-2 mt-4">Profil Fotoğrafı Seç:</p>
          <div className="flex justify-center flex-wrap gap-3">
            {availablePhotos.map((photo) => (
              <img
                key={photo.id}
                src={photo.publicUrl}
                alt={photo.id}
                className={`w-16 h-16 rounded-full border-2 cursor-pointer object-cover ${selectedPhoto === photo.publicUrl ? "border-indigo-600" : "border-gray-300"
                  }`}
                onClick={() => setSelectedPhoto(photo.publicUrl)}
              />
            ))}
          </div>

          <button
            type="button"
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded w-full my-4"
            onClick={async () => {
              try {
                const idToken = await user.getIdToken();
                const res = await fetch("https://updateselectedprofilephoto-skz3ms2laq-uc.a.run.app", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + idToken,
                  },
                  body: JSON.stringify({ photoUrl: selectedPhoto }),
                });

                const result = await res.json();

                if (!res.ok) throw new Error(result.error || "Güncelleme başarısız.");

                setMessage("Profil fotoğrafı başarıyla güncellendi.");
                setProfile((prev) => ({ ...prev, photoUrl: selectedPhoto }));
              } catch (err) {
                setError("Fotoğraf güncellenemedi: " + err.message);
              }
            }}
            disabled={!selectedPhoto}
          >
            Fotoğrafı Kaydet
          </button>
        </div>
      </div>









      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">
            Kullanıcı Adı *
          </label>
          <input
            type="text"
            {...register("username", {
              required: "Kullanıcı adı zorunludur",
              minLength: { value: 3, message: "En az 3 karakter olmalı" },
              maxLength: { value: 15, message: "En fazla 15 karakter olabilir" },
              pattern: {
                value: /^[a-zA-Z0-9_]+$/,
                message: "Sadece harf, sayı ve alt çizgi kullanabilirsiniz"
              }
            })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={submitting}
          />
          {errors.username && (
            <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>
          )}
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">
            İsim Soyisim *
          </label>
          <input
            type="text"
            {...register("fullname", {
              required: "İsim zorunludur",
              minLength: { value: 2, message: "En az 2 karakter olmalı" },
              maxLength: { value: 50, message: "En fazla 50 karakter olabilir" }
            })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={submitting}
          />
          {errors.fullname && (
            <p className="text-red-500 text-xs mt-1">{errors.fullname.message}</p>
          )}
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">
            Profil Gizliliği
          </label>
          <select
            {...register("profilePublic")}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={submitting}
          >
            <option value={true}>Açık (Herkes görebilir)</option>
            <option value={false}>Kapalı (Sadece ben)</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">
            Yeni E-posta
          </label>
          <input
            type="email"
            {...register("newEmail", {
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Geçersiz e-posta adresi"
              }
            })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="E-posta değiştirmek için yeni e-posta girin"
            disabled={submitting}
          />
          {errors.newEmail && (
            <p className="text-red-500 text-xs mt-1">{errors.newEmail.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Mevcut: {profile.email}
          </p>
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">
            Yeni Şifre
          </label>
          <input
            type="password"
            {...register("newPassword", {
              minLength: { value: 6, message: "En az 6 karakter olmalı" }
            })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Şifre değiştirmek için yeni şifre girin"
            disabled={submitting}
          />
          {errors.newPassword && (
            <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-2 rounded transition-colors ${submitting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
        >
          {submitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Güncelleniyor...
            </div>
          ) : (
            'Güncelle'
          )}
        </button>
      </form>
      <div className="flex justify-center gap-4 mt-6">
        <Link to="/Dashboard">
          <button className={`w-full py-2 rounded transition-colors ${submitting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}>
            Ana Sayfa
          </button>
        </Link>
        <Link to="/MyInterests">
          <button className={`w-full py-2 rounded transition-colors ${submitting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            İlgi Alanlarım
          </button>
        </Link>
      </div>

    </div>
  );
}