import React, { useState } from 'react';
import { login } from '../lib/auth';
import { supabase } from '../lib/db';

export default function Admin(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState('');
  const [targetId, setTargetId] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage('Signing in...');
    const resp = await login(email, password);
    if (!resp.ok) { setMessage(resp.error || 'Login failed'); return; }

    // Verify is_admin flag for current user
    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id;
    if (!userId) { setMessage('No auth user'); return; }

    const { data: profile, error } = await supabase.from('profiles').select('is_admin,username').eq('id', userId).limit(1).single();
    if (error) { setMessage(error.message); return; }
    if (profile?.is_admin) {
      setIsAdmin(true);
      setMessage(`Welcome admin ${profile.username}`);
    } else {
      setMessage('User is not an admin');
    }
  }

  async function deletePlate() {
    if (!targetId) { setMessage('Provide an id'); return; }
    setMessage('Deleting...');
    const { error } = await supabase.from('plates').delete().eq('id', targetId);
    if (error) setMessage(error.message);
    else setMessage('Deleted');
  }

  async function deletePost() {
    if (!targetId) { setMessage('Provide an id'); return; }
    setMessage('Deleting...');
    const { error } = await supabase.from('posts').delete().eq('id', targetId);
    if (error) setMessage(error.message);
    else setMessage('Deleted');
  }

  if (!isAdmin) {
    return (
      <div className="p-4 max-w-sm">
        <h2 className="text-xl font-semibold mb-2">Admin sign-in</h2>
        <form onSubmit={handleLogin}>
          <label className="block mb-2">Email
            <input className="block w-full mt-1 p-2 border rounded" value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <label className="block mb-2">Password
            <input type="password" className="block w-full mt-1 p-2 border rounded" value={password} onChange={e => setPassword(e.target.value)} />
          </label>
          <button className="px-3 py-2 bg-blue-600 text-white rounded" type="submit">Sign in</button>
        </form>
        <p className="mt-2 text-sm">{message}</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md">
      <h2 className="text-xl font-semibold mb-2">Admin Panel</h2>
      <p className="mb-3">Authenticated as admin. Enter an ID to delete a plate or post.</p>
      <label className="block mb-2">Target ID
        <input className="block w-full mt-1 p-2 border rounded" value={targetId} onChange={e => setTargetId(e.target.value)} />
      </label>
      <div className="flex gap-2">
        <button className="px-3 py-2 bg-red-600 text-white rounded" onClick={deletePlate}>Delete Plate</button>
        <button className="px-3 py-2 bg-red-600 text-white rounded" onClick={deletePost}>Delete Post</button>
      </div>
      <p className="mt-2">{message}</p>
    </div>
  );
}
