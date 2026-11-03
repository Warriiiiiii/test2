// Milestone 1 placeholder: the combat screen arrives in milestone 2.
// This page only proves the build, PWA install and deploy pipeline work.
import { STRINGS } from './data/strings';
import { ENEMIES } from './data/enemies';
import { TECHNIQUES } from './data/techniques';

export default function App() {
  return (
    <main className="title">
      <h1>{STRINGS.title}</h1>
      <p className="tagline">{STRINGS.tagline}</p>
      <p className="note">
        The pagoda is still being raised. {ENEMIES.length} enemies and {TECHNIQUES.length} techniques await.
      </p>
    </main>
  );
}
