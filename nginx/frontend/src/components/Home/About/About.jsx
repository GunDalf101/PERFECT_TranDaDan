import React from "react";
import styles from "./About.module.scss";

const About = React.forwardRef(({},ref) => {
  return (
    <section className={`${styles.aboutSection} relative bg-black text-white pb-5`} ref={ref}>
      <h1 className="about-header text-2xl sm:text-3xl md:text-5xl text-center font-pixel mb-8">
        About TranDaDan
      </h1>
      <p className={`about-content text-center text-base sm:text-base md:text-xl max-w-2xl mx-auto mb-12 font-mono leading-relaxed ${styles.textShadowXl} tracking-wide`}>
        It's all about those classic games. We’re here to upload the OGs to the
        next gen, spread the love, and vibe with our chums, leaving those corpo
        scum in the dust. So plug in, grab your gear, and let’s roll — it’s time
        to game, choomba!
      </p>

      <div className="stats grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 justify-center mx-auto max-w-4xl">
        <div className="stat mx-auto flex flex-col items-center justify-center text-center p-6 rounded-xl shadow-lg font-pixel text-xl transform hover:scale-105 transition-transform duration-300">
          <div className="number text-4xl font-bold text-yellow-400 mb-5">15</div>
          <span className="block text-sm text-yellow-400">Players</span>
        </div>
        <div className="stat mx-auto flex flex-col items-center justify-center text-center p-6 rounded-xl shadow-lg font-pixel text-xl transform hover:scale-105 transition-transform duration-300">
          <div className="number text-4xl font-bold text-yellow-400 mb-5">15</div>
          <span className="block text-sm text-yellow-400">Matches</span>
        </div>
        <div className="stat mx-auto flex flex-col items-center justify-center text-center p-6 rounded-xl shadow-lg font-pixel text-xl transform hover:scale-105 transition-transform duration-300">
          <div className="number text-4xl font-bold text-yellow-400 mb-5">15</div>
          <span className="block text-sm text-yellow-400">Invites</span>
        </div>
        <div className="stat mx-auto flex flex-col items-center justify-center text-center p-6 rounded-xl shadow-lg font-pixel text-xl transform hover:scale-105 transition-transform duration-300">
          <div className="number text-4xl font-bold text-yellow-400 mb-5">15</div>
          <span className="block text-sm text-yellow-400">Groups</span>
        </div>
      </div>
    </section>
  );
});

export default About;
