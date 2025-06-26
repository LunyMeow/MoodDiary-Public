import { useEffect, useState } from "react";
import {
    getFirebaseAuth,
    getFirebaseDB,

} from "../services/firebase";
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    deleteDoc,
    doc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { encrypt, decrypt } from "../utils/crypto";
import { httpsCallable } from "firebase/functions";
import { getFirebaseFunctions, initializeFirebase } from "../services/firebase";
import DiaryCard from "../components/DiaryCard";


import NotificationPanel from "../components/NotificationPanel"; // yolunu projene göre düzenle







export default function Home() {


    const auth = getFirebaseAuth();
    const db = getFirebaseDB();
    const user = auth?.currentUser;

    const [diaries, setDiaries] = useState([]);
    const [fullname, setUsername] = useState("");
    const [photoURL, setPhotoURL] = useState(null);


    const navigate = useNavigate();



    const [hasNotifs, setHasNotifs] = useState(false);

    useEffect(() => {
        initializeFirebase();
        const checkUnreadNotifs = async () => {
            try {
                const getNotifs = httpsCallable(getFirebaseFunctions(), "getNotifications");
                const res = await getNotifs();
                const notifs = res.data.notifications || [];

                const unreadExists = notifs.some((n) => n.read === false);
                setHasNotifs(unreadExists);
            } catch (err) {
                console.error("Bildirim kontrolü başarısız:", err);
            }
        };

        checkUnreadNotifs();
    }, []);




    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        const fetchDiaries = async () => {
            if (!user) return;
            try {
                const fetchUserDiariesFn = httpsCallable(getFirebaseFunctions(), "fetchUserDiaries");
                const res = await fetchUserDiariesFn();
                const data = res.data.diaries || [];
                setDiaries(data);
            } catch (error) {
                console.error("Günlükler alınamadı:", error);
            }
        };

        const fetchUsername = async () => {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setUsername(data.fullname);
                setPhotoURL(data.photoURL || "/default.png");
            } else {
                setUsername(user.email);
                setPhotoURL("/default.png");
            }
        };

        fetchUsername();
        fetchDiaries();
    }, [user, navigate, db]);

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };
    const [showNotifs, setShowNotifs] = useState(false);


    return (

        <div className="min-h-screen bg-gradient-to-br from-indigo-400 to-purple-600  dark:from-gray-900 dark:to-black p-6">
            <div className="flex justify-between max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-md mb-6 dark:bg-gray-800 items-center">
                {/* Sol taraf */}
                <div className="flex items-center gap-6">

                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowNotifs((prev) => !prev);
                                setHasNotifs(false); // açınca bildirimi görülmüş kabul edelim
                            }}
                            className="bg-indigo-600 text-white px-2 py-2 rounded hover:bg-indigo-800 relative"
                        >
                            🔔
                            <NotificationPanel open={showNotifs} onClose={() => setShowNotifs(false)} />
                            {hasNotifs && (
                                <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-red-600 border border-white animate-ping" />
                            )}
                            {hasNotifs && (
                                <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-red-600 border border-white" />
                            )}
                        </button>
                    </div>
                    <h1 className="text-3xl font-bold text-indigo-700 dark:text-white">
                        Hoş geldin, {fullname}
                    </h1>

                </div>

                {/* Sağ taraf */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
                    >
                        Çıkış
                    </button>
                    <img
                        src={photoURL}
                        alt="Profil Fotoğrafı"
                        className="w-24 h-24 rounded-full object-cover"
                    />
                </div>
            </div>



            <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-md mb-6 dark:bg-gray-800">
                <div className="grid grid-cols-2 items-center">

                    <div className="justify-self-start">
                        <Link
                            to="/CommunityStories"
                            className="h-10 inline-flex items-center justify-center bg-lime-300 hover:bg-lime-400 text-black px-4 rounded dark:bg-blue-700 dark:text-white dark:hover:bg-blue-800"
                        >
                            Topluluk Hikayeleri
                        </Link>
                    </div>
                    <div className="flex gap-3 justify-self-end">
                        <Link
                            to="/UserRelations"
                            className="h-10 inline-flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-black px-4 rounded dark:text-white"
                        >
                            💕
                        </Link>

                        <Link
                            to="/Profile"
                            className="h-10 inline-flex items-center justify-center bg-yellow-300 hover:bg-yellow-400 text-black px-4 rounded dark:bg-green-400 dark:text-white dark:hover:bg-green-500"
                        >
                            🙂
                        </Link>

                        <Link
                            to="/UserSearch"
                            className="h-10 inline-flex items-center justify-center bg-green-300 hover:bg-green-400 text-black px-4 rounded dark:bg-red-700 dark:text-white dark:hover:bg-red-800"
                        >
                            🔍
                        </Link>

                    </div>


                </div>
            </div>


            <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg dark:bg-gray-800">



                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Günlüklerin</h2>
                    <button
                        onClick={() => navigate("/NewDiary")}
                        className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
                    >
                        Yeni Günlük Ekle
                    </button>
                </div>


                {diaries.length === 0 ? (
                    <p>Henüz günlük yazmadın.</p>
                ) : (
                    <ul className="space-y-4">
                        {diaries.map((diary) => (
                            <li
                                key={diary.id}
                                className="border p-4 rounded shadow hover:shadow-md transition"
                            >
                                <DiaryCard diary={diary} self={true} currentUserId={user.uid} />
                                <button
                                    onClick={() => navigate(`/edit/${diary.id}`)}
                                    className="bg-indigo-500 hover:bg-indigo-600 text-white mt-2 px-4 py-1 rounded mr-2"
                                >
                                    Düzenle
                                </button>

                                <button
                                    onClick={async () => {
                                        if (window.confirm("Bu günlük silinsin mi?")) {
                                            try {
                                                await deleteDoc(doc(db, "diaries", diary.id));
                                                setDiaries((prev) => prev.filter((d) => d.id !== diary.id));
                                            } catch (error) {
                                                alert("Silme işlemi başarısız oldu!");
                                            }
                                        }
                                    }}
                                    className="bg-red-500 hover:bg-red-600 text-white mt-2 px-4 py-1 rounded"
                                >
                                    Sil
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                <br />





            </div>
        </div>
    );
}
