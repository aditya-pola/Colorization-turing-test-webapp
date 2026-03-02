import { Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Tutorial from './pages/Tutorial';
import Trial from './pages/Trial';
import Done from './pages/Done';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/tutorial" element={<Tutorial />} />
      <Route path="/trial" element={<Trial />} />
      <Route path="/done" element={<Done />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
