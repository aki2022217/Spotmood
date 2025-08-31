// --- PKCE用の関数 ---
function generateRandomString(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// SHA256 ハッシュを作る関数
async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer);
}

// Base64URL エンコード関数
function base64UrlEncode(arrayBuffer) {
  let string = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < arrayBuffer.length; i += chunkSize) {
    const chunk = arrayBuffer.subarray(i, i + chunkSize);
    string += String.fromCharCode.apply(null, chunk);
  }
  return btoa(string).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// code_challenge を生成する関数
async function generateCodeChallenge(codeVerifier) {
  const hashed = await sha256(codeVerifier);
  return base64UrlEncode(hashed);
}

// --- PKCE用 code_verifier と code_challenge を生成 ---
const codeVerifierKey = "pkce_code_verifier"; // sessionStorage に保存するキー
async function preparePKCE() {
  let codeVerifier = sessionStorage.getItem(codeVerifierKey);
  if (!codeVerifier) {
    codeVerifier = generateRandomString(128); // 128文字のランダム文字列
    sessionStorage.setItem(codeVerifierKey, codeVerifier);
  }
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  return { codeVerifier, codeChallenge };
}

// --- Spotify 認証設定 ---
const clientId = "8a2cddf270454c288e7a18a42184a8d4"; // Spotify ダッシュボードで取得
const redirectUri = "https://aki2022217.github.io/Spotmood/"; // GitHub Pages URL
const scopes = "user-top-read user-library-read playlist-modify-public";

// アクセストークン取得関数 (PKCE対応)
async function getSpotifyToken() {
  const hash = window.location.hash;

  // リダイレクト時に hash にトークンが含まれる場合
  if (hash) {
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get("access_token");
    if (token) {
      localStorage.setItem("spotify_token", token); // 保存
      window.location.hash = ""; // URLをきれいにする
      return token;
    }
  }

  // すでに保存済みのトークンがあれば使う
  const savedToken = localStorage.getItem("spotify_token");
  if (savedToken) {
    return savedToken;
  }

  // PKCEの準備
  const { codeChallenge } = await preparePKCE();

  // 認証画面へ遷移
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&code_challenge_method=S256&code_challenge=${codeChallenge}`;
  window.location = authUrl;
}

// --- Spotify トークン取得 ---
let spotifyToken = await getSpotifyToken();

// --- surveyData 初期化 ---
let surveyData = {
  mood: null,
  activity: [],
  bodyCondition: null,
  motivation: null,
  concentration: null,
  useHistory: false,
  useFavorites: false,
  playlistLength: { tracks: null, minutes: null },
};

// 以下、ページ遷移やSpotifyデータ取得、プレイリスト作成部分は変更なし
