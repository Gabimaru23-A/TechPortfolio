export default function PageHeading({ label, title, emphasis, children }) {
  return (
    <div className="page-head">
      {label && <p className="eyebrow">{label}</p>}
      <h1>{title}{emphasis && <> <em>{emphasis}</em></>}</h1>
      <p>{children}</p>
    </div>
  );
}
