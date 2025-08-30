// --- Spotify 認証設定 ---
const clientId = "8a2cddf270454c288e7a18a42184a8d4"; 
const redirectUri = "https://aki2022217.github.io/spotmood/"; 
const scopes = "user-top-read user-library-read playlist-modify-public";

// アクセストークン取得関数
function getSpotifyToken() {
  const hash = window.location.hash;
  if (hash) {
    const params = new URLSearchParams(hash.substring(1));
    return params.get("access_token");
  } else {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
    window.location = authUrl;
  }
}

let spotifyToken = getSpotifyToken();

// surveyData 初期化
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

// --- ページ遷移 ---
function setupNext(pageId, nextId, name, isMultiple=false) {
  document.getElementById(nextId).addEventListener("click", function() {
    if(name){
      if(isMultiple){
        const items = document.querySelectorAll(`input[name="${name}"]:checked`);
        surveyData[name] = Array.from(items).map(i=>i.value);
      } else {
        const item = document.querySelector(`input[name="${name}"]:checked`);
        if(item) surveyData[name] = parseInt(item.value);
      }
    }
    document.getElementById(pageId).style.display = "none";
    const nextPage = document.getElementById("page" + (parseInt(pageId.replace("page",""))+1));
    if(nextPage) nextPage.style.display = "block";
  });
}

// ページ設定
setupNext("page1","next1","mood");
setupNext("page2","next2","activity",true);
setupNext("page3","next3","bodyCondition");
setupNext("page4","next4","motivation");
setupNext("page5","next5","concentration");

// ページ6：データ参照
document.getElementById("next6").addEventListener("click", function() {
  surveyData.useHistory = document.getElementById("useHistory").checked;
  surveyData.useFavorites = document.getElementById("useFavorites").checked;
  document.getElementById("page6").style.display = "none";
  document.getElementById("page7").style.display = "block";
});

// --- Spotify データ取得 ---
async function getTopTracks(limit=5){
  if(!spotifyToken) return [];
  const resp = await fetch(`https://api.spotify.com/v1/me/top/tracks?limit=${limit}`, {
    headers: { "Authorization": `Bearer ${spotifyToken}` }
  });
  const data = await resp.json();
  return data.items.map(i=>i.uri);
}

async function getTopArtistsTracks(limitPerArtist=1){
  if(!spotifyToken) return [];
  const resp = await fetch(`https://api.spotify.com/v1/me/top/artists?limit=5`, {
    headers: { "Authorization": `Bearer ${spotifyToken}` }
  });
  const data = await resp.json();
  let uris = [];
  for(const a of data.items){
    const topResp = await fetch(`https://api.spotify.com/v1/artists/${a.id}/top-tracks?market=JP`, {
      headers: { "Authorization": `Bearer ${spotifyToken}` }
    });
    const topData = await topResp.json();
    if(topData.tracks.length>0) uris.push(topData.tracks[0].uri);
  }
  return uris;
}

// --- プレイリスト作成 ---
async function createPlaylist(){
  if(!spotifyToken) return;
  
  // ユーザーID取得
  const meResp = await fetch("https://api.spotify.com/v1/me", { headers: { "Authorization": `Bearer ${spotifyToken}` } });
  const meData = await meResp.json();
  const userId = meData.id;

  // 曲取得
  let trackUris = [];
  if(surveyData.useHistory) trackUris = trackUris.concat(await getTopTracks());
  if(surveyData.useFavorites) trackUris = trackUris.concat(await getTopArtistsTracks());

  // 曲数制限
  if(surveyData.playlistLength.tracks) trackUris = trackUris.slice(0, parseInt(surveyData.playlistLength.tracks));

  // プレイリスト作成
  const playlistResp = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method:"POST",
    headers: { "Authorization": `Bearer ${spotifyToken}`, "Content-Type":"application/json" },
    body: JSON.stringify({
      name: `Spotmoodプレイリスト (${new Date().toLocaleDateString()})`,
      description: "Spotmoodが作ったプレイリスト",
      public:true
    })
  });
  const playlistData = await playlistResp.json();

  // 曲追加
  await fetch(`https://api.spotify.com/v1/playlists/${playlistData.id}/tracks`, {
    method:"POST",
    headers: { "Authorization": `Bearer ${spotifyToken}`, "Content-Type":"application/json" },
    body: JSON.stringify({ uris: trackUris })
  });

  alert("プレイリスト作成完了！Spotifyで確認してね！");
}

// ページ7：プレイリスト作成ボタン
document.getElementById("finish").addEventListener("click", function(){
  surveyData.playlistLength.tracks = document.getElementById("playlistTracks").value;
  surveyData.playlistLength.minutes = document.getElementById("playlistMinutes").value;

  createPlaylist();
  console.log("アンケートデータ:", surveyData);
});
