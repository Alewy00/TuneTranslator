import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Spinner from "../layout/Spinner";
import Moment from "react-moment";

const Lyrics = (props) => {
  const [track, setTrack] = useState({});
  const [lyrics, setLyrics] = useState("");
  const [lang, setLang] = useState("en");
  const [prevLang, setPrevLang] = useState("en");
  const [flag, setFlag] = useState(false);

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
        console.log(lyrics);
        setLyrics(lyrics);

        return axios.get(
          `https://cors-anywhere.herokuapp.com/http://api.musixmatch.com/ws/1.1/track.get?track_id=${props.match.params.id}&apikey=${process.env.REACT_APP_MM_KEY}`
        );
      })
      .then((res) => {
        let track = res.data.message.body.track;
        setTrack({ track });
      })
      .catch((err) => console.log(err));
  }, [props.match.params.id]);

  useEffect(() => {
    // Function to fetch lyrics based on the selected language
    const fetchLyrics = async () => {
      console.log("trans");
      try {
        // const response = await axios.get(
        //   `https://cors-anywhere.herokuapp.com/http://api.musixmatch.com/ws/1.1/track.subtitle.translation.get?track_id=${props.match.params.id}&apikey=${process.env.REACT_APP_MM_KEY}`
        // );

        // let ogLang = prevLang;

        const API_KEY = [process.env.REACT_APP_API];

        let url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;
        url += "&q=" + encodeURI(lyrics);
        url += `&source=${prevLang}`;
        url += `&target=${lang}`;
        fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })
          .then((res) => res.json())
          .then((response) => {
            console.log("response from google: ", response);
            // const lyricsData = response.data.message.body.lyrics;
            if (response.data !== undefined) {
              console.log(response);
              let lyricsData = response.data.translations[0].translatedText;
              while (lyricsData.includes("&#39")) {
                console.log("in loop");
                lyricsData = lyricsData.replace("&#39;", "'");
              }
              setLyrics(lyricsData);
            }
          });
      } catch (error) {
        console.error("Error fetching lyrics:", error);
      }
    };
    if (flag) {
      fetchLyrics();
    }
    setFlag(false);
  }, [props.match.params.id, lang]);

  const handleLanguageChange = (event) => {
    console.log("handle change");
    const newLang = event.target.value;
    setPrevLang(lang);
    setLang(newLang);
    setFlag(true);
  };

  if (
    track === undefined ||
    lyrics === undefined ||
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
            <p className="card-text">{lyrics}</p>
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
            <label htmlFor="langSelect">Select a Language:</label>
            <select
              id="langSelect"
              value={lang}
              onChange={handleLanguageChange}
            >
              <option value="en">English</option>
              <option value="he">Hebrew</option>
              <option value="es">Spanish</option>
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
