import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getFirebaseDB, getFirebaseAuth, getFirebaseFunctions } from "../services/firebase";
import { httpsCallable } from "firebase/functions";

import { doc, getDoc } from "firebase/firestore";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function DiaryPage() {
    const { diaryId } = useParams();

    const db = getFirebaseDB();
    const auth = getFirebaseAuth();
    const functions = getFirebaseFunctions();
    const currentUser = auth?.currentUser;

    const [diary, setDiary] = useState(null);
    const [decryptedContent, setDecryptedContent] = useState("");
    const [username, setUsername] = useState("Anonim Kullanıcı");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDiary = async () => {
            setLoading(true);
            setError("");
            setDecryptedContent("");

            try {
                const diaryRef = doc(db, "diaries", diaryId);
                const diarySnap = await getDoc(diaryRef);

                if (!diarySnap.exists()) {
                    setError("Günlük bulunamadı.");
                    setLoading(false);
                    return;
                }

                const diaryData = diarySnap.data();

                const isOwner = currentUser && diaryData.userId === currentUser.uid;
                const isPublic = diaryData.status === "public";

                if (!isPublic && !isOwner) {
                    setError("Günlük bulunamadı.");
                    setLoading(false);
                    return;
                }

                setDiary(diaryData);

                // Kullanıcı adını al
                const userRef = doc(db, "users", diaryData.userId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setUsername(userSnap.data().username || "Anonim Kullanıcı");
                }

                // İçerik şifreliyse ve kullanıcı sahipse, decryptDiary fonksiyonunu çağır

                const decryptDiary = httpsCallable(functions, "decryptDiary");
                try {
                    const res = await decryptDiary({ diaryId });
                    setDecryptedContent(res.data.decrypted);
                } catch (e) {
                    console.error("Şifre çözme hatası:", e);
                    setDecryptedContent("[İçerik çözülemedi]");
                }

                setLoading(false);
            } catch (err) {
                console.error(err);
                setError("Bir hata oluştu.");
                setLoading(false);
            }
        };

        fetchDiary();
    }, [diaryId, currentUser, db, functions]);

    if (loading) return <p>Yükleniyor...</p>;
    if (error) return <p className="text-red-600">{error}</p>;
    if (!diary) return null;

    return (
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <h1 className="text-2xl font-bold mb-2">Günlük Detayları</h1>
            <p className="mb-1">
                <strong>Yazar:</strong> {username}
            </p>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                {diary.createdAt?.toDate
                    ? format(diary.createdAt.toDate(), "d MMMM yyyy, HH:mm", { locale: tr })
                    : ""}
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
                {decryptedContent}
            </div>
        </div>
    );
}
