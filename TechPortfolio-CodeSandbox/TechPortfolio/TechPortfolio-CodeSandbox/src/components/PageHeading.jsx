export default function PageHeading({ label, title, emphasis, children }) {
  return (
    <div className="page-head">
      <span className="eyebrow">{label}</span>
      <h1>{title} <em>{emphasis}</em></h1>
      <p>{children}</p>
    </div>
  );
}
