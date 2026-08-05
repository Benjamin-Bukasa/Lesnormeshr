import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const SLIDE_INTERVAL_MS = 8000;

const LOGIN_SLIDES = [
  {
    id: 'retail-ops',
    image:
      'https://images.pexels.com/photos/3869649/pexels-photo-3869649.jpeg?cs=srgb&dl=pexels-picha-stock-2210122-3869649.jpg&fm=jpg',
    title: 'Des equipes connectees, un pilotage plus fluide.',
    subtitle: 'Centralisez vos operations RH, vos presences et vos donnees de paie dans une seule interface.',
    badge: 'Pilotage RH',
  },
  {
    id: 'workspace',
    image:
      'https://images.pexels.com/photos/1181434/pexels-photo-1181434.jpeg?cs=srgb&dl=pexels-divinetechygirl-1181434.jpg&fm=jpg',
    title: 'Une experience plus claire pour les responsables et les employes.',
    subtitle: 'Suivez les demandes, les dossiers et les validations avec un espace simple a parcourir.',
    badge: 'Experience collaborateur',
  },
  {
    id: 'team-review',
    image:
      'https://images.pexels.com/photos/9301248/pexels-photo-9301248.jpeg?cs=srgb&dl=pexels-mikhail-nilov-9301248.jpg&fm=jpg',
    title: 'Une vue continue sur vos recrutements et votre organisation.',
    subtitle: 'Preparez les campagnes, consolidez vos tableaux de bord et gagnez du temps au quotidien.',
    badge: 'Decision rapide',
  },
];

const SLIDE_VARIANTS = {
  enter: (direction) => ({
    x: direction >= 0 ? '100%' : '-100%',
    opacity: 1,
  }),
  center: {
    x: '0%',
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction >= 0 ? '-18%' : '18%',
    opacity: 0.92,
  }),
};

function LoginRight() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setDirection(1);
      setActiveSlide((previousIndex) => (previousIndex + 1) % LOGIN_SLIDES.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, []);

  const handleSelectSlide = (nextIndex) => {
    if (nextIndex === activeSlide) {
      return;
    }

    setDirection(nextIndex > activeSlide ? 1 : -1);
    setActiveSlide(nextIndex);
  };

  return (
    <div className="relative hidden h-full overflow-hidden bg-slate-950 lg:block">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={LOGIN_SLIDES[activeSlide].id}
          custom={direction}
          variants={SLIDE_VARIANTS}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.9, ease: [0.22, 0.8, 0.22, 1] }}
          className="absolute inset-0"
        >
          <img
            src={LOGIN_SLIDES[activeSlide].image}
            alt={LOGIN_SLIDES[activeSlide].title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/28 via-slate-900/10 to-slate-950/42" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_36%)]" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-x-12 bottom-12 flex items-end justify-between gap-8">
        <motion.div
          key={`${LOGIN_SLIDES[activeSlide].id}-copy`}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="max-w-xl rounded-[28px] border border-border/70 bg-secondary px-6 py-5 text-text shadow-[0_18px_55px_rgba(15,23,42,0.22)]"
        >
          <span className="inline-flex text-xs font-semibold uppercase tracking-[0.24em] text-text-secondary">
            {LOGIN_SLIDES[activeSlide].badge}
          </span>
          <h3 className="mt-4 text-3xl font-semibold leading-tight text-text">
            {LOGIN_SLIDES[activeSlide].title}
          </h3>
          <p className="mt-3 max-w-lg text-sm leading-6 text-text-secondary">
            {LOGIN_SLIDES[activeSlide].subtitle}
          </p>
        </motion.div>

        <div className="flex items-center gap-2 self-end">
          {LOGIN_SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => handleSelectSlide(index)}
              className={[
                'h-2.5 rounded-full transition-all duration-300',
                index === activeSlide ? 'w-8 bg-white' : 'w-2.5 bg-white/55 hover:bg-white/75',
              ].join(' ')}
              aria-label={`Afficher le slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default LoginRight;
