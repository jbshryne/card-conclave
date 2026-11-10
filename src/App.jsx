import { Link, Outlet, Route, Routes } from "react-router-dom";
import SearchPage from "./pages/SearchPage.jsx";
import ResultsPage from "./pages/ResultsPage.jsx";
import CardPage from "./pages/CardPage.jsx";
import RandomPage from "./pages/RandomPage.jsx";
import BasicLandsPage from "./pages/BasicLandsPage.jsx";

function Layout() {
  return (
    <>
      <header>
        <h1><Link to="/">Card Conclave</Link></h1>
        <p className="tagline">A grimoire of Magic cards</p>
      </header>
      <Outlet />
      <footer>
        <small>
          © 2025 Card Conclave. Powered by <a href="https://scryfall.com/">Scryfall</a>.
        </small>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<SearchPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/random" element={<RandomPage />} />
        <Route path="/card/:id" element={<CardPage />} />
        <Route path="/basics/:set/:name" element={<BasicLandsPage />} />
        <Route path="*" element={<p className="errorMessage">Page not found. <Link to="/">Back to search</Link></p>} />
      </Route>
    </Routes>
  );
}
