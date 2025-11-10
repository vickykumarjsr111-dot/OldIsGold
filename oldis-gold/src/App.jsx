import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import CreateListing from "./pages/CreateListing.jsx";
import ListingDetails from "./pages/ListingDetails.jsx";
import MyListings from "./pages/MyListings.jsx";
import Profile from "./pages/Profile.jsx";
import NotFound from "./pages/NotFound.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import EditListing from "./pages/EditListing.jsx";

import './styles/home.css';
import './styles/listingcard.css';
import './styles/listingdetails.css';
import './styles/profile.css';
import './styles/global.css';  


export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/listing/:id" element={<ListingDetails />} />

        {/* Protected */}
        <Route
          path="/create"
          element={
            <RequireAuth>
              <CreateListing />
            </RequireAuth>
          }
        />

        <Route
          path="/my-listings"
          element={
            <RequireAuth>
              <MyListings />
            </RequireAuth>
          }
        />

        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />

        <Route
          path="/edit/:id"
          element={
            <RequireAuth>
              <EditListing />
            </RequireAuth>
          }
        />

        {/* Not found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
