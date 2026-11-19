import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { GameProvider } from './context/GameContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import CreateRoom from './pages/CreateRoom';
import WaitingRoom from './pages/WaitingRoom';
import JoinRoom from './pages/JoinRoom';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <ThemeProvider>
      <GameProvider>
        <BrowserRouter>
          <div className="flex flex-col min-h-screen bg-[#fbf9f1] text-[#1b1c17] antialiased">
            <Navbar />
            <main className="flex-1 w-full">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<CreateRoom />} />
                <Route path="/room/:roomId" element={<WaitingRoom />} />
                <Route path="/join/:roomId" element={<JoinRoom />} />
                <Route path="/join" element={<JoinRoom />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </GameProvider>
    </ThemeProvider>
  );
}
