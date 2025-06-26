# MoodDiary ✨

**MoodDiary**, React ve Firebase kullanılarak geliştirilmiş, kullanıcıların duygularını ve günlüklerini kolayca kaydedip yönetebileceği modern bir web uygulamasıdır.



## 📌 Özellikler

* **Kullanıcı Kaydı ve Oturum Açma**: Firebase Authentication ile güvenli kullanıcı yönetimi.
* **Kişisel Profil Yönetimi**: Kullanıcı adı, tam ad ve şifre gibi bilgileri güncelleyebilme.
* **Duygu ve Günlük Kaydı**: Kullanıcılar, günlüklerini yazarken ruh hallerini seçebilirler.
* **Bildirim Sistemi**: Takip edilen kullanıcıların aktiviteleri hakkında bildirimler alabilirsiniz.
* **Karanlık Mod Desteği**: Tailwind CSS ile responsive ve modern bir tasarım.
* **Veri Senkronizasyonu**: Firebase Firestore ile gerçek zamanlı veri güncellemeleri.

---

## 🛠️ Teknolojiler

* **Frontend**: React, Vite, Tailwind CSS
* **Backend**: Firebase Functions
* **Veritabanı**: Firebase Firestore
* **Kimlik Doğrulama**: Firebase Authentication

---

## 🚀 Başlarken

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/LunyMeow/MoodDiary.git
cd MoodDiary
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

### 3. Firebase Projesi Oluşturun

* Firebase Console üzerinden yeni bir proje oluşturun.
* Firebase Authentication, Firestore ve Functions servislerini etkinleştirin.
* `.env` dosyasını oluşturun ve aşağıdaki ortam değişkenlerini ekleyin:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 4. Firebase Functions İçin Ortam Değişkenlerini Ayarlayın

```bash
firebase functions:config:set firebase.api_key="your-api-key" firebase.auth_domain="your-auth-domain" firebase.project_id="your-project-id"
```

### 5. Uygulamayı Başlatın

```bash
npm run dev
```

---


---

## 🤝 Katkı Sağlama

Katkılarınız için teşekkür ederiz! Lütfen aşağıdaki adımları izleyerek katkı sağlayabilirsiniz:

1. Bu repository'yi fork'layın.
2. Yeni bir dal oluşturun (`git checkout -b feature-xyz`).
3. Değişikliklerinizi yapın ve commit'leyin (`git commit -am 'Add feature xyz'`).
4. Dalınızı GitHub'a push'layın (`git push origin feature-xyz`).
5. Bir pull request açın.

---

## Lisans

Bu proje [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0) altında lisanslanmıştır.  
Detaylar için `LICENSE` dosyasını inceleyebilirsiniz.

---

<img src="https://raw.githubusercontent.com/LunyMeow/MoodDiary/refs/heads/main/ScreenShots/1.png"></img>
<img src="https://raw.githubusercontent.com/LunyMeow/MoodDiary/refs/heads/main/ScreenShots/2.png"></img>
<img src="https://raw.githubusercontent.com/LunyMeow/MoodDiary/refs/heads/main/ScreenShots/3.png"></img>
<img src="https://raw.githubusercontent.com/LunyMeow/MoodDiary/refs/heads/main/ScreenShots/4.png"></img>
<img src="https://raw.githubusercontent.com/LunyMeow/MoodDiary/refs/heads/main/ScreenShots/5.png"></img>



<img src="https://raw.githubusercontent.com/LunyMeow/MoodDiary/refs/heads/main/ScreenShots/6.png"></img>
<img src="https://raw.githubusercontent.com/LunyMeow/MoodDiary/refs/heads/main/ScreenShots/7.png"></img>
<img src="https://raw.githubusercontent.com/LunyMeow/MoodDiary/refs/heads/main/ScreenShots/8.png"></img>





