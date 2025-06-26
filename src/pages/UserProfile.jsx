import { useParams } from "react-router-dom";
import { getFirebaseDB } from "../services/firebase";
import { query, collection, where, getDocs, getDoc, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useEffect, useState, useRef } from "react";
import { decrypt } from "../utils/crypto";
import { Link } from "react-router-dom";
import { getAuth } from "firebase/auth";
import DiaryCard from "../components/DiaryCard";


import { httpsCallable } from "firebase/functions";

import {
    followUser,
    unfollowUser,
    blockUser,
    unblockUser
} from "../services/userActions";



export default function UserProfile() {
    const debug = false;
    const log = (...args) => debug && console.log("[UserProfile]", ...args);

    const { username } = useParams();
    const db = getFirebaseDB();
    const auth = getAuth();
    const currentUser = auth.currentUser;

    const [userData, setUserData] = useState(null);
    const [diaries, setDiaries] = useState([]);

    useEffect(() => {
        const fetchUserByUsername = async () => {
            try {
                const q = query(collection(db, "users"), where("username", "==", username));
                const snap = await getDocs(q);

                if (snap.empty) {
                    log("Kullanıcı bulunamadı:", username);
                    return;
                }

                const userDoc = snap.docs[0];
                const user = { uid: userDoc.id, ...userDoc.data() };
                setUserData(user); // 🟢 Sadece kullanıcıyı al
                log("Kullanıcı bulundu:", user);
            } catch (err) {
                log("fetchUserByUsername hatası:", err);
            }
        };

        fetchUserByUsername();
    }, [username]);

    // 🟢 userData geldikten sonra günlükleri al
    useEffect(() => {
        const fetchDiaries = async () => {
            if (!userData) return;

            try {
                const diariesQuery = query(
                    collection(db, "diaries"),
                    where("userId", "==", userData.uid)
                );
                const diarySnap = await getDocs(diariesQuery);

                const diaryData = diarySnap.docs
                    .map((d) => {
                        const data = d.data();
                        let decryptedContent = "";

                        try {
                            decryptedContent = decrypt(data.content, data.aesPass || "default");
                        } catch (err) {
                            log("Decrypt hatası:", err);
                            decryptedContent = "[İçerik çözülemedi]";
                        }

                        return {
                            id: d.id,
                            ...data,
                            content:decryptedContent,
                        };
                    })
                    .filter((diary) => {
                        if (diary.status === "public") return true;

                        if (
                            diary.status === "onlyFollowers" &&
                            userData?.followers?.includes(currentUser.uid)

                        ) return true;

                        return false;
                    });


                setDiaries(diaryData);
                log("Günlükler yüklendi:", diaryData);
            } catch (err) {
                log("fetchDiaries hatası:", err);
            }
        };

        fetchDiaries();
    }, [userData]); // 🔁 sadece userData geldikten sonra çalışacak

    const [currentUserData, setCurrentUserData] = useState(null);

    useEffect(() => {
        const fetchCurrentUser = async () => {
            if (!currentUser) return;
            const snap = await getDoc(doc(db, "users", currentUser.uid));
            if (snap.exists()) {
                setCurrentUserData({ uid: snap.id, ...snap.data() });
            }
        };
        fetchCurrentUser();
    }, [currentUser]);

    const isFollowing = currentUserData?.following?.includes(userData?.uid);
    const isRequested = currentUserData?.followRequests?.includes(userData?.uid); // Bunu ters yönden kontrol etmemiz gerek!
    const isRequestedByYou = userData?.followRequests?.includes(currentUser?.uid); // doğru olan bu




    if (!userData) return <p>Kullanıcı bulunamadı.</p>;

    return (
        <div className=" min-h-screen bg-gradient-to-br from-purple-400 to-indigo-700 p-6 dark:from-black dark:to-gray-800">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg dark:bg-gray-800">
                <div className="flex items-center gap-4 mb-6">
                    <img src={userData.photoURL || "/default.png"} className="w-20 h-20 rounded-full" />
                    <h1 className="text-2xl font-bold text-indigo-800 dark:text-white">{userData.fullname}</h1>
                    {userData.uid === currentUser?.uid && "(Sen)"}
                    <br></br>

                    <div className="flex gap-6 text-center">
                        <div>
                            <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">{userData.followers?.length || 0}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Takipçi</p>
                        </div>
                        <div>
                            <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">{userData.following?.length || 0}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Takip Edilen</p>
                        </div>
                    </div>


                    <div className="flex gap-4 mb-4">
                        {isFollowing ? (
                            <button
                                onClick={async () => {
                                    await unfollowUser(userData.uid);
                                    const snap = await getDoc(doc(db, "users", userData.uid));
                                    setUserData({ uid: snap.id, ...snap.data() });

                                    const csnap = await getDoc(doc(db, "users", currentUser.uid));
                                    setCurrentUserData({ uid: csnap.id, ...csnap.data() });
                                }}
                                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-1 rounded"
                            >
                                Takipten Çık
                            </button>
                        ) : isRequestedByYou ? (
                            <button
                                onClick={async () => {
                                    await updateDoc(doc(db, "users", userData.uid), {
                                        followRequests: arrayRemove(currentUser.uid)
                                    });
                                    const snap = await getDoc(doc(db, "users", userData.uid));
                                    setUserData({ uid: snap.id, ...snap.data() });
                                }}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1 rounded"
                            >
                                İsteği Geri Çek
                            </button>
                        ) : (
                            <button
                                onClick={async () => {
                                    await followUser(userData.uid); // Backend'de profilePublic kontrolü olmalı
                                    const snap = await getDoc(doc(db, "users", userData.uid));
                                    setUserData({ uid: snap.id, ...snap.data() });

                                    const csnap = await getDoc(doc(db, "users", currentUser.uid));
                                    setCurrentUserData({ uid: csnap.id, ...csnap.data() });
                                }}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded"
                            >
                                Takip Et
                            </button>
                        )}


                        {userData.blocked?.includes(userData.uid) ? (
                            <button
                                onClick={async () => {
                                    if (window.confirm("Bu kullanıcının engelini kaldırmak istediğinize emin misiniz?")) {
                                        try {
                                            await unblockUser(userData.uid);
                                            setUserData({
                                                ...userData,
                                                blocked: userData.blocked.filter(uid => uid !== userData.uid)
                                            });
                                            alert("Engel kaldırıldı.");
                                        } catch (error) {
                                            console.error("Engel kaldırırken hata:", error);
                                        }
                                    }
                                }}
                                className="text-sm text-purple-600 hover:underline bg-slate-100"
                            >
                                Engel Kaldır
                            </button>
                        ) : (
                            <button
                                onClick={async () => {
                                    if (window.confirm("Bu kullanıcıyı engellemek istediğinize emin misiniz?")) {
                                        try {
                                            await blockUser(userData.uid);
                                            setUserData({
                                                ...userData,
                                                blocked: [...(userData.blocked || []), userData.uid]
                                            });
                                            alert("Kullanıcı engellendi.");
                                        } catch (error) {
                                            console.error("Engellerken hata:", error);
                                        }
                                    }
                                }}
                                className="text-sm text-red-600 hover:underline bg-yellow-300 hover:bg-yellow-500"
                            >
                                Bu kullanıcıyı engelle
                            </button>
                        )}
                    </div>
                </div>

                <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">Paylaşılan Günlükler</h2>
                {diaries.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-300">Bu kullanıcı henüz herkese açık günlük paylaşmamış.</p>
                ) : (
                    <ul className="space-y-4">
                        {diaries.map((diary) => (
                            <li key={diary.id} className="border p-4 rounded shadow bg-white dark:bg-gray-700 dark:text-white">
                                <DiaryCard diary={diary} currentUserId={currentUser.uid}></DiaryCard>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <br />
            <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-md mb-6 dark:bg-gray-800">
                <Link to="/Dashboard">
                    <button className="bg-blue-600 hover:bg-blue-900 text-white py-2 px-4 rounded">
                        Ana Sayfa
                    </button>
                </Link>
            </div>
        </div>
    );
}
