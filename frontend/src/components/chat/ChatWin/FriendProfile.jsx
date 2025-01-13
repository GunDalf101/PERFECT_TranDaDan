import React, { useEffect } from "react";
import styles from "../styles.module.scss";
import ChatContent from "./ChatContent";
import UserList from "./UserList";
import {
    ChevronDown,
    Paperclip,
    Clock,
    User,
    Gamepad2,
    X,
    Check,
} from "lucide-react";

const FriendProfile = ({
    selectedUser,
}) => {


    return (
        // <div className={`${styles.chat_profile}`}>
        <div className={`${styles.chat_profile}`}>
            <div className="flex flex-col items-center mb-4 border border-blue-300 rounded-lg p-4 bg-[#1b243bae]">
                <img
                    src={selectedUser.avatar_url || "/default_profile.webp"}
                    className="rounded-full mb-2 size-40"
                />
                <h2 className="text-lg font-bold">{selectedUser.name}</h2>
                <p className="text-sm text-gray-400">{selectedUser.email}</p>
            </div>

            <div className="border rounded-lg border-blue-300 p-4 bg-[#1b243bae]">
                <div className="grid grid-cols-2 gap-3 ">
                    <button className="bg-green-400 bg-opacity-20 rounded-lg hover:bg-green-400 hover:bg-opacity-50">
                        <div className="flex items-center p-3 justify-start">
                            <div className="flex items-center">
                                <div className="bg-green-500 bg-opacity-20 p-2 rounded-full">
                                    <User size={16} />
                                </div>
                                <div className="ml-2 ">
                                    <div className="text-xs text-gray-300">Profile</div>
                                </div>
                            </div>
                        </div>
                    </button>

                    <button className="bg-purple-400 bg-opacity-20 rounded-lg hover:bg-purple-400 hover:bg-opacity-50">
                        <div className="flex items-center p-3 justify-start">
                            <div className="flex items-center">
                                <div className="bg-purple-500 bg-opacity-20 p-2 rounded-full">
                                    <Gamepad2 size={16} />
                                </div>
                                <div className="ml-2">
                                    <div className="text-xs text-gray-300">GamesPlay</div>
                                </div>
                            </div>
                        </div>
                    </button>

                    <button className="bg-red-400 bg-opacity-20 rounded-lg hover:bg-red-400 hover:bg-opacity-50">
                        <div className="flex items-center p-3 justify-start">
                            <div className="flex items-center">
                                <div className="bg-red-400 bg-opacity-20 p-2 rounded-full">
                                    <X size={16} />
                                </div>
                                <div className="ml-2">
                                    <div className="text-xs text-gray-300  " >Block</div>
                                </div>
                            </div>
                        </div>
                    </button>
                </div>

            </div>
        </div>
        //   </div>
    );
};

export default FriendProfile;