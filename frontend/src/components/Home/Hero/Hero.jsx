import React from 'react'
import './background.scss'
import styles from './Hero.module.scss'
import { Link } from 'react-router-dom'

const Hero = () => {
  return (
    <section className={`${styles.heroSection} overflow-hidden relative`}>
      <div className="background absolute inset-0">
        <div className="top-half">

          <div className="mountains">
            <div className="mountain absolute bottom"></div>
            <div className="mountain absolute first"></div>
            <div className="mountain absolute second"></div>
            <div className="mountain absolute third"></div>
            <div className="mountain absolute fourth"></div>
            <div className="mountain absolute fifth"></div>
            <div className="mountain absolute sixth"></div>
            <div className="mountain absolute seventh"></div>
            <div className="mountain absolute eighth"></div>
            <div className="mountain absolute ninth"></div>
          </div>
          <div className="sun-wrapper">
            <div className="sun"></div>
          </div>
        </div>
        <div className="bottom-half">
          <div className="grid">
            <div className="grid-lines"></div>
          </div>
          <div className="overlay"></div>
        </div>
      </div>


      <div className={`${styles.content} relative flex flex-col items-center justify-center h-full`}>
        <div className="text-center">
          <h1 className={styles.heroHeader}>
            <span className={styles.firstHero}>Classic Games</span>
            <span className={styles.secondHero}>Classic Games</span>
          </h1>
          <h2 className={styles.heroSubheader}>
            Modern Battles!
          </h2>
          <p className={`text-4xl max-w-2xl mx-auto mb-10 ${styles.heroContent}`}>
            Grab a paddle, challenge a friend, and show off your skills. The
            classics are calling—answer the challenge!
          </p>
          <Link to="/game-lobby"><button className={styles.pressStartButton}>Press Start</button></Link>
        </div>
      </div>
    </section>
  )
}

export default Hero
