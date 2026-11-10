import { Link, useLocation, useNavigate } from "react-router-dom";

// Steps back through history; if this page was the first one loaded in the tab
// (e.g. a shared link), goes to the search page instead of leaving the site.
export default function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  return location.key !== "default" ? (
    <button type="button" className="buttonLink" onClick={() => navigate(-1)}>← Back</button>
  ) : (
    <Link className="buttonLink" to="/">← Search</Link>
  );
}
