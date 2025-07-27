import { useState, useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { getFirebaseFunctions, initializeFirebase, getFirebaseAuth } from "../services/firebase";
import { AnimatePresence, motion } from "framer-motion";

initializeFirebase();
const functions = getFirebaseFunctions();

export default function NotificationPanel({ open, onClose }) {
    const [loading, setLoading] = useState(false);

    const [notifications, setNotifications] = useState([]);
    const markRead = httpsCallable(functions, "markNotificationsRead");
    const auth = getFirebaseAuth();

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                setLoading(true); // yükleme başlat
                //const getNotifs = httpsCallable(functions, "getNotifications");
                //const res = await getNotifs();


                const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
                const response = await fetch('https://getnotifications-skz3ms2laq-uc.a.run.app', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        // Eğer fonksiyon auth gerektiriyorsa, token ekle
                        ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
                    }

                });


                //const result = await getInterests();

                const dataRes = await response.json(); // ← burada response body'si JSON'a ayrıştırılıyor










                const rawNotifs = dataRes.notifications || [];

                const sortedNotifs = rawNotifs.sort((a, b) => {
                    const timeA = a.timestamp?._seconds || 0;
                    const timeB = b.timestamp?._seconds || 0;
                    return timeB - timeA;
                });

                setNotifications(sortedNotifs);

                if (sortedNotifs.length > 0) {
                    markRead();
                }
            } catch (err) {
                console.error("Bildirim alınamadı:", err);
            }
            setLoading(false); // yükleme bitti
        };


        if (open) {
            fetchNotifications();

        }
    }, [open]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-52 sm:left-50 top-0 w-[90vw] sm:w-80 bg-white dark:bg-gray-800 shadow-xl border rounded-xl p-4 z-50"
                >

                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-gray-800 dark:text-white">Yeni Bildirimler</h3>

                    </div>
                    {loading ? (
                        <p className="text-gray-500 animate-pulse">Yükleniyor...</p>
                    ) : notifications.length === 0 ? (
                        <p className="text-gray-500">Yeni bildirimin yok.</p>
                    ) : (
                        <ul className="space-y-2 max-h-64 overflow-y-auto">
                            <ul className="space-y-2 max-h-64 overflow-y-auto">
                                {notifications.map((n, i) => (
                                    <li
                                        key={i}
                                        className={`text-sm border-b pb-2 ${n.read
                                            ? "text-gray-700 dark:text-gray-300"
                                            : "font-semibold text-black dark:text-white"
                                            }`}
                                    >
                                        {n.type === "follow" && `Bir kullanıcı seni takip etmeye başladı: ${n.fromUsername}`}
                                        {n.type === "unfollow" && `Bir kullanıcı takipten çıktı: ${n.fromUsername}`}
                                        {n.type === "followRequest" && `Takip isteğin var: ${n.fromUsername}`}
                                        {n.type === "follow_accepted" && `Takip isteği kabul edildi: ${n.fromUsername}`}
                                        {n.type === "new_update" && `${n.fromUsername} Bir güncelleme paylaştı.`}
                                        <br />
                                        <span className="text-xs text-gray-500">
                                            {n.timestamp?._seconds
                                                ? new Date(n.timestamp._seconds * 1000).toLocaleString()
                                                : "Zaman yok"}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                        </ul>
                    )}

                </motion.div>
            )}
        </AnimatePresence>
    );
}
