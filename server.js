const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// CORSを許可
app.use(cors());

// 簡単な動作確認用ルート
app.get("/", (req, res) => {
  res.send("Spotmood backend is running!");
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
