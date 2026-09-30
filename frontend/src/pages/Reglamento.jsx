import { Link } from 'react-router-dom'
import { PageHero } from './Registry.jsx'
import { Img } from '../components/ui.jsx'
import { CONTACT, SERVICES, STAR_LEVELS, eur } from '../data/content.js'

export default function Reglamento() {
  return (
    <>
      <PageHero eyebrow="Reglamento interno del certificado" title="Reglamento C-IBERICO">
        Normas internas del Certificado de Origen y del Certificado de Calidad C-IBERICO, gestión privada no asociativa.
        Este resumen sustituye a cualquier redacción anterior: el alcance actual son PRE, PSL y sus cruces.
      </PageHero>
      <section className="section">
        <div className="wrap" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 380px', gap: 56, alignItems: 'start' }} id="reglamento-grid">
          <div className="acc">
            <details open>
              <summary>Objeto y naturaleza del certificado</summary>
              <div className="acc-body">
                <p>C-IBERICO es una gestión privada, de carácter no asociativo, que expide el Certificado de Origen y el Certificado de Calidad del caballo ibérico deportivo.</p>
                <p>Es un <strong>certificado privado</strong>, comparable a un certificado SSL en internet: acredita lo que certifica con un número único y una verificación pública, pero <strong>no está avalado por ningún organismo público</strong> ni sustituye a los libros genealógicos oficiales de ANCCE, APSL u otras entidades. Los complementa aportando una valoración morfo-deportiva contrastable.</p>
                <p>La finalidad es reconocer y promocionar al caballo ibérico como caballo de deporte, tomando como referencia el reglamento de doma clásica y los sistemas de selección centroeuropeos.</p>
              </div>
            </details>
            <details>
              <summary>Razas admitidas y cruces</summary>
              <div className="acc-body">
                <p>Las razas de referencia son <strong>PRE</strong> (Pura Raza Española) y <strong>PSL</strong> (Puro Sangre Lusitano). Se admiten los cruces entre ambas y los cruces ibéricos con aportes externos.</p>
                <ul>
                  <li>Se exige un mínimo del 10 % de sangre ibérica documentada.</li>
                  <li>El aporte de sangre exterior no puede superar el 90 %.</li>
                  <li>Queda prohibido el cruce con razas de tipo poni.</li>
                  <li>La ascendencia se acredita con registro de ANCCE, APSL, DIE o pasaporte, pruebas de ADN u otro aval documental admitido por la presidencia. C-IBERICO no realiza pruebas genéticas: certifica sobre la documentación aportada.</li>
                </ul>
              </div>
            </details>
            <details>
              <summary>Estructura del registro</summary>
              <div className="acc-body">
                <p>Existe un único registro digital organizado en secciones: potros de 0 a 3 años, caballos y yeguas de 3 años en adelante, y las secciones de mérito de tres, seis, doce y veinticuatro estrellas, más la Lista Laureada Ámbar.</p>
                <p>Cada ejemplar recibe un número de registro único (CIB-xxxxx) al expedirse su Certificado de Origen, y cada certificado un código de verificación propio. La ficha es pública salvo solicitud expresa del titular.</p>
              </div>
            </details>
            <details>
              <summary>Valoración morfo-deportiva</summary>
              <div className="acc-body">
                <p>La valoración se realiza sobre cinco fotografías reglamentarias (lateral izquierdo, lateral derecho, frontal, trasera y tronco desde arriba) y un vídeo en los tres aires de duración máxima de un minuto: montado desde los 3 años, y a la mano o en libertad en ejemplares más jóvenes.</p>
                <p>Se puntúan nueve bloques de 0 a 10: cabeza y cuello, tronco y dorso, grupa, aplomos y extremidades, paso, trote, galope, reunión y giros, y aptitud para ser montado. El movimiento y la aptitud deportiva pesan por encima del volumen barroco.</p>
                <p><strong>Vara de medir:</strong> el movimiento se valora con el estándar de las pruebas de caballos jóvenes y de selección centroeuropeas; la conformación, por su función en el caballo de deporte, sin penalizar los rasgos de tipo PRE o PSL que no limiten el movimiento. El movimiento pesa el 80 % de la nota. Es un criterio propio de C-IBERICO, inspirado en esos sistemas de selección y sin vínculo con ninguno de ellos.</p>
                <p>La inteligencia artificial elabora una propuesta con su evidencia y su nivel de confianza; <strong>la nota la resuelve siempre un evaluador humano</strong>. Los pesos de cada bloque se encuentran en fase experimental de validación.</p>
                <p>Pueden valorarse ejemplares desde los 6 meses. La exigencia se calibra por etapas (potro, añojo, 2, 3, 4, 5 y 6 años o más); la aptitud para ser montado solo se evalúa desde los 3 años.</p>
              </div>
            </details>
            <details>
              <summary>Niveles de calidad</summary>
              <div className="acc-body">
                <p>El resultado de la valoración se expresa en un nivel de calidad del I al V, independiente de la edad. Cada etapa tiene un nivel máximo: II para potros y añojos, III a los 2 y 3 años, IV a los 4 y 5 años y V a partir de los 6.</p>
                <ul>
                  <li>En cada cambio de etapa el ejemplar puede volver a presentarse. Si mejora, sube de nivel; si no, conserva el que tenía.</li>
                  <li>El nivel nunca baja por una nueva valoración.</li>
                  <li>La presidencia puede subir el nivel por méritos deportivos acreditados con documentación oficial. Todo cambio queda registrado con su motivo.</li>
                  <li>La presidencia puede revisar el nivel si se acredita falsedad en la documentación aportada.</li>
                </ul>
              </div>
            </details>
            <details>
              <summary>Sistema de estrellas</summary>
              <div className="acc-body">
                <p>Las estrellas reconocen mérito deportivo contrastado con documentación oficial del organismo competente. Un ejemplar puede obtener cualquiera de los niveles sin haber obtenido el anterior, y las estrellas no se acumulan entre niveles: prevalece el nivel más alto conseguido.</p>
                {STAR_LEVELS.map((s) => (
                  <div key={s.n} style={{ borderLeft: '3px solid var(--gold)', paddingLeft: 16 }}>
                    <strong>{s.name} — {s.level}</strong>
                    <div>{s.desc}</div>
                  </div>
                ))}
                <p>Cada ejemplar que alcanza veinticuatro estrellas concede una estrella ámbar a todos sus ascendientes. Con tres estrellas ámbar se accede a la Lista Laureada.</p>
              </div>
            </details>
            <details>
              <summary>Obligaciones del titular</summary>
              <div className="acc-body">
                <ul>
                  <li>Notificación previa y obligatoria de transferencia de embriones y de inseminación con semen refrigerado o congelado.</li>
                  <li>Declaración obligatoria de defectos genéticos conocidos: criptorquidia, monorquidia, enanismo, cuello caído, WFFS, defectos de aplomos y grupa desequilibrada, entre otros.</li>
                  <li>Veracidad de la documentación aportada. La falsedad documental supone la baja del ejemplar y la anulación de los certificados expedidos.</li>
                  <li>Abono previo de la tarifa: no se inicia ningún trámite sin el pago del servicio solicitado.</li>
                </ul>
              </div>
            </details>
            <details>
              <summary>Tarifas de los servicios</summary>
              <div className="acc-body">
                {SERVICES.map((s) => (
                  <div key={s.code} className="row between" style={{ padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
                    <div><strong>{s.name}</strong><div className="small">Plazo: {s.days} días hábiles</div></div>
                    <strong style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', color: 'var(--gold-deep)' }}>{eur(s.price)}</strong>
                  </div>
                ))}
              </div>
            </details>
            <details>
              <summary>Alcance y limitaciones</summary>
              <div className="acc-body">
                <ul>
                  <li>El certificado expresa la valoración de C-IBERICO sobre el ejemplar en la fecha de expedición. No constituye un acto administrativo ni una inscripción en un libro genealógico oficial.</li>
                  <li>La valoración no determina identidad, pureza racial, estado de salud, temperamento, valor reproductivo ni rendimiento futuro del ejemplar.</li>
                  <li>C-IBERICO puede revocar un certificado si se acredita falsedad en la documentación. La revocación queda reflejada en la verificación pública.</li>
                </ul>
              </div>
            </details>
          </div>

          <aside className="stack">
            <div className="card">
              <span className="icon-dot">⛨</span>
              <h3>Presidencia</h3>
              <p className="mt16">{CONTACT.place}</p>
              <p className="mt8"><a className="link" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></p>
              <p className="mt8"><a className="link" href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}>{CONTACT.phone}</a></p>
            </div>
            <div className="card center">
              <div className="seal" style={{ width: 120, height: 120, margin: '0 auto' }}><Img src="/images/sello.png" alt="Sello C-IBERICO" label="Sello" /></div>
              <p className="small muted mt16">Todo certificado expedido lleva número de registro único y código de verificación público en esta web.</p>
              <Link to="/verificar" className="link small mt8" style={{ display: 'inline-block' }}>Verificar un certificado →</Link>
            </div>
            <Link to="/gestiones" className="btn btn-gold btn-block">Iniciar una gestión</Link>
          </aside>
        </div>
      </section>
      <style>{'@media (max-width: 960px){ #reglamento-grid{ grid-template-columns: 1fr !important; } }'}</style>
    </>
  )
}
