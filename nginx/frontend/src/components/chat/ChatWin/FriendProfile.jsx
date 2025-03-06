import React, {useState} from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles.module.scss";
import { useInvite } from "../../../chatContext/InviteContext";
import { useRealTime } from "../../../context/RealTimeContext";
import { blockUser } from "../../../api/blockService";
import { myToast } from "../../../lib/utils1";

import {
    User,
    Gamepad2,
    X,
    Trophy,
} from "lucide-react";

const FriendProfile = ({
    selectedUser,
    handleTournamentRequest,
}) => {
    const navigate = useNavigate();
    const { sendInvite } = useInvite();
    const { sendRelationshipUpdate } = useRealTime();
    
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
        <div className={`${styles.chat_profile}`}>
            {/* Profile Card with Responsive Sizing */}
            <div className="flex flex-col items-center mb-2 md:mb-4 border border-blue-300 rounded-lg p-2 md:p-4 bg-[#1b243bae]">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36 
                               2xl:w-[150px] 2xl:h-[150px] rounded-full overflow-hidden bg-gray-300 flex items-center justify-center">
                    <img
                        src={selectedUser?.avatar || "/default_profile.webp"}
                        alt="Profile"
                        className="w-full h-full object-cover rounded-full"
                    />
                </div>
                <h2 className="text-sm sm:text-base md:text-lg font-bold mt-2 text-center truncate max-w-full">
                    {selectedUser?.name}
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 truncate max-w-full">
                    {selectedUser?.email || ""}
                </p>
            </div>

            {/* Actions Grid with Responsive Design */}
            <div className="border rounded-lg border-blue-300 p-2 md:p-4 bg-[#1b243bae]">
                <div className="grid gap-1 sm:gap-2 grid-cols-2">
                    {/* Profile Button */}
                    <button 
                        onClick={() => { navigate(`/user/${selectedUser?.name}`) }} 
                        className="bg-green-400 bg-opacity-20 rounded-lg hover:bg-green-400 hover:bg-opacity-50 transition-all duration-200"
                    >
                        <div className="flex items-center p-2 sm:p-3 justify-start lg:max-[2235px]:justify-center">
                            <div className="flex items-center">
                                <div className="bg-green-500 bg-opacity-20 p-1 sm:p-2 rounded-full">
                                    <User size={14} className="sm:size-4" />
                                </div>
                                <div className="ml-1 sm:ml-2 lg:max-[2235px]:hidden">
                                    <p className="text-[8px] sm:text-[10px] lg:text-[12px] text-gray-300">Profile</p>
                                </div>
                            </div>
                        </div>
                    </button>

                    {/* Game Button */}
                    <button
                        onClick={() => { sendInvite(selectedUser?.name) }}
                        className="bg-purple-400 bg-opacity-20 rounded-lg hover:bg-purple-400 hover:bg-opacity-50 transition-all duration-200"
                    >
                        <div className="flex items-center p-2 sm:p-3 justify-start lg:max-[2235px]:justify-center">
                            <div className="flex items-center">
                                <div className="bg-purple-500 bg-opacity-20 p-1 sm:p-2 rounded-full">
                                    <Gamepad2 size={14} className="sm:size-4" />
                                </div>
                                <div className="ml-1 sm:ml-2 lg:max-[2235px]:hidden">
                                    <p className="text-[8px] sm:text-[10px] lg:text-[12px] text-gray-300">Game</p>
                                </div>
                            </div>
                        </div>
                    </button>

                    {/* Tournament Button */}
                    <button
                        onClick={handleTournamentRequest}
                        className="bg-blue-400 bg-opacity-20 rounded-lg hover:bg-blue-400 hover:bg-opacity-50 transition-all duration-200"
                    >
                        <div className="flex items-center p-2 sm:p-3 justify-start lg:max-[2235px]:justify-center">
                            <div className="flex items-center">
                                <div className="bg-blue-500 bg-opacity-20 p-1 sm:p-2 rounded-full">
                                    <Trophy size={14} className="sm:size-4" />
                                </div>
                                <div className="ml-1 sm:ml-2 lg:max-[2235px]:hidden">
                                    <p className="text-[8px] sm:text-[10px] lg:text-[12px] text-gray-300">Tournament</p>
                                </div>
                            </div>
                        </div>
                    </button>

                    {/* Block Button */}
                    <button 
                        onClick={handleBlockUser} 
                        className="bg-red-400 bg-opacity-20 rounded-lg hover:bg-red-400 hover:bg-opacity-50 transition-all duration-200"
                    >
                        <div className="flex items-center p-2 sm:p-3 justify-start lg:max-[2235px]:justify-center">
                            <div className="flex items-center">
                                <div className="bg-red-400 bg-opacity-20 p-1 sm:p-2 rounded-full">
                                    <X size={14} className="sm:size-4" />
                                </div>
                                <div className="ml-1 sm:ml-2 lg:max-[2235px]:hidden">
                                    <p className="text-[8px] sm:text-[10px] lg:text-[12px] text-gray-300">Block</p>
                                </div>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FriendProfile;