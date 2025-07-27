import { useEffect, useState } from "react";
import './WindowsSpinner.css';

export default function RedirectMessage({ duration = 3, redirectTo = "/login" }) {
  const [count, setCount] = useState(duration);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          window.location.href = redirectTo;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [duration, redirectTo]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[30vh]">
      <p className="text-gray-800 dark:text-white text-base mb-6">
        Giriş yapmanız gerekiyor. Yönlendiriliyorsunuz... ({count})
      </p>

      <div className="windows8">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="wBall" id={`wBall_${i + 1}`}>
            <div className="wInnerBall"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
