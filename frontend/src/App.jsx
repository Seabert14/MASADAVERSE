import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Trainers from "./pages/Trainers";
import Memberships from "./pages/Memberships";
import Payments from "./pages/Payments";
import Workouts from "./pages/Workouts";
import Exercises from "./pages/Exercises";
import Progress from "./pages/Progress";
import Attendance from "./pages/Attendance";
import Navbar from "./components/Navbar";
import Categories from "./pages/Categories";
function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <main className="min-h-screen bg-[#050d14] pt-16 lg:ml-64 lg:pt-0">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/trainers" element={<Trainers />} />
          <Route path="/memberships" element={<Memberships />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/categories" element={<Categories />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;