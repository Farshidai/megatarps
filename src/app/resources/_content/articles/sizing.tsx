import type { Article } from '../types'
import { H2, P, UL, OL, A, Table, Callout } from '../prose'
import { STANDARD_SIZES, finishedFt, formatFtIn, FINISHED_RATIO } from '../../_lib/tarp-sizes'

const shrinkPct = Math.round((1 - FINISHED_RATIO) * 100)
const tableSizes: Array<[number, number]> = [[10, 12], [12, 16], [16, 20], [20, 20], [20, 30], [20, 40], [30, 40], [30, 50], [40, 60]]

export const sizing: Article = {
  slug: 'how-to-size-a-tarp',
  title: 'How to Size a Tarp (With Overhang and Tie-Down Allowance)',
  shortTitle: 'How to size a tarp',
  metaTitle: 'How to Size a Tarp with Overhang',
  description:
    'A simple formula for sizing a tarp: measure, add the height on each side plus overhang and tie-down, then allow for finished size running smaller than the label.',
  excerpt:
    'Most tarps that fail were bought too small. Use this formula to size a tarp for a flat area, a stacked load or a building, and learn why a 20×30 tarp is not really 20 by 30 feet.',
  topic: 'Sizing',
  published: '2026-10-25',
  updated: '2026-10-25',
  readingMinutes: 6,
  toc: [
    { id: 'formula', label: 'The sizing formula' },
    { id: 'finished-size', label: 'Nominal vs finished size' },
    { id: 'examples', label: 'Worked examples' },
    { id: 'allowance', label: 'How much allowance to add' },
    { id: 'mistakes', label: 'Common sizing mistakes' },
  ],
  shop: [
    { label: 'Tarp size calculator', href: '/resources/tarp-size-calculator', note: 'Get a recommended size in seconds' },
    { label: 'All tarps', href: '/products' },
    { label: 'Construction tarps', href: '/products?job=construction' },
    { label: 'Agriculture tarps', href: '/products?job=agriculture' },
  ],
  related: ['tarp-mil-thickness-explained', 'roofing-tarp-for-storm-damage', 'poly-vs-canvas-vs-vinyl-tarps'],
  body: () => (
    <>
      <P>
        Ordering the wrong size is the most expensive tarp mistake because you usually find out on site, in the wind,
        with no spare. A tarp that only just covers the load leaves nothing to tie down, so the edges flap and the
        grommets tear out. Sizing takes two minutes if you follow a simple formula.
      </P>

      <H2 id="formula">The sizing formula</H2>
      <P>Measure the footprint of the area or object, then add material for everything the tarp has to wrap over and hang past:</P>
      <div className="my-6 rounded-xl bg-slate-900 text-white p-5 font-mono text-sm leading-relaxed">
        Required width = width + (2 &times; height) + (2 &times; allowance)
        <br />
        Required length = length + (2 &times; height) + (2 &times; allowance)
      </div>
      <UL>
        <li><strong>Width and length:</strong> the footprint, measured at the widest points.</li>
        <li><strong>Height:</strong> how tall the object is. The tarp drapes down both sides, so it counts twice. Use 0 for flat ground or a slab.</li>
        <li><strong>Allowance:</strong> the extra you want past the edge on every side, for overhang, ground contact and tie-down.</li>
      </UL>
      <P>
        Then pick the smallest standard size whose <em>finished</em> dimensions are at least the required width and
        length.
      </P>

      <H2 id="finished-size">Nominal vs finished size</H2>
      <P>
        Tarps are labeled with their nominal or &quot;cut&quot; size: the size of the material before the edges are
        folded and hemmed around a rope and the grommets are set. The finished tarp is typically about 3–5% smaller in
        each direction. We use {shrinkPct}% as a planning figure, so a 20&times;30 finishes at roughly{' '}
        {formatFtIn(finishedFt(20))} &times; {formatFtIn(finishedFt(30))}. Check the product spec when it matters.
      </P>
      <Table
        caption="Nominal size versus approximate finished size"
        head={['Nominal (ft)', 'Approx. finished', 'Coverage (sq ft, finished)']}
        rows={tableSizes.map(([w, l]) => [
          `${w} × ${l}`,
          `${formatFtIn(finishedFt(w))} × ${formatFtIn(finishedFt(l))}`,
          Math.round(finishedFt(w) * finishedFt(l)).toLocaleString('en-US'),
        ])}
      />
      <Callout title="Why this matters">
        If you need exactly 20 ft of coverage, a 20-ft tarp will come up short. Size up to the next standard width.
      </Callout>

      <H2 id="examples">Worked examples</H2>
      <P>
        <strong>1. Lumber stack, 8 ft wide &times; 16 ft long &times; 4 ft high, with 1 ft to tie down.</strong>
        <br />
        Width: 8 + (2 &times; 4) + (2 &times; 1) = 18 ft. Length: 16 + 8 + 2 = 26 ft. An 18&times;24 finishes around{' '}
        {formatFtIn(finishedFt(18))} &times; {formatFtIn(finishedFt(24))}, which is too small. A 20&times;30 (about{' '}
        {formatFtIn(finishedFt(20))} &times; {formatFtIn(finishedFt(30))}) covers it with a little margin.
      </P>
      <P>
        <strong>2. Concrete slab, 20 &times; 30 ft, 2 ft past each edge.</strong>
        <br />
        Width: 20 + 0 + 4 = 24 ft. Length: 30 + 0 + 4 = 34 ft. A 24&times;36 finishes just under 24 ft wide, so the
        right pick is a 25&times;40, or a 30&times;40 if you want extra lap at the edges.
      </P>
      <P>
        <strong>3. Round hay bales in a row, 6 ft diameter, 5 bales.</strong>
        <br />
        Treat it as a box: about 6 ft wide, 30 ft long, 6 ft high. Width: 6 + 12 + 2 = 20 ft; length: 30 + 12 + 2 = 44
        ft. That calls for a 30&times;50, or two overlapping tarps. For bales, you often stop the tarp a foot above the
        ground so air can circulate, which lowers the height allowance.
      </P>
      <P>
        Skip the arithmetic with the <A href="/resources/tarp-size-calculator">tarp size calculator</A>, which applies
        the same formula to {STANDARD_SIZES.length} standard sizes.
      </P>

      <H2 id="allowance">How much allowance to add</H2>
      <UL>
        <li><strong>Indoor dust cover:</strong> 0.5–1 ft. Nothing is pulling on it.</li>
        <li><strong>Ground cover or slab:</strong> 1–2 ft so the edges can be weighted or staked.</li>
        <li><strong>Loads and stacks outdoors:</strong> 1–2 ft past the bottom so ropes or bungees can reach anchor points.</li>
        <li><strong>Roofs:</strong> 3–4 ft past the damage, plus carrying it over the ridge. See <A href="/resources/roofing-tarp-for-storm-damage">roof tarp sizing</A>.</li>
        <li><strong>Batten-board edges:</strong> about 1 ft extra on each edge you will roll around a 2&times;4.</li>
      </UL>

      <H2 id="mistakes">Common sizing mistakes</H2>
      <OL>
        <li>Forgetting the height counts twice, once for each side.</li>
        <li>Sizing to the nominal label instead of the finished size.</li>
        <li>Leaving no tie-down margin, so straps pull directly on the top corners.</li>
        <li>Buying one huge tarp a crew cannot handle in wind. Two overlapping tarps are often safer to install.</li>
        <li>Ordering every job&apos;s size separately. Standardize on a few sizes and buy them by the case.</li>
      </OL>
      <P>
        Once you know the size, choose the weight with <A href="/resources/tarp-mil-thickness-explained">our mil
        thickness guide</A> and browse <A href="/products">all tarps</A>.
      </P>
    </>
  ),
}
