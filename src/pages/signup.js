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

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState(null); // { message }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit() {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError('Please fill all fields');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (!agreed) {
      setError('Please agree to the terms and conditions');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const name = `${form.firstName} ${form.lastName}`.trim();
      const result = await authService.signUp({ name, email: form.email, password: form.password });
      if (result.needsConfirmation) {
        setConfirmation({ message: result.message });
        return;
      }
      router.push(ROUTES.dashboard);
    } catch (e) {
      setError(e.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  if (confirmation) {
    return (
      <AuthCard width={552}>
        <AuthAlert tone="success">
          ✅ Account created!
          <br />
          <span className="opacity-80 text-[11px]">{confirmation.message}</span>
        </AuthAlert>
        <Link href={ROUTES.login} className="text-[#4760FF] underline font-body text-body">
          ← Back to Sign In
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard width={552}>
      {error && <AuthAlert tone="error">{error}</AuthAlert>}

      <div className="flex flex-col gap-2.5 items-start w-full">
        <div className="flex gap-2.5 items-start w-full">
          <FormField
            label="First Name"
            placeholder="John"
            value={form.firstName}
            onChange={(e) => update('firstName', e.target.value)}
            disabled={loading}
          />
          <FormField
            label="Last Name"
            placeholder="Doe"
            value={form.lastName}
            onChange={(e) => update('lastName', e.target.value)}
            disabled={loading}
          />
        </div>
        <FormField
          label="Email Address"
          type="email"
          placeholder="john.doe@gmail.com"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          disabled={loading}
        />
        <div className="flex gap-2.5 items-start w-full">
          <FormField
            label="Password"
            type="password"
            placeholder="Min. 6 characters"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            disabled={loading}
          />
          <PasswordField
            label="Confirm Password"
            placeholder="••••••••"
            value={form.confirm}
            onChange={(e) => update('confirm', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            disabled={loading}
          />
        </div>
        <Checkbox
          checked={agreed}
          onChange={() => setAgreed((a) => !a)}
          label="By Checking this, you are agreeing with our terms and conditions."
        />
      </div>

      <Divider className="!bg-ch-background h-[2px]" />

      <Button
        variant="primary"
        className="w-full"
        icon={<Icon name="login" size={20} color="#fff" />}
        onClick={submit}
        disabled={loading}
      >
        {loading ? 'Creating account…' : 'Sign Up Now'}
      </Button>

      <p className="font-body text-body text-ch-main capitalize text-center">
        Already have an Account?{' '}
        <Link href={ROUTES.login} className="text-[#4760FF] underline">
          Log in Now
        </Link>
      </p>
    </AuthCard>
  );
}
