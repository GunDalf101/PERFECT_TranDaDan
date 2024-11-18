import { useState } from 'react'
import { Route, BrowserRouter, Routes, Navigate } from 'react-router-dom'
import Homepage from './pages/Homepage/Homepage'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login/Login'
import Register from './pages/Register/Register'


function App() {

  return (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Homepage />} />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
        </Routes>
    </BrowserRouter>
  )
}

export default App
