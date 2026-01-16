import { useState, useEffect } from 'react';
import { Lock, AlertCircle, Loader2 } from 'lucide-react';


interface LockScreenProps {
    onLogin: (password: string) => Promise<boolean>;
    attempts: number;
    lockoutUntil: number | null;
}

export default function LockScreen({ onLogin, attempts: _attempts, lockoutUntil }: LockScreenProps) {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number>(0);

    useEffect(() => {
        if (lockoutUntil) {
            const interval = setInterval(() => {
                const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
                setTimeLeft(remaining);
                if (remaining <= 0) window.location.reload();
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [lockoutUntil]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (lockoutUntil) return;
        setLoading(true);
        setError('');

        // Artificial delay for "security" feel
        await new Promise(r => setTimeout(r, 600));

        const isCorrect = await onLogin(password);
        if (!isCorrect) {
            setError('Invalid Access Key');
            setPassword('');
            setLoading(false);
        } else {
            setSuccess(true);
            // Allow success animation to play
            // The parent will unmount this component when onLogin resolves true, 
            // but we might want a slight delay if the parent waits. 
            // However, useAuth usually updates state immediately.
            // For visual flair, we rely on the parent state update.
        }
    };

    return (
        <div className="lock-screen">
            <div className={`glass-panel lock-card ${error ? 'animate-shake' : ''} ${success ? 'animate-fade-out' : ''}`}>
                <div className="lock-icon-wrapper">
                    {success ? (
                        <div className="animate-fade-in" style={{ color: 'var(--success-color)' }}>
                            <Lock size={32} />
                        </div>
                    ) : (
                        <Lock size={32} color="var(--text-primary)" />
                    )}
                </div>

                <h1 className="lock-title">Secure Access</h1>
                <p className="lock-subtitle">
                    Please enter your credentials to decrypt the vault.
                </p>

                {lockoutUntil && timeLeft > 0 ? (
                    <div style={{ color: 'var(--error-color)', padding: '16px', background: 'rgba(255, 59, 48, 0.1)', borderRadius: '12px', marginBottom: '16px' }}>
                        <AlertCircle size={16} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '8px' }} />
                        Authentication Locked. Retry in {timeLeft}s
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={{ position: 'relative', marginBottom: '16px' }}>
                            <input
                                type="password"
                                className="glass-input"
                                placeholder="Access Key"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (error) setError('');
                                }}
                                autoFocus
                                disabled={loading || success}
                            />
                        </div>

                        <button
                            type="submit"
                            className="glass-btn w-full flex-center gap-2"
                            disabled={loading || !password || success}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : (success ? 'Access Granted' : 'Unlock Vault')}
                        </button>
                    </form>
                )}

                {error && !lockoutUntil && (
                    <p style={{ color: 'var(--error-color)', marginTop: '16px', fontSize: '14px' }} className="flex-center gap-2 animate-fade-in">
                        <AlertCircle size={14} /> {error}
                    </p>
                )}

                <div className="lock-footer">
                    Secured by SHA-256 Encryption
                </div>
            </div>
        </div>
    );
}
