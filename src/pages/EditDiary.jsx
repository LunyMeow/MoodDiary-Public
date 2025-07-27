import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { getFirebaseDB, getFirebaseAuth, initializeFirebase } from "../services/firebase";
import { useEffect, useState } from "react";
//import { getFunctions, httpsCallable } from "firebase/functions";
import { Link } from "react-router-dom";
import RedirectMessage from "../components/RedirectMessage";



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
  initializeFirebase();
  //const functions = getFunctions(getFirebaseApp());
  //const editDiary = httpsCallable(functions, "editDiary");

  if (!auth.currentUser) {
    return <RedirectMessage />;
  }

  useEffect(() => {
    if (!user?.uid) {
      console.log("Really?");
      return
    };

    async function loadDiary() {
      try {

        const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
        const response = await fetch('https://fetchdiary-skz3ms2laq-uc.a.run.app', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Eğer fonksiyon auth gerektiriyorsa, token ekle
            ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
          },
          body: JSON.stringify({ diaryId: id })

        });


        //const result = await getInterests();

        const data = await response.json(); // ← burada response body'si JSON'a ayrıştırılıyor





        setValue("status", data.diary.status || "private");
        setValue("topic", data.diary.topic || "");

        setValue("content", data.diary.decryptedContent);
        setDiaryLoaded(true);
      } catch {
        setValue("content", "[İçerik çözülemedi]");
      }
    }

    loadDiary();
  }, [aesPass, db, id, navigate, setValue, user]);

  const onSubmit = async (formData) => {
    if (!user) {
      console.log("Really?");
      return
    };

    setIsSubmitting(true); // İşlem başladı
    try {
      //const result = await editDiary();


      const formData2 = formData;
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const response = await fetch('https://editdiary-skz3ms2laq-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Eğer fonksiyon auth gerektiriyorsa, token ekle
          ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
        },
        body: JSON.stringify({
          diaryId: id,
          newContent: formData2.content,
          status: formData2.status,
          topic: formData2.topic,
        })
      });


      //const result = await getInterests();
      const data = await response.json(); // ← burada response body'si JSON'a ayrıştırılıyor



      if (data.success) {
        navigate("/Dashboard");
      } else {
        alert("Güncelleme sırasında hata oluştu.");
      }
    } catch (error) {
      alert("Güncelleme sırasında hata oluştu.");
    } finally {
      setIsSubmitting(false); // İşlem bitti
    }
  };

  if (!diaryLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-500 to-blue-900 dark:from-black dark:to-gray-700">
        <div className="text-white text-xl animate-pulse">Günlük yükleniyor...</div>
      </div>
    );
  }


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

