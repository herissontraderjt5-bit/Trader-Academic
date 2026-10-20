import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Mail,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  LogOut,
  Sparkles,
  X,
  Bot,
  Key,
} from "lucide-react";
import { AccessSession } from "../types";
import { soundManager } from "../utils/soundEffects";
import { verifyClientAccess } from "../services/clientStorage";
import confetti from "canvas-confetti";

interface AccessGateModalProps {
  isOpen: boolean;
  currentSession: AccessSession | null;
  onAccessGranted: (session: AccessSession) => void;
  onLogout: () => void;
  canClose?: boolean;
  onClose?: () => void;
  onOpenAdmin?: () => void;
}

const HIOVE_REGISTER_URL = "https://hiove.io/gSBstV";
const WHATSAPP_PHONE = "+55 69 9980-2629";
const WHATSAPP_URL = "https://wa.me/556999802629?text=Ol%C3%A1%21%20Preciso%20de%20suporte%20para%20ativar%20meu%20acesso%20no%20CandleX%20AI%20Hiove.";

export const AccessGateModal: React.FC<AccessGateModalProps> = ({
  isOpen,
  currentSession,
  onAccessGranted,
  onLogout,
  canClose = false,
  onClose,
  onOpenAdmin,
}) => {
  const [email, setEmail] = useState<string>(currentSession?.email || "");
  const [loading, setLoading] = useState<boolean>(false);
  const [logoClicks, setLogoClicks] = useState<number>(0);
  const [resultState, setResultState] = useState<"IDLE" | "SUCCESS" | "DENIED" | "ERROR">("IDLE");
  const [message, setMessage] = useState<string>("");

  if (!isOpen) return null;

  const handleValidate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setResultState("ERROR");
      setMessage("Por favor, digite um e-mail válido para validação.");
      soundManager.playLossChime();
      return;
    }

    setLoading(true);
    setResultState("IDLE");
    setMessage("");

    try {
      const data = await verifyClientAccess(cleanEmail);

      if (data.access === true) {
        setResultState("SUCCESS");
        setMessage("Acesso VIP Liberado com Sucesso! Inicializando Terminal CandleX AI...");
        soundManager.playGoalReached();
        try {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.55 },
          });
        } catch {}

        const newSession: AccessSession = {
          email: cleanEmail,
          isAuthorized: true,
          isAdmin: Boolean(data.isAdmin),
          expiresAt: data.expiresAt !== undefined ? data.expiresAt : null,
          validatedAt: Date.now(),
        };

        if (data.isAdmin) {
          localStorage.setItem("candlex_admin_authenticated", "true");
        }

        localStorage.setItem("candlex_access_session", JSON.stringify(newSession));

        if (data.isAdmin) {
          setMessage("Identificado Administrador Master! Entrando direto no Painel Administrativo...");
          setTimeout(() => {
            onAccessGranted(newSession);
            if (onClose) onClose();
            if (onOpenAdmin) onOpenAdmin();
          }, 800);
        } else {
          setMessage("Acesso VIP Liberado com Sucesso! Inicializando Terminal CandleX AI...");
          setTimeout(() => {
            onAccessGranted(newSession);
            if (onClose) onClose();
          }, 1200);
        }
      } else {
        setResultState("DENIED");
        setMessage(
          data.message ||
            "Seu e-mail não foi localizado com cadastro ativo através do nosso link de indicação ou ainda não possui o primeiro depósito concluído na corretora Hiove."
        );
        soundManager.playLossChime();
      }
    } catch (err: any) {
      console.error("Erro ao validar acesso:", err);
      setResultState("ERROR");
      setMessage("Erro de conexão com os servidores de autenticação da Hiove. Tente novamente em instantes.");
      soundManager.playLossChime();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05070B]/90 backdrop-blur-xl p-3 sm:p-5 select-none animate-in fade-in duration-300 overflow-y-auto">
      {/* Background Cyber Glow & Holographic Chart Overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-[#FF7A00]/15 via-transparent to-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(#1E2638_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-lg bg-[#090C12]/95 border border-[#1E2638] rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col my-auto transition-all">
        {/* Top Glowing Laser Border */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#FF7A00] via-emerald-400 to-[#FF8C00] shadow-[0_0_15px_rgba(255,122,0,0.6)]" />

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#182030] bg-[#0E131F]/60 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {/* Holographic AI Icon */}
            <div className="relative group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1A2333] to-[#0A0E17] border border-[#FF7A00]/50 flex items-center justify-center shadow-[0_0_20px_rgba(255,122,0,0.25)]">
                <Bot className="w-6 h-6 text-[#FF7A00]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#090C12] flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-slate-950 font-black" />
              </div>
            </div>

            <div>
              <h1
                onClick={() => {
                  const next = logoClicks + 1;
                  setLogoClicks(next);
                  if (next >= 3) {
                    setLogoClicks(0);
                    if (onOpenAdmin) onOpenAdmin();
                  }
                }}
                className="text-xl sm:text-2xl font-black text-white tracking-wider flex items-center gap-2 font-sans cursor-pointer select-none"
                title="CandleX AI Pro"
              >
                <span>CANDLEX</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF8C00] to-amber-300">
                  AI PRO
                </span>
              </h1>
            </div>
          </div>

          {canClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-white transition-colors cursor-pointer border border-[#1E2638]"
              title="Fechar Janela"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 space-y-6">
          {/* Active Session Badge (if user is authenticated) */}
          {currentSession?.isAuthorized && resultState === "IDLE" ? (
            <div className="bg-[#0D121D] border border-emerald-500/40 rounded-2xl p-5 space-y-4 shadow-lg shadow-emerald-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Sessão VIP Hiove Ativa</h3>
                    <p className="text-xs text-slate-400">Terminal CandleX AI liberado e operacional</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30 font-bold">
                  AUTORIZADO
                </span>
              </div>

              <div className="p-3 bg-[#070A0F] rounded-xl border border-[#182030] flex items-center justify-between text-xs">
                <span className="text-slate-400">E-mail Vinculado:</span>
                <span className="font-mono text-emerald-300 font-bold">{currentSession.email}</span>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                {currentSession.isAdmin && onOpenAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onClose) onClose();
                      onOpenAdmin();
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-[#FF7A00] hover:from-amber-400 hover:to-[#FF8C00] text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                  >
                    <Key className="w-3.5 h-3.5 text-slate-950" />
                    Acessar Painel ADM
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleValidate()}
                  disabled={loading}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#141A26] hover:bg-[#1E2638] text-xs font-bold text-slate-200 transition-colors flex items-center justify-center gap-2 border border-[#1E2638] cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  Revalidar Status
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="py-2.5 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  title="Sair do CandleX IA e voltar ao login"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sair CandleX IA
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Requirements & Rule Box */}
              <div className="bg-[#0B0F17] border border-[#1A2336] rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#FF7A00]" />
                  <span className="text-xs font-bold text-slate-200">
                    Requisitos de Acesso Exclusivo:
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                  <div className="flex items-start gap-2 bg-[#0E131F]/80 p-2.5 rounded-xl border border-[#182030]">
                    <span className="w-5 h-5 rounded-full bg-[#FF7A00]/20 text-[#FF7A00] font-black flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Cadastro realizado pelo nosso <strong className="text-white">link oficial</strong> na corretora Hiove.
                    </span>
                  </div>
                  <div className="flex items-start gap-2 bg-[#0E131F]/80 p-2.5 rounded-xl border border-[#182030]">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Ter realizado pelo menos o <strong className="text-emerald-400">primeiro depósito</strong> para ativar a conta.
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Input for Email */}
              <form onSubmit={handleValidate} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#FF7A00]" />
                      Digite seu e-mail cadastrado na corretora Hiove
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">validação instantânea</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="seu.email@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full bg-[#070A0F] border border-[#1E2638] focus:border-[#FF7A00] rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none transition-all shadow-inner font-mono text-center sm:text-left focus:ring-1 focus:ring-[#FF7A00]/40"
                    />
                  </div>
                </div>

                {/* Big Unlock Button */}
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className={`w-full py-4 px-5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 ${
                    email.trim().toLowerCase() === "herisson.trader.jt5@gmail.com"
                      ? "bg-gradient-to-r from-amber-500 via-[#FF9500] to-[#FF7A00] hover:from-amber-400 hover:to-[#FFA022] text-slate-950 shadow-[0_0_35px_rgba(255,149,0,0.55)] border border-amber-300/40"
                      : "bg-gradient-to-r from-[#FF8C00] via-[#FF7A00] to-[#E65100] hover:from-[#FFA022] hover:to-[#FF6D00] text-slate-950 shadow-[0_0_30px_rgba(255,122,0,0.4)]"
                  }`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>
                        {email.trim().toLowerCase() === "herisson.trader.jt5@gmail.com"
                          ? "AUTENTICANDO ADMINISTRADOR MASTER..."
                          : "CONSULTANDO REGISTRO NA HIOVE API..."}
                      </span>
                    </>
                  ) : email.trim().toLowerCase() === "herisson.trader.jt5@gmail.com" ? (
                    <>
                      <Key className="w-4 h-4 text-slate-950" />
                      <span>ENTRAR DIRETO NO PAINEL ADM</span>
                      <ArrowRight className="w-4 h-4 text-slate-950" />
                    </>
                  ) : (
                    <>
                      <span>VERIFICAR ACESSO & ENTRAR NO TERMINAL</span>
                      <ArrowRight className="w-4 h-4 text-slate-950" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Feedback: SUCCESS */}
          {resultState === "SUCCESS" && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3.5 animate-in fade-in">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <strong className="block text-white font-bold text-sm">{message}</strong>
                <span className="text-emerald-200/80">
                  Carregando gráficos de alta precisão e radar de confluências...
                </span>
              </div>
            </div>
          )}

          {/* Feedback: DENIED */}
          {resultState === "DENIED" && (
            <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/10 border border-rose-500/35 text-rose-300 text-xs space-y-4 animate-in fade-in">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                </div>
                <div className="space-y-1">
                  <strong className="block text-white font-bold text-sm">
                    Acesso Não Liberado para este E-mail
                  </strong>
                  <p className="text-slate-300 text-[11.5px] leading-relaxed">{message}</p>
                </div>
              </div>

              {/* Direct Action Guide on Denied */}
              <div className="bg-[#070A0F] p-4 rounded-xl border border-rose-500/20 space-y-2.5">
                <span className="text-[11px] font-bold text-slate-200 block">
                  Como ter seu acesso liberado imediatamente:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => window.open(HIOVE_REGISTER_URL, "_blank")}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#FF8C00] to-[#FF7A00] hover:from-[#FFA022] hover:to-[#FF6D00] text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-[#FF7A00]/20 transition-all"
                  >
                    <span>1. Criar Conta na Hiove</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleValidate()}
                    className="py-2.5 px-3 rounded-xl bg-[#141A26] hover:bg-[#1E2638] border border-[#1E2638] text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                    <span>2. Já Depositei, Tentar Novamente</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Feedback: ERROR */}
          {resultState === "ERROR" && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* DUAL ACTION BUTTONS: CADASTRO NA CORRETORA + WHATSAPP SUPORTE */}
          <div className="pt-2 border-t border-[#182030] space-y-3">
            <div className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-wider">
              Ainda não tem conta ou precisa de suporte?
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Botão de Cadastro na Corretora Hiove */}
              <button
                type="button"
                onClick={() => window.open(HIOVE_REGISTER_URL, "_blank")}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-[#141A26] to-[#182233] hover:from-[#1C2538] hover:to-[#223048] border border-[#FF7A00]/50 hover:border-[#FF7A00] text-white font-black text-xs flex items-center justify-between gap-2 transition-all cursor-pointer shadow-sm group"
                title="Cadastrar-se na corretora oficial Hiove"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-8 h-8 rounded-lg bg-[#FF7A00]/20 flex items-center justify-center text-[#FF7A00] font-black group-hover:scale-105 transition-transform">
                    H
                  </div>
                  <div>
                    <div className="text-white text-xs font-black">CADASTRAR NA HIOVE</div>
                    <div className="text-[9.5px] text-[#FF8C00] font-mono">Link Oficial VIP</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-[#FF7A00]" />
              </button>

              {/* Botão Oficial WhatsApp Suporte VIP */}
              <button
                type="button"
                onClick={() => window.open(WHATSAPP_URL, "_blank")}
                className="py-3 px-4 rounded-xl bg-[#0F1C16] hover:bg-[#14261E] border border-emerald-500/40 hover:border-emerald-400 text-white font-black text-xs flex items-center justify-between gap-2 transition-all cursor-pointer shadow-sm group"
                title={`Falar com Suporte VIP WhatsApp: ${WHATSAPP_PHONE}`}
              >
                <div className="flex items-center gap-2.5 text-left">
                  {/* WhatsApp SVG Icon */}
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <svg
                      className="w-5 h-5 fill-emerald-400"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 18.06c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31c-.82-1.31-1.26-2.83-1.26-4.38 0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c.02 4.54-3.68 8.23-8.22 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.09-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.07-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.55c.12.17 1.73 2.65 4.2 3.71.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.12-.23-.19-.48-.31z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-emerald-400 text-xs font-black">SUPORTE VIP WHATSAPP</div>
                    <div className="text-[9.5px] text-slate-400 font-mono">{WHATSAPP_PHONE}</div>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </button>
            </div>
          </div>

          {/* Footer note & Hidden Admin Button */}
          <div className="pt-1 flex items-center justify-between text-[10.5px] text-slate-500">
            <div className="flex items-center gap-1.5 mx-auto pl-6">
              <Lock className="w-3 h-3 text-slate-500" />
              <span>Validação oficial em tempo real via Hiove Access API • Conexão Criptografada SSL</span>
            </div>

            {/* Botão Oculto / Discreto para Painel Admin */}
            <button
              type="button"
              onClick={onOpenAdmin}
              className="opacity-15 hover:opacity-100 transition-opacity p-1 text-slate-500 hover:text-[#FF7A00] cursor-pointer"
              title="Acesso Administrativo Master"
            >
              <Key className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
