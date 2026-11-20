import { strings } from '../strings';

/** Short texts: "Where is my data?" and "About". */
export function InfoText({ which }: { which: 'data' | 'about' }) {
  const info = which === 'data' ? strings.dataInfo : strings.aboutInfo;
  return (
    <div class="stack">
      {info.paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
      {which === 'about' && <p class="muted">{strings.aboutInfo.version(__APP_VERSION__)}</p>}
    </div>
  );
}
