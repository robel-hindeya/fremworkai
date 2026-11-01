export default function Loading() {
  return (
    <div className="page" aria-busy="true" aria-label="Loading">
      <div className="skeleton" style={{ height: 14, width: 120 }} />
      <div className="skeleton" style={{ height: 32, width: "40%" }} />
      <div className="grid cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />)}
      </div>
      <div className="skeleton" style={{ height: 320, borderRadius: 16 }} />
    </div>
  );
}
