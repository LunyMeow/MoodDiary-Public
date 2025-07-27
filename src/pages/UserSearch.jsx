import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAuth } from "firebase/auth";
    import RedirectMessage from "../components/RedirectMessage";


let debounceTimer;






export default function UserSearch() {

    const auth = getAuth();
    const currentUser = auth.currentUser;

    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

      if (!auth.currentUser) {
          return <RedirectMessage />;
        }

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            //const users = await searchUsers(searchTerm);



            const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
            const response = await fetch('https://searchusers-skz3ms2laq-uc.a.run.app', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Eğer fonksiyon auth gerektiriyorsa, token ekle
                    ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
                },
                body: JSON.stringify({
                    searchTerm
                })

            });


            //const result = await getInterests();

            const dataRes = await response.json(); // ← burada response body'si JSON'a ayrıştırılıyor








            setResults(dataRes);
        } catch (error) {
            console.error("Arama hatası:", error);
            setResults([]);
        }
        setLoading(false);
    };

    // Live search effect (debounced)
    useEffect(() => {
        clearTimeout(debounceTimer);
        if (searchTerm.trim()) {
            debounceTimer = setTimeout(() => {
                handleSearch();
            }, 500); // 500ms sonra çalışır
        } else {
            setResults([]);
        }
        return () => clearTimeout(debounceTimer);
    }, [searchTerm]);

    return (
        <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-md dark:bg-gray-800 dark:text-white">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">Kullanıcı Ara</h1>
                <Link to="/Dashboard">
                    <button className="bg-blue-600 hover:bg-blue-900 text-white py-2 px-4 rounded">
                        Ana Sayfa
                    </button>
                </Link>
            </div>

            <div className="flex mb-4 gap-2">
                <input
                    type="text"
                    placeholder="Kullanıcı adı yaz..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setLoading(true);
                    }}

                    className="flex-grow border border-gray-300 rounded px-4 py-2 focus:outline-none dark:bg-gray-700 dark:text-white"
                />
                <button
                    onClick={handleSearch}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded"
                >
                    Ara
                </button>
            </div>

            {loading && <p>Aranıyor...</p>}

            {!loading && searchTerm.trim() && results.length === 0 && (
                <p className="text-gray-600 dark:text-gray-400">Sonuç bulunamadı.</p>
            )}

            <ul>
                {results.map((user) => (
                    <li
                        key={user.uid}
                        className="mb-3 p-3 border rounded hover:shadow-md bg-gray-50 dark:bg-gray-700"
                    >
                        <Link to={`/user/${user.username}`} className="flex items-center gap-4">
                            <img
                                src={user.photoUrl || "/default.png"}
                                alt={user.username}
                                className="w-12 h-12 rounded-full object-cover"
                            />
                            <div>
                                <p className="font-semibold text-indigo-600 dark:text-indigo-400">
                                    {user.fullname || user.username}
                                    
                                </p>
                                <p className="text-sm text-gray-500">@{user.username}</p>
                            </div>

                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
