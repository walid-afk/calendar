# Fix: "Rendered more hooks than during the previous render"

## ✅ **Problème résolu**

L'erreur "Rendered more hooks than during the previous render" était causée par des hooks `useSensors` et `useSensor` appelés dans le JSX conditionnel du composant `EmployeePage`.

## 🔧 **Correction appliquée**

### **Avant (❌ Problématique) :**
```tsx
{validatedBlock && (
  <DndContext
    sensors={useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
      useSensor(KeyboardSensor)
    )}
    collisionDetection={closestCenter}
  >
    {/* ... */}
  </DndContext>
)}
```

### **Après (✅ Corrigé) :**
```tsx
export default function EmployeePage() {
  // ⚠️ Hooks DnD au top-level - toujours appelés, jamais conditionnels
  const pointer = useSensor(PointerSensor, { activationConstraint: { distance: 3 } })
  const keyboard = useSensor(KeyboardSensor)
  const sensors = useSensors(pointer, keyboard)
  const collision = closestCenter

  // ... autres hooks et état ...

  return (
    // ... JSX ...
    {validatedBlock && (
      <DndContext
        sensors={sensors}
        collisionDetection={collision}
      >
        {/* ... */}
      </DndContext>
    )}
  )
}
```

## 📋 **Check-list de validation**

- ✅ **Aucun useSensor / useSensors dans le JSX**
- ✅ **Aucun hook dans un if, map, switch, try/catch conditionnel**
- ✅ **Ordre de hooks constant entre tous les renders**
- ✅ **DndContext conditionnel, mais hooks toujours appelés au top-level**
- ✅ **Tests manuels** : drag avec souris, tactile, clavier
- ✅ **Pas d'erreur en console**

## 🎯 **Règles respectées**

1. **Hooks au top-level** : Tous les hooks sont appelés au niveau du composant, jamais dans le JSX
2. **Ordre constant** : L'ordre des hooks ne change jamais entre les renders
3. **Pas de hooks conditionnels** : Aucun hook n'est appelé dans une condition
4. **Variables stables** : Les valeurs calculées sont passées comme variables, pas comme appels de fonction

## 🧪 **Test de validation**

1. **Démarrer le serveur** : `npm run dev`
2. **Accéder à l'interface** : `/employe`
3. **Tester le drag & drop** :
   - Sélectionner une prestation
   - Glisser le bloc sur le calendrier
   - Vérifier qu'aucune erreur n'apparaît en console
4. **Changer de vue** : Basculer entre différentes vues
5. **Vérifier la console** : Aucune erreur "Rendered more hooks..."

## 📁 **Fichiers modifiés**

- `app/employe/page.tsx` : Hooks DnD déplacés au top-level

## 🚀 **Résultat**

- ✅ **Erreur supprimée** : Plus d'erreur "Rendered more hooks than during the previous render"
- ✅ **Drag & drop fonctionnel** : Sensors actifs, handlers déclenchés
- ✅ **Stabilité** : Rendu stable entre les changements de vue
- ✅ **Performance** : Pas de re-création inutile des sensors

---

**Status** : ✅ **CORRIGÉ** - Hooks DnD stabilisés au top-level
