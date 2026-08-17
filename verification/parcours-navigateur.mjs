// =============================================================================
//  VERIFICATION 2 — PARCOURS COMPLET DANS UN VRAI NAVIGATEUR
// =============================================================================
//
//  Lancer avec :   npm run verifier:navigateur
//  Prealable   :   npm install --no-save playwright && npx playwright install chromium
//
//  Playwright n'est VOLONTAIREMENT pas dans package.json : il pese plusieurs
//  centaines de Mo une fois le navigateur telecharge. On l'installe seulement
//  quand on veut lancer cette verification, pour que "npm install" reste leger.
//
//  Ce fichier pilote l'application comme le ferait un utilisateur, sur un
//  ecran de telephone (390 x 844). Il couvre onze domaines :
//     1. compression de la photo avant enregistrement
//     2. refus des fichiers non valides ou trop lourds
//     3. validation de chaque champ du formulaire
//     4. geolocalisation : succes, refus, et navigateur muet
//     5. suppression d'une annonce (avec et sans confirmation)
//     6. resistance a des donnees corrompues dans le navigateur
//     7. navigation et adresses inconnues
//     8. ergonomie mobile : zones tactiles, debordements, etiquettes
//     9. tenue en charge avec 60 annonces
//    10. comportement quand le stockage du navigateur est plein
//    11. parcours complet du recycleur, filtres et carte
//
//  Par defaut il teste le serveur de developpement (http://localhost:5173).
//  Pour tester le site final, celui qui sera reellement mis en ligne :
//     npm run build && npx vite preview --port 4180
//     VALOPRO_URL=http://localhost:4180 npm run verifier:navigateur
//
//  IMPORTANT : sur un poste sans acces a OpenStreetMap, le fond de carte reste
//  gris. Ce n'est pas un echec : les marqueurs et la carte fonctionnent quand
//  meme, seules les images de fond manquent.
// =============================================================================

import { chromium } from 'playwright'

// Chemin du navigateur. Laisse vide pour utiliser celui que Playwright installe.
const CHROME = process.env.CHROME_PATH || undefined
const BASE = process.env.VALOPRO_URL || 'http://localhost:5173'
const S = process.env.CAPTURES || '.' // dossier ou deposer les captures d ecran

let ko = 0
const ok = (c, l, extra = '') => {
  console.log(`  ${c ? 'ok  ' : 'ECHEC'} ${l}${extra && !c ? ' -> ' + extra : ''}`)
  if (!c) ko++
}

const nav = await chromium.launch(CHROME ? { executablePath: CHROME } : {})

/** Nouvelle page vierge (localStorage vide), format telephone. */
async function page(opts = {}) {
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, ...opts })
  const p = await ctx.newPage()
  p.__err = []
  p.on('pageerror', (e) => p.__err.push('PAGEERROR: ' + e.message))
  p.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/TUNNEL|favicon|net::ERR|404/.test(t)) p.__err.push('CONSOLE: ' + t)
  })
  return p
}

const annonceType = (o = {}) => ({
  id: 'x' + Math.random().toString(36).slice(2, 8),
  titre: 'Gravats Cocody', materiau: 'gravats', quantite: 12, unite: 'tonne',
  description: 'Gravats propres.', photo: null, zone: 'abidjan-cocody',
  lat: 5.36, lng: -3.99, nomChantier: 'BTP Konan', telephone: '2250701020304',
  creeLe: new Date().toISOString(), ...o,
})

async function seed(p, annonces) {
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await p.evaluate((a) => localStorage.setItem('valopro.annonces.v1', JSON.stringify(a)), annonces)
  await p.reload({ waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(1800)
}

// remplit le formulaire de publication ; renvoie la page
async function remplirFormulaire(p, v = {}) {
  const d = { titre: 'Ferraille Riviera', materiau: 'ferraille', quantite: '3.5', unite: 'tonne',
    description: 'Fers a beton tries.', zone: 'abidjan-cocody', chantier: 'SOGEBAT CI', tel: '07 08 09 10 11', ...v }
  const s = p.locator('select')
  if (d.titre !== null) await p.getByPlaceholder('Ex. Gravats de demolition - Villa Cocody').fill(d.titre)
  if (d.materiau !== null) await s.first().selectOption(d.materiau)
  if (d.quantite !== null) await p.getByPlaceholder('12').fill(d.quantite)
  if (d.unite !== null) await s.nth(1).selectOption(d.unite)
  if (d.description !== null) await p.getByPlaceholder(/Gravats propres issus/).fill(d.description)
  if (d.zone !== null) await s.nth(2).selectOption(d.zone)
  if (d.chantier !== null) await p.getByPlaceholder('Ex. Entreprise BTP Konan').fill(d.chantier)
  if (d.tel !== null) await p.getByPlaceholder('07 01 02 03 04').fill(d.tel)
}

console.log(`\n########## VERIFICATION VALOPRO — ${BASE} ##########`)

// =====================================================================
console.log('\n=== 1. PHOTO : compression avant enregistrement ===')
{
  const p = await page()
  await p.goto(BASE + '/publier', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(800)

  // Fabrique une grande photo realiste (3000x2250, bruit -> peu compressible).
  const b64 = await p.evaluate(() => {
    const c = document.createElement('canvas')
    c.width = 3000; c.height = 2250
    const x = c.getContext('2d')
    const img = x.createImageData(c.width, c.height)
    for (let i = 0; i < img.data.length; i += 4) {
      img.data[i] = Math.random() * 255; img.data[i + 1] = Math.random() * 255
      img.data[i + 2] = Math.random() * 255; img.data[i + 3] = 255
    }
    x.putImageData(img, 0, 0)
    return c.toDataURL('image/jpeg', 0.95).split(',')[1]
  })
  const buf = Buffer.from(b64, 'base64')
  const moOrigine = buf.length / 1024 / 1024
  console.log(`  photo d origine : 3000x2250, ${moOrigine.toFixed(2)} Mo`)
  ok(moOrigine > 1, 'la photo de test est bien volumineuse (>1 Mo)')

  await p.locator('input[type=file]').setInputFiles({ name: 'chantier.jpg', mimeType: 'image/jpeg', buffer: buf })
  await p.waitForTimeout(4000)

  const apercu = p.locator('img[alt="Apercu du lot"]')
  ok(await apercu.isVisible(), 'apercu de la photo affiche')
  const poids = await p.getByText(/Photo prete/).innerText()
  console.log('  ' + poids)
  const ko_ = parseInt(poids.match(/(\d+)\s*Ko/)?.[1] ?? '0', 10)
  ok(ko_ > 0 && ko_ < 400, 'photo compressee sous 400 Ko', poids)
  ok(moOrigine * 1024 / ko_ > 5, 'reduction d au moins 5x', `${(moOrigine*1024/ko_).toFixed(0)}x`)

  const dims = await apercu.evaluate((e) => ({ w: e.naturalWidth, h: e.naturalHeight }))
  console.log(`  dimensions apres compression : ${dims.w}x${dims.h}`)
  ok(dims.w <= 1000 && dims.h <= 1000, 'redimensionnee sous 1000 px')
  ok(Math.abs(dims.w / dims.h - 3000 / 2250) < 0.02, 'proportions conservees')

  // Retirer la photo
  await p.getByRole('button', { name: 'Retirer' }).click()
  await p.waitForTimeout(400)
  ok(await p.getByText('Prendre ou choisir une photo').isVisible(), 'retrait de la photo fonctionne')

  // Publier AVEC photo et verifier qu'elle survit a l enregistrement
  await p.locator('input[type=file]').setInputFiles({ name: 'c.jpg', mimeType: 'image/jpeg', buffer: buf })
  await p.waitForTimeout(4000)
  await remplirFormulaire(p)
  await p.getByRole('button', { name: "Publier l'annonce" }).click()
  await p.waitForURL('**/?publiee=1', { timeout: 8000 })
  await p.waitForTimeout(1500)
  const photoEnBase = await p.evaluate(() => JSON.parse(localStorage.getItem('valopro.annonces.v1'))[0].photo)
  ok(typeof photoEnBase === 'string' && photoEnBase.startsWith('data:image/jpeg;base64,'), 'photo enregistree en JPEG')
  ok(await p.locator('article img').first().isVisible(), 'photo affichee sur la fiche')
  await p.screenshot({ path: `${S}/v-photo.png`, fullPage: true })
  ok(p.__err.length === 0, 'aucune erreur JS', p.__err.join(' | '))
  await p.context().close()
}

// =====================================================================
console.log('\n=== 2. FICHIER NON VALIDE ET TROP LOURD ===')
{
  const p = await page()
  await p.goto(BASE + '/publier', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(600)
  await p.locator('input[type=file]').setInputFiles({ name: 'devis.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 faux') })
  await p.waitForTimeout(1200)
  const msg = await p.locator('p.text-red-600').first().innerText().catch(() => '')
  ok(/image/i.test(msg), 'PDF refuse avec un message clair', msg)
  console.log('  message :', msg)

  await p.locator('input[type=file]').setInputFiles({ name: 'enorme.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(11 * 1024 * 1024, 1) })
  await p.waitForTimeout(1200)
  const msg2 = await p.locator('p.text-red-600').first().innerText().catch(() => '')
  ok(/lourde|Mo/i.test(msg2), 'fichier >10 Mo refuse', msg2)
  console.log('  message :', msg2)
  await p.context().close()
}

// =====================================================================
console.log('\n=== 3. VALIDATION CHAMP PAR CHAMP ===')
{
  const p = await page()
  await p.goto(BASE + '/publier', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(600)

  await p.getByRole('button', { name: "Publier l'annonce" }).click()
  await p.waitForTimeout(500)
  ok(await p.locator('p.text-red-600').count() === 6, 'formulaire vide : 6 erreurs',
     String(await p.locator('p.text-red-600').count()))
  ok(p.url().endsWith('/publier'), 'reste sur la page (pas d enregistrement)')

  // titre uniquement fait d espaces
  await remplirFormulaire(p, { titre: '   ', chantier: '   ' })
  await p.getByRole('button', { name: "Publier l'annonce" }).click()
  await p.waitForTimeout(500)
  const erreurs = await p.locator('p.text-red-600').allInnerTexts()
  ok(erreurs.some((e) => /titre/i.test(e)), 'titre fait uniquement d espaces refuse')
  ok(erreurs.some((e) => /chantier|entreprise/i.test(e)), 'nom de chantier vide refuse')

  // quantites invalides
  // Note : le champ est type="number", le navigateur bloque deja la saisie de lettres.
  // On teste donc ce qui peut reellement arriver : 0, negatif, et champ laisse vide.
  for (const [q, libelle] of [['0', 'quantite 0'], ['-5', 'quantite negative'], ['', 'quantite vide']]) {
    await remplirFormulaire(p, { quantite: q })
    await p.getByRole('button', { name: "Publier l'annonce" }).click()
    await p.waitForTimeout(400)
    const e = await p.locator('p.text-red-600').allInnerTexts()
    ok(e.some((x) => /quantite/i.test(x)) && p.url().endsWith('/publier'), `${libelle} refusee`)
  }

  // numero invalide
  await remplirFormulaire(p, { tel: '123' })
  await p.getByRole('button', { name: "Publier l'annonce" }).click()
  await p.waitForTimeout(400)
  ok((await p.locator('p.text-red-600').allInnerTexts()).some((e) => /numero/i.test(e)), 'numero trop court refuse')

  // l erreur disparait quand on corrige
  await p.getByPlaceholder('07 01 02 03 04').fill('07 08 09 10 11')
  await p.waitForTimeout(400)
  ok(!(await p.locator('p.text-red-600').allInnerTexts()).some((e) => /numero/i.test(e)),
     'erreur effacee des que l utilisateur corrige')

  // publication valide
  await p.getByRole('button', { name: "Publier l'annonce" }).click()
  await p.waitForURL('**/?publiee=1', { timeout: 6000 })
  ok(true, 'publication acceptee une fois tout valide')
  ok(p.__err.length === 0, 'aucune erreur JS', p.__err.join(' | '))
  await p.context().close()
}

// =====================================================================
console.log('\n=== 4. GEOLOCALISATION ===')
{
  // Position accordee : Yopougon
  const p = await page({ permissions: ['geolocation'], geolocation: { latitude: 5.345, longitude: -4.08 } })
  await p.goto(BASE + '/publier', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(600)
  await p.getByRole('button', { name: /position GPS/ }).click()
  await p.waitForTimeout(1500)
  const m = await p.locator('text=/Position enregistree/').innerText().catch(() => '')
  ok(/5\.345/.test(m) && /-4\.08/.test(m), 'position GPS captee', m)
  const zoneAuto = await p.locator('select').nth(2).inputValue()
  ok(zoneAuto === 'abidjan-yopougon', 'zone la plus proche devinee automatiquement', zoneAuto)
  console.log('  ' + m + ' -> zone ' + zoneAuto)

  await remplirFormulaire(p, { zone: null })
  await p.getByRole('button', { name: "Publier l'annonce" }).click()
  await p.waitForURL('**/?publiee=1', { timeout: 6000 })
  await p.waitForTimeout(1000)
  const a = await p.evaluate(() => JSON.parse(localStorage.getItem('valopro.annonces.v1'))[0])
  ok(Math.abs(a.lat - 5.345) < 0.001 && Math.abs(a.lng + 4.08) < 0.001, 'coordonnees GPS reelles enregistrees')
  await p.context().close()

  // Position refusee -> repli sur le centre de la zone
  const p2 = await page()
  await p2.context().setGeolocation(null)
  await p2.goto(BASE + '/publier', { waitUntil: 'domcontentloaded' })
  await p2.waitForTimeout(600)
  await p2.getByRole('button', { name: /position GPS/ }).click()
  // Le delai d'abandon defini dans l'application est de 10 s : on attend au-dela.
  const tGps = Date.now()
  await p2.waitForFunction(() => !/Localisation en cours/.test(document.body.innerText), null, { timeout: 20000 })
    .catch(() => {})
  console.log(`  message d echec apparu apres ${Math.round((Date.now() - tGps) / 1000)} s`)
  const m2 = await p2.locator('p.text-xs.text-slate-600').first().innerText().catch(() => '')
  ok(m2.length > 0 && !/Localisation en cours/.test(m2), 'message d echec affiche', m2)
  console.log('  refus :', m2)
  await remplirFormulaire(p2, { zone: 'san-pedro' })
  await p2.getByRole('button', { name: "Publier l'annonce" }).click()
  await p2.waitForURL('**/?publiee=1', { timeout: 6000 })
  await p2.waitForTimeout(1000)
  const a2 = await p2.evaluate(() => JSON.parse(localStorage.getItem('valopro.annonces.v1'))[0])
  ok(Math.abs(a2.lat - 4.7485) < 0.01 && Math.abs(a2.lng + 6.6363) < 0.01,
     'repli sur le centre de la zone : annonce toujours placee sur la carte')
  ok(await p2.locator('.valo-marqueur').count() === 1, 'marqueur present malgre le refus du GPS')
  await p2.context().close()
}

// =====================================================================
console.log('\n=== 5. SUPPRESSION ===')
{
  const p = await page()
  await seed(p, [annonceType({ titre: 'A garder' }), annonceType({ titre: 'A supprimer', materiau: 'bois' })])
  ok(await p.locator('article').count() === 2, 'deux annonces au depart')

  p.once('dialog', (d) => d.dismiss()) // annuler
  await p.locator('article').filter({ hasText: 'A supprimer' }).getByTitle('Supprimer cette annonce').click()
  await p.waitForTimeout(800)
  ok(await p.locator('article').count() === 2, 'annulation : rien n est supprime')

  p.once('dialog', (d) => d.accept()) // confirmer
  await p.locator('article').filter({ hasText: 'A supprimer' }).getByTitle('Supprimer cette annonce').click()
  await p.waitForTimeout(1000)
  ok(await p.locator('article').count() === 1, 'confirmation : annonce supprimee')
  ok(await p.locator('.valo-marqueur').count() === 1, 'marqueur retire de la carte')
  const reste = await p.evaluate(() => JSON.parse(localStorage.getItem('valopro.annonces.v1')))
  ok(reste.length === 1 && reste[0].titre === 'A garder', 'la bonne annonce a ete supprimee')
  ok(p.__err.length === 0, 'aucune erreur JS', p.__err.join(' | '))
  await p.context().close()
}

// =====================================================================
console.log('\n=== 6. DONNEES CORROMPUES DANS LE NAVIGATEUR ===')
{
  for (const [valeur, libelle] of [
    ['pas du json', 'texte invalide'],
    ['{"pas":"un tableau"}', 'objet au lieu d un tableau'],
    ['null', 'null'],
    ['[]', 'tableau vide'],
  ]) {
    const p = await page()
    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
    await p.evaluate((v) => localStorage.setItem('valopro.annonces.v1', v), valeur)
    await p.reload({ waitUntil: 'domcontentloaded' })
    await p.waitForTimeout(1500)
    const vivant = await p.locator('h1').isVisible()
    const vide = await p.getByText('Aucune annonce pour le moment').isVisible()
    ok(vivant && vide, `${libelle} : l application reste utilisable et affiche l etat vide`)
    await p.context().close()
  }
}

// =====================================================================
console.log('\n=== 7. NAVIGATION ET ADRESSES ===')
{
  const p = await page()
  await p.goto(BASE + '/publier', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(1000)
  ok(await p.locator('h1').innerText() === 'Publier une annonce', 'acces direct a /publier')

  await p.goto(BASE + '/nimporte-quoi', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(1200)
  ok(new URL(p.url()).pathname === '/', 'adresse inconnue redirigee vers l accueil', p.url())

  // le bandeau de succes ne doit pas revenir apres rechargement
  await p.goto(BASE + '/?publiee=1', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(1200)
  ok(await p.getByText('Ton annonce est publiee').isVisible(), 'bandeau de succes affiche')
  await p.getByLabel('Fermer le message').click()
  await p.waitForTimeout(500)
  ok(!(await p.getByText('Ton annonce est publiee').isVisible()), 'bandeau fermable')
  await p.reload({ waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(1200)
  ok(!(await p.getByText('Ton annonce est publiee').isVisible()), 'bandeau ne revient pas au rechargement')
  ok(p.__err.length === 0, 'aucune erreur JS', p.__err.join(' | '))
  await p.context().close()
}

// =====================================================================
console.log('\n=== 8. ERGONOMIE MOBILE ===')
{
  const p = await page()
  await seed(p, [annonceType({ description: 'x'.repeat(600), titre: 'Titre tres long '.repeat(8) })])

  // zones tactiles >= 44 px (regle d accessibilite mobile, CLAUDE.md section 2).
  // On exclut les liens d attribution Leaflet : mention legale, pas une commande.
  const auditTactile = async (contexte) => {
    const petits = await p.evaluate(() => {
      const out = []
      for (const el of document.querySelectorAll('button, a, select, textarea, input:not([type=file])')) {
        if (el.closest('.leaflet-control-attribution')) continue
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) continue
        if (r.height < 44) out.push(`${el.tagName}"${(el.textContent || '').trim().slice(0, 24)}" ${Math.round(r.height)}px`)
      }
      return out
    })
    ok(petits.length === 0, `zones tactiles >= 44 px (${contexte})`, petits.join(' | '))
  }
  await auditTactile('liste')
  // Le bouton de reinitialisation et le bandeau de succes n apparaissent que
  // sous condition : on les fait apparaitre pour les auditer aussi.
  await p.locator('select').first().selectOption('gravats')
  await p.waitForTimeout(800)
  await auditTactile('avec bouton de reinitialisation')
  await p.goto(BASE + '/?publiee=1', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(1200)
  await auditTactile('avec bandeau de succes')
  await p.goto(BASE + '/publier', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(900)
  await auditTactile('formulaire')
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(1200)

  // pas de debordement horizontal
  for (const w of [320, 360, 390, 768]) {
    await p.setViewportSize({ width: w, height: 800 })
    await p.waitForTimeout(600)
    const deborde = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
    ok(!deborde, `aucun debordement horizontal a ${w} px`)
  }
  await p.setViewportSize({ width: 390, height: 844 })
  await p.waitForTimeout(500)
  ok(await p.locator('article p.line-clamp-3').count() === 1, 'description longue tronquee proprement')
  await p.screenshot({ path: `${S}/v-texte-long.png`, fullPage: true })

  // etiquettes de formulaire correctement reliees
  await p.goto(BASE + '/publier', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(700)
  const sansLabel = await p.evaluate(() => {
    const out = []
    for (const c of document.querySelectorAll('input:not([type=file]), select, textarea')) {
      const parLabel = c.id && document.querySelector(`label[for="${c.id}"]`)
      const englobe = c.closest('label')
      const voisin = c.parentElement?.querySelector('label')
      if (!parLabel && !englobe && !voisin && !c.getAttribute('aria-label')) out.push(c.tagName + (c.placeholder || ''))
    }
    return out
  })
  ok(sansLabel.length === 0, 'chaque champ a une etiquette', sansLabel.join(' | '))
  ok(await p.locator('input[inputmode=decimal]').count() === 1, 'clavier numerique pour la quantite')
  ok(await p.locator('input[inputmode=tel]').count() === 1, 'clavier telephone pour le numero')
  ok(await p.locator('input[type=file][capture]').count() === 1, 'appareil photo ouvert directement')
  await p.context().close()
}

// =====================================================================
console.log('\n=== 9. VOLUME : 60 ANNONCES ===')
{
  const p = await page()
  const beaucoup = []
  const mats = ['gravats', 'beton', 'bois', 'ferraille', 'terre', 'carrelage', 'plastique', 'melange']
  const zs = ['abidjan-cocody', 'abidjan-yopougon', 'san-pedro', 'bouake', 'korhogo', 'man']
  for (let i = 0; i < 60; i++) {
    beaucoup.push(annonceType({
      titre: `Lot numero ${i}`, materiau: mats[i % 8], zone: zs[i % 6],
      lat: 4.5 + Math.random() * 5, lng: -8 + Math.random() * 5,
      creeLe: new Date(Date.now() - i * 3600e3).toISOString(),
    }))
  }
  const t0 = Date.now()
  await seed(p, beaucoup)
  const dureeAffichage = Date.now() - t0
  ok(await p.locator('article').count() === 60, '60 fiches affichees')
  ok(await p.locator('.valo-marqueur').count() === 60, '60 marqueurs sur la carte')
  console.log(`  affichage complet en ${dureeAffichage} ms`)

  const t1 = Date.now()
  await p.locator('select').first().selectOption('bois')
  await p.waitForTimeout(100)
  await p.waitForFunction(() => document.querySelectorAll('article').length < 60, null, { timeout: 5000 })
  const dureeFiltre = Date.now() - t1
  ok(dureeFiltre < 2000, `filtrage sous 2 s (${dureeFiltre} ms)`)
  console.log(`  filtrage en ${dureeFiltre} ms -> ${await p.locator('article').count()} fiches`)

  // tri du plus recent au plus ancien
  await p.locator('select').first().selectOption('')
  await p.waitForTimeout(900)
  const titres = await p.locator('article h3').allInnerTexts()
  ok(titres[0] === 'Lot numero 0' && titres[titres.length - 1] === 'Lot numero 59',
     'annonces triees de la plus recente a la plus ancienne', `${titres[0]} ... ${titres.at(-1)}`)
  ok(p.__err.length === 0, 'aucune erreur JS', p.__err.join(' | '))
  await p.context().close()
}

// =====================================================================
console.log('\n=== 10. STOCKAGE SATURE ===')
{
  const p = await page()
  await p.goto(BASE + '/publier', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(800)

  // Une vraie photo de chantier, compressee comme le fait l'application.
  const b64 = await p.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 2400; c.height = 1800
    const x = c.getContext('2d'); const img = x.createImageData(c.width, c.height)
    for (let i = 0; i < img.data.length; i += 4) {
      img.data[i] = Math.random()*255; img.data[i+1] = Math.random()*255
      img.data[i+2] = Math.random()*255; img.data[i+3] = 255
    }
    x.putImageData(img, 0, 0)
    return c.toDataURL('image/jpeg', 0.95).split(',')[1]
  })
  const buf = Buffer.from(b64, 'base64')

  // On sature le stockage en laissant juste un peu de place : moins qu'une photo.
  const restant = await p.evaluate(() => {
    // On remplit jusqu'au refus, par blocs de plus en plus fins, pour ne
    // laisser aucune place : c'est l'etat d'un telephone dont le stockage
    // ValoPro est reellement sature de photos.
    let i = 0
    for (const taille of [256, 32, 4, 1]) {
      const bloc = 'x'.repeat(taille * 1024)
      try { for (let j = 0; j < 400; j++, i++) localStorage.setItem(`bourrage${taille}_${j}`, bloc) } catch {}
    }
    return i
  })
  console.log(`  stockage sature (${restant} blocs ecrits, plus aucune place)`)

  await p.locator('input[type=file]').setInputFiles({ name: 'lot.jpg', mimeType: 'image/jpeg', buffer: buf })
  await p.waitForTimeout(4000)
  ok(await p.locator('img[alt="Apercu du lot"]').isVisible(), 'photo preparee malgre le stockage plein')
  await remplirFormulaire(p)
  await p.getByRole('button', { name: "Publier l'annonce" }).click()
  await p.waitForTimeout(2500)

  if (p.url().includes('/publier')) {
    const msg = (await p.locator('.bg-red-50').innerText().catch(() => '')).replace(/\s+/g, ' ').trim()
    ok(/plein|espace|supprime/i.test(msg), 'message clair et en francais quand le stockage est plein', msg)
    console.log('  message :', msg)
    ok(await p.getByRole('button', { name: "Publier l'annonce" }).isEnabled(),
       'le bouton redevient actif : l utilisateur peut retirer la photo et reessayer')
    // Il doit pouvoir s en sortir : liberer de la place puis republier.
    await p.evaluate(() => { for (let j = 0; j < 3; j++) localStorage.removeItem(`bourrage256_${j}`) })
    await p.getByRole('button', { name: "Publier l'annonce" }).click()
    await p.waitForTimeout(2500)
    ok(p.url().includes('publiee=1'), 'republication reussie une fois de la place liberee')
  } else {
    ok(false, 'le stockage plein n a PAS ete detecte : publication passee alors qu elle aurait du echouer')
  }
  ok(p.__err.length === 0, 'aucune erreur JS', p.__err.join(' | '))
  await p.context().close()
}

// =====================================================================
console.log('\n=== 11. PARCOURS COMPLET RECYCLEUR ===')
{
  const p = await page()
  await seed(p, [
    annonceType({ titre: 'Ferraille Riviera 3', materiau: 'ferraille', zone: 'abidjan-cocody', lat: 5.36, lng: -3.99, telephone: '2250708091011', nomChantier: 'SOGEBAT CI' }),
    annonceType({ titre: 'Bois port San-Pedro', materiau: 'bois', zone: 'san-pedro', lat: 4.7485, lng: -6.6363, quantite: 40, unite: 'm3', nomChantier: 'Groupe Traore', creeLe: new Date(Date.now() - 7200e3).toISOString() }),
  ])
  ok(await p.locator('article').count() === 2, 'liste chargee')

  // enchainement de filtres, y compris le passage par zero resultat
  const f = p.locator('select')
  const etats = []
  const mesure = async (l) => {
    const box = await p.locator('.leaflet-container').boundingBox()
    const n = await p.locator('.valo-marqueur').count()
    let dedans = 0
    for (let i = 0; i < n; i++) {
      const bb = await p.locator('.valo-marqueur').nth(i).boundingBox()
      if (bb && bb.x >= box.x && bb.x + bb.width <= box.x + box.width && bb.y >= box.y && bb.y + bb.height <= box.y + box.height) dedans++
    }
    etats.push(`${l}: ${dedans}/${n} dans le cadre`)
    return dedans === n
  }
  let tout = await mesure('depart')
  await f.first().selectOption('bois'); await p.waitForTimeout(1000); tout = (await mesure('bois')) && tout
  await f.first().selectOption(''); await f.nth(1).selectOption('abidjan-cocody'); await p.waitForTimeout(1000); tout = (await mesure('Cocody')) && tout
  await f.first().selectOption('bois'); await p.waitForTimeout(1000); tout = (await mesure('bois+Cocody')) && tout
  await p.getByRole('button', { name: 'Reinitialiser les filtres' }).click(); await p.waitForTimeout(1500)
  tout = (await mesure('reinitialise')) && tout
  console.log('  ' + etats.join('\n  '))
  ok(tout, 'aucun marqueur ne sort du cadre de la carte, a aucune etape')

  // popup + lien whatsapp
  await p.locator('.leaflet-container').scrollIntoViewIfNeeded()
  await p.waitForTimeout(1200)
  await p.locator('.valo-marqueur').first().click()
  await p.waitForTimeout(800)
  ok(await p.locator('.leaflet-popup').isVisible(), 'popup ouverte au clic sur un marqueur')
  ok(await p.locator('.leaflet-popup').getByRole('link', { name: 'Contacter' }).isVisible(), 'bouton Contacter dans la popup')

  const liens = await p.getByRole('link', { name: 'Contacter' }).all()
  let liensOk = true
  for (const l of liens) {
    const h = await l.getAttribute('href')
    if (!/^https:\/\/wa\.me\/225\d{10}\?text=.+/.test(h)) { liensOk = false; console.log('  lien suspect :', h?.slice(0, 60)) }
    if (await l.getAttribute('target') !== '_blank') liensOk = false
    if (!(await l.getAttribute('rel'))?.includes('noopener')) liensOk = false
  }
  ok(liensOk, `les ${liens.length} liens WhatsApp sont bien formes et securises`)
  await p.screenshot({ path: `${S}/v-parcours.png`, fullPage: true })
  ok(p.__err.length === 0, 'aucune erreur JS', p.__err.join(' | '))
  await p.context().close()
}

console.log('\n##########################################################')
console.log(ko === 0 ? '  RESULTAT : TOUTES LES VERIFICATIONS PASSENT' : `  RESULTAT : ${ko} ECHEC(S)`)
console.log('##########################################################')
await nav.close()
process.exit(ko ? 1 : 0)
