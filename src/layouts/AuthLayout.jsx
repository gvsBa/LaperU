import Logo from '../components/common/Logo'

function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="auth-page">
      <div className="auth-page__background" aria-hidden="true" />
      <section className="auth-card" aria-labelledby="auth-title">
        <Logo />
        <div className="auth-card__heading">
          <h1 id="auth-title">{title}</h1>
          <p>{subtitle}</p>
        </div>
        {children}
      </section>
    </main>
  )
}

export default AuthLayout
