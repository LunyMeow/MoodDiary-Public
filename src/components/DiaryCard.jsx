import { Link } from "react-router-dom";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useState, useEffect } from "react";
import { getFirebaseDB } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";

import { getFirebaseAuth } from "../services/firebase";
import { Timestamp } from "firebase/firestore";

function toDate(timestamp) {
  if (!timestamp) return null;

  // Eğer Date objesi ise direkt dön
  if (timestamp instanceof Date) return timestamp;

  // Firestore Timestamp objesi ise toDate kullan
  if (timestamp instanceof Timestamp) return timestamp.toDate();

  // Eğer plain obje ise ve _seconds varsa Date objesi oluştur
  if (timestamp._seconds !== undefined) {
    return new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000);
  }

  // Eğer toDate fonksiyonu varsa kullan
  if (typeof timestamp.toDate === "function") return timestamp.toDate();

  // Eğer seconds varsa (farklı formatta) dönüşüm yap
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000);

  // String ise
  if (typeof timestamp === "string") {
    const d = new Date(timestamp);
    if (!isNaN(d)) return d;
  }

  return null;
}

export default function DiaryCard({ diary, self = false, currentUsername = null }) {







  const [username, setUsername] = useState("AnonimKullanıcı");
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [diaryData, setDiaryData] = useState(diary);
  const auth = getFirebaseAuth();
  const currentUser = auth?.currentUser;

  const [hasLiked, setHasLiked] = useState(false);
  const [sendingCommentorLiking, setSendingComentorLiking] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);


  // Yeni state ekle (DiaryCard bileşeninin başına)
  const [translatedContent, setTranslatedContent] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslated, setShowTranslated] = useState(false);


  // Çeviri fonksiyonu (DiaryCard bileşenine ekle)
  const handleTranslate = async () => {
    if (isTranslating) return;

    try {
      setIsTranslating(true);
      const response = await fetch('https://translatediary-skz3ms2laq-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
          'Accept-Language': navigator.language,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ diaryId: diary.diaryId })
      });

      const result = await response.json();
      if (result.success) {
        setTranslatedContent(result.translated);
        setShowTranslated(true);
      }
    } catch (error) {
      console.error("Çeviri hatası:", error);
      alert("Çeviri yapılırken hata oluştu");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/diary/${diary.diaryId}`;
    const shareData = {
      title: `${username}'in Günlüğü`,
      text: diary.topic?.join(', ') || 'Bir günlük paylaşıyorum',
      url: shareUrl
    };

    try {
      // Native paylaşım API'sini dene
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Native destek yoksa URL'yi kopyala
        await navigator.clipboard.writeText(shareUrl);
        alert('Link kopyalandı!');
      }
    } catch (err) {
      console.error('Paylaşım hatası:', err);
      // Fallback olarak URL'yi kopyala
      await navigator.clipboard.writeText(shareUrl);
      alert('Link kopyalandı!');
    }
  };

  const handleLike = async () => {
    try {
      setSendingComentorLiking(true);
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const response = await fetch('https://likediary-skz3ms2laq-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
        },
        body: JSON.stringify({ diaryId: diary.diaryId })
      });

      const data = await response.json();

      setDiaryData(prev => {
        const updatedLikes = data.liked
          ? [...(prev.likes || []), currentUsername]
          : (prev.likes || []).filter(u => u !== currentUsername);
        //console.log(diaryData);
        return { ...prev, likes: updatedLikes };
      });
      setHasLiked(data.liked);
      setLikesCount(data.newLikesCount || 0);
    } catch (err) {
      console.error("Beğeni başarısız:", err);
    } finally {
      setSendingComentorLiking(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (sendingCommentorLiking || !commentText.trim()) return;

    try {
      setSendingComentorLiking(true);
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const response = await fetch('https://addcommenttodiary-skz3ms2laq-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
        },
        body: JSON.stringify({ diaryId: diary.diaryId, text: commentText.trim() })
      });

      const data = await response.json();
      console.log(JSON.stringify(data));
      setDiaryData(prev => ({
        ...prev,
        comments: [...(prev.comments || []), { username: currentUsername, text: commentText.trim() }],
      }));
      setCommentText("");
      setCommentsCount(data.newcommentsCount || 0);

    } catch (err) {
      console.error("Yorum gönderilemedi:", err);
    } finally {
      setSendingComentorLiking(false);
    }
  };

  useEffect(() => {
    setDiaryData(diary);
    const newUsername = typeof diary.username === "string" ? diary.username : diary.username?.username || "AnonimKullanıcı";
    setUsername(newUsername);
    setLikesCount(diary.likesCount || 0);
    setCommentsCount(diary.commentsCount || 0);

    if (currentUser && currentUsername) {
      setHasLiked(diary.likes?.includes(currentUsername) || false);
    }

    // 📍 View Count Artırma (LocalStorage kontrolüyle)
    const viewedKey = "viewedDiaryIds";
    const viewedRaw = localStorage.getItem(viewedKey);
    const viewedIds = viewedRaw ? JSON.parse(viewedRaw) : [];

    if (!viewedIds.includes(diary.diaryId)) {
      increaseViewCount(diary.diaryId);
      viewedIds.push(diary.diaryId);
      localStorage.setItem(viewedKey, JSON.stringify(viewedIds));
    }

  }, [diary.diaryId, currentUser?.uid, currentUsername]);




  const increaseViewCount = async (diaryId) => {
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      if (!idToken) return;

      await fetch('https://increaseview-skz3ms2laq-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ diaryId })
      });
    } catch (err) {
      console.error("Görüntülenme artırma hatası:", err);
    }
  };












  function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  }

  function shuffleArray(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  return (
    <div className=" bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-[1.02]">
      <div className="p-3  sm:p-6 mb-5 sm:mb-2">
        <div className="flex justify-between items-start mb-4">
          <div className="text-lg sm:text-xl">
            <Link
              to={`/User/${typeof username === "string" ? username : username || "AnonimKullanici"}`}
              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-normal"
            >
              {(typeof diary.username === "string" ? diary.username : diary.username?.username) || "Anonim Kullanıcı"}
              {diary.username === currentUsername ? "(sen)" : ""}

              {/* Toxicity uyarısı eklentisi */}
              {diary.toxicityScore > 0.5 && (
                <span className="relative group inline-block ml-1">
                  <span className="text-red-500 cursor-help">!</span>
                  <span className="
    invisible opacity-0 
    group-hover:visible group-hover:opacity-100
    transition-opacity duration-200
    absolute bottom-full left-1/2 transform -translate-x-1/2
    bg-gray-800 text-white text-xs rounded px-2 py-1
    whitespace-nowrap z-50
  ">
                    Bu günlük şiddet içerebilir
                  </span>
                </span>
              )}
            </Link>

            <p className="mb-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {toDate(diary.createdAt)
                ? format(toDate(diary.createdAt), "d MMMM yyyy, HH:mm", { locale: tr })
                : "Tarih yok"}
            </p>
          </div>

          <div className="space-x-1 sm:flex flex-wrap gap-2">
            {diary.topic?.map((topic, index) => (
              <span
                key={index}
                className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs px-2 py-1 rounded-full"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>

        <div className="prose max-w-none dark:prose-invert mb-0">
          <p className="text-lg  text-gray-700 dark:text-gray-300">
            {diary.content}
          </p>



          {/* Çeviri butonu ve sonuç alanı */}
          {false && (
            <div className="mt-4">
              <button
                onClick={handleTranslate}
                disabled={isTranslating}
                className={`flex items-center text-sm ${isTranslating
                  ? 'text-gray-400'
                  : 'text-blue-600 dark:text-blue-400 hover:underline'}`}
              >
                {isTranslating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Çevriliyor...
                  </>
                ) : (
                  '🌍 Çevir'
                )}
              </button>

              {showTranslated && translatedContent && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Çeviri ({navigator.language.split('-')[0].toUpperCase()})
                    </span>
                    <button
                      onClick={() => setShowTranslated(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {translatedContent}
                  </p>
                </div>
              )}
            </div>
          )}




        </div>

        {!false && (
          <div className="flex justify-between items-center">
            <div className=" flex space-x-4">
              <div className=" flex space-x-4 mt-2 sm:mt-4">



                
                <div className="text-base  top-5 flex space-x-2 sm:space-x-4 h-7 sm:h-10 mt-1 relative">
                  {/* ❤️ Like Butonu */}
                  <button
                    disabled={sendingCommentorLiking}
                    onClick={handleLike}
                    className={`  px-2 py-1 sm:px-3 relative flex items-center z-10 transition    ${hasLiked
                      ? "text-red-600 dark:text-red-600"
                      : "text-gray-500 hover:text-red-600 dark:hover:text-gray-700"
                      } ${sendingCommentorLiking ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {hasLiked ? "❤️" : "🤍"} {likesCount || 0}
                  </button>

                  {/* 🎯 Sabit Konumlu ve Rastgele Sıralı Avatarlar */}
                  <div className="absolute top-[-25px] sm:top-[-30px]  left-[-10px] flex gap-1 z-20 pointer-events-none">
                    {shuffleArray(diary.likes || []).slice(0, 4).map((user, i) => (
                      <Link
                        to={`/user/${user}`}
                        key={i}
                        className="pointer-events-auto"
                      >
                        <div
                          title={user}
                          className=" w-5 h-5 sm:w-6 sm:h-6 rounded-full text-white font-bold flex items-center justify-center border-2 border-white dark:border-gray-800 shadow"
                          style={{ backgroundColor: stringToColor(user) }}
                        >
                          {user.charAt(0).toUpperCase()}
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* 💬 Yorum Butonu */}
                  <button
                    onClick={() => setShowComments(!showComments)}
                    className="  p-2 sm:p-3 flex items-center  z-10 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                  >
                    💬 {commentsCount || 0}
                  </button>






                  {/* ↗️ Paylaş Butonu */}
                  <button
                    onClick={handleShare}
                    className=" p-2 sm:p-3 flex items-center  z-10 text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition"
                    title="Paylaş"
                  >
                    ↗️
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showComments && (
          <div className="mt-8 space-y-2 text-xs sm:text-sm">
            <div className="flex gap-1">
              <input
                disabled={sendingCommentorLiking}
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Yorum yaz..."
                className="flex-1 px-3 py-1 border rounded dark:bg-gray-700 dark:text-white"
              />
              <button
                disabled={sendingCommentorLiking}
                onClick={handleCommentSubmit}
                className={`bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600 transition 
                  ${sendingCommentorLiking ? "opacity-50 cursor-not-allowed" : "opacity-100"}`}
              >
                Gönder
              </button>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded max-h-40 overflow-y-auto"

              onWheel={(e) => e.stopPropagation()} // scroll event dışarı taşmasın
            >

              {diaryData.comments?.length > 0 ? (
                diaryData.comments.map((c, i) => (
                  <p key={i} className=" text-gray-800 dark:text-gray-200">
                    <strong>{c.username}:</strong> {c.text}
                  </p>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400">İlk yorumunuzu yazın!</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}