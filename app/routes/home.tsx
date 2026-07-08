import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/home";
import { ParticleDrawing } from "~/components/particle-drawing";
import {
  initAudio,
  playBlip,
  setDroneActive,
  setMuted,
} from "~/lib/audio-engine";
import { profile } from "~/data/resume";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Pedro Regenes — Product Manager" },
    {
      name: "description",
      content:
        "Product Manager especialista em growth, automação com IA e produtos de missão crítica. Portfólio, trabalhos e contato.",
    },
  ];
}

export default function Home() {
  const [booted, setBooted] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  const handleBoot = useCallback(async () => {
    await initAudio();
    setDroneActive(true);
    [220, 330, 440].forEach((freq, i) => {
      setTimeout(
        () => playBlip(freq, { type: "triangle", duration: 0.16 }),
        i * 90
      );
    });
    setBooted(true);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundOn((prev) => {
      const next = !prev;
      setMuted(!next);
      setDroneActive(next);
      return next;
    });
  }, []);

  // Stop the ambient drone as soon as the user navigates away from the home
  // page, so it doesn't keep playing in the background on other routes.
  useEffect(() => {
    return () => setDroneActive(false);
  }, []);

  return (
    <section className="relative h-[calc(100dvh-3.5rem)] overflow-hidden">
      <ParticleDrawing
        className="absolute inset-0 h-full w-full"
        soundEnabled={soundOn}
        active={booted}
      />

      <div className="pointer-events-none absolute inset-5 md:inset-8 flex items-start justify-between tag text-muted">
        <span className="bracket">CONFIG.PROFILE / 01</span>
        <span className="bracket">PROGRAM NO.01</span>
      </div>

      {booted ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
          <div className="bg-paper/78 backdrop-blur-md border border-line px-6 py-8 md:px-14 md:py-11 text-center max-w-xl flicker-in">
            <p className="tag text-muted mb-4">
              CERTAIN UNCERTAINTIES // PORTFOLIO.EXE
            </p>
            <h1 className="text-[15vw] leading-[0.9] sm:text-[9vw] md:text-[4.2vw] font-bold tracking-tight whitespace-pre-line">
              {"PEDRO\nREGENES"}
            </h1>
            <p className="mt-5 text-sm md:text-[15px] text-ink/80 leading-relaxed">
              {profile.role} — {profile.tagline}
            </p>
            <div className="mt-7 flex items-center justify-center gap-3 pointer-events-auto">
              <Link
                to="/trabalhos"
                className="tag border border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors"
              >
                VER TRABALHOS →
              </Link>
              <Link
                to="/contato"
                className="tag border border-line px-4 py-2 hover:border-ink transition-colors"
              >
                CONTATO
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="pointer-events-auto bg-paper/78 backdrop-blur-md border border-line px-8 py-10 md:px-16 md:py-14 text-center max-w-md">
            <p className="tag text-muted mb-4">
              CERTAIN UNCERTAINTIES // PORTFOLIO.EXE
            </p>
            <p className="tag text-muted mb-5">[ SYSTEM.BOOT ]</p>
            <button
              type="button"
              onClick={handleBoot}
              className="group tag border border-ink px-6 py-3 hover:bg-ink hover:text-paper transition-colors cursor-pointer"
            >
              ▶ INICIAR TRANSMISSÃO
            </button>
            <p className="tag text-muted mt-5">
              ativa áudio + campo interativo
            </p>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-5 md:inset-8 grid grid-cols-3 items-end tag text-muted">
        <span className="bracket justify-self-start">
          COORD = {profile.location}
        </span>
        <span className="hidden sm:block justify-self-center opacity-70 text-center">
          PASSE O MOUSE OU CLIQUE PARA INTERAGIR
        </span>
        <div className="flex flex-col items-end gap-2 justify-self-end">
          <span className="bracket">
            STATUS ={" "}
            <span className="text-accent">
              {booted ? "TRANSMITTING" : "STANDBY"}
            </span>
          </span>
          {booted ? (
            <button
              type="button"
              onClick={toggleSound}
              className="pointer-events-auto tag border border-line bg-paper/90 px-3 py-1.5 hover:border-ink transition-colors cursor-pointer"
            >
              SOM: {soundOn ? "ON" : "OFF"}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
