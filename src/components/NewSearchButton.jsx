import { Link } from "react-router-dom";
import { clearDraft } from "../utils/draft";

// Goes to a blank search page (clears the remembered form first).
export default function NewSearchButton() {
  return (
    <Link className="buttonLink" to="/" onClick={clearDraft}>
      New search
    </Link>
  );
}
