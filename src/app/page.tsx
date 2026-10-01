import Link from "next/link";
import ThemeToggle from "@/features/theme/ThemeToggle";
import { ArrowUpRight, BookOpen, Check, Layers, Sparkles } from "lucide-react";
export default function Home() {
  return (
    <div className="landing">
      <nav>
        <Link className="brand" href="/">
          <span className="logo">
            <BookOpen size={21} />
          </span>
          StudyLens<span className="beta">LOCAL AI</span>
        </Link>
        <div className="landing-nav-actions">
          <ThemeToggle />
          <Link href="/login">
            Sign in <ArrowUpRight size={15} />
          </Link>
        </div>
      </nav>
      <main>
        <section className="landing-hero">
          <div className="hero-story">
            <div className="eyebrow">
              <span className="dot" /> YOUR NOTES. YOUR NEXT CHAPTER.
            </div>
            <h1>
              Less organizing.
              <br />
              More <em>understanding.</em>
            </h1>
            <p className="hero-copy">
              Turn a pile of lecture notes into a clear path to exam day. Learn
              from your own material, find the gaps, and make a plan that fits
              your life.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/register">
                Create your study space <ArrowUpRight size={17} />
              </Link>
              <Link className="text-link" href="/login">
                I already have an account
              </Link>
            </div>
            <div className="trust">
              <span>
                <Check size={15} /> Private by design
              </span>
              <span>
                <Check size={15} /> Powered by local AI
              </span>
              <span>
                <Check size={15} /> Your plan, your choice
              </span>
            </div>
          </div>
          <div
            className="learning-art"
            aria-label="From your notes to understanding and a study plan"
          >
            <div className="art-orbit orbit-one" aria-hidden="true" />
            <div className="art-orbit orbit-two" aria-hidden="true" />
            <span className="art-caption">A LITTLE CLARITY, EVERY DAY</span>
            <div className="art-sheet">
              <span className="art-tag">
                <BookOpen size={15} /> YOUR MATERIAL
              </span>
              <h2>
                Big ideas.
                <br />A clearer picture.
              </h2>
              <div className="art-lines" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <div className="art-highlight">
                <Sparkles size={19} />
                <span>
                  Make the connection
                  <small>Learn from the notes you trust.</small>
                </span>
              </div>
            </div>
            <div className="art-note">
              <Layers size={19} />
              <span>
                One organized space<small>Notes · practice · plans</small>
              </span>
            </div>
            <div className="art-pill">
              <Check size={16} /> Your pace. Your next chapter.
            </div>
            <span className="art-spark" aria-hidden="true">
              ✳
            </span>
          </div>
        </section>
        <div className="features-heading">
          <span className="eyebrow">LESS FRICTION. MORE FOCUS.</span>
          <h2>Everything you need to move forward.</h2>
        </div>
        <div className="landing-grid">
          <article>
            <span className="feature-icon">
              <Layers />
            </span>
            <small>01 / BRING YOUR MATERIAL</small>
            <h2>A home for every page.</h2>
            <p>
              Upload lecture notes, scanned handouts and your syllabus. Review
              the extracted text before using it.
            </p>
          </article>
          <article>
            <span className="feature-icon">
              <Sparkles />
            </span>
            <small>02 / BUILD UNDERSTANDING</small>
            <h2>Answers you can trace.</h2>
            <p>
              Ask questions with page references, practice with quizzes, and see
              where you need more evidence.
            </p>
          </article>
          <article>
            <span className="feature-icon">
              <BookOpen />
            </span>
            <small>03 / MAKE STEADY PROGRESS</small>
            <h2>A plan with breathing room.</h2>
            <p>
              Confirm your exam dates, set your availability and accept a
              realistic schedule. Changes stay yours to approve.
            </p>
          </article>
        </div>
      </main>
      <footer>
        StudyLens · A little clarity, every day.
        <span>Local models require setup and processing time.</span>
      </footer>
    </div>
  );
}
