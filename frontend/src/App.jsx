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
import IntraCallback from './components/auth/IntraCallback'
import ChatApp from './pages/Chatpage/Chatpage'
import { ToastContainer } from 'react-toastify';

import User from './pages/User/User'
import EditProfile from './pages/EditProfile/EditProfile'
import { Edit } from 'lucide-react'

function App() {

  return (
    <BrowserRouter>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Homepage />} />
            </Route>
            <Route path="/game-lobby" element={<GameMode />}>
              <Route index element={<GameChoice />} />
              <Route path="matchmaking" element={<MatchMaking />} />
              <Route path="cpu-mode" element={<CpuMode />} />
              <Route path="remote-play" element={<RemoteMode />} />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/profile" element={<Profile />}/>
            <Route path="/profile/edit" element={<EditProfile />}/>
            <Route path="/user/:username" element={<User />} />
            <Route path='/chat' element={<ChatApp/>}/>
            <Route path="/Intra/callback/" element={<IntraCallback />} />
        </Routes>
    </BrowserRouter>
  )
}

export default App
