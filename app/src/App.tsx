import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Courts from './pages/Courts'
import Tableau from './pages/Tableau'
import AllGames from './pages/AllGames'
import Admin from './pages/Admin'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Courts />} />
        <Route path="/tableau" element={<Tableau />} />
        <Route path="/games" element={<AllGames />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Courts />} />
      </Route>
    </Routes>
  )
}
