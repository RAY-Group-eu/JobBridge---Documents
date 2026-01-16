import { useState, useEffect } from 'react';

// Hardcoded hash for "secret123"
// Generated via: crypto.subtle.digest('SHA-256', new TextEncoder().encode('secret123'))
// Then converted to hex.
// Hash: 2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b

const CORRECT_HASH = "2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b";
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 30 * 1000; // 30 seconds

export const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [attempts, setAttempts] = useState<number>(0);
    const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

    useEffect(() => {
        // Check session logic
        const session = sessionStorage.getItem('auth_token');
        if (session === CORRECT_HASH) {
            setIsAuthenticated(true);
        }

        // Check rate limit logic
        const storedAttempts = localStorage.getItem('auth_attempts');
        if (storedAttempts) setAttempts(parseInt(storedAttempts, 10));

        const storedLockout = localStorage.getItem('auth_lockout');
        if (storedLockout) {
            const remaining = parseInt(storedLockout, 10) - Date.now();
            if (remaining > 0) {
                setLockoutUntil(parseInt(storedLockout, 10));
            } else {
                localStorage.removeItem('auth_lockout');
                localStorage.setItem('auth_attempts', '0');
                setAttempts(0);
            }
        }
    }, []);

    const login = async (password: string): Promise<boolean> => {
        if (lockoutUntil && Date.now() < lockoutUntil) return false;

        // Hash the password
        const msgBuffer = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        if (hashHex === CORRECT_HASH) {
            setIsAuthenticated(true);
            sessionStorage.setItem('auth_token', hashHex);
            setAttempts(0);
            localStorage.setItem('auth_attempts', '0');
            return true;
        } else {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            localStorage.setItem('auth_attempts', newAttempts.toString());

            if (newAttempts >= MAX_ATTEMPTS) {
                const lockTime = Date.now() + LOCKOUT_TIME;
                setLockoutUntil(lockTime);
                localStorage.setItem('auth_lockout', lockTime.toString());
            }
            return false;
        }
    };

    const logout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem('auth_token');
    };

    return { isAuthenticated, login, logout, attempts, lockoutUntil };
};
