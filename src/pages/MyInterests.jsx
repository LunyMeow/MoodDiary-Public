import { useEffect, useState } from "react";
import { getFirebaseAuth, getFirebaseDB } from "../services/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Link ,useNavigate} from "react-router-dom";


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
  const auth = getFirebaseAuth();
  const db = getFirebaseDB();
  const user = auth?.currentUser;

  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInterests = async () => {
      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setSelected(data.interests || []);
      }
    };
    fetchInterests();
  }, [user]);

  const toggleInterest = (interest) => {
    setSelected((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const saveInterests = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, { interests: selected });
      setStatusMsg("İlgi alanların kaydedildi ✅");
      navigate("/Dashboard")

    } catch (err) {
      console.error(err);
      setStatusMsg("Hata oluştu ❌");
    }
    setLoading(false);
    setTimeout(() => setStatusMsg(""), 3000);
  };

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
