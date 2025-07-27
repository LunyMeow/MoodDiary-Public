import React from 'react';
import { useLocation } from 'react-router-dom';

const texts = {
    en: {
        title: 'MoodDiary',
        tagline: 'Your private, encrypted daily journal',
        features: [
            'Private, public & followers-only sharing',
            'Follow friends and get notified',
            'Dark mode & modern UI'
        ],
        getStarted: 'Get Started',
    },
    tr: {
        title: 'MoodDiary',
        tagline: 'Gizli ve şifreli günlükleriniz',
        features: [
            'Özel, herkese açık ve takipçilere özel paylaşım',
            'Arkadaşlarını takip et ve bildirimler al',
            'Karanlık mod & modern tasarım'
        ],
        getStarted: 'Başlayın',
    }
};

function Index() {
    const lang = navigator.language.startsWith('tr') ? 'tr' : 'en';
    const t = texts[lang];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-300 to-blue-500 dark:from-gray-900 dark:to-black text-gray-900 dark:text-gray-100 p-6">
            <div className="max-w-xl text-center space-y-6">
                <h1 className="text-5xl font-extrabold">{t.title}</h1>
                <p className="text-xl">{t.tagline}</p>

                <ul className="list-disc list-inside space-y-2 text-left text-lg md:text-xl">
                    {t.features.map((f, i) => (
                        <li key={i}>{f}</li>
                    ))}
                </ul>

                <a href="/register" className="inline-block py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">
                    {t.getStarted}
                </a>
                <p className="mt-4 text-sm text-gray-800 dark:text-gray-300">
                    {lang === 'tr' ? 'Zaten bir hesabınız var mı?' : 'Already have an account?'}{' '}
                    <a href="/login" className="underline text-blue-100 hover:text-white">
                        {lang === 'tr' ? 'Giriş yapın' : 'Log in'}
                    </a>
                </p>

            </div>


        </div>
    );
}

export default Index;
