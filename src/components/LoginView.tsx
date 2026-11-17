import React, { useState } from 'react';
import { ShieldCheck, User, Lock, Building2, KeyRound, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { loginUser } from '../services/api';
import { UserSession } from '../types/finance';

interface LoginViewProps {
  onLoginSuccess: (user: UserSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await loginUser(username.trim(), password.trim());
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMsg(res.message || 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Emblem & Header Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Top Banner with Municipality Seal Styling */}
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 px-8 py-7 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

            <div className="relative z-10 flex flex-col items-center">
              {/* Municipality Emblem Icon */}
              <div className="w-20 h-20 bg-amber-500/20 border-2 border-amber-400/80 rounded-full flex items-center justify-center mb-3 shadow-inner">
                <Building2 className="w-11 h-11 text-amber-300" />
              </div>

              <h1 className="text-xl sm:text-2xl font-bold tracking-tight font-['Prompt'] text-amber-200">
                เทศบาลเมืองมหาสารคาม
              </h1>
              <p className="text-sm sm:text-base text-blue-100 font-medium mt-1">
                ฝ่ายการเงินและบัญชี และฝ่ายบริหารงานคลัง กองคลัง
              </p>
              <div className="inline-block mt-2 px-3 py-1 bg-amber-500/20 border border-amber-400/40 rounded-full text-xs font-semibold text-amber-300">
                ระบบรายงานผลการดำเนินงาน ประจำปีงบประมาณ พ.ศ. 2570
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-slate-800 font-['Prompt']">
                เข้าสู่ระบบเพื่อปฏิบัติงาน
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                กรุณาระบุชื่อผู้ใช้งานและรหัสผ่านตามสิทธิ์ที่ได้รับมอบหมาย
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ชื่อผู้ใช้งาน (Username)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ระบุชื่อผู้ใช้งาน"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  รหัสผ่าน (Password)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="รหัสผ่าน 4 หลัก"
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                    title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-slate-600" />
                    ) : (
                      <Eye className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>เข้าสู่ระบบ (Sign In)</span>
                  </>
                )}
              </button>
            </form>

            {/* Note regarding multi-device sync */}
            <div className="mt-8 pt-5 border-t border-slate-200 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>ระบบจัดเก็บและซิงค์ฐานข้อมูลกลางอัตโนมัติ กองคลัง เทศบาลเมืองมหาสารคาม</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
