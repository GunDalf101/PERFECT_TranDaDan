import React, { useState } from 'react';
import { ChevronDown, Send, Paperclip, Clock, Users, Calendar, X, Check } from 'lucide-react';

const Chat = () => {
    const [activeChats, setActiveChats] = useState(true);
    const [archivedChats, setArchivedChats] = useState(false);

    const activeConversations = [
        { id: 1, name: 'Dwight Schrute', online: true, img: '/api/placeholder/40/40' },
        { id: 2, name: 'Andy Bernard', online: false, img: '/api/placeholder/40/40' },
        { id: 3, name: 'Michael Scott', online: true, img: '/api/placeholder/40/40' },
        { id: 4, name: 'Holy Flax', online: true, img: '/api/placeholder/40/40' }
    ];

    const archivedConversations = [
        { id: 5, name: 'Toby Flenderson', img: '/api/placeholder/40/40' },
        { id: 6, name: 'Kelly Kapoor', img: '/api/placeholder/40/40' },
        { id: 7, name: 'Roy Andersson', img: '/api/placeholder/40/40' }
    ];

    return (
        <div className="flex h-screen bg-gray-900 text-white p-6">
            {/* Left Sidebar */}
            <div className="w-80 flex flex-col mr-6">
                <div className="flex items-center mb-5">
                    <h1 className="text-xl font-bold">QuickChat</h1>
                </div>

                {/* Profile Box */}
                <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
                    <div className="flex flex-col items-center">
                        <img src="/api/placeholder/48/48" alt="Profile" className="rounded-full mb-2" />
                        <h2 className="text-lg font-bold">Pam Beesly Halpert</h2>
                        <p className="text-sm text-gray-400">UI Designer</p>

                        <div className="flex items-center mt-3">
                            <div className="flex items-center">
                                <input type="checkbox" id="status" className="hidden" />
                                <label htmlFor="status" className="relative inline-block w-10 h-5 bg-gray-600 rounded-full cursor-pointer">
                                    <span className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 transform" />
                                </label>
                                <span className="ml-2 text-sm text-gray-400">Online</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Conversations */}
                <div className="mb-4">
                    <div
                        className="flex items-center justify-between cursor-pointer mb-2"
                        onClick={() => setActiveChats(!activeChats)}
                    >
                        <h3 className="font-bold flex items-center">
                            Active Conversations
                            <span className="ml-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                4
                            </span>
                        </h3>
                        <ChevronDown className={`transform transition-transform ${activeChats ? 'rotate-180' : ''}`} />
                    </div>

                    {activeChats && (
                        <div className="space-y-2">
                            {activeConversations.map(chat => (
                                <div key={chat.id} className="flex items-center p-2 hover:bg-gray-800 rounded-lg cursor-pointer">
                                    <img src={chat.img} alt={chat.name} className="w-10 h-10 rounded-full" />
                                    <span className="ml-2 text-gray-300">{chat.name}</span>
                                    {chat.online && (
                                        <div className="w-2 h-2 bg-green-500 rounded-full ml-auto" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Archived Conversations */}
                <div>
                    <div
                        className="flex items-center justify-between cursor-pointer mb-2"
                        onClick={() => setArchivedChats(!archivedChats)}
                    >
                        <h3 className="font-bold">Archived Conversations</h3>
                        <ChevronDown className={`transform transition-transform ${archivedChats ? 'rotate-180' : ''}`} />
                    </div>

                    {archivedChats && (
                        <div className="space-y-2">
                            {archivedConversations.map(chat => (
                                <div key={chat.id} className="flex items-center p-2 hover:bg-gray-800 rounded-lg cursor-pointer">
                                    <img src={chat.img} alt={chat.name} className="w-10 h-10 rounded-full" />
                                    <span className="ml-2 text-gray-300">{chat.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 bg-gray-800 rounded-lg p-4 flex flex-col">
                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                    {/* Messages */}
                    <div className="flex items-start">
                        <img src="/api/placeholder/40/40" alt="" className="w-10 h-10 rounded-full" />
                        <div className="ml-3">
                            <div className="bg-gray-700 rounded-lg p-3 max-w-md">
                                <p className="text-sm">Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur</p>
                            </div>
                            <span className="text-xs text-gray-500 mt-1">9h ago</span>
                        </div>
                    </div>

                    <div className="flex items-start justify-end">
                        <div className="mr-3">
                            <div className="bg-blue-600 rounded-lg p-3 max-w-md">
                                <p className="text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit</p>
                            </div>
                            <span className="text-xs text-gray-500 mt-1 flex justify-end">9h ago</span>
                        </div>
                        <img src="/api/placeholder/40/40" alt="" className="w-10 h-10 rounded-full" />
                    </div>
                </div>

                {/* Chat Input */}
                <div className="flex items-center bg-gray-700 rounded-lg p-3">
                    <div className="flex-1 flex items-center bg-gray-800 rounded mx-2 px-3">
                        <input
                            type="text"
                            placeholder="Type your message..."
                            className="flex-1 bg-transparent border-none focus:outline-none text-sm py-2"
                        />
                        {/* <button className="text-gray-400 hover:text-gray-300">
                            <Paperclip size={20} />
                        </button> */}
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded flex items-center">
                        Send
                        <Send size={16} className="ml-2" />
                    </button>
                </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-80 ml-6">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex flex-col items-center mb-4">
                        <img src="/api/placeholder/48/48" alt="Dwight" className="rounded-full mb-2" />
                        <h2 className="text-lg font-bold">Dwight Schrute</h2>
                        <p className="text-sm text-gray-400">dwightscrute@test.com</p>
                        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded flex items-center">
                            Archive <Check size={16} className="ml-2" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-500 bg-opacity-20 p-3 rounded-lg">
                            <div className="flex items-center">
                                <div className="bg-blue-500 bg-opacity-20 p-2 rounded-full">
                                    <Clock size={16} />
                                </div>
                                <div className="ml-2">
                                    <div className="font-bold">13h</div>
                                    <div className="text-xs text-gray-400">Time</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-500 bg-opacity-20 p-3 rounded-lg">
                            <div className="flex items-center">
                                <div className="bg-green-500 bg-opacity-20 p-2 rounded-full">
                                    <Users size={16} />
                                </div>
                                <div className="ml-2">
                                    <div className="font-bold">32</div>
                                    <div className="text-xs text-gray-400">Attended</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-purple-500 bg-opacity-20 p-3 rounded-lg">
                            <div className="flex items-center">
                                <div className="bg-purple-500 bg-opacity-20 p-2 rounded-full">
                                    <Calendar size={16} />
                                </div>
                                <div className="ml-2">
                                    <div className="font-bold">122</div>
                                    <div className="text-xs text-gray-400">Meetings</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-red-500 bg-opacity-20 p-3 rounded-lg">
                            <div className="flex items-center">
                                <div className="bg-red-500 bg-opacity-20 p-2 rounded-full">
                                    <X size={16} />
                                </div>
                                <div className="ml-2">
                                    <div className="font-bold">12</div>
                                    <div className="text-xs text-gray-400">Rejected</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;