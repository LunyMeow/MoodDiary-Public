import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getFirebaseFunctions, getFirebaseAuth, initializeFirebase } from "../services/firebase";

import RedirectMessage from "../components/RedirectMessage";

import { format } from "date-fns";
import { tr } from "date-fns/locale";

import { Timestamp } from "firebase/firestore";
import { div } from "framer-motion/client";


export default function DiaryPage() {
    const { diaryId } = useParams();
    const functions = getFirebaseFunctions();

    const [diary, setDiary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    initializeFirebase();



    function toDate(timestamp) {

        if (!timestamp) return null;

        // Eğer Date objesi ise direkt dön
        if (timestamp instanceof Date) return timestamp;

        // Firestore Timestamp objesi ise toDate kullan
        if (timestamp instanceof Timestamp) return timestamp.toDate();

        // Eğer plain obje ise ve _seconds varsa Date objesi oluştur
        if (timestamp._seconds !== undefined) {
            return new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000);
        }

        // Eğer toDate fonksiyonu varsa kullan
        if (typeof timestamp.toDate === "function") return timestamp.toDate();

        // Eğer seconds varsa (farklı formatta) dönüşüm yap
        if (timestamp.seconds) return new Date(timestamp.seconds * 1000);

        // String ise
        if (typeof timestamp === "string") {
            const d = new Date(timestamp);
            if (!isNaN(d)) return d;
        }

        return null;
    }


    const auth = getFirebaseAuth();





    useEffect(() => {
        const fetchDiary = async () => {
            setLoading(true);
            setError("");

            try {
                //const fetchDiaryFn = httpsCallable(functions, "fetchDiary");
                //const result = await fetchDiaryFn({ diaryId });



                const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
                const response = await fetch('https://fetchdiary-skz3ms2laq-uc.a.run.app', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // Eğer fonksiyon auth gerektiriyorsa, token ekle
                        ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
                    },
                    body: JSON.stringify({ diaryId: diaryId })

                });


                //const result = await getInterests();

                const data = await response.json(); // ← burada response body'si JSON'a ayrıştırılıyor

                setDiary(data.diary);
            } catch (err) {
                setError(err.message || "Bir hata oluştu.");
            }

            setLoading(false);
        };

        if (diaryId) fetchDiary();
    }, [diaryId, functions]);

    if (loading) {
        return (
            <div className="max-w-md mx-auto p-6 bg-white rounded shadow-md dark:bg-gray-800">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-2 text-gray-600 dark:text-gray-300">Yükleniyor...</span>
                </div>
            </div>
        );
    } if (error) return <p className="text-red-600">{error}</p>;
    if (!diary) return null;
    return (
        <div className="p-2 max-w-2xl mx-auto md:mx-0 md:ml-auto md:mr-auto">
            <div className="flex justify-center md:justify-start mb-4">
                <a
                    href="/"
                    className="inline-block py-2 px-6 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                >
                    MoodDiary
                </a>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                <h1 className="text-2xl font-bold mb-2">Günlük</h1>
                <p className="mb-1">
                    <strong>Yazar:</strong> {diary.username}
                </p>
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                    {toDate(diary.createdAt)
                        ? format(toDate(diary.createdAt), "d MMMM yyyy, HH:mm", { locale: tr })
                        : "Tarih yok"}
                </p>
                <div className="mb-4">
                    {diary.topic?.map((topic, i) => (
                        <span
                            key={i}
                            className="inline-block bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs px-2 py-1 rounded-full mr-2"
                        >
                            {topic}
                        </span>
                    ))}
                </div>
                <div className="prose dark:prose-invert whitespace-pre-wrap">
                    {diary.decryptedContent}
                </div>
            </div>
        </div>

    );
}
