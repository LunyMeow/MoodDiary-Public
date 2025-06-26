import { useState, useEffect, useRef, useCallback } from "react";
import { getFirebaseDB, getFirebaseAuth } from "../services/firebase";
import { collection, query, where, orderBy, limit, getDocs, startAfter, getDoc, doc } from "firebase/firestore";
import { decrypt } from "../utils/crypto";
import DiaryCard from "../components/DiaryCard";
import { Link } from "react-router-dom";

export default function CommunityStories() {
  const [diaries, setDiaries] = useState([]);
  const [userInterests, setUserInterests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);
  const observer = useRef();
  const db = getFirebaseDB();
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;

  // Kullanıcı ilgi alanlarını yükle
  useEffect(() => {
    const fetchUserInterests = async () => {
      if (!user?.uid) return;

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserInterests(userDoc.data().interests || []);
        }
      } catch (error) {
        console.error("Kullanıcı ilgi alanları yüklenirken hata:", error);
      }
    };

    fetchUserInterests();
  }, [db, user]);

  // Günlükleri yükle
  const fetchDiaries = useCallback(async () => {
    if (!hasMore) return;

    setIsLoading(true);

    try {
      let q;
      q = query(
        collection(db, "diaries"),
        where("status", "==", "public"),
        orderBy("createdAt", "desc"),
        limit(10)
      );


      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setHasMore(false);
        setIsLoading(false);
        return;
      }

      const newDiaries = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        try {
          // Günlük içeriğini çöz
          const decryptedContent = decrypt(data.content, data.aesPass);
          newDiaries.push({
            id: doc.id,
            ...data,
            content: decryptedContent,
          });
        } catch (error) {
          console.error("Günlük çözülürken hata:", error);
        }
      });

      const allDiaries = [...diaries, ...newDiaries];

      allDiaries.sort((a, b) => {
        if (userInterests.length === 0) return 0;

        const aMatchCount = a.topic?.filter(t => userInterests.includes(t)).length || 0;
        const bMatchCount = b.topic?.filter(t => userInterests.includes(t)).length || 0;

        return bMatchCount - aMatchCount; // çok eşleşen yukarı
      });

      setDiaries(allDiaries);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === (lastVisible ? 5 : 10));
    } catch (error) {
      console.error("Günlükler yüklenirken hata:", error);
    } finally {
      setIsLoading(false);
    }
  }, [db, diaries, hasMore, lastVisible, userInterests]);

  // İlk yükleme
  useEffect(() => {
    fetchDiaries();
  }, []);

  // Sonsuz kaydırma için gözlemci
  const lastDiaryRef = useCallback(node => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchDiaries();
      }
    });

    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, fetchDiaries]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-black py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-indigo-700 dark:text-indigo-400">
              Keşfet
            </h1>

            <div className="flex items-center space-x-2">
              {userInterests.length > 0 && (
                <div className="bg-indigo-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm text-indigo-700 dark:text-indigo-300">
                  İlgi Alanlarınız: {userInterests.join(", ")}
                </div>
              )}

              <Link
                to="/Dashboard"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
              >
                Ana Sayfa
              </Link>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Topluluk tarafından paylaşılan hikayeleri keşfedin. İlgi alanlarınıza göre kişiselleştirilmiş içerikler
            en üstte gösterilir. Aşağı kaydırarak daha fazlasını yükleyebilirsiniz.
          </p>
        </div>

        <div className="space-y-6">
          {diaries.length > 0 ? (
            diaries.map((diary, index) => (
              <div
                key={diary.id}
                ref={index === diaries.length - 1 ? lastDiaryRef : null}
              >
                <DiaryCard diary={diary} self={false} currentUserId={user.uid} />
              </div>
            ))
          ) : (
            !isLoading && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  Henüz paylaşılmış bir günlük bulunmamaktadır
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  İlk paylaşımı yaparak topluluğa katılın!
                </p>
              </div>
            )
          )}

          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          )}

          {!hasMore && diaries.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
              <p className="text-gray-600 dark:text-gray-300">
                Tüm günlükleri görüntülediniz. Daha fazlası için sonra tekrar kontrol edin!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}