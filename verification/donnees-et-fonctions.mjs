// =============================================================================
//  VERIFICATION 1 — DONNEES DE REFERENCE ET FONCTIONS PURES
// =============================================================================
//
//  Lancer avec :   npm run verifier:donnees
//
//  Ce fichier ne demande AUCUNE installation supplementaire : il s'execute
//  avec Node seul, en quelques dixiemes de seconde. Il verifie ce qui peut
//  l'etre sans navigateur :
//    - les identifiants de materiaux et de zones sont uniques (un doublon
//      rendrait des annonces introuvables) ;
//    - toutes les zones ont des coordonnees situees en Cote d'Ivoire ;
//    - l'application ne casse pas devant une ancienne annonce qui reference
//      un materiau ou une zone supprime depuis ;
//    - les numeros de telephone ivoiriens sont normalises correctement,
//      quelle que soit la facon dont ils sont saisis ;
//    - le lien WhatsApp est bien forme et correctement encode.
// =============================================================================

import { MATERIAUX, UNITES, trouverMateriau, libelleMateriau, libelleUnite } from '../src/data/materiaux.js'
import { ZONES, trouverZone, libelleZone, zonesParGroupe, CENTRE_PAR_DEFAUT } from '../src/data/zones.js'
import { normaliserNumero, numeroValide, messagePreRempli, lienWhatsApp } from '../src/utils/whatsapp.js'

let ko = 0
const ok = (c, l, extra='') => { if(!c){ko++; console.log('  ECHEC :', l, extra)} }

console.log('--- Integrite des donnees de reference ---')
const idsM = MATERIAUX.map(m=>m.id)
ok(new Set(idsM).size === idsM.length, 'ids materiaux uniques')
ok(MATERIAUX.every(m=>m.id&&m.libelle&&m.emoji&&/^#[0-9a-f]{6}$/i.test(m.couleur)), 'chaque materiau complet + couleur hex valide')
const idsU = UNITES.map(u=>u.id)
ok(new Set(idsU).size === idsU.length, 'ids unites uniques')
const idsZ = ZONES.map(z=>z.id)
ok(new Set(idsZ).size === idsZ.length, 'ids zones uniques')
// Cote d'Ivoire : lat 4.2..10.8 ; lng -8.7..-2.4
const hors = ZONES.filter(z => !(z.lat>=4.2&&z.lat<=10.8&&z.lng>=-8.7&&z.lng<=-2.4))
ok(hors.length===0, 'toutes les zones dans les limites de la Cote d Ivoire', JSON.stringify(hors.map(z=>z.id)))
ok(ZONES.every(z=>z.groupe), 'chaque zone a un groupe')
const g = zonesParGroupe()
ok(Object.values(g).flat().length === ZONES.length, 'zonesParGroupe ne perd aucune zone')
console.log(`  ${MATERIAUX.length} materiaux, ${UNITES.length} unites, ${ZONES.length} zones, groupes : ${Object.keys(g).join(' / ')}`)

console.log('\n--- Reprise sur donnee inconnue (annonce ancienne) ---')
ok(libelleMateriau('materiau-supprime')==='materiau-supprime', 'libelleMateriau retombe sur l id')
ok(libelleZone('zone-supprimee')==='zone-supprimee', 'libelleZone retombe sur l id')
ok(libelleUnite('unite-inconnue')==='unite-inconnue', 'libelleUnite retombe sur l id')
ok(trouverMateriau('nexistepas')===undefined, 'trouverMateriau rend undefined')

console.log('\n--- Normalisation des numeros ---')
const cas = [
  ['07 01 02 03 04','2250701020304'], ['+225 07 01 02 03 04','2250701020304'],
  ['00225 0701020304','2250701020304'], ['225-07-01-02-03-04','2250701020304'],
  ['0701020304','2250701020304'], ['(+225) 07.01.02.03.04','2250701020304'],
  ['2250701020304','2250701020304'], ['05 01 02 03 04','2250501020304'],
]
for (const [entree, attendu] of cas) {
  const r = normaliserNumero(entree)
  ok(r===attendu, `"${entree}" -> ${attendu}`, `obtenu ${r}`)
}
ok(normaliserNumero('')==='', 'chaine vide')
ok(normaliserNumero(null)==='', 'null')
ok(normaliserNumero(undefined)==='', 'undefined')

console.log('\n--- Validation des numeros ---')
ok(numeroValide('07 01 02 03 04'), 'numero ivoirien 10 chiffres accepte')
ok(numeroValide('+225 07 01 02 03 04'), 'avec indicatif accepte')
ok(!numeroValide('123'), 'trop court refuse')
ok(!numeroValide(''), 'vide refuse')
ok(!numeroValide('0701'), 'incomplet refuse')
ok(!numeroValide('07010203040506070809'), 'trop long refuse')

console.log('\n--- Lien WhatsApp ---')
const a = { titre:'Gravats Cocody', materiau:'gravats', quantite:12, unite:'tonne', zone:'abidjan-cocody',
            nomChantier:'BTP Konan', telephone:'2250701020304' }
const lien = lienWhatsApp(a)
ok(lien.startsWith('https://wa.me/2250701020304?text='), 'format du lien')
const msg = decodeURIComponent(lien.split('text=')[1])
ok(msg.includes('BTP Konan') && msg.includes('Gravats') && msg.includes('12') && msg.includes('Abidjan - Cocody'),
   'message contient chantier, materiau, quantite, lieu')
ok(!lien.includes(' '), 'aucun espace brut dans le lien')
ok(lien.includes('%0A'), 'sauts de ligne bien encodes')
// materiau/zone inconnus ne doivent pas casser le lien
const b2 = { ...a, materiau:'inconnu', zone:'inconnue' }
ok(lienWhatsApp(b2).startsWith('https://wa.me/'), 'lien robuste si materiau/zone inconnus')

console.log(ko===0 ? '\n== TOUT PASSE ==' : `\n== ${ko} ECHEC(S) ==`)
process.exit(ko?1:0)
