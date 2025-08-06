import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { getFirebaseAuth, initializeFirebase } from "../services/firebase";
import DiaryCard from "../components/DiaryCard";
import NotificationPanel from "../components/NotificationPanel";

import RedirectMessage from "../components/RedirectMessage";

export default function Home() {




    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkIsMobile = () => setIsMobile(window.innerWidth <= 768);
        checkIsMobile();
        window.addEventListener("resize", checkIsMobile);
        return () => window.removeEventListener("resize", checkIsMobile);
    }, []);




    //const functions = getFirebaseFunctions();
    const auth = getFirebaseAuth();
    const navigate = useNavigate();
    const [userProfile, setUserProfile] = useState({
        fullname: "",
        photoUrl: "/default.png"
    });
    const [diaries, setDiaries] = useState([]);
    const [hasUnreadNotifs, setHasUnreadNotifs] = useState(false);
    const [showNotifs, setShowNotifs] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Backend fonksiyonları
    //const getUserProfile = httpsCallable(functions, 'getUserProfile');
    //const fetchUserDiaries = httpsCallable(functions, 'fetchUserDiaries');
    //const deleteDiaryBackend = httpsCallable(functions, 'deleteDiary');
    //const checkUnreadNotifs = httpsCallable(functions, 'checkUnreadNotifications');
    //const markNotifsRead = httpsCallable(functions, 'markNotificationsRead');

    initializeFirebase();
    if (!auth.currentUser) {
        return <RedirectMessage />;
    }
    useEffect(() => {

        const loadData = async () => {
            try {
                const auth = getFirebaseAuth();
                if (!auth.currentUser) {
                    //navigate("/login");
                    return;
                }


                const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;


                // Paralel olarak verileri yükle
                const [profileRes, diariesRes, notifsRes] = await Promise.all([
                    fetch('https://getuserprofile-skz3ms2laq-uc.a.run.app', {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
                        },
                    }).then(res => res.json()),

                    fetch('https://fetchuserdiaries-skz3ms2laq-uc.a.run.app', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
                        },
                        body: JSON.stringify({})
                    }).then(res => res.json()),

                    fetch('https://checkunreadnotifications-skz3ms2laq-uc.a.run.app', {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
                        },
                    }).then(res => res.json()),
                ]);

                setUserProfile(profileRes);
                setDiaries(diariesRes.diaries || []);
                setHasUnreadNotifs(notifsRes.hasUnread);
                setLoading(false);
            } catch (err) {
                console.error("Veri yükleme hatası:", err);
                setError("Veriler yüklenirken hata oluştu");
                setLoading(false);
            }
        };

        loadData();
    }, [auth.currentUser, navigate]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/login");
        } catch (err) {
            console.error("Çıkış yapılırken hata:", err);
            setError("Çıkış yapılırken hata oluştu");
        }
    };

    const handleDeleteDiary = async (diaryId) => {
        if (!window.confirm("Bu günlüğü silmek istediğinize emin misiniz?")) {
            return;
        }

        try {
            //await deleteDiaryBackend({ diaryId });

            const auth = getFirebaseAuth();
            const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
            const response = await fetch('https://deletediary-skz3ms2laq-uc.a.run.app', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Eğer fonksiyon auth gerektiriyorsa, token ekle
                    ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
                },
                body: JSON.stringify({ diaryId: diaryId })
            });












            setDiaries(prev => prev.filter(d => d.diaryId !== diaryId));
        } catch (err) {
            console.error("Günlük silinirken hata:", err);
            setError("Günlük silinirken hata oluştu");
        }
    };

    const toggleNotifications = async () => {
        const newState = !showNotifs;
        setShowNotifs(newState);

        if (newState && hasUnreadNotifs) {
            try {
                //await markNotifsRead();


                const auth = getFirebaseAuth();
                const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
                const response = await fetch('https://marknotificationsread-skz3ms2laq-uc.a.run.app', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // Eğer fonksiyon auth gerektiriyorsa, token ekle
                        ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
                    },
                    body: "",
                });



                setHasUnreadNotifs(false);
            } catch (err) {
                console.error("Bildirimler okundu olarak işaretlenirken hata:", err);
            }
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
    if (error) return <div className="text-center p-8 text-red-500">{error} <RedirectMessage />
    </div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-400 to-purple-600 dark:from-gray-900 dark:to-black p-2 sm:p-4">
            {/* Üst Bilgi Çubuğu */}
            <div className="flex justify-between max-w-3xl mx-auto bg-white p-2 sm:p-6 rounded-xl shadow-md mb-4 sm:mb-6 dark:bg-gray-800 items-center">
                <div className="flex items-center gap-6 sm:items-end">
                    <div className="flex items-center gap-4 sm:gap-6">
                        {/* Profil ve Bildirim */}
                        <div className="relative flex items-center gap-2 sm:gap-4 ml-2 sm:ml-0">


                            {/* Bildirim Butonu */}
                            <div className="relative">
                                <button
                                    onClick={toggleNotifications}
                                    className="bg-indigo-600 text-white px-2 py-2 rounded hover:bg-indigo-800"
                                    aria-label="Bildirimler"
                                >
                                    🔔
                                </button>

                                {/* Bildirim Paneli */}
                                <div className="absolute top-full mt-2 right-0 z-50 w-64 sm:w-80 max-w-[90vw]">
                                    <NotificationPanel
                                        open={showNotifs}
                                        onClose={() => setShowNotifs(false)}
                                    />
                                </div>

                                {/* Bildirim Uyarısı */}
                                {hasUnreadNotifs && (
                                    <>
                                        <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-red-600 border border-white animate-ping" />
                                        <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-red-600 border border-white" />
                                    </>
                                )}
                            </div>

                            {/* Profil Fotoğrafı */}
                            <Link to={`/user/${userProfile.username}`}>
                                <img
                                    src={userProfile.photoUrl}
                                    alt="Profil Fotoğrafı"
                                    className="sm:w-12 sm:h-12 rounded-full object-cover cursor-pointer"
                                />

                            </Link>

                            <h1 className="text-xl sm:text-3xl  font-bold text-indigo-700 dark:text-white">
                                {userProfile.fullname}
                            </h1>
                        </div>

                    </div>


                </div>

                <div className="sm:flex  items-center gap-3 flex-col sm:flex-row">

                    <button
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-600 text-white py-1.5 px-4 rounded m-1 text-sm sm:py-2 sm:px-5 sm:text-base"
                    >
                        Çıkış
                    </button>


                </div>


            </div>

            {/* Navigasyon Butonları */}
            <div className="w-full max-w-3xl mx-auto bg-white p-3 sm:p-3 rounded-xl shadow-md mb-4 sm:mb-6 dark:bg-gray-800">
                <div className="grid grid-cols-2 items-center">
                    <div className="justify-self-start">
                        <Link
                            to="/CommunityStories"
                            className=" text-sm sm:text-lg w-20  sm:w-48 h-9 sm:h-10 inline-flex items-center justify-center bg-lime-300 hover:bg-lime-400 text-black px-4 rounded  leading-none dark:bg-blue-700 dark:text-white dark:hover:bg-blue-800"
                        >
                            Topluluk Hikayeleri
                        </Link>

                    </div>
                    <div className="flex gap-3 justify-self-end">
                        <Link
                            to="/UserRelations"
                            className="h-9  px-3 sm:px-4 inline-flex items-center justify-center text-sm leading-none bg-blue-500 hover:bg-blue-600 text-black  rounded dark:bg-green-400 dark:text-white dark:hover:bg-blue-500"

                            aria-label="İlişkiler"
                        >
                            💕
                        </Link>



                        <Link
                            to="/UserSearch"
                            className="h-9 inline-flex items-center justify-center text-sm leading-none bg-green-300 hover:bg-green-400 text-black px-4 rounded dark:bg-red-700 dark:text-white dark:hover:bg-red-800"
                            aria-label="Kullanıcı Ara"
                        >
                            🔍
                        </Link>
                    </div>
                </div>
            </div>

            {/* Günlükler Listesi */}
            <div className="max-w-3xl mx-auto bg-white p-3 sm:p-8 rounded-xl shadow-lg dark:bg-gray-800">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg sm:text-xl font-semibold">Günlüklerin</h2>
                    <button
                        onClick={() => navigate("/NewDiary")}
                        className="text-sm sm:text-base   bg-green-500 hover:bg-green-600 text-white py-1 sm:py-2 px-3 sm:px-4 rounded"
                    >
                        {!isMobile ? "Yeni Günlük Ekle" : ""} ➕
                    </button>
                </div>

                {diaries.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-300">
                        Henüz günlük yazmadın. Yeni bir günlük oluşturmak için butona tıklayabilirsin.
                    </p>
                ) : (
                    <ul className="space-y-10">
                        {diaries.map((diary) => (
                            <li
                                key={diary.diaryId}
                                className="border p-2 rounded shadow-xl hover:shadow-lg transition dark:border-gray-700"
                            >
                                {/* Etiket + Butonlar aynı satırda */}
                                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                                    {/* Durum etiketi */}
                                    <span
                                        className={`
        inline-block px-2 py-0 text-xs font-semibold rounded
        ${diary.status === "public" ? "bg-green-100 text-green-800" :
                                                diary.status === "private" ? "bg-yellow-100 text-yellow-800" :
                                                    diary.status === "onlyFollowers" ? "bg-gray-200 text-gray-800" :
                                                        "bg-blue-100 text-blue-800"}
      `}
                                        title={
                                            diary.status === "public"
                                                ? "Herkese Açık"
                                                : diary.status === "private"
                                                    ? "Gizli"
                                                    : diary.status === "onlyFollowers"
                                                        ? "Sadece Takipçilere"
                                                        : "Bilinmeyen Durum"
                                        }
                                    >
                                        {diary.status === "public" && "🌍"}
                                        {diary.status === "private" && "🔒"}
                                        {diary.status === "onlyFollowers" && "👥"}
                                        {diary.status !== "public" && diary.status !== "private" && diary.status !== "onlyFollowers" && "❔"}
                                    </span>

                                    {/* Butonlar */}
                                    <div className="flex gap-2 ">
                                        <button
                                            onClick={() => navigate(`/edit/${diary.diaryId}`)}
                                            className="w-auto  text-sm sm:text-base bg-indigo-500 hover:bg-indigo-600 text-white px-2 sm:px-4 py-1 rounded"
                                        >
                                            {!isMobile ? "Düzenle ✏️" : "✏️"}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteDiary(diary.diaryId)}
                                            className="   text-xs text- sm:text-base bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                                        >
                                            {!isMobile ? "Sil 🗑️" : "🗑️"}
                                        </button>
                                    </div>
                                </div>

                                {/* Günlük içeriği */}
                                <DiaryCard diary={diary} self={true} currentUsername={userProfile.username} />
                            </li>

                        ))}
                    </ul>

                )}
            </div>
        </div>
    );
}