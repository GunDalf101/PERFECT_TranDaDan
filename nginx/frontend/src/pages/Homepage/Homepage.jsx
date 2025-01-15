import React from "react";
import {useState, useEffect, useRef} from "react";
import Features from "../../components/Home/Features/Features";
import Hero from "../../components/Home/Hero/Hero";
import About from "../../components/Home/About/About";
import boombox from "../../assets/image/boombox.png";
import music from "../../assets/audio/retro.mp3";
import styles from "./Homepage.module.scss";
import Footer from "../../components/Home/Footer/Footer";


const Homepage = () => {
    const musicRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const aboutSectionRef = useRef(null);
    const toogleMusicRef = () => {
        if (isPlaying) {
            musicRef.current.pause();
        } else {
            musicRef.current.play();
        }
        setIsPlaying((prev) => !prev);
    }

    const scrollToSection = () => {
        aboutSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    };

  return (
    <>
      <Hero />
      <div className={`absolute bottom-0 w-full ${styles.transitionEffect}`}>
        <div className={`${styles.mountainDivider} absolute w-full`}></div>
        <img
          src={boombox}
          id="boombox"
          alt="boombox"
          onClick={toogleMusicRef}
          className={`${styles.boombox}`} style={{transform:isPlaying ? 'rotate(350deg) scale(1.1)' : 'rotate(350deg) scale(1)',}}
        />
        <audio id="music" ref={musicRef} src={music} loop></audio>
        <div className={`${styles.scrollTriangle}`} onClick={scrollToSection}></div>
      </div>
      <About ref={aboutSectionRef} />
      <Features />
      <Footer />
    </>
  );
};

export default Homepage;
