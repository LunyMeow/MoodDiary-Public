import { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { getFirebaseAuth } from "../services/firebase";


import RedirectMessage from "../components/RedirectMessage";



const allInterests = [
  "Müzik",
  "Spor",
  "Aşk",
  "Günlük Hayat",
  "Sanat",
  "Psikoloji",
  "Felsefe",
  "Teknoloji",
  "Kitap",
  "Yalnızlık",
  "Yaratıcılık",
];

export default function MyInterests() {
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const navigate = useNavigate();
  //const functions = getFirebaseFunctions();

  const auth = getFirebaseAuth();

  if (!auth.currentUser) {
    return <RedirectMessage />;
  }

  useEffect(() => {
    const fetchInterests = async () => {
      setLoading(true);
      try {
        //const getInterests = httpsCallable(functions, 'getUserInterests');
        const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
        const response = await fetch('https://getuserinterests-skz3ms2laq-uc.a.run.app', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Eğer fonksiyon auth gerektiriyorsa, token ekle
            ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
          },

        });


        //const result = await getInterests();

        const data = await response.json(); // ← burada response body'si JSON'a ayrıştırılıyor


        setSelected(data.interests || []);
      } catch (err) {
        console.error("İlgi alanları yüklenemedi:", err);
      }
      setLoading(false);
    };
    fetchInterests();
  }, []);

  const toggleInterest = (interest) => {
    setSelected((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const saveInterests = async () => {
    if (selected.length === 0) {
      setStatusMsg("En az bir ilgi alanı seçmelisiniz");
      return;
    }

    setLoading(true);
    try {
      //const updateInterests = httpsCallable(functions, 'updateUserInterests');
      //await updateInterests({ interests: selected });




      const auth = getFirebaseAuth();
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const response = await fetch('https://updateuserinterests-skz3ms2laq-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Eğer fonksiyon auth gerektiriyorsa, token ekle
          ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
        },
        body: JSON.stringify({ interests: selected }),

      });


      //const result = await getInterests();

      const data = await response.json(); // ← burada response body'si JSON'a ayrıştırılıyor




      setStatusMsg("İlgi alanların kaydedildi ✅");
      setTimeout(() => navigate("/Dashboard"), 1500);
    } catch (err) {
      console.error(err);
      setStatusMsg(err.message || "Hata oluştu ❌");
    } finally {
      setLoading(false);
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
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md max-w-xl mx-auto">
      <div className="flex justify-between items-center mt-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          İlgi Alanlarım
        </h2>
        <Link to="/Dashboard">
          <button className="bg-green-600 hover:bg-green-900 text-white py-2 px-4 rounded">
            Geç
          </button>
        </Link>
      </div>



      <div className="grid grid-cols-2 gap-3 mb-4">
        {allInterests.map((interest) => (
          <label key={interest} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selected.includes(interest)}
              onChange={() => toggleInterest(interest)}
              className="form-checkbox h-5 w-5 text-indigo-600"
            />
            <span className="text-gray-800 dark:text-gray-200">{interest}</span>
          </label>
        ))}
      </div>
      <button
        onClick={saveInterests}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Kaydediliyor..." : "Kaydet"}
      </button>
      {statusMsg && (
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
          {statusMsg}
        </p>
      )}


    </div>
  );
}
