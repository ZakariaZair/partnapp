import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

declare const process: {
  env?: {
    EXPO_PUBLIC_API_BASE_URL?: string;
  };
};

type Screen = 'home' | 'onboarding' | 'auth' | 'profile' | 'offers' | 'offerDetail' | 'createOffer';

type Profile = {
  name: string;
  role: string;
  location: string;
  bio: string;
};

type PartnershipOffer = {
  id: string;
  title: string;
  summary: string;
  projectStage: string;
  skillsNeeded: string[];
  ownerName: string;
  location: string;
};

type OfferForm = {
  title: string;
  summary: string;
  projectStage: string;
  skillsNeeded: string;
};

const API_BASE_URL = process.env?.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

const demoOffers: PartnershipOffer[] = [
  {
    id: 'demo-1',
    title: 'Équipe de tonte pour contrats résidentiels',
    summary:
      'Trois clients prêts pour la saison. Recherche une personne fiable avec équipement ou disponibilité les fins de semaine.',
    projectStage: 'Saisonnier',
    skillsNeeded: ['Terrain', 'Service client', 'Organisation'],
    ownerName: 'Mathieu',
    location: 'Laval',
  },
  {
    id: 'demo-2',
    title: 'Petit chantier toiture à organiser',
    summary:
      'Deux propriétaires veulent regrouper inspection, estimation et main-d’œuvre. Besoin d’un profil terrain qui connaît les fournisseurs.',
    projectStage: 'Clients à confirmer',
    skillsNeeded: ['Construction', 'Soumissions', 'Logistique'],
    ownerName: 'Amélie',
    location: 'Longueuil',
  },
  {
    id: 'demo-3',
    title: 'Lancement d’un événement de quartier',
    summary:
      'Salle municipale disponible en août. Recherche un partenaire pour commandites locales, billetterie et coordination bénévoles.',
    projectStage: 'Pré-lancement',
    skillsNeeded: ['Événementiel', 'Ventes', 'Coordination'],
    ownerName: 'Yassine',
    location: 'Montréal-Nord',
  },
  {
    id: 'demo-4',
    title: 'Prototype de jeu mobile éducatif',
    summary:
      'Concept testé avec des parents. Besoin d’un développeur ou game designer pour construire un prototype simple jouable.',
    projectStage: 'Prototype',
    skillsNeeded: ['Jeu', 'Design', 'Mobile'],
    ownerName: 'Claire',
    location: 'Remote',
  },
  {
    id: 'demo-5',
    title: 'Comptoir café dans un local partagé',
    summary:
      'Local disponible près d’un gym. Recherche partenaire opérations pour tester un comptoir matin et midi pendant 8 semaines.',
    projectStage: 'Test local',
    skillsNeeded: ['Commerce local', 'Opérations', 'Fournisseurs'],
    ownerName: 'Samir',
    location: 'Sherbrooke',
  },
];

const initialProfile: Profile = {
  name: 'Zakaria',
  role: 'Fondateur en exploration',
  location: 'Canada',
  bio: 'Je cherche un partenaire complémentaire pour transformer une idée en projet concret.',
};

const initialOfferForm: OfferForm = {
  title: '',
  summary: '',
  projectStage: '',
  skillsNeeded: '',
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [offers, setOffers] = useState<PartnershipOffer[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [offerForm, setOfferForm] = useState<OfferForm>(initialOfferForm);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const [offersError, setOffersError] = useState<string | null>(null);
  const [interestState, setInterestState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');

  const selectedOffer = useMemo(
    () => offers.find((offer) => offer.id === selectedOfferId) ?? null,
    [offers, selectedOfferId],
  );

  useEffect(() => {
    void loadOffers();
  }, []);

  async function loadOffers() {
    setIsLoadingOffers(true);
    setOffersError(null);

    if (!API_BASE_URL) {
      setOffers(demoOffers);
      setOffersError('EXPO_PUBLIC_API_BASE_URL absent. Données de démonstration affichées.');
      setIsLoadingOffers(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/partnership-offers`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as PartnershipOffer[];
      setOffers(Array.isArray(data) ? data : []);
    } catch {
      setOffers(demoOffers);
      setOffersError('API offres indisponible. Données de démonstration affichées.');
    } finally {
      setIsLoadingOffers(false);
    }
  }

  async function createOffer() {
    const normalizedOffer: PartnershipOffer = {
      id: `local-${Date.now()}`,
      title: offerForm.title.trim(),
      summary: offerForm.summary.trim(),
      projectStage: offerForm.projectStage.trim() || 'À préciser',
      skillsNeeded: offerForm.skillsNeeded
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
      ownerName: profile.name,
      location: profile.location,
    };

    if (!normalizedOffer.title || !normalizedOffer.summary) {
      Alert.alert('Offre incomplète', 'Ajoute au minimum un titre et un résumé.');
      return;
    }

    if (API_BASE_URL) {
      try {
        await fetch(`${API_BASE_URL}/partnership-offers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(normalizedOffer),
        });
      } catch {
        setOffersError('Création API indisponible. Offre gardée localement pour cette session.');
      }
    }

    setOffers((currentOffers) => [normalizedOffer, ...currentOffers]);
    setOfferForm(initialOfferForm);
    setSelectedOfferId(normalizedOffer.id);
    setScreen('offerDetail');
  }

  async function expressInterest(offerId: string) {
    setInterestState('loading');

    if (API_BASE_URL) {
      try {
        const response = await fetch(`${API_BASE_URL}/partnership-offers/${offerId}/interests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileName: profile.name,
            message: `Je souhaite échanger sur cette offre depuis l'app mobile.`,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch {
        setInterestState('error');
        return;
      }
    }

    setInterestState('sent');
  }

  function openOffer(offerId: string) {
    setSelectedOfferId(offerId);
    setInterestState('idle');
    setScreen('offerDetail');
  }

  function renderScreen() {
    if (screen === 'home') {
      return (
        <ScreenCard eyebrow="PartNApp mobile" title="Des partenariats concrets, pas des idées floues.">
          <Text style={styles.body}>
            Découvre des projets de vraie vie, publie un besoin précis et contacte rapidement une
            personne complémentaire.
          </Text>
          <View style={styles.heroPanel}>
            <Text style={styles.heroMetric}>5</Text>
            <Text style={styles.heroText}>offres réalistes prêtes à explorer en mode mobile.</Text>
          </View>
          <View style={styles.actionStack}>
            <Button label="Commencer l’onboarding" onPress={() => setScreen('onboarding')} />
            <Button label="Voir les offres" variant="secondary" onPress={() => setScreen('offers')} />
          </View>
        </ScreenCard>
      );
    }

    if (screen === 'onboarding') {
      return (
        <ScreenCard eyebrow="Onboarding" title="Présente ton objectif en moins d’une minute.">
          <InfoStep index="1" title="Ton profil" description="Indique ton rôle, ta zone et ton contexte." />
          <InfoStep
            index="2"
            title="Ton besoin"
            description="Précise les compétences que tu recherches pour avancer."
          />
          <InfoStep
            index="3"
            title="Premier contact"
            description="Exprime ton intérêt et démarre une conversation qualifiée."
          />
          <Button label="Continuer vers l’authentification" onPress={() => setScreen('auth')} />
        </ScreenCard>
      );
    }

    if (screen === 'auth') {
      return (
        <ScreenCard eyebrow="Authentification" title="Session mobile prête pour le parcours MVP.">
          <Text style={styles.body}>
            Le projet utilise Supabase Auth côté clients. Cette version mobile garde une session
            locale tant que l’intégration Supabase n’est pas branchée dans l’app.
          </Text>
          <Button
            label={isAuthenticated ? 'Session active' : 'Se connecter'}
            onPress={() => {
              setIsAuthenticated(true);
              setScreen('profile');
            }}
          />
        </ScreenCard>
      );
    }

    if (screen === 'profile') {
      return (
        <ScreenCard eyebrow="Profil" title="Ton profil partenaire">
          <Field label="Nom" value={profile.name} onChangeText={(name) => setProfile({ ...profile, name })} />
          <Field label="Rôle" value={profile.role} onChangeText={(role) => setProfile({ ...profile, role })} />
          <Field
            label="Localisation"
            value={profile.location}
            onChangeText={(location) => setProfile({ ...profile, location })}
          />
          <Field
            label="Bio"
            value={profile.bio}
            multiline
            onChangeText={(bio) => setProfile({ ...profile, bio })}
          />
          <Button label="Parcourir les offres" onPress={() => setScreen('offers')} />
        </ScreenCard>
      );
    }

    if (screen === 'offers') {
      return (
        <ScreenCard eyebrow="Offres" title="Opportunités de partenariat">
          <View style={styles.row}>
            <Button label="Rafraîchir" variant="secondary" onPress={() => void loadOffers()} />
            <Button label="Publier" onPress={() => setScreen('createOffer')} />
          </View>

          {isLoadingOffers ? (
            <StateMessage title="Chargement" description="Récupération des offres en cours." loading />
          ) : null}

          {!isLoadingOffers && offersError ? (
            <StateMessage title="Mode dégradé" description={offersError} tone="warning" />
          ) : null}

          {!isLoadingOffers && offers.length === 0 ? (
            <StateMessage title="Aucune offre" description="Publie la première offre de partenariat." />
          ) : null}

          {offers.map((offer) => (
            <Pressable key={offer.id} style={styles.offerCard} onPress={() => openOffer(offer.id)}>
              <View style={styles.offerCardHeader}>
                <Text style={styles.offerTitle}>{offer.title}</Text>
                <Text style={styles.offerArrow}>↗</Text>
              </View>
              <Text style={styles.offerMeta}>
                {offer.projectStage} · {offer.location} · {offer.ownerName}
              </Text>
              <Text style={styles.offerSummary} numberOfLines={3}>
                {offer.summary}
              </Text>
              <Text style={styles.tags}>{offer.skillsNeeded.join(' · ') || 'Compétences à préciser'}</Text>
            </Pressable>
          ))}
        </ScreenCard>
      );
    }

    if (screen === 'offerDetail') {
      if (!selectedOffer) {
        return (
          <ScreenCard eyebrow="Détail" title="Offre introuvable">
            <StateMessage title="Erreur" description="Sélectionne une offre existante depuis la liste." tone="error" />
            <Button label="Retour aux offres" onPress={() => setScreen('offers')} />
          </ScreenCard>
        );
      }

      return (
        <ScreenCard eyebrow="Détail de l’offre" title={selectedOffer.title}>
          <Text style={styles.offerMeta}>
            {selectedOffer.projectStage} · {selectedOffer.location} · publié par {selectedOffer.ownerName}
          </Text>
          <Text style={styles.body}>{selectedOffer.summary}</Text>
          <Text style={styles.sectionLabel}>Compétences recherchées</Text>
          <Text style={styles.tags}>{selectedOffer.skillsNeeded.join(' · ') || 'À préciser'}</Text>

          {interestState === 'sent' ? (
            <StateMessage title="Intérêt envoyé" description="Le contact est enregistré côté mobile." />
          ) : null}
          {interestState === 'error' ? (
            <StateMessage
              title="Erreur d’envoi"
              description="L’endpoint d’intérêt n’est pas disponible ou a refusé la demande."
              tone="error"
            />
          ) : null}

          <Button
            label={interestState === 'loading' ? 'Envoi en cours...' : 'Exprimer mon intérêt'}
            onPress={() => void expressInterest(selectedOffer.id)}
          />
          <Button label="Retour aux offres" variant="secondary" onPress={() => setScreen('offers')} />
        </ScreenCard>
      );
    }

    return (
      <ScreenCard eyebrow="Publication" title="Créer une offre de partenariat">
        <Field
          label="Titre"
          value={offerForm.title}
          onChangeText={(title) => setOfferForm({ ...offerForm, title })}
          placeholder="Ex. Service saisonnier de lavage de vitres"
        />
        <Field
          label="Résumé"
          value={offerForm.summary}
          multiline
          onChangeText={(summary) => setOfferForm({ ...offerForm, summary })}
          placeholder="Explique le projet, le stade et le besoin."
        />
        <Field
          label="Stade du projet"
          value={offerForm.projectStage}
          onChangeText={(projectStage) => setOfferForm({ ...offerForm, projectStage })}
          placeholder="Idée, MVP, premiers clients..."
        />
        <Field
          label="Compétences recherchées"
          value={offerForm.skillsNeeded}
          onChangeText={(skillsNeeded) => setOfferForm({ ...offerForm, skillsNeeded })}
          placeholder="Marketing, produit, tech..."
        />
        <Button label="Publier l’offre" onPress={() => void createOffer()} />
      </ScreenCard>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.shell}>
        <View style={styles.textureDotLarge} />
        <View style={styles.textureDotSmall} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {renderScreen()}
          </ScrollView>
        </KeyboardAvoidingView>
        <View style={styles.bottomNav}>
          <NavButton label="Accueil" symbol="⌂" active={screen === 'home'} onPress={() => setScreen('home')} />
          <NavButton label="Profil" symbol="◇" active={screen === 'profile'} onPress={() => setScreen('profile')} />
          <NavButton label="Offres" symbol="□" active={screen === 'offers'} onPress={() => setScreen('offers')} />
          <NavButton
            label="Publier"
            symbol="+"
            active={screen === 'createOffer'}
            onPress={() => setScreen('createOffer')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function ScreenCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

function Button({
  label,
  onPress,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.button, variant === 'secondary' ? styles.secondaryButton : null]}
    >
      <Text style={[styles.buttonText, variant === 'secondary' ? styles.secondaryButtonText : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

function NavButton({
  label,
  symbol,
  active,
  onPress,
}: {
  label: string;
  symbol: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.navButton, active ? styles.activeNavButton : null]}>
      <Text style={[styles.navSymbol, active ? styles.activeNavButtonText : null]}>{symbol}</Text>
      <Text style={[styles.navButtonText, active ? styles.activeNavButtonText : null]}>{label}</Text>
    </Pressable>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline={multiline}
        style={[styles.input, multiline ? styles.multilineInput : null]}
        placeholderTextColor="#94a3b8"
      />
    </View>
  );
}

function InfoStep({ index, title, description }: { index: string; title: string; description: string }) {
  return (
    <View style={styles.infoStep}>
      <Text style={styles.stepIndex}>{index}</Text>
      <View style={styles.stepText}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDescription}>{description}</Text>
      </View>
    </View>
  );
}

function StateMessage({
  title,
  description,
  loading,
  tone = 'default',
}: {
  title: string;
  description: string;
  loading?: boolean;
  tone?: 'default' | 'warning' | 'error';
}) {
  return (
    <View
      style={[
        styles.stateMessage,
        tone === 'warning' ? styles.warningState : null,
        tone === 'error' ? styles.errorState : null,
      ]}
    >
      {loading ? <ActivityIndicator color="#0f766e" style={styles.stateSpinner} /> : null}
      <View style={styles.stateText}>
        <Text style={styles.stateTitle}>{title}</Text>
        <Text style={styles.stateDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f1e2',
  },
  shell: {
    flex: 1,
    backgroundColor: '#eee4cf',
    overflow: 'hidden',
  },
  textureDotLarge: {
    position: 'absolute',
    right: -80,
    top: 34,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: '#d8c7a6',
    opacity: 0.34,
  },
  textureDotSmall: {
    position: 'absolute',
    bottom: 86,
    left: -54,
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: '#b9a57f',
    opacity: 0.2,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 92,
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f9f1e2',
    borderColor: '#d8c7a6',
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
  },
  navButton: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    gap: 2,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 2,
    paddingVertical: 6,
  },
  activeNavButton: {
    backgroundColor: '#eadcc4',
  },
  navSymbol: {
    color: '#7b6d5c',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 18,
  },
  navButtonText: {
    color: '#7b6d5c',
    fontSize: 11,
    fontWeight: '800',
  },
  activeNavButtonText: {
    color: '#11110f',
  },
  card: {
    backgroundColor: '#f9f1e2',
    borderColor: '#d9cab0',
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#2d2415',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
  },
  eyebrow: {
    color: '#7c5d1e',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  title: {
    color: '#171512',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    marginBottom: 14,
  },
  body: {
    color: '#4f4638',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 18,
  },
  heroPanel: {
    alignItems: 'center',
    backgroundColor: '#171512',
    borderRadius: 22,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
    padding: 16,
  },
  heroMetric: {
    color: '#f1c86b',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  heroText: {
    color: '#f9f1e2',
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  actionStack: {
    gap: 10,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#171512',
    borderRadius: 16,
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  secondaryButton: {
    backgroundColor: '#eadcc4',
  },
  buttonText: {
    color: '#f9f1e2',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButtonText: {
    color: '#171512',
  },
  infoStep: {
    alignItems: 'flex-start',
    backgroundColor: '#f3e8d3',
    borderColor: '#decfb7',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    padding: 14,
  },
  stepIndex: {
    backgroundColor: '#171512',
    borderRadius: 999,
    color: '#f1c86b',
    fontSize: 14,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    color: '#171512',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  stepDescription: {
    color: '#5f5547',
    fontSize: 14,
    lineHeight: 20,
  },
  field: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: '#3f382f',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff8eb',
    borderColor: '#d7c6aa',
    borderRadius: 16,
    borderWidth: 1,
    color: '#171512',
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  multilineInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  offerCard: {
    backgroundColor: '#fff8eb',
    borderColor: '#d8c7a6',
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 12,
    minHeight: 136,
    padding: 14,
  },
  offerCardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  offerTitle: {
    color: '#171512',
    flex: 1,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 22,
    marginBottom: 6,
  },
  offerArrow: {
    color: '#8a6a25',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
  },
  offerMeta: {
    color: '#7b6d5c',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  offerSummary: {
    color: '#4f4638',
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 10,
  },
  tags: {
    color: '#77591d',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 14,
  },
  sectionLabel: {
    color: '#3f382f',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 6,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  stateMessage: {
    alignItems: 'flex-start',
    backgroundColor: '#f2ead9',
    borderColor: '#d8c7a6',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 14,
    padding: 14,
  },
  warningState: {
    backgroundColor: '#fff3cf',
    borderColor: '#e7c767',
  },
  errorState: {
    backgroundColor: '#fae5df',
    borderColor: '#e9aaa0',
  },
  stateSpinner: {
    marginRight: 10,
    marginTop: 2,
  },
  stateText: {
    flex: 1,
  },
  stateTitle: {
    color: '#171512',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
  },
  stateDescription: {
    color: '#5f5547',
    fontSize: 14,
    lineHeight: 20,
  },
});
