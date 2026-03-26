import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Stations from './pages/Stations.jsx'
import Lines from './pages/Lines.jsx'
import Vehicles from './pages/Vehicles.jsx'
import NetworkMap from './pages/NetworkMap.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="network" element={<NetworkMap />} />
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="stations" element={<Stations />} />
          <Route path="lines" element={<Lines />} />
          <Route path="vehicles" element={<Vehicles />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
