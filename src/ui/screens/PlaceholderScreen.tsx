/** Tabs whose systems arrive in later milestones. */
export default function PlaceholderScreen({ title, text }: { title: string; text: string }) {
  return (
    <main className="screen placeholder-screen">
      <h1 className="display">{title}</h1>
      <p className="muted">{text}</p>
    </main>
  );
}
