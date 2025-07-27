import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFirebaseFunctions , getFirebaseAuth } from "../services/firebase";
import RedirectMessage from "../components/RedirectMessage";


export default function UserRelations() {
  const functions = getFirebaseFunctions();
  const [relations, setRelations] = useState({
    following: [],
    followers: [],
    blocked: [],
    followRequests: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const auth = getFirebaseAuth();
  if (!auth.currentUser) {
      return <RedirectMessage />;
    }

  // Backend fonksiyonları
  //const getUserRelations = httpsCallable(functions, 'getUserRelations');
  //const removeRelation = httpsCallable(functions, 'removeRelation');
  //const acceptRequest = httpsCallable(functions, 'acceptFollowRequest');

  useEffect(() => {
    const fetchRelations = async () => {
      try {
        
        if (!auth.currentUser) {
          setError("Giriş yapmalısınız");
          setLoading(false);
          return;
        }

        //const result = await getUserRelations();



        const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
        const response = await fetch('https://getuserrelations-skz3ms2laq-uc.a.run.app', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Eğer fonksiyon auth gerektiriyorsa, token ekle
            ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
          }

        });


        //const result = await getInterests();

        const dataRes = await response.json(); // ← burada response body'si JSON'a ayrıştırılıyor





        setRelations(dataRes);
        setLoading(false);
      } catch (err) {
        console.error("İlişkiler yüklenirken hata:", err);
        setError("İlişkiler yüklenirken hata oluştu");
        setLoading(false);
      }
    };

    fetchRelations();
  }, []);

  const handleRemove = async (field, targetUsername) => {
    if (!window.confirm("Bu işlemi gerçekleştirmek istediğinize emin misiniz?")) {
      return;
    }

    try {
      //await removeRelation({ field, targetUid });





      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const response = await fetch('https://removerelation-skz3ms2laq-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Eğer fonksiyon auth gerektiriyorsa, token ekle
          ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
        },
        body: JSON.stringify({ field, targetUsername })

      });


      //const result = await getInterests();

      const dataRes = await response.json(); // ← burada response body'si JSON'a ayrıştırılıyor





      // Başarılı olursa yerel state'i güncelle
      setRelations(prev => ({
        ...prev,
        [field]: prev[field].filter(user => user.username !== targetUsername)
      }));
    } catch (err) {
      console.error("İlişki kaldırılırken hata:", err);
      setError("İlişki kaldırılırken hata oluştu");
    }
  };

  const handleAcceptRequest = async (requesterUsername) => {
    try {
      //await acceptRequest({ requesterId });



      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const response = await fetch('https://acceptfollowrequest-skz3ms2laq-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Eğer fonksiyon auth gerektiriyorsa, token ekle
          ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
        },
        body: JSON.stringify({ requesterUsername })

      });


      //const result = await getInterests();

      const dataRes = await response.json(); // ← burada response body'si JSON'a ayrıştırılıyor






      // Başarılı olursa yerel state'i güncelle
      setRelations(prev => ({
        ...prev,
        followRequests: prev.followRequests.filter(user => user.username !== requesterUsername),
        followers: [...prev.followers,
        prev.followRequests.find(user => user.username === requesterUsername)]
      }));
    } catch (err) {
      console.error("İstek kabul edilirken hata:", err);
      setError("İstek kabul edilirken hata oluştu");
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
  if (error) return <div className="text-center p-4 text-red-500">{error}</div>;

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

          {relations[field]?.length > 0 ? (
            <ul className="space-y-2">
              {relations[field].map((user) => (
                <li
                  key={user.uid}
                  className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded"
                >
                  <Link
                    to={`/user/${user.username}`}
                    className="flex items-center gap-4 hover:underline"
                  >
                    <img
                      src={user.photoUrl}
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
                  <button
                    onClick={() => handleRemove(field, user.username)}
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
        {relations.followRequests?.length > 0 ? (
          <ul className="space-y-2">
            {relations.followRequests.map((user) => (
              <li
                key={user.uid}
                className="flex justify-between items-center bg-yellow-100 dark:bg-yellow-800 px-4 py-2 rounded"
              >
                <Link
                  to={`/user/${user.username}`}
                  className="flex items-center gap-4 hover:underline"
                >
                  <img
                    src={user.photoUrl}
                    alt={user.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold">{user.fullname || user.username}</p>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  </div>
                </Link>
                <button
                  onClick={() => handleAcceptRequest(user.username)}
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