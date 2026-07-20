import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Language = 'fr' | 'en'
type View = 'home' | 'onboarding' | 'signin' | 'profile' | 'offers' | 'create'
type LoadState = 'ready' | 'loading' | 'empty' | 'error'

type Offer = {
  id: string
  title: string
  stage: string
  summary: string
  skills: string[]
  commitment: string
  location: string
  budget: string
  owner: string
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

const copy = {
  fr: {
    langLabel: 'EN',
    navAria: 'Navigation principale',
    nav: {
      home: 'Accueil',
      onboarding: 'Onboarding',
      offers: 'Offres',
      profile: 'Profil',
    },
    signedIn: 'Session démo active',
    signIn: 'Connexion',
    footerLabel: 'API configurée via VITE_API_BASE_URL',
    defaults: {
      stage: 'Validation terrain',
      commitment: 'À définir',
      location: 'Remote',
      budget: 'À cadrer',
      owner: 'Vous',
    },
    home: {
      eyebrow: 'PartNApp / Recherche de partenaires',
      title: 'Des projets concrets. Des partenaires sérieux. Un cadre clair.',
      lead:
        'Une expérience web pensée comme un bureau de décision : offres lisibles, signaux utiles, intentions explicites et parcours séparé du mobile.',
      primary: 'Qualifier mon profil',
      secondary: 'Explorer les opportunités',
      boardAria: 'Résumé des opportunités',
      board: [
        ['Offres actives', '24'],
        ['Délai moyen de premier contact', '36 h'],
        ['Format dominant', 'Local + hybride'],
      ],
      note:
        '“Le bon partenaire n’est pas seulement compétent. Il est disponible, aligné et prêt à exécuter.”',
      methodAria: 'Méthode PartNApp',
      methodEyebrow: 'Méthode',
      methodTitle: 'Qualifier avant de contacter.',
      methodText:
        'Le web sert aux décisions calmes : comparer les opportunités, comprendre le contexte, vérifier l’effort attendu et envoyer une intention utile.',
      cardsAria: 'Fonctionnalités web',
      cards: [
        ['01', 'Offres structurées', 'Chaque opportunité expose stade, lieu, engagement, budget et compétences utiles.'],
        ['02', 'Densité web', 'Le layout desktop affiche liste, détails et signaux sans reprendre une logique mobile agrandie.'],
        ['03', 'Intention claire', 'Le premier contact reste léger mais contextualisé, pour éviter les messages génériques.'],
      ],
    },
    onboarding: {
      eyebrow: 'Onboarding web',
      title: 'Transformer une envie vague en profil actionnable.',
      lead: 'Le parcours web privilégie la clarté éditoriale et les choix explicites plutôt qu’un tunnel mobile.',
      steps: [
        ['01', 'Objectif', 'Créer, rejoindre, valider ou opérer un projet existant.'],
        ['02', 'Contribution', 'Temps disponible, compétences, réseau, actifs et niveau de risque acceptable.'],
        ['03', 'Cadre', 'Géographie, rythme, budget, saisonnalité et conditions de collaboration.'],
      ],
      cta: 'Continuer vers la connexion',
    },
    signin: {
      eyebrow: 'Authentification web',
      activeTitle: 'Session démo active.',
      title: 'Connexion professionnelle.',
      lead:
        'Le formulaire reste local côté UI. Le modèle cible est Supabase Auth côté client, conformément à la décision transversale documentée.',
      email: 'Email',
      password: 'Mot de passe',
      cta: 'Ouvrir l’espace web',
    },
    profile: {
      emptyTitle: 'Profil non connecté.',
      emptyText: 'Connecte une session démo pour afficher le profil utilisateur web.',
      emptyCta: 'Aller à la connexion',
      eyebrow: 'Profil utilisateur',
      title: 'Nadia B. / opératrice terrain.',
      lead:
        'Développe des services locaux récurrents avec une préférence pour les modèles simples, rentables et mesurables en moins de huit semaines.',
      signals: ['Opérations', 'Vente terrain', 'Services locaux'],
      criteriaTitle: 'Critères de collaboration',
      criteria: ['Projet local ou hybride', 'Validation commerciale rapide', 'Partage clair des responsabilités'],
    },
    offers: {
      eyebrow: 'Offres de partenariat',
      title: 'Opportunités qualifiées.',
      create: 'Publier une offre',
      stateAria: 'Tester les états d’interface',
      listAria: 'Liste des offres',
      loadingTitle: 'Chargement des offres…',
      loadingText: 'La liste attend une réponse API.',
      emptyTitle: 'Aucune offre disponible.',
      emptyText: 'L’état vide est prêt pour une liste API sans résultat.',
      errorTitle: 'Impossible d’afficher les offres.',
      errorText: 'L’état erreur est prêt pour les erreurs HTTP ou les payloads invalides.',
      detailEyebrow: 'Détail d’une offre',
      labels: {
        stage: 'Stade',
        commitment: 'Engagement',
        location: 'Localisation',
        budget: 'Budget',
      },
      interested: 'Intérêt envoyé',
      interestCta: 'Exprimer un intérêt qualifié',
    },
    create: {
      eyebrow: 'Créer une offre',
      title: 'Publier une demande structurée.',
      titleLabel: 'Titre',
      titlePlaceholder: 'Ex. Service local récurrent à structurer',
      stageLabel: 'Stade',
      stages: ['Exploration', 'Validation terrain', 'Préparation pilote', 'Premiers mandats'],
      summaryLabel: 'Résumé',
      summaryPlaceholder: 'Décris le projet, le besoin et le type de partenaire recherché.',
      skillsLabel: 'Compétences recherchées',
      skillsPlaceholder: 'Ventes terrain, opérations, communication',
      commitmentLabel: 'Engagement',
      commitmentPlaceholder: '6 h/semaine',
      locationLabel: 'Localisation',
      locationPlaceholder: 'Remote, Montréal, Laval...',
      budgetLabel: 'Budget / modèle',
      budgetPlaceholder: 'Prévente, revenus par mandat, budget pilote...',
      submit: 'Publier en démo',
      cancel: 'Annuler',
    },
    offersSeed: [
      {
        id: 'service-tonte-quartier',
        title: 'Structurer un service de tonte récurrent pour quartiers résidentiels',
        stage: 'Validation terrain',
        summary:
          'Un opérateur local a déjà 18 clients ponctuels et cherche un partenaire pour formaliser les tournées, les forfaits saisonniers et la prospection porte-à-porte.',
        skills: ['Opérations locales', 'Ventes terrain', 'Planification'],
        commitment: 'Soirs + samedi matin',
        location: 'Laval / rive nord',
        budget: 'Matériel déjà disponible',
        owner: 'Nadia B.',
      },
      {
        id: 'collectif-toiture',
        title: 'Lancer un collectif de sous-traitance toiture pour petits chantiers',
        stage: 'Premiers mandats',
        summary:
          'Deux couvreurs indépendants veulent centraliser devis, calendrier et suivi client. Besoin d’un profil administratif/commercial pour rendre l’offre vendable.',
        skills: ['Devis', 'Relation client', 'Process'],
        commitment: '8 h/semaine',
        location: 'Longueuil / hybride',
        budget: 'Revenus par chantier',
        owner: 'Marc D.',
      },
      {
        id: 'festival-quartier',
        title: 'Créer un événement de quartier rentable autour des artisans locaux',
        stage: 'Préparation pilote',
        summary:
          'Une première salle et dix exposants sont identifiés. Le besoin porte sur commandites, billetterie, communication locale et gestion du jour J.',
        skills: ['Commandites', 'Événementiel', 'Communication'],
        commitment: '6 semaines intensives',
        location: 'Montréal Est',
        budget: 'Objectif break-even',
        owner: 'Inès R.',
      },
      {
        id: 'jeu-cooperatif',
        title: 'Prototyper un jeu coopératif de cartes pour familles',
        stage: 'Prototype papier',
        summary:
          'Le concept et les premières règles existent. Recherche un partenaire capable de tester, illustrer sobrement et préparer une petite campagne de prévente.',
        skills: ['Game design', 'Tests utilisateurs', 'Prévente'],
        commitment: '4 h/semaine',
        location: 'Remote francophone',
        budget: 'Micro-budget impression',
        owner: 'Thomas L.',
      },
    ],
  },
  en: {
    langLabel: 'FR',
    navAria: 'Main navigation',
    nav: {
      home: 'Home',
      onboarding: 'Onboarding',
      offers: 'Offers',
      profile: 'Profile',
    },
    signedIn: 'Demo session active',
    signIn: 'Sign in',
    footerLabel: 'API configured with VITE_API_BASE_URL',
    defaults: {
      stage: 'Field validation',
      commitment: 'To define',
      location: 'Remote',
      budget: 'To scope',
      owner: 'You',
    },
    home: {
      eyebrow: 'PartNApp / Partner discovery',
      title: 'Concrete projects. Serious partners. Clear expectations.',
      lead:
        'A web experience built like a decision desk: readable opportunities, useful signals, explicit intent, and a flow that stays separate from mobile.',
      primary: 'Qualify my profile',
      secondary: 'Explore opportunities',
      boardAria: 'Opportunity summary',
      board: [
        ['Active offers', '24'],
        ['Average first-contact delay', '36h'],
        ['Dominant format', 'Local + hybrid'],
      ],
      note: '“The right partner is not only skilled. They are available, aligned, and ready to execute.”',
      methodAria: 'PartNApp method',
      methodEyebrow: 'Method',
      methodTitle: 'Qualify before contacting.',
      methodText:
        'The web client is for calm decisions: compare opportunities, understand context, check expected effort, and send useful intent.',
      cardsAria: 'Web features',
      cards: [
        ['01', 'Structured offers', 'Each opportunity exposes stage, location, commitment, budget, and useful skills.'],
        ['02', 'Web density', 'The desktop layout shows list, details, and signals without stretching a mobile pattern.'],
        ['03', 'Clear intent', 'The first contact stays lightweight but contextual, avoiding generic messages.'],
      ],
    },
    onboarding: {
      eyebrow: 'Web onboarding',
      title: 'Turn a vague intention into an actionable profile.',
      lead: 'The web flow favors editorial clarity and explicit choices over a mobile-style funnel.',
      steps: [
        ['01', 'Goal', 'Create, join, validate, or operate an existing project.'],
        ['02', 'Contribution', 'Available time, skills, network, assets, and acceptable risk level.'],
        ['03', 'Frame', 'Geography, pace, budget, seasonality, and collaboration conditions.'],
      ],
      cta: 'Continue to sign in',
    },
    signin: {
      eyebrow: 'Web authentication',
      activeTitle: 'Demo session active.',
      title: 'Professional sign in.',
      lead:
        'This form remains local in the UI. The target model is client-side Supabase Auth, as documented in the cross-product decision.',
      email: 'Email',
      password: 'Password',
      cta: 'Open web workspace',
    },
    profile: {
      emptyTitle: 'No connected profile.',
      emptyText: 'Open a demo session to display the web user profile.',
      emptyCta: 'Go to sign in',
      eyebrow: 'User profile',
      title: 'Nadia B. / field operator.',
      lead:
        'Builds recurring local services, with a preference for simple, profitable models that can be measured in under eight weeks.',
      signals: ['Operations', 'Field sales', 'Local services'],
      criteriaTitle: 'Collaboration criteria',
      criteria: ['Local or hybrid project', 'Fast commercial validation', 'Clear split of responsibilities'],
    },
    offers: {
      eyebrow: 'Partnership offers',
      title: 'Qualified opportunities.',
      create: 'Publish an offer',
      stateAria: 'Test interface states',
      listAria: 'Offer list',
      loadingTitle: 'Loading offers…',
      loadingText: 'The list is waiting for an API response.',
      emptyTitle: 'No offers available.',
      emptyText: 'The empty state is ready for an API list with no results.',
      errorTitle: 'Unable to display offers.',
      errorText: 'The error state is ready for HTTP errors or invalid payloads.',
      detailEyebrow: 'Offer detail',
      labels: {
        stage: 'Stage',
        commitment: 'Commitment',
        location: 'Location',
        budget: 'Budget',
      },
      interested: 'Interest sent',
      interestCta: 'Express qualified interest',
    },
    create: {
      eyebrow: 'Create an offer',
      title: 'Publish a structured request.',
      titleLabel: 'Title',
      titlePlaceholder: 'Ex. Recurring local service to structure',
      stageLabel: 'Stage',
      stages: ['Exploration', 'Field validation', 'Pilot preparation', 'First contracts'],
      summaryLabel: 'Summary',
      summaryPlaceholder: 'Describe the project, the need, and the type of partner you are looking for.',
      skillsLabel: 'Skills needed',
      skillsPlaceholder: 'Field sales, operations, communication',
      commitmentLabel: 'Commitment',
      commitmentPlaceholder: '6 h/week',
      locationLabel: 'Location',
      locationPlaceholder: 'Remote, Montreal, Laval...',
      budgetLabel: 'Budget / model',
      budgetPlaceholder: 'Pre-sale, revenue per contract, pilot budget...',
      submit: 'Publish demo offer',
      cancel: 'Cancel',
    },
    offersSeed: [
      {
        id: 'neighborhood-lawn-service',
        title: 'Structure a recurring lawn-care service for residential neighborhoods',
        stage: 'Field validation',
        summary:
          'A local operator already has 18 one-off customers and needs a partner to formalize routes, seasonal packages, and door-to-door acquisition.',
        skills: ['Local operations', 'Field sales', 'Planning'],
        commitment: 'Evenings + Saturday morning',
        location: 'Laval / north shore',
        budget: 'Equipment already available',
        owner: 'Nadia B.',
      },
      {
        id: 'roofing-collective',
        title: 'Launch a subcontracting collective for small roofing jobs',
        stage: 'First contracts',
        summary:
          'Two independent roofers want to centralize estimates, scheduling, and client follow-up. They need an admin/commercial partner to make the offer sellable.',
        skills: ['Estimates', 'Client relations', 'Process'],
        commitment: '8 h/week',
        location: 'Longueuil / hybrid',
        budget: 'Revenue per job',
        owner: 'Marc D.',
      },
      {
        id: 'neighborhood-festival',
        title: 'Create a profitable neighborhood event around local artisans',
        stage: 'Pilot preparation',
        summary:
          'A first venue and ten exhibitors are identified. The need covers sponsorships, ticketing, local communication, and event-day operations.',
        skills: ['Sponsorships', 'Events', 'Communication'],
        commitment: '6 intensive weeks',
        location: 'East Montreal',
        budget: 'Break-even target',
        owner: 'Inès R.',
      },
      {
        id: 'cooperative-card-game',
        title: 'Prototype a cooperative card game for families',
        stage: 'Paper prototype',
        summary:
          'The concept and first rules exist. Looking for a partner who can test, create sober visuals, and prepare a small pre-sale campaign.',
        skills: ['Game design', 'User testing', 'Pre-sale'],
        commitment: '4 h/week',
        location: 'Remote francophone',
        budget: 'Micro print budget',
        owner: 'Thomas L.',
      },
    ],
  },
} satisfies Record<Language, Record<string, unknown>>

function App() {
  const [language, setLanguage] = useState<Language>('fr')
  const t = copy[language]
  const [view, setView] = useState<View>('home')
  const [loadState, setLoadState] = useState<LoadState>('ready')
  const [customOffers, setCustomOffers] = useState<Offer[]>([])
  const seedOffers = t.offersSeed as Offer[]
  const offers = useMemo(() => [...customOffers, ...seedOffers], [customOffers, seedOffers])
  const [selectedOfferId, setSelectedOfferId] = useState(seedOffers[0]?.id ?? '')
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [interestSentFor, setInterestSentFor] = useState<string | null>(null)

  const selectedOffer = useMemo(
    () => offers.find((offer) => offer.id === selectedOfferId) ?? offers[0],
    [offers, selectedOfferId],
  )

  function navigate(nextView: View) {
    setView(nextView)
    if (nextView === 'offers' && loadState !== 'ready') {
      setLoadState('ready')
    }
  }

  function toggleLanguage() {
    setLanguage((current) => {
      const next = current === 'fr' ? 'en' : 'fr'
      setSelectedOfferId((copy[next].offersSeed as Offer[])[0]?.id ?? '')
      return next
    })
  }

  function createOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const title = String(formData.get('title') || '').trim()
    const summary = String(formData.get('summary') || '').trim()

    if (!title || !summary) {
      setLoadState('error')
      setView('offers')
      return
    }

    const offer: Offer = {
      id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      title,
      stage: String(formData.get('stage') || t.defaults.stage),
      summary,
      skills: String(formData.get('skills') || '')
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
      commitment: String(formData.get('commitment') || t.defaults.commitment),
      location: String(formData.get('location') || t.defaults.location),
      budget: String(formData.get('budget') || t.defaults.budget),
      owner: t.defaults.owner,
    }

    setCustomOffers((currentOffers) => [offer, ...currentOffers])
    setSelectedOfferId(offer.id)
    setLoadState('ready')
    setView('offers')
  }

  function submitSignin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSignedIn(true)
    setView('profile')
  }

  return (
    <main className="shell" lang={language}>
      <header className="topbar">
        <button className="brand" type="button" onClick={() => navigate('home')}>
          PartNApp
        </button>
        <nav aria-label={t.navAria as string}>
          {(['home', 'onboarding', 'offers', 'profile'] as View[]).map((item) => (
            <button
              className={view === item ? 'active' : ''}
              key={item}
              type="button"
              onClick={() => navigate(item)}
            >
              {t.nav[item as keyof typeof t.nav]}
            </button>
          ))}
        </nav>
        <div className="topbar-actions">
          <button className="language-toggle" type="button" onClick={toggleLanguage}>
            {t.langLabel as string}
          </button>
          <button className="ghost" type="button" onClick={() => navigate('signin')}>
            {isSignedIn ? (t.signedIn as string) : (t.signIn as string)}
          </button>
        </div>
      </header>

      {view === 'home' && <Home t={t} onStart={() => navigate('onboarding')} onBrowse={() => navigate('offers')} />}
      {view === 'onboarding' && <Onboarding t={t} onDone={() => navigate('signin')} />}
      {view === 'signin' && <Signin isSignedIn={isSignedIn} t={t} onSubmit={submitSignin} />}
      {view === 'profile' && <Profile isSignedIn={isSignedIn} t={t} onSignin={() => navigate('signin')} />}
      {view === 'offers' && (
        <Offers
          interestSentFor={interestSentFor}
          loadState={loadState}
          offers={offers}
          selectedOffer={selectedOffer}
          t={t}
          onCreate={() => navigate('create')}
          onInterest={(offerId) => setInterestSentFor(offerId)}
          onSelect={(offerId) => setSelectedOfferId(offerId)}
          onSetLoadState={setLoadState}
        />
      )}
      {view === 'create' && <CreateOffer t={t} onCancel={() => navigate('offers')} onSubmit={createOffer} />}

      <footer className="footer">
        <span>{t.footerLabel as string}</span>
        <code>{apiBaseUrl}</code>
      </footer>
    </main>
  )
}

type Copy = typeof copy.fr

function Home({ onBrowse, onStart, t }: { onBrowse: () => void; onStart: () => void; t: Copy }) {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{t.home.eyebrow}</p>
          <h1>{t.home.title}</h1>
          <p className="lead">{t.home.lead}</p>
          <div className="actions">
            <button type="button" onClick={onStart}>
              {t.home.primary}
            </button>
            <button className="secondary" type="button" onClick={onBrowse}>
              {t.home.secondary}
            </button>
          </div>
        </div>

        <aside className="hero-board" aria-label={t.home.boardAria}>
          {t.home.board.map(([label, value]) => (
            <div className="board-line" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
          <div className="paper-note">{t.home.note}</div>
        </aside>
      </section>

      <section className="editorial-band" aria-label={t.home.methodAria}>
        <div>
          <p className="eyebrow">{t.home.methodEyebrow}</p>
          <h2>{t.home.methodTitle}</h2>
        </div>
        <p>{t.home.methodText}</p>
      </section>

      <section className="cards web-cards" aria-label={t.home.cardsAria}>
        {t.home.cards.map(([number, title, text]) => (
          <article key={number}>
            <span>{number}</span>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </section>
    </>
  )
}

function Onboarding({ onDone, t }: { onDone: () => void; t: Copy }) {
  return (
    <section className="panel onboarding-panel">
      <div>
        <p className="eyebrow">{t.onboarding.eyebrow}</p>
        <h1>{t.onboarding.title}</h1>
        <p className="lead">{t.onboarding.lead}</p>
      </div>
      <div className="steps">
        {t.onboarding.steps.map(([number, title, text]) => (
          <article key={number}>
            <span>{number}</span>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <button type="button" onClick={onDone}>
        {t.onboarding.cta}
      </button>
    </section>
  )
}

function Signin({
  isSignedIn,
  onSubmit,
  t,
}: {
  isSignedIn: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  t: Copy
}) {
  return (
    <section className="panel narrow">
      <p className="eyebrow">{t.signin.eyebrow}</p>
      <h1>{isSignedIn ? t.signin.activeTitle : t.signin.title}</h1>
      <p className="muted">{t.signin.lead}</p>
      <form className="form" onSubmit={onSubmit}>
        <label>
          {t.signin.email}
          <input defaultValue="nadia@partnapp.local" name="email" type="email" />
        </label>
        <label>
          {t.signin.password}
          <input defaultValue="partnapp-demo" name="password" type="password" />
        </label>
        <button type="submit">{t.signin.cta}</button>
      </form>
    </section>
  )
}

function Profile({ isSignedIn, onSignin, t }: { isSignedIn: boolean; onSignin: () => void; t: Copy }) {
  if (!isSignedIn) {
    return (
      <section className="empty-state">
        <h1>{t.profile.emptyTitle}</h1>
        <p>{t.profile.emptyText}</p>
        <button type="button" onClick={onSignin}>
          {t.profile.emptyCta}
        </button>
      </section>
    )
  }

  return (
    <section className="profile-grid">
      <article className="panel profile-panel">
        <p className="eyebrow">{t.profile.eyebrow}</p>
        <h1>{t.profile.title}</h1>
        <p className="lead">{t.profile.lead}</p>
        <div className="signal-grid">
          {t.profile.signals.map((signal) => (
            <span key={signal}>{signal}</span>
          ))}
        </div>
      </article>
      <aside className="side-card">
        <h2>{t.profile.criteriaTitle}</h2>
        <ul>
          {t.profile.criteria.map((criterion) => (
            <li key={criterion}>{criterion}</li>
          ))}
        </ul>
      </aside>
    </section>
  )
}

function Offers({
  interestSentFor,
  loadState,
  offers,
  selectedOffer,
  onCreate,
  onInterest,
  onSelect,
  onSetLoadState,
  t,
}: {
  interestSentFor: string | null
  loadState: LoadState
  offers: Offer[]
  selectedOffer?: Offer
  onCreate: () => void
  onInterest: (offerId: string) => void
  onSelect: (offerId: string) => void
  onSetLoadState: (state: LoadState) => void
  t: Copy
}) {
  return (
    <section className="offers">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{t.offers.eyebrow}</p>
          <h1>{t.offers.title}</h1>
        </div>
        <button type="button" onClick={onCreate}>
          {t.offers.create}
        </button>
      </div>

      <div className="state-toolbar" aria-label={t.offers.stateAria}>
        {(['ready', 'loading', 'empty', 'error'] as LoadState[]).map((state) => (
          <button
            className={loadState === state ? 'active' : ''}
            key={state}
            type="button"
            onClick={() => onSetLoadState(state)}
          >
            {state}
          </button>
        ))}
      </div>

      {loadState === 'loading' && <StateCard title={t.offers.loadingTitle} text={t.offers.loadingText} />}
      {loadState === 'empty' && <StateCard title={t.offers.emptyTitle} text={t.offers.emptyText} />}
      {loadState === 'error' && <StateCard title={t.offers.errorTitle} text={t.offers.errorText} />}

      {loadState === 'ready' && selectedOffer && (
        <div className="offer-layout">
          <div className="offer-list" aria-label={t.offers.listAria}>
            {offers.map((offer) => (
              <button
                className={selectedOffer.id === offer.id ? 'offer-card active' : 'offer-card'}
                key={offer.id}
                type="button"
                onClick={() => onSelect(offer.id)}
              >
                <span>{offer.stage}</span>
                <h2>{offer.title}</h2>
                <p>
                  {offer.owner} · {offer.commitment}
                </p>
              </button>
            ))}
          </div>

          <article className="offer-detail">
            <p className="eyebrow">{t.offers.detailEyebrow}</p>
            <h1>{selectedOffer.title}</h1>
            <p className="lead">{selectedOffer.summary}</p>
            <dl>
              <div>
                <dt>{t.offers.labels.stage}</dt>
                <dd>{selectedOffer.stage}</dd>
              </div>
              <div>
                <dt>{t.offers.labels.commitment}</dt>
                <dd>{selectedOffer.commitment}</dd>
              </div>
              <div>
                <dt>{t.offers.labels.location}</dt>
                <dd>{selectedOffer.location}</dd>
              </div>
              <div>
                <dt>{t.offers.labels.budget}</dt>
                <dd>{selectedOffer.budget}</dd>
              </div>
            </dl>
            <div className="tags">
              {selectedOffer.skills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
            <button type="button" onClick={() => onInterest(selectedOffer.id)}>
              {interestSentFor === selectedOffer.id ? t.offers.interested : t.offers.interestCta}
            </button>
          </article>
        </div>
      )}
    </section>
  )
}

function StateCard({ text, title }: { text: string; title: string }) {
  return (
    <article className="empty-state">
      <h2>{title}</h2>
      <p>{text}</p>
    </article>
  )
}

function CreateOffer({
  onCancel,
  onSubmit,
  t,
}: {
  onCancel: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  t: Copy
}) {
  return (
    <section className="panel">
      <p className="eyebrow">{t.create.eyebrow}</p>
      <h1>{t.create.title}</h1>
      <form className="form grid-form" onSubmit={onSubmit}>
        <label>
          {t.create.titleLabel}
          <input name="title" placeholder={t.create.titlePlaceholder} required />
        </label>
        <label>
          {t.create.stageLabel}
          <select defaultValue={t.create.stages[1]} name="stage">
            {t.create.stages.map((stage) => (
              <option key={stage}>{stage}</option>
            ))}
          </select>
        </label>
        <label className="full">
          {t.create.summaryLabel}
          <textarea name="summary" placeholder={t.create.summaryPlaceholder} required />
        </label>
        <label>
          {t.create.skillsLabel}
          <input name="skills" placeholder={t.create.skillsPlaceholder} />
        </label>
        <label>
          {t.create.commitmentLabel}
          <input name="commitment" placeholder={t.create.commitmentPlaceholder} />
        </label>
        <label>
          {t.create.locationLabel}
          <input name="location" placeholder={t.create.locationPlaceholder} />
        </label>
        <label>
          {t.create.budgetLabel}
          <input name="budget" placeholder={t.create.budgetPlaceholder} />
        </label>
        <div className="form-actions full">
          <button type="submit">{t.create.submit}</button>
          <button className="secondary" type="button" onClick={onCancel}>
            {t.create.cancel}
          </button>
        </div>
      </form>
    </section>
  )
}

export default App
