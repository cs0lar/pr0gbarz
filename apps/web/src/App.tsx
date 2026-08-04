export function App() {
  return (
    <main className="shell">
      <section className="welcome" aria-labelledby="welcome-title">
        <div className="mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className="eyebrow">Version 2.0 foundation</p>
        <h1 id="welcome-title">pr0gbarz</h1>
        <p className="lede">
          A focused place to turn meaningful work into visible momentum.
        </p>
        <div className="status" role="status">
          <span className="status-dot" aria-hidden="true" />
          Workspace ready. Projects arrive in a later phase.
        </div>
      </section>
    </main>
  )
}
