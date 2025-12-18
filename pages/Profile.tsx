import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { db } from '../services/mockDb';
import { notifications } from '../services/notificationService';
import { Button } from '../components/Button';

interface ProfileProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
}

// --- Image Cropper Component ---
const ImageCropper: React.FC<{ 
  imageUrl: string; 
  onCrop: (croppedUrl: string) => void; 
  onCancel: () => void; 
}> = ({ imageUrl, onCrop, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const imageRef = useRef<HTMLImageElement>(new Image());
  const [imageLoaded, setImageLoaded] = useState(false);

  const SIZE = 280; 

  useEffect(() => {
    const img = imageRef.current;
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
        setImageLoaded(true);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
    };
    img.onerror = () => {
        alert("Unable to load image.");
        onCancel();
    };
  }, [imageUrl, onCancel]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const img = imageRef.current;
    const scale = Math.max(SIZE / img.width, SIZE / img.height) * zoom;
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const x = centerX - (drawW / 2) + offset.x;
    const y = centerY - (drawH / 2) + offset.y;
    ctx.save();
    ctx.drawImage(img, x, y, drawW, drawH);
    ctx.restore();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.arc(centerX, centerY, SIZE / 2, 0, 2 * Math.PI, true);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX, centerY, SIZE / 2, 0, 2 * Math.PI);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  useEffect(() => {
    requestAnimationFrame(draw);
  }, [zoom, offset, imageLoaded]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setOffset({ x: clientX - dragStart.x, y: clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = SIZE;
    tempCanvas.height = SIZE;
    const tCtx = tempCanvas.getContext('2d');
    if (!tCtx) return;
    const img = imageRef.current;
    const scale = Math.max(SIZE / img.width, SIZE / img.height) * zoom;
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const tx = (SIZE / 2) - (drawW / 2) + offset.x;
    const ty = (SIZE / 2) - (drawH / 2) + offset.y;
    tCtx.beginPath();
    tCtx.arc(SIZE/2, SIZE/2, SIZE/2, 0, Math.PI*2);
    tCtx.closePath();
    tCtx.clip();
    tCtx.drawImage(img, tx, ty, drawW, drawH);
    onCrop(tempCanvas.toDataURL('image/jpeg', 0.9));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 text-center"><h3 className="font-bold">Edit Photo</h3></div>
            <div className="relative bg-slate-900 cursor-move" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp}>
                <canvas ref={canvasRef} width={400} height={400} className="w-full pointer-events-none" />
            </div>
            <div className="p-6 space-y-6">
                <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full" />
                <div className="grid grid-cols-2 gap-3">
                    <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                    <Button onClick={handleSave}>Save</Button>
                </div>
            </div>
        </div>
    </div>
  );
};

// --- Main Profile Component ---
export const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [remindersEnabled, setRemindersEnabled] = useState(() => localStorage.getItem('hs_reminders') === 'true');
  
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);

  // Danger Zone States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmUsername, setConfirmUsername] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const showMessage = (msg: string, isError = false) => {
      if (isError) setError(msg); else setSuccess(msg);
      setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        const updated = await db.updateUser(user.id, { username, email, avatarUrl });
        onUpdateUser(updated);
        showMessage('Profile updated!');
    } catch (err: any) { showMessage(err.message, true); } finally { setIsLoading(false); }
  };

  const handleToggleReminders = async () => {
      if (!remindersEnabled) {
          const granted = await notifications.requestPermission();
          if (!granted) {
              alert("Please allow notifications in your browser settings to enable reminders.");
              return;
          }
      }
      const newState = !remindersEnabled;
      setRemindersEnabled(newState);
      localStorage.setItem('hs_reminders', String(newState));
      showMessage(newState ? "Reminders enabled!" : "Reminders disabled.");
  };

  const handleResetAccount = async () => {
    if (!confirm("Reset all habit data? Your streaks and points will return to zero. This cannot be undone.")) return;
    setIsProcessing(true);
    try {
      await db.resetAccount(user.id);
      window.location.reload();
    } catch (err: any) {
      showMessage(err.message, true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAccountCompletely = async () => {
    setIsProcessing(true);
    try {
      await db.deleteAccountCompletely(user.id);
      window.location.href = '/login';
    } catch (err: any) {
      showMessage(err.message, true);
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20 px-4">
      {success && <div className="fixed top-24 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50">{success}</div>}
      {error && <div className="fixed top-24 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg z-50">{error}</div>}

      <div className="relative">
        <div className="h-48 w-full bg-gradient-to-br from-brand-600 to-indigo-600 rounded-3xl shadow-lg"></div>
        <div className="px-8 flex flex-col md:flex-row items-end -mt-16 gap-6 relative z-10">
            <div className="relative">
                <div className="w-36 h-36 rounded-full border-[6px] border-white dark:border-slate-800 shadow-xl overflow-hidden bg-white">
                    <img src={avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                </div>
                <label className="absolute bottom-1 right-1 bg-brand-600 text-white p-2.5 rounded-full cursor-pointer border-2 border-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const r = new FileReader();
                            r.onload = () => setCropImage(r.result as string);
                            r.readAsDataURL(file);
                        }
                    }} />
                </label>
            </div>
            <div className="flex-1 pb-2">
                <h1 className="text-3xl font-bold dark:text-white">{user.username}</h1>
                <p className="text-slate-500 font-medium">{user.email}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white">👤 Identity</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Username</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full rounded-lg bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-lg bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 dark:text-white" />
                </div>
                <Button type="submit" isLoading={isLoading} className="w-full">Update Details</Button>
            </form>
        </div>

        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white">🔔 Notifications</h2>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-bold dark:text-white">Daily Reminders</div>
                        <div className="text-sm text-slate-500">Get notified about pending habits.</div>
                    </div>
                    <button onClick={handleToggleReminders} className={`w-12 h-7 rounded-full p-1 transition-colors ${remindersEnabled ? 'bg-brand-600' : 'bg-slate-300'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full transform transition-transform ${remindersEnabled ? 'translate-x-5' : ''}`}></div>
                    </button>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">💎 Wellness Points</h2>
                <div className="bg-brand-600 text-white p-6 rounded-2xl text-center">
                    <div className="text-4xl font-black">{user.wellnessPoints}</div>
                    <div className="text-xs font-bold uppercase tracking-widest opacity-80 mt-1">Total Points Earned</div>
                </div>
            </div>
        </div>
      </div>

      {/* --- DANGER ZONE --- */}
      <div className="bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">⚠️ Danger Zone</h2>
          
          <div className="space-y-6">
            {/* RESET SECTION */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-red-100 dark:border-red-900/20 pb-6">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Reset Progress</h3>
                <p className="text-xs text-slate-500">Delete all habits and streaks but keep your login account.</p>
              </div>
              <Button 
                variant="secondary" 
                onClick={handleResetAccount}
                isLoading={isProcessing && !showDeleteConfirm}
                className="bg-white dark:bg-slate-800 text-orange-600 border-orange-200"
              >
                Reset My Data
              </Button>
            </div>

            {/* FULL DELETE SECTION */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Delete Account Permanently</h3>
                <p className="text-xs text-slate-500">Completely remove your profile, social links, and all history.</p>
              </div>
              
              {!showDeleteConfirm ? (
                  <Button 
                    variant="secondary" 
                    className="bg-white dark:bg-slate-800 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                      Delete Forever
                  </Button>
              ) : (
                  <div className="flex flex-col items-end gap-2 animate-fade-in">
                      <span className="text-[10px] font-black text-red-600 animate-pulse tracking-widest uppercase">Type "{user.username}" to confirm</span>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input 
                          type="text" 
                          placeholder={user.username}
                          value={confirmUsername}
                          className="text-sm p-2 rounded-lg bg-white dark:bg-slate-700 border border-red-200 dark:border-red-900/50 dark:text-white"
                          onChange={(e) => setConfirmUsername(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleDeleteAccountCompletely}
                            disabled={confirmUsername !== user.username || isProcessing}
                            className="bg-red-600 text-white border-none"
                            isLoading={isProcessing}
                          >
                              Delete
                          </Button>
                          <Button variant="ghost" onClick={() => {setShowDeleteConfirm(false); setConfirmUsername('');}} disabled={isProcessing}>Cancel</Button>
                        </div>
                      </div>
                  </div>
              )}
            </div>
          </div>
      </div>

      {cropImage && <ImageCropper imageUrl={cropImage} onCrop={(url) => { setAvatarUrl(url); setCropImage(null); }} onCancel={() => setCropImage(null)} />}
    </div>
  );
};