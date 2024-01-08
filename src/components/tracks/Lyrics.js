import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Spinner from "../layout/Spinner";
import Moment from "react-moment";
import "../../styles/lyrics.css";
const Lyrics = (props) => {
  const [track, setTrack] = useState({});
  const [lyrics1, setLyrics1] = useState([]);
  const [lyrics2, setLyrics2] = useState([]);
  const [translatedLyrics, setTranslatedLyrics] = useState({
    lang1: [],
    lang2: [],
  });

  const [lang1, setLang1] = useState("en");
  const [lang2, setLang2] = useState("en");
  const [prevLang1, setPrevLang1] = useState("en");
  const [prevLang2, setPrevLang2] = useState("en");
  const [flag1, setFlag1] = useState(false);
  const [flag2, setFlag2] = useState(false);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(-1);

  useEffect(() => {
    axios
      .get(
        `https://cors-anywhere.herokuapp.com/http://api.musixmatch.com/ws/1.1/track.lyrics.get?track_id=${props.match.params.id}&apikey=${process.env.REACT_APP_MM_KEY}`
      )
      // axios
      // .get(
      //   `https://cors-anywhere.herokuapp.com/http://api.musixmatch.com/ws/1.1/track.subtitle.get?track_id=${props.match.params.id}&apikey=${process.env.REACT_APP_MM_KEY}`
      // )
      .then((res) => {
        let lyrics = res.data.message.body.lyrics.lyrics_body;
        // console.log(lyrics);

        // console.log(splitWords(lyrics));
        setLyrics1(splitWords(lyrics));
        setLyrics2(splitWords(lyrics));
        return axios.get(
          `https://cors-anywhere.herokuapp.com/http://api.musixmatch.com/ws/1.1/track.get?track_id=${props.match.params.id}&apikey=${process.env.REACT_APP_MM_KEY}`
        );
      })
      .then((res) => {
        let track = res.data.message.body.track;
        setTrack({ track });
        setCurrentPhraseIndex(0);
        console.log("Current Phrase Index:", currentPhraseIndex);
      })
      .catch((err) => console.log(err));
  }, [props.match.params.id]);

  const isInitialRender = useRef(true);

  const fetchLyrics = async (index) => {
    try {
      const API_KEY = process.env.REACT_APP_API;

      const translateLyrics = async (sourceLang, targetLang) => {
        let transLyric1 = [];
        let transLyric2 = [];

        const translate = async (phrase, i) => {
          let url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;
          url += "&q=" + encodeURI(phrase);
          url += `&source=${sourceLang}`;
          url += `&target=${targetLang}`;

          try {
            const response = await fetch(url, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
            });

            if (!response.ok) {
              console.error(
                "Translation API error:",
                response.status,
                response.statusText
              );
              return null; // Return null on error
            }

            const translationData = await response.json();

            if (translationData.data !== undefined) {
              let translatedPhrase =
                translationData.data.translations[0].translatedText;
              while (translatedPhrase.includes("&#39")) {
                translatedPhrase = translatedPhrase.replace("&#39;", "'");
              }
              return translatedPhrase;
            }
          } catch (error) {
            console.error("Error during translation:", error);
            return null;
          }
        };

        // console.log("translating");
        console.log(prevLang1);
        console.log(lang1);
        console.log(prevLang2);
        console.log(lang2);
        if (flag1) {
          for (const phrase of lyrics1) {
            const translatedPhrase = await translate(phrase);

            if (translatedPhrase !== null) {
              transLyric1.push(translatedPhrase);
            }
          }
          setLyrics1(transLyric1);
          console.log(lyrics1);
        }
        if (flag2) {
          for (const phrase of lyrics2) {
            const translatedPhrase = await translate(phrase);
            if (translatedPhrase !== null) {
              transLyric2.push(translatedPhrase);
            }
          }
          setLyrics2(transLyric2);
          console.log(lyrics2);
        }

        return { transLyric1, transLyric2 };
      };

      if (flag1) {
        await translateLyrics(prevLang1, lang1);
      }
      if (flag2) {
        await translateLyrics(prevLang2, lang2);
      }
      if (flag1) {
        setFlag1(false);
        setCurrentPhraseIndex(0);
      }
      if (flag2) {
        setFlag2(false);
        setCurrentPhraseIndex(0);
      }
    } catch (error) {
      console.error("Error fetching lyrics:", error);
    }
  };

  useEffect(() => {
    fetchLyrics();
  }, [
    props.match.params.id,
    lang1,
    lang2,
    prevLang1,
    prevLang2,
    flag1,
    flag2,
    setCurrentPhraseIndex,
  ]);

  function hasAlphaChars(str) {
    return /^[a-zA-Z]/.test(str);
  }

  const splitWords = (lyrics) => {
    let newLyrics = [];
    let words = lyrics;
    words = words.split(" \n");
    words.forEach((word, index, array) => {
      if (word.includes("\n")) {
        array[index] = word.replace(/\n/g, "$");
      }
    });
    words = words.join(" ");
    let phrase = words.split("$");
    phrase.forEach((word) => {
      if (hasAlphaChars(word)) {
        newLyrics.push(word);
      }
    });
    // console.log(newLyrics);
    return newLyrics;
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentPhraseIndex((prevIndex) => {
        const newLength = lyrics1.length;
        // If the array length has changed, reset the index to 0
        return newLength === prevIndex ? 0 : (prevIndex + 1) % newLength;
      });
    }, 5000);

    return () => clearInterval(intervalId);
  }, [lyrics1]); // Update the dependency array to include 'lyrics'

  const handleLanguageChange = async (event, langIndex) => {
    console.log("handle change");
    const newLang = event.target.value;

    if (langIndex === 1) {
      setPrevLang1(lang1);
      setLang1(newLang);
      setFlag1(true);
      console.log("new lang " + newLang);
    } else if (langIndex === 2) {
      setPrevLang2(lang2);
      setLang2(newLang);
      setFlag2(true);
      console.log("new lang2 " + newLang);
    }

    await fetchLyrics();
  };

  const renderLyrics = (i) => {
    let lyrics;
    let lang;
    if (i === 1) {
      lyrics = lyrics1;
      lang = lang1;
    } else {
      lyrics = lyrics2;
      lang = lang2;
    }
    // console.log(lyrics);

    return lyrics.map((phrase, index) => (
      <div key={index}>
        <span
          className={`lyrics-line ${
            index === currentPhraseIndex ? "current-line" : ""
          } ${
            isFirstLine && index === (currentPhraseIndex + 1) % lyrics.length
              ? "fade-in-out"
              : ""
          } ${
            !isFirstLine &&
            index === (currentPhraseIndex - 1 + lyrics.length) % lyrics.length
              ? "fade-out"
              : ""
          } ${
            index === (currentPhraseIndex + 1) % lyrics.length
              ? "fade-in-out"
              : ""
          }`}
        >
          {index === currentPhraseIndex
            ? `Current line (${lang}): ${phrase}`
            : isFirstLine && index === (currentPhraseIndex + 1) % lyrics.length
            ? `Next line (${lang}): ${phrase}`
            : !isFirstLine &&
              index === (currentPhraseIndex - 1 + lyrics.length) % lyrics.length
            ? `Previous line (${lang}): ${phrase}`
            : index === (currentPhraseIndex + 1) % lyrics.length
            ? `Next line (${lang}): ${phrase}`
            : ""}
        </span>
      </div>
    ));
  };

  const isFirstLine = currentPhraseIndex === 0;

  if (
    track === undefined ||
    lyrics1 === undefined ||
    lyrics2 === undefined ||
    Object.keys(track).length === 0
  ) {
    return <Spinner />;
  } else {
    {
    }
    return (
      <>
        <Link to="/" className="btn btn-dark btn-sm mb-4">
          Go Back
        </Link>
        <div className="card">
          <h5 className="card-header">
            {track.track.track_name} by{" "}
            <span className="text-secondary">{track.track.artist_name}</span>
          </h5>
          <div className="card-body">
            <p className="card-text">{lyrics1 && renderLyrics(1)}</p>
            <p className="card-text">{lyrics2 && renderLyrics(2)}</p>
          </div>
        </div>

        <ul className="list-group mt-3">
          <li className="list-group-item">
            <strong>Album ID</strong>: {track.track.album_id}
          </li>
          <li className="list-group-item">
            <strong>Song Genre</strong>:{" "}
            {track.track.primary_genres.music_genre_list.length === 0
              ? "NO GENRE AVAILABLE"
              : track.track.primary_genres.music_genre_list[0].music_genre
                  .music_genre_name}
          </li>
          <li className="list-group-item">
            <strong>Explicit Words</strong>:{" "}
            {track.track.explicit === 0 ? "No" : "Yes"}
          </li>
          <li className="list-group-item">
            <strong>Release Date</strong>:{" "}
            <Moment format="MM/DD/YYYY">
              {track.track.first_release_date}
            </Moment>
          </li>
          <li className="list-group-item">
            <label htmlFor="langSelect1">Select Language 1:</label>
            <select
              id="langSelect1"
              value={lang1}
              onChange={(e) => handleLanguageChange(e, 1)}
            >
              <option value="en">English</option>
              <option value="he">Hebrew</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
              <option value="ru">Russian</option>
              <option value="zh">Chinese</option>
              <option value="ar">Arabic</option>
              <option value="hi">Hindi</option>
              <option value="pt">Portuguese</option>
              <option value="nl">Dutch</option>
            </select>

            <label htmlFor="langSelect2">Select Language 2:</label>
            <select
              id="langSelect2"
              value={lang2}
              onChange={(e) => handleLanguageChange(e, 2)}
            >
              <option value="en">English</option>
              <option value="he">Hebrew</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
              <option value="ru">Russian</option>
              <option value="zh">Chinese</option>
              <option value="ar">Arabic</option>
              <option value="hi">Hindi</option>
              <option value="pt">Portuguese</option>
              <option value="nl">Dutch</option>
            </select>
          </li>
        </ul>
      </>
    );
  }
};

function initializeDropdown() {
  document.addEventListener("DOMContentLoaded", function () {
    // Get the button and dropdown content
    var dropdownButton = document.querySelector(".dropbtn");
    var dropdownContent = document.getElementById("myDropdown");

    // Toggle the "show" class when the button is clicked
    dropdownButton.addEventListener("click", function () {
      dropdownContent.classList.toggle("show");
    });

    // Close the dropdown if the user clicks outside of it
    window.addEventListener("click", function (event) {
      if (!event.target.matches(".dropbtn")) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        for (var i = 0; i < dropdowns.length; i++) {
          var openDropdown = dropdowns[i];
          if (openDropdown.classList.contains("show")) {
            openDropdown.classList.remove("show");
          }
        }
      }
    });
  });
}
document.addEventListener("DOMContentLoaded", initializeDropdown);

export default Lyrics;
