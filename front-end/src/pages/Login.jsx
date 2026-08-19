import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Input, useToast } from '../components/ui';
import LoginRight from '../components/blocs/LoginRight';
import { getCurrentAuthProfile, login as loginRequest } from '../services/authApi';
import useAuthStore from '../stores/authStore';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const setUser = useAuthStore((state) => state.setUser);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const isPhoneValue = /\d/.test(identifier) && !identifier.includes('@');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const googleError = params.get('google_error');
    if (googleError) {
      toast.error(googleError);
      navigate('/Login', { replace: true });
      return;
    }

    if (params.get('google') !== 'success') return;
    let cancelled = false;
    getCurrentAuthProfile()
      .then((result) => {
        if (cancelled) return;
        setUser(result.user, { storage: 'local' });
        toast.success('Connexion Google reussie.');
        navigate('/', { replace: true });
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(error.message || 'Connexion Google impossible.');
          navigate('/Login', { replace: true });
        }
      });
    return () => { cancelled = true; };
  }, [location.search, navigate, setUser, toast]);

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    window.location.assign(`${apiBaseUrl}/api/auth/google`);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!identifier.trim() || !password.trim()) {
      toast.error('Renseignez votre identifiant et votre mot de passe.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await loginRequest({
        identifier: identifier.trim(),
        password,
      });

      setUser(result.user, { storage: rememberMe ? 'local' : 'session' });
      toast.success(result.message || 'Connexion réussie.');

      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Connexion impossible.');
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

            <div className="hidden items-center gap-3 text-sm text-slate-500 sm:flex">
              <span>Vous n’avez pas de compte&nbsp;?</span>
              <button
                type="button"
                className="rounded-xl bg-slate-100 px-4 py-2 font-medium text-slate-900 transition hover:bg-slate-200"
              >
                Créer
              </button>
            </div>
          </header>

          <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="w-full max-w-[450px]"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950">Connexion</h1>
                <p className="text-base text-slate-500">Entrez vos informations de connexion.</p>
              </div>

              <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
                <Input
                  label="E-mail ou téléphone"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="benjamin@lesnormesrh.com"
                  leftIcon={isPhoneValue ? Phone : Mail}
                  autoComplete="username"
                />

                <div className="space-y-2">
                  <Input
                    label="Mot de passe"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Votre mot de passe"
                    autoComplete="current-password"
                    rightIcon={showPassword ? EyeOff : Eye}
                    onRightIconClick={() => setShowPassword((previous) => !previous)}
                    inputClassName="pr-12"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <label className="inline-flex items-center gap-2 text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    <span>Se souvenir de moi</span>
                  </label>

                  <Link to="/Forgetpassword" className="font-medium text-slate-500 transition hover:text-primary">
                    Mot de passe oublié&nbsp;?
                  </Link>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl text-base">
                  {isSubmitting ? 'Connexion en cours…' : 'Login'}
                </Button>

                <div className="flex items-center gap-3 pt-1">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span className="text-sm text-slate-400">ou continuer avec</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading}
                  className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <span className="text-lg font-semibold text-[#4285F4]">G</span>
                  <span>{isGoogleLoading ? 'Redirection vers Google...' : 'Se connecter avec Google'}</span>
                </button>
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

export default Login;
