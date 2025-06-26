import { useEffect, useState } from "react";
import { getFirebaseAuth, getFirebaseDB } from "../services/firebase";
import {
    doc,
    getDoc,
    updateDoc,
    arrayRemove,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions";



export default function UserRelations() {
    const [userData, setUserData] = useState(null);
    const [uid, setUid] = useState(null);
    const [loading, setLoading] = useState(true);
    const db = getFirebaseDB();

    useEffect(() => {


        const fetchUserData = async () => {


            const auth = getFirebaseAuth();
            const user = auth.currentUser;
            if (!user) return;

            setUid(user.uid);
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const data = userDoc.data();

                // UID dizilerini username dizilerine çevir
                const convertUIDsToUsernames = async (uidList) => {
                    const usernames = [];
                    for (const uid of uidList || []) {
                        const uDoc = await getDoc(doc(db, "users", uid));
                        if (uDoc.exists()) {
                            usernames.push({ uid, username: uDoc.data().username });
                        }
                    }
                    return usernames;
                };

                const following = await convertUIDsToUsernames(data.following);
                const followers = await convertUIDsToUsernames(data.followers);
                const blocked = await convertUIDsToUsernames(data.blocked);

                const followRequests = await convertUIDsToUsernames(data.followRequests);
                setUserData({ following, followers, blocked, followRequests });


            }

            setLoading(false);
        };


        fetchUserData();
    }, []);

    const handleRemove = async (field, uidToRemove) => {
        if (!uid) return;

        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            [field]: arrayRemove(uidToRemove),
        });
        const updatedDoc = await getDoc(userRef);
        const updatedData = updatedDoc.data();
        // Karşı tarafın hangi alanından silineceğini belirle
        let inverseField = null;
        if (field === "following") inverseField = "followers";
        else if (field === "followers") inverseField = "following";
        else if (field === "blocked") inverseField = null; // engelleme karşı tarafı etkilemez
        if (inverseField) {
            const otherUserRef = doc(db, "users", uidToRemove);
            await updateDoc(otherUserRef, {
                [inverseField]: arrayRemove(uid),
            });
        }

        const convertUIDsToUsernames = async (uidList) => {
            const usernames = [];
            for (const uid of uidList || []) {
                const uDoc = await getDoc(doc(db, "users", uid));
                if (uDoc.exists()) {
                    usernames.push({ uid, username: uDoc.data().username });
                }
            }
            return usernames;
        };

        const following = await convertUIDsToUsernames(updatedData.following);
        const followers = await convertUIDsToUsernames(updatedData.followers);
        const blocked = await convertUIDsToUsernames(updatedData.blocked);


        const followRequests = await convertUIDsToUsernames(updatedData.followRequests);
        setUserData({ following, followers, blocked, followRequests });
    };


    const handleAcceptRequest = async (requesterId) => {
        const functions = getFunctions();
        const acceptRequest = httpsCallable(functions, "acceptFollowRequest");
        await acceptRequest({ requesterId });

        // Kullanıcının güncellenmiş verilerini tekrar çek
        const userRef = doc(db, "users", uid);
        const updatedDoc = await getDoc(userRef);
        const updatedData = updatedDoc.data();

        const convertUIDsToUsernames = async (uidList) => {
            const usernames = [];
            for (const uid of uidList || []) {
                const uDoc = await getDoc(doc(db, "users", uid));
                if (uDoc.exists()) {
                    usernames.push({ uid, username: uDoc.data().username });
                }
            }
            return usernames;
        };

        const following = await convertUIDsToUsernames(updatedData.following);
        const followers = await convertUIDsToUsernames(updatedData.followers);
        const blocked = await convertUIDsToUsernames(updatedData.blocked);
        const followRequests = await convertUIDsToUsernames(updatedData.followRequests);

        setUserData({ following, followers, blocked, followRequests });
    };



    if (loading) return <div className="text-center p-4">Yükleniyor...</div>;

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6 text-center">İlişkilerim</h1>

            {["following", "followers", "blocked"].map((field) => (
                <div key={field} className="mb-6">
                    <h2 className="text-xl font-semibold capitalize mb-2">
                        {field === "following"
                            ? "Takip Ettiklerim"
                            : field === "followers"
                                ? "Takipçilerim"
                                : "Engellediklerim"}
                    </h2>

                    {userData[field]?.length > 0 ? (
                        <ul className="space-y-2">
                            {userData[field].map((user, index) => (
                                <li
                                    key={index}
                                    className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded"
                                >

                                    <Link to={`/user/${user.username}`} className="flex items-center gap-4">
                                        <img
                                            src={user.photoURL || "/default.png"}
                                            alt={user.username}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                        <div>
                                            <p className="font-semibold text-indigo-600 dark:text-indigo-400">
                                                {user.fullname || user.username}

                                            </p>

                                        </div>
                                    </Link>
                                    <button
                                        onClick={() => handleRemove(field, user.uid)}
                                        className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded"
                                    >
                                        Kaldır
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Hiç kullanıcı yok.
                        </p>
                    )}

                </div>
            ))}
            <div className="mb-6">
                <h2 className="text-xl font-semibold capitalize mb-2">Takip İstekleri</h2>
                {userData.followRequests?.length > 0 ? (
                    <ul className="space-y-2">
                        {userData.followRequests.map((user, index) => (
                            <li
                                key={index}
                                className="flex justify-between items-center bg-yellow-100 dark:bg-yellow-800 px-4 py-2 rounded"
                            >
                                <Link to={`/user/${user.username}`} className="flex items-center gap-4">
                                    <img
                                        src={user.photoURL || "/default.png"}
                                        alt={user.username}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <p className="font-semibold">{user.fullname || user.username}</p>
                                </Link>
                                <button
                                    onClick={() => handleAcceptRequest(user.uid)}
                                    className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 rounded"
                                >
                                    Kabul Et
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Bekleyen istek yok.
                    </p>
                )}
            </div>

            <Link to="/Dashboard">
                <button className="bg-blue-600 hover:bg-blue-900 text-white py-2 px-4 rounded">
                    Ana Sayfa
                </button>
            </Link>
        </div>
    );
}
