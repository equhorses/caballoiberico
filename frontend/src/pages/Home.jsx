import { Link } from 'react-router-dom'
import { Img, HorseCard, LevelBadge } from '../components/ui.jsx'
import { MERIT_FLOOR, SERVICES, eur, plazo } from '../data/content.js'
import { useRegistry } from '../data/useRegistry.js'

const I = {
  scan: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10" /></svg>,
  book: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" /><path d="M8 7h8M8 11h6" /></svg>,
  user: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>,
  globe: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>,
  clock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" /></svg>,
  shield: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></svg>,
}

export default function Home() {
  const { horses, isExample } = useRegistry()
  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" style={{ backgroundImage: 'url(/images/hero.jpg)', backgroundPosition: '22% 40%' }} />
        <div className="wrap">
          <div className="hero-tag">✦ ¿Qué es C-IBERICO? La unión del caballo español y lusitano</div>
          <h1>El caballo ibérico <em>valorado por su deporte,</em> no por su etiqueta.</h1>
          <p className="lead">
            C-IBERICO certifica la calidad deportiva del caballo ibérico, con una valoración de los tres aires
            según el reglamento de doma clásica y los criterios de selección centroeuropeos.
            Cada caballo recibe un número único y una ficha pública: cualquiera puede comprobar en esta web
            su certificado y sus estrellas de calidad.
          </p>
          <div className="row mt32">
            <Link className="btn btn-gold" to="/gestiones#prevaloracion">Pre-valoración gratis →</Link>
            <Link className="btn btn-line-light" to="/registro">Explorar el registro</Link>
          </div>
          <div className="hero-facts">
            <div><span>Admitidos</span><strong>PRE · PSL y sus cruces</strong></div>
            <div><span>Baremo</span><strong>Doma clásica</strong></div>
            <div><span>Referencia</span><strong>Centroeuropea</strong></div>
            <div><span>Trámites</span><strong>100% online</strong></div>
          </div>
        </div>
      </section>

      {/* QUÉ ES */}
      <section className="section white tight">
        <div className="wrap">
          <span className="eyebrow">Qué es C-IBERICO</span>
          <h2>Un sello privado que se puede comprobar</h2>
          <div className="grid g3 mt32">
            <div className="card truth yes">
              <div className="label">Es</div>
              <h3 className="mt8">Un certificado privado de calidad</h3>
              <p>Emitido por C-IBERICO, gestión privada y no asociativa. Identifica al caballo, controla su procedencia, valora su calidad deportiva y recoge sus méritos.</p>
            </div>
            <div className="card truth no">
              <div className="label">No es</div>
              <h3 className="mt8">Un libro genealógico oficial</h3>
              <p>No está avalado por ningún organismo público ni sustituye la inscripción en ANCCE, APSL u otras entidades. La complementa.</p>
            </div>
            <div className="card truth">
              <div className="label">Cómo se comprueba</div>
              <h3 className="mt8">Verificación pública</h3>
              <p>Cada certificado tiene un código único. Cualquier persona puede comprobar en esta web si está vigente.</p>
              <Link to="/verificar" className="link mt16" style={{ display: 'inline-block' }}>Verificar un certificado →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* VALORACIÓN */}
      <section className="section">
        <div className="wrap split">
          <div>
            <span className="eyebrow">Nuevo concepto de valoración</span>
            <h2>La IA lee el ejemplar antes que el expediente</h2>
            <p className="lead">
              Con los estándares del caballo de deporte centroeuropeo: el movimiento se mide como en las pruebas de caballos
              de estos studbooks, y la conformación por su función, respetando el tipo ibérico.
            </p>
            <p className="lead">
              Tener un caballo de calidad no puede depender del sí o no de alguien, ni de unas reglas desactualizadas y obsoletas.
              Aporta las cinco vistas reglamentarias y el vídeo según su rango de edad: la IA prepara una propuesta por bloques con su evidencia.
            </p>
            <div className="mt32">
              <div className="feature"><span className="icon-dot">{I.scan}</span><div><h3>Nueve bloques puntuados de 0 a 10</h3><p>1 Cabeza y cuello · 2 Tronco y dorso · 3 Grupa · 4 Aplomos · 5 Paso · 6 Trote · 7 Galope · 8 Ejercicios · 9 Aptitud para ser montado (según su edad y etapa de doma).</p></div></div>
              <div className="feature"><span className="icon-dot">{I.book}</span><div><h3>Doble lectura reglamentaria</h3><p>Cada informe traduce el resultado al lenguaje de la doma clásica y al de las pruebas de aptitud centroeuropeas.</p></div></div>
              <div className="feature"><span className="icon-dot">{I.user}</span><div><h3>La IA valora, C-IBERICO expide</h3><p>La nota y las estrellas las pone la IA, con la misma rúbrica para todos. Nosotros no los tocamos: comprobamos que el material es del caballo y es válido, y expedimos la ficha con el resultado tal cual.</p></div></div>
            </div>
            <Link to="/valoracion" className="btn btn-line mt32">Cómo funciona la valoración</Link>
          </div>
          <div className="stack">
            <figure className="media" style={{ margin: 0 }}><Img src="/images/valoracion.jpg" alt="Análisis morfológico del caballo" dark label="Imagen: análisis morfológico" style={{ aspectRatio: '3 / 2' }} /></figure>
            <figure className="media" style={{ margin: 0 }}>
              <Img src="/images/cinco-vistas.jpg" alt="Las cinco vistas obligatorias" label="Imagen: las cinco vistas" style={{ aspectRatio: '3 / 2' }} />
              <figcaption>Las cinco vistas obligatorias: lateral izquierdo, lateral derecho, frontal, trasera y tronco desde arriba.</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* RAZAS */}
      <section className="section white">
        <div className="wrap">
          <span className="eyebrow">Razas admitidas</span>
          <h2>Dos fronteras, un solo caballo de deporte</h2>
          <p className="lead">
            El certificado trabaja con Pura Raza Española y Pura Sangre Lusitano, y con los cruces entre ambas.
            La inscripción en sus libros oficiales sigue correspondiendo a sus asociaciones; C-IBERICO certifica su calidad deportiva.
          </p>
          <div className="grid g2 mt48">
            <article className="card breed">
              <div className="media"><Img src="/images/pre.jpg" alt="Caballo de Pura Raza Española" dark label="Imagen: PRE" /></div>
              <div className="body"><div className="code">PRE</div><h3 className="mt16">Pura Raza Española</h3><p className="muted mt8">Formas redondeadas, cuello arqueado muy insertado y extraordinaria predisposición a la reunión y a los giros sobre el tercio posterior.</p></div>
            </article>
            <article className="card breed">
              <div className="media"><Img src="/images/psl.jpg" alt="Caballo Pura Sangre Lusitano" dark label="Imagen: PSL" /></div>
              <div className="body"><div className="code">PSL</div><h3 className="mt16">Pura Sangre Lusitano</h3><p className="muted mt8">Perfil subconvexo, grupa potente y dorso elástico. Empuje posterior y galope que sostienen el trabajo de nivel Gran Premio.</p></div>
            </article>
          </div>
          <div className="card cruzados mt32">
            <div>
              <div className="code">PRE × PSL</div>
              <h3 className="mt16">Los cruces, con procedencia controlada</h3>
              <p className="muted mt8">
                Muchos buenos caballos de deporte son cruces entre español y lusitano, y ninguna de las dos asociaciones los inscribe.
                C-IBERICO sí: les da número de registro, valoración deportiva y una ficha pública que cualquier comprador puede consultar.
              </p>
            </div>
            <ul className="origin-list">
              <li><strong>Padres documentados.</strong> El cruce puede no tener papeles, pero su padre y su madre deben estar inscritos en ANCCE, APSL o en C-IBERICO.</li>
              <li><strong>Sus hijos, bajo tu control.</strong> Una vez registrado, su descendencia se inscribe en C-IBERICO con la genealogía ya comprobada.</li>
              <li><strong>Misma calidad.</strong> Un cruce se valora con la misma equidad que cualquier otro caballo y puede llegar a las 5 estrellas.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* GESTIONES */}
      <section className="section">
        <div className="wrap">
          <div className="row between" style={{ alignItems: 'flex-end' }}>
            <div>
              <span className="eyebrow">Gestiones online</span>
              <h2>Todo el expediente,<br />sin salir de casa</h2>
              <p className="lead">Aquí se solicita, se documenta, se abona la tarifa y se sigue el estado del expediente desde el mismo panel. Precios ajustados tras estudiar las tarifas de los principales libros genealógicos europeos: el mismo para cualquier país, sin cuotas de socio ni recargos.</p>
            </div>
            <Link to="/gestiones" className="btn btn-line">Ver todos los servicios</Link>
          </div>
          <div className="services mt48">
            {SERVICES.map((s) => (
              <Link to={`/gestiones#${s.slug}`} key={s.code} className="service" style={{ textDecoration: 'none' }}>
                <div className="num">{s.num}</div>
                <div><h3>{s.name}</h3><p>{s.desc}</p></div>
                <div className="price"><strong>{eur(s.price)}</strong><span>◷ {plazo(s.days)}</span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* EL CAMINO DE UN CABALLO */}
      <section className="section white">
        <div className="wrap">
          <span className="eyebrow">Cómo funciona</span>
          <h2>El camino de un caballo en C-IBERICO</h2>
          <p className="lead">Cuatro pasos, cada uno con su sentido. Los dos primeros son los certificados; los otros dos, su reconocimiento deportivo.</p>
          <ol className="path mt32">
            <li>
              <span className="path-tag">Su DNI</span>
              <h3>Certificado de Origen</h3>
              <p>Quién es y de dónde viene: microchip, procedencia comprobada y número de registro CIB.</p>
              <em>Cualquier edad · una sola vez</em>
            </li>
            <li>
              <span className="path-tag">Su nota</span>
              <h3>Certificado de Calidad</h3>
              <p>De 1 a 5 estrellas según cómo se mueve, exigiéndole lo que corresponde a su edad. El mismo certificado se actualiza si sube de estrellas.</p>
              <em>Desde los 6 meses · se puede repetir cada año</em>
            </li>
            <li>
              <span className="path-tag">Sus medallas</span>
              <h3>Resultados en pista</h3>
              <p>Lo que gana en competición, verificado con documento oficial. Aparece en su ficha y un podio le asegura unas estrellas mínimas.</p>
              <em>Cada vez que gana algo · gratis</em>
            </li>
            <li>
              <span className="path-tag">Su salón de la fama</span>
              <h3>Lista Laureada</h3>
              <p>El máximo reconocimiento, que concede C-IBERICO a los caballos que han marcado la diferencia en pista o como reproductores.</p>
              <Link to="/laureados" className="link">Ver la Lista Laureada →</Link>
            </li>
          </ol>
        </div>
      </section>

      {/* CALIDAD Y RESULTADOS */}
      <section className="section">
        <div className="wrap grid g2" style={{ gap: 48, alignItems: 'start' }}>
          <div>
            <span className="eyebrow">Calidad C-IBERICO</span>
            <h2>De 1 a 5 estrellas</h2>
            <p className="lead">Una sola escala, fácil de entender. La IA valora cómo se mueve el caballo exigiéndole lo que corresponde a su edad: a uno de 4 años, lo de 4; a uno de 7, lo de 7; desde los 8, la exigencia completa.</p>
            <div className="stars-scale mt24">
              {[5, 4, 3, 2, 1].map((n) => <div key={n} className="row between"><LevelBadge level={n} /><span className="small muted">{['', 'Correcto', 'Bueno', 'Muy bueno', 'Excelente', 'Excepcional'][n]}</span></div>)}
            </div>
            <p className="small muted mt16">En su historial queda cada valoración con su edad, por ejemplo: «4 años · 3 estrellas», «6 años · 4 estrellas». Nunca baja.</p>
          </div>
          <div>
            <span className="eyebrow">Resultados en pista</span>
            <h2>Si gana, se le reconoce</h2>
            <p className="lead">Un resultado deportivo verificado le asegura unas estrellas mínimas, aunque la valoración haya dado menos. Se queda con lo más alto.</p>
            <table className="table mt24"><thead><tr><th>Resultado verificado</th><th>Mínimo</th></tr></thead>
              <tbody>{MERIT_FLOOR.map((m) => <tr key={m.result}><td>{m.result}</td><td><LevelBadge level={m.level} /></td></tr>)}</tbody></table>
            <div className="callout mt24">
              <div className="seal"><Img src="/images/sello.png" alt="Sello Lista Laureada" label="★" /></div>
              <p>Aparte está la <Link to="/laureados" className="link">Lista Laureada</Link>: el máximo reconocimiento, que concede C-IBERICO a los caballos que han marcado la diferencia.</p>
            </div>
          </div>
        </div>
      </section>

      {/* MEJOR VALORADOS */}
      <section className="section white">
        <div className="wrap">
          <div className="row between" style={{ alignItems: 'flex-end' }}>
            <div><span className="eyebrow">Registro C-IBERICO</span><h2>Ejemplares mejor valorados</h2></div>
            <Link to="/registro" className="btn btn-line">Buscar en el registro</Link>
          </div>
          {isExample && <p className="notice mt24">Aún no hay ejemplares certificados publicados. Las fichas marcadas como <strong>Ejemplo</strong> son ilustrativas y muestran el formato.</p>}
          <div className="grid g4 mt32">{horses.slice(0, 4).map((h) => <HorseCard key={h.registrationNumber} h={h} />)}</div>
        </div>
      </section>

      {/* YEGUADAS */}
      <section className="section white">
        <div className="wrap split" style={{ gridTemplateColumns: '.9fr 1.1fr' }}>
          <figure className="media" style={{ margin: 0 }}><Img src="/images/yeguada.jpg" alt="Criador con su caballo" dark label="Imagen: yeguada asociada" style={{ aspectRatio: '3 / 2' }} /></figure>
          <div>
            <span className="eyebrow">Yeguadas asociadas</span>
            <h2>Una red circular de retroalimentación</h2>
            <p className="lead">Integrar tu yeguada significa código de criador C-IBERICO, atención urgente, descuentos en servicios y promoción internacional de tus ejemplares y de tu historia.</p>
            <div className="grid g3 mt32">
              <div className="card soft"><span className="icon-dot">{I.globe}</span><h3>Internacional</h3><p>Mismo derecho sea cual sea tu ubicación.</p></div>
              <div className="card soft"><span className="icon-dot">{I.clock}</span><h3>Atención urgente</h3><p>Plazos reducidos en todos los servicios.</p></div>
              <div className="card soft"><span className="icon-dot">{I.shield}</span><h3>Privacidad</h3><p>Gestión privada, no asociativa.</p></div>
            </div>
            <Link to="/gestiones#yeguada" className="btn btn-gold mt32">Integrar mi yeguada</Link>
          </div>
        </div>
      </section>
    </>
  )
}
