import { Link, Outlet, Route, Routes } from "react-router-dom";
import SearchPage from "./pages/SearchPage.jsx";
import ResultsPage from "./pages/ResultsPage.jsx";
import CardPage from "./pages/CardPage.jsx";
import RandomPage from "./pages/RandomPage.jsx";
import BasicLandsPage from "./pages/BasicLandsPage.jsx";
import RelatedPage from "./pages/RelatedPage.jsx";

function Layout() {
  const year = new Date().getFullYear();
  return (
    <>
      <header>
        <h1><Link to="/">Chancery Archives</Link></h1>
        <p className="tagline">A registry of arcane records</p>
      </header>
      <Outlet />
      <footer>
        <small>
          © {year} Chancery Archives. Card data and images from <a href="https://scryfall.com/">Scryfall</a>.
        </small>
        <small className="disclaimer">
          Chancery Archives is unofficial Fan Content permitted under the{" "}
          <a href="https://company.wizards.com/en/legal/fancontentpolicy" target="_blank" rel="noreferrer">
            Fan Content Policy
          </a>
          . Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the
          Coast. ©Wizards of the Coast LLC.
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
        <Route path="/related/:id" element={<RelatedPage />} />
        <Route path="*" element={<p className="errorMessage">Page not found. <Link to="/">Back to search</Link></p>} />
      </Route>
    </Routes>
  );
}
