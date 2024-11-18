import { useState } from 'react'
import { Route, BrowserRouter, Routes, Navigate } from 'react-router-dom'
import Homepage from './pages/Homepage/Homepage'
import MainLayout from './layouts/MainLayout'


function App() {

  return (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Homepage />} />
            </Route>
            
        </Routes>
    </BrowserRouter>
  )
}

export default App
