import { Link } from "react-router-dom";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useState, useEffect } from "react";
import { getFirebaseDB } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";

import { likeDiary, addCommentToDiary } from "../services/userActions";
import { getFirebaseAuth } from "../services/firebase";



export default function DiaryCard({ diary, self = false, currentUserId = null }) {
  const [username, setUsername] = useState(null);
  const db = getFirebaseDB();

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [diaryData, setDiaryData] = useState(diary);
  const auth = getFirebaseAuth();
  const currentUser = auth?.currentUser;

  const [hasLiked, setHasLiked] = useState(false);



  const handleLike = async () => {
    try {
      const res = await likeDiary(diary.id);
      setDiaryData(prev => {
        const updatedLikes = res.data.liked
          ? [...(prev.likes || []), currentUser.uid]
          : (prev.likes || []).filter(uid => uid !== currentUser.uid);
        return { ...prev, likes: updatedLikes };
      });
      setHasLiked(res.data.liked);
    } catch (err) {
      console.error("Beğeni başarısız:", err);
    }
  };


  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;

    try {
      await addCommentToDiary(diary.id, commentText);
      setDiaryData(prev => ({
        ...prev,
        comments: [...(prev.comments || []), { username: username, text: commentText }],
      }));
      setCommentText("");
    } catch (err) {
      console.error("Yorum gönderilemedi:", err);
    }
  };


  useEffect(() => {
    if (currentUser) {
      setHasLiked(diary.likes?.includes(currentUser.uid));
    }
  }, [diary.likes, currentUser]);


  useEffect(() => {

    const fetchUsername = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", diary.userId));
        if (userDoc.exists()) {
          setUsername(userDoc.data().username || "Anonim Kullanıcı");
        }
      } catch (error) {
        console.error("Kullanıcı adı alınırken hata:", error);
        setUsername("Anonim Kullanıcı");
      }
    };

    if (diary.userId) {
      fetchUsername();
    } else {
      setUsername("Anonim Kullanıcı");
    }
  }, [db, diary.userId]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-[1.02]">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <Link
              to={`/User/${username}`}
              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-normal text-lg"
            >
              {username || "Anonim Kullanıcı"} {diary.userId === currentUserId && !self ? "(sen)" : ""}
            </Link>

            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {format(diary.createdAt.toDate(), "d MMMM yyyy, HH:mm", { locale: tr })}
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
        {!false && (<div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <div className="flex space-x-4 mt-4">
              <div className="flex space-x-4 mt-4">
                <button
                  onClick={handleLike}
                  className={`transition ${hasLiked ? "text-red-600 dark:text-red-400" : "text-gray-500 hover:text-red-600 dark:hover:text-red-400"}`}
                >
                  {hasLiked ? "❤️" : "🤍"} {diaryData.likes?.length || 0}
                </button>


                <button onClick={() => setShowComments(!showComments)} className="text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                  💬 {diaryData.comments?.length || 0}
                </button>
              </div>

            </div>

          </div>


        </div>)}

        {showComments && (
          <div className="mt-4 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Yorum yaz..."
                className="flex-1 px-3 py-1 border rounded dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={handleCommentSubmit}
                className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600"
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