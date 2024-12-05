import React from 'react'

const Searchbar = React.forwardRef(({isVisible}, ref) => {
  return (
    <>
        <div id="searchBarWrapper" className="hidden flex-grow md:flex justify-center">
            <input
            type="text"
            placeholder="Search..."
            className="w-3/4 xl:w-2/3 px-6 py-3 m-auto text-sm text-teal-200 bg-gray-800 border-4 border-pink-500 focus:outline-none focus:ring focus:ring-pink-500 transition duration-500 ease-in-out transform hover:scale-105 font-pixel"
            />
        </div>
        {isVisible? (<div
            id="fullSearchModal"
            className="fixed inset-0 flex md:hidden bg-gray-900 bg-opacity-90 z-50 items-center justify-center px-6 py-4"
        >
            <button
            id="closeSearchModal"
            className="absolute top-4 left-4 text-teal-200 hover:text-white transition duration-300 ease-in-out"
            >
            <svg className="w-8 h-8 animate-pulse font-pixel" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinejoin="round" strokeLinecap="round" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            </button>
            <input
            type="text"
            placeholder="Search..."
            ref={ref}
            className="w-full max-w-lg px-6 py-4 text-lg text-teal-200 bg-gray-800 border-4 border-pink-500 focus:outline-none focus:ring focus:ring-pink-500 transition duration-500 ease-in-out transform hover:scale-105 font-pixel"
            />
        </div>) : null}
      
    </>
  )
})

export default Searchbar
