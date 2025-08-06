import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import RedirectMessage from "../components/RedirectMessage";

import DiaryCard from "../components/DiaryCard";

export default function UserProfile() {
  const { username } = useParams();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  //const functions = getFirebaseFunctions();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showMenu, setShowMenu] = useState(false);


  // Backend fonksiyonu
  //const getUserProfileData = httpsCallable(functions, 'getUserProfileData');
  if (!auth.currentUser) {
    return <RedirectMessage />;
  }
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        if (!currentUser) {
          setError("Giriş yapmalısınız");
          setLoading(false);
          return;
        }

        //const result = await getUserProfileData({ username });




        const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
        const response = await fetch('https://getuserprofiledata-skz3ms2laq-uc.a.run.app', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Eğer fonksiyon auth gerektiriyorsa, token ekle
            ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
          },
          body: JSON.stringify({
            username: username
          })

        });


        //const result = await getInterests();

        const dataRes = await response.json(); // ← burada response body'si JSON'a ayrıştırılıyor







        setProfileData(dataRes);
        setLoading(false);
      } catch (err) {
        console.error("Profil verileri alınırken hata:", err);
        setError(err.message || "Profil verileri alınırken hata oluştu");
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [username, currentUser]);








  const handleReportUser = async () => {
    setShowMenu(false);
    const confirm = window.confirm("Bu kullanıcıyı kötüye kullanım nedeniyle rapor etmek istediğinize emin misiniz?");
    if (!confirm) return;

    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch("https://reportusertoxicity-skz3ms2laq-uc.a.run.app", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          targetUsername: user.username
        })
      });

      const result = await res.json();
      if (result.success) {
        alert("Raporunuz işleme alındı.");
      } else {
        alert("Raporlama başarısız oldu: " + result.message);
      }
    } catch (err) {
      console.error("Raporlama hatası:", err);
      alert("Raporlama sırasında bir hata oluştu.");
    }
  };









  const handleFollowAction = async (action) => {
    setLoading(true);
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;

      // Action'a göre URL belirleme
      const url = action === 'follow'
        ? 'https://followUser-skz3ms2laq-uc.a.run.app'
        : action === 'unfollow'
          ? 'https://unfollowUser-skz3ms2laq-uc.a.run.app'
          : action === 'block'
            ? 'https://blockUser-skz3ms2laq-uc.a.run.app'
            : 'https://unblockUser-skz3ms2laq-uc.a.run.app';

      // Fetch ile isteği gönder
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
        },
        body: JSON.stringify({
          targetUsername: profileData.user.username
        })
      });

      const result = await response.json(); // Gerekirse sonucu kullan

      // Verileri yenile
      //const result = await getUserProfileData({ username });





      const response2 = await fetch('https://getuserprofiledata-skz3ms2laq-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Eğer fonksiyon auth gerektiriyorsa, token ekle
          ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
        },
        body: JSON.stringify({
          username: username
        })

      });


      //const result = await getInterests();

      const dataRes = await response2.json(); // ← burada response body'si JSON'a ayrıştırılıyor







      setProfileData(dataRes);
      setLoading(false);




    } catch (err) {
      console.error(`${action} işlemi sırasında hata:`, err);
      setError(`${action} işlemi sırasında hata oluştu`);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-2 sm:p-6 bg-white rounded shadow-md dark:bg-gray-800">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-300">Yükleniyor...</span>
        </div>
      </div>
    );
  }
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
  if (!profileData) return <div className="text-center p-8">Kullanıcı bulunamadı.</div>;

  const { user, relations, diaries } = profileData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-indigo-700 p-2 sm:p-6 dark:from-black dark:to-gray-800">
      <div className=" space-x-2  flex justify-between max-w-3xl mx-auto bg-white px-2 py-4 sm:p-5 rounded-xl shadow-md mb-5 dark:bg-gray-800">
        <Link to="/Dashboard">
          <button className="bg-blue-600 hover:bg-blue-900 text-white py-2 px-4 rounded">
            Ana Sayfa
          </button>
        </Link>

        {user.isSelf ? (
          <Link
            to="/Profile"
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-2 rounded"
          >
            Profilim ve Ayarlar
          </Link>
        ) : (
          <div className="relative">
            <button
              className="text-l text-gray-600 hover:text-black dark:text-white"
              onClick={() => setShowMenu(!showMenu)}
            >
              ☰
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-700 border rounded shadow">
                <button
                  onClick={handleReportUser}
                  className="block w-full text-left px-2 py-2 text-red-600 hover:bg-red-100 dark:hover:bg-gray-600"
                >
                  Kullanıcıyı Raporla
                </button>
              </div>
            )}
          </div>
        )}
      </div>






      <div className="max-w-3xl mx-auto bg-white p-2 sm:p-6 rounded-xl shadow-lg dark:bg-gray-800">
        <div className="flex flex-wrap gap-4 mb-4 w-full sm:w-auto">
          <img
            src={user.photoUrl}
            className="w-20 rounded-full"
            alt="Profil"
          />
          <h1 className="text-xl  sm:text-2xl font-bold text-indigo-800 dark:text-white">
            {user.fullname || user.username}
            {user.isSelf && "(Sen)"}
          </h1>

          <div className="flex gap-6 text-center">
            <div>
              <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
                {user.followersCount}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Takipçi</p>
            </div>
            <div>
              <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
                {user.followingCount}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Takip Edilen</p>
            </div>
          </div>

          {!user.isSelf && (
            <div className="flex gap-4 mb-2 text-sm sm:text-lg">
              {relations.isFollowing ? (
                <button
                  onClick={() => handleFollowAction('unfollow')}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-2 sm:px-4 py-1 rounded"
                >
                  Takipten Çık
                </button>
              ) : relations.isRequestedByYou ? (
                <button
                  onClick={() => handleFollowAction('unfollow')}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 sm:px-4 py-1 rounded"
                >
                  İsteği Geri Çek
                </button>
              ) : (
                <button
                  onClick={() => handleFollowAction('follow')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-2 sm:px-4 py-1 rounded"
                >
                  Takip Et
                </button>
              )}

              {relations.isBlocked ? (
                <button
                  onClick={() => handleFollowAction('unblock')}
                  className="text-sm text-purple-600 hover:underline bg-slate-100"
                >
                  Engel Kaldır
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (window.confirm("Bu kullanıcıyı engellemek istediğinize emin misiniz?")) {
                      handleFollowAction('block');
                    }
                  }}
                  className="text-sm text-red-600 hover:underline bg-yellow-300 hover:bg-yellow-500"
                >
                  Bu kullanıcıyı engelle
                </button>
              )}
            </div>
          )}


        </div>

        <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">
          Paylaşılan Günlükler
        </h2>

        {diaries.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">
            {user.isSelf ? "Henüz günlük paylaşmadınız." : "Bu kullanıcı henüz herkese açık günlük paylaşmamış."}
          </p>
        ) : (
          <ul className="space-y-6">
            {diaries.map((diary) => (
              <li key={diary.diaryId} className="border p-2 rounded shadow bg-white dark:bg-gray-700 dark:text-white">
                <DiaryCard diary={diary} currentUsername={profileData.relations.currentUsername} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}