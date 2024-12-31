import { useState } from 'react'
import { Route, BrowserRouter, Routes, Navigate } from 'react-router-dom'
import Homepage from './pages/Homepage/Homepage'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login/Login'
import Register from './pages/Register/Register'
import GameMode from './layouts/GameMode/GameMode'
import GameChoice from './pages/GameChoice/GameChoice'
import MatchMaking from './pages/MatchMaking/MatchMaking'
import CpuMode from './components/Pong/CpuMode/CpuMode'
import Profile from './pages/Profile/Profile'
import RemoteMode from './components/Pong/RemotePlay/RemoteMode'


function App() {

  return (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Homepage />} />
              <Route path="/Profile" element={<Profile />} />
            </Route>
            <Route path="/game-lobby" element={<GameMode />}>
              <Route index element={<GameChoice />} />
              <Route path="matchmaking" element={<MatchMaking />} />
              <Route path="cpu-mode" element={<CpuMode />} />
              <Route path="remote-play" element={<RemoteMode />} />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
        </Routes>
    </BrowserRouter>
  )
}

export default App
