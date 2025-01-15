import React, { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import styles from "../styles.module.scss";
import ChatContent from "./ChatContent";
import UserList from "./UserList";
import { useInvite } from "../../../chatContext/InviteContext";
import { useRealTime } from "../../../context/RealTimeContext";
import { blockUser } from "../../../api/blockService";
import { myToast } from "../../../lib/utils1";

import {
    ChevronDown,
    Paperclip,
    Clock,
    User,
    Gamepad2,
    X,
    Check,
} from "lucide-react";
// import { useRealTime } from "../../../context/RealTimeContext";

const FriendProfile = ({
    selectedUser,
}) => {

    const navigate = useNavigate();
    const {sendInvite} = useInvite();
    
    const { sendRelationshipUpdate} = useRealTime();
    const handleBlockUser = async () => {
        try {
            await blockUser(selectedUser.name);
            myToast(2, `${selectedUser.name} has been blocked`);
            sendRelationshipUpdate("blocked", selectedUser.name);
        } catch (error) {
            console.error("Error blocking user:", error);
            myToast(0, "Failed to block user. Please try again.");
        }
    };
    
    return (
        // <div className={`${styles.chat_profile}`}>
        <div className={`${styles.chat_profile}`}>
            <div className="flex flex-col items-center mb-4 border border-blue-300 rounded-lg p-4 bg-[#1b243bae]">
            <div className="size-40 lg:max-xl:size-28  rounded-full overflow-hidden bg-gray-300 flex items-center justify-center">
                <img
                    src={selectedUser.avatar || "/default_profile.webp"}
                    alt="Profile"
                    // className="rounded-full object-cover mb-2 size-[70%]"
                    className="w-full h-full object-cover rounded-full"
                />
            </div>
                <h2 className="text-lg font-bold">{selectedUser.name}</h2>
                <p className="text-sm text-gray-400">{selectedUser.email}</p>
            
            </div>

            <div className="border rounded-lg border-blue-300 p-4 bg-[#1b243bae]">
                <div className="grid gap-2 grid-cols-1">
                    <button onClick={() => {navigate(`/user/${selectedUser.name}`)}} className="bg-green-400 bg-opacity-20 rounded-lg hover:bg-green-400 hover:bg-opacity-50 transition-all duration-200">
                        <div className="flex items-center p-3 justify-start lg:max-2xl:justify-center">
                            <div className="flex items-center">
                                <div className=" bg-green-500 bg-opacity-20 p-2 rounded-full">
                                    <User size={16} />
                                </div>
                                <div className="ml-2 lg:max-2xl:hidden">
                                    <div className="text-xs sm:text-sm lg:text-base text-gray-300">Profile</div>
                                </div>
                            </div>
                        </div>
                    </button>

                    <button 
                    onClick={() => { sendInvite(selectedUser.name) }}
                    className="bg-purple-400 bg-opacity-20 rounded-lg hover:bg-purple-400 hover:bg-opacity-50 transition-all duration-200">
                        <div className="flex items-center p-3 justify-start lg:max-2xl:justify-center">
                            <div className="flex items-center">
                                <div className="bg-purple-500 bg-opacity-20 p-2 rounded-full ">
                                    <Gamepad2 size={16} />
                                </div>
                                <div className="ml-2 lg:max-2xl:hidden">
                                    <div className="text-xs sm:text-sm lg:text-base text-gray-300">GamesPlay</div>
                                </div>
                            </div>
                        </div>
                    </button>

                    <button onClick={handleBlockUser} className="bg-red-400 bg-opacity-20 rounded-lg hover:bg-red-400 hover:bg-opacity-50 transition-all duration-200">
                        <div className="flex items-center p-3 justify-start lg:max-2xl:justify-center  ">
                            <div className="flex items-center ">
                                <div className="bg-red-400 bg-opacity-20 p-2 rounded-full ">
                                    <X size={16} />
                                </div>
                                <div className="ml-2 lg:max-2xl:hidden ">
                                    <div className="text-xs sm:text-sm lg:text-base text-gray-300">Block</div>
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