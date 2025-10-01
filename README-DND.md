# DayCalendarView - Drag & Drop Implementation

## Vue calendrier jour avec colonnes employés et drag & drop

### Fonctionnalités implémentées

#### ✅ **Vue calendrier jour/employé**
- Affichage d'une journée avec colonnes par employé
- Créneaux horaires de 09:00 à 19:00 (configurable)
- Fuseau horaire Europe/Paris
- Intégration FreeBusy pour les créneaux occupés

#### ✅ **Drag & Drop avec dnd-kit**
- **Sensors** : PointerSensor + KeyboardSensor
- **Collision detection** : closestCenter
- **Modifiers** : 
  - `restrictToVerticalAxis` : Mouvement vertical uniquement
  - `snapTo15min` : Snap aux 15 minutes
  - `restrictToCalendarBounds` : Contraintes horaires
- **DragOverlay** : Aperçu du bloc en cours de drag
- **Support clavier** : Navigation avec flèches, Enter, Esc

#### ✅ **Règles métier**
- **Lead time** : 60 minutes minimum avant réservation
- **Buffer** : 5 minutes après chaque RDV
- **Snap** : 15 minutes (configurable)
- **Heures d'ouverture** : 09:00-19:00 (configurable)
- **Détection de conflits** : Événements + buffer
- **Cross-employee** : Drag entre employés (configurable)

#### ✅ **Intégration FreeBusy**
- Chargement automatique des créneaux occupés
- API `/api/freebusy` pour chaque employé
- Affichage des zones indisponibles
- Mise à jour en temps réel

### Test du drag & drop

#### **Test manuel local :**

1. **Démarrer le serveur** :
   ```bash
   npm run dev
   # Serveur sur http://localhost:3000
   ```

2. **Accéder à l'interface** :
   - Aller sur `/employe`
   - Entrer le code d'accès
   - Se connecter à Google

3. **Tester le drag & drop** :
   - Sélectionner une prestation dans le panier
   - Glisser le bloc sur le calendrier
   - Vérifier le snap aux 15 minutes
   - Tester les contraintes (hors heures, conflits)
   - Utiliser les flèches clavier pour navigation

#### **Vérifications à effectuer :**

- ✅ **Snap 15min** : Le bloc se positionne sur les créneaux de 15min
- ✅ **Contraintes horaires** : Impossible de déposer avant 9h ou après 19h
- ✅ **Lead time** : Impossible de réserver moins de 60min à l'avance
- ✅ **Conflits** : Impossible de déposer sur un créneau occupé
- ✅ **DragOverlay** : Aperçu fluide pendant le drag
- ✅ **Support clavier** : Navigation avec flèches, Enter, Esc
- ✅ **FreeBusy** : Chargement des créneaux occupés
- ✅ **Cross-employee** : Drag entre colonnes employés

### Structure des fichiers

```
app/components/calendar/
├── DayCalendarView.tsx          # Vue principale avec DND
├── CombinedCartBlock.tsx        # Bloc draggable
├── CustomDragPreview.tsx        # Aperçu de drag
├── EventBlock.tsx              # Événements réservés
└── UnavailableBlock.tsx        # Zones indisponibles

lib/
├── dnd/modifiers.ts            # Modificateurs DND
├── slots.ts                   # Helpers créneaux
└── time.ts                    # Helpers fuseau horaire

app/api/freebusy/route.ts      # API FreeBusy
```

### Configuration

#### **Variables d'environnement :**
```bash
DEFAULT_OPENING=09:00-19:00
SLOT_STEP_MINUTES=15
MIN_LEAD_MINUTES=60
POST_BOOK_BUFFER_MINUTES=5
DEFAULT_TZ=Europe/Paris
```

#### **Packages requis :**
```bash
@dnd-kit/core@6.3.1
@dnd-kit/sortable@10.0.0
@dnd-kit/modifiers@9.0.0
```

### Debug et logs

Le composant inclut des logs de debug :
- `🎯 Drag start` : Début du drag
- `🎯 Drag over` : Validation en temps réel
- `🎯 Drag end` : Fin du drag
- `🎯 Loading FreeBusy` : Chargement des créneaux

### Problèmes résolus

1. **Import dnd-kit** : Packages installés et configurés
2. **Sensors** : PointerSensor + KeyboardSensor fonctionnels
3. **Modifiers** : Snap et contraintes appliqués
4. **DragOverlay** : Aperçu pendant le drag
5. **FreeBusy** : Intégration API fonctionnelle
6. **TypeScript** : Aucune erreur de type
7. **Linting** : Code conforme aux standards

### Performance

- **Memoization** : useMemo pour les calculs coûteux
- **Callbacks** : useCallback pour les handlers
- **Lazy loading** : FreeBusy chargé à la demande
- **Optimistic updates** : Interface réactive

### Accessibilité

- **Support clavier** : Navigation complète
- **Screen readers** : Annonces de drag & drop
- **Focus management** : Gestion du focus
- **Touch support** : Support tactile mobile

---

**Status** : ✅ **FONCTIONNEL** - Drag & drop opérationnel avec dnd-kit
