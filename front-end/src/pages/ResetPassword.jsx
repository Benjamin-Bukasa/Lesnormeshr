import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, KeyRound, Mail, Phone, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Input, useToast } from '../components/ui';
import LoginRight from '../components/blocs/LoginRight';
import { resetPassword as resetPasswordRequest } from '../services/authApi';

function ResetPassword() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const initialIdentifier = useMemo(() => searchParams.get('identifier') || '', [searchParams]);
  const initialCode = useMemo(() => searchParams.get('code') || '', [searchParams]);

  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [code, setCode] = useState(initialCode);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPhoneValue = /\d/.test(identifier) && !identifier.includes('@');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!identifier.trim() || !code.trim() || !newPassword.trim()) {
      toast.error('Completez l identifiant, le code et le nouveau mot de passe.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await resetPasswordRequest({
        identifier: identifier.trim(),
        code: code.trim(),
        newPassword,
      });

      toast.success(result.message || 'Mot de passe reinitialise avec succes.');
      navigate('/Login', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Impossible de reinitialiser le mot de passe.');
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

            <Link to="/Forgetpassword" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-primary">
              <ArrowLeft size={16} />
              <span>Retour</span>
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
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950">Reinitialiser le mot de passe</h1>
                <p className="text-base text-slate-500">
                  Saisissez le code recu puis choisissez un nouveau mot de passe.
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

                <Input
                  label="Code de reinitialisation"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="123456"
                  leftIcon={ShieldCheck}
                  autoComplete="one-time-code"
                />

                <Input
                  label="Nouveau mot de passe"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Votre nouveau mot de passe"
                  autoComplete="new-password"
                  leftIcon={KeyRound}
                  rightIcon={showNewPassword ? EyeOff : Eye}
                  onRightIconClick={() => setShowNewPassword((previous) => !previous)}
                  inputClassName="pr-12"
                />

                <Input
                  label="Confirmer le mot de passe"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirmez le mot de passe"
                  autoComplete="new-password"
                  leftIcon={KeyRound}
                  rightIcon={showConfirmPassword ? EyeOff : Eye}
                  onRightIconClick={() => setShowConfirmPassword((previous) => !previous)}
                  inputClassName="pr-12"
                />

                <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl text-base">
                  {isSubmitting ? 'Reinitialisation en cours...' : 'Mettre a jour le mot de passe'}
                </Button>

                <p className="text-sm text-slate-500">
                  Vous n avez pas recu le code ?{' '}
                  <Link to="/Forgetpassword" className="font-medium text-primary hover:underline">
                    Demander un nouveau code
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

export default ResetPassword;
