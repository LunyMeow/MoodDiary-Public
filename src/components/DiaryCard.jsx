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
  const db = getFirebaseDB();

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [diaryData, setDiaryData] = useState(diary);
  const auth = getFirebaseAuth();
  const currentUser = auth?.currentUser;

  const [hasLiked, setHasLiked] = useState(false);

  const [sendingCommentorLiking, setSendingComentorLiking] = useState(false);

  //setUsername(diary.username.username);
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/diary/${diary.id}`;
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
      //const data = await likeDiary(diary.id);
      setSendingComentorLiking(true);
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const response = await fetch('https://likediary-skz3ms2laq-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Eğer fonksiyon auth gerektiriyorsa, token ekle
          ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
        },
        body: JSON.stringify({ diaryId: diary.id || diary.diaryId })

      });


      //const result = await getInterests();

      const data = await response.json(); // ← burada response body'si JSON'a ayrıştırılıyor






      setDiaryData(prev => {
        const updatedLikes = data.liked
          ? [...(prev.likes || []), currentUsername]
          : (prev.likes || []).filter(u => u !== currentUsername);
        return { ...prev, likes: updatedLikes };
      });
      setHasLiked(data.liked);
    } catch (err) {
      console.error("Beğeni başarısız:", err);
    } finally {
      setSendingComentorLiking(false);
    }
  };



  const handleCommentSubmit = async () => {
    if (sendingCommentorLiking || !commentText.trim()) return; // 👈 EKLENDİ

    try {
      //await addCommentToDiary(diary.id, commentText.trim());





      setSendingComentorLiking(true);
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const response = await fetch('https://addcommenttodiary-skz3ms2laq-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Eğer fonksiyon auth gerektiriyorsa, token ekle
          ...(idToken && { 'Authorization': 'Bearer ' + idToken }),
        },
        body: JSON.stringify({ diaryId: diary.diaryId, text: commentText.trim() })

      });


      //const result = await getInterests();

      const data = await response.json(); // ← burada response body'si JSON'a ayrıştırılıyor












      setDiaryData(prev => ({
        ...prev,
        comments: [...(prev.comments || []), { username: diary.username, text: commentText.trim() }],
      }));
      setCommentText("");
    } catch (err) {
      console.error("Yorum gönderilemedi:", err);
    } finally {
      setSendingComentorLiking(false);
    }
  };



  useEffect(() => {
    setUsername(diary.username);
    if (currentUser) {
      setHasLiked(diary.likes?.includes(currentUsername));
      setDiaryData(diary);

    }
  }, [diary.likes, currentUser]);




  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-[1.02]">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <Link
              to={`/User/${typeof username === "string" ? username : username || "AnonimKullanici"}`}
              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-normal text-lg"
            >
              {(typeof diary.username === "string" ? diary.username : diary.username?.username) || "Anonim Kullanıcı"} {diary.username === currentUsername ? "(sen)" : ""}
            </Link>


            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              {toDate(diary.createdAt)
                ? format(toDate(diary.createdAt), "d MMMM yyyy, HH:mm", { locale: tr })
                : "Tarih yok"}
            </p>


          </div>

          <div className="flex flex-wrap gap-2">
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
          <p className="text-gray-700 dark:text-gray-300">
            {diary.content}
          </p>
        </div>
        {!false && (
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <div className="flex space-x-4 mt-4">
                <div className="flex space-x-4 mt-4 ">
                  <button disabled={sendingCommentorLiking}

                    onClick={handleLike}
                    className={`transition ${hasLiked
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                      } ${sendingCommentorLiking ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {hasLiked ? "❤️" : "🤍"} {diaryData.likes?.length || 0}
                  </button>

                  <button
                    onClick={() => setShowComments(!showComments)}
                    className="text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                  >
                    💬 {diaryData.comments?.length || 0}
                  </button>

                  {/* Yeni eklenen paylaşım butonu */}
                  <button
                    onClick={handleShare}
                    className="text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition "
                    title="Paylaş"
                  >
                    ↗️ Paylaş
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showComments && (
          <div className="mt-4 space-y-2">
            <div className="flex gap-2">
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

            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded max-h-40 overflow-y-auto">
              {diaryData.comments?.length > 0 ? (
                diaryData.comments.map((c, i) => (
                  <p key={i} className="text-sm text-gray-800 dark:text-gray-200">
                    <strong>{c.username}:</strong> {c.text}
                  </p>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">İlk yorumunuzu yazın!</p>
              )}
            </div>
          </div>
        )}



      </div>
    </div>
  );
}