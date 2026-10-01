import { useState } from 'react';
import Home from './pages/Home';
import Register from './pages/Register';
import Attendance from './pages/Attendance';

/**
 * App — Simple page router.
 * Uses state-based navigation (no need for react-router in an MVP).
 */
function App() {
  const [page, setPage] = useState('home');

  const navigate = (target) => {
    setPage(target);
    window.scrollTo(0, 0);
  };

  return (
    <div className="app-container">
      {page === 'home' && <Home onNavigate={navigate} />}
      {page === 'register' && <Register onNavigate={navigate} />}
      {page === 'attendance' && <Attendance onNavigate={navigate} />}
    </div>
  );
}

export default App;
