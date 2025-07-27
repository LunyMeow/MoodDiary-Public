// src/pages/NewDiary.jsx
import { useForm } from "react-hook-form";
import { useState } from "react";

import { getFirebaseDB, getFirebaseAuth } from "../services/firebase"
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

import RedirectMessage from "../components/RedirectMessage";




export default function NewDiary() {


  const [isSubmitting, setIsSubmitting] = useState(false); // Yeni state ekleyin

  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();
  const auth = getFirebaseAuth();
  const db = getFirebaseDB();

  const user = auth?.currentUser;


  if (!auth.currentUser) {
    return <RedirectMessage />;
  }

  //const createDiary = httpsCallable(functions, "createDiary");

  const onSubmit = async (data) => {
    setIsSubmitting(true); // İşlem başladığında true yap
    try {
      const user = auth.currentUser;
      if (!user) return;

      //const result = await createDiary();


      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const response = await fetch('https://creatediary-skz3ms2laq-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Eğer fonksiyon auth gerektiriyorsa, token ekle
          ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
        },
        body: JSON.stringify({
          content: data.content,
          status: data.status,
        })

      });


      //const result = await getInterests();

      const dataRes = await response.json(); // ← burada response body'si JSON'a ayrıştırılıyor



      //console.log(JSON.stringify(dataRes));
      if (dataRes.success) {
        navigate("/Dashboard");
      } else {
        alert("Bir hata oluştu.");
      }
    } catch (error) {
      console.error("Hata:", error);
      alert("Bir hata oluştu.");
    } finally {
      setIsSubmitting(false); // İşlem bitince false yap
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-blue-500 dark:from-gray-800 dark:to-black">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-xl dark:bg-gray-800">
        <h2 className="text-2xl font-bold mb-6 text-center text-green-700 dark:text-yellow-500">
          Yeni Günlük Ekle
        </h2>
        <textarea
          {...register("content", { required: true })}
          className="w-full p-4 border border-gray-300 rounded h-64 resize-none text-black dark:bg-gray-900 dark:text-white"
          placeholder="Bugün neler hissettin?"
        ></textarea>
        <select
          {...register("status", { required: true, defaultValue: "private" })}

          className="w-full p-2 mt-4 border border-gray-300 rounded text-black dark:bg-gray-900 dark:text-white"
          defaultValue={"private"}
        >
          <option value="public">Herkese Açık</option>
          <option value="private" >Sadece Ben</option>
          <option value="onlyFollowers">Sadece Takipçiler</option>
        </select>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`bg-green-600 hover:bg-green-700 text-white mt-4 py-2 px-4 rounded w-full ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
        >
          {isSubmitting ? 'İşleniyor...' : 'Kaydet'}
        </button>
        <div className="flex justify-center mt-4">
          <Link to="/Dashboard">
            <button className={`bg-blue-600 hover:bg-blue-900 text-white py-2 px-4 rounded ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={isSubmitting}  >
              Ana Sayfa
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}
