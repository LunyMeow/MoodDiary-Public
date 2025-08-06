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
  const [lastDocId, setLastDocId] = useState(null);

  const [currentUsername, setCurrentUsername] = useState("Anonim Kullanıcı");

  const [currentIndex, setCurrentIndex] = useState(0);

  const [hasMore, setHasMore] = useState(true); // ADD THIS STATE


  const [stage, setStage] = useState(1);




  //const functions = getFirebaseFunctions();
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!auth.currentUser) {
    return <RedirectMessage />;
  }

  const fetchPage = useCallback(async () => {
    console.log("Fonksiyon çalışıyor");
    if (!user?.uid) return; // ADD HAS MORE CHECK

    setIsLoading(true);
    console.log("Fetch ", stage, "ile çağırılıyor");
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const response = await fetch('https://getCommunityFeedV2-skz3ms2laq-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
        },
        body: JSON.stringify({ lastDocId, limit: diaries.length < 400 ? 100 : 300, limitOverride: diaries.length >= 400 })
      });

      const data = await response.json();


      const { feed, currentUsername, nextCursor } = data;
      setCurrentUsername(currentUsername);
      console.log(data.currentUsername);


      setDiaries(prev => {
        const seen = new Set(prev.map(x => x.id));
        return [...prev, ...feed.filter(d => !seen.has(d.id))];
      });

      setLastDocId(nextCursor); // Yeni aşama için cursor sıfırla
      //console.log(data,diaries.length);

      return;


    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, lastDocId, hasMore, stage]); // ADD HAS MORE DEPENDENCY


  // İlk sayfa
  useEffect(() => { fetchPage(); }, [stage]); // stage değiştiğinde çağır





  const goNext = () => {
    setCurrentIndex(prev => {
      const next = prev + 1;

      // FIX: Only fetch if we're near the end and there's more to load
      console.log(diaries.length, hasMore, next, stage);
      if (next >= diaries.length - 3 && !isLoading) {
        fetchPage();

        console.log("Yenilendi")
      }

      if (next >= diaries.length) {
        return hasMore ? prev : 0; // Don't loop if we're still loading
      }

      return next;
    });

  };



  const goPrev = () => {
    setCurrentIndex(prev => {
      const newIndex = prev - 1;
      // Eğer ilk öğeye geldiyse ve daha fazla veri yoksa, son öğeye git
      if (newIndex < 0) {
        return diaries.length - 1; // veya 0'da kalabilir
      }
      return newIndex;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {  // Bu bloğu ekleyin
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [goNext, goPrev]);  // goPrev'i bağımlılıklara ekleyin


  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => goNext(),  // Sağa kaydırma (ileri)
    onSwipedRight: () => goPrev(), // Sola kaydırma (geri)
    trackMouse: true,
    preventScrollOnSwipe: true
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-black sm:py-8 py-2">
      <div className="max-w-4xl mx-auto px-2 sm:px-4">
        <div className="text-sm  bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-xl sm:text-3xl font-bold text-indigo-700 dark:text-indigo-400">
              Keşfet
            </h1>
            <Link to="/Dashboard" className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-lg">
              Ana Sayfa
            </Link>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-1">
            Topluluğun günlüklerini keşfet. Kaydırmak serbest.
          </p>
        </div>

        <div className="relative w-full h-[50vh] flex items-center justify-center">
          <AnimatePresence initial={false}>
            {diaries[currentIndex] && (
              <motion.div
                key={diaries[currentIndex].diaryId}
                {...swipeHandlers}
                onWheel={(e) => {
                  const isCommentScroll = e.target.closest(".comment-scrollable");
                  if (!isCommentScroll) {
                    if (e.deltaY > 0) {
                      goNext();
                    } else if (e.deltaY < 0) {
                      goPrev();
                    }
                  }
                }}
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
