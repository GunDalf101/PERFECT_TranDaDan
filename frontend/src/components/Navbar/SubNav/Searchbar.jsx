import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Edit2, Save, X } from 'lucide-react';
import { axiosInstance } from '../../../api/axiosInstance';
import _ from 'lodash';
import { useNavigate } from 'react-router-dom';
import { useClickOutside } from '../../../hooks/useClickOutside';

const SearchDropdown = React.forwardRef(({ isVisible, currentUser }, ref) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    
    // Add refs for click outside detection
    const searchWrapperRef = useRef(null);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    const navigate = useNavigate();

    // Use click outside hook
    useClickOutside([searchWrapperRef, dropdownRef, inputRef], () => {
        setShowDropdown(false);
    });

    // Debounced search function
    const debouncedSearch = useCallback(
        _.debounce(async (term) => {
            if (!term.trim()) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const response = await axiosInstance.get(`api/search/?q=${encodeURIComponent(term)}`);
                setResults(response.data.results);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300),
        []
    );

    useEffect(() => {
        debouncedSearch(searchTerm);
        return () => debouncedSearch.cancel();
    }, [searchTerm, debouncedSearch]);

    const handleInputChange = (e) => {
        setSearchTerm(e.target.value);
        setShowDropdown(true);
    };

    const [editingUser, setEditingUser] = useState(null);
    const [updateData, setUpdateData] = useState({
        username: '',
        email: ''
    });
    const [updateError, setUpdateError] = useState(null);

    const handleResultClick = (result) => {
        setSearchTerm(result.username);
        setShowDropdown(false);

        navigate(`/user/${result.username}`);

        if (currentUser && currentUser.id === result.id) {
            setEditingUser(result);
            setUpdateData({
                username: result.username,
                email: result.email
            });
        }
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setUpdateError(null);

        try {
            const response = await axiosInstance.patch(`api/users/${editingUser.id}/`, updateData);
            const updatedUser = response.data;
            setEditingUser(null);
            setUpdateData({
                username: '',
                email: ''
            });

            setResults(results.map(result =>
                result.id === updatedUser.id ? updatedUser : result
            ));
        } catch (error) {
            setUpdateError(error.message);
        }
    };

    const handleUpdateChange = (e) => {
        setUpdateData({
            ...updateData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <>
            <div 
                id="searchBarWrapper" 
                className="hidden flex-grow md:flex justify-center relative"
                ref={searchWrapperRef}
            >
                <div className="relative w-3/4 xl:w-2/3">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleInputChange}
                        placeholder="Search users..."
                        className="w-full px-6 py-3 text-sm text-teal-200 bg-gray-800 border-4 border-pink-500 focus:outline-none focus:ring focus:ring-pink-500 transition duration-500 ease-in-out transform hover:scale-105 font-pixel"
                        ref={inputRef}
                    />
                    <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />

                    {showDropdown && (results.length > 0 || isLoading) && (
                        <div 
                            ref={dropdownRef}
                            className="absolute w-full mt-2 bg-gray-800 border-2 border-pink-500 rounded-md shadow-lg z-50 max-h-[60vh] overflow-y-auto"
                        >
                            {isLoading ? (
                                <div className="p-4 text-teal-200 text-center">Loading...</div>
                            ) : (
                                <ul>
                                    {results.map((result) => (
                                        <li
                                            key={result.id}
                                            onClick={() => handleResultClick(result)}
                                            className="p-3 hover:bg-gray-700 cursor-pointer text-teal-200 border-b border-gray-700 last:border-b-0 flex items-center"
                                        >
                                            <img
                                                src={result.avatar_url}
                                                alt={result.username}
                                                className="w-8 h-8 rounded-full !mr-3"
                                            />
                                            <div>
                                                <div className="font-medium">{result.username}</div>
                                                {result.email && (
                                                    <div className="text-sm text-gray-400">{result.email}</div>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {isVisible && (
                <div
                    id="fullSearchModal"
                    className="fixed inset-0 flex md:hidden bg-gray-900 bg-opacity-90 z-50 items-center justify-center px-6 py-4"
                >
                    <button
                        id="closeSearchModal"
                        className="absolute top-4 left-4 text-teal-200 hover:text-white transition duration-300 ease-in-out"
                    >
                        <svg
                            className="w-8 h-8 animate-pulse font-pixel"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                d="M6 18L18 6M6 6l12 12"
                            ></path>
                        </svg>
                    </button>
                    <div className="w-full max-w-lg relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleInputChange}
                            placeholder="Search users..."
                            ref={ref}
                            className="w-full px-6 py-4 text-lg text-teal-200 bg-gray-800 border-4 border-pink-500 focus:outline-none focus:ring focus:ring-pink-500 transition duration-500 ease-in-out transform hover:scale-105 font-pixel"
                        />
                        <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />

                        {showDropdown && (results.length > 0 || isLoading) && (
                            <div className="absolute w-full mt-2 bg-gray-800 border-2 border-pink-500 rounded-md shadow-lg max-h-[40vh] overflow-y-auto">
                                {isLoading ? (
                                    <div className="p-4 text-teal-200 text-center">Loading...</div>
                                ) : (
                                    <ul>
                                        {results.map((result) => (
                                            <li
                                                key={result.id}
                                                className="p-3 hover:bg-gray-700 cursor-pointer text-teal-200 border-b border-gray-700 last:border-b-0"
                                            >
                                                {editingUser?.id === result.id ? (
                                                    <form onSubmit={handleUpdateSubmit} className="space-y-4">
                                                        {updateError && (
                                                            <div className="text-red-500 text-sm mb-2">{updateError}</div>
                                                        )}
                                                        <div className="space-y-2">
                                                            <input
                                                                type="text"
                                                                name="username"
                                                                value={updateData.username}
                                                                onChange={handleUpdateChange}
                                                                className="w-full px-3 py-2 bg-gray-700 text-teal-200 border border-gray-600 rounded"
                                                                placeholder="Username"
                                                            />
                                                            <input
                                                                type="email"
                                                                name="email"
                                                                value={updateData.email}
                                                                onChange={handleUpdateChange}
                                                                className="w-full px-3 py-2 bg-gray-700 text-teal-200 border border-gray-600 rounded"
                                                                placeholder="Email"
                                                            />
                                                        </div>
                                                        <div className="flex justify-end space-x-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditingUser(null)}
                                                                className="p-2 text-gray-400 hover:text-white"
                                                            >
                                                                <X size={20} />
                                                            </button>
                                                            <button
                                                                type="submit"
                                                                className="p-2 text-teal-200 hover:text-white"
                                                            >
                                                                <Save size={20} />
                                                            </button>
                                                        </div>
                                                    </form>
                                                ) : (
                                                    <div
                                                        onClick={() => handleResultClick(result)}
                                                        className="flex items-center justify-between w-full"
                                                    >
                                                        <img
                                                            src={result.avatar_url}
                                                            alt={result.username}
                                                            className="w-8 h-8 rounded-full mr-3"
                                                        />

                                                        <div>
                                                            <div className="font-medium">{result.username}</div>
                                                            {result.email && (
                                                                <div className="text-sm text-gray-400">{result.email}</div>
                                                            )}
                                                        </div>
                                                        {currentUser && currentUser.id === result.id && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleResultClick(result);
                                                                }}
                                                                className="p-2 text-gray-400 hover:text-white"
                                                            >
                                                                <Edit2 size={20} />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
});

export default SearchDropdown;