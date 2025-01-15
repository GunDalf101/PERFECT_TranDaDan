import React from "react";
import pingpong from "../../../assets/image/pingpong.png";
import styles from "./Features.module.scss";
import {
  FaUsers,
  FaTrophy,
  FaCoins,
  FaChartLine,
  FaLevelUpAlt,
  FaComments,
} from "react-icons/fa";

const Features = () => {
  return (
    <section className={`${styles.mainCards} relative text-white py-20`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6">
        <div
          className={`${styles.homeCard} p-6 rounded-lg shadow-md text-center flex flex-col items-center`}
        >
          <FaTrophy className="text-3xl mb-4" />
          <h2 className="text-lg font-bold mb-2">Achievements System</h2>
          <p>
            Reward player progress with badges, titles, and special items to
            motivate continued engagement.
          </p>
        </div>
        <div
          className={`${styles.homeCard} p-6 rounded-lg shadow-md text-center flex flex-col items-center`}
        >
          <FaCoins className="text-3xl mb-4" />
          <h2 className="text-lg font-bold mb-2">Currency System</h2>
          <p>
            Implement a virtual economy to incentivize gameplay, unlock
            features, and customize experiences.
          </p>
        </div>
        <div
          className={`${styles.homeCard} p-6 rounded-lg shadow-md text-center flex flex-col items-center`}
        >
          <FaChartLine className="text-3xl mb-4" />
          <h2 className="text-lg font-bold mb-2">User Stats</h2>
          <p>
            Track player performance to provide personalized feedback, set
            goals, and foster competition.
          </p>
        </div>
        <div
          className={`${styles.homeCard} p-6 rounded-lg shadow-md text-center flex flex-col items-center`}
        >
          <FaUsers className="text-3xl mb-4" />
          <h2 className="text-lg font-bold mb-2">Multiplayer Gameplay</h2>
          <p>
            Enhance social interaction, strategic depth, and replayability
            through competitive and cooperative modes.
          </p>
        </div>
        <div
          className={`${styles.homeCard} p-6 rounded-lg shadow-md text-center flex flex-col items-center`}
        >
          <FaLevelUpAlt className="text-3xl mb-4" />
          <h2 className="text-lg font-bold mb-2">Progression System</h2>
          <p>
            Allow players to level up, unlock new abilities, and customize their
            characters to create a sense of achievement and progression.
          </p>
        </div>
        <div
          className={`${styles.homeCard} p-6 rounded-lg shadow-md text-center flex flex-col items-center`}
        >
          <FaComments className="text-3xl mb-4" />
          <h2 className="text-lg font-bold mb-2">Social Features</h2>
          <p>
            Incorporate social features like friend lists, chat, and guilds to
            foster community and encourage player interaction.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Features;
