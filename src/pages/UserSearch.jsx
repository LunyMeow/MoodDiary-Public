import { useState } from "react";
import { getFirebaseDB } from "../services/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { Link } from "react-router-dom";
import { getAuth } from "firebase/auth";


export default function UserSearch() {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const db = getFirebaseDB();
    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            setResults([]);
            return;
        }



        setLoading(true);

        try {
            // Firestore'da 'username' alanı tam eşleşme için sorgu
            // istersen burada startsWith veya contains benzeri sorgu yapamazsın Firestore sınırlamalarından dolayı, 
            // onun yerine küçük bir hack olarak 'username' >= searchTerm && username < searchTerm + 'z' yapabilirsin
            const usersRef = collection(db, "users");
            const q = query(
                usersRef,
                where("username", ">=", searchTerm),
                where("username", "<=", searchTerm + "\uf8ff"),
                limit(10)
            );
            const querySnapshot = await getDocs(q);

            const users = querySnapshot.docs.map((doc) => ({
                uid: doc.id,
                ...doc.data(),
            }));

            setResults(users);
        } catch (error) {
            console.error("Arama sırasında hata:", error);
            setResults([]);
        }

        setLoading(false);
    };

    return (
        <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-md dark:bg-gray-800 dark:text-white">
            
            <h1 className="text-2xl font-bold mb-4">Kullanıcı Ara</h1>

            <div className="flex mb-4">
                <input
                    type="text"
                    placeholder="Kullanıcı adı yaz..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
                    className="flex-grow border border-gray-300 rounded-l px-4 py-2 focus:outline-none dark:bg-gray-700 dark:text-white"
                    onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                />
                <button
                    onClick={handleSearch}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-r"
                >
                    Ara
                </button>
            </div>

            {loading && <p>Aranıyor...</p>}

            {!loading && results.length === 0 && searchTerm && (
                <p className="text-gray-600 dark:text-gray-400">Sonuç bulunamadı.</p>
            )}

            <ul>
                {results.map((user) => (
                    <li key={user.uid} className="mb-3 p-3 border rounded hover:shadow-md bg-gray-50 dark:bg-gray-700">
                        <Link to={`/user/${user.username}`} className="flex items-center gap-4">
                            <img
                                src={user.photoURL || "/default.png"}
                                alt={user.username}
                                className="w-12 h-12 rounded-full object-cover"
                            />
                            <div>
                                <p className="font-semibold text-indigo-600 dark:text-indigo-400">
                                    {user.fullname || user.username}
                                    {user.uid === currentUser?.uid && " (Sen)"}
                                </p>

                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
            <Link to="/Dashboard">
                <button className="bg-blue-600 hover:bg-blue-900 text-white py-2 px-4 rounded">
                    Ana Sayfa
                </button>
            </Link>
        </div>
    );
}
