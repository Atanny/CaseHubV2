import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AuthCard from '../components/AuthCard';
import AuthAlert from '../components/AuthAlert';
import FormField from '../components/FormField';
import PasswordField from '../components/PasswordField';
import Checkbox from '../components/Checkbox';
import Divider from '../components/Divider';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { authService } from '../services/authService';
import { ROUTES } from '../constants/routes';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit() {
    if (!form.email || !form.password) {
      setError('Please fill all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.signIn(form);
      router.push(ROUTES.dashboard);
    } catch (e) {
      setError(e.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard>
      {error && <AuthAlert tone="error">{error}</AuthAlert>}

      <div className="flex flex-col gap-2.5 items-start w-full">
        <FormField
          label="Email Address"
          type="email"
          placeholder="john.doe@gmail.com"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          disabled={loading}
        />
        <PasswordField
          label="Password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          disabled={loading}
        />
        <Checkbox checked={remember} onChange={() => setRemember((r) => !r)} label="Remember Me" />
      </div>

      <Divider className="!bg-ch-background h-[2px]" />

      <Button
        variant="primary"
        className="w-full"
        icon={<Icon name="login" size={20} color="#fff" />}
        onClick={submit}
        disabled={loading}
      >
        {loading ? 'Signing in…' : 'Login'}
      </Button>

      <p className="font-body text-body text-ch-main capitalize text-center">
        Forget Password?{' '}
        <a href="#" className="text-[#4760FF] underline">
          Reset your Password Now
        </a>
      </p>
      <p className="font-body text-body text-ch-main capitalize text-center">
        Dont have an Account yet?{' '}
        <Link href={ROUTES.signup} className="text-[#4760FF] underline">
          Sign up Now
        </Link>
      </p>
    </AuthCard>
  );
}
