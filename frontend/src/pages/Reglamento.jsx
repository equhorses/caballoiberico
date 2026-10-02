import { Link } from 'react-router-dom'
import { PageHero } from './Registry.jsx'
import { Img } from '../components/ui.jsx'
import { CONTACT, SERVICES, STAR_LEVELS, eur, plazo, MERIT_FLOOR, ROMAN } from '../data/content.js'

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
                <p><strong>2. Certificado de Calidad.</strong> Requiere el Certificado de Origen y una valoración morfo-deportiva resuelta, desde los 6 meses de edad. Expresa el <strong>nivel de calidad del I al V</strong> alcanzado según la etapa de edad, e incluye los resultados deportivos verificados.</p>
                <p>El Certificado de Calidad es único y vivo: no se expide uno nuevo cada vez, sino que se actualiza cuando el ejemplar sube de nivel, ya sea por una nueva valoración en otra etapa o por méritos deportivos. La verificación pública y el código QR muestran siempre el nivel vigente.</p>
                <p>Las estrellas no forman parte del Certificado de Calidad: reconocen los méritos deportivos.</p>
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
              <summary>Niveles de calidad</summary>
              <div className="acc-body">
                <p>El resultado de la valoración se expresa en un nivel de calidad del I al V, independiente de la edad. Cada etapa tiene un nivel máximo: II para potros y añojos, III a los 2 y 3 años, IV a los 4 y 5 años y V a partir de los 6.</p>
                <ul>
                  <li>Se puede presentar por primera vez en cualquier etapa, sin haber pasado por las anteriores. Después, en cada cambio de etapa puede volver a presentarse. Si mejora, sube de nivel; si no, conserva el que tenía.</li>
                  <li>El nivel nunca baja por una nueva valoración.</li>
                  <li><strong>Suelo por méritos:</strong> un resultado deportivo verificado garantiza un nivel mínimo, aunque la valoración haya dado menos y sin el tope de la etapa: {MERIT_FLOOR.map((m) => `${m.result} → nivel ${ROMAN[m.level]}`).join('; ')}. El nivel del caballo es el más alto entre su valoración y sus méritos.</li>
                  <li>La presidencia puede además subir el nivel por otros méritos acreditados con documentación oficial. Todo cambio queda registrado con su motivo.</li>
                  <li>La presidencia puede revisar el nivel si se acredita falsedad en la documentación aportada.</li>
                </ul>
              </div>
            </details>
            <details>
              <summary>Méritos deportivos y estrellas</summary>
              <div className="acc-body">
                <p>Las estrellas reconocen mérito deportivo contrastado con documentación oficial del organismo competente. No son un certificado ni sustituyen al nivel de calidad: figuran en la ficha y en el Certificado de Calidad, y la presidencia puede tenerlas en cuenta para subir el nivel del ejemplar. Un ejemplar puede obtener cualquiera de estas distinciones sin haber obtenido la anterior; prevalece la más alta conseguida.</p>
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
