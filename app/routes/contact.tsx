import { useCallback, useState } from "react";
import type { Route } from "./+types/contact";
import { ParticleDrawing } from "~/components/particle-drawing";
import { experiences, profile } from "~/data/resume";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Contato — Pedro Regenes" },
    {
      name: "description",
      content:
        "Fale com Pedro Regenes — Product Manager. E-mail, LinkedIn e telefone.",
    },
  ];
}

const currentRole =
  experiences.find((exp) => exp.id === "vizo")?.role ?? profile.role;

const infoRows = [
  { label: "NOW", value: `${currentRole} @ Vizo` },
  { label: "EMAIL", value: profile.email, href: `mailto:${profile.email}` },
  {
    label: "PHONE",
    value: profile.phone,
    href: `tel:${profile.phone.replace(/[^+\d]/g, "")}`,
  },
  { label: "LINKEDIN", value: profile.linkedin, href: profile.linkedinUrl },
  { label: "LOCATION", value: profile.location },
];

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const subject = `Contato via site — ${name || "sem nome"}`;
      const body = `${message}\n\n—\n${name}\n${email}`;
      const mailto = `mailto:${profile.email}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
    },
    [name, email, message]
  );

  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 md:px-8 pt-14 pb-10 md:pt-20 md:pb-14 grid md:grid-cols-[1fr_auto] gap-8 items-end">
          <div>
            <p className="tag text-muted mb-3">{"[ ARQUIVO.03 ]"}</p>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              CONTATO
            </h1>
            <p className="mt-4 max-w-md text-sm md:text-base text-ink/70 leading-relaxed">
              Sinal aberto para novas oportunidades, parcerias e conversas
              sobre produto, growth e IA.
            </p>
          </div>
          <div className="hidden md:block w-72 h-40 border border-line relative overflow-hidden">
            <ParticleDrawing
              className="absolute inset-0 h-full w-full"
              soundEnabled={false}
              active={false}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 md:px-8 py-14 md:py-20 grid md:grid-cols-2 gap-10 md:gap-16">
        <div>
          <p className="tag text-accent mb-6">{"{ 01 / DADOS }"}</p>
          <dl className="border border-line">
            {infoRows.map((row, i) => (
              <div
                key={row.label}
                className={[
                  "flex items-center justify-between gap-4 px-5 py-4",
                  i !== infoRows.length - 1 ? "border-b border-line" : "",
                ].join(" ")}
              >
                <dt className="tag text-muted shrink-0">{row.label}</dt>
                {row.href ? (
                  <dd className="text-sm font-medium text-right">
                    <a
                      href={row.href}
                      target={row.href.startsWith("http") ? "_blank" : undefined}
                      rel={
                        row.href.startsWith("http") ? "noreferrer" : undefined
                      }
                      className="hover:text-accent transition-colors underline decoration-line underline-offset-4"
                    >
                      {row.value}
                    </a>
                  </dd>
                ) : (
                  <dd className="text-sm font-medium text-right">
                    {row.value}
                  </dd>
                )}
              </div>
            ))}
          </dl>

          <p className="tag text-muted mt-8">
            RESPOSTA MÉDIA = 24H // FUSO = GMT-03
          </p>
        </div>

        <div>
          <p className="tag text-accent mb-6">{"{ 02 / TRANSMITIR MENSAGEM }"}</p>
          <form onSubmit={handleSubmit} className="border border-line p-6 md:p-7 space-y-5">
            <Field
              label="NOME"
              id="name"
              value={name}
              onChange={setName}
              required
            />
            <Field
              label="E-MAIL"
              id="email"
              type="email"
              value={email}
              onChange={setEmail}
              required
            />
            <div>
              <label htmlFor="message" className="tag text-muted block mb-2">
                MENSAGEM
              </label>
              <textarea
                id="message"
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-transparent border border-line focus:border-ink outline-none px-3 py-2.5 text-sm resize-none transition-colors"
                placeholder="Conte um pouco sobre o projeto ou oportunidade..."
              />
            </div>
            <button
              type="submit"
              className="tag border border-ink px-5 py-3 hover:bg-ink hover:text-paper transition-colors w-full sm:w-auto"
            >
              ENVIAR TRANSMISSÃO →
            </button>
            <p className="tag text-muted">
              abre seu cliente de e-mail com a mensagem pronta.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="tag text-muted block mb-2">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent border border-line focus:border-ink outline-none px-3 py-2.5 text-sm transition-colors"
      />
    </div>
  );
}
