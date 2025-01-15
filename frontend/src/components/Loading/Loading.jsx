import React from 'react';
import styles from './Loading.module.scss'


const Loading = () => {
    const loadingText = ["L", "O", "A", "D", "I", "N", "G"];

    const generateBoxShadows = (count) => {
        const shadows = [];
        for (let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * window.innerWidth);
            const y = Math.floor(Math.random() * window.innerHeight);
            shadows.push(`${x}px ${y}px #FFF`);
        }
        return shadows.join(", ");
    };

    const smallShadows = generateBoxShadows(700);
    const mediumShadows = generateBoxShadows(200);
    const bigShadows = generateBoxShadows(100);
    const reversedText = loadingText.reverse();

    return (
        <div className={`${styles.frontground} `}>
            <div className={`${styles.stars}`} style={{ boxShadow: smallShadows }}></div>
            <div className={`${styles.stars2}`} style={{ boxShadow: mediumShadows }}></div>
            <div className={`${styles.stars3}`} style={{ boxShadow: bigShadows }}></div>

            <div className={`${styles.load}`}>
                {reversedText.map((letter, index) => (
                    <div key={index}>{letter}</div>
                ))}
            </div>
        </div>
    );
};

export default Loading;