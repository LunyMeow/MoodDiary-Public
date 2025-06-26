import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { getFirebaseDB, getFirebaseAuth, getFirebaseApp } from "../services/firebase";
import { useEffect, useState } from "react";
import { decrypt } from "../utils/crypto";
import { getFunctions, httpsCallable } from "firebase/functions";
import { Link } from "react-router-dom";


export default function EditDiary() {

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [aesPass, setAesPass] = useState("");
  const [diaryLoaded, setDiaryLoaded] = useState(false);

  const { id } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, setValue } = useForm();
  const db = getFirebaseDB();
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;

  const functions = getFunctions(getFirebaseApp());
  const editDiary = httpsCallable(functions, "editDiary");

  useEffect(() => {
    if (!user?.uid) return;

    async function fetchKey() {
      try {
        const ref = doc(db, "diaries", id);
        const snapshot = await getDoc(ref);

        if (!snapshot.exists()) {
          navigate("/Dashboard");
          return;
        }

        const data = snapshot.data();
        if (data.userId !== user.uid) {
          navigate("/");
          return;
        }

        setAesPass(data.aesPass || "default");
      } catch {
        setAesPass("default");
      }
    }

    fetchKey();
  }, [db, id, navigate, user]);

  useEffect(() => {
    if (!aesPass || !user?.uid) return;

    async function loadDiary() {
      try {
        const ref = doc(db, "diaries", id);
        const snapshot = await getDoc(ref);

        if (!snapshot.exists()) {
          navigate("/Dashboard");
          return;
        }

        const data = snapshot.data();

        if (data.userId !== user.uid) {
          navigate("/");
          return;
        }

        setValue("status", data.status || "private");
        setValue("topic", data.topic || "");
        const decryptedContent = decrypt(data.content, aesPass);
        setValue("content", decryptedContent);
        setDiaryLoaded(true);
      } catch {
        setValue("content", "[İçerik çözülemedi]");
      }
    }

    loadDiary();
  }, [aesPass, db, id, navigate, setValue, user]);

  const onSubmit = async (formData) => {
    if (!user) return;

    setIsSubmitting(true); // İşlem başladı
    try {
      const result = await editDiary({
        diaryId: id,
        newContent: formData.content,
        status: formData.status,
        topic: formData.topic,
      });

      if (result.data?.success) {
        navigate("/Dashboard");
      } else {
        alert("Güncelleme sırasında hata oluştu.");
      }
    } catch {
      alert("Güncelleme sırasında hata oluştu.");
    } finally {
      setIsSubmitting(false); // İşlem bitti
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-500 to-blue-900 dark:from-black dark:to-gray-700">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-xl dark:bg-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-center text-yellow-700 dark:text-blue-700">Günlüğü Düzenle</h2>

        <textarea
          {...register("content", { required: true })}
          className="w-full p-4 border border-gray-300 dark:bg-gray-600 rounded h-64 resize-none text-black dark:text-white"
        ></textarea>

        <select
          {...register("status", { required: true })}
          className="w-full p-2 mt-4 border border-gray-300 rounded text-black dark:bg-gray-600 dark:text-white"
        >
          <option value="public">Herkese Açık</option>
          <option value="private">Sadece Ben</option>
          <option value="onlyFollowers">Sadece Takipçiler</option>
        </select>



        <button
          type="submit"
          className={`bg-yellow-600 hover:bg-yellow-700 text-white mt-4 py-2 px-4 rounded w-full dark:bg-green-500 dark:hover:bg-green-900 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          disabled={!diaryLoaded || isSubmitting}
        >
          {isSubmitting ? 'Güncelleniyor...' : 'Güncelle'}
        </button>

        <div className="flex justify-center mt-4">
          <Link to="/Dashboard">
            <button
              className={`bg-blue-600 hover:bg-blue-900 text-white py-2 px-4 rounded ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              disabled={isSubmitting}
            >
              Ana Sayfa
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}

