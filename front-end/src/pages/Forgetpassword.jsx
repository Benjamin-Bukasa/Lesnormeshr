import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Input, useToast } from '../components/ui';
import LoginRight from '../components/blocs/LoginRight';
import { requestPasswordReset } from '../services/authApi';

function Forgetpassword() {
  const navigate = useNavigate();
  const toast = useToast();

  const [identifier, setIdentifier] = useState('');
  const [channel, setChannel] = useState('EMAIL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugCode, setDebugCode] = useState('');

  const isPhoneValue = /\d/.test(identifier) && !identifier.includes('@');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!identifier.trim()) {
      toast.error('Renseignez votre e-mail ou votre numero de telephone.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await requestPasswordReset({
        identifier: identifier.trim(),
        channel,
      });

      if (result.resetCode) {
        setDebugCode(String(result.resetCode));
      } else {
        setDebugCode('');
      }

      toast.success(result.message || 'Code de reinitialisation envoye.');
      navigate(
        `/ResetPassword?identifier=${encodeURIComponent(identifier.trim())}${result.resetCode ? `&code=${encodeURIComponent(result.resetCode)}` : ''}`,
        {
          replace: false,
        },
      );
    } catch (error) {
      toast.error(error.message || 'Impossible d envoyer le code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="min-h-screen bg-white text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)]">
        <div className="flex min-h-screen flex-col border-b border-border lg:border-b-0 lg:border-r">
          <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-5 sm:px-7">
            <Link to="/Login" className="inline-flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white">
                LN
              </span>
              <span className="text-2xl font-semibold tracking-tight text-slate-900">LESNORMESRH</span>
            </Link>

            <Link to="/Login" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-primary">
              <ArrowLeft size={16} />
              <span>Retour a la connexion</span>
            </Link>
          </header>

          <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="w-full max-w-[470px]"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950">Mot de passe oublie</h1>
                <p className="text-base text-slate-500">
                  Saisissez votre identifiant pour recevoir un code de reinitialisation.
                </p>
              </div>

              <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
                <Input
                  label="E-mail ou telephone"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="jean@lesnormesrh.com"
                  leftIcon={isPhoneValue ? Phone : Mail}
                  autoComplete="username"
                />

                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-900">Canal de reinitialisation</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setChannel('EMAIL')}
                      className={[
                        'rounded-xl border px-4 py-3 text-sm font-medium transition',
                        channel === 'EMAIL'
                          ? 'border-primary bg-primary text-white'
                          : 'border-border bg-white text-slate-700 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      E-mail
                    </button>
                    <button
                      type="button"
                      onClick={() => setChannel('SMS')}
                      className={[
                        'rounded-xl border px-4 py-3 text-sm font-medium transition',
                        channel === 'SMS'
                          ? 'border-primary bg-primary text-white'
                          : 'border-border bg-white text-slate-700 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      SMS
                    </button>
                  </div>
                </div>

                {debugCode ? (
                  <div className="rounded-2xl border border-primary/20 bg-secondary px-4 py-3 text-sm text-text">
                    <p className="font-semibold">Code de test disponible</p>
                    <p className="mt-1 text-text-secondary">
                      Utilisez ce code pour continuer la reinitialisation : <span className="font-semibold text-text">{debugCode}</span>
                    </p>
                  </div>
                ) : null}

                <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl text-base">
                  <Send size={16} />
                  {isSubmitting ? 'Envoi en cours...' : 'Envoyer le code'}
                </Button>

                <p className="text-sm text-slate-500">
                  Vous avez deja un code ?{' '}
                  <Link to="/ResetPassword" className="font-medium text-primary hover:underline">
                    Reinitialiser maintenant
                  </Link>
                </p>
              </form>
            </motion.div>
          </div>

          <footer className="border-t border-border px-5 py-5 text-center text-sm text-slate-400 sm:px-7">
            www.lesnormesrh.com
          </footer>
        </div>

        <LoginRight />
      </div>
    </section>
  );
}

export default Forgetpassword;
