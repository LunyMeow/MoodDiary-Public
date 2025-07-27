import { useState, useEffect, useCallback } from "react";
import { getFirebaseAuth, getFirebaseFunctions } from "../services/firebase";

import DiaryCard from "../components/DiaryCard";
import { Link } from "react-router-dom";

import { motion, AnimatePresence } from "framer-motion";
import { useSwipeable } from "react-swipeable";
import RedirectMessage from "../components/RedirectMessage";


export default function CommunityStories() {
  const [diaries, setDiaries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastAlgoCursor, setLastAlgoCursor] = useState(null);

  const [currentUsername, setCurrentUsername] = useState("Anonim Kullanıcı");

  const [currentIndex, setCurrentIndex] = useState(0);


  //const functions = getFirebaseFunctions();
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!auth.currentUser) {
    return <RedirectMessage />;
  }

  const fetchPage = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      //const getFeed = httpsCallable(functions, "getCommunityFeed");
      //const res = await getFeed({ lastAlgoCursor });








      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const response = await fetch('https://getcommunityfeed-skz3ms2laq-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Eğer fonksiyon auth gerektiriyorsa, token ekle
          ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
        },
        body: JSON.stringify({ lastAlgoCursor })

      });


      //const result = await getInterests();

      const data = await response.json(); // ← burada response body'si JSON'a ayrıştırılıyor

      const { diaries: fetched, cursors, currentUsername } = data;
      setCurrentUsername(currentUsername);

      setDiaries(prev => {
        const seen = new Set(prev.map(x => x.id));
        return [...prev, ...fetched.filter(d => !seen.has(d.id))];
      });

      setLastAlgoCursor(cursors.lastAlgoCursor);


    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [user?.username, lastAlgoCursor]);


  // İlk sayfa
  useEffect(() => { fetchPage(); }, []);





  const goNext = () => {
    setCurrentIndex(prev => {
      const next = prev + 1;
      // Son 3 öğeye geldiğinde ve daha fazla veri varsa yükle
      if (next >= diaries.length - 3 && !isLoading) {
        fetchPage();
      }
      // Eğer sonuncuya geldiyse ve daha fazla veri yoksa, ilk öğeye dön
      if (next >= diaries.length) {
        return 0; // veya prev olarak kalabilir
      }
      return next;
    });

  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault(); // boşluk kaydırma yaparken sayfa aşağı kaymasın
        goNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [goNext]); // goNext bağımlılık olarak eklenebilir
  const swipeHandlers = useSwipeable({
    onSwipedLeft: goNext,
    onSwipedRight: () => { goNext },
    trackMouse: true,
    preventScrollOnSwipe: true
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-black py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-indigo-700 dark:text-indigo-400">Keşfet</h1>
            <Link to="/Dashboard" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg">
              Ana Sayfa
            </Link>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Topluluğun günlüklerini keşfet.
          </p>
        </div>

        <div className="relative w-full h-[50vh] flex items-center justify-center">
          <AnimatePresence initial={false}>
            {diaries[currentIndex] && (
              <motion.div
                key={diaries[currentIndex].id}
                {...swipeHandlers}
                onWheel={e => e.deltaY > 0 && goNext()}
                onKeyDown={e => e.key === 'ArrowRight' && goNext()}
                tabIndex={0}
                className="w-full max-w-md mx-auto"
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <DiaryCard
                  diary={diaries[currentIndex]}
                  currentUsername={currentUsername}
                />
              </motion.div>
            )}
          </AnimatePresence>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
