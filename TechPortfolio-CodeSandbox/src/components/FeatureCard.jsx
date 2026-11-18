export default function FeatureCard({ icon: Icon, title, children }) {
  return (
    <article className="card feature-card">
      <span className="tile-icon"><Icon size={22} aria-hidden="true" /></span>
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  );
}
