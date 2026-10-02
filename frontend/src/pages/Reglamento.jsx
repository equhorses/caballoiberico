import { Link } from 'react-router-dom'
import { PageHero } from './Registry.jsx'
import { Img } from '../components/ui.jsx'
import { CONTACT, SERVICES, eur, plazo, MERIT_FLOOR, STARS_TXT } from '../data/content.js'

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
                <p>Se admiten <strong>PRE</strong> (Pura Raza Española), <strong>PSL</strong> (Pura Sangre Lusitano) y <strong>sus cruces</strong>: cruces PRE × PSL y los hijos de caballos ya registrados en C-IBERICO.</p>
                <p>Una de las razones de ser de C-IBERICO son los cruces entre español y lusitano, que no inscribe ninguna de las dos asociaciones. Se admiten siempre que su procedencia esté controlada.</p>
                <ul>
                  <li><strong>Identificación:</strong> el microchip es obligatorio para todos los ejemplares.</li>
                  <li><strong>PRE y PSL:</strong> se aporta su número y documento del libro oficial (ANCCE, APSL u otro libro reconocido de la raza).</li>
                  <li><strong>Cruces:</strong> el ejemplar puede no estar inscrito en ninguna asociación, pero su padre y su madre deben estarlo (ANCCE, APSL o C-IBERICO). Se aportan sus documentos y, si la presidencia lo considera necesario, una prueba de parentesco por ADN.</li>
                  <li><strong>Descendencia:</strong> los hijos de ejemplares registrados en C-IBERICO se inscriben con la genealogía ya comprobada.</li>
                  <li>El Certificado de Origen solo se expide cuando la presidencia ha acreditado la procedencia. Hasta entonces la ficha la muestra como «pendiente de acreditar».</li>
                  <li>C-IBERICO no realiza pruebas genéticas: certifica sobre la documentación aportada.</li>
                  <li>El nivel de calidad no depende de la raza: un cruce puede alcanzar el nivel V.</li>
                </ul>
              </div>
            </details>
            <details>
              <summary>Los dos certificados: Origen y Calidad</summary>
              <div className="acc-body">
                <p><strong>1. Certificado de Origen.</strong> Es el primero y se expide a ejemplares de cualquier edad. Acredita la identidad del caballo (microchip) y su procedencia, una vez comprobada por la presidencia, y le asigna su número de registro CIB. Es único y no caduca.</p>
                <p><strong>2. Certificado de Calidad.</strong> Requiere el Certificado de Origen y una valoración morfo-deportiva resuelta, desde los 6 meses de edad. Expresa la <strong>calidad de 1 a 5 estrellas</strong> según su edad, e incluye los resultados deportivos verificados.</p>
                <p>El Certificado de Calidad es único y vivo: no se expide uno nuevo cada vez, sino que se actualiza cuando el ejemplar sube de estrellas, ya sea por una nueva valoración o por resultados deportivos. La verificación pública y el código QR muestran siempre las estrellas vigentes.</p>
                <p>El Certificado de Calidad expresa la calidad en estrellas, de 1 a 5, e incluye los resultados deportivos verificados.</p>
              </div>
            </details>
            <details>
              <summary>Estructura del registro</summary>
              <div className="acc-body">
                <p>Existe un único registro digital. Cada ejemplar tiene su ficha con su procedencia, su nivel de calidad, sus resultados deportivos y, en su caso, su inclusión en la Lista Laureada Ámbar.</p>
                <p>Cada ejemplar recibe un número de registro único (CIB-xxxxx) al expedirse su Certificado de Origen, y cada certificado un código de verificación propio. La ficha es pública salvo solicitud expresa del titular.</p>
              </div>
            </details>
            <details>
              <summary>Valoración morfo-deportiva</summary>
              <div className="acc-body">
                <p>La valoración se realiza sobre cinco fotografías reglamentarias (lateral izquierdo, lateral derecho, frontal, trasera y tronco desde arriba) y un vídeo en los tres aires de duración máxima de un minuto: montado desde los 3 años, y a la mano o en libertad en ejemplares más jóvenes.</p>
                <p>Se puntúan nueve bloques de 0 a 10: cabeza y cuello, tronco y dorso, grupa, aplomos y extremidades, paso, trote, galope, ejercicios, y aptitud para ser montado según su edad y etapa de doma. El movimiento y la aptitud deportiva pesan por encima del volumen barroco.</p>
                <p><strong>Vara de medir:</strong> el movimiento se valora con el estándar de las pruebas de caballos jóvenes y de selección centroeuropeas; la conformación, por su función en el caballo de deporte, sin penalizar los rasgos de tipo PRE o PSL que no limiten el movimiento. El movimiento pesa el 80 % de la nota. Es un criterio propio de C-IBERICO, inspirado en esos sistemas de selección y sin vínculo con ninguno de ellos.</p>
                <p><strong>La valoración la realiza la inteligencia artificial</strong>, con la misma rúbrica para todos los ejemplares y citando su evidencia. Cuando trabajan dos IAs, se toma la media. La secretaría de C-IBERICO se limita a comprobar que el material corresponde al ejemplar y es válido, y acepta el resultado: no modifica las notas. Si el material no permite valorar, se pide uno nuevo. Los pesos de cada bloque se encuentran en fase experimental de validación.</p>
                <p><strong>Textos de referencia de la IA:</strong> reglamento FEI de doma clásica y criterios FEI de caballos jóvenes (definición de los aires, escala de notas y notas máximas por faltas), objetivos de cría de los studbooks de deporte centroeuropeos y prototipos raciales oficiales del PRE y del PSL, para respetar el tipo ibérico. C-IBERICO no tiene vínculo con ninguna de estas entidades.</p>
                <p>Pueden valorarse ejemplares desde los 6 meses. La exigencia se calibra por etapas (potro, añojo, 2, 3, 4, 5 y 6 años o más); la aptitud para ser montado solo se evalúa desde los 3 años.</p>
              </div>
            </details>
            <details>
              <summary>Calidad: de 1 a 5 estrellas</summary>
              <div className="acc-body">
                <p>El resultado de la valoración se expresa en estrellas de calidad, de 1 a 5, según la nota obtenida (1 desde 50/100, 2 desde 60, 3 desde 70, 4 desde 80 y 5 desde 90). La exigencia se ajusta a la edad: a cada caballo se le pide lo que corresponde a sus años, y desde los 8 la exigencia es completa.</p>
                <ul>
                  <li>Se puede presentar por primera vez a cualquier edad, sin haber pasado por las anteriores, y volver a presentarse cada año. Cuenta siempre la última valoración: si mejora, sube; si empeora, baja. Las anteriores quedan en su historial.</li>
                  <li><strong>Menos de 50/100: sin estrellas.</strong> El caballo no obtiene el Certificado de Calidad (y si lo tenía, se retira, salvo que sus resultados deportivos le aseguren estrellas). La tarifa corresponde a la valoración realizada y no se devuelve; por eso recomendamos la pre-valoración gratuita antes de pedirla.</li>
                  <li>Cada valoración queda en el historial con la edad del caballo (por ejemplo, «4 años · 3 estrellas»).</li>
                  <li><strong>Resultados deportivos:</strong> un resultado verificado con documento oficial asegura unas estrellas mínimas: {MERIT_FLOOR.map((m) => `${m.result} → ${STARS_TXT[m.level]}`).join('; ')}. El caballo se queda con lo más alto entre su valoración y sus resultados.</li>
                  <li>La presidencia puede revisar las estrellas por otros méritos acreditados o si se acredita falsedad en la documentación. Todo cambio queda registrado con su motivo.</li>
                </ul>
              </div>
            </details>
            <details>
              <summary>Lista Laureada</summary>
              <div className="acc-body">
                <p>Es el máximo reconocimiento de C-IBERICO y es independiente de las estrellas. La concede la presidencia, a solicitud del titular o por iniciativa propia, a los ejemplares que han marcado la diferencia en competición o como reproductores.</p>
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
                    <div><strong>{s.name}</strong><div className="small">Plazo: {plazo(s.days)}</div></div>
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
