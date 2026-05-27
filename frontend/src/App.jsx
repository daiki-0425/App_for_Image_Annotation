import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_BASE = "http://127.0.0.1:8000";

function App() {
  const [images, setImages] = useState([]);
  const [ratings, setRatings] = useState({});
  const [index, setIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [userId, setUserId] = useState("user_1");
  const [valence, setValence] = useState(5);
  const [arousal, setArousal] = useState(5);

  useEffect(() => {
    loadInitialData();
  }, [userId]);

  const loadInitialData = async () => {
    const imageRes = await axios.get(`${API_BASE}/api/images`);
    const ratingRes = await axios.get(`${API_BASE}/api/ratings/${userId}`);
    const progressRes = await axios.get(`${API_BASE}/api/progress/${userId}`);

    const ratingMap = {};
    ratingRes.data.forEach((rating) => {
      ratingMap[rating.image_index] = rating;
    });

    const imageList = imageRes.data;
    const lastIndex = Math.min(progressRes.data.last_index, imageList.length - 1);

    setImages(imageList);
    setRatings(ratingMap);
    setIndex(lastIndex);
    setSelectedIndex(lastIndex);

    if (ratingMap[lastIndex]) {
      setValence(ratingMap[lastIndex].valence);
      setArousal(ratingMap[lastIndex].arousal);
    } else {
      setValence(5);
      setArousal(5);
    }
  };

  const applyRatingToState = (targetIndex) => {
    const savedRating = ratings[targetIndex];

    if (savedRating) {
      setValence(savedRating.valence);
      setArousal(savedRating.arousal);
    } else {
      setValence(5);
      setArousal(5);
    }
  };

  const saveCurrentRating = async () => {
    const currentImage = images[index];

    if (!currentImage) return;

    await axios.post(`${API_BASE}/api/ratings`, {
      user_id: userId,
      image_index: index,
      filename: currentImage.filename,
      valence,
      arousal,
    });

    setRatings((prev) => ({
      ...prev,
      [index]: {
        image_index: index,
        filename: currentImage.filename,
        valence,
        arousal,
      },
    }));
  };

  const handleNext = async () => {
    await saveCurrentRating();

    const nextIndex = index + 1;

    if (nextIndex < images.length) {
      setIndex(nextIndex);
      setSelectedIndex(nextIndex);
      applyRatingToState(nextIndex);
    }
  };

  const handleBack = () => {
    const prevIndex = Math.max(index - 1, 0);

    setIndex(prevIndex);
    setSelectedIndex(prevIndex);
    applyRatingToState(prevIndex);
  };

  const handleSelectImage = (e) => {
    const targetIndex = Number(e.target.value);

    setIndex(targetIndex);
    setSelectedIndex(targetIndex);
    applyRatingToState(targetIndex);
  };

  if (images.length === 0) {
    return (
      <div className="app">
        <div className="emptyCard">
          <h1>画像がありません</h1>
          <p>backend/images フォルダに画像を入れてください。</p>
        </div>
      </div>
    );
  }

  const currentImage = images[index];

  return (
    <div className="app">
      <header className="topHeader">
        <div>
          <h1>Image V/A Annotation</h1>
          <p>画像を見て Valence / Arousal を評価します</p>
        </div>

        <div className="topControls">
          <select value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="user_1">User 1</option>
            <option value="user_2">User 2</option>
            <option value="user_3">User 3</option>
          </select>

          <select value={selectedIndex} onChange={handleSelectImage}>
            {images.map((image, i) => (
              <option key={image.filename} value={i}>
                Image {i + 1}
              </option>
            ))}
          </select>

          <div className="progressBadge">
            {index + 1} / {images.length}
          </div>
        </div>
      </header>

      <section className="card imageCard">
        <div className="cardHeader">
          <div>
            <h2>{index + 1}. {currentImage.filename}</h2>
            <p>{userId} がアノテーション中</p>
          </div>
        </div>

        <div className="imageViewer">
          <img
            className="targetImage"
            src={currentImage.url}
            alt={currentImage.filename}
          />
        </div>

        <div className="buttonRow">
          <button onClick={handleBack} disabled={index === 0}>
            戻る
          </button>

          <button className="nextButton" onClick={handleNext}>
            次へ
          </button>
        </div>

        <div className="instructionBox">
          <strong>操作説明：</strong>
          画像から受ける印象をもとに、Valence は「不快〜快」、
          Arousal は「落ち着く〜刺激的」で評価してください。
          「次へ」を押すと現在の評価が自動保存されます。
          上部のプルダウンから指定番号の画像に戻れます。
        </div>
      </section>

      <section className="card">
        <div className="sectionTitle">
          <h2>Valence / Arousal</h2>
          <span>「次へ」で自動保存</span>
        </div>

        <div className="sliderBlock">
          <div className="sliderHeader">
            <h3>Valence</h3>
            <span>{valence.toFixed(2)}</span>
          </div>

          <div className="sliderRow">
            <span className="emoji">😟</span>
            <input
              type="range"
              min="1"
              max="9"
              step="0.01"
              value={valence}
              onChange={(e) => setValence(Number(e.target.value))}
            />
            <span className="emoji">😄</span>
          </div>

          <div className="labels">
            <span>不快</span>
            <span>快</span>
          </div>
        </div>

        <div className="sliderBlock">
          <div className="sliderHeader">
            <h3>Arousal</h3>
            <span>{arousal.toFixed(2)}</span>
          </div>

          <div className="sliderRow">
            <span className="emoji">😴</span>
            <input
              type="range"
              min="1"
              max="9"
              step="0.01"
              value={arousal}
              onChange={(e) => setArousal(Number(e.target.value))}
            />
            <span className="emoji">😲</span>
          </div>

          <div className="labels">
            <span>落ち着く</span>
            <span>刺激的</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;