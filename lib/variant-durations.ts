/**
 * Mapping manuel des durées par ID de variante Shopify
 * Chaque ID de variante est associé à une durée en minutes
 */

export const variantDurations: Record<string, number> = {
  // Nos Epilations à la Lumière Pulsée (Product ID: 9067411243352)
  "47938306081112": 15, // Maillot Classique
  "47938306113880": 20, // Maillot Echancré
  "47938306146648": 25, // Maillot Semi-Intégral
  "47938306179416": 30, // Maillot Intégral
  "47938306212184": 30, // Cuisses
  "47938306244952": 30, // Demi-Jambes
  "47938306277720": 50, // Jambes Entières
  "47938306310488": 15, // Aisselles
  "47938306343256": 20, // Avant-Bras
  "47938306376024": 30, // Bras Entiers

  // Les Épilations des Bras (Product ID: 6760974254137)
  "40228694949945": 15, // Aisselles
  "47860381221208": 10, // Bras-Entiers
  "47860381253976": 15, // Avant-Bras

  // Les Épilations des Jambes (Product ID: 6730971938873)
  "47860362969432": 30, // Jambes Entière
  "47866517487960": 15, // Demi-Jambes
  "47866517553496": 20, // Cuisses
  "54264800411992": 30, // Cuisses/ Demi-Jambes Cire Traditionelle

  // Les Epilations du Maillot (Product ID: 8349424976216)
  "46422965551448": 15, // 15min / Classique
  "47860371521880": 20, // 15min / Echancré
  "47860371489112": 25, // 15min / Semi-Intégral
  "47866507886936": 30, // 40min / Intégral

  // Les Épilations du Visage (Product ID: 6730975117369)
  "40091123810361": 25, // Visage Complet
  "47860433551704": 10, // Sourcils
  "47860433518936": 10, // Lèvres
  "47860433486168": 10, // Menton
  "47860433453400": 10, // Narines

  // Nos Epilation à Haute Fréquence (Product ID: 9067382866264)
  "47938233663832": 5, // 5min
  "47938233696600": 10, // 10min
  "47938233729368": 15, // 15min
  "47938233762136": 20, // 20min
  "47938233794904": 30, // 30min

  // Nos Manucures (Product ID: 6730928324665)
  "47878033015128": 45, // Ecologique
  "47878033047896": 60, // Japonaise

  // Pose Vernis (Product ID: 6799196487737)
  "40373386969145": 15, // Classique
  "47860294648152": 25, // Semi Permanent

  // Pose French Manucure Permanente (Product ID: 6817429192761)
  "40446290755641": 30, // 30min

  // Pose French Manucure (Product ID: 6808328732729)
  "40407576444985": 20, // 20min

  // Beauté des Pieds Traditionnelle (Product ID: 6730933862457)
  "40090888732729": 45, // Default Title

  // Soku Shindo Pieds (Product ID: 6730934550585)
  "40090892861497": 60, // 60min

  // Maquillage Soir (Product ID: 6799196061753)
  "40373381496889": 40, // 40min

  // Maquillage Jour (Product ID: 6799196028985)
  "40373380972601": 20, // 20min

  // Teinture Cils (Product ID: 6731080826937)
  "40091557822521": 30, // Default Title

  // Teinture Sourcils (Product ID: 6731081580601)
  "40091559821369": 20, // 20min

  // Teinture Cils & Sourcils (Product ID: 6731084529721)
  "40091570798649": 60, // 60min

  // Nanoneedling SkinIdent (Product ID: 6730945232953)
  "40090959642681": 30, // Default Title

  // Lifting Naturel Japonais (Product ID: 6730965450809)
  "40091074887737": 30, // Default Title

  // Swiss Deluxe Elasto-Collagène (Product ID: 6799170240569)
  "40373279293497": 90, // Default Title

  // Swiss Anti-Stress (Product ID: 9027713663320)
  "47852778357080": 60, // 60min

  // Swiiss Deluxe CellFacial (Product ID: 6799170142265)
  "40373276115001": 90, // Default Title

  // Acqua Facial Classique (Product ID: 6799196520505)
  "50181320278360": 90, // 60min

  // Swiss Éclat Immédiat (Product ID: 9027715989848)
  "47852783370584": 60, // 60min

  // Tokyo Phytotune Jeune Peau (Product ID: 6730633576505)
  "40089237913657": 30, // Default Title

  // Lifting Naturel Japonais (Product ID: 6730949886009)
  "40090986643513": 30, // 60min

  // Sensitive Couperose (Product ID: 6730941268025)
  "40090935787577": 60, // 60min

  // nanoneedling des Yeux (Product ID: 6974824775737)
  "41092591517753": 30, // 30min

  // Acqua Facial Signature (Product ID: 6730943397945)
  "40090949320761": 90, // 90min

  // Soin Régulateur de Sébum (Product ID: 9236075184472)
  "48360053965144": 60, // 60 min

  // Drainage + Palper Rouler (Product ID: 6799170863161)
  "40373286961209": 60, // Corps
  "47857597874520": 30, // Jambes

  // Palper Rouler par Zone (Product ID: 6799196323897)
  "40373385035833": 30, // 30min
  "47866563887448": 60, // 60min

  // Modelage Sur Mesure (Product ID: 6888992669753)
  "48360155513176": 30, // Dos / 30 min
  "47857561534808": 60, // Corps / 1 h
  "48360155545944": 30, // Corps / 30 min

  // Décorté Lift Dimension (Product ID: 8782755365208)
  "47218520752472": 90, // 90min

  // Gommage Savon Noir (Product ID: 6811796013113)
  "40425222111289": 60, // 60min

  // Cure de Soin (Product ID: 6960041132089)
  "41038960689209": 30, // 6 séances + 1 offerte
  "41038959050809": 30, // 10 séances + 2 offertes

  // Gommage Classique (Product ID: 6799195897913)
  "40373377531961": 30, // 30min

  // Enveloppement aux Algues/Boue (Product ID: 6730959224889)
  "40091038875705": 30, // 30min

  // Modelage aux Pochons d'Herbes (Product ID: 6799197700153)
  "40373405810745": 60, // 60min
};

/**
 * Durée par défaut si l'ID de variante n'est pas dans le mapping
 */
export const DEFAULT_VARIANT_DURATION = 30;

/**
 * Récupère la durée pour un ID de variante donné
 */
export function getVariantDuration(variantId: string | number): number {
  const id = variantId.toString();
  return variantDurations[id] || DEFAULT_VARIANT_DURATION;
}

/**
 * Vérifie si une variante a une durée personnalisée
 */
export function hasCustomDuration(variantId: string | number): boolean {
  const id = variantId.toString();
  return id in variantDurations;
}
