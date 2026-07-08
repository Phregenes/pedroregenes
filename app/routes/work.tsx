import type { Route } from "./+types/work";
import { education, experiences } from "~/data/resume";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Trabalhos — Pedro Regenes" },
    {
      name: "description",
      content:
        "Cases de produto: Vizo, Inner AI e Parque PopHaus. Growth, automação com IA e infraestrutura de pagamentos.",
    },
  ];
}

export default function Work() {
  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 md:px-8 pt-14 pb-10 md:pt-20 md:pb-14">
          <p className="tag text-muted mb-3">{"[ ARQUIVO.02 ]"}</p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            TRABALHOS
          </h1>
          <p className="mt-4 max-w-lg text-sm md:text-base text-ink/70 leading-relaxed">
            Um recorte técnico de cada programa: o problema, a arquitetura da
            solução e os parâmetros que guiaram a execução.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 md:px-8 py-14 md:py-20 space-y-8">
        {experiences.map((exp) => (
          <article
            key={exp.id}
            className="border border-line p-6 md:p-9 relative"
          >
            <div className="flex items-center justify-between tag text-muted mb-7">
              <span>{exp.code}</span>
              <span
                className={
                  exp.status === "ativo" ? "text-accent" : "text-muted"
                }
              >
                {exp.status === "ativo" ? "● EM ANDAMENTO" : "◆ CONCLUÍDO"}
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 mb-7">
              <div>
                <h2 className="text-xl md:text-3xl font-bold tracking-tight">
                  {exp.role}
                </h2>
                <p className="tag text-muted mt-1.5">ORG = {exp.org}</p>
              </div>
              <p className="tag text-muted shrink-0">
                DURATION = {exp.duration}
              </p>
            </div>

            <p className="text-sm md:text-[15px] text-ink/80 leading-relaxed max-w-3xl mb-8">
              {exp.summary}
            </p>

            <div className="hairline pt-6 space-y-5">
              <p className="tag text-accent">{"{ parâmetros }"}</p>
              {exp.params.map((p) => (
                <div
                  key={p.label}
                  className="grid md:grid-cols-[240px_1fr] gap-1.5 md:gap-6"
                >
                  <p className="tag text-muted">{p.label}</p>
                  <p className="text-sm text-ink/80 leading-relaxed">
                    {p.value}
                  </p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 md:px-8 py-14 md:py-20">
          <p className="tag text-muted mb-8">{"{ 03 / FORMAÇÃO }"}</p>
          <div className="grid sm:grid-cols-3 gap-6">
            {education.map((e) => (
              <div key={e.program} className="border border-line p-5">
                <p className="text-sm font-bold leading-snug">{e.program}</p>
                <p className="tag text-muted mt-2">
                  {e.school}
                  {e.year ? ` // ${e.year}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
