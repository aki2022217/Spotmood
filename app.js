// --- Spotify 認証設定 ---
const clientId = "8a2cddf270454c288e7a18a42184a8d4"; // Spotify ダッシュボードで取得
const redirectUri = "https://aki2022217.github.io/spotmood/"; // GitHub Pages URL
const scopes = "user-top-read user-library-read playlist-modify-public";

// アクセストークン取得関数
function getSpotifyToken() {
  const hash = window.location.hash;
  if (hash) {
    const params = new URLSearchParams(hash.substring(1));
    return params.get("access_token");
  } else {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
    window.location = authUrl; // 認証画面に飛ぶ
  }
}

let spotifyToken = getSpotifyToken();

// surveyDataの初期化
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

// --- ページ遷移処理 ---
// ページ1：気分
document.getElementById("next1").addEventListener("click", function() {
  const mood = document.querySelector('input[name="mood"]:checked');
  if(mood) surveyData.mood = parseInt(mood.value);
  document.getElementById("page1").style.display = "none";
  document.getElementById("page2").style.display = "block";
});

// ページ2：活動
document.getElementById("next2").addEventListener("click", function() {
  const activities = document.querySelectorAll('input[name="activity"]:checked');
  surveyData.activity = Array.from(activities).map(a => a.value);
  document.getElementById("page2").style.display = "none";
  document.getElementById("page3").style.display = "block";
});

// ページ3：体の調子
document.getElementById("next3").addEventListener("click", function() {
  const val = document.querySelector('input[name="bodyCondition"]:checked');
  if(val) surveyData.bodyCondition = parseInt(val.value);
  document.getElementById("page3").style.display = "none";
  document.getElementById("page4").style.display = "block";
});

// ページ4：やる気
document.getElementById("next4").addEventListener("click", function() {
  const val = document.querySelector('input[name="motivation"]:checked');
  if(val) surveyData.motivation = parseInt(val.value);
  document.getElementById("page4").style.display = "none";
  document.getElementById("page5").style.display = "block";
});

// ページ5：集中度
document.getElementById("next5").addEventListener("click", function() {
  const val = document.querySelector('input[name="concentration"]:checked');
  if(val) surveyData.concentration = parseInt(val.value);
  document.getElementById("page5").style.display = "none";
  document.getElementById("page6").style.display = "block";
});

// ページ6：参照データ
document.getElementById("next6").addEventListener("click", function() {
  surveyData.useHistory = document.getElementById("useHistory").checked;
  surveyData.useFavorites = document.getElementById("useFavorites").checked;
  document.getElementById("page6").style.display = "none";
  document.getElementById("page7").style.display = "block";
});

// --- Spotify API 関数 ---
// トップ再生履歴取得
async function getTopTracks() {
  if(!spotifyToken) return;
  const response = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=5", {
    headers: {
      "Authorization": `Bearer ${spotifyToken}`
    }
  });
  const data = await response.json();
  console.log("ユーザーの再生履歴トップ5:", data.items.map(item => item.name + " - " + item.artists[0].name));
}

// お気に入りアーティスト取得
async function getTopArtists() {
  if(!spotifyToken) return;
  const response = await fetch("https://api.spotify.com/v1/me/top/artists?limit=5", {
    headers: {
      "Authorization": `Bearer ${spotifyToken}`
    }
  });
  const data = await response.json();
  console.log("ユーザーのお気に入りアーティストトップ5:", data.items.map(item => item.name));
}

// ページ7：プレイリスト長さ
document.getElementById("finish").addEventListener("click", function() {
  surveyData.playlistLength.tracks = document.getElementById("playlistTracks").value;
  surveyData.playlistLength.minutes = document.getElementById("playlistMinutes").value;

  // Spotify API データ取得
  if(surveyData.useHistory) getTopTracks();
  if(surveyData.useFavorites) getTopArtists();

  alert("アンケート完了！\n" + JSON.stringify(surveyData));
});
