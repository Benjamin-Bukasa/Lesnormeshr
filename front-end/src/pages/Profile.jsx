import React, { useEffect, useMemo, useState } from 'react';
import { AtSign, Building2, LockKeyhole, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { Breadcrumbs, Button, Card, DropdownSelect, Input, StatusBadge, useToast } from '../components/ui';
import ImageDropzone from '../components/ui/imageDropzone';
import useAuthStore from '../stores/authStore';
import {
  changeCurrentPassword,
  getCurrentAuthProfile,
  updateCurrentAuthProfile,
  uploadCurrentAuthAvatar,
} from '../services/authApi';
import { resolveMediaUrl } from '../utils/media';

const INITIAL_PROFILE_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  preferredChannel: 'EMAIL',
};

const INITIAL_PASSWORD_FORM = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

function formatDateTime(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getStatusLabel(status) {
  switch (String(status || '').toUpperCase()) {
    case 'INVITED':
      return 'Invite';
    case 'ACTIVE':
      return 'Actif';
    case 'SUSPENDED':
      return 'Suspendu';
    case 'ARCHIVED':
      return 'Archive';
    case 'LOCKED':
      return 'Verrouille';
    default:
      return status || 'N/A';
  }
}

function Profile() {
  const toast = useToast();
  const authUser = useAuthStore((state) => state.user);
  const setAuthUser = useAuthStore((state) => state.setUser);
  const [profileForm, setProfileForm] = useState(INITIAL_PROFILE_FORM);
  const [passwordForm, setPasswordForm] = useState(INITIAL_PASSWORD_FORM);
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreviewOverride, setAvatarPreviewOverride] = useState('');

  const fullName = useMemo(() => {
    const firstName = profileData?.user?.firstName || authUser?.firstName || '';
    const lastName = profileData?.user?.lastName || authUser?.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Utilisateur';
  }, [profileData, authUser]);

  const avatarUrl = useMemo(
    () => resolveMediaUrl(profileData?.user?.avatarUrl || authUser?.avatarUrl),
    [profileData, authUser],
  );

  const displayedAvatarUrl = avatarPreviewOverride || avatarUrl;

  const initials = useMemo(() => {
    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'U';
  }, [fullName]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setIsLoading(true);
        const data = await getCurrentAuthProfile();
        if (cancelled) return;

        setProfileData(data);
        setAuthUser(data.user);
        setProfileForm({
          firstName: data.user?.firstName || '',
          lastName: data.user?.lastName || '',
          email: data.user?.email || '',
          phone: data.user?.phone || '',
          preferredChannel: data.user?.preferredChannel || 'EMAIL',
        });
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || 'Impossible de charger le profil.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [setAuthUser, toast]);

  function handleProfileChange(event) {
    const { name, value } = event.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();

    try {
      setIsSavingProfile(true);
      const result = await updateCurrentAuthProfile(profileForm);
      setProfileData({
        user: result.user,
        access: result.access || profileData?.access || null,
      });
      setAuthUser(result.user);
      setProfileForm({
        firstName: result.user?.firstName || '',
        lastName: result.user?.lastName || '',
        email: result.user?.email || '',
        phone: result.user?.phone || '',
        preferredChannel: result.user?.preferredChannel || 'EMAIL',
      });
      toast.success(result.message || 'Profil mis a jour avec succes.');
    } catch (error) {
      toast.error(error.message || 'Mise a jour du profil impossible.');
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('La confirmation du mot de passe ne correspond pas.');
      return;
    }

    try {
      setIsSavingPassword(true);
      const result = await changeCurrentPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm(INITIAL_PASSWORD_FORM);
      toast.success(result.message || 'Mot de passe modifie avec succes.');
    } catch (error) {
      toast.error(error.message || 'Modification du mot de passe impossible.');
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function handleAvatarSelect(file) {
    if (!file) {
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const result = await uploadCurrentAuthAvatar(file);
      setProfileData((prev) => ({
        ...prev,
        user: result.user,
        access: result.access || prev?.access || null,
      }));
      setAuthUser(result.user);
      setAvatarPreviewOverride('');
      toast.success(result.message || 'Photo de profil mise a jour avec succes.');
    } catch (error) {
      setAvatarPreviewOverride('');
      toast.error(error.message || 'Televersement de la photo impossible.');
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  return (
    <div className="space-y-4">
      <Breadcrumbs
        items={[
          { label: 'Tableau de bord', href: '/' },
          { label: 'Profil' },
        ]}
      />

      <Card
        title="Mon profil"
        subtitle="Consultez votre compte, mettez a jour vos informations personnelles et securisez votre acces."
      >
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-border bg-background p-4 md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Utilisateur</p>
            <div className="mt-3 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-surface text-sm font-semibold text-text">
                {displayedAvatarUrl ? (
                  <img src={displayedAvatarUrl} alt={fullName} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div>
                <p className="text-lg font-semibold text-text">{fullName}</p>
                <p className="mt-1 text-sm text-muted">{profileData?.user?.email || authUser?.email || '-'}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Role</p>
            <p className="mt-2 text-lg font-semibold text-text">
              {profileData?.access?.role?.name || authUser?.access?.role?.name || authUser?.role || '-'}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Statut</p>
            <div className="mt-2">
              <StatusBadge
                status={profileData?.user?.status || authUser?.status}
                label={getStatusLabel(profileData?.user?.status || authUser?.status)}
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card
          title="Informations personnelles"
          subtitle="Ces informations seront utilisees pour votre compte et les communications systeme."
        >
          <form className="space-y-4" onSubmit={handleProfileSubmit}>
              <ImageDropzone
                label="Photo de profil"
                helper={isUploadingAvatar
                  ? 'Televersement en cours...'
                  : 'Glissez-deposez une image ou cliquez pour changer votre photo.'}
                value={displayedAvatarUrl}
                initials={initials}
                maxSizeMb={2}
                disabled={isLoading || isUploadingAvatar}
                onFileSelect={(file, previewUrl) => {
                  setAvatarPreviewOverride(previewUrl || '');
                  handleAvatarSelect(file);
                }}
                onClear={() => {
                  setAvatarPreviewOverride('');
                }}
                onError={(message) => {
                  toast.error(message || 'Image invalide.');
                }}
            />

            <div className="grid gap-3 md:grid-cols-2">
              <Input
                id="profile-first-name"
                name="firstName"
                label="Prenom"
                value={profileForm.firstName}
                onChange={handleProfileChange}
                placeholder="Votre prenom"
                required
                leftIcon={UserRound}
                disabled={isLoading || isSavingProfile}
              />
              <Input
                id="profile-last-name"
                name="lastName"
                label="Nom"
                value={profileForm.lastName}
                onChange={handleProfileChange}
                placeholder="Votre nom"
                required
                leftIcon={UserRound}
                disabled={isLoading || isSavingProfile}
              />
              <Input
                id="profile-email"
                name="email"
                label="Email"
                type="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                placeholder="exemple@entreprise.com"
                leftIcon={Mail}
                disabled={isLoading || isSavingProfile}
              />
              <Input
                id="profile-phone"
                name="phone"
                label="Telephone"
                value={profileForm.phone}
                onChange={handleProfileChange}
                placeholder="+243..."
                leftIcon={Phone}
                disabled={isLoading || isSavingProfile}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <DropdownSelect
                id="profile-channel"
                label="Canal prefere"
                value={profileForm.preferredChannel}
                onChange={(nextValue) => handleProfileChange({ target: { name: 'preferredChannel', value: nextValue } })}
                disabled={isLoading || isSavingProfile}
                options={[
                  { value: 'EMAIL', label: 'Email' },
                  { value: 'SMS', label: 'SMS' },
                ]}
              />

              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Derniere connexion</p>
                <p className="mt-2 text-sm font-medium text-text">
                  {formatDateTime(profileData?.user?.lastLoginAt || authUser?.lastLoginAt)}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading || isSavingProfile}>
                {isSavingProfile ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <Card
            title="Compte et securite"
            subtitle="Certaines informations sont informatives et aident a verifier votre configuration actuelle."
          >
            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-primary" />
                  <p className="text-sm font-semibold text-text">Tenant</p>
                </div>
                <p className="mt-2 text-sm text-muted">
                  {profileData?.user?.tenant?.name || authUser?.tenant?.name || 'Tenant principal'}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-primary" />
                  <p className="text-sm font-semibold text-text">Modules actifs</p>
                </div>
                <p className="mt-2 text-sm text-muted">
                  {(profileData?.access?.modules || authUser?.access?.modules || []).join(', ') || 'Aucun module explicite'}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center gap-2">
                  <AtSign size={16} className="text-primary" />
                  <p className="text-sm font-semibold text-text">Autorisations</p>
                </div>
                <p className="mt-2 text-sm text-muted">
                  {(profileData?.access?.permissions || authUser?.access?.permissions || []).length} permission(s) effective(s)
                </p>
              </div>
            </div>
          </Card>

          <Card
            title="Changer le mot de passe"
            subtitle="Utilisez un mot de passe fort avec lettres, chiffres et caracteres speciaux."
          >
            <form className="space-y-4" onSubmit={handlePasswordSubmit}>
              <Input
                id="current-password"
                name="currentPassword"
                type="password"
                label="Mot de passe actuel"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                leftIcon={LockKeyhole}
                required
                disabled={isSavingPassword}
              />
              <Input
                id="new-password"
                name="newPassword"
                type="password"
                label="Nouveau mot de passe"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                leftIcon={LockKeyhole}
                required
                disabled={isSavingPassword}
              />
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                label="Confirmer le nouveau mot de passe"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                leftIcon={LockKeyhole}
                required
                disabled={isSavingPassword}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isSavingPassword}>
                  {isSavingPassword ? 'Mise a jour...' : 'Mettre a jour le mot de passe'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Profile;
