// src/pages/Profile.jsx
import React from "react";
import ProfileSettings from "../components/ProfileSettings";


export default function Profile() {
    
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
                Profil Ayarları
            </h1>
            <ProfileSettings />

        </div>
    );
}
