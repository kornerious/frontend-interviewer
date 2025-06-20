/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: "AIzaSyD33KZogkjUhFgkXgm1B2s8xzCWMyVH0eQ",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "frontendinterviewer.firebaseapp.com",
    NEXT_PUBLIC_FIREBASE_DATABASE_URL: "https://frontendinterviewer-default-rtdb.europe-west1.firebasedatabase.app",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "frontendinterviewer",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "frontendinterviewer.firebasestorage.app",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "203914945813",
    NEXT_PUBLIC_FIREBASE_APP_ID: "1:203914945813:web:d69ebc950393329ee0f51c",
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: "G-T2J7ZZ408S",
    NEXT_PUBLIC_GEMINI_API_KEY: "AIzaSyD5IilNslYoSorqi3BkkaprKGLhT2GzRGU",
    NEXT_PUBLIC_OPENROUTER_API_KEY: "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"
  }
};

module.exports = nextConfig;
