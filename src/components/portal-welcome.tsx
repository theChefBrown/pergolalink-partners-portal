"use client";

import { useDisplayPreferences } from "./display-preferences";
import { Icon } from "./icon";
import Link from "next/link";
import { Brand, ThemeToggle } from "./site-controls";
import { PergolaIllustration } from "./pergola-illustration";
import { demoCopy } from "@/lib/demo-copy";

export function PortalWelcome() {
  const { t, ui, locale } = useDisplayPreferences();
  const demo = demoCopy(locale);
  const features = [
    { icon: "grid", title: t.projects, body: t.projectsBody },
    { icon: "document", title: t.offers, body: t.offersBody },
    { icon: "layers", title: t.resources, body: t.resourcesBody },
  ] as const;
  const steps = [
    { title: t.step1, body: t.step1Body },
    { title: t.step2, body: t.step2Body },
    { title: t.step3, body: t.step3Body },
  ];

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">
        {t.skip}
      </a>
      <header className="site-header">
        <div className="page-container header-inner">
          <Brand href="#overview" />
          <nav className="main-nav" aria-label={t.navigation}>
            <a href="#overview">{t.overview}</a>
            <a href="#workspace">{t.workspace}</a>
            <a href="#workflow">{t.workflow}</a>
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <main id="main" className="page-container" tabIndex={-1}>
        <section id="overview" className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow hero-eyebrow">
              <span />
              {t.eyebrow}
            </p>
            <h1 id="hero-title">
              {t.title}
              <span>{t.titleAccent}</span>
            </h1>
            <p className="hero-description">{t.intro}</p>
            <div className="hero-actions">
              <Link className="button-primary" href="/dashboard">
                {ui.enterPortal}
                <Icon name="arrow" />
              </Link>
              <a className="button-text" href="#workflow">
                {t.process}
                <Icon name="diagonal" />
              </a>
            </div>
            <div className="hero-status">
              <span className="status-dot" />
              <span>{demo.banner}</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-caption">
              <span className="crosshair" aria-hidden="true">
                +
              </span>
              <span>{t.design}</span>
              <span className="visual-index">01 / A</span>
            </div>
            <div className="visual-orbit" aria-hidden="true" />
            <PergolaIllustration />
            <div className="model-label">
              <span className="model-label-dot" />
              <div>
                <strong>{t.model}</strong>
                <span>{t.system}</span>
              </div>
            </div>
            <div className="visual-bottom">
              <span>{t.connected}</span>
              <span aria-hidden="true">↗</span>
            </div>
          </div>
        </section>

        <div className="section-divider">
          <span>{t.collection}</span>
          <span className="divider-dots" aria-hidden="true">
            ＋ ＋ ＋
          </span>
        </div>

        <section
          id="workspace"
          className="workspace-section"
          aria-labelledby="workspace-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t.workspaceEyebrow}</p>
              <h2 id="workspace-title">{t.workspaceTitle}</h2>
            </div>
            <p className="section-intro">{t.workspaceIntro}</p>
          </div>
          <div className="feature-grid">
            {features.map((feature, index) => (
              <article className="feature-card" key={feature.icon}>
                <div className="feature-top">
                  <span className="feature-icon">
                    <Icon name={feature.icon} />
                  </span>
                  <span className="feature-number">0{index + 1}</span>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
                <div className="feature-bottom">
                  <Link
                    className="soon-label"
                    href={["/orders", "/offers", "/documentation"][index]}
                  >
                    <span />
                    {demo.available}
                  </Link>
                  <span className="feature-cross" aria-hidden="true">
                    +
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="workflow"
          className="workflow-section"
          aria-labelledby="workflow-title"
        >
          <div>
            <p className="eyebrow">{t.workflowEyebrow}</p>
            <h2 id="workflow-title">{t.workflowTitle}</h2>
          </div>
          <ol className="step-list">
            {steps.map((step, index) => (
              <li key={index}>
                <span className="step-number">0{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
