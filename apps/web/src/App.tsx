import './App.css'

function App() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">PartNApp web</p>
        <h1>Trouver des partenaires pour des projets entrepreneuriaux.</h1>
        <p className="lead">
          Le client web est volontairement séparé de l’application Expo mobile.
          Il pourra évoluer avec son propre parcours utilisateur, son design et
          son déploiement.
        </p>
        <div className="actions">
          <a href="mailto:contact@partnapp.local">Demander un accès</a>
          <span>API prévue : ASP.NET Core + Supabase</span>
        </div>
      </section>

      <section className="cards" aria-label="Fonctionnalités initiales">
        <article>
          <h2>Offres de partenariat</h2>
          <p>
            Publier une demande claire avec objectif, compétences recherchées et
            niveau d’engagement.
          </p>
        </article>
        <article>
          <h2>Matching</h2>
          <p>
            Identifier les personnes alignées sur une idée, une ambition ou une
            disponibilité.
          </p>
        </article>
        <article>
          <h2>Mise en relation</h2>
          <p>
            Réduire la friction entre intérêt initial, conversation et démarrage
            concret du projet.
          </p>
        </article>
      </section>
    </main>
  )
}

export default App
