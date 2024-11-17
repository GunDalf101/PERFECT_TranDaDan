import { useState } from 'react'
import { Route, BrowserRouter, Routes, Navigate } from 'react-router-dom'


function App() {

  return (
    <BrowserRouter>
        <ToastContainer />
        <Routes>
            <Route path="/" element={<HomePage />} />
            
        </Routes>
    </BrowserRouter>
  )
}

export default App
