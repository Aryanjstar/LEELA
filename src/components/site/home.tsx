"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Brand } from "../brand";
import { films, type Film } from "./films";

const modes = [
  ["Code Lab", "A sorted list, one number, and why the middle is enough.", "Find 21"],
  ["Explainer", "A top should fall. The spin is the reason it does not.", "Why it stays up"],
  ["Story", "A lattu, a courtyard, and the moon that never lands.", "Ek lattu"],
  ["Launch", "An idea stuck in your head, and the three ways out.", "Any idea"],
  ["A house", "Ten family chats become one board and one guest link.", "One house"],
];

const steps = [
  ["01", "Idea", "A topic, who it is for, and what must be in the film."],
  ["02", "Plan", "The model picks named scenes from a catalog. It never writes the HTML."],
  ["03", "Voice", "Speech is recorded and measured. Captions sit on the words."],
  ["04", "Render", "HyperFrames draws the frames. The file you get is an MP4."],
];

const stack = [
  ["Studio", "Next.js, React, TypeScript"],
  ["Records", "MongoDB. Your projects stay on your account."],
  ["Picture", "HyperFrames and GSAP. FFmpeg writes the MP4."],
  ["Plan", "Gemini, behind an adapter. The plan is data."],
  ["Voice", "ElevenLabs speaks the line that is on screen. A voice never swaps in silence."],
  ["Trace", "Code Lab reads an execution trace. The model does not invent the steps."],
];

export function HomePage() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(films[0].id);
  const [sound, setSound] = useState(false);
  const stageRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLVideoElement>(null);
  const active = films.find((film) => film.id === activeId) ?? films[0];

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hero = heroRef.current;
    if (!hero || reduced) return;
    hero.muted = true;
    void hero.play().catch(() => undefined);
  }, []);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    node.muted = !(sound && active.audio);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      node.pause();
      return;
    }
    void node.play().catch(() => undefined);
  }, [active, sound]);

  function choose(film: Film) {
    setActiveId(film.id);
    if (!film.audio) setSound(false);
  }

  function toggleSound() {
    const node = stageRef.current;
    if (!active.audio || !node) return;
    const next = !sound;
    setSound(next);
    node.muted = !next;
    void node.play().catch(() => undefined);
  }

  return (
    <div className="site">
      <header className={open ? "site-bar is-open" : "site-bar"}>
        <Brand />
        <nav className="site-nav" aria-label="Page">
          <a href="#films" onClick={() => setOpen(false)}>Films</a>
          <a href="#modes" onClick={() => setOpen(false)}>Modes</a>
          <a href="#method" onClick={() => setOpen(false)}>Method</a>
          <a href="#stack" onClick={() => setOpen(false)}>Stack</a>
        </nav>
        <div className="site-bar-end">
          <Link className="btn" href="/sign-in">Start creating</Link>
          <button className="menu" type="button" aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((value) => !value)}>
            <span />
            <span />
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="hindi" lang="hi">लीला</p>
          <h1>Any idea, <em>at play.</em></h1>
          <p className="lede">
            A studio for short films. You bring a topic, some notes, or a piece of code. Leela plans the scenes, a voice reads them, and the picture is drawn by code.
          </p>
          <div className="hero-actions">
            <Link className="btn" href="/sign-in">Start creating</Link>
            <a className="btn ghost" href="#films">Watch the films</a>
          </div>
          <p className="fine">The phone is Find 21. It starts muted. Turn the sound on.</p>
        </div>
        <figure className="hero-phone">
          <div className="phone">
            <video
              ref={heroRef}
              src="/films/code-lab.mp4"
              poster="/films/find-poster.jpg"
              muted
              loop
              playsInline
              preload="metadata"
            />
          </div>
          <figcaption>
            <strong>Find 21</strong>
            <span>Code Lab · the voice matches the line</span>
          </figcaption>
        </figure>
      </section>

      <section id="films" className="block">
        <div className="block-head">
          <p className="kicker">Rendered here</p>
          <h2>Films this studio has already made.</h2>
          <p>Five films. Each one states a problem, then the way through it. The voice says the words on the screen.</p>
        </div>
        <div className="stage">
          <div className="phone phone-lg">
            <video
              key={active.id}
              ref={stageRef}
              src={active.src}
              poster={active.poster}
              loop
              playsInline
              controls
              preload="metadata"
            />
          </div>
          <div className="stage-copy">
            <p className="kicker">{active.kind} · {active.length}{active.audio ? " · with voice" : " · silent"}</p>
            <h3>{active.title}</h3>
            <p>{active.detail}</p>
            <button className="btn ghost" type="button" onClick={toggleSound} disabled={!active.audio}>
              {active.audio ? (sound ? "Mute" : "Play with sound") : "No voice in this file"}
            </button>
          </div>
        </div>
        <div className="strip">
          {films.map((film) => (
            <button
              key={film.id}
              type="button"
              className={film.id === active.id ? "thumb is-on" : "thumb"}
              aria-pressed={film.id === active.id}
              aria-label={`${film.title}, ${film.audio ? "with voice" : "silent"}`}
              onClick={() => choose(film)}
            >
              <img src={film.poster} alt="" />
              <span>{film.title}</span>
              <small>{film.audio ? "Voice" : "Silent"} · {film.length}</small>
            </button>
          ))}
        </div>
      </section>

      <section id="modes" className="block">
        <div className="block-head">
          <p className="kicker">What it makes</p>
          <h2>One pipeline. Different kinds of film.</h2>
        </div>
        <div className="bento">
          {modes.map(([title, copy, film]) => (
            <article key={title} className="tile">
              <h3>{title}</h3>
              <p>{copy}</p>
              {film ? <a href="#films">{film}</a> : <span className="fine">In the plan</span>}
            </article>
          ))}
        </div>
      </section>

      <section id="method" className="block">
        <div className="block-head">
          <p className="kicker">Method</p>
          <h2>The model writes the plan. Code writes the film.</h2>
        </div>
        <ol className="steps">
          {steps.map(([n, title, copy]) => (
            <li key={n}>
              <span>{n}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="stack" className="block">
        <div className="block-head">
          <p className="kicker">Stack</p>
          <h2>What actually runs.</h2>
        </div>
        <dl className="stack">
          {stack.map(([name, copy]) => (
            <div key={name}>
              <dt>{name}</dt>
              <dd>{copy}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="site-foot">
        <Brand />
        <p>Leela, लीला. Any idea, at play.</p>
        <div className="marks">
          <a className="mark" href="https://aryanjaiswal.in" aria-label="Aryan Jaiswal, portfolio">
            <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="1.6"/><path fill="currentColor" d="M16 7.5 22.2 24h-2.5l-1.4-4h-4.6l-1.4 4H9.8L16 7.5zm0 6.2-1.5 4.2h3L16 13.7z"/></svg>
          </a>
          <a className="mark" href="https://github.com/Aryanjstar" aria-label="GitHub">
            <svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 4a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 .1.8 1.8 2.6 1.3.1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6a4.7 4.7 0 0 1 1.2-3.2 4.3 4.3 0 0 1 .1-3.2s1-.3 3.3 1.2a11.3 11.3 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2a4.3 4.3 0 0 1 .1 3.2 4.7 4.7 0 0 1 1.2 3.2c0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 16 4z"/></svg>
          </a>
          <a className="mark" href="https://nextjs.org" aria-label="Next.js">
            <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" strokeWidth="1.6"/><path d="M12 22 V10 l10 12" fill="none" stroke="currentColor" strokeWidth="1.6"/></svg>
          </a>
          <a className="mark" href="https://www.mongodb.com" aria-label="MongoDB">
            <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 4c2 5 4 8 4 13a4 4 0 0 1-8 0c0-5 2-8 4-13z" fill="currentColor"/><path d="M16 26 v3" stroke="currentColor" strokeWidth="1.6"/></svg>
          </a>
        </div>
      </footer>
    </div>
  );
}
